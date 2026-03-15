"use client";

import { useState } from "react";
import { Eye, Search, ExternalLink, Calendar, RefreshCw, Filter, Globe, Facebook, ShoppingCart } from "lucide-react";
import { useBusiness } from "@/lib/business-context";

interface CompetitorAd {
  id: string;
  competitor: string;
  platform: "google" | "facebook" | "shopping";
  headline: string;
  description: string;
  displayUrl: string;
  firstSeen: string;
  lastSeen: string;
  keywords: string[];
  position: number;
  adType: string;
}

const DEMO_ADS: CompetitorAd[] = [
  {
    id: "1", competitor: "QuickFix Plumbing", platform: "google",
    headline: "Emergency Plumber — 1 Hour Response Time",
    description: "24/7 emergency plumbing. No call-out fee. Trusted by 5,000+ homes. Book online in 60 seconds.",
    displayUrl: "quickfixplumbing.co.uk/emergency",
    firstSeen: "12 days ago", lastSeen: "Today",
    keywords: ["emergency plumber", "plumber near me", "24 hour plumber"],
    position: 1, adType: "Search Ad",
  },
  {
    id: "2", competitor: "PipeWorks London", platform: "google",
    headline: "Boiler Installation From £1,799 | PipeWorks",
    description: "Worcester Bosch accredited. 10 year warranty. Finance available. Free home survey.",
    displayUrl: "pipeworks.london/boilers",
    firstSeen: "8 days ago", lastSeen: "Today",
    keywords: ["boiler installation", "new boiler", "boiler replacement"],
    position: 2, adType: "Search Ad",
  },
  {
    id: "3", competitor: "DrainPro Services", platform: "google",
    headline: "Blocked Drain? Fixed in Under 2 Hours",
    description: "CCTV drain surveys. High-pressure jetting. No fix, no fee guarantee. Call now.",
    displayUrl: "drainpro.co.uk",
    firstSeen: "20 days ago", lastSeen: "Yesterday",
    keywords: ["blocked drain", "drain unblocking", "drain services"],
    position: 3, adType: "Search Ad",
  },
  {
    id: "4", competitor: "QuickFix Plumbing", platform: "facebook",
    headline: "Is Your Boiler Making Strange Noises?",
    description: "Don't wait for it to break down. Book a winter service check for just £49. Over 500 five-star Google reviews.",
    displayUrl: "quickfixplumbing.co.uk",
    firstSeen: "5 days ago", lastSeen: "Today",
    keywords: ["boiler service", "heating"],
    position: 0, adType: "Image Ad",
  },
  {
    id: "5", competitor: "HomeFix Direct", platform: "facebook",
    headline: "Bathroom Refit? See Before & After Photos",
    description: "Transform your bathroom from £3,999. 0% finance. Free design consultation. View our gallery.",
    displayUrl: "homefixdirect.com/bathrooms",
    firstSeen: "15 days ago", lastSeen: "3 days ago",
    keywords: ["bathroom refit", "bathroom renovation"],
    position: 0, adType: "Carousel Ad",
  },
  {
    id: "6", competitor: "PipeWorks London", platform: "shopping",
    headline: "Worcester Bosch Greenstar 8000 — Installation Package",
    description: "Full installation including removal of old boiler. A-rated efficiency. 10 year parts and labour warranty.",
    displayUrl: "pipeworks.london/shop",
    firstSeen: "30 days ago", lastSeen: "Today",
    keywords: ["boiler installation package"],
    position: 1, adType: "Shopping Ad",
  },
];

function platformIcon(platform: string) {
  switch (platform) {
    case "google": return <Globe className="w-4 h-4 text-blue-600" />;
    case "facebook": return <Facebook className="w-4 h-4 text-blue-700" />;
    case "shopping": return <ShoppingCart className="w-4 h-4 text-green-600" />;
    default: return <Globe className="w-4 h-4" />;
  }
}

function platformLabel(platform: string): string {
  switch (platform) {
    case "google": return "Google Search";
    case "facebook": return "Facebook/Instagram";
    case "shopping": return "Google Shopping";
    default: return platform;
  }
}

export default function CompetitorAdsPage() {
  const { activeBusiness } = useBusiness();
  const [ads] = useState(DEMO_ADS);
  const [filterPlatform, setFilterPlatform] = useState<string>("all");
  const [filterCompetitor, setFilterCompetitor] = useState<string>("all");
  const [search, setSearch] = useState("");

  const competitors = [...new Set(ads.map(a => a.competitor))];
  const platforms = [...new Set(ads.map(a => a.platform))];

  const filtered = ads.filter(a => {
    const matchPlatform = filterPlatform === "all" || a.platform === filterPlatform;
    const matchCompetitor = filterCompetitor === "all" || a.competitor === filterCompetitor;
    const matchSearch = !search || a.headline.toLowerCase().includes(search.toLowerCase()) || a.keywords.some(k => k.toLowerCase().includes(search.toLowerCase()));
    return matchPlatform && matchCompetitor && matchSearch;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Eye className="w-5 h-5 text-primary" />
          </div>
          Competitor Ads
        </h1>
        <p className="text-muted text-sm mt-1">
          See what your competitors are running on Google and Facebook. Learn from their ads and find gaps to exploit.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-xs text-muted">Competitors tracked</div>
          <div className="text-xl font-bold mt-1">{competitors.length}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-xs text-muted">Active ads found</div>
          <div className="text-xl font-bold mt-1">{ads.length}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-xs text-muted">Platforms monitored</div>
          <div className="text-xl font-bold mt-1">{platforms.length}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-xs text-muted">Last scan</div>
          <div className="text-xl font-bold mt-1 text-green-600">Today</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input type="text" placeholder="Search headlines or keywords..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-xl bg-background" />
        </div>
        <select value={filterPlatform} onChange={e => setFilterPlatform(e.target.value)} className="text-sm border border-border rounded-xl px-3 py-2 bg-background">
          <option value="all">All platforms</option>
          {platforms.map(p => <option key={p} value={p}>{platformLabel(p)}</option>)}
        </select>
        <select value={filterCompetitor} onChange={e => setFilterCompetitor(e.target.value)} className="text-sm border border-border rounded-xl px-3 py-2 bg-background">
          <option value="all">All competitors</option>
          {competitors.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Ad Cards */}
      <div className="space-y-4">
        {filtered.map(ad => (
          <div key={ad.id} className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-muted/10 rounded-lg flex items-center justify-center">
                  {platformIcon(ad.platform)}
                </div>
                <div>
                  <span className="text-xs text-muted">{ad.competitor}</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] bg-muted/10 px-2 py-0.5 rounded-full">{platformLabel(ad.platform)}</span>
                    <span className="text-[10px] bg-muted/10 px-2 py-0.5 rounded-full">{ad.adType}</span>
                    {ad.position > 0 && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Position #{ad.position}</span>}
                  </div>
                </div>
              </div>
              <div className="text-[10px] text-muted text-right">
                <div>First seen: {ad.firstSeen}</div>
                <div>Last seen: {ad.lastSeen}</div>
              </div>
            </div>

            {/* Ad Preview */}
            <div className="bg-muted/5 rounded-xl p-4 border border-dashed border-border">
              <div className="text-primary text-base font-semibold">{ad.headline}</div>
              <div className="text-xs text-green-700 mt-0.5">{ad.displayUrl}</div>
              <div className="text-sm text-foreground mt-1">{ad.description}</div>
            </div>

            {/* Keywords targeted */}
            <div className="flex items-center gap-2 flex-wrap mt-3">
              <span className="text-xs text-muted">Keywords:</span>
              {ad.keywords.map((kw, i) => (
                <span key={i} className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{kw}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
