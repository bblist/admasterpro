"use client";

import { useState } from "react";
import { Mail, Calendar, TrendingUp, TrendingDown, DollarSign, Target, Clock, Settings, CheckCircle, Send } from "lucide-react";
import { useBusiness } from "@/lib/business-context";

export default function WeeklyDigestPage() {
  const { activeBusiness } = useBusiness();
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [sendDay, setSendDay] = useState("monday");
  const [sendTime, setSendTime] = useState("09:00");

  // Preview data for the digest
  const previewData = {
    period: "14 – 20 June 2025",
    topWins: [
      "Your 'Brand Search' campaign hit a new record: 47 conversions this week.",
      "Cost per acquisition dropped 12% across all campaigns — nice work.",
      "'Emergency Plumber' ad variant B is winning the A/B test with 96% confidence.",
    ],
    concerns: [
      "'Competitor Keywords' campaign overspent by £80 — daily limit needs adjusting.",
      "Mobile CTR dropped to 1.6% on 'Shopping Ads'. Consider a mobile-specific headline.",
    ],
    metrics: {
      spend: 412,
      conversions: 68,
      cpa: 6.06,
      ctr: 3.8,
      impressions: 14200,
      clicks: 540,
    },
    nextWeek: "Father's Day is coming up — consider seasonal ad copy for your service bundles.",
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Mail className="w-5 h-5 text-primary" />
          </div>
          Weekly Email Digest
        </h1>
        <p className="text-muted text-sm mt-1">
          Get a weekly summary of wins, concerns, and key metrics delivered to your inbox. No need to log in.
        </p>
      </div>

      {/* Settings */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Settings className="w-4 h-4 text-muted" /> Digest settings
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-muted block mb-1">Status</label>
            <button
              onClick={() => setEmailEnabled(!emailEnabled)}
              className={`w-full px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${emailEnabled ? "bg-green-50 border-green-200 text-green-700" : "bg-gray-50 border-border text-muted"}`}
            >
              {emailEnabled ? "Active — sending weekly" : "Paused"}
            </button>
          </div>
          <div>
            <label className="text-xs text-muted block mb-1">Send on</label>
            <select value={sendDay} onChange={e => setSendDay(e.target.value)} className="w-full text-sm border border-border rounded-xl px-3 py-2 bg-background">
              <option value="monday">Monday</option>
              <option value="tuesday">Tuesday</option>
              <option value="wednesday">Wednesday</option>
              <option value="thursday">Thursday</option>
              <option value="friday">Friday</option>
              <option value="saturday">Saturday</option>
              <option value="sunday">Sunday</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted block mb-1">Time</label>
            <select value={sendTime} onChange={e => setSendTime(e.target.value)} className="w-full text-sm border border-border rounded-xl px-3 py-2 bg-background">
              <option value="07:00">7:00 AM</option>
              <option value="08:00">8:00 AM</option>
              <option value="09:00">9:00 AM</option>
              <option value="10:00">10:00 AM</option>
              <option value="12:00">12:00 PM</option>
            </select>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Preview — what you&apos;ll receive</h2>
          <button className="flex items-center gap-2 px-3 py-1.5 bg-primary text-white text-xs font-medium rounded-lg hover:bg-primary/90">
            <Send className="w-3 h-3" /> Send test email
          </button>
        </div>

        {/* Email Preview */}
        <div className="bg-white border border-border rounded-xl overflow-hidden shadow-sm">
          {/* Email Header */}
          <div className="bg-primary p-6 text-white">
            <div className="text-xs opacity-80">Week of {previewData.period}</div>
            <h3 className="text-xl font-bold mt-1">Your Weekly Ad Performance</h3>
            <div className="text-sm opacity-90 mt-1">Here&apos;s how your campaigns did this week</div>
          </div>

          {/* Metrics Row */}
          <div className="grid grid-cols-3 sm:grid-cols-6 border-b border-border divide-x divide-border">
            {[
              { label: "Spend", value: `£${previewData.metrics.spend}`, icon: DollarSign },
              { label: "Conversions", value: previewData.metrics.conversions.toString(), icon: Target },
              { label: "CPA", value: `£${previewData.metrics.cpa}`, icon: TrendingDown },
              { label: "CTR", value: `${previewData.metrics.ctr}%`, icon: TrendingUp },
              { label: "Impressions", value: previewData.metrics.impressions.toLocaleString(), icon: Calendar },
              { label: "Clicks", value: previewData.metrics.clicks.toString(), icon: Clock },
            ].map((m, i) => (
              <div key={i} className="p-4 text-center">
                <div className="text-[10px] text-muted">{m.label}</div>
                <div className="text-sm font-bold mt-0.5">{m.value}</div>
              </div>
            ))}
          </div>

          {/* Wins */}
          <div className="p-5 border-b border-border">
            <h4 className="text-sm font-semibold flex items-center gap-2 mb-3 text-green-700">
              <TrendingUp className="w-4 h-4" /> Top wins this week
            </h4>
            <div className="space-y-2">
              {previewData.topWins.map((win, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                  <span>{win}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Concerns */}
          <div className="p-5 border-b border-border">
            <h4 className="text-sm font-semibold flex items-center gap-2 mb-3 text-amber-700">
              <TrendingDown className="w-4 h-4" /> Things to watch
            </h4>
            <div className="space-y-2">
              {previewData.concerns.map((c, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="w-4 h-4 text-amber-600 mt-0.5 shrink-0">⚠️</span>
                  <span>{c}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Looking Ahead */}
          <div className="p-5 bg-blue-50">
            <h4 className="text-sm font-semibold flex items-center gap-2 mb-2 text-blue-700">
              <Calendar className="w-4 h-4" /> Looking ahead
            </h4>
            <p className="text-sm">{previewData.nextWeek}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
