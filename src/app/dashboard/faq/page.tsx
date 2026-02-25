"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Search, MessageCircle, CreditCard, Shield, Zap, BarChart3, Settings, HelpCircle, Users, type LucideIcon } from "lucide-react";
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
                q: "How do I get started?",
                a: "1. Sign up with Google or email\n2. Connect your Google Ads account (we'll walk you through it)\n3. Upload your business info to the Knowledge Base\n4. Start chatting with your AI assistant — say 'Create 3 text ads for drain cleaning' and watch it work!\n\nThe whole setup takes about 5 minutes."
            },
            {
                q: "Do I need Google Ads experience?",
                a: "Not at all! That's the whole point of AdMaster Pro. Just tell the AI what you want in plain English (or speak it). For example, say 'Show me my stats' or 'Find where I'm wasting money.' The AI handles all the technical details — keywords, bidding, targeting, ad copy, everything."
            },
            {
                q: "Is there a free trial?",
                a: "Yes! Every account starts with a free plan that includes 10 AI messages per month. This lets you see how the AI works, preview ad drafts, and explore the platform. Upgrade to Starter ($49/mo) for 200 messages or Pro ($149/mo) for unlimited AI usage and all features."
            },
            {
                q: "What industries does AdMaster Pro work for?",
                a: "AdMaster Pro works for any business that uses Google Ads. Our demo showcases plumbing, dental, legal, real estate, restaurant, and e-commerce businesses, but the AI adapts to any industry. Just upload your business details to the Knowledge Base and the AI learns your niche, pricing, USPs, and competitive landscape."
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
                a: "Your AI assistant can:\n\n• Create text and display ads from a simple command\n• Find and fix wasted ad spend (money leaks)\n• Monitor and analyze competitor strategies\n• Show real-time performance stats and call tracking\n• Pause bad keywords automatically\n• Manage images and layouts for display ads\n• Generate ad variations using GPT-4o and Claude 4.6\n• Push approved ads live to Google\n\nJust speak or type naturally — visit the AI Examples page for the full list of commands."
            },
            {
                q: "Can I use voice commands?",
                a: "Yes! Click the microphone button in the AI chat and speak naturally. Say things like 'Create 3 ads for my summer sale' or 'Where am I wasting money?' The AI uses speech recognition to understand your command and executes it immediately. Works on Chrome, Edge, and Safari."
            },
            {
                q: "Which AI models are used?",
                a: "AdMaster Pro uses two AI models:\n\n• **GPT-4o** (Primary) — OpenAI's latest model for ad creation, analysis, and conversation\n• **Claude 4.6** (Fallback) — Anthropic's model for diverse ad copy and competitor analysis\n\nThe system automatically picks the best model for each task, and you can see which model generated each response via the colored badge."
            },
            {
                q: "Will the AI run ads without my approval?",
                a: "Never. The AI creates drafts and suggestions, but nothing goes live until you explicitly say 'Go live' or click the Go Live button. Every ad is saved to your Drafts page first where you can review, edit, regenerate, or approve it. You're always in control."
            },
            {
                q: "How accurate are the AI suggestions?",
                a: "The AI learns from your Knowledge Base (business info, pricing, USPs) and your account performance data. The more information you provide, the better the suggestions. We recommend reviewing the first few batches of ads and using the feedback buttons (thumbs up/down) to help the AI learn your preferences."
            },
        ],
    },
    {
        label: "Billing & Plans",
        icon: CreditCard,
        color: "text-amber-500 bg-amber-500/10",
        items: [
            {
                q: "What are the pricing plans?",
                a: "• **Free** — 10 AI messages/month, 1 campaign, basic stats\n• **Starter ($49/mo)** — 200 AI messages/month, 5 campaigns, display ads, call tracking\n• **Pro ($149/mo)** — Unlimited AI, unlimited campaigns, multi-client management, priority support\n\nAll paid plans include a 7-day free trial."
            },
            {
                q: "What payment methods do you accept?",
                a: "We accept all major credit cards (Visa, Mastercard, Amex, Discover) via Stripe. All payments are securely processed with 256-bit encryption. We never store your card details — Stripe handles everything."
            },
            {
                q: "Can I cancel anytime?",
                a: "Yes, you can cancel your subscription at any time from Settings. Your account will remain active until the end of your billing period. All your ad drafts, Knowledge Base data, and performance history are preserved if you decide to come back."
            },
            {
                q: "Do I need a separate Google Ads budget?",
                a: "Yes. AdMaster Pro manages your Google Ads campaigns but your ad spend goes directly to Google. You set your own daily/monthly budget. AdMaster Pro's subscription fee is separate from your Google Ads spend. We help you spend your Google budget more efficiently — many clients save 20-40% on wasted spend."
            },
        ],
    },
    {
        label: "Performance & Analytics",
        icon: BarChart3,
        color: "text-purple-500 bg-purple-500/10",
        items: [
            {
                q: "What metrics can I track?",
                a: "The dashboard shows: clicks, impressions, CTR, phone calls, cost per call, cost per conversion, budget utilization, keyword performance, competitor positions, and more. Ask the AI 'Show me my stats' for an instant overview, or 'Compare to last month' for trends."
            },
            {
                q: "How does call tracking work?",
                a: "AdMaster Pro tracks calls generated by your Google Ads. You can see call duration, which keyword triggered the call, whether it was booked or missed, and overall booking rate. Ask the AI 'Show call details' for a full breakdown."
            },
            {
                q: "What are 'money leaks'?",
                a: "Money leaks are keywords, times, or settings that waste your ad budget without generating calls or conversions. Common leaks include: irrelevant keywords ('free tips', 'salary', 'DIY'), ads running at 3 AM, and overbidding on mobile. Ask the AI 'Find money leaks' to scan your account — most clients save $200-$500/month."
            },
        ],
    },
    {
        label: "Security & Privacy",
        icon: Shield,
        color: "text-red-500 bg-red-500/10",
        items: [
            {
                q: "Is my data secure?",
                a: "Yes. We use industry-standard encryption (TLS 1.3 in transit, AES-256 at rest). Your Google Ads data is accessed via OAuth 2.0 with read/write permissions only for the campaigns you authorize. We never share your data with third parties."
            },
            {
                q: "What Google permissions do you need?",
                a: "We request read/write access to your Google Ads account to: view campaign data, create/edit ads, manage keywords, and track conversions. You can revoke access at any time from your Google Account settings. We use the minimum permissions required."
            },
            {
                q: "Do you store my Google Ads credentials?",
                a: "No. We use Google OAuth 2.0 for authentication. We receive a secure token from Google that lets us manage your ads on your behalf. We never see or store your Google password."
            },
            {
                q: "Are you GDPR/CCPA compliant?",
                a: "Yes. We comply with GDPR (EU), CCPA (California), and other applicable privacy regulations. You can request data export or deletion at any time from Settings or by contacting support."
            },
        ],
    },
    {
        label: "Multi-Account Management",
        icon: Users,
        color: "text-indigo-500 bg-indigo-500/10",
        items: [
            {
                q: "Can I ask the AI about all my accounts at once?",
                a: "Yes! Even when you\u2019re managing a specific account, you can ask top-level questions about your entire portfolio. Try:\n\n\u2022 \"How many ad accounts do we have running?\"\n\u2022 \"Show me a portfolio overview\"\n\u2022 \"Compare all accounts\"\n\u2022 \"What\u2019s the total spend across all businesses?\"\n\nThe AI will give you a complete breakdown of all accounts with spend, calls, and CTR."
            },
            {
                q: "Can I manage another account without switching manually?",
                a: "Yes! Just tell the AI what you need and mention the account name. For example:\n\n\u2022 \"Update the ads under our dental account\"\n\u2022 \"Check the budget on Sakura Sushi\"\n\u2022 \"Show stats for the fashion store\"\n\nThe AI will recognize you\u2019re referencing a different account and **ask you to confirm** before switching. This prevents accidental changes to the wrong account."
            },
            {
                q: "When does the AI ask for confirmation?",
                a: "The AI is smart about when to confirm vs. when to just act. It will ask for confirmation when:\n\n\u2022 **Cross-account actions** \u2014 You mention another business (\"create ads for the dental clinic\")\n\u2022 **Going live** \u2014 Publishing ads that will spend your budget\n\u2022 **Budget changes** \u2014 Anything that affects your ad spend\n\nIt will NOT ask for simple queries like showing stats, checking keywords, or viewing drafts for the current account. The goal is to protect you from costly mistakes without slowing you down."
            },
            {
                q: "How do I switch between ad accounts?",
                a: "You have several options:\n\n**1. Voice/Text command:**\n\u2022 \"Switch to Brighton Dental\"\n\u2022 \"Go to my sushi restaurant account\"\n\u2022 \"Check on my other ads\"\n\n**2. Business menu:** Click the business avatar in the sidebar to see all accounts.\n\n**3. Indirect reference:** Ask about another business and the AI will offer to switch: \"How are the dental ads doing?\" \u2192 AI confirms \u2192 switches for you.\n\nEach account has its own chat history, so nothing is lost when switching."
            },
            {
                q: "What example questions can I ask across accounts?",
                a: "Here are some powerful cross-account questions:\n\n**Portfolio-level:**\n\u2022 \"How many ad accounts do we have running?\"\n\u2022 \"Which account has the best CTR?\"\n\u2022 \"What\u2019s our total ad spend this week?\"\n\u2022 \"Give me a portfolio overview\"\n\n**Cross-account actions:**\n\u2022 \"Can you update the ads under our xyz account?\"\n\u2022 \"Check for money leaks on the dental account\"\n\u2022 \"Create display ads for Sakura Sushi\"\n\u2022 \"Export a report for all accounts\"\n\nThe AI understands context and will route your request to the right account."
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
                a: "AdMaster Pro works on all modern browsers: Chrome, Firefox, Safari, Edge. Voice commands work best on Chrome and Edge (using Web Speech API). The interface is fully responsive — works on desktop, tablet, and mobile."
            },
            {
                q: "Can I connect multiple Google Ads accounts?",
                a: "Yes, with the Pro plan. You can manage multiple client accounts from a single dashboard, switch between them, and get consolidated reporting. Each client has their own Knowledge Base and AI conversation history."
            },
            {
                q: "How do I connect my Google Ads account?",
                a: "Go to Settings > Integrations > Connect Google Ads. Click the button and sign in with the Google account that has access to your Google Ads. Authorize AdMaster Pro and you're connected. The AI will immediately start analyzing your campaigns."
            },
            {
                q: "What happens if the AI makes a mistake?",
                a: "All AI-generated ads are saved as drafts first — nothing goes live automatically. If you spot an issue, you can edit the ad, regenerate it with a different AI model, or discard it. You can also use the Undo button or revert to a previous version from the drafts version history."
            },
        ],
    },
];

export default function FAQPage() {
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
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                        <HelpCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">{t("dashFaq.title")}</h1>
                        <p className="text-sm text-muted">{t("dashFaq.subtitle", { count: totalQuestions })}</p>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t("dashFaq.searchPlaceholder")}
                    className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-primary transition"
                />
            </div>

            {/* Category pills */}
            <div className="flex gap-2 flex-wrap mb-6">
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
            <div className="space-y-6">
                {filteredCategories.map((cat) => (
                    <div key={cat.label}>
                        <div className="flex items-center gap-2 mb-3">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${cat.color}`}>
                                <cat.icon className="w-3.5 h-3.5" />
                            </div>
                            <h2 className="font-semibold text-sm">{cat.label}</h2>
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

            {/* Still have questions */}
            <div className="mt-10 bg-gradient-to-r from-primary/5 to-blue-500/5 border border-primary/20 rounded-xl p-6 text-center">
                <HelpCircle className="w-8 h-8 text-primary mx-auto mb-2" />
                <h3 className="font-semibold mb-1">{t("dashFaq.stillHaveQuestions")}</h3>
                <p className="text-sm text-muted mb-4">{t("dashFaq.aiCanAnswer")}</p>
                <Link
                    href="/dashboard/chat"
                    className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-primary-dark transition"
                >
                    <MessageCircle className="w-4 h-4" />
                    {t("dashFaq.askAI")}
                </Link>
            </div>
        </div>
    );
}
