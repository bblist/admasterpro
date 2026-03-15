"use client";

import { useState } from "react";
import { Clock, Sun, Moon, TrendingUp, Zap, Globe, MapPin } from "lucide-react";
import { useBusiness } from "@/lib/business-context";
import SetupChecklist from "@/components/SetupChecklist";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

// Generate demo heatmap data (conversions by hour/day)
function generateHeatmap(): number[][] {
  return DAYS.map((_, dayIdx) => {
    return HOURS.map(hour => {
      // Weekdays peak 9-14, dip at night. Weekends flatter.
      const isWeekday = dayIdx < 5;
      const base = isWeekday ? 4 : 2;
      let boost = 0;
      if (isWeekday && hour >= 9 && hour <= 14) boost = 8 + Math.random() * 6;
      else if (isWeekday && hour >= 15 && hour <= 18) boost = 4 + Math.random() * 3;
      else if (!isWeekday && hour >= 10 && hour <= 16) boost = 3 + Math.random() * 4;
      if (hour >= 0 && hour <= 5) boost = -3;
      return Math.max(0, Math.round(base + boost + (Math.random() - 0.5) * 2));
    });
  });
}

const heatmapData = generateHeatmap();
const maxVal = Math.max(...heatmapData.flat());

function getColor(val: number): string {
  if (val === 0) return "bg-gray-100";
  const intensity = val / maxVal;
  if (intensity > 0.75) return "bg-green-600 text-white";
  if (intensity > 0.5) return "bg-green-400 text-white";
  if (intensity > 0.25) return "bg-green-200";
  return "bg-green-100";
}

export default function AdSchedulingPage() {
  const { activeBusiness } = useBusiness();
  const [userTimezone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [targetTimezone, setTargetTimezone] = useState("Europe/London");

  const userTzOffset = new Date().getTimezoneOffset();
  const targetDate = new Date(new Date().toLocaleString("en-US", { timeZone: targetTimezone }));
  const userDate = new Date();
  const diffHours = Math.round((targetDate.getTime() - userDate.getTime()) / 3600000);

  const bestHours = [
    { range: "10:00 – 14:00", day: "Weekdays", conversions: 47, cpa: 8.20, note: "Best overall. Your audience converts most during work hours." },
    { range: "15:00 – 18:00", day: "Weekdays", conversions: 28, cpa: 11.40, note: "Decent but more expensive — afternoon competition heats up." },
    { range: "11:00 – 15:00", day: "Weekends", conversions: 18, cpa: 9.80, note: "Weekend browsers convert well around lunchtime." },
  ];

  const worstHours = [
    { range: "00:00 – 05:00", day: "Every day", clicks: 34, conversions: 0, cost: 52, note: "Late night clicks with zero conversions. Turn off ads here." },
    { range: "20:00 – 23:00", day: "Weekdays", clicks: 48, conversions: 2, cost: 76, note: "Evening browsers rarely convert — mostly window shopping." },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Clock className="w-5 h-5 text-primary" />
          </div>
          Ad Scheduling Optimizer
        </h1>
        <p className="text-muted text-sm mt-1">
          See when your ads convert best and schedule them to run during peak hours.
        </p>
      </div>

      <SetupChecklist
          prereqs={["google_ads"]}
          pageContext="Connect your Google Ads account so the Ad Scheduling Optimizer can analyze when your ads convert best"
          mode="blocking"
      />

      {/* Timezone Awareness */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-blue-600" />
          <div>
            <div className="text-sm font-medium">
              You&apos;re in <span className="font-bold">{userTimezone.replace(/_/g, " ")}</span>
              {diffHours !== 0 && (
                <span className="text-blue-600 ml-1">
                  ({diffHours > 0 ? "+" : ""}{diffHours}h from target)
                </span>
              )}
            </div>
            <div className="text-xs text-muted mt-0.5">
              Times below are shown in your target audience&apos;s timezone.
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <label className="text-xs text-muted whitespace-nowrap">Target audience:</label>
          <select
            value={targetTimezone}
            onChange={e => setTargetTimezone(e.target.value)}
            className="text-sm border border-blue-200 rounded-lg px-3 py-1.5 bg-white"
          >
            <option value="Europe/London">UK (London)</option>
            <option value="America/New_York">US East (New York)</option>
            <option value="America/Los_Angeles">US West (Los Angeles)</option>
            <option value="America/Chicago">US Central (Chicago)</option>
            <option value="Europe/Berlin">Germany (Berlin)</option>
            <option value="Europe/Paris">France (Paris)</option>
            <option value="Australia/Sydney">Australia (Sydney)</option>
            <option value="Asia/Tokyo">Japan (Tokyo)</option>
            <option value="Asia/Dubai">UAE (Dubai)</option>
          </select>
        </div>
      </div>

      {/* Conversion Heatmap */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="font-semibold mb-4">Conversion heatmap</h2>
        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
            {/* Hour labels */}
            <div className="flex items-center mb-1">
              <div className="w-10" />
              {HOURS.map(h => (
                <div key={h} className="flex-1 text-center text-[9px] text-muted">
                  {h.toString().padStart(2, "0")}
                </div>
              ))}
            </div>
            {/* Rows */}
            {DAYS.map((day, dayIdx) => (
              <div key={day} className="flex items-center gap-0.5 mb-0.5">
                <div className="w-10 text-xs text-muted font-medium">{day}</div>
                {HOURS.map(hour => (
                  <div
                    key={hour}
                    className={`flex-1 h-7 rounded-sm flex items-center justify-center text-[9px] font-medium ${getColor(heatmapData[dayIdx][hour])}`}
                    title={`${day} ${hour}:00 — ${heatmapData[dayIdx][hour]} conversions`}
                  >
                    {heatmapData[dayIdx][hour] > 0 ? heatmapData[dayIdx][hour] : ""}
                  </div>
                ))}
              </div>
            ))}
            {/* Legend */}
            <div className="flex items-center gap-2 mt-3 justify-end text-[10px] text-muted">
              <span>Fewer</span>
              <div className="w-4 h-3 rounded-sm bg-green-100" />
              <div className="w-4 h-3 rounded-sm bg-green-200" />
              <div className="w-4 h-3 rounded-sm bg-green-400" />
              <div className="w-4 h-3 rounded-sm bg-green-600" />
              <span>More conversions</span>
            </div>
          </div>
        </div>
      </div>

      {/* Best Times */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="font-semibold flex items-center gap-2 mb-4">
          <Sun className="w-4 h-4 text-amber-500" /> Best converting windows
        </h2>
        <div className="space-y-3">
          {bestHours.map((b, i) => (
            <div key={i} className="flex items-start gap-4 p-3 bg-green-50 rounded-xl border border-green-100">
              <div className="text-center min-w-[80px]">
                <div className="text-sm font-bold text-green-700">{b.range}</div>
                <div className="text-[10px] text-muted">{b.day}</div>
              </div>
              <div className="flex-1">
                <p className="text-sm">{b.note}</p>
                <div className="flex items-center gap-4 mt-1 text-xs text-muted">
                  <span>{b.conversions} conversions</span>
                  <span>£{b.cpa.toFixed(2)} avg CPA</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Worst Times */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="font-semibold flex items-center gap-2 mb-4">
          <Moon className="w-4 h-4 text-gray-400" /> Dead zones — consider pausing
        </h2>
        <div className="space-y-3">
          {worstHours.map((w, i) => (
            <div key={i} className="flex items-start gap-4 p-3 bg-red-50 rounded-xl border border-red-100">
              <div className="text-center min-w-[80px]">
                <div className="text-sm font-bold text-red-700">{w.range}</div>
                <div className="text-[10px] text-muted">{w.day}</div>
              </div>
              <div className="flex-1">
                <p className="text-sm">{w.note}</p>
                <div className="flex items-center gap-4 mt-1 text-xs text-muted">
                  <span>{w.clicks} clicks</span>
                  <span>{w.conversions} conversions</span>
                  <span>£{w.cost} wasted</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Action */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Zap className="w-5 h-5 text-primary" />
        <div className="flex-1">
          <div className="text-sm font-semibold">Apply recommended schedule?</div>
          <div className="text-xs text-muted mt-0.5">Run ads Mon–Fri 9am–6pm and weekends 10am–4pm in your target timezone. Pause late night and early morning.</div>
        </div>
        <button className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90 whitespace-nowrap">
          Apply Schedule
        </button>
      </div>
    </div>
  );
}
