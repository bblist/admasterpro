"use client";

import { useState, useEffect } from "react";
import {
    BarChart3, MessageSquare, Zap, Target, DollarSign, MousePointer,
    Eye, TrendingUp, ArrowRight, Settings, Plus, Phone, Key,
    BookOpen, Loader2, Sparkles, ShoppingBag, Search, Brain
} from "lucide-react";
import Link from "next/link";
import { authFetch } from "@/lib/auth-client";
import { useBusiness } from "@/lib/business-context";
import { useTranslation } from "@/i18n/context";
import Tooltip from "@/components/Tooltip";
import AiInsightsPanel from "@/components/AiInsightsPanel";
import SetupChecklist from "@/components/SetupChecklist";

interface DashboardStats {
    subscription: {
        plan: string;
        status: string;
        aiMessagesUsed: number;
        aiMessagesLimit: number;
        bonusTokens: number;
        currentPeriodEnd?: string | null;
    };
    adsConnected: boolean;
    adsSummary: {
        impressions: number;
        clicks: number;
        cost: number;
        conversions: number;
        ctr: number;
        activeCampaigns: number;
    } | null;
    businesses: Array<{ id: string; name: string; googleAdsId: string | null }>;
}

export default function DashboardPage() {
    const { t } = useTranslation();
    const { activeBusiness } = useBusiness();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadStats() {
            try {
                // Fetch settings (includes subscription + businesses)
                const settingsRes = await authFetch("/api/settings");
                if (!settingsRes.ok) throw new Error("Failed to load settings");
                const settingsData = await settingsRes.json();

                const dashStats: DashboardStats = {
                    subscription: settingsData.subscription || {
                        plan: "free",
                        status: "active",
                        aiMessagesUsed: 0,
                        aiMessagesLimit: 10,
                        bonusTokens: 0,
                        currentPeriodEnd: null,
                    },
                    adsConnected: settingsData.user?.hasAdsAccess || false,
                    adsSummary: null,
                    businesses: settingsData.businesses || [],
                };

                // If ads connected, fetch summary
                if (dashStats.adsConnected && dashStats.businesses.some((b: { googleAdsId: string | null }) => b.googleAdsId)) {
                    try {
                        const params = new URLSearchParams({ type: "summary", dateRange: "LAST_7_DAYS" });
                        if (activeBusiness?.id) params.set("businessId", activeBusiness.id);
                        const perfRes = await authFetch(`/api/google-ads/performance?${params}`);
                        const perfData = await perfRes.json();
                        if (perfData.data) {
                            dashStats.adsSummary = perfData.data;
                        }
                    } catch { /* ignore */ }
                }

                setStats(dashStats);
            } catch (err) {
                console.error("Failed to load dashboard stats:", err);
                setStats(null);
            } finally {
                setLoading(false);
            }
        }

        loadStats();
    }, [activeBusiness?.id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    const plan = stats?.subscription?.plan || "free";
    const messagesUsed = stats?.subscription?.aiMessagesUsed || 0;
    const messagesLimit = stats?.subscription?.aiMessagesLimit || 10;
    const bonusTokens = stats?.subscription?.bonusTokens || 0;
    const trialEndDate = stats?.subscription?.currentPeriodEnd ? new Date(stats.subscription.currentPeriodEnd) : null;
    const trialDaysLeft = trialEndDate ? Math.max(0, Math.ceil((trialEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;
    const totalAvailable = Math.max(0, messagesLimit + bonusTokens - messagesUsed);
    const usagePct = messagesLimit > 0 ? Math.min(100, Math.round((messagesUsed / messagesLimit) * 100)) : 0;

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Welcome Header */}
            <div>
                <h1 className="text-2xl font-bold">{t("dashboard.title")}</h1>
                <p className="text-muted text-sm mt-1">
                    {t("dashboard.welcome")}
                </p>
            </div>

            <SetupChecklist
                prereqs={["business_info", "google_ads", "knowledge_base"]}
                pageContext="Complete your setup to unlock AI-powered campaign management, budget optimization, and performance analytics"
            />

            {/* Plan & Usage Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card border border-border rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-muted flex items-center gap-1">{t("dashboard.currentPlan")} <Tooltip text="Your subscription tier determines AI message limits, ad account connections, and advanced features." position="bottom" /></span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${plan === "pro" ? "bg-purple-100 text-purple-700"
                            : plan === "trial" ? "bg-amber-100 text-amber-700"
                                : plan === "starter" ? "bg-blue-100 text-blue-700"
                                    : "bg-gray-100 text-gray-700"
                            }`}>
                            {plan.charAt(0).toUpperCase() + plan.slice(1)}
                        </span>
                    </div>
                    <div className="text-3xl font-bold">
                        {plan === "pro" ? "$149" : plan === "starter" ? "$49" : "$0"}
                        <span className="text-sm font-normal text-muted">{plan === "trial" ? " trial" : "/mo"}</span>
                    </div>
                    {plan === "trial" && trialDaysLeft > 0 && (
                        <p className="text-xs text-amber-700 mt-2">{t("dashboard.trialDaysLeft", { days: trialDaysLeft })}</p>
                    )}
                    {plan === "free" && (
                        <Link href="/pricing" className="inline-flex items-center gap-1 text-primary text-sm mt-2 hover:underline">
                            {t("dashboard.upgrade")} <ArrowRight className="w-3 h-3" />
                        </Link>
                    )}
                </div>

                <div className="bg-card border border-border rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-muted flex items-center gap-1">{t("dashboard.aiMessages")} <Tooltip text="AI chat messages remaining this billing cycle. Each message to the AI assistant uses one credit. Top up anytime from Settings." position="bottom" /></span>
                        <MessageSquare className="w-4 h-4 text-muted" />
                    </div>
                    <div className="text-3xl font-bold">
                        {totalAvailable > 999 ? "\u221e" : totalAvailable}
                        <span className="text-sm font-normal text-muted"> {t("dashboard.remaining")}</span>
                    </div>
                    <div className="mt-2">
                        <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all ${usagePct > 80 ? "bg-red-500" : usagePct > 50 ? "bg-yellow-500" : "bg-primary"
                                    }`}
                                style={{ width: `${usagePct}%` }}
                            />
                        </div>
                        <p className="text-xs text-muted mt-1">{messagesUsed}/{messagesLimit} {t("dashboard.used")}{bonusTokens > 0 ? ` (+${bonusTokens} ${t("dashboard.bonus")})` : ""}</p>
                    </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-muted flex items-center gap-1">{t("dashboard.googleAds")} <Tooltip text="Link your Google Ads account to see live campaign data, get AI optimization suggestions, and manage ads directly." position="bottom" /></span>
                        <Settings className="w-4 h-4 text-muted" />
                    </div>
                    {stats?.adsConnected ? (
                        <>
                            <div className="text-lg font-bold text-green-600 flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                {t("dashboard.connected")}
                            </div>
                            <p className="text-xs text-muted mt-1">
                                {t("dashboard.accountsLinked", { count: stats.businesses.filter(b => b.googleAdsId).length })}
                            </p>
                        </>
                    ) : (
                        <>
                            <div className="text-lg font-bold text-muted">{t("dashboard.notConnected")}</div>
                            <Link href="/dashboard/settings" className="inline-flex items-center gap-1 text-primary text-sm mt-1 hover:underline">
                                {t("dashboard.connect")} <ArrowRight className="w-3 h-3" />
                            </Link>
                        </>
                    )}
                </div>
            </div>

            {/* Ads Performance - only show if connected */}
            {stats?.adsSummary && (
                <div>
                    <h2 className="text-lg font-semibold mb-3">{t("dashboard.last7Days")}</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-card border border-border rounded-xl p-4">
                            <div className="flex items-center gap-2 text-sm text-muted mb-1">
                                <DollarSign className="w-4 h-4" /> {t("dashboard.spend")} <Tooltip text="Total ad spend across all campaigns in the last 7 days." />
                            </div>
                            <div className="text-2xl font-bold">${stats.adsSummary.cost.toFixed(2)}</div>
                        </div>
                        <div className="bg-card border border-border rounded-xl p-4">
                            <div className="flex items-center gap-2 text-sm text-muted mb-1">
                                <MousePointer className="w-4 h-4" /> {t("dashboard.clicks")} <Tooltip text="Number of times users clicked your ads. Higher clicks = more traffic to your site." />
                            </div>
                            <div className="text-2xl font-bold">{stats.adsSummary.clicks.toLocaleString()}</div>
                        </div>
                        <div className="bg-card border border-border rounded-xl p-4">
                            <div className="flex items-center gap-2 text-sm text-muted mb-1">
                                <Eye className="w-4 h-4" /> {t("dashboard.impressions")} <Tooltip text="How many times your ads were shown to people. Not every impression leads to a click." />
                            </div>
                            <div className="text-2xl font-bold">{stats.adsSummary.impressions.toLocaleString()}</div>
                        </div>
                        <div className="bg-card border border-border rounded-xl p-4">
                            <div className="flex items-center gap-2 text-sm text-muted mb-1">
                                <Target className="w-4 h-4" /> {t("dashboard.conversions")} <Tooltip text="Actions people took after clicking — like calling, filling a form, or making a purchase." />
                            </div>
                            <div className="text-2xl font-bold">{stats.adsSummary.conversions.toFixed(1)}</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Actions */}
            <div>
                <h2 className="text-lg font-semibold mb-3">{t("dashboard.quickActions")}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <Link href="/dashboard/chat"
                        className="bg-card border border-border rounded-xl p-5 hover:border-primary hover:shadow-md transition group">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-3 group-hover:bg-primary/20 transition">
                            <Zap className="w-5 h-5 text-primary" />
                        </div>
                        <h3 className="font-semibold text-sm">{t("dashboard.aiAssistant")}</h3>
                        <p className="text-xs text-muted mt-1">{t("dashboard.aiAssistantDesc")}</p>
                    </Link>
                    <Link href="/dashboard/ad-copy"
                        className="bg-card border border-border rounded-xl p-5 hover:border-primary hover:shadow-md transition group">
                        <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center mb-3 group-hover:bg-purple-100 transition">
                            <Sparkles className="w-5 h-5 text-purple-600" />
                        </div>
                        <h3 className="font-semibold text-sm">AI Ad Generator</h3>
                        <p className="text-xs text-muted mt-1">Create high-converting ads instantly</p>
                    </Link>
                    <Link href="/dashboard/keyword-research"
                        className="bg-card border border-border rounded-xl p-5 hover:border-primary hover:shadow-md transition group">
                        <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center mb-3 group-hover:bg-amber-100 transition">
                            <Search className="w-5 h-5 text-amber-600" />
                        </div>
                        <h3 className="font-semibold text-sm">Keyword Research</h3>
                        <p className="text-xs text-muted mt-1">AI-powered keyword discovery</p>
                    </Link>
                    <Link href="/dashboard/campaigns"
                        className="bg-card border border-border rounded-xl p-5 hover:border-primary hover:shadow-md transition group">
                        <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center mb-3 group-hover:bg-green-100 transition">
                            <Target className="w-5 h-5 text-green-600" />
                        </div>
                        <h3 className="font-semibold text-sm">{t("dashboard.campaigns")}</h3>
                        <p className="text-xs text-muted mt-1">{t("dashboard.campaignsDesc")}</p>
                    </Link>
                </div>
            </div>

            {/* AI Insights Panel */}
            <AiInsightsPanel businessId={activeBusiness?.id} />

            {/* Getting Started Guide - show for users without ads connected */}
            {!stats?.adsConnected && (
                <div>
                    <h2 className="text-lg font-semibold mb-3">{t("dashboard.getStarted")}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-card border border-border rounded-xl p-5 relative overflow-hidden">
                            <div className="absolute top-3 right-3 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-sm">1</div>
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
                                <BookOpen className="w-5 h-5 text-primary" />
                            </div>
                            <h3 className="font-semibold mb-1">{t("dashboard.trainAI")}</h3>
                            <p className="text-xs text-muted mb-3">{t("dashboard.trainAIDesc")}</p>
                            <Link href="/dashboard/knowledge-base" className="text-primary text-sm hover:underline inline-flex items-center gap-1">
                                {t("dashboard.knowledgeBase")} <ArrowRight className="w-3 h-3" />
                            </Link>
                        </div>
                        <div className="bg-card border border-border rounded-xl p-5 relative overflow-hidden">
                            <div className="absolute top-3 right-3 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-sm">2</div>
                            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center mb-3">
                                <MessageSquare className="w-5 h-5 text-green-600" />
                            </div>
                            <h3 className="font-semibold mb-1">{t("dashboard.chatWithAI")}</h3>
                            <p className="text-xs text-muted mb-3">{t("dashboard.chatWithAIDesc")}</p>
                            <Link href="/dashboard/chat" className="text-primary text-sm hover:underline inline-flex items-center gap-1">
                                {t("dashboard.openChat")} <ArrowRight className="w-3 h-3" />
                            </Link>
                        </div>
                        <div className="bg-card border border-border rounded-xl p-5 relative overflow-hidden">
                            <div className="absolute top-3 right-3 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-sm">3</div>
                            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-3">
                                <Plus className="w-5 h-5 text-blue-600" />
                            </div>
                            <h3 className="font-semibold mb-1">{t("dashboard.connectGoogleAds")}</h3>
                            <p className="text-xs text-muted mb-3">{t("dashboard.connectGoogleAdsDesc")}</p>
                            <Link href="/dashboard/settings" className="text-primary text-sm hover:underline inline-flex items-center gap-1">
                                {t("dashboard.settings")} <ArrowRight className="w-3 h-3" />
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* More tools row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <Link href="/dashboard/shopping"
                    className="bg-card border border-border rounded-xl p-4 hover:border-primary transition flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <ShoppingBag className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm">Shopping Ads</h3>
                        <p className="text-xs text-muted">Google Shopping & PMax</p>
                    </div>
                </Link>
                <Link href="/dashboard/drafts"
                    className="bg-card border border-border rounded-xl p-4 hover:border-primary transition flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <TrendingUp className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm">{t("dashboard.adDrafts")}</h3>
                        <p className="text-xs text-muted">{t("dashboard.adDraftsDesc")}</p>
                    </div>
                </Link>
                <Link href="/dashboard/calls"
                    className="bg-card border border-border rounded-xl p-4 hover:border-primary transition flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Phone className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm">{t("dashboard.callTracking")}</h3>
                        <p className="text-xs text-muted">{t("dashboard.callTrackingDesc")}</p>
                    </div>
                </Link>
                <Link href="/audit"
                    className="bg-card border border-border rounded-xl p-4 hover:border-primary transition flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <BarChart3 className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm">{t("dashboard.freeAudit")}</h3>
                        <p className="text-xs text-muted">{t("dashboard.freeAuditDesc")}</p>
                    </div>
                </Link>
            </div>
        </div>
    );
}
