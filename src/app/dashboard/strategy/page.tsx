"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Target, Zap, MapPin, Star, Shield, TrendingUp, AlertTriangle,
    CheckCircle2, Info, Globe, ArrowRight, Lightbulb, BarChart3,
    ShoppingBag, Youtube, Search, Eye, RefreshCw, Brain,
    ChevronDown, ChevronUp, Loader2, Sparkles,
} from "lucide-react";
import { useBusiness } from "@/lib/business-context";
import { useTranslation } from "@/i18n/context";
import { authFetch } from "@/lib/auth-client";
import {
    inferBusinessType,
    getAdStrategy,
    type BusinessSignals,
    type BusinessStrategy,
    type AdChannel,
    type LocalImportance,
} from "@/lib/ad-strategy";

// ─── Channel Icon Map ──────────────────────────────────────────────────────

const CHANNEL_ICONS: Record<AdChannel | string, React.ComponentType<{ className?: string }>> = {
    search: Search,
    display: Eye,
    shopping: ShoppingBag,
    video: Youtube,
    pmax: Zap,
    local_services: MapPin,
    discovery: Globe,
    remarketing: RefreshCw,
};

const CHANNEL_COLORS: Record<string, string> = {
    primary: "border-emerald-500 bg-emerald-50",
    secondary: "border-blue-500 bg-blue-50",
    optional: "border-gray-300 bg-gray-50",
};

const PRIORITY_BADGES: Record<string, { bg: string; text: string }> = {
    primary: { bg: "bg-emerald-100", text: "text-emerald-700" },
    secondary: { bg: "bg-blue-100", text: "text-blue-700" },
    optional: { bg: "bg-gray-100", text: "text-gray-600" },
};

const CONFIDENCE_CONFIG: Record<string, { color: string; bgColor: string; label: string }> = {
    high: { color: "text-emerald-700", bgColor: "bg-emerald-100", label: "High Confidence" },
    medium: { color: "text-amber-700", bgColor: "bg-amber-100", label: "Medium Confidence" },
    low: { color: "text-red-700", bgColor: "bg-red-100", label: "Low Confidence" },
};

const LOCAL_IMPORTANCE_CONFIG: Record<LocalImportance, { color: string; bgColor: string; icon: React.ComponentType<{ className?: string }> }> = {
    critical: { color: "text-red-700", bgColor: "bg-red-100", icon: AlertTriangle },
    high: { color: "text-orange-700", bgColor: "bg-orange-100", icon: TrendingUp },
    moderate: { color: "text-amber-700", bgColor: "bg-amber-100", icon: Info },
    low: { color: "text-blue-700", bgColor: "bg-blue-100", icon: ArrowRight },
    none: { color: "text-gray-600", bgColor: "bg-gray-100", icon: Globe },
};

export default function StrategyAdvisorPage() {
    const { t } = useTranslation();
    const { activeBusiness } = useBusiness();
    void t;

    const [strategy, setStrategy] = useState<BusinessStrategy | null>(null);
    const [inferredIndustry, setInferredIndustry] = useState<string>("");
    const [confidence, setConfidence] = useState<"high" | "medium" | "low">("low");
    const [reasoning, setReasoning] = useState<string[]>([]);
    const [allScores, setAllScores] = useState<{ industry: string; score: number; signals: string[] }[]>([]);
    const [loading, setLoading] = useState(true);
    const [showSignals, setShowSignals] = useState(false);
    const [showScores, setShowScores] = useState(false);
    const [showTips, setShowTips] = useState(true);
    const [kbContent, setKbContent] = useState("");

    const analyze = useCallback(async () => {
        setLoading(true);

        // Fetch KB content for analysis
        let kbText = kbContent;
        if (!kbText && activeBusiness?.id) {
            try {
                const res = await authFetch(`/api/knowledge-base?businessId=${activeBusiness.id}`);
                if (res.ok) {
                    const data = await res.json();
                    const items = data.items || [];
                    kbText = items.map((item: { title?: string; content?: string }) =>
                        `${item.title || ""}\n${item.content || ""}`
                    ).join("\n\n").slice(0, 10000);
                    setKbContent(kbText);
                }
            } catch { /* ignore */ }
        }

        const signals: BusinessSignals = {
            industryDropdown: activeBusiness?.industry || undefined,
            businessName: activeBusiness?.name || undefined,
            services: activeBusiness?.services || undefined,
            kbContent: kbText || undefined,
            websiteUrl: activeBusiness?.website || activeBusiness?.url || undefined,
            location: activeBusiness?.location || undefined,
        };

        const result = inferBusinessType(signals);
        setStrategy(result.strategy);
        setInferredIndustry(result.inferredIndustry);
        setConfidence(result.confidence);
        setReasoning(result.reasoning);
        setAllScores(result.allScores);
        setLoading(false);
    }, [activeBusiness, kbContent]);

    useEffect(() => {
        analyze();
    }, [analyze]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center space-y-4">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
                    <p className="text-gray-600">Analyzing your business signals...</p>
                </div>
            </div>
        );
    }

    if (!strategy) return null;

    const confConfig = CONFIDENCE_CONFIG[confidence];
    const localConfig = LOCAL_IMPORTANCE_CONFIG[strategy.localImportance];
    const LocalIcon = localConfig.icon;

    // Budget split for pie-chart-like display
    const totalBudget = strategy.channels.reduce((sum, c) => sum + c.budgetPct, 0);

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* ── Header ── */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Brain className="w-7 h-7 text-blue-600" />
                        Strategy Advisor
                    </h1>
                    <p className="text-gray-500 mt-1">
                        AI-recommended ad channels and budget allocation for <strong>{activeBusiness?.name || "your business"}</strong>
                    </p>
                </div>
                <button
                    onClick={analyze}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 text-sm font-medium"
                >
                    <RefreshCw className="w-4 h-4" />
                    Re-analyze
                </button>
            </div>

            {/* ── Business Type Inference Card ── */}
            <div className="bg-white rounded-xl border p-6 space-y-4">
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h2 className="text-lg font-semibold text-gray-900">
                                {strategy.businessType}
                            </h2>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${confConfig.bgColor} ${confConfig.color}`}>
                                {confConfig.label}
                            </span>
                        </div>
                        <p className="text-sm text-gray-500">
                            Industry: {strategy.industry} • Inferred as: <strong>{inferredIndustry}</strong>
                        </p>
                    </div>
                    <Target className="w-10 h-10 text-blue-500 opacity-50" />
                </div>

                {/* Inference Signals */}
                <button
                    onClick={() => setShowSignals(!showSignals)}
                    className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                    {showSignals ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    {showSignals ? "Hide" : "Show"} Inference Signals ({reasoning.length})
                </button>

                {showSignals && (
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                        {reasoning.map((r, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                <span className="text-gray-700">{r}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* All Scores — transparency */}
                {allScores.length > 1 && (
                    <>
                        <button
                            onClick={() => setShowScores(!showScores)}
                            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 font-medium"
                        >
                            {showScores ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            {showScores ? "Hide" : "Show"} All Industry Scores
                        </button>

                        {showScores && (
                            <div className="space-y-2">
                                {allScores.map((s) => {
                                    const maxScore = allScores[0].score;
                                    const pct = maxScore > 0 ? (s.score / maxScore) * 100 : 0;
                                    return (
                                        <div key={s.industry} className="space-y-1">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className={`font-medium ${s.industry === inferredIndustry ? "text-blue-700" : "text-gray-600"}`}>
                                                    {s.industry} {s.industry === inferredIndustry && "✓"}
                                                </span>
                                                <span className="text-gray-500">{s.score} pts</span>
                                            </div>
                                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all ${s.industry === inferredIndustry ? "bg-blue-500" : "bg-gray-300"}`}
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}

                {confidence === "low" && (
                    <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-amber-800">
                            <strong>Low confidence.</strong> Add more content to your Knowledge Base (website crawl, services, pricing) so we can give more accurate recommendations.
                        </div>
                    </div>
                )}
            </div>

            {/* ── Local Presence Section ── */}
            <div className="bg-white rounded-xl border p-6 space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    Local Presence Assessment
                </h2>

                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${localConfig.bgColor} ${localConfig.color} font-medium text-sm`}>
                    <LocalIcon className="w-4 h-4" />
                    Local Importance: {strategy.localImportance.charAt(0).toUpperCase() + strategy.localImportance.slice(1)}
                </div>

                <p className="text-gray-600 text-sm">{strategy.localReasoning}</p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <LocalPresenceCard
                        title="Google Maps"
                        matters={strategy.mapsMatters}
                        description={strategy.mapsMatters
                            ? "Ranking on Maps is important for this business. Optimise your Google Business Profile listing."
                            : "Maps ranking is not a priority for this business type."
                        }
                    />
                    <LocalPresenceCard
                        title="Reviews"
                        matters={strategy.reviewsMatter}
                        description={strategy.reviewsMatter
                            ? "Reviews significantly impact trust and local ranking. Actively collect and respond to reviews."
                            : "Reviews are less critical but still helpful for general trust."
                        }
                    />
                    <LocalPresenceCard
                        title="Google Business Profile"
                        matters={strategy.gbpMatters}
                        description={strategy.gbpMatters
                            ? "GBP is essential. Claim it, add photos, services, hours, and post updates weekly."
                            : "GBP is not critical for this business type but can still help with brand visibility."
                        }
                    />
                </div>
            </div>

            {/* ── Recommended Channels ── */}
            <div className="bg-white rounded-xl border p-6 space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    Recommended Ad Channels
                </h2>
                <p className="text-sm text-gray-500">
                    Suggested budget allocation based on your business type. Adjust based on your actual results.
                </p>

                {/* Budget Bar */}
                <div className="space-y-2">
                    <div className="h-8 flex rounded-lg overflow-hidden border">
                        {strategy.channels.map((ch) => {
                            const pct = totalBudget > 0 ? (ch.budgetPct / totalBudget) * 100 : 0;
                            const color = ch.priority === "primary" ? "bg-emerald-500" :
                                ch.priority === "secondary" ? "bg-blue-400" : "bg-gray-300";
                            return (
                                <div
                                    key={ch.channel}
                                    className={`${color} flex items-center justify-center text-xs font-medium text-white`}
                                    style={{ width: `${pct}%` }}
                                    title={`${ch.label}: ${ch.budgetPct}%`}
                                >
                                    {pct >= 12 ? `${ch.budgetPct}%` : ""}
                                </div>
                            );
                        })}
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-emerald-500 rounded" /> Primary</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-400 rounded" /> Secondary</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-gray-300 rounded" /> Optional</span>
                    </div>
                </div>

                {/* Channel Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {strategy.channels.map((ch) => {
                        const Icon = CHANNEL_ICONS[ch.channel] || Zap;
                        const badge = PRIORITY_BADGES[ch.priority];
                        const borderColor = CHANNEL_COLORS[ch.priority];
                        return (
                            <div key={ch.channel} className={`border-l-4 rounded-lg p-4 ${borderColor}`}>
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <Icon className="w-5 h-5 text-gray-700" />
                                        <h3 className="font-semibold text-gray-900">{ch.label}</h3>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${badge.bg} ${badge.text}`}>
                                            {ch.priority}
                                        </span>
                                        <span className="text-sm font-bold text-gray-900">{ch.budgetPct}%</span>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-600">{ch.reason}</p>
                            </div>
                        );
                    })}
                </div>

                {/* Channels to Avoid */}
                {strategy.avoidChannels.length > 0 && (
                    <div className="mt-4 space-y-2">
                        <h3 className="text-sm font-semibold text-red-700 flex items-center gap-1.5">
                            <Shield className="w-4 h-4" />
                            Channels to Avoid
                        </h3>
                        {strategy.avoidChannels.map((ch) => (
                            <div key={ch.channel} className="flex items-start gap-2 bg-red-50 rounded-lg p-3 text-sm">
                                <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                                <span className="text-red-800">
                                    <strong>{ch.channel}:</strong> {ch.reason}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Performance Max ── */}
            <div className="bg-white rounded-xl border p-6 space-y-3">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-purple-600" />
                    Performance Max Assessment
                </h2>
                <p className="text-gray-700">{strategy.pMaxRecommendation}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* ── Split Test Ideas ── */}
                <div className="bg-white rounded-xl border p-6 space-y-3">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-amber-500" />
                        Split Test Ideas
                    </h2>
                    <ul className="space-y-2">
                        {strategy.splitTestSuggestions.map((s, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                <span className="text-amber-500 font-bold mt-0.5">→</span>
                                {s}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* ── Pro Tips ── */}
                <div className="bg-white rounded-xl border p-6 space-y-3">
                    <button
                        onClick={() => setShowTips(!showTips)}
                        className="flex items-center gap-2 text-lg font-semibold text-gray-900 w-full text-left"
                    >
                        <Lightbulb className="w-5 h-5 text-yellow-500" />
                        Pro Tips for {strategy.businessType}
                        {showTips ? <ChevronUp className="w-4 h-4 ml-auto text-gray-400" /> : <ChevronDown className="w-4 h-4 ml-auto text-gray-400" />}
                    </button>
                    {showTips && (
                        <ul className="space-y-2">
                            {strategy.tips.map((tip, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                    {tip}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {/* ── CTA ── */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border p-6 text-center space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">Want personalized advice?</h3>
                <p className="text-gray-600 text-sm">
                    Ask the AI assistant about your specific situation — it already knows your business type, channels, and strategy recommendations.
                </p>
                <a
                    href="/dashboard/chat?intent=ad_strategy"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm"
                >
                    <Brain className="w-4 h-4" />
                    Ask AI About My Strategy
                </a>
            </div>
        </div>
    );
}

function LocalPresenceCard({ title, matters, description }: { title: string; matters: boolean; description: string }) {
    return (
        <div className={`rounded-lg border p-4 ${matters ? "border-emerald-200 bg-emerald-50" : "border-gray-200 bg-gray-50"}`}>
            <div className="flex items-center gap-2 mb-2">
                {matters ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                    <Info className="w-5 h-5 text-gray-400" />
                )}
                <h3 className={`font-semibold text-sm ${matters ? "text-emerald-800" : "text-gray-600"}`}>{title}</h3>
            </div>
            <p className="text-xs text-gray-600">{description}</p>
        </div>
    );
}
