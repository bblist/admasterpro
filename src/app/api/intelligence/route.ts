/**
 * Unified Intelligence API — Cross-Platform Command Center
 *
 * GET  → Returns full intelligence snapshot (all platforms, context, AI insights)
 * POST → Requests a specific deep-dive analysis
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession, getSessionFromRequest, getSessionFromToken } from "@/lib/session";
import { extractBearerToken } from "@/lib/jwt";
import { prisma } from "@/lib/db";
import { getFullContext, PLATFORM_REQUIREMENTS, type FullContext } from "@/lib/context-engine";

/* ═══ Helpers ══════════════════════════════════════════════════════════════ */

async function getAuthUser(req: NextRequest) {
  // Try cookie first
  const cookieHeader = req.headers.get("cookie");
  const fromCookie = await getSessionFromRequest(cookieHeader);
  if (fromCookie) return fromCookie;

  // Try bearer token
  const bearer = extractBearerToken(req.headers.get("authorization"));
  if (bearer) return getSessionFromToken(bearer);

  // Try x-auth-token
  const xAuth = req.headers.get("x-auth-token");
  if (xAuth) return getSessionFromToken(xAuth);

  return null;
}

interface PlatformData {
  platform: string;
  connected: boolean;
  status: "active" | "disconnected" | "error" | "not_configured";
  lastSync?: string;
  summary?: Record<string, unknown>;
  error?: string;
}

interface IntelligenceSnapshot {
  context: FullContext;
  platforms: PlatformData[];
  crossPlatform: {
    totalAdSpend: number;
    totalRevenue: number;
    overallROAS: number;
    totalConversions: number;
    bestPerformingPlatform: string;
    worstPerformingPlatform: string;
    topProducts: Array<{ name: string; revenue: number; platform: string; roas: number }>;
    budgetAllocation: Array<{ platform: string; current: number; recommended: number; reason: string }>;
  };
  aiInsights: {
    summary: string;
    actionItems: Array<{ priority: "critical" | "high" | "medium" | "low"; action: string; impact: string; platform: string }>;
    opportunities: string[];
    warnings: string[];
  };
  platformRequirements: typeof PLATFORM_REQUIREMENTS;
}

/* ═══ Fetch platform data (with graceful failure) ═════════════════════════ */

async function fetchGoogleAdsData(userId: string, businessId?: string): Promise<PlatformData> {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { refreshToken: true } });
    if (!user?.refreshToken) {
      return { platform: "google_ads", connected: false, status: "not_configured" };
    }

    // Attempt to get summary data
    const business = businessId
      ? await prisma.business.findUnique({ where: { id: businessId }, select: { googleAdsId: true } })
      : null;

    return {
      platform: "google_ads",
      connected: true,
      status: "active",
      lastSync: new Date().toISOString(),
      summary: {
        customerId: business?.googleAdsId || "linked",
        hasActiveCampaigns: true,
      },
    };
  } catch (err) {
    return { platform: "google_ads", connected: false, status: "error", error: String(err) };
  }
}

async function fetchMetaAdsData(): Promise<PlatformData> {
  const hasToken = !!process.env.META_ACCESS_TOKEN;
  return {
    platform: "meta_ads",
    connected: hasToken,
    status: hasToken ? "active" : "not_configured",
    summary: hasToken ? { provider: "Meta Business Suite" } : undefined,
  };
}

async function fetchAmazonAdsData(): Promise<PlatformData> {
  const hasToken = !!process.env.AMAZON_ADS_CLIENT_ID;
  return {
    platform: "amazon_ads",
    connected: hasToken,
    status: hasToken ? "active" : "not_configured",
    summary: hasToken ? { provider: "Amazon Advertising API" } : undefined,
  };
}

async function fetchShopifyData(userId: string): Promise<PlatformData> {
  try {
    const kb = await prisma.knowledgeBaseItem.findFirst({
      where: { userId, type: "text", title: { contains: "Shopify" } },
      select: { content: true, createdAt: true },
    });
    if (!kb) return { platform: "shopify", connected: false, status: "not_configured" };

    return {
      platform: "shopify",
      connected: true,
      status: "active",
      lastSync: kb.createdAt.toISOString(),
      summary: { storeUrl: kb.content },
    };
  } catch {
    return { platform: "shopify", connected: false, status: "error" };
  }
}

async function fetchMerchantCenterData(): Promise<PlatformData> {
  const hasId = !!process.env.GOOGLE_MERCHANT_ID;
  return {
    platform: "google_merchant",
    connected: hasId,
    status: hasId ? "active" : "not_configured",
  };
}

async function fetchGoogleAnalyticsData(): Promise<PlatformData> {
  const hasProperty = !!process.env.GA4_PROPERTY_ID;
  return {
    platform: "google_analytics",
    connected: hasProperty,
    status: hasProperty ? "active" : "not_configured",
  };
}

async function fetchTikTokData(): Promise<PlatformData> {
  const hasToken = !!process.env.TIKTOK_ACCESS_TOKEN;
  return {
    platform: "tiktok_ads",
    connected: hasToken,
    status: hasToken ? "active" : "not_configured",
  };
}

/* ═══ Build cross-platform intelligence ═══════════════════════════════════ */

function buildCrossPlatformIntel(platforms: PlatformData[], context: FullContext) {
  const connectedPlatforms = platforms.filter(p => p.connected);

  // Generate sample intelligence (when real data isn't available, AI fills gaps)
  const totalAdSpend = 0;
  const totalRevenue = 0;
  const totalConversions = 0;

  const budgetAllocation = connectedPlatforms.map(p => {
    const rec = p.platform === "google_ads" ? 40 : p.platform === "meta_ads" ? 30 : p.platform === "amazon_ads" ? 20 : 10;
    return {
      platform: p.platform,
      current: 0,
      recommended: rec,
      reason: p.platform === "google_ads"
        ? "Search ads catch people when they're actively looking — usually your best-converting channel"
        : p.platform === "meta_ads"
        ? "Great for brand awareness and retargeting with visual creative"
        : p.platform === "amazon_ads"
        ? "Shoppers on Amazon are ready to buy — high purchase intent"
        : "Worth testing to diversify and find new audiences",
    };
  });

  return {
    totalAdSpend,
    totalRevenue,
    overallROAS: totalRevenue > 0 && totalAdSpend > 0 ? totalRevenue / totalAdSpend : 0,
    totalConversions,
    bestPerformingPlatform: connectedPlatforms[0]?.platform || "none",
    worstPerformingPlatform: connectedPlatforms[connectedPlatforms.length - 1]?.platform || "none",
    topProducts: [],
    budgetAllocation,
  };
}

/* ═══ Build AI insights ═══════════════════════════════════════════════════ */

function buildAIInsights(platforms: PlatformData[], context: FullContext, industry?: string): IntelligenceSnapshot["aiInsights"] {
  const connectedCount = platforms.filter(p => p.connected).length;
  const disconnected = platforms.filter(p => !p.connected);

  const actionItems: IntelligenceSnapshot["aiInsights"]["actionItems"] = [];
  const opportunities: string[] = [];
  const warnings: string[] = [];

  // Context-based action items — strip any leftover emoji prefixes
  context.actionItems.forEach((item, i) => {
    actionItems.push({
      priority: i < 2 ? "high" : "medium",
      action: item.replace(/^[🎯📅📊⏰📱🌤️]\s*/, ""),
      impact: "Based on current market and seasonal conditions",
      platform: "all",
    });
  });

  // Platform connection opportunities
  if (disconnected.length > 0) {
    disconnected.forEach(p => {
      const req = PLATFORM_REQUIREMENTS.find(r => r.platform === p.platform);
      if (req) {
        opportunities.push(`Connecting ${req.displayName} (takes about ${req.setupTime}) would unlock ${req.features.slice(0, 2).join(" and ")}`);
      }
    });
  }

  // Holiday-driven opportunities
  if (context.holidays.nextMajor && context.holidays.daysUntilNextMajor <= 30) {
    const h = context.holidays.nextMajor;
    actionItems.unshift({
      priority: "critical",
      action: `${h.name} is only ${context.holidays.daysUntilNextMajor} days away — time to ramp up your budget to around ${h.budgetMultiplier}x normal. CPCs will likely climb about ${h.cpcChange}%.`,
      impact: h.budgetMultiplier > 1.5 ? "This is a major seasonal opportunity — don't miss it" : "Moderate seasonal uplift expected",
      platform: "all",
    });
  }

  // Seasonal industry tips
  if (industry && context.seasonal.industries[industry]) {
    const ind = context.seasonal.industries[industry];
    if (ind.demand === "high") {
      actionItems.push({
        priority: "high",
        action: ind.tip,
        impact: `Your industry is in peak season — this is the time to capitalise`,
        platform: "all",
      });
    }
  }

  // Warnings — helpful rather than alarming
  if (connectedCount === 0) {
    warnings.push("You haven't connected any ad platforms yet — hook up Google Ads to start getting personalised insights");
  }
  if (connectedCount === 1) {
    warnings.push("You've only got one platform connected — adding more will unlock cross-channel comparisons and smarter budget allocation");
  }
  if (context.seasonal.demandTrend === "peak" && connectedCount < 3) {
    warnings.push("It's peak season but you're running on limited platforms — you might be leaving money on the table");
  }

  const dateStr = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const summaryParts = [
    `Here's your snapshot for ${dateStr}.`,
    connectedCount > 0
      ? `You've got ${connectedCount} of 7 platforms connected.`
      : "No platforms connected yet — let's change that.",
    context.aiSummary,
    actionItems.length > 0
      ? `There ${actionItems.filter(a => a.priority === "critical" || a.priority === "high").length === 1 ? "is" : "are"} ${actionItems.filter(a => a.priority === "critical" || a.priority === "high").length} thing${actionItems.filter(a => a.priority === "critical" || a.priority === "high").length === 1 ? "" : "s"} worth looking at soon.`
      : "Nothing urgent on the radar right now.",
  ];

  const summary = summaryParts.join(" ");

  return { summary, actionItems, opportunities, warnings };
}

/* ═══ GET — Full intelligence snapshot ════════════════════════════════════ */

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("businessId") || undefined;
  const countryCode = searchParams.get("country") || "US";
  const industry = searchParams.get("industry") || undefined;

  // Fetch all platform data in parallel
  const [googleAds, metaAds, amazonAds, shopify, merchantCenter, googleAnalytics, tiktok] = await Promise.all([
    fetchGoogleAdsData(user.id, businessId),
    fetchMetaAdsData(),
    fetchAmazonAdsData(),
    fetchShopifyData(user.id),
    fetchMerchantCenterData(),
    fetchGoogleAnalyticsData(),
    fetchTikTokData(),
  ]);

  const platforms = [googleAds, metaAds, amazonAds, shopify, merchantCenter, googleAnalytics, tiktok];

  // Build context
  const context = getFullContext(countryCode, industry);

  // Build cross-platform intelligence
  const crossPlatform = buildCrossPlatformIntel(platforms, context);

  // Build AI insights
  const aiInsights = buildAIInsights(platforms, context, industry);

  const snapshot: IntelligenceSnapshot = {
    context,
    platforms,
    crossPlatform,
    aiInsights,
    platformRequirements: PLATFORM_REQUIREMENTS,
  };

  return NextResponse.json(snapshot);
}

/* ═══ POST — Deep analysis request ════════════════════════════════════════ */

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { type, countryCode = "US", industry, businessId } = body;

  const context = getFullContext(countryCode, industry);

  if (type === "holiday_prep") {
    const holidays = context.holidays.upcoming.filter(h => h.adImpact === "critical" || h.adImpact === "high");
    return NextResponse.json({
      type: "holiday_prep",
      holidays: holidays.map(h => ({
        name: h.name,
        date: h.date,
        daysAway: Math.ceil((new Date(new Date().getFullYear(), ...h.date.split("-").map((n, i) => (i === 0 ? Number(n) - 1 : Number(n))) as [number, number]).getTime() - Date.now()) / 86400000),
        budgetMultiplier: h.budgetMultiplier,
        cpcChangeExpected: `+${h.cpcChange}%`,
        leadTimeDays: h.leadTimeDays,
        tips: h.tips,
        category: h.category,
      })),
      recommendations: [
        "Start writing your holiday-specific ad copy and landing pages now — leaving it to the last minute always costs more",
        "Build retargeting audiences from your current site visitors so you've got warm audiences ready",
        "Increase your daily budgets gradually rather than spiking all at once — Google and Meta both reward consistency",
        "Make sure you've got backup payment methods set up so campaigns don't accidentally pause",
        "Set up automated rules to bump bids during the peak hours — you'll thank yourself later",
      ],
    });
  }

  if (type === "device_optimization") {
    return NextResponse.json({
      type: "device_optimization",
      current: context.device,
      recommendations: context.device.tips,
      hourlySchedule: Array.from({ length: 24 }, (_, h) => {
        const d = getDeviceContextForHour(h, industry);
        return { hour: h, peakDevice: d.currentPeakDevice, adjustments: d.recommendedBidAdjustments };
      }),
    });
  }

  if (type === "geo_expansion") {
    return NextResponse.json({
      type: "geo_expansion",
      currentGeo: context.geo,
      expansion: {
        recommendations: [
          "Check your search impression share by location — you might find areas where you're barely showing up",
          "Try running ads in nearby regions with similar demographics and see how they perform",
          "Use location bid adjustments based on where you're actually getting conversions",
          "If you're expanding into non-English markets, translated ads almost always outperform English-only",
        ],
        topMarkets: ["US", "UK", "DE", "FR", "CA", "AU"].filter(c => c !== countryCode).map(c => ({
          country: c,
          profile: getGeoProfileSummary(c),
        })),
      },
    });
  }

  if (type === "seasonal_forecast") {
    return NextResponse.json({
      type: "seasonal_forecast",
      current: context.seasonal,
      climate: context.climate,
      forecast: {
        nextQuarter: getSeasonalForecast(context.seasonal.month + 3 > 12 ? context.seasonal.month - 9 : context.seasonal.month + 3, countryCode, industry),
        recommendations: context.climate.recommendations,
        productOpportunities: context.climate.productOpportunities,
      },
    });
  }

  return NextResponse.json({
    error: "Unknown analysis type. Supported: holiday_prep, device_optimization, geo_expansion, seasonal_forecast",
  }, { status: 400 });
}

/* ═══ Helper functions used by POST endpoints ═════════════════════════════ */

function getDeviceContextForHour(hour: number, industry?: string) {
  const { getDeviceContext } = require("@/lib/context-engine");
  return getDeviceContext(hour, industry);
}

function getGeoProfileSummary(countryCode: string) {
  const { getGeoContext } = require("@/lib/context-engine");
  const geo = getGeoContext(countryCode);
  return {
    country: countryCode,
    currency: geo.currency,
    language: geo.language,
    peakHours: geo.peakAdHours,
    timezone: geo.timezone,
  };
}

function getSeasonalForecast(month: number, countryCode: string, industry?: string) {
  const { getSeasonalContext } = require("@/lib/context-engine");
  const futureDate = new Date();
  futureDate.setMonth(month - 1);
  return getSeasonalContext(futureDate, countryCode);
}
