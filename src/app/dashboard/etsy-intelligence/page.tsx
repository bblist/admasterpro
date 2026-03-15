"use client";

import { useState, useCallback } from "react";
import {
    Store, Loader2, Sparkles, TrendingUp, DollarSign, Tag, Star,
    Search, ArrowUpRight, BarChart3, Calendar, Target, Users,
    Eye, ShoppingBag, Zap, Award
} from "lucide-react";
import { authFetch } from "@/lib/auth-client";
import { useBusiness } from "@/lib/business-context";

interface NicheResult {
    nicheOverview: { demandLevel: string; competitionLevel: string; profitPotential: string; trendDirection: string; summary: string };
    pricingInsights: { averagePrice: string; priceRange: string; sweetSpot: string; premiumTier: string; strategy: string };
    topCompetitors: { shopName: string; estimatedSales: string; avgPrice: string; strength: string; weakness: string }[];
    seoTags: { primary: string[]; longTail: string[]; seasonal: string[]; avoid: string[] };
    listingTips: { tip: string; impact: string; effort: string }[];
    seasonalOpportunities: { event: string; timing: string; expectedDemand: string; tips: string }[];
    differentiators: string[];
    overallScore: number;
}

interface ListingOptResult {
    optimizedTitle: string;
    optimizedDescription: string;
    optimizedTags: string[];
    priceSuggestion: { recommended: string; reason: string };
    qualityScore: number;
    improvements: { area: string; current: string; suggestion: string; priority: string }[];
    photoTips: string[];
    seoNotes: string;
}

export default function EtsyIntelligencePage() {
    const { activeBusiness } = useBusiness();

    const [tab, setTab] = useState<"niche" | "listing">("niche");

    // Niche analysis
    const [niche, setNiche] = useState("");
    const [priceRange, setPriceRange] = useState("");
    const [analyzingNiche, setAnalyzingNiche] = useState(false);
    const [nicheResult, setNicheResult] = useState<NicheResult | null>(null);

    // Listing optimization
    const [listingTitle, setListingTitle] = useState("");
    const [listingDesc, setListingDesc] = useState("");
    const [listingTags, setListingTags] = useState("");
    const [listingPrice, setListingPrice] = useState("");
    const [optimizingListing, setOptimizingListing] = useState(false);
    const [listingResult, setListingResult] = useState<ListingOptResult | null>(null);

    const analyzeNiche = useCallback(async () => {
        if (!niche.trim()) return;
        setAnalyzingNiche(true);
        setNicheResult(null);
        try {
            const res = await authFetch("/api/etsy-intelligence", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "analyze-niche", niche, priceRange }),
            });
            const data = await res.json();
            if (data.result) setNicheResult(data.result);
        } catch { /* noop */ } finally { setAnalyzingNiche(false); }
    }, [niche, priceRange]);

    const optimizeListing = useCallback(async () => {
        if (!listingTitle.trim()) return;
        setOptimizingListing(true);
        setListingResult(null);
        try {
            const res = await authFetch("/api/etsy-intelligence", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "optimize-listing",
                    title: listingTitle,
                    description: listingDesc,
                    tags: listingTags,
                    price: listingPrice,
                }),
            });
            const data = await res.json();
            if (data.result) setListingResult(data.result);
        } catch { /* noop */ } finally { setOptimizingListing(false); }
    }, [listingTitle, listingDesc, listingTags, listingPrice]);

    const levelColor = (level: string) => {
        if (level === "high" || level === "growing") return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
        if (level === "medium" || level === "stable") return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300";
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
    };

    const priorityColor = (p: string) => {
        if (p === "high") return "text-red-600 dark:text-red-400";
        if (p === "medium") return "text-yellow-600 dark:text-yellow-400";
        return "text-gray-500";
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Store className="w-7 h-7 text-orange-500" /> Etsy Intelligence
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">AI-powered marketplace research & listing optimization</p>
            </div>

            {/* Tab Switch */}
            <div className="flex gap-2">
                <button
                    onClick={() => setTab("niche")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        tab === "niche" ? "bg-orange-500 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                    }`}
                >
                    <Search className="w-4 h-4 inline mr-1.5" /> Niche Research
                </button>
                <button
                    onClick={() => setTab("listing")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        tab === "listing" ? "bg-orange-500 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                    }`}
                >
                    <Tag className="w-4 h-4 inline mr-1.5" /> Listing Optimizer
                </button>
            </div>

            {/* Niche Research Tab */}
            {tab === "niche" && (
                <>
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Niche Analysis</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Niche / Product Type *</label>
                                <input type="text" value={niche} onChange={(e) => setNiche(e.target.value)}
                                    placeholder="e.g. Handmade candles, Vintage jewelry"
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price Range</label>
                                <input type="text" value={priceRange} onChange={(e) => setPriceRange(e.target.value)}
                                    placeholder="e.g. $20-$50"
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                            </div>
                        </div>
                        <button onClick={analyzeNiche} disabled={!niche.trim() || analyzingNiche}
                            className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium flex items-center gap-2">
                            {analyzingNiche ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                            {analyzingNiche ? "Analyzing..." : "Analyze Niche"}
                        </button>
                    </div>

                    {nicheResult && (
                        <div className="space-y-6">
                            {/* Overview Cards */}
                            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                                {[
                                    { label: "Demand", value: nicheResult.nicheOverview.demandLevel },
                                    { label: "Competition", value: nicheResult.nicheOverview.competitionLevel },
                                    { label: "Profit Potential", value: nicheResult.nicheOverview.profitPotential },
                                    { label: "Trend", value: nicheResult.nicheOverview.trendDirection },
                                ].map((c) => (
                                    <div key={c.label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center">
                                        <div className="text-xs text-gray-500 mb-1">{c.label}</div>
                                        <span className={`px-3 py-1 text-sm rounded-lg font-medium ${levelColor(c.value)}`}>{c.value}</span>
                                    </div>
                                ))}
                                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center">
                                    <div className="text-xs text-gray-500 mb-1">Score</div>
                                    <div className={`text-2xl font-bold ${nicheResult.overallScore >= 70 ? "text-green-600" : nicheResult.overallScore >= 50 ? "text-yellow-600" : "text-red-600"}`}>
                                        {nicheResult.overallScore}
                                    </div>
                                </div>
                            </div>

                            <p className="text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                                {nicheResult.nicheOverview.summary}
                            </p>

                            {/* Pricing */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                    <DollarSign className="w-4 h-4 text-green-500" /> Pricing Insights
                                </h3>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
                                    <div><div className="text-xs text-gray-500">Average</div><div className="font-bold text-gray-900 dark:text-white">{nicheResult.pricingInsights.averagePrice}</div></div>
                                    <div><div className="text-xs text-gray-500">Range</div><div className="font-bold text-gray-900 dark:text-white">{nicheResult.pricingInsights.priceRange}</div></div>
                                    <div><div className="text-xs text-gray-500">Sweet Spot</div><div className="font-bold text-green-600">{nicheResult.pricingInsights.sweetSpot}</div></div>
                                    <div><div className="text-xs text-gray-500">Premium</div><div className="font-bold text-purple-600">{nicheResult.pricingInsights.premiumTier}</div></div>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{nicheResult.pricingInsights.strategy}</p>
                            </div>

                            {/* Competitors */}
                            {nicheResult.topCompetitors?.length > 0 && (
                                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                        <Users className="w-4 h-4 text-blue-500" /> Top Competitors
                                    </h3>
                                    <div className="space-y-3">
                                        {nicheResult.topCompetitors.map((c, i) => (
                                            <div key={i} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-medium text-gray-900 dark:text-white">{c.shopName}</span>
                                                    <div className="flex gap-3 text-xs text-gray-500">
                                                        <span>Sales: {c.estimatedSales}</span>
                                                        <span>Avg: {c.avgPrice}</span>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                                                    <div className="text-green-600 dark:text-green-400">+ {c.strength}</div>
                                                    <div className="text-red-500 dark:text-red-400">- {c.weakness}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* SEO Tags */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                    <Tag className="w-4 h-4 text-purple-500" /> SEO Tags
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {Object.entries(nicheResult.seoTags || {}).map(([type, tags]) => (
                                        <div key={type}>
                                            <div className="text-xs font-medium text-gray-500 uppercase mb-2">{type}</div>
                                            <div className="flex flex-wrap gap-1.5">
                                                {(tags as string[])?.map((t, i) => (
                                                    <span key={i} className={`px-2 py-0.5 text-xs rounded ${
                                                        type === "avoid" ? "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300 line-through" :
                                                        type === "seasonal" ? "bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-300" :
                                                        "bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300"
                                                    }`}>{t}</span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Seasonal Opportunities */}
                            {nicheResult.seasonalOpportunities?.length > 0 && (
                                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-orange-500" /> Seasonal Opportunities
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {nicheResult.seasonalOpportunities.map((s, i) => (
                                            <div key={i} className="p-3 bg-orange-50 dark:bg-orange-900/10 rounded-lg border border-orange-100 dark:border-orange-800">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-medium text-sm text-gray-900 dark:text-white">{s.event}</span>
                                                    <span className="text-green-600 text-xs font-bold">{s.expectedDemand}</span>
                                                </div>
                                                <div className="text-xs text-gray-500">Timing: {s.timing}</div>
                                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{s.tips}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Differentiators */}
                            {nicheResult.differentiators?.length > 0 && (
                                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-5 border border-green-100 dark:border-green-800">
                                    <h3 className="font-medium text-green-800 dark:text-green-200 mb-3 flex items-center gap-2">
                                        <Zap className="w-4 h-4" /> How to Stand Out
                                    </h3>
                                    <ul className="space-y-1.5">
                                        {nicheResult.differentiators.map((d, i) => (
                                            <li key={i} className="text-sm text-green-700 dark:text-green-300 flex items-start gap-2">
                                                <ArrowUpRight className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" /> {d}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* Listing Optimizer Tab */}
            {tab === "listing" && (
                <>
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Listing Optimizer</h2>
                        <div className="space-y-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Listing Title *</label>
                                <input type="text" value={listingTitle} onChange={(e) => setListingTitle(e.target.value)}
                                    placeholder="Your current Etsy listing title"
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                                <textarea value={listingDesc} onChange={(e) => setListingDesc(e.target.value)}
                                    placeholder="Your current listing description"
                                    rows={3}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tags (comma-separated)</label>
                                    <input type="text" value={listingTags} onChange={(e) => setListingTags(e.target.value)}
                                        placeholder="tag1, tag2, tag3"
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Price</label>
                                    <input type="text" value={listingPrice} onChange={(e) => setListingPrice(e.target.value)}
                                        placeholder="$25.00"
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                                </div>
                            </div>
                        </div>
                        <button onClick={optimizeListing} disabled={!listingTitle.trim() || optimizingListing}
                            className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium flex items-center gap-2">
                            {optimizingListing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                            {optimizingListing ? "Optimizing..." : "Optimize Listing"}
                        </button>
                    </div>

                    {listingResult && (
                        <div className="space-y-6">
                            {/* Score */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-center">
                                <div className="text-sm text-gray-500 mb-1">Quality Score</div>
                                <div className={`text-4xl font-bold ${
                                    listingResult.qualityScore >= 80 ? "text-green-600" :
                                    listingResult.qualityScore >= 60 ? "text-yellow-600" : "text-red-600"
                                }`}>{listingResult.qualityScore}/100</div>
                            </div>

                            {/* Optimized Title */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Optimized Title</h3>
                                <p className="text-gray-800 dark:text-gray-200 font-medium">{listingResult.optimizedTitle}</p>
                                <div className="text-xs text-gray-400 mt-1">{listingResult.optimizedTitle?.length || 0}/140 chars</div>
                            </div>

                            {/* Tags */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Optimized Tags</h3>
                                <div className="flex flex-wrap gap-2">
                                    {listingResult.optimizedTags?.map((t, i) => (
                                        <span key={i} className="px-3 py-1 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm rounded-lg">{t}</span>
                                    ))}
                                </div>
                            </div>

                            {/* Price Suggestion */}
                            {listingResult.priceSuggestion && (
                                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-5 border border-green-100 dark:border-green-800">
                                    <div className="flex items-center gap-3">
                                        <DollarSign className="w-5 h-5 text-green-600" />
                                        <div>
                                            <div className="font-bold text-green-800 dark:text-green-200 text-lg">{listingResult.priceSuggestion.recommended}</div>
                                            <p className="text-sm text-green-700 dark:text-green-300">{listingResult.priceSuggestion.reason}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Improvements */}
                            {listingResult.improvements?.length > 0 && (
                                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Improvements</h3>
                                    <div className="space-y-3">
                                        {listingResult.improvements.map((imp, i) => (
                                            <div key={i} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`text-xs font-bold uppercase ${priorityColor(imp.priority)}`}>{imp.priority}</span>
                                                    <span className="text-sm font-medium text-gray-900 dark:text-white">{imp.area}</span>
                                                </div>
                                                <div className="text-xs text-gray-500">Current: {imp.current}</div>
                                                <div className="text-xs text-green-600 dark:text-green-400 mt-1">Suggestion: {imp.suggestion}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Photo Tips */}
                            {listingResult.photoTips?.length > 0 && (
                                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Photo Tips</h3>
                                    <ul className="space-y-1.5">
                                        {listingResult.photoTips.map((t, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                                                <Eye className="w-3.5 h-3.5 mt-0.5 text-blue-500 flex-shrink-0" /> {t}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
