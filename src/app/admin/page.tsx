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
} from "lucide-react";

// Demo data — will come from API in production
const stats = [
    {
        label: "Total Users",
        value: "1,247",
        change: "+12.3%",
        up: true,
        icon: Users,
        color: "blue",
        detail: "89 joined this week",
    },
    {
        label: "Monthly Revenue (MRR)",
        value: "$38,450",
        change: "+8.7%",
        up: true,
        icon: DollarSign,
        color: "green",
        detail: "$461K ARR",
    },
    {
        label: "Active Sessions Now",
        value: "342",
        change: "+5.1%",
        up: true,
        icon: Activity,
        color: "purple",
        detail: "Peak today: 518",
    },
    {
        label: "AI Queries Today",
        value: "8,291",
        change: "-2.1%",
        up: false,
        icon: MessageCircle,
        color: "amber",
        detail: "Avg 6.6 per user",
    },
];

const recentSignups = [
    { name: "Mike's Plumbing Co", email: "mike@mikesplumbing.com", plan: "Pro", joined: "2 hours ago", spend: "$4,200/mo" },
    { name: "Sarah's Bakery", email: "sarah@sarahsbakery.com", plan: "Free", joined: "5 hours ago", spend: "$800/mo" },
    { name: "Elite Auto Repair", email: "admin@eliteauto.com", plan: "Pro", joined: "8 hours ago", spend: "$12,500/mo" },
    { name: "Sunrise Yoga Studio", email: "hello@sunriseyoga.com", plan: "Pro", joined: "1 day ago", spend: "$2,100/mo" },
    { name: "Downtown Dental", email: "office@downtowndental.com", plan: "Agency", joined: "1 day ago", spend: "$18,000/mo" },
];

const topSpenders = [
    { name: "Metro Law Group", spend: "$45,200/mo", plan: "Agency", health: 92, trend: "+15%" },
    { name: "Premier Real Estate", spend: "$38,900/mo", plan: "Agency", health: 87, trend: "+8%" },
    { name: "Pacific Auto Dealers", spend: "$32,100/mo", plan: "Agency", health: 95, trend: "+22%" },
    { name: "Downtown Dental Network", spend: "$28,500/mo", plan: "Agency", health: 78, trend: "-3%" },
    { name: "Citywide HVAC Services", spend: "$24,800/mo", plan: "Pro", health: 91, trend: "+11%" },
];

const platformHealth = [
    { label: "API Uptime", value: "99.97%", status: "good" },
    { label: "Avg Response Time", value: "142ms", status: "good" },
    { label: "Google Ads API", value: "Connected", status: "good" },
    { label: "AI Primary (GPT-4o)", value: "Operational", status: "good" },
    { label: "AI Fallback (Claude 4.6)", value: "Operational", status: "good" },
    { label: "Queue Backlog", value: "23 jobs", status: "warning" },
    { label: "Error Rate (24h)", value: "0.03%", status: "good" },
];

const weeklyGrowth = [
    { week: "W1 Jan", users: 980, revenue: 31200 },
    { week: "W2 Jan", users: 1015, revenue: 32800 },
    { week: "W3 Jan", users: 1048, revenue: 33500 },
    { week: "W4 Jan", users: 1089, revenue: 34200 },
    { week: "W1 Feb", users: 1132, revenue: 35800 },
    { week: "W2 Feb", users: 1178, revenue: 37100 },
    { week: "W3 Feb", users: 1210, revenue: 37900 },
    { week: "W4 Feb", users: 1247, revenue: 38450 },
];

const alerts = [
    { type: "warning", message: "3 users hit API rate limits in the last hour", time: "12 min ago" },
    { type: "info", message: "New user signup spike detected — 15 signups in 30 min", time: "45 min ago" },
    { type: "success", message: "Monthly billing cycle completed — $38,450 collected", time: "2 hours ago" },
];

const colorClasses: Record<string, { bg: string; text: string; icon: string }> = {
    blue: { bg: "bg-blue-900/30", text: "text-blue-400", icon: "bg-blue-600" },
    green: { bg: "bg-green-900/30", text: "text-green-400", icon: "bg-green-600" },
    purple: { bg: "bg-purple-900/30", text: "text-purple-400", icon: "bg-purple-600" },
    amber: { bg: "bg-amber-900/30", text: "text-amber-400", icon: "bg-amber-600" },
};

export default function AdminOverview() {
    const maxRevenue = Math.max(...weeklyGrowth.map((w) => w.revenue));

    return (
        <div className="space-y-6">
            {/* Page title */}
            <div>
                <h2 className="text-2xl font-bold text-white">Platform Overview</h2>
                <p className="text-gray-500 text-sm mt-1">
                    Real-time metrics for AdMaster Pro — Last updated: just now
                </p>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {stats.map((s) => {
                    const c = colorClasses[s.color];
                    return (
                        <div
                            key={s.label}
                            className="bg-gray-900 border border-gray-800 rounded-xl p-5"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className={`w-10 h-10 ${c.icon} rounded-lg flex items-center justify-center`}>
                                    <s.icon className="w-5 h-5 text-white" />
                                </div>
                                <div
                                    className={`flex items-center gap-1 text-xs font-medium ${s.up ? "text-green-400" : "text-red-400"
                                        }`}
                                >
                                    {s.up ? (
                                        <ArrowUpRight className="w-3 h-3" />
                                    ) : (
                                        <ArrowDownRight className="w-3 h-3" />
                                    )}
                                    {s.change}
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-white">{s.value}</div>
                            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
                            <div className={`text-xs ${c.text} mt-2`}>{s.detail}</div>
                        </div>
                    );
                })}
            </div>

            {/* Alerts banner */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <Bell className="w-4 h-4 text-red-400" />
                    Live Alerts
                </h3>
                <div className="space-y-2">
                    {alerts.map((a, i) => (
                        <div
                            key={i}
                            className={`flex items-center gap-3 text-sm px-3 py-2 rounded-lg ${a.type === "warning"
                                ? "bg-amber-900/20 border border-amber-700/30"
                                : a.type === "success"
                                    ? "bg-green-900/20 border border-green-700/30"
                                    : "bg-blue-900/20 border border-blue-700/30"
                                }`}
                        >
                            {a.type === "warning" ? (
                                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                            ) : a.type === "success" ? (
                                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                            ) : (
                                <Zap className="w-4 h-4 text-blue-400 flex-shrink-0" />
                            )}
                            <span className="text-gray-300 flex-1">{a.message}</span>
                            <span className="text-gray-600 text-xs flex-shrink-0">{a.time}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Revenue Growth Chart (CSS bars) */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-white mb-4">Revenue Growth (8 Weeks)</h3>
                    <div className="flex items-end gap-2 h-40">
                        {weeklyGrowth.map((w) => (
                            <div key={w.week} className="flex-1 flex flex-col items-center gap-1">
                                <span className="text-[10px] text-gray-500">${(w.revenue / 1000).toFixed(0)}k</span>
                                <div
                                    className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-md transition-all"
                                    style={{ height: `${(w.revenue / maxRevenue) * 100}%` }}
                                />
                                <span className="text-[9px] text-gray-600 mt-1">{w.week.replace("W", "")}</span>
                            </div>
                        ))}
                    </div>
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
                                    className={`w-2.5 h-2.5 rounded-full ${h.status === "good" ? "bg-green-500" : "bg-amber-500"
                                        }`}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Recent Signups */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                            <UserPlus className="w-4 h-4 text-blue-400" />
                            Recent Signups
                        </h3>
                        <a href="/admin/users" className="text-xs text-blue-400 hover:text-blue-300">
                            View all →
                        </a>
                    </div>
                    <div className="space-y-3">
                        {recentSignups.map((u, i) => (
                            <div
                                key={i}
                                className="flex items-center justify-between p-3 bg-gray-800/40 rounded-lg"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                        {u.name.charAt(0)}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-sm text-white font-medium truncate">{u.name}</div>
                                        <div className="text-xs text-gray-500 truncate">{u.email}</div>
                                    </div>
                                </div>
                                <div className="text-right flex-shrink-0 ml-3">
                                    <span
                                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${u.plan === "Agency"
                                            ? "bg-purple-900/40 text-purple-400"
                                            : u.plan === "Pro"
                                                ? "bg-blue-900/40 text-blue-400"
                                                : "bg-gray-800 text-gray-400"
                                            }`}
                                    >
                                        {u.plan}
                                    </span>
                                    <div className="text-xs text-gray-600 mt-1">{u.joined}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Spenders */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-green-400" />
                            Top Spenders (Ad Budget)
                        </h3>
                        <a href="/admin/revenue" className="text-xs text-blue-400 hover:text-blue-300">
                            Revenue details →
                        </a>
                    </div>
                    <div className="space-y-3">
                        {topSpenders.map((s, i) => (
                            <div
                                key={i}
                                className="flex items-center justify-between p-3 bg-gray-800/40 rounded-lg"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-7 h-7 bg-gray-700 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                        #{i + 1}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-sm text-white font-medium truncate">{s.name}</div>
                                        <div className="text-xs text-gray-500">
                                            Health: <span className={s.health >= 85 ? "text-green-400" : "text-amber-400"}>{s.health}%</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right flex-shrink-0 ml-3">
                                    <div className="text-sm font-bold text-green-400">{s.spend}</div>
                                    <div className={`text-xs ${s.trend.startsWith("+") ? "text-green-500" : "text-red-500"}`}>
                                        {s.trend}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Quick stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: "Free Users", value: "487", pct: "39%" },
                    { label: "Pro Users", value: "612", pct: "49%" },
                    { label: "Agency Users", value: "148", pct: "12%" },
                    { label: "Churn (30d)", value: "2.1%", pct: "↓ 0.3%" },
                ].map((item) => (
                    <div key={item.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
                        <div className="text-xl font-bold text-white">{item.value}</div>
                        <div className="text-xs text-gray-500">{item.label}</div>
                        <div className="text-xs text-gray-600 mt-1">{item.pct}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
