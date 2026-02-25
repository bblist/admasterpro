"use client";

import {
    Users,
    DollarSign,
    TrendingUp,
    Activity,
    ArrowUpRight,
    ArrowDownRight,
    Zap,
    MessageCircle,
    UserPlus,
    AlertTriangle,
    CheckCircle,
    Bell,
    Crown,
    RefreshCw,
    Database,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { authFetch } from "@/lib/auth-client";

interface AdminStats {
    overview: {
        totalUsers: number;
        usersThisWeek: number;
        mrr: number;
        arr: number;
        totalAICost: number;
        totalQueries: number;
        totalTokens: number;
        avgCostPerQuery: number;
        margin: number;
    };
    planDistribution: { free: number; trial: number; starter: number; pro: number };
    recentSignups: Array<{ name: string; email: string; plan: string; joined: string; status: string }>;
    topSpenders: Array<{ name: string; email: string; plan: string; aiCost: number; queries: number; totalTokens: number; platformFee: number; margin: number }>;
    dbError?: boolean;
}

const platformHealth = [
    { label: "API Uptime", value: "—", status: "good" },
    { label: "Avg Response Time", value: "—", status: "good" },
    { label: "Google Ads API", value: "Pending", status: "warning" },
    { label: "AI Primary (GPT-4o)", value: "—", status: "good" },
    { label: "AI Fallback (Claude)", value: "—", status: "good" },
    { label: "Database", value: "Connected", status: "good" },
];

export default function AdminOverview() {
    const [data, setData] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

    const fetchStats = useCallback(async () => {
        setLoading(true);
        try {
            const res = await authFetch("/api/admin/stats");
            if (res.ok) {
                setData(await res.json());
            }
        } catch {
            /* ignore */
        } finally {
            setLoading(false);
            setLastRefresh(new Date());
        }
    }, []);

    useEffect(() => { fetchStats(); }, [fetchStats]);

    const o = data?.overview;
    const pd = data?.planDistribution;
    const totalPlanUsers = pd ? pd.free + (pd.trial || 0) + pd.starter + pd.pro : 0;

    const stats = [
        {
            label: "Total Users",
            value: o ? o.totalUsers.toLocaleString() : "—",
            detail: o ? `${o.usersThisWeek} joined this week` : "",
            icon: Users,
            color: "blue",
        },
        {
            label: "Monthly Revenue (MRR)",
            value: o ? `$${o.mrr.toLocaleString()}` : "—",
            detail: o ? `$${o.arr.toLocaleString()} ARR` : "",
            icon: DollarSign,
            color: "green",
        },
        {
            label: "AI Cost This Month",
            value: o ? `$${o.totalAICost.toFixed(2)}` : "—",
            detail: o ? `Margin: $${o.margin.toFixed(2)}` : "",
            icon: Activity,
            color: "purple",
        },
        {
            label: "AI Queries This Month",
            value: o ? o.totalQueries.toLocaleString() : "—",
            detail: o ? `Avg $${o.avgCostPerQuery}/query` : "",
            icon: MessageCircle,
            color: "amber",
        },
    ];

    const colorClasses: Record<string, { bg: string; text: string; icon: string }> = {
        blue: { bg: "bg-blue-900/30", text: "text-blue-400", icon: "bg-blue-600" },
        green: { bg: "bg-green-900/30", text: "text-green-400", icon: "bg-green-600" },
        purple: { bg: "bg-purple-900/30", text: "text-purple-400", icon: "bg-purple-600" },
        amber: { bg: "bg-amber-900/30", text: "text-amber-400", icon: "bg-amber-600" },
    };

    const timeAgo = (iso: string) => {
        const diff = Date.now() - new Date(iso).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    };

    return (
        <div className="space-y-6">
            {/* Page title */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Platform Overview</h2>
                    <p className="text-gray-500 text-sm mt-1">
                        Real-time metrics — Last updated: {lastRefresh.toLocaleTimeString()}
                        {data?.dbError && (
                            <span className="ml-2 text-amber-400">
                                <Database className="w-3 h-3 inline" /> DB not connected
                            </span>
                        )}
                    </p>
                </div>
                <button
                    onClick={fetchStats}
                    disabled={loading}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg border border-gray-700 transition"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                    Refresh
                </button>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {stats.map((s) => {
                    const c = colorClasses[s.color];
                    return (
                        <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                            <div className="flex items-center justify-between mb-3">
                                <div className={`w-10 h-10 ${c.icon} rounded-lg flex items-center justify-center`}>
                                    <s.icon className="w-5 h-5 text-white" />
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-white">
                                {loading ? <span className="animate-pulse">...</span> : s.value}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
                            <div className={`text-xs ${c.text} mt-2`}>{s.detail}</div>
                        </div>
                    );
                })}
            </div>

            {/* Plan Distribution + Platform Health */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Plan Distribution */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                        <Crown className="w-4 h-4 text-amber-400" />
                        Plan Distribution
                    </h3>
                    {pd && totalPlanUsers > 0 ? (
                        <div className="space-y-4">
                            {[
                                { label: "Free", count: pd.free, color: "bg-gray-500", price: "$0" },
                                { label: "Starter", count: pd.starter, color: "bg-blue-500", price: "$49" },
                                { label: "Pro", count: pd.pro, color: "bg-purple-500", price: "$149" },
                            ].map((p) => (
                                <div key={p.label}>
                                    <div className="flex items-center justify-between text-sm mb-1">
                                        <span className="text-gray-300">{p.label} <span className="text-gray-600">({p.price}/mo)</span></span>
                                        <span className="text-white font-medium">
                                            {p.count} <span className="text-gray-600">({totalPlanUsers > 0 ? Math.round((p.count / totalPlanUsers) * 100) : 0}%)</span>
                                        </span>
                                    </div>
                                    <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${p.color} rounded-full transition-all`}
                                            style={{ width: `${totalPlanUsers > 0 ? (p.count / totalPlanUsers) * 100 : 0}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-sm">No subscription data yet</p>
                    )}
                </div>

                {/* Platform Health */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-white mb-4">Platform Health</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {platformHealth.map((h) => (
                            <div
                                key={h.label}
                                className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
                            >
                                <div>
                                    <div className="text-xs text-gray-500">{h.label}</div>
                                    <div className="text-sm font-semibold text-white">{h.value}</div>
                                </div>
                                <div
                                    className={`w-2.5 h-2.5 rounded-full ${h.status === "good" ? "bg-green-500" : "bg-amber-500"}`}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Recent Signups + Top AI Spenders */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Recent Signups */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                            <UserPlus className="w-4 h-4 text-blue-400" />
                            Recent Signups
                        </h3>
                        <a href="/admin/users" className="text-xs text-blue-400 hover:text-blue-300">View all →</a>
                    </div>
                    {data?.recentSignups && data.recentSignups.length > 0 ? (
                        <div className="space-y-3">
                            {data.recentSignups.map((u, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-gray-800/40 rounded-lg">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                            {u.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-sm text-white font-medium truncate">{u.name}</div>
                                            <div className="text-xs text-gray-500 truncate">{u.email}</div>
                                        </div>
                                    </div>
                                    <div className="text-right flex-shrink-0 ml-3">
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${u.plan === "pro" ? "bg-purple-900/40 text-purple-400"
                                                : u.plan === "starter" ? "bg-blue-900/40 text-blue-400"
                                                    : "bg-gray-800 text-gray-400"
                                            }`}>
                                            {u.plan.charAt(0).toUpperCase() + u.plan.slice(1)}
                                        </span>
                                        <div className="text-xs text-gray-600 mt-1">{timeAgo(u.joined)}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-sm py-6 text-center">No signups yet</p>
                    )}
                </div>

                {/* Top AI Cost Users */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-green-400" />
                            Top AI Spenders (Your Cost)
                        </h3>
                        <a href="/admin/ai-costs" className="text-xs text-blue-400 hover:text-blue-300">AI costs →</a>
                    </div>
                    {data?.topSpenders && data.topSpenders.length > 0 ? (
                        <div className="space-y-3">
                            {data.topSpenders.slice(0, 5).map((s, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-gray-800/40 rounded-lg">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-7 h-7 bg-gray-700 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                            #{i + 1}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-sm text-white font-medium truncate">{s.name}</div>
                                            <div className="text-xs text-gray-500">{s.queries} queries · {s.plan}</div>
                                        </div>
                                    </div>
                                    <div className="text-right flex-shrink-0 ml-3">
                                        <div className="text-sm font-bold text-red-400">-${s.aiCost.toFixed(2)}</div>
                                        <div className={`text-xs ${s.margin >= 0 ? "text-green-500" : "text-red-500"}`}>
                                            Margin: ${s.margin.toFixed(2)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-sm py-6 text-center">No usage data yet</p>
                    )}
                </div>
            </div>

            {/* Plan Quick Stats */}
            {pd && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                        { label: "Free Users", value: pd.free.toString(), pct: totalPlanUsers > 0 ? `${Math.round((pd.free / totalPlanUsers) * 100)}%` : "—" },
                        { label: "Starter Users", value: pd.starter.toString(), pct: totalPlanUsers > 0 ? `${Math.round((pd.starter / totalPlanUsers) * 100)}%` : "—" },
                        { label: "Pro Users", value: pd.pro.toString(), pct: totalPlanUsers > 0 ? `${Math.round((pd.pro / totalPlanUsers) * 100)}%` : "—" },
                        { label: "Profit Margin", value: o ? `$${o.margin.toFixed(0)}` : "—", pct: o && o.mrr > 0 ? `${Math.round((o.margin / o.mrr) * 100)}%` : "—" },
                    ].map((item) => (
                        <div key={item.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
                            <div className="text-xl font-bold text-white">{item.value}</div>
                            <div className="text-xs text-gray-500">{item.label}</div>
                            <div className="text-xs text-gray-600 mt-1">{item.pct}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
