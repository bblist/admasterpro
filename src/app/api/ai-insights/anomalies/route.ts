/**
 * AI Insights — Anomaly Detection & Email Summaries
 *
 * POST — Run anomaly detection on metrics, send email summaries
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionDual } from "@/lib/session";
import { apiLimiter, checkRateLimit } from "@/lib/rate-limit";
import { checkCSRF } from "@/lib/csrf";
import { prisma } from "@/lib/db";

const OPENAI_KEY = process.env.OPENAI_API_KEY || "";

export async function POST(req: NextRequest) {
    const rateLimited = checkRateLimit(req, apiLimiter);
    if (rateLimited) return rateLimited;

    const csrfError = await checkCSRF(req);
    if (csrfError) return csrfError;

    const session = await getSessionDual(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        const { action } = body;

        if (action === "detect-anomalies") {
            const { metrics } = body;

            if (!OPENAI_KEY) return NextResponse.json({ error: "AI not configured" }, { status: 503 });

            const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_KEY}` },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [
                        {
                            role: "system",
                            content: `You are a Google Ads anomaly detection engine. Analyze metric time series and detect unusual changes.

For each anomaly, classify:
- severity: "critical" (>50% change), "warning" (25-50%), "info" (<25%)
- direction: "spike" or "drop"
- likely cause

Return ONLY valid JSON:
{
  "anomalies": [
    {
      "metric": "CPC|CTR|Spend|Conversions|Impressions",
      "severity": "critical|warning|info",
      "direction": "spike|drop",
      "change": "+45%",
      "period": "Last 24h|Last 3 days|Last 7 days",
      "currentValue": "value",
      "expectedValue": "value",
      "likelyCause": "Explanation",
      "suggestedAction": "What to do"
    }
  ],
  "healthScore": 85,
  "summary": "Overall account health summary",
  "alertsToSend": [
    { "urgency": "immediate|daily|weekly", "message": "Alert detail" }
  ]
}`
                        },
                        {
                            role: "user",
                            content: `Detect anomalies in these metrics:\n${JSON.stringify(metrics || {})}`
                        }
                    ],
                    max_tokens: 1536,
                    temperature: 0.3,
                }),
            });

            if (!aiRes.ok) return NextResponse.json({ error: "AI analysis failed" }, { status: 503 });
            const aiData = await aiRes.json();
            let raw = aiData.choices?.[0]?.message?.content?.trim() || "{}";
            if (raw.startsWith("```")) raw = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");

            return NextResponse.json({ result: JSON.parse(raw) });
        }

        if (action === "generate-email-summary") {
            const { businessId, period } = body;

            const business = businessId
                ? await prisma.business.findFirst({ where: { id: businessId, userId: session.id } })
                : await prisma.business.findFirst({ where: { userId: session.id }, orderBy: { createdAt: "desc" } });

            if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

            // Get recent insights
            const insights = await prisma.aiInsight.findMany({
                where: { businessId: business.id, dismissed: false },
                orderBy: { createdAt: "desc" },
                take: 10,
            });

            if (!OPENAI_KEY) return NextResponse.json({ error: "AI not configured" }, { status: 503 });

            const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_KEY}` },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [
                        {
                            role: "system",
                            content: `You are composing a professional email summary for a Google Ads advertiser.

Return ONLY valid JSON:
{
  "subject": "Email subject line",
  "greeting": "Hello [Name]",
  "summary": "Executive summary paragraph",
  "highlights": [
    { "icon": "up|down|alert|star", "text": "Key highlight" }
  ],
  "actionItems": [
    { "priority": "high|medium|low", "task": "What to do", "impact": "Expected result" }
  ],
  "forecast": "Quick forecast for next period",
  "closingNote": "Motivational or advisory closing"
}`
                        },
                        {
                            role: "user",
                            content: `Generate a ${period || "weekly"} email summary for ${business.name} (${business.industry || "general"}).

Active Insights:\n${insights.map((i) => `- [${i.priority}] ${i.title}: ${i.description}`).join("\n") || "No active insights"}`
                        }
                    ],
                    max_tokens: 1536,
                    temperature: 0.5,
                }),
            });

            if (!aiRes.ok) return NextResponse.json({ error: "AI generation failed" }, { status: 503 });
            const aiData = await aiRes.json();
            let raw = aiData.choices?.[0]?.message?.content?.trim() || "{}";
            if (raw.startsWith("```")) raw = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");

            return NextResponse.json({ result: JSON.parse(raw) });
        }

        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    } catch (error) {
        console.error("[AnomalyDetection] Error:", error);
        return NextResponse.json({ error: "Action failed" }, { status: 500 });
    }
}
