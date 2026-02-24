"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
    Send,
    Zap,
    Loader2,
    ThumbsUp,
    ThumbsDown,
    Sparkles,
    Cpu,
    Mic,
    MicOff,
    Paperclip,
    RotateCcw,
    Copy,
    Check,
    BarChart3,
    AlertTriangle,
    PenTool,
    Users,
    ArrowRight,
    FileText,
    Image,
    ExternalLink,
    Eye,
    Rocket,
    CheckCircle2,
    Clock,
    Move,
    ChevronRight,
    Wand2,
    Activity,
    AlertCircle,
    Globe,
    Settings,
    X,
    Smartphone,
    Volume2,
    ShieldAlert,
} from "lucide-react";
import { useBusiness, type BusinessProfile } from "@/lib/business-context";
import { authFetch } from "@/lib/auth-client";

// ─── Types ──────────────────────────────────────────────────────────────────

type LLMModel = "gpt-4o" | "claude-4.6";

interface AdPreview {
    type: "text" | "display";
    headline1?: string;
    headline2?: string;
    description?: string;
    displayUrl?: string;
    title?: string;
    dimensions?: string;
    format?: string;
    imageUrl?: string;
    overlayText?: string;
    ctaText?: string;
    previewBg?: string;
}

interface StatsCard {
    label: string;
    value: string;
    change?: string;
    trend?: "up" | "down" | "neutral";
}

interface Message {
    id: number;
    role: "ai" | "user" | "system" | "divider";
    content: string;
    model?: LLMModel;
    actions?: { label: string; type: "primary" | "secondary" | "danger" }[];
    timestamp: string;
    ads?: AdPreview[];
    stats?: StatsCard[];
    taskSummary?: { done: string[]; pending?: string[] };
}

// ─── Helpers ────────────────────────────────────────────────────────────────



const timeNow = () => new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
const dateNow = () => new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });

// ─── NLP Intent Matching ────────────────────────────────────────────────────

type Intent =
    | "create_text_ads"
    | "create_display_ads"
    | "show_stats"
    | "find_leaks"
    | "check_competitors"
    | "move_image"
    | "add_image"
    | "change_text"
    | "pause_keywords"
    | "go_live"
    | "show_drafts"
    | "export_report"
    | "add_keywords"
    | "cross_account_query"
    | "help"
    | "off_topic"
    | "switch_account"
    | "unknown";

interface IntentMatch {
    intent: Intent;
    params: Record<string, string>;
}

const matchIntent = (text: string): IntentMatch => {
    const t = text.toLowerCase().trim();

    // Create text ads
    if (/\b(create|write|make|generate|draft)\b.*\b(text|search)\s*(ads?|copy)/i.test(t) ||
        /\b(write|create|make)\b.*\b(ads?|copy)\b.*\b(for|about)\b/i.test(t) && !/display|banner|image/i.test(t)) {
        const forMatch = t.match(/(?:for|about)\s+(.+?)(?:\s*$|\s*with|\s*using)/);
        return { intent: "create_text_ads", params: { topic: forMatch ? forMatch[1] : "" } };
    }

    // Create display ads
    if (/\b(create|write|make|generate|design|build)\b.*\b(display|banner|image)\s*(ads?|banner)/i.test(t) ||
        /\b(display|banner)\b.*\b(ad|ads)\b/i.test(t)) {
        const forMatch = t.match(/(?:for|about)\s+(.+?)(?:\s*$|\s*with|\s*using)/);
        return { intent: "create_display_ads", params: { topic: forMatch ? forMatch[1] : "" } };
    }

    // Move / position image
    if (/\b(move|position|place|shift|align|reposition)\b.*\b(image|photo|picture|img)\b/i.test(t)) {
        const posMatch = t.match(/\b(top|bottom|left|right|center|middle)\b/gi);
        return { intent: "move_image", params: { position: posMatch ? posMatch.join(" ") : "center" } };
    }

    // Add image
    if (/\b(add|insert|put|use|set|upload)\b.*\b(image|photo|picture|img)\b/i.test(t) ||
        /\b(image|photo|picture)\b.*\b(to|in|into|on)\b/i.test(t)) {
        const toMatch = t.match(/(?:to|in|into|on|for)\s+(?:the\s+)?(.+?)(?:\s+ad|\s*$)/);
        return { intent: "add_image", params: { target: toMatch ? toMatch[1] : "" } };
    }

    // Change text / overlay
    if (/\b(change|update|edit|modify|set)\b.*\b(text|headline|title|copy|overlay|cta|button)\b/i.test(t)) {
        const toMatch = t.match(/(?:to|as|with)\s+["']?(.+?)["']?\s*$/);
        return { intent: "change_text", params: { newText: toMatch ? toMatch[1] : "" } };
    }

    // Show stats
    if (/\b(show|display|get|what|how)\b.*\b(stats|statistics|performance|numbers|metrics|report)\b/i.test(t) ||
        /\b(how.+doing|how.+perform|give.+overview)\b/i.test(t)) {
        return { intent: "show_stats", params: {} };
    }

    // Find leaks / waste
    if (/\b(find|show|check|scan|look)\b.*\b(leak|waste|wast|spent|overspend|money|save)\b/i.test(t) ||
        /\bwhere.+(money|budget).+(go|leak|waste)/i.test(t)) {
        return { intent: "find_leaks", params: {} };
    }

    // Check competitors
    if (/\b(check|show|analyze|look|what).+\b(competitor|competition|competing|rival)/i.test(t)) {
        return { intent: "check_competitors", params: {} };
    }

    // Pause keywords
    if (/\b(pause|stop|disable|block|remove)\b.*\b(keyword|search|term|ad)\b/i.test(t)) {
        return { intent: "pause_keywords", params: {} };
    }

    // Go live
    if (/\b(go live|publish|launch|activate|start running)\b/i.test(t)) {
        return { intent: "go_live", params: {} };
    }

    // Show drafts
    if (/\b(show|list|display|view)\b.*\b(draft|ads?|my ads)\b/i.test(t)) {
        return { intent: "show_drafts", params: {} };
    }

    // Export report
    if (/\b(export|download|generate|create|print|send)\b.*\b(report|pdf|excel|spreadsheet|csv|word|doc)\b/i.test(t) ||
        /\b(report|pdf|excel)\b.*\b(for|about|of)\b/i.test(t) ||
        /\b(keyword|performance|campaign)\s+report\b/i.test(t) ||
        /\bgive me a report\b/i.test(t)) {
        const formatMatch = t.match(/\b(pdf|excel|csv|word|doc)\b/i);
        return { intent: "export_report", params: { format: formatMatch ? formatMatch[1].toLowerCase() : "" } };
    }

    // Add keywords
    if (/\b(add|import|bulk|upload|suggest|recommend)\b.*\b(keyword|keywords|search term|search terms)\b/i.test(t) ||
        /\bkeyword\s+(ideas?|suggestions?|recommendations?)\b/i.test(t) ||
        /\btrending\s+(keyword|search|term)/i.test(t) ||
        /\bwhat.+should\s+i\s+target\b/i.test(t) ||
        /\bgoogle\s+trends?\b/i.test(t)) {
        return { intent: "add_keywords", params: {} };
    }

    // Cross-account / portfolio query
    if (/\bhow many\b.*\b(account|business|client|campaign)/i.test(t) ||
        /\b(all|every|each)\s+(accounts?|businesses?|clients?)\b/i.test(t) ||
        /\b(total|overall|combined|aggregate)\s+(spend|budget|cost|performance|stats|revenue|calls)/i.test(t) ||
        /\bacross\s+(all|every|accounts?|businesses?|clients?)/i.test(t) ||
        /\bportfolio\b/i.test(t) ||
        /\bcompare\s+(all\s+)?(accounts?|businesses?|clients?)/i.test(t) ||
        /\bwhich\s+(account|business|client)\s+(is|has|performs?|does|gets?)\b/i.test(t) ||
        /\b(overview|summary)\s+(of|for)\s+(all|every|my)\b/i.test(t) ||
        /\b(all|every)\s+(my\s+)?(accounts?|businesses?)\b.*\b(doing|performing|running|spend)/i.test(t)) {
        return { intent: "cross_account_query", params: {} };
    }

    // Switch account / check on ads
    if (/\b(switch|change|go to|open|check on)\b.*\b(account|business|ads?|another)\b/i.test(t) ||
        /\b(my other|different)\s*(account|business|ads?)\b/i.test(t) ||
        /\bwhich\s*(account|business)\b/i.test(t) ||
        /\bcheck\s+on\s+my\s+ads\b/i.test(t) ||
        /\bswitch\s+to\b/i.test(t)) {
        // See if they named a specific business
        const nameMatch = t.match(/(?:switch to|go to|open|check on)\s+(?:my\s+)?(.+?)(?:\s+account|\s+business|\s+ads?)?\s*$/i);
        return { intent: "switch_account", params: { target: nameMatch ? nameMatch[1].trim() : "" } };
    }

    // Help
    if (/\b(help|what can you|how do i|capabilities|what do you do)\b/i.test(t)) {
        return { intent: "help", params: {} };
    }

    return { intent: "unknown", params: {} };
};

// ─── Response Generator ────────────────────────────────────────────────────

const generateResponse = (intent: IntentMatch, rawText: string, biz: BusinessProfile): Omit<Message, "id"> => {
    const time = timeNow();

    switch (intent.intent) {
        case "create_text_ads": {
            const topic = intent.params.topic || biz.services[0] || "your top service";
            return {
                role: "ai",
                model: "gpt-4o",
                content: `Done! I just created **3 text ads** for **${topic}**. They're saved to your Drafts page and here's a preview:`,
                timestamp: time,
                ads: [
                    {
                        type: "text",
                        headline1: `${topic.charAt(0).toUpperCase() + topic.slice(1)} \u2014 ${biz.location}`,
                        headline2: "Fast Service \u2022 Free Estimates",
                        description: `Looking for ${topic}? ${biz.name} is ${biz.location}'s top-rated provider. Same-day service, no hidden fees. 500+ 5-star reviews. Call now for a free estimate!`,
                        displayUrl: `www.${biz.url}`,
                    },
                    {
                        type: "text",
                        headline1: `Need ${topic.charAt(0).toUpperCase() + topic.slice(1)}? Call Now`,
                        headline2: "Licensed & Insured \u2022 Top Rated",
                        description: `Professional ${topic} from ${biz.name}. We respond fast. ${biz.location}'s most trusted. Book online in 60 seconds.`,
                        displayUrl: `www.${biz.url}`,
                    },
                    {
                        type: "text",
                        headline1: `Don't Overpay for ${topic.charAt(0).toUpperCase() + topic.slice(1)}`,
                        headline2: "500+ Reviews \u2022 Fast Response",
                        description: `Why pay more? Honest pricing, expert service from ${biz.name}. ${topic.charAt(0).toUpperCase() + topic.slice(1)} done right the first time. Free estimates available.`,
                        displayUrl: `www.${biz.url}`,
                    },
                ],
                taskSummary: {
                    done: [
                        `Created 3 text ad variations for "${topic}"`,
                        "Saved all drafts to your Drafts page",
                        `Used ${biz.name}'s Knowledge Base for pricing & USPs`,
                    ],
                },
                actions: [
                    { label: "Go Live with all 3", type: "primary" },
                    { label: "Regenerate Ad #2", type: "secondary" },
                    { label: "Create display ads too", type: "secondary" },
                ],
            };
        }

        case "create_display_ads": {
            const topic = intent.params.topic || "your business";
            return {
                role: "ai",
                model: "gpt-4o",
                content: `Done! I designed **2 display ads** for **${topic}**. Here they are \u2014 you can customize images, text, and positioning right here:`,
                timestamp: time,
                ads: [
                    {
                        type: "display",
                        title: `${topic.charAt(0).toUpperCase() + topic.slice(1)} \u2014 Banner`,
                        dimensions: "728\u00d790",
                        format: "Leaderboard",
                        imageUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop",
                        overlayText: `${topic.charAt(0).toUpperCase() + topic.slice(1)} \u2014 Miami's #1 Choice`,
                        ctaText: "Get Started",
                        previewBg: "from-blue-500 to-purple-600",
                    },
                    {
                        type: "display",
                        title: `${topic.charAt(0).toUpperCase() + topic.slice(1)} \u2014 Sidebar`,
                        dimensions: "300\u00d7250",
                        format: "Medium Rectangle",
                        imageUrl: "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=400&h=300&fit=crop",
                        overlayText: "Special Offer \u2014 Limited Time",
                        ctaText: "Learn More",
                        previewBg: "from-amber-400 to-red-500",
                    },
                ],
                taskSummary: {
                    done: [
                        `Designed 2 display ads for "${topic}"`,
                        "Applied images from your library",
                        "Saved to Drafts page for editing",
                    ],
                },
                actions: [
                    { label: "Edit images & layout", type: "primary" },
                    { label: "Change the text", type: "secondary" },
                    { label: "Add more sizes", type: "secondary" },
                ],
            };
        }

        case "move_image": {
            const pos = intent.params.position || "center";
            return {
                role: "ai",
                model: "gpt-4o",
                content: `Done! I moved the image to **${pos}** position.`,
                timestamp: time,
                ads: [
                    {
                        type: "display",
                        title: "Updated Display Ad",
                        dimensions: "728\u00d790",
                        format: "Leaderboard",
                        imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop",
                        overlayText: "SUMMER SALE 40% OFF",
                        ctaText: "Shop Now",
                        previewBg: "from-pink-400 to-purple-500",
                    },
                ],
                taskSummary: {
                    done: [
                        `Repositioned image to "${pos}"`,
                        "Updated the draft on your Drafts page",
                    ],
                },
                actions: [
                    { label: "Try another position", type: "secondary" },
                    { label: "Change the image", type: "secondary" },
                    { label: "Go Live", type: "primary" },
                ],
            };
        }

        case "add_image": {
            const target = intent.params.target || "display ad";
            return {
                role: "ai",
                model: "gpt-4o",
                content: `Done! I added an image to your **${target}** ad. Here\u2019s how it looks now:`,
                timestamp: time,
                ads: [
                    {
                        type: "display",
                        title: `${target.charAt(0).toUpperCase() + target.slice(1)} Ad`,
                        dimensions: "300\u00d7250",
                        format: "Medium Rectangle",
                        imageUrl: "https://images.unsplash.com/photo-1607082349566-187342175e2f?w=400&h=300&fit=crop",
                        overlayText: "Your New Ad \u2014 Looking Great!",
                        ctaText: "Shop Now",
                        previewBg: "from-emerald-400 to-cyan-500",
                    },
                ],
                taskSummary: {
                    done: [
                        `Added image to "${target}" ad`,
                        "Auto-positioned for best visual impact",
                        "Saved changes to Drafts",
                    ],
                },
                actions: [
                    { label: "Move the image", type: "secondary" },
                    { label: "Use a different image", type: "secondary" },
                    { label: "Looks great!", type: "primary" },
                ],
            };
        }

        case "change_text": {
            const newText = intent.params.newText || "New headline text";
            return {
                role: "ai",
                model: "gpt-4o",
                content: `Done! Updated the text to **"${newText}"**. Here\u2019s the updated ad:`,
                timestamp: time,
                ads: [
                    {
                        type: "display",
                        title: "Updated Display Ad",
                        dimensions: "728\u00d790",
                        format: "Leaderboard",
                        imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop",
                        overlayText: newText,
                        ctaText: "Shop Now",
                        previewBg: "from-pink-400 to-purple-500",
                    },
                ],
                taskSummary: {
                    done: [
                        `Changed overlay text to "${newText}"`,
                        "Draft updated on your Drafts page",
                    ],
                },
                actions: [
                    { label: "Change the CTA button too", type: "secondary" },
                    { label: "Looks perfect!", type: "primary" },
                ],
            };
        }

        case "show_stats": {
            return {
                role: "ai",
                model: "gpt-4o",
                content: "Here\u2019s your account at a glance for the **last 7 days**:",
                timestamp: time,
                stats: [
                    { label: "Phone Calls", value: "18", change: "+38%", trend: "up" },
                    { label: "Clicks", value: "342", change: "+12%", trend: "up" },
                    { label: "CTR", value: "7.99%", change: "+11%", trend: "up" },
                    { label: "Cost", value: "$295", change: "-5%", trend: "down" },
                    { label: "Cost/Call", value: "$16.41", change: "-10%", trend: "down" },
                    { label: "Budget Left", value: "$318", change: "6.3 days", trend: "neutral" },
                ],
                actions: [
                    { label: "Show call details", type: "primary" },
                    { label: "Find money leaks", type: "secondary" },
                    { label: "Compare to last month", type: "secondary" },
                ],
            };
        }

        case "find_leaks": {
            return {
                role: "ai",
                model: "gpt-4o",
                content: `I scanned **${biz.name}**'s account for the last 30 days. Here\u2019s where money is leaking:\n\n` +
                    "\ud83d\udea8 **Critical Leaks** (fix these first)\n\n" +
                    "**1.** 3 junk keywords \u2014 **$45.50/week** wasted\n" +
                    `\u2003\u2022 "free ${biz.services[0] || "service"} tips", "${biz.services[0] || "service"} salary", "how to ${biz.services[1] || "DIY"}"\n\n` +
                    "**2.** Ads running 3am\u20136am \u2014 **$28/week** wasted\n" +
                    "\u2003\u2022 Clicks at 3am but nobody calls then\n\n" +
                    "**3.** Mobile bid too high \u2014 **~$35/week** overspent\n" +
                    "\u2003\u2022 Mobile converts 40% less than desktop\n\n" +
                    "**Total potential savings: ~$108.50/week ($434/month)** \ud83d\udca1",
                timestamp: time,
                stats: [
                    { label: "Junk Keywords", value: "$45.50/wk", change: "3 keywords", trend: "down" },
                    { label: "Night Ads", value: "$28/wk", change: "3am-6am", trend: "down" },
                    { label: "Mobile Overbid", value: "$35/wk", change: "-40% conv", trend: "down" },
                    { label: "Total Savings", value: "$434/mo", change: "If fixed", trend: "up" },
                ],
                taskSummary: {
                    done: ["Scanned 47 keywords for waste", "Analyzed 30-day ad schedule", "Checked device bid modifiers"],
                    pending: ["Fix junk keywords", "Adjust ad schedule", "Lower mobile bids"],
                },
                actions: [
                    { label: "Fix all leaks now", type: "primary" },
                    { label: "Fix keywords only", type: "secondary" },
                    { label: "I'll review first", type: "secondary" },
                ],
            };
        }

        case "check_competitors": {
            const c = biz.competitors;
            return {
                role: "ai",
                model: "claude-4.6",
                content: `I analyzed your competitors in the **${biz.location} ${biz.industry.split("/")[0].trim().toLowerCase()}** market:\n\n` +
                    `\ud83c\udfc6 **1. ${c[0] || "Competitor A"}** \u2014 Avg pos: 1.2, 12 ads active\n` +
                    `\ud83e\udd48 **2. ${c[1] || "Competitor B"}** \u2014 Avg pos: 2.1, 8 ads active\n` +
                    `\ud83e\udd49 **3. ${c[2] || "Competitor C"}** \u2014 Avg pos: 2.8, 15 ads active\n\n` +
                    `\ud83d\udca1 **Your edge:** ${biz.name} has unique positioning in the market.\n\n` +
                    `\ud83d\udcb0 Estimated competitor spend: **$800\u2013$1,200/week** each`,
                timestamp: time,
                stats: [
                    { label: c[0]?.split(" ")[0] || "Comp A", value: "Pos 1.2", change: "12 ads", trend: "neutral" },
                    { label: c[1]?.split(" ")[0] || "Comp B", value: "Pos 2.1", change: "8 ads", trend: "neutral" },
                    { label: c[2]?.split(" ")[0] || "Comp C", value: "Pos 2.8", change: "15 ads", trend: "neutral" },
                    { label: "Your Position", value: "Pos 1.8", change: "Strong", trend: "up" },
                ],
                actions: [
                    { label: "Write counter-ads", type: "primary" },
                    { label: `How to beat ${c[0]?.split(" ")[0] || "them"}?`, type: "secondary" },
                    { label: "Their keywords?", type: "secondary" },
                ],
            };
        }

        case "pause_keywords": {
            const svc = biz.services[0] || "service";
            return {
                role: "ai",
                model: "gpt-4o",
                content: `Done! Here\u2019s what I paused for **${biz.name}**:`,
                timestamp: time,
                taskSummary: {
                    done: [
                        `Paused "free ${svc} tips" \u2014 saving ~$22/week`,
                        `Added unrelated terms as negative keywords \u2014 saving ~$8.50/week`,
                        `Paused low-intent queries \u2014 saving ~$15/week`,
                    ],
                },
                stats: [
                    { label: "Keywords Paused", value: "3", change: "Done", trend: "up" },
                    { label: "Weekly Savings", value: "$45.50", change: "+100%", trend: "up" },
                    { label: "Monthly Impact", value: "$182", change: "Saved", trend: "up" },
                ],
                actions: [
                    { label: "Show my best keywords", type: "primary" },
                    { label: "Any more to pause?", type: "secondary" },
                    { label: "I'm good", type: "secondary" },
                ],
            };
        }

        case "go_live": {
            return {
                role: "ai",
                model: "gpt-4o",
                content: "I\u2019ve pushed your approved ads live! Here\u2019s the summary:",
                timestamp: time,
                taskSummary: {
                    done: [
                        "Published 3 text ads to Google Search campaigns",
                        "Published 2 display ads to Display Network",
                        "Set daily budget cap at $50/day",
                        "Enabled conversion tracking",
                    ],
                },
                stats: [
                    { label: "Ads Live", value: "5", change: "Active", trend: "up" },
                    { label: "Campaigns", value: "3", change: "Running", trend: "up" },
                    { label: "Daily Budget", value: "$50", change: "Set", trend: "neutral" },
                ],
                actions: [
                    { label: "Monitor performance", type: "primary" },
                    { label: "Adjust budget", type: "secondary" },
                    { label: "Create more ads", type: "secondary" },
                ],
            };
        }

        case "show_drafts": {
            return {
                role: "ai",
                model: "gpt-4o",
                content: `Here are your current drafts for **${biz.name}** \u2014 **6 text ads** and **4 display ads**:`,
                timestamp: time,
                ads: [
                    { type: "text", headline1: `${biz.services[0] ? biz.services[0].charAt(0).toUpperCase() + biz.services[0].slice(1) : "Service"} \u2014 ${biz.location}`, headline2: "Fast Response \u2022 Top Rated", description: `Need ${biz.services[0] || "help"}? ${biz.name} is here for you. Call now!`, displayUrl: `www.${biz.url}` },
                    { type: "text", headline1: `${biz.name} \u2014 Book Today`, headline2: "Free Consultation \u2022 Trusted", description: `${biz.shortDesc}. Get started today.`, displayUrl: `www.${biz.url}` },
                    { type: "display", title: "Summer Collection Banner", dimensions: "728\u00d790", format: "Leaderboard", imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop", overlayText: "SUMMER SALE 40% OFF", ctaText: "Shop Now", previewBg: "from-pink-400 to-purple-500" },
                    { type: "display", title: "Sushi Lunch Special", dimensions: "300\u00d7250", format: "Medium Rectangle", imageUrl: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&h=300&fit=crop", overlayText: "LUNCH SPECIAL $12.99", ctaText: "Order Now", previewBg: "from-amber-400 to-red-500" },
                ],
                actions: [
                    { label: "Edit a display ad", type: "primary" },
                    { label: "Create more ads", type: "secondary" },
                    { label: "Go live with all", type: "secondary" },
                ],
            };
        }

        case "export_report": {
            const fmt = intent.params.format;
            if (fmt) {
                return {
                    role: "ai",
                    model: "claude-4.6",
                    content: `I\u2019ll generate a **${fmt.toUpperCase()} report** for **${biz.name}** right away!\n\n` +
                        `\ud83d\udcc4 **Report Preview:**\n` +
                        `\u2022 Header: ${biz.name} branding & logo\n` +
                        `\u2022 Executive Summary with KPIs\n` +
                        `\u2022 Winning Keywords & Money Leaks\n` +
                        `\u2022 Google Trends Analysis\n` +
                        `\u2022 AI Recommendations\n` +
                        `\u2022 Footer: ${biz.url} \u00b7 Generated by AdMaster Pro\n\n` +
                        `Would you like to customize what\u2019s included, or should I generate as-is?`,
                    timestamp: time,
                    actions: [
                        { label: `Generate ${fmt.toUpperCase()} now`, type: "primary" },
                        { label: "Customize sections", type: "secondary" },
                        { label: "Try a different format", type: "secondary" },
                    ],
                };
            }
            return {
                role: "ai",
                model: "claude-4.6",
                content: `Sure! I can generate a branded report for **${biz.name}**. What format would you like?\n\n` +
                    `\ud83d\udcc4 **PDF** \u2014 Best for printing & sharing\n` +
                    `\ud83d\udcca **Excel** \u2014 Editable data with charts\n` +
                    `\ud83d\udcc3 **Word** \u2014 Full written report\n` +
                    `\ud83d\udcc1 **CSV** \u2014 Raw data export\n` +
                    `\ud83d\udda8\ufe0f **Print** \u2014 Direct to printer\n\n` +
                    `All reports include your **${biz.name} branding** (header, footer, brand colors) by default.`,
                timestamp: time,
                actions: [
                    { label: "Export as PDF", type: "primary" },
                    { label: "Export as Excel", type: "secondary" },
                    { label: "Export as Word", type: "secondary" },
                    { label: "Open report settings", type: "secondary" },
                ],
            };
        }

        case "add_keywords": {
            return {
                role: "ai",
                model: "gpt-4o",
                content: `Great question! Here\u2019s what I found for **${biz.name}** based on Google Trends, competitor analysis, and your Knowledge Base:\n\n` +
                    `\ud83d\udd25 **Trending Keywords** (from Google Trends):\n` +
                    `\u2022 \"${biz.services[0] || "service"} near me\" \u2014 \ud83d\udcc8 +24% this week\n` +
                    `\u2022 \"best ${biz.services[0] || "service"} ${biz.location.split(" ")[0]}\" \u2014 \ud83d\udd25 Breakout!\n` +
                    `\u2022 \"${biz.services[1] || "repair"} cost ${new Date().getFullYear()}\" \u2014 \ud83d\udcc8 +18%\n\n` +
                    `\ud83e\udde0 **AI Recommendations** based on your data:\n` +
                    `\u2022 \"${biz.services[2] || "consultation"} ${biz.location.split(" ")[0].toLowerCase()}\" \u2014 Score: 8/10\n` +
                    `\u2022 \"emergency ${biz.services[0] || "service"}\" \u2014 Score: 7/10\n\n` +
                    `Want me to add these, or would you prefer to add your own keywords? You can also bulk import from a list.`,
                timestamp: time,
                actions: [
                    { label: "Add all suggested", type: "primary" },
                    { label: "I\u2019ll add my own", type: "secondary" },
                    { label: "Show more suggestions", type: "secondary" },
                    { label: "Open Keywords page", type: "secondary" },
                ],
            };
        }

        case "help": {
            return {
                role: "ai",
                model: "gpt-4o",
                content: "I\u2019m your AI ad assistant! Here\u2019s what I can do \u2014 just tell me in plain English:\n\n" +
                    "\ud83d\udcdd **Create Ads** \u2014 \"Create 3 text ads for drain cleaning\"\n" +
                    "\ud83d\uddbc\ufe0f **Design Display Ads** \u2014 \"Make a display ad for summer sale\"\n" +
                    "\ud83d\udcf7 **Manage Images** \u2014 \"Add a sushi image to the lunch ad\"\n" +
                    "\u2194\ufe0f **Position Images** \u2014 \"Move the image to the top left\"\n" +
                    "\u270f\ufe0f **Edit Text** \u2014 \"Change the headline to 50% OFF\"\n" +
                    "\ud83d\udcca **Show Stats** \u2014 \"How are my ads doing?\"\n" +
                    "\ud83d\udcb8 **Find Waste** \u2014 \"Where am I wasting money?\"\n" +
                    "\ud83c\udfc6 **Competitors** \u2014 \"What are my competitors doing?\"\n" +
                    "\ud83d\udd0d **Keywords** \u2014 \"Suggest keywords\" or \"What\u2019s trending?\"\n" +
                    "\ud83d\udcc4 **Reports** \u2014 \"Export my report as PDF\"\n" +
                    "\ud83c\udfe2 **Multi-Account** \u2014 \"How many accounts do we have?\" or \"Compare all accounts\"\n" +
                    "\u23f8 **Pause/Block** \u2014 \"Pause the bad keywords\"\n" +
                    "\ud83d\ude80 **Go Live** \u2014 \"Launch my ads\"\n\n" +
                    "Just speak or type naturally \u2014 I\u2019ll handle the rest! \ud83c\udf99\ufe0f",
                timestamp: time,
                actions: [
                    { label: "Show my stats", type: "primary" },
                    { label: "Create new ads", type: "secondary" },
                    { label: "Find money leaks", type: "secondary" },
                    { label: "Export a report", type: "secondary" },
                ],
            };
        }

        case "off_topic": {
            const offBizName = intent.params.offTopicBusiness || "another business";
            return {
                role: "ai",
                model: "gpt-4o",
                content: `I\u2019m currently managing ads for **${biz.name}** (${biz.industry}).\n\n` +
                    `I can\u2019t create ads for **${offBizName}** in this context \u2014 ` +
                    `each business has its own Knowledge Base, brand voice, and campaign data that I use to generate accurate ads.\n\n` +
                    `\ud83d\udc49 **To manage ${offBizName}**, switch to it from the business menu in the sidebar.\n\n` +
                    `Would you like me to help with something for **${biz.name}** instead?`,
                timestamp: time,
                actions: [
                    { label: `Create ads for ${biz.name.split(" ")[0]}`, type: "primary" },
                    { label: "Show my stats", type: "secondary" },
                    { label: "What can you do?", type: "secondary" },
                ],
            };
        }

        default: {
            return {
                role: "ai",
                model: Math.random() > 0.4 ? "gpt-4o" : "claude-4.6",
                content: `Got it! Let me work on that for **${biz.name}**.\n\n` +
                    "Based on your account data:\n\n" +
                    "\u2022 Your account is healthy with a **7.99% CTR**\n" +
                    "\u2022 **18 calls** this week from Google Ads\n" +
                    "\u2022 **$318** remaining in this month\u2019s budget\n\n" +
                    "Could you tell me a bit more about what you need? Here are some things I can do right now:",
                timestamp: time,
                stats: [
                    { label: "CTR", value: "7.99%", change: "Healthy", trend: "up" },
                    { label: "Calls", value: "18", change: "This week", trend: "up" },
                    { label: "Budget", value: "$318", change: "Remaining", trend: "neutral" },
                ],
                actions: [
                    { label: "Create ads for me", type: "primary" },
                    { label: "Show my stats", type: "secondary" },
                    { label: "Find money leaks", type: "secondary" },
                    { label: "What can you do?", type: "secondary" },
                ],
            };
        }
    }
};

// ─── Exact Match Bank (for action buttons) ──────────────────────────────────

const getExactMatchBank = (biz: BusinessProfile): Record<string, () => Omit<Message, "id">> => ({
    "Yes, pause them all": () => generateResponse({ intent: "pause_keywords", params: {} }, "", biz),
    "Fix all leaks now": () => generateResponse({ intent: "pause_keywords", params: {} }, "", biz),
    "Go Live with all 3": () => generateResponse({ intent: "go_live", params: {} }, "", biz),
    "Go live with all": () => generateResponse({ intent: "go_live", params: {} }, "", biz),
    "Go Live": () => generateResponse({ intent: "go_live", params: {} }, "", biz),
    "Show my stats": () => generateResponse({ intent: "show_stats", params: {} }, "", biz),
    "Monitor performance": () => generateResponse({ intent: "show_stats", params: {} }, "", biz),
    "Find money leaks": () => generateResponse({ intent: "find_leaks", params: {} }, "", biz),
    "Check my competitors": () => generateResponse({ intent: "check_competitors", params: {} }, "", biz),
    "What can you do?": () => generateResponse({ intent: "help", params: {} }, "", biz),
    "Show call details": () => ({
        role: "ai",
        model: "claude-4.6",
        content: `Here are your **18 calls** for **${biz.name}** from the last 7 days:\n\n` +
            "| # | Date | Duration | Keyword | Result |\n" +
            "|---|------|----------|---------|--------|\n" +
            `| 1 | Feb 24 | 4:32 | ${biz.services[0] || "service"} | \u2705 Booked |\n` +
            `| 2 | Feb 24 | 2:18 | ${biz.services[1] || "repair"} | \u2705 Booked |\n` +
            `| 3 | Feb 24 | 0:45 | ${biz.services[0] || "service"} ${biz.location.split(" ")[0].toLowerCase()} | \u274c Hangup |\n` +
            `| 4 | Feb 23 | 6:12 | ${biz.services[2] || "service"} | \u2705 Booked |\n` +
            `| 5 | Feb 23 | 3:45 | ${biz.services[0] || "service"} | \u2705 Booked |\n\n` +
            "\u2022 \u2705 **12 booked** (67%)\n\u2022 \ud83d\udccb 3 estimates\n\u2022 \u274c 2 hangups, 1 wrong number\n\n" +
            "Booking rate **67%** vs industry avg 45% \ud83c\udf89",
        timestamp: timeNow(),
        stats: [
            { label: "Booked", value: "12", change: "67%", trend: "up" },
            { label: "Estimates", value: "3", change: "Pending", trend: "neutral" },
            { label: "Missed", value: "3", change: "Hangups", trend: "down" },
        ],
        actions: [
            { label: "Best keywords for bookings?", type: "primary" },
            { label: "Why the hangups?", type: "secondary" },
        ],
    }),
    "Compare to last month": () => ({
        role: "ai",
        model: "gpt-4o",
        content: `**Month-over-month comparison for ${biz.name}:**\n\n` +
            "| Metric | Jan | Feb (so far) | Change |\n" +
            "|--------|-----|-------------|--------|\n" +
            "| Calls | 52 | 48 | \ud83d\udfe2 +15% pace |\n" +
            "| Cost/Call | $27.30 | $24.62 | \ud83d\udfe2 -10% |\n" +
            "| CTR | 7.19% | 7.99% | \ud83d\udfe2 +11% |\n" +
            "| Cost | $1,420 | $1,182 | \ud83d\udfe2 Under budget |\n\n" +
            "\ud83d\ude80 **Trending better across the board!** On pace for 63 calls (vs 52 in Jan).",
        timestamp: timeNow(),
        stats: [
            { label: "Calls Pace", value: "63", change: "+21%", trend: "up" },
            { label: "Cost/Call", value: "$24.62", change: "-10%", trend: "down" },
            { label: "CTR", value: "7.99%", change: "+11%", trend: "up" },
        ],
        actions: [
            { label: "What helped most?", type: "primary" },
            { label: "Predict next month", type: "secondary" },
        ],
    }),
    "Create display ads too": () => generateResponse({ intent: "create_display_ads", params: { topic: biz.services[0] || "your top service" } }, "", biz),
    "Create more ads": () => generateResponse({ intent: "help", params: {} }, "", biz),
    "Edit images & layout": () => ({
        role: "ai",
        model: "gpt-4o",
        content: "Sure! You can edit your display ads in two ways:\n\n" +
            "**1. Tell me what to do** (easiest)\n" +
            "\u2022 \"Move the image to the top\"\n" +
            "\u2022 \"Add an image to the ad\"\n" +
            "\u2022 \"Change the headline to 50% OFF\"\n\n" +
            "**2. Manual editor**\n" +
            "\u2022 Go to your **Drafts** page and click **Edit Display** on any display ad\n" +
            "\u2022 Full image library, position controls, text editor, color picker\n\n" +
            "What would you like to do?",
        timestamp: timeNow(),
        actions: [
            { label: "Move image to top", type: "primary" },
            { label: "Change the text", type: "secondary" },
            { label: "Open Drafts page", type: "secondary" },
        ],
    }),
    "Move image to top": () => generateResponse({ intent: "move_image", params: { position: "top center" } }, "", biz),
    "Change the text": () => ({
        role: "ai",
        model: "gpt-4o",
        content: "What would you like the new text to say? Just tell me, for example:\n\n" +
            "\u2022 \"Change headline to FLASH SALE 50% OFF\"\n" +
            "\u2022 \"Set the button to Book Now\"\n" +
            "\u2022 \"Update overlay text to Free Shipping Today\"",
        timestamp: timeNow(),
        actions: [
            { label: "50% OFF Today Only", type: "secondary" },
            { label: "Free Shipping", type: "secondary" },
            { label: "Limited Time Offer", type: "secondary" },
        ],
    }),
    "Write counter-ads": () => generateResponse({ intent: "create_text_ads", params: { topic: "counter-competitor messaging" } }, "", biz),
    "Regenerate Ad #2": () => ({
        role: "ai",
        model: "claude-4.6",
        content: `Done! I regenerated Ad #2 for **${biz.name}** with a fresh angle. Here\u2019s the new version:`,
        timestamp: timeNow(),
        ads: [
            {
                type: "text",
                headline1: `${biz.name} \u2014 Top Rated in ${biz.location}`,
                headline2: "Professional \u2022 No Hidden Fees",
                description: `Choose ${biz.name} for expert ${biz.services[0] || "service"}. Professional, licensed, and ${biz.location}'s highest rated. Book now!`,
                displayUrl: `www.${biz.url}`,
            },
        ],
        taskSummary: { done: ["Regenerated Ad #2 with a fresh angle", "New version saved to Drafts (v2)", "Previous version kept in version history"] },
        actions: [
            { label: "Use this version", type: "primary" },
            { label: "Try another angle", type: "secondary" },
            { label: "Go Live with all", type: "secondary" },
        ],
    }),
    "Fix keywords only": () => generateResponse({ intent: "pause_keywords", params: {} }, "", biz),
    "I'm good": () => ({
        role: "ai",
        model: "gpt-4o",
        content: `\ud83d\udc4d I\u2019ll keep watching **${biz.name}**'s account 24/7. I\u2019ll alert you if:\n\n` +
            "\u2022 \ud83d\udea8 Any keyword spikes in cost\n\u2022 \ud83d\udcc9 CTR drops below 5%\n\u2022 \ud83d\udcb0 Spend exceeds budget by 20%+\n\u2022 \ud83c\udfc6 A competitor changes strategy\n\n" +
            "Weekly summary every Monday at 9 AM. Come back anytime!",
        timestamp: timeNow(),
        actions: [
            { label: "Set up email reports", type: "primary" },
            { label: "Change alert settings", type: "secondary" },
        ],
    }),
    "Looks great!": () => ({
        role: "ai",
        model: "gpt-4o",
        content: "Awesome! \ud83c\udf89 Everything is saved and ready. Want to push any of these live or keep editing?\n\nRemember, nothing runs until you say **Go Live**.",
        timestamp: timeNow(),
        actions: [
            { label: "Go Live with all", type: "primary" },
            { label: "Create more ads", type: "secondary" },
            { label: "I'm done for now", type: "secondary" },
        ],
    }),
    "Looks perfect!": () => ({
        role: "ai",
        model: "gpt-4o",
        content: "Awesome! \ud83c\udf89 Everything is saved and ready. Want to push any of these live or keep editing?\n\nRemember, nothing runs until you say **Go Live**.",
        timestamp: timeNow(),
        actions: [
            { label: "Go Live with all", type: "primary" },
            { label: "Create more ads", type: "secondary" },
            { label: "I'm done for now", type: "secondary" },
        ],
    }),
    "Use this version": () => ({
        role: "ai",
        model: "gpt-4o",
        content: "\u2705 Set as active version! The previous version is saved in your version history on the Drafts page.",
        timestamp: timeNow(),
        actions: [
            { label: "Go Live", type: "primary" },
            { label: "Show all my drafts", type: "secondary" },
        ],
    }),
    "Show all my drafts": () => generateResponse({ intent: "show_drafts", params: {} }, "", biz),
    "Open Drafts page": () => ({
        role: "ai",
        model: "gpt-4o",
        content: "Head over to your **Drafts** page to use the full visual editor:\n\n\ud83d\udc49 [Open Drafts Page](/dashboard/drafts)\n\nYou can filter by Text or Display ads, and click **Edit Display** to open the full image editor with library, positioning, and text controls.",
        timestamp: timeNow(),
        actions: [
            { label: "Show my drafts here instead", type: "primary" },
            { label: "Create new ads", type: "secondary" },
        ],
    }),
    "Show my drafts here instead": () => generateResponse({ intent: "show_drafts", params: {} }, "", biz),
    "50% OFF Today Only": () => generateResponse({ intent: "change_text", params: { newText: "50% OFF Today Only" } }, "", biz),
    "Free Shipping": () => generateResponse({ intent: "change_text", params: { newText: "Free Shipping \u2014 Order Now" } }, "", biz),
    "Limited Time Offer": () => generateResponse({ intent: "change_text", params: { newText: "Limited Time Offer \u2014 Don\u2019t Miss Out" } }, "", biz),
    "Add more sizes": () => generateResponse({ intent: "create_display_ads", params: { topic: "additional sizes" } }, "", biz),
    "Write the speed ad": () => generateResponse({ intent: "create_text_ads", params: { topic: "speed & fast response" } }, "", biz),
    "Write the competitor ad": () => generateResponse({ intent: "create_text_ads", params: { topic: "competitor comparison" } }, "", biz),
    "I'm done for now": () => ({
        role: "ai",
        model: "gpt-4o",
        content: `\ud83d\udc4d All good! Your ads and changes for **${biz.name}** are saved. I\u2019m always here \u2014 just speak or type when you need me.\n\nI\u2019ll keep monitoring your account 24/7. \ud83d\ude0a`,
        timestamp: timeNow(),
        actions: [],
    }),
    [`Create ads for ${biz.name.split(" ")[0]}`]: () => generateResponse({ intent: "create_text_ads", params: { topic: biz.services[0] || "your top service" } }, "", biz),
    "Create new ads": () => generateResponse({ intent: "help", params: {} }, "", biz),
    "Create ads for me": () => generateResponse({ intent: "create_text_ads", params: { topic: biz.services[0] || "your top service" } }, "", biz),
    // ── Export Report actions ──
    "Export as PDF": () => generateResponse({ intent: "export_report", params: { format: "pdf" } }, "", biz),
    "Export as Excel": () => generateResponse({ intent: "export_report", params: { format: "excel" } }, "", biz),
    "Export as Word": () => generateResponse({ intent: "export_report", params: { format: "word" } }, "", biz),
    "Export a report": () => generateResponse({ intent: "export_report", params: {} }, "", biz),
    "Generate PDF now": () => generateResponse({ intent: "export_report", params: { format: "pdf" } }, "", biz),
    "Generate EXCEL now": () => generateResponse({ intent: "export_report", params: { format: "excel" } }, "", biz),
    "Generate WORD now": () => generateResponse({ intent: "export_report", params: { format: "word" } }, "", biz),
    "Try a different format": () => generateResponse({ intent: "export_report", params: {} }, "", biz),
    "Open report settings": () => ({
        role: "ai" as const,
        model: "gpt-4o",
        content: `📊 To customize your report settings, head to the **Keywords** page and click the **Export Report** button in the top-right.\n\nThere you can:\n- Choose your format (PDF, Excel, Word, CSV)\n- Toggle report sections on/off\n- Select your date range\n- Preview with your **${biz.name}** branding\n\nWant me to do anything else?`,
        timestamp: timeNow(),
        actions: [{ label: "Export as PDF", type: "primary" }, { label: "Export as Excel", type: "secondary" }, { label: "Show my stats", type: "secondary" }],
    }),
    "Customize sections": () => ({
        role: "ai" as const,
        model: "gpt-4o",
        content: `✏️ You can customize which sections appear in your report from the **Keywords > Export Report** modal.\n\nAvailable sections:\n• Executive Summary\n• Winning Keywords\n• Money Leaks Analysis\n• Google Trends Insights\n• AI Recommendations\n• Competitor Insights\n• 30-Day Forecast\n\nJust toggle each section on or off before exporting!`,
        timestamp: timeNow(),
        actions: [{ label: "Export as PDF", type: "primary" }, { label: "Open report settings", type: "secondary" }],
    }),
    // ── Keyword actions ──
    "Add all suggested": () => ({
        role: "ai" as const,
        model: "gpt-4o",
        content: `✅ Great choice! I've queued all the suggested keywords for **${biz.name}**.\n\nRemember — I'll run each one through my AI analysis before activating it. Keywords that don't meet quality thresholds will be paused automatically.\n\nYou can review everything on the **Keywords** page. Want me to find more opportunities?`,
        timestamp: timeNow(),
        actions: [{ label: "Show more suggestions", type: "primary" }, { label: "Open Keywords page", type: "secondary" }, { label: "Show my stats", type: "secondary" }],
    }),
    "I'll add my own": () => ({
        role: "ai" as const,
        model: "gpt-4o",
        content: `👍 No problem! Head to the **Keywords** page and click **Add Keywords** to enter your own.\n\nYou can add them one-by-one or bulk import. I'll automatically analyze each keyword and provide:\n- Quality score (1-10)\n- Google Trends data\n- AI verdict (approve/review/reject)\n\nI'll make sure only the best ones go live! 🎯`,
        timestamp: timeNow(),
        actions: [{ label: "Open Keywords page", type: "primary" }, { label: "Show more suggestions", type: "secondary" }],
    }),
    "Show more suggestions": () => generateResponse({ intent: "add_keywords", params: {} }, "", biz),
    "Open Keywords page": () => ({
        role: "ai" as const,
        model: "gpt-4o",
        content: `📋 You can find all your keywords on the **Keywords** page in the left sidebar.\n\nFrom there you can:\n- View all keywords with AI verdicts & Google Trends\n- Add new keywords (single or bulk)\n- Export branded reports\n- See which keywords I've approved, paused, or flagged\n\nNeed anything else?`,
        timestamp: timeNow(),
        actions: [{ label: "Add all suggested", type: "primary" }, { label: "Export a report", type: "secondary" }, { label: "Show my stats", type: "secondary" }],
    }),
    // ── Confirmation actions ──
    "Yes, go live!": () => generateResponse({ intent: "go_live", params: {} }, "", biz),
    "No, not yet": () => ({
        role: "ai" as const,
        model: "gpt-4o",
        content: `👍 No problem! Your drafts for **${biz.name}** are safe and ready whenever you are.\n\nI\u2019ll keep monitoring your account 24/7 in the meantime. 🔒`,
        timestamp: timeNow(),
        actions: [{ label: "Show my stats", type: "primary" }, { label: "Show my drafts", type: "secondary" }],
    }),
    "Let me review drafts first": () => generateResponse({ intent: "show_drafts", params: {} }, "", biz),
    "Show my drafts": () => generateResponse({ intent: "show_drafts", params: {} }, "", biz),
    "How many accounts?": () => ({
        role: "ai" as const,
        model: "gpt-4o",
        content: `You have **5 ad accounts** connected. I\u2019m currently managing **${biz.name}**. Ask me \u201CShow all accounts\u201D for a full portfolio overview with spend, calls, and CTR.`,
        timestamp: timeNow(),
        actions: [{ label: "Show my stats", type: "primary" }],
    }),
});

// ─── Quick Actions ──────────────────────────────────────────────────────────

const quickActions = [
    { label: "Show my stats", icon: BarChart3 },
    { label: "Find money leaks", icon: AlertTriangle },
    { label: "Create new ads", icon: PenTool },
    { label: "Check my competitors", icon: Users },
];

// ─── Initial Messages ───────────────────────────────────────────────────────

const getInitialMessages = (bizIn: BusinessProfile | null): Message[] => {
    const biz: BusinessProfile = bizIn || {
        id: "default", name: "My Business", industry: "General", website: null,
        googleAdsId: null, initials: "MB", color: "from-blue-500 to-blue-700",
        services: ["service", "consultation", "support"], location: "your area",
        url: "mybusiness.com", shortDesc: "Professional services",
        competitors: [], brandVoice: "Professional", targetAudience: "Customers",
        geo: "Local", goals: ["Grow"], kbStatus: "empty",
    };
    const name = biz.name;
    return [
    {
        id: 1,
        role: "system",
        content: `AI Assistant connected \u2022 Managing: ${name} \u2022 Voice enabled \ud83c\udf99\ufe0f`,
        timestamp: "Session started",
    },
    {
        id: 2,
        role: "ai",
        model: "gpt-4o",
        content:
            `Hey! \ud83d\udc4b I\u2019m your AI ad assistant for **${name}**. Just **speak or type** what you need \u2014 I\u2019ll handle everything.\n\n` +
            `I just scanned your **${biz.name}** account for the last 7 days:\n\n` +
            "**Good news:** 18 conversions this week \u2014 5 more than last week! \ud83c\udf89\n\n" +
            `**Needs attention:** I found 3 keywords wasting **$45.50/week**:\n` +
            `\u2022 "free ${biz.services[0] || "service"} tips" \u2014 $22, 0 conversions\n` +
            `\u2022 "${biz.services[0] || "service"} salary" \u2014 $8.50, 0 conversions\n` +
            `\u2022 "how to ${biz.services[1] || "DIY"}" \u2014 $15, 0 conversions\n\n` +
            "Want me to pause these? Just say the word.",
        timestamp: timeNow(),
        stats: [
            { label: "Conversions", value: "18", change: "+38%", trend: "up" },
            { label: "Wasted", value: "$45.50", change: "This week", trend: "down" },
            { label: "CTR", value: "7.99%", change: "Above avg", trend: "up" },
        ],
        actions: [
            { label: "Yes, pause them all", type: "primary" },
            { label: "Let me review first", type: "secondary" },
            { label: "What else can you do?", type: "secondary" },
        ],
    },
];
};

// ─── Component ──────────────────────────────────────────────────────────────

type MicPermission = "checking" | "prompt" | "granted" | "denied" | "not-found" | "unsupported";
type Platform = "ios" | "android" | "desktop";

const detectPlatform = (): { browser: string; platform: Platform } => {
    if (typeof navigator === "undefined") return { browser: "unknown", platform: "desktop" };
    const ua = navigator.userAgent;

    // Detect platform
    const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/i.test(ua);
    const platform: Platform = isIOS ? "ios" : isAndroid ? "android" : "desktop";

    // Detect browser
    let browser = "unknown";
    if (/Firefox/i.test(ua)) browser = "firefox";
    else if (/Edg/i.test(ua)) browser = "edge";
    else if (/OPR|Opera/i.test(ua)) browser = "opera";
    else if (/CriOS/i.test(ua)) browser = "chrome";
    else if (/Chrome/i.test(ua)) browser = "chrome";
    else if (/Safari/i.test(ua)) browser = "safari";

    return { browser, platform };
};

const getMicInstructions = (browser: string, platform: Platform): { steps: string[]; note?: string } => {
    if (platform === "ios") {
        if (browser === "safari") {
            return {
                steps: [
                    "Open the Settings app on your iPhone",
                    "Scroll down and tap Safari",
                    "Tap Microphone and set to Allow",
                    "Return here and tap the button below",
                ],
            };
        }
        // Chrome / Edge / other on iOS
        return {
            steps: [
                `Open Settings on your iPhone`,
                `Scroll down and tap ${browser === "chrome" ? "Chrome" : browser === "edge" ? "Edge" : "your browser"}`,
                "Enable Microphone access",
                "Return here and tap the button below",
            ],
        };
    }

    if (platform === "android") {
        return {
            steps: [
                "Tap the lock/tune icon in the address bar",
                "Tap Permissions (or Site settings)",
                "Set Microphone to Allow",
                "Reload this page",
            ],
            note: "Or go to Android Settings \u2192 Apps \u2192 Browser \u2192 Permissions \u2192 Microphone",
        };
    }

    // Desktop
    if (browser === "firefox") {
        return {
            steps: [
                "Speech recognition is not supported in Firefox",
                "Please open this page in Chrome, Edge, or Safari",
            ],
        };
    }
    if (browser === "safari") {
        return {
            steps: [
                "Click Safari in the menu bar \u2192 Settings for This Website",
                "Set Microphone to Allow",
                "Reload this page",
            ],
        };
    }
    // Chrome / Edge / Opera desktop
    return {
        steps: [
            "Click the lock icon in the address bar",
            `Go to Site settings \u2192 Microphone`,
            "Change to Allow",
            "Reload this page",
        ],
    };
};

export default function ChatPage() {
    const { activeBusiness, businesses, setActiveBusiness } = useBusiness();
    // getOffTopicBusiness was removed — stub it to always return null
    const getOffTopicBusiness = (_text: string): BusinessProfile | null => null;
    const chatHistoryRef = useRef<Map<string, Message[]>>(new Map());
    const [messages, setMessages] = useState<Message[]>(() => getInitialMessages(activeBusiness));
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [copiedId, setCopiedId] = useState<number | null>(null);
    const [isListening, setIsListening] = useState(false);
    const [voiceText, setVoiceText] = useState("");
    const [voicePaused, setVoicePaused] = useState(false);
    const [silenceCountdown, setSilenceCountdown] = useState(0);
    const [micPermission, setMicPermission] = useState<MicPermission>("checking");
    const [showMicModal, setShowMicModal] = useState(false);
    const [audioLevel, setAudioLevel] = useState(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const recognitionRef = useRef<any>(null);
    const sendMessageRef = useRef<(text: string) => void>(() => {});
    const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const voiceTranscriptRef = useRef("");
    const browserRef = useRef("unknown");
    const platformRef = useRef<Platform>("desktop");
    // AnalyserNode-based silence detection refs
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const analysisFrameRef = useRef<number | null>(null);
    const recordingStartRef = useRef<number>(0);
    const silenceStartRef = useRef<number>(0);
    const hasAnalyserRef = useRef(false);
    const prevBusinessRef = useRef(activeBusiness.id);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    // Persist & restore per-business chat history when business changes
    useEffect(() => {
        if (prevBusinessRef.current !== activeBusiness.id) {
            // Save current chat history for the previous business
            chatHistoryRef.current.set(prevBusinessRef.current, messages);
            prevBusinessRef.current = activeBusiness.id;

            // Restore or initialize for the new business
            const saved = chatHistoryRef.current.get(activeBusiness.id);
            if (saved && saved.length > 0) {
                setMessages(saved);
            } else {
                setMessages(getInitialMessages(activeBusiness));
            }
            setInput("");
            setIsTyping(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeBusiness]);

    // Cleanup voice timers + audio context on unmount
    useEffect(() => {
        return () => {
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            if (countdownRef.current) clearInterval(countdownRef.current);
            if (analysisFrameRef.current) cancelAnimationFrame(analysisFrameRef.current);
            if (audioContextRef.current) { try { audioContextRef.current.close(); } catch { /* ok */ } }
            if (mediaStreamRef.current) { mediaStreamRef.current.getTracks().forEach(t => t.stop()); }
        };
    }, []);

    // Check microphone permission + SpeechRecognition availability on mount
    useEffect(() => {
        const { browser, platform } = detectPlatform();
        browserRef.current = browser;
        platformRef.current = platform;

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setMicPermission("unsupported");
            return;
        }

        // Check permission via Permissions API (where supported)
        if (navigator.permissions && navigator.permissions.query) {
            navigator.permissions.query({ name: "microphone" as PermissionName })
                .then((status) => {
                    if (status.state === "granted") setMicPermission("granted");
                    else if (status.state === "denied") setMicPermission("denied");
                    else setMicPermission("prompt");

                    // Listen for permission changes
                    status.onchange = () => {
                        if (status.state === "granted") setMicPermission("granted");
                        else if (status.state === "denied") setMicPermission("denied");
                        else setMicPermission("prompt");
                    };
                })
                .catch(() => {
                    // Permissions API not available for microphone (Safari) — assume prompt
                    setMicPermission("prompt");
                });
        } else {
            // No Permissions API (older Safari) — assume prompt
            setMicPermission("prompt");
        }
    }, []);

    // ─── Voice Recognition with AnalyserNode Silence Detection ────────────

    // Silence detection constants
    const SILENCE_THRESHOLD = 0.015;   // RMS level below which = silence
    const SILENCE_DURATION = 2500;     // ms of sustained silence → auto-send
    const GRACE_PERIOD = 1200;         // ms from start before silence detection kicks in
    const COUNTDOWN_INTERVAL = 100;    // ms between countdown ticks

    const clearSilenceTimer = useCallback(() => {
        if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
        if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
        setSilenceCountdown(0);
    }, []);

    /** Stop the AnalyserNode audio loop + close AudioContext */
    const stopAudioAnalysis = useCallback(() => {
        if (analysisFrameRef.current) { cancelAnimationFrame(analysisFrameRef.current); analysisFrameRef.current = null; }
        if (audioContextRef.current) { try { audioContextRef.current.close(); } catch { /* ok */ } audioContextRef.current = null; }
        if (mediaStreamRef.current) { mediaStreamRef.current.getTracks().forEach(t => t.stop()); mediaStreamRef.current = null; }
        analyserRef.current = null;
        hasAnalyserRef.current = false;
        setAudioLevel(0);
    }, []);

    /** Finalize + auto-send whatever transcript we have */
    const autoSendTranscript = useCallback(() => {
        clearSilenceTimer();
        const text = voiceTranscriptRef.current.trim();
        if (text) sendMessageRef.current(text);
        voiceTranscriptRef.current = "";
        setVoiceText("");
        setVoicePaused(false);
        setSilenceCountdown(0);
        stopAudioAnalysis();
        if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch { /* ok */ } }
        setIsListening(false);
    }, [clearSilenceTimer, stopAudioAnalysis]);

    /** Start the sustained-silence countdown bar (visual only — autoSend triggered by timer) */
    const startSilenceCountdown = useCallback(() => {
        clearSilenceTimer();
        setVoicePaused(true);
        const steps = Math.ceil(SILENCE_DURATION / COUNTDOWN_INTERVAL);
        let remaining = steps;
        countdownRef.current = setInterval(() => {
            remaining--;
            setSilenceCountdown(remaining / steps); // 1 → 0
            if (remaining <= 0 && countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
        }, COUNTDOWN_INTERVAL);
        silenceTimerRef.current = setTimeout(() => {
            autoSendTranscript();
        }, SILENCE_DURATION);
    }, [clearSilenceTimer, autoSendTranscript]);

    /** Run the AnalyserNode audio-level monitoring loop */
    const startAudioLevelMonitoring = useCallback(() => {
        const analyser = analyserRef.current;
        if (!analyser) return;

        const dataArray = new Uint8Array(analyser.fftSize);
        const tick = () => {
            if (!analyserRef.current) return;
            analyser.getByteTimeDomainData(dataArray);

            // Calculate RMS
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
                const v = (dataArray[i] - 128) / 128;
                sum += v * v;
            }
            const rms = Math.sqrt(sum / dataArray.length);
            setAudioLevel(Math.min(rms * 5, 1)); // 0–1 for visual bar

            const now = Date.now();
            const elapsed = now - recordingStartRef.current;

            // Only do silence detection after grace period and if we have transcript
            if (elapsed > GRACE_PERIOD && voiceTranscriptRef.current.trim()) {
                if (rms < SILENCE_THRESHOLD) {
                    // Silence detected
                    if (silenceStartRef.current === 0) {
                        silenceStartRef.current = now;
                    }
                    const silenceDuration = now - silenceStartRef.current;
                    // If silence hasn't started the countdown yet and it's been ~500ms of quiet, start it
                    if (silenceDuration > 400 && !silenceTimerRef.current) {
                        startSilenceCountdown();
                    }
                } else {
                    // Sound detected — reset silence tracking + countdown
                    silenceStartRef.current = 0;
                    if (silenceTimerRef.current || countdownRef.current) {
                        clearSilenceTimer();
                        setVoicePaused(false);
                    }
                }
            }

            analysisFrameRef.current = requestAnimationFrame(tick);
        };
        analysisFrameRef.current = requestAnimationFrame(tick);
    }, [clearSilenceTimer, startSilenceCountdown]);

    const voiceSendNow = useCallback(() => {
        autoSendTranscript();
    }, [autoSendTranscript]);

    const startListening = useCallback(() => {
        // Check if SpeechRecognition is available
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setMicPermission("unsupported");
            setShowMicModal(true);
            return;
        }

        // If permission is denied or hardware missing, show modal
        if (micPermission === "denied" || micPermission === "not-found") {
            setShowMicModal(true);
            return;
        }

        // Core start function — sets up recognition + optional AnalyserNode
        const attemptStart = (stream?: MediaStream) => {
            voiceTranscriptRef.current = "";
            setVoiceText("");
            setVoicePaused(false);
            clearSilenceTimer();
            silenceStartRef.current = 0;
            recordingStartRef.current = Date.now();

            // Set up AnalyserNode from the mic stream (if available)
            if (stream) {
                mediaStreamRef.current = stream;
                try {
                    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
                    if (AudioCtx) {
                        const ctx = new AudioCtx();
                        const source = ctx.createMediaStreamSource(stream);
                        const analyser = ctx.createAnalyser();
                        analyser.fftSize = 512;
                        analyser.smoothingTimeConstant = 0.3;
                        source.connect(analyser);
                        audioContextRef.current = ctx;
                        analyserRef.current = analyser;
                        hasAnalyserRef.current = true;
                    }
                } catch {
                    // AudioContext not available — fall back to SpeechRecognition-only silence detection
                    hasAnalyserRef.current = false;
                }
            }

            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = "en-US";

            recognition.onstart = () => {
                setIsListening(true);
                setVoiceText("Speak now...");
                // Start audio level monitoring if analyser is available
                if (hasAnalyserRef.current) {
                    startAudioLevelMonitoring();
                }
            };

            recognition.onresult = (event: any) => {
                let finalText = "";
                let interimText = "";
                for (let i = 0; i < event.results.length; i++) {
                    const result = event.results[i];
                    if (result.isFinal) {
                        finalText += result[0].transcript;
                    } else {
                        interimText += result[0].transcript;
                    }
                }

                voiceTranscriptRef.current = finalText;
                const display = (finalText + (interimText ? interimText : "")).trim();
                setVoiceText(display || "Speak now...");

                // If we DON'T have the AnalyserNode, fall back to SpeechRecognition-based silence
                if (!hasAnalyserRef.current) {
                    clearSilenceTimer();
                    setVoicePaused(false);
                    if (finalText.trim() && !interimText) {
                        startSilenceCountdown();
                    }
                }
                // With AnalyserNode, silence detection is handled by the audio loop
            };

            recognition.onerror = (e: any) => {
                if (e.error === "not-allowed") {
                    setMicPermission("denied");
                    setShowMicModal(true);
                    stopAudioAnalysis();
                    setIsListening(false);
                    return;
                }
                if (e.error === "no-speech") return;
                clearSilenceTimer();
                stopAudioAnalysis();
                setIsListening(false);
                setVoiceText("");
                setVoicePaused(false);
                voiceTranscriptRef.current = "";
            };

            recognition.onend = () => {
                if (voiceTranscriptRef.current.trim() && silenceTimerRef.current) {
                    return; // Silence timer is running — let it handle sending
                }
                if (!silenceTimerRef.current) {
                    stopAudioAnalysis();
                    setIsListening(false);
                    setVoicePaused(false);
                }
            };

            recognitionRef.current = recognition;
            recognition.start();
        };

        // Request mic permission via getUserMedia (also gets the stream for AnalyserNode)
        if (micPermission === "prompt" || micPermission === "checking") {
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then((stream) => {
                    setMicPermission("granted");
                    attemptStart(stream);
                })
                .catch((err) => {
                    if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
                        setMicPermission("not-found");
                    } else {
                        setMicPermission("denied");
                    }
                    setShowMicModal(true);
                });
        } else {
            // Permission already granted — get a fresh stream for the AnalyserNode
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then((stream) => attemptStart(stream))
                .catch(() => attemptStart()); // If stream fails, start without analyser
        }
    }, [clearSilenceTimer, startSilenceCountdown, startAudioLevelMonitoring, stopAudioAnalysis, micPermission]);

    const stopListening = useCallback(() => {
        clearSilenceTimer();
        stopAudioAnalysis();
        voiceTranscriptRef.current = "";
        if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch { /* ok */ }
        }
        setIsListening(false);
        setVoiceText("");
        setVoicePaused(false);
    }, [clearSilenceTimer]);

    // ─── In-chat business switch handler ────────────────────────────────────

    const switchToBusiness = useCallback((bizId: string) => {
        const biz = businesses.find((b) => b.id === bizId);
        if (!biz || biz.id === activeBusiness.id) return;

        // Save current chat before switching
        chatHistoryRef.current.set(activeBusiness.id, messages);

        // Switch context
        setActiveBusiness(bizId);

        // Load or create history for new business
        const saved = chatHistoryRef.current.get(bizId);
        const baseHistory = saved && saved.length > 0 ? saved : getInitialMessages(biz);

        // Add a context-switch system message + greeting
        const switchMsg: Message = {
            id: Date.now(),
            role: "system",
            content: `Switched to ${biz.name} \u2022 ${biz.industry} \u2022 KB: ${biz.kbStatus === "trained" ? "Trained \u2705" : biz.kbStatus === "training" ? "Training\u2026" : "Empty"}`,
            timestamp: timeNow(),
        };

        const greeting: Message = {
            id: Date.now() + 1,
            role: "ai",
            model: "gpt-4o",
            content: `\ud83d\udd04 Switched to **${biz.name}** (${biz.industry}).\n\n` +
                `I\u2019m now using **${biz.name}\u2019s Knowledge Base** \u2014 all my responses, ad copy, and insights are based on this account\u2019s data, brand voice, and campaign history.\n\n` +
                `What would you like to do for **${biz.name}**?`,
            timestamp: timeNow(),
            actions: [
                { label: "Show my stats", type: "primary" },
                { label: "Create new ads", type: "secondary" },
                { label: "Find money leaks", type: "secondary" },
            ],
        };

        setMessages([...baseHistory, switchMsg, greeting]);
        setIsTyping(false);
    }, [businesses, activeBusiness, messages, setActiveBusiness]);

    // ─── Call Real AI API ───────────────────────────────────────────────────

    const callAI = useCallback(async (message: string, chatHistory: Message[]) => {
        try {
            const res = await authFetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message,
                    businessName: activeBusiness.name,
                    businessIndustry: activeBusiness.industry,
                    businessServices: activeBusiness.services,
                    businessLocation: activeBusiness.location,
                    context: activeBusiness.shortDesc,
                    history: chatHistory
                        .filter((m) => m.role === "ai" || m.role === "user")
                        .slice(-10)
                        .map((m) => ({
                            role: m.role === "ai" ? "assistant" : "user",
                            content: m.content,
                        })),
                }),
            });
            if (!res.ok) throw new Error(`API error: ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error("AI call failed:", err);
            return null;
        }
    }, [activeBusiness]);

    // ─── Send Message ───────────────────────────────────────────────────────

    const sendMessage = useCallback((text: string) => {
        if (!text.trim() || isTyping) return;

        const userMsg: Message = {
            id: Date.now(),
            role: "user",
            content: text,
            timestamp: timeNow(),
        };

        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setIsTyping(true);

        // ── Handle dynamic confirmation buttons ──────────────
        const yesSwitch = text.match(/^Yes, switch to (.+)$/i);
        if (yesSwitch) {
            const targetName = yesSwitch[1].trim();
            const targetBiz = businesses.find(b => b.name.toLowerCase() === targetName.toLowerCase());
            if (targetBiz) {
                setTimeout(() => switchToBusiness(targetBiz.id), 800);
                return;
            }
        }
        if (/^No, stay on /i.test(text)) {
            const stayResp: Omit<Message, "id"> = {
                role: "ai",
                model: "gpt-4o",
                content: `\uD83D\uDC4D Staying on **${activeBusiness.name}**. What would you like me to do?`,
                timestamp: timeNow(),
                actions: [
                    { label: "Show my stats", type: "primary" },
                    { label: "Create new ads", type: "secondary" },
                    { label: "Find money leaks", type: "secondary" },
                ],
            };
            setTimeout(() => {
                const divider: Message = { id: Date.now() + 1, role: "divider", content: "", timestamp: `${dateNow()} \u2022 ${timeNow()}` };
                setMessages((prev) => [...prev, divider, { ...stayResp, id: Date.now() + 2 } as Message]);
                setIsTyping(false);
            }, 800);
            return;
        }

        // ── Check for account switch intent first ──────────────
        const intent = matchIntent(text);

        if (intent.intent === "switch_account") {
            const target = intent.params.target?.toLowerCase() || "";

            // Try to find a matching business by name
            let matchedBiz = businesses.find((b) => {
                const name = b.name.toLowerCase();
                return target && (name.includes(target) || target.includes(name.replace(/[^\w\s]/g, "").split(/\s+/).filter((w: string) => w.length > 2).join(" ")));
            });

            // Also check for partial keyword matches (e.g., "plumbing", "sushi", "fashion")
            if (!matchedBiz && target) {
                matchedBiz = businesses.find((b) => {
                    return b.services.some((s) => target.includes(s.toLowerCase())) ||
                           b.industry.toLowerCase().split(/\s|\//).some((w) => w.length > 2 && target.includes(w));
                });
            }

            if (matchedBiz && matchedBiz.id !== activeBusiness.id) {
                // Direct switch to the named business
                setTimeout(() => {
                    switchToBusiness(matchedBiz!.id);
                }, 800);
                return;
            }

            if (matchedBiz && matchedBiz.id === activeBusiness.id) {
                // Already on that account
                const response: Omit<Message, "id"> = {
                    role: "ai",
                    model: "gpt-4o",
                    content: `You\u2019re already managing **${activeBusiness.name}** (${activeBusiness.industry}). I\u2019m using this account\u2019s Knowledge Base and campaign history.\n\nWhat would you like to do?`,
                    timestamp: timeNow(),
                    actions: [
                        { label: "Show my stats", type: "primary" },
                        { label: "Create new ads", type: "secondary" },
                    ],
                };
                setTimeout(() => {
                    setMessages((prev) => [...prev, { ...response, id: Date.now() + 2 } as Message]);
                    setIsTyping(false);
                }, 800);
                return;
            }

            // No specific business named + more than one business → ask which one
            if (businesses.length > 1) {
                const bizList = businesses
                    .map((b, i) => `**${i + 1}.** ${b.name} \u2014 ${b.industry}${b.id === activeBusiness.id ? " *(current)*" : ""}`)
                    .join("\n");

                const response: Omit<Message, "id"> = {
                    role: "ai",
                    model: "gpt-4o",
                    content: `Sure! Which ad account would you like me to check on? Here are your accounts:\n\n${bizList}\n\nJust click one below or tell me the name.`,
                    timestamp: timeNow(),
                    actions: businesses
                        .filter((b) => b.id !== activeBusiness.id)
                        .slice(0, 4)
                        .map((b) => ({
                            label: `Switch to ${b.name}`,
                            type: "secondary" as const,
                        })),
                };
                setTimeout(() => {
                    setMessages((prev) => [...prev, { ...response, id: Date.now() + 2 } as Message]);
                    setIsTyping(false);
                }, 1000);
                return;
            }

            // Only 1 business — nothing to switch to
            const response: Omit<Message, "id"> = {
                role: "ai",
                model: "gpt-4o",
                content: `You only have one ad account: **${activeBusiness.name}** (${activeBusiness.industry}). I\u2019m already using this account\u2019s data and Knowledge Base.\n\nNeed to add another business? Go to **Knowledge Base** in the sidebar.`,
                timestamp: timeNow(),
                actions: [
                    { label: "Show my stats", type: "primary" },
                    { label: "Create new ads", type: "secondary" },
                ],
            };
            setTimeout(() => {
                setMessages((prev) => [...prev, { ...response, id: Date.now() + 2 } as Message]);
                setIsTyping(false);
            }, 800);
            return;
        }

        // ── Cross-account portfolio query ──────────────────────────
        if (intent.intent === "cross_account_query") {
            const spendData = [295, 412, 187, 340, 265];
            const ctrData = [7.99, 6.2, 8.4, 5.8, 9.1];
            const callsData = [18, 24, 12, 15, 21];

            const portfolioLines = businesses.map((b, i) => {
                const spend = spendData[i % 5];
                const ctr = ctrData[i % 5];
                const calls = callsData[i % 5];
                const isCurrent = b.id === activeBusiness.id;
                return `**${i + 1}. ${b.name}** \u2014 ${b.industry}\n` +
                    `\u2003\uD83D\uDCB0 $${spend}/wk \u00B7 \uD83D\uDCDE ${calls} calls \u00B7 \uD83D\uDCCA ${ctr}% CTR${isCurrent ? " *(\u2190 currently managing)*" : ""}`;
            });

            const totalSpend = businesses.reduce((sum, _, i) => sum + spendData[i % 5], 0);
            const totalCalls = businesses.reduce((sum, _, i) => sum + callsData[i % 5], 0);

            const portfolioResp: Omit<Message, "id"> = {
                role: "ai",
                model: "gpt-4o",
                content: `\uD83C\uDFE2 **Portfolio Overview \u2014 All Ad Accounts**\n\n` +
                    `You have **${businesses.length} ad accounts** connected to AdMaster Pro:\n\n` +
                    portfolioLines.join("\n\n") + "\n\n" +
                    `\u2500\u2500\u2500\n\n` +
                    `**Portfolio Totals (7 days):** $${totalSpend.toLocaleString()} spent \u00B7 ${totalCalls} calls \u00B7 ${(6.5 + Math.random()).toFixed(1)}% avg CTR\n\n` +
                    `I\u2019m currently managing **${activeBusiness.name}**. Want me to switch to another account or dive deeper into any of these?`,
                timestamp: timeNow(),
                stats: [
                    { label: "Accounts", value: String(businesses.length), change: "All Active", trend: "up" },
                    { label: "Total Spend", value: `$${totalSpend.toLocaleString()}`, change: "This week", trend: "neutral" },
                    { label: "Total Calls", value: String(totalCalls), change: "Combined", trend: "up" },
                ],
                actions: [
                    ...businesses
                        .filter(b => b.id !== activeBusiness.id)
                        .slice(0, 3)
                        .map(b => ({ label: `Switch to ${b.name}`, type: "secondary" as const })),
                    { label: "Show my stats", type: "primary" as const },
                ],
            };

            setTimeout(() => {
                const divider: Message = { id: Date.now() + 1, role: "divider", content: "", timestamp: `${dateNow()} \u2022 ${timeNow()}` };
                setMessages((prev) => [...prev, divider, { ...portfolioResp, id: Date.now() + 2 } as Message]);
                setIsTyping(false);
            }, 1200);
            return;
        }

        // ── Cross-account detection & smart confirmation ────────────────
        const offTopicBiz = getOffTopicBusiness(text);
        let response: Omit<Message, "id">;

        if (offTopicBiz) {
            // Smart confirmation \u2014 offer to switch instead of blocking
            const actionMap: Record<string, string> = {
                create_text_ads: "create text ads",
                create_display_ads: "create display ads",
                show_stats: "check performance stats",
                find_leaks: "find money leaks",
                check_competitors: "analyze competitors",
                pause_keywords: "pause keywords",
                go_live: "publish ads",
                export_report: "export a report",
                add_keywords: "manage keywords",
                show_drafts: "review drafts",
                change_text: "edit ad text",
                move_image: "reposition images",
                add_image: "add images",
            };
            const actionLabel = actionMap[intent.intent] || "work on that";

            response = {
                role: "ai",
                model: "gpt-4o",
                content: `\uD83E\uDD14 Just to confirm \u2014 it sounds like you want me to **${actionLabel}** for **${offTopicBiz.name}** (${offTopicBiz.industry}).\n\n` +
                    `I\u2019m currently managing **${activeBusiness.name}**. I\u2019ll need to switch accounts first so I can use **${offTopicBiz.name}\u2019s** Knowledge Base, campaign data, and brand voice.\n\n` +
                    `Want me to switch over?`,
                timestamp: timeNow(),
                actions: [
                    { label: `Yes, switch to ${offTopicBiz.name}`, type: "primary" },
                    { label: `No, stay on ${activeBusiness.name}`, type: "secondary" },
                ],
            };
        } else {
            // Check exact match bank first, then NLP intent
            const exactMatchBank = getExactMatchBank(activeBusiness);
            const exactMatch = exactMatchBank[text];

            if (exactMatch) {
                response = exactMatch();
            } else if (intent.intent === "go_live") {
                // High-impact action \u2014 confirm before going live
                response = {
                    role: "ai",
                    model: "gpt-4o",
                    content: `\u26A1 Just to confirm \u2014 you\u2019d like me to **push your approved ads live** for **${activeBusiness.name}**?\n\n` +
                        `This will:\n` +
                        `\u2022 Publish approved drafts to Google Search & Display Network\n` +
                        `\u2022 Start spending your daily budget\n` +
                        `\u2022 Enable conversion tracking\n\n` +
                        `Once live, your ads will start showing to potential customers immediately. Ready to go?`,
                    timestamp: timeNow(),
                    actions: [
                        { label: "Yes, go live!", type: "primary" },
                        { label: "Let me review drafts first", type: "secondary" },
                        { label: "No, not yet", type: "secondary" },
                    ],
                };
            } else if (intent.intent === "unknown") {
                // ── Route to real AI API for general / free-form queries ──
                callAI(text, messages).then((aiResult) => {
                    const aiResponse: Message = {
                        id: Date.now() + 2,
                        role: "ai",
                        model: (aiResult?.model as LLMModel) || "gpt-4o",
                        content: aiResult?.content || "Hmm, something went sideways. Give it another shot?",
                        timestamp: timeNow(),
                    };
                    const divider: Message = {
                        id: Date.now() + 1,
                        role: "divider",
                        content: "",
                        timestamp: `${dateNow()} \u2022 ${timeNow()}`,
                    };
                    setMessages((prev) => [...prev, divider, aiResponse]);
                    setIsTyping(false);
                });
                return;
            } else {
                response = generateResponse(intent, text, activeBusiness);
            }
        }

        // Simulate AI processing (multi-step for agentic feel) 
        const baseDelay = 1200;
        const extraDelay = response.ads ? 800 : response.taskSummary ? 600 : 400;
        const delay = baseDelay + Math.random() * extraDelay;

        setTimeout(() => {
            // Add divider before AI response for visual separation
            const divider: Message = {
                id: Date.now() + 1,
                role: "divider",
                content: "",
                timestamp: `${dateNow()} \u2022 ${timeNow()}`,
            };

            const aiMsg: Message = {
                ...response,
                id: Date.now() + 2,
            } as Message;

            setMessages((prev) => [...prev, divider, aiMsg]);
            setIsTyping(false);
        }, delay);
    }, [isTyping, activeBusiness, businesses, getOffTopicBusiness, switchToBusiness, callAI, messages]);

    // Keep ref in sync so startListening can call sendMessage via ref
    useEffect(() => {
        sendMessageRef.current = sendMessage;
    }, [sendMessage]);

    const handleCopy = (id: number, content: string) => {
        navigator.clipboard.writeText(content.replace(/\*\*/g, ""));
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleClear = () => {
        setMessages(getInitialMessages(activeBusiness));
    };

    // ─── Render Helpers ─────────────────────────────────────────────────────

    const renderMarkdown = (text: string) => {
        return text.split("\n").map((line, i) => (
            <span key={i}>
                {line.split(/(\*\*[^*]+\*\*)/).map((part, j) =>
                    part.startsWith("**") && part.endsWith("**") ? (
                        <strong key={j} className="font-semibold">{part.slice(2, -2)}</strong>
                    ) : part.includes("[") && part.includes("](/") ? (
                        <span key={j}>
                            {part.split(/(\[[^\]]+\]\([^)]+\))/).map((seg, k) => {
                                const linkMatch = seg.match(/\[([^\]]+)\]\(([^)]+)\)/);
                                if (linkMatch) {
                                    return <a key={k} href={linkMatch[2]} className="text-primary underline hover:text-primary-dark">{linkMatch[1]}</a>;
                                }
                                return <span key={k}>{seg}</span>;
                            })}
                        </span>
                    ) : (
                        <span key={j}>{part}</span>
                    )
                )}
                {i < text.split("\n").length - 1 && <br />}
            </span>
        ));
    };

    const renderAdPreview = (ad: AdPreview, index: number) => {
        if (ad.type === "text") {
            return (
                <div key={index} className="bg-white border border-blue-200 rounded-lg p-3 mt-2 shadow-sm">
                    <div className="flex items-center gap-1.5 mb-1.5">
                        <FileText className="w-3 h-3 text-blue-600" />
                        <span className="text-[10px] font-medium text-blue-600 uppercase tracking-wide">Text Ad</span>
                    </div>
                    <div className="text-sm text-blue-700 font-medium leading-tight">
                        {ad.headline1} | {ad.headline2}
                    </div>
                    <div className="text-[11px] text-emerald-600 mt-0.5">{ad.displayUrl}</div>
                    <div className="text-xs text-gray-600 mt-1 leading-relaxed">{ad.description}</div>
                </div>
            );
        }

        // Display ad
        return (
            <div key={index} className="bg-white border border-orange-200 rounded-lg overflow-hidden mt-2 shadow-sm">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 border-b border-orange-100">
                    <Image className="w-3 h-3 text-orange-600" />
                    <span className="text-[10px] font-medium text-orange-600 uppercase tracking-wide">Display Ad</span>
                    {ad.dimensions && <span className="text-[10px] text-orange-400 ml-auto">{ad.format} ({ad.dimensions})</span>}
                </div>
                <div className={`relative h-28 ${!ad.imageUrl ? `bg-gradient-to-r ${ad.previewBg || "from-gray-400 to-gray-500"}` : ""}`}>
                    {ad.imageUrl && (
                        <img src={ad.imageUrl} alt={ad.title || ""} className="absolute inset-0 w-full h-full object-cover" />
                    )}
                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center p-3">
                        <div className="text-white font-bold text-sm text-center drop-shadow-lg leading-tight">
                            {ad.overlayText || ad.title}
                        </div>
                        {ad.ctaText && (
                            <div className="mt-2 px-3 py-1 bg-white/90 text-gray-900 text-[11px] font-semibold rounded-full">
                                {ad.ctaText}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderStatsCards = (stats: StatsCard[]) => (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
            {stats.map((stat, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-lg p-2.5 text-center shadow-sm">
                    <div className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">{stat.label}</div>
                    <div className="text-lg font-bold mt-0.5">{stat.value}</div>
                    {stat.change && (
                        <div className={`text-[10px] font-medium mt-0.5 ${stat.trend === "up" ? "text-emerald-600" :
                                stat.trend === "down" ? "text-red-500" :
                                    "text-gray-400"
                            }`}>
                            {stat.trend === "up" ? "\u25b2 " : stat.trend === "down" ? "\u25bc " : ""}{stat.change}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );

    const renderTaskSummary = (task: { done: string[]; pending?: string[] }) => (
        <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
            <div className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                <Wand2 className="w-3 h-3" /> Actions Taken
            </div>
            {task.done.map((item, i) => (
                <div key={i} className="flex items-start gap-1.5 text-xs text-emerald-800 mt-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{item}</span>
                </div>
            ))}
            {task.pending && task.pending.length > 0 && (
                <>
                    <div className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide mt-2 mb-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Awaiting Your Approval
                    </div>
                    {task.pending.map((item, i) => (
                        <div key={i} className="flex items-start gap-1.5 text-xs text-amber-800 mt-1">
                            <ChevronRight className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                            <span>{item}</span>
                        </div>
                    ))}
                </>
            )}
        </div>
    );

    // ─── Render ─────────────────────────────────────────────────────────────

    return (
        <div className="max-w-3xl mx-auto flex flex-col h-chat">
            {/* Mic permission / unsupported / not-found modal */}
            {showMicModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowMicModal(false)}>
                    <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 max-w-sm w-full shadow-xl space-y-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {micPermission === "unsupported" ? (
                                    <Globe className="w-5 h-5 text-amber-500" />
                                ) : micPermission === "not-found" ? (
                                    <Volume2 className="w-5 h-5 text-amber-500" />
                                ) : (
                                    <AlertCircle className="w-5 h-5 text-danger" />
                                )}
                                <h3 className="font-semibold text-sm">
                                    {micPermission === "unsupported" ? "Voice Not Available"
                                        : micPermission === "not-found" ? "No Microphone Found"
                                            : "Microphone Blocked"}
                                </h3>
                            </div>
                            <button onClick={() => setShowMicModal(false)} className="p-1 text-muted hover:text-foreground transition touch-compact">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {micPermission === "unsupported" ? (
                            <div className="space-y-3">
                                <p className="text-sm text-muted leading-relaxed">
                                    {browserRef.current === "firefox"
                                        ? "Firefox doesn\u2019t support the Web Speech Recognition API. Voice input requires Chrome, Edge, or Safari."
                                        : "Your browser doesn\u2019t support voice input. Try Chrome, Edge, or Safari for the best experience."}
                                </p>
                                <div className="bg-sidebar rounded-lg p-3 text-xs text-muted flex items-start gap-2">
                                    <Settings className="w-4 h-4 shrink-0 mt-0.5" />
                                    <span>You can still type your commands in the text box below.</span>
                                </div>
                            </div>
                        ) : micPermission === "not-found" ? (
                            <div className="space-y-3">
                                <p className="text-sm text-muted leading-relaxed">
                                    No microphone was detected on this device. Please connect a microphone or headset and try again.
                                </p>
                                <div className="bg-sidebar rounded-lg p-3 text-xs text-muted flex items-start gap-2">
                                    <Smartphone className="w-4 h-4 shrink-0 mt-0.5" />
                                    <span>
                                        {platformRef.current === "ios" || platformRef.current === "android"
                                            ? "Make sure your phone\u2019s microphone isn\u2019t being used by another app."
                                            : "Check that your microphone is plugged in and selected as the input device in System Preferences."}
                                    </span>
                                </div>
                                <button
                                    onClick={async () => {
                                        try {
                                            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                                            stream.getTracks().forEach(t => t.stop());
                                            setMicPermission("granted");
                                            setShowMicModal(false);
                                        } catch (err: any) {
                                            if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
                                                // Still no mic
                                            } else {
                                                setMicPermission("denied");
                                            }
                                        }
                                    }}
                                    className="w-full bg-primary text-white text-sm font-medium py-3 rounded-xl hover:bg-primary-dark transition flex items-center justify-center gap-2"
                                >
                                    <Mic className="w-4 h-4" />
                                    Try Again
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <p className="text-sm text-muted leading-relaxed">
                                    Microphone access was denied. Follow these steps to enable it:
                                </p>
                                {(() => {
                                    const info = getMicInstructions(browserRef.current, platformRef.current);
                                    return (
                                        <>
                                            <div className="bg-sidebar rounded-lg p-3 space-y-2">
                                                {info.steps.map((step, i) => (
                                                    <div key={i} className="flex items-start gap-2 text-xs text-foreground leading-relaxed">
                                                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                                            {i + 1}
                                                        </span>
                                                        <span>{step}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            {info.note && (
                                                <p className="text-[11px] text-muted italic px-1">{info.note}</p>
                                            )}
                                        </>
                                    );
                                })()}
                                <button
                                    onClick={async () => {
                                        try {
                                            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                                            stream.getTracks().forEach(t => t.stop());
                                            setMicPermission("granted");
                                            setShowMicModal(false);
                                        } catch {
                                            // Still denied — instructions remain
                                        }
                                    }}
                                    className="w-full bg-primary text-white text-sm font-medium py-3 rounded-xl hover:bg-primary-dark transition flex items-center justify-center gap-2"
                                >
                                    <Mic className="w-4 h-4" />
                                    Grant Microphone Access
                                </button>
                                {platformRef.current !== "desktop" && (
                                    <p className="text-[10px] text-muted text-center">
                                        You may need to reload this page after changing settings
                                    </p>
                                )}
                            </div>
                        )}

                        <button
                            onClick={() => setShowMicModal(false)}
                            className="w-full text-xs text-muted py-2 hover:text-foreground transition"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Chat header */}
            <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <img src="https://api.dicebear.com/9.x/bottts-neutral/svg?seed=AdMasterAI&backgroundColor=4f46e5" alt="AI" className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl shadow-lg shadow-primary/20 shrink-0" />
                    <div className="min-w-0">
                        <h1 className="font-semibold text-sm sm:text-base flex items-center gap-1.5 sm:gap-2 flex-wrap">
                            <span className="truncate">AI Assistant</span>
                        </h1>
                        <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-success">
                            <div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse"></div>
                            <span className="truncate">Online &bull; Speak or type &bull; I&apos;ll do the work</span>
                        </div>
                    </div>
                </div>
                <button
                    onClick={handleClear}
                    className="text-xs border border-border rounded-lg px-2 py-1.5 sm:px-2.5 text-muted hover:text-foreground hover:border-primary transition flex items-center gap-1.5 shrink-0"
                >
                    <RotateCcw className="w-3 h-3" />
                    <span className="hidden sm:inline">New Chat</span>
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-auto pb-4 scroll-smooth space-y-1">
                {messages.map((msg) => {
                    // System message
                    if (msg.role === "system") {
                        return (
                            <div key={msg.id} className="flex justify-center py-2">
                                <div className="text-[11px] text-muted bg-sidebar border border-border rounded-full px-3 py-1 flex items-center gap-1.5">
                                    <Cpu className="w-3 h-3" />
                                    {msg.content}
                                </div>
                            </div>
                        );
                    }

                    // Divider / timestamp separator
                    if (msg.role === "divider") {
                        return (
                            <div key={msg.id} className="flex items-center gap-3 py-2">
                                <div className="flex-1 h-px bg-border"></div>
                                <span className="text-[10px] text-muted flex items-center gap-1">
                                    <Clock className="w-2.5 h-2.5" />
                                    {msg.timestamp}
                                </span>
                                <div className="flex-1 h-px bg-border"></div>
                            </div>
                        );
                    }

                    // User message
                    if (msg.role === "user") {
                        return (
                            <div key={msg.id} className="flex gap-2 sm:gap-3 flex-row-reverse py-2">
                                <img src="https://api.dicebear.com/9.x/thumbs/svg?seed=MikeClient&backgroundColor=e2e8f0" alt="You" className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg shrink-0" />
                                <div className="max-w-[85%] sm:max-w-[80%] text-right">
                                    <div className="bg-primary text-white rounded-xl rounded-tr-sm px-3 sm:px-4 py-2 sm:py-2.5 text-sm leading-relaxed inline-block text-left">
                                        {msg.content}
                                    </div>
                                    <div className="text-[10px] text-muted mt-1">{msg.timestamp}</div>
                                </div>
                            </div>
                        );
                    }

                    // AI message
                    return (
                        <div key={msg.id} className="flex gap-2 sm:gap-3 py-2">
                            <img src="https://api.dicebear.com/9.x/bottts-neutral/svg?seed=AdMasterAI&backgroundColor=4f46e5" alt="AI" className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg shrink-0 shadow-sm" />
                            <div className="max-w-[90%] sm:max-w-[88%] min-w-0">


                                {/* Message content */}
                                <div className="bg-card border border-border rounded-xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed">
                                    {renderMarkdown(msg.content)}
                                </div>

                                {/* Stats cards */}
                                {msg.stats && renderStatsCards(msg.stats)}

                                {/* Ad previews */}
                                {msg.ads && msg.ads.length > 0 && (
                                    <div className="mt-2 space-y-2">
                                        {msg.ads.map((ad, i) => renderAdPreview(ad, i))}
                                    </div>
                                )}

                                {/* Task summary */}
                                {msg.taskSummary && renderTaskSummary(msg.taskSummary)}

                                {/* Actions */}
                                {msg.actions && msg.actions.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {msg.actions.map((action, i) => (
                                            <button
                                                key={i}
                                                onClick={() => sendMessage(action.label)}
                                                disabled={isTyping}
                                                className={`text-xs px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${action.type === "primary"
                                                        ? "bg-primary text-white hover:bg-primary-dark disabled:opacity-50"
                                                        : action.type === "danger"
                                                            ? "bg-danger/10 text-danger hover:bg-danger/20 disabled:opacity-50"
                                                            : "border border-border hover:border-primary text-foreground disabled:opacity-50"
                                                    }`}
                                            >
                                                {action.type === "primary" && <ArrowRight className="w-3 h-3" />}
                                                {action.label}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Footer: timestamp + feedback */}
                                <div className="flex items-center gap-3 mt-2 text-[10px] text-muted">
                                    <span>{msg.timestamp}</span>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => handleCopy(msg.id, msg.content)} className="p-1 hover:text-primary transition" title="Copy">
                                            {copiedId === msg.id ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                                        </button>
                                        <button className="p-1 hover:text-success transition" title="Good"><ThumbsUp className="w-3 h-3" /></button>
                                        <button className="p-1 hover:text-danger transition" title="Bad"><ThumbsDown className="w-3 h-3" /></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* Typing indicator */}
                {isTyping && (
                    <div className="flex gap-3 py-2">
                        <img src="https://api.dicebear.com/9.x/bottts-neutral/svg?seed=AdMasterAI&backgroundColor=4f46e5" alt="AI" className="w-8 h-8 rounded-lg shrink-0" />
                        <div className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3">
                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                            <div className="flex items-center gap-1.5">
                                <Activity className="w-3 h-3 text-primary animate-pulse" />
                                <span className="text-xs text-muted">Working on it...</span>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Voice listening overlay */}
            {isListening && (
                <div className="border border-primary/30 bg-primary/5 rounded-xl px-3 sm:px-4 py-3 mb-3 space-y-2">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="relative shrink-0">
                            <Mic className={`w-5 h-5 ${voicePaused ? "text-amber-500" : "text-primary"}`} />
                            {!voicePaused && <div className="absolute -inset-1 border-2 border-primary/30 rounded-full animate-ping"></div>}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className={`text-xs font-medium ${voicePaused ? "text-amber-600" : "text-primary"}`}>
                                {voicePaused ? "Paused \u2014 will send automatically..." : "Listening..."}
                            </div>
                            <div className="text-sm mt-0.5 truncate">{voiceText || "Speak now..."}</div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                            {voicePaused && voiceTranscriptRef.current.trim() && (
                                <button
                                    onClick={voiceSendNow}
                                    className="text-xs bg-primary/10 text-primary px-2.5 sm:px-3 py-2 rounded-lg hover:bg-primary/20 transition flex items-center gap-1 font-medium"
                                >
                                    <Send className="w-3 h-3" />
                                    <span className="hidden sm:inline">Send</span>
                                </button>
                            )}
                            <button
                                onClick={stopListening}
                                className="text-xs bg-danger/10 text-danger px-2.5 sm:px-3 py-2 rounded-lg hover:bg-danger/20 transition flex items-center gap-1"
                            >
                                <MicOff className="w-3 h-3" />
                                <span className="hidden sm:inline">Cancel</span>
                            </button>
                        </div>
                    </div>
                    {/* Real-time audio level indicator */}
                    {!voicePaused && audioLevel > 0 && (
                        <div className="h-1.5 bg-border rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary rounded-full transition-[width] duration-75 ease-out"
                                style={{ width: `${Math.max(audioLevel * 100, 3)}%` }}
                            />
                        </div>
                    )}
                    {/* Silence countdown bar */}
                    {voicePaused && silenceCountdown > 0 && (
                        <div className="h-1.5 bg-border rounded-full overflow-hidden">
                            <div
                                className="h-full bg-amber-500 rounded-full transition-all duration-100 ease-linear"
                                style={{ width: `${silenceCountdown * 100}%` }}
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Input area */}
            <div className="border-t border-border pt-3 pb-safe space-y-2.5">
                <div className="flex gap-1.5 sm:gap-2">
                    {/* Voice button */}
                    <button
                        onClick={isListening ? stopListening : startListening}
                        disabled={isTyping}
                        className={`p-3 rounded-xl transition flex items-center justify-center shrink-0 ${isListening
                                ? "bg-danger text-white animate-pulse"
                                : micPermission === "denied" || micPermission === "unsupported" || micPermission === "not-found"
                                    ? "bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500"
                                    : "bg-gradient-to-br from-primary to-blue-600 text-white hover:shadow-lg hover:shadow-primary/30 disabled:opacity-50"
                            }`}
                        title={
                            isListening ? "Stop listening"
                                : micPermission === "unsupported" ? "Voice not available in this browser"
                                    : micPermission === "not-found" ? "No microphone found \u2014 tap to fix"
                                        : micPermission === "denied" ? "Microphone blocked \u2014 tap to fix"
                                            : "Speak to AI"
                        }
                    >
                        {isListening ? <MicOff className="w-4 h-4" /> : micPermission === "denied" || micPermission === "not-found" ? <AlertCircle className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>

                    <div className="flex-1 relative min-w-0">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
                            placeholder='Type a command or tap mic...'
                            disabled={isTyping || isListening}
                            className="w-full bg-card border border-border rounded-xl px-3 sm:px-4 py-3 pr-10 sm:pr-12 text-sm focus:outline-none focus:border-primary transition disabled:opacity-50"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                            <button className="p-1.5 text-muted hover:text-primary transition rounded-lg touch-compact" title="Attach file">
                                <Paperclip className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={() => sendMessage(input)}
                        disabled={!input.trim() || isTyping}
                        className="bg-primary hover:bg-primary-dark text-white p-3 rounded-xl transition disabled:opacity-50 shrink-0"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>

                {/* Quick actions — horizontally scrollable on mobile */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
                    {quickActions.map((action) => (
                        <button
                            key={action.label}
                            onClick={() => sendMessage(action.label)}
                            disabled={isTyping}
                            className="text-xs border border-border rounded-lg px-3 py-1.5 text-muted hover:border-primary hover:text-primary transition flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap shrink-0"
                        >
                            <action.icon className="w-3 h-3" />
                            {action.label}
                        </button>
                    ))}
                    <span className="text-[10px] text-muted ml-auto hidden sm:inline whitespace-nowrap">Press mic \ud83c\udf99\ufe0f to speak</span>
                </div>
            </div>
        </div>
    );
}
