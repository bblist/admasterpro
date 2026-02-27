import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { auditLimiter, checkRateLimit } from "@/lib/rate-limit";
import { getSessionDual } from "@/lib/session";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

// ─── GET: Retrieve a stored audit report by ID ─────────────────────────────

export async function GET(req: NextRequest) {
    const auditId = req.nextUrl.searchParams.get("id");
    if (!auditId) {
        return NextResponse.json({ error: "Audit ID is required" }, { status: 400 });
    }

    try {
        const { prisma } = await import("@/lib/db");
        const report = await prisma.auditReport.findUnique({
            where: { id: auditId },
        });

        if (!report) {
            return NextResponse.json({ error: "Audit report not found" }, { status: 404 });
        }

        return NextResponse.json({
            auditId: report.id,
            websiteUrl: report.websiteUrl,
            businessName: report.businessName,
            industry: report.industry,
            email: report.email,
            monthlySpend: report.monthlySpend,
            pageTitle: report.pageTitle,
            result: JSON.parse(report.result),
            createdAt: report.createdAt.toISOString(),
        });
    } catch (err) {
        console.error("[Audit GET] Error:", err);
        return NextResponse.json({ error: "Failed to load audit report" }, { status: 500 });
    }
}

// SSRF blocklist — block internal/meta IPs
const BLOCKED_HOST_PATTERNS = [
    /^localhost$/i,
    /^127\./,
    /^10\./,
    /^172\.(1[6-9]|2\d|3[01])\./,
    /^192\.168\./,
    /^169\.254\./,
    /^0\./,
    /^\[::1\]/,
    /^\[fc/i,
    /^\[fd/i,
    /^\[fe80:/i,
    /metadata\.google/i,
    /metadata\.aws/i,
];

function isBlockedUrl(urlStr: string): boolean {
    try {
        const u = new URL(urlStr);
        if (u.protocol !== "http:" && u.protocol !== "https:") return true;
        const hostname = u.hostname;
        return BLOCKED_HOST_PATTERNS.some(p => p.test(hostname));
    } catch {
        return true;
    }
}

interface AuditSection {
    title: string;
    score: number;
    maxScore: number;
    status: "excellent" | "good" | "needs-work" | "critical";
    findings: string[];
    recommendations: string[];
}

export async function POST(req: NextRequest) {
    const rateLimited = checkRateLimit(req, auditLimiter);
    if (rateLimited) return rateLimited;

    // Require authentication to prevent anonymous API abuse
    const session = await getSessionDual(req);
    if (!session?.id) {
        return NextResponse.json({ error: "Please sign in to use the audit tool." }, { status: 401 });
    }

    try {
        const { websiteUrl, businessName, industry, email, monthlySpend } = await req.json();

        if (!websiteUrl || !businessName || !email) {
            return NextResponse.json({ error: "Website URL, business name, and email are required." }, { status: 400 });
        }

        // Normalize URL
        let url = websiteUrl.trim();
        if (!url.startsWith("http")) url = "https://" + url;

        // SSRF protection — block internal/metadata URLs
        if (isBlockedUrl(url)) {
            return NextResponse.json({ error: "Invalid or blocked URL." }, { status: 400 });
        }

        // Fetch the website content
        let pageContent = "";
        let pageTitle = "";
        let fetchError = false;
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 15000);
            const pageRes = await fetch(url, {
                signal: controller.signal,
                redirect: "follow",
                headers: {
                    "User-Agent": "AdMasterPro-AuditBot/1.0 (https://admasterai.nobleblocks.com)",
                },
            });
            clearTimeout(timeout);

            // Limit response size to 2MB to prevent OOM
            const contentLength = parseInt(pageRes.headers.get("content-length") || "0");
            if (contentLength > 2 * 1024 * 1024) {
                fetchError = true;
                pageContent = "Website response too large. Analyzing based on URL and best practices.";
            }
            const html = fetchError ? "" : await pageRes.text();

            // Extract basic info from HTML
            const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
            pageTitle = titleMatch ? titleMatch[1].trim() : "";

            // Strip HTML tags, keep text content (first 8000 chars)
            pageContent = html
                .replace(/<script[\s\S]*?<\/script>/gi, "")
                .replace(/<style[\s\S]*?<\/style>/gi, "")
                .replace(/<[^>]+>/g, " ")
                .replace(/\s+/g, " ")
                .trim()
                .slice(0, 8000);
        } catch {
            fetchError = true;
            pageContent = "Could not fetch website content. Analyze based on URL structure and general best practices.";
        }

        // AI Analysis prompt
        const prompt = `You are a senior paid-ads strategist who has managed millions in ad spend across dozens of industries. You are reviewing a potential client's website before running ads for them. Write like you're speaking directly to the business owner — be specific, blunt where needed, and skip the filler.

Do NOT sound like a generic AI audit. Reference specific things you see on the page (product names, sections, wording, images described, layout issues). If you can't fetch content, say so honestly instead of guessing.

WEBSITE: ${url}
BUSINESS NAME: ${businessName}
INDUSTRY: ${industry || "Not specified"}
PAGE TITLE: ${pageTitle}
MONTHLY AD SPEND: ${monthlySpend || "Not specified"}
${fetchError ? "NOTE: Could not fetch the website directly. Be upfront about this and base analysis on URL patterns and industry context." : ""}

PAGE CONTENT (extracted text):
${pageContent}

Score each section 0-100 with status: "excellent" (80-100), "good" (60-79), "needs-work" (40-59), "critical" (0-39).
For each section provide 2-4 specific findings (reference what you actually see) and 2-4 actionable recommendations (be concrete — no vague "consider improving").

SECTIONS:
1. Landing Page Quality — Structure, clarity of value proposition, professional design signals
2. Call-to-Action Effectiveness — CTA visibility, placement, wording, form accessibility
3. Mobile Optimization — Responsive design signals, mobile UX indicators
4. Trust Signals — Reviews, testimonials, certifications, security badges, contact info
5. Ad-Readiness — Would paid traffic convert? Landing page quality for Google Ads campaigns
6. SEO Foundation — Meta tags, heading hierarchy, keyword relevancy, content depth
7. Competitive Positioning — How this stacks up vs typical competitors in ${industry || "their"} space
8. Content Quality — Is content compelling, clear, conversion-oriented?

Also provide:
- An overall summary (3-4 sentences, direct and honest — what's working, what's not, and the single biggest thing to fix first)
- Overall score (0-100 weighted average)
- Top 3 quick wins (specific actions, not vague suggestions)
- Estimated monthly savings/improvement range in dollars

Return as JSON:
{
  "overallScore": number,
  "overallSummary": "string",
  "sections": [
    {
      "title": "string",
      "score": number,
      "maxScore": 100,
      "status": "excellent|good|needs-work|critical",
      "findings": ["string"],
      "recommendations": ["string"]
    }
  ],
  "quickWins": ["string", "string", "string"],
  "estimatedSavings": "string",
  "competitorInsight": "string"
}`;

        const res = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: "You are an expert digital marketing analyst. Always respond with valid JSON only, no markdown." },
                    { role: "user", content: prompt },
                ],
                temperature: 0.7,
                max_tokens: 3000,
            }),
        });

        if (!res.ok) {
            console.error("[Audit OpenAI] Error:", res.status, await res.text());
            return NextResponse.json({ error: "AI analysis failed. Please try again." }, { status: 500 });
        }

        const data = await res.json();
        const rawResponse = data.choices?.[0]?.message?.content || "{}";
        const promptTokens = data.usage?.prompt_tokens || 0;
        const completionTokens = data.usage?.completion_tokens || 0;
        const tokensUsed = data.usage?.total_tokens || 0;

        // Parse AI response
        let auditResult;
        try {
            // Strip potential markdown code fences
            const cleaned = rawResponse.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
            auditResult = JSON.parse(cleaned);
        } catch {
            auditResult = {
                overallScore: null,
                overallSummary: "We were unable to parse the AI analysis. Please try again.",
                sections: [],
                quickWins: ["Retry the audit for a full analysis"],
                estimatedSavings: "N/A",
                competitorInsight: "N/A",
                parseError: true,
            };
        }

        const costEstimate = promptTokens * 0.00000015 + completionTokens * 0.0000006;

        // Generate a unique audit ID and persist to DB
        const auditId = crypto.randomUUID();

        // Store in database for server-side retrieval
        try {
            const { prisma } = await import("@/lib/db");
            await prisma.auditReport.create({
                data: {
                    id: auditId,
                    userId: session.id,
                    websiteUrl: url,
                    businessName,
                    industry: industry || null,
                    email,
                    monthlySpend: monthlySpend || null,
                    pageTitle: pageTitle || null,
                    result: JSON.stringify(auditResult),
                    tokensUsed,
                    costEstimate,
                },
            });

            // Auto-create a Business record if user doesn't have one for this domain yet
            // This way they don't have to re-enter business info in onboarding
            const existingBiz = await prisma.business.findFirst({
                where: { userId: session.id, website: url },
            });
            if (!existingBiz) {
                const bizCount = await prisma.business.count({ where: { userId: session.id } });
                const sub = await prisma.subscription.findUnique({ where: { userId: session.id }, select: { adsAccountsLimit: true } });
                const limit = sub?.adsAccountsLimit || 1;
                if (bizCount < limit) {
                    await prisma.business.create({
                        data: {
                            userId: session.id,
                            name: businessName,
                            website: url,
                            industry: industry || null,
                        },
                    });
                }
            }

            // Save crawled page content as a KB item so the AI has context
            if (pageContent && pageContent.length > 50 && !fetchError) {
                const biz = existingBiz || await prisma.business.findFirst({
                    where: { userId: session.id, website: url },
                });
                if (biz) {
                    const existingKB = await prisma.knowledgeBaseItem.findFirst({
                        where: { businessId: biz.id, title: "Website Content (from audit)" },
                    });
                    if (!existingKB) {
                        await prisma.knowledgeBaseItem.create({
                            data: {
                                businessId: biz.id,
                                userId: session.id,
                                title: "Website Content (from audit)",
                                content: pageContent.slice(0, 10000),
                                type: "text",
                            },
                        });
                    }
                }
            }
        } catch (dbErr) {
            console.warn("[Audit] Failed to persist report to DB:", dbErr);
            // Non-fatal — continue returning the result inline
        }

        return NextResponse.json({
            auditId,
            result: auditResult,
            websiteUrl: url,
            businessName,
            industry,
            email,
            monthlySpend,
            pageTitle,
            tokensUsed,
            costEstimate,
            createdAt: new Date().toISOString(),
        });
    } catch (error: any) {
        console.error("Audit error:", error);
        return NextResponse.json(
            { error: "Failed to generate audit. Please try again." },
            { status: 500 }
        );
    }
}
