"use client";

import {
    Search,
    TrendingUp,
    TrendingDown,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Filter,
} from "lucide-react";
import { useState } from "react";

type KeywordStatus = "winner" | "loser" | "testing";

interface Keyword {
    id: number;
    keyword: string;
    campaign: string;
    spent: number;
    clicks: number;
    calls: number;
    costPerCall: number | null;
    status: KeywordStatus;
    trend: "up" | "down" | "flat";
    daysRunning: number;
}

const keywords: Keyword[] = [
    {
        id: 1,
        keyword: "emergency plumber near me",
        campaign: "Emergency Plumbing",
        spent: 18.0,
        clicks: 8,
        calls: 4,
        costPerCall: 4.5,
        status: "winner",
        trend: "up",
        daysRunning: 45,
    },
    {
        id: 2,
        keyword: "plumber miami 24 hour",
        campaign: "Emergency Plumbing",
        spent: 24.0,
        clicks: 12,
        calls: 5,
        costPerCall: 4.8,
        status: "winner",
        trend: "up",
        daysRunning: 38,
    },
    {
        id: 3,
        keyword: "water heater repair miami",
        campaign: "Water Heater Repair",
        spent: 32.0,
        clicks: 15,
        calls: 4,
        costPerCall: 8.0,
        status: "winner",
        trend: "flat",
        daysRunning: 30,
    },
    {
        id: 4,
        keyword: "drain cleaning service",
        campaign: "Drain Cleaning Special",
        spent: 28.0,
        clicks: 14,
        calls: 3,
        costPerCall: 9.33,
        status: "testing",
        trend: "up",
        daysRunning: 12,
    },
    {
        id: 5,
        keyword: "free plumbing tips",
        campaign: "General Plumbing Services",
        spent: 22.0,
        clicks: 14,
        calls: 0,
        costPerCall: null,
        status: "loser",
        trend: "down",
        daysRunning: 21,
    },
    {
        id: 6,
        keyword: "how to fix a leaky faucet",
        campaign: "General Plumbing Services",
        spent: 15.0,
        clicks: 11,
        calls: 0,
        costPerCall: null,
        status: "loser",
        trend: "down",
        daysRunning: 18,
    },
    {
        id: 7,
        keyword: "plumber salary miami",
        campaign: "General Plumbing Services",
        spent: 8.5,
        clicks: 6,
        calls: 0,
        costPerCall: null,
        status: "loser",
        trend: "down",
        daysRunning: 14,
    },
    {
        id: 8,
        keyword: "tankless water heater install",
        campaign: "Water Heater Repair",
        spent: 19.0,
        clicks: 9,
        calls: 2,
        costPerCall: 9.5,
        status: "testing",
        trend: "flat",
        daysRunning: 8,
    },
];

export default function KeywordsPage() {
    const [filter, setFilter] = useState<"all" | KeywordStatus>("all");
    const [searchQuery, setSearchQuery] = useState("");

    const filtered = keywords.filter((k) => {
        if (filter !== "all" && k.status !== filter) return false;
        if (searchQuery && !k.keyword.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    const winners = keywords.filter((k) => k.status === "winner").length;
    const losers = keywords.filter((k) => k.status === "loser").length;
    const testing = keywords.filter((k) => k.status === "testing").length;

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Keywords</h1>
                <p className="text-muted text-sm mt-1">See which search terms bring customers vs waste money</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
                <button
                    onClick={() => setFilter(filter === "winner" ? "all" : "winner")}
                    className={`bg-card border rounded-xl p-4 text-left transition ${filter === "winner" ? "border-success" : "border-border hover:border-success"
                        }`}
                >
                    <div className="flex items-center gap-2 mb-1">
                        <CheckCircle className="w-4 h-4 text-success" />
                        <span className="text-sm font-medium">Winners</span>
                    </div>
                    <div className="text-2xl font-bold text-success">{winners}</div>
                    <div className="text-xs text-muted">Bringing real customers</div>
                </button>
                <button
                    onClick={() => setFilter(filter === "loser" ? "all" : "loser")}
                    className={`bg-card border rounded-xl p-4 text-left transition ${filter === "loser" ? "border-danger" : "border-border hover:border-danger"
                        }`}
                >
                    <div className="flex items-center gap-2 mb-1">
                        <XCircle className="w-4 h-4 text-danger" />
                        <span className="text-sm font-medium">Money Leaks</span>
                    </div>
                    <div className="text-2xl font-bold text-danger">{losers}</div>
                    <div className="text-xs text-muted">Wasting your budget</div>
                </button>
                <button
                    onClick={() => setFilter(filter === "testing" ? "all" : "testing")}
                    className={`bg-card border rounded-xl p-4 text-left transition ${filter === "testing" ? "border-warning" : "border-border hover:border-warning"
                        }`}
                >
                    <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="w-4 h-4 text-warning" />
                        <span className="text-sm font-medium">Still Testing</span>
                    </div>
                    <div className="text-2xl font-bold text-warning">{testing}</div>
                    <div className="text-xs text-muted">Need more data</div>
                </button>
            </div>

            {/* Search & Filter */}
            <div className="flex gap-3">
                <div className="flex-1 relative">
                    <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search keywords..."
                        className="w-full bg-card border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary transition"
                    />
                </div>
                <button
                    onClick={() => setFilter("all")}
                    className={`border border-border rounded-lg px-4 py-2.5 text-sm flex items-center gap-2 transition ${filter === "all" ? "bg-primary text-white border-primary" : "hover:border-primary"
                        }`}
                >
                    <Filter className="w-4 h-4" />
                    All
                </button>
            </div>

            {/* Keywords Table */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border bg-sidebar">
                                <th className="text-left px-5 py-3 font-medium text-muted">Keyword</th>
                                <th className="text-left px-5 py-3 font-medium text-muted">Campaign</th>
                                <th className="text-right px-5 py-3 font-medium text-muted">Spent</th>
                                <th className="text-right px-5 py-3 font-medium text-muted">Clicks</th>
                                <th className="text-right px-5 py-3 font-medium text-muted">Calls</th>
                                <th className="text-right px-5 py-3 font-medium text-muted">$/Call</th>
                                <th className="text-center px-5 py-3 font-medium text-muted">Verdict</th>
                                <th className="px-5 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filtered.map((k) => (
                                <tr key={k.id} className="hover:bg-sidebar/50 transition">
                                    <td className="px-5 py-4">
                                        <div className="font-medium">&quot;{k.keyword}&quot;</div>
                                        <div className="text-xs text-muted mt-0.5">{k.daysRunning} days running</div>
                                    </td>
                                    <td className="px-5 py-4 text-muted">{k.campaign}</td>
                                    <td className="px-5 py-4 text-right font-medium">${k.spent.toFixed(2)}</td>
                                    <td className="px-5 py-4 text-right">{k.clicks}</td>
                                    <td className="px-5 py-4 text-right">
                                        <span className={k.calls === 0 ? "text-danger font-medium" : ""}>
                                            {k.calls}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                        {k.costPerCall ? (
                                            <span className="text-success font-medium">${k.costPerCall.toFixed(2)}</span>
                                        ) : (
                                            <span className="text-danger">—</span>
                                        )}
                                    </td>
                                    <td className="px-5 py-4 text-center">
                                        {k.status === "winner" && (
                                            <span className="inline-flex items-center gap-1 text-xs bg-success/10 text-success px-2 py-1 rounded-full font-medium">
                                                <CheckCircle className="w-3 h-3" /> Winner
                                            </span>
                                        )}
                                        {k.status === "loser" && (
                                            <span className="inline-flex items-center gap-1 text-xs bg-danger/10 text-danger px-2 py-1 rounded-full font-medium">
                                                <XCircle className="w-3 h-3" /> Loser
                                            </span>
                                        )}
                                        {k.status === "testing" && (
                                            <span className="inline-flex items-center gap-1 text-xs bg-warning/10 text-warning px-2 py-1 rounded-full font-medium">
                                                <AlertTriangle className="w-3 h-3" /> Testing
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-5 py-4">
                                        {k.status === "loser" && (
                                            <button className="text-xs bg-danger/10 text-danger px-3 py-1.5 rounded-lg hover:bg-danger/20 transition">
                                                Pause
                                            </button>
                                        )}
                                        {k.status === "winner" && (
                                            <div className="flex items-center gap-1 text-success">
                                                <TrendingUp className="w-4 h-4" />
                                            </div>
                                        )}
                                        {k.status === "testing" && (
                                            <div className="flex items-center gap-1 text-warning">
                                                {k.trend === "up" ? (
                                                    <TrendingUp className="w-4 h-4" />
                                                ) : (
                                                    <TrendingDown className="w-4 h-4" />
                                                )}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
