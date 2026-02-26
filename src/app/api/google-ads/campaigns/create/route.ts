/**
 * Campaign Creation API
 *
 * POST — Create a full campaign with ad groups, ads, and keywords
 *        Can be triggered from a draft or directly with raw data.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionDual } from "@/lib/session";
import { checkCSRF } from "@/lib/csrf";
import { apiLimiter, checkRateLimit } from "@/lib/rate-limit";
import {
    createCampaign,
    createAdGroup,
    createResponsiveSearchAd,
    addKeywords,
    isGoogleAdsConfigured,
    type CreateCampaignInput,
    type AddKeywordInput,
} from "@/lib/google-ads";

interface AdGroupPayload {
    name: string;
    keywords?: string[];
    matchType?: "BROAD" | "PHRASE" | "EXACT";
    headlines?: string[];
    descriptions?: string[];
    finalUrl?: string;
}

interface CreateCampaignPayload {
    name: string;
    type?: "SEARCH" | "DISPLAY" | "SHOPPING" | "PERFORMANCE_MAX" | "VIDEO";
    dailyBudget: number; // in dollars
    biddingStrategy?: string;
    targetCpa?: number; // in dollars
    targetRoas?: number;
    adGroups?: AdGroupPayload[];
    draftId?: string; // if publishing from a draft, mark it as published
    businessId?: string;
}

export async function POST(req: NextRequest) {
    const csrfError = await checkCSRF(req);
    if (csrfError) return csrfError;

    const rateLimited = checkRateLimit(req, apiLimiter);
    if (rateLimited) return rateLimited;

    const session = await getSessionDual(req);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isGoogleAdsConfigured()) {
        return NextResponse.json({ error: "Google Ads API not configured" }, { status: 503 });
    }

    try {
        const body: CreateCampaignPayload = await req.json();

        if (!body.name?.trim()) {
            return NextResponse.json({ error: "Campaign name is required" }, { status: 400 });
        }
        if (!body.dailyBudget || body.dailyBudget <= 0) {
            return NextResponse.json({ error: "Valid daily budget is required" }, { status: 400 });
        }

        // Get user's Google Ads credentials
        const user = await prisma.user.findUnique({
            where: { id: session.id },
            select: { refreshToken: true },
        });

        if (!user?.refreshToken) {
            return NextResponse.json({ error: "Not connected to Google Ads. Please connect in Settings." }, { status: 400 });
        }

        // Get customer ID
        const business = await prisma.business.findFirst({
            where: body.businessId
                ? { id: body.businessId, userId: session.id }
                : { userId: session.id, googleAdsId: { not: null } },
            select: { googleAdsId: true },
        });

        if (!business?.googleAdsId) {
            return NextResponse.json({ error: "No Google Ads account linked. Go to Settings to connect one." }, { status: 400 });
        }

        const customerId = business.googleAdsId;

        // Map campaign type
        const typeMap: Record<string, "SEARCH" | "DISPLAY" | "SHOPPING" | "PERFORMANCE_MAX" | "VIDEO"> = {
            search: "SEARCH",
            display: "DISPLAY",
            shopping: "SHOPPING",
            pmax: "PERFORMANCE_MAX",
            video: "VIDEO",
            SEARCH: "SEARCH",
            DISPLAY: "DISPLAY",
            SHOPPING: "SHOPPING",
            PERFORMANCE_MAX: "PERFORMANCE_MAX",
            VIDEO: "VIDEO",
        };

        const campaignInput: CreateCampaignInput = {
            name: body.name.trim(),
            type: typeMap[body.type || "search"] || "SEARCH",
            status: "PAUSED", // Always create as paused for safety
            dailyBudgetMicros: Math.round(body.dailyBudget * 1_000_000),
            biddingStrategy: (body.biddingStrategy as CreateCampaignInput["biddingStrategy"]) || "MAXIMIZE_CONVERSIONS",
            targetCpaMicros: body.targetCpa ? Math.round(body.targetCpa * 1_000_000) : undefined,
            targetRoas: body.targetRoas || undefined,
        };

        // Step 1: Create campaign
        const campaignResult = await createCampaign(user.refreshToken, customerId, campaignInput);

        if (!campaignResult) {
            return NextResponse.json({ error: "Failed to create campaign in Google Ads" }, { status: 500 });
        }

        const results = {
            campaign: campaignResult.campaignResourceName,
            budget: campaignResult.budgetResourceName,
            adGroups: [] as { name: string; resourceName: string; adResourceName: string | null; keywordsAdded: number }[],
        };

        // Step 2: Create ad groups with ads and keywords
        if (body.adGroups && body.adGroups.length > 0) {
            for (const ag of body.adGroups) {
                const adGroupResourceName = await createAdGroup(
                    user.refreshToken,
                    customerId,
                    {
                        campaignResourceName: campaignResult.campaignResourceName,
                        name: ag.name,
                        status: "ENABLED",
                    }
                );

                if (!adGroupResourceName) continue;

                let adResourceName: string | null = null;
                let keywordsAdded = 0;

                // Create RSA if headlines+descriptions provided
                if (ag.headlines?.length && ag.descriptions?.length && ag.finalUrl) {
                    adResourceName = await createResponsiveSearchAd(
                        user.refreshToken,
                        customerId,
                        {
                            adGroupResourceName,
                            finalUrl: ag.finalUrl,
                            headlines: ag.headlines,
                            descriptions: ag.descriptions,
                        }
                    );
                }

                // Add keywords
                if (ag.keywords?.length) {
                    const matchType = ag.matchType || "BROAD";
                    const keywordInputs: AddKeywordInput[] = ag.keywords.map(kw => ({
                        adGroupResourceName,
                        keyword: kw,
                        matchType,
                    }));
                    keywordsAdded = await addKeywords(user.refreshToken, customerId, keywordInputs);
                }

                results.adGroups.push({
                    name: ag.name,
                    resourceName: adGroupResourceName,
                    adResourceName,
                    keywordsAdded,
                });
            }
        }

        // Step 3: If from a draft, mark it as published
        if (body.draftId) {
            await prisma.campaignDraft.update({
                where: { id: body.draftId },
                data: { status: "published" },
            }).catch(() => { /* ignore if draft doesn't exist */ });
        }

        // Track usage
        await prisma.usage.create({
            data: {
                userId: session.id,
                type: "campaign_create",
                model: "google-ads-api",
                inputTokens: 0,
                outputTokens: 0,
                totalTokens: 0,
                costUsd: 0,
                metadata: JSON.stringify({
                    campaignName: body.name,
                    campaignType: body.type || "search",
                    adGroupsCreated: results.adGroups.length,
                }),
            },
        });

        return NextResponse.json({
            success: true,
            message: `Campaign "${body.name}" created successfully (paused). Enable it in your Google Ads dashboard when ready.`,
            results,
        }, { status: 201 });
    } catch (error) {
        console.error("[CampaignCreate] Error:", error);
        return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 });
    }
}
