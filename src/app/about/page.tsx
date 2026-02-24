"use client";

import Link from "next/link";
import {
    Zap,
    ArrowRight,
    Shield,
    Users,
    Globe,
    Target,
    Lightbulb,
    TrendingUp,
    Heart,
    Award,
    MessageCircle,
    CheckCircle2,
} from "lucide-react";

const values = [
    {
        icon: Shield,
        title: "Transparency First",
        description: "Nothing goes live without your approval. You see every keyword, every ad, every dollar. No black boxes.",
    },
    {
        icon: Heart,
        title: "Built for Real People",
        description: "We design for busy business owners, not PPC experts. Plain English, voice commands, zero jargon.",
    },
    {
        icon: Lightbulb,
        title: "AI That Gets Smarter",
        description: "Our dual AI engines learn your business through your Knowledge Base — your industry, prices, and USPs.",
    },
    {
        icon: Target,
        title: "Results Over Features",
        description: "We measure success by how much money we save you, not how many buttons we add.",
    },
];

const milestones = [
    { year: "2024", event: "Idea born — frustrated with how complex Google Ads tools were for small businesses" },
    { year: "2024", event: "First prototype built with GPT-4 integration" },
    { year: "2025", event: "Added voice commands, Knowledge Base, and multi-account management" },
    { year: "2025", event: "Launched dual AI engine (GPT-4o + Claude) and free audit tool" },
    { year: "2026", event: "Platform goes live with full Stripe billing and Google Ads API integration" },
];

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-background">
            {/* Nav */}
            <nav className="border-b border-border bg-background/95 backdrop-blur">
                <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                            <Zap className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-lg text-foreground">
                            AdMaster <span className="text-primary">Pro</span>
                        </span>
                    </Link>
                    <div className="hidden md:flex items-center gap-6 text-sm text-muted">
                        <Link href="/pricing" className="hover:text-foreground transition">Pricing</Link>
                        <Link href="/faq" className="hover:text-foreground transition">FAQ</Link>
                        <Link href="/audit" className="hover:text-foreground transition">Free Audit</Link>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/login" className="text-sm text-muted hover:text-foreground transition">Log In</Link>
                        <Link href="/onboarding" className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition">
                            Start Free
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section className="py-20 md:py-28 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-6">
                        <Users className="w-4 h-4" />
                        About AdMaster Pro
                    </div>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
                        Google Ads shouldn&apos;t be
                        <span className="text-primary"> this hard</span>
                    </h1>
                    <p className="text-lg md:text-xl text-muted max-w-3xl mx-auto leading-relaxed">
                        We built AdMaster Pro because small business owners deserve the same AI-powered
                        advertising tools that big companies use — without the complexity, the jargon,
                        or the $5,000/month agency fees.
                    </p>
                </div>
            </section>

            {/* Our Story */}
            <section className="py-16 bg-card/50 border-y border-border">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                            <Globe className="w-5 h-5 text-primary" />
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold text-foreground">Our Story</h2>
                    </div>
                    <div className="space-y-6 text-muted leading-relaxed">
                        <p>
                            AdMaster Pro was born from a simple frustration: Google Ads is one of the most powerful
                            advertising platforms in the world, but it&apos;s nearly impossible for small business owners
                            to use effectively. The dashboard is overwhelming, the terminology is confusing, and most
                            &quot;help&quot; resources assume you already know what you&apos;re doing.
                        </p>
                        <p>
                            We watched small business owners — plumbers, dentists, restaurant owners, lawyers —
                            waste thousands of dollars every month on keywords like &quot;free tips&quot; and &quot;DIY plumbing,&quot;
                            on ads running at 3 AM when nobody converts, and on campaigns with no clear strategy.
                            The alternative? Hiring an agency for $1,500-$5,000/month — often with little transparency
                            into what they&apos;re actually doing.
                        </p>
                        <p>
                            So we built something different. <strong className="text-foreground">AdMaster Pro is an AI assistant
                                that speaks your language.</strong> Instead of learning Google Ads, you just tell the AI
                            what you need: &quot;Create 3 ads for drain cleaning,&quot; &quot;Where am I wasting money?&quot;
                            or &quot;Show me my stats.&quot; The AI handles everything — keyword research, ad copy,
                            bid optimization, competitor analysis — and nothing goes live without your explicit approval.
                        </p>
                        <p>
                            We&apos;re built by <strong className="text-foreground">NobleBlocks LLC</strong>, a team that
                            believes technology should make life simpler, not more complicated. AdMaster Pro is our
                            answer to a $200 billion industry that forgot about the small guy.
                        </p>
                    </div>
                </div>
            </section>

            {/* What We Do */}
            <section className="py-16 px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                            <Zap className="w-5 h-5 text-primary" />
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold text-foreground">What AdMaster Pro Does</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[
                            {
                                icon: MessageCircle,
                                title: "AI-Powered Campaign Management",
                                desc: "Create ads, manage keywords, and optimize budgets through simple voice or text commands. Our dual AI engines (GPT-4o + Claude) handle ad creation, analysis, and optimization.",
                            },
                            {
                                icon: TrendingUp,
                                title: "Money Leak Detection",
                                desc: "Our AI scans your Google Ads account to find wasted spend — irrelevant keywords, bad timing, overbidding. Most clients save 20-40% on their ad budget.",
                            },
                            {
                                icon: Award,
                                title: "Free Website Audit",
                                desc: "Get an AI-powered analysis of your website's ad-readiness: landing page quality, CTA effectiveness, SEO foundation, mobile optimization, and more. Scored across 8 categories.",
                            },
                            {
                                icon: Users,
                                title: "Multi-Account Management",
                                desc: "Agencies and multi-location businesses can manage all their Google Ads accounts from a single dashboard with the Pro plan.",
                            },
                        ].map((item, i) => (
                            <div key={i} className="bg-card border border-border rounded-xl p-6 hover:border-primary/30 transition">
                                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                                    <item.icon className="w-5 h-5 text-primary" />
                                </div>
                                <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                                <p className="text-sm text-muted leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Our Values */}
            <section className="py-16 bg-card/50 border-y border-border">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                            <Heart className="w-5 h-5 text-primary" />
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold text-foreground">Our Values</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {values.map((v, i) => (
                            <div key={i} className="flex gap-4">
                                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                                    <v.icon className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-foreground mb-1">{v.title}</h3>
                                    <p className="text-sm text-muted leading-relaxed">{v.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Timeline */}
            <section className="py-16 px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-primary" />
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold text-foreground">Our Journey</h2>
                    </div>
                    <div className="space-y-0">
                        {milestones.map((m, i) => (
                            <div key={i} className="flex gap-4 relative pb-8 last:pb-0">
                                {i < milestones.length - 1 && (
                                    <div className="absolute left-[19px] top-10 bottom-0 w-px bg-border" />
                                )}
                                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shrink-0 z-10">
                                    <CheckCircle2 className="w-5 h-5 text-white" />
                                </div>
                                <div className="pt-2">
                                    <span className="text-xs font-mono text-primary font-semibold">{m.year}</span>
                                    <p className="text-sm text-muted mt-0.5">{m.event}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Key Facts */}
            <section className="py-12 bg-card/50 border-y border-border">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        <div>
                            <div className="text-3xl font-bold text-primary">2</div>
                            <div className="text-xs text-muted mt-1 uppercase tracking-wider">AI Engines</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-primary">50+</div>
                            <div className="text-xs text-muted mt-1 uppercase tracking-wider">Audit Factors</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-primary">&lt;2 min</div>
                            <div className="text-xs text-muted mt-1 uppercase tracking-wider">Audit Reports</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-primary">$49</div>
                            <div className="text-xs text-muted mt-1 uppercase tracking-wider">Starting Price</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 px-4">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                        Ready to take control of your Google Ads?
                    </h2>
                    <p className="text-muted text-lg mb-8">
                        Start with a free audit or sign up for our free plan. No credit card required.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/audit"
                            className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-lg font-medium text-lg transition inline-flex items-center justify-center gap-2"
                        >
                            Get Your Free Audit
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                        <Link
                            href="/pricing"
                            className="border border-border hover:border-primary text-foreground px-8 py-3 rounded-lg font-medium text-lg transition inline-flex items-center justify-center"
                        >
                            View Pricing
                        </Link>
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
                                <span className="font-semibold text-sm text-foreground">AdMaster Pro</span>
                            </div>
                            <p className="text-xs text-muted leading-relaxed">
                                AI-powered Google Ads management for small businesses. More customers, less wasted spend.
                            </p>
                        </div>
                        <div>
                            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">Product</h4>
                            <div className="space-y-2">
                                <Link href="/pricing" className="block text-sm text-muted hover:text-foreground transition">Pricing</Link>
                                <Link href="/audit" className="block text-sm text-muted hover:text-foreground transition">Free Audit</Link>
                                <Link href="/faq" className="block text-sm text-muted hover:text-foreground transition">FAQ</Link>
                                <Link href="/login" className="block text-sm text-muted hover:text-foreground transition">Log In</Link>
                            </div>
                        </div>
                        <div>
                            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">Company</h4>
                            <div className="space-y-2">
                                <Link href="/about" className="block text-sm text-muted hover:text-foreground transition">About Us</Link>
                                <a href="mailto:support@admasterai.com" className="block text-sm text-muted hover:text-foreground transition">Contact</a>
                            </div>
                        </div>
                        <div>
                            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">Legal</h4>
                            <div className="space-y-2">
                                <Link href="/privacy" className="block text-sm text-muted hover:text-foreground transition">Privacy Policy</Link>
                                <Link href="/terms" className="block text-sm text-muted hover:text-foreground transition">Terms of Service</Link>
                            </div>
                        </div>
                    </div>
                    <div className="border-t border-border pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="text-xs text-muted">&copy; {new Date().getFullYear()} NobleBlocks LLC. All rights reserved.</div>
                        <div className="text-xs text-muted">Built with ❤️ for small businesses everywhere</div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
