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
  "notes": "Brief strategy notes about the ad approach"
}`;

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

            systemPrompt = GENERATE_PROMPT;

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
