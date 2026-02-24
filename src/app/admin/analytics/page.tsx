"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    MessageCircle,
    Zap,
    TrendingUp,
    Activity,
    Users,
    Loader2,
    RefreshCw,
    Cpu,
} from "lucide-react";
import { authFetch } from "@/lib/auth-client";

interface AnalyticsData {
    todayQueries: number;
    weekQueries: number;
    avgPerUser: number;
    activeUsersWeek: number;
    activeTodayCount: number;
    totalUsers: number;
    modelUsage: { model: string; queries: number; tokens: number; cost: number }[];
    featureUsage: { feature: string; usage: number; pct: number }[];
    topQueries: { query: string; count: number }[];
    weekCost: number;
    weekTokens: number;
}

export default function AdminAnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await authFetch("/api/admin/analytics");
            if (res.ok) setData(await res.json());
        } catch { /* ignore */ }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    if (loading || !data) {
        return (
            <div className="flex items-center justify-center py-32">
                <Loader2 className="w-8 h-8 text-gray-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Analytics</h2>
                    <p className="text-gray-500 text-sm mt-1">Platform usage patterns, AI performance, and user engagement</p>
                </div>
                <button onClick={fetchData} className="flex items-center gap-2 px-3 py-2 bg-gray-800 text-gray-300 text-sm rounded-lg hover:bg-gray-700 border border-gray-700">
                    <RefreshCw className="w-4 h-4" /> Refresh
                </button>
            </div>

            {/* Key metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                    <div className="text-2xl font-bold text-white">{data.todayQueries.toLocaleString()}</div>
                    <div className="text-xs text-gray-500 mt-1">Queries Today</div>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                    <div className="text-2xl font-bold text-white">{data.weekQueries.toLocaleString()}</div>
                    <div className="text-xs text-gray-500 mt-1">Queries This Week</div>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                    <div className="text-2xl font-bold text-white">{data.avgPerUser}</div>
                    <div className="text-xs text-gray-500 mt-1">Avg Queries / User (Week)</div>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                    <div className="text-2xl font-bold text-blue-400">{data.activeTodayCount}</div>
                    <div className="text-xs text-gray-500 mt-1">Active Users Today</div>
                    <div className="text-xs text-gray-600 mt-0.5">{data.activeUsersWeek} this week</div>
                </div>
            </div>

            {/* AI Engine Metrics + Model Usage */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-400" /> AI Engine Metrics (This Week)
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-gray-800/50 rounded-lg">
                            <div className="text-lg font-bold text-white">{data.weekQueries.toLocaleString()}</div>
                            <div className="text-xs text-gray-500 mt-0.5">Total Queries</div>
                        </div>
                        <div className="p-3 bg-gray-800/50 rounded-lg">
                            <div className="text-lg font-bold text-white">{(data.weekTokens / 1000).toFixed(0)}k</div>
                            <div className="text-xs text-gray-500 mt-0.5">Total Tokens</div>
                        </div>
                        <div className="p-3 bg-gray-800/50 rounded-lg">
                            <div className="text-lg font-bold text-amber-400">${data.weekCost.toFixed(2)}</div>
                            <div className="text-xs text-gray-500 mt-0.5">Total AI Cost</div>
                        </div>
                        <div className="p-3 bg-gray-800/50 rounded-lg">
                            <div className="text-lg font-bold text-white">{data.activeUsersWeek}</div>
                            <div className="text-xs text-gray-500 mt-0.5">Unique Users</div>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-blue-400" /> Model Usage
                    </h3>
                    {data.modelUsage.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500 text-sm">No model usage data yet</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {data.modelUsage.map((m) => {
                                const totalQ = data.modelUsage.reduce((s, x) => s + x.queries, 0) || 1;
                                const pct = Math.round((m.queries / totalQ) * 100);
                                return (
                                    <div key={m.model}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm text-white">{m.model}</span>
                                            <span className="text-xs text-gray-400">{m.queries} queries ({pct}%)</span>
                                        </div>
                                        <div className="w-full bg-gray-800 rounded-full h-2">
                                            <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                                        </div>
                                        <div className="flex justify-between mt-0.5">
                                            <span className="text-[10px] text-gray-600">{(m.tokens / 1000).toFixed(0)}k tokens</span>
                                            <span className="text-[10px] text-amber-400">${m.cost.toFixed(2)}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Feature Usage */}
            {data.featureUsage.length > 0 && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-green-400" /> Feature Usage (This Week)
                    </h3>
                    <div className="space-y-3">
                        {data.featureUsage.map((f) => (
                            <div key={f.feature} className="flex items-center gap-4">
                                <div className="w-44 text-sm text-gray-300 flex-shrink-0 truncate">{f.feature}</div>
                                <div className="flex-1 bg-gray-800 rounded-full h-3">
                                    <div className="bg-gradient-to-r from-green-600 to-emerald-400 h-3 rounded-full" style={{ width: `${f.pct}%` }} />
                                </div>
                                <div className="w-16 text-right text-sm text-gray-400 flex-shrink-0">{f.usage.toLocaleString()}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Top Queries */}
            {data.topQueries.length > 0 && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-blue-400" /> Most Common User Queries (This Week)
                    </h3>
                    <div className="space-y-2">
                        {data.topQueries.map((q, i) => (
                            <div key={i} className="flex items-center justify-between p-2.5 bg-gray-800/30 rounded-lg">
                                <div className="flex items-center gap-3 min-w-0">
                                    <span className="text-xs text-gray-600 w-5">#{i + 1}</span>
                                    <div className="text-sm text-gray-300 truncate">\u201c{q.query}\u201d</div>
                                </div>
                                <span className="text-xs text-white font-medium flex-shrink-0 ml-2">{q.count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* User engagement summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: "Total Users", value: data.totalUsers.toLocaleString() },
                    { label: "Active This Week", value: String(data.activeUsersWeek) },
                    { label: "Active Today", value: String(data.activeTodayCount) },
                    { label: "Engagement Rate", value: data.totalUsers > 0 ? `${((data.activeUsersWeek / data.totalUsers) * 100).toFixed(1)}%` : "0%" },
                ].map((item) => (
                    <div key={item.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
                        <div className="text-xl font-bold text-white">{item.value}</div>
                        <div className="text-xs text-gray-500 mt-1">{item.label}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
