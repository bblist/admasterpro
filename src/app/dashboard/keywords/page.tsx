"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Key, Play, Pause, Trash2, TrendingUp, TrendingDown, DollarSign,
    MousePointer, Target, Filter, RefreshCw, AlertCircle, Zap,
    ArrowRight, Loader2, Star
} from "lucide-react";
import Link from "next/link";
import { authFetch } from "@/lib/auth-client";
import { useBusiness } from "@/lib/business-context";
import { useTranslation } from "@/i18n/context";
import Tooltip from "@/components/Tooltip";

interface Keyword {
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

const matchTypeLabels: Record<string, string> = {
    BROAD: "Broad",
    PHRASE: "Phrase",
    EXACT: "Exact",
};

const matchTypeColors: Record<string, string> = {
    BROAD: "bg-blue-100 text-blue-700",
    PHRASE: "bg-purple-100 text-purple-700",
    EXACT: "bg-green-100 text-green-700",
};

export default function KeywordsPage() {
    const { t } = useTranslation();
    const { activeBusiness } = useBusiness();
    const [keywords, setKeywords] = useState<Keyword[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [connected, setConnected] = useState(false);
    const [dateRange, setDateRange] = useState("LAST_30_DAYS");
    const [matchFilter, setMatchFilter] = useState<string>("all");
    const [sortField, setSortField] = useState<string>("cost");
    const [mutating, setMutating] = useState<string | null>(null);
    const [mutateError, setMutateError] = useState<string | null>(null);

    const fetchKeywords = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({ dateRange });
            if (activeBusiness?.id) params.set("businessId", activeBusiness.id);

            const res = await authFetch(`/api/google-ads/keywords?${params}`);
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Failed to fetch keywords");
            setKeywords(data.keywords || []);
            setConnected(data.connected !== false);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load keywords");
        } finally {
            setLoading(false);
        }
    }, [dateRange, activeBusiness?.id]);

    useEffect(() => {
        fetchKeywords();
    }, [fetchKeywords]);

    const mutateKeyword = async (kw: Keyword, operation: "pause" | "enable" | "remove") => {
        setMutating(kw.id);
        try {
            const res = await authFetch("/api/google-ads/keywords", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    adGroupId: kw.adGroupId,
                    criterionId: kw.id,
                    operation,
                    businessId: activeBusiness?.id,
                }),
            });
            if (res.ok) await fetchKeywords();
            else setMutateError("Failed to update keyword. Please try again.");
        } catch {
            setMutateError("Network error. Please try again.");
        } finally {
            setMutating(null);
        }
    };

    const filtered = keywords
        .filter(k => matchFilter === "all" || k.matchType === matchFilter)
        .sort((a, b) => {
            const aVal = (a as unknown as Record<string, unknown>)[sortField] as number || 0;
            const bVal = (b as unknown as Record<string, unknown>)[sortField] as number || 0;
            return bVal - aVal;
        });

    const totals = keywords.reduce((acc, k) => ({
        cost: acc.cost + k.cost,
        clicks: acc.clicks + k.clicks,
        impressions: acc.impressions + k.impressions,
        conversions: acc.conversions + k.conversions,
    }), { cost: 0, clicks: 0, impressions: 0, conversions: 0 });

    if (!loading && !connected) {
        return (
            <div className="max-w-4xl mx-auto space-y-6">
                <h1 className="text-2xl font-bold">{t("keywords.title")}</h1>
                <div className="bg-card border border-border rounded-2xl p-12 text-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Key className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold mb-2">{t("keywords.connectTitle")}</h2>
                    <p className="text-muted text-sm max-w-md mx-auto mb-8">
                        {t("keywords.connectDesc")}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link href="/dashboard/settings" className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-medium transition">
                            {t("keywords.connectAccount")} <ArrowRight className="w-4 h-4" />
                        </Link>
                        <Link href="/dashboard/chat" className="inline-flex items-center gap-2 bg-card border border-border hover:border-primary px-6 py-3 rounded-xl font-medium transition">
                            <Zap className="w-4 h-4" /> {t("keywords.researchWithAI")}
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
                    <h1 className="text-2xl font-bold">{t("keywords.title")}</h1>
                    <p className="text-muted text-sm mt-1">{t("keywords.tracked", { count: keywords.length })}</p>
                </div>
                <div className="flex items-center gap-2">
                    <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}
                        className="bg-card border border-border rounded-lg px-3 py-2 text-sm">
                        <option value="LAST_7_DAYS">{t("keywords.last7")}</option>
                        <option value="LAST_14_DAYS">{t("keywords.last14")}</option>
                        <option value="LAST_30_DAYS">{t("keywords.last30")}</option>
                        <option value="THIS_MONTH">{t("keywords.thisMonth")}</option>
                        <option value="LAST_MONTH">{t("keywords.lastMonth")}</option>
                    </select>
                    <button onClick={fetchKeywords} className="p-2 bg-card border border-border rounded-lg hover:border-primary transition" title="Refresh">
                        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                    </button>
                </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 text-sm text-muted mb-1"><DollarSign className="w-4 h-4" /> {t("keywords.totalSpend")} <Tooltip text="Total spend on keywords in the selected period. Pause expensive low-performing keywords to save money." position="bottom" /></div>
                    <div className="text-2xl font-bold">${totals.cost.toFixed(2)}</div>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 text-sm text-muted mb-1"><MousePointer className="w-4 h-4" /> {t("keywords.totalClicks")} <Tooltip text="Clicks generated by your keywords. High clicks with few conversions may indicate irrelevant keyword matching." position="bottom" /></div>
                    <div className="text-2xl font-bold">{totals.clicks.toLocaleString()}</div>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 text-sm text-muted mb-1"><Key className="w-4 h-4" /> {t("keywords.title")}</div>
                    <div className="text-2xl font-bold">{keywords.length}</div>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 text-sm text-muted mb-1"><Target className="w-4 h-4" /> {t("keywords.conversions")} <Tooltip text="Actions completed from keyword-triggered ads. Focus budget on keywords with the highest conversion count." position="bottom" /></div>
                    <div className="text-2xl font-bold">{totals.conversions.toFixed(1)}</div>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-700">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm">{error}</p>
                    <button onClick={fetchKeywords} className="ml-auto text-sm underline">{t("common.retry")}</button>
                </div>
            )}
            {mutateError && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3 text-amber-700">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <p className="text-sm">{mutateError}</p>
                    <button onClick={() => setMutateError(null)} className="ml-auto text-xs underline">{t("common.dismiss")}</button>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
                <Filter className="w-4 h-4 text-muted" />
                {["all", "EXACT", "PHRASE", "BROAD"].map((m) => (
                    <button key={m} onClick={() => setMatchFilter(m)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${matchFilter === m ? "bg-primary text-white" : "bg-card border border-border hover:border-primary"
                            }`}>
                        {m === "all" ? "All" : matchTypeLabels[m] || m}
                    </button>
                ))}
                <select value={sortField} onChange={(e) => setSortField(e.target.value)}
                    className="ml-auto bg-card border border-border rounded-lg px-3 py-1.5 text-xs">
                    <option value="cost">{t("keywords.sortSpend")}</option>
                    <option value="clicks">{t("keywords.sortClicks")}</option>
                    <option value="conversions">{t("keywords.sortConversions")}</option>
                    <option value="qualityScore">{t("keywords.sortQS")}</option>
                    <option value="ctr">{t("keywords.sortCTR")}</option>
                </select>
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            )}

            {/* Table */}
            {!loading && filtered.length > 0 && (
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border bg-muted/30">
                                    <th className="text-left p-3 font-medium">{t("keywords.keyword")}</th>
                                    <th className="text-left p-3 font-medium">{t("keywords.match")}</th>
                                    <th className="text-left p-3 font-medium">{t("keywords.campaign")}</th>
                                    <th className="text-center p-3 font-medium">{t("keywords.qs")}</th>
                                    <th className="text-right p-3 font-medium">{t("keywords.impr")}</th>
                                    <th className="text-right p-3 font-medium">{t("keywords.clicks")}</th>
                                    <th className="text-right p-3 font-medium">{t("keywords.ctr")}</th>
                                    <th className="text-right p-3 font-medium">{t("keywords.avgCpc")}</th>
                                    <th className="text-right p-3 font-medium">{t("keywords.spend")}</th>
                                    <th className="text-right p-3 font-medium">{t("keywords.conv")}</th>
                                    <th className="text-center p-3 font-medium">{t("keywords.actions")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((kw) => (
                                    <tr key={`${kw.adGroupId}-${kw.id}`} className="border-b border-border/50 hover:bg-muted/10 transition">
                                        <td className="p-3 font-medium max-w-[180px] truncate">{kw.keyword}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${matchTypeColors[kw.matchType] || "bg-gray-100 text-gray-700"}`}>
                                                {matchTypeLabels[kw.matchType] || kw.matchType}
                                            </span>
                                        </td>
                                        <td className="p-3 text-muted text-xs max-w-[140px] truncate">{kw.campaignName}</td>
                                        <td className="p-3 text-center">
                                            {kw.qualityScore > 0 ? (
                                                <span className={`inline-flex items-center gap-0.5 font-medium ${kw.qualityScore >= 7 ? "text-green-600" : kw.qualityScore >= 5 ? "text-yellow-600" : "text-red-600"
                                                    }`}>
                                                    <Star className="w-3 h-3" /> {kw.qualityScore}
                                                </span>
                                            ) : "-"}
                                        </td>
                                        <td className="p-3 text-right">{kw.impressions.toLocaleString()}</td>
                                        <td className="p-3 text-right">{kw.clicks.toLocaleString()}</td>
                                        <td className="p-3 text-right">
                                            <span className="inline-flex items-center gap-1">
                                                {kw.ctr > 0.05 ? <TrendingUp className="w-3 h-3 text-green-500" /> : kw.ctr < 0.01 ? <TrendingDown className="w-3 h-3 text-red-500" /> : null}
                                                {(kw.ctr * 100).toFixed(2)}%
                                            </span>
                                        </td>
                                        <td className="p-3 text-right">${kw.avgCpc.toFixed(2)}</td>
                                        <td className="p-3 text-right font-medium">${kw.cost.toFixed(2)}</td>
                                        <td className="p-3 text-right font-medium">{kw.conversions.toFixed(1)}</td>
                                        <td className="p-3 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <button onClick={() => mutateKeyword(kw, kw.status === "ENABLED" ? "pause" : "enable")}
                                                    disabled={mutating === kw.id}
                                                    className={`p-1 rounded transition ${kw.status === "ENABLED" ? "hover:bg-yellow-100 text-yellow-600" : "hover:bg-green-100 text-green-600"
                                                        } disabled:opacity-50`}
                                                    title={kw.status === "ENABLED" ? "Pause" : "Enable"}>
                                                    {mutating === kw.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
                                                        kw.status === "ENABLED" ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                                                </button>
                                                <button onClick={() => { if (confirm(`Remove keyword "${kw.keyword}"? This action cannot be undone.`)) mutateKeyword(kw, "remove"); }}
                                                    disabled={mutating === kw.id}
                                                    className="p-1 rounded hover:bg-red-100 text-red-500 transition disabled:opacity-50"
                                                    title="Remove">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {!loading && keywords.length === 0 && connected && (
                <div className="bg-card border border-border rounded-2xl p-12 text-center">
                    <Key className="w-12 h-12 text-muted mx-auto mb-4" />
                    <h2 className="text-xl font-bold mb-2">{t("keywords.noKeywords")}</h2>
                    <p className="text-muted text-sm max-w-md mx-auto mb-6">
                        {t("keywords.noKeywordsDesc")}
                    </p>
                    <Link href="/dashboard/chat" className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-medium transition">
                        <Zap className="w-4 h-4" /> {t("keywords.researchKeywords")} <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            )}
        </div>
    );
}
