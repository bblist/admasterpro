"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Activity, TrendingUp, TrendingDown, DollarSign, Target, Eye,
    MousePointer, AlertTriangle, CheckCircle2, XCircle, Loader2,
    RefreshCw, Zap, ArrowRight, BarChart3, Search, Shield,
    ChevronDown, ChevronUp, Download, Star, ExternalLink
} from "lucide-react";
import { authFetch } from "@/lib/auth-client";
import { useBusiness } from "@/lib/business-context";
import SetupChecklist from "@/components/SetupChecklist";

interface QualityScoreData {
    avgScore: number;
    distribution: { excellent: number; good: number; average: number; poor: number; unrated: number };
    lowScoreKeywords: { keyword: string; qScore: number; cost: number; clicks: number }[];
}

interface BenchmarkData {
    benchmark: { avgCtr: number; avgCpc: number; avgCpa: number; avgConvRate: number };
    actual: { ctr: number; cpc: number; cpa: number; convRate: number };
    verdict: { ctr: string; cpc: string; cpa: string };
}

interface WastedSpendData {
    lowQualityKeywords: number;
    zeroConversionKeywords: { keyword: string; cost: number; clicks: number; ctr: number }[];
    irrelevantSearchTerms: { term: string; cost: number; clicks: number }[];
    totalWasted: number;
}

interface NegKeywordSuggestion {
    term: string;
    cost: number;
    clicks: number;
    reason: string;
}

interface AnalysisData {
    summary: { impressions: number; clicks: number; cost: number; conversions: number; ctr: number; avgCpc: number; costPerConversion: number };
    campaigns: { id: string; name: string; status: string; type: string; cost: number; clicks: number; conversions: number; performance: string; suggestion: string | null }[];
    qualityScore: QualityScoreData;
    benchmark: BenchmarkData;
    wastedSpend: WastedSpendData;
    negativeKeywordSuggestions: NegKeywordSuggestion[];
    extensionCoverage: { sitelinks: boolean; callouts: boolean; snippets: boolean; calls: boolean; locations: boolean };
    keywordCount: number;
    campaignCount: number;
}

interface AiAnalysis {
    overallGrade?: string;
    summary?: string;
    quickWins?: { action: string; impact: string; effort: string }[];
    strengths?: string[];
    weaknesses?: string[];
    prioritizedActions?: { priority: number; title: string; description: string; expectedImpact: string; category: string }[];
    budgetRecommendation?: string;
}

export default function AdAnalysisPage() {
    const { activeBusiness } = useBusiness();
    const [data, setData] = useState<AnalysisData | null>(null);
    const [aiAnalysis, setAiAnalysis] = useState<AiAnalysis | null>(null);
    const [loading, setLoading] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["overview", "benchmark"]));

    const toggleSection = (s: string) => {
        setExpandedSections(prev => {
            const next = new Set(prev);
            next.has(s) ? next.delete(s) : next.add(s);
            return next;
        });
    };

    const fetchAnalysis = useCallback(async () => {
        if (!activeBusiness || activeBusiness.id === "default") return;
        setLoading(true);
        setError(null);
        try {
            const res = await authFetch(`/api/ad-analysis?businessId=${activeBusiness.id}`);
            if (!res.ok) {
                const d = await res.json();
                throw new Error(d.error || "Failed to load");
            }
            setData(await res.json());
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load analysis");
        } finally {
            setLoading(false);
        }
    }, [activeBusiness]);

    const runAiAnalysis = async () => {
        if (!data) return;
        setAiLoading(true);
        try {
            const res = await authFetch("/api/ad-analysis", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    businessId: activeBusiness?.id,
                    campaignData: data.campaigns.slice(0, 10),
                    keywordData: data.qualityScore.lowScoreKeywords,
                    wastedSpend: data.wastedSpend,
                    benchmark: data.benchmark,
                }),
            });
            const result = await res.json();
            setAiAnalysis(result.analysis);
        } catch { /* ignore */ } finally {
            setAiLoading(false);
        }
    };

    useEffect(() => { fetchAnalysis(); }, [fetchAnalysis]);

    const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : n.toFixed(n < 10 ? 2 : 0);
    const fmtMoney = (n: number) => `$${n.toFixed(2)}`;

    if (loading) return (
        <div className="max-w-6xl mx-auto flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
    );

    if (error) return (
        <div className="max-w-6xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <p className="text-red-700 font-medium">{error}</p>
                <p className="text-red-500 text-sm mt-1">Connect your Google Ads account to see ad analysis</p>
            </div>
        </div>
    );

    if (!data) return null;

    const { summary, qualityScore, benchmark, wastedSpend, negativeKeywordSuggestions, extensionCoverage } = data;
    const isSectionOpen = (s: string) => expandedSections.has(s);

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Ad Account Analysis</h1>
                    <p className="text-muted text-sm mt-1">Deep dive into your Google Ads performance with AI-powered recommendations</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchAnalysis} className="text-xs border border-border rounded-lg px-3 py-2 text-muted hover:text-foreground transition flex items-center gap-1.5">
                        <RefreshCw className="w-3.5 h-3.5" /> Refresh
                    </button>
                    <button
                        onClick={runAiAnalysis}
                        disabled={aiLoading}
                        className="text-xs bg-primary text-white rounded-lg px-3 py-2 hover:bg-primary-dark transition flex items-center gap-1.5 disabled:opacity-50"
                    >
                        {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                        AI Deep Analysis
                    </button>
                </div>
            </div>

            <SetupChecklist
                prereqs={["google_ads", "business_info"]}
                pageContext="Connect your Google Ads account so the AI can analyze your actual ads, quality scores, and performance data"
                mode="blocking"
            />

            {/* AI Analysis Results */}
            {aiAnalysis && (
                <div className="bg-gradient-to-r from-primary/5 to-blue-50 border border-primary/20 rounded-2xl p-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className={`text-3xl font-bold ${
                            aiAnalysis.overallGrade === "A" ? "text-green-600" :
                            aiAnalysis.overallGrade === "B" ? "text-blue-600" :
                            aiAnalysis.overallGrade === "C" ? "text-yellow-600" : "text-red-600"
                        }`}>
                            {aiAnalysis.overallGrade}
                        </div>
                        <div>
                            <p className="text-sm font-semibold">AI Account Grade</p>
                            <p className="text-xs text-muted">{aiAnalysis.summary}</p>
                        </div>
                    </div>
                    {aiAnalysis.quickWins && aiAnalysis.quickWins.length > 0 && (
                        <div>
                            <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">Quick Wins</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {aiAnalysis.quickWins.map((qw, i) => (
                                    <div key={i} className="bg-white border border-border rounded-lg p-3">
                                        <p className="text-sm font-medium">{qw.action}</p>
                                        <p className="text-xs text-muted mt-0.5">{qw.impact} <span className="text-primary">• {qw.effort} effort</span></p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {aiAnalysis.budgetRecommendation && (
                        <div className="bg-white border border-border rounded-lg p-3">
                            <p className="text-xs font-semibold uppercase text-muted mb-1">Budget Recommendation</p>
                            <p className="text-sm">{aiAnalysis.budgetRecommendation}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Overview Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: "Total Spend", value: fmtMoney(summary.cost), icon: DollarSign, color: "text-blue-600" },
                    { label: "Clicks", value: fmt(summary.clicks), icon: MousePointer, color: "text-green-600" },
                    { label: "Conversions", value: fmt(summary.conversions), icon: Target, color: "text-purple-600" },
                    { label: "Avg CPC", value: fmtMoney(summary.avgCpc), icon: Activity, color: "text-orange-600" },
                ].map((s, i) => (
                    <div key={i} className="bg-card border border-border rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-1">
                            <s.icon className={`w-4 h-4 ${s.color}`} />
                            <span className="text-xs text-muted">{s.label}</span>
                        </div>
                        <p className="text-xl font-bold">{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Benchmark Comparison */}
            <SectionCard title="Industry Benchmark Comparison" id="benchmark" open={isSectionOpen("benchmark")} onToggle={toggleSection}>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                        { label: "CTR", actual: benchmark.actual.ctr.toFixed(2) + "%", bench: benchmark.benchmark.avgCtr.toFixed(2) + "%", verdict: benchmark.verdict.ctr },
                        { label: "Avg CPC", actual: fmtMoney(benchmark.actual.cpc), bench: fmtMoney(benchmark.benchmark.avgCpc), verdict: benchmark.verdict.cpc },
                        { label: "Cost/Conv", actual: fmtMoney(benchmark.actual.cpa), bench: fmtMoney(benchmark.benchmark.avgCpa), verdict: benchmark.verdict.cpa },
                    ].map((b, i) => (
                        <div key={i} className="bg-background border border-border rounded-lg p-4 text-center">
                            <p className="text-xs text-muted mb-1">{b.label}</p>
                            <p className="text-2xl font-bold">{b.actual}</p>
                            <p className="text-xs text-muted mt-1">Industry avg: {b.bench}</p>
                            <span className={`inline-flex items-center gap-1 text-xs mt-2 font-medium ${
                                b.verdict === "above" || b.verdict === "better" ? "text-green-600" : "text-red-500"
                            }`}>
                                {b.verdict === "above" || b.verdict === "better"
                                    ? <><TrendingUp className="w-3 h-3" /> Above average</>
                                    : <><TrendingDown className="w-3 h-3" /> Below average</>}
                            </span>
                        </div>
                    ))}
                </div>
            </SectionCard>

            {/* Quality Score */}
            <SectionCard title={`Quality Score Analysis (Avg: ${qualityScore.avgScore}/10)`} id="quality" open={isSectionOpen("quality")} onToggle={toggleSection}>
                <div className="grid grid-cols-5 gap-2 mb-4">
                    {[
                        { label: "Excellent (8-10)", count: qualityScore.distribution.excellent, color: "bg-green-100 text-green-700" },
                        { label: "Good (6-7)", count: qualityScore.distribution.good, color: "bg-blue-100 text-blue-700" },
                        { label: "Average (4-5)", count: qualityScore.distribution.average, color: "bg-yellow-100 text-yellow-700" },
                        { label: "Poor (1-3)", count: qualityScore.distribution.poor, color: "bg-red-100 text-red-700" },
                        { label: "Unrated", count: qualityScore.distribution.unrated, color: "bg-gray-100 text-gray-600" },
                    ].map((d, i) => (
                        <div key={i} className={`rounded-lg p-3 text-center ${d.color}`}>
                            <p className="text-xl font-bold">{d.count}</p>
                            <p className="text-[10px]">{d.label}</p>
                        </div>
                    ))}
                </div>
                {qualityScore.lowScoreKeywords.length > 0 && (
                    <div>
                        <p className="text-xs font-semibold text-muted uppercase mb-2">Lowest Scoring Keywords</p>
                        <div className="space-y-1">
                            {qualityScore.lowScoreKeywords.map((k, i) => (
                                <div key={i} className="flex items-center justify-between bg-red-50/50 px-3 py-2 rounded-lg text-sm">
                                    <span>{k.keyword}</span>
                                    <div className="flex items-center gap-4 text-xs text-muted">
                                        <span>QS: <strong className="text-red-600">{k.qScore}</strong>/10</span>
                                        <span>Cost: {fmtMoney(k.cost)}</span>
                                        <span>{k.clicks} clicks</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </SectionCard>

            {/* Wasted Spend */}
            <SectionCard title={`Wasted Spend: ${fmtMoney(wastedSpend.totalWasted)}`} id="waste" open={isSectionOpen("waste")} onToggle={toggleSection}>
                {wastedSpend.zeroConversionKeywords.length > 0 && (
                    <div className="mb-4">
                        <p className="text-xs font-semibold text-red-600 uppercase mb-2">Keywords with Zero Conversions (High Spend)</p>
                        <div className="space-y-1">
                            {wastedSpend.zeroConversionKeywords.slice(0, 10).map((k, i) => (
                                <div key={i} className="flex items-center justify-between bg-red-50/50 px-3 py-2 rounded-lg text-sm">
                                    <span>{k.keyword}</span>
                                    <div className="flex gap-3 text-xs text-muted">
                                        <span className="text-red-600 font-medium">{fmtMoney(k.cost)} wasted</span>
                                        <span>{k.clicks} clicks</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {wastedSpend.irrelevantSearchTerms.length > 0 && (
                    <div>
                        <p className="text-xs font-semibold text-orange-600 uppercase mb-2">Irrelevant Search Terms (Add as Negatives)</p>
                        <div className="flex flex-wrap gap-2">
                            {wastedSpend.irrelevantSearchTerms.map((st, i) => (
                                <span key={i} className="bg-orange-50 text-orange-700 px-2.5 py-1 rounded-lg text-xs">
                                    {st.term} <span className="text-orange-500">({fmtMoney(st.cost)})</span>
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </SectionCard>

            {/* Negative Keyword Suggestions */}
            {negativeKeywordSuggestions.length > 0 && (
                <SectionCard title={`Negative Keyword Suggestions (${negativeKeywordSuggestions.length})`} id="negkw" open={isSectionOpen("negkw")} onToggle={toggleSection}>
                    <div className="space-y-1.5">
                        {negativeKeywordSuggestions.map((nk, i) => (
                            <div key={i} className="flex items-center justify-between px-3 py-2 bg-background border border-border rounded-lg text-sm">
                                <span className="font-medium">{nk.term}</span>
                                <div className="flex gap-3 text-xs text-muted">
                                    <span>{nk.reason}</span>
                                    <span className="text-red-500">{fmtMoney(nk.cost)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </SectionCard>
            )}

            {/* Ad Extension Coverage */}
            <SectionCard title="Ad Extension Coverage" id="ext" open={isSectionOpen("ext")} onToggle={toggleSection}>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {[
                        { label: "Sitelinks", active: extensionCoverage.sitelinks },
                        { label: "Callouts", active: extensionCoverage.callouts },
                        { label: "Structured Snippets", active: extensionCoverage.snippets },
                        { label: "Call Extensions", active: extensionCoverage.calls },
                        { label: "Location", active: extensionCoverage.locations },
                    ].map((ext, i) => (
                        <div key={i} className={`border rounded-lg p-3 text-center ${
                            ext.active ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
                        }`}>
                            {ext.active ? <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto mb-1" /> : <XCircle className="w-5 h-5 text-red-500 mx-auto mb-1" />}
                            <p className="text-xs font-medium">{ext.label}</p>
                            <p className="text-[10px] text-muted">{ext.active ? "Active" : "Missing"}</p>
                        </div>
                    ))}
                </div>
            </SectionCard>
        </div>
    );
}

// Collapsible section component
function SectionCard({ title, id, open, onToggle, children }: { title: string; id: string; open: boolean; onToggle: (id: string) => void; children: React.ReactNode }) {
    return (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
            <button onClick={() => onToggle(id)} className="w-full flex items-center justify-between p-4 hover:bg-sidebar/50 transition">
                <h2 className="text-sm font-semibold">{title}</h2>
                {open ? <ChevronUp className="w-4 h-4 text-muted" /> : <ChevronDown className="w-4 h-4 text-muted" />}
            </button>
            {open && <div className="px-4 pb-4">{children}</div>}
        </div>
    );
}
