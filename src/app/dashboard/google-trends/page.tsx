"use client";

import { useState, useCallback } from "react";
import {
    TrendingUp, Loader2, Search, Sparkles, ArrowUpRight, ArrowDownRight,
    Globe, Calendar, Target, BarChart3, Zap, Lightbulb, MapPin,
    Clock, ChevronDown, ChevronUp
} from "lucide-react";
import { authFetch } from "@/lib/auth-client";
import { useBusiness } from "@/lib/business-context";

interface TrendTopic { topic: string; trend: string; volume: string; seasonality: string; opportunity: string }
interface SeasonalPred { month: string; expectedDemand: string; recommendation: string }
interface RisingKw { keyword: string; growthRate: string; competitionLevel: string; suggestedBid: string }
interface DecliningKw { keyword: string; declineRate: string; recommendation: string }
interface RegionalInsight { region: string; interest: string; recommendation: string }
interface TimingRec { action: string; timing: string; reason: string }

interface TrendResult {
    trendingTopics: TrendTopic[];
    seasonalPredictions: SeasonalPred[];
    risingKeywords: RisingKw[];
    decliningKeywords: DecliningKw[];
    regionalInsights: RegionalInsight[];
    campaignTimingRecommendations: TimingRec[];
    overallOutlook: string;
    topOpportunity: string;
}

interface OpportunityResult {
    opportunities: { keyword: string; monthlySearches: string; competition: string; estimatedCpc: string; relevanceScore: number; reason: string }[];
    longTailGems: string[];
    negativeKeywordSuggestions: string[];
    contentIdeas: { title: string; targetKeywords: string[]; estimatedTraffic: string }[];
    quickWins: string[];
}

export default function GoogleTrendsPage() {
    const { activeBusiness } = useBusiness();
    const [keywords, setKeywords] = useState("");
    const [industry, setIndustry] = useState("");
    const [region, setRegion] = useState("");

    const [analyzing, setAnalyzing] = useState(false);
    const [trendResult, setTrendResult] = useState<TrendResult | null>(null);

    const [discovering, setDiscovering] = useState(false);
    const [oppResult, setOppResult] = useState<OpportunityResult | null>(null);

    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        trending: true, seasonal: true, rising: true, declining: true, regional: true, timing: true,
    });

    const toggle = (key: string) => setExpandedSections((p) => ({ ...p, [key]: !p[key] }));

    const analyzeTrends = useCallback(async () => {
        setAnalyzing(true);
        setTrendResult(null);
        try {
            const res = await authFetch("/api/google-trends", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "analyze-trends",
                    keywords: keywords || activeBusiness?.industry,
                    industry: industry || activeBusiness?.industry,
                    region,
                }),
            });
            const data = await res.json();
            if (data.result) setTrendResult(data.result);
        } catch { /* noop */ } finally { setAnalyzing(false); }
    }, [keywords, industry, region, activeBusiness]);

    const discoverOpportunities = useCallback(async () => {
        setDiscovering(true);
        setOppResult(null);
        try {
            const res = await authFetch("/api/google-trends", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "discover-opportunities",
                    businessDescription: activeBusiness?.name || "",
                    currentKeywords: keywords,
                }),
            });
            const data = await res.json();
            if (data.result) setOppResult(data.result);
        } catch { /* noop */ } finally { setDiscovering(false); }
    }, [keywords, activeBusiness]);

    const trendIcon = (trend: string) => {
        if (trend === "rising") return <ArrowUpRight className="w-3.5 h-3.5 text-green-500" />;
        if (trend === "declining") return <ArrowDownRight className="w-3.5 h-3.5 text-red-500" />;
        return <BarChart3 className="w-3.5 h-3.5 text-yellow-500" />;
    };

    const demandColor = (demand: string) => {
        if (demand === "high") return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
        if (demand === "medium") return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300";
        return "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300";
    };

    const SectionHeader = ({ id, title, icon: Icon }: { id: string; title: string; icon: typeof TrendingUp }) => (
        <button onClick={() => toggle(id)} className="flex items-center justify-between w-full py-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Icon className="w-5 h-5 text-blue-500" /> {title}
            </h3>
            {expandedSections[id] ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <TrendingUp className="w-7 h-7 text-blue-600" /> Market Trends
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">AI-powered trend analysis & keyword opportunities</p>
            </div>

            {/* Search Inputs */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Keywords / Topics</label>
                        <input
                            type="text"
                            value={keywords}
                            onChange={(e) => setKeywords(e.target.value)}
                            placeholder="e.g. yoga mats, home fitness"
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Industry</label>
                        <input
                            type="text"
                            value={industry}
                            onChange={(e) => setIndustry(e.target.value)}
                            placeholder="e.g. Health & Fitness"
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Region</label>
                        <input
                            type="text"
                            value={region}
                            onChange={(e) => setRegion(e.target.value)}
                            placeholder="e.g. US, Europe, Global"
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        />
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={analyzeTrends}
                        disabled={analyzing}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium flex items-center gap-2"
                    >
                        {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
                        {analyzing ? "Analyzing..." : "Analyze Trends"}
                    </button>
                    <button
                        onClick={discoverOpportunities}
                        disabled={discovering}
                        className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium flex items-center gap-2"
                    >
                        {discovering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        {discovering ? "Discovering..." : "Discover Opportunities"}
                    </button>
                </div>
            </div>

            {/* Trend Results */}
            {trendResult && (
                <div className="space-y-4">
                    {/* Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-5 border border-blue-100 dark:border-blue-800">
                            <div className="text-sm font-medium text-blue-700 dark:text-blue-300">Overall Outlook</div>
                            <p className="text-sm text-blue-900 dark:text-blue-100 mt-1">{trendResult.overallOutlook}</p>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-5 border border-green-100 dark:border-green-800">
                            <div className="text-sm font-medium text-green-700 dark:text-green-300 flex items-center gap-1">
                                <Zap className="w-4 h-4" /> Top Opportunity
                            </div>
                            <p className="text-sm text-green-900 dark:text-green-100 mt-1">{trendResult.topOpportunity}</p>
                        </div>
                    </div>

                    {/* Trending Topics */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-6">
                        <SectionHeader id="trending" title="Trending Topics" icon={TrendingUp} />
                        {expandedSections.trending && (
                            <div className="pb-5 space-y-2">
                                {trendResult.trendingTopics?.map((t, i) => (
                                    <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                        {trendIcon(t.trend)}
                                        <div className="flex-1">
                                            <div className="font-medium text-sm text-gray-900 dark:text-white">{t.topic}</div>
                                            <div className="text-xs text-gray-500">{t.opportunity}</div>
                                        </div>
                                        <span className={`px-2 py-0.5 text-xs rounded ${demandColor(t.volume)}`}>{t.volume}</span>
                                        <span className="text-xs text-gray-400">{t.seasonality}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Rising Keywords */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-6">
                        <SectionHeader id="rising" title="Rising Keywords" icon={ArrowUpRight} />
                        {expandedSections.rising && (
                            <div className="pb-5 grid grid-cols-1 md:grid-cols-2 gap-3">
                                {trendResult.risingKeywords?.map((kw, i) => (
                                    <div key={i} className="p-3 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-100 dark:border-green-800">
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium text-sm text-gray-900 dark:text-white">{kw.keyword}</span>
                                            <span className="text-green-600 font-bold text-sm">{kw.growthRate}</span>
                                        </div>
                                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                            <span>Competition: {kw.competitionLevel}</span>
                                            <span>Bid: {kw.suggestedBid}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Declining Keywords */}
                    {trendResult.decliningKeywords?.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-6">
                            <SectionHeader id="declining" title="Declining Keywords" icon={ArrowDownRight} />
                            {expandedSections.declining && (
                                <div className="pb-5 space-y-2">
                                    {trendResult.decliningKeywords.map((kw, i) => (
                                        <div key={i} className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/10 rounded-lg">
                                            <ArrowDownRight className="w-4 h-4 text-red-500" />
                                            <div className="flex-1">
                                                <span className="text-sm font-medium text-gray-900 dark:text-white">{kw.keyword}</span>
                                                <span className="text-red-600 text-xs ml-2">{kw.declineRate}</span>
                                            </div>
                                            <span className="text-xs text-gray-500">{kw.recommendation}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Seasonal Predictions */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-6">
                        <SectionHeader id="seasonal" title="Seasonal Predictions" icon={Calendar} />
                        {expandedSections.seasonal && (
                            <div className="pb-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                {trendResult.seasonalPredictions?.map((sp, i) => (
                                    <div key={i} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                        <div className="text-xs font-medium text-gray-500">{sp.month}</div>
                                        <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded ${demandColor(sp.expectedDemand)}`}>
                                            {sp.expectedDemand}
                                        </span>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{sp.recommendation}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Regional Insights */}
                    {trendResult.regionalInsights?.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-6">
                            <SectionHeader id="regional" title="Regional Insights" icon={MapPin} />
                            {expandedSections.regional && (
                                <div className="pb-5 space-y-2">
                                    {trendResult.regionalInsights.map((r, i) => (
                                        <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                            <Globe className="w-4 h-4 text-blue-500" />
                                            <span className="font-medium text-sm text-gray-900 dark:text-white w-32">{r.region}</span>
                                            <span className={`px-2 py-0.5 text-xs rounded ${demandColor(r.interest)}`}>{r.interest}</span>
                                            <span className="text-xs text-gray-500 flex-1">{r.recommendation}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Timing Recommendations */}
                    {trendResult.campaignTimingRecommendations?.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-6">
                            <SectionHeader id="timing" title="Campaign Timing" icon={Clock} />
                            {expandedSections.timing && (
                                <div className="pb-5 space-y-2">
                                    {trendResult.campaignTimingRecommendations.map((t, i) => (
                                        <div key={i} className="p-3 bg-purple-50 dark:bg-purple-900/10 rounded-lg border border-purple-100 dark:border-purple-800">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Clock className="w-3.5 h-3.5 text-purple-500" />
                                                <span className="font-medium text-sm text-gray-900 dark:text-white">{t.action}</span>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-gray-500 ml-5">
                                                <span>When: {t.timing}</span>
                                                <span>Why: {t.reason}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Opportunity Discovery Results */}
            {oppResult && (
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-500" /> Discovered Opportunities
                    </h2>

                    {/* Quick Wins */}
                    {oppResult.quickWins?.length > 0 && (
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-5 border border-green-100 dark:border-green-800">
                            <h3 className="font-medium text-green-800 dark:text-green-200 mb-3 flex items-center gap-2">
                                <Zap className="w-4 h-4" /> Quick Wins
                            </h3>
                            <ul className="space-y-1.5">
                                {oppResult.quickWins.map((w, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-green-700 dark:text-green-300">
                                        <ArrowUpRight className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" /> {w}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Keyword Opportunities */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-700">
                                    <th className="text-left py-2 px-3 text-gray-500 font-medium">Keyword</th>
                                    <th className="text-left py-2 px-3 text-gray-500 font-medium">Volume</th>
                                    <th className="text-left py-2 px-3 text-gray-500 font-medium">Competition</th>
                                    <th className="text-left py-2 px-3 text-gray-500 font-medium">Est. CPC</th>
                                    <th className="text-left py-2 px-3 text-gray-500 font-medium">Relevance</th>
                                    <th className="text-left py-2 px-3 text-gray-500 font-medium">Reason</th>
                                </tr>
                            </thead>
                            <tbody>
                                {oppResult.opportunities?.map((o, i) => (
                                    <tr key={i} className="border-b border-gray-100 dark:border-gray-800">
                                        <td className="py-2 px-3 font-medium text-gray-900 dark:text-white">{o.keyword}</td>
                                        <td className="py-2 px-3 text-gray-600 dark:text-gray-400">{o.monthlySearches}</td>
                                        <td className="py-2 px-3">
                                            <span className={`px-2 py-0.5 text-xs rounded ${demandColor(o.competition)}`}>{o.competition}</span>
                                        </td>
                                        <td className="py-2 px-3 text-gray-600 dark:text-gray-400">{o.estimatedCpc}</td>
                                        <td className="py-2 px-3">
                                            <div className="flex items-center gap-1">
                                                <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                    <div className="h-full bg-purple-500 rounded-full" style={{ width: `${(o.relevanceScore / 10) * 100}%` }} />
                                                </div>
                                                <span className="text-xs text-gray-500">{o.relevanceScore}/10</span>
                                            </div>
                                        </td>
                                        <td className="py-2 px-3 text-xs text-gray-500">{o.reason}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Long-tail Gems */}
                    {oppResult.longTailGems?.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                            <h3 className="font-medium text-gray-900 dark:text-white mb-3">Long-tail Gems</h3>
                            <div className="flex flex-wrap gap-2">
                                {oppResult.longTailGems.map((lt, i) => (
                                    <span key={i} className="px-3 py-1 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm rounded-lg">
                                        {lt}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Content Ideas */}
                    {oppResult.contentIdeas?.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                            <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                <Lightbulb className="w-4 h-4 text-yellow-500" /> Content Ideas
                            </h3>
                            <div className="space-y-3">
                                {oppResult.contentIdeas.map((ci, i) => (
                                    <div key={i} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                        <div className="font-medium text-sm text-gray-900 dark:text-white">{ci.title}</div>
                                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                            <span>Traffic: {ci.estimatedTraffic}</span>
                                            <span>Keywords: {ci.targetKeywords?.join(", ")}</span>
                                        </div>
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
