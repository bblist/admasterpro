"use client";

/**
 * AiInsightsPanel
 *
 * A proactive AI insights panel that shows smart recommendations,
 * alerts, and optimization suggestions. Designed to surface things
 * the user hasn't thought of yet.
 *
 * Usage:
 *   <AiInsightsPanel businessId={activeBusiness?.id} />
 */

import { useState, useEffect, useCallback } from "react";
import {
    Sparkles, Lightbulb, AlertTriangle, TrendingUp, TrendingDown,
    DollarSign, Users, X, ChevronRight, Loader2, RefreshCw,
    CheckCircle2, Zap, Target, Brain, ArrowRight, Shield
} from "lucide-react";
import { authFetch } from "@/lib/auth-client";
import Link from "next/link";

interface AiInsight {
    id: string;
    type: string;
    priority: string;
    title: string;
    description: string;
    actionLabel: string | null;
    actionType: string | null;
    actionData: string | null;
    dismissed: boolean;
    resolved: boolean;
    createdAt: string;
}

const TYPE_CONFIG: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; bgColor: string }> = {
    opportunity: { icon: Lightbulb, color: "text-green-600", bgColor: "bg-green-100" },
    warning: { icon: AlertTriangle, color: "text-amber-600", bgColor: "bg-amber-100" },
    performance: { icon: TrendingUp, color: "text-blue-600", bgColor: "bg-blue-100" },
    competitor: { icon: Users, color: "text-purple-600", bgColor: "bg-purple-100" },
    budget: { icon: DollarSign, color: "text-red-600", bgColor: "bg-red-100" },
};

const PRIORITY_COLORS: Record<string, string> = {
    critical: "bg-red-500 text-white",
    high: "bg-orange-100 text-orange-700",
    medium: "bg-yellow-100 text-yellow-700",
    low: "bg-gray-100 text-gray-600",
};

const ACTION_ROUTES: Record<string, string> = {
    pause_keyword: "/dashboard/keywords",
    increase_budget: "/dashboard/campaigns",
    decrease_budget: "/dashboard/campaigns",
    create_ad: "/dashboard/ad-copy",
    review_keywords: "/dashboard/keywords",
    check_landing: "/dashboard/chat?intent=audit",
    review_campaign: "/dashboard/campaigns",
    add_negatives: "/dashboard/keyword-research",
};

interface Props {
    businessId?: string;
    compact?: boolean;
    maxItems?: number;
}

export default function AiInsightsPanel({ businessId, compact = false, maxItems = 10 }: Props) {
    const [insights, setInsights] = useState<AiInsight[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dismissing, setDismissing] = useState<string | null>(null);

    const fetchInsights = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (businessId) params.set("businessId", businessId);
            const res = await authFetch(`/api/ai-insights?${params}`);
            const data = await res.json();
            if (res.ok) {
                setInsights((data.insights || []).slice(0, maxItems));
            }
        } catch {
            // Silently fail — insights are supplementary
        } finally {
            setLoading(false);
        }
    }, [businessId, maxItems]);

    useEffect(() => {
        fetchInsights();
    }, [fetchInsights]);

    const generateInsights = async () => {
        setGenerating(true);
        setError(null);
        try {
            const res = await authFetch("/api/ai-insights", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ businessId }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            await fetchInsights();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to generate insights");
        } finally {
            setGenerating(false);
        }
    };

    const dismissInsight = async (id: string) => {
        setDismissing(id);
        try {
            await authFetch("/api/ai-insights", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, action: "dismiss" }),
            });
            setInsights(prev => prev.filter(i => i.id !== id));
        } catch {
            // Silently fail
        } finally {
            setDismissing(null);
        }
    };

    const resolveInsight = async (id: string) => {
        setDismissing(id);
        try {
            await authFetch("/api/ai-insights", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, action: "resolve" }),
            });
            setInsights(prev => prev.filter(i => i.id !== id));
        } catch {
            // Silently fail
        } finally {
            setDismissing(null);
        }
    };

    if (loading) {
        return compact ? null : (
            <div className="bg-card border border-border rounded-2xl p-6 flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
        );
    }

    // Compact mode for sidebar or dashboard cards
    if (compact) {
        if (insights.length === 0) return null;

        return (
            <div className="space-y-2">
                {insights.slice(0, 3).map(insight => {
                    const config = TYPE_CONFIG[insight.type] || TYPE_CONFIG.opportunity;
                    const Icon = config.icon;
                    return (
                        <div
                            key={insight.id}
                            className="flex items-start gap-2.5 bg-card border border-border rounded-xl px-3 py-2.5 hover:border-primary/30 transition"
                        >
                            <div className={`w-6 h-6 ${config.bgColor} rounded-md flex items-center justify-center shrink-0 mt-0.5`}>
                                <Icon className={`w-3 h-3 ${config.color}`} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium leading-tight truncate">{insight.title}</p>
                                {insight.actionLabel && insight.actionType && (
                                    <Link
                                        href={ACTION_ROUTES[insight.actionType] || "/dashboard/chat"}
                                        className="text-[10px] text-primary hover:underline flex items-center gap-0.5 mt-0.5"
                                    >
                                        {insight.actionLabel} <ChevronRight className="w-2.5 h-2.5" />
                                    </Link>
                                )}
                            </div>
                        </div>
                    );
                })}
                {insights.length > 3 && (
                    <Link
                        href="/dashboard"
                        className="text-xs text-muted hover:text-primary flex items-center gap-1 justify-center"
                    >
                        +{insights.length - 3} more insights
                    </Link>
                )}
            </div>
        );
    }

    // Full panel
    return (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg flex items-center justify-center">
                        <Brain className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-semibold">AI Insights</h3>
                        <p className="text-xs text-muted">Proactive recommendations for your account</p>
                    </div>
                    {insights.length > 0 && (
                        <span className="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">
                            {insights.length}
                        </span>
                    )}
                </div>
                <button
                    onClick={generateInsights}
                    disabled={generating}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                >
                    {generating ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                        <RefreshCw className="w-3 h-3" />
                    )}
                    {generating ? "Analyzing..." : "Refresh"}
                </button>
            </div>

            {error && (
                <div className="px-5 py-3 bg-red-50 text-red-700 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-3 h-3" />
                    {error}
                </div>
            )}

            {/* Insights List */}
            {insights.length > 0 ? (
                <div className="divide-y divide-border">
                    {insights.map(insight => {
                        const config = TYPE_CONFIG[insight.type] || TYPE_CONFIG.opportunity;
                        const Icon = config.icon;
                        const priorityColor = PRIORITY_COLORS[insight.priority] || PRIORITY_COLORS.medium;

                        return (
                            <div key={insight.id} className="px-5 py-4 hover:bg-muted/5 transition group">
                                <div className="flex items-start gap-3">
                                    <div className={`w-9 h-9 ${config.bgColor} rounded-xl flex items-center justify-center shrink-0`}>
                                        <Icon className={`w-4.5 h-4.5 ${config.color}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <h4 className="text-sm font-semibold leading-tight">{insight.title}</h4>
                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${priorityColor}`}>
                                                {insight.priority}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted leading-relaxed">{insight.description}</p>

                                        {/* Action Buttons */}
                                        <div className="flex items-center gap-2 mt-2.5">
                                            {insight.actionLabel && insight.actionType && (
                                                <Link
                                                    href={ACTION_ROUTES[insight.actionType] || "/dashboard/chat"}
                                                    className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary-dark text-white px-3 py-1.5 rounded-lg text-xs font-medium transition"
                                                >
                                                    <Zap className="w-3 h-3" />
                                                    {insight.actionLabel}
                                                </Link>
                                            )}
                                            <button
                                                onClick={() => resolveInsight(insight.id)}
                                                disabled={dismissing === insight.id}
                                                className="inline-flex items-center gap-1 text-xs text-green-600 hover:bg-green-50 px-2 py-1.5 rounded-lg transition disabled:opacity-50"
                                            >
                                                <CheckCircle2 className="w-3 h-3" />
                                                Done
                                            </button>
                                            <button
                                                onClick={() => dismissInsight(insight.id)}
                                                disabled={dismissing === insight.id}
                                                className="inline-flex items-center gap-1 text-xs text-muted hover:text-foreground hover:bg-muted/10 px-2 py-1.5 rounded-lg transition disabled:opacity-50"
                                            >
                                                {dismissing === insight.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                                                Dismiss
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="px-5 py-8 text-center">
                    <Brain className="w-10 h-10 text-muted/20 mx-auto mb-3" />
                    <p className="text-sm font-medium mb-1">No active insights</p>
                    <p className="text-xs text-muted mb-4">
                        AI will analyze your account and surface insights you haven&apos;t thought of
                    </p>
                    <button
                        onClick={generateInsights}
                        disabled={generating}
                        className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl text-xs font-medium transition disabled:opacity-50"
                    >
                        {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                        Generate Insights Now
                    </button>
                </div>
            )}
        </div>
    );
}
