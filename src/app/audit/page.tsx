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
} from "lucide-react";

const auditFeatures = [
    { icon: BarChart3, title: "Landing Page Analysis", desc: "We analyze your website for conversion-readiness, mobile optimization, and page speed." },
    { icon: Target, title: "Ad-Readiness Score", desc: "How prepared is your site to convert paid traffic? We check CTAs, forms, trust signals." },
    { icon: Search, title: "SEO & Keyword Signals", desc: "We identify keyword opportunities and gaps in your current organic strategy." },
    { icon: Shield, title: "Competitive Positioning", desc: "See how your site compares to competitors in your industry." },
    { icon: Zap, title: "Quick Win Recommendations", desc: "Actionable improvements you can implement today to boost performance." },
    { icon: DollarSign, title: "Budget Optimization Tips", desc: "Estimated savings and ROI improvements for your ad campaigns." },
];

export default function AuditPage() {
    const router = useRouter();
    const [websiteUrl, setWebsiteUrl] = useState("");
    const [businessName, setBusinessName] = useState("");
    const [industry, setIndustry] = useState("");
    const [email, setEmail] = useState("");
    const [monthlySpend, setMonthlySpend] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!websiteUrl || !businessName || !email) {
            setError("Please fill in your website URL, business name, and email.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/audit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ websiteUrl, businessName, industry, email, monthlySpend }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Audit failed");
            }

            const data = await res.json();
            // Store audit data in localStorage for the report page
            localStorage.setItem(`audit_${data.auditId}`, JSON.stringify(data));
            router.push(`/audit/report/${data.auditId}`);
        } catch (err: any) {
            setError(err.message || "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
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
                        Sign In
                    </Link>
                </div>
            </header>

            {/* Hero */}
            <section className="py-16 md:py-24">
                <div className="max-w-6xl mx-auto px-4 text-center">
                    <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-6">
                        <Sparkles className="w-4 h-4" />
                        Free AI-Powered Analysis — No Credit Card Required
                    </div>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
                        Get Your Free<br />
                        <span className="text-primary">Ad Performance Audit</span>
                    </h1>
                    <p className="text-lg md:text-xl text-muted max-w-2xl mx-auto mb-12">
                        Our AI analyzes your website in under 2 minutes and delivers a comprehensive
                        report with actionable recommendations to improve your advertising performance.
                    </p>

                    {/* Audit Form */}
                    <div className="max-w-xl mx-auto">
                        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 md:p-8 text-left space-y-5">
                            <h2 className="text-lg font-semibold text-foreground text-center mb-2">
                                Start Your Free Audit
                            </h2>

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="text-sm text-muted mb-1.5 block flex items-center gap-1.5">
                                    <Globe className="w-3.5 h-3.5" /> Website URL <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="url"
                                    value={websiteUrl}
                                    onChange={(e) => setWebsiteUrl(e.target.value)}
                                    placeholder="https://yourwebsite.com"
                                    className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder-muted/50 focus:outline-none focus:border-primary text-sm"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-muted mb-1.5 block flex items-center gap-1.5">
                                        <Building2 className="w-3.5 h-3.5" /> Business Name <span className="text-red-400">*</span>
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
                                    <label className="text-sm text-muted mb-1.5 block">Industry</label>
                                    <select
                                        value={industry}
                                        onChange={(e) => setIndustry(e.target.value)}
                                        className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary text-sm"
                                    >
                                        <option value="">Select industry...</option>
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
                                    <label className="text-sm text-muted mb-1.5 block">Email <span className="text-red-400">*</span></label>
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
                                        <DollarSign className="w-3.5 h-3.5" /> Monthly Ad Spend (optional)
                                    </label>
                                    <select
                                        value={monthlySpend}
                                        onChange={(e) => setMonthlySpend(e.target.value)}
                                        className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary text-sm"
                                    >
                                        <option value="">Select range...</option>
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
                                        Analyzing Your Website...
                                    </>
                                ) : (
                                    <>
                                        Get My Free Audit Report
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>

                            <p className="text-[11px] text-muted/60 text-center">
                                No credit card required. Your report will be ready in under 2 minutes.
                            </p>
                        </form>
                    </div>
                </div>
            </section>

            {/* What you get */}
            <section className="py-16 bg-card/50">
                <div className="max-w-6xl mx-auto px-4">
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-3">
                        What&apos;s In Your Audit Report?
                    </h2>
                    <p className="text-muted text-center mb-12 max-w-2xl mx-auto">
                        Our AI engine performs a comprehensive analysis of your website and delivers
                        actionable insights in a beautiful, branded report.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {auditFeatures.map((f, i) => (
                            <div key={i} className="bg-card border border-border rounded-xl p-6 hover:border-primary/30 transition">
                                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                                    <f.icon className="w-5 h-5 text-primary" />
                                </div>
                                <h3 className="text-base font-semibold text-foreground mb-2">{f.title}</h3>
                                <p className="text-sm text-muted">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section className="py-16">
                <div className="max-w-4xl mx-auto px-4">
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-12">
                        How It Works
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
                        Ready to Discover Hidden Opportunities?
                    </h2>
                    <p className="text-muted mb-8">
                        Join thousands of businesses who&apos;ve used our free audit to improve their advertising performance.
                    </p>
                    <a href="#" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-lg font-semibold text-lg transition">
                        Start Your Free Audit
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
