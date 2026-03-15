"use client";

import { useState, useEffect, useCallback } from "react";
import {
    ShoppingBag, Package, TrendingUp, Tag, Loader2, DollarSign,
    Eye, MousePointer, Target, AlertCircle, RefreshCw, ExternalLink,
    CheckCircle2, ArrowRight, Zap, BarChart3, Store
} from "lucide-react";
import Link from "next/link";
import { authFetch } from "@/lib/auth-client";
import { useBusiness } from "@/lib/business-context";
import { useTranslation } from "@/i18n/context";
import SetupChecklist from "@/components/SetupChecklist";

interface Campaign {
    id: string;
    name: string;
    status: string;
    type: string;
    budget: number;
    impressions: number;
    clicks: number;
    cost: number;
    conversions: number;
    conversionValue: number;
    ctr: number;
    avgCpc: number;
    costPerConversion: number;
}

export default function ShoppingPage() {
    const { t } = useTranslation();
    const { activeBusiness } = useBusiness();
    void t;

    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState("LAST_30_DAYS");

    const fetchShoppingCampaigns = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({ dateRange });
            if (activeBusiness?.id) params.set("businessId", activeBusiness.id);

            const res = await authFetch(`/api/google-ads/campaigns?${params}`);
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Failed to fetch");

            // Filter for shopping-related campaigns
            const shoppingCampaigns = (data.campaigns || []).filter((c: Campaign) =>
                c.type === "SHOPPING" || c.type === "PERFORMANCE_MAX" ||
                c.name.toLowerCase().includes("shopping") ||
                c.name.toLowerCase().includes("pmax") ||
                c.name.toLowerCase().includes("merchant")
            );

            setCampaigns(shoppingCampaigns);
            setConnected(data.connected !== false);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load");
        } finally {
            setLoading(false);
        }
    }, [dateRange, activeBusiness?.id]);

    useEffect(() => {
        fetchShoppingCampaigns();
    }, [fetchShoppingCampaigns]);

    const totals = campaigns.reduce(
        (acc, c) => ({
            cost: acc.cost + c.cost,
            clicks: acc.clicks + c.clicks,
            impressions: acc.impressions + c.impressions,
            conversions: acc.conversions + c.conversions,
            conversionValue: acc.conversionValue + c.conversionValue,
        }),
        { cost: 0, clicks: 0, impressions: 0, conversions: 0, conversionValue: 0 },
    );

    const roas = totals.cost > 0 ? (totals.conversionValue / totals.cost).toFixed(2) : "0.00";

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <ShoppingBag className="w-6 h-6 text-primary" />
                        Shopping Ads
                    </h1>
                    <p className="text-muted text-sm mt-1">Manage your product listings and shopping campaigns</p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={dateRange}
                        onChange={e => setDateRange(e.target.value)}
                        className="bg-card border border-border rounded-lg px-3 py-2 text-sm"
                    >
                        <option value="LAST_7_DAYS">Last 7 days</option>
                        <option value="LAST_30_DAYS">Last 30 days</option>
                        <option value="LAST_90_DAYS">Last 90 days</option>
                        <option value="THIS_MONTH">This month</option>
                    </select>
                    <button
                        onClick={fetchShoppingCampaigns}
                        className="p-2 bg-card border border-border hover:border-primary rounded-lg transition"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <SetupChecklist
                prereqs={["google_ads", "business_info"]}
                pageContext="Connect your Google Ads account so the AI can manage your Shopping campaigns, product listings, and feed optimization"
                mode="blocking"
            />

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                </div>
            )}

            {/* Shopping campaigns found */}
            {campaigns.length > 0 && (
                <>
                    {/* KPI cards */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <div className="bg-card border border-border rounded-xl p-4">
                            <div className="flex items-center gap-2 text-xs text-muted mb-1">
                                <DollarSign className="w-3.5 h-3.5" /> Spend
                            </div>
                            <p className="text-xl font-bold">${totals.cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                        <div className="bg-card border border-border rounded-xl p-4">
                            <div className="flex items-center gap-2 text-xs text-muted mb-1">
                                <Eye className="w-3.5 h-3.5" /> Impressions
                            </div>
                            <p className="text-xl font-bold">{totals.impressions.toLocaleString()}</p>
                        </div>
                        <div className="bg-card border border-border rounded-xl p-4">
                            <div className="flex items-center gap-2 text-xs text-muted mb-1">
                                <MousePointer className="w-3.5 h-3.5" /> Clicks
                            </div>
                            <p className="text-xl font-bold">{totals.clicks.toLocaleString()}</p>
                        </div>
                        <div className="bg-card border border-border rounded-xl p-4">
                            <div className="flex items-center gap-2 text-xs text-muted mb-1">
                                <Target className="w-3.5 h-3.5" /> Conversions
                            </div>
                            <p className="text-xl font-bold">{totals.conversions.toLocaleString()}</p>
                        </div>
                        <div className="bg-card border border-border rounded-xl p-4">
                            <div className="flex items-center gap-2 text-xs text-muted mb-1">
                                <TrendingUp className="w-3.5 h-3.5" /> ROAS
                            </div>
                            <p className={`text-xl font-bold ${parseFloat(roas) >= 3 ? "text-green-600" : parseFloat(roas) >= 1 ? "text-yellow-600" : "text-red-600"}`}>
                                {roas}x
                            </p>
                        </div>
                    </div>

                    {/* Campaign table */}
                    <div className="bg-card border border-border rounded-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/10 border-b border-border">
                                    <tr>
                                        <th className="text-left px-4 py-3 font-medium">Campaign</th>
                                        <th className="text-left px-4 py-3 font-medium">Status</th>
                                        <th className="text-left px-4 py-3 font-medium">Type</th>
                                        <th className="text-right px-4 py-3 font-medium">Budget</th>
                                        <th className="text-right px-4 py-3 font-medium">Cost</th>
                                        <th className="text-right px-4 py-3 font-medium">Clicks</th>
                                        <th className="text-right px-4 py-3 font-medium">Conv.</th>
                                        <th className="text-right px-4 py-3 font-medium">ROAS</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {campaigns.map(c => {
                                        const campRoas = c.cost > 0 ? (c.conversionValue / c.cost).toFixed(2) : "—";
                                        return (
                                            <tr key={c.id} className="hover:bg-muted/5">
                                                <td className="px-4 py-3 font-medium truncate max-w-[200px]">{c.name}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                                        c.status === "ENABLED" ? "bg-green-100 text-green-700" :
                                                        c.status === "PAUSED" ? "bg-yellow-100 text-yellow-700" :
                                                        "bg-gray-100 text-gray-600"
                                                    }`}>
                                                        {c.status === "ENABLED" ? "Active" : c.status === "PAUSED" ? "Paused" : c.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-muted text-xs">{c.type}</td>
                                                <td className="px-4 py-3 text-right">${c.budget.toFixed(2)}</td>
                                                <td className="px-4 py-3 text-right">${c.cost.toFixed(2)}</td>
                                                <td className="px-4 py-3 text-right">{c.clicks.toLocaleString()}</td>
                                                <td className="px-4 py-3 text-right">{c.conversions}</td>
                                                <td className="px-4 py-3 text-right font-medium">
                                                    <span className={
                                                        campRoas !== "—" && parseFloat(campRoas) >= 3 ? "text-green-600" :
                                                        campRoas !== "—" && parseFloat(campRoas) >= 1 ? "text-yellow-600" :
                                                        campRoas !== "—" ? "text-red-600" : "text-muted"
                                                    }>
                                                        {campRoas === "—" ? "—" : `${campRoas}x`}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* No shopping campaigns but account connected */}
            {campaigns.length === 0 && connected && !error && (
                <div className="bg-card border border-border rounded-2xl p-10 text-center">
                    <ShoppingBag className="w-12 h-12 text-muted/30 mx-auto mb-4" />
                    <h2 className="text-lg font-bold mb-2">No Shopping Campaigns Found</h2>
                    <p className="text-muted text-sm max-w-lg mx-auto mb-6">
                        Your Google Ads account is connected but has no shopping or Performance Max campaigns.
                        Set one up to start promoting your products.
                    </p>
                    <Link
                        href="/dashboard/chat?intent=shopping"
                        className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-xl text-sm font-medium transition"
                    >
                        <Zap className="w-4 h-4" />
                        Create Shopping Campaign with AI
                    </Link>
                </div>
            )}

            {/* Not connected */}
            {!connected && campaigns.length === 0 && !error && (
                <div className="bg-card border border-border rounded-2xl p-10 text-center">
                    <Store className="w-12 h-12 text-muted/30 mx-auto mb-4" />
                    <h2 className="text-lg font-bold mb-2">Connect Google Ads to Get Started</h2>
                    <p className="text-muted text-sm max-w-lg mx-auto mb-6">
                        Connect your Google Ads account in Settings, then link your Google Merchant Center
                        to manage shopping campaigns from here.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link
                            href="/dashboard/settings"
                            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-xl text-sm font-medium transition"
                        >
                            Go to Settings
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                        <Link
                            href="/dashboard/chat?intent=shopping"
                            className="inline-flex items-center gap-2 bg-card border border-border hover:border-primary text-foreground px-5 py-2.5 rounded-xl text-sm font-medium transition"
                        >
                            <Zap className="w-4 h-4" />
                            Plan with AI First
                        </Link>
                    </div>
                </div>
            )}

            {/* Setup guide */}
            <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Shopping Ads Setup Guide
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                            <span className="text-sm font-bold text-primary">1</span>
                        </div>
                        <div>
                            <p className="text-sm font-medium">Create Merchant Center</p>
                            <p className="text-xs text-muted mt-0.5">Set up a Google Merchant Center account and verify your website</p>
                            <a href="https://merchants.google.com" target="_blank" rel="noopener noreferrer"
                               className="text-xs text-primary hover:underline flex items-center gap-1 mt-1">
                                merchants.google.com <ExternalLink className="w-3 h-3" />
                            </a>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                            <span className="text-sm font-bold text-primary">2</span>
                        </div>
                        <div>
                            <p className="text-sm font-medium">Upload Product Feed</p>
                            <p className="text-xs text-muted mt-0.5">Add your products via Shopify, WooCommerce, or manual CSV upload</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                            <span className="text-sm font-bold text-primary">3</span>
                        </div>
                        <div>
                            <p className="text-sm font-medium">Link Accounts</p>
                            <p className="text-xs text-muted mt-0.5">Connect Merchant Center to your Google Ads account</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                            <span className="text-sm font-bold text-primary">4</span>
                        </div>
                        <div>
                            <p className="text-sm font-medium">Create Campaign</p>
                            <p className="text-xs text-muted mt-0.5">Ask our AI to create an optimized shopping or PMax campaign</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Shopping features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card border border-border rounded-xl p-5">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                        <Package className="w-5 h-5 text-purple-600" />
                    </div>
                    <h3 className="font-semibold mb-1">Product Listings</h3>
                    <p className="text-xs text-muted">Show products with images, prices, and ratings directly in search results and the Shopping tab.</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-5">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                    <h3 className="font-semibold mb-1">ROAS Tracking</h3>
                    <p className="text-xs text-muted">Track return on ad spend per product and category. Know exactly which items drive profit.</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-5">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-3">
                        <Tag className="w-5 h-5 text-orange-600" />
                    </div>
                    <h3 className="font-semibold mb-1">Smart Bidding</h3>
                    <p className="text-xs text-muted">Automated bid strategies like Target ROAS and Maximize Conversion Value, tuned by AI.</p>
                </div>
            </div>

            {/* Tip */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                <p className="text-sm">
                    <strong>Pro tip:</strong> Ask the AI Assistant — &quot;Create a Performance Max campaign for my
                    e-commerce store with a $75/day budget&quot; — and it will plan the full campaign structure
                    including asset groups, audience signals, and bidding strategy.
                </p>
            </div>
        </div>
    );
}
