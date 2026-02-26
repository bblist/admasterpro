/**
 * Website Crawl API
 *
 * POST — Crawl a URL, extract content, and store in Knowledge Base
 *
 * Body: { url: string, businessId: string, depth?: number }
 * - url: The website URL to crawl
 * - businessId: Business to associate the KB item with
 * - depth: Number of sub-pages to follow (default 3, max 10)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionDual } from "@/lib/session";
import { checkCSRF } from "@/lib/csrf";
import { apiLimiter, checkRateLimit } from "@/lib/rate-limit";

// ── Blocked hosts ─────────────────────────────────────────────────────────────
const BLOCKED_HOST_PATTERNS = [
    /localhost/i, /127\.0\.0\.1/, /0\.0\.0\.0/, /\[::1\]/,
    /\.internal$/i, /\.local$/i, /10\.\d+\.\d+\.\d+/, /192\.168\./,
    /172\.(1[6-9]|2\d|3[01])\./, /169\.254\./, /metadata\.google/,
];

function isBlockedUrl(urlStr: string): boolean {
    try {
        const u = new URL(urlStr);
        if (u.protocol !== "http:" && u.protocol !== "https:") return true;
        return BLOCKED_HOST_PATTERNS.some(p => p.test(u.hostname));
    } catch { return true; }
}

// ── Scrape a single page ──────────────────────────────────────────────────────

const USER_AGENTS = [
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
];

async function fetchWithRetry(url: string, retries = 2): Promise<Response | null> {
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 20000);
            const res = await fetch(url, {
                signal: controller.signal,
                headers: {
                    "User-Agent": USER_AGENTS[attempt % USER_AGENTS.length],
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                    "Accept-Language": "en-US,en;q=0.9",
                    "Accept-Encoding": "gzip, deflate, br",
                    "Connection": "keep-alive",
                    "Cache-Control": "no-cache",
                },
                redirect: "follow",
            });
            clearTimeout(timeout);
            if (res.ok) return res;
            // If we get a 403/503, retry with next UA
            if (attempt < retries && (res.status === 403 || res.status === 503 || res.status >= 500)) continue;
            return res; // Return non-ok response so caller can check
        } catch (err) {
            if (attempt === retries) return null;
            // Wait a bit before retry
            await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        }
    }
    return null;
}

async function scrapePage(url: string): Promise<{
    title: string;
    description: string;
    content: string;
    links: string[];
    success: boolean;
}> {
    if (isBlockedUrl(url)) return { title: "", description: "", content: "", links: [], success: false };

    try {
        const res = await fetchWithRetry(url);

        if (!res || !res.ok) return { title: "", description: "", content: "", links: [], success: false };

        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("text/html") && !contentType.includes("text/plain")) {
            return { title: "", description: "", content: "", links: [], success: false };
        }

        const html = await res.text();

        // Extract title
        const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        const title = titleMatch ? titleMatch[1].replace(/\s+/g, " ").trim() : "";

        // Extract meta description
        const metaDescMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
            || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
        const description = metaDescMatch ? metaDescMatch[1] : "";

        // Extract all internal links
        const baseUrl = new URL(url);
        const linkRegex = /href=["']([^"'#]+)["']/gi;
        const links: string[] = [];
        let linkMatch;
        while ((linkMatch = linkRegex.exec(html)) !== null) {
            try {
                const href = linkMatch[1];
                if (href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) continue;
                const resolved = new URL(href, url);
                // Only follow same-domain links
                if (resolved.hostname === baseUrl.hostname && !links.includes(resolved.href)) {
                    // Skip common non-content paths
                    if (/\.(pdf|jpg|jpeg|png|gif|svg|css|js|woff|woff2|ico|xml|json)$/i.test(resolved.pathname)) continue;
                    if (/\/(wp-admin|wp-includes|cgi-bin|\.well-known)\//i.test(resolved.pathname)) continue;
                    links.push(resolved.href);
                }
            } catch { /* invalid URL, skip */ }
        }

        // Extract text content — strip scripts, styles, nav, footer, header
        const textContent = html
            .replace(/<script[\s\S]*?<\/script>/gi, "")
            .replace(/<style[\s\S]*?<\/style>/gi, "")
            .replace(/<nav[\s\S]*?<\/nav>/gi, "")
            .replace(/<footer[\s\S]*?<\/footer>/gi, "")
            .replace(/<header[\s\S]*?<\/header>/gi, "")
            .replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
            // Extract meaningful sections
            .replace(/<(h[1-6])[^>]*>(.*?)<\/\1>/gi, "\n## $2\n")
            .replace(/<(li)[^>]*>(.*?)<\/li>/gi, "• $2\n")
            .replace(/<(p|div|section|article|main)[^>]*>/gi, "\n")
            .replace(/<br\s*\/?>/gi, "\n")
            .replace(/<[^>]+>/g, " ")
            .replace(/&nbsp;/g, " ")
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&#\d+;/g, "")
            .replace(/\s+/g, " ")
            .replace(/\n\s+/g, "\n")
            .replace(/\n{3,}/g, "\n\n")
            .trim();

        return {
            title,
            description,
            content: textContent.slice(0, 15000),
            links: links.slice(0, 50),
            success: true,
        };
    } catch (err) {
        console.error(`[Crawl] Error scraping ${url}:`, err);
        return { title: "", description: "", content: "", links: [], success: false };
    }
}

// ── POST handler ──────────────────────────────────────────────────────────────
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
        let { url, businessId, depth = 3 } = body;

        if (!url || typeof url !== "string") {
            return NextResponse.json({ error: "url is required" }, { status: 400 });
        }

        // Normalize URL — strip trailing slashes, ensure https://
        url = url.trim().replace(/\/+$/, "");
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            url = "https://" + url;
        }
        // Remove www. for canonical form, we'll try both
        const canonicalUrl = url.replace(/^(https?:\/\/)www\./i, "$1");

        if (isBlockedUrl(canonicalUrl)) {
            return NextResponse.json({ error: "URL is not allowed" }, { status: 400 });
        }

        depth = Math.min(Math.max(1, Number(depth) || 3), 10);

        // Verify business ownership
        if (businessId) {
            const biz = await prisma.business.findFirst({
                where: { id: businessId, userId: session.id },
            });
            if (!biz) {
                return NextResponse.json({ error: "Business not found" }, { status: 404 });
            }
        }

        // ── Crawl the main page — try canonical, then www variant ───────────
        let mainResult = await scrapePage(canonicalUrl);
        let finalUrl = canonicalUrl;

        if (!mainResult.success) {
            // Try with www. prefix
            const wwwUrl = canonicalUrl.replace(/^(https?:\/\/)/i, "$1www.");
            mainResult = await scrapePage(wwwUrl);
            if (mainResult.success) {
                finalUrl = wwwUrl;
            } else {
                // Last resort: try http:// instead of https://
                const httpUrl = canonicalUrl.replace(/^https:\/\//i, "http://");
                mainResult = await scrapePage(httpUrl);
                if (mainResult.success) {
                    finalUrl = httpUrl;
                }
            }
        }

        if (!mainResult.success) {
            return NextResponse.json({
                error: "Failed to crawl the website. The site may be blocking automated requests. Try adding content manually in the Knowledge Base.",
                url: canonicalUrl,
            }, { status: 422 });
        }

        url = finalUrl;  // Use the URL that worked

        // ── Crawl sub-pages ─────────────────────────────────────────────────
        const allPages: { url: string; title: string; content: string }[] = [
            { url, title: mainResult.title, content: mainResult.content },
        ];
        const visited = new Set([url]);

        // Prioritize important pages
        const priorityPatterns = [/about/i, /services/i, /products/i, /team/i, /contact/i, /pricing/i, /faq/i, /portfolio/i];
        const sortedLinks = [...mainResult.links].sort((a, b) => {
            const aScore = priorityPatterns.findIndex(p => p.test(a));
            const bScore = priorityPatterns.findIndex(p => p.test(b));
            if (aScore >= 0 && bScore < 0) return -1;
            if (bScore >= 0 && aScore < 0) return 1;
            return 0;
        });

        const linksToFollow = sortedLinks.filter(l => !visited.has(l)).slice(0, depth - 1);

        // Crawl sub-pages in parallel (batches of 3)
        for (let i = 0; i < linksToFollow.length; i += 3) {
            const batch = linksToFollow.slice(i, i + 3);
            const results = await Promise.all(batch.map(async (link) => {
                if (visited.has(link)) return null;
                visited.add(link);
                const result = await scrapePage(link);
                if (result.success) {
                    return { url: link, title: result.title, content: result.content };
                }
                return null;
            }));
            results.forEach(r => { if (r) allPages.push(r); });
        }

        // ── Build combined content ──────────────────────────────────────────
        const combinedContent = allPages.map(p =>
            `═══ ${p.title || p.url} ═══\nURL: ${p.url}\n\n${p.content}`
        ).join("\n\n────────────────────────────────────────\n\n");

        // ── Upsert KB item ──────────────────────────────────────────────────
        // Check if a KB item for this URL already exists
        const existing = await prisma.knowledgeBaseItem.findFirst({
            where: {
                userId: session.id,
                type: "url",
                title: url,
                businessId: businessId || null,
            },
        });

        let item;
        if (existing) {
            item = await prisma.knowledgeBaseItem.update({
                where: { id: existing.id },
                data: {
                    content: combinedContent.slice(0, 500_000),
                },
            });
        } else {
            item = await prisma.knowledgeBaseItem.create({
                data: {
                    userId: session.id,
                    businessId: businessId || null,
                    type: "url",
                    title: url,
                    content: combinedContent.slice(0, 500_000),
                },
            });
        }

        return NextResponse.json({
            success: true,
            item: {
                id: item.id,
                url,
                title: mainResult.title,
                description: mainResult.description,
                pagesFound: allPages.length,
                totalChars: combinedContent.length,
                pages: allPages.map(p => ({
                    url: p.url,
                    title: p.title,
                    content: p.content.slice(0, 3000),
                })),
                combinedContent: combinedContent.slice(0, 50_000),
            },
        });
    } catch (error) {
        console.error("[Crawl] Error:", error);
        return NextResponse.json({ error: "Crawl failed" }, { status: 500 });
    }
}
