"use client";

import { useState } from "react";
import { Search, Ban, Shield, Download, CheckCircle, Plus, ChevronDown, ChevronUp, Filter } from "lucide-react";
import { useBusiness } from "@/lib/business-context";

interface NegativeKeyword {
  id: string;
  keyword: string;
  matchType: "exact" | "phrase" | "broad";
  clicks: number;
  cost: number;
  impressions: number;
  campaigns: string[];
  reason: string;
  theme: string;
  added: boolean;
}

const DEMO_KEYWORDS: NegativeKeyword[] = [
  { id: "1", keyword: "free plumber near me", matchType: "phrase", clicks: 87, cost: 134, impressions: 2300, campaigns: ["Local Services"], reason: "People searching for free services almost never convert to paid.", theme: "Free seekers" , added: false },
  { id: "2", keyword: "plumbing course", matchType: "phrase", clicks: 45, cost: 78, impressions: 1200, campaigns: ["Brand Search"], reason: "These are students, not customers looking for a plumber.", theme: "Education" , added: false },
  { id: "3", keyword: "plumber salary", matchType: "exact", clicks: 62, cost: 96, impressions: 1800, campaigns: ["Brand Search", "Local Services"], reason: "Job seekers researching salaries — they want to become a plumber, not hire one.", theme: "Job seekers" , added: false },
  { id: "4", keyword: "diy plumbing repair", matchType: "phrase", clicks: 38, cost: 62, impressions: 950, campaigns: ["Local Services"], reason: "DIY enthusiasts fixing things themselves. They won't call you.", theme: "DIY" , added: false },
  { id: "5", keyword: "plumbing apprenticeship", matchType: "phrase", clicks: 29, cost: 44, impressions: 780, campaigns: ["Brand Search"], reason: "People looking for training, not your services.", theme: "Education" , added: false },
  { id: "6", keyword: "cheap plumber", matchType: "broad", clicks: 156, cost: 245, impressions: 4200, campaigns: ["Local Services", "Competitor Keywords"], reason: "\"Cheap\" searchers are price-shopping and rarely commit. Low quality leads.", theme: "Bargain hunters" , added: false },
  { id: "7", keyword: "plumber jobs hiring", matchType: "phrase", clicks: 34, cost: 52, impressions: 890, campaigns: ["Brand Search"], reason: "Job hunters looking for employment, not your plumbing services.", theme: "Job seekers" , added: false },
  { id: "8", keyword: "plumbing tools wholesale", matchType: "phrase", clicks: 21, cost: 38, impressions: 560, campaigns: ["Shopping Ads"], reason: "Trade suppliers looking for wholesale — wrong audience entirely.", theme: "Trade/wholesale" , added: false },
  { id: "9", keyword: "emergency plumber complaint", matchType: "phrase", clicks: 18, cost: 32, impressions: 420, campaigns: ["Local Services"], reason: "People looking to complain about a plumber, not hire one.", theme: "Complaints" , added: false },
  { id: "10", keyword: "plumber review site", matchType: "phrase", clicks: 27, cost: 41, impressions: 680, campaigns: ["Brand Search"], reason: "Looking for review platforms, not directly for your service.", theme: "Research" , added: false },
];

export default function NegativeKeywordsPage() {
  const { activeBusiness } = useBusiness();
  const [keywords, setKeywords] = useState(DEMO_KEYWORDS);
  const [search, setSearch] = useState("");
  const [expandedTheme, setExpandedTheme] = useState<string | null>(null);
  const [filterTheme, setFilterTheme] = useState<string | null>(null);

  const themes = [...new Set(keywords.map(k => k.theme))];
  const totalSavings = keywords.filter(k => !k.added).reduce((s, k) => s + k.cost, 0);
  const addedCount = keywords.filter(k => k.added).length;

  const filtered = keywords.filter(k => {
    const matchSearch = !search || k.keyword.toLowerCase().includes(search.toLowerCase());
    const matchTheme = !filterTheme || k.theme === filterTheme;
    return matchSearch && matchTheme;
  });

  const groupedByTheme: Record<string, NegativeKeyword[]> = {};
  filtered.forEach(k => {
    if (!groupedByTheme[k.theme]) groupedByTheme[k.theme] = [];
    groupedByTheme[k.theme].push(k);
  });

  const addKeyword = (id: string) => setKeywords(prev => prev.map(k => k.id === id ? { ...k, added: true } : k));
  const addTheme = (theme: string) => setKeywords(prev => prev.map(k => k.theme === theme ? { ...k, added: true } : k));
  const addAll = () => setKeywords(prev => prev.map(k => ({ ...k, added: true })));

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          Negative Keyword Miner
        </h1>
        <p className="text-muted text-sm mt-1">
          We scan your search terms daily to find keywords wasting your budget. Add them as negatives in one click.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-xs text-muted">Found this week</div>
          <div className="text-xl font-bold mt-1">{keywords.length}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-xs text-muted">Potential savings</div>
          <div className="text-xl font-bold text-red-600 mt-1">£{totalSavings}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-xs text-muted">Themes detected</div>
          <div className="text-xl font-bold mt-1">{themes.length}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-xs text-muted">Already blocked</div>
          <div className="text-xl font-bold text-green-600 mt-1">{addedCount}</div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Search keywords..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-xl bg-background"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filterTheme || ""}
            onChange={e => setFilterTheme(e.target.value || null)}
            className="text-sm border border-border rounded-xl px-3 py-2 bg-background"
          >
            <option value="">All themes</option>
            {themes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <button
            onClick={addAll}
            disabled={addedCount === keywords.length}
            className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 disabled:opacity-50 whitespace-nowrap"
          >
            Block All ({keywords.length - addedCount})
          </button>
        </div>
      </div>

      {/* Grouped Keywords */}
      <div className="space-y-4">
        {Object.entries(groupedByTheme).map(([theme, kws]) => {
          const allAdded = kws.every(k => k.added);
          const themeCost = kws.reduce((s, k) => s + k.cost, 0);
          return (
            <div key={theme} className="bg-card border border-border rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedTheme(expandedTheme === theme ? null : theme)}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${allAdded ? "bg-green-100" : "bg-red-100"}`}>
                    {allAdded ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Ban className="w-4 h-4 text-red-600" />}
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-semibold">{theme}</div>
                    <div className="text-xs text-muted">{kws.length} keywords · £{themeCost} wasted</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!allAdded && (
                    <button
                      onClick={e => { e.stopPropagation(); addTheme(theme); }}
                      className="text-xs px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Block group
                    </button>
                  )}
                  {expandedTheme === theme ? <ChevronUp className="w-4 h-4 text-muted" /> : <ChevronDown className="w-4 h-4 text-muted" />}
                </div>
              </button>
              {expandedTheme === theme && (
                <div className="border-t border-border divide-y divide-border">
                  {kws.map(k => (
                    <div key={k.id} className={`p-4 flex items-start justify-between gap-4 ${k.added ? "opacity-50" : ""}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium">{k.keyword}</span>
                          <span className="text-[10px] bg-muted/10 px-2 py-0.5 rounded-full text-muted">{k.matchType}</span>
                        </div>
                        <p className="text-xs text-muted mt-1">{k.reason}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted">
                          <span>{k.clicks} clicks</span>
                          <span>£{k.cost} wasted</span>
                          <span>{k.impressions.toLocaleString()} impressions</span>
                          <span>{k.campaigns.join(", ")}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => addKeyword(k.id)}
                        disabled={k.added}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium whitespace-nowrap ${k.added ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700 hover:bg-red-200"}`}
                      >
                        {k.added ? <><CheckCircle className="w-3 h-3" /> Blocked</> : <><Ban className="w-3 h-3" /> Block</>}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
