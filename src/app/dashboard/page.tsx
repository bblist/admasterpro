"use client";

import {
    DollarSign,
    Phone,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    CheckCircle,
    XCircle,
    ArrowUpRight,
    ArrowDownRight,
    MessageCircle,
    Zap,
} from "lucide-react";
import Link from "next/link";
import Tooltip from "@/components/Tooltip";

// Demo data — multi-industry agency
const stats = {
    spent: 1842.50,
    spentChange: -215,
    calls: 67,
    callsChange: 12,
    costPerCustomer: 27.50,
    costChange: -4.80,
    healthScore: 78,
};

const moneyLeaks = [
    {
        keyword: "free eye test online",
        spent: 34.00,
        clicks: 22,
        calls: 0,
        status: "danger" as const,
        suggestion: "Attract DIY searchers, not patients. Pause immediately — people searching this want a free online quiz, not a clinic visit.",
    },
    {
        keyword: "fashion trends 2025",
        spent: 28.50,
        clicks: 19,
        calls: 0,
        status: "danger" as const,
        suggestion: "Too broad & informational. Searchers are browsing articles, not shopping. Add as negative keyword.",
    },
    {
        keyword: "how to unclog a drain yourself",
        spent: 15.00,
        clicks: 11,
        calls: 0,
        status: "warning" as const,
        suggestion: "DIY searchers won't hire a plumber. Consider pausing to save ~$15/week.",
    },
];

const winners = [
    {
        keyword: "LASIK eye surgery near me",
        spent: 42.00,
        clicks: 14,
        calls: 7,
        costPerCall: 6.00,
        status: "success" as const,
    },
    {
        keyword: "summer dresses sale",
        spent: 36.00,
        clicks: 45,
        calls: 0,
        costPerCall: 0.80,
        status: "success" as const,
        note: "12 online purchases",
    },
    {
        keyword: "emergency plumber miami",
        spent: 18.00,
        clicks: 8,
        calls: 4,
        costPerCall: 4.50,
        status: "success" as const,
    },
];

const recentActions = [
    {
        time: "2 hours ago",
        action: 'Paused keyword "free eye test online" — Eye Clinic',
        savings: "$5/day",
        auto: true,
    },
    {
        time: "6 hours ago",
        action: 'Boosted budget on "summer dresses sale" — Bella Fashion',
        savings: "+8 sales/day",
        auto: true,
    },
    {
        time: "Yesterday",
        action: 'Added negative keyword "DIY" — Mike\'s Plumbing',
        savings: "$7/day",
        auto: true,
    },
    {
        time: "2 days ago",
        action: "Turned off ads midnight–6am for Eye Clinic campaigns",
        savings: "$12/day",
        auto: true,
    },
];

export default function DashboardPage() {
    const healthColor =
        stats.healthScore >= 80
            ? "text-success"
            : stats.healthScore >= 50
                ? "text-warning"
                : "text-danger";

    const healthBg =
        stats.healthScore >= 80
            ? "bg-success"
            : stats.healthScore >= 50
                ? "bg-warning"
                : "bg-danger";

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Your Ad Performance</h1>
                    <p className="text-muted text-sm mt-1">Last 7 days • Updated just now</p>
                </div>
                <Link
                    href="/dashboard/chat"
                    className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 w-fit"
                >
                    <MessageCircle className="w-4 h-4" />
                    Ask AI Assistant
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-card border border-border rounded-xl p-5">
                    <div className="flex items-center gap-2 text-muted text-sm mb-2">
                        <DollarSign className="w-4 h-4" />
                        Money Spent
                        <Tooltip text="Total ad spend across all campaigns in the last 7 days. Lower is better if conversions stay the same or increase." />
                    </div>
                    <div className="text-2xl font-bold">${stats.spent.toFixed(2)}</div>
                    <div className="flex items-center gap-1 text-sm text-success mt-1">
                        <ArrowDownRight className="w-3 h-3" />
                        ${Math.abs(stats.spentChange)} less than last week
                    </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-5">
                    <div className="flex items-center gap-2 text-muted text-sm mb-2">
                        <Phone className="w-4 h-4" />
                        Conversions
                        <Tooltip text="Total conversions (calls, purchases, leads) generated by your ads. This is the number that matters most." />
                    </div>
                    <div className="text-2xl font-bold">{stats.calls}</div>
                    <div className="flex items-center gap-1 text-sm text-success mt-1">
                        <ArrowUpRight className="w-3 h-3" />
                        {stats.callsChange} more than last week
                    </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-5">
                    <div className="flex items-center gap-2 text-muted text-sm mb-2">
                        <TrendingUp className="w-4 h-4" />
                        Cost Per Conversion
                        <Tooltip text="How much you pay for each conversion on average. The AI works to lower this number over time." />
                    </div>
                    <div className="text-2xl font-bold">${stats.costPerCustomer.toFixed(2)}</div>
                    <div className="flex items-center gap-1 text-sm text-success mt-1">
                        <ArrowDownRight className="w-3 h-3" />
                        Getting cheaper
                    </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-5">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-muted text-sm">
                            <Zap className="w-4 h-4" />
                            Health Score
                            <Tooltip text="An AI-calculated score (0-100) based on your ad efficiency, waste reduction, and optimization level. 80+ is excellent." />
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div
                            className={`w-12 h-12 rounded-full ${healthBg} flex items-center justify-center text-white font-bold pulse-green`}
                        >
                            {stats.healthScore}
                        </div>
                        <div className={`text-sm font-medium ${healthColor}`}>
                            {stats.healthScore >= 80
                                ? "Looking good!"
                                : stats.healthScore >= 50
                                    ? "Needs attention"
                                    : "Needs fixing"}
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Summary */}
            <div className="bg-primary-light border border-primary/20 rounded-xl p-5">
                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                        <MessageCircle className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <div className="font-medium text-sm mb-1">AdMaster Pro AI</div>
                        <p className="text-sm leading-relaxed">
                            Great week across your accounts! You saved <strong>$215</strong> while generating{" "}
                            <strong>12 more conversions</strong>. The Eye Clinic&apos;s LASIK campaign is crushing it
                            at $6/lead. Bella Fashion&apos;s shopping ads brought in 34 sales. I found 3 keywords
                            wasting money — check the &quot;Money Leaks&quot; below, or{" "}
                            <Link href="/dashboard/chat" className="text-primary font-medium hover:underline">
                                chat with me
                            </Link>{" "}
                            for details.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Money Leaks */}
                <div className="bg-card border border-border rounded-xl">
                    <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-danger" />
                            <h2 className="font-semibold">Money Leaks</h2>
                            <Tooltip text="Keywords and search terms that cost you money but don't bring real customers. The AI identifies these so you can pause them." />
                        </div>
                        <span className="text-xs bg-danger/10 text-danger px-2 py-1 rounded-full font-medium">
                            {moneyLeaks.length} found
                        </span>
                    </div>
                    <div className="divide-y divide-border">
                        {moneyLeaks.map((leak, i) => (
                            <div key={i} className="px-5 py-4">
                                <div className="flex items-start justify-between gap-3 mb-2">
                                    <div>
                                        <div className="font-medium text-sm">&quot;{leak.keyword}&quot;</div>
                                        <div className="text-xs text-muted mt-0.5">
                                            ${leak.spent.toFixed(2)} spent • {leak.clicks} clicks • {leak.calls} calls
                                        </div>
                                    </div>
                                    <XCircle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
                                </div>
                                <p className="text-xs text-muted mb-3">{leak.suggestion}</p>
                                <div className="flex gap-2">
                                    <button className="bg-primary text-white text-xs px-3 py-1.5 rounded-lg hover:bg-primary-dark transition">
                                        Pause & Save
                                    </button>
                                    <button className="border border-border text-xs px-3 py-1.5 rounded-lg hover:border-primary transition">
                                        Ignore
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Winners */}
                <div className="bg-card border border-border rounded-xl">
                    <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-success" />
                            <h2 className="font-semibold">Winners</h2>
                            <Tooltip text="Your best-performing keywords — they bring real customers at a good cost. The AI helps you double down on what works." />
                        </div>
                        <span className="text-xs bg-success/10 text-success px-2 py-1 rounded-full font-medium">
                            Top performers
                        </span>
                    </div>
                    <div className="divide-y divide-border">
                        {winners.map((w, i) => (
                            <div key={i} className="px-5 py-4">
                                <div className="flex items-start justify-between gap-3 mb-1">
                                    <div className="font-medium text-sm">&quot;{w.keyword}&quot;</div>
                                    <CheckCircle className="w-4 h-4 text-success shrink-0 mt-0.5" />
                                </div>
                                <div className="text-xs text-muted">
                                    ${w.spent.toFixed(2)} spent • {w.clicks} clicks • {w.calls} calls •{" "}
                                    <span className="text-success font-medium">${w.costPerCall.toFixed(2)}/call</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Recent Auto-Pilot Actions */}
            <div className="bg-card border border-border rounded-xl">
                <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-accent" />
                        <h2 className="font-semibold">Recent Auto-Pilot Actions</h2>
                        <Tooltip text="Actions the AI takes automatically to save money and improve performance. Customize rules in Settings." />
                    </div>
                    <Link href="/dashboard/settings" className="text-xs text-primary hover:underline">
                        Auto-Pilot Settings
                    </Link>
                </div>
                <div className="divide-y divide-border">
                    {recentActions.map((a, i) => (
                        <div key={i} className="px-5 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-6 h-6 bg-accent/10 rounded-full flex items-center justify-center">
                                    <Zap className="w-3 h-3 text-accent" />
                                </div>
                                <div>
                                    <div className="text-sm">{a.action}</div>
                                    <div className="text-xs text-muted">{a.time}</div>
                                </div>
                            </div>
                            <div className="text-sm text-success font-medium">Saving ~{a.savings}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Weekly Comparison */}
            <div className="bg-card border border-border rounded-xl p-5">
                <h2 className="font-semibold mb-4">This Week vs Last Week</h2>
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                        <div className="text-muted text-xs mb-1">Money Spent</div>
                        <div className="flex items-center justify-center gap-2">
                            <span className="text-lg font-bold">$1,842</span>
                            <span className="text-xs text-muted">vs $2,057</span>
                        </div>
                        <div className="text-xs text-success flex items-center justify-center gap-1 mt-1">
                            <TrendingDown className="w-3 h-3" /> 10% less
                        </div>
                    </div>
                    <div>
                        <div className="text-muted text-xs mb-1">Conversions</div>
                        <div className="flex items-center justify-center gap-2">
                            <span className="text-lg font-bold">67</span>
                            <span className="text-xs text-muted">vs 55</span>
                        </div>
                        <div className="text-xs text-success flex items-center justify-center gap-1 mt-1">
                            <TrendingUp className="w-3 h-3" /> 22% more
                        </div>
                    </div>
                    <div>
                        <div className="text-muted text-xs mb-1">Cost Per Conversion</div>
                        <div className="flex items-center justify-center gap-2">
                            <span className="text-lg font-bold">$27.50</span>
                            <span className="text-xs text-muted">vs $37.40</span>
                        </div>
                        <div className="text-xs text-success flex items-center justify-center gap-1 mt-1">
                            <TrendingDown className="w-3 h-3" /> 26% cheaper
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
