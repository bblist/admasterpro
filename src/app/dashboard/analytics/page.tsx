"use client";

import { useState, useEffect, useCallback } from "react";
import {
    BarChart3, TrendingUp, TrendingDown, DollarSign, MousePointer,
    Eye, Target, RefreshCw, AlertCircle, Loader2, ArrowRight, Zap,
    Calendar
} from "lucide-react";
import Link from "next/link";
import {
    LineChart, Line, AreaChart, Area, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { authFetch } from "@/lib/auth-client";
import { useBusiness } from "@/lib/business-context";

interface DailyData {
    date: string;
    impressions: number;
    clicks: number;
    cost: number;
    conversions: number;
    ctr: number;
}

interface SummaryData {
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

interface SearchTermData {
    searchTerm: string;
    campaignName: string;
    impressions: number;
    clicks: number;
    cost: number;
    conversions: number;
    ctr: number;
}

export default function AnalyticsPage() {
    const { activeBusiness } = useBusiness();
    const [dailyData, setDailyData] = useState<DailyData[]>([]);
    const [summary, setSummary] = useState<SummaryData | null>(null);
    const [searchTerms, setSearchTerms] = useState<SearchTermData[]>([]);
    const [loading, setLoading] = useState(true);
    const [connected, setConnected] = useState(false);
    const [days, setDays] = useState(30);
    const [activeChart, setActiveChart] = useState<"cost" | "clicks" | "conversions" | "ctr">("cost");
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (activeBusiness?.id) params.set("businessId", activeBusiness.id);

            const [dailyRes, summaryRes, searchRes] = await Promise.all([
                authFetch(`/api/google-ads/performance?type=daily&days=${days}&${params}`),
                authFetch(`/api/google-ads/performance?type=summary&dateRange=LAST_${days}_DAYS&${params}`),
                authFetch(`/api/google-ads/performance?type=search-terms&dateRange=LAST_${days}_DAYS&${params}`),
            ]);

            const [dailyJson, summaryJson, searchJson] = await Promise.all([
                dailyRes.json(),
                summaryRes.json(),
                searchRes.json(),
            ]);

            setDailyData(dailyJson.data || []);
            setSummary(summaryJson.data || null);
            setSearchTerms(searchJson.data || []);
            setConnected(dailyJson.connected !== false);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load analytics");
        } finally {
            setLoading(false);
        }
    }, [days, activeBusiness?.id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const chartData = dailyData.map(d => ({
        ...d,
        date: d.date.slice(5), // MM-DD
        ctr: d.ctr * 100,
    }));

    const chartConfigs = {
        cost: { key: "cost", color: "#6366f1", label: "Spend ($)", prefix: "$" },
        clicks: { key: "clicks", color: "#22c55e", label: "Clicks", prefix: "" },
        conversions: { key: "conversions", color: "#f59e0b", label: "Conversions", prefix: "" },
        ctr: { key: "ctr", color: "#8b5cf6", label: "CTR (%)", prefix: "" },
    };
    const chart = chartConfigs[activeChart];

    if (!loading && !connected) {
        return (
            <div className="max-w-4xl mx-auto space-y-6">
                <h1 className="text-2xl font-bold">Analytics</h1>
                <div className="bg-card border border-border rounded-2xl p-12 text-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <BarChart3 className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold mb-2">Connect Google Ads for Analytics</h2>
                    <p className="text-muted text-sm max-w-md mx-auto mb-8">
                        Link your Google Ads account to see detailed performance analytics, trends, and insights.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link href="/dashboard/settings" className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-medium transition">
                            Connect Account <ArrowRight className="w-4 h-4" />
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
                    <h1 className="text-2xl font-bold">Analytics</h1>
                    <p className="text-muted text-sm mt-1">Performance overview for your Google Ads account</p>
                </div>
                <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted" />
                    <select value={days} onChange={(e) => setDays(Number(e.target.value))}
                        className="bg-card border border-border rounded-lg px-3 py-2 text-sm">
                        <option value={7}>Last 7 days</option>
                        <option value={14}>Last 14 days</option>
                        <option value={30}>Last 30 days</option>
                        <option value={90}>Last 90 days</option>
                    </select>
                    <button onClick={fetchData} className="p-2 bg-card border border-border rounded-lg hover:border-primary transition">
                        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                    </button>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-700">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm">{error}</p>
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            )}

            {!loading && summary && (
                <>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-card border border-border rounded-xl p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-muted">Total Spend</span>
                                <DollarSign className="w-4 h-4 text-muted" />
                            </div>
                            <div className="text-2xl font-bold">${summary.cost.toFixed(2)}</div>
                            <div className="text-xs text-muted mt-1">Avg CPC: ${summary.avgCpc.toFixed(2)}</div>
                        </div>
                        <div className="bg-card border border-border rounded-xl p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-muted">Clicks</span>
                                <MousePointer className="w-4 h-4 text-muted" />
                            </div>
                            <div className="text-2xl font-bold">{summary.clicks.toLocaleString()}</div>
                            <div className="text-xs text-muted mt-1">
                                <span className="inline-flex items-center gap-1">
                                    CTR: {(summary.ctr * 100).toFixed(2)}%
                                    {summary.ctr > 0.03 ? <TrendingUp className="w-3 h-3 text-green-500" /> : <TrendingDown className="w-3 h-3 text-red-500" />}
                                </span>
                            </div>
                        </div>
                        <div className="bg-card border border-border rounded-xl p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-muted">Impressions</span>
                                <Eye className="w-4 h-4 text-muted" />
                            </div>
                            <div className="text-2xl font-bold">{summary.impressions.toLocaleString()}</div>
                            <div className="text-xs text-muted mt-1">
                                {summary.activeCampaigns} active, {summary.pausedCampaigns} paused
                            </div>
                        </div>
                        <div className="bg-card border border-border rounded-xl p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-muted">Conversions</span>
                                <Target className="w-4 h-4 text-muted" />
                            </div>
                            <div className="text-2xl font-bold">{summary.conversions.toFixed(1)}</div>
                            <div className="text-xs text-muted mt-1">CPA: ${summary.costPerConversion.toFixed(2)}</div>
                        </div>
                    </div>

                    {/* Chart */}
                    <div className="bg-card border border-border rounded-xl p-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                            <h2 className="text-lg font-semibold">Performance Trend</h2>
                            <div className="flex items-center gap-1 bg-muted/30 rounded-lg p-1">
                                {(Object.keys(chartConfigs) as Array<keyof typeof chartConfigs>).map((key) => (
                                    <button key={key} onClick={() => setActiveChart(key)}
                                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${activeChart === key ? "bg-white shadow text-foreground" : "text-muted hover:text-foreground"
                                            }`}>
                                        {chartConfigs[key].label.split(" ")[0]}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={320}>
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorFill" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={chart.color} stopOpacity={0.15} />
                                            <stop offset="95%" stopColor={chart.color} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                                    <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                                    <Tooltip
                                        contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
                                        formatter={(value) => [
                                            `${chart.prefix}${typeof value === "number" ? (value as number).toFixed(2) : value}`,
                                            chart.label
                                        ]}
                                    />
                                    <Area type="monotone" dataKey={chart.key} stroke={chart.color}
                                        strokeWidth={2} fill="url(#colorFill)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[320px] flex items-center justify-center text-muted">
                                No data for the selected period
                            </div>
                        )}
                    </div>

                    {/* Cost & Clicks Comparison Chart */}
                    {chartData.length > 0 && (
                        <div className="bg-card border border-border rounded-xl p-6">
                            <h2 className="text-lg font-semibold mb-6">Cost vs. Clicks</h2>
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                                    <YAxis yAxisId="left" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                                    <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }} />
                                    <Legend />
                                    <Bar yAxisId="left" dataKey="cost" fill="#6366f1" radius={[4, 4, 0, 0]} name="Spend ($)" />
                                    <Bar yAxisId="right" dataKey="clicks" fill="#22c55e" radius={[4, 4, 0, 0]} name="Clicks" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Conversions Line Chart */}
                    {chartData.length > 0 && (
                        <div className="bg-card border border-border rounded-xl p-6">
                            <h2 className="text-lg font-semibold mb-6">Conversions Over Time</h2>
                            <ResponsiveContainer width="100%" height={280}>
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                                    <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                                    <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }} />
                                    <Line type="monotone" dataKey="conversions" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Search Terms (Money Leaks) */}
                    {searchTerms.length > 0 && (
                        <div className="bg-card border border-border rounded-xl overflow-hidden">
                            <div className="p-4 border-b border-border">
                                <h2 className="text-lg font-semibold">Top Search Terms</h2>
                                <p className="text-sm text-muted">What people actually searched to trigger your ads</p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border bg-muted/30">
                                            <th className="text-left p-3 font-medium">Search Term</th>
                                            <th className="text-left p-3 font-medium">Campaign</th>
                                            <th className="text-right p-3 font-medium">Clicks</th>
                                            <th className="text-right p-3 font-medium">Cost</th>
                                            <th className="text-right p-3 font-medium">Conv.</th>
                                            <th className="text-right p-3 font-medium">CTR</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {searchTerms.slice(0, 20).map((st, i) => (
                                            <tr key={i} className="border-b border-border/50 hover:bg-muted/10">
                                                <td className="p-3 font-medium max-w-[200px] truncate">{st.searchTerm}</td>
                                                <td className="p-3 text-muted text-xs max-w-[140px] truncate">{st.campaignName}</td>
                                                <td className="p-3 text-right">{st.clicks}</td>
                                                <td className="p-3 text-right font-medium">${st.cost.toFixed(2)}</td>
                                                <td className="p-3 text-right">{st.conversions.toFixed(1)}</td>
                                                <td className="p-3 text-right">{(st.ctr * 100).toFixed(2)}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* AI Analysis CTA */}
                    <div className="bg-primary-light border border-primary/20 rounded-xl p-4">
                        <p className="text-sm">
                            <strong>\ud83d\udca1 Pro tip:</strong> Ask the AI &mdash; &ldquo;Analyze my last 30 days of ad performance and identify money leaks&rdquo;
                            for a detailed breakdown with specific optimization recommendations.
                        </p>
                    </div>
                </>
            )}
        </div>
    );
}
