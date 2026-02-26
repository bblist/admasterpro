"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    Search,
    Zap,
    BarChart3,
    Target,
    Shield,
    ArrowRight,
    Loader2,
    CheckCircle2,
    Globe,
    Building2,
    DollarSign,
    Sparkles,
    Mail,
    X,
} from "lucide-react";
import { useTranslation } from "@/i18n/context";
import { authFetch, captureTokenFromHash, decodeTokenPayload, isAuthenticated, setAuth } from "@/lib/auth-client";
import Tooltip from "@/components/Tooltip";

const auditFeatures = [
    { icon: BarChart3, title: "Landing Page Analysis", desc: "We analyze your website for conversion-readiness, mobile optimization, and page speed." },
    { icon: Target, title: "Ad-Readiness Score", desc: "How prepared is your site to convert paid traffic? We check CTAs, forms, trust signals." },
    { icon: Search, title: "SEO & Keyword Signals", desc: "We identify keyword opportunities and gaps in your current organic strategy." },
    { icon: Shield, title: "Competitive Positioning", desc: "See how your site compares to competitors in your industry." },
    { icon: Zap, title: "Quick Win Recommendations", desc: "Actionable improvements you can implement today to boost performance." },
    { icon: DollarSign, title: "Budget Optimization Tips", desc: "Estimated savings and ROI improvements for your ad campaigns." },
];

export default function AuditPage() {
    const { t } = useTranslation();
    const router = useRouter();
    const [websiteUrl, setWebsiteUrl] = useState("");
    const [businessName, setBusinessName] = useState("");
    const [industry, setIndustry] = useState("");
    const [email, setEmail] = useState("");
    const [monthlySpend, setMonthlySpend] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authEmail, setAuthEmail] = useState("");
    const [authLoading, setAuthLoading] = useState(false);
    const [authError, setAuthError] = useState("");

    /** Auto-prepend https:// if user enters a bare domain */
    const normalizeUrl = (raw: string): string => {
        const v = raw.trim();
        if (!v) return v;
        if (/^https?:\/\//i.test(v)) return v;
        return `https://${v}`;
    };

    const PENDING_AUDIT_KEY = "amp_pending_audit_form";

    type AuditPayload = {
        websiteUrl: string;
        businessName: string;
        industry: string;
        email: string;
        monthlySpend: string;
    };

    const getPayload = (): AuditPayload => ({
        websiteUrl: normalizeUrl(websiteUrl),
        businessName,
        industry,
        email,
        monthlySpend,
    });

    const savePendingPayload = (payload: AuditPayload) => {
        localStorage.setItem(PENDING_AUDIT_KEY, JSON.stringify(payload));
    };

    const clearPendingPayload = () => {
        localStorage.removeItem(PENDING_AUDIT_KEY);
    };

    const runAudit = React.useCallback(async (payload: AuditPayload) => {
        setLoading(true);
        try {
            const res = await authFetch("/api/audit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (res.status === 401) {
                localStorage.setItem(PENDING_AUDIT_KEY, JSON.stringify(payload));
                setAuthEmail(payload.email || "");
                setShowAuthModal(true);
                setError("");
                return;
            }

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Audit failed");
            }

            const data = await res.json();
            clearPendingPayload();
            localStorage.setItem(`audit_${data.auditId}`, JSON.stringify(data));
            router.push(`/audit/report/${data.auditId}`);
        } catch (err: any) {
            setError(err.message || "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [router]);

    React.useEffect(() => {
        captureTokenFromHash();

        const pendingRaw = localStorage.getItem(PENDING_AUDIT_KEY);
        if (pendingRaw) {
            try {
                const pending = JSON.parse(pendingRaw) as AuditPayload;
                setWebsiteUrl(pending.websiteUrl || "");
                setBusinessName(pending.businessName || "");
                setIndustry(pending.industry || "");
                setEmail(pending.email || "");
                setMonthlySpend(pending.monthlySpend || "");

                const hasResumeFlag = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("resume") === "1";
                if (isAuthenticated() && hasResumeFlag) {
                    runAudit(pending);
                    router.replace("/audit");
                }
            } catch {
                clearPendingPayload();
            }
        }
    }, [router, runAudit]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        const payload = getPayload();

        if (!payload.websiteUrl || !payload.businessName || !payload.email) {
            setError("Please fill in your website URL, business name, and email.");
            return;
        }

        await runAudit(payload);
    };

    const handleGoogleAuth = () => {
        savePendingPayload(getPayload());
        window.location.href = "/api/auth/callback?next=/audit?resume=1";
    };

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!authEmail.trim() || !authEmail.includes("@")) {
            setAuthError("Enter a valid email address.");
            return;
        }

        setAuthError("");
        setAuthLoading(true);

        try {
            const res = await fetch("/api/auth/email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: authEmail.trim() }),
            });

            if (!res.ok) {
                throw new Error("Sign in failed. Please try again.");
            }

            const data = await res.json();
            if (data.token) {
                const user = decodeTokenPayload(data.token);
                setAuth(data.token, user || undefined);
            }

            setShowAuthModal(false);
            const pendingRaw = localStorage.getItem(PENDING_AUDIT_KEY);
            if (pendingRaw) {
                const pending = JSON.parse(pendingRaw) as AuditPayload;
                await runAudit(pending);
            }
        } catch (err: any) {
            setAuthError(err.message || "Could not sign in.");
        } finally {
            setAuthLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b border-border bg-background/95 backdrop-blur">
                <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                            <Zap className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-foreground">
                            AdMaster <span className="text-primary">Pro</span>
                        </span>
                    </Link>
                    <Link href="/login" className="text-sm text-muted hover:text-foreground transition">
                        {t("common.signIn")}
                    </Link>
                </div>
            </header>

            {/* Hero */}
            <section className="py-16 md:py-24">
                <div className="max-w-6xl mx-auto px-4 text-center">
                    <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-6">
                        <Sparkles className="w-4 h-4" />
                        {t("audit.badge")}
                    </div>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
                        {t("audit.heroTitle1")}<br />
                        <span className="text-primary">{t("audit.heroTitle2")}</span>
                    </h1>
                    <p className="text-lg md:text-xl text-muted max-w-2xl mx-auto mb-12">
                        {t("audit.heroDesc")}
                    </p>

                    {/* Audit Form */}
                    <div className="max-w-xl mx-auto">
                        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 md:p-8 text-left space-y-5">
                            <h2 className="text-lg font-semibold text-foreground text-center mb-2">
                                {t("audit.formTitle")}
                            </h2>

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="text-sm text-muted mb-1.5 block flex items-center gap-1.5">
                                    <Globe className="w-3.5 h-3.5" /> {t("audit.websiteUrl")} <span className="text-red-400">*</span> <Tooltip text="Enter the homepage URL of the website you want audited. We'll crawl it to analyze content, structure, and ad-readiness." position="right" />
                                </label>
                                <input
                                    type="text"
                                    value={websiteUrl}
                                    onChange={(e) => setWebsiteUrl(e.target.value)}
                                    onBlur={() => { if (websiteUrl.trim()) setWebsiteUrl(normalizeUrl(websiteUrl)); }}
                                    placeholder="yourwebsite.com"
                                    className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder-muted/50 focus:outline-none focus:border-primary text-sm"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-muted mb-1.5 block flex items-center gap-1.5">
                                        <Building2 className="w-3.5 h-3.5" /> {t("audit.businessName")} <span className="text-red-400">*</span> <Tooltip text="Your company or brand name. Used to personalize the audit report and competitive analysis." position="right" />
                                    </label>
                                    <input
                                        type="text"
                                        value={businessName}
                                        onChange={(e) => setBusinessName(e.target.value)}
                                        placeholder="Your Business Name"
                                        className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder-muted/50 focus:outline-none focus:border-primary text-sm"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-muted mb-1.5 block">{t("audit.industry")} <Tooltip text="Helps the AI benchmark your site against industry standards and competitors in the same space." position="right" /></label>
                                    <select
                                        value={industry}
                                        onChange={(e) => setIndustry(e.target.value)}
                                        className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary text-sm"
                                    >
                                        <option value="">{t("audit.selectIndustry")}</option>
                                        <option value="ecommerce">E-Commerce / Retail</option>
                                        <option value="saas">SaaS / Technology</option>
                                        <option value="healthcare">Healthcare / Medical</option>
                                        <option value="legal">Legal Services</option>
                                        <option value="realestate">Real Estate</option>
                                        <option value="restaurant">Restaurant / Food</option>
                                        <option value="automotive">Automotive</option>
                                        <option value="finance">Finance / Insurance</option>
                                        <option value="education">Education</option>
                                        <option value="homeservices">Home Services</option>
                                        <option value="fitness">Fitness / Wellness</option>
                                        <option value="agency">Agency / Marketing</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-muted mb-1.5 block">{t("audit.email")} <span className="text-red-400">*</span> <Tooltip text="We'll email you the full PDF audit report. No spam, ever." position="right" /></label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@company.com"
                                        className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder-muted/50 focus:outline-none focus:border-primary text-sm"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-muted mb-1.5 block flex items-center gap-1.5">
                                        <DollarSign className="w-3.5 h-3.5" /> {t("audit.monthlySpend")} <Tooltip text="Your current monthly Google Ads budget. Helps the AI tailor recommendations to your spending level." position="left" />
                                    </label>
                                    <select
                                        value={monthlySpend}
                                        onChange={(e) => setMonthlySpend(e.target.value)}
                                        className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary text-sm"
                                    >
                                        <option value="">{t("audit.selectRange")}</option>
                                        <option value="0-1000">$0 – $1,000</option>
                                        <option value="1000-5000">$1,000 – $5,000</option>
                                        <option value="5000-15000">$5,000 – $15,000</option>
                                        <option value="15000-50000">$15,000 – $50,000</option>
                                        <option value="50000+">$50,000+</option>
                                    </select>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-primary hover:bg-primary-dark text-white py-3.5 rounded-lg font-semibold text-base transition flex items-center justify-center gap-2 disabled:opacity-70"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        {t("audit.analyzing")}
                                    </>
                                ) : (
                                    <>
                                        {t("audit.getReport")}
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>

                            <p className="text-[11px] text-muted/60 text-center">
                                {t("audit.noCreditCard")}
                            </p>
                        </form>
                    </div>
                </div>
            </section>

            {/* What you get */}
            <section className="py-16 bg-card/50">
                <div className="max-w-6xl mx-auto px-4">
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-3">
                        {t("audit.whatInReport")}
                    </h2>
                    <p className="text-muted text-center mb-12 max-w-2xl mx-auto">
                        {t("audit.whatInReportDesc")}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {auditFeatures.map((f, i) => (
                            <div key={i} className="bg-card border border-border rounded-xl p-6 hover:border-primary/30 transition">
                                <div className="flex items-start gap-3 mb-2">
                                    <f.icon className="w-5 h-5 text-muted mt-0.5 shrink-0" />
                                    <h3 className="text-base font-semibold text-foreground">{f.title}</h3>
                                </div>
                                <p className="text-sm text-muted">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {showAuthModal && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowAuthModal(false)}>
                    <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-foreground">Sign in to continue your audit</h3>
                                <p className="text-sm text-muted mt-1">Your form is saved. Sign in and we’ll continue automatically.</p>
                            </div>
                            <button onClick={() => setShowAuthModal(false)} className="text-muted hover:text-foreground transition">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <button
                            onClick={handleGoogleAuth}
                            className="w-full bg-white border border-gray-300 text-gray-700 px-4 py-3 rounded-xl font-medium hover:bg-gray-50 transition flex items-center justify-center gap-3 shadow-sm"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Continue with Google
                        </button>

                        <div className="relative my-5">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-border"></div>
                            </div>
                            <div className="relative flex justify-center text-xs">
                                <span className="bg-card px-3 text-muted">or continue with email</span>
                            </div>
                        </div>

                        <form onSubmit={handleEmailAuth} className="space-y-3">
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                                <input
                                    type="email"
                                    value={authEmail}
                                    onChange={(e) => { setAuthEmail(e.target.value); setAuthError(""); }}
                                    placeholder="you@company.com"
                                    className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary transition"
                                />
                            </div>
                            {authError && <p className="text-xs text-red-500">{authError}</p>}
                            <button
                                type="submit"
                                disabled={authLoading}
                                className="w-full bg-primary hover:bg-primary-dark text-white py-2.5 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                Continue with Email
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* How it works */}
            <section className="py-16">
                <div className="max-w-4xl mx-auto px-4">
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-12">
                        {t("audit.howItWorks")}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { step: "1", title: "Enter Your Website", desc: "Just paste your URL and basic business info. Takes 30 seconds." },
                            { step: "2", title: "AI Analyzes Your Site", desc: "Our AI crawls your site and evaluates 50+ performance factors." },
                            { step: "3", title: "Get Your Report", desc: "Download a beautiful PDF report with scores, charts, and recommendations." },
                        ].map((item) => (
                            <div key={item.step} className="text-center">
                                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white text-lg font-bold mx-auto mb-4">
                                    {item.step}
                                </div>
                                <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                                <p className="text-sm text-muted">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Trust badges */}
            <section className="py-12 bg-card/50 border-t border-border">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="flex flex-wrap justify-center gap-8 text-center">
                        {[
                            { value: "50+", label: "Factors Analyzed" },
                            { value: "<2 min", label: "Report Ready" },
                            { value: "Free", label: "No Credit Card" },
                            { value: "PDF", label: "Export Ready" },
                        ].map((item) => (
                            <div key={item.label}>
                                <div className="text-2xl font-bold text-primary">{item.value}</div>
                                <div className="text-xs text-muted mt-1">{item.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer CTA */}
            <section className="py-16">
                <div className="max-w-2xl mx-auto px-4 text-center">
                    <h2 className="text-2xl font-bold text-foreground mb-4">
                        {t("audit.readyToDiscover")}
                    </h2>
                    <p className="text-muted mb-8">
                        {t("audit.joinThousands")}
                    </p>
                    <a href="#" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-lg font-semibold text-lg transition">
                        {t("audit.startFreeAudit")}
                        <ArrowRight className="w-5 h-5" />
                    </a>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-border py-12 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                                    <Zap className="w-4 h-4 text-white" />
                                </div>
                                <span className="font-semibold text-sm">AdMaster Pro</span>
                            </div>
                            <p className="text-xs text-muted leading-relaxed">AI-powered Google Ads management for small businesses.</p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-sm mb-3">Product</h4>
                            <div className="flex flex-col gap-2 text-sm text-muted">
                                <Link href="/pricing" className="hover:text-foreground transition">Pricing</Link>
                                <Link href="/audit" className="hover:text-foreground transition">Free Audit</Link>
                                <Link href="/faq" className="hover:text-foreground transition">FAQ</Link>
                                <Link href="/login" className="hover:text-foreground transition">Login</Link>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-semibold text-sm mb-3">Company</h4>
                            <div className="flex flex-col gap-2 text-sm text-muted">
                                <Link href="/about" className="hover:text-foreground transition">About Us</Link>
                                <a href="mailto:support@admasterai.com" className="hover:text-foreground transition">Contact</a>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-semibold text-sm mb-3">Legal</h4>
                            <div className="flex flex-col gap-2 text-sm text-muted">
                                <Link href="/privacy" className="hover:text-foreground transition">Privacy Policy</Link>
                                <Link href="/terms" className="hover:text-foreground transition">Terms of Service</Link>
                            </div>
                        </div>
                    </div>
                    <div className="border-t border-border pt-6 text-center text-xs text-muted">
                        &copy; {new Date().getFullYear()} NobleBlocks LLC. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
}
