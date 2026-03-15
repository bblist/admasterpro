/**
 * Google Ads API Client
 *
 * Handles authentication, GAQL queries, and mutations against the
 * Google Ads REST API v18.  Each user's refresh token is stored in
 * the User model; the platform-level Developer Token is in env.
 *
 * Environment variables:
 *   GOOGLE_CLIENT_ID          - OAuth client ID
 *   GOOGLE_CLIENT_SECRET      - OAuth client secret
 *   GOOGLE_ADS_DEVELOPER_TOKEN - Google Ads API developer token
 */

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const DEVELOPER_TOKEN = process.env.GOOGLE_ADS_DEVELOPER_TOKEN || "";

const ADS_API_VERSION = "v18";
const ADS_BASE = `https://googleads.googleapis.com/${ADS_API_VERSION}`;

// Allowed GAQL date range values — whitelist to prevent injection
const VALID_DATE_RANGES = new Set([
    "TODAY", "YESTERDAY", "LAST_7_DAYS", "LAST_14_DAYS", "LAST_30_DAYS",
    "LAST_BUSINESS_WEEK", "THIS_MONTH", "LAST_MONTH", "THIS_WEEK_SUN_TODAY",
    "THIS_WEEK_MON_TODAY", "LAST_WEEK_SUN_SAT", "LAST_WEEK_MON_SUN",
]);

function sanitizeDateRange(input: string): string {
    const clean = input.trim().toUpperCase();
    if (VALID_DATE_RANGES.has(clean)) return clean;
    return "LAST_30_DAYS"; // safe default
}

function sanitizeNumericId(input: string | undefined): string | null {
    if (!input) return null;
    const clean = input.replace(/[^0-9]/g, "");
    return clean.length > 0 ? clean : null;
}

function sanitizeDays(input: number): number {
    const n = Math.floor(input);
    if (isNaN(n) || n < 1 || n > 90) return 30;
    return n;
}

// ─── Token Management ───────────────────────────────────────────────────────

interface AccessTokenResult {
    access_token: string;
    expires_in: number;
}

import crypto from "crypto";
import { decrypt, isEncrypted } from "@/lib/crypto";

// Simple in-memory cache (per-process). Key = SHA-256 hash of refreshToken.
const tokenCache = new Map<string, { token: string; expiresAt: number }>();

function hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex").slice(0, 32);
}

/**
 * Transparently decrypt refresh token if encrypted, then exchange for access token.
 */
export async function getAccessToken(refreshToken: string): Promise<string> {
    // Decrypt the refresh token if it was stored encrypted
    const plainRefreshToken = isEncrypted(refreshToken) ? decrypt(refreshToken) : refreshToken;

    const cacheKey = hashToken(plainRefreshToken);
    const cached = tokenCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt - 60_000) {
        return cached.token;
    }

    const res = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            client_id: GOOGLE_CLIENT_ID,
            client_secret: GOOGLE_CLIENT_SECRET,
            refresh_token: plainRefreshToken,
            grant_type: "refresh_token",
        }),
    });

    if (!res.ok) {
        const err = await res.text();
        console.error("[GoogleAds] Token refresh failed:", err);
        throw new Error("Failed to refresh Google Ads access token");
    }

    const data: AccessTokenResult = await res.json();
    tokenCache.set(cacheKey, {
        token: data.access_token,
        expiresAt: Date.now() + data.expires_in * 1000,
    });

    return data.access_token;
}

// ─── GAQL Query ─────────────────────────────────────────────────────────────

export interface GoogleAdsRow {
    [key: string]: unknown;
}

export async function queryGoogleAds(
    refreshToken: string,
    customerId: string,
    query: string,
    loginCustomerId?: string
): Promise<GoogleAdsRow[]> {
    const accessToken = await getAccessToken(refreshToken);
    const cleanId = customerId.replace(/-/g, "");

    const headers: Record<string, string> = {
        Authorization: `Bearer ${accessToken}`,
        "developer-token": DEVELOPER_TOKEN,
        "Content-Type": "application/json",
    };
    if (loginCustomerId) {
        headers["login-customer-id"] = loginCustomerId.replace(/-/g, "");
    }

    const res = await fetch(
        `${ADS_BASE}/customers/${cleanId}/googleAds:searchStream`,
        {
            method: "POST",
            headers,
            body: JSON.stringify({ query }),
        }
    );

    if (!res.ok) {
        const err = await res.text();
        console.error("[GoogleAds] Query failed:", res.status, err);
        throw new Error(`Google Ads query failed: ${res.status}`);
    }

    const data = await res.json();
    // searchStream returns an array of result batches
    const rows: GoogleAdsRow[] = [];
    if (Array.isArray(data)) {
        for (const batch of data) {
            if (batch.results) {
                rows.push(...batch.results);
            }
        }
    }
    return rows;
}

// ─── List Accessible Accounts ───────────────────────────────────────────────

export interface GoogleAdsAccount {
    customerId: string;
    descriptiveName: string;
    currencyCode: string;
    timeZone: string;
    managerCustomerId?: string;
}

export async function listAccessibleAccounts(
    refreshToken: string
): Promise<GoogleAdsAccount[]> {
    const accessToken = await getAccessToken(refreshToken);

    const res = await fetch(
        `${ADS_BASE}/customers:listAccessibleCustomers`,
        {
            method: "GET",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "developer-token": DEVELOPER_TOKEN,
            },
        }
    );

    if (!res.ok) {
        const err = await res.text();
        console.error("[GoogleAds] listAccessibleCustomers failed:", err);
        throw new Error("Failed to list Google Ads accounts");
    }

    const data = await res.json();
    const resourceNames: string[] = data.resourceNames || [];

    // Fetch details for each account
    const accounts: GoogleAdsAccount[] = [];
    for (const rn of resourceNames.slice(0, 20)) {
        const custId = rn.replace("customers/", "");
        try {
            const rows = await queryGoogleAds(refreshToken, custId,
                `SELECT customer.id, customer.descriptive_name, customer.currency_code, customer.time_zone, customer.manager
                 FROM customer
                 LIMIT 1`
            );
            if (rows.length > 0) {
                const cust = rows[0].customer as Record<string, unknown>;
                if (!(cust?.manager)) {
                    accounts.push({
                        customerId: String(cust.id),
                        descriptiveName: String(cust.descriptiveName || "Unnamed Account"),
                        currencyCode: String(cust.currencyCode || "USD"),
                        timeZone: String(cust.timeZone || "America/New_York"),
                    });
                }
            }
        } catch {
            // Skip accounts we can't access
        }
    }

    return accounts;
}

// ─── Campaign Queries ───────────────────────────────────────────────────────

export interface CampaignData {
    id: string;
    name: string;
    status: string;
    type: string;
    biddingStrategy: string;
    budget: number; // daily budget in account currency
    impressions: number;
    clicks: number;
    cost: number; // in account currency
    conversions: number;
    conversionValue: number;
    ctr: number;
    avgCpc: number;
    costPerConversion: number;
}

export async function getCampaigns(
    refreshToken: string,
    customerId: string,
    dateRange: string = "LAST_30_DAYS"
): Promise<CampaignData[]> {
    const safeDateRange = sanitizeDateRange(dateRange);
    const query = `
        SELECT
            campaign.id,
            campaign.name,
            campaign.status,
            campaign.advertising_channel_type,
            campaign.bidding_strategy_type,
            campaign_budget.amount_micros,
            metrics.impressions,
            metrics.clicks,
            metrics.cost_micros,
            metrics.conversions,
            metrics.conversions_value,
            metrics.ctr,
            metrics.average_cpc,
            metrics.cost_per_conversion
        FROM campaign
        WHERE campaign.status != 'REMOVED'
            AND segments.date DURING ${safeDateRange}
        ORDER BY metrics.cost_micros DESC
        LIMIT 50
    `;

    const rows = await queryGoogleAds(refreshToken, customerId, query);

    return rows.map((row) => {
        const c = row.campaign as Record<string, unknown>;
        const m = row.metrics as Record<string, unknown>;
        const b = row.campaignBudget as Record<string, unknown>;
        return {
            id: String(c?.id || ""),
            name: String(c?.name || "Unknown"),
            status: String(c?.status || "UNKNOWN"),
            type: formatChannelType(String(c?.advertisingChannelType || "")),
            biddingStrategy: formatBiddingStrategy(String(c?.biddingStrategyType || "")),
            budget: microsToCurrency(b?.amountMicros),
            impressions: Number(m?.impressions || 0),
            clicks: Number(m?.clicks || 0),
            cost: microsToCurrency(m?.costMicros),
            conversions: Number(m?.conversions || 0),
            conversionValue: Number(m?.conversionsValue || 0),
            ctr: Number(m?.ctr || 0),
            avgCpc: microsToCurrency(m?.averageCpc),
            costPerConversion: microsToCurrency(m?.costPerConversion),
        };
    });
}

// ─── Keyword Queries ────────────────────────────────────────────────────────

export interface KeywordData {
    id: string;
    adGroupId: string;
    adGroupName: string;
    campaignName: string;
    keyword: string;
    matchType: string;
    status: string;
    qualityScore: number;
    impressions: number;
    clicks: number;
    cost: number;
    conversions: number;
    ctr: number;
    avgCpc: number;
    avgPosition: number;
}

export async function getKeywords(
    refreshToken: string,
    customerId: string,
    dateRange: string = "LAST_30_DAYS",
    campaignId?: string
): Promise<KeywordData[]> {
    const safeDateRange = sanitizeDateRange(dateRange);
    let filter = `ad_group_criterion.status != 'REMOVED' AND segments.date DURING ${safeDateRange}`;
    const safeCampaignId = sanitizeNumericId(campaignId);
    if (safeCampaignId) filter += ` AND campaign.id = ${safeCampaignId}`;

    const query = `
        SELECT
            ad_group_criterion.criterion_id,
            ad_group.id,
            ad_group.name,
            campaign.name,
            ad_group_criterion.keyword.text,
            ad_group_criterion.keyword.match_type,
            ad_group_criterion.status,
            ad_group_criterion.quality_info.quality_score,
            metrics.impressions,
            metrics.clicks,
            metrics.cost_micros,
            metrics.conversions,
            metrics.ctr,
            metrics.average_cpc
        FROM keyword_view
        WHERE ${filter}
        ORDER BY metrics.cost_micros DESC
        LIMIT 200
    `;

    const rows = await queryGoogleAds(refreshToken, customerId, query);

    return rows.map((row) => {
        const crit = row.adGroupCriterion as Record<string, unknown>;
        const kw = (crit?.keyword as Record<string, unknown>) || {};
        const qi = (crit?.qualityInfo as Record<string, unknown>) || {};
        const ag = row.adGroup as Record<string, unknown>;
        const camp = row.campaign as Record<string, unknown>;
        const m = row.metrics as Record<string, unknown>;
        return {
            id: String(crit?.criterionId || ""),
            adGroupId: String(ag?.id || ""),
            adGroupName: String(ag?.name || ""),
            campaignName: String(camp?.name || ""),
            keyword: String(kw?.text || ""),
            matchType: String(kw?.matchType || "UNSPECIFIED"),
            status: String(crit?.status || ""),
            qualityScore: Number(qi?.qualityScore || 0),
            impressions: Number(m?.impressions || 0),
            clicks: Number(m?.clicks || 0),
            cost: microsToCurrency(m?.costMicros),
            conversions: Number(m?.conversions || 0),
            ctr: Number(m?.ctr || 0),
            avgCpc: microsToCurrency(m?.averageCpc),
            avgPosition: 0,
        };
    });
}

// ─── Performance Over Time ──────────────────────────────────────────────────

export interface DailyPerformance {
    date: string;
    impressions: number;
    clicks: number;
    cost: number;
    conversions: number;
    ctr: number;
}

export async function getDailyPerformance(
    refreshToken: string,
    customerId: string,
    days: number = 30
): Promise<DailyPerformance[]> {
    const safeDays = sanitizeDays(days);
    const query = `
        SELECT
            segments.date,
            metrics.impressions,
            metrics.clicks,
            metrics.cost_micros,
            metrics.conversions,
            metrics.ctr
        FROM customer
        WHERE segments.date DURING LAST_${safeDays}_DAYS
        ORDER BY segments.date ASC
    `;

    const rows = await queryGoogleAds(refreshToken, customerId, query);

    return rows.map((row) => {
        const seg = row.segments as Record<string, unknown>;
        const m = row.metrics as Record<string, unknown>;
        return {
            date: String(seg?.date || ""),
            impressions: Number(m?.impressions || 0),
            clicks: Number(m?.clicks || 0),
            cost: microsToCurrency(m?.costMicros),
            conversions: Number(m?.conversions || 0),
            ctr: Number(m?.ctr || 0),
        };
    });
}

// ─── Call Tracking ──────────────────────────────────────────────────────────

export interface CallData {
    date: string;
    campaignName: string;
    callerNumber: string;
    callDuration: number; // seconds
    callType: string;
    callStatus: string;
}

export async function getCallDetails(
    refreshToken: string,
    customerId: string,
    dateRange: string = "LAST_30_DAYS"
): Promise<CallData[]> {
    const safeDateRange = sanitizeDateRange(dateRange);
    const query = `
        SELECT
            segments.date,
            campaign.name,
            call_view.caller_area_code,
            call_view.call_duration_seconds,
            call_view.call_tracking_display_location,
            call_view.call_status
        FROM call_view
        WHERE segments.date DURING ${safeDateRange}
        ORDER BY segments.date DESC
        LIMIT 100
    `;

    try {
        const rows = await queryGoogleAds(refreshToken, customerId, query);
        return rows.map((row) => {
            const seg = row.segments as Record<string, unknown>;
            const camp = row.campaign as Record<string, unknown>;
            const cv = row.callView as Record<string, unknown>;
            return {
                date: String(seg?.date || ""),
                campaignName: String(camp?.name || ""),
                callerNumber: String(cv?.callerAreaCode || "Unknown"),
                callDuration: Number(cv?.callDurationSeconds || 0),
                callType: String(cv?.callTrackingDisplayLocation || ""),
                callStatus: String(cv?.callStatus || ""),
            };
        });
    } catch {
        return []; // call_view not available for all accounts
    }
}

// ─── Account Summary ────────────────────────────────────────────────────────

export interface AccountSummary {
    impressions: number;
    clicks: number;
    cost: number;
    conversions: number;
    conversionValue: number;
    ctr: number;
    avgCpc: number;
    costPerConversion: number;
    activeCampaigns: number;
    pausedCampaigns: number;
}

export async function getAccountSummary(
    refreshToken: string,
    customerId: string,
    dateRange: string = "LAST_30_DAYS"
): Promise<AccountSummary> {
    const safeDateRange = sanitizeDateRange(dateRange);
    const query = `
        SELECT
            metrics.impressions,
            metrics.clicks,
            metrics.cost_micros,
            metrics.conversions,
            metrics.conversions_value,
            metrics.ctr,
            metrics.average_cpc,
            metrics.cost_per_conversion
        FROM customer
        WHERE segments.date DURING ${safeDateRange}
    `;

    const rows = await queryGoogleAds(refreshToken, customerId, query);
    const m = (rows[0]?.metrics as Record<string, unknown>) || {};

    // Count campaigns
    const campQuery = `
        SELECT campaign.status, metrics.impressions
        FROM campaign
        WHERE campaign.status IN ('ENABLED', 'PAUSED')
    `;
    let activeCampaigns = 0;
    let pausedCampaigns = 0;
    try {
        const campRows = await queryGoogleAds(refreshToken, customerId, campQuery);
        for (const row of campRows) {
            const c = row.campaign as Record<string, unknown>;
            if (c?.status === "ENABLED") activeCampaigns++;
            else if (c?.status === "PAUSED") pausedCampaigns++;
        }
    } catch { /* ignore */ }

    return {
        impressions: Number(m?.impressions || 0),
        clicks: Number(m?.clicks || 0),
        cost: microsToCurrency(m?.costMicros),
        conversions: Number(m?.conversions || 0),
        conversionValue: Number(m?.conversionsValue || 0),
        ctr: Number(m?.ctr || 0),
        avgCpc: microsToCurrency(m?.averageCpc),
        costPerConversion: microsToCurrency(m?.costPerConversion),
        activeCampaigns,
        pausedCampaigns,
    };
}

// ─── Mutations ──────────────────────────────────────────────────────────────

export async function mutateCampaign(
    refreshToken: string,
    customerId: string,
    operation: "pause" | "enable",
    campaignId: string
): Promise<boolean> {
    const accessToken = await getAccessToken(refreshToken);
    const cleanId = customerId.replace(/-/g, "");

    const status = operation === "pause" ? "PAUSED" : "ENABLED";

    const res = await fetch(
        `${ADS_BASE}/customers/${cleanId}/campaigns:mutate`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "developer-token": DEVELOPER_TOKEN,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                operations: [
                    {
                        update: {
                            resourceName: `customers/${cleanId}/campaigns/${campaignId}`,
                            status,
                        },
                        updateMask: "status",
                    },
                ],
            }),
        }
    );

    if (!res.ok) {
        const err = await res.text();
        console.error("[GoogleAds] Campaign mutate failed:", err);
        return false;
    }
    return true;
}

export async function mutateKeyword(
    refreshToken: string,
    customerId: string,
    operation: "pause" | "enable" | "remove",
    adGroupId: string,
    criterionId: string
): Promise<boolean> {
    const accessToken = await getAccessToken(refreshToken);
    const cleanId = customerId.replace(/-/g, "");

    const status = operation === "pause" ? "PAUSED" : operation === "enable" ? "ENABLED" : "REMOVED";

    const res = await fetch(
        `${ADS_BASE}/customers/${cleanId}/adGroupCriteria:mutate`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "developer-token": DEVELOPER_TOKEN,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                operations: [
                    {
                        update: {
                            resourceName: `customers/${cleanId}/adGroupCriteria/${adGroupId}~${criterionId}`,
                            status,
                        },
                        updateMask: "status",
                    },
                ],
            }),
        }
    );

    if (!res.ok) {
        const err = await res.text();
        console.error("[GoogleAds] Keyword mutate failed:", err);
        return false;
    }
    return true;
}

// ─── Search Terms Report (Money Leaks) ──────────────────────────────────────

export interface SearchTermData {
    searchTerm: string;
    campaignName: string;
    adGroupName: string;
    impressions: number;
    clicks: number;
    cost: number;
    conversions: number;
    ctr: number;
}

export async function getSearchTerms(
    refreshToken: string,
    customerId: string,
    dateRange: string = "LAST_30_DAYS"
): Promise<SearchTermData[]> {
    const safeDateRange = sanitizeDateRange(dateRange);
    const query = `
        SELECT
            search_term_view.search_term,
            campaign.name,
            ad_group.name,
            metrics.impressions,
            metrics.clicks,
            metrics.cost_micros,
            metrics.conversions,
            metrics.ctr
        FROM search_term_view
        WHERE segments.date DURING ${safeDateRange}
        ORDER BY metrics.cost_micros DESC
        LIMIT 100
    `;

    const rows = await queryGoogleAds(refreshToken, customerId, query);

    return rows.map((row) => {
        const st = row.searchTermView as Record<string, unknown>;
        const camp = row.campaign as Record<string, unknown>;
        const ag = row.adGroup as Record<string, unknown>;
        const m = row.metrics as Record<string, unknown>;
        return {
            searchTerm: String(st?.searchTerm || ""),
            campaignName: String(camp?.name || ""),
            adGroupName: String(ag?.name || ""),
            impressions: Number(m?.impressions || 0),
            clicks: Number(m?.clicks || 0),
            cost: microsToCurrency(m?.costMicros),
            conversions: Number(m?.conversions || 0),
            ctr: Number(m?.ctr || 0),
        };
    });
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function microsToCurrency(micros: unknown): number {
    const val = Number(micros || 0);
    return val / 1_000_000;
}

function formatChannelType(type: string): string {
    const map: Record<string, string> = {
        SEARCH: "Search",
        DISPLAY: "Display",
        SHOPPING: "Shopping",
        VIDEO: "Video",
        PERFORMANCE_MAX: "Performance Max",
        MULTI_CHANNEL: "Multi-Channel",
        LOCAL: "Local",
        SMART: "Smart",
        DEMAND_GEN: "Demand Gen",
    };
    return map[type] || type;
}

function formatBiddingStrategy(type: string): string {
    const map: Record<string, string> = {
        MAXIMIZE_CONVERSIONS: "Max Conversions",
        MAXIMIZE_CONVERSION_VALUE: "Max Conv. Value",
        TARGET_CPA: "Target CPA",
        TARGET_ROAS: "Target ROAS",
        MAXIMIZE_CLICKS: "Max Clicks",
        MANUAL_CPC: "Manual CPC",
        ENHANCED_CPC: "Enhanced CPC",
        TARGET_IMPRESSION_SHARE: "Target Impression Share",
    };
    return map[type] || type;
}

// ─── Campaign Creation ──────────────────────────────────────────────────────

export interface CreateCampaignInput {
    name: string;
    type?: "SEARCH" | "DISPLAY" | "SHOPPING" | "PERFORMANCE_MAX" | "VIDEO";
    status?: "ENABLED" | "PAUSED";
    dailyBudgetMicros: number; // in micros (e.g., 50 * 1_000_000 for $50)
    biddingStrategy?: "MAXIMIZE_CONVERSIONS" | "MAXIMIZE_CLICKS" | "TARGET_CPA" | "TARGET_ROAS" | "MANUAL_CPC";
    targetCpaMicros?: number;
    targetRoas?: number;
    networkSettings?: {
        targetGoogleSearch?: boolean;
        targetSearchNetwork?: boolean;
        targetContentNetwork?: boolean;
    };
}

/**
 * Create a campaign budget and then a campaign in Google Ads.
 * Returns the new campaign resource name or null on failure.
 */
export async function createCampaign(
    refreshToken: string,
    customerId: string,
    input: CreateCampaignInput
): Promise<{ campaignResourceName: string; budgetResourceName: string } | null> {
    const accessToken = await getAccessToken(refreshToken);
    const cleanId = customerId.replace(/-/g, "");

    // Step 1: Create campaign budget
    const budgetRes = await fetch(
        `${ADS_BASE}/customers/${cleanId}/campaignBudgets:mutate`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "developer-token": DEVELOPER_TOKEN,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                operations: [
                    {
                        create: {
                            name: `${input.name} Budget`,
                            amountMicros: String(input.dailyBudgetMicros),
                            deliveryMethod: "STANDARD",
                        },
                    },
                ],
            }),
        }
    );

    if (!budgetRes.ok) {
        const err = await budgetRes.text();
        console.error("[GoogleAds] Budget create failed:", err);
        return null;
    }

    const budgetData = await budgetRes.json();
    const budgetResourceName = budgetData?.results?.[0]?.resourceName;
    if (!budgetResourceName) {
        console.error("[GoogleAds] No budget resource name returned");
        return null;
    }

    // Step 2: Create campaign
    const campaignType = input.type || "SEARCH";
    const biddingConfig: Record<string, unknown> = {};

    switch (input.biddingStrategy || "MAXIMIZE_CONVERSIONS") {
        case "MAXIMIZE_CONVERSIONS":
            biddingConfig.maximizeConversions = input.targetCpaMicros
                ? { targetCpaMicros: String(input.targetCpaMicros) }
                : {};
            break;
        case "MAXIMIZE_CLICKS":
            biddingConfig.maximizeClicks = {};
            break;
        case "TARGET_CPA":
            biddingConfig.targetCpa = { targetCpaMicros: String(input.targetCpaMicros || 0) };
            break;
        case "TARGET_ROAS":
            biddingConfig.targetRoas = { targetRoas: input.targetRoas || 1.0 };
            break;
        case "MANUAL_CPC":
            biddingConfig.manualCpc = { enhancedCpcEnabled: true };
            break;
    }

    const networkSettings = {
        targetGoogleSearch: input.networkSettings?.targetGoogleSearch ?? true,
        targetSearchNetwork: input.networkSettings?.targetSearchNetwork ?? true,
        targetContentNetwork: input.networkSettings?.targetContentNetwork ?? false,
    };

    const campaignRes = await fetch(
        `${ADS_BASE}/customers/${cleanId}/campaigns:mutate`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "developer-token": DEVELOPER_TOKEN,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                operations: [
                    {
                        create: {
                            name: input.name,
                            status: input.status || "PAUSED",
                            advertisingChannelType: campaignType,
                            campaignBudget: budgetResourceName,
                            networkSettings: campaignType === "SEARCH" ? networkSettings : undefined,
                            ...biddingConfig,
                        },
                    },
                ],
            }),
        }
    );

    if (!campaignRes.ok) {
        const err = await campaignRes.text();
        console.error("[GoogleAds] Campaign create failed:", err);
        return null;
    }

    const campaignData = await campaignRes.json();
    const campaignResourceName = campaignData?.results?.[0]?.resourceName;

    return {
        campaignResourceName: campaignResourceName || "",
        budgetResourceName,
    };
}

// ─── Ad Group Creation ──────────────────────────────────────────────────────

export interface CreateAdGroupInput {
    campaignResourceName: string;
    name: string;
    status?: "ENABLED" | "PAUSED";
    cpcBidMicros?: number;
}

/**
 * Create an ad group within a campaign.
 * Returns the ad group resource name or null on failure.
 */
export async function createAdGroup(
    refreshToken: string,
    customerId: string,
    input: CreateAdGroupInput
): Promise<string | null> {
    const accessToken = await getAccessToken(refreshToken);
    const cleanId = customerId.replace(/-/g, "");

    const res = await fetch(
        `${ADS_BASE}/customers/${cleanId}/adGroups:mutate`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "developer-token": DEVELOPER_TOKEN,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                operations: [
                    {
                        create: {
                            name: input.name,
                            campaign: input.campaignResourceName,
                            status: input.status || "ENABLED",
                            type: "SEARCH_STANDARD",
                            cpcBidMicros: input.cpcBidMicros ? String(input.cpcBidMicros) : undefined,
                        },
                    },
                ],
            }),
        }
    );

    if (!res.ok) {
        const err = await res.text();
        console.error("[GoogleAds] Ad group create failed:", err);
        return null;
    }

    const data = await res.json();
    return data?.results?.[0]?.resourceName || null;
}

// ─── Ad (RSA) Creation ──────────────────────────────────────────────────────

export interface CreateAdInput {
    adGroupResourceName: string;
    finalUrl: string;
    headlines: string[]; // max 15, each max 30 chars
    descriptions: string[]; // max 4, each max 90 chars
    path1?: string; // max 15 chars
    path2?: string; // max 15 chars
}

/**
 * Create a Responsive Search Ad in an ad group.
 * Returns the ad group ad resource name or null on failure.
 */
export async function createResponsiveSearchAd(
    refreshToken: string,
    customerId: string,
    input: CreateAdInput
): Promise<string | null> {
    const accessToken = await getAccessToken(refreshToken);
    const cleanId = customerId.replace(/-/g, "");

    const headlines = input.headlines.slice(0, 15).map(text => ({
        text: text.slice(0, 30),
    }));

    const descriptions = input.descriptions.slice(0, 4).map(text => ({
        text: text.slice(0, 90),
    }));

    const res = await fetch(
        `${ADS_BASE}/customers/${cleanId}/adGroupAds:mutate`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "developer-token": DEVELOPER_TOKEN,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                operations: [
                    {
                        create: {
                            adGroup: input.adGroupResourceName,
                            status: "ENABLED",
                            ad: {
                                finalUrls: [input.finalUrl],
                                responsiveSearchAd: {
                                    headlines,
                                    descriptions,
                                    path1: input.path1?.slice(0, 15) || undefined,
                                    path2: input.path2?.slice(0, 15) || undefined,
                                },
                            },
                        },
                    },
                ],
            }),
        }
    );

    if (!res.ok) {
        const err = await res.text();
        console.error("[GoogleAds] RSA create failed:", err);
        return null;
    }

    const data = await res.json();
    return data?.results?.[0]?.resourceName || null;
}

// ─── Keyword Addition ───────────────────────────────────────────────────────

export interface AddKeywordInput {
    adGroupResourceName: string;
    keyword: string;
    matchType: "BROAD" | "PHRASE" | "EXACT";
}

/**
 * Add keywords to an ad group.
 * Returns the number of successfully added keywords.
 */
export async function addKeywords(
    refreshToken: string,
    customerId: string,
    keywords: AddKeywordInput[]
): Promise<number> {
    const accessToken = await getAccessToken(refreshToken);
    const cleanId = customerId.replace(/-/g, "");

    const operations = keywords.map(kw => ({
        create: {
            adGroup: kw.adGroupResourceName,
            status: "ENABLED",
            keyword: {
                text: kw.keyword,
                matchType: kw.matchType,
            },
        },
    }));

    const res = await fetch(
        `${ADS_BASE}/customers/${cleanId}/adGroupCriteria:mutate`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "developer-token": DEVELOPER_TOKEN,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ operations }),
        }
    );

    if (!res.ok) {
        const err = await res.text();
        console.error("[GoogleAds] Keywords add failed:", err);
        return 0;
    }

    const data = await res.json();
    return data?.results?.length || 0;
}

// ─── Check if Google Ads is configured ──────────────────────────────────────

export function isGoogleAdsConfigured(): boolean {
    return !!(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET && DEVELOPER_TOKEN);
}

// ─── Device Performance ─────────────────────────────────────────────────────

export interface DevicePerformance {
    device: string;
    impressions: number;
    clicks: number;
    cost: number;
    conversions: number;
    ctr: number;
}

export async function getDevicePerformance(
    refreshToken: string,
    customerId: string,
    dateRange: string = "LAST_30_DAYS"
): Promise<DevicePerformance[]> {
    const safeDateRange = sanitizeDateRange(dateRange);
    const query = `
        SELECT
            segments.device,
            metrics.impressions,
            metrics.clicks,
            metrics.cost_micros,
            metrics.conversions,
            metrics.ctr
        FROM campaign
        WHERE segments.date DURING ${safeDateRange}
            AND campaign.status = 'ENABLED'
    `;
    const rows = await queryGoogleAds(refreshToken, customerId, query);
    const deviceMap = new Map<string, DevicePerformance>();
    for (const row of rows) {
        const seg = row.segments as Record<string, unknown>;
        const m = row.metrics as Record<string, unknown>;
        const device = formatDevice(String(seg?.device || "OTHER"));
        const existing = deviceMap.get(device) || { device, impressions: 0, clicks: 0, cost: 0, conversions: 0, ctr: 0 };
        existing.impressions += Number(m?.impressions || 0);
        existing.clicks += Number(m?.clicks || 0);
        existing.cost += microsToCurrency(m?.costMicros);
        existing.conversions += Number(m?.conversions || 0);
        deviceMap.set(device, existing);
    }
    return Array.from(deviceMap.values()).map(d => ({
        ...d,
        ctr: d.impressions > 0 ? d.clicks / d.impressions : 0,
    }));
}

function formatDevice(d: string): string {
    const map: Record<string, string> = {
        MOBILE: "Mobile", DESKTOP: "Desktop", TABLET: "Tablet",
        CONNECTED_TV: "Connected TV", OTHER: "Other",
    };
    return map[d] || d;
}

// ─── Geographic Performance ─────────────────────────────────────────────────

export interface GeoPerformance {
    country: string;
    region: string;
    impressions: number;
    clicks: number;
    cost: number;
    conversions: number;
    ctr: number;
}

export async function getGeoPerformance(
    refreshToken: string,
    customerId: string,
    dateRange: string = "LAST_30_DAYS"
): Promise<GeoPerformance[]> {
    const safeDateRange = sanitizeDateRange(dateRange);
    const query = `
        SELECT
            geographic_view.country_criterion_id,
            geographic_view.location_type,
            campaign_criterion.location.geo_target_constant,
            metrics.impressions,
            metrics.clicks,
            metrics.cost_micros,
            metrics.conversions,
            metrics.ctr
        FROM geographic_view
        WHERE segments.date DURING ${safeDateRange}
        ORDER BY metrics.cost_micros DESC
        LIMIT 50
    `;
    try {
        const rows = await queryGoogleAds(refreshToken, customerId, query);
        return rows.map(row => {
            const geo = row.geographicView as Record<string, unknown>;
            const m = row.metrics as Record<string, unknown>;
            return {
                country: String(geo?.countryCriterionId || "Unknown"),
                region: String(geo?.locationType || "Unknown"),
                impressions: Number(m?.impressions || 0),
                clicks: Number(m?.clicks || 0),
                cost: microsToCurrency(m?.costMicros),
                conversions: Number(m?.conversions || 0),
                ctr: Number(m?.ctr || 0),
            };
        });
    } catch { return []; }
}

// ─── Hour-of-Day Performance ────────────────────────────────────────────────

export interface HourPerformance {
    hour: number;
    impressions: number;
    clicks: number;
    cost: number;
    conversions: number;
    ctr: number;
}

export async function getHourPerformance(
    refreshToken: string,
    customerId: string,
    dateRange: string = "LAST_30_DAYS"
): Promise<HourPerformance[]> {
    const safeDateRange = sanitizeDateRange(dateRange);
    const query = `
        SELECT
            segments.hour,
            metrics.impressions,
            metrics.clicks,
            metrics.cost_micros,
            metrics.conversions,
            metrics.ctr
        FROM campaign
        WHERE segments.date DURING ${safeDateRange}
            AND campaign.status = 'ENABLED'
    `;
    try {
        const rows = await queryGoogleAds(refreshToken, customerId, query);
        const hourMap = new Map<number, HourPerformance>();
        for (const row of rows) {
            const seg = row.segments as Record<string, unknown>;
            const m = row.metrics as Record<string, unknown>;
            const hour = Number(seg?.hour || 0);
            const existing = hourMap.get(hour) || { hour, impressions: 0, clicks: 0, cost: 0, conversions: 0, ctr: 0 };
            existing.impressions += Number(m?.impressions || 0);
            existing.clicks += Number(m?.clicks || 0);
            existing.cost += microsToCurrency(m?.costMicros);
            existing.conversions += Number(m?.conversions || 0);
            hourMap.set(hour, existing);
        }
        return Array.from(hourMap.values())
            .map(h => ({ ...h, ctr: h.impressions > 0 ? h.clicks / h.impressions : 0 }))
            .sort((a, b) => a.hour - b.hour);
    } catch { return []; }
}

// ─── Day-of-Week Performance ────────────────────────────────────────────────

export interface DayOfWeekPerformance {
    dayOfWeek: string;
    impressions: number;
    clicks: number;
    cost: number;
    conversions: number;
    ctr: number;
}

export async function getDayOfWeekPerformance(
    refreshToken: string,
    customerId: string,
    dateRange: string = "LAST_30_DAYS"
): Promise<DayOfWeekPerformance[]> {
    const safeDateRange = sanitizeDateRange(dateRange);
    const query = `
        SELECT
            segments.day_of_week,
            metrics.impressions,
            metrics.clicks,
            metrics.cost_micros,
            metrics.conversions,
            metrics.ctr
        FROM campaign
        WHERE segments.date DURING ${safeDateRange}
            AND campaign.status = 'ENABLED'
    `;
    try {
        const rows = await queryGoogleAds(refreshToken, customerId, query);
        const dayMap = new Map<string, DayOfWeekPerformance>();
        for (const row of rows) {
            const seg = row.segments as Record<string, unknown>;
            const m = row.metrics as Record<string, unknown>;
            const day = String(seg?.dayOfWeek || "UNKNOWN");
            const existing = dayMap.get(day) || { dayOfWeek: day, impressions: 0, clicks: 0, cost: 0, conversions: 0, ctr: 0 };
            existing.impressions += Number(m?.impressions || 0);
            existing.clicks += Number(m?.clicks || 0);
            existing.cost += microsToCurrency(m?.costMicros);
            existing.conversions += Number(m?.conversions || 0);
            dayMap.set(day, existing);
        }
        const dayOrder = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
        return dayOrder
            .filter(d => dayMap.has(d))
            .map(d => {
                const data = dayMap.get(d)!;
                return { ...data, dayOfWeek: d.charAt(0) + d.slice(1).toLowerCase(), ctr: data.impressions > 0 ? data.clicks / data.impressions : 0 };
            });
    } catch { return []; }
}
