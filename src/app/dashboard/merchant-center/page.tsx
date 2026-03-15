"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Store, Loader2, RefreshCw, Package, AlertTriangle, CheckCircle2,
    Zap, Sparkles, Tag, Image, DollarSign, BarChart3, TrendingUp,
    XCircle, Clock, ArrowUpRight
} from "lucide-react";
import { authFetch } from "@/lib/auth-client";
import { useBusiness } from "@/lib/business-context";

interface MerchantStatus {
    configured: boolean;
    features?: string[];
    feedMetrics?: { name: string; description: string }[];
    optimizations?: { name: string; description: string }[];
    message?: string;
    comingSoon?: boolean;
}

interface OptimizedProduct {
    original: string;
    optimized: string;
    changes: string[];
    estimatedImpact: string;
}

interface TitleOptResult {
    optimizedProducts: OptimizedProduct[];
    feedHealthSuggestions: string[];
    overallScore: number;
}

export default function MerchantCenterPage() {
    const { activeBusiness } = useBusiness();
    const [status, setStatus] = useState<MerchantStatus | null>(null);
    const [loading, setLoading] = useState(true);

    const [titles, setTitles] = useState("");
    const [optimizing, setOptimizing] = useState(false);
    const [optResult, setOptResult] = useState<TitleOptResult | null>(null);

    const fetchStatus = useCallback(async () => {
        setLoading(true);
        try {
            const res = await authFetch("/api/merchant-center");
            const data = await res.json();
            setStatus(data);
        } catch {
            setStatus({ configured: false, message: "Failed to load" });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchStatus(); }, [fetchStatus]);

    const optimizeTitles = async () => {
        const products = titles.split("\n").filter(Boolean).map((t) => ({ title: t.trim() }));
        if (products.length === 0) return;
        setOptimizing(true);
        setOptResult(null);
        try {
            const res = await authFetch("/api/merchant-center", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "optimize-titles", products }),
            });
            const data = await res.json();
            if (data.result) setOptResult(data.result);
        } catch { /* noop */ } finally { setOptimizing(false); }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32">
                <Loader2 className="w-8 h-8 animate-spin text-green-500" />
            </div>
        );
    }

    const impactColor = (impact: string) => {
        if (impact === "high") return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
        if (impact === "medium") return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300";
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Store className="w-7 h-7 text-green-600" /> Merchant Center
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Google Shopping & product feed management</p>
                </div>
                <button onClick={fetchStatus} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                    <RefreshCw className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>
            </div>

            {/* Coming Soon Banner */}
            {status?.comingSoon && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-100 dark:border-green-800">
                    <div className="flex items-start gap-4">
                        <div className="p-3 rounded-full bg-green-100 dark:bg-green-800">
                            <Zap className="w-6 h-6 text-green-600 dark:text-green-300" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-green-900 dark:text-green-100">Merchant Center Integration Coming Soon</h3>
                            <p className="text-green-700 dark:text-green-300 text-sm mt-1">{status.message}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Feed Metrics Preview */}
            {status?.feedMetrics && (
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Feed Health</h2>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {status.feedMetrics.map((m) => {
                            const iconMap: Record<string, typeof Package> = {
                                "Active Products": CheckCircle2,
                                "Disapproved": XCircle,
                                "Pending Review": Clock,
                                "Expiring": AlertTriangle,
                            };
                            const colorMap: Record<string, string> = {
                                "Active Products": "text-green-500",
                                "Disapproved": "text-red-500",
                                "Pending Review": "text-yellow-500",
                                "Expiring": "text-orange-500",
                            };
                            const Icon = iconMap[m.name] || Package;
                            return (
                                <div key={m.name} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Icon className={`w-5 h-5 ${colorMap[m.name] || "text-gray-500"}`} />
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{m.name}</span>
                                    </div>
                                    <div className="text-2xl font-bold text-gray-400">—</div>
                                    <div className="text-xs text-gray-400 mt-1">{m.description}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Features & Optimizations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {status?.features && (
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Features</h2>
                        <div className="space-y-2">
                            {status.features.map((f, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">{f}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {status?.optimizations && (
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Optimizations</h2>
                        <div className="space-y-2">
                            {status.optimizations.map((o) => (
                                <div key={o.name} className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-purple-500" />
                                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{o.name}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">{o.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* AI Title Optimizer */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-500" /> AI Product Title Optimizer
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                    Enter product titles (one per line) to get AI-optimized versions for Google Shopping.
                </p>
                <textarea
                    value={titles}
                    onChange={(e) => setTitles(e.target.value)}
                    placeholder={"Water Bottle\nYoga Mat Extra Thick\nBluetooth Headphones Wireless"}
                    rows={5}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm mb-4 font-mono"
                />
                <button
                    onClick={optimizeTitles}
                    disabled={!titles.trim() || optimizing}
                    className="px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium flex items-center gap-2"
                >
                    {optimizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {optimizing ? "Optimizing..." : "Optimize Titles"}
                </button>
            </div>

            {/* Optimization Results */}
            {optResult && (
                <div className="space-y-6">
                    {/* Score */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-center">
                        <div className="text-sm text-gray-500 mb-1">Feed Health Score</div>
                        <div className={`text-4xl font-bold ${
                            optResult.overallScore >= 80 ? "text-green-600" :
                            optResult.overallScore >= 60 ? "text-yellow-600" : "text-red-600"
                        }`}>
                            {optResult.overallScore}/100
                        </div>
                    </div>

                    {/* Optimized Products */}
                    <div className="space-y-3">
                        {optResult.optimizedProducts?.map((p, i) => (
                            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <span className={`px-2 py-0.5 text-xs rounded font-medium ${impactColor(p.estimatedImpact)}`}>
                                        {p.estimatedImpact} impact
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    <div>
                                        <div className="text-xs text-gray-400 uppercase">Original</div>
                                        <p className="text-sm text-gray-500 line-through">{p.original}</p>
                                    </div>
                                    <div>
                                        <div className="text-xs text-green-600 uppercase">Optimized</div>
                                        <p className="text-sm text-gray-900 dark:text-white font-medium">{p.optimized}</p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-1.5 mt-3">
                                    {p.changes?.map((c, j) => (
                                        <span key={j} className="px-2 py-0.5 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                                            {c}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Health Suggestions */}
                    {optResult.feedHealthSuggestions?.length > 0 && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-5 border border-yellow-100 dark:border-yellow-800">
                            <h3 className="font-medium text-yellow-800 dark:text-yellow-200 mb-3">Feed Health Suggestions</h3>
                            <ul className="space-y-1.5">
                                {optResult.feedHealthSuggestions.map((s, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-yellow-700 dark:text-yellow-300">
                                        <ArrowUpRight className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                                        {s}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
