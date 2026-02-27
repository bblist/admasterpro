/**
 * Budget & Bid Optimizer API
 *
 * POST — Analyze campaign data and generate AI optimization recommendations
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionDual } from "@/lib/session";
import { apiLimiter, checkRateLimit } from "@/lib/rate-limit";
import { checkCSRF } from "@/lib/csrf";
import { prisma } from "@/lib/db";
import { getCampaigns, isGoogleAdsConfigured } from "@/lib/google-ads";
import { isAtMessageLimit } from "@/lib/plans";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const OPTIMIZER_PROMPT = `You are a Google Ads budget & bid optimization expert. Analyze campaign performance data and provide actionable budget and bid recommendations.

For each campaign, consider:
- Cost efficiency (CPC, cost per conversion)
- Conversion volume and value
- CTR and quality signals
- Budget utilization and impression share
- ROAS/ROI for campaigns with conversion value

You MUST respond with ONLY a valid JSON object (no markdown, no code fences):
{
  "overallScore": 0-100,
  "totalMonthlyBudget": number,
  "suggestedMonthlyBudget": number,
  "potentialSavings": number,
  "recommendations": [
    {
      "campaignId": "string",
      "campaignName": "string",
      "action": "increase"|"decrease"|"pause"|"maintain"|"restructure",
      "priority": "high"|"medium"|"low",
      "currentBudget": number,
      "suggestedBudget": number,
      "reason": "Brief explanation",
      "expectedImpact": "Expected outcome"
    }
  ],
  "quickWins": ["Action 1", "Action 2", ...],
  "warnings": ["Warning 1", ...],
  "summary": "2-3 sentence overall assessment"
}`;

async function callAI(systemPrompt: string, userMessage: string) {
    // Try OpenAI first
    if (OPENAI_API_KEY) {
        try {
            const res = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_API_KEY}` },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userMessage }],
                    max_tokens: 4096,
                    temperature: 0.5,
                }),
            });
            if (res.ok) {
                const data = await res.json();
                return {
                    content: data.choices?.[0]?.message?.content || "",
                    model: "gpt-4o-mini",
                    tokens: { prompt: data.usage?.prompt_tokens || 0, completion: data.usage?.completion_tokens || 0, total: data.usage?.total_tokens || 0 },
                };
            }
        } catch (err) { console.error("[BudgetOptim] OpenAI error:", err); }
    }

    // Fallback to Anthropic
    if (ANTHROPIC_API_KEY) {
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
            if (res.ok) {
                const data = await res.json();
                return {
                    content: data.content?.[0]?.text || "",
                    model: "claude-4.6",
                    tokens: { prompt: data.usage?.input_tokens || 0, completion: data.usage?.output_tokens || 0, total: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0) },
                };
            }
        } catch (err) { console.error("[BudgetOptim] Anthropic error:", err); }
    }

    return null;
}

export async function POST(req: NextRequest) {
    const rateLimited = checkRateLimit(req, apiLimiter);
    if (rateLimited) return rateLimited;

    const csrfError = await checkCSRF(req);
    if (csrfError) return csrfError;

    const session = await getSessionDual(req);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { businessId } = body;

        // Check usage limits
        const subscription = await prisma.subscription.findUnique({ where: { userId: session.id } });
        const plan = subscription?.plan || "free";
        const used = subscription?.aiMessagesUsed || 0;
        const bonus = subscription?.bonusTokens || 0;

        if (isAtMessageLimit(plan, used, bonus)) {
            return NextResponse.json({ error: "AI message limit reached", limitReached: true }, { status: 429 });
        }

        // Get campaign data
        let campaigns: unknown[] = [];

        if (isGoogleAdsConfigured()) {
            const user = await prisma.user.findUnique({
                where: { id: session.id },
                select: { refreshToken: true },
            });

            if (user?.refreshToken) {
                const business = await prisma.business.findFirst({
                    where: businessId
                        ? { id: businessId, userId: session.id }
                        : { userId: session.id, googleAdsId: { not: null } },
                    select: { googleAdsId: true },
                });

                if (business?.googleAdsId) {
                    campaigns = await getCampaigns(user.refreshToken, business.googleAdsId, "LAST_30_DAYS");
                }
            }
        }

        // Reserve AI slot
        if (subscription) {
            if (bonus > 0) {
                await prisma.subscription.update({ where: { userId: session.id }, data: { bonusTokens: { decrement: 1 } } });
            } else {
                await prisma.subscription.update({ where: { userId: session.id }, data: { aiMessagesUsed: { increment: 1 } } });
            }
        }

        let userMessage: string;
        if (campaigns.length > 0) {
            userMessage = `Analyze these Google Ads campaigns (last 30 days) and provide budget/bid optimization recommendations:\n\n${JSON.stringify(campaigns, null, 2)}`;
        } else {
            userMessage = `The user has no active campaigns data available. Provide general budget optimization tips for a new Google Ads advertiser, including:
- Recommended starting daily budgets by industry
- When to increase vs decrease budget
- Key metrics to watch
- Common budget mistakes to avoid

Format as if you're analyzing their account, using the same JSON structure.`;
        }

        const result = await callAI(OPTIMIZER_PROMPT, userMessage);

        if (!result) {
            // Refund slot
            if (subscription) {
                if (bonus > 0) {
                    await prisma.subscription.update({ where: { userId: session.id }, data: { bonusTokens: { increment: 1 } } });
                } else {
                    await prisma.subscription.update({ where: { userId: session.id }, data: { aiMessagesUsed: { decrement: 1 } } });
                }
            }
            return NextResponse.json({ error: "AI service unavailable" }, { status: 503 });
        }

        // Track usage
        const costPerMessage = result.model === "gpt-4o-mini" ? 0.0009 : 0.02;
        await prisma.usage.create({
            data: {
                userId: session.id,
                type: "chat",
                model: result.model,
                inputTokens: result.tokens.prompt,
                outputTokens: result.tokens.completion,
                totalTokens: result.tokens.total,
                costUsd: costPerMessage,
                metadata: JSON.stringify({ feature: "budget_optimizer" }),
            },
        });

        // Parse result
        let parsed;
        try {
            let raw = result.content.trim();
            if (raw.startsWith("```")) {
                raw = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
            }
            parsed = JSON.parse(raw);
        } catch {
            parsed = { raw: result.content, parseError: true };
        }

        return NextResponse.json({
            result: parsed,
            hasCampaignData: campaigns.length > 0,
            campaignCount: campaigns.length,
            model: result.model,
        });
    } catch (error) {
        console.error("[BudgetOptim] Error:", error);
        return NextResponse.json({ error: "Failed to generate recommendations" }, { status: 500 });
    }
}
