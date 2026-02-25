"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Play, Pause, TrendingUp, TrendingDown, DollarSign, MousePointer,
    Eye, Target, Filter, RefreshCw, AlertCircle, Zap, ArrowRight, Loader2
} from "lucide-react";
import Link from "next/link";
import { authFetch } from "@/lib/auth-client";
import { useBusiness } from "@/lib/business-context";
import { useTranslation } from "@/i18n/context";

interface Campaign {
    id: string;
    name: string;
    status: string;
    type: string;
    biddingStrategy: string;
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

export default function CampaignsPage() {
    const { t } = useTranslation();
    const { activeBusiness } = useBusiness();
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [connected, setConnected] = useState(false);
    const [dateRange, setDateRange] = useState("LAST_30_DAYS");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [mutating, setMutating] = useState<string | null>(null);

    const fetchCampaigns = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({ dateRange });
            if (activeBusiness?.id) params.set("businessId", activeBusiness.id);

            const res = await authFetch(`/api/google-ads/campaigns?${params}`);
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Failed to fetch campaigns");

            setCampaigns(data.campaigns || []);
            setConnected(data.connected !== false);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load campaigns");
        } finally {
            setLoading(false);
        }
    }, [dateRange, activeBusiness?.id]);

    useEffect(() => {
        fetchCampaigns();
    }, [fetchCampaigns]);

    const [mutateError, setMutateError] = useState<string | null>(null);

    const toggleCampaign = async (campaignId: string, currentStatus: string) => {
        const operation = currentStatus === "ENABLED" ? "pause" : "enable";
        if (!confirm(`${operation === "pause" ? "Pause" : "Enable"} this campaign? This will take effect immediately.`)) return;
        setMutating(campaignId);
        setMutateError(null);
        try {
            const res = await authFetch("/api/google-ads/campaigns", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ campaignId, operation, businessId: activeBusiness?.id }),
            });
            if (res.ok) {
                await fetchCampaigns();
            } else {
                setMutateError("Failed to update campaign. Please try again.");
            }
        } catch {
            setMutateError("Network error. Please try again.");
        } finally {
            setMutating(null);
        }
    };

    const filtered = statusFilter === "all"
        ? campaigns
        : campaigns.filter(c => c.status === statusFilter);

    const totals = campaigns.reduce((acc, c) => ({
        cost: acc.cost + c.cost,
        clicks: acc.clicks + c.clicks,
        impressions: acc.impressions + c.impressions,
        conversions: acc.conversions + c.conversions,
    }), { cost: 0, clicks: 0, impressions: 0, conversions: 0 });

    // Not connected — show setup prompt
    if (!loading && !connected) {
        return (
            <div className="max-w-4xl mx-auto space-y-6">
                <h1 className="text-2xl font-bold">{t("campaigns.title")}</h1>
                <div className="bg-card border border-border rounded-2xl p-12 text-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Target className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold mb-2">{t("campaigns.connectTitle")}</h2>
                    <p className="text-muted text-sm max-w-md mx-auto mb-8">
                        {t("campaigns.connectDesc")}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link href="/dashboard/settings" className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-medium transition">
                            {t("campaigns.connectAccount")} <ArrowRight className="w-4 h-4" />
                        </Link>
                        <Link href="/dashboard/chat" className="inline-flex items-center gap-2 bg-card border border-border hover:border-primary px-6 py-3 rounded-xl font-medium transition">
                            <Zap className="w-4 h-4" /> {t("campaigns.planWithAI")}
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">{t("campaigns.title")}</h1>
                    <p className="text-muted text-sm mt-1">
                        {t("campaigns.found", { count: campaigns.length })}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="bg-card border border-border rounded-lg px-3 py-2 text-sm"
                    >
                        <option value="LAST_7_DAYS">{t("campaigns.last7")}</option>
                        <option value="LAST_14_DAYS">{t("campaigns.last14")}</option>
                        <option value="LAST_30_DAYS">{t("campaigns.last30")}</option>
                        <option value="THIS_MONTH">{t("campaigns.thisMonth")}</option>
                        <option value="LAST_MONTH">{t("campaigns.lastMonth")}</option>
                    </select>
                    <button
                        onClick={fetchCampaigns}
                        className="p-2 bg-card border border-border rounded-lg hover:border-primary transition"
                        title="Refresh"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 text-sm text-muted mb-1">
                        <DollarSign className="w-4 h-4" /> {t("campaigns.totalSpend")}
                    </div>
                    <div className="text-2xl font-bold">${totals.cost.toFixed(2)}</div>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 text-sm text-muted mb-1">
                        <MousePointer className="w-4 h-4" /> {t("campaigns.totalClicks")}
                    </div>
                    <div className="text-2xl font-bold">{totals.clicks.toLocaleString()}</div>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 text-sm text-muted mb-1">
                        <Eye className="w-4 h-4" /> {t("campaigns.impressions")}
                    </div>
                    <div className="text-2xl font-bold">{totals.impressions.toLocaleString()}</div>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 text-sm text-muted mb-1">
                        <Target className="w-4 h-4" /> {t("campaigns.conversions")}
                    </div>
                    <div className="text-2xl font-bold">{totals.conversions.toFixed(1)}</div>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-700">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm">{error}</p>
                    <button onClick={fetchCampaigns} className="ml-auto text-sm underline">{t("common.retry")}</button>
                </div>
            )}
            {mutateError && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3 text-amber-700">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <p className="text-sm">{mutateError}</p>
                    <button onClick={() => setMutateError(null)} className="ml-auto text-xs underline">{t("common.dismiss")}</button>
                </div>
            )}

            {/* Filter */}
            <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted" />
                {["all", "ENABLED", "PAUSED"].map((s) => (
                    <button
                        key={s}
                        onClick={() => setStatusFilter(s)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${statusFilter === s
                            ? "bg-primary text-white"
                            : "bg-card border border-border hover:border-primary"
                            }`}
                    >
                        {s === "all" ? t("campaigns.all") : s === "ENABLED" ? t("campaigns.active") : t("campaigns.paused")}
                    </button>
                ))}
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            )}

            {/* Campaign Table */}
            {!loading && filtered.length > 0 && (
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border bg-muted/30">
                                    <th className="text-left p-3 font-medium">{t("campaigns.campaign")}</th>
                                    <th className="text-left p-3 font-medium">{t("campaigns.status")}</th>
                                    <th className="text-left p-3 font-medium">{t("campaigns.type")}</th>
                                    <th className="text-right p-3 font-medium">{t("campaigns.budget")}</th>
                                    <th className="text-right p-3 font-medium">{t("campaigns.spend")}</th>
                                    <th className="text-right p-3 font-medium">{t("campaigns.clicks")}</th>
                                    <th className="text-right p-3 font-medium">{t("campaigns.ctr")}</th>
                                    <th className="text-right p-3 font-medium">{t("campaigns.cpc")}</th>
                                    <th className="text-right p-3 font-medium">{t("campaigns.conv")}</th>
                                    <th className="text-right p-3 font-medium">{t("campaigns.cpa")}</th>
                                    <th className="text-center p-3 font-medium">{t("campaigns.action")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((c) => (
                                    <tr key={c.id} className="border-b border-border/50 hover:bg-muted/10 transition">
                                        <td className="p-3 font-medium max-w-[200px] truncate">{c.name}</td>
                                        <td className="p-3">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${c.status === "ENABLED"
                                                ? "bg-green-100 text-green-700"
                                                : "bg-yellow-100 text-yellow-700"
                                                }`}>
                                                {c.status === "ENABLED" ? t("campaigns.active") : t("campaigns.paused")}
                                            </span>
                                        </td>
                                        <td className="p-3 text-muted">{c.type}</td>
                                        <td className="p-3 text-right">${c.budget.toFixed(2)}/d</td>
                                        <td className="p-3 text-right font-medium">${c.cost.toFixed(2)}</td>
                                        <td className="p-3 text-right">{c.clicks.toLocaleString()}</td>
                                        <td className="p-3 text-right">
                                            <span className="inline-flex items-center gap-1">
                                                {c.ctr > 0.05 ? <TrendingUp className="w-3 h-3 text-green-500" /> : c.ctr < 0.02 ? <TrendingDown className="w-3 h-3 text-red-500" /> : null}
                                                {(c.ctr * 100).toFixed(2)}%
                                            </span>
                                        </td>
                                        <td className="p-3 text-right">${c.avgCpc.toFixed(2)}</td>
                                        <td className="p-3 text-right font-medium">{c.conversions.toFixed(1)}</td>
                                        <td className="p-3 text-right">{c.costPerConversion > 0 ? `$${c.costPerConversion.toFixed(2)}` : "-"}</td>
                                        <td className="p-3 text-center">
                                            <button
                                                onClick={() => toggleCampaign(c.id, c.status)}
                                                disabled={mutating === c.id}
                                                className={`p-1.5 rounded-lg transition ${c.status === "ENABLED"
                                                    ? "hover:bg-yellow-100 text-yellow-600"
                                                    : "hover:bg-green-100 text-green-600"
                                                    } disabled:opacity-50`}
                                                title={c.status === "ENABLED" ? "Pause" : "Enable"}
                                            >
                                                {mutating === c.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : c.status === "ENABLED" ? (
                                                    <Pause className="w-4 h-4" />
                                                ) : (
                                                    <Play className="w-4 h-4" />
                                                )}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Empty state */}
            {!loading && filtered.length === 0 && campaigns.length === 0 && connected && (
                <div className="bg-card border border-border rounded-2xl p-12 text-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Target className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold mb-2">{t("campaigns.noCampaigns")}</h2>
                    <p className="text-muted text-sm max-w-md mx-auto mb-8">
                        {t("campaigns.noCampaignsDesc")}
                    </p>
                    <Link href="/dashboard/chat" className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-medium transition">
                        <Zap className="w-4 h-4" /> {t("campaigns.createWithAI")} <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            )}

            {/* AI Tip */}
            {campaigns.length > 0 && (
                <div className="bg-primary-light border border-primary/20 rounded-xl p-4">
                    <p className="text-sm">
                        <strong>\ud83d\udca1 {t("campaigns.proTip")}:</strong> {t("campaigns.proTipText")}
                    </p>
                </div>
            )}
        </div>
    );
}
