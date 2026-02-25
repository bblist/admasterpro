"use client";

import { useState } from "react";
import Link from "next/link";
import {
    ChevronDown,
    Search,
    MessageCircle,
    CreditCard,
    Shield,
    Zap,
    BarChart3,
    Settings,
    HelpCircle,
    Users,
    ArrowRight,
    Globe,
    Sparkles,
    type LucideIcon,
} from "lucide-react";
import { useTranslation } from "@/i18n/context";

interface FAQItem {
    q: string;
    a: string;
}

interface FAQCategory {
    label: string;
    icon: LucideIcon;
    color: string;
    items: FAQItem[];
}

const categories: FAQCategory[] = [
    {
        label: "Getting Started",
        icon: Zap,
        color: "text-blue-500 bg-blue-500/10",
        items: [
            {
                q: "What is AdMaster Pro?",
                a: "AdMaster Pro is an AI-powered advertising platform that manages your Google Ads campaigns automatically. Our AI assistant creates ads, optimizes budgets, finds wasted spend, and monitors competitors — all through simple voice or text commands. Think of it as having a full-time ad agency that works 24/7 for a fraction of the cost."
            },
            {
                q: "How do I get started with AdMaster Pro?",
                a: "1. Sign up with Google or email at admasterai.nobleblocks.com\n2. Connect your Google Ads account (we'll walk you through it)\n3. Upload your business info to the Knowledge Base\n4. Start chatting with your AI assistant — say 'Create 3 text ads for drain cleaning' and watch it work!\n\nThe whole setup takes about 5 minutes. No credit card required for the free plan."
            },
            {
                q: "Do I need Google Ads experience to use AdMaster Pro?",
                a: "Not at all! That's the whole point of AdMaster Pro. Just tell the AI what you want in plain English (or speak it). For example, say 'Show me my stats' or 'Find where I'm wasting money.' The AI handles all the technical details — keywords, bidding, targeting, ad copy, everything. Zero marketing jargon required."
            },
            {
                q: "Is there a free plan or trial?",
                a: "Yes. Every new account starts with a 7-day free trial with full feature access (no credit card required). After trial, your account moves to the Free plan with 10 AI messages/month. You can upgrade to Starter ($49/mo) for 200 messages or Pro ($149/mo) for unlimited AI usage and premium features."
            },
            {
                q: "What industries does AdMaster Pro work for?",
                a: "AdMaster Pro works for any business that uses Google Ads. We've seen great results with plumbing, dental, legal, real estate, restaurant, automotive, HVAC, landscaping, e-commerce, and many more industries. The AI adapts to any niche — just upload your business details to the Knowledge Base and the AI learns your industry, pricing, USPs, and competitive landscape."
            },
            {
                q: "How is AdMaster Pro different from hiring an ad agency?",
                a: "Traditional ad agencies charge $1,500-$5,000/month, take 1-2 weeks to set up, and work business hours only. AdMaster Pro costs $49-$149/month, sets up in 5 minutes, works 24/7, creates ads instantly, and gives you full transparency into every keyword and dollar spent. Nothing goes live without your approval — you maintain complete control."
            },
        ],
    },
    {
        label: "AI Assistant",
        icon: MessageCircle,
        color: "text-emerald-500 bg-emerald-500/10",
        items: [
            {
                q: "What can the AI assistant do?",
                a: "Your AI assistant can:\n\n• Create text and display ads from a simple command\n• Find and fix wasted ad spend (money leaks)\n• Monitor and analyze competitor strategies\n• Show real-time performance stats and call tracking\n• Pause bad keywords automatically\n• Manage images and layouts for display ads\n• Generate ad variations using GPT-4o and Claude\n• Push approved ads live to Google\n\nJust speak or type naturally — the AI understands plain English."
            },
            {
                q: "Does AdMaster Pro support voice commands?",
                a: "Yes! Click the microphone button in the AI chat and speak naturally. Say things like 'Create 3 ads for my summer sale' or 'Where am I wasting money?' The AI uses speech recognition to understand your command and executes it immediately. Voice commands work on Chrome, Edge, and Safari."
            },
            {
                q: "Which AI models does AdMaster Pro use?",
                a: "AdMaster Pro uses two AI models for the best results:\n\n• **GPT-4o** (Primary) — OpenAI's latest model for ad creation, analysis, and conversation\n• **Claude** (Fallback) — Anthropic's model for diverse ad copy and competitor analysis\n\nThe system automatically picks the best model for each task, and you can see which model generated each response via a colored badge in the chat."
            },
            {
                q: "Will the AI run ads without my approval?",
                a: "Never. The AI creates drafts and suggestions, but nothing goes live until you explicitly say 'Go live' or click the Go Live button. Every ad is saved to your Drafts page first where you can review, edit, regenerate, or approve it. You're always in control. The AI confirms with you before any action that affects your ad spend."
            },
            {
                q: "How does the Knowledge Base work?",
                a: "The Knowledge Base is where you teach the AI about your business. Upload documents, paste text, add URLs, or record voice notes about your services, pricing, unique selling points, and target customers. The AI uses this information to create more relevant, accurate ads tailored to your specific business — not generic templates."
            },
        ],
    },
    {
        label: "Pricing & Billing",
        icon: CreditCard,
        color: "text-amber-500 bg-amber-500/10",
        items: [
            {
                q: "How much does AdMaster Pro cost?",
                a: "AdMaster Pro offers a 7-day full-access free trial for all new users, then three plans:\n\n• **Free** — $0/month, 10 AI messages, 1 campaign, basic stats\n• **Starter** — $49/month, 200 AI messages, 5 campaigns, display ads, call tracking\n• **Pro** — $149/month, unlimited AI messages, unlimited campaigns, multi-client management, priority support\n\nYou can also purchase additional AI message credits as one-time top-ups."
            },
            {
                q: "What payment methods are accepted?",
                a: "We accept all major credit cards (Visa, Mastercard, American Express, Discover) via Stripe. All payments are securely processed with 256-bit encryption. We never store your card details — Stripe handles everything PCI-compliant."
            },
            {
                q: "Can I cancel my subscription at any time?",
                a: "Yes, you can cancel your subscription at any time from your Settings page. Your account will remain active until the end of your current billing period. All your ad drafts, Knowledge Base data, and performance history are preserved if you decide to come back later."
            },
            {
                q: "Do I need a separate Google Ads budget?",
                a: "Yes. AdMaster Pro manages your Google Ads campaigns, but your actual ad spend goes directly to Google. You set your own daily/monthly budget with Google. AdMaster Pro's subscription fee is separate from your Google Ads spend. We help you spend your Google budget more efficiently — many clients save 20-40% on wasted spend."
            },
            {
                q: "What are message top-ups?",
                a: "If you run out of AI messages before your monthly reset, you can purchase additional credits as one-time top-ups. These never expire and carry over month to month. Top-ups are available in three sizes and can be purchased from the Pricing page."
            },
        ],
    },
    {
        label: "Free Website Audit",
        icon: Globe,
        color: "text-orange-500 bg-orange-500/10",
        items: [
            {
                q: "What is the free website audit?",
                a: "Our free audit is an AI-powered analysis of your website's advertising readiness. The AI examines your site across 8 categories — landing page quality, CTA effectiveness, mobile optimization, trust signals, ad-readiness, SEO foundation, competitive positioning, and content quality — and generates a scored report with specific findings and actionable recommendations."
            },
            {
                q: "How long does the audit take?",
                a: "The audit typically completes in under 2 minutes. Our AI fetches your website content, analyzes 50+ performance factors, and generates a comprehensive report with scores, findings, and recommendations for each category."
            },
            {
                q: "Do I need to create an account for the free audit?",
                a: "No account is required. Just enter your website URL, business name, and email on the audit page at admasterai.nobleblocks.com/audit. Your report is generated instantly and can be printed or saved as a PDF directly from your browser."
            },
            {
                q: "Can I export the audit report as a PDF?",
                a: "Yes! Every audit report has a 'Print / Save PDF' button. Click it and use your browser's 'Save as PDF' option. The report is formatted with print-friendly CSS — clean layout, proper colors, and branded design that looks professional when shared."
            },
            {
                q: "How accurate is the AI audit?",
                a: "The audit is powered by GPT-4o and analyzes your actual website content, structure, and meta data. It provides data-driven assessments based on industry best practices. While no automated tool replaces a full manual audit, our AI provides actionable insights that most businesses can implement immediately to improve their ad performance."
            },
        ],
    },
    {
        label: "Performance & Analytics",
        icon: BarChart3,
        color: "text-purple-500 bg-purple-500/10",
        items: [
            {
                q: "What metrics can I track with AdMaster Pro?",
                a: "The dashboard shows clicks, impressions, CTR, phone calls, cost per call, cost per conversion, budget utilization, keyword performance, competitor positions, and more. Ask the AI 'Show me my stats' for an instant overview, or 'Compare to last month' for trends."
            },
            {
                q: "How does call tracking work?",
                a: "AdMaster Pro tracks calls generated by your Google Ads. You can see call duration, which keyword triggered the call, whether it was booked or missed, and overall booking rate. Ask the AI 'Show call details' for a full breakdown."
            },
            {
                q: "What are 'money leaks' and how does detection work?",
                a: "Money leaks are keywords, times, or settings that waste your ad budget without generating calls or conversions. Common leaks include irrelevant keywords ('free tips', 'salary', 'DIY'), ads running at 3 AM, and overbidding on mobile. Ask the AI 'Find money leaks' to scan your account — most clients save $200-$500/month by fixing these."
            },
        ],
    },
    {
        label: "Security & Privacy",
        icon: Shield,
        color: "text-red-500 bg-red-500/10",
        items: [
            {
                q: "Is my data secure with AdMaster Pro?",
                a: "Yes. We use industry-standard encryption (TLS 1.3 in transit, AES-256 at rest). Your Google Ads data is accessed via OAuth 2.0 with read/write permissions only for the campaigns you authorize. We never share your data with third parties for marketing purposes. All payment processing is handled by Stripe with PCI-DSS compliance."
            },
            {
                q: "What Google permissions does AdMaster Pro need?",
                a: "We request read/write access to your Google Ads account to: view campaign data, create/edit ads, manage keywords, and track conversions. You can revoke access at any time from your Google Account settings at myaccount.google.com. We use the minimum permissions required to provide our service."
            },
            {
                q: "Does AdMaster Pro store my Google password?",
                a: "No. We use Google OAuth 2.0 for authentication. We receive a secure token from Google that lets us manage your ads on your behalf. We never see or store your Google password."
            },
            {
                q: "Is AdMaster Pro GDPR and CCPA compliant?",
                a: "Yes. We comply with GDPR (EU), CCPA (California), and other applicable privacy regulations. You can request data export or deletion at any time from Settings or by emailing support@admasterai.com. See our Privacy Policy for full details."
            },
        ],
    },
    {
        label: "Multi-Account Management",
        icon: Users,
        color: "text-indigo-500 bg-indigo-500/10",
        items: [
            {
                q: "Can I manage multiple Google Ads accounts?",
                a: "Yes, with the Pro plan ($149/mo). You can manage multiple client accounts from a single dashboard, switch between them, and get consolidated reporting. Each client has their own Knowledge Base and AI conversation history."
            },
            {
                q: "Can I ask about all my accounts at once?",
                a: "Yes! Even when managing a specific account, you can ask top-level questions about your entire portfolio. Try: 'How many ad accounts do we have running?', 'Show me a portfolio overview', 'Compare all accounts', or 'What's the total spend across all businesses?' The AI gives you a complete breakdown."
            },
            {
                q: "How do I switch between accounts?",
                a: "You have several options:\n\n1. **Voice/Text:** 'Switch to Brighton Dental' or 'Go to my sushi restaurant account'\n2. **Business menu:** Click the business avatar in the sidebar\n3. **Indirect reference:** Ask about another business and the AI will offer to switch\n\nEach account has its own chat history, so nothing is lost when switching."
            },
        ],
    },
    {
        label: "Technical & Setup",
        icon: Settings,
        color: "text-cyan-500 bg-cyan-500/10",
        items: [
            {
                q: "Which browsers are supported?",
                a: "AdMaster Pro works on all modern browsers: Chrome, Firefox, Safari, and Edge. Voice commands work best on Chrome and Edge (using Web Speech API). The interface is fully responsive — works on desktop, tablet, and mobile."
            },
            {
                q: "How do I connect my Google Ads account?",
                a: "Go to Settings → Integrations → Connect Google Ads. Click the button and sign in with the Google account that has access to your Google Ads. Authorize AdMaster Pro and you're connected. The AI will immediately start analyzing your campaigns."
            },
            {
                q: "What happens if the AI makes a mistake in an ad?",
                a: "All AI-generated ads are saved as drafts first — nothing goes live automatically. If you spot an issue, you can edit the ad, regenerate it with a different AI model, or discard it. You can also use the Undo button or revert to a previous version from the drafts version history."
            },
            {
                q: "Can I use AdMaster Pro without connecting Google Ads?",
                a: "Yes! You can explore the AI assistant, generate ad drafts, run free website audits, and use the Knowledge Base without connecting your Google Ads account. Connecting Google Ads unlocks live campaign management, real-time stats, and money leak detection."
            },
        ],
    },
];

// Generate FAQ structured data for AI search engines
function generateFAQSchema() {
    const allFAQs = categories.flatMap((cat) =>
        cat.items.map((item) => ({
            "@type": "Question",
            name: item.q,
            acceptedAnswer: {
                "@type": "Answer",
                text: item.a.replace(/\*\*/g, "").replace(/\n/g, " "),
            },
        }))
    );

    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: allFAQs,
    };
}

export default function PublicFAQPage() {
    const { t } = useTranslation();
    const [search, setSearch] = useState("");
    const [openItems, setOpenItems] = useState<Set<string>>(new Set());
    const [activeCategory, setActiveCategory] = useState<string | null>(null);

    const toggleItem = (key: string) => {
        setOpenItems((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    const searchLower = search.toLowerCase();
    const filteredCategories = categories
        .map((cat) => ({
            ...cat,
            items: cat.items.filter(
                (item) =>
                    (!search || item.q.toLowerCase().includes(searchLower) || item.a.toLowerCase().includes(searchLower)) &&
                    (!activeCategory || activeCategory === cat.label)
            ),
        }))
        .filter((cat) => cat.items.length > 0);

    const totalQuestions = categories.reduce((sum, cat) => sum + cat.items.length, 0);

    return (
        <div className="min-h-screen bg-background">
            {/* FAQ Schema for AI Search */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(generateFAQSchema()) }}
            />

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
                        <Link href="/about" className="hover:text-foreground transition">About</Link>
                        <Link href="/pricing" className="hover:text-foreground transition">Pricing</Link>
                        <Link href="/audit" className="hover:text-foreground transition">Free Audit</Link>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/login" className="text-sm text-muted hover:text-foreground transition">{t("common.logIn")}</Link>
                        <Link href="/onboarding" className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition">
                            {t("common.startFree")}
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section className="py-16 md:py-20 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-6">
                        <HelpCircle className="w-4 h-4" />
                        Help Center
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                        Frequently Asked Questions
                    </h1>
                    <p className="text-lg text-muted max-w-2xl mx-auto">
                        {totalQuestions} answers to help you get the most from AdMaster Pro.
                        Can&apos;t find what you need? <a href="mailto:support@admasterai.com" className="text-primary hover:underline">Contact support</a>.
                    </p>
                </div>
            </section>

            {/* Search & Content */}
            <section className="pb-20 px-4">
                <div className="max-w-4xl mx-auto">
                    {/* Search */}
                    <div className="relative mb-6">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search questions... (e.g., 'pricing', 'voice commands', 'security')"
                            className="w-full bg-card border border-border rounded-xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:border-primary transition"
                        />
                    </div>

                    {/* Category pills */}
                    <div className="flex gap-2 flex-wrap mb-8">
                        <button
                            onClick={() => setActiveCategory(null)}
                            className={`text-xs px-3 py-1.5 rounded-full transition font-medium ${!activeCategory
                                ? "bg-primary text-white"
                                : "border border-border text-muted hover:border-primary hover:text-primary"
                                }`}
                        >
                            All ({totalQuestions})
                        </button>
                        {categories.map((cat) => (
                            <button
                                key={cat.label}
                                onClick={() => setActiveCategory(activeCategory === cat.label ? null : cat.label)}
                                className={`text-xs px-3 py-1.5 rounded-full transition font-medium flex items-center gap-1.5 ${activeCategory === cat.label
                                    ? "bg-primary text-white"
                                    : "border border-border text-muted hover:border-primary hover:text-primary"
                                    }`}
                            >
                                <cat.icon className="w-3 h-3" />
                                {cat.label} ({cat.items.length})
                            </button>
                        ))}
                    </div>

                    {/* FAQ Accordion */}
                    <div className="space-y-8">
                        {filteredCategories.map((cat) => (
                            <div key={cat.label}>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${cat.color}`}>
                                        <cat.icon className="w-3.5 h-3.5" />
                                    </div>
                                    <h2 className="font-semibold text-sm text-foreground">{cat.label}</h2>
                                    <span className="text-[10px] text-muted bg-muted/10 px-1.5 py-0.5 rounded-full">{cat.items.length}</span>
                                </div>
                                <div className="space-y-1">
                                    {cat.items.map((item, idx) => {
                                        const key = `${cat.label}-${idx}`;
                                        const isOpen = openItems.has(key);
                                        return (
                                            <div key={key} className="border border-border rounded-lg overflow-hidden">
                                                <button
                                                    onClick={() => toggleItem(key)}
                                                    className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-medium hover:bg-card/50 transition"
                                                >
                                                    <span>{item.q}</span>
                                                    <ChevronDown className={`w-4 h-4 text-muted shrink-0 ml-2 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                                                </button>
                                                {isOpen && (
                                                    <div className="px-4 pb-4 text-sm text-muted leading-relaxed border-t border-border pt-3">
                                                        {item.a.split("\n").map((line, i) => (
                                                            <span key={i}>
                                                                {line.split(/(\*\*[^*]+\*\*)/).map((part, j) =>
                                                                    part.startsWith("**") && part.endsWith("**") ? (
                                                                        <strong key={j} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>
                                                                    ) : (
                                                                        <span key={j}>{part}</span>
                                                                    )
                                                                )}
                                                                {i < item.a.split("\n").length - 1 && <br />}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* No results */}
                    {filteredCategories.length === 0 && (
                        <div className="text-center py-12">
                            <HelpCircle className="w-12 h-12 text-muted/30 mx-auto mb-4" />
                            <h3 className="font-semibold text-foreground mb-2">{t("publicFaq.noResults")}</h3>
                            <p className="text-sm text-muted mb-4">{t("publicFaq.noResultsDesc")}</p>
                            <button onClick={() => { setSearch(""); setActiveCategory(null); }} className="text-sm text-primary hover:underline">
                                {t("publicFaq.clearSearch")}
                            </button>
                        </div>
                    )}

                    {/* Still have questions CTA */}
                    <div className="mt-12 bg-gradient-to-r from-primary/5 to-blue-500/5 border border-primary/20 rounded-xl p-8 text-center">
                        <Sparkles className="w-8 h-8 text-primary mx-auto mb-3" />
                        <h3 className="text-xl font-semibold text-foreground mb-2">{t("publicFaq.stillHaveQuestions")}</h3>
                        <p className="text-sm text-muted mb-6 max-w-lg mx-auto">
                            {t("publicFaq.getInTouch")}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Link
                                href="/audit"
                                className="inline-flex items-center justify-center gap-2 bg-primary text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-primary-dark transition"
                            >
                                <Zap className="w-4 h-4" />
                                {t("publicFaq.tryAudit")}
                            </Link>
                            <a
                                href="mailto:support@admasterai.com"
                                className="inline-flex items-center justify-center gap-2 border border-border text-foreground px-6 py-2.5 rounded-lg text-sm font-medium hover:border-primary transition"
                            >
                                <MessageCircle className="w-4 h-4" />
                                {t("publicFaq.emailSupport")}
                            </a>
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
                                <span className="font-semibold text-sm text-foreground">AdMaster Pro</span>
                            </div>
                            <p className="text-xs text-muted leading-relaxed">
                                AI-powered Google Ads management for small businesses.
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
