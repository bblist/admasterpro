/**
 * Auto-fill Brand Profile API
 *
 * Uses AI to extract brand profile fields from crawled website content.
 * Called after onboarding crawl to pre-populate the Brand Profile.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionDual } from "@/lib/session";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

interface AutoFillRequest {
    businessId: string;
    businessName: string;
    industry?: string;
    crawledContent: string;
}

const AUTO_FILL_PROMPT = `You are an expert marketing analyst. Given the following website content for a business, extract and generate a brand profile. Return a JSON object with these fields:

- "industry": The business's industry/niche (e.g., "Optical / Eyewear", "Dental / Orthodontics")
- "targetAudience": Who their ideal customers are (age, demographics, location, interests, pain points). Be specific based on the content.
- "brandVoice": How the brand communicates (professional, casual, luxury, friendly, etc). Infer from the website tone.
- "toneExamples": Example of good copy that matches their brand vs bad copy that doesn't. Write 1-2 examples of each.
- "uniqueSellingPoints": What makes them different from competitors. Extract from the content.
- "competitors": Known competitors if mentioned, otherwise leave empty string.
- "avoidTopics": Things the AI should avoid saying based on the industry (e.g., medical claims for health businesses).
- "guardrails": Critical safety rules for ad generation based on their industry.

Be concise but informative. Each field should be 1-3 sentences. For uniqueSellingPoints, use comma-separated points.

IMPORTANT: Return ONLY valid JSON, no markdown formatting, no code blocks.`;

export async function POST(req: NextRequest) {
    try {
        const session = await getSessionDual(req);
        if (!session?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body: AutoFillRequest = await req.json();
        const { businessName, industry, crawledContent } = body;

        if (!crawledContent || crawledContent.trim().length < 50) {
            return NextResponse.json(
                { error: "Insufficient content to auto-fill profile" },
                { status: 400 }
            );
        }

        if (!OPENAI_API_KEY) {
            return NextResponse.json(
                { error: "AI service not configured" },
                { status: 500 }
            );
        }

        // Truncate content to avoid token limits (keep first 6000 chars)
        const truncatedContent = crawledContent.slice(0, 6000);

        const userMessage = `Business Name: ${businessName}
${industry ? `Industry (user-selected): ${industry}` : ""}

Website Content:
${truncatedContent}`;

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: AUTO_FILL_PROMPT },
                    { role: "user", content: userMessage },
                ],
                temperature: 0.3,
                max_tokens: 1000,
            }),
        });

        if (!response.ok) {
            console.error("[auto-fill] OpenAI error:", response.status);
            return NextResponse.json(
                { error: "AI service error" },
                { status: 502 }
            );
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content?.trim();

        if (!content) {
            return NextResponse.json(
                { error: "Empty AI response" },
                { status: 502 }
            );
        }

        // Parse the JSON response
        let profile;
        try {
            // Strip markdown code blocks if present
            const cleaned = content.replace(/^```json?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
            profile = JSON.parse(cleaned);
        } catch {
            console.error("[auto-fill] Failed to parse AI response:", content);
            return NextResponse.json(
                { error: "Failed to parse AI response" },
                { status: 502 }
            );
        }

        return NextResponse.json({
            success: true,
            profile: {
                industry: profile.industry || industry || "",
                targetAudience: profile.targetAudience || "",
                brandVoice: profile.brandVoice || "",
                toneExamples: profile.toneExamples || "",
                uniqueSellingPoints: profile.uniqueSellingPoints || "",
                competitors: profile.competitors || "",
                avoidTopics: profile.avoidTopics || "",
                guardrails: profile.guardrails || "",
            },
        });
    } catch (error) {
        console.error("[auto-fill] Error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
