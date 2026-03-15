"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Brain, TrendingUp, TrendingDown, DollarSign, ShoppingBag,
  Globe, Smartphone, Monitor, Tablet, Target, AlertTriangle,
  CheckCircle, Clock, Calendar, RefreshCw, Loader2, Zap,
  Sun, CloudRain, Snowflake, Leaf, ArrowRight, Eye,
  BarChart3, PieChart, Activity, Wifi, WifiOff, ChevronRight,
  Sparkles, Gift, MapPin, ThermometerSun, Layers, Shield,
} from "lucide-react";
import Link from "next/link";
import { authFetch } from "@/lib/auth-client";
import { useBusiness } from "@/lib/business-context";
import { useTranslation } from "@/i18n/context";
import UITooltip from "@/components/Tooltip";
import SetupChecklist from "@/components/SetupChecklist";

/* ═══ Types ═══════════════════════════════════════════════════════════════ */

interface PlatformStatus {
  platform: string;
  connected: boolean;
  status: "active" | "disconnected" | "error" | "not_configured";
  lastSync?: string;
}

interface ActionItem {
  priority: "critical" | "high" | "medium" | "low";
  action: string;
  impact: string;
  platform: string;
}

interface Holiday {
  name: string;
  date: string;
  adImpact: string;
  budgetMultiplier: number;
  cpcChange: number;
  leadTimeDays: number;
  tips: string[];
  category: string;
}

interface IntelligenceData {
  context: {
    timestamp: string;
    holidays: {
      upcoming: Holiday[];
      active: Holiday[];
      nextMajor: Holiday | null;
      daysUntilNextMajor: number;
    };
    seasonal: {
      season: string;
      hemisphere: string;
      retailSeason: string;
      demandTrend: string;
      quarterLabel: string;
      industries: Record<string, { demand: string; tip: string }>;
    };
    geo: {
      timezone: string;
      currency: string;
      language: string;
      isWorkingHours: boolean;
      localHour: number;
      peakAdHours: number[];
      offPeakDiscount: number;
    };
    device: {
      recommendedBidAdjustments: { mobile: number; desktop: number; tablet: number };
      currentPeakDevice: string;
      reasoning: string;
      tips: string[];
    };
    climate: {
      season: string;
      hemisphere: string;
      weatherSensitiveCategories: string[];
      recommendations: string[];
      productOpportunities: string[];
    };
    aiSummary: string;
    actionItems: string[];
  };
  platforms: PlatformStatus[];
  crossPlatform: {
    totalAdSpend: number;
    totalRevenue: number;
    overallROAS: number;
    totalConversions: number;
    bestPerformingPlatform: string;
    worstPerformingPlatform: string;
    budgetAllocation: Array<{ platform: string; current: number; recommended: number; reason: string }>;
  };
  aiInsights: {
    summary: string;
    actionItems: ActionItem[];
    opportunities: string[];
    warnings: string[];
  };
}

/* ═══ Platform icons & colors ═════════════════════════════════════════════ */

const PLATFORM_META: Record<string, { icon: string; label: string; color: string; bgColor: string }> = {
  google_ads: { icon: "🔍", label: "Google Ads", color: "text-blue-600", bgColor: "bg-blue-50" },
  google_analytics: { icon: "📊", label: "Google Analytics", color: "text-orange-600", bgColor: "bg-orange-50" },
  meta_ads: { icon: "📘", label: "Meta Ads", color: "text-indigo-600", bgColor: "bg-indigo-50" },
  amazon_ads: { icon: "📦", label: "Amazon Ads", color: "text-yellow-700", bgColor: "bg-yellow-50" },
  shopify: { icon: "🛒", label: "Shopify", color: "text-green-600", bgColor: "bg-green-50" },
  google_merchant: { icon: "🏪", label: "Merchant Center", color: "text-red-600", bgColor: "bg-red-50" },
  tiktok_ads: { icon: "🎵", label: "TikTok Ads", color: "text-pink-600", bgColor: "bg-pink-50" },
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: "bg-red-100 text-red-700 border-red-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  low: "bg-blue-100 text-blue-700 border-blue-200",
};

const SEASON_ICONS: Record<string, React.ReactNode> = {
  spring: <Leaf className="w-5 h-5 text-green-500" />,
  summer: <Sun className="w-5 h-5 text-yellow-500" />,
  fall: <Leaf className="w-5 h-5 text-orange-500" />,
  winter: <Snowflake className="w-5 h-5 text-blue-400" />,
};

/* ═══ Page ═════════════════════════════════════════════════════════════════ */

export default function IntelligencePage() {
  const { t } = useTranslation();
  const { activeBusiness } = useBusiness();
  const [data, setData] = useState<IntelligenceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "holidays" | "devices" | "climate" | "platforms">("overview");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (activeBusiness?.id) params.set("businessId", activeBusiness.id);
      params.set("country", "US"); // TODO: detect from user settings
      if (activeBusiness?.industry) params.set("industry", activeBusiness.industry);

      const res = await authFetch(`/api/intelligence?${params}`);
      if (!res.ok) throw new Error(`Failed to load intelligence (${res.status})`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [activeBusiness?.id, activeBusiness?.industry]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <Brain className="w-12 h-12 text-primary animate-pulse mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">Pulling everything together...</h2>
          <p className="text-sm text-muted">Just crunching the numbers across your platforms, taking a look at what&apos;s happening in the market</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-3" />
          <h2 className="font-semibold text-red-700 mb-2">Something went wrong</h2>
          <p className="text-sm text-red-600 mb-4">{error}</p>
          <button onClick={fetchData} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 transition">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const connectedCount = data.platforms.filter(p => p.connected).length;
  const totalPlatforms = data.platforms.length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* ─── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Intelligence</h1>
              <p className="text-muted text-sm mt-0.5">
                Everything you need to know about what&apos;s happening across your ad platforms right now
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-sm text-muted bg-card border border-border rounded-lg px-3 py-2">
            <Wifi className="w-3.5 h-3.5 text-green-500" />
            {connectedCount}/{totalPlatforms} platforms
          </div>
          <button onClick={fetchData} className="p-2 bg-card border border-border rounded-lg hover:border-primary transition" title="Refresh">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>
      <SetupChecklist
          prereqs={["google_ads", "business_info"]}
          pageContext="Connect your ad platforms and add business info to unlock cross-channel intelligence, seasonal insights, and AI-powered recommendations"
      />
      {/* ─── AI Summary Banner ──────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 border border-primary/20 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold mb-1">Here&apos;s what&apos;s happening</h2>
            <p className="text-sm text-muted leading-relaxed">{data.aiInsights.summary}</p>
            {data.aiInsights.warnings.length > 0 && (
              <div className="mt-3 space-y-1">
                {data.aiInsights.warnings.map((w, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    {w}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Tab Navigation ─────────────────────────────────────────── */}
      <div className="flex items-center gap-1 bg-card border border-border rounded-xl p-1 overflow-x-auto">
        {[
          { key: "overview" as const, label: "Overview", icon: <BarChart3 className="w-4 h-4" /> },
          { key: "holidays" as const, label: "Upcoming Events", icon: <Gift className="w-4 h-4" /> },
          { key: "devices" as const, label: "Devices", icon: <Smartphone className="w-4 h-4" /> },
          { key: "climate" as const, label: "Seasonal", icon: <ThermometerSun className="w-4 h-4" /> },
          { key: "platforms" as const, label: "Platforms", icon: <Layers className="w-4 h-4" /> },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition whitespace-nowrap ${
              activeTab === tab.key ? "bg-primary text-white shadow-sm" : "text-muted hover:text-foreground hover:bg-muted/30"
            }`}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ─── Tab Content ────────────────────────────────────────────── */}
      {activeTab === "overview" && <OverviewTab data={data} />}
      {activeTab === "holidays" && <HolidaysTab data={data} />}
      {activeTab === "devices" && <DevicesTab data={data} />}
      {activeTab === "climate" && <ClimateTab data={data} />}
      {activeTab === "platforms" && <PlatformsTab data={data} />}
    </div>
  );
}

/* ═══ Overview Tab ════════════════════════════════════════════════════════ */

function OverviewTab({ data }: { data: IntelligenceData }) {
  const ctx = data.context;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon={<DollarSign className="w-5 h-5" />} label="Ad Spend" value={`$${data.crossPlatform.totalAdSpend.toFixed(2)}`} subtitle="Across all platforms" color="text-primary" />
        <KPICard icon={<Target className="w-5 h-5" />} label="Conversions" value={String(data.crossPlatform.totalConversions)} subtitle="All platforms combined" color="text-green-600" />
        <KPICard icon={<TrendingUp className="w-5 h-5" />} label="ROAS" value={`${data.crossPlatform.overallROAS.toFixed(1)}x`} subtitle="Return on ad spend" color="text-accent" />
        <KPICard icon={<Wifi className="w-5 h-5" />} label="Platforms" value={`${data.platforms.filter(p => p.connected).length}`} subtitle={`of ${data.platforms.length} connected`} color="text-blue-600" />
      </div>

      {/* Two column: Action Items + Seasonal Context */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Action Items */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Things worth your attention</h2>
          </div>
          <div className="space-y-3">
            {data.aiInsights.actionItems.length === 0 && (
              <p className="text-sm text-muted">Nothing urgent right now — your campaigns are ticking along nicely.</p>
            )}
            {data.aiInsights.actionItems.slice(0, 6).map((item, i) => (
              <div key={i} className={`border rounded-lg p-3 ${PRIORITY_COLORS[item.priority]}`}>
                <div className="flex items-start gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider mt-0.5">
                    {item.priority}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{item.action}</p>
                    <p className="text-xs mt-0.5 opacity-80">{item.impact}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Seasonal & Holidays */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            {SEASON_ICONS[ctx.seasonal.season] || <Calendar className="w-5 h-5" />}
            <h2 className="font-semibold">What&apos;s in season</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Current Season</span>
              <span className="font-medium capitalize">{ctx.seasonal.season} ({ctx.seasonal.hemisphere})</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Retail Season</span>
              <span className="font-medium">{ctx.seasonal.retailSeason}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Demand Trend</span>
              <span className={`font-medium flex items-center gap-1 ${ctx.seasonal.demandTrend === "peak" || ctx.seasonal.demandTrend === "rising" ? "text-green-600" : "text-muted"}`}>
                {ctx.seasonal.demandTrend === "rising" || ctx.seasonal.demandTrend === "peak"
                  ? <TrendingUp className="w-4 h-4" />
                  : <TrendingDown className="w-4 h-4" />
                }
                {ctx.seasonal.demandTrend}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Quarter</span>
              <span className="font-medium">{ctx.seasonal.quarterLabel}</span>
            </div>

            {/* Next major holiday */}
            {ctx.holidays.nextMajor && (
              <div className="mt-2 pt-4 border-t border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-semibold">Next Major Event</span>
                </div>
                <div className="bg-red-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-red-700">{ctx.holidays.nextMajor.name}</span>
                    <span className="text-xs text-red-600 font-medium">{ctx.holidays.daysUntilNextMajor} days away</span>
                  </div>
                  <p className="text-xs text-red-600">
                    Budget: {ctx.holidays.nextMajor.budgetMultiplier}x • CPC: +{ctx.holidays.nextMajor.cpcChange}% • Start prep: {ctx.holidays.nextMajor.leadTimeDays} days before
                  </p>
                </div>
              </div>
            )}

            {/* Upcoming holidays */}
            {ctx.holidays.upcoming.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-muted mb-2">{ctx.holidays.upcoming.length} events in next 60 days</p>
                <div className="space-y-1">
                  {ctx.holidays.upcoming.slice(0, 3).map((h, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span>{h.name}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        h.adImpact === "critical" ? "bg-red-100 text-red-700" :
                        h.adImpact === "high" ? "bg-orange-100 text-orange-700" :
                        "bg-gray-100 text-gray-600"
                      }`}>
                        {h.adImpact}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Opportunities */}
      {data.aiInsights.opportunities.length > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-green-600" />
            <h2 className="font-semibold text-green-800">Opportunities worth exploring</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.aiInsights.opportunities.map((opp, i) => (
              <div key={i} className="flex items-start gap-2 bg-white/60 rounded-lg p-3">
                <ArrowRight className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                <p className="text-sm text-green-800">{opp}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Budget Allocation */}
      {data.crossPlatform.budgetAllocation.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Where we&apos;d put the budget</h2>
          </div>
          <div className="space-y-3">
            {data.crossPlatform.budgetAllocation.map((alloc, i) => {
              const meta = PLATFORM_META[alloc.platform];
              return (
                <div key={i} className="flex items-center gap-4">
                  <span className="text-lg w-8">{meta?.icon || "⚡"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{meta?.label || alloc.platform}</span>
                      <span className="text-sm font-bold text-primary">{alloc.recommended}%</span>
                    </div>
                    <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${alloc.recommended}%` }} />
                    </div>
                    <p className="text-xs text-muted mt-1">{alloc.reason}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══ Holidays Tab ════════════════════════════════════════════════════════ */

function HolidaysTab({ data }: { data: IntelligenceData }) {
  const holidays = data.context.holidays;

  return (
    <div className="space-y-6">
      {/* Active holidays */}
      {holidays.active.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-red-600" />
            <h2 className="font-semibold text-red-800">These are happening right now — don&apos;t miss them</h2>
          </div>
          <div className="space-y-4">
            {holidays.active.map((h, i) => (
              <HolidayCard key={i} holiday={h} isActive />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Coming up in the next 60 days</h2>
        </div>
        {holidays.upcoming.length === 0 ? (
          <p className="text-sm text-muted">No big events on the horizon for the next couple of months — a good time to focus on steady-state optimisation.</p>
        ) : (
          <div className="space-y-4">
            {holidays.upcoming.map((h, i) => (
              <HolidayCard key={i} holiday={h} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function HolidayCard({ holiday, isActive }: { holiday: Holiday; isActive?: boolean }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`border rounded-xl p-4 ${isActive ? "border-red-300 bg-red-50/50" : "border-border bg-white"}`}>
      <div className="flex items-start justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
            isActive ? "bg-red-100" : holiday.adImpact === "critical" ? "bg-orange-100" : "bg-gray-100"
          }`}>
            {holiday.category === "shopping" ? "🛍️" : holiday.category === "gifts" ? "🎁" : holiday.category === "food" ? "🍽️" : holiday.category === "travel" ? "✈️" : holiday.category === "sports" ? "🏈" : "📅"}
          </div>
          <div>
            <h3 className="font-semibold text-sm">{holiday.name}</h3>
            <p className="text-xs text-muted">
              {holiday.date} • Impact: <span className={`font-medium ${holiday.adImpact === "critical" ? "text-red-600" : holiday.adImpact === "high" ? "text-orange-600" : "text-gray-600"}`}>{holiday.adImpact}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-muted">Budget</div>
            <div className="text-sm font-bold text-primary">{holiday.budgetMultiplier}x</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted">CPC</div>
            <div className="text-sm font-bold text-orange-600">+{holiday.cpcChange}%</div>
          </div>
          <ChevronRight className={`w-4 h-4 text-muted transition-transform ${expanded ? "rotate-90" : ""}`} />
        </div>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-border/50">
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <span className="text-xs text-muted">Lead Time</span>
              <p className="text-sm font-medium">{holiday.leadTimeDays} days before</p>
            </div>
            <div>
              <span className="text-xs text-muted">Category</span>
              <p className="text-sm font-medium capitalize">{holiday.category}</p>
            </div>
          </div>
          <div>
            <span className="text-xs text-muted">AI Tips</span>
            <ul className="mt-1 space-y-1">
              {holiday.tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══ Devices Tab ═════════════════════════════════════════════════════════ */

function DevicesTab({ data }: { data: IntelligenceData }) {
  const device = data.context.device;

  const deviceIcon = (d: string) => {
    if (d === "mobile") return <Smartphone className="w-5 h-5" />;
    if (d === "desktop") return <Monitor className="w-5 h-5" />;
    return <Tablet className="w-5 h-5" />;
  };

  return (
    <div className="space-y-6">
      {/* Current device context */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          {deviceIcon(device.currentPeakDevice)}
          <h2 className="font-semibold">Device breakdown right now</h2>
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
            Right now ({data.context.geo.localHour}:00 local)
          </span>
        </div>
        <p className="text-sm text-muted mb-4">{device.reasoning}</p>

        <div className="grid grid-cols-3 gap-4">
          {(["mobile", "desktop", "tablet"] as const).map(d => {
            const adj = device.recommendedBidAdjustments[d];
            const isPeak = device.currentPeakDevice === d;
            return (
              <div key={d} className={`border rounded-xl p-4 text-center ${isPeak ? "border-primary bg-primary/5" : "border-border"}`}>
                <div className="flex justify-center mb-2">
                  {d === "mobile" ? <Smartphone className={`w-8 h-8 ${isPeak ? "text-primary" : "text-muted"}`} /> :
                   d === "desktop" ? <Monitor className={`w-8 h-8 ${isPeak ? "text-primary" : "text-muted"}`} /> :
                   <Tablet className={`w-8 h-8 ${isPeak ? "text-primary" : "text-muted"}`} />}
                </div>
                <h3 className="text-sm font-semibold capitalize mb-1">{d}</h3>
                <div className={`text-lg font-bold ${adj > 0 ? "text-green-600" : adj < 0 ? "text-red-500" : "text-muted"}`}>
                  {adj > 0 ? "+" : ""}{adj}%
                </div>
                <p className="text-xs text-muted mt-1">bid adjustment</p>
                {isPeak && <span className="inline-block mt-2 text-[10px] bg-primary text-white px-2 py-0.5 rounded-full">PEAK</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Device Tips */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="font-semibold mb-4">Tips for getting more from your device targeting</h2>
        <div className="space-y-2">
          {device.tips.map((tip, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
              {tip}
            </div>
          ))}
        </div>
      </div>

      {/* Hourly heatmap */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="font-semibold mb-4">When each device dominates</h2>
        <p className="text-sm text-muted mb-4">A quick look at which device type leads traffic each hour — handy for setting up bid schedules</p>
        <div className="grid grid-cols-12 gap-1">
          {Array.from({ length: 24 }, (_, h) => {
            const isMorning = h >= 5 && h <= 8;
            const isWork = h >= 9 && h <= 16;
            const isEvening = h >= 17 && h <= 22;
            const isNight = h < 5 || h === 23;
            const currentHour = data.context.geo.localHour === h;

            let bg = "bg-blue-100"; // mobile
            let label = "📱";
            if (isWork && h !== 12) { bg = "bg-purple-100"; label = "💻"; }
            else if (h >= 20 && h <= 21) { bg = "bg-green-100"; label = "📱"; }

            return (
              <div key={h} className={`rounded-lg p-1.5 text-center ${bg} ${currentHour ? "ring-2 ring-primary" : ""}`}
                title={`${h}:00 — ${isWork ? "Desktop peak" : isEvening ? "Mobile/Tablet peak" : isMorning ? "Mobile peak" : "Low traffic"}`}>
                <div className="text-[10px] font-medium">{h}:00</div>
                <div className="text-xs">{label}</div>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-muted">
          <span className="flex items-center gap-1"><div className="w-3 h-3 bg-purple-100 rounded" /> Desktop</span>
          <span className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-100 rounded" /> Mobile</span>
          <span className="flex items-center gap-1"><div className="w-3 h-3 bg-green-100 rounded" /> Tablet</span>
        </div>
      </div>
    </div>
  );
}

/* ═══ Climate Tab ═════════════════════════════════════════════════════════ */

function ClimateTab({ data }: { data: IntelligenceData }) {
  const climate = data.context.climate;
  const seasonal = data.context.seasonal;

  return (
    <div className="space-y-6">
      {/* Climate overview */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          {SEASON_ICONS[seasonal.season] || <ThermometerSun className="w-5 h-5" />}
          <h2 className="font-semibold">What the season means for your ads</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-muted/20 rounded-lg">
            <div className="text-2xl mb-1">{seasonal.season === "summer" ? "☀️" : seasonal.season === "winter" ? "❄️" : seasonal.season === "fall" ? "🍂" : "🌸"}</div>
            <div className="text-xs text-muted">Season</div>
            <div className="text-sm font-semibold capitalize">{climate.season}</div>
          </div>
          <div className="text-center p-3 bg-muted/20 rounded-lg">
            <div className="text-2xl mb-1">🌍</div>
            <div className="text-xs text-muted">Hemisphere</div>
            <div className="text-sm font-semibold capitalize">{climate.hemisphere}</div>
          </div>
          <div className="text-center p-3 bg-muted/20 rounded-lg">
            <div className="text-2xl mb-1">{seasonal.demandTrend === "peak" ? "📈" : seasonal.demandTrend === "rising" ? "↗️" : "📉"}</div>
            <div className="text-xs text-muted">Demand</div>
            <div className="text-sm font-semibold capitalize">{seasonal.demandTrend}</div>
          </div>
          <div className="text-center p-3 bg-muted/20 rounded-lg">
            <div className="text-2xl mb-1">🛍️</div>
            <div className="text-xs text-muted">Retail Period</div>
            <div className="text-sm font-semibold">{seasonal.retailSeason}</div>
          </div>
        </div>

        {/* Recommendations */}
        <h3 className="text-sm font-semibold mb-3">What we&apos;d recommend right now</h3>
        <div className="space-y-2">
          {climate.recommendations.map((rec, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              {rec}
            </div>
          ))}
        </div>
      </div>

      {/* Weather-sensitive products */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="font-semibold mb-4">Products people are looking for right now</h2>
        <p className="text-sm text-muted mb-4">These categories typically see a bump in demand given the current weather and season:</p>
        <div className="flex flex-wrap gap-2">
          {climate.weatherSensitiveCategories.map((cat, i) => (
            <span key={i} className="px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium">
              {cat}
            </span>
          ))}
        </div>
      </div>

      {/* Industry seasonal data */}
      {Object.keys(seasonal.industries).length > 0 && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-semibold mb-4">Industry Demand This {seasonal.season.charAt(0).toUpperCase() + seasonal.season.slice(1)}</h2>
          <div className="space-y-3">
            {Object.entries(seasonal.industries).map(([ind, info]) => (
              <div key={ind} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                <div>
                  <span className="text-sm font-medium capitalize">{ind.replace(/-/g, " ")}</span>
                  <p className="text-xs text-muted mt-0.5">{info.tip}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  info.demand === "high" ? "bg-green-100 text-green-700" :
                  info.demand === "medium" ? "bg-yellow-100 text-yellow-700" :
                  "bg-gray-100 text-gray-600"
                }`}>
                  {info.demand}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══ Platforms Tab ════════════════════════════════════════════════════════ */

function PlatformsTab({ data }: { data: IntelligenceData }) {
  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="font-semibold mb-4">Your platforms</h2>
        <p className="text-sm text-muted mb-6">
          The more platforms you connect, the better we can help you optimise across channels and make smarter budget decisions.
        </p>
        <div className="space-y-3">
          {data.platforms.map((p, i) => {
            const meta = PLATFORM_META[p.platform];
            return (
              <div key={i} className="flex items-center justify-between p-4 border border-border rounded-xl hover:border-primary/30 transition">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{meta?.icon || "⚡"}</span>
                  <div>
                    <h3 className="text-sm font-semibold">{meta?.label || p.platform}</h3>
                    <p className="text-xs text-muted">
                      {p.connected ? (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-3 h-3" /> Connected
                          {p.lastSync && ` • Last sync: ${new Date(p.lastSync).toLocaleString()}`}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-muted">
                          <WifiOff className="w-3 h-3" /> Not connected
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {p.connected ? (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">Active</span>
                  ) : (
                    <Link href="/onboarding" className="text-xs bg-primary text-white px-3 py-1.5 rounded-lg font-medium hover:bg-primary-dark transition">
                      Connect
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Geo context */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Your location context</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <span className="text-xs text-muted">Timezone</span>
            <p className="text-sm font-medium">{data.context.geo.timezone}</p>
          </div>
          <div>
            <span className="text-xs text-muted">Currency</span>
            <p className="text-sm font-medium">{data.context.geo.currency}</p>
          </div>
          <div>
            <span className="text-xs text-muted">Local Time</span>
            <p className="text-sm font-medium">{data.context.geo.localHour}:00</p>
          </div>
          <div>
            <span className="text-xs text-muted">Working Hours</span>
            <p className={`text-sm font-medium ${data.context.geo.isWorkingHours ? "text-green-600" : "text-orange-600"}`}>
              {data.context.geo.isWorkingHours ? "Yes ✓" : "No — off-peak"}
            </p>
          </div>
        </div>
        {!data.context.geo.isWorkingHours && (
          <div className="mt-4 bg-orange-50 rounded-lg p-3 text-sm text-orange-700">
            <Clock className="w-4 h-4 inline mr-1" />
            Off-peak hours right now — you could save around {data.context.geo.offPeakDiscount}% by lowering bids during this quieter window
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══ KPI Card Component ═════════════════════════════════════════════════ */

function KPICard({ icon, label, value, subtitle, color }: { icon: React.ReactNode; label: string; value: string; subtitle: string; color: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted">{label}</span>
        <span className={color}>{icon}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted mt-1">{subtitle}</div>
    </div>
  );
}
