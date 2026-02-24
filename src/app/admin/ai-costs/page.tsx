"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    Cpu,
    DollarSign,
    TrendingUp,
    Zap,
    Users,
    AlertTriangle,
    Download,
    Search,
    RefreshCw,
    Loader2,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import { authFetch } from "@/lib/auth-client";

interface ClientCost {
    id: string;
    name: string;
    email: string;
    plan: string;
    models: Record<string, { queries: number; tokens: number; cost: number }>;
    totalCost: number;
    totalQueries: number;
    totalTokens: number;
    platformFee: number;
    margin: number;
}

interface DailyCost {
    date: string;
    cost: number;
    queries: number;
    tokens: number;
    models: Record<string, number>;
}

interface Totals {
    totalCost: number;
    totalRevenue: number;
    totalMargin: number;
    totalQueries: number;
    totalTokens: number;
    marginPct: number;
    avgCostPerQuery: number;
}

export default function AdminAICostsPage() {
    const [clients, setClients] = useState<ClientCost[]>([]);
    const [daily, setDaily] = useState<DailyCost[]>([]);
    const [totals, setTotals] = useState<Totals | null>(null);
    const [modelBreakdown, setModelBreakdown] = useState<Record<string, { queries: number; tokens: number; cost: number }>>({});
    const [unprofitableCount, setUnprofitableCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("totalCost");
    const [expandedClient, setExpandedClient] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await authFetch("/api/admin/costs");
            if (res.ok) {
                const data = await res.json();
                setClients(data.clients || []);
                setDaily(data.daily || []);
                setTotals(data.totals || null);
                setModelBreakdown(data.modelBreakdown || {});
                setUnprofitableCount(data.unprofitableCount || 0);
            }
        } catch { /* ignore */ }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const filtered = clients
        .filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => {
            switch (sortBy) {
                case "totalCost": return b.totalCost - a.totalCost;
                case "margin": return b.margin - a.margin;
                case "queries": return b.totalQueries - a.totalQueries;
                case "name": return a.name.localeCompare(b.name);
                default: return 0;
            }
        });

    const maxDailyCost = Math.max(1, ...daily.map(d => d.cost));

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32">
                <Loader2 className="w-8 h-8 text-gray-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white">AI Costs</h2>
                    <p className="text-gray-500 text-sm mt-1">Real-time AI usage costs per client this month</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchData} className="flex items-center gap-2 px-3 py-2 bg-gray-800 text-gray-300 text-sm rounded-lg hover:bg-gray-700 border border-gray-700">
                        <RefreshCw className="w-4 h-4" /> Refresh
                    </button>
                </div>
            </div>

            {/* Summary cards */}
            {totals && (
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-xs text-gray-500"><DollarSign className="w-3 h-3" /> Total AI Cost</div>
                        <div className="text-xl font-bold text-red-400 mt-1">${totals.totalCost.toFixed(2)}</div>
                    </div>
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-xs text-gray-500"><TrendingUp className="w-3 h-3" /> Revenue</div>
                        <div className="text-xl font-bold text-green-400 mt-1">${totals.totalRevenue.toLocaleString()}</div>
                    </div>
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-xs text-gray-500"><DollarSign className="w-3 h-3" /> Margin</div>
                        <div className={`text-xl font-bold mt-1 ${totals.totalMargin >= 0 ? "text-green-400" : "text-red-400"}`}>
                            ${totals.totalMargin.toFixed(2)} ({totals.marginPct.toFixed(1)}%)
                        </div>
                    </div>
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-xs text-gray-500"><Zap className="w-3 h-3" /> Total Queries</div>
                        <div className="text-xl font-bold text-white mt-1">{totals.totalQueries.toLocaleString()}</div>
                    </div>
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-xs text-gray-500"><Cpu className="w-3 h-3" /> Avg $/Query</div>
                        <div className="text-xl font-bold text-amber-400 mt-1">${totals.avgCostPerQuery.toFixed(4)}</div>
                    </div>
                </div>
            )}

            {/* Model breakdown */}
            {Object.keys(modelBreakdown).length > 0 && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-blue-400" /> Model Breakdown
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {Object.entries(modelBreakdown).map(([model, data]) => (
                            <div key={model} className="p-3 bg-gray-800/50 rounded-lg">
                                <div className="text-sm text-white font-medium">{model}</div>
                                <div className="text-xs text-gray-500 mt-1">{data.queries.toLocaleString()} queries</div>
                                <div className="text-xs text-gray-500">{(data.tokens / 1000).toFixed(0)}k tokens</div>
                                <div className="text-sm text-amber-400 font-bold mt-1">${data.cost.toFixed(2)}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Daily cost chart */}
            {daily.length > 0 && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-400" /> Daily AI Cost (Last 14 Days)
                    </h3>
                    <div className="flex items-end gap-2 h-40">
                        {daily.map((d) => (
                            <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                                <span className="text-[10px] text-gray-400">${d.cost.toFixed(1)}</span>
                                <div
                                    className="w-full bg-gradient-to-t from-red-600 to-amber-400 rounded-t-md"
                                    style={{ height: `${Math.max(4, (d.cost / maxDailyCost) * 120)}px` }}
                                />
                                <span className="text-[9px] text-gray-600 mt-1">{d.date.slice(5)}</span>
                                <span className="text-[9px] text-gray-500">{d.queries}q</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Unprofitable warning */}
            {unprofitableCount > 0 && (
                <div className="bg-red-950/30 border border-red-800/40 rounded-xl p-4 flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                    <div>
                        <div className="text-sm text-red-400 font-medium">{unprofitableCount} unprofitable client{unprofitableCount > 1 ? "s" : ""}</div>
                        <div className="text-xs text-red-400/70">AI costs exceed subscription revenue for these clients</div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search clients..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    />
                </div>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-3 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-300 focus:outline-none">
                    <option value="totalCost">Sort by Cost</option>
                    <option value="margin">Sort by Margin</option>
                    <option value="queries">Sort by Queries</option>
                    <option value="name">Sort by Name</option>
                </select>
            </div>

            {/* Client table */}
            {filtered.length === 0 ? (
                <div className="text-center py-20">
                    <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500">No AI usage data yet</p>
                    <p className="text-gray-600 text-sm mt-1">Costs will appear here once users start querying.</p>
                </div>
            ) : (
                <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase">
                                    <th className="text-left px-4 py-3">Client</th>
                                    <th className="text-left px-4 py-3">Plan</th>
                                    <th className="text-right px-4 py-3">Queries</th>
                                    <th className="text-right px-4 py-3">Tokens</th>
                                    <th className="text-right px-4 py-3">AI Cost</th>
                                    <th className="text-right px-4 py-3">Platform Fee</th>
                                    <th className="text-right px-4 py-3">Margin</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800/50">
                                {filtered.map((client) => (
                                    <React.Fragment key={client.id}>
                                        <tr className="hover:bg-gray-800/40 cursor-pointer transition" onClick={() => setExpandedClient(expandedClient === client.id ? null : client.id)}>
                                            <td className="px-4 py-3">
                                                <div className="text-white font-medium flex items-center gap-2">
                                                    {client.name}
                                                    {expandedClient === client.id ? <ChevronUp className="w-3 h-3 text-gray-500" /> : <ChevronDown className="w-3 h-3 text-gray-500" />}
                                                </div>
                                                <div className="text-gray-500 text-xs">{client.email}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${client.plan === "pro" ? "bg-purple-600/20 text-purple-400" :
                                                        client.plan === "starter" ? "bg-blue-600/20 text-blue-400" :
                                                            "bg-gray-700/30 text-gray-400"
                                                    }`}>
                                                    {client.plan.charAt(0).toUpperCase() + client.plan.slice(1)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right text-gray-300">{client.totalQueries.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-right text-gray-300">{(client.totalTokens / 1000).toFixed(0)}k</td>
                                            <td className="px-4 py-3 text-right text-amber-400 font-medium">${client.totalCost.toFixed(2)}</td>
                                            <td className="px-4 py-3 text-right text-green-400">${client.platformFee}</td>
                                            <td className="px-4 py-3 text-right">
                                                <span className={client.margin >= 0 ? "text-green-400" : "text-red-400"}>
                                                    ${client.margin.toFixed(2)}
                                                </span>
                                            </td>
                                        </tr>
                                        {expandedClient === client.id && (
                                            <tr>
                                                <td colSpan={7} className="px-4 py-3 bg-gray-800/30">
                                                    <div className="text-xs text-gray-500 mb-2">Model Breakdown</div>
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                        {Object.entries(client.models).map(([model, data]) => (
                                                            <div key={model} className="p-2 bg-gray-800/50 rounded-lg">
                                                                <div className="text-xs text-gray-400 font-medium">{model}</div>
                                                                <div className="text-xs text-gray-500">{data.queries} queries · {(data.tokens / 1000).toFixed(0)}k tokens</div>
                                                                <div className="text-sm text-amber-400 font-bold">${data.cost.toFixed(2)}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="px-4 py-3 border-t border-gray-800 text-xs text-gray-500">
                        Showing {filtered.length} clients · Live data from PostgreSQL
                    </div>
                </div>
            )}
        </div>
    );
}
