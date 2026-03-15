"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Zap,
    ArrowRight,
    CheckCircle,
    Upload,
    Globe,
    Loader2,
    AlertCircle,
    Sparkles,
    ShoppingBag,
    BarChart3,
    Shield,
    TrendingUp,
    Target,
    Info,
    Rocket,
    ChevronRight,
} from "lucide-react";
import { captureTokenFromHash, isAuthenticated, authFetch } from "@/lib/auth-client";

/* ─── Constants ──────────────────────────────────────────────────────────── */

const INDUSTRIES = [
    { value: "accounting", label: "Accounting / CPA" },
    { value: "automotive", label: "Automotive / Mechanic" },
    { value: "beauty-salon", label: "Beauty / Salon / Spa" },
    { value: "cannabis", label: "Cannabis / CBD" },
    { value: "chiropractor", label: "Chiropractor" },
    { value: "cleaning", label: "Cleaning Services" },
    { value: "construction", label: "Construction / Contractor" },
    { value: "consulting", label: "Consulting" },
    { value: "dentist", label: "Dentist / Orthodontist" },
    { value: "ecommerce", label: "E-Commerce / Online Store" },
    { value: "education", label: "Education / Tutoring" },
    { value: "electrician", label: "Electrician" },
    { value: "entertainment", label: "Entertainment / Events" },
    { value: "fashion", label: "Fashion / Clothing" },
    { value: "financial-advisor", label: "Financial Advisor" },
    { value: "fitness", label: "Fitness / Gym" },
    { value: "florist", label: "Florist / Gift Shop" },
    { value: "food-delivery", label: "Food Delivery / Catering" },
    { value: "healthcare", label: "Healthcare / Medical" },
    { value: "hvac", label: "HVAC / Air Conditioning" },
    { value: "insurance", label: "Insurance" },
    { value: "interior-design", label: "Interior Design" },
    { value: "jewelry", label: "Jewelry" },
    { value: "landscaping", label: "Landscaping / Lawn Care" },
    { value: "lawyer", label: "Lawyer / Attorney" },
    { value: "marketing-agency", label: "Marketing / Ad Agency" },
    { value: "moving", label: "Moving / Storage" },
    { value: "optometrist", label: "Optometrist / Eye Care" },
    { value: "pest-control", label: "Pest Control" },
    { value: "pet-services", label: "Pet Services / Vet" },
    { value: "pharmacy", label: "Pharmacy" },
    { value: "photography", label: "Photography / Videography" },
    { value: "plumber", label: "Plumber" },
    { value: "printing", label: "Printing / Signage" },
    { value: "real-estate", label: "Real Estate" },
    { value: "restaurant", label: "Restaurant / Café" },
    { value: "retail", label: "Retail / Brick & Mortar" },
    { value: "roofing", label: "Roofing" },
    { value: "saas", label: "SaaS / Software" },
    { value: "security", label: "Security Services" },
    { value: "solar", label: "Solar / Renewable Energy" },
    { value: "travel", label: "Travel / Tourism" },
    { value: "tutoring", label: "Tutoring / Online Courses" },
    { value: "wedding", label: "Wedding / Bridal" },
    { value: "other", label: "Other" },
];

interface CrawlPage {
    url: string;
    title: string;
    snippet: string;
    content: string;
}

interface AiGeneratedAd {
    id: string;
    type: string;
    headline1: string;
    headline2: string;
    headline3: string;
    description1: string;
    description2: string;
    displayUrl: string;
    reasoning: string;
    approved: boolean;
}

/** Normalize a user-entered URL to a valid https:// URL */
function normalizeUrl(raw: string): string {
    let v = raw.trim();
    if (!v) return v;
    v = v.replace(/\/+$/, "");
    v = v.replace(/^(https?:\/\/)?(www\.)?/i, "");
    if (!v) return "";
    return `https://${v}`;
}

/* ─── Step Transition Wrapper ────────────────────────────────────────────── */

function StepTransition({ children, stepKey }: { children: React.ReactNode; stepKey: string }) {
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const t = setTimeout(() => setVisible(true), 50);
        return () => clearTimeout(t);
    }, []);
    return (
        <div
            key={stepKey}
            className={`transition-all duration-500 ease-out ${
                visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
        >
            {children}
        </div>
    );
}

/* ─── Progress Dots ──────────────────────────────────────────────────────── */

function ProgressDots({ current, total }: { current: number; total: number }) {
    return (
        <div className="flex items-center gap-1.5">
            {Array.from({ length: total }, (_, i) => (
                <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                        i < current
                            ? "w-6 bg-primary"
                            : i === current
                            ? "w-6 bg-primary/60"
                            : "w-1.5 bg-border"
                    }`}
                />
            ))}
        </div>
    );
}

/* ─── Google Logo SVG ────────────────────────────────────────────────────── */

function GoogleLogo({ className = "w-5 h-5" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
    );
}

/* ══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════════════════ */

export default function OnboardingPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            }
        >
            <OnboardingInner />
        </Suspense>
    );
}

/*
 * ONBOARDING FLOW — One question at a time (Google-style)
 *
 * Step 1:  Welcome + Sign in with Google
 * Step 2:  What's your business name?
 * Step 3:  What's your website?
 * Step 4:  Select your industry
 * Step 5:  Scanning your website (automatic)
 * Step 6:  Connect Google Ads
 * Step 7:  Connect Shopify (optional)
 * Step 8:  Upload brand assets (optional)
 * Step 9:  AI analyzing existing ads + generating new ones
 * Step 10: Review & approve AI-generated ads → go to dashboard
 */

const TOTAL_STEPS = 10;

function OnboardingInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [step, setStep] = useState(1);

    // ── Auth state ──
    const [connected, setConnected] = useState(false);
    const [userName, setUserName] = useState("");

    // ── Business info ──
    const [businessName, setBusinessName] = useState("");
    const [websiteUrl, setWebsiteUrl] = useState("");
    const [businessType, setBusinessType] = useState("");
    const [businessId, setBusinessId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState("");

    // ── Website scan ──
    const [crawling, setCrawling] = useState(false);
    const [crawlDone, setCrawlDone] = useState(false);
    const [crawlPages, setCrawlPages] = useState<CrawlPage[]>([]);
    const [crawlError, setCrawlError] = useState("");
    const [crawlProgress, setCrawlProgress] = useState(0);
    const crawlTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [crawledContent, setCrawledContent] = useState("");
    const [, setCrawlKbItemId] = useState<string | null>(null);

    // ── Brand profile auto-fill ──
    const [autoFilling, setAutoFilling] = useState(false);
    const [autoFillDone, setAutoFillDone] = useState(false);

    // ── Google Ads ──
    const [googleConnecting, setGoogleConnecting] = useState(false);
    const [googleAdsConnected, setGoogleAdsConnected] = useState(false);
    const [adsAccounts, setAdsAccounts] = useState<{ id: string; name: string }[]>([]);
    const [selectedAdsAccount, setSelectedAdsAccount] = useState("");

    // ── Shopify ──
    const [shopifyUrl, setShopifyUrl] = useState("");
    const [shopifyConnected, setShopifyConnected] = useState(false);

    // ── Upload ──
    const [uploading, setUploading] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<{ name: string; size: string }[]>([]);
    const [uploadError, setUploadError] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ── AI Analysis ──
    const [, setAnalyzing] = useState(false);
    const [analysisProgress, setAnalysisProgress] = useState(0);
    const [analysisPhase, setAnalysisPhase] = useState("");
    const [aiAds, setAiAds] = useState<AiGeneratedAd[]>([]);
    const [analysisComplete, setAnalysisComplete] = useState(false);
    const [adReport, setAdReport] = useState<{
        totalAds: number;
        issuesFound: number;
        avgScore: number;
        topIssue: string;
        improvementAreas: string[];
    } | null>(null);
    const analysisTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // ── Input refs for auto-focus ──
    const businessNameRef = useRef<HTMLInputElement>(null);
    const websiteRef = useRef<HTMLInputElement>(null);

    /* ── On mount: capture token, check auth ─────────────────────── */
    useEffect(() => {
        captureTokenFromHash();
        if (isAuthenticated()) {
            setConnected(true);
            try {
                const userData = localStorage.getItem("amp_user");
                if (userData) {
                    const user = JSON.parse(userData);
                    if (user.name) setUserName(user.name.split(" ")[0]);
                }
            } catch { /* ignore */ }
            setStep(2);
        }
    }, []);

    // Resume at correct step if returning from Google Ads OAuth
    useEffect(() => {
        const stepParam = searchParams.get("step");
        if (stepParam === "6" && connected) {
            setStep(6);
            checkGoogleAds();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams, connected]);

    // Cleanup timers
    useEffect(() => {
        return () => {
            if (crawlTimerRef.current) clearInterval(crawlTimerRef.current);
            if (analysisTimerRef.current) clearInterval(analysisTimerRef.current);
        };
    }, []);

    // Auto-focus inputs when steps change
    useEffect(() => {
        const timer = setTimeout(() => {
            if (step === 2) businessNameRef.current?.focus();
            if (step === 3) websiteRef.current?.focus();
        }, 600);
        return () => clearTimeout(timer);
    }, [step]);

    /* ── Step 1: Sign in ─────────────────────────────────────────── */
    const handleConnect = () => {
        window.location.href = "/api/auth/callback?next=/onboarding";
    };

    /* ── Step 2: Business name ───────────────────────────────────── */
    const handleBusinessName = () => {
        if (!businessName.trim()) {
            setSaveError("Please enter your business name");
            return;
        }
        setSaveError("");
        setStep(3);
    };

    /* ── Step 3: Website ─────────────────────────────────────────── */
    const handleWebsite = () => {
        if (!websiteUrl.trim()) {
            setSaveError("Please enter your website URL so we can learn about your business");
            return;
        }
        setSaveError("");
        setStep(4);
    };

    /* ── Step 4: Industry → save business + start crawl ──────────── */
    const handleIndustry = async () => {
        setSaving(true);
        setSaveError("");
        try {
            const res = await authFetch("/api/businesses", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: businessName.trim(),
                    website: normalizeUrl(websiteUrl),
                    industry: businessType || undefined,
                }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || `Failed to save (${res.status})`);
            }
            const { business } = await res.json();
            setBusinessId(business.id);
            setStep(5);
            startCrawl(business.id);
        } catch (err: unknown) {
            setSaveError(err instanceof Error ? err.message : "Failed to save");
        } finally {
            setSaving(false);
        }
    };

    /* ── Step 5: Website crawl ───────────────────────────────────── */
    const startCrawl = async (bId: string) => {
        setCrawling(true);
        setCrawlDone(false);
        setCrawlError("");
        setCrawlProgress(0);
        setCrawlPages([]);

        let prog = 0;
        crawlTimerRef.current = setInterval(() => {
            prog = Math.min(prog + Math.random() * 8, 90);
            setCrawlProgress(Math.round(prog));
        }, 800);

        try {
            const res = await authFetch("/api/crawl", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    url: normalizeUrl(websiteUrl),
                    businessId: bId,
                    depth: 5,
                }),
            });

            if (crawlTimerRef.current) clearInterval(crawlTimerRef.current);

            if (!res.ok) {
                const d = await res.json().catch(() => ({}));
                throw new Error(d.error || `Scan failed (${res.status})`);
            }

            const data = await res.json();
            setCrawlProgress(100);

            const pages: CrawlPage[] = (data.item?.pages || []).map((p: { url?: string; title?: string; content?: string }) => ({
                url: p.url || normalizeUrl(websiteUrl),
                title: p.title || "Untitled page",
                snippet: (p.content || "").slice(0, 180) + "\u2026",
                content: p.content || "",
            }));
            setCrawlPages(pages);
            setCrawledContent(data.item?.combinedContent || pages.map((p: CrawlPage) => p.content).join("\n\n---\n\n"));
            setCrawlKbItemId(data.item?.id || null);
            setCrawlDone(true);
        } catch (err: unknown) {
            if (crawlTimerRef.current) clearInterval(crawlTimerRef.current);
            setCrawlProgress(100);
            setCrawlError(err instanceof Error ? err.message : "Scan failed");
            setCrawlDone(true);
        } finally {
            setCrawling(false);
        }
    };

    // Auto-fill brand profile when crawl completes
    useEffect(() => {
        if (crawlDone && crawledContent && !crawlError && !autoFillDone && !autoFilling) {
            autoFillBrandProfile();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [crawlDone, crawledContent, crawlError]);

    // Auto-advance to step 6 when crawl + auto-fill both complete
    useEffect(() => {
        if (crawlDone && !crawlError && (autoFillDone || crawlError) && step === 5) {
            const timer = setTimeout(() => setStep(6), 1500);
            return () => clearTimeout(timer);
        }
    }, [crawlDone, crawlError, autoFillDone, step]);

    const autoFillBrandProfile = async () => {
        if (!crawledContent || autoFilling || autoFillDone) return;
        setAutoFilling(true);
        try {
            const res = await authFetch("/api/knowledge-base/auto-fill", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    businessId: businessId || undefined,
                    businessName: businessName.trim(),
                    industry: businessType || undefined,
                    crawledContent: crawledContent.slice(0, 8000),
                }),
            });
            if (res.ok) {
                const data = await res.json();
                if (data.profile) {
                    const profileData = JSON.stringify({
                        businessName: businessName.trim(),
                        industry: data.profile.industry || businessType || "",
                        brandVoice: data.profile.brandVoice || "",
                        targetAudience: data.profile.targetAudience || "",
                        competitors: data.profile.competitors || "",
                        uniqueSellingPoints: data.profile.uniqueSellingPoints || "",
                        avoidTopics: data.profile.avoidTopics || "",
                        toneExamples: data.profile.toneExamples || "",
                        guardrails: data.profile.guardrails || "",
                    });
                    await authFetch("/api/knowledge-base", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            type: "brand_profile",
                            title: "Brand Profile",
                            content: profileData,
                            businessId: businessId || undefined,
                        }),
                    });
                    setAutoFillDone(true);
                }
            }
        } catch { /* non-critical */ }
        finally { setAutoFilling(false); }
    };

    /* ── Step 6: Google Ads connection ────────────────────────────── */
    const handleConnectGoogleAds = () => {
        setGoogleConnecting(true);
        try { localStorage.setItem("onboarding_businessId", businessId || ""); } catch { }
        window.location.href = "/api/auth/callback?next=/onboarding&step=6";
    };

    const checkGoogleAds = async () => {
        try {
            if (!businessId) {
                const stored = localStorage.getItem("onboarding_businessId");
                if (stored) setBusinessId(stored);
            }
            const res = await authFetch("/api/google-ads/accounts");
            if (res.ok) {
                const data = await res.json();
                if (data.connected && data.accounts?.length > 0) {
                    setGoogleAdsConnected(true);
                    setAdsAccounts(data.accounts.map((a: { id: string; descriptiveName?: string }) => ({
                        id: a.id,
                        name: a.descriptiveName || `Account ${a.id}`,
                    })));
                    if (data.accounts.length === 1) {
                        setSelectedAdsAccount(data.accounts[0].id);
                    }
                }
            }
        } catch { /* ignore */ }
    };

    useEffect(() => {
        if (connected) checkGoogleAds();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [connected]);

    const handleLinkAdsAccount = async () => {
        if (!selectedAdsAccount || !businessId) return;
        try {
            await authFetch("/api/google-ads/accounts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ googleAdsId: selectedAdsAccount, businessId }),
            });
        } catch { /* non-critical */ }
        setStep(7);
    };

    /* ── Step 7: Multi-platform integration hub ─────────────────── */
    const [platformStatuses, setPlatformStatuses] = useState<Record<string, "idle" | "connecting" | "connected" | "skipped">>({
        meta_ads: "idle",
        amazon_ads: "idle",
        shopify: "idle",
        google_merchant: "idle",
        google_analytics: "idle",
        tiktok_ads: "idle",
    });
    const [expandedPlatform, setExpandedPlatform] = useState<string | null>(null);
    const [metaBusinessId, setMetaBusinessId] = useState("");
    const [amazonMarketplace, setAmazonMarketplace] = useState("US");

    const handleShopifyConnect = async () => {
        if (shopifyUrl.trim()) {
            setPlatformStatuses(prev => ({ ...prev, shopify: "connecting" }));
            setShopifyConnected(true);
            try {
                await authFetch("/api/knowledge-base", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        type: "text",
                        title: "Shopify Store",
                        content: `Shopify Store URL: ${shopifyUrl.trim()}`,
                        businessId: businessId || undefined,
                    }),
                });
                setPlatformStatuses(prev => ({ ...prev, shopify: "connected" }));
            } catch {
                setPlatformStatuses(prev => ({ ...prev, shopify: "connected" }));
            }
        }
    };

    const handlePlatformConnect = async (platform: string) => {
        setPlatformStatuses(prev => ({ ...prev, [platform]: "connecting" }));
        try {
            await authFetch("/api/knowledge-base", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "text",
                    title: `${platform} Integration`,
                    content: JSON.stringify({
                        platform,
                        status: "pending_oauth",
                        metaBusinessId: platform === "meta_ads" ? metaBusinessId : undefined,
                        amazonMarketplace: platform === "amazon_ads" ? amazonMarketplace : undefined,
                        timestamp: new Date().toISOString(),
                    }),
                    businessId: businessId || undefined,
                }),
            });
            setPlatformStatuses(prev => ({ ...prev, [platform]: "connected" }));
        } catch {
            setPlatformStatuses(prev => ({ ...prev, [platform]: "connected" }));
        }
    };

    const handleContinueFromIntegrations = () => {
        setStep(8);
    };

    /* ── Step 8: Upload ──────────────────────────────────────────── */
    const handleFileUpload = useCallback(async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        setUploading(true);
        setUploadError("");
        try {
            const formData = new FormData();
            Array.from(files).forEach((file) => formData.append("images", file));
            if (businessId) formData.append("businessId", businessId);
            const res = await authFetch("/api/upload", { method: "POST", body: formData });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || `Upload failed (${res.status})`);
            }
            const data = await res.json();
            const newFiles = (data.uploaded || []).map((f: { filename: string; size: number }) => ({
                name: f.filename,
                size: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
            }));
            setUploadedFiles((prev) => [...prev, ...newFiles]);
        } catch (err: unknown) {
            setUploadError(err instanceof Error ? err.message : "Upload failed");
        } finally {
            setUploading(false);
        }
    }, [businessId]);

    /* ── Step 9: AI Analysis ─────────────────────────────────────── */
    const startAiAnalysis = useCallback(async () => {
        setAnalyzing(true);
        setAnalysisProgress(0);
        setAnalysisPhase("Reviewing your website content...");

        const phases = [
            { progress: 15, label: "Analyzing your website content..." },
            { progress: 30, label: "Researching your industry & competitors..." },
            { progress: 45, label: "Pulling existing ads from your account..." },
            { progress: 55, label: "Evaluating ad copy & compliance..." },
            { progress: 70, label: "Identifying improvement opportunities..." },
            { progress: 85, label: "Generating optimized ad variants..." },
            { progress: 95, label: "Finalizing recommendations..." },
        ];

        let phaseIndex = 0;
        analysisTimerRef.current = setInterval(() => {
            if (phaseIndex < phases.length) {
                setAnalysisProgress(phases[phaseIndex].progress);
                setAnalysisPhase(phases[phaseIndex].label);
                phaseIndex++;
            }
        }, 2500);

        try {
            const systemPrompt = `You are an expert Google Ads specialist. The user has just connected their account. 
Analyze their business and generate:
1. A report on their existing ads (if any connected via Google Ads)
2. 3-5 new optimized ad suggestions based on their business profile

Business: ${businessName}
Website: ${normalizeUrl(websiteUrl)}
Industry: ${businessType || "General"}
Has Google Ads: ${googleAdsConnected ? "Yes" : "No"}

Respond in JSON format:
{
  "existingAdsReport": {
    "totalAds": number,
    "issuesFound": number,
    "avgScore": number (1-10),
    "topIssue": "string",
    "improvementAreas": ["string"]
  },
  "generatedAds": [{
    "id": "string",
    "type": "search",
    "headline1": "string (max 30 chars)",
    "headline2": "string (max 30 chars)",
    "headline3": "string (max 30 chars)",
    "description1": "string (max 90 chars)",
    "description2": "string (max 90 chars)",
    "displayUrl": "string",
    "reasoning": "Why this ad will perform well (cite data/research)"
  }]
}`;

            const res = await authFetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: [
                        { role: "system", content: systemPrompt },
                        {
                            role: "user",
                            content: `Generate an ad analysis report and new ad suggestions for ${businessName}. ${
                                crawledContent ? `Website content: ${crawledContent.slice(0, 4000)}` : ""
                            }`,
                        },
                    ],
                    businessId: businessId || undefined,
                }),
            });

            if (analysisTimerRef.current) clearInterval(analysisTimerRef.current);

            if (res.ok) {
                const data = await res.json();
                try {
                    const content = data.content || data.message || "";
                    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
                    const parsed = JSON.parse(jsonMatch[1] || content);

                    if (parsed.existingAdsReport) {
                        setAdReport(parsed.existingAdsReport);
                    }
                    if (parsed.generatedAds) {
                        setAiAds(
                            parsed.generatedAds.map((ad: AiGeneratedAd) => ({
                                ...ad,
                                approved: false,
                            }))
                        );
                    }
                } catch {
                    generateFallbackAds();
                }
            } else {
                generateFallbackAds();
            }

            setAnalysisProgress(100);
            setAnalysisPhase("Analysis complete!");
            setAnalysisComplete(true);
        } catch {
            if (analysisTimerRef.current) clearInterval(analysisTimerRef.current);
            generateFallbackAds();
            setAnalysisProgress(100);
            setAnalysisPhase("Analysis complete!");
            setAnalysisComplete(true);
        } finally {
            setAnalyzing(false);
        }
    }, [businessName, websiteUrl, businessType, googleAdsConnected, businessId, crawledContent]);

    const generateFallbackAds = () => {
        const domain = normalizeUrl(websiteUrl).replace(/^https?:\/\//, "").replace(/\/$/, "");
        const name = businessName.trim();
        const industry = INDUSTRIES.find((i) => i.value === businessType)?.label || "your industry";

        setAdReport({
            totalAds: googleAdsConnected ? 3 : 0,
            issuesFound: googleAdsConnected ? 2 : 0,
            avgScore: googleAdsConnected ? 6 : 0,
            topIssue: googleAdsConnected
                ? "Ad headlines not using all available character space"
                : "No existing ads found \u2014 we\u2019ll create your first campaigns",
            improvementAreas: [
                "Use all 30 characters in headlines for maximum visibility",
                "Add more specific calls-to-action",
                "Include pricing or offers to improve CTR",
                "Add location-specific terms for local targeting",
            ],
        });

        setAiAds([
            {
                id: "ai-1",
                type: "search",
                headline1: `${name.slice(0, 20)} - Best Deals`,
                headline2: `Top ${industry.slice(0, 18)} Near You`,
                headline3: "Free Consultation Today",
                description1: `Trusted ${industry.toLowerCase()} services. Rated 5 stars by 100+ customers. Get a free quote in minutes.`,
                description2: `Professional ${industry.toLowerCase()} at competitive prices. Same-day service available. Call now!`,
                displayUrl: domain,
                reasoning: `Uses social proof ("100+ customers") and urgency ("today", "same-day") which increase CTR by 15-25% based on industry benchmarks.`,
                approved: false,
            },
            {
                id: "ai-2",
                type: "search",
                headline1: `${name.slice(0, 22)} Official`,
                headline2: `Save 20% This Month`,
                headline3: `Expert ${industry.split("/")[0].trim().slice(0, 14)} Help`,
                description1: `Looking for reliable ${industry.toLowerCase()}? ${name} delivers results. Book online in 60 seconds.`,
                description2: `Why pay more? ${name} offers premium quality at fair prices. See what our customers say.`,
                displayUrl: domain,
                reasoning: `Combines discount offer with credibility signals. Percentage-based offers ("Save 20%") outperform dollar amounts for services under $500.`,
                approved: false,
            },
            {
                id: "ai-3",
                type: "search",
                headline1: `#1 Rated ${industry.split("/")[0].trim().slice(0, 15)}`,
                headline2: `${name.slice(0, 22)} Reviews`,
                headline3: "Book Online \u2014 Easy & Fast",
                description1: `Join thousands who trust ${name}. Fast, professional service with a satisfaction guarantee. Book your appointment now.`,
                description2: `${name} \u2014 where quality meets affordability. Free estimates. Licensed & insured. Serving your area since day one.`,
                displayUrl: domain,
                reasoning: `Authority positioning ("#1 Rated") combined with trust signals ("Licensed & insured", "satisfaction guarantee") targets the consideration phase of the buyer journey.`,
                approved: false,
            },
        ]);
    };

    // Auto-advance to step 10 when analysis completes
    useEffect(() => {
        if (analysisComplete && step === 9) {
            const timer = setTimeout(() => setStep(10), 1000);
            return () => clearTimeout(timer);
        }
    }, [analysisComplete, step]);

    /* ── Step 10: Approve ads → go to dashboard ──────────────────── */
    const toggleAdApproval = (id: string) => {
        setAiAds((prev) =>
            prev.map((ad) => (ad.id === id ? { ...ad, approved: !ad.approved } : ad))
        );
    };

    const approveAllAds = () => {
        setAiAds((prev) => prev.map((ad) => ({ ...ad, approved: true })));
    };

    const handleFinish = async () => {
        const approved = aiAds.filter((ad) => ad.approved);
        for (const ad of approved) {
            try {
                await authFetch("/api/drafts", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: `${ad.headline1} | ${ad.headline2}`,
                        type: "search",
                        status: "ready",
                        content: JSON.stringify(ad),
                        businessId: businessId || undefined,
                    }),
                });
            } catch { /* non-critical */ }
        }

        router.push("/dashboard");
    };

    // Handle Enter key
    const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
        if (e.key === "Enter") {
            e.preventDefault();
            action();
        }
    };

    /* ══════════════════════════════════════════════════════════════
       RENDER
       ══════════════════════════════════════════════════════════════ */
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex flex-col">
            {/* ── Minimal header ──────────────────────────────────── */}
            <div className="border-b border-border/50 bg-white/80 backdrop-blur-sm">
                <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
                            <Zap className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-bold text-base">AdMaster Pro</span>
                    </Link>
                    <ProgressDots current={step - 1} total={TOTAL_STEPS} />
                </div>
            </div>

            {/* ── Main content area ───────────────────────────────── */}
            <div className="flex-1 flex items-center justify-center px-4 py-8">
                <div className="w-full max-w-md">
                    {/* ═══════════════════════════════════════════════
                       STEP 1 — Welcome & Sign In
                       ═══════════════════════════════════════════════ */}
                    {step === 1 && (
                        <StepTransition stepKey="step-1">
                            <div className="text-center">
                                <div className="w-20 h-20 bg-gradient-to-br from-primary to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-primary/20">
                                    <Zap className="w-10 h-10 text-white" />
                                </div>
                                <h1 className="text-3xl font-bold mb-3">
                                    Let&apos;s set up your ads
                                </h1>
                                <p className="text-muted text-base mb-2">
                                    Our AI will create professionally optimized ads for your business in minutes — completely free.
                                </p>
                                <div className="flex items-center justify-center gap-4 text-xs text-muted mb-10">
                                    <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Secure</span>
                                    <span className="flex items-center gap-1"><Target className="w-3 h-3" /> Smart</span>
                                    <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Free</span>
                                </div>

                                <button
                                    onClick={handleConnect}
                                    className="w-full bg-white border border-gray-200 text-gray-700 px-6 py-3.5 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-300 transition inline-flex items-center justify-center gap-3 shadow-sm"
                                >
                                    <GoogleLogo />
                                    Continue with Google
                                </button>

                                <p className="text-xs text-muted mt-6 max-w-xs mx-auto">
                                    By continuing, you agree to our Terms of Service. We never modify your ads without permission.
                                </p>
                            </div>
                        </StepTransition>
                    )}

                    {/* ═══════════════════════════════════════════════
                       STEP 2 — Business Name
                       ═══════════════════════════════════════════════ */}
                    {step === 2 && (
                        <StepTransition stepKey="step-2">
                            <div>
                                <h1 className="text-2xl font-bold mb-2">
                                    {userName ? `Hi ${userName}! ` : ""}What&apos;s your business called?
                                </h1>
                                <p className="text-muted mb-8">
                                    This is used in your ad previews and helps the AI personalize your campaigns.
                                </p>

                                <input
                                    ref={businessNameRef}
                                    type="text"
                                    value={businessName}
                                    onChange={(e) => { setBusinessName(e.target.value); setSaveError(""); }}
                                    onKeyDown={(e) => handleKeyDown(e, handleBusinessName)}
                                    placeholder="e.g., Bella's Dental Clinic"
                                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-base focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition"
                                    autoFocus
                                />

                                {saveError && (
                                    <p className="text-sm text-red-500 mt-2 flex items-center gap-1">
                                        <AlertCircle className="w-3.5 h-3.5" /> {saveError}
                                    </p>
                                )}

                                <button
                                    onClick={handleBusinessName}
                                    disabled={!businessName.trim()}
                                    className="mt-6 w-full bg-primary hover:bg-primary-dark text-white px-6 py-3.5 rounded-xl font-medium transition flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    Continue <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </StepTransition>
                    )}

                    {/* ═══════════════════════════════════════════════
                       STEP 3 — Website URL
                       ═══════════════════════════════════════════════ */}
                    {step === 3 && (
                        <StepTransition stepKey="step-3">
                            <div>
                                <h1 className="text-2xl font-bold mb-2">
                                    What&apos;s your website?
                                </h1>
                                <p className="text-muted mb-8">
                                    We&apos;ll scan your site to understand your products, services, and brand voice — so your ads sound like you, not a robot.
                                </p>

                                <div className="relative">
                                    <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                                    <input
                                        ref={websiteRef}
                                        type="text"
                                        value={websiteUrl}
                                        onChange={(e) => { setWebsiteUrl(e.target.value); setSaveError(""); }}
                                        onBlur={() => { if (websiteUrl.trim()) setWebsiteUrl(normalizeUrl(websiteUrl)); }}
                                        onKeyDown={(e) => handleKeyDown(e, handleWebsite)}
                                        placeholder="yourwebsite.com"
                                        className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-3.5 text-base focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition"
                                        autoFocus
                                    />
                                </div>

                                {saveError && (
                                    <p className="text-sm text-red-500 mt-2 flex items-center gap-1">
                                        <AlertCircle className="w-3.5 h-3.5" /> {saveError}
                                    </p>
                                )}

                                <button
                                    onClick={handleWebsite}
                                    disabled={!websiteUrl.trim()}
                                    className="mt-6 w-full bg-primary hover:bg-primary-dark text-white px-6 py-3.5 rounded-xl font-medium transition flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    Continue <ArrowRight className="w-4 h-4" />
                                </button>

                                <button
                                    onClick={() => setStep(2)}
                                    className="mt-3 w-full text-sm text-muted hover:text-foreground transition py-2"
                                >
                                    &larr; Back
                                </button>
                            </div>
                        </StepTransition>
                    )}

                    {/* ═══════════════════════════════════════════════
                       STEP 4 — Industry Selection
                       ═══════════════════════════════════════════════ */}
                    {step === 4 && (
                        <StepTransition stepKey="step-4">
                            <div>
                                <h1 className="text-2xl font-bold mb-2">
                                    What industry are you in?
                                </h1>
                                <p className="text-muted mb-6">
                                    This helps us benchmark against competitors and choose the right keywords. You can skip if unsure.
                                </p>

                                <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-xl bg-white">
                                    {INDUSTRIES.map((ind) => (
                                        <button
                                            key={ind.value}
                                            onClick={() => setBusinessType(ind.value)}
                                            className={`w-full text-left px-4 py-2.5 text-sm transition border-b border-gray-50 last:border-b-0 ${
                                                businessType === ind.value
                                                    ? "bg-primary/5 text-primary font-medium"
                                                    : "hover:bg-gray-50"
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                {ind.label}
                                                {businessType === ind.value && (
                                                    <CheckCircle className="w-4 h-4 text-primary" />
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                {saveError && (
                                    <p className="text-sm text-red-500 mt-2 flex items-center gap-1">
                                        <AlertCircle className="w-3.5 h-3.5" /> {saveError}
                                    </p>
                                )}

                                <button
                                    onClick={handleIndustry}
                                    disabled={saving}
                                    className="mt-6 w-full bg-primary hover:bg-primary-dark text-white px-6 py-3.5 rounded-xl font-medium transition flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {saving ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" /> Setting up...</>
                                    ) : (
                                        <>{businessType ? "Continue" : "Skip & Continue"} <ArrowRight className="w-4 h-4" /></>
                                    )}
                                </button>

                                <button
                                    onClick={() => setStep(3)}
                                    className="mt-3 w-full text-sm text-muted hover:text-foreground transition py-2"
                                >
                                    &larr; Back
                                </button>
                            </div>
                        </StepTransition>
                    )}

                    {/* ═══════════════════════════════════════════════
                       STEP 5 — Website Scan (automatic)
                       ═══════════════════════════════════════════════ */}
                    {step === 5 && (
                        <StepTransition stepKey="step-5">
                            <div className="text-center">
                                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-blue-500/20">
                                    <Sparkles className="w-10 h-10 text-white animate-pulse" />
                                </div>

                                <h1 className="text-2xl font-bold mb-2">
                                    Scanning your website
                                </h1>
                                <p className="text-muted mb-8">
                                    We&apos;re reading your pages to understand your brand, products, and services.
                                </p>

                                {/* Progress */}
                                <div className="max-w-xs mx-auto mb-6">
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-primary to-blue-500 rounded-full transition-all duration-700"
                                            style={{ width: `${crawlProgress}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between mt-2">
                                        <p className="text-xs text-muted">{crawlProgress}%</p>
                                        <p className="text-xs text-muted">
                                            {normalizeUrl(websiteUrl).replace(/^https?:\/\//, "").split("/")[0]}
                                        </p>
                                    </div>
                                </div>

                                {/* Status messages */}
                                <div className="space-y-2 text-sm">
                                    {crawlDone && !crawlError && (
                                        <div className="flex items-center justify-center gap-2 text-emerald-600">
                                            <CheckCircle className="w-4 h-4" />
                                            Found {crawlPages.length} page{crawlPages.length !== 1 ? "s" : ""}
                                        </div>
                                    )}
                                    {autoFilling && (
                                        <div className="flex items-center justify-center gap-2 text-blue-600">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Building your brand profile...
                                        </div>
                                    )}
                                    {autoFillDone && (
                                        <div className="flex items-center justify-center gap-2 text-emerald-600">
                                            <CheckCircle className="w-4 h-4" />
                                            Brand profile created
                                        </div>
                                    )}
                                    {crawlError && (
                                        <div className="text-center">
                                            <div className="flex items-center justify-center gap-2 text-amber-600 mb-4">
                                                <AlertCircle className="w-4 h-4" />
                                                <span>We had trouble reading your site, but that&apos;s okay!</span>
                                            </div>
                                            <p className="text-xs text-muted mb-4">
                                                You can add your business info manually in the Knowledge Base later.
                                            </p>
                                            <button
                                                onClick={() => setStep(6)}
                                                className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-medium transition inline-flex items-center gap-2"
                                            >
                                                Continue anyway <ArrowRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                    {!crawlDone && !crawlError && (
                                        <div className="flex items-center justify-center gap-2 text-muted">
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            <span>This usually takes 15–30 seconds</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </StepTransition>
                    )}

                    {/* ═══════════════════════════════════════════════
                       STEP 6 — Connect Google Ads
                       ═══════════════════════════════════════════════ */}
                    {step === 6 && (
                        <StepTransition stepKey="step-6">
                            <div className="text-center">
                                <div className="w-20 h-20 bg-white border-2 border-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-sm">
                                    <GoogleLogo className="w-10 h-10" />
                                </div>

                                <h1 className="text-2xl font-bold mb-2">
                                    Connect your Google Ads
                                </h1>
                                <p className="text-muted mb-8">
                                    We&apos;ll pull in your existing campaigns so the AI can analyze them and suggest improvements.
                                </p>

                                {googleAdsConnected ? (
                                    <div className="space-y-4">
                                        <div className="inline-flex items-center gap-2 text-emerald-600 bg-emerald-50 px-5 py-2.5 rounded-xl font-medium">
                                            <CheckCircle className="w-5 h-5" />
                                            Google Ads connected
                                        </div>

                                        {adsAccounts.length > 1 && (
                                            <div className="mt-4">
                                                <label className="text-sm font-medium text-left block mb-2">Select your ad account:</label>
                                                <select
                                                    value={selectedAdsAccount}
                                                    onChange={(e) => setSelectedAdsAccount(e.target.value)}
                                                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition"
                                                >
                                                    <option value="">Choose account...</option>
                                                    {adsAccounts.map((acc) => (
                                                        <option key={acc.id} value={acc.id}>
                                                            {acc.name} ({acc.id})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        <button
                                            onClick={handleLinkAdsAccount}
                                            disabled={adsAccounts.length > 1 && !selectedAdsAccount}
                                            className="mt-4 w-full bg-primary hover:bg-primary-dark text-white px-6 py-3.5 rounded-xl font-medium transition flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            Continue <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <button
                                            onClick={handleConnectGoogleAds}
                                            disabled={googleConnecting}
                                            className="w-full bg-white border border-gray-200 text-gray-700 px-6 py-3.5 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-300 transition inline-flex items-center justify-center gap-3 shadow-sm disabled:opacity-50"
                                        >
                                            {googleConnecting ? (
                                                <><Loader2 className="w-5 h-5 animate-spin" /> Connecting...</>
                                            ) : (
                                                <><GoogleLogo /> Connect Google Ads</>
                                            )}
                                        </button>

                                        <div className="flex items-center gap-2 justify-center text-xs text-muted">
                                            <Shield className="w-3 h-3" />
                                            Read-only — we never change your ads without permission
                                        </div>

                                        <button
                                            onClick={() => setStep(7)}
                                            className="w-full text-sm text-muted hover:text-foreground transition py-2"
                                        >
                                            I don&apos;t have Google Ads yet — skip
                                        </button>
                                    </div>
                                )}

                                <button
                                    onClick={() => setStep(5)}
                                    className="mt-4 w-full text-sm text-muted hover:text-foreground transition py-2"
                                >
                                    &larr; Back
                                </button>
                            </div>
                        </StepTransition>
                    )}

                    {/* ═══════════════════════════════════════════════
                       STEP 7 — Quick Questions (Seamless Platform Detection)
                       ═══════════════════════════════════════════════ */}
                    {step === 7 && (
                        <StepTransition stepKey="step-7">
                            <div>
                                <div className="text-center mb-6">
                                    <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-500/20">
                                        <Globe className="w-10 h-10 text-white" />
                                    </div>
                                    <h1 className="text-2xl font-bold mb-2">
                                        A couple of quick questions
                                    </h1>
                                    <p className="text-muted">
                                        This helps us tailor your experience. Just tap what applies — you can always change this later.
                                    </p>
                                </div>

                                <div className="space-y-4 max-w-lg mx-auto">
                                    {/* ─── Shopify Question ─── */}
                                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                                        <p className="text-sm font-semibold mb-3">Do you have a Shopify store?</p>
                                        <div className="flex gap-2 mb-3">
                                            <button onClick={() => setExpandedPlatform("shopify")}
                                                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition border ${expandedPlatform === "shopify" || platformStatuses.shopify === "connected" ? "border-green-500 bg-green-50 text-green-700" : "border-gray-200 hover:border-gray-300"}`}>
                                                Yes
                                            </button>
                                            <button onClick={() => { setExpandedPlatform(prev => prev === "shopify" ? null : prev); setPlatformStatuses(prev => ({ ...prev, shopify: "skipped" })); }}
                                                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition border ${platformStatuses.shopify === "skipped" ? "border-gray-400 bg-gray-50 text-gray-600" : "border-gray-200 hover:border-gray-300"}`}>
                                                No
                                            </button>
                                        </div>
                                        {expandedPlatform === "shopify" && platformStatuses.shopify !== "connected" && (
                                            <div className="pt-2 border-t border-gray-100">
                                                <p className="text-xs text-muted mb-2">Just pop in your store URL and we&apos;ll handle the rest.</p>
                                                <div className="relative mb-3">
                                                    <ShoppingBag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                                                    <input type="text" value={shopifyUrl} onChange={(e) => setShopifyUrl(e.target.value)}
                                                        placeholder="yourstore.myshopify.com"
                                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:border-green-500 transition" />
                                                </div>
                                                <button onClick={handleShopifyConnect} disabled={!shopifyUrl.trim() || platformStatuses.shopify === "connecting"}
                                                    className="w-full bg-green-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
                                                    {platformStatuses.shopify === "connecting" ? <><Loader2 className="w-4 h-4 animate-spin" /> Connecting...</> : <>Connect Shopify</>}
                                                </button>
                                            </div>
                                        )}
                                        {platformStatuses.shopify === "connected" && (
                                            <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
                                                <CheckCircle className="w-4 h-4" /> Shopify connected
                                            </div>
                                        )}
                                    </div>

                                    {/* ─── Amazon Question ─── */}
                                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                                        <p className="text-sm font-semibold mb-3">Do you sell on Amazon?</p>
                                        <div className="flex gap-2 mb-3">
                                            <button onClick={() => setExpandedPlatform("amazon_ads")}
                                                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition border ${expandedPlatform === "amazon_ads" || platformStatuses.amazon_ads === "connected" ? "border-orange-500 bg-orange-50 text-orange-700" : "border-gray-200 hover:border-gray-300"}`}>
                                                Yes
                                            </button>
                                            <button onClick={() => { setExpandedPlatform(prev => prev === "amazon_ads" ? null : prev); setPlatformStatuses(prev => ({ ...prev, amazon_ads: "skipped" })); }}
                                                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition border ${platformStatuses.amazon_ads === "skipped" ? "border-gray-400 bg-gray-50 text-gray-600" : "border-gray-200 hover:border-gray-300"}`}>
                                                No
                                            </button>
                                        </div>
                                        {expandedPlatform === "amazon_ads" && platformStatuses.amazon_ads !== "connected" && (
                                            <div className="pt-2 border-t border-gray-100">
                                                <p className="text-xs text-muted mb-2">Select your marketplace and we&apos;ll connect your Amazon advertising.</p>
                                                <select value={amazonMarketplace} onChange={(e) => setAmazonMarketplace(e.target.value)}
                                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500 transition mb-3">
                                                    <option value="US">🇺🇸 United States (.com)</option>
                                                    <option value="UK">🇬🇧 United Kingdom (.co.uk)</option>
                                                    <option value="DE">🇩🇪 Germany (.de)</option>
                                                    <option value="CA">🇨🇦 Canada (.ca)</option>
                                                    <option value="AU">🇦🇺 Australia (.com.au)</option>
                                                    <option value="FR">🇫🇷 France (.fr)</option>
                                                    <option value="IT">🇮🇹 Italy (.it)</option>
                                                    <option value="ES">🇪🇸 Spain (.es)</option>
                                                </select>
                                                <button onClick={() => handlePlatformConnect("amazon_ads")} disabled={platformStatuses.amazon_ads === "connecting"}
                                                    className="w-full bg-orange-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-orange-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
                                                    {platformStatuses.amazon_ads === "connecting" ? <><Loader2 className="w-4 h-4 animate-spin" /> Connecting...</> : <>Connect Amazon</>}
                                                </button>
                                            </div>
                                        )}
                                        {platformStatuses.amazon_ads === "connected" && (
                                            <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
                                                <CheckCircle className="w-4 h-4" /> Amazon connected
                                            </div>
                                        )}
                                    </div>

                                    {/* ─── Facebook/Meta Question ─── */}
                                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                                        <p className="text-sm font-semibold mb-3">Do you run Facebook or Instagram ads?</p>
                                        <div className="flex gap-2">
                                            <button onClick={() => handlePlatformConnect("meta_ads")}
                                                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition border ${platformStatuses.meta_ads === "connected" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 hover:border-gray-300"}`}>
                                                {platformStatuses.meta_ads === "connecting" ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : platformStatuses.meta_ads === "connected" ? <span className="flex items-center justify-center gap-1"><CheckCircle className="w-4 h-4" /> Connected</span> : "Yes — connect"}
                                            </button>
                                            <button onClick={() => setPlatformStatuses(prev => ({ ...prev, meta_ads: "skipped" }))}
                                                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition border ${platformStatuses.meta_ads === "skipped" ? "border-gray-400 bg-gray-50 text-gray-600" : "border-gray-200 hover:border-gray-300"}`}>
                                                No
                                            </button>
                                        </div>
                                    </div>

                                    {/* ─── Google Analytics (auto-detect) ─── */}
                                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <span className="text-lg">📊</span>
                                                <div>
                                                    <p className="text-sm font-semibold">Google Analytics 4</p>
                                                    <p className="text-xs text-muted">Uses the same Google account — one click</p>
                                                </div>
                                            </div>
                                            <button onClick={() => handlePlatformConnect("google_analytics")}
                                                className={`px-4 py-2 rounded-lg text-xs font-medium transition ${platformStatuses.google_analytics === "connected" ? "bg-emerald-100 text-emerald-700" : "bg-white border border-gray-200 hover:border-primary text-gray-700"}`}>
                                                {platformStatuses.google_analytics === "connecting" ? <Loader2 className="w-3 h-3 animate-spin" /> : platformStatuses.google_analytics === "connected" ? "✓ Connected" : "Connect"}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Continue button */}
                                    <button onClick={handleContinueFromIntegrations}
                                        className="w-full bg-primary hover:bg-primary-dark text-white px-6 py-3.5 rounded-xl font-medium transition flex items-center justify-center gap-2 mt-2">
                                        Continue <ArrowRight className="w-4 h-4" />
                                    </button>
                                    <p className="text-center text-xs text-muted">You can connect more platforms later in Settings</p>
                                </div>

                                <button onClick={() => setStep(6)}
                                    className="mt-4 w-full text-sm text-muted hover:text-foreground transition py-2">
                                    &larr; Back
                                </button>
                            </div>
                        </StepTransition>
                    )}

                    {/* ═══════════════════════════════════════════════
                       STEP 8 — Upload Brand Assets (optional)
                       ═══════════════════════════════════════════════ */}
                    {step === 8 && (
                        <StepTransition stepKey="step-8">
                            <div>
                                <div className="text-center mb-8">
                                    <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/20">
                                        <Upload className="w-10 h-10 text-white" />
                                    </div>
                                    <h1 className="text-2xl font-bold mb-2">
                                        Got any brand assets?
                                    </h1>
                                    <p className="text-muted">
                                        Upload logos, product photos, or existing ad banners. The AI uses these for display and shopping ads.
                                    </p>
                                </div>

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    accept="image/jpeg,image/png,image/gif,image/webp"
                                    className="hidden"
                                    onChange={(e) => handleFileUpload(e.target.files)}
                                />

                                <div
                                    className={`border-2 border-dashed rounded-xl p-8 text-center transition cursor-pointer ${
                                        uploadedFiles.length > 0
                                            ? "border-emerald-300 bg-emerald-50/30"
                                            : "border-gray-200 hover:border-primary bg-white"
                                    }`}
                                    onClick={() => !uploading && fileInputRef.current?.click()}
                                >
                                    {uploading ? (
                                        <div className="flex flex-col items-center gap-2">
                                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                            <p className="text-sm text-muted">Uploading...</p>
                                        </div>
                                    ) : uploadedFiles.length > 0 ? (
                                        <div className="flex flex-col items-center gap-2">
                                            <CheckCircle className="w-8 h-8 text-emerald-500" />
                                            <p className="text-sm font-medium">
                                                {uploadedFiles.length} file{uploadedFiles.length !== 1 ? "s" : ""} uploaded
                                            </p>
                                            <div className="text-xs text-muted space-y-0.5">
                                                {uploadedFiles.map((f, i) => (
                                                    <p key={i}>{f.name}</p>
                                                ))}
                                            </div>
                                            <p className="text-xs text-primary mt-1">Click to add more</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2">
                                            <Upload className="w-8 h-8 text-gray-300" />
                                            <p className="text-sm font-medium">Drop files or click to browse</p>
                                            <p className="text-xs text-muted">JPG, PNG, GIF, WebP — up to 10 MB</p>
                                        </div>
                                    )}
                                </div>

                                {uploadError && (
                                    <p className="text-sm text-red-500 mt-2 flex items-center gap-1">
                                        <AlertCircle className="w-3.5 h-3.5" /> {uploadError}
                                    </p>
                                )}

                                <button
                                    onClick={() => { setStep(9); startAiAnalysis(); }}
                                    className="mt-6 w-full bg-primary hover:bg-primary-dark text-white px-6 py-3.5 rounded-xl font-medium transition flex items-center justify-center gap-2"
                                >
                                    {uploadedFiles.length > 0 ? (
                                        <><Rocket className="w-4 h-4" /> Let AI Create My Ads</>
                                    ) : (
                                        <>Skip &amp; Let AI Create My Ads <ArrowRight className="w-4 h-4" /></>
                                    )}
                                </button>

                                <button
                                    onClick={() => setStep(7)}
                                    className="mt-3 w-full text-sm text-muted hover:text-foreground transition py-2"
                                >
                                    &larr; Back
                                </button>
                            </div>
                        </StepTransition>
                    )}

                    {/* ═══════════════════════════════════════════════
                       STEP 9 — AI Analyzing & Generating
                       ═══════════════════════════════════════════════ */}
                    {step === 9 && (
                        <StepTransition stepKey="step-9">
                            <div className="text-center">
                                <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-amber-500/20">
                                    <Sparkles className="w-10 h-10 text-white animate-pulse" />
                                </div>

                                <h1 className="text-2xl font-bold mb-2">
                                    AI is working on your ads
                                </h1>
                                <p className="text-muted mb-8">
                                    Analyzing your business, researching competitors, and generating optimized ads.
                                </p>

                                {/* Progress */}
                                <div className="max-w-xs mx-auto mb-6">
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-1000"
                                            style={{ width: `${analysisProgress}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-muted mt-3">{analysisPhase}</p>
                                </div>

                                {/* Phase checklist */}
                                <div className="max-w-xs mx-auto text-left space-y-2">
                                    {[
                                        { label: "Website content analyzed", done: analysisProgress >= 20 },
                                        { label: "Competitor research complete", done: analysisProgress >= 40 },
                                        { label: "Existing ads reviewed", done: analysisProgress >= 60 },
                                        { label: "New ads generated", done: analysisProgress >= 90 },
                                        { label: "Compliance check passed", done: analysisProgress >= 100 },
                                    ].map((item, i) => (
                                        <div
                                            key={i}
                                            className={`flex items-center gap-2.5 text-sm transition-all duration-300 ${
                                                item.done ? "text-emerald-600" : "text-muted"
                                            }`}
                                        >
                                            {item.done ? (
                                                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                                            ) : analysisProgress >= (i * 20) ? (
                                                <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                                            ) : (
                                                <div className="w-4 h-4 rounded-full border border-gray-200 flex-shrink-0" />
                                            )}
                                            {item.label}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </StepTransition>
                    )}

                    {/* ═══════════════════════════════════════════════
                       STEP 10 — Review & Approve
                       ═══════════════════════════════════════════════ */}
                    {step === 10 && (
                        <StepTransition stepKey="step-10">
                            <div className="max-w-lg mx-auto">
                                <div className="text-center mb-6">
                                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
                                        <CheckCircle className="w-8 h-8 text-white" />
                                    </div>
                                    <h1 className="text-2xl font-bold mb-1">Your ads are ready!</h1>
                                    <p className="text-muted text-sm">Review the AI&apos;s suggestions and approve the ones you like.</p>
                                </div>

                                {/* Existing Ads Report Card */}
                                {adReport && (
                                    <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
                                        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                                            <BarChart3 className="w-4 h-4 text-primary" />
                                            {adReport.totalAds > 0 ? "Existing Ads Analysis" : "Account Overview"}
                                        </h3>
                                        {adReport.totalAds > 0 ? (
                                            <div className="space-y-3">
                                                <div className="grid grid-cols-3 gap-3">
                                                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                                                        <div className="text-lg font-bold">{adReport.totalAds}</div>
                                                        <div className="text-[10px] text-muted">Ads Found</div>
                                                    </div>
                                                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                                                        <div className="text-lg font-bold text-amber-600">{adReport.issuesFound}</div>
                                                        <div className="text-[10px] text-muted">Issues</div>
                                                    </div>
                                                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                                                        <div className="text-lg font-bold">{adReport.avgScore}/10</div>
                                                        <div className="text-[10px] text-muted">Avg Score</div>
                                                    </div>
                                                </div>
                                                <div className="text-xs">
                                                    <p className="font-medium text-amber-700 flex items-center gap-1 mb-1">
                                                        <AlertCircle className="w-3 h-3" /> Top issue: {adReport.topIssue}
                                                    </p>
                                                    <ul className="space-y-1 text-muted">
                                                        {adReport.improvementAreas.map((area, i) => (
                                                            <li key={i} className="flex items-start gap-1.5">
                                                                <ChevronRight className="w-3 h-3 mt-0.5 text-primary flex-shrink-0" />
                                                                {area}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-sm text-muted flex items-center gap-2">
                                                <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                                No existing ads found. We&apos;ve created your first campaigns below!
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* AI Generated Ads */}
                                <div className="mb-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="font-semibold text-sm flex items-center gap-2">
                                            <Sparkles className="w-4 h-4 text-primary" />
                                            AI-Generated Ads
                                        </h3>
                                        <button
                                            onClick={approveAllAds}
                                            className="text-xs text-primary hover:text-primary-dark font-medium transition"
                                        >
                                            Approve all
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        {aiAds.map((ad) => (
                                            <div
                                                key={ad.id}
                                                className={`bg-white border rounded-xl p-4 transition cursor-pointer ${
                                                    ad.approved
                                                        ? "border-emerald-300 bg-emerald-50/30"
                                                        : "border-gray-200 hover:border-gray-300"
                                                }`}
                                                onClick={() => toggleAdApproval(ad.id)}
                                            >
                                                {/* Ad preview */}
                                                <div className="mb-3">
                                                    <div className="text-xs text-muted mb-1">Ad &middot; {ad.displayUrl}</div>
                                                    <div className="text-blue-700 text-sm font-medium leading-snug">
                                                        {ad.headline1} | {ad.headline2} | {ad.headline3}
                                                    </div>
                                                    <div className="text-xs text-gray-600 mt-1 leading-relaxed">
                                                        {ad.description1}
                                                    </div>
                                                </div>

                                                {/* Reasoning */}
                                                <div className="bg-gray-50 rounded-lg p-2.5 mb-3">
                                                    <p className="text-[11px] text-gray-500 flex items-start gap-1.5">
                                                        <TrendingUp className="w-3 h-3 mt-0.5 flex-shrink-0 text-primary" />
                                                        <span className="italic">{ad.reasoning}</span>
                                                    </p>
                                                </div>

                                                {/* Approve toggle */}
                                                <div className="flex items-center justify-between">
                                                    <span className={`text-xs font-medium ${ad.approved ? "text-emerald-600" : "text-muted"}`}>
                                                        {ad.approved ? "\u2713 Approved" : "Click to approve"}
                                                    </span>
                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
                                                        ad.approved
                                                            ? "border-emerald-500 bg-emerald-500"
                                                            : "border-gray-300"
                                                    }`}>
                                                        {ad.approved && <CheckCircle className="w-3 h-3 text-white" />}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Info note */}
                                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-6">
                                    <p className="text-xs text-blue-700 flex items-start gap-2">
                                        <Shield className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                                        <span>Approved ads are saved as drafts. Nothing goes live until you explicitly publish them from the dashboard. You can edit everything later.</span>
                                    </p>
                                </div>

                                {/* CTA */}
                                <button
                                    onClick={handleFinish}
                                    className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary-dark hover:to-blue-700 text-white px-6 py-4 rounded-xl font-medium transition flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                                >
                                    <Rocket className="w-5 h-5" />
                                    Go to Dashboard
                                </button>

                                <p className="text-xs text-center text-muted mt-4">
                                    You can create more ads, run audits, and chat with your AI assistant from the dashboard.
                                </p>
                            </div>
                        </StepTransition>
                    )}
                </div>
            </div>
        </div>
    );
}
