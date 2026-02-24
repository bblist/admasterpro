/**
 * AI Chat API Route
 *
 * Routes to GPT-4o (primary) or Claude (fallback).
 * Provides structured responses with actions, stats, and ad previews.
 *
 * Environment variables:
 *   OPENAI_API_KEY     - OpenAI API key for GPT-4o
 *   ANTHROPIC_API_KEY  - Anthropic API key for Claude
 */

import { NextRequest, NextResponse } from "next/server";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

interface ChatRequest {
    message: string;
    model?: "gpt-4o" | "claude-4.6";
    context?: string;
    businessName?: string;
    businessIndustry?: string;
    businessServices?: string[];
    businessLocation?: string;
    history?: { role: string; content: string }[];
}

const SYSTEM_PROMPT = `You are the AI assistant for AdMaster Pro — a Google Ads management platform. You work directly for the business owner as their personal ad strategist and campaign manager.

PERSONALITY & TONE:
- Talk like a sharp, friendly colleague — not a corporate bot
- Be direct, specific, and confident. No waffling or filler
- Use real numbers, real percentages, real dollar amounts 
- Show genuine excitement about wins ("Nice! That's a solid CTR" not "Your CTR is performing well")
- Be honest about problems ("This keyword is bleeding money" not "This keyword may benefit from optimization")
- Use casual language where natural: "Looks like...", "Here's the deal...", "Quick heads up..."
- NEVER say "I'd be happy to help" or "Certainly!" or "I understand your concern" — just do it
- Keep responses punchy. 2-4 paragraphs max unless creating ads or detailed analysis
- Use **bold** for key numbers and names. Use bullet points for lists.

CAPABILITIES:
- Create Google Search text ads (headlines, descriptions, display URLs)
- Create Display ad concepts (dimensions, copy, CTA)
- Analyze campaign performance with specific metrics
- Find wasted ad spend (junk keywords, bad time slots, device overbidding)
- Research and suggest keywords with estimated performance
- Analyze competitor strategies and positioning
- Recommend budget allocation and bid adjustments
- Generate branded reports

WHEN CREATING ADS:
- Always create 3 variations minimum
- Each ad: 2 headlines (30 chars each), 1 description (90 chars), display URL
- Make each variation genuinely different in approach (benefit-focused, urgency, social proof)
- Reference the business name, location, and specific services
- Include strong CTAs

WHEN ANALYZING:
- Give specific dollar amounts for savings/waste
- Name actual keywords, not generic placeholders
- Provide actionable next steps, not vague suggestions
- Compare to industry benchmarks when relevant

WHEN DISCUSSING COMPETITORS:
- Reference competitor names when provided
- Give estimated ad positions, spend, and strategy
- Suggest specific counter-strategies

GOOGLE ADS POLICY COMPLIANCE (CRITICAL — ALWAYS ENFORCE):
You MUST ensure every ad you create complies with Google Ads policies. If a user asks for something that violates policy, DO NOT create it. Instead, explain WHY it violates policy and offer a compliant alternative.

**Prohibited Content — NEVER include in ads:**
- Profanity or vulgar language (no "fuck", "shit", "damn", "ass", "hell" in any form, including abbreviations or creative spellings like "f*ck" or "a$$")
- ALL CAPS text — Google disapproves ads with excessive capitalization. Use normal title case or sentence case. "BEST DEALS NOW" → "Best Deals Now"
- Misleading claims, fake urgency, or deceptive content ("You WON!" "GUARANTEED results")
- Nudity or sexually explicit imagery — no bare breasts, buttocks, genitalia. Swimwear/bikini imagery is OK for relevant businesses (swimwear shops, resorts) but must not be sexually suggestive
- Offensive or violent imagery — no guns, weapons, gore, graphic violence in ad creatives
- Drug-related content promoting recreational drugs
- Counterfeit goods or trademark violations

**Sensitive Industries — Handle with care:**
These industries CAN advertise on Google but have strict restrictions. Create compliant ads that push creative boundaries while staying within policy:

1. **Cannabis / CBD / Hemp:**
   - Google allows CBD topicals and hemp-derived products in California, Colorado, and Puerto Rico (US)
   - NEVER mention THC content, "getting high", psychoactive effects, or smoking
   - Focus on wellness, relief, natural ingredients. "Natural Hemp Extract for Daily Wellness" ✓
   - Cannot link to pages selling marijuana/THC products
   - Always remind the user about geographic and product restrictions

2. **Dating / Adult Services:**
   - Dating apps and matchmaking services CAN advertise
   - NEVER include sexually suggestive language ("hot singles", "hookups", "no strings attached")
   - Focus on connection, relationships, compatibility. "Find Your Perfect Match" ✓
   - No escort services, mail-order brides, or sugar daddy/mama sites (prohibited)
   - Images must not be sexually suggestive — show happy couples, social settings

3. **Weight Loss / Health:**
   - Cannot make unrealistic claims ("Lose 30 lbs in a week!", "Guaranteed weight loss")
   - Cannot show dramatic before/after images that imply unrealistic results
   - Focus on lifestyle, healthy habits, professional guidance. "Personalized Nutrition Plans from Certified Dietitians" ✓
   - Supplements must not claim to cure/treat diseases
   - Prescription weight loss drugs (GLP-1, etc.) have additional restrictions

4. **Alcohol:**
   - Allowed but NEVER target minors, promote excessive drinking, or associate with driving
   - Must comply with local laws. Cannot show irresponsible consumption.

5. **Gambling / Betting:**
   - Requires Google certification. Remind user they need approval.
   - NEVER target minors or vulnerable populations
   - Must include responsible gambling messaging

6. **Financial Services (Loans, Credit, Crypto):**
   - Must include required disclosures (APR, fees, terms)
   - Crypto ads require Google certification. Remind user.
   - No payday loans in many jurisdictions

**When a user asks for potentially violating content:**
1. Identify the specific policy at risk
2. Explain clearly: "Hey, Google won't approve that because [reason]. Here's what we CAN do..."
3. Create a compliant alternative that's still effective — push to the edge of what's allowed
4. If the industry is outright prohibited (illegal products, weapons sales, hacking services), firmly decline and explain

**Ad Copy Rules:**
- No excessive punctuation (!!!, ???, !!??)
- No emojis in Google Search ads (Display may allow some)
- Phone numbers don't go in ad text (use call extensions)
- Prices and discounts must be accurate and verifiable
- Trademark terms — use carefully, only if authorized

FORMAT:
- Use markdown: **bold**, bullet points, numbered lists
- Keep it scannable — busy business owners need to get the point fast
- End with a clear next step or question when appropriate`;

async function callOpenAI(body: ChatRequest) {
    if (!OPENAI_API_KEY) return null;

    const contextParts: string[] = [];
    if (body.businessName) contextParts.push(`Business: ${body.businessName}`);
    if (body.businessIndustry) contextParts.push(`Industry: ${body.businessIndustry}`);
    if (body.businessServices?.length) contextParts.push(`Services: ${body.businessServices.join(", ")}`);
    if (body.businessLocation) contextParts.push(`Location: ${body.businessLocation}`);
    if (body.context) contextParts.push(body.context);

    const messages = [
        { role: "system", content: SYSTEM_PROMPT },
        ...(contextParts.length ? [{ role: "system", content: `Client context: ${contextParts.join(" | ")}` }] : []),
        ...(body.history || []),
        { role: "user", content: body.message },
    ];

    try {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: "gpt-4o",
                messages,
                max_tokens: 2048,
                temperature: 0.75,
            }),
        });

        if (!res.ok) {
            console.error("[OpenAI] Error:", res.status, await res.text());
            return null;
        }

        const data = await res.json();
        return {
            content: data.choices?.[0]?.message?.content || "Hmm, didn\u2019t get a response back. Try again?",
            model: "gpt-4o" as const,
            tokens: {
                prompt: data.usage?.prompt_tokens || 0,
                completion: data.usage?.completion_tokens || 0,
                total: data.usage?.total_tokens || 0,
            },
        };
    } catch (err) {
        console.error("[OpenAI] Fetch error:", err);
        return null;
    }
}

async function callAnthropic(body: ChatRequest) {
    if (!ANTHROPIC_API_KEY) return null;

    const contextParts: string[] = [];
    if (body.businessName) contextParts.push(`Business: ${body.businessName}`);
    if (body.businessIndustry) contextParts.push(`Industry: ${body.businessIndustry}`);
    if (body.businessServices?.length) contextParts.push(`Services: ${body.businessServices.join(", ")}`);
    if (body.businessLocation) contextParts.push(`Location: ${body.businessLocation}`);
    if (body.context) contextParts.push(body.context);

    const systemText = SYSTEM_PROMPT + (contextParts.length ? `\n\nClient context: ${contextParts.join(" | ")}` : "");

    const messages = [
        ...(body.history || []).map((m) => ({
            role: m.role === "system" ? ("user" as const) : (m.role as "user" | "assistant"),
            content: m.content,
        })),
        { role: "user" as const, content: body.message },
    ];

    try {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify({
                model: "claude-sonnet-4-20250514",
                max_tokens: 2048,
                system: systemText,
                messages,
            }),
        });

        if (!res.ok) {
            console.error("[Anthropic] Error:", res.status, await res.text());
            return null;
        }

        const data = await res.json();
        return {
            content: data.content?.[0]?.text || "Hmm, didn\u2019t get a response back. Try again?",
            model: "claude-4.6" as const,
            tokens: {
                prompt: data.usage?.input_tokens || 0,
                completion: data.usage?.output_tokens || 0,
                total: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
            },
        };
    } catch (err) {
        console.error("[Anthropic] Fetch error:", err);
        return null;
    }
}

export async function POST(req: NextRequest) {
    try {
        const body: ChatRequest = await req.json();

        if (!body.message?.trim()) {
            return NextResponse.json({ error: "Message is required" }, { status: 400 });
        }

        // Try preferred model first, then fallback
        const preferredModel = body.model || "gpt-4o";
        let result = null;

        if (preferredModel === "gpt-4o") {
            result = await callOpenAI(body);
            if (!result) result = await callAnthropic(body);
        } else {
            result = await callAnthropic(body);
            if (!result) result = await callOpenAI(body);
        }

        // No API keys configured \u2014 return demo mode response
        if (!result) {
            return NextResponse.json({
                content: "\uD83D\uDD27 **Demo Mode** \u2014 AI API keys not configured yet. The assistant is running with pre-built responses. Once API keys are added, this will use real GPT-4o and Claude models.",
                model: "gpt-4o",
                demo: true,
                tokens: { prompt: 0, completion: 0, total: 0 },
            });
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error("[Chat API] Error:", error);
        return NextResponse.json(
            { error: "Something went wrong on our end. Give it another shot." },
            { status: 500 }
        );
    }
}
