/**
 * AI Ad Copy Generator API
 *
 * POST — Generate ad copy using AI (OpenAI primary, Anthropic fallback)
 *        Also supports policy compliance checking mode.
 *
 * Body:
 *   mode: "generate" | "policy-check"
 *   campaignType: "search" | "display" | "shopping" | "pmax" | "video"
 *   productDescription: string
 *   targetAudience?: string
 *   tone?: string
 *   keywords?: string[]
 *   businessName?: string
 *   businessIndustry?: string
 *   businessWebsite?: string
 *   locale?: string
 *   adCopy?: string  (for policy-check mode)
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionDual } from "@/lib/session";
import { apiLimiter, checkRateLimit } from "@/lib/rate-limit";
import { checkCSRF } from "@/lib/csrf";
import { prisma } from "@/lib/db";
import { isAtMessageLimit, PLANS } from "@/lib/plans";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

interface GenerateRequest {
    mode?: "generate" | "policy-check";
    campaignType?: string;
    productDescription?: string;
    targetAudience?: string;
    tone?: string;
    keywords?: string[];
    businessName?: string;
    businessIndustry?: string;
    businessWebsite?: string;
    businessLocation?: string;
    locale?: string;
    adCopy?: string;
    numberOfVariations?: number;
}

const GENERATE_PROMPT = `You are an expert Google Ads copywriter. Generate high-quality, Google Ads policy-compliant ad copy based on the user's input.

RULES:
- Headlines: max 30 characters each. Provide 15 unique headlines.
- Descriptions: max 90 characters each. Provide 4 unique descriptions.
- Include keyword variations, benefits, CTAs, social proof, and urgency (policy-compliant).
- NO ALL CAPS. Use title case or sentence case.
- NO excessive punctuation (!!!, ???).
- NO misleading claims or fake urgency.
- NO phone numbers in ad text (use extensions).
- Every headline and description must be unique — no near-duplicates.

You MUST respond with ONLY a valid JSON object (no markdown, no code fences, no explanation) in this exact structure:
{
  "headlines": ["Headline 1", "Headline 2", ...],
  "descriptions": ["Description 1", "Description 2", ...],
  "keywords": ["keyword 1", "keyword 2", ...],
  "negativeKeywords": ["negative 1", "negative 2", ...],
  "sitelinks": [{"title": "Link Title", "description": "Link description"}],
  "callouts": ["Callout 1", "Callout 2", ...],
  "structuredSnippets": [{"header": "Types", "values": ["Value 1", "Value 2"]}],
  "notes": "Brief strategy notes about the ad approach"
}`;

// Format-specific prompts for each campaign type
const FORMAT_PROMPTS: Record<string, string> = {
    search: GENERATE_PROMPT,

    rsa: `You are an expert Google Ads RSA (Responsive Search Ad) specialist. Generate a full RSA asset set that Google can mix-and-match for maximum performance.

RULES:
- Provide exactly 15 unique headlines (max 30 chars each). Vary CTAs, benefits, features, brand name, location.
- Provide exactly 4 unique descriptions (max 90 chars each). Mix benefits, urgency, social proof, features.
- Pin suggestions: indicate which headlines work best in position 1, 2, or 3.
- Include keyword insertion suggestions where appropriate: {KeyWord:Default Text}
- Every asset must be self-contained (make sense independently).
- NO ALL CAPS, no excessive punctuation, no misleading claims.

Respond with ONLY valid JSON:
{
  "headlines": ["H1", "H2", ... up to 15],
  "descriptions": ["D1", "D2", "D3", "D4"],
  "pinSuggestions": {"headline1": [0,1], "headline2": [2], "description1": [0]},
  "keywordInsertions": ["Headline with {KeyWord:Default}"],
  "keywords": ["keyword1", "keyword2"],
  "negativeKeywords": ["neg1"],
  "sitelinks": [{"title": "Title", "description": "Desc"}],
  "callouts": ["Callout1"],
  "structuredSnippets": [{"header": "Types", "values": ["V1","V2"]}],
  "notes": "Strategy notes including pin rationale and asset diversity approach"
}`,

    shopping: `You are a Google Merchant Center & Shopping Ads optimization expert. Generate optimized product listing content.

RULES:
- Product Title: max 150 chars, front-load important keywords. Include brand, product type, key attributes (color, size, material).
- Product Description: max 5000 chars, detailed, keyword-rich, highlight benefits and features.
- Generate 5 title variations (A/B test suggestions).
- Provide optimized product attributes: brand, color, material, size, GTIN suggestion format, product category path.
- Include custom labels for campaign segmentation.
- Suggest negative keywords for Shopping campaigns.

Respond with ONLY valid JSON:
{
  "productTitles": ["Title Variation 1", "Title Variation 2", ...],
  "productDescription": "Full optimized product description...",
  "attributes": {"brand":"","color":"","material":"","size":"","condition":"new","productCategory":""},
  "customLabels": {"label0":"price_range","label1":"margin","label2":"bestseller"},
  "keywords": ["relevant search terms"],
  "negativeKeywords": ["irrelevant terms"],
  "pricingSuggestions": "Competitive pricing notes",
  "notes": "Shopping campaign optimization strategy"
}`,

    display: `You are a Google Display Ads creative expert. Generate responsive display ad content optimized for the Google Display Network.

RULES:
- Short Headlines: 5 variations, max 30 chars each (punchy, attention-grabbing).
- Long Headline: 1, max 90 chars (more descriptive).
- Descriptions: 5 variations, max 90 chars each.
- Business Name: max 25 chars.
- CTA suggestions from Google's approved list.
- Image dimension recommendations for all required sizes.
- Color scheme and visual direction suggestions.

Respond with ONLY valid JSON:
{
  "shortHeadlines": ["H1","H2","H3","H4","H5"],
  "longHeadline": "Longer descriptive headline here",
  "descriptions": ["D1","D2","D3","D4","D5"],
  "businessName": "Business Name",
  "ctaSuggestion": "Shop Now",
  "imageSuggestions": [
    {"size":"1200x628","label":"Landscape","notes":"Main hero image"},
    {"size":"1200x1200","label":"Square","notes":"Product focused"},
    {"size":"300x250","label":"Medium Rectangle","notes":"Banner ad"},
    {"size":"728x90","label":"Leaderboard","notes":"Top banner"},
    {"size":"160x600","label":"Wide Skyscraper","notes":"Sidebar"}
  ],
  "colorScheme": {"primary":"#hex","secondary":"#hex","accent":"#hex"},
  "visualDirection": "Description of visual style and imagery approach",
  "keywords": ["targeting keywords"],
  "notes": "Display campaign strategy notes"
}`,

    pmax: `You are a Google Performance Max campaign expert. Generate a complete asset group for a PMax campaign.

RULES:
- Headlines: 15 unique, max 30 chars (used across Search, Display, YouTube, Discover, Gmail, Maps).
- Long Headlines: 5, max 90 chars.
- Descriptions: 5 unique, max 90 chars. Plus 1 short description max 60 chars.
- Business Name: max 25 chars.
- CTA: from Google's approved list.
- Audience Signals: suggest custom segments, interests, demographics, and life events.
- Image asset specs for all required dimensions.
- Video asset suggestions (themes, hooks, CTAs).
- Final URL expansion suggestions.

Respond with ONLY valid JSON:
{
  "headlines": ["H1",...up to 15],
  "longHeadlines": ["LH1",...up to 5],
  "descriptions": ["D1",...up to 5],
  "shortDescription": "Short 60-char desc",
  "businessName": "Name",
  "ctaSuggestion": "Shop Now",
  "audienceSignals": {
    "customSegments": ["search term interest 1"],
    "interests": ["Affinity: Category"],
    "demographics": {"age":"25-54","gender":"All","income":"Top 50%"},
    "lifeEvents": ["Recently moved","Getting married"]
  },
  "imageSuggestions": [
    {"size":"1200x628","label":"Landscape"},
    {"size":"1200x1200","label":"Square"},
    {"size":"960x1200","label":"Portrait"}
  ],
  "videoSuggestions": [
    {"duration":"15s","hook":"Opening hook idea","body":"Key message","cta":"End CTA"}
  ],
  "urlExpansion": {"finalUrl":"","excludedUrls":[]},
  "keywords": ["target terms"],
  "notes": "PMax strategy: asset group theme, audience targeting rationale"
}`,

    video: `You are a YouTube/Google Video Ads scriptwriting expert. Generate video ad scripts and assets.

RULES:
- Generate scripts for 3 ad formats: 6-second bumper, 15-second non-skippable, 30-second skippable.
- Each script: hook (first 5 seconds), body, CTA, on-screen text overlays.
- Companion banner text (headlines + descriptions for display alongside video).
- Thumbnail suggestions with text overlay ideas.
- CTA overlay text (max 10 chars) and CTA headline (max 15 chars).

Respond with ONLY valid JSON:
{
  "scripts": [
    {"format":"6s Bumper","hook":"","body":"","cta":"","onScreenText":[""],"voiceover":"Full VO script"},
    {"format":"15s Non-Skip","hook":"","body":"","cta":"","onScreenText":[""],"voiceover":"Full VO script"},
    {"format":"30s Skippable","hook":"","body":"","cta":"","onScreenText":[""],"voiceover":"Full VO script"}
  ],
  "companionBanner": {"headlines":["H1","H2"],"descriptions":["D1"]},
  "thumbnailIdeas": [{"concept":"","textOverlay":""}],
  "ctaOverlay": {"text":"Shop Now","headline":"Learn More Today"},
  "targetingNotes": "Audience and placement suggestions",
  "keywords": ["targeting keywords"],
  "notes": "Video campaign strategy"
}`,

    app: `You are a Google App Ads expert. Generate text, image, and video assets for app install/engagement campaigns.

RULES:
- Headlines: 5 variations, max 30 chars (focus on app benefits and install CTAs).
- Descriptions: 5 variations, max 90 chars (features, social proof, ratings).
- HTML5 asset suggestions if applicable.
- Target audience for app campaigns.
- Include both install and engagement ad variations.

Respond with ONLY valid JSON:
{
  "headlines": ["H1","H2","H3","H4","H5"],
  "descriptions": ["D1","D2","D3","D4","D5"],
  "installCTAs": ["Install Now","Get the App","Download Free"],
  "engagementCTAs": ["Open App","Try New Feature"],
  "imageSuggestions": [{"size":"1200x628","concept":"App screenshot with feature highlight"}],
  "videoSuggestions": [{"duration":"15s","concept":"Demo of key feature with install CTA"}],
  "targetAudience": {"interests":[],"demographics":"","devices":["mobile","tablet"]},
  "keywords": ["app related terms"],
  "notes": "App campaign strategy"
}`,

    demand_gen: `You are a Google Demand Gen Ads expert (formerly Discovery Ads). Generate assets for Discover, Gmail, and YouTube feeds.

RULES:
- Headlines: 5, max 40 chars (Demand Gen allows 40).
- Descriptions: 5, max 90 chars.
- Generate both single-image and carousel ad content.
- Carousel: 2-10 cards, each with headline (40 chars) and image concept.
- CTA from approved list: Shop now, Sign up, Learn more, Get offer, etc.
- Audience targeting suggestions for prospecting.

Respond with ONLY valid JSON:
{
  "singleImage": {
    "headlines": ["H1","H2","H3","H4","H5"],
    "descriptions": ["D1","D2","D3","D4","D5"],
    "cta": "Shop Now",
    "imageSuggestions": [{"size":"1200x628","concept":""}]
  },
  "carousel": {
    "cards": [
      {"headline":"Card 1 Title","description":"Card 1 desc","imageConcept":""},
      {"headline":"Card 2 Title","description":"Card 2 desc","imageConcept":""}
    ],
    "cta": "Learn More"
  },
  "audienceTargeting": {"interests":[],"customSegments":[],"lookalike":""},
  "keywords": ["prospecting terms"],
  "notes": "Demand Gen strategy notes"
}`,

    call_only: `You are a Google Call-Only Ads expert. Generate ads optimized for mobile click-to-call conversions.

RULES:
- Headlines: 2 per ad, max 30 chars (must include phone-CTA language: "Call Now", "Speak to Expert").
- Descriptions: 2 per ad, max 90 chars (highlight urgency, availability, benefits of calling).
- Business name: max 25 chars.
- Generate 5 ad variations.
- Verification URL suggestion.
- Call tracking and scheduling recommendations.

Respond with ONLY valid JSON:
{
  "adVariations": [
    {"headline1":"","headline2":"","description1":"","description2":"","businessName":""}
  ],
  "verificationUrl": "yoursite.com/contact",
  "callSchedule": {"days":"Mon-Fri","hours":"8am-8pm","timezone":""},
  "callExtensions": {"countryCode":"+1","callOnly":true},
  "trackingNotes": "Call conversion tracking setup recommendations",
  "keywords": ["call-intent keywords"],
  "notes": "Call-only campaign strategy"
}`
};

const POLICY_CHECK_PROMPT = `You are a Google Ads policy compliance expert. Analyze the provided ad copy for potential policy violations.

Check against ALL Google Ads policies:
- Prohibited content (profanity, ALL CAPS, misleading claims, fake urgency)
- Character limits (headlines 30 chars, descriptions 90 chars)
- Sensitive industry restrictions (cannabis, dating, health, alcohol, gambling, finance)
- Trademark issues
- Editorial standards (punctuation, spacing, symbols)
- Landing page requirements

You MUST respond with ONLY a valid JSON object (no markdown, no code fences, no explanation):
{
  "compliant": true/false,
  "score": 0-100,
  "issues": [
    {"severity": "error"|"warning"|"info", "rule": "Policy rule name", "detail": "Specific issue", "suggestion": "How to fix"}
  ],
  "summary": "Brief overall assessment"
}`;

async function callOpenAI(systemPrompt: string, userMessage: string): Promise<{ content: string; tokens: { prompt: number; completion: number; total: number } } | null> {
    if (!OPENAI_API_KEY) return null;
    try {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_API_KEY}` },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userMessage },
                ],
                max_tokens: 4096,
                temperature: 0.8,
            }),
        });
        if (!res.ok) { console.error("[AdCopyGen] OpenAI error:", res.status); return null; }
        const data = await res.json();
        return {
            content: data.choices?.[0]?.message?.content || "",
            tokens: { prompt: data.usage?.prompt_tokens || 0, completion: data.usage?.completion_tokens || 0, total: data.usage?.total_tokens || 0 },
        };
    } catch (err) { console.error("[AdCopyGen] OpenAI fetch error:", err); return null; }
}

async function callAnthropic(systemPrompt: string, userMessage: string): Promise<{ content: string; tokens: { prompt: number; completion: number; total: number } } | null> {
    if (!ANTHROPIC_API_KEY) return null;
    try {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
            body: JSON.stringify({
                model: "claude-sonnet-4-20250514",
                max_tokens: 4096,
                system: systemPrompt,
                messages: [{ role: "user", content: userMessage }],
            }),
        });
        if (!res.ok) { console.error("[AdCopyGen] Anthropic error:", res.status); return null; }
        const data = await res.json();
        return {
            content: data.content?.[0]?.text || "",
            tokens: { prompt: data.usage?.input_tokens || 0, completion: data.usage?.output_tokens || 0, total: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0) },
        };
    } catch (err) { console.error("[AdCopyGen] Anthropic fetch error:", err); return null; }
}

export async function POST(req: NextRequest) {
    const rateLimited = checkRateLimit(req, apiLimiter);
    if (rateLimited) return rateLimited;

    const csrfError = await checkCSRF(req);
    if (csrfError) return csrfError;

    const session = await getSessionDual(req);
    if (!session) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    try {
        const body: GenerateRequest = await req.json();
        const mode = body.mode || "generate";

        // ── Usage limit check ────────────────────────────────────
        const subscription = await prisma.subscription.findUnique({ where: { userId: session.id } });
        const plan = subscription?.plan || "free";
        const used = subscription?.aiMessagesUsed || 0;
        const limit = subscription?.aiMessagesLimit || 10;
        const bonus = subscription?.bonusTokens || 0;

        if (isAtMessageLimit(plan, used, bonus)) {
            return NextResponse.json({
                error: "AI message limit reached. Upgrade your plan or purchase top-up tokens.",
                limitReached: true,
            }, { status: 429 });
        }

        // Reserve a slot
        if (subscription) {
            if (bonus > 0) {
                await prisma.subscription.update({ where: { userId: session.id }, data: { bonusTokens: { decrement: 1 } } });
            } else {
                await prisma.subscription.update({ where: { userId: session.id }, data: { aiMessagesUsed: { increment: 1 } } });
            }
        }

        let systemPrompt: string;
        let userMessage: string;

        if (mode === "policy-check") {
            if (!body.adCopy?.trim()) {
                return NextResponse.json({ error: "Ad copy text is required for policy check" }, { status: 400 });
            }
            systemPrompt = POLICY_CHECK_PROMPT;
            userMessage = `Analyze this ad copy for Google Ads policy compliance:\n\n${body.adCopy}`;
        } else {
            if (!body.productDescription?.trim()) {
                return NextResponse.json({ error: "Product/service description is required" }, { status: 400 });
            }

            systemPrompt = FORMAT_PROMPTS[body.campaignType || "search"] || GENERATE_PROMPT;

            const parts: string[] = [];
            parts.push(`Campaign Type: ${body.campaignType || "search"}`);
            parts.push(`Product/Service: ${body.productDescription}`);
            if (body.businessName) parts.push(`Business: ${body.businessName}`);
            if (body.businessIndustry) parts.push(`Industry: ${body.businessIndustry}`);
            if (body.businessWebsite) parts.push(`Website: ${body.businessWebsite}`);
            if (body.businessLocation) parts.push(`Location: ${body.businessLocation}`);
            if (body.targetAudience) parts.push(`Target Audience: ${body.targetAudience}`);
            if (body.tone) parts.push(`Tone: ${body.tone}`);
            if (body.keywords?.length) parts.push(`Focus Keywords: ${body.keywords.join(", ")}`);
            if (body.numberOfVariations) parts.push(`Generate ${body.numberOfVariations} ad variations`);

            if (body.locale && body.locale !== "en") {
                const langMap: Record<string, string> = { es: "Spanish", fr: "French", de: "German", it: "Italian", pt: "Portuguese", nl: "Dutch", sv: "Swedish", no: "Norwegian", da: "Danish", fi: "Finnish", pl: "Polish" };
                if (langMap[body.locale]) parts.push(`Generate all ad copy in ${langMap[body.locale]}`);
            }

            userMessage = parts.join("\n");
        }

        // Try OpenAI first, fallback to Anthropic
        let result = await callOpenAI(systemPrompt, userMessage);
        let modelUsed = "gpt-4o-mini";

        if (!result) {
            result = await callAnthropic(systemPrompt, userMessage);
            modelUsed = "claude-4.6";
        }

        if (!result) {
            // Refund the slot
            if (subscription) {
                if (bonus > 0) {
                    await prisma.subscription.update({ where: { userId: session.id }, data: { bonusTokens: { increment: 1 } } });
                } else {
                    await prisma.subscription.update({ where: { userId: session.id }, data: { aiMessagesUsed: { decrement: 1 } } });
                }
            }
            return NextResponse.json({ error: "AI service temporarily unavailable" }, { status: 503 });
        }

        // Track usage
        const costPerMessage = modelUsed === "gpt-4o-mini" ? 0.0009 : 0.02;
        await prisma.usage.create({
            data: {
                userId: session.id,
                type: "chat",
                model: modelUsed,
                inputTokens: result.tokens.prompt,
                outputTokens: result.tokens.completion,
                totalTokens: result.tokens.total,
                costUsd: costPerMessage,
                metadata: JSON.stringify({ feature: mode === "policy-check" ? "policy_check" : "ad_copy_generator" }),
            },
        });

        // Parse JSON response from AI
        let parsed;
        try {
            // Strip markdown code fences if present
            let raw = result.content.trim();
            if (raw.startsWith("```")) {
                raw = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
            }
            parsed = JSON.parse(raw);
        } catch {
            // If JSON parsing fails, return raw content
            parsed = { raw: result.content, parseError: true };
        }

        return NextResponse.json({
            result: parsed,
            model: modelUsed,
            mode,
            tokens: result.tokens,
        });
    } catch (error) {
        console.error("[AdCopyGen] Error:", error);
        return NextResponse.json({ error: "Failed to generate ad copy" }, { status: 500 });
    }
}
