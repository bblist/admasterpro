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
} from "lucide-react";

const campaigns = [
  {
    id: 1,
    name: "Emergency Plumbing",
    status: "active" as const,
    dailyBudget: 30,
    spent: 124.5,
    clicks: 58,
    calls: 12,
    costPerCall: 10.38,
    trend: "up" as const,
  },
  {
    id: 2,
    name: "Water Heater Repair",
    status: "active" as const,
    dailyBudget: 20,
    spent: 78.0,
    clicks: 35,
    calls: 4,
    costPerCall: 19.5,
    trend: "down" as const,
  },
  {
    id: 3,
    name: "General Plumbing Services",
    status: "paused" as const,
    dailyBudget: 25,
    spent: 45.0,
    clicks: 22,
    calls: 2,
    costPerCall: 22.5,
    trend: "down" as const,
  },
  {
    id: 4,
    name: "Drain Cleaning Special",
    status: "active" as const,
    dailyBudget: 15,
    spent: 52.0,
    clicks: 28,
    calls: 5,
    costPerCall: 10.4,
    trend: "up" as const,
  },
];

export default function CampaignsPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Your Campaigns</h1>
          <p className="text-muted text-sm mt-1">Last 7 days</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-muted text-xs mb-1">Active Campaigns</div>
          <div className="text-xl font-bold">3</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-muted text-xs mb-1">Total Spent</div>
          <div className="text-xl font-bold">$299.50</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-muted text-xs mb-1">Total Calls</div>
          <div className="text-xl font-bold">23</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-muted text-xs mb-1">Avg Cost/Call</div>
          <div className="text-xl font-bold">$13.02</div>
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-sidebar">
                <th className="text-left px-5 py-3 font-medium text-muted">Campaign</th>
                <th className="text-left px-5 py-3 font-medium text-muted">Status</th>
                <th className="text-right px-5 py-3 font-medium text-muted">Budget/Day</th>
                <th className="text-right px-5 py-3 font-medium text-muted">Spent</th>
                <th className="text-right px-5 py-3 font-medium text-muted">Clicks</th>
                <th className="text-right px-5 py-3 font-medium text-muted">Calls</th>
                <th className="text-right px-5 py-3 font-medium text-muted">Cost/Call</th>
                <th className="text-right px-5 py-3 font-medium text-muted">Trend</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {campaigns.map((c) => (
                <tr key={c.id} className="hover:bg-sidebar/50 transition">
                  <td className="px-5 py-4 font-medium">{c.name}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${
                        c.status === "active"
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
                      <Phone className="w-3 h-3 text-muted" />
                      {c.calls}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right font-medium">${c.costPerCall.toFixed(2)}</td>
                  <td className="px-5 py-4 text-right">
                    {c.trend === "up" ? (
                      <TrendingUp className="w-4 h-4 text-success inline" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-danger inline" />
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button className="p-1 text-muted hover:text-foreground transition">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Tip */}
      <div className="bg-primary-light border border-primary/20 rounded-xl p-4">
        <p className="text-sm">
          <strong>💡 Tip:</strong> Your &quot;Emergency Plumbing&quot; campaign is your best performer at $10.38/call.
          Consider moving some budget from &quot;General Plumbing Services&quot; (which costs $22.50/call) to
          Emergency Plumbing to get more calls at a lower price.
        </p>
      </div>
    </div>
  );
}
