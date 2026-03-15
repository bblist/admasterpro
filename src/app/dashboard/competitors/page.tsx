"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Users, Target, TrendingUp, TrendingDown, Loader2, RefreshCw,
    AlertTriangle, Zap, Shield, BarChart3, ExternalLink, Search,
    ChevronDown, ChevronUp, Globe, Swords, Eye
} from "lucide-react";
import { authFetch } from "@/lib/auth-client";
import { useBusiness } from "@/lib/business-context";

interface AuctionInsight {
    domain: string;
    overlapRate: number;
    positionAboveRate: number;
    topOfPageRate: number;
    impressionShare: number;
}

interface Competitor {
    domain: string;
    threatLevel: string;
    estimatedBudget: string;
    strengths: string[];
    weaknesses: string[];
    adCopyPatterns: string[];
    keywordOverlap: string[];
    missingKeywords: string[];
}

interface CompetitorAnalysis {
    competitors?: Competitor[];
    gapAnalysis?: {
        keywordsYouMiss: string[];
        messagingGaps: string[];
        formatGaps: string[];
    };
    shareOfVoice?: {
        yourShare: string;
        topCompetitorShare: string;
        assessment: string;
    };
    recommendations?: { priority: number; action: string; expectedImpact: string }[];
    landingPageComparison?: {
        yourStrengths: string[];
        competitorAdvantages: string[];
        suggestions: string[];
    };
}

export default function CompetitorResearchPage() {
    const { activeBusiness } = useBusiness();
    const [auctionInsights, setAuctionInsights] = useState<AuctionInsight[]>([]);
    const [analysis, setAnalysis] = useState<CompetitorAnalysis | null>(null);
    const [loading, setLoading] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [competitorUrls, setCompetitorUrls] = useState("");

    const fetchInsights = useCallback(async () => {
        if (!activeBusiness || activeBusiness.id === "default") return;
        setLoading(true);
        setError(null);
        try {
            const res = await authFetch(`/api/competitor-research?businessId=${activeBusiness.id}`);
            if (!res.ok) throw new Error((await res.json()).error || "Failed to load");
            const data = await res.json();
            setAuctionInsights(data.auctionInsights || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load");
        } finally {
            setLoading(false);
        }
    }, [activeBusiness]);

    const runAiAnalysis = async () => {
        setAiLoading(true);
        try {
            const res = await authFetch("/api/competitor-research", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    businessName: activeBusiness?.name,
                    industry: activeBusiness?.industry,
                    website: activeBusiness?.website,
                    auctionInsights,
                    competitorUrls: competitorUrls.split(",").map(u => u.trim()).filter(Boolean),
                }),
            });
            const data = await res.json();
            setAnalysis(data.analysis);
        } catch { /* ignore */ } finally {
            setAiLoading(false);
        }
    };

    useEffect(() => { fetchInsights(); }, [fetchInsights]);

    if (loading) return (
        <div className="max-w-6xl mx-auto flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Swords className="w-6 h-6 text-primary" /> Competitor Research
                </h1>
                <p className="text-muted text-sm mt-1">Analyze your competitors&apos; ad strategies and find opportunities to outperform them</p>
            </div>

            {error && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-700 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    {error} — You can still run AI competitor analysis below.
                </div>
            )}

            {/* Competitor URL Input + Analysis Trigger */}
            <div className="bg-card border border-border rounded-xl p-5">
                <h2 className="text-sm font-semibold mb-3">Competitor Analysis</h2>
                <div className="space-y-3">
                    <div>
                        <label className="text-xs text-muted mb-1 block">Competitor websites (optional, comma-separated)</label>
                        <input
                            type="text"
                            value={competitorUrls}
                            onChange={e => setCompetitorUrls(e.target.value)}
                            placeholder="competitor1.com, competitor2.com"
                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
                        />
                    </div>
                    <button
                        onClick={runAiAnalysis}
                        disabled={aiLoading}
                        className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-primary-dark transition disabled:opacity-50"
                    >
                        {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                        Run AI Competitor Analysis
                    </button>
                </div>
            </div>

            {/* Auction Insights */}
            {auctionInsights.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-5">
                    <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-primary" /> Auction Insights (Last 30 Days)
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border text-left text-xs text-muted">
                                    <th className="pb-2 pr-4">Competitor</th>
                                    <th className="pb-2 pr-4 text-right">Impression Share</th>
                                    <th className="pb-2 pr-4 text-right">Overlap Rate</th>
                                    <th className="pb-2 pr-4 text-right">Position Above</th>
                                    <th className="pb-2 text-right">Top of Page %</th>
                                </tr>
                            </thead>
                            <tbody>
                                {auctionInsights.map((ai, i) => (
                                    <tr key={i} className="border-b border-border/50">
                                        <td className="py-2 pr-4 font-medium flex items-center gap-2">
                                            <Globe className="w-3.5 h-3.5 text-muted" />
                                            {ai.domain}
                                        </td>
                                        <td className="py-2 pr-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                    <div className="h-full bg-primary rounded-full" style={{ width: `${ai.impressionShare * 100}%` }} />
                                                </div>
                                                <span>{(ai.impressionShare * 100).toFixed(0)}%</span>
                                            </div>
                                        </td>
                                        <td className="py-2 pr-4 text-right">{(ai.overlapRate * 100).toFixed(0)}%</td>
                                        <td className="py-2 pr-4 text-right">{(ai.positionAboveRate * 100).toFixed(0)}%</td>
                                        <td className="py-2 text-right">{(ai.topOfPageRate * 100).toFixed(0)}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* AI Analysis Results */}
            {analysis && (
                <>
                    {/* Share of Voice */}
                    {analysis.shareOfVoice && (
                        <div className="bg-gradient-to-r from-primary/5 to-blue-50 border border-primary/20 rounded-xl p-5">
                            <h2 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                <Eye className="w-4 h-4 text-primary" /> Share of Voice
                            </h2>
                            <div className="grid grid-cols-3 gap-4 mb-2">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-primary">{analysis.shareOfVoice.yourShare}</p>
                                    <p className="text-xs text-muted">Your Share</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-red-500">{analysis.shareOfVoice.topCompetitorShare}</p>
                                    <p className="text-xs text-muted">Top Competitor</p>
                                </div>
                                <div className="flex items-center justify-center">
                                    <p className="text-xs text-muted text-center">{analysis.shareOfVoice.assessment}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Competitor Cards */}
                    {analysis.competitors && analysis.competitors.length > 0 && (
                        <div className="space-y-3">
                            <h2 className="text-sm font-semibold flex items-center gap-2">
                                <Users className="w-4 h-4 text-primary" /> Competitor Breakdown
                            </h2>
                            {analysis.competitors.map((c, i) => (
                                <div key={i} className="bg-card border border-border rounded-xl p-5">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h3 className="font-semibold flex items-center gap-2">
                                                {c.domain}
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                                    c.threatLevel === "high" ? "bg-red-100 text-red-600" :
                                                    c.threatLevel === "medium" ? "bg-yellow-100 text-yellow-600" :
                                                    "bg-green-100 text-green-600"
                                                }`}>{c.threatLevel} threat</span>
                                            </h3>
                                            <p className="text-xs text-muted">Est. budget: {c.estimatedBudget}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                        <div>
                                            <p className="font-semibold text-green-600 mb-1">Strengths</p>
                                            <ul className="space-y-0.5">{c.strengths.map((s, j) => <li key={j}>• {s}</li>)}</ul>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-red-500 mb-1">Weaknesses</p>
                                            <ul className="space-y-0.5">{c.weaknesses.map((w, j) => <li key={j}>• {w}</li>)}</ul>
                                        </div>
                                        {c.missingKeywords.length > 0 && (
                                            <div className="sm:col-span-2">
                                                <p className="font-semibold text-primary mb-1">Keywords They Target That You Don&apos;t</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {c.missingKeywords.map((k, j) => (
                                                        <span key={j} className="bg-primary/10 text-primary px-2 py-0.5 rounded">{k}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Gap Analysis */}
                    {analysis.gapAnalysis && (
                        <div className="bg-card border border-border rounded-xl p-5">
                            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                <Search className="w-4 h-4 text-primary" /> Gap Analysis
                            </h2>
                            <div className="space-y-3">
                                {analysis.gapAnalysis.keywordsYouMiss.length > 0 && (
                                    <div>
                                        <p className="text-xs font-semibold text-muted uppercase mb-1.5">Keywords You&apos;re Missing</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {analysis.gapAnalysis.keywordsYouMiss.map((k, i) => (
                                                <span key={i} className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg text-xs">{k}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {analysis.gapAnalysis.messagingGaps.length > 0 && (
                                    <div>
                                        <p className="text-xs font-semibold text-muted uppercase mb-1.5">Messaging Gaps</p>
                                        <ul className="space-y-1 text-sm">{analysis.gapAnalysis.messagingGaps.map((g, i) => <li key={i} className="text-muted">• {g}</li>)}</ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Prioritized Recommendations */}
                    {analysis.recommendations && analysis.recommendations.length > 0 && (
                        <div className="bg-card border border-border rounded-xl p-5">
                            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                <Target className="w-4 h-4 text-primary" /> Prioritized Actions
                            </h2>
                            <div className="space-y-2">
                                {analysis.recommendations.map((r, i) => (
                                    <div key={i} className="flex items-start gap-3 bg-background border border-border rounded-lg p-3">
                                        <span className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                                            {r.priority}
                                        </span>
                                        <div>
                                            <p className="text-sm font-medium">{r.action}</p>
                                            <p className="text-xs text-muted">{r.expectedImpact}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
