"use client";

import { useState } from "react";
import {
    DollarSign, TrendingUp, TrendingDown, Loader2, RefreshCw,
    ArrowUp, ArrowDown, Pause, CheckCircle2, AlertTriangle,
    Zap, Target, BarChart3, Lightbulb, AlertCircle, Minus
} from "lucide-react";
import { authFetch } from "@/lib/auth-client";
import { useBusiness } from "@/lib/business-context";
import { useTranslation } from "@/i18n/context";
import Tooltip from "@/components/Tooltip";

interface Recommendation {
    campaignId?: string;
    campaignName: string;
    action: "increase" | "decrease" | "pause" | "maintain" | "restructure";
    priority: "high" | "medium" | "low";
    currentBudget: number;
    suggestedBudget: number;
    reason: string;
    expectedImpact: string;
}

interface OptimizerResult {
    overallScore?: number;
    totalMonthlyBudget?: number;
    suggestedMonthlyBudget?: number;
    potentialSavings?: number;
    recommendations?: Recommendation[];
    quickWins?: string[];
    warnings?: string[];
    summary?: string;
    raw?: string;
    parseError?: boolean;
}

const ACTION_CONFIG: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; label: string }> = {
    increase: { icon: ArrowUp, color: "text-green-600 bg-green-50", label: "Increase" },
    decrease: { icon: ArrowDown, color: "text-orange-600 bg-orange-50", label: "Decrease" },
    pause: { icon: Pause, color: "text-red-600 bg-red-50", label: "Pause" },
    maintain: { icon: Minus, color: "text-blue-600 bg-blue-50", label: "Maintain" },
    restructure: { icon: RefreshCw, color: "text-purple-600 bg-purple-50", label: "Restructure" },
};

const PRIORITY_COLORS: Record<string, string> = {
    high: "bg-red-100 text-red-700",
    medium: "bg-yellow-100 text-yellow-700",
    low: "bg-blue-100 text-blue-700",
};

export default function BudgetOptimizerPage() {
    const { t } = useTranslation();
    const { activeBusiness } = useBusiness();
    void t;

    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState<OptimizerResult | null>(null);
    const [hasCampaignData, setHasCampaignData] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const analyze = async () => {
        setAnalyzing(true);
        setError(null);
        setResult(null);

        try {
            const res = await authFetch("/api/budget-optimizer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ businessId: activeBusiness?.id }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Analysis failed");

            setResult(data.result);
            setHasCampaignData(data.hasCampaignData);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Analysis failed");
        } finally {
            setAnalyzing(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <DollarSign className="w-6 h-6 text-primary" />
                        Budget & Bid Optimizer
                        <Tooltip text="AI analyzes your campaign performance and recommends optimal budget allocation to maximize ROI and cut waste." position="bottom" />
                    </h1>
                    <p className="text-muted text-sm mt-1">
                        AI-powered budget allocation and bid optimization recommendations
                    </p>
                </div>
                <button
                    onClick={analyze}
                    disabled={analyzing}
                    className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-50"
                >
                    {analyzing ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</>
                    ) : (
                        <><BarChart3 className="w-4 h-4" /> {result ? "Re-Analyze" : "Analyze Campaigns"}</>
                    )}
                </button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                </div>
            )}

            {/* Initial state */}
            {!result && !analyzing && !error && (
                <div className="bg-card border border-border rounded-2xl p-12 text-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <DollarSign className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold mb-2">Optimize Your Ad Spend</h2>
                    <p className="text-muted text-sm max-w-md mx-auto mb-8">
                        The AI will analyze your campaign performance data and provide actionable
                        budget and bid recommendations to maximize your ROI.
                    </p>

                    <button
                        onClick={analyze}
                        className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-medium transition"
                    >
                        <Zap className="w-5 h-5" />
                        Run Budget Analysis
                    </button>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10 text-left">
                        <div className="bg-background border border-border rounded-xl p-5">
                            <Target className="w-8 h-8 text-blue-500 mb-3" />
                            <h3 className="font-semibold mb-1">Budget Allocation</h3>
                            <p className="text-xs text-muted">Get optimal daily budget suggestions for each campaign based on performance.</p>
                        </div>
                        <div className="bg-background border border-border rounded-xl p-5">
                            <TrendingUp className="w-8 h-8 text-green-500 mb-3" />
                            <h3 className="font-semibold mb-1">Bid Optimization</h3>
                            <p className="text-xs text-muted">Identify which campaigns deserve more investment for maximum returns.</p>
                        </div>
                        <div className="bg-background border border-border rounded-xl p-5">
                            <Lightbulb className="w-8 h-8 text-yellow-500 mb-3" />
                            <h3 className="font-semibold mb-1">Quick Wins</h3>
                            <p className="text-xs text-muted">Actionable tips to immediately reduce waste and improve efficiency.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Loading */}
            {analyzing && (
                <div className="bg-card border border-border rounded-2xl p-12 text-center">
                    <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
                    <p className="text-sm font-medium">Analyzing your campaigns...</p>
                    <p className="text-xs text-muted mt-1">Crunching numbers for optimal budget allocation</p>
                </div>
            )}

            {/* Results */}
            {result && !result.parseError && (
                <>
                    {/* Top-line metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-card border border-border rounded-xl p-5">
                            <p className="text-xs text-muted mb-1">Health Score <Tooltip text="Overall account health from 0-100. Above 80 is great, below 50 needs attention. Based on budget efficiency, keyword quality, and conversion rates." position="right" /></p>
                            <p className={`text-3xl font-bold ${
                                (result.overallScore || 0) >= 80 ? "text-green-600" :
                                (result.overallScore || 0) >= 50 ? "text-yellow-600" :
                                "text-red-600"
                            }`}>
                                {result.overallScore || 0}
                            </p>
                            <p className="text-xs text-muted">/100</p>
                        </div>
                        <div className="bg-card border border-border rounded-xl p-5">
                            <p className="text-xs text-muted mb-1">Current Monthly <Tooltip text="Your total monthly ad spend across all campaigns at current daily budget levels." position="right" /></p>
                            <p className="text-2xl font-bold">${(result.totalMonthlyBudget || 0).toLocaleString()}</p>
                        </div>
                        <div className="bg-card border border-border rounded-xl p-5">
                            <p className="text-xs text-muted mb-1">Suggested Monthly <Tooltip text="The AI-recommended monthly budget based on performance data. Shifting to this amount could improve results." position="right" /></p>
                            <p className="text-2xl font-bold text-primary">${(result.suggestedMonthlyBudget || 0).toLocaleString()}</p>
                        </div>
                        <div className="bg-card border border-border rounded-xl p-5">
                            <p className="text-xs text-muted mb-1">Potential Savings <Tooltip text="Estimated monthly savings if you follow the AI’s budget reallocation recommendations." position="left" /></p>
                            <p className="text-2xl font-bold text-green-600">${(result.potentialSavings || 0).toLocaleString()}</p>
                            <p className="text-xs text-muted">/month</p>
                        </div>
                    </div>

                    {/* Summary */}
                    {result.summary && (
                        <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
                            <p className="text-sm">{result.summary}</p>
                        </div>
                    )}

                    {/* Quick wins */}
                    {result.quickWins && result.quickWins.length > 0 && (
                        <div className="bg-card border border-border rounded-xl p-5">
                            <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                                <Lightbulb className="w-4 h-4 text-yellow-500" />
                                Quick Wins
                            </h3>
                            <div className="space-y-2">
                                {result.quickWins.map((win, i) => (
                                    <div key={i} className="flex items-start gap-2 text-sm">
                                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                        <span>{win}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Warnings */}
                    {result.warnings && result.warnings.length > 0 && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
                            <h3 className="text-sm font-semibold flex items-center gap-2 mb-3 text-yellow-800">
                                <AlertTriangle className="w-4 h-4" />
                                Warnings
                            </h3>
                            <div className="space-y-2">
                                {result.warnings.map((warn, i) => (
                                    <p key={i} className="text-sm text-yellow-700">{warn}</p>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Campaign recommendations */}
                    {result.recommendations && result.recommendations.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-muted uppercase tracking-wide">
                                Campaign Recommendations ({result.recommendations.length})
                            </h3>

                            {result.recommendations.map((rec, i) => {
                                const actionCfg = ACTION_CONFIG[rec.action] || ACTION_CONFIG.maintain;
                                const ActionIcon = actionCfg.icon;
                                const pctChange = rec.currentBudget > 0
                                    ? Math.round(((rec.suggestedBudget - rec.currentBudget) / rec.currentBudget) * 100)
                                    : 0;

                                return (
                                    <div key={i} className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition">
                                        <div className="flex items-start gap-4">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${actionCfg.color}`}>
                                                <ActionIcon className="w-5 h-5" />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h4 className="font-semibold">{rec.campaignName}</h4>
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[rec.priority] || PRIORITY_COLORS.low}`}>
                                                        {rec.priority}
                                                    </span>
                                                    <span className={`text-xs font-medium ${actionCfg.color.split(" ")[0]}`}>
                                                        {actionCfg.label}
                                                    </span>
                                                </div>

                                                <p className="text-sm text-muted mt-1">{rec.reason}</p>

                                                <div className="mt-3 flex items-center gap-6 text-sm">
                                                    <div>
                                                        <span className="text-xs text-muted">Current</span>
                                                        <p className="font-medium">${rec.currentBudget}/day</p>
                                                    </div>
                                                    <div className="text-muted">→</div>
                                                    <div>
                                                        <span className="text-xs text-muted">Suggested</span>
                                                        <p className="font-medium text-primary">${rec.suggestedBudget}/day</p>
                                                    </div>
                                                    {pctChange !== 0 && (
                                                        <div className={`flex items-center gap-1 text-xs font-medium ${
                                                            pctChange > 0 ? "text-green-600" : "text-orange-600"
                                                        }`}>
                                                            {pctChange > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                                            {pctChange > 0 ? "+" : ""}{pctChange}%
                                                        </div>
                                                    )}
                                                </div>

                                                {rec.expectedImpact && (
                                                    <p className="mt-2 text-xs text-muted">
                                                        <strong>Expected impact:</strong> {rec.expectedImpact}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {!hasCampaignData && (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
                            <strong>Note:</strong> No live campaign data was available. These are general recommendations.
                            Connect your Google Ads account in Settings for personalized optimization.
                        </div>
                    )}
                </>
            )}

            {result?.parseError && (
                <div className="bg-card border border-border rounded-xl p-5">
                    <p className="text-sm whitespace-pre-wrap">{result.raw}</p>
                </div>
            )}
        </div>
    );
}
