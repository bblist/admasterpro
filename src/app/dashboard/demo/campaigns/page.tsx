"use client";

import {
    Play,
    Pause,
    DollarSign,
    Phone,
    MousePointer,
    TrendingUp,
    TrendingDown,
    MoreVertical,
    Search,
    ShoppingBag,
    Image,
} from "lucide-react";
import Tooltip from "@/components/Tooltip";

type CampaignType = "search" | "shopping" | "display";

interface Campaign {
    id: number;
    name: string;
    client: string;
    type: CampaignType;
    status: "active" | "paused";
    dailyBudget: number;
    spent: number;
    clicks: number;
    calls: number;
    costPerCall: number;
    trend: "up" | "down" | "flat";
    purchases?: number;
    roas?: number;
    impressions?: number;
}

const campaigns: Campaign[] = [
    {
        id: 1,
        name: "LASIK & Eye Exams",
        client: "ClearVision Eye Clinic",
        type: "search" as CampaignType,
        status: "active" as const,
        dailyBudget: 50,
        spent: 312.00,
        clicks: 89,
        calls: 18,
        costPerCall: 17.33,
        trend: "up" as const,
    },
    {
        id: 2,
        name: "Summer Collection",
        client: "Bella Fashion Boutique",
        type: "shopping" as CampaignType,
        status: "active" as const,
        dailyBudget: 75,
        spent: 485.50,
        clicks: 620,
        calls: 0,
        costPerCall: 0,
        trend: "up" as const,
        purchases: 34,
        roas: 4.2,
    },
    {
        id: 3,
        name: "Emergency Plumbing",
        client: "Mike's Plumbing",
        type: "search" as CampaignType,
        status: "active" as const,
        dailyBudget: 30,
        spent: 124.50,
        clicks: 58,
        calls: 12,
        costPerCall: 10.38,
        trend: "up" as const,
    },
    {
        id: 4,
        name: "Brand Awareness — Display",
        client: "ClearVision Eye Clinic",
        type: "display" as CampaignType,
        status: "active" as const,
        dailyBudget: 40,
        spent: 278.00,
        clicks: 1240,
        calls: 5,
        costPerCall: 55.60,
        trend: "flat" as const,
        impressions: 48500,
    },
    {
        id: 5,
        name: "Lunch Specials",
        client: "Sakura Sushi Bar",
        type: "search" as CampaignType,
        status: "active" as const,
        dailyBudget: 20,
        spent: 142.50,
        clicks: 95,
        calls: 22,
        costPerCall: 6.48,
        trend: "up" as const,
    },
    {
        id: 6,
        name: "Designer Handbags",
        client: "Bella Fashion Boutique",
        type: "shopping" as CampaignType,
        status: "paused" as const,
        dailyBudget: 35,
        spent: 210.00,
        clicks: 180,
        calls: 0,
        costPerCall: 0,
        trend: "down" as const,
        purchases: 8,
        roas: 1.9,
    },
    {
        id: 7,
        name: "Auto Detailing Specials",
        client: "Pinnacle Auto Spa",
        type: "display" as CampaignType,
        status: "active" as const,
        dailyBudget: 25,
        spent: 165.00,
        clicks: 340,
        calls: 8,
        costPerCall: 20.63,
        trend: "up" as const,
        impressions: 22000,
    },
    {
        id: 8,
        name: "Drain Cleaning Special",
        client: "Mike's Plumbing",
        type: "search" as CampaignType,
        status: "paused" as const,
        dailyBudget: 15,
        spent: 52.00,
        clicks: 28,
        calls: 5,
        costPerCall: 10.40,
        trend: "down" as const,
    },
];

const typeIcons: Record<CampaignType, typeof Search> = {
    search: Search,
    shopping: ShoppingBag,
    display: Image,
};

const typeLabels: Record<CampaignType, string> = {
    search: "Search",
    shopping: "Shopping",
    display: "Display",
};

const typeColors: Record<CampaignType, string> = {
    search: "bg-blue-100 text-blue-700",
    shopping: "bg-purple-100 text-purple-700",
    display: "bg-orange-100 text-orange-700",
};

export default function CampaignsPage() {
    const activeCampaigns = campaigns.filter((c) => c.status === "active").length;
    const totalSpent = campaigns.reduce((sum, c) => sum + c.spent, 0);
    const totalCalls = campaigns.reduce((sum, c) => sum + c.calls, 0);

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Demo banner */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2">
                <span className="text-xs font-bold bg-amber-400 text-amber-900 px-2 py-0.5 rounded-full">DEMO</span>
                <span className="text-xs text-amber-800">
                    You&apos;re viewing example campaign data. Your real campaigns will appear once connected to Google Ads.
                </span>
            </div>
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Your Campaigns</h1>
                    <p className="text-muted text-sm mt-1">All clients • Last 7 days</p>
                </div>
                <div className="flex gap-2">
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">Search</span>
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">Shopping</span>
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">Display</span>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-card border border-border rounded-xl p-4">
                    <div className="text-muted text-xs mb-1 flex items-center gap-1">Active Campaigns <Tooltip text="Campaigns currently running and spending your budget." /></div>
                    <div className="text-xl font-bold">{activeCampaigns}</div>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                    <div className="text-muted text-xs mb-1 flex items-center gap-1">Total Spent <Tooltip text="Combined spend across all campaigns in the last 7 days." /></div>
                    <div className="text-xl font-bold">${totalSpent.toFixed(2)}</div>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                    <div className="text-muted text-xs mb-1 flex items-center gap-1">Total Conversions <Tooltip text="All conversions including calls, form submissions, and purchases." /></div>
                    <div className="text-xl font-bold">{totalCalls}</div>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                    <div className="text-muted text-xs mb-1 flex items-center gap-1">Avg Cost/Conv <Tooltip text="Average cost per conversion. Lower means more efficient ad spend." /></div>
                    <div className="text-xl font-bold">${totalCalls > 0 ? (totalSpent / totalCalls).toFixed(2) : "—"}</div>
                </div>
            </div>

            {/* Campaigns Table */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border bg-sidebar">
                                <th className="text-left px-5 py-3 font-medium text-muted">Campaign</th>
                                <th className="text-left px-5 py-3 font-medium text-muted">Type</th>
                                <th className="text-left px-5 py-3 font-medium text-muted">Status</th>
                                <th className="text-right px-5 py-3 font-medium text-muted">Budget/Day</th>
                                <th className="text-right px-5 py-3 font-medium text-muted">Spent</th>
                                <th className="text-right px-5 py-3 font-medium text-muted">Clicks</th>
                                <th className="text-right px-5 py-3 font-medium text-muted">Conversions</th>
                                <th className="text-right px-5 py-3 font-medium text-muted">Cost/Conv</th>
                                <th className="text-right px-5 py-3 font-medium text-muted">Trend</th>
                                <th className="px-5 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {campaigns.map((c) => {
                                const TypeIcon = typeIcons[c.type];
                                return (
                                    <tr key={c.id} className="hover:bg-sidebar/50 transition">
                                        <td className="px-5 py-4">
                                            <div className="font-medium">{c.name}</div>
                                            <div className="text-xs text-muted mt-0.5">{c.client}</div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${typeColors[c.type]}`}>
                                                <TypeIcon className="w-3 h-3" />
                                                {typeLabels[c.type]}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span
                                                className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${c.status === "active"
                                                    ? "bg-success/10 text-success"
                                                    : "bg-muted/10 text-muted"
                                                    }`}
                                            >
                                                {c.status === "active" ? (
                                                    <Play className="w-3 h-3" />
                                                ) : (
                                                    <Pause className="w-3 h-3" />
                                                )}
                                                {c.status === "active" ? "Active" : "Paused"}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1 text-muted">
                                                <DollarSign className="w-3 h-3" />
                                                {c.dailyBudget}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-right font-medium">${c.spent.toFixed(2)}</td>
                                        <td className="px-5 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <MousePointer className="w-3 h-3 text-muted" />
                                                {c.clicks}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {c.type === "shopping" ? (
                                                    <>
                                                        <ShoppingBag className="w-3 h-3 text-muted" />
                                                        {c.purchases || 0} sales
                                                    </>
                                                ) : (
                                                    <>
                                                        <Phone className="w-3 h-3 text-muted" />
                                                        {c.calls} calls
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-right font-medium">
                                            {c.type === "shopping"
                                                ? (c.roas ? `${c.roas}x ROAS` : "—")
                                                : (c.costPerCall > 0 ? `$${c.costPerCall.toFixed(2)}` : "—")}
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            {c.trend === "up" ? (
                                                <TrendingUp className="w-4 h-4 text-success inline" />
                                            ) : c.trend === "down" ? (
                                                <TrendingDown className="w-4 h-4 text-danger inline" />
                                            ) : (
                                                <span className="text-xs text-muted">—</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <button className="p-1 text-muted hover:text-foreground transition">
                                                <MoreVertical className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* AI Tip */}
            <div className="bg-primary-light border border-primary/20 rounded-xl p-4">
                <p className="text-sm">
                    <strong>💡 Tip:</strong> Bella Fashion&apos;s &quot;Summer Collection&quot; shopping campaign
                    has a 4.2x ROAS — consider increasing its daily budget. The &quot;Designer Handbags&quot;
                    campaign (1.9x ROAS) may need better product images or pricing adjustments before restarting.
                </p>
            </div>
        </div>
    );
}
