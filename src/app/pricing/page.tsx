"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import {
    Zap,
    Check,
    X,
    ArrowRight,
    Shield,
    Star,
    CreditCard,
    Plus,
    Minus,
    MessageCircle,
    Crown,
    Sparkles,
} from "lucide-react";
import { PLANS, TOP_UPS } from "@/lib/plans";
import { getAuthUser, authFetch } from "@/lib/auth-client";

function PricingContent() {
    const searchParams = useSearchParams();
    const cancelled = searchParams.get("cancelled");
    const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
    const [showTopUps, setShowTopUps] = useState(false);
    const [faqOpen, setFaqOpen] = useState<number | null>(null);

    const planOrder = ["free", "starter", "pro"];
    const plans = planOrder.map((id) => PLANS[id]);

    // Read user session from localStorage token (with cookie fallback)
    const getUserSession = () => {
        // Try localStorage token first (works when cookies are blocked)
        const user = getAuthUser();
        if (user) return { ...user, authenticated: true };

        // Fallback: try cookie (may work in some browsers)
        try {
            const match = document.cookie.match(/session=([^;]+)/);
            if (!match) return null;
            const s = JSON.parse(decodeURIComponent(match[1]));
            return s?.authenticated ? s : null;
        } catch { return null; }
    };

    const handleSubscribe = async (planId: string) => {
        if (planId === "free") {
            window.location.href = "/onboarding";
            return;
        }

        const session = getUserSession();
        if (!session) {
            window.location.href = `/login?next=/pricing`;
            return;
        }

        try {
            const res = await authFetch("/api/stripe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    plan: planId,
                    userId: session.id,
                    email: session.email,
                }),
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else if (data.demo) {
                window.location.href = "/onboarding";
            }
        } catch {
            window.location.href = "/onboarding";
        }
    };

    const handleTopUp = async (topUpId: string) => {
        const session = getUserSession();
        if (!session) {
            window.location.href = `/login?next=/pricing`;
            return;
        }

        try {
            const res = await authFetch("/api/stripe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "topup",
                    topUpId,
                    userId: session.id,
                    email: session.email,
                }),
            });
            const data = await res.json();
            if (data.url) window.location.href = data.url;
        } catch {
            // Handle error silently
        }
    };

    const faqs = [
        {
            q: "Can I try AdMaster Pro for free?",
            a: "Yes! The Free plan gives you a complete Google Ads audit plus 10 AI messages per month — no credit card required. Paid plans include a 7-day free trial.",
        },
        {
            q: "What happens when I run out of AI messages?",
            a: "You can purchase additional messages anytime with our top-up packages ($30 for 50, $50 for 100, or $100 for 250 messages). Your unused top-up messages never expire.",
        },
        {
            q: "Can I change plans anytime?",
            a: "Absolutely. Upgrade or downgrade at any time. When you upgrade, you get immediate access to all new features. When you downgrade, your current plan continues until the end of the billing period.",
        },
        {
            q: "Do I need a Google Ads account?",
            a: "You can start using AdMaster Pro without one! The AI chat, knowledge base, and ad audit work right away. You'll need a Google Ads account to push campaigns live.",
        },
        {
            q: "What's included in the free audit?",
            a: "Our AI analyzes your Google Ads account and tells you exactly where you're wasting money — inefficient keywords, poor ad copy, bad bidding strategies — plus actionable fixes. It's completely free, even on the Free plan.",
        },
        {
            q: "Is my data secure?",
            a: "Yes. We use SSL encryption, store tokens securely, and never share your ad data. We only access what you explicitly grant via Google OAuth.",
        },
    ];

    return (
        <div className="min-h-screen bg-background">
            {/* Nav */}
            <nav className="fixed top-0 w-full bg-background/80 backdrop-blur-md border-b border-border z-50">
                <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                            <Zap className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-lg">AdMaster Pro</span>
                    </Link>
                    <div className="flex items-center gap-3">
                        <Link href="/login" className="text-sm text-muted hover:text-foreground transition">
                            Log In
                        </Link>
                        <Link
                            href="/onboarding"
                            className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                        >
                            Start Free
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section className="pt-28 pb-12 px-4 text-center">
                {/* Trial Banner */}
                <div className="max-w-3xl mx-auto mb-8 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl p-6 shadow-lg">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="text-left">
                            <div className="flex items-center gap-2 mb-1">
                                <Sparkles className="w-5 h-5" />
                                <span className="font-bold text-lg">7-Day Free Trial</span>
                            </div>
                            <p className="text-sm text-white/90">
                                Full access to all features — no credit card required. We&apos;re still in beta, so everything is free!
                            </p>
                        </div>
                        <Link
                            href="/login"
                            className="shrink-0 bg-white text-green-600 hover:bg-green-50 px-6 py-3 rounded-xl font-bold text-sm transition flex items-center gap-2"
                        >
                            Start Free Trial
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>

                <div className="inline-flex items-center gap-2 bg-primary-light text-primary px-3 py-1 rounded-full text-sm font-medium mb-4">
                    <Crown className="w-4 h-4" />
                    Simple, Transparent Pricing
                </div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                    Choose the plan that fits your business
                </h1>
                <p className="text-lg text-muted max-w-2xl mx-auto mb-6">
                    Start with a 7-day free trial — full access, no credit card. Upgrade when you&apos;re ready.
                </p>

                {cancelled && (
                    <div className="max-w-md mx-auto mb-6 bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-lg px-4 py-3">
                        Checkout was cancelled. No worries — you can try again anytime.
                    </div>
                )}

                {/* Billing toggle */}
                <div className="flex items-center justify-center gap-3 mb-12">
                    <span className={`text-sm ${billingCycle === "monthly" ? "text-foreground font-medium" : "text-muted"}`}>
                        Monthly
                    </span>
                    <button
                        onClick={() => setBillingCycle(billingCycle === "monthly" ? "annual" : "monthly")}
                        className={`relative w-14 h-7 rounded-full transition-colors ${billingCycle === "annual" ? "bg-primary" : "bg-border"}`}
                    >
                        <div
                            className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${billingCycle === "annual" ? "translate-x-8" : "translate-x-1"}`}
                        />
                    </button>
                    <span className={`text-sm ${billingCycle === "annual" ? "text-foreground font-medium" : "text-muted"}`}>
                        Annual
                    </span>
                    {billingCycle === "annual" && (
                        <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full">
                            Save 20%
                        </span>
                    )}
                </div>
            </section>

            {/* Plan Cards */}
            <section className="px-4 pb-16">
                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
                    {plans.map((plan) => {
                        const annualPrice = Math.round(plan.price * 0.8);
                        const displayPrice = billingCycle === "annual" && plan.price > 0 ? annualPrice : plan.price;
                        const isPopular = plan.popular;

                        return (
                            <div
                                key={plan.id}
                                className={`relative bg-card border rounded-2xl p-6 md:p-8 flex flex-col ${isPopular
                                    ? "border-primary shadow-xl shadow-primary/10 scale-[1.02] md:scale-105"
                                    : "border-border"
                                    }`}
                            >
                                {isPopular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                        <div className="bg-primary text-white text-xs font-bold px-4 py-1 rounded-full flex items-center gap-1">
                                            <Star className="w-3 h-3 fill-white" />
                                            Most Popular
                                        </div>
                                    </div>
                                )}

                                {plan.id === "pro" && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-4 py-1 rounded-full flex items-center gap-1">
                                            <Sparkles className="w-3 h-3" />
                                            Full Power
                                        </div>
                                    </div>
                                )}

                                <div className="mb-6">
                                    <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                                    <p className="text-sm text-muted">{plan.description}</p>
                                </div>

                                <div className="mb-6">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-bold">${displayPrice}</span>
                                        <span className="text-muted text-sm">
                                            {plan.price === 0 ? "forever" : billingCycle === "annual" ? "/mo (billed annually)" : "/month"}
                                        </span>
                                    </div>
                                    {billingCycle === "annual" && plan.price > 0 && (
                                        <div className="text-sm text-muted mt-1">
                                            <span className="line-through">${plan.price}/mo</span>
                                            <span className="text-green-600 font-medium ml-2">
                                                Save ${(plan.price - annualPrice) * 12}/year
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() => handleSubscribe(plan.id)}
                                    className={`w-full py-3 rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2 mb-6 ${plan.ctaVariant === "primary"
                                        ? "bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/20"
                                        : plan.ctaVariant === "accent"
                                            ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/20"
                                            : "border border-border hover:border-primary text-foreground hover:text-primary"
                                        }`}
                                >
                                    {plan.cta}
                                    <ArrowRight className="w-4 h-4" />
                                </button>

                                {/* Feature List */}
                                <ul className="space-y-3 flex-1">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-start gap-2.5 text-sm">
                                            {feature.included ? (
                                                <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                                            ) : (
                                                <X className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
                                            )}
                                            <span className={`${feature.highlight ? "font-semibold" : ""} ${!feature.included ? "text-muted" : ""}`}>
                                                {feature.text}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Top-Up Section */}
            <section className="px-4 pb-16">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-8">
                        <button
                            onClick={() => setShowTopUps(!showTopUps)}
                            className="inline-flex items-center gap-2 bg-card border border-border rounded-full px-6 py-3 text-sm font-medium hover:border-primary transition"
                        >
                            <CreditCard className="w-4 h-4 text-primary" />
                            Need more AI messages? View Top-Up Packages
                            {showTopUps ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        </button>
                    </div>

                    {showTopUps && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in-up">
                            {TOP_UPS.map((topUp) => (
                                <div
                                    key={topUp.id}
                                    className={`bg-card border rounded-xl p-6 text-center relative ${topUp.popular ? "border-primary shadow-md" : "border-border"
                                        }`}
                                >
                                    {topUp.popular && (
                                        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-bold px-3 py-0.5 rounded-full">
                                            Best Value
                                        </div>
                                    )}
                                    <div className="text-3xl font-bold mb-1">${topUp.amount}</div>
                                    <div className="text-sm text-muted mb-1">one-time</div>
                                    <div className="flex items-center justify-center gap-1.5 mb-4">
                                        <MessageCircle className="w-4 h-4 text-primary" />
                                        <span className="font-semibold">{topUp.label}</span>
                                    </div>
                                    {topUp.savings && (
                                        <div className="text-xs text-green-600 font-medium mb-3">{topUp.savings}</div>
                                    )}
                                    <div className="text-xs text-muted mb-4">
                                        ${(topUp.amount / topUp.messages).toFixed(2)}/message · Never expires
                                    </div>
                                    <button
                                        onClick={() => handleTopUp(topUp.id)}
                                        className="w-full py-2.5 border border-border rounded-lg text-sm font-medium hover:border-primary hover:text-primary transition"
                                    >
                                        Buy Now
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Feature Comparison Table */}
            <section className="px-4 pb-16">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-2xl font-bold text-center mb-8">Detailed Feature Comparison</h2>
                    <div className="bg-card border border-border rounded-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border bg-sidebar">
                                        <th className="text-left p-4 font-semibold">Feature</th>
                                        <th className="text-center p-4 font-semibold">Free</th>
                                        <th className="text-center p-4 font-semibold text-primary">Starter · $49/mo</th>
                                        <th className="text-center p-4 font-semibold text-amber-600">Pro · $149/mo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        { feature: "Free Google Ads Audit", free: true, starter: true, pro: true },
                                        { feature: "AI Chat Messages", free: "10/mo", starter: "200/mo", pro: "Unlimited" },
                                        { feature: "Campaign Drafts", free: "1", starter: "10", pro: "Unlimited" },
                                        { feature: "Google Ads Accounts", free: "1", starter: "2", pro: "10" },
                                        { feature: "Knowledge Base Uploads", free: "3", starter: "25", pro: "Unlimited" },
                                        { feature: "AI Ad Copy Generation", free: false, starter: true, pro: true },
                                        { feature: "Auto-Pilot Mode", free: false, starter: true, pro: true },
                                        { feature: "Keyword Research", free: "Basic", starter: "Full", pro: "Full + Competitor" },
                                        { feature: "Policy Compliance Checks", free: true, starter: true, pro: true },
                                        { feature: "Video Transcription", free: false, starter: "30 min/mo", pro: "Unlimited" },
                                        { feature: "Shopping Ads", free: false, starter: false, pro: true },
                                        { feature: "Display & Video Ads", free: false, starter: false, pro: true },
                                        { feature: "Performance Max", free: false, starter: false, pro: true },
                                        { feature: "Competitor Analysis", free: false, starter: false, pro: true },
                                        { feature: "Custom Brand Voice", free: false, starter: false, pro: true },
                                        { feature: "Bulk Operations", free: false, starter: false, pro: true },
                                        { feature: "Daily Reports", free: false, starter: true, pro: true },
                                        { feature: "Weekly Reports", free: false, starter: false, pro: true },
                                        { feature: "API Access", free: false, starter: false, pro: true },
                                        { feature: "Priority Support", free: false, starter: true, pro: true },
                                        { feature: "Dedicated Account Manager", free: false, starter: false, pro: true },
                                    ].map((row, i) => (
                                        <tr key={i} className="border-b border-border/50 hover:bg-sidebar/50">
                                            <td className="p-4 font-medium">{row.feature}</td>
                                            {[row.free, row.starter, row.pro].map((val, j) => (
                                                <td key={j} className="text-center p-4">
                                                    {typeof val === "boolean" ? (
                                                        val ? (
                                                            <Check className="w-5 h-5 text-green-500 mx-auto" />
                                                        ) : (
                                                            <X className="w-5 h-5 text-gray-300 mx-auto" />
                                                        )
                                                    ) : (
                                                        <span className={val === "Unlimited" ? "font-semibold text-green-600" : ""}>{val}</span>
                                                    )}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="px-4 pb-20">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
                    <div className="space-y-3">
                        {faqs.map((faq, i) => (
                            <div
                                key={i}
                                className="bg-card border border-border rounded-xl overflow-hidden"
                            >
                                <button
                                    onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                                    className="w-full flex items-center justify-between p-5 text-left"
                                >
                                    <span className="font-medium text-sm pr-4">{faq.q}</span>
                                    {faqOpen === i ? (
                                        <Minus className="w-4 h-4 text-muted shrink-0" />
                                    ) : (
                                        <Plus className="w-4 h-4 text-muted shrink-0" />
                                    )}
                                </button>
                                {faqOpen === i && (
                                    <div className="px-5 pb-5 text-sm text-muted leading-relaxed animate-fade-in-up">
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Trust + CTA */}
            <section className="px-4 pb-20">
                <div className="max-w-3xl mx-auto text-center">
                    <div className="bg-primary text-white rounded-2xl p-8 md:p-12">
                        <h2 className="text-2xl md:text-3xl font-bold mb-4">
                            Ready to stop wasting money on Google Ads?
                        </h2>
                        <p className="text-lg opacity-90 mb-6">
                            Start with a free audit. See exactly where your ad budget is going. No credit card required.
                        </p>
                        <Link
                            href="/onboarding"
                            className="inline-flex items-center gap-2 bg-white text-primary hover:bg-gray-100 px-8 py-3 rounded-xl font-semibold text-lg transition"
                        >
                            Get Your Free Audit
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                        <div className="flex items-center justify-center gap-6 mt-6 text-sm opacity-80">
                            <div className="flex items-center gap-1.5">
                                <Shield className="w-4 h-4" />
                                SSL Encrypted
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Shield className="w-4 h-4" />
                                7-Day Free Trial
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Shield className="w-4 h-4" />
                                Cancel Anytime
                            </div>
                        </div>
                    </div>
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
                                <a href="/pricing" className="hover:text-foreground transition">Pricing</a>
                                <a href="/audit" className="hover:text-foreground transition">Free Audit</a>
                                <a href="/faq" className="hover:text-foreground transition">FAQ</a>
                                <a href="/login" className="hover:text-foreground transition">Login</a>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-semibold text-sm mb-3">Company</h4>
                            <div className="flex flex-col gap-2 text-sm text-muted">
                                <a href="/about" className="hover:text-foreground transition">About Us</a>
                                <a href="mailto:support@admasterai.com" className="hover:text-foreground transition">Contact</a>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-semibold text-sm mb-3">Legal</h4>
                            <div className="flex flex-col gap-2 text-sm text-muted">
                                <a href="/privacy" className="hover:text-foreground transition">Privacy Policy</a>
                                <a href="/terms" className="hover:text-foreground transition">Terms of Service</a>
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

export default function PricingPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-pulse text-muted">Loading pricing...</div></div>}>
            <PricingContent />
        </Suspense>
    );
}
