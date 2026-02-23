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

// Demo data
const stats = {
  spent: 247.5,
  spentChange: -38,
  calls: 18,
  callsChange: 5,
  costPerCustomer: 13.75,
  costChange: -2.5,
  healthScore: 82,
};

const moneyLeaks = [
  {
    keyword: "free plumbing tips",
    spent: 22.0,
    clicks: 14,
    calls: 0,
    status: "danger" as const,
    suggestion: "Pause this keyword — it attracts people looking for free advice, not customers.",
  },
  {
    keyword: "plumber salary miami",
    spent: 8.5,
    clicks: 6,
    calls: 0,
    status: "danger" as const,
    suggestion: "This is someone looking for job info, not a customer. Add as negative keyword.",
  },
  {
    keyword: "how to fix a leaky faucet",
    spent: 15.0,
    clicks: 11,
    calls: 0,
    status: "warning" as const,
    suggestion: "DIY searchers — probably won't hire you. Consider pausing.",
  },
];

const winners = [
  {
    keyword: "emergency plumber near me",
    spent: 18.0,
    clicks: 8,
    calls: 4,
    costPerCall: 4.5,
    status: "success" as const,
  },
  {
    keyword: "plumber miami 24 hour",
    spent: 24.0,
    clicks: 12,
    calls: 5,
    costPerCall: 4.8,
    status: "success" as const,
  },
  {
    keyword: "water heater repair miami",
    spent: 32.0,
    clicks: 15,
    calls: 4,
    costPerCall: 8.0,
    status: "success" as const,
  },
];

const recentActions = [
  {
    time: "2 hours ago",
    action: 'Paused keyword "plumber jobs miami"',
    savings: "$3/day",
    auto: true,
  },
  {
    time: "Yesterday",
    action: 'Added negative keyword "free"',
    savings: "$5/day",
    auto: true,
  },
  {
    time: "2 days ago",
    action: "Turned off ads between midnight–6am",
    savings: "$8/day",
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
            Phone Calls
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
            Cost Per Customer
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
              This week looks better than last week! You spent <strong>$38 less</strong> but got{" "}
              <strong>5 more calls</strong>. I found 3 keywords wasting money — fixing them could
              save you about <strong>$45/week</strong>. Check the &quot;Money Leaks&quot; section
              below, or{" "}
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
              <span className="text-lg font-bold">$247</span>
              <span className="text-xs text-muted">vs $285</span>
            </div>
            <div className="text-xs text-success flex items-center justify-center gap-1 mt-1">
              <TrendingDown className="w-3 h-3" /> 13% less
            </div>
          </div>
          <div>
            <div className="text-muted text-xs mb-1">Customers</div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-lg font-bold">18</span>
              <span className="text-xs text-muted">vs 13</span>
            </div>
            <div className="text-xs text-success flex items-center justify-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" /> 38% more
            </div>
          </div>
          <div>
            <div className="text-muted text-xs mb-1">Cost Per Customer</div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-lg font-bold">$13.75</span>
              <span className="text-xs text-muted">vs $21.92</span>
            </div>
            <div className="text-xs text-success flex items-center justify-center gap-1 mt-1">
              <TrendingDown className="w-3 h-3" /> 37% cheaper
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
