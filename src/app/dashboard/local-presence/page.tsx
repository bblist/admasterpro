"use client";

import { useState, useEffect, useCallback } from "react";
import {
    MapPin, Star, Shield, Globe, Phone, Clock, Camera, MessageSquare,
    CheckCircle2, AlertTriangle, Info, ArrowRight, ExternalLink,
    Loader2, RefreshCw, TrendingUp, Users, Search, Zap, Brain,
    ChevronDown, ChevronUp, Building2,
} from "lucide-react";
import { useBusiness } from "@/lib/business-context";
import { useTranslation } from "@/i18n/context";
import { authFetch } from "@/lib/auth-client";
import { inferBusinessType, type BusinessSignals, type LocalImportance } from "@/lib/ad-strategy";

// ─── Types ─────────────────────────────────────────────────────────────────

interface ChecklistItem {
    id: string;
    title: string;
    description: string;
    category: "gbp" | "maps" | "reviews" | "citations" | "website";
    priority: "critical" | "high" | "medium";
    icon: React.ComponentType<{ className?: string }>;
    link?: string;
    linkLabel?: string;
}

// ─── Universal Local SEO Checklist ─────────────────────────────────────────

const LOCAL_CHECKLIST: ChecklistItem[] = [
    // Google Business Profile
    { id: "gbp-claim", title: "Claim & verify your Google Business Profile", description: "If you haven't already, go to business.google.com to claim and verify your listing. This is step #1 for local visibility.", category: "gbp", priority: "critical", icon: Shield, link: "https://business.google.com", linkLabel: "Go to Google Business Profile" },
    { id: "gbp-info", title: "Complete all business information", description: "Fill in name, address, phone, website, hours, categories, and attributes. Incomplete profiles rank lower.", category: "gbp", priority: "critical", icon: Building2 },
    { id: "gbp-categories", title: "Set primary + secondary categories", description: "Choose the most specific primary category (e.g., 'Cosmetic Dentist' not just 'Dentist'). Add 2-5 secondary categories.", category: "gbp", priority: "high", icon: Search },
    { id: "gbp-photos", title: "Add 10+ high-quality photos", description: "Businesses with photos get 42% more direction requests and 35% more website clicks. Include exterior, interior, team, and product/service photos.", category: "gbp", priority: "high", icon: Camera },
    { id: "gbp-posts", title: "Post updates at least weekly", description: "Google Posts keep your profile active. Share offers, events, updates, or tips. Google rewards active profiles with better visibility.", category: "gbp", priority: "medium", icon: MessageSquare },
    { id: "gbp-hours", title: "Keep hours accurate (inc. holidays)", description: "Wrong hours = angry customers + lower trust. Update for holidays, special events, and seasonal changes.", category: "gbp", priority: "high", icon: Clock },
    { id: "gbp-services", title: "Add all services with descriptions", description: "List every service you offer with a brief description. This helps Google match you to relevant searches.", category: "gbp", priority: "high", icon: Info },

    // Maps Optimisation
    { id: "maps-nap", title: "NAP consistency (Name, Address, Phone)", description: "Your business name, address, and phone must be EXACTLY the same everywhere — website, GBP, social media, directories. Even small differences hurt.", category: "maps", priority: "critical", icon: MapPin },
    { id: "maps-embed", title: "Embed Google Maps on your website", description: "Add an embedded Google Map on your contact/location page. This sends a relevance signal to Google.", category: "maps", priority: "medium", icon: Globe },
    { id: "maps-schema", title: "Add LocalBusiness schema markup", description: "Add structured data (JSON-LD) to your site with business name, address, phone, hours, and geo coordinates.", category: "maps", priority: "high", icon: Zap },

    // Reviews
    { id: "reviews-ask", title: "Actively ask for reviews", description: "Send a direct Google review link after every job/visit. Aim for at least 2-3 new reviews per month. Google values recency.", category: "reviews", priority: "critical", icon: Star },
    { id: "reviews-respond", title: "Respond to EVERY review within 24 hours", description: "Thank positive reviewers by name. For negative reviews: apologize, explain, offer resolution. Google measures response rate.", category: "reviews", priority: "critical", icon: MessageSquare },
    { id: "reviews-keywords", title: "Encourage specific review content", description: "Ask customers to mention the specific service  they received and your location. 'Dr. Smith did a great teeth whitening in Manchester' is more valuable than 'Great service'.", category: "reviews", priority: "medium", icon: Search },

    // Citations & Directories
    { id: "cit-google", title: "Verify on Google", description: "Your GBP listing is the #1 citation. Make sure it's verified and complete.", category: "citations", priority: "critical", icon: CheckCircle2, link: "https://business.google.com", linkLabel: "Google Business Profile" },
    { id: "cit-yelp", title: "Claim your Yelp listing", description: "Even if you don't use Yelp actively, claim it for NAP consistency and a backlink.", category: "citations", priority: "medium", icon: Star, link: "https://biz.yelp.com", linkLabel: "Yelp for Business" },
    { id: "cit-social", title: "Consistent info on all social profiles", description: "Facebook, Instagram, LinkedIn — all should have the exact same NAP as your GBP.", category: "citations", priority: "high", icon: Users },
    { id: "cit-industry", title: "Industry-specific directories", description: "Register on directories for your industry: Healthgrades (medical), Avvo (legal), HomeAdvisor (trades), TripAdvisor (restaurants), etc.", category: "citations", priority: "medium", icon: Building2 },

    // Website Local Signals
    { id: "web-location", title: "Location pages on your website", description: "If you serve multiple areas, create a dedicated page for each with unique local content. E.g., '/dentist-manchester' with Manchester-specific info.", category: "website", priority: "high", icon: Globe },
    { id: "web-phone", title: "Click-to-call on mobile", description: "Use tel: links for your phone number. 60% of mobile searches lead to a call within the hour.", category: "website", priority: "high", icon: Phone },
    { id: "web-testimonials", title: "Display reviews on your website", description: "Show Google reviews on your site using a review widget. Social proof converts visitors.", category: "website", priority: "medium", icon: Star },
];

// ─── Category Config ───────────────────────────────────────────────────────

const CATEGORIES = [
    { key: "gbp", label: "Google Business Profile", icon: Building2, color: "text-blue-600" },
    { key: "maps", label: "Maps Optimisation", icon: MapPin, color: "text-emerald-600" },
    { key: "reviews", label: "Reviews", icon: Star, color: "text-amber-500" },
    { key: "citations", label: "Citations & Directories", icon: Globe, color: "text-purple-600" },
    { key: "website", label: "Website Local Signals", icon: Search, color: "text-rose-500" },
] as const;

const PRIORITY_CONFIG = {
    critical: { bg: "bg-red-100", text: "text-red-700", label: "Critical" },
    high: { bg: "bg-amber-100", text: "text-amber-700", label: "High" },
    medium: { bg: "bg-blue-100", text: "text-blue-700", label: "Medium" },
};

const IMPORTANCE_CONFIG: Record<LocalImportance, { score: number; grade: string; color: string; bgColor: string; message: string }> = {
    critical: { score: 100, grade: "A+", color: "text-emerald-700", bgColor: "bg-emerald-100", message: "Local presence is ESSENTIAL for your business. Every item below directly impacts your visibility and revenue." },
    high: { score: 85, grade: "A", color: "text-blue-700", bgColor: "bg-blue-100", message: "Local presence is very important. Most of your customers find you through local search." },
    moderate: { score: 65, grade: "B", color: "text-amber-700", bgColor: "bg-amber-100", message: "Local presence helps but isn't your primary channel. Focus on the critical items." },
    low: { score: 40, grade: "C", color: "text-gray-700", bgColor: "bg-gray-100", message: "Local presence is a secondary concern for your business type. Online channels are more important." },
    none: { score: 10, grade: "N/A", color: "text-gray-500", bgColor: "bg-gray-50", message: "Your business operates nationally/globally. Local search isn't relevant. Focus on your online presence instead." },
};

export default function LocalPresencePage() {
    const { t } = useTranslation();
    const { activeBusiness } = useBusiness();
    void t;

    const [localImportance, setLocalImportance] = useState<LocalImportance>("moderate");
    const [mapsMatters, setMapsMatters] = useState(true);
    const [reviewsMatter, setReviewsMatter] = useState(true);
    const [gbpMatters, setGbpMatters] = useState(true);
    const [businessType, setBusinessType] = useState("General Business");
    const [loading, setLoading] = useState(true);
    const [completed, setCompleted] = useState<Set<string>>(() => {
        // Load from localStorage
        if (typeof window !== "undefined") {
            try {
                const saved = localStorage.getItem(`local-checklist-${activeBusiness?.id}`);
                return saved ? new Set(JSON.parse(saved)) : new Set();
            } catch { return new Set(); }
        }
        return new Set();
    });
    const [expandedCategory, setExpandedCategory] = useState<string | null>("gbp");

    const analyze = useCallback(async () => {
        setLoading(true);

        let kbText = "";
        if (activeBusiness?.id) {
            try {
                const res = await authFetch(`/api/knowledge-base?businessId=${activeBusiness.id}`);
                if (res.ok) {
                    const data = await res.json();
                    kbText = (data.items || []).map((item: { title?: string; content?: string }) =>
                        `${item.title || ""}\n${item.content || ""}`
                    ).join("\n\n").slice(0, 10000);
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
        setLocalImportance(result.strategy.localImportance);
        setMapsMatters(result.strategy.mapsMatters);
        setReviewsMatter(result.strategy.reviewsMatter);
        setGbpMatters(result.strategy.gbpMatters);
        setBusinessType(result.strategy.businessType);
        setLoading(false);
    }, [activeBusiness]);

    useEffect(() => {
        analyze();
    }, [analyze]);

    // Persist completed items
    useEffect(() => {
        if (activeBusiness?.id && completed.size > 0) {
            localStorage.setItem(`local-checklist-${activeBusiness.id}`, JSON.stringify([...completed]));
        }
    }, [completed, activeBusiness?.id]);

    const toggleItem = (id: string) => {
        setCompleted(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center space-y-4">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
                    <p className="text-gray-600">Analyzing local presence requirements...</p>
                </div>
            </div>
        );
    }

    const impConfig = IMPORTANCE_CONFIG[localImportance];
    const totalItems = LOCAL_CHECKLIST.length;
    const completedCount = completed.size;
    const progressPct = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

    // Filter items based on relevance
    const relevantItems = LOCAL_CHECKLIST.filter(item => {
        if (localImportance === "none") return item.priority === "critical"; // Show only essentials
        if (!mapsMatters && item.category === "maps") return false;
        if (!gbpMatters && item.category === "gbp" && item.priority === "medium") return false;
        return true;
    });

    const criticalRemaining = relevantItems.filter(i => i.priority === "critical" && !completed.has(i.id)).length;

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* ── Header ── */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <MapPin className="w-7 h-7 text-emerald-600" />
                        Local Presence Checker
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Optimize your local visibility for <strong>{activeBusiness?.name || "your business"}</strong>
                    </p>
                </div>
                <button
                    onClick={analyze}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition flex items-center gap-2 text-sm font-medium"
                >
                    <RefreshCw className="w-4 h-4" />
                    Re-analyze
                </button>
            </div>

            {/* ── Importance Score Card ── */}
            <div className="bg-white rounded-xl border p-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                            Local Presence Importance for {businessType}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">{impConfig.message}</p>
                    </div>
                    <div className={`flex items-center justify-center w-16 h-16 rounded-full ${impConfig.bgColor}`}>
                        <span className={`text-2xl font-bold ${impConfig.color}`}>{impConfig.grade}</span>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <QuickStat
                        label="Local Importance"
                        value={localImportance.charAt(0).toUpperCase() + localImportance.slice(1)}
                        color={impConfig.color}
                    />
                    <QuickStat
                        label="Maps Ranking"
                        value={mapsMatters ? "Important" : "Not Priority"}
                        color={mapsMatters ? "text-emerald-600" : "text-gray-400"}
                    />
                    <QuickStat
                        label="Reviews"
                        value={reviewsMatter ? "Very Important" : "Less Critical"}
                        color={reviewsMatter ? "text-amber-600" : "text-gray-400"}
                    />
                    <QuickStat
                        label="Google Business Profile"
                        value={gbpMatters ? "Essential" : "Optional"}
                        color={gbpMatters ? "text-blue-600" : "text-gray-400"}
                    />
                </div>
            </div>

            {localImportance === "none" && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center space-y-3">
                    <Globe className="w-10 h-10 text-blue-500 mx-auto" />
                    <h3 className="text-lg font-semibold text-blue-900">You&apos;re a National/Global Business</h3>
                    <p className="text-blue-700 text-sm max-w-lg mx-auto">
                        Local search isn&apos;t your primary channel. Focus on your online advertising strategy instead.
                        Check the <a href="/dashboard/strategy" className="underline font-medium">Strategy Advisor</a> for channel recommendations.
                    </p>
                </div>
            )}

            {localImportance !== "none" && (
                <>
                    {/* ── Progress Bar ── */}
                    <div className="bg-white rounded-xl border p-6 space-y-3">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Local SEO Checklist
                            </h2>
                            <span className="text-sm text-gray-500">
                                {completedCount}/{relevantItems.length} completed ({progressPct}%)
                            </span>
                        </div>
                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                                style={{ width: `${progressPct}%` }}
                            />
                        </div>
                        {criticalRemaining > 0 && (
                            <p className="text-sm text-red-600 flex items-center gap-1">
                                <AlertTriangle className="w-4 h-4" />
                                {criticalRemaining} critical item{criticalRemaining > 1 ? "s" : ""} remaining
                            </p>
                        )}
                    </div>

                    {/* ── Checklist by Category ── */}
                    <div className="space-y-4">
                        {CATEGORIES.map(cat => {
                            const items = relevantItems.filter(i => i.category === cat.key);
                            if (items.length === 0) return null;
                            const catCompleted = items.filter(i => completed.has(i.id)).length;
                            const isExpanded = expandedCategory === cat.key;
                            const CatIcon = cat.icon;

                            return (
                                <div key={cat.key} className="bg-white rounded-xl border overflow-hidden">
                                    <button
                                        onClick={() => setExpandedCategory(isExpanded ? null : cat.key)}
                                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition"
                                    >
                                        <div className="flex items-center gap-3">
                                            <CatIcon className={`w-5 h-5 ${cat.color}`} />
                                            <h3 className="font-semibold text-gray-900">{cat.label}</h3>
                                            <span className="text-xs text-gray-400">
                                                {catCompleted}/{items.length}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {catCompleted === items.length && (
                                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                            )}
                                            {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                                        </div>
                                    </button>

                                    {isExpanded && (
                                        <div className="border-t divide-y">
                                            {items.map(item => {
                                                const isDone = completed.has(item.id);
                                                const priConfig = PRIORITY_CONFIG[item.priority];
                                                const ItemIcon = item.icon;

                                                return (
                                                    <div
                                                        key={item.id}
                                                        className={`flex items-start gap-3 p-4 ${isDone ? "bg-emerald-50/50" : ""} cursor-pointer hover:bg-gray-50 transition`}
                                                        onClick={() => toggleItem(item.id)}
                                                    >
                                                        <div className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition ${isDone ? "bg-emerald-500 border-emerald-500" : "border-gray-300"}`}>
                                                            {isDone && <CheckCircle2 className="w-4 h-4 text-white" />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <ItemIcon className={`w-4 h-4 ${isDone ? "text-emerald-500" : "text-gray-400"}`} />
                                                                <span className={`text-sm font-medium ${isDone ? "text-emerald-700 line-through" : "text-gray-900"}`}>
                                                                    {item.title}
                                                                </span>
                                                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${priConfig.bg} ${priConfig.text}`}>
                                                                    {priConfig.label}
                                                                </span>
                                                            </div>
                                                            <p className={`text-xs ${isDone ? "text-emerald-600/70" : "text-gray-500"} leading-relaxed`}>
                                                                {item.description}
                                                            </p>
                                                            {item.link && (
                                                                <a
                                                                    href={item.link}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="inline-flex items-center gap-1 mt-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium"
                                                                    onClick={e => e.stopPropagation()}
                                                                >
                                                                    {item.linkLabel || "Open"} <ExternalLink className="w-3 h-3" />
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {/* ── CTA ── */}
            <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl border p-6 text-center space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">Need help with local SEO?</h3>
                <p className="text-gray-600 text-sm">
                    Ask the AI assistant about Maps ranking, review strategies, or Google Business Profile optimization.
                </p>
                <a
                    href="/dashboard/chat?intent=local_presence"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium text-sm"
                >
                    <Brain className="w-4 h-4" />
                    Ask AI About Local Presence
                </a>
            </div>
        </div>
    );
}

function QuickStat({ label, value, color }: { label: string; value: string; color: string }) {
    return (
        <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className={`text-sm font-bold ${color}`}>{value}</p>
        </div>
    );
}
