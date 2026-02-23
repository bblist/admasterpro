"use client";

import {
    Cpu,
    DollarSign,
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
    Zap,
    Sparkles,
    Users,
    BarChart3,
    AlertTriangle,
    Clock,
    ChevronDown,
    Filter,
    Download,
    Search,
    Eye,
} from "lucide-react";
import { useState } from "react";

// Types

type LLMModel = "gpt-4o" | "claude-5.6";

interface ClientAICost {
    id: number;
    name: string;
    plan: string;
    gpt4oQueries: number;
    gpt4oTokens: number;
    gpt4oCost: number;
    claude56Queries: number;
    claude56Tokens: number;
    claude56Cost: number;
    totalCost: number;
    platformFee: number;
    margin: number;
    lastQuery: string;
}

interface DailyCost {
    date: string;
    gpt4o: number;
    claude56: number;
    total: number;
    queries: number;
}

// Demo Data

const clientCosts: ClientAICost[] = [
    { id: 1, name: "Metro Law Group", plan: "Agency", gpt4oQueries: 287, gpt4oTokens: 1842000, gpt4oCost: 42.18, claude56Queries: 55, claude56Tokens: 312000, claude56Cost: 6.24, totalCost: 48.42, platformFee: 149, margin: 100.58, lastQuery: "2 min ago" },
    { id: 2, name: "Premier Real Estate", plan: "Agency", gpt4oQueries: 234, gpt4oTokens: 1523000, gpt4oCost: 34.87, claude56Queries: 53, claude56Tokens: 298000, claude56Cost: 5.96, totalCost: 40.83, platformFee: 149, margin: 108.17, lastQuery: "15 min ago" },
    { id: 3, name: "Pacific Auto Dealers", plan: "Agency", gpt4oQueries: 389, gpt4oTokens: 2456000, gpt4oCost: 56.23, claude56Queries: 67, claude56Tokens: 389000, claude56Cost: 7.78, totalCost: 64.01, platformFee: 149, margin: 84.99, lastQuery: "1 hour ago" },
    { id: 4, name: "Downtown Dental Network", plan: "Agency", gpt4oQueries: 156, gpt4oTokens: 987000, gpt4oCost: 22.60, claude56Queries: 42, claude56Tokens: 245000, claude56Cost: 4.90, totalCost: 27.50, platformFee: 149, margin: 121.50, lastQuery: "3 hours ago" },
    { id: 5, name: "Citywide HVAC Services", plan: "Pro", gpt4oQueries: 412, gpt4oTokens: 2890000, gpt4oCost: 66.15, claude56Queries: 111, claude56Tokens: 623000, claude56Cost: 12.46, totalCost: 78.61, platformFee: 49, margin: -29.61, lastQuery: "30 min ago" },
    { id: 6, name: "Mike\u2019s Plumbing Co", plan: "Pro", gpt4oQueries: 52, gpt4oTokens: 345000, gpt4oCost: 7.90, claude56Queries: 15, claude56Tokens: 89000, claude56Cost: 1.78, totalCost: 9.68, platformFee: 49, margin: 39.32, lastQuery: "2 hours ago" },
    { id: 7, name: "Sarah\u2019s Bakery", plan: "Free", gpt4oQueries: 8, gpt4oTokens: 52000, gpt4oCost: 1.19, claude56Queries: 4, claude56Tokens: 23000, claude56Cost: 0.46, totalCost: 1.65, platformFee: 0, margin: -1.65, lastQuery: "5 hours ago" },
    { id: 8, name: "Elite Auto Repair", plan: "Pro", gpt4oQueries: 67, gpt4oTokens: 445000, gpt4oCost: 10.19, claude56Queries: 22, claude56Tokens: 134000, claude56Cost: 2.68, totalCost: 12.87, platformFee: 49, margin: 36.13, lastQuery: "8 hours ago" },
    { id: 9, name: "Sunrise Yoga Studio", plan: "Pro", gpt4oQueries: 28, gpt4oTokens: 178000, gpt4oCost: 4.07, claude56Queries: 6, claude56Tokens: 34000, claude56Cost: 0.68, totalCost: 4.75, platformFee: 49, margin: 44.25, lastQuery: "1 day ago" },
    { id: 10, name: "Joe\u2019s Pizza Chain", plan: "Pro", gpt4oQueries: 123, gpt4oTokens: 812000, gpt4oCost: 18.59, claude56Queries: 33, claude56Tokens: 189000, claude56Cost: 3.78, totalCost: 22.37, platformFee: 49, margin: 26.63, lastQuery: "4 hours ago" },
    { id: 11, name: "Bright Smile Orthodontics", plan: "Pro", gpt4oQueries: 19, gpt4oTokens: 123000, gpt4oCost: 2.82, claude56Queries: 4, claude56Tokens: 21000, claude56Cost: 0.42, totalCost: 3.24, platformFee: 49, margin: 45.76, lastQuery: "2 days ago" },
    { id: 12, name: "Green Lawn Masters", plan: "Free", gpt4oQueries: 34, gpt4oTokens: 212000, gpt4oCost: 4.85, claude56Queries: 11, claude56Tokens: 67000, claude56Cost: 1.34, totalCost: 6.19, platformFee: 0, margin: -6.19, lastQuery: "6 hours ago" },
    { id: 13, name: "Mountain View Gym", plan: "Pro", gpt4oQueries: 167, gpt4oTokens: 1089000, gpt4oCost: 24.93, claude56Queries: 34, claude56Tokens: 198000, claude56Cost: 3.96, totalCost: 28.89, platformFee: 49, margin: 20.11, lastQuery: "20 min ago" },
    { id: 14, name: "Lakeside Pet Clinic", plan: "Free", gpt4oQueries: 15, gpt4oTokens: 98000, gpt4oCost: 2.24, claude56Queries: 4, claude56Tokens: 22000, claude56Cost: 0.44, totalCost: 2.68, platformFee: 0, margin: -2.68, lastQuery: "1 day ago" },
    { id: 15, name: "Quick Fix IT Solutions", plan: "Pro", gpt4oQueries: 5, gpt4oTokens: 32000, gpt4oCost: 0.73, claude56Queries: 3, claude56Tokens: 18000, claude56Cost: 0.36, totalCost: 1.09, platformFee: 0, margin: -1.09, lastQuery: "14 days ago" },
];

const dailyCosts: DailyCost[] = [
    { date: "Feb 18", gpt4o: 38.50, claude56: 7.20, total: 45.70, queries: 312 },
    { date: "Feb 19", gpt4o: 42.10, claude56: 8.90, total: 51.00, queries: 345 },
    { date: "Feb 20", gpt4o: 35.80, claude56: 6.40, total: 42.20, queries: 289 },
    { date: "Feb 21", gpt4o: 48.20, claude56: 9.10, total: 57.30, queries: 401 },
    { date: "Feb 22", gpt4o: 44.60, claude56: 8.50, total: 53.10, queries: 378 },
    { date: "Feb 23", gpt4o: 51.30, claude56: 10.20, total: 61.50, queries: 423 },
    { date: "Feb 24", gpt4o: 39.90, claude56: 7.80, total: 47.70, queries: 334 },
];

// Computed totals

const totals = {
    totalCost: clientCosts.reduce((s, c) => s + c.totalCost, 0),
    totalRevenue: clientCosts.reduce((s, c) => s + c.platformFee, 0),
    totalMargin: clientCosts.reduce((s, c) => s + c.margin, 0),
    totalQueries: clientCosts.reduce((s, c) => s + c.gpt4oQueries + c.claude56Queries, 0),
    gpt4oTotal: clientCosts.reduce((s, c) => s + c.gpt4oCost, 0),
    claude56Total: clientCosts.reduce((s, c) => s + c.claude56Cost, 0),
    gpt4oQueries: clientCosts.reduce((s, c) => s + c.gpt4oQueries, 0),
    claude56Queries: clientCosts.reduce((s, c) => s + c.claude56Queries, 0),
    totalTokens: clientCosts.reduce((s, c) => s + c.gpt4oTokens + c.claude56Tokens, 0),
};

const marginPct = totals.totalRevenue > 0 ? ((totals.totalMargin / totals.totalRevenue) * 100).toFixed(1) : "0";
const avgCostPerQuery = totals.totalQueries > 0 ? (totals.totalCost / totals.totalQueries).toFixed(3) : "0";
const gpt4oPct = totals.totalQueries > 0 ? ((totals.gpt4oQueries / totals.totalQueries) * 100).toFixed(0) : "0";

const maxDailyTotal = Math.max(...dailyCosts.map(d => d.total));

export default function AdminAICostsPage() {
    const [search, setSearch] = useState("");
    const [planFilter, setPlanFilter] = useState<string>("all");
    const [sortBy, setSortBy] = useState<string>("totalCost");
    const [expandedClient, setExpandedClient] = useState<number | null>(null);

    const filtered = clientCosts
        .filter((c) => {
            const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
            const matchPlan = planFilter === "all" || c.plan === planFilter;
            return matchSearch && matchPlan;
        })
        .sort((a, b) => {
            switch (sortBy) {
                case "totalCost": return b.totalCost - a.totalCost;
                case "margin": return b.margin - a.margin;
                case "queries": return (b.gpt4oQueries + b.claude56Queries) - (a.gpt4oQueries + a.claude56Queries);
                case "name": return a.name.localeCompare(b.name);
                default: return 0;
            }
        });

    const unprofitable = clientCosts.filter(c => c.margin < 0);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Cpu className="w-6 h-6 text-blue-400" />
                    AI Costs & Usage
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                    Track AI spending per client, model usage, and margins across GPT-4o and Claude 5.6.
                </p>
            </div>

            {/* Top-level cost stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-9 h-9 bg-red-600 rounded-lg flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xs text-red-400 flex items-center gap-1"><ArrowUpRight className="w-3 h-3" />+8.3%</span>
                    </div>
                    <div className="text-xl font-bold text-white">${totals.totalCost.toFixed(2)}</div>
                    <div className="text-xs text-gray-500">Total AI Cost (MTD)</div>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-9 h-9 bg-green-600 rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xs text-green-400 flex items-center gap-1"><ArrowUpRight className="w-3 h-3" />{marginPct}%</span>
                    </div>
                    <div className="text-xl font-bold text-white">${totals.totalMargin.toFixed(2)}</div>
                    <div className="text-xs text-gray-500">Net AI Margin (MTD)</div>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
                            <BarChart3 className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <div className="text-xl font-bold text-white">{totals.totalQueries.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">Total AI Queries (MTD)</div>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-9 h-9 bg-emerald-600 rounded-lg flex items-center justify-center">
                            <Zap className="w-4 h-4 text-white" />
                        </div>
                    </div>
                    <div className="text-xl font-bold text-white">${avgCostPerQuery}</div>
                    <div className="text-xs text-gray-500">Avg Cost / Query</div>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-9 h-9 bg-purple-600 rounded-lg flex items-center justify-center">
                            <Cpu className="w-4 h-4 text-white" />
                        </div>
                    </div>
                    <div className="text-xl font-bold text-white">{(totals.totalTokens / 1000000).toFixed(1)}M</div>
                    <div className="text-xs text-gray-500">Total Tokens Used</div>
                </div>
            </div>

            {/* Unprofitable clients alert */}
            {unprofitable.length > 0 && (
                <div className="bg-red-900/20 border border-red-700/30 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                        <span className="text-sm font-semibold text-red-400">{unprofitable.length} Unprofitable Client{unprofitable.length > 1 ? "s" : ""}</span>
                    </div>
                    <div className="text-xs text-red-300 space-y-1">
                        {unprofitable.map(c => (
                            <div key={c.id} className="flex items-center justify-between bg-red-900/30 rounded-lg px-3 py-1.5">
                                <span>{c.name} <span className="text-red-500">({c.plan})</span></span>
                                <span className="font-mono text-red-400">-${Math.abs(c.margin).toFixed(2)} margin</span>
                            </div>
                        ))}
                    </div>
                    <div className="text-xs text-gray-500 mt-2">These clients&apos; AI costs exceed their subscription fee. Consider usage limits or plan upgrades.</div>
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Model Split */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-blue-400" /> Model Usage Split
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs text-gray-400 flex items-center gap-1.5">
                                        <Zap className="w-3 h-3 text-emerald-400" /> GPT-4o (Primary)
                                    </span>
                                    <span className="text-xs text-white font-medium">{gpt4oPct}% of queries</span>
                                </div>
                                <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full" style={{ width: `${gpt4oPct}%` }} />
                                </div>
                                <div className="flex items-center justify-between mt-1 text-[11px] text-gray-500">
                                    <span>{totals.gpt4oQueries.toLocaleString()} queries</span>
                                    <span>${totals.gpt4oTotal.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs text-gray-400 flex items-center gap-1.5">
                                        <Sparkles className="w-3 h-3 text-orange-400" /> Claude 5.6 (Fallback)
                                    </span>
                                    <span className="text-xs text-white font-medium">{100 - Number(gpt4oPct)}% of queries</span>
                                </div>
                                <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full" style={{ width: `${100 - Number(gpt4oPct)}%` }} />
                                </div>
                                <div className="flex items-center justify-between mt-1 text-[11px] text-gray-500">
                                    <span>{totals.claude56Queries.toLocaleString()} queries</span>
                                    <span>${totals.claude56Total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                        <div className="border-t border-gray-800 pt-3 grid grid-cols-3 gap-3 text-center">
                            <div>
                                <div className="text-xs text-gray-500">GPT-4o Rate</div>
                                <div className="text-sm font-semibold text-white">$0.0229/1K</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500">Claude Rate</div>
                                <div className="text-sm font-semibold text-white">$0.0200/1K</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500">Blended Rate</div>
                                <div className="text-sm font-semibold text-white">${(totals.totalCost / (totals.totalTokens / 1000)).toFixed(4)}/1K</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Daily Cost Chart */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-purple-400" /> Daily AI Costs (7 Days)
                    </h3>
                    <div className="flex items-end gap-2 h-40">
                        {dailyCosts.map((d) => (
                            <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                                <span className="text-[10px] text-gray-500">${d.total.toFixed(0)}</span>
                                <div className="w-full relative" style={{ height: `${(d.total / maxDailyTotal) * 100}%` }}>
                                    <div className="absolute bottom-0 w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-sm" style={{ height: `${(d.gpt4o / d.total) * 100}%` }} />
                                    <div className="absolute top-0 w-full bg-gradient-to-t from-orange-600 to-orange-400 rounded-t-sm" style={{ height: `${(d.claude56 / d.total) * 100}%` }} />
                                </div>
                                <span className="text-[9px] text-gray-600 mt-1">{d.date}</span>
                            </div>
                        ))}
                    </div>
                    <div className="flex items-center justify-center gap-4 mt-3 text-[11px] text-gray-500">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> GPT-4o</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500" /> Claude 5.6</span>
                    </div>
                    <div className="border-t border-gray-800 pt-3 mt-3 grid grid-cols-3 gap-3 text-center">
                        <div>
                            <div className="text-xs text-gray-500">7-Day Total</div>
                            <div className="text-sm font-semibold text-white">${dailyCosts.reduce((s, d) => s + d.total, 0).toFixed(2)}</div>
                        </div>
                        <div>
                            <div className="text-xs text-gray-500">Daily Avg</div>
                            <div className="text-sm font-semibold text-white">${(dailyCosts.reduce((s, d) => s + d.total, 0) / 7).toFixed(2)}</div>
                        </div>
                        <div>
                            <div className="text-xs text-gray-500">7-Day Queries</div>
                            <div className="text-sm font-semibold text-white">{dailyCosts.reduce((s, d) => s + d.queries, 0).toLocaleString()}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Per-Client Cost Table */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="p-5 border-b border-gray-800">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                            <Users className="w-4 h-4 text-blue-400" />
                            Per-Client AI Cost Breakdown
                        </h3>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input type="text" placeholder="Search clients..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 w-48" />
                            </div>
                            <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-white cursor-pointer focus:outline-none focus:border-blue-500">
                                <option value="all">All Plans</option>
                                <option value="Agency">Agency</option>
                                <option value="Pro">Pro</option>
                                <option value="Free">Free</option>
                            </select>
                            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-white cursor-pointer focus:outline-none focus:border-blue-500">
                                <option value="totalCost">Sort: Highest Cost</option>
                                <option value="margin">Sort: Best Margin</option>
                                <option value="queries">Sort: Most Queries</option>
                                <option value="name">Sort: Name</option>
                            </select>
                            <button className="bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-400 hover:text-white transition flex items-center gap-1">
                                <Download className="w-3 h-3" /> Export
                            </button>
                        </div>
                    </div>
                </div>

                {/* Table header */}
                <div className="hidden lg:grid grid-cols-12 gap-2 px-5 py-2 bg-gray-800/50 text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                    <div className="col-span-3">Client</div>
                    <div className="col-span-1 text-right">Plan</div>
                    <div className="col-span-2 text-right">GPT-4o</div>
                    <div className="col-span-2 text-right">Claude 5.6</div>
                    <div className="col-span-1 text-right">Total Cost</div>
                    <div className="col-span-1 text-right">Sub Fee</div>
                    <div className="col-span-1 text-right">Margin</div>
                    <div className="col-span-1 text-right">Last Query</div>
                </div>

                {/* Rows */}
                <div className="divide-y divide-gray-800">
                    {filtered.map((client) => (
                        <div key={client.id}>
                            <div
                                onClick={() => setExpandedClient(expandedClient === client.id ? null : client.id)}
                                className="grid grid-cols-1 lg:grid-cols-12 gap-2 px-5 py-3 hover:bg-gray-800/30 cursor-pointer transition items-center"
                            >
                                <div className="col-span-3 flex items-center gap-2 min-w-0">
                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                        {client.name.charAt(0)}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-sm text-white font-medium truncate">{client.name}</div>
                                    </div>
                                </div>
                                <div className="col-span-1 text-right">
                                    <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-full ${client.plan === "Agency" ? "bg-purple-900/40 text-purple-400" :
                                            client.plan === "Pro" ? "bg-blue-900/40 text-blue-400" :
                                                "bg-gray-800 text-gray-400"
                                        }`}>{client.plan}</span>
                                </div>
                                <div className="col-span-2 text-right">
                                    <div className="text-sm text-emerald-400 font-medium">${client.gpt4oCost.toFixed(2)}</div>
                                    <div className="text-[11px] text-gray-500">{client.gpt4oQueries} queries</div>
                                </div>
                                <div className="col-span-2 text-right">
                                    <div className="text-sm text-orange-400 font-medium">${client.claude56Cost.toFixed(2)}</div>
                                    <div className="text-[11px] text-gray-500">{client.claude56Queries} queries</div>
                                </div>
                                <div className="col-span-1 text-right">
                                    <div className="text-sm text-white font-bold">${client.totalCost.toFixed(2)}</div>
                                </div>
                                <div className="col-span-1 text-right">
                                    <div className="text-sm text-gray-300">${client.platformFee}</div>
                                </div>
                                <div className="col-span-1 text-right">
                                    <div className={`text-sm font-bold ${client.margin >= 0 ? "text-green-400" : "text-red-400"}`}>
                                        {client.margin >= 0 ? "+" : ""}${client.margin.toFixed(2)}
                                    </div>
                                </div>
                                <div className="col-span-1 text-right">
                                    <div className="text-[11px] text-gray-500 flex items-center justify-end gap-1">
                                        <Clock className="w-3 h-3" /> {client.lastQuery}
                                    </div>
                                </div>
                            </div>

                            {/* Expanded detail */}
                            {expandedClient === client.id && (
                                <div className="px-5 pb-4 bg-gray-800/20">
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-gray-800/30 rounded-lg">
                                        <div>
                                            <div className="text-[11px] text-gray-500">GPT-4o Tokens</div>
                                            <div className="text-sm text-white font-medium">{(client.gpt4oTokens / 1000).toFixed(0)}K</div>
                                        </div>
                                        <div>
                                            <div className="text-[11px] text-gray-500">Claude 5.6 Tokens</div>
                                            <div className="text-sm text-white font-medium">{(client.claude56Tokens / 1000).toFixed(0)}K</div>
                                        </div>
                                        <div>
                                            <div className="text-[11px] text-gray-500">Total Tokens</div>
                                            <div className="text-sm text-white font-medium">{((client.gpt4oTokens + client.claude56Tokens) / 1000).toFixed(0)}K</div>
                                        </div>
                                        <div>
                                            <div className="text-[11px] text-gray-500">Cost/Query Avg</div>
                                            <div className="text-sm text-white font-medium">${(client.totalCost / (client.gpt4oQueries + client.claude56Queries)).toFixed(3)}</div>
                                        </div>
                                        <div>
                                            <div className="text-[11px] text-gray-500">Model Split</div>
                                            <div className="flex items-center gap-1 mt-0.5">
                                                <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden flex">
                                                    <div className="h-full bg-emerald-500" style={{ width: `${(client.gpt4oQueries / (client.gpt4oQueries + client.claude56Queries)) * 100}%` }} />
                                                    <div className="h-full bg-orange-500" style={{ width: `${(client.claude56Queries / (client.gpt4oQueries + client.claude56Queries)) * 100}%` }} />
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-[11px] text-gray-500">Margin %</div>
                                            <div className={`text-sm font-medium ${client.margin >= 0 ? "text-green-400" : "text-red-400"}`}>
                                                {client.platformFee > 0 ? ((client.margin / client.platformFee) * 100).toFixed(0) : "N/A"}%
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-[11px] text-gray-500">Plan Revenue</div>
                                            <div className="text-sm text-white font-medium">${client.platformFee}/mo</div>
                                        </div>
                                        <div>
                                            <div className="text-[11px] text-gray-500">Projected Monthly</div>
                                            <div className={`text-sm font-medium ${client.margin >= 0 ? "text-green-400" : "text-red-400"}`}>
                                                ${(client.totalCost * 1.1).toFixed(2)} est.
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Table footer totals */}
                <div className="grid grid-cols-12 gap-2 px-5 py-3 bg-gray-800/60 border-t border-gray-700">
                    <div className="col-span-3 text-sm text-white font-bold">Totals ({filtered.length} clients)</div>
                    <div className="col-span-1" />
                    <div className="col-span-2 text-right">
                        <div className="text-sm text-emerald-400 font-bold">${totals.gpt4oTotal.toFixed(2)}</div>
                        <div className="text-[11px] text-gray-500">{totals.gpt4oQueries.toLocaleString()} queries</div>
                    </div>
                    <div className="col-span-2 text-right">
                        <div className="text-sm text-orange-400 font-bold">${totals.claude56Total.toFixed(2)}</div>
                        <div className="text-[11px] text-gray-500">{totals.claude56Queries.toLocaleString()} queries</div>
                    </div>
                    <div className="col-span-1 text-right">
                        <div className="text-sm text-white font-bold">${totals.totalCost.toFixed(2)}</div>
                    </div>
                    <div className="col-span-1 text-right">
                        <div className="text-sm text-gray-300 font-bold">${totals.totalRevenue.toFixed(0)}</div>
                    </div>
                    <div className="col-span-1 text-right">
                        <div className={`text-sm font-bold ${totals.totalMargin >= 0 ? "text-green-400" : "text-red-400"}`}>
                            ${totals.totalMargin.toFixed(2)}
                        </div>
                    </div>
                    <div className="col-span-1" />
                </div>
            </div>

            {/* Cost optimization tips */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Cost Optimization Insights
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-gray-800/40 rounded-lg p-3">
                        <div className="text-xs text-amber-400 font-medium mb-1">Free Plan Users Cost You</div>
                        <div className="text-lg font-bold text-white">${clientCosts.filter(c => c.plan === "Free").reduce((s, c) => s + c.totalCost, 0).toFixed(2)}/mo</div>
                        <div className="text-[11px] text-gray-500 mt-1">{clientCosts.filter(c => c.plan === "Free").length} free users generating AI costs with $0 revenue. Consider query limits.</div>
                    </div>
                    <div className="bg-gray-800/40 rounded-lg p-3">
                        <div className="text-xs text-blue-400 font-medium mb-1">Claude 5.6 Savings</div>
                        <div className="text-lg font-bold text-white">${(totals.claude56Total * 0.15).toFixed(2)}/mo saved</div>
                        <div className="text-[11px] text-gray-500 mt-1">Claude 5.6 costs ~13% less than GPT-4o per token. Used as fallback for {100 - Number(gpt4oPct)}% of queries.</div>
                    </div>
                    <div className="bg-gray-800/40 rounded-lg p-3">
                        <div className="text-xs text-green-400 font-medium mb-1">Revenue per AI Dollar</div>
                        <div className="text-lg font-bold text-white">${(totals.totalRevenue / totals.totalCost).toFixed(2)}</div>
                        <div className="text-[11px] text-gray-500 mt-1">For every $1 spent on AI, you generate ${(totals.totalRevenue / totals.totalCost).toFixed(2)} in subscription revenue.</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
