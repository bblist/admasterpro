"use client";

import { useState } from "react";
import {
    Search, Loader2, Sparkles, TrendingUp, TrendingDown, DollarSign,
    Target, Copy, CheckCircle2, ArrowRight, Lightbulb, Shield, Users,
    MapPin, HelpCircle, Minus, BarChart3, Zap, RefreshCw, Download,
    ChevronDown, ChevronUp, Star, Eye, AlertCircle
} from "lucide-react";
import { authFetch } from "@/lib/auth-client";
import { useBusiness } from "@/lib/business-context";
import Link from "next/link";
import SetupChecklist from "@/components/SetupChecklist";

interface KeywordResult {
    keyword: string;
    matchType: string;
    searchVolume: number;
    competition: string;
    cpcEstimate: number;
    intent: string;
    difficulty: number;
    opportunity: string;
}

interface NegativeKeyword {
    keyword: string;
    reason: string;
}

interface ResearchResult {
    primary: KeywordResult[];
    longTail: KeywordResult[];
    questions: KeywordResult[];
    local: KeywordResult[];
    negative: NegativeKeyword[];
    competitor: KeywordResult[];
    summary: string;
    estimatedMonthlyClicks: number;
    estimatedMonthlyCost: number;
    topOpportunity: string;
}

const GOALS = [
    { value: "leads", label: "Generate Leads", icon: Target },
    { value: "sales", label: "Drive Sales", icon: DollarSign },
    { value: "awareness", label: "Brand Awareness", icon: Eye },
    { value: "traffic", label: "Website Traffic", icon: TrendingUp },
];

const COMPETITION_COLORS: Record<string, string> = {
    LOW: "bg-green-100 text-green-700",
    MEDIUM: "bg-yellow-100 text-yellow-700",
    HIGH: "bg-red-100 text-red-700",
};

const INTENT_COLORS: Record<string, string> = {
    informational: "bg-blue-100 text-blue-700",
    commercial: "bg-purple-100 text-purple-700",
    transactional: "bg-green-100 text-green-700",
    navigational: "bg-gray-100 text-gray-700",
};

const MATCH_ICONS: Record<string, string> = {
    BROAD: "~",
    PHRASE: '"',
    EXACT: "[",
};

export default function KeywordResearchPage() {
    const { activeBusiness } = useBusiness();

    // Form
    const [seedKeywords, setSeedKeywords] = useState("");
    const [description, setDescription] = useState("");
    const [goal, setGoal] = useState("leads");
    const [location, setLocation] = useState("");
    const [budget, setBudget] = useState("");
    const [competitors, setCompetitors] = useState("");
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Results
    const [researching, setResearching] = useState(false);
    const [result, setResult] = useState<ResearchResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState<string | null>(null);

    // Section expand/collapse
    const [expandedSections, setExpandedSections] = useState<Set<string>>(
        new Set(["primary", "longTail", "summary"])
    );

    const toggleSection = (key: string) => {
        setExpandedSections(prev => {
            const next = new Set(prev);
            next.has(key) ? next.delete(key) : next.add(key);
            return next;
        });
    };

    const runResearch = async () => {
        if (!seedKeywords.trim() && !description.trim()) {
            setError("Enter seed keywords or a business description to get started");
            return;
        }
        setResearching(true);
        setError(null);
        setResult(null);

        try {
            const res = await authFetch("/api/keyword-research", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    seedKeywords: seedKeywords.trim(),
                    businessDescription: description.trim() || undefined,
                    industry: activeBusiness?.industry || undefined,
                    location: location.trim() || activeBusiness?.location || undefined,
                    competitorUrls: competitors.trim() || undefined,
                    campaignGoal: goal,
                    budget: budget || undefined,
                    businessId: activeBusiness?.id,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Research failed");

            setResult(data.research);
            // Auto-expand all sections on new result
            setExpandedSections(new Set(["primary", "longTail", "questions", "local", "negative", "competitor", "summary"]));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Research failed");
        } finally {
            setResearching(false);
        }
    };

    const copyKeywords = (keywords: KeywordResult[], label: string) => {
        const text = keywords.map(k => k.keyword).join("\n");
        navigator.clipboard.writeText(text);
        setCopied(label);
        setTimeout(() => setCopied(null), 2000);
    };

    const exportCSV = () => {
        if (!result) return;
        const all = [
            ...result.primary.map(k => ({ ...k, group: "Primary" })),
            ...result.longTail.map(k => ({ ...k, group: "Long-tail" })),
            ...result.questions.map(k => ({ ...k, group: "Question" })),
            ...result.local.map(k => ({ ...k, group: "Local" })),
            ...result.competitor.map(k => ({ ...k, group: "Competitor" })),
        ];

        const csv = [
            "Group,Keyword,Match Type,Search Volume,Competition,CPC Estimate,Intent,Difficulty,Opportunity",
            ...all.map(k =>
                `${k.group},"${k.keyword}",${k.matchType},${k.searchVolume},${k.competition},$${k.cpcEstimate},${k.intent},${k.difficulty},"${k.opportunity}"`
            ),
        ].join("\n");

        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `keyword-research-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const getDifficultyColor = (d: number) => {
        if (d <= 30) return "text-green-600";
        if (d <= 60) return "text-yellow-600";
        return "text-red-600";
    };

    const getDifficultyBar = (d: number) => {
        if (d <= 30) return "bg-green-500";
        if (d <= 60) return "bg-yellow-500";
        return "bg-red-500";
    };

    const renderKeywordTable = (keywords: KeywordResult[], sectionKey: string, icon: React.ReactNode, title: string, description: string) => {
        if (!keywords || keywords.length === 0) return null;
        const isOpen = expandedSections.has(sectionKey);

        return (
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <button
                    onClick={() => toggleSection(sectionKey)}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/5 transition"
                >
                    <div className="flex items-center gap-3">
                        {icon}
                        <div className="text-left">
                            <h3 className="font-semibold">{title}</h3>
                            <p className="text-xs text-muted">{description}</p>
                        </div>
                        <span className="ml-2 bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">
                            {keywords.length}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={(e) => { e.stopPropagation(); copyKeywords(keywords, sectionKey); }}
                            className="p-1.5 hover:bg-muted/20 rounded-lg transition"
                            title="Copy all keywords"
                        >
                            {copied === sectionKey
                                ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                                : <Copy className="w-4 h-4 text-muted" />
                            }
                        </button>
                        {isOpen ? <ChevronUp className="w-4 h-4 text-muted" /> : <ChevronDown className="w-4 h-4 text-muted" />}
                    </div>
                </button>

                {isOpen && (
                    <div className="border-t border-border">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/10">
                                    <tr>
                                        <th className="text-left px-4 py-2.5 font-medium">Keyword</th>
                                        <th className="text-center px-3 py-2.5 font-medium">Match</th>
                                        <th className="text-right px-3 py-2.5 font-medium">Volume</th>
                                        <th className="text-center px-3 py-2.5 font-medium">Competition</th>
                                        <th className="text-right px-3 py-2.5 font-medium">CPC</th>
                                        <th className="text-center px-3 py-2.5 font-medium">Intent</th>
                                        <th className="text-center px-3 py-2.5 font-medium">Difficulty</th>
                                        <th className="text-left px-3 py-2.5 font-medium hidden lg:table-cell">Opportunity</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {keywords.map((kw, i) => (
                                        <tr key={i} className="hover:bg-muted/5 transition">
                                            <td className="px-4 py-3">
                                                <span className="font-medium">{kw.keyword}</span>
                                            </td>
                                            <td className="px-3 py-3 text-center">
                                                <span className="font-mono text-xs bg-muted/20 px-2 py-0.5 rounded">
                                                    {MATCH_ICONS[kw.matchType] || ""}{kw.matchType?.slice(0, 1)}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3 text-right font-medium">
                                                {kw.searchVolume?.toLocaleString() || "—"}
                                            </td>
                                            <td className="px-3 py-3 text-center">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${COMPETITION_COLORS[kw.competition] || "bg-gray-100 text-gray-600"}`}>
                                                    {kw.competition}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3 text-right">
                                                ${kw.cpcEstimate?.toFixed(2) || "0.00"}
                                            </td>
                                            <td className="px-3 py-3 text-center">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${INTENT_COLORS[kw.intent] || "bg-gray-100 text-gray-600"}`}>
                                                    {kw.intent}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3">
                                                <div className="flex items-center gap-2 justify-center">
                                                    <div className="w-12 h-1.5 bg-muted/20 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${getDifficultyBar(kw.difficulty)}`}
                                                            style={{ width: `${kw.difficulty}%` }}
                                                        />
                                                    </div>
                                                    <span className={`text-xs font-medium ${getDifficultyColor(kw.difficulty)}`}>
                                                        {kw.difficulty}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-3 py-3 text-xs text-muted max-w-[200px] truncate hidden lg:table-cell">
                                                {kw.opportunity}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Sparkles className="w-6 h-6 text-primary" />
                        AI Keyword Research
                    </h1>
                    <p className="text-muted text-sm mt-1">
                        Discover high-converting keywords powered by AI intelligence
                    </p>
                </div>
                <Link
                    href="/dashboard/keywords"
                    className="inline-flex items-center gap-2 bg-card border border-border hover:border-primary text-sm px-4 py-2 rounded-xl transition"
                >
                    <BarChart3 className="w-4 h-4" />
                    Live Keywords
                    <ArrowRight className="w-3 h-3" />
                </Link>
            </div>

            <SetupChecklist
                prereqs={["business_info", "knowledge_base"]}
                pageContext="Add your business info and knowledge base content so the AI can discover keywords tailored to your products, services, and audience"
            />

            {/* Research Form */}
            <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1.5">
                            Seed Keywords <span className="text-muted font-normal">(comma-separated)</span>
                        </label>
                        <input
                            type="text"
                            value={seedKeywords}
                            onChange={e => setSeedKeywords(e.target.value)}
                            placeholder="e.g., plumber near me, emergency plumbing, pipe repair"
                            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1.5">
                            Business Description <span className="text-muted font-normal">(optional)</span>
                        </label>
                        <input
                            type="text"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="e.g., Local plumbing company serving Denver metro area"
                            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                        />
                    </div>
                </div>

                {/* Campaign Goal */}
                <div>
                    <label className="block text-sm font-medium mb-2">Campaign Goal</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {GOALS.map(g => {
                            const Icon = g.icon;
                            return (
                                <button
                                    key={g.value}
                                    onClick={() => setGoal(g.value)}
                                    className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition border ${
                                        goal === g.value
                                            ? "bg-primary text-white border-primary"
                                            : "bg-card border-border hover:border-primary"
                                    }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {g.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Advanced Options */}
                <div>
                    <button
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition"
                    >
                        {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        Advanced Options
                    </button>
                    {showAdvanced && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                            <div>
                                <label className="block text-xs font-medium mb-1 text-muted">Target Location</label>
                                <input
                                    type="text"
                                    value={location}
                                    onChange={e => setLocation(e.target.value)}
                                    placeholder="e.g., Denver, CO"
                                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1 text-muted">Monthly Budget ($)</label>
                                <input
                                    type="number"
                                    value={budget}
                                    onChange={e => setBudget(e.target.value)}
                                    placeholder="e.g., 2000"
                                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1 text-muted">Competitor URLs</label>
                                <input
                                    type="text"
                                    value={competitors}
                                    onChange={e => setCompetitors(e.target.value)}
                                    placeholder="e.g., competitor1.com, competitor2.com"
                                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Action */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={runResearch}
                        disabled={researching}
                        className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl text-sm font-semibold transition disabled:opacity-50 shadow-lg shadow-primary/20"
                    >
                        {researching ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Researching...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4" />
                                Research Keywords
                            </>
                        )}
                    </button>
                    {result && (
                        <button
                            onClick={exportCSV}
                            className="inline-flex items-center gap-2 bg-card border border-border hover:border-primary px-4 py-3 rounded-xl text-sm font-medium transition"
                        >
                            <Download className="w-4 h-4" />
                            Export CSV
                        </button>
                    )}
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 flex items-center gap-2 text-sm">
                        <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                    </div>
                )}
            </div>

            {/* Loading State */}
            {researching && (
                <div className="bg-card border border-border rounded-2xl p-12 text-center">
                    <div className="relative mx-auto w-16 h-16 mb-6">
                        <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                        <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                        <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg mb-1">AI is analyzing your market...</h3>
                    <p className="text-muted text-sm">Discovering keywords, estimating volumes, and finding opportunities</p>
                </div>
            )}

            {/* Results */}
            {result && !researching && (
                <div className="space-y-4">
                    {/* Summary Card */}
                    <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl p-6">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center shrink-0">
                                <Lightbulb className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold mb-1">AI Research Summary</h3>
                                <p className="text-sm text-muted">{result.summary}</p>
                                {result.topOpportunity && (
                                    <div className="mt-3 bg-card/80 rounded-xl px-4 py-3 border border-primary/10">
                                        <div className="flex items-center gap-2 text-xs text-primary font-semibold mb-1">
                                            <Star className="w-3 h-3" /> TOP OPPORTUNITY
                                        </div>
                                        <p className="text-sm font-medium">{result.topOpportunity}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-3 gap-3 mt-5">
                            <div className="bg-card/80 rounded-xl px-4 py-3 text-center">
                                <p className="text-2xl font-bold text-primary">
                                    {(result.primary?.length || 0) +
                                        (result.longTail?.length || 0) +
                                        (result.questions?.length || 0) +
                                        (result.local?.length || 0) +
                                        (result.competitor?.length || 0)}
                                </p>
                                <p className="text-xs text-muted">Keywords Found</p>
                            </div>
                            <div className="bg-card/80 rounded-xl px-4 py-3 text-center">
                                <p className="text-2xl font-bold text-green-600">
                                    {result.estimatedMonthlyClicks?.toLocaleString() || "—"}
                                </p>
                                <p className="text-xs text-muted">Est. Monthly Clicks</p>
                            </div>
                            <div className="bg-card/80 rounded-xl px-4 py-3 text-center">
                                <p className="text-2xl font-bold text-blue-600">
                                    ${result.estimatedMonthlyCost?.toLocaleString() || "—"}
                                </p>
                                <p className="text-xs text-muted">Est. Monthly Cost</p>
                            </div>
                        </div>
                    </div>

                    {/* Keyword Tables */}
                    {renderKeywordTable(
                        result.primary || [],
                        "primary",
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center"><Search className="w-4 h-4 text-blue-600" /></div>,
                        "Primary Keywords",
                        "High-intent keywords directly related to your business"
                    )}

                    {renderKeywordTable(
                        result.longTail || [],
                        "longTail",
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center"><TrendingUp className="w-4 h-4 text-purple-600" /></div>,
                        "Long-tail Keywords",
                        "Specific, lower competition phrases with high conversion potential"
                    )}

                    {renderKeywordTable(
                        result.questions || [],
                        "questions",
                        <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center"><HelpCircle className="w-4 h-4 text-amber-600" /></div>,
                        "Question Keywords",
                        "\"How to\", \"what is\", \"best\" queries your audience is searching"
                    )}

                    {renderKeywordTable(
                        result.local || [],
                        "local",
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center"><MapPin className="w-4 h-4 text-green-600" /></div>,
                        "Local Keywords",
                        "Location-based keywords for your service area"
                    )}

                    {renderKeywordTable(
                        result.competitor || [],
                        "competitor",
                        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center"><Users className="w-4 h-4 text-red-600" /></div>,
                        "Competitor Keywords",
                        "Brand alternatives and comparison keywords"
                    )}

                    {/* Negative Keywords */}
                    {result.negative && result.negative.length > 0 && (
                        <div className="bg-card border border-border rounded-2xl overflow-hidden">
                            <button
                                onClick={() => toggleSection("negative")}
                                className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/5 transition"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                                        <Minus className="w-4 h-4 text-gray-600" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-semibold">Negative Keywords</h3>
                                        <p className="text-xs text-muted">Keywords to exclude to protect your budget</p>
                                    </div>
                                    <span className="ml-2 bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">
                                        {result.negative.length}
                                    </span>
                                </div>
                                {expandedSections.has("negative")
                                    ? <ChevronUp className="w-4 h-4 text-muted" />
                                    : <ChevronDown className="w-4 h-4 text-muted" />
                                }
                            </button>
                            {expandedSections.has("negative") && (
                                <div className="border-t border-border px-5 py-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {result.negative.map((nk, i) => (
                                            <div key={i} className="flex items-center gap-3 bg-red-50/50 rounded-lg px-3 py-2">
                                                <Shield className="w-4 h-4 text-red-400 shrink-0" />
                                                <div>
                                                    <p className="text-sm font-medium">{nk.keyword}</p>
                                                    <p className="text-xs text-muted">{nk.reason}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Action Bar */}
                    <div className="bg-card border border-border rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Zap className="w-5 h-5 text-primary" />
                            <p className="text-sm">
                                <strong>Ready to use these keywords?</strong>{" "}
                                Create ad campaigns or add them to your existing campaigns.
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Link
                                href="/dashboard/ad-copy"
                                className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-xl text-sm font-medium transition"
                            >
                                <Sparkles className="w-4 h-4" />
                                Generate Ads
                            </Link>
                            <button
                                onClick={exportCSV}
                                className="inline-flex items-center gap-2 bg-card border border-border hover:border-primary px-4 py-2.5 rounded-xl text-sm font-medium transition"
                            >
                                <Download className="w-4 h-4" />
                                Export
                            </button>
                            <button
                                onClick={runResearch}
                                disabled={researching}
                                className="inline-flex items-center gap-2 bg-card border border-border hover:border-primary px-4 py-2.5 rounded-xl text-sm font-medium transition"
                            >
                                <RefreshCw className={`w-4 h-4 ${researching ? "animate-spin" : ""}`} />
                                Re-run
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Empty state / intro */}
            {!result && !researching && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-card border border-border rounded-2xl p-6">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                            <Search className="w-5 h-5 text-blue-600" />
                        </div>
                        <h3 className="font-semibold mb-2">Discover Keywords</h3>
                        <p className="text-xs text-muted">
                            AI analyzes your business, industry, and competitors to find the best keywords
                            for your Google Ads campaigns.
                        </p>
                    </div>
                    <div className="bg-card border border-border rounded-2xl p-6">
                        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                            <Target className="w-5 h-5 text-green-600" />
                        </div>
                        <h3 className="font-semibold mb-2">Smart Matching</h3>
                        <p className="text-xs text-muted">
                            Get recommended match types (Broad, Phrase, Exact) for each keyword based on
                            competition level and your budget.
                        </p>
                    </div>
                    <div className="bg-card border border-border rounded-2xl p-6">
                        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                            <TrendingDown className="w-5 h-5 text-purple-600" />
                        </div>
                        <h3 className="font-semibold mb-2">Negative Keywords</h3>
                        <p className="text-xs text-muted">
                            Protect your budget with AI-recommended negative keywords that prevent
                            irrelevant clicks and wasted spend.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
