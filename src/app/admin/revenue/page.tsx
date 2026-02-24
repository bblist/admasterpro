"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    CreditCard,
    PieChart,
    ArrowUpRight,
    Users,
    Loader2,
    RefreshCw,
} from "lucide-react";
import { authFetch } from "@/lib/auth-client";

interface RevData {
    currentMRR: number;
    arr: number;
    paidUsers: number;
    totalUsers: number;
    conversionRate: number;
    arpu: number;
    planBreakdown: { plan: string; users: number; revenue: number; color: string }[];
    topClients: { name: string; plan: string; mrr: number; ltv: number; months: number }[];
    recentTransactions: { date: string; description: string; amount: number; type: string }[];
    tokenRevenue: number;
    newSubsThisMonth: number;
}

export default function AdminRevenuePage() {
    const [data, setData] = useState<RevData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await authFetch("/api/admin/revenue");
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

    const totalSubRevenue = data.planBreakdown.reduce((s, p) => s + p.revenue, 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Revenue</h2>
                    <p className="text-gray-500 text-sm mt-1">Financial overview and subscription metrics</p>
                </div>
                <button onClick={fetchData} className="flex items-center gap-2 px-3 py-2 bg-gray-800 text-gray-300 text-sm rounded-lg hover:bg-gray-700 border border-gray-700">
                    <RefreshCw className="w-4 h-4" /> Refresh
                </button>
            </div>

            {/* Top stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-white">${data.currentMRR.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">Monthly Recurring Revenue</div>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-white">${data.arr.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">Annual Run Rate (ARR)</div>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                            <Users className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-white">{data.paidUsers}</div>
                    <div className="text-xs text-gray-500">Paying Subscribers</div>
                    <div className="text-xs text-purple-400 mt-1">{data.conversionRate.toFixed(1)}% conversion rate</div>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 bg-amber-600 rounded-lg flex items-center justify-center">
                            <CreditCard className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-white">${data.arpu.toFixed(0)}</div>
                    <div className="text-xs text-gray-500">Avg Revenue Per Paying User</div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Plan Breakdown */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                        <PieChart className="w-4 h-4 text-purple-400" /> Revenue by Plan
                    </h3>
                    <div className="space-y-4">
                        {data.planBreakdown.map((p) => (
                            <div key={p.plan}>
                                <div className="flex items-center justify-between mb-1">
                                    <div>
                                        <span className="text-sm text-white font-medium">{p.plan}</span>
                                        <span className="text-xs text-gray-500 ml-2">{p.users} users</span>
                                    </div>
                                    <span className="text-sm text-white font-medium">${p.revenue.toLocaleString()}/mo</span>
                                </div>
                                <div className="w-full bg-gray-800 rounded-full h-2">
                                    <div className={`${p.color} h-2 rounded-full transition-all`}
                                        style={{ width: `${totalSubRevenue > 0 ? Math.max(2, (p.revenue / totalSubRevenue) * 100) : 2}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 p-3 bg-gray-800/50 rounded-lg">
                        <div className="text-xs text-gray-500">Total MRR from Subscriptions</div>
                        <div className="text-lg font-bold text-green-400">${totalSubRevenue.toLocaleString()}/mo</div>
                    </div>
                    {data.tokenRevenue > 0 && (
                        <div className="mt-2 p-3 bg-gray-800/50 rounded-lg">
                            <div className="text-xs text-gray-500">Token Top-ups This Month</div>
                            <div className="text-lg font-bold text-blue-400">${data.tokenRevenue.toLocaleString()}</div>
                        </div>
                    )}
                </div>

                {/* Top Revenue Clients */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-400" /> Top Revenue Clients (by LTV)
                    </h3>
                    {data.topClients.length === 0 ? (
                        <div className="text-center py-10">
                            <Users className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                            <p className="text-gray-500 text-sm">No paying clients yet</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {data.topClients.map((c, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-gray-800/40 rounded-lg">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className="text-xs text-gray-500 w-5">#{i + 1}</span>
                                        <div className="min-w-0">
                                            <div className="text-sm text-white font-medium truncate">{c.name}</div>
                                            <div className="text-xs text-gray-500">{c.plan} \u00b7 ${c.mrr}/mo \u00b7 {c.months} months</div>
                                        </div>
                                    </div>
                                    <div className="text-right flex-shrink-0 ml-3">
                                        <div className="text-sm font-bold text-green-400">${c.ltv}</div>
                                        <div className="text-[10px] text-gray-500">LTV</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-blue-400" /> Recent Transactions
                </h3>
                {data.recentTransactions.length === 0 ? (
                    <div className="text-center py-10">
                        <CreditCard className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">No transactions yet</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {data.recentTransactions.map((t, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${t.amount < 0 ? "bg-red-900/30" : "bg-green-900/30"}`}>
                                        {t.amount < 0 ? <TrendingDown className="w-4 h-4 text-red-400" /> : <DollarSign className="w-4 h-4 text-green-400" />}
                                    </div>
                                    <div>
                                        <div className="text-sm text-white">{t.description}</div>
                                        <div className="text-xs text-gray-500">{t.date}</div>
                                    </div>
                                </div>
                                <div className={`text-sm font-bold ${t.amount < 0 ? "text-red-400" : "text-green-400"}`}>
                                    {t.amount < 0 ? "-" : "+"}${Math.abs(t.amount)}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Bottom stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: "New Signups (Month)", value: String(data.newSubsThisMonth), sub: "This month" },
                    { label: "Total Users", value: String(data.totalUsers), sub: "All time" },
                    { label: "Paid Users", value: String(data.paidUsers), sub: `${data.conversionRate.toFixed(1)}% of total` },
                    { label: "Token Revenue", value: `$${data.tokenRevenue}`, sub: "This month top-ups" },
                ].map((item) => (
                    <div key={item.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
                        <div className="text-xl font-bold text-white">{item.value}</div>
                        <div className="text-xs text-gray-500">{item.label}</div>
                        <div className="text-xs text-gray-600 mt-1">{item.sub}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
