/**
 * AI Keyword Research API
 *
 * POST /api/keyword-research
 *
 * Uses GPT-4o-mini to generate keyword research based on business context.
 * Returns: keyword suggestions with estimated search volume, competition,
 * CPC estimates, keyword groupings, and negative keyword recommendations.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionDual } from "@/lib/session";
import { checkCSRF } from "@/lib/csrf";
import { apiLimiter, checkRateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/db";

const OPENAI_KEY = process.env.OPENAI_API_KEY || "";

export async function POST(req: NextRequest) {
    const csrfError = await checkCSRF(req);
    if (csrfError) return csrfError;

    const rateLimited = checkRateLimit(req, apiLimiter);
    if (rateLimited) return rateLimited;

    const session = await getSessionDual(req);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const {
            seedKeywords,
            businessDescription,
            industry,
            location,
            competitorUrls,
            campaignGoal,
            budget,
            businessId,
        } = body;

        if (!seedKeywords && !businessDescription) {
            return NextResponse.json(
                { error: "Provide seed keywords or business description" },
                { status: 400 }
            );
        }

        // Get business context if available
        let businessContext = "";
        if (businessId) {
            const business = await prisma.business.findFirst({
                where: { id: businessId, userId: session.id },
            });
            if (business) {
                businessContext = `Business: ${business.name}`;
                if (business.industry) businessContext += ` | Industry: ${business.industry}`;
                if (business.website) businessContext += ` | Website: ${business.website}`;
                if (business.location) businessContext += ` | Location: ${business.location}`;
                if (business.services) {
                    try {
                        const services = JSON.parse(business.services);
                        businessContext += ` | Services: ${services.join(", ")}`;
                    } catch { /* ignore */ }
                }
            }
        }

        const prompt = `You are an expert Google Ads keyword research specialist. Generate comprehensive keyword research based on the following:

${businessContext ? `Business Context: ${businessContext}` : ""}
${seedKeywords ? `Seed Keywords: ${seedKeywords}` : ""}
${businessDescription ? `Business Description: ${businessDescription}` : ""}
${industry ? `Industry: ${industry}` : ""}
${location ? `Target Location: ${location}` : ""}
${competitorUrls ? `Competitor URLs: ${competitorUrls}` : ""}
${campaignGoal ? `Campaign Goal: ${campaignGoal}` : ""}
${budget ? `Monthly Budget: $${budget}` : ""}

Generate keyword research with these categories:

1. **Primary Keywords** (8-12): High-intent, directly related keywords
2. **Long-tail Keywords** (10-15): Specific, lower competition phrases
3. **Question Keywords** (5-8): "how to", "what is", "best" queries
4. **Local Keywords** (5-8): Location-based if applicable
5. **Negative Keywords** (8-12): Keywords to exclude to save budget
6. **Competitor Keywords** (5-8): Brand alternatives and comparisons

For each keyword, provide:
- keyword: the search term
- matchType: "BROAD" | "PHRASE" | "EXACT" (recommended)
- searchVolume: estimated monthly searches (integer)
- competition: "LOW" | "MEDIUM" | "HIGH"
- cpcEstimate: estimated cost per click in USD (number)
- intent: "informational" | "commercial" | "transactional" | "navigational"
- difficulty: 1-100 score
- opportunity: brief reason why this keyword is valuable (max 80 chars)

Respond ONLY with valid JSON in this structure:
{
  "primary": [...],
  "longTail": [...],
  "questions": [...],
  "local": [...],
  "negative": [{ "keyword": "...", "reason": "..." }],
  "competitor": [...],
  "summary": "Brief strategic summary of findings (2-3 sentences)",
  "estimatedMonthlyClicks": number,
  "estimatedMonthlyCost": number,
  "topOpportunity": "The single best keyword opportunity and why"
}`;

        const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${OPENAI_KEY}`,
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7,
                max_tokens: 4000,
            }),
        });

        if (!aiResponse.ok) {
            const errText = await aiResponse.text();
            console.error("[Keyword Research] OpenAI error:", errText);
            throw new Error("AI keyword research failed");
        }

        const aiData = await aiResponse.json();
        const raw = aiData.choices?.[0]?.message?.content || "{}";

        let research;
        try {
            const cleaned = raw.replace(/```json?\s*/g, "").replace(/```\s*/g, "").trim();
            research = JSON.parse(cleaned);
        } catch {
            console.error("[Keyword Research] Parse error:", raw);
            return NextResponse.json(
                { error: "Failed to parse AI response. Please try again." },
                { status: 500 }
            );
        }

        // Track usage
        const tokens = aiData.usage?.total_tokens || 0;

        return NextResponse.json({
            research,
            tokens,
            model: "gpt-4o-mini",
        });
    } catch (error) {
        console.error("[Keyword Research] Error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Keyword research failed" },
            { status: 500 }
        );
    }
}
