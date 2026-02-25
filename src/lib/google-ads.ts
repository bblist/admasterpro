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

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
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

// Simple in-memory cache (per-process). Key = SHA-256 hash of refreshToken.
const tokenCache = new Map<string, { token: string; expiresAt: number }>();

function hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex").slice(0, 32);
}

export async function getAccessToken(refreshToken: string): Promise<string> {
    const cacheKey = hashToken(refreshToken);
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
            refresh_token: refreshToken,
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

// ─── Check if Google Ads is configured ──────────────────────────────────────

export function isGoogleAdsConfigured(): boolean {
    return !!(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET && DEVELOPER_TOKEN);
}
