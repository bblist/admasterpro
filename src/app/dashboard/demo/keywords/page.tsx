"use client";

import {
    Search,
    TrendingUp,
    TrendingDown,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Filter,
    Plus,
    Upload,
    Sparkles,
    Globe,
    X,
    ArrowUpRight,
    ArrowDownRight,
    Minus,
    Brain,
    Zap,
    Info,
    Trash2,
    FileDown,
    Printer,
    FileSpreadsheet,
    FileText,
    File,
    ChevronDown,
    Share2,
    BarChart3,
    CheckCircle2,
    Calendar,
    Tag,
    Copy,
    Check,
    Loader2,
} from "lucide-react";
import { useState, useCallback, useRef, useEffect } from "react";
import Tooltip from "@/components/Tooltip";
import { useBusiness } from "@/lib/business-context";

// ─── Types ──────────────────────────────────────────────────────────────────

type KeywordStatus = "winner" | "loser" | "testing" | "paused" | "suggested";
type TrendDirection = "rising" | "stable" | "declining" | "breakout";
type KeywordSource = "manual" | "bulk" | "ai-suggested" | "google-trends";

interface Keyword {
    id: number;
    keyword: string;
    campaign: string;
    spent: number;
    clicks: number;
    calls: number;
    costPerCall: number | null;
    status: KeywordStatus;
    trend: "up" | "down" | "flat";
    daysRunning: number;
    source: KeywordSource;
    aiVerdict?: string;
    trendData?: {
        direction: TrendDirection;
        interestScore: number;
        weekChange: number;
        searchVolume: string;
        seasonalPeak?: string;
    };
    matchType?: "broad" | "phrase" | "exact";
    qualityScore?: number;
    addedDate?: string;
    businessId?: string;
}

// ─── Demo Data with Trends ──────────────────────────────────────────────────

const getKeywordsForBusiness = (businessId: string): Keyword[] => {
    const keywordSets: Record<string, Keyword[]> = {
        "mikes-plumbing": [
            { id: 1, keyword: "emergency plumber miami", campaign: "Emergency Plumbing", spent: 42.0, clicks: 28, calls: 14, costPerCall: 3.0, status: "winner", trend: "up", daysRunning: 45, source: "ai-suggested", matchType: "phrase", qualityScore: 9, aiVerdict: "Top performer \u2013 high intent, low cost. Keep scaling.", trendData: { direction: "rising", interestScore: 82, weekChange: 12, searchVolume: "High", seasonalPeak: "Hurricane Season (Jun-Nov)" } },
            { id: 2, keyword: "plumber near me 24 hours", campaign: "Emergency Plumbing", spent: 38.0, clicks: 22, calls: 11, costPerCall: 3.45, status: "winner", trend: "up", daysRunning: 38, source: "ai-suggested", matchType: "broad", qualityScore: 8, aiVerdict: "Strong local intent. Converts well after hours.", trendData: { direction: "stable", interestScore: 75, weekChange: 3, searchVolume: "High" } },
            { id: 3, keyword: "drain cleaning service", campaign: "Drain Services", spent: 24.0, clicks: 16, calls: 6, costPerCall: 4.0, status: "winner", trend: "up", daysRunning: 30, source: "manual", matchType: "phrase", qualityScore: 7, aiVerdict: "Good steady performer. Consider adding \u2018miami\u2019 for better targeting.", trendData: { direction: "stable", interestScore: 58, weekChange: -1, searchVolume: "Medium" } },
            { id: 4, keyword: "water heater repair miami", campaign: "Water Heater", spent: 18.0, clicks: 10, calls: 4, costPerCall: 4.5, status: "testing", trend: "up", daysRunning: 8, source: "google-trends", matchType: "phrase", qualityScore: 7, aiVerdict: "Trending up in Miami \u2013 cold fronts driving demand. Worth scaling.", trendData: { direction: "rising", interestScore: 71, weekChange: 28, searchVolume: "Medium", seasonalPeak: "Winter (Dec-Feb)" } },
            { id: 5, keyword: "how to unclog drain yourself", campaign: "Drain Services", spent: 15.0, clicks: 11, calls: 0, costPerCall: null, status: "loser", trend: "down", daysRunning: 18, source: "bulk", matchType: "broad", qualityScore: 2, aiVerdict: "DIY intent \u2013 these searchers won\u2019t hire a plumber. Recommend pausing.", trendData: { direction: "stable", interestScore: 65, weekChange: 0, searchVolume: "High" } },
            { id: 6, keyword: "plumber salary florida", campaign: "Emergency Plumbing", spent: 8.5, clicks: 6, calls: 0, costPerCall: null, status: "loser", trend: "down", daysRunning: 14, source: "bulk", matchType: "broad", qualityScore: 1, aiVerdict: "Job seeker intent, not customer. Added as negative keyword.", trendData: { direction: "stable", interestScore: 30, weekChange: -5, searchVolume: "Low" } },
            { id: 7, keyword: "bathroom remodel plumber", campaign: "Remodeling", spent: 22.0, clicks: 9, calls: 3, costPerCall: 7.33, status: "testing", trend: "flat", daysRunning: 6, source: "ai-suggested", matchType: "phrase", qualityScore: 6, aiVerdict: "Higher ticket service. Cost per call is acceptable for remodel jobs ($2k+ revenue).", trendData: { direction: "rising", interestScore: 48, weekChange: 8, searchVolume: "Medium", seasonalPeak: "Spring (Mar-May)" } },
            { id: 8, keyword: "leak detection miami dade", campaign: "Emergency Plumbing", spent: 0, clicks: 0, calls: 0, costPerCall: null, status: "suggested", trend: "up", daysRunning: 0, source: "google-trends", matchType: "exact", qualityScore: 8, aiVerdict: "\ud83d\udd25 Breakout term! +340% searches this month after recent flooding. High conversion potential.", trendData: { direction: "breakout", interestScore: 95, weekChange: 340, searchVolume: "High" } },
            { id: 9, keyword: "sewer line replacement cost", campaign: "Sewer Services", spent: 0, clicks: 0, calls: 0, costPerCall: null, status: "suggested", trend: "up", daysRunning: 0, source: "ai-suggested", matchType: "phrase", qualityScore: 7, aiVerdict: "High-intent commercial keyword. Estimated CPC $4-6. Good for high-ticket jobs.", trendData: { direction: "stable", interestScore: 42, weekChange: 2, searchVolume: "Medium" } },
        ],
        "clearvision": [
            { id: 1, keyword: "LASIK eye surgery miami", campaign: "LASIK & Eye Exams", spent: 56.0, clicks: 18, calls: 9, costPerCall: 6.22, status: "winner", trend: "up", daysRunning: 30, source: "ai-suggested", matchType: "phrase", qualityScore: 9, aiVerdict: "Premium lead generator. Each call = potential $3k+ procedure.", trendData: { direction: "rising", interestScore: 78, weekChange: 15, searchVolume: "High" } },
            { id: 2, keyword: "eye doctor near me", campaign: "LASIK & Eye Exams", spent: 34.0, clicks: 22, calls: 8, costPerCall: 4.25, status: "winner", trend: "up", daysRunning: 28, source: "manual", matchType: "broad", qualityScore: 7, aiVerdict: "Broad but effective. Filter with negative keywords for best results.", trendData: { direction: "stable", interestScore: 85, weekChange: 1, searchVolume: "High" } },
            { id: 3, keyword: "free eye test online", campaign: "LASIK & Eye Exams", spent: 34.0, clicks: 22, calls: 0, costPerCall: null, status: "loser", trend: "down", daysRunning: 21, source: "bulk", matchType: "broad", qualityScore: 1, aiVerdict: "Freebie seekers won\u2019t book paid consultations. Pause immediately.", trendData: { direction: "stable", interestScore: 55, weekChange: -2, searchVolume: "Medium" } },
            { id: 4, keyword: "LASIK cost 2026", campaign: "LASIK & Eye Exams", spent: 0, clicks: 0, calls: 0, costPerCall: null, status: "suggested", trend: "up", daysRunning: 0, source: "google-trends", matchType: "phrase", qualityScore: 8, aiVerdict: "\ud83d\udd25 Trending \u2013 people comparing prices. Great for landing page with financing options.", trendData: { direction: "breakout", interestScore: 92, weekChange: 180, searchVolume: "High" } },
        ],
        "sakura-sushi": [
            { id: 1, keyword: "sushi restaurant near me", campaign: "Lunch Specials", spent: 24.0, clicks: 32, calls: 10, costPerCall: 2.4, status: "winner", trend: "up", daysRunning: 22, source: "ai-suggested", matchType: "broad", qualityScore: 8, aiVerdict: "Great value \u2013 each call likely a table of 2-4 ($60-120 average).", trendData: { direction: "stable", interestScore: 90, weekChange: 2, searchVolume: "High" } },
            { id: 2, keyword: "omakase miami", campaign: "Premium Dining", spent: 18.0, clicks: 8, calls: 5, costPerCall: 3.6, status: "winner", trend: "up", daysRunning: 15, source: "manual", matchType: "exact", qualityScore: 9, aiVerdict: "Premium diners. High AOV ($150+). Keep bidding aggressively.", trendData: { direction: "rising", interestScore: 67, weekChange: 22, searchVolume: "Medium", seasonalPeak: "Valentine\u2019s Day / Holidays" } },
            { id: 3, keyword: "sushi recipe at home", campaign: "Lunch Specials", spent: 12.0, clicks: 9, calls: 0, costPerCall: null, status: "loser", trend: "down", daysRunning: 10, source: "bulk", matchType: "broad", qualityScore: 1, aiVerdict: "Home cooks won\u2019t visit your restaurant. Negative keyword this.", trendData: { direction: "stable", interestScore: 72, weekChange: 0, searchVolume: "High" } },
            { id: 4, keyword: "best sushi miami beach", campaign: "Lunch Specials", spent: 0, clicks: 0, calls: 0, costPerCall: null, status: "suggested", trend: "up", daysRunning: 0, source: "google-trends", matchType: "phrase", qualityScore: 8, aiVerdict: "\ud83d\udd25 Tourist season spike! +85% searches. Perfect for your Miami Beach location.", trendData: { direction: "breakout", interestScore: 88, weekChange: 85, searchVolume: "High", seasonalPeak: "Winter tourist season" } },
        ],
        "pinnacle-auto": [
            { id: 1, keyword: "auto detailing near me", campaign: "Detailing Services", spent: 22.0, clicks: 18, calls: 4, costPerCall: 5.5, status: "testing", trend: "up", daysRunning: 6, source: "ai-suggested", matchType: "broad", qualityScore: 7, aiVerdict: "Early results promising. Monitor for 2 more weeks.", trendData: { direction: "stable", interestScore: 72, weekChange: 5, searchVolume: "High" } },
            { id: 2, keyword: "ceramic coating miami", campaign: "Ceramic Coating", spent: 28.0, clicks: 12, calls: 6, costPerCall: 4.67, status: "winner", trend: "up", daysRunning: 20, source: "manual", matchType: "phrase", qualityScore: 9, aiVerdict: "Premium service keyword. $500-1500 per job. Excellent ROI.", trendData: { direction: "rising", interestScore: 65, weekChange: 18, searchVolume: "Medium" } },
            { id: 3, keyword: "car wash south beach", campaign: "Car Wash", spent: 14.0, clicks: 20, calls: 2, costPerCall: 7.0, status: "loser", trend: "down", daysRunning: 12, source: "bulk", matchType: "broad", qualityScore: 3, aiVerdict: "Low-value service. Your brand is luxury detailing, not basic car wash.", trendData: { direction: "stable", interestScore: 55, weekChange: -3, searchVolume: "Medium" } },
        ],
        "bella-fashion": [
            { id: 1, keyword: "designer handbags miami", campaign: "Designer Handbags", spent: 32.0, clicks: 28, calls: 8, costPerCall: 4.0, status: "winner", trend: "up", daysRunning: 25, source: "ai-suggested", matchType: "phrase", qualityScore: 8, aiVerdict: "Strong purchase intent. Average order $200+. Keep scaling.", trendData: { direction: "rising", interestScore: 70, weekChange: 12, searchVolume: "Medium" } },
            { id: 2, keyword: "summer dresses sale", campaign: "Summer Collection", spent: 36.0, clicks: 45, calls: 12, costPerCall: 3.0, status: "winner", trend: "up", daysRunning: 18, source: "manual", matchType: "broad", qualityScore: 7, aiVerdict: "Seasonal winner. Ramp up spend before summer.", trendData: { direction: "rising", interestScore: 82, weekChange: 35, searchVolume: "High", seasonalPeak: "Apr-Jul" } },
            { id: 3, keyword: "fashion trends 2026", campaign: "Summer Collection", spent: 28.5, clicks: 19, calls: 0, costPerCall: null, status: "loser", trend: "down", daysRunning: 14, source: "bulk", matchType: "broad", qualityScore: 2, aiVerdict: "Informational intent \u2013 they\u2019re browsing, not buying. Redirect to blog instead.", trendData: { direction: "rising", interestScore: 88, weekChange: 45, searchVolume: "High" } },
            { id: 4, keyword: "luxury boutique miami", campaign: "Brand Awareness", spent: 0, clicks: 0, calls: 0, costPerCall: null, status: "suggested", trend: "up", daysRunning: 0, source: "google-trends", matchType: "phrase", qualityScore: 8, aiVerdict: "\ud83d\udd25 Rising trend! Perfect match for your brand positioning. Estimated CPC $2-4.", trendData: { direction: "breakout", interestScore: 78, weekChange: 120, searchVolume: "Medium" } },
        ],
    };
    return keywordSets[businessId] || keywordSets["mikes-plumbing"]!;
};

// ─── Helpers ────────────────────────────────────────────────────────────────

const getTrendBadge = (dir: TrendDirection) => {
    switch (dir) {
        case "breakout": return { label: "\ud83d\udd25 Breakout", color: "text-orange-400 bg-orange-400/10" };
        case "rising": return { label: "\ud83d\udcc8 Rising", color: "text-emerald-400 bg-emerald-400/10" };
        case "stable": return { label: "\u27a1\ufe0f Stable", color: "text-blue-400 bg-blue-400/10" };
        case "declining": return { label: "\ud83d\udcc9 Declining", color: "text-red-400 bg-red-400/10" };
    }
};

const getSourceBadge = (source: KeywordSource) => {
    switch (source) {
        case "ai-suggested": return { label: "AI Suggested", icon: Brain, color: "text-purple-400 bg-purple-400/10" };
        case "google-trends": return { label: "Google Trends", icon: Globe, color: "text-blue-400 bg-blue-400/10" };
        case "manual": return { label: "Manual", icon: Plus, color: "text-gray-400 bg-gray-400/10" };
        case "bulk": return { label: "Bulk Import", icon: Upload, color: "text-amber-400 bg-amber-400/10" };
    }
};

const getMatchTypeBadge = (type: string) => {
    switch (type) {
        case "exact": return "[exact]";
        case "phrase": return "\"phrase\"";
        case "broad": return "broad";
        default: return "broad";
    }
};

// ─── Report Export Types ────────────────────────────────────────────────────

type ExportFormat = "pdf" | "excel" | "word" | "csv" | "print";

interface ReportSection {
    id: string;
    label: string;
    description: string;
    checked: boolean;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function KeywordsPage() {
    const { activeBusiness } = useBusiness();
    const [filter, setFilter] = useState<"all" | KeywordStatus>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [keywords, setKeywords] = useState<Keyword[]>(() => getKeywordsForBusiness(activeBusiness.id));

    // Add keyword modal
    const [showAddModal, setShowAddModal] = useState(false);
    const [addMode, setAddMode] = useState<"single" | "bulk">("single");
    const [singleKeyword, setSingleKeyword] = useState("");
    const [singleCampaign, setSingleCampaign] = useState("");
    const [singleMatchType, setSingleMatchType] = useState<"broad" | "phrase" | "exact">("phrase");
    const [bulkText, setBulkText] = useState("");
    const [bulkCampaign, setBulkCampaign] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResults, setAnalysisResults] = useState<{ keyword: string; verdict: string; score: number; trend: TrendDirection }[] | null>(null);

    // Report modal
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportFormat, setReportFormat] = useState<ExportFormat>("pdf");
    const [isExporting, setIsExporting] = useState(false);
    const [exportDone, setExportDone] = useState(false);
    const [reportBranding, setReportBranding] = useState(true);
    const [reportDateRange, setReportDateRange] = useState<"7d" | "30d" | "90d" | "all">("30d");
    const [reportSections, setReportSections] = useState<ReportSection[]>([
        { id: "summary", label: "Executive Summary", description: "KPIs, spend, conversions overview", checked: true },
        { id: "winners", label: "Winning Keywords", description: "Top performing keywords with ROI data", checked: true },
        { id: "losers", label: "Money Leaks", description: "Underperforming keywords draining budget", checked: true },
        { id: "trends", label: "Google Trends Analysis", description: "Market trends and search volume data", checked: true },
        { id: "recommendations", label: "AI Recommendations", description: "Actionable suggestions from your AI agent", checked: true },
        { id: "competitors", label: "Competitor Insights", description: "Competitor keyword overlap and gaps", checked: false },
        { id: "forecast", label: "30-Day Forecast", description: "Projected performance based on trends", checked: false },
    ]);

    // Keyword detail panel
    const [selectedKeyword, setSelectedKeyword] = useState<Keyword | null>(null);

    // Copied state
    const [copiedId, setCopiedId] = useState<number | null>(null);

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Update keywords when business changes
    useEffect(() => {
        setKeywords(getKeywordsForBusiness(activeBusiness.id));
        setFilter("all");
        setSearchQuery("");
        setSelectedKeyword(null);
    }, [activeBusiness.id]);

    const filtered = keywords.filter((k) => {
        if (filter !== "all" && k.status !== filter) return false;
        if (searchQuery && !k.keyword.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    const winners = keywords.filter((k) => k.status === "winner").length;
    const losers = keywords.filter((k) => k.status === "loser").length;
    const testing = keywords.filter((k) => k.status === "testing").length;
    const suggested = keywords.filter((k) => k.status === "suggested").length;
    const paused = keywords.filter((k) => k.status === "paused").length;

    // ─── Add keyword handlers ───────────────────────────────────────────

    const handleAddSingle = useCallback(() => {
        if (!singleKeyword.trim()) return;
        setIsAnalyzing(true);

        setTimeout(() => {
            const score = Math.floor(Math.random() * 4) + 5;
            const trends: TrendDirection[] = ["rising", "stable", "declining", "breakout"];
            const trend = trends[Math.floor(Math.random() * trends.length)]!;
            const volumes = ["High", "Medium", "Low"];
            const volume = volumes[Math.floor(Math.random() * volumes.length)]!;

            setAnalysisResults([{
                keyword: singleKeyword.trim(),
                verdict: score >= 7
                    ? `\u2705 Good keyword! Estimated CPC $${(Math.random() * 5 + 1).toFixed(2)}. Relevant to ${activeBusiness.name}\u2019s services.`
                    : score >= 5
                        ? `\u26a0\ufe0f Moderate potential. May need refinement for better targeting in ${activeBusiness.location}.`
                        : `\u274c Low relevance for ${activeBusiness.industry}. Consider a more specific keyword.`,
                score,
                trend,
            }]);
            setIsAnalyzing(false);
        }, 1500);
    }, [singleKeyword, activeBusiness]);

    const confirmAddSingle = useCallback(() => {
        if (!singleKeyword.trim()) return;
        const newKw: Keyword = {
            id: Date.now(),
            keyword: singleKeyword.trim().toLowerCase(),
            campaign: singleCampaign || "General",
            spent: 0,
            clicks: 0,
            calls: 0,
            costPerCall: null,
            status: "testing",
            trend: "flat",
            daysRunning: 0,
            source: "manual",
            matchType: singleMatchType,
            qualityScore: analysisResults?.[0]?.score || 5,
            aiVerdict: analysisResults?.[0]?.verdict || "New keyword \u2013 AI will analyze performance after data collection.",
            trendData: {
                direction: analysisResults?.[0]?.trend || "stable",
                interestScore: Math.floor(Math.random() * 40) + 30,
                weekChange: 0,
                searchVolume: "Medium",
            },
            addedDate: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            businessId: activeBusiness.id,
        };
        setKeywords((prev) => [...prev, newKw]);
        setSingleKeyword("");
        setSingleCampaign("");
        setAnalysisResults(null);
        setShowAddModal(false);
    }, [singleKeyword, singleCampaign, singleMatchType, analysisResults, activeBusiness]);

    const handleBulkAdd = useCallback(() => {
        if (!bulkText.trim()) return;
        setIsAnalyzing(true);

        const lines = bulkText.split("\n").map(l => l.trim()).filter(Boolean);

        setTimeout(() => {
            const results = lines.map((kw) => {
                const score = Math.floor(Math.random() * 6) + 3;
                const trends: TrendDirection[] = ["rising", "stable", "declining", "breakout"];
                const trend = trends[Math.floor(Math.random() * trends.length)]!;
                return {
                    keyword: kw,
                    verdict: score >= 7 ? "\u2705 Recommended" : score >= 5 ? "\u26a0\ufe0f Maybe" : "\u274c Not recommended",
                    score,
                    trend,
                };
            });
            setAnalysisResults(results);
            setIsAnalyzing(false);
        }, 2000);
    }, [bulkText]);

    const confirmBulkAdd = useCallback(() => {
        if (!analysisResults) return;
        const approved = analysisResults.filter(r => r.score >= 5);
        const newKeywords: Keyword[] = approved.map((r, i) => ({
            id: Date.now() + i,
            keyword: r.keyword.toLowerCase(),
            campaign: bulkCampaign || "General",
            spent: 0,
            clicks: 0,
            calls: 0,
            costPerCall: null,
            status: "testing" as KeywordStatus,
            trend: "flat" as const,
            daysRunning: 0,
            source: "bulk" as KeywordSource,
            matchType: "phrase" as const,
            qualityScore: r.score,
            aiVerdict: `Bulk imported \u2013 AI score: ${r.score}/10. Will optimize match type after data collection.`,
            trendData: {
                direction: r.trend,
                interestScore: Math.floor(Math.random() * 40) + 30,
                weekChange: 0,
                searchVolume: "Medium" as const,
            },
            addedDate: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            businessId: activeBusiness.id,
        }));
        setKeywords((prev) => [...prev, ...newKeywords]);
        setBulkText("");
        setBulkCampaign("");
        setAnalysisResults(null);
        setShowAddModal(false);
    }, [analysisResults, bulkCampaign, activeBusiness]);

    const handlePause = useCallback((id: number) => {
        setKeywords((prev) => prev.map(k => k.id === id ? { ...k, status: "paused" as KeywordStatus } : k));
    }, []);

    const handleActivate = useCallback((id: number) => {
        setKeywords((prev) => prev.map(k => k.id === id ? { ...k, status: "testing" as KeywordStatus } : k));
    }, []);

    const handleRemove = useCallback((id: number) => {
        setKeywords((prev) => prev.filter(k => k.id !== id));
        if (selectedKeyword?.id === id) setSelectedKeyword(null);
    }, [selectedKeyword]);

    const handleApproveAISuggestion = useCallback((id: number) => {
        setKeywords((prev) => prev.map(k => k.id === id ? { ...k, status: "testing" as KeywordStatus, daysRunning: 0 } : k));
    }, []);

    // ─── Export handlers ────────────────────────────────────────────────

    const handleExport = useCallback(() => {
        setIsExporting(true);
        setExportDone(false);

        const delay = reportFormat === "pdf" ? 2500 : reportFormat === "excel" ? 1800 : 2000;
        setTimeout(() => {
            setIsExporting(false);
            setExportDone(true);
            setTimeout(() => { setExportDone(false); }, 3000);
        }, delay);
    }, [reportFormat]);

    const handleCopyKeyword = useCallback((id: number, text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    }, []);

    const toggleReportSection = useCallback((sectionId: string) => {
        setReportSections(prev => prev.map(s => s.id === sectionId ? { ...s, checked: !s.checked } : s));
    }, []);

    // ─── Render ─────────────────────────────────────────────────────────

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* \u2500\u2500 Header \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        Keywords
                        <Tooltip text="Keywords are the search terms that trigger your ads. The AI agent analyses every keyword you add and decides what gets used based on research, trends, and your business data." />
                    </h1>
                    <div className="flex items-center gap-2 mt-1.5">
                        <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${activeBusiness.color} flex items-center justify-center text-[9px] font-bold text-white`}>
                            {activeBusiness.initials}
                        </div>
                        <span className="text-sm">
                            <span className="font-semibold text-foreground">{activeBusiness.name}</span>
                            <span className="text-muted"> \u00b7 {activeBusiness.industry}</span>
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowReportModal(true)}
                        className="flex items-center gap-2 bg-card border border-border rounded-lg px-4 py-2.5 text-sm hover:border-primary transition"
                    >
                        <FileDown className="w-4 h-4" />
                        Export Report
                    </button>
                    <button
                        onClick={() => { setShowAddModal(true); setAddMode("single"); setAnalysisResults(null); }}
                        className="flex items-center gap-2 bg-primary text-white rounded-lg px-4 py-2.5 text-sm hover:bg-primary/90 transition font-medium"
                    >
                        <Plus className="w-4 h-4" />
                        Add Keywords
                    </button>
                </div>
            </div>

            {/* \u2500\u2500 AI Control Banner \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */}
            <div className="bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-teal-500/10 border border-purple-500/20 rounded-xl p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shrink-0">
                    <Brain className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm flex items-center gap-2">
                        AI Keyword Control
                        <span className="text-[10px] bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full font-bold">ACTIVE</span>
                    </div>
                    <p className="text-xs text-muted mt-0.5 leading-relaxed">
                        You can add any keywords you like \u2014 the AI agent has final say on what gets used. It analyses each keyword using
                        <strong className="text-blue-400"> Google Trends</strong>,
                        <strong className="text-blue-400"> search volume data</strong>,
                        <strong className="text-blue-400"> competitor analysis</strong>, and your
                        <strong className="text-purple-400"> Knowledge Base</strong> to decide which keywords will actually drive results for {activeBusiness.name}.
                    </p>
                </div>
                <div className="shrink-0 flex items-center gap-1.5 text-xs text-purple-400">
                    <Globe className="w-3.5 h-3.5" />
                    <span className="font-medium">Trend-Aware</span>
                </div>
            </div>

            {/* \u2500\u2500 Quick Stats \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */}
            <div className="grid grid-cols-5 gap-3">
                <button
                    onClick={() => setFilter(filter === "winner" ? "all" : "winner")}
                    className={`bg-card border rounded-xl p-3.5 text-left transition ${filter === "winner" ? "border-success ring-1 ring-success/30" : "border-border hover:border-success"}`}
                >
                    <div className="flex items-center gap-1.5 mb-1">
                        <CheckCircle className="w-3.5 h-3.5 text-success" />
                        <span className="text-xs font-medium">Winners</span>
                    </div>
                    <div className="text-xl font-bold text-success">{winners}</div>
                </button>
                <button
                    onClick={() => setFilter(filter === "loser" ? "all" : "loser")}
                    className={`bg-card border rounded-xl p-3.5 text-left transition ${filter === "loser" ? "border-danger ring-1 ring-danger/30" : "border-border hover:border-danger"}`}
                >
                    <div className="flex items-center gap-1.5 mb-1">
                        <XCircle className="w-3.5 h-3.5 text-danger" />
                        <span className="text-xs font-medium">Money Leaks</span>
                    </div>
                    <div className="text-xl font-bold text-danger">{losers}</div>
                </button>
                <button
                    onClick={() => setFilter(filter === "testing" ? "all" : "testing")}
                    className={`bg-card border rounded-xl p-3.5 text-left transition ${filter === "testing" ? "border-warning ring-1 ring-warning/30" : "border-border hover:border-warning"}`}
                >
                    <div className="flex items-center gap-1.5 mb-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-warning" />
                        <span className="text-xs font-medium">Testing</span>
                    </div>
                    <div className="text-xl font-bold text-warning">{testing}</div>
                </button>
                <button
                    onClick={() => setFilter(filter === "suggested" ? "all" : "suggested")}
                    className={`bg-card border rounded-xl p-3.5 text-left transition ${filter === "suggested" ? "border-purple-400 ring-1 ring-purple-400/30" : "border-border hover:border-purple-400"}`}
                >
                    <div className="flex items-center gap-1.5 mb-1">
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                        <span className="text-xs font-medium">AI Suggested</span>
                    </div>
                    <div className="text-xl font-bold text-purple-400">{suggested}</div>
                </button>
                <button
                    onClick={() => setFilter(filter === "paused" ? "all" : "paused")}
                    className={`bg-card border rounded-xl p-3.5 text-left transition ${filter === "paused" ? "border-gray-400 ring-1 ring-gray-400/30" : "border-border hover:border-gray-400"}`}
                >
                    <div className="flex items-center gap-1.5 mb-1">
                        <Minus className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs font-medium">Paused</span>
                    </div>
                    <div className="text-xl font-bold text-gray-400">{paused}</div>
                </button>
            </div>

            {/* \u2500\u2500 Search & Filter Bar \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */}
            <div className="flex gap-3">
                <div className="flex-1 relative">
                    <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search keywords..."
                        className="w-full bg-card border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary transition"
                    />
                </div>
                <button
                    onClick={() => setFilter("all")}
                    className={`border border-border rounded-lg px-4 py-2.5 text-sm flex items-center gap-2 transition ${filter === "all" ? "bg-primary text-white border-primary" : "hover:border-primary"}`}
                >
                    <Filter className="w-4 h-4" />
                    All ({keywords.length})
                </button>
            </div>

            {/* \u2500\u2500 Keywords Table \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border bg-sidebar">
                                <th className="text-left px-4 py-3 font-medium text-muted">Keyword</th>
                                <th className="text-left px-4 py-3 font-medium text-muted">Campaign</th>
                                <th className="text-center px-4 py-3 font-medium text-muted">
                                    <div className="flex items-center justify-center gap-1">
                                        <Globe className="w-3 h-3" />
                                        Trend
                                    </div>
                                </th>
                                <th className="text-right px-4 py-3 font-medium text-muted">Spent</th>
                                <th className="text-right px-4 py-3 font-medium text-muted">Clicks</th>
                                <th className="text-right px-4 py-3 font-medium text-muted">Calls</th>
                                <th className="text-right px-4 py-3 font-medium text-muted">$/Call</th>
                                <th className="text-center px-4 py-3 font-medium text-muted">Verdict</th>
                                <th className="text-center px-4 py-3 font-medium text-muted">Source</th>
                                <th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filtered.map((k) => {
                                const trendBadge = k.trendData ? getTrendBadge(k.trendData.direction) : null;
                                const sourceBadge = getSourceBadge(k.source);
                                const SourceIcon = sourceBadge.icon;

                                return (
                                    <tr
                                        key={k.id}
                                        className={`hover:bg-sidebar/50 transition cursor-pointer ${selectedKeyword?.id === k.id ? "bg-sidebar/70" : ""} ${k.status === "paused" ? "opacity-50" : ""}`}
                                        onClick={() => setSelectedKeyword(k)}
                                    >
                                        <td className="px-4 py-3.5">
                                            <div className="flex items-center gap-2">
                                                <div>
                                                    <div className="font-medium flex items-center gap-1.5">
                                                        &quot;{k.keyword}&quot;
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleCopyKeyword(k.id, k.keyword); }}
                                                            className="opacity-0 group-hover:opacity-100 hover:text-primary transition"
                                                        >
                                                            {copiedId === k.id ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3 text-muted" />}
                                                        </button>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-[10px] text-muted bg-sidebar px-1.5 py-0.5 rounded font-mono">
                                                            {getMatchTypeBadge(k.matchType || "broad")}
                                                        </span>
                                                        {k.daysRunning > 0 && (
                                                            <span className="text-[10px] text-muted">{k.daysRunning}d running</span>
                                                        )}
                                                        {k.addedDate && (
                                                            <span className="text-[10px] text-muted">Added {k.addedDate}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5 text-muted text-xs">{k.campaign}</td>
                                        <td className="px-4 py-3.5 text-center">
                                            {trendBadge && (
                                                <div className="flex flex-col items-center gap-0.5">
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${trendBadge.color}`}>
                                                        {trendBadge.label}
                                                    </span>
                                                    {k.trendData && (
                                                        <span className={`text-[10px] ${k.trendData.weekChange > 0 ? "text-emerald-400" : k.trendData.weekChange < 0 ? "text-red-400" : "text-muted"}`}>
                                                            {k.trendData.weekChange > 0 ? "+" : ""}{k.trendData.weekChange}% week
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3.5 text-right font-medium">
                                            {k.spent > 0 ? `$${k.spent.toFixed(2)}` : <span className="text-muted">\u2014</span>}
                                        </td>
                                        <td className="px-4 py-3.5 text-right">{k.clicks || <span className="text-muted">\u2014</span>}</td>
                                        <td className="px-4 py-3.5 text-right">
                                            <span className={k.calls === 0 && k.spent > 0 ? "text-danger font-medium" : ""}>
                                                {k.calls || <span className="text-muted">\u2014</span>}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5 text-right">
                                            {k.costPerCall ? (
                                                <span className="text-success font-medium">${k.costPerCall.toFixed(2)}</span>
                                            ) : (
                                                <span className="text-muted">\u2014</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3.5 text-center">
                                            {k.status === "winner" && (
                                                <span className="inline-flex items-center gap-1 text-[10px] bg-success/10 text-success px-2 py-1 rounded-full font-medium">
                                                    <CheckCircle className="w-3 h-3" /> Winner
                                                </span>
                                            )}
                                            {k.status === "loser" && (
                                                <span className="inline-flex items-center gap-1 text-[10px] bg-danger/10 text-danger px-2 py-1 rounded-full font-medium">
                                                    <XCircle className="w-3 h-3" /> Loser
                                                </span>
                                            )}
                                            {k.status === "testing" && (
                                                <span className="inline-flex items-center gap-1 text-[10px] bg-warning/10 text-warning px-2 py-1 rounded-full font-medium">
                                                    <AlertTriangle className="w-3 h-3" /> Testing
                                                </span>
                                            )}
                                            {k.status === "suggested" && (
                                                <span className="inline-flex items-center gap-1 text-[10px] bg-purple-400/10 text-purple-400 px-2 py-1 rounded-full font-medium">
                                                    <Sparkles className="w-3 h-3" /> Suggested
                                                </span>
                                            )}
                                            {k.status === "paused" && (
                                                <span className="inline-flex items-center gap-1 text-[10px] bg-gray-400/10 text-gray-400 px-2 py-1 rounded-full font-medium">
                                                    <Minus className="w-3 h-3" /> Paused
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3.5 text-center">
                                            <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full ${sourceBadge.color}`}>
                                                <SourceIcon className="w-3 h-3" />
                                                {sourceBadge.label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <div className="flex items-center gap-1">
                                                {k.status === "suggested" && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleApproveAISuggestion(k.id); }}
                                                        className="text-[10px] bg-success/10 text-success px-2.5 py-1 rounded-lg hover:bg-success/20 transition font-medium"
                                                    >
                                                        Approve
                                                    </button>
                                                )}
                                                {k.status === "loser" && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handlePause(k.id); }}
                                                        className="text-[10px] bg-danger/10 text-danger px-2.5 py-1 rounded-lg hover:bg-danger/20 transition font-medium"
                                                    >
                                                        Pause
                                                    </button>
                                                )}
                                                {k.status === "paused" && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleActivate(k.id); }}
                                                        className="text-[10px] bg-blue-400/10 text-blue-400 px-2.5 py-1 rounded-lg hover:bg-blue-400/20 transition font-medium"
                                                    >
                                                        Activate
                                                    </button>
                                                )}
                                                {k.status === "winner" && (
                                                    <div className="flex items-center gap-1 text-success">
                                                        <TrendingUp className="w-3.5 h-3.5" />
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={10} className="px-4 py-12 text-center">
                                        <div className="text-muted">
                                            <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                            <p className="text-sm font-medium">No keywords match your filter</p>
                                            <p className="text-xs mt-1">Try adjusting your search or filter criteria</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* \u2500\u2500 Keyword Detail Panel \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */}
            {selectedKeyword && (
                <div className="bg-card border border-border rounded-xl p-5 space-y-4 animate-in slide-in-from-bottom-2 duration-200">
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="font-bold text-lg">&quot;{selectedKeyword.keyword}&quot;</h3>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted">
                                <span>{selectedKeyword.campaign}</span>
                                <span className="font-mono bg-sidebar px-1.5 py-0.5 rounded">
                                    {getMatchTypeBadge(selectedKeyword.matchType || "broad")}
                                </span>
                                {selectedKeyword.qualityScore && (
                                    <span className={`font-medium ${selectedKeyword.qualityScore >= 7 ? "text-success" : selectedKeyword.qualityScore >= 5 ? "text-warning" : "text-danger"}`}>
                                        Quality: {selectedKeyword.qualityScore}/10
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleRemove(selectedKeyword.id)}
                                className="text-xs bg-danger/10 text-danger px-3 py-1.5 rounded-lg hover:bg-danger/20 transition"
                            >
                                <Trash2 className="w-3 h-3 inline mr-1" />
                                Remove
                            </button>
                            <button
                                onClick={() => setSelectedKeyword(null)}
                                className="p-1.5 hover:bg-sidebar rounded-lg transition"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* AI Verdict */}
                    {selectedKeyword.aiVerdict && (
                        <div className="bg-gradient-to-r from-purple-500/5 to-blue-500/5 border border-purple-500/10 rounded-lg p-3.5">
                            <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 mb-1.5">
                                <Brain className="w-3.5 h-3.5" />
                                AI Agent Verdict
                            </div>
                            <p className="text-sm leading-relaxed">{selectedKeyword.aiVerdict}</p>
                        </div>
                    )}

                    {/* Google Trends Data */}
                    {selectedKeyword.trendData && (
                        <div className="grid grid-cols-5 gap-3">
                            <div className="bg-sidebar rounded-lg p-3 text-center">
                                <div className="text-[10px] text-muted mb-1">Trend</div>
                                {(() => {
                                    const badge = getTrendBadge(selectedKeyword.trendData!.direction);
                                    return <div className={`text-xs font-bold ${badge.color.split(" ")[0]}`}>{badge.label}</div>;
                                })()}
                            </div>
                            <div className="bg-sidebar rounded-lg p-3 text-center">
                                <div className="text-[10px] text-muted mb-1">Interest Score</div>
                                <div className="text-sm font-bold">{selectedKeyword.trendData.interestScore}<span className="text-[10px] text-muted">/100</span></div>
                            </div>
                            <div className="bg-sidebar rounded-lg p-3 text-center">
                                <div className="text-[10px] text-muted mb-1">Week Change</div>
                                <div className={`text-sm font-bold ${selectedKeyword.trendData.weekChange > 0 ? "text-emerald-400" : selectedKeyword.trendData.weekChange < 0 ? "text-red-400" : ""}`}>
                                    {selectedKeyword.trendData.weekChange > 0 ? "+" : ""}{selectedKeyword.trendData.weekChange}%
                                </div>
                            </div>
                            <div className="bg-sidebar rounded-lg p-3 text-center">
                                <div className="text-[10px] text-muted mb-1">Search Volume</div>
                                <div className="text-sm font-bold">{selectedKeyword.trendData.searchVolume}</div>
                            </div>
                            <div className="bg-sidebar rounded-lg p-3 text-center">
                                <div className="text-[10px] text-muted mb-1">Peak Season</div>
                                <div className="text-xs font-medium">{selectedKeyword.trendData.seasonalPeak || "Year-round"}</div>
                            </div>
                        </div>
                    )}

                    {/* Performance stats */}
                    {selectedKeyword.spent > 0 && (
                        <div className="grid grid-cols-4 gap-3">
                            <div className="bg-sidebar rounded-lg p-3">
                                <div className="text-[10px] text-muted">Spent</div>
                                <div className="text-lg font-bold">${selectedKeyword.spent.toFixed(2)}</div>
                            </div>
                            <div className="bg-sidebar rounded-lg p-3">
                                <div className="text-[10px] text-muted">Clicks</div>
                                <div className="text-lg font-bold">{selectedKeyword.clicks}</div>
                            </div>
                            <div className="bg-sidebar rounded-lg p-3">
                                <div className="text-[10px] text-muted">Conversions</div>
                                <div className="text-lg font-bold">{selectedKeyword.calls}</div>
                            </div>
                            <div className="bg-sidebar rounded-lg p-3">
                                <div className="text-[10px] text-muted">Cost/Conversion</div>
                                <div className="text-lg font-bold">
                                    {selectedKeyword.costPerCall ? `$${selectedKeyword.costPerCall.toFixed(2)}` : "\u2014"}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */}
            {/* \u2500\u2500 Add Keywords Modal \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */}
            {/* \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setShowAddModal(false); setAnalysisResults(null); }}>
                    <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        {/* Modal header */}
                        <div className="flex items-center justify-between p-5 border-b border-border">
                            <div>
                                <h2 className="text-lg font-bold flex items-center gap-2">
                                    <Plus className="w-5 h-5 text-primary" />
                                    Add Keywords
                                </h2>
                                <p className="text-xs text-muted mt-0.5">
                                    Add keywords for <strong>{activeBusiness.name}</strong> \u2014 AI will analyze and decide what gets used
                                </p>
                            </div>
                            <button onClick={() => { setShowAddModal(false); setAnalysisResults(null); }} className="p-2 hover:bg-sidebar rounded-lg transition">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Mode toggle */}
                        <div className="p-5 pb-0">
                            <div className="flex bg-sidebar rounded-xl p-1">
                                <button
                                    onClick={() => { setAddMode("single"); setAnalysisResults(null); }}
                                    className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition ${addMode === "single" ? "bg-card shadow text-foreground" : "text-muted hover:text-foreground"}`}
                                >
                                    <Tag className="w-4 h-4" />
                                    Single Keyword
                                </button>
                                <button
                                    onClick={() => { setAddMode("bulk"); setAnalysisResults(null); }}
                                    className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition ${addMode === "bulk" ? "bg-card shadow text-foreground" : "text-muted hover:text-foreground"}`}
                                >
                                    <Upload className="w-4 h-4" />
                                    Bulk Import
                                </button>
                            </div>
                        </div>

                        {/* \u2500\u2500 Single keyword mode \u2500\u2500 */}
                        {addMode === "single" && (
                            <div className="p-5 space-y-4">
                                <div>
                                    <label className="text-xs font-medium text-muted mb-1.5 block">Keyword</label>
                                    <input
                                        type="text"
                                        value={singleKeyword}
                                        onChange={(e) => { setSingleKeyword(e.target.value); setAnalysisResults(null); }}
                                        placeholder={`e.g., ${activeBusiness.services[0] || "your service"} near me`}
                                        className="w-full bg-sidebar border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition"
                                        onKeyDown={(e) => e.key === "Enter" && handleAddSingle()}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-medium text-muted mb-1.5 block">Campaign (optional)</label>
                                        <input
                                            type="text"
                                            value={singleCampaign}
                                            onChange={(e) => setSingleCampaign(e.target.value)}
                                            placeholder="e.g., Emergency Services"
                                            className="w-full bg-sidebar border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-muted mb-1.5 block">Match Type</label>
                                        <div className="flex gap-2">
                                            {(["broad", "phrase", "exact"] as const).map((type) => (
                                                <button
                                                    key={type}
                                                    onClick={() => setSingleMatchType(type)}
                                                    className={`flex-1 text-xs py-2.5 rounded-lg border transition font-mono ${singleMatchType === type ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"}`}
                                                >
                                                    {getMatchTypeBadge(type)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Analysis button */}
                                {!analysisResults && (
                                    <button
                                        onClick={handleAddSingle}
                                        disabled={!singleKeyword.trim() || isAnalyzing}
                                        className="w-full bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-xl py-3 text-sm font-medium hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {isAnalyzing ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                AI is analyzing keyword...
                                            </>
                                        ) : (
                                            <>
                                                <Brain className="w-4 h-4" />
                                                Analyze with AI & Google Trends
                                            </>
                                        )}
                                    </button>
                                )}

                                {/* Analysis result */}
                                {analysisResults && analysisResults.length === 1 && (
                                    <div className="space-y-3">
                                        <div className={`rounded-xl p-4 border ${analysisResults[0]!.score >= 7 ? "bg-success/5 border-success/20" : analysisResults[0]!.score >= 5 ? "bg-warning/5 border-warning/20" : "bg-danger/5 border-danger/20"}`}>
                                            <div className="flex items-center gap-2 mb-2">
                                                <Brain className="w-4 h-4 text-purple-400" />
                                                <span className="text-xs font-bold text-purple-400">AI Analysis</span>
                                                <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${analysisResults[0]!.score >= 7 ? "bg-success/10 text-success" : analysisResults[0]!.score >= 5 ? "bg-warning/10 text-warning" : "bg-danger/10 text-danger"}`}>
                                                    Score: {analysisResults[0]!.score}/10
                                                </span>
                                            </div>
                                            <p className="text-sm leading-relaxed">{analysisResults[0]!.verdict}</p>
                                            <div className="flex items-center gap-2 mt-2 text-xs text-muted">
                                                <Globe className="w-3 h-3" />
                                                Google Trends: {getTrendBadge(analysisResults[0]!.trend).label}
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <button
                                                onClick={confirmAddSingle}
                                                className="flex-1 bg-primary text-white rounded-xl py-3 text-sm font-medium hover:bg-primary/90 transition flex items-center justify-center gap-2"
                                            >
                                                <CheckCircle2 className="w-4 h-4" />
                                                Add Keyword Anyway
                                            </button>
                                            <button
                                                onClick={() => { setAnalysisResults(null); setSingleKeyword(""); }}
                                                className="px-4 border border-border rounded-xl text-sm hover:bg-sidebar transition"
                                            >
                                                Cancel
                                            </button>
                                        </div>

                                        <p className="text-[10px] text-muted text-center">
                                            \ud83d\udca1 The AI agent will still control whether this keyword is activated based on ongoing performance data.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* \u2500\u2500 Bulk import mode \u2500\u2500 */}
                        {addMode === "bulk" && (
                            <div className="p-5 space-y-4">
                                <div>
                                    <label className="text-xs font-medium text-muted mb-1.5 block">
                                        Keywords <span className="text-[10px] font-normal">(one per line)</span>
                                    </label>
                                    <textarea
                                        ref={textareaRef}
                                        value={bulkText}
                                        onChange={(e) => { setBulkText(e.target.value); setAnalysisResults(null); }}
                                        placeholder={`${activeBusiness.services[0] || "service"} near me\n${activeBusiness.services[1] || "repair"} ${activeBusiness.location.split(" ")[0].toLowerCase()}\nbest ${activeBusiness.services[0] || "service"} in ${activeBusiness.location.split(",")[0]}\n${activeBusiness.services[2] || "consultation"} cost\n...`}
                                        rows={8}
                                        className="w-full bg-sidebar border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary transition resize-none font-mono leading-relaxed"
                                    />
                                    <div className="flex items-center justify-between mt-1">
                                        <span className="text-[10px] text-muted">
                                            {bulkText.split("\n").filter((l: string) => l.trim()).length} keywords detected
                                        </span>
                                        <span className="text-[10px] text-muted">
                                            Paste from spreadsheet, Word doc, or type manually
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-muted mb-1.5 block">Assign to Campaign (optional)</label>
                                    <input
                                        type="text"
                                        value={bulkCampaign}
                                        onChange={(e) => setBulkCampaign(e.target.value)}
                                        placeholder="e.g., General, Spring Campaign"
                                        className="w-full bg-sidebar border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition"
                                    />
                                </div>

                                {/* Analyze button */}
                                {!analysisResults && (
                                    <button
                                        onClick={handleBulkAdd}
                                        disabled={!bulkText.trim() || isAnalyzing}
                                        className="w-full bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-xl py-3 text-sm font-medium hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {isAnalyzing ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                AI is analyzing {bulkText.split("\n").filter((l: string) => l.trim()).length} keywords...
                                            </>
                                        ) : (
                                            <>
                                                <Zap className="w-4 h-4" />
                                                Bulk Analyze with AI
                                            </>
                                        )}
                                    </button>
                                )}

                                {/* Bulk analysis results */}
                                {analysisResults && analysisResults.length > 1 && (
                                    <div className="space-y-3">
                                        <div className="bg-sidebar rounded-xl p-3">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-xs font-bold flex items-center gap-1.5">
                                                    <Brain className="w-3.5 h-3.5 text-purple-400" />
                                                    AI Bulk Analysis
                                                </span>
                                                <span className="text-[10px] text-muted">
                                                    {analysisResults.filter(r => r.score >= 5).length}/{analysisResults.length} approved
                                                </span>
                                            </div>
                                            <div className="space-y-1.5 max-h-48 overflow-y-auto">
                                                {analysisResults.map((r, i) => (
                                                    <div key={i} className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg hover:bg-card/50">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`font-mono ${r.score >= 7 ? "text-success" : r.score >= 5 ? "text-warning" : "text-danger line-through"}`}>
                                                                {r.keyword}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-[10px] ${getTrendBadge(r.trend).color} px-1.5 py-0.5 rounded-full`}>
                                                                {getTrendBadge(r.trend).label}
                                                            </span>
                                                            <span className={`font-bold text-[10px] ${r.score >= 7 ? "text-success" : r.score >= 5 ? "text-warning" : "text-danger"}`}>
                                                                {r.verdict}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <button
                                                onClick={confirmBulkAdd}
                                                className="flex-1 bg-primary text-white rounded-xl py-3 text-sm font-medium hover:bg-primary/90 transition flex items-center justify-center gap-2"
                                            >
                                                <CheckCircle2 className="w-4 h-4" />
                                                Add {analysisResults.filter(r => r.score >= 5).length} Approved Keywords
                                            </button>
                                            <button
                                                onClick={() => { setAnalysisResults(null); setBulkText(""); }}
                                                className="px-4 border border-border rounded-xl text-sm hover:bg-sidebar transition"
                                            >
                                                Cancel
                                            </button>
                                        </div>

                                        <p className="text-[10px] text-muted text-center">
                                            \u274c Keywords scored below 5/10 were filtered out. The AI will continue optimizing approved keywords.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */}
            {/* \u2500\u2500 Export Report Modal \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */}
            {/* \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */}
            {showReportModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setShowReportModal(false); setExportDone(false); }}>
                    <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="flex items-center justify-between p-5 border-b border-border">
                            <div>
                                <h2 className="text-lg font-bold flex items-center gap-2">
                                    <FileDown className="w-5 h-5 text-primary" />
                                    Export Keyword Report
                                </h2>
                                <p className="text-xs text-muted mt-0.5">
                                    Generate a branded report for <strong>{activeBusiness.name}</strong>
                                </p>
                            </div>
                            <button onClick={() => { setShowReportModal(false); setExportDone(false); }} className="p-2 hover:bg-sidebar rounded-lg transition">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-5 space-y-5">
                            {/* Report branding preview */}
                            <div className="bg-sidebar rounded-xl p-4 border border-border">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${activeBusiness.color} flex items-center justify-center text-[10px] font-bold text-white`}>
                                        {activeBusiness.initials}
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold">{activeBusiness.name}</div>
                                        <div className="text-[10px] text-muted">{activeBusiness.industry} \u00b7 {activeBusiness.location}</div>
                                    </div>
                                    <div className="ml-auto flex items-center gap-2">
                                        <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={reportBranding}
                                                onChange={() => setReportBranding(!reportBranding)}
                                                className="rounded border-border"
                                            />
                                            Include branding
                                        </label>
                                    </div>
                                </div>
                                {reportBranding && (
                                    <div className="bg-card rounded-lg p-3 border border-border/50">
                                        <div className="flex items-center justify-between text-[10px] text-muted">
                                            <span className="flex items-center gap-1">
                                                <div className={`w-3 h-3 rounded bg-gradient-to-br ${activeBusiness.color}`}></div>
                                                Header: {activeBusiness.name} logo & brand colors
                                            </span>
                                            <span>Footer: {activeBusiness.url} \u00b7 Generated by AdMaster Pro AI</span>
                                        </div>
                                        <div className={`h-1.5 w-full bg-gradient-to-r ${activeBusiness.color} rounded-full mt-2 opacity-60`}></div>
                                    </div>
                                )}
                            </div>

                            {/* Format selection */}
                            <div>
                                <label className="text-xs font-medium text-muted mb-2 block">Export Format</label>
                                <div className="grid grid-cols-5 gap-2">
                                    {([
                                        { id: "pdf" as ExportFormat, label: "PDF", icon: FileText, desc: "Best for printing" },
                                        { id: "excel" as ExportFormat, label: "Excel", icon: FileSpreadsheet, desc: "Editable data" },
                                        { id: "word" as ExportFormat, label: "Word", icon: File, desc: "Full report" },
                                        { id: "csv" as ExportFormat, label: "CSV", icon: FileDown, desc: "Raw data" },
                                        { id: "print" as ExportFormat, label: "Print", icon: Printer, desc: "Direct print" },
                                    ]).map((fmt) => (
                                        <button
                                            key={fmt.id}
                                            onClick={() => setReportFormat(fmt.id)}
                                            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition ${reportFormat === fmt.id ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "border-border hover:border-primary/50"}`}
                                        >
                                            <fmt.icon className={`w-5 h-5 ${reportFormat === fmt.id ? "text-primary" : "text-muted"}`} />
                                            <span className="text-xs font-medium">{fmt.label}</span>
                                            <span className="text-[9px] text-muted">{fmt.desc}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Date range */}
                            <div>
                                <label className="text-xs font-medium text-muted mb-2 block">Date Range</label>
                                <div className="flex gap-2">
                                    {([
                                        { id: "7d" as const, label: "Last 7 days" },
                                        { id: "30d" as const, label: "Last 30 days" },
                                        { id: "90d" as const, label: "Last 90 days" },
                                        { id: "all" as const, label: "All time" },
                                    ]).map((range) => (
                                        <button
                                            key={range.id}
                                            onClick={() => setReportDateRange(range.id)}
                                            className={`flex-1 text-xs py-2 rounded-lg border transition ${reportDateRange === range.id ? "border-primary bg-primary/10 text-primary font-medium" : "border-border hover:border-primary/50"}`}
                                        >
                                            {range.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Report sections */}
                            <div>
                                <label className="text-xs font-medium text-muted mb-2 block">Report Sections</label>
                                <div className="space-y-1.5">
                                    {reportSections.map((section) => (
                                        <label
                                            key={section.id}
                                            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${section.checked ? "border-primary/30 bg-primary/5" : "border-border hover:border-border/80"}`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={section.checked}
                                                onChange={() => toggleReportSection(section.id)}
                                                className="rounded border-border accent-primary"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium">{section.label}</div>
                                                <div className="text-[10px] text-muted">{section.description}</div>
                                            </div>
                                            {section.id === "trends" && <Globe className="w-4 h-4 text-blue-400 shrink-0" />}
                                            {section.id === "recommendations" && <Brain className="w-4 h-4 text-purple-400 shrink-0" />}
                                            {section.id === "forecast" && <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Export button */}
                            <button
                                onClick={handleExport}
                                disabled={isExporting || !reportSections.some(s => s.checked)}
                                className={`w-full rounded-xl py-3.5 text-sm font-medium transition flex items-center justify-center gap-2 ${exportDone ? "bg-success text-white" : "bg-primary text-white hover:bg-primary/90"} disabled:opacity-50`}
                            >
                                {isExporting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Generating {reportFormat.toUpperCase()} report...
                                    </>
                                ) : exportDone ? (
                                    <>
                                        <CheckCircle2 className="w-4 h-4" />
                                        Report Downloaded!
                                    </>
                                ) : (
                                    <>
                                        <FileDown className="w-4 h-4" />
                                        Export as {reportFormat.toUpperCase()}
                                    </>
                                )}
                            </button>

                            {exportDone && (
                                <p className="text-[10px] text-muted text-center">
                                    \u2705 Your {reportFormat.toUpperCase()} report for {activeBusiness.name} has been generated with{reportBranding ? " branded" : ""} headers & footers.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
