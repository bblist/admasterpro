#!/usr/bin/env python3
"""Write the dashboard home page with real stats."""

content = '''"use client";

import { useState, useEffect } from "react";
import {
    BarChart3, MessageSquare, Zap, Target, DollarSign, MousePointer,
    Eye, TrendingUp, ArrowRight, Settings, Plus, Phone, Key,
    BookOpen, Loader2
} from "lucide-react";
import Link from "next/link";
import { authFetch } from "@/lib/auth-client";
import { useBusiness } from "@/lib/business-context";

interface DashboardStats {
    subscription: {
        plan: string;
        status: string;
        aiMessagesUsed: number;
        aiMessagesLimit: number;
        bonusTokens: number;
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
    const { activeBusiness } = useBusiness();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadStats() {
            try {
                // Fetch settings (includes subscription + businesses)
                const settingsRes = await authFetch("/api/settings");
                const settingsData = await settingsRes.json();

                const dashStats: DashboardStats = {
                    subscription: settingsData.subscription || {
                        plan: "free",
                        status: "active",
                        aiMessagesUsed: 0,
                        aiMessagesLimit: 10,
                        bonusTokens: 0,
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
    const totalAvailable = messagesLimit + bonusTokens - messagesUsed;
    const usagePct = messagesLimit > 0 ? Math.min(100, Math.round((messagesUsed / messagesLimit) * 100)) : 0;

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Welcome Header */}
            <div>
                <h1 className="text-2xl font-bold">Dashboard</h1>
                <p className="text-muted text-sm mt-1">
                    Welcome back! Here&apos;s your AdMaster Pro overview.
                </p>
            </div>

            {/* Plan & Usage Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card border border-border rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-muted">Current Plan</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            plan === "pro" ? "bg-purple-100 text-purple-700"
                                : plan === "starter" ? "bg-blue-100 text-blue-700"
                                    : "bg-gray-100 text-gray-700"
                        }`}>
                            {plan.charAt(0).toUpperCase() + plan.slice(1)}
                        </span>
                    </div>
                    <div className="text-3xl font-bold">
                        {plan === "pro" ? "$149" : plan === "starter" ? "$49" : "$0"}
                        <span className="text-sm font-normal text-muted">/mo</span>
                    </div>
                    {plan === "free" && (
                        <Link href="/pricing" className="inline-flex items-center gap-1 text-primary text-sm mt-2 hover:underline">
                            Upgrade <ArrowRight className="w-3 h-3" />
                        </Link>
                    )}
                </div>

                <div className="bg-card border border-border rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-muted">AI Messages</span>
                        <MessageSquare className="w-4 h-4 text-muted" />
                    </div>
                    <div className="text-3xl font-bold">
                        {totalAvailable > 999 ? "\\u221e" : totalAvailable}
                        <span className="text-sm font-normal text-muted"> remaining</span>
                    </div>
                    <div className="mt-2">
                        <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all ${
                                    usagePct > 80 ? "bg-red-500" : usagePct > 50 ? "bg-yellow-500" : "bg-primary"
                                }`}
                                style={{ width: `${usagePct}%` }}
                            />
                        </div>
                        <p className="text-xs text-muted mt-1">{messagesUsed}/{messagesLimit} used{bonusTokens > 0 ? ` (+${bonusTokens} bonus)` : ""}</p>
                    </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-muted">Google Ads</span>
                        <Settings className="w-4 h-4 text-muted" />
                    </div>
                    {stats?.adsConnected ? (
                        <>
                            <div className="text-lg font-bold text-green-600 flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                Connected
                            </div>
                            <p className="text-xs text-muted mt-1">
                                {stats.businesses.filter(b => b.googleAdsId).length} account{stats.businesses.filter(b => b.googleAdsId).length !== 1 ? "s" : ""} linked
                            </p>
                        </>
                    ) : (
                        <>
                            <div className="text-lg font-bold text-muted">Not Connected</div>
                            <Link href="/dashboard/settings" className="inline-flex items-center gap-1 text-primary text-sm mt-1 hover:underline">
                                Connect <ArrowRight className="w-3 h-3" />
                            </Link>
                        </>
                    )}
                </div>
            </div>

            {/* Ads Performance - only show if connected */}
            {stats?.adsSummary && (
                <div>
                    <h2 className="text-lg font-semibold mb-3">Last 7 Days Performance</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-card border border-border rounded-xl p-4">
                            <div className="flex items-center gap-2 text-sm text-muted mb-1">
                                <DollarSign className="w-4 h-4" /> Spend
                            </div>
                            <div className="text-2xl font-bold">${stats.adsSummary.cost.toFixed(2)}</div>
                        </div>
                        <div className="bg-card border border-border rounded-xl p-4">
                            <div className="flex items-center gap-2 text-sm text-muted mb-1">
                                <MousePointer className="w-4 h-4" /> Clicks
                            </div>
                            <div className="text-2xl font-bold">{stats.adsSummary.clicks.toLocaleString()}</div>
                        </div>
                        <div className="bg-card border border-border rounded-xl p-4">
                            <div className="flex items-center gap-2 text-sm text-muted mb-1">
                                <Eye className="w-4 h-4" /> Impressions
                            </div>
                            <div className="text-2xl font-bold">{stats.adsSummary.impressions.toLocaleString()}</div>
                        </div>
                        <div className="bg-card border border-border rounded-xl p-4">
                            <div className="flex items-center gap-2 text-sm text-muted mb-1">
                                <Target className="w-4 h-4" /> Conversions
                            </div>
                            <div className="text-2xl font-bold">{stats.adsSummary.conversions.toFixed(1)}</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Actions */}
            <div>
                <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <Link href="/dashboard/chat"
                        className="bg-card border border-border rounded-xl p-5 hover:border-primary hover:shadow-md transition group">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-3 group-hover:bg-primary/20 transition">
                            <Zap className="w-5 h-5 text-primary" />
                        </div>
                        <h3 className="font-semibold text-sm">AI Assistant</h3>
                        <p className="text-xs text-muted mt-1">Chat with your Google Ads expert</p>
                    </Link>
                    <Link href="/dashboard/campaigns"
                        className="bg-card border border-border rounded-xl p-5 hover:border-primary hover:shadow-md transition group">
                        <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center mb-3 group-hover:bg-green-100 transition">
                            <Target className="w-5 h-5 text-green-600" />
                        </div>
                        <h3 className="font-semibold text-sm">Campaigns</h3>
                        <p className="text-xs text-muted mt-1">View and manage campaigns</p>
                    </Link>
                    <Link href="/dashboard/analytics"
                        className="bg-card border border-border rounded-xl p-5 hover:border-primary hover:shadow-md transition group">
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-3 group-hover:bg-blue-100 transition">
                            <BarChart3 className="w-5 h-5 text-blue-600" />
                        </div>
                        <h3 className="font-semibold text-sm">Analytics</h3>
                        <p className="text-xs text-muted mt-1">Performance charts & insights</p>
                    </Link>
                    <Link href="/dashboard/keywords"
                        className="bg-card border border-border rounded-xl p-5 hover:border-primary hover:shadow-md transition group">
                        <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center mb-3 group-hover:bg-yellow-100 transition">
                            <Key className="w-5 h-5 text-yellow-600" />
                        </div>
                        <h3 className="font-semibold text-sm">Keywords</h3>
                        <p className="text-xs text-muted mt-1">Keyword performance & management</p>
                    </Link>
                </div>
            </div>

            {/* Getting Started Guide - show for users without ads connected */}
            {!stats?.adsConnected && (
                <div>
                    <h2 className="text-lg font-semibold mb-3">Get Started</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-card border border-border rounded-xl p-5 relative overflow-hidden">
                            <div className="absolute top-3 right-3 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-sm">1</div>
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
                                <BookOpen className="w-5 h-5 text-primary" />
                            </div>
                            <h3 className="font-semibold mb-1">Train Your AI</h3>
                            <p className="text-xs text-muted mb-3">Add your business details to the Knowledge Base so the AI understands your brand, products, and target audience.</p>
                            <Link href="/dashboard/knowledge" className="text-primary text-sm hover:underline inline-flex items-center gap-1">
                                Knowledge Base <ArrowRight className="w-3 h-3" />
                            </Link>
                        </div>
                        <div className="bg-card border border-border rounded-xl p-5 relative overflow-hidden">
                            <div className="absolute top-3 right-3 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-sm">2</div>
                            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center mb-3">
                                <MessageSquare className="w-5 h-5 text-green-600" />
                            </div>
                            <h3 className="font-semibold mb-1">Chat with AI</h3>
                            <p className="text-xs text-muted mb-3">Ask for help with campaign strategy, keyword research, ad copy, or audit your current account.</p>
                            <Link href="/dashboard/chat" className="text-primary text-sm hover:underline inline-flex items-center gap-1">
                                Open Chat <ArrowRight className="w-3 h-3" />
                            </Link>
                        </div>
                        <div className="bg-card border border-border rounded-xl p-5 relative overflow-hidden">
                            <div className="absolute top-3 right-3 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-sm">3</div>
                            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-3">
                                <Plus className="w-5 h-5 text-blue-600" />
                            </div>
                            <h3 className="font-semibold mb-1">Connect Google Ads</h3>
                            <p className="text-xs text-muted mb-3">Link your Google Ads account for live campaign management, analytics, and AI-powered optimization.</p>
                            <Link href="/dashboard/settings" className="text-primary text-sm hover:underline inline-flex items-center gap-1">
                                Settings <ArrowRight className="w-3 h-3" />
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* More tools row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Link href="/dashboard/calls"
                    className="bg-card border border-border rounded-xl p-4 hover:border-primary transition flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Phone className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm">Call Tracking</h3>
                        <p className="text-xs text-muted">Monitor calls from ads</p>
                    </div>
                </Link>
                <Link href="/dashboard/drafts"
                    className="bg-card border border-border rounded-xl p-4 hover:border-primary transition flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <TrendingUp className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm">Ad Drafts</h3>
                        <p className="text-xs text-muted">Review AI-created ads</p>
                    </div>
                </Link>
                <Link href="/audit"
                    className="bg-card border border-border rounded-xl p-4 hover:border-primary transition flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <BarChart3 className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm">Free Audit</h3>
                        <p className="text-xs text-muted">Get a free account audit</p>
                    </div>
                </Link>
            </div>
        </div>
    );
}
'''

with open('/Users/bblist/admasterpro/src/app/dashboard/page.tsx', 'w') as f:
    f.write(content)

print("Dashboard home page written successfully")
