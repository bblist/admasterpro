"use client";

import { useState, useEffect, useCallback } from "react";
import { DollarSign, AlertTriangle, TrendingDown, Ban, CheckCircle, RefreshCw, Search, Loader2, ArrowRight, Zap } from "lucide-react";
import { authFetch } from "@/lib/auth-client";
import { useBusiness } from "@/lib/business-context";
import SetupChecklist from "@/components/SetupChecklist";

interface WastedTerm {
  id: string;
  searchTerm: string;
  clicks: number;
  cost: number;
  conversions: number;
  cpc: number;
  campaign: string;
  reason: string;
  blocked: boolean;
}

const DEMO_TERMS: WastedTerm[] = [
  { id: "1", searchTerm: "free plumber near me", clicks: 34, cost: 47.20, conversions: 0, cpc: 1.39, campaign: "Local Services", reason: "Contains 'free' — these searchers rarely convert to paid services", blocked: false },
  { id: "2", searchTerm: "plumber salary uk", clicks: 18, cost: 22.50, conversions: 0, cpc: 1.25, campaign: "Local Services", reason: "Job seeker, not a customer looking for plumbing services", blocked: false },
  { id: "3", searchTerm: "how to fix leaking tap yourself", clicks: 27, cost: 35.10, conversions: 0, cpc: 1.30, campaign: "Emergency Repairs", reason: "DIY intent — this person wants to fix it themselves, not hire someone", blocked: false },
  { id: "4", searchTerm: "plumber apprenticeship", clicks: 12, cost: 15.60, conversions: 0, cpc: 1.30, campaign: "Local Services", reason: "Career-related search, not a potential customer", blocked: false },
  { id: "5", searchTerm: "cheap plumber complaints", clicks: 8, cost: 11.20, conversions: 0, cpc: 1.40, campaign: "Budget Plumbing", reason: "Negative sentiment — 'complaints' signals they're researching problems, not hiring", blocked: false },
  { id: "6", searchTerm: "emergency plumber insurance claim", clicks: 15, cost: 28.50, conversions: 0, cpc: 1.90, campaign: "Emergency Repairs", reason: "Insurance-focused query — may not lead to a direct booking", blocked: false },
  { id: "7", searchTerm: "plumbing supplies wholesale", clicks: 22, cost: 30.80, conversions: 0, cpc: 1.40, campaign: "Local Services", reason: "B2B supply search, not a residential customer", blocked: false },
];

export default function WastedSpendPage() {
  const { activeBusiness } = useBusiness();
  const [terms, setTerms] = useState<WastedTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setTerms(DEMO_TERMS);
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const totalWasted = terms.filter(t => !t.blocked).reduce((sum, t) => sum + t.cost, 0);
  const totalClicks = terms.filter(t => !t.blocked).reduce((sum, t) => sum + t.clicks, 0);
  const blockedCount = terms.filter(t => t.blocked).length;

  const handleBlock = (id: string) => {
    setTerms(prev => prev.map(t => t.id === id ? { ...t, blocked: true } : t));
  };

  const handleBlockAll = () => {
    setTerms(prev => prev.map(t => ({ ...t, blocked: true })));
  };

  const filtered = terms.filter(t =>
    t.searchTerm.toLowerCase().includes(filter.toLowerCase()) ||
    t.campaign.toLowerCase().includes(filter.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <DollarSign className="w-12 h-12 text-red-400 animate-pulse mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">Scanning your search terms...</h2>
          <p className="text-sm text-muted">Looking for clicks that aren&apos;t converting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
            <TrendingDown className="w-5 h-5 text-red-600" />
          </div>
          Wasted Spend Detector
        </h1>
        <p className="text-muted text-sm mt-1">
          Search terms that are costing you money without converting. Block them to stop the bleeding.
        </p>
      </div>

      <SetupChecklist
          prereqs={["google_ads"]}
          pageContext="Connect your Google Ads account so the Wasted Spend Detector can find search terms costing you money without converting"
          mode="blocking"
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="text-xs text-red-600 font-medium">Money wasted this week</div>
          <div className="text-2xl font-bold text-red-700 mt-1">£{totalWasted.toFixed(2)}</div>
          <div className="text-xs text-red-500 mt-1">on {totalClicks} clicks with zero conversions</div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="text-xs text-amber-600 font-medium">Problem search terms</div>
          <div className="text-2xl font-bold text-amber-700 mt-1">{terms.filter(t => !t.blocked).length}</div>
          <div className="text-xs text-amber-500 mt-1">found across your campaigns</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="text-xs text-green-600 font-medium">Already blocked</div>
          <div className="text-2xl font-bold text-green-700 mt-1">{blockedCount}</div>
          <div className="text-xs text-green-500 mt-1">negative keywords added</div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input type="text" value={filter} onChange={e => setFilter(e.target.value)} placeholder="Filter search terms..."
            className="w-full bg-card border border-border rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:border-primary transition" />
        </div>
        <button onClick={handleBlockAll} disabled={terms.every(t => t.blocked)}
          className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition disabled:opacity-40 flex items-center gap-2">
          <Ban className="w-4 h-4" /> Block all as negatives
        </button>
      </div>

      {/* Terms List */}
      <div className="space-y-3">
        {filtered.map(term => (
          <div key={term.id} className={`bg-card border rounded-xl p-4 transition ${term.blocked ? "border-green-200 bg-green-50/30 opacity-60" : "border-border hover:border-red-200"}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold">&ldquo;{term.searchTerm}&rdquo;</span>
                  <span className="text-[10px] bg-muted/20 px-2 py-0.5 rounded-full text-muted">{term.campaign}</span>
                </div>
                <p className="text-xs text-muted mb-2">{term.reason}</p>
                <div className="flex gap-4 text-xs">
                  <span><strong>{term.clicks}</strong> clicks</span>
                  <span className="text-red-600"><strong>£{term.cost.toFixed(2)}</strong> spent</span>
                  <span><strong>£{term.cpc.toFixed(2)}</strong> avg CPC</span>
                  <span className="text-red-600"><strong>0</strong> conversions</span>
                </div>
              </div>
              <div>
                {term.blocked ? (
                  <div className="flex items-center gap-1 text-green-600 text-xs font-medium">
                    <CheckCircle className="w-4 h-4" /> Blocked
                  </div>
                ) : (
                  <button onClick={() => handleBlock(term.id)}
                    className="bg-red-100 text-red-700 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-200 transition flex items-center gap-1">
                    <Ban className="w-3 h-3" /> Block
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
