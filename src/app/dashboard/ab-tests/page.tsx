"use client";

import { useState } from "react";
import { FlaskConical, TrendingUp, CheckCircle, Clock, Pause, Play, Trash2, Plus, BarChart3, ArrowRight } from "lucide-react";
import { useBusiness } from "@/lib/business-context";

interface ABTest {
  id: string;
  name: string;
  campaign: string;
  status: "running" | "winner" | "paused" | "not-enough-data";
  variantA: { label: string; headline: string; clicks: number; conversions: number; ctr: number; convRate: number };
  variantB: { label: string; headline: string; clicks: number; conversions: number; ctr: number; convRate: number };
  confidence: number;
  winner: "A" | "B" | null;
  startedAt: string;
  impressions: number;
}

const DEMO_TESTS: ABTest[] = [
  {
    id: "1", name: "Emergency headline test", campaign: "Local Services", status: "winner",
    variantA: { label: "A", headline: "Emergency Plumber — Call Now", clicks: 340, conversions: 28, ctr: 4.2, convRate: 8.2 },
    variantB: { label: "B", headline: "24/7 Emergency Plumber — 1 Hour Response", clicks: 380, conversions: 41, ctr: 4.8, convRate: 10.8 },
    confidence: 96, winner: "B", startedAt: "12 days ago", impressions: 8200,
  },
  {
    id: "2", name: "Boiler price vs no price", campaign: "Brand Search", status: "running",
    variantA: { label: "A", headline: "New Boiler Installation | PipeMaster", clicks: 180, conversions: 12, ctr: 3.6, convRate: 6.7 },
    variantB: { label: "B", headline: "New Boiler From £1,799 | PipeMaster", clicks: 195, conversions: 16, ctr: 3.9, convRate: 8.2 },
    confidence: 72, winner: null, startedAt: "5 days ago", impressions: 5100,
  },
  {
    id: "3", name: "CTA button text", campaign: "Remarketing", status: "running",
    variantA: { label: "A", headline: "Book Your Free Quote Today", clicks: 95, conversions: 8, ctr: 3.1, convRate: 8.4 },
    variantB: { label: "B", headline: "Get an Instant Quote — No Obligation", clicks: 102, conversions: 7, ctr: 3.3, convRate: 6.9 },
    confidence: 41, winner: null, startedAt: "3 days ago", impressions: 3100,
  },
  {
    id: "4", name: "Trust signals test", campaign: "Local Services", status: "not-enough-data",
    variantA: { label: "A", headline: "Trusted Plumber — 500+ Reviews", clicks: 42, conversions: 3, ctr: 2.8, convRate: 7.1 },
    variantB: { label: "B", headline: "Your Local Plumber — Honest Pricing", clicks: 38, conversions: 2, ctr: 2.5, convRate: 5.3 },
    confidence: 22, winner: null, startedAt: "2 days ago", impressions: 1500,
  },
  {
    id: "5", name: "Bathroom description length", campaign: "Facebook Ads", status: "paused",
    variantA: { label: "A", headline: "Transform Your Bathroom", clicks: 120, conversions: 6, ctr: 2.4, convRate: 5.0 },
    variantB: { label: "B", headline: "Bathroom Refit — Free Design + 0% Finance", clicks: 145, conversions: 11, ctr: 2.9, convRate: 7.6 },
    confidence: 84, winner: null, startedAt: "Paused 2 days ago", impressions: 5000,
  },
];

function statusBadge(status: string, confidence: number) {
  switch (status) {
    case "winner": return <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Winner declared</span>;
    case "running": return <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Running ({confidence}% confidence)</span>;
    case "paused": return <span className="text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full font-medium">Paused</span>;
    case "not-enough-data": return <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Needs more data</span>;
    default: return null;
  }
}

export default function ABTestsPage() {
  const { activeBusiness } = useBusiness();
  const [tests, setTests] = useState(DEMO_TESTS);
  const [showCreate, setShowCreate] = useState(false);

  const running = tests.filter(t => t.status === "running").length;
  const winners = tests.filter(t => t.status === "winner").length;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <FlaskConical className="w-5 h-5 text-primary" />
          </div>
          A/B Test Tracker
        </h1>
        <p className="text-muted text-sm mt-1">
          Test different ad headlines, descriptions, and CTAs. We track statistical significance and auto-declare winners.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-xs text-muted">Active tests</div>
          <div className="text-xl font-bold mt-1">{running}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-xs text-muted">Winners found</div>
          <div className="text-xl font-bold text-green-600 mt-1">{winners}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-xs text-muted">Total tests</div>
          <div className="text-xl font-bold mt-1">{tests.length}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-xs text-muted">Avg confidence</div>
          <div className="text-xl font-bold mt-1">{Math.round(tests.reduce((s, t) => s + t.confidence, 0) / tests.length)}%</div>
        </div>
      </div>

      {/* Create Test */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" /> New Test
        </button>
      </div>

      {showCreate && (
        <div className="bg-card border-2 border-primary/20 rounded-xl p-5 space-y-4">
          <h3 className="font-semibold">Create A/B test</h3>
          <div>
            <label className="text-xs text-muted block mb-1">Test name</label>
            <input type="text" placeholder="e.g. CTA wording test" className="w-full text-sm border border-border rounded-xl px-3 py-2 bg-background" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted block mb-1">Variant A (control)</label>
              <input type="text" placeholder="Current headline..." className="w-full text-sm border border-border rounded-xl px-3 py-2 bg-background" />
            </div>
            <div>
              <label className="text-xs text-muted block mb-1">Variant B (challenger)</label>
              <input type="text" placeholder="New headline to test..." className="w-full text-sm border border-border rounded-xl px-3 py-2 bg-background" />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted block mb-1">Campaign</label>
            <select className="w-full text-sm border border-border rounded-xl px-3 py-2 bg-background">
              <option>Local Services</option>
              <option>Brand Search</option>
              <option>Competitor Keywords</option>
              <option>Remarketing</option>
              <option>Shopping Ads</option>
            </select>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90">Start Test</button>
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-muted hover:text-foreground">Cancel</button>
          </div>
        </div>
      )}

      {/* Test Cards */}
      <div className="space-y-4">
        {tests.map(test => (
          <div key={test.id} className={`bg-card border rounded-xl p-5 ${test.status === "winner" ? "border-green-200" : "border-border"}`}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{test.name}</span>
                  {statusBadge(test.status, test.confidence)}
                </div>
                <div className="text-xs text-muted mt-0.5">{test.campaign} · Started {test.startedAt} · {test.impressions.toLocaleString()} impressions</div>
              </div>
              <div className="flex items-center gap-1">
                {test.status === "running" && (
                  <button className="p-1.5 text-muted hover:text-foreground rounded-lg hover:bg-muted/10">
                    <Pause className="w-4 h-4" />
                  </button>
                )}
                {test.status === "paused" && (
                  <button className="p-1.5 text-muted hover:text-foreground rounded-lg hover:bg-muted/10">
                    <Play className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Variant Comparison */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[test.variantA, test.variantB].map((v, idx) => {
                const isWinner = test.winner === v.label;
                return (
                  <div key={idx} className={`rounded-xl p-4 border ${isWinner ? "bg-green-50 border-green-200" : "bg-muted/5 border-border"}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-bold ${isWinner ? "text-green-700" : "text-muted"}`}>
                        Variant {v.label} {isWinner && "— Winner"}
                      </span>
                      {isWinner && <CheckCircle className="w-4 h-4 text-green-600" />}
                    </div>
                    <div className="text-sm font-medium mb-3">&ldquo;{v.headline}&rdquo;</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted">Clicks</span>
                        <div className="font-semibold">{v.clicks}</div>
                      </div>
                      <div>
                        <span className="text-muted">Conversions</span>
                        <div className="font-semibold">{v.conversions}</div>
                      </div>
                      <div>
                        <span className="text-muted">CTR</span>
                        <div className="font-semibold">{v.ctr}%</div>
                      </div>
                      <div>
                        <span className="text-muted">Conv. rate</span>
                        <div className="font-semibold">{v.convRate}%</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Confidence Bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-muted mb-1">
                <span>Statistical confidence</span>
                <span className={test.confidence >= 95 ? "text-green-600 font-semibold" : ""}>{test.confidence}%</span>
              </div>
              <div className="h-2 bg-muted/20 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${test.confidence >= 95 ? "bg-green-500" : test.confidence >= 80 ? "bg-blue-500" : "bg-gray-400"}`}
                  style={{ width: `${test.confidence}%` }}
                />
              </div>
              {test.confidence < 95 && test.status === "running" && (
                <div className="text-[10px] text-muted mt-1">Needs 95% confidence to declare a winner. Keep running.</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
