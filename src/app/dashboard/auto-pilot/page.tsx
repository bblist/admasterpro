"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Bot, Loader2, RefreshCw, Zap, AlertTriangle, CheckCircle2,
    ArrowUpRight, DollarSign, Target, TrendingUp, Shield, Play,
    Pause, Settings, BarChart3, Clock, ChevronRight, Eye
} from "lucide-react";
import { authFetch } from "@/lib/auth-client";
import { useBusiness } from "@/lib/business-context";

interface Rule {
    id: string; name: string; description: string; trigger: string;
    action: string; category: string; riskLevel: string; enabled: boolean;
}

interface UrgentAction {
    rule: string; entity: string; currentValue: string; threshold: string;
    suggestedAction: string; estimatedImpact: string; confidence: string; riskLevel: string;
}

interface AnalysisResult {
    urgentActions: UrgentAction[];
    bidAdjustments: { entity: string; currentBid: string; suggestedBid: string; reason: string; expectedImprovement: string }[];
    budgetRecommendations: { campaign: string; currentBudget: string; suggestedBudget: string; reason: string; expectedROI: string }[];
    abTestSuggestions: { campaign: string; testType: string; hypothesis: string; setup: string }[];
    weeklyForecast: { expectedSpend: string; expectedConversions: number; expectedCPA: string; expectedROAS: string; riskFactors: string[] };
    overallHealth: string;
    topPriority: string;
}

export default function AutoPilotPage() {
    const { activeBusiness } = useBusiness();
    const [rules, setRules] = useState<Rule[]>([]);
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [mode, setMode] = useState<"supervised" | "autonomous">("supervised");

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await authFetch("/api/auto-pilot");
            const data = await res.json();
            setRules(data.rules || []);
            setMode(data.mode || "supervised");
        } catch { /* noop */ } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const toggleRule = async (ruleId: string) => {
        setRules((prev) => prev.map((r) => r.id === ruleId ? { ...r, enabled: !r.enabled } : r));
        await authFetch("/api/auto-pilot", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "toggle-rule", ruleId, enabled: !rules.find((r) => r.id === ruleId)?.enabled }),
        });
    };

    const runAnalysis = async () => {
        setAnalyzing(true);
        setResult(null);
        try {
            const res = await authFetch("/api/auto-pilot", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "run-analysis",
                    enabledRules: rules.filter((r) => r.enabled).map((r) => r.name),
                    accountSummary: { business: activeBusiness?.name, industry: activeBusiness?.industry },
                }),
            });
            const data = await res.json();
            if (data.result) setResult(data.result);
        } catch { /* noop */ } finally { setAnalyzing(false); }
    };

    const riskColor = (risk: string) => {
        if (risk === "low") return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
        if (risk === "medium") return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300";
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
    };

    const healthColor = (h: string) => {
        if (h === "good") return "text-green-600";
        if (h === "fair") return "text-yellow-600";
        return "text-red-600";
    };

    const catIcon = (cat: string) => {
        if (cat === "keywords") return Target;
        if (cat === "bidding") return DollarSign;
        if (cat === "budget") return BarChart3;
        if (cat === "ads") return Eye;
        return Settings;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Bot className="w-7 h-7 text-purple-600" /> AI Auto-Pilot
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Autonomous ad management & optimization</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-1">
                        <button
                            onClick={() => setMode("supervised")}
                            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                                mode === "supervised" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300" : "text-gray-500"
                            }`}
                        >
                            <Shield className="w-3 h-3 inline mr-1" /> Supervised
                        </button>
                        <button
                            onClick={() => setMode("autonomous")}
                            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                                mode === "autonomous" ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300" : "text-gray-500"
                            }`}
                        >
                            <Bot className="w-3 h-3 inline mr-1" /> Autonomous
                        </button>
                    </div>
                    <button onClick={fetchData} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                        <RefreshCw className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    </button>
                </div>
            </div>

            {/* Mode Banner */}
            <div className={`rounded-xl p-4 border ${
                mode === "supervised"
                    ? "bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-800"
                    : "bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800"
            }`}>
                <div className="flex items-center gap-3">
                    {mode === "supervised" ? <Shield className="w-5 h-5 text-purple-600" /> : <Bot className="w-5 h-5 text-green-600" />}
                    <div>
                        <div className="font-medium text-gray-900 dark:text-white text-sm">
                            {mode === "supervised" ? "Supervised Mode" : "Autonomous Mode"}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                            {mode === "supervised"
                                ? "AI suggests optimizations. You review and approve each change."
                                : "AI automatically applies low-risk optimizations. Medium/high risk still need approval."}
                        </p>
                    </div>
                </div>
            </div>

            {/* Rules Grid */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Optimization Rules</h2>
                    <span className="text-sm text-gray-500">{rules.filter((r) => r.enabled).length}/{rules.length} active</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {rules.map((rule) => {
                        const Icon = catIcon(rule.category);
                        return (
                            <div key={rule.id} className={`bg-white dark:bg-gray-800 rounded-xl border p-4 transition-all ${
                                rule.enabled ? "border-purple-200 dark:border-purple-800" : "border-gray-200 dark:border-gray-700"
                            }`}>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3 flex-1">
                                        <div className={`p-2 rounded-lg ${rule.enabled ? "bg-purple-100 dark:bg-purple-900/30" : "bg-gray-100 dark:bg-gray-700"}`}>
                                            <Icon className={`w-4 h-4 ${rule.enabled ? "text-purple-600 dark:text-purple-400" : "text-gray-500"}`} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-medium text-sm text-gray-900 dark:text-white">{rule.name}</div>
                                            <p className="text-xs text-gray-500 mt-0.5">{rule.description}</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className={`px-2 py-0.5 text-xs rounded ${riskColor(rule.riskLevel)}`}>{rule.riskLevel} risk</span>
                                                <span className="text-xs text-gray-400">{rule.category}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => toggleRule(rule.id)}
                                        className={`ml-3 w-10 h-6 rounded-full transition-colors relative ${
                                            rule.enabled ? "bg-purple-600" : "bg-gray-300 dark:bg-gray-600"
                                        }`}
                                    >
                                        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                                            rule.enabled ? "translate-x-4.5 left-0" : "left-0.5"
                                        }`} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Run Analysis */}
            <div className="text-center">
                <button
                    onClick={runAnalysis}
                    disabled={analyzing}
                    className="px-8 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-xl text-sm font-medium inline-flex items-center gap-2 shadow-lg shadow-purple-200 dark:shadow-none"
                >
                    {analyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                    {analyzing ? "Running AI Analysis..." : "Run Full Analysis"}
                </button>
            </div>

            {/* Analysis Results */}
            {result && (
                <div className="space-y-6">
                    {/* Health & Priority */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 text-center">
                            <div className="text-sm text-gray-500 mb-1">Account Health</div>
                            <div className={`text-3xl font-bold capitalize ${healthColor(result.overallHealth)}`}>{result.overallHealth}</div>
                        </div>
                        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800 p-5">
                            <div className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-1 flex items-center gap-1">
                                <Zap className="w-4 h-4" /> Top Priority
                            </div>
                            <p className="text-sm text-purple-900 dark:text-purple-100">{result.topPriority}</p>
                        </div>
                    </div>

                    {/* Weekly Forecast */}
                    {result.weeklyForecast && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-blue-500" /> Weekly Forecast
                            </h3>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <div><div className="text-xs text-gray-500">Expected Spend</div><div className="text-lg font-bold text-gray-900 dark:text-white">{result.weeklyForecast.expectedSpend}</div></div>
                                <div><div className="text-xs text-gray-500">Est. Conversions</div><div className="text-lg font-bold text-green-600">{result.weeklyForecast.expectedConversions}</div></div>
                                <div><div className="text-xs text-gray-500">Expected CPA</div><div className="text-lg font-bold text-gray-900 dark:text-white">{result.weeklyForecast.expectedCPA}</div></div>
                                <div><div className="text-xs text-gray-500">Expected ROAS</div><div className="text-lg font-bold text-purple-600">{result.weeklyForecast.expectedROAS}</div></div>
                            </div>
                            {result.weeklyForecast.riskFactors?.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {result.weeklyForecast.riskFactors.map((r, i) => (
                                        <span key={i} className="px-2 py-1 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs rounded-lg">
                                            <AlertTriangle className="w-3 h-3 inline mr-1" />{r}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Urgent Actions */}
                    {result.urgentActions?.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-red-500" /> Urgent Actions ({result.urgentActions.length})
                            </h3>
                            <div className="space-y-3">
                                {result.urgentActions.map((a, i) => (
                                    <div key={i} className="p-4 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-800">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-medium text-sm text-gray-900 dark:text-white">{a.entity}</span>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-0.5 text-xs rounded ${riskColor(a.riskLevel)}`}>{a.riskLevel}</span>
                                                <span className="text-xs text-gray-500">{a.confidence} confidence</span>
                                            </div>
                                        </div>
                                        <div className="text-sm text-gray-700 dark:text-gray-300">{a.suggestedAction}</div>
                                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                            <span>Current: {a.currentValue}</span>
                                            <span>Threshold: {a.threshold}</span>
                                            <span className="text-green-600 font-medium">{a.estimatedImpact}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Bid Adjustments */}
                    {result.bidAdjustments?.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-green-500" /> Bid Adjustments
                            </h3>
                            <div className="space-y-2">
                                {result.bidAdjustments.map((b, i) => (
                                    <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                        <span className="font-medium text-sm text-gray-900 dark:text-white flex-1">{b.entity}</span>
                                        <span className="text-sm text-gray-500">{b.currentBid}</span>
                                        <ChevronRight className="w-4 h-4 text-gray-400" />
                                        <span className="text-sm font-bold text-green-600">{b.suggestedBid}</span>
                                        <span className="text-xs text-gray-500 w-32">{b.expectedImprovement}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Budget Recommendations */}
                    {result.budgetRecommendations?.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <BarChart3 className="w-4 h-4 text-blue-500" /> Budget Recommendations
                            </h3>
                            <div className="space-y-3">
                                {result.budgetRecommendations.map((br, i) => (
                                    <div key={i} className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-medium text-sm text-gray-900 dark:text-white">{br.campaign}</span>
                                            <span className="text-xs font-bold text-purple-600">ROI: {br.expectedROI}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm">
                                            <span className="text-gray-500">{br.currentBudget}</span>
                                            <ChevronRight className="w-3 h-3 text-gray-400" />
                                            <span className="font-bold text-green-600">{br.suggestedBudget}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">{br.reason}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* A/B Test Ideas */}
                    {result.abTestSuggestions?.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-orange-500" /> A/B Test Suggestions
                            </h3>
                            <div className="space-y-3">
                                {result.abTestSuggestions.map((t, i) => (
                                    <div key={i} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="px-2 py-0.5 text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 rounded">{t.testType}</span>
                                            <span className="font-medium text-sm text-gray-900 dark:text-white">{t.campaign}</span>
                                        </div>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">{t.hypothesis}</p>
                                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Setup: {t.setup}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
