"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Zap,
    ArrowRight,
    ArrowLeft,
    CheckCircle,
    Upload,
    Globe,
    Building2,
    Loader2,
    AlertCircle,
    FileText,
    Sparkles,
    ExternalLink,
} from "lucide-react";
import { captureTokenFromHash, isAuthenticated, authFetch } from "@/lib/auth-client";
import { useTranslation } from "@/i18n/context";
import Tooltip from "@/components/Tooltip";
import WelcomeGuide from "@/components/WelcomeGuide";
import { HelpCircle } from "lucide-react";

const STEPS = [
    { id: 1, label: "Account" },
    { id: 2, label: "Your Website" },
    { id: 3, label: "Scan" },
    { id: 4, label: "About You" },
    { id: 5, label: "Upload" },
];

interface CrawlPage {
    url: string;
    title: string;
    snippet: string;
}

/** Auto-prepend https:// if user enters a bare domain */
function normalizeUrl(raw: string): string {
    const v = raw.trim();
    if (!v) return v;
    if (/^https?:\/\//i.test(v)) return v;
    return `https://${v}`;
}

export default function OnboardingPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
            <OnboardingInner />
        </Suspense>
    );
}

function OnboardingInner() {
    const { t } = useTranslation();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [currentStep, setCurrentStep] = useState(1);
    const [showGuide, setShowGuide] = useState(false);

    // Show guide if linked from dashboard sidebar (?guide=1)
    useEffect(() => {
        if (searchParams.get("guide") === "1") {
            setShowGuide(true);
        }
    }, [searchParams]);

    // Step 1 — auth
    const [connected, setConnected] = useState(false);

    // Step 2 — website + business
    const [websiteUrl, setWebsiteUrl] = useState("");
    const [businessName, setBusinessName] = useState("");
    const [businessType, setBusinessType] = useState("");
    const [businessId, setBusinessId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState("");

    // Step 3 — crawl
    const [crawling, setCrawling] = useState(false);
    const [crawlDone, setCrawlDone] = useState(false);
    const [crawlPages, setCrawlPages] = useState<CrawlPage[]>([]);
    const [crawlError, setCrawlError] = useState("");
    const [crawlProgress, setCrawlProgress] = useState(0);
    const crawlTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Step 4 — about
    const [aboutText, setAboutText] = useState("");
    const [aboutSaving, setAboutSaving] = useState(false);

    // Step 5 — upload
    const [uploading, setUploading] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<{ name: string; size: string }[]>([]);
    const [uploadError, setUploadError] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    // On mount, capture token from URL hash (after Google OAuth redirect)
    useEffect(() => {
        captureTokenFromHash();
        if (isAuthenticated()) {
            setConnected(true);
            setCurrentStep(2);
        }
    }, []);

    // Cleanup crawl timer
    useEffect(() => {
        return () => { if (crawlTimerRef.current) clearInterval(crawlTimerRef.current); };
    }, []);

    /* ── Step 1 handlers ────────────────────────────────── */
    const handleConnect = () => {
        window.location.href = "/api/auth/callback?next=/onboarding";
    };

    const handleSkipConnect = () => {
        setConnected(true);
        setCurrentStep(2);
    };

    /* ── Step 2 handler — save business, then go to step 3 ── */
    const handleSaveAndCrawl = async () => {
        if (!businessName.trim()) { setSaveError("Business name is required"); return; }
        if (!websiteUrl.trim()) { setSaveError("Website URL is required so we can learn about your business"); return; }
        setSaving(true);
        setSaveError("");

        try {
            // 1. Create the business
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
            setCurrentStep(3);

            // 2. Kick off the crawl automatically
            startCrawl(business.id);
        } catch (err: unknown) {
            setSaveError(err instanceof Error ? err.message : "Failed to save");
        } finally {
            setSaving(false);
        }
    };

    /* ── Step 3 — crawl ───────────────────────────────────── */
    const startCrawl = async (bId: string) => {
        setCrawling(true);
        setCrawlDone(false);
        setCrawlError("");
        setCrawlProgress(0);
        setCrawlPages([]);

        // Simulate progress while crawl runs
        let prog = 0;
        crawlTimerRef.current = setInterval(() => {
            prog = Math.min(prog + Math.random() * 12, 90);
            setCrawlProgress(Math.round(prog));
        }, 600);

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
                throw new Error(d.error || `Crawl failed (${res.status})`);
            }

            const data = await res.json();
            setCrawlProgress(100);

            // Parse crawled pages from response
            const pages: CrawlPage[] = (data.items || []).map((item: { sourceUrl?: string; title?: string; content?: string }) => ({
                url: item.sourceUrl || normalizeUrl(websiteUrl),
                title: item.title || "Untitled page",
                snippet: (item.content || "").slice(0, 180) + "…",
            }));
            setCrawlPages(pages);
            setCrawlDone(true);
        } catch (err: unknown) {
            if (crawlTimerRef.current) clearInterval(crawlTimerRef.current);
            setCrawlProgress(100);
            setCrawlError(err instanceof Error ? err.message : "Crawl failed");
            setCrawlDone(true);
        } finally {
            setCrawling(false);
        }
    };

    /* ── Step 4 — save about text ─────────────────────────── */
    const handleSaveAbout = async () => {
        if (!aboutText.trim()) { setCurrentStep(5); return; }
        setAboutSaving(true);
        try {
            await authFetch("/api/knowledge-base", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "text",
                    title: "About the Business",
                    content: aboutText.trim(),
                    businessId: businessId || undefined,
                }),
            });
        } catch {
            // non-critical, continue
        } finally {
            setAboutSaving(false);
            setCurrentStep(5);
        }
    };

    /* ── Step 5 — file upload ──────────────────────────────── */
    const handleFileUpload = useCallback(async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        setUploading(true);
        setUploadError("");
        try {
            const formData = new FormData();
            Array.from(files).forEach((file) => formData.append("images", file));
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
    }, []);

    const handleFinish = () => {
        router.push("/dashboard/chat");
    };

    /* ══════════════════════════════════════════════════════════
       RENDER
       ══════════════════════════════════════════════════════════ */
    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Welcome Guide Modal */}
            <WelcomeGuide forceOpen={showGuide} onClose={() => setShowGuide(false)} />

            {/* ── Header ─────────────────────────────────────── */}
            <div className="border-b border-border bg-card">
                <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                            <Zap className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-lg">AdMaster Pro</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setShowGuide(true)}
                            className="text-xs text-muted hover:text-primary transition flex items-center gap-1"
                        >
                            <HelpCircle className="w-3.5 h-3.5" /> How it works
                        </button>
                        <Link href="/login" className="text-sm text-muted hover:text-foreground">
                            Already have an account?
                        </Link>
                    </div>
                </div>
            </div>

            {/* ── Progress bar ────────────────────────────────── */}
            <div className="max-w-3xl mx-auto w-full px-4 py-6">
                <div className="flex items-center justify-between mb-8">
                    {STEPS.map((step, i) => (
                        <div key={step.id} className="flex items-center">
                            <div className="flex items-center gap-2">
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                                        currentStep > step.id
                                            ? "bg-emerald-500 text-white"
                                            : currentStep === step.id
                                            ? "bg-primary text-white"
                                            : "bg-border text-muted"
                                    }`}
                                >
                                    {currentStep > step.id ? <CheckCircle className="w-4 h-4" /> : step.id}
                                </div>
                                <span className={`text-xs hidden sm:block ${currentStep === step.id ? "font-medium text-foreground" : "text-muted"}`}>
                                    {step.label}
                                </span>
                            </div>
                            {i < STEPS.length - 1 && (
                                <div className={`w-8 sm:w-16 h-0.5 mx-2 transition-colors ${currentStep > step.id ? "bg-emerald-500" : "bg-border"}`} />
                            )}
                        </div>
                    ))}
                </div>

                {/* ─────────────────────────────────────────────────
                    STEP 1 — Create Account
                   ───────────────────────────────────────────────── */}
                {currentStep === 1 && (
                    <div className="bg-card border border-border rounded-xl p-8 text-center max-w-lg mx-auto">
                        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <Globe className="w-8 h-8 text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Create your account</h2>
                        <p className="text-muted mb-8 max-w-sm mx-auto">
                            Sign in with Google so we can save your progress and keep your data private.
                        </p>

                        {/* Step tip */}
                        <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-4 py-2.5 text-xs text-indigo-700 mb-6 max-w-sm mx-auto flex items-start gap-2">
                            <Sparkles className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                            <span>Signing in lets us save your Knowledge Base and generated ads. If you have Google Ads, we&apos;ll read your campaign data (read-only — we never modify anything).</span>
                        </div>

                        {!connected ? (
                            <div className="space-y-4">
                                <button
                                    onClick={handleConnect}
                                    className="bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition inline-flex items-center gap-3 shadow-sm"
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    Continue with Google
                                </button>
                                <div>
                                    <button onClick={handleSkipConnect} className="text-sm text-muted hover:text-foreground transition underline">
                                        Skip for now
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="inline-flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-lg">
                                    <CheckCircle className="w-5 h-5" />
                                    Connected
                                </div>
                                <div>
                                    <button
                                        onClick={() => setCurrentStep(2)}
                                        className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-lg font-medium transition inline-flex items-center gap-2"
                                    >
                                        Continue <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}

                        <p className="text-xs text-muted mt-6">
                            We only read your ad data — we never make changes without your permission.
                        </p>
                    </div>
                )}

                {/* ─────────────────────────────────────────────────
                    STEP 2 — Enter Website + Business Name
                   ───────────────────────────────────────────────── */}
                {currentStep === 2 && (
                    <div className="bg-card border border-border rounded-xl p-8 max-w-lg mx-auto">
                        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <Building2 className="w-8 h-8 text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2 text-center">Tell us about your business</h2>
                        <p className="text-muted mb-8 text-center max-w-sm mx-auto">
                            We&apos;ll scan your website to understand your business so we can write better ads.
                        </p>

                        {/* Step tip */}
                        <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-4 py-2.5 text-xs text-indigo-700 mb-6 flex items-start gap-2">
                            <Sparkles className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                            <span>Your website is the most important input — we&apos;ll crawl it to learn your products, services, and brand voice so the AI can write ads that sound like you.</span>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium mb-1 flex items-center gap-1">
                                    Business name <span className="text-red-400">*</span>
                                    <Tooltip text="Your company or brand name. This appears in ad preview headers and helps the AI personalize copy." position="right" />
                                </label>
                                <input
                                    type="text"
                                    value={businessName}
                                    onChange={(e) => setBusinessName(e.target.value)}
                                    placeholder="e.g., Mike's Plumbing LLC"
                                    className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 flex items-center gap-1">
                                    Website URL <span className="text-red-400">*</span>
                                    <Tooltip text="Enter your full website address. We'll crawl it to learn about your products, services, and brand voice. No www needed — just the domain." position="right" />
                                </label>
                                <input
                                    type="text"
                                    value={websiteUrl}
                                    onChange={(e) => setWebsiteUrl(e.target.value)}
                                    onBlur={() => { if (websiteUrl.trim()) setWebsiteUrl(normalizeUrl(websiteUrl)); }}
                                    placeholder="mikesplumbing.com"
                                    className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 flex items-center gap-1">
                                    Industry
                                    <Tooltip text="Selecting your industry helps us benchmark against competitors and choose the right keywords and ad formats." position="right" />
                                </label>
                                <select
                                    value={businessType}
                                    onChange={(e) => setBusinessType(e.target.value)}
                                    className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition"
                                >
                                    <option value="">Select industry…</option>
                                    <option value="plumber">Plumber</option>
                                    <option value="electrician">Electrician</option>
                                    <option value="hvac">HVAC</option>
                                    <option value="dentist">Dentist</option>
                                    <option value="lawyer">Lawyer</option>
                                    <option value="restaurant">Restaurant</option>
                                    <option value="retail">Retail</option>
                                    <option value="ecommerce">E-Commerce</option>
                                    <option value="real-estate">Real Estate</option>
                                    <option value="automotive">Automotive</option>
                                    <option value="beauty-salon">Beauty / Salon</option>
                                    <option value="healthcare">Healthcare</option>
                                    <option value="fitness">Fitness / Gym</option>
                                    <option value="photography">Photography</option>
                                    <option value="consulting">Consulting</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                        </div>

                        {saveError && (
                            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                {saveError}
                            </div>
                        )}

                        <div className="flex justify-between mt-8">
                            <button
                                onClick={() => setCurrentStep(1)}
                                className="border border-border text-foreground px-4 py-2.5 rounded-lg text-sm transition hover:border-primary flex items-center gap-2"
                            >
                                <ArrowLeft className="w-4 h-4" /> Back
                            </button>
                            <button
                                onClick={handleSaveAndCrawl}
                                disabled={saving}
                                className="bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-lg text-sm font-medium transition flex items-center gap-2 disabled:opacity-50"
                            >
                                {saving ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                                ) : (
                                    <>Scan My Website <ArrowRight className="w-4 h-4" /></>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* ─────────────────────────────────────────────────
                    STEP 3 — Website Scan / Crawl
                   ───────────────────────────────────────────────── */}
                {currentStep === 3 && (
                    <div className="bg-card border border-border rounded-xl p-8 max-w-lg mx-auto">
                        {!crawlDone ? (
                            /* Scanning in progress */
                            <div className="text-center py-8">
                                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                    <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                                </div>
                                <h2 className="text-xl font-bold mb-2">Scanning your website…</h2>
                                <p className="text-muted text-sm mb-4">
                                    We&apos;re reading your pages to learn about your products, services, and brand voice.
                                </p>

                                {/* Step tip */}
                                <div className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-2.5 text-xs text-amber-700 mb-4 max-w-xs mx-auto text-left flex items-start gap-2">
                                    <Sparkles className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                                    <span>We&apos;re visiting each page on your site, extracting text content, and saving it to your Knowledge Base. This usually takes 15-30 seconds.</span>
                                </div>

                                {/* Progress bar */}
                                <div className="max-w-xs mx-auto mb-4">
                                    <div className="h-2 bg-border rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary rounded-full transition-all duration-500"
                                            style={{ width: `${crawlProgress}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-muted mt-2">{crawlProgress}% complete</p>
                                </div>

                                <div className="flex items-center justify-center gap-2 text-xs text-muted">
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    Fetching pages from {normalizeUrl(websiteUrl).replace(/^https?:\/\//, "").split("/")[0]}
                                </div>
                            </div>
                        ) : (
                            /* Scan complete */
                            <div>
                                <div className="text-center mb-6">
                                    <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle className="w-8 h-8 text-emerald-500" />
                                    </div>
                                    <h2 className="text-xl font-bold mb-2">
                                        {crawlError ? "Scan had issues" : "Scan complete!"}
                                    </h2>
                                    <p className="text-muted text-sm">
                                        {crawlError
                                            ? "We couldn't fetch all pages, but you can add info manually in the next step."
                                            : `We found ${crawlPages.length} page${crawlPages.length !== 1 ? "s" : ""} and saved the content to your Knowledge Base.`}
                                    </p>
                                </div>

                                {crawlError && (
                                    <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700 flex items-start gap-2">
                                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                        <span>{crawlError}</span>
                                    </div>
                                )}

                                {/* Pages found */}
                                {crawlPages.length > 0 && (
                                    <div className="space-y-2 max-h-64 overflow-y-auto mb-6">
                                        {crawlPages.map((page, i) => (
                                            <div key={i} className="border border-border rounded-lg p-3 bg-background">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-1.5 mb-1">
                                                            <FileText className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                                                            <span className="text-sm font-medium truncate">{page.title}</span>
                                                        </div>
                                                        <p className="text-xs text-muted line-clamp-2">{page.snippet}</p>
                                                    </div>
                                                    <a href={page.url} target="_blank" rel="noopener noreferrer" className="text-muted hover:text-primary">
                                                        <ExternalLink className="w-3.5 h-3.5" />
                                                    </a>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="flex justify-between">
                                    <button
                                        onClick={() => setCurrentStep(2)}
                                        className="border border-border text-foreground px-4 py-2.5 rounded-lg text-sm transition hover:border-primary flex items-center gap-2"
                                    >
                                        <ArrowLeft className="w-4 h-4" /> Back
                                    </button>
                                    <button
                                        onClick={() => setCurrentStep(4)}
                                        className="bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-lg text-sm font-medium transition flex items-center gap-2"
                                    >
                                        Continue <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ─────────────────────────────────────────────────
                    STEP 4 — Tell us more (free-text, skippable)
                   ───────────────────────────────────────────────── */}
                {currentStep === 4 && (
                    <div className="bg-card border border-border rounded-xl p-8 max-w-lg mx-auto">
                        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <FileText className="w-8 h-8 text-primary" />
                        </div>
                        <h2 className="text-xl font-bold mb-2 text-center">Anything else we should know?</h2>
                        <p className="text-muted text-sm mb-4 text-center max-w-sm mx-auto">
                            Tell us about promotions, your target audience, what makes you different — anything that helps us write better ads. You can skip this for now.
                        </p>

                        {/* Step tip */}
                        <div className="bg-teal-50 border border-teal-100 rounded-lg px-4 py-2.5 text-xs text-teal-700 mb-4 flex items-start gap-2">
                            <Sparkles className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                            <span>This is optional, but the more context you give, the better your ads will be. Think: current sales, seasonal offers, unique selling points, target demographics, service areas.</span>
                        </div>

                        <textarea
                            value={aboutText}
                            onChange={(e) => setAboutText(e.target.value)}
                            rows={5}
                            placeholder="e.g., We're running a 20% off summer sale. Our main customers are homeowners aged 30-55 in the Miami area. We pride ourselves on same-day service…"
                            className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary transition resize-none"
                        />

                        <div className="flex justify-between mt-8">
                            <button
                                onClick={() => setCurrentStep(3)}
                                className="border border-border text-foreground px-4 py-2.5 rounded-lg text-sm transition hover:border-primary flex items-center gap-2"
                            >
                                <ArrowLeft className="w-4 h-4" /> Back
                            </button>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setCurrentStep(5)}
                                    className="text-sm text-muted hover:text-foreground transition"
                                >
                                    Skip for now
                                </button>
                                <button
                                    onClick={handleSaveAbout}
                                    disabled={aboutSaving}
                                    className="bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-lg text-sm font-medium transition flex items-center gap-2 disabled:opacity-50"
                                >
                                    {aboutSaving ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                                    ) : (
                                        <>Continue <ArrowRight className="w-4 h-4" /></>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─────────────────────────────────────────────────
                    STEP 5 — Upload banners / creative (skippable)
                   ───────────────────────────────────────────────── */}
                {currentStep === 5 && (
                    <div className="bg-card border border-border rounded-xl p-8 max-w-lg mx-auto">
                        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <Upload className="w-8 h-8 text-primary" />
                        </div>
                        <h2 className="text-xl font-bold mb-2 text-center">Upload ad creatives</h2>
                        <p className="text-muted text-sm mb-4 text-center max-w-sm mx-auto">
                            Have existing banners, logos, or product photos? Upload them so we can use them in your ads. You can always add more later.
                        </p>

                        {/* Step tip */}
                        <div className="bg-pink-50 border border-pink-100 rounded-lg px-4 py-2.5 text-xs text-pink-700 mb-4 flex items-start gap-2">
                            <Sparkles className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                            <span>Upload logos, product photos, or existing ad banners. The AI will analyze these for colors, text, and composition to recommend display ad formats. Totally optional — skip if you don&apos;t have any yet.</span>
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
                                uploadedFiles.length > 0 ? "border-emerald-300 bg-emerald-50/50" : "border-border hover:border-primary"
                            }`}
                            onClick={() => !uploading && fileInputRef.current?.click()}
                        >
                            {uploading ? (
                                <div className="flex flex-col items-center gap-2">
                                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                    <p className="text-sm text-muted">Uploading…</p>
                                </div>
                            ) : uploadedFiles.length > 0 ? (
                                <div className="flex flex-col items-center gap-2">
                                    <CheckCircle className="w-8 h-8 text-emerald-500" />
                                    <p className="text-sm font-medium">{uploadedFiles.length} file{uploadedFiles.length !== 1 ? "s" : ""} uploaded</p>
                                    <div className="text-xs text-muted space-y-0.5">
                                        {uploadedFiles.map((f, i) => (
                                            <p key={i}>{f.name} ({f.size})</p>
                                        ))}
                                    </div>
                                    <p className="text-xs text-primary mt-2">Click to upload more</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2">
                                    <Upload className="w-8 h-8 text-muted" />
                                    <p className="text-sm font-medium">Drop files here or click to browse</p>
                                    <p className="text-xs text-muted">JPG, PNG, GIF, WebP — up to 10 MB each</p>
                                </div>
                            )}
                        </div>

                        {uploadError && (
                            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                {uploadError}
                            </div>
                        )}

                        <div className="flex justify-between mt-8">
                            <button
                                onClick={() => setCurrentStep(4)}
                                className="border border-border text-foreground px-4 py-2.5 rounded-lg text-sm transition hover:border-primary flex items-center gap-2"
                            >
                                <ArrowLeft className="w-4 h-4" /> Back
                            </button>
                            <button
                                onClick={handleFinish}
                                className="bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-lg text-sm font-medium transition flex items-center gap-2"
                            >
                                {uploadedFiles.length > 0 ? "Go to Dashboard" : "Skip & Go to Dashboard"}
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
