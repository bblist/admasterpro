"use client";

import {
  BarChart3,
  Clock,
  MessageCircle,
  Zap,
  TrendingUp,
  Activity,
  Globe,
  Smartphone,
  Monitor,
  MousePointer,
} from "lucide-react";

// Demo analytics data
const dailyUsage = [
  { hour: "12am", queries: 12 },
  { hour: "3am", queries: 5 },
  { hour: "6am", queries: 28 },
  { hour: "9am", queries: 145 },
  { hour: "12pm", queries: 210 },
  { hour: "3pm", queries: 178 },
  { hour: "6pm", queries: 134 },
  { hour: "9pm", queries: 89 },
];

const featureUsage = [
  { feature: "AI Chat / Ask Questions", usage: 4210, pct: 100 },
  { feature: "Campaign Overview", usage: 3180, pct: 75 },
  { feature: "Keyword Analysis", usage: 2890, pct: 69 },
  { feature: "Auto-Pilot Actions", usage: 2340, pct: 56 },
  { feature: "Ad Drafts Review", usage: 1890, pct: 45 },
  { feature: "Settings / Config", usage: 890, pct: 21 },
  { feature: "Onboarding (New Users)", usage: 389, pct: 9 },
];

const aiMetrics = [
  { label: "Total AI Queries (Today)", value: "8,291" },
  { label: "Avg Queries per User", value: "6.6" },
  { label: "Avg Response Time", value: "1.2s" },
  { label: "Auto-Pilot Actions (Today)", value: "342" },
  { label: "Drafts Created (Today)", value: "89" },
  { label: "Money Saved (Today)", value: "$12,450" },
];

const topQueries = [
  { query: "How are my campaigns doing?", count: 892, category: "Performance" },
  { query: "Which keywords should I pause?", count: 567, category: "Keywords" },
  { query: "Write me a new ad", count: 445, category: "Ad Creation" },
  { query: "How much am I wasting?", count: 398, category: "Budget" },
  { query: "What should I change?", count: 356, category: "Optimization" },
  { query: "Show me my best campaigns", count: 312, category: "Performance" },
  { query: "Reduce my cost per lead", count: 289, category: "Budget" },
  { query: "Compare this week vs last week", count: 234, category: "Reporting" },
];

const deviceBreakdown = [
  { device: "Desktop", pct: 62, icon: Monitor },
  { device: "Mobile", pct: 31, icon: Smartphone },
  { device: "Tablet", pct: 7, icon: Globe },
];

const sessionMetrics = [
  { label: "Avg Session Duration", value: "8m 42s" },
  { label: "Pages per Session", value: "4.3" },
  { label: "Bounce Rate", value: "12%" },
  { label: "Returning Users (7d)", value: "78%" },
];

const retentionCohorts = [
  { cohort: "Sep '25", m1: 92, m2: 85, m3: 78, m4: 72, m5: 68, m6: 65 },
  { cohort: "Oct '25", m1: 89, m2: 82, m3: 75, m4: 70, m5: 66, m6: null },
  { cohort: "Nov '25", m1: 91, m2: 84, m3: 77, m4: 73, m5: null, m6: null },
  { cohort: "Dec '25", m1: 88, m2: 80, m3: 74, m4: null, m5: null, m6: null },
  { cohort: "Jan '26", m1: 93, m2: 86, m3: null, m4: null, m5: null, m6: null },
  { cohort: "Feb '26", m1: 95, m2: null, m3: null, m4: null, m5: null, m6: null },
];

const autoPilotStats = [
  { action: "Paused junk keywords", count: 1245, saved: "$18,200" },
  { action: "Adjusted bid strategies", count: 890, saved: "$12,100" },
  { action: "Paused off-hours spending", count: 567, saved: "$8,400" },
  { action: "Budget reallocation", count: 234, saved: "$5,600" },
  { action: "Negative keyword additions", count: 178, saved: "$3,200" },
];

export default function AdminAnalyticsPage() {
  const maxQueries = Math.max(...dailyUsage.map((d) => d.queries));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Analytics</h2>
        <p className="text-gray-500 text-sm mt-1">
          Platform usage patterns, AI performance, and user engagement
        </p>
      </div>

      {/* Session metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {sessionMetrics.map((m) => (
          <div key={m.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="text-2xl font-bold text-white">{m.value}</div>
            <div className="text-xs text-gray-500 mt-1">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Daily usage heatmap + Device breakdown */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400" />
            Queries by Time of Day (Today)
          </h3>
          <div className="flex items-end gap-3 h-40">
            {dailyUsage.map((d) => (
              <div key={d.hour} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-gray-400">{d.queries}</span>
                <div
                  className="w-full bg-gradient-to-t from-blue-600 to-cyan-400 rounded-t-md"
                  style={{ height: `${(d.queries / maxQueries) * 120}px` }}
                />
                <span className="text-[10px] text-gray-600 mt-1">{d.hour}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 text-xs text-gray-500">
            Peak usage: 12pm–3pm · Lowest: 3am–6am
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Monitor className="w-4 h-4 text-purple-400" />
            Device Breakdown
          </h3>
          <div className="space-y-4">
            {deviceBreakdown.map((d) => (
              <div key={d.device}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <d.icon className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-white">{d.device}</span>
                  </div>
                  <span className="text-sm text-white font-medium">{d.pct}%</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div
                    className="bg-purple-500 h-2 rounded-full"
                    style={{ width: `${d.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 p-3 bg-gray-800/50 rounded-lg text-center">
            <div className="text-xs text-gray-500">Most common browser</div>
            <div className="text-sm text-white font-medium mt-1">Chrome (73%)</div>
          </div>
        </div>
      </div>

      {/* Feature Usage */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <MousePointer className="w-4 h-4 text-green-400" />
          Feature Usage (Last 7 Days)
        </h3>
        <div className="space-y-3">
          {featureUsage.map((f) => (
            <div key={f.feature} className="flex items-center gap-4">
              <div className="w-44 text-sm text-gray-300 flex-shrink-0 truncate">{f.feature}</div>
              <div className="flex-1 bg-gray-800 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-green-600 to-emerald-400 h-3 rounded-full"
                  style={{ width: `${f.pct}%` }}
                />
              </div>
              <div className="w-16 text-right text-sm text-gray-400 flex-shrink-0">
                {f.usage.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Metrics + Top Queries */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            AI Engine Metrics
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {aiMetrics.map((m) => (
              <div
                key={m.label}
                className="p-3 bg-gray-800/50 rounded-lg"
              >
                <div className="text-lg font-bold text-white">{m.value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{m.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-blue-400" />
            Most Common User Queries
          </h3>
          <div className="space-y-2">
            {topQueries.map((q, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2.5 bg-gray-800/30 rounded-lg"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs text-gray-600 w-5">#{i + 1}</span>
                  <div className="min-w-0">
                    <div className="text-sm text-gray-300 truncate">&ldquo;{q.query}&rdquo;</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                  <span className="text-[10px] text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded">
                    {q.category}
                  </span>
                  <span className="text-xs text-white font-medium">{q.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Auto-Pilot Performance */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-green-400" />
          Auto-Pilot Actions (All Time)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {autoPilotStats.map((a) => (
            <div key={a.action} className="p-4 bg-gray-800/40 rounded-lg text-center">
              <div className="text-lg font-bold text-white">{a.count.toLocaleString()}</div>
              <div className="text-xs text-gray-400 mt-1">{a.action}</div>
              <div className="text-xs text-green-400 mt-2 font-medium">{a.saved} saved</div>
            </div>
          ))}
        </div>
      </div>

      {/* Retention Cohorts */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-purple-400" />
          Retention Cohorts (% still active)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left p-3 text-gray-500 font-medium">Cohort</th>
                <th className="text-center p-3 text-gray-500 font-medium">Month 1</th>
                <th className="text-center p-3 text-gray-500 font-medium">Month 2</th>
                <th className="text-center p-3 text-gray-500 font-medium">Month 3</th>
                <th className="text-center p-3 text-gray-500 font-medium">Month 4</th>
                <th className="text-center p-3 text-gray-500 font-medium">Month 5</th>
                <th className="text-center p-3 text-gray-500 font-medium">Month 6</th>
              </tr>
            </thead>
            <tbody>
              {retentionCohorts.map((c) => (
                <tr key={c.cohort} className="border-b border-gray-800/50">
                  <td className="p-3 text-white font-medium">{c.cohort}</td>
                  {[c.m1, c.m2, c.m3, c.m4, c.m5, c.m6].map((val, i) => (
                    <td key={i} className="p-3 text-center">
                      {val !== null ? (
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            val >= 85
                              ? "bg-green-900/40 text-green-400"
                              : val >= 70
                              ? "bg-blue-900/40 text-blue-400"
                              : val >= 60
                              ? "bg-amber-900/40 text-amber-400"
                              : "bg-red-900/40 text-red-400"
                          }`}
                        >
                          {val}%
                        </span>
                      ) : (
                        <span className="text-gray-700">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
