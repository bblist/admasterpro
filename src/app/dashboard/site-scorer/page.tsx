"use client";

import { useState } from "react";
import { Globe, Search, Gauge, Smartphone, Monitor, Zap, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, ExternalLink, RefreshCw } from "lucide-react";
import { useBusiness } from "@/lib/business-context";
import SetupChecklist from "@/components/SetupChecklist";

interface PageScore {
  id: string;
  url: string;
  title: string;
  type: "landing" | "product" | "homepage" | "category" | "blog" | "checkout";
  overallScore: number;
  mobileScore: number;
  desktopScore: number;
  loadTime: number;
  issues: { severity: "critical" | "warning" | "info"; message: string }[];
  adRelevance: number;
  ctaScore: number;
  lastScanned: string;
}

const DEMO_PAGES: PageScore[] = [
  {
    id: "1", url: "/", title: "Homepage", type: "homepage", overallScore: 78, mobileScore: 72, desktopScore: 84,
    loadTime: 2.1, adRelevance: 65, ctaScore: 70, lastScanned: "2 hours ago",
    issues: [
      { severity: "warning", message: "Hero image is 1.2MB — compress it to speed up load time" },
      { severity: "info", message: "Consider adding a phone number above the fold for mobile visitors" },
    ],
  },
  {
    id: "2", url: "/services/emergency-plumbing", title: "Emergency Plumbing", type: "landing", overallScore: 91, mobileScore: 89, desktopScore: 93,
    loadTime: 1.3, adRelevance: 95, ctaScore: 92, lastScanned: "2 hours ago",
    issues: [
      { severity: "info", message: "Great ad-to-page match. Your ad copy closely mirrors this page's content." },
    ],
  },
  {
    id: "3", url: "/products/boiler-installation", title: "Boiler Installation", type: "product", overallScore: 64, mobileScore: 55, desktopScore: 73,
    loadTime: 3.8, adRelevance: 58, ctaScore: 45, lastScanned: "2 hours ago",
    issues: [
      { severity: "critical", message: "Page loads in 3.8s on mobile — 53% of visitors leave after 3s" },
      { severity: "critical", message: "No clear call-to-action button visible without scrolling" },
      { severity: "warning", message: "Product price not immediately visible — visitors need to know the cost upfront" },
      { severity: "warning", message: "Missing trust signals (reviews, certifications) near the CTA" },
    ],
  },
  {
    id: "4", url: "/products/bathroom-refit", title: "Bathroom Refit", type: "product", overallScore: 71, mobileScore: 65, desktopScore: 77,
    loadTime: 2.6, adRelevance: 72, ctaScore: 60, lastScanned: "2 hours ago",
    issues: [
      { severity: "warning", message: "Gallery images not lazy-loaded — slowing initial paint by 800ms" },
      { severity: "warning", message: "CTA button blends with background — make it stand out more" },
      { severity: "info", message: "Good use of before/after photos. Visitors engage well with these." },
    ],
  },
  {
    id: "5", url: "/services", title: "All Services", type: "category", overallScore: 75, mobileScore: 71, desktopScore: 79,
    loadTime: 2.0, adRelevance: 50, ctaScore: 65, lastScanned: "2 hours ago",
    issues: [
      { severity: "warning", message: "Category page has no unique meta description — write one for better ad quality score" },
      { severity: "info", message: "Service cards link well to individual pages. Good structure." },
    ],
  },
  {
    id: "6", url: "/blog/winter-plumbing-tips", title: "Winter Plumbing Tips", type: "blog", overallScore: 82, mobileScore: 80, desktopScore: 84,
    loadTime: 1.7, adRelevance: 30, ctaScore: 55, lastScanned: "2 hours ago",
    issues: [
      { severity: "info", message: "Blog content is well-structured but lacks a service-related CTA" },
    ],
  },
  {
    id: "7", url: "/checkout", title: "Booking Checkout", type: "checkout", overallScore: 68, mobileScore: 60, desktopScore: 76,
    loadTime: 3.2, adRelevance: 80, ctaScore: 72, lastScanned: "2 hours ago",
    issues: [
      { severity: "critical", message: "Checkout form requires 11 fields — reduce to essential fields only" },
      { severity: "warning", message: "No trust badges near payment section" },
      { severity: "warning", message: "Page loads slowly on 3G connections — optimise scripts" },
    ],
  },
];

function scoreColor(score: number): string {
  if (score >= 85) return "text-green-600";
  if (score >= 65) return "text-amber-600";
  return "text-red-600";
}
function scoreBg(score: number): string {
  if (score >= 85) return "bg-green-100 border-green-200";
  if (score >= 65) return "bg-amber-100 border-amber-200";
  return "bg-red-100 border-red-200";
}
function typeLabel(type: string): string {
  const map: Record<string, string> = { landing: "Landing Page", product: "Product Page", homepage: "Homepage", category: "Category", blog: "Blog Post", checkout: "Checkout" };
  return map[type] || type;
}
function typeBadgeColor(type: string): string {
  const map: Record<string, string> = { landing: "bg-blue-100 text-blue-700", product: "bg-purple-100 text-purple-700", homepage: "bg-gray-100 text-gray-700", category: "bg-teal-100 text-teal-700", blog: "bg-orange-100 text-orange-700", checkout: "bg-pink-100 text-pink-700" };
  return map[type] || "bg-gray-100 text-gray-700";
}

export default function SiteScorerPage() {
  const { activeBusiness } = useBusiness();
  const [pages, setPages] = useState(DEMO_PAGES);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [scanUrl, setScanUrl] = useState("");

  const avgScore = Math.round(pages.reduce((s, p) => s + p.overallScore, 0) / pages.length);
  const criticalCount = pages.reduce((s, p) => s + p.issues.filter(i => i.severity === "critical").length, 0);
  const types = [...new Set(pages.map(p => p.type))];

  const filtered = pages.filter(p => filterType === "all" || p.type === filterType);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Globe className="w-5 h-5 text-primary" />
          </div>
          Site Scorer
        </h1>
        <p className="text-muted text-sm mt-1">
          Score every page on your site — not just landing pages. Product pages, homepage, checkout, blog — anything your ads point to.
        </p>
      </div>

      <SetupChecklist
          prereqs={["business_info"]}
          pageContext="Add your business info including your website URL so the Site Scorer can analyze your landing pages"
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-xs text-muted">Average score</div>
          <div className={`text-2xl font-bold mt-1 ${scoreColor(avgScore)}`}>{avgScore}/100</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-xs text-muted">Pages scanned</div>
          <div className="text-2xl font-bold mt-1">{pages.length}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-xs text-muted">Critical issues</div>
          <div className={`text-2xl font-bold mt-1 ${criticalCount > 0 ? "text-red-600" : "text-green-600"}`}>{criticalCount}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-xs text-muted">Page types</div>
          <div className="text-2xl font-bold mt-1">{types.length}</div>
        </div>
      </div>

      {/* Scan New Page */}
      <div className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <Search className="w-5 h-5 text-muted hidden sm:block" />
        <input
          type="url"
          placeholder="Paste a URL to scan (e.g. https://yoursite.com/product/widget)"
          value={scanUrl}
          onChange={e => setScanUrl(e.target.value)}
          className="flex-1 w-full text-sm border border-border rounded-xl px-3 py-2 bg-background"
        />
        <button className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90 whitespace-nowrap flex items-center gap-2">
          <RefreshCw className="w-4 h-4" /> Scan Page
        </button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setFilterType("all")}
          className={`text-xs px-3 py-1.5 rounded-full border ${filterType === "all" ? "bg-primary text-white border-primary" : "border-border hover:bg-muted/10"}`}
        >
          All pages
        </button>
        {types.map(t => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`text-xs px-3 py-1.5 rounded-full border ${filterType === t ? "bg-primary text-white border-primary" : "border-border hover:bg-muted/10"}`}
          >
            {typeLabel(t)}
          </button>
        ))}
      </div>

      {/* Page List */}
      <div className="space-y-3">
        {filtered.sort((a, b) => a.overallScore - b.overallScore).map(page => (
          <div key={page.id} className="bg-card border border-border rounded-xl overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === page.id ? null : page.id)}
              className="w-full p-4 flex items-center justify-between hover:bg-muted/5 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg border ${scoreBg(page.overallScore)}`}>
                  {page.overallScore}
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{page.title}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${typeBadgeColor(page.type)}`}>{typeLabel(page.type)}</span>
                  </div>
                  <div className="text-xs text-muted mt-0.5">{page.url}</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-3 text-xs text-muted">
                  <span className="flex items-center gap-1"><Smartphone className="w-3 h-3" />{page.mobileScore}</span>
                  <span className="flex items-center gap-1"><Monitor className="w-3 h-3" />{page.desktopScore}</span>
                  <span>{page.loadTime}s</span>
                </div>
                {expanded === page.id ? <ChevronUp className="w-4 h-4 text-muted" /> : <ChevronDown className="w-4 h-4 text-muted" />}
              </div>
            </button>

            {expanded === page.id && (
              <div className="border-t border-border p-4 space-y-4">
                {/* Score breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-muted/5 rounded-lg p-3">
                    <div className="text-xs text-muted">Mobile</div>
                    <div className={`text-lg font-bold ${scoreColor(page.mobileScore)}`}>{page.mobileScore}</div>
                  </div>
                  <div className="bg-muted/5 rounded-lg p-3">
                    <div className="text-xs text-muted">Desktop</div>
                    <div className={`text-lg font-bold ${scoreColor(page.desktopScore)}`}>{page.desktopScore}</div>
                  </div>
                  <div className="bg-muted/5 rounded-lg p-3">
                    <div className="text-xs text-muted">Ad relevance</div>
                    <div className={`text-lg font-bold ${scoreColor(page.adRelevance)}`}>{page.adRelevance}%</div>
                  </div>
                  <div className="bg-muted/5 rounded-lg p-3">
                    <div className="text-xs text-muted">CTA clarity</div>
                    <div className={`text-lg font-bold ${scoreColor(page.ctaScore)}`}>{page.ctaScore}%</div>
                  </div>
                </div>

                {/* Issues */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">Issues & suggestions</h3>
                  {page.issues.map((issue, i) => (
                    <div key={i} className={`flex items-start gap-3 p-3 rounded-lg text-sm ${
                      issue.severity === "critical" ? "bg-red-50 border border-red-100" :
                      issue.severity === "warning" ? "bg-amber-50 border border-amber-100" :
                      "bg-blue-50 border border-blue-100"
                    }`}>
                      {issue.severity === "critical" ? <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" /> :
                       issue.severity === "warning" ? <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" /> :
                       <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />}
                      <span>{issue.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
