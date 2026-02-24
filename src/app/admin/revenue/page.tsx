"use client";

import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    CreditCard,
    PieChart,
    ArrowUpRight,
    Users,
    Calendar,
} from "lucide-react";

// Demo revenue data
const monthlyRevenue = [
    { month: "Sep 2025", mrr: 18200, users: 312, newSubs: 45, churned: 8, arpu: 58.33 },
    { month: "Oct 2025", mrr: 21500, users: 389, newSubs: 92, churned: 15, arpu: 55.27 },
    { month: "Nov 2025", mrr: 25800, users: 478, newSubs: 104, churned: 15, arpu: 53.97 },
    { month: "Dec 2025", mrr: 28900, users: 567, newSubs: 108, churned: 19, arpu: 50.97 },
    { month: "Jan 2026", mrr: 34200, users: 892, newSubs: 356, churned: 31, arpu: 38.34 },
    { month: "Feb 2026", mrr: 38450, users: 1247, newSubs: 389, churned: 34, arpu: 30.83 },
];

const planBreakdown = [
    { plan: "Free", users: 487, revenue: 0, pct: 0, color: "bg-gray-600" },
    { plan: "Pro ($49/mo)", users: 612, revenue: 29988, pct: 78, color: "bg-blue-600" },
    { plan: "Pro ($149/mo)", users: 148, revenue: 22052, pct: 22, color: "bg-purple-600" },
];

const topRevenueClients = [
    { name: "Downtown Dental Network", plan: "Pro", mrr: 149, adSpend: 28500, ltv: 1788, months: 12 },
    { name: "Metro Law Group", plan: "Pro", mrr: 149, adSpend: 45200, ltv: 1043, months: 7 },
    { name: "Premier Real Estate", plan: "Pro", mrr: 149, adSpend: 38900, ltv: 894, months: 6 },
    { name: "Pacific Auto Dealers", plan: "Pro", mrr: 149, adSpend: 32100, ltv: 1192, months: 8 },
    { name: "Citywide HVAC Services", plan: "Pro", mrr: 49, adSpend: 24800, ltv: 196, months: 4 },
    { name: "Joe's Pizza Chain", plan: "Pro", mrr: 49, adSpend: 8900, ltv: 147, months: 3 },
    { name: "Mountain View Gym", plan: "Pro", mrr: 49, adSpend: 6700, ltv: 147, months: 3 },
    { name: "Elite Auto Repair", plan: "Pro", mrr: 49, adSpend: 12500, ltv: 49, months: 1 },
];

const transactions = [
    { date: "Feb 24, 2026", description: "Pro subscription — Mike's Plumbing Co", amount: 49, type: "subscription" },
    { date: "Feb 24, 2026", description: "Pro subscription — Downtown Dental", amount: 149, type: "subscription" },
    { date: "Feb 23, 2026", description: "Pro subscription — Sunrise Yoga Studio", amount: 49, type: "subscription" },
    { date: "Feb 23, 2026", description: "Refund — Quick Fix IT Solutions", amount: -49, type: "refund" },
    { date: "Feb 22, 2026", description: "Pro subscription — Mountain View Gym", amount: 49, type: "subscription" },
    { date: "Feb 22, 2026", description: "Pro subscription — Metro Law Group", amount: 149, type: "subscription" },
    { date: "Feb 21, 2026", description: "Pro upgrade — Joe's Pizza Chain", amount: 49, type: "upgrade" },
    { date: "Feb 21, 2026", description: "Pro subscription — Pacific Auto", amount: 149, type: "subscription" },
];

export default function AdminRevenuePage() {
    const current = monthlyRevenue[monthlyRevenue.length - 1];
    const prev = monthlyRevenue[monthlyRevenue.length - 2];
    const mrrGrowth = (((current.mrr - prev.mrr) / prev.mrr) * 100).toFixed(1);
    const totalRevenue = monthlyRevenue.reduce((s, m) => s + m.mrr, 0);
    const maxMrr = Math.max(...monthlyRevenue.map((m) => m.mrr));

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-white">Revenue</h2>
                <p className="text-gray-500 text-sm mt-1">
                    Financial overview and subscription metrics
                </p>
            </div>

            {/* Top stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xs text-green-400 flex items-center gap-1">
                            <ArrowUpRight className="w-3 h-3" /> +{mrrGrowth}%
                        </span>
                    </div>
                    <div className="text-2xl font-bold text-white">${current.mrr.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">Monthly Recurring Revenue</div>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-white">${(current.mrr * 12).toLocaleString()}</div>
                    <div className="text-xs text-gray-500">Annual Run Rate (ARR)</div>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                            <Users className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-white">{current.users - 487}</div>
                    <div className="text-xs text-gray-500">Paying Subscribers</div>
                    <div className="text-xs text-purple-400 mt-1">
                        {((((current.users - 487) / current.users) * 100).toFixed(0))}% conversion rate
                    </div>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 bg-amber-600 rounded-lg flex items-center justify-center">
                            <CreditCard className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-white">
                        ${(current.mrr / (current.users - 487)).toFixed(0)}
                    </div>
                    <div className="text-xs text-gray-500">Avg Revenue Per Paying User</div>
                </div>
            </div>

            {/* MRR Growth Chart */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-400" />
                    MRR Growth Over Time
                </h3>
                <div className="flex items-end gap-3 h-48">
                    {monthlyRevenue.map((m, i) => (
                        <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                            <span className="text-xs text-gray-400 font-medium">
                                ${(m.mrr / 1000).toFixed(1)}k
                            </span>
                            <div className="w-full relative">
                                <div
                                    className="w-full bg-gradient-to-t from-green-600 to-green-400 rounded-t-md transition-all"
                                    style={{ height: `${(m.mrr / maxMrr) * 160}px` }}
                                />
                            </div>
                            <span className="text-[10px] text-gray-600 mt-1">{m.month.replace(" 20", " '")}</span>
                            <span className="text-[10px] text-gray-500">{m.users} users</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Plan Breakdown */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                        <PieChart className="w-4 h-4 text-purple-400" />
                        Revenue by Plan
                    </h3>
                    <div className="space-y-4">
                        {planBreakdown.map((p) => (
                            <div key={p.plan}>
                                <div className="flex items-center justify-between mb-1">
                                    <div>
                                        <span className="text-sm text-white font-medium">{p.plan}</span>
                                        <span className="text-xs text-gray-500 ml-2">{p.users} users</span>
                                    </div>
                                    <span className="text-sm text-white font-medium">
                                        ${p.revenue.toLocaleString()}/mo
                                    </span>
                                </div>
                                <div className="w-full bg-gray-800 rounded-full h-2">
                                    <div
                                        className={`${p.color} h-2 rounded-full transition-all`}
                                        style={{
                                            width: `${p.revenue === 0 ? 2 : (p.revenue / (planBreakdown[1].revenue + planBreakdown[2].revenue)) * 100}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 p-3 bg-gray-800/50 rounded-lg">
                        <div className="text-xs text-gray-500">Total MRR from Subscriptions</div>
                        <div className="text-lg font-bold text-green-400">
                            ${(planBreakdown[1].revenue + planBreakdown[2].revenue).toLocaleString()}/mo
                        </div>
                    </div>
                </div>

                {/* Top Revenue Clients */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-400" />
                        Top Revenue Clients (by LTV)
                    </h3>
                    <div className="space-y-2">
                        {topRevenueClients.map((c, i) => (
                            <div
                                key={i}
                                className="flex items-center justify-between p-3 bg-gray-800/40 rounded-lg"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <span className="text-xs text-gray-500 w-5">#{i + 1}</span>
                                    <div className="min-w-0">
                                        <div className="text-sm text-white font-medium truncate">{c.name}</div>
                                        <div className="text-xs text-gray-500">
                                            {c.plan} · ${c.mrr}/mo · {c.months} months
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right flex-shrink-0 ml-3">
                                    <div className="text-sm font-bold text-green-400">${c.ltv}</div>
                                    <div className="text-[10px] text-gray-500">LTV</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-blue-400" />
                    Recent Transactions
                </h3>
                <div className="space-y-2">
                    {transactions.map((t, i) => (
                        <div
                            key={i}
                            className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg"
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center ${t.amount < 0 ? "bg-red-900/30" : "bg-green-900/30"
                                        }`}
                                >
                                    {t.amount < 0 ? (
                                        <TrendingDown className="w-4 h-4 text-red-400" />
                                    ) : (
                                        <DollarSign className="w-4 h-4 text-green-400" />
                                    )}
                                </div>
                                <div>
                                    <div className="text-sm text-white">{t.description}</div>
                                    <div className="text-xs text-gray-500">{t.date}</div>
                                </div>
                            </div>
                            <div
                                className={`text-sm font-bold ${t.amount < 0 ? "text-red-400" : "text-green-400"
                                    }`}
                            >
                                {t.amount < 0 ? "-" : "+"}${Math.abs(t.amount)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Revenue metrics bottom row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: "New Subs (Feb)", value: `${current.newSubs}`, sub: `+${(((current.newSubs - prev.newSubs) / prev.newSubs) * 100).toFixed(0)}% vs Jan` },
                    { label: "Churned (Feb)", value: `${current.churned}`, sub: `${((current.churned / current.users) * 100).toFixed(1)}% rate` },
                    { label: "Net New", value: `+${current.newSubs - current.churned}`, sub: "Healthy growth" },
                    { label: "Total Collected", value: `$${(totalRevenue / 1000).toFixed(0)}k`, sub: "All time" },
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
