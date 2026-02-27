"use client";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import NextImage from "next/image";
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
    Image as ImageIcon,
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
    BookOpen,
    Key,
} from "lucide-react";
import Link from "next/link";
import { useBusiness, type BusinessProfile } from "@/lib/business-context";
import { authFetch } from "@/lib/auth-client";
import { useTranslation } from "@/i18n/context";
import Tooltip from "@/components/Tooltip";
import { AiAvatar, UserAvatar } from "@/components/AiAvatar";
import GoogleAdPreview, { type GoogleAdData } from "@/components/GoogleAdPreview";
import DetailDrawer, { type DetailDrawerData } from "@/components/DetailDrawer";

// ─── Types ──────────────────────────────────────────────────────────────────

type LLMModel = "gpt-4o-mini" | "claude-4.6";

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

interface CompetitorInfo {
    name: string;
    domain?: string;
    keyOverlap?: number;
    estimatedSpend?: string;
    topKeywords?: string[];
    adCopy?: string;
    strengths?: string[];
    weaknesses?: string[];
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
    googleAds?: GoogleAdData[];
    competitors?: CompetitorInfo[];
    /** Track which action buttons the user has already clicked */
    clickedActions?: string[];
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

// ─── Quick Actions (icons only — labels come from t()) ─────────────────────

const quickActionKeys = [
    { key: "chat.quick.stats", icon: BarChart3, needsAds: true },
    { key: "chat.quick.leaks", icon: AlertTriangle, needsAds: true },
    { key: "chat.quick.ads", icon: PenTool, needsAds: false },
    { key: "chat.quick.competitors", icon: Users, needsAds: false },
];

// ─── Intent Deep-Link Map ───────────────────────────────────────────────────

type ChatIntent = "keywords" | "campaigns" | "shopping" | "ads" | "audit" | "budget" | "competitors" | null;

const INTENT_PROMPTS: Record<string, { autoMessage: string; greeting: string }> = {
    keywords: {
        autoMessage: "Research the best keywords for my business. Suggest high-value keywords with match types, estimated search volume, and competition level. Also suggest negative keywords I should block.",
        greeting: "🔍 **Keyword Research Mode** — Let me dig into what your ideal customers are searching for and find the best keywords to target.",
    },
    campaigns: {
        autoMessage: "Help me plan and create a new Google Ads campaign for my business. Walk me through the best campaign type, structure, budget, and targeting.",
        greeting: "🚀 **Campaign Builder Mode** — Let's build a campaign that gets your business in front of the right people.",
    },
    shopping: {
        autoMessage: "Help me set up a Shopping campaign or Performance Max campaign for my products. What do I need and what's the best approach?",
        greeting: "🛍️ **Shopping Campaign Mode** — Let's get your products showing up in Google Shopping results.",
    },
    ads: {
        autoMessage: "Create new ad copy for my business. I need compelling headlines and descriptions for Google Search Ads.",
        greeting: "✍️ **Ad Creation Mode** — Let me write some killer ad copy that gets clicks.",
    },
    audit: {
        autoMessage: "Audit my Google Ads account. Find waste, identify top performers, and suggest optimizations with specific dollar amounts.",
        greeting: "🔎 **Audit Mode** — Let me scan your campaigns for money leaks and quick wins.",
    },
    budget: {
        autoMessage: "Help me optimize my Google Ads budget. Where should I be spending more? Where am I wasting money?",
        greeting: "💰 **Budget Optimizer Mode** — Let me help you get the most bang for your ad spend.",
    },
    competitors: {
        autoMessage: "Analyze my competitors. Who's bidding on similar keywords? What positioning are they using? How can I outperform them?",
        greeting: "🕵️ **Competitor Analysis Mode** — Let me scope out what your competition is doing.",
    },
};

// ─── Location-Aware Greeting Generator ──────────────────────────────────────

const getLocationGreeting = (location: string, name: string): string => {
    const loc = location.toLowerCase();

    // Jamaica / Caribbean
    if (loc.includes("jamaica") || loc.includes("kingston") || loc.includes("montego"))
        return `Wha gwaan, **${name}**! 🇯🇲 Big up yuhself — let's get your ads cooking.`;
    if (loc.includes("trinidad") || loc.includes("tobago"))
        return `Hey **${name}**! Big up yuhself! 🇹🇹 Let's get your ads firing.`;
    if (loc.includes("barbados") || loc.includes("bajan"))
        return `Hey **${name}**! 🇧🇧 Welcome nuh! Let's get your ads poppin'.`;
    if (loc.includes("bahamas") || loc.includes("nassau"))
        return `Hey **${name}**! 🇧🇸 What's up! Let's get those ads working for you.`;

    // US Regional
    if (loc.includes("new york") || loc.includes("brooklyn") || loc.includes("manhattan") || loc.includes("nyc"))
        return `Hey **${name}**! 🗽 Welcome — let's bring some NYC energy to your ads.`;
    if (loc.includes("miami") || loc.includes("fort lauderdale"))
        return `Hey **${name}**! ☀️ Welcome — let's get those ads shining down here in the sunshine.`;
    if (loc.includes("texas") || loc.includes("houston") || loc.includes("dallas") || loc.includes("austin"))
        return `Howdy, **${name}**! 🤠 Let's make your ads as big as Texas.`;
    if (loc.includes("los angeles") || loc.includes("la") || loc.includes("california") || loc.includes("san francisco"))
        return `Hey **${name}**! 🌴 Let's get those ads vibing out here on the West Coast.`;
    if (loc.includes("chicago"))
        return `Hey **${name}**! 🌆 Welcome from the Windy City — let's get your ads moving.`;
    if (loc.includes("atlanta") || loc.includes("georgia"))
        return `Hey **${name}**! 🍑 Welcome from the Peach State — let's boost those ads.`;

    // UK
    if (loc.includes("london") || loc.includes("uk") || loc.includes("united kingdom") || loc.includes("england") || loc.includes("manchester") || loc.includes("birmingham"))
        return `Alright **${name}**! 🇬🇧 Cheers for popping in — let's sort your ads out.`;
    if (loc.includes("scotland") || loc.includes("glasgow") || loc.includes("edinburgh"))
        return `Hiya **${name}**! 🏴󠁧󠁢󠁳󠁣󠁴󠁿 Let's get your ads smashing it.`;

    // Canada
    if (loc.includes("canada") || loc.includes("toronto") || loc.includes("vancouver") || loc.includes("montreal") || loc.includes("ottawa"))
        return `Hey **${name}**, good to see you! 🇨🇦 Let's get your ads rolling, eh?`;

    // Australia / New Zealand
    if (loc.includes("australia") || loc.includes("sydney") || loc.includes("melbourne") || loc.includes("brisbane"))
        return `G'day **${name}**! 🇦🇺 Let's get those ads going, mate.`;
    if (loc.includes("new zealand") || loc.includes("auckland") || loc.includes("wellington"))
        return `Kia ora **${name}**! 🇳🇿 Let's get your ads sorted.`;

    // India
    if (loc.includes("india") || loc.includes("mumbai") || loc.includes("delhi") || loc.includes("bangalore") || loc.includes("hyderabad"))
        return `Namaste **${name}**! 🇮🇳 Welcome — let's get your ads performing.`;

    // Nigeria / West Africa
    if (loc.includes("nigeria") || loc.includes("lagos") || loc.includes("abuja"))
        return `Hey **${name}**! 🇳🇬 How far? Let's get those ads on point.`;
    if (loc.includes("ghana") || loc.includes("accra"))
        return `Hey **${name}**! 🇬🇭 Akwaaba! Let's get your ads doing big things.`;
    if (loc.includes("kenya") || loc.includes("nairobi"))
        return `Sasa **${name}**! 🇰🇪 Let's get your ads moving.`;
    if (loc.includes("south africa") || loc.includes("johannesburg") || loc.includes("cape town"))
        return `Howzit **${name}**! 🇿🇦 Let's get your ads firing.`;

    // Latin America
    if (loc.includes("mexico") || loc.includes("mexico city") || loc.includes("guadalajara"))
        return `¡Qué onda, **${name}**! 🇲🇽 Let's get those ads rockin'.`;
    if (loc.includes("brazil") || loc.includes("são paulo") || loc.includes("rio"))
        return `E aí, **${name}**! 🇧🇷 Let's get your ads going strong.`;

    // Middle East
    if (loc.includes("dubai") || loc.includes("abu dhabi") || loc.includes("uae") || loc.includes("emirates"))
        return `Hey **${name}**! 🇦🇪 Yalla — let's supercharge your ads.`;

    // Default - still warm and friendly
    return `Hey **${name}**! 👋 Great to have you here.`;
};

// ─── Initial Messages (Context-Aware) ───────────────────────────────────────

const getInitialMessages = (
    bizIn: BusinessProfile | null,
    t: (key: string, params?: Record<string, string | number>) => string,
    kbStatus: "empty" | "has-content" = "empty",
    intent: ChatIntent = null,
): Message[] => {
    const biz: BusinessProfile = bizIn || {
        id: "default", name: "My Business", industry: "General", website: null,
        googleAdsId: null, initials: "MB", color: "from-blue-500 to-blue-700",
        services: ["service", "consultation", "support"], location: "your area",
        url: "mybusiness.com", shortDesc: "Professional services",
        competitors: [], brandVoice: "Professional", targetAudience: "Customers",
        geo: "Local", goals: ["Grow"], kbStatus: "empty", setupComplete: false,
    };
    const name = biz.name;
    const location = biz.location || biz.geo || "";
    const greeting = getLocationGreeting(location, name);

    const messages: Message[] = [
        {
            id: 1,
            role: "system",
            content: t("chat.greeting.connected", { name }),
            timestamp: "Session started",
        },
    ];

    // Build the main greeting with context awareness
    let greetingContent = `${greeting} **${t("chat.status")}**\n\n`;

    // Use setupComplete from business profile — not just kbStatus
    // A user who has only done an audit has some KB content but isn't truly set up
    const isSetup = biz.setupComplete && kbStatus === "has-content";

    // ── SETUP NOT COMPLETE: Guide user through getting more business info ──
    if (!isSetup && !intent) {
        if (kbStatus === "has-content") {
            // They have SOME data (e.g. from an audit crawl) but setup isn't complete
            greetingContent += `I'm your personal Google Ads manager. I see we've already scanned your website — great start! To give you the best results, I'd love to learn a bit more about **${name}**.\n\n`;
            greetingContent += `**What kind of business do you run?** Tell me about your main services, your ideal customers, and what makes you different from competitors. The more I know, the better I can target your ads.\n\n`;
            greetingContent += `You can also connect your Google Ads account if you have one — I'll pull in your existing campaigns and show you exactly what's working.`;
        } else {
            greetingContent += `I'm your personal Google Ads manager. Before I can work my magic, I need to learn about your business. Let's get set up — it only takes a couple of minutes.\n\n`;
            greetingContent += `**Just paste your website URL** right here in the chat and I'll scan it to learn about your business. Or tell me about what you do — your services, customers, and goals.\n\n`;
            greetingContent += `If you already have a Google Ads account, you can connect it in **[Settings](/dashboard/settings)** so I can pull in your existing campaigns.`;
        }

        const actions: { label: string; type: "primary" | "secondary" | "danger" }[] = kbStatus === "has-content"
            ? [
                { label: "📝 Tell you about my business", type: "primary" },
                { label: "🔗 Connect Google Ads", type: "secondary" },
                { label: "What can you do for me?", type: "secondary" },
            ]
            : [
                { label: "🌐 Enter my website URL", type: "primary" },
                { label: "📝 Paste or type my business info", type: "secondary" },
                { label: "🔗 Connect Google Ads", type: "secondary" },
            ];

        messages.push({
            id: 2,
            role: "ai",
            model: "gpt-4o-mini",
            content: greetingContent,
            timestamp: timeNow(),
            actions,
        });

        return messages;
    }

    // ── SETUP COMPLETE or intent-specific greeting ──

    // If there's an intent from another page, acknowledge it
    if (intent && INTENT_PROMPTS[intent]) {
        greetingContent += `${INTENT_PROMPTS[intent].greeting}\n\n`;
    }

    // KB awareness
    if (kbStatus === "empty") {
        greetingContent += `⚠️ **Quick heads up** — your Knowledge Base is empty right now, so I'm working with limited info about **${name}**. `;
        greetingContent += `The more I know about your business, the better I can target your ads.\n\n`;
        greetingContent += `You can paste your website URL or business details right here in the chat, or go to **[Knowledge Base](/dashboard/knowledge-base)** to upload files.\n\n`;

        if (!intent) {
            greetingContent += `What would you like to start with?`;
        }
    } else {
        if (!intent) {
            greetingContent += `I've loaded your Knowledge Base and I'm up to speed on **${name}**. ${t("chat.greeting.actions")}`;
        } else {
            greetingContent += `I've loaded your Knowledge Base — let's put it to work.`;
        }
    }

    // Build actions based on intent
    let actions: { label: string; type: "primary" | "secondary" | "danger" }[];
    if (intent === "keywords") {
        actions = [
            { label: "Find my best keywords", type: "primary" },
            { label: "Show trending searches in my industry", type: "secondary" },
            { label: "Suggest negative keywords", type: "secondary" },
        ];
    } else if (intent === "campaigns") {
        actions = [
            { label: "Create a new campaign", type: "primary" },
            { label: "What campaign type is best for me?", type: "secondary" },
            { label: "Show my stats", type: "secondary" },
        ];
    } else if (intent === "shopping") {
        actions = [
            { label: "Set up a Shopping campaign", type: "primary" },
            { label: "What do I need for Shopping ads?", type: "secondary" },
            { label: "Performance Max vs Standard Shopping", type: "secondary" },
        ];
    } else if (!isSetup) {
        // Setup not complete but has intent — show intent actions + setup nudge
        actions = [
            { label: "📝 Tell you about my business", type: "primary" },
            { label: "🌐 Enter my website URL", type: "secondary" },
            { label: "🔗 Connect Google Ads", type: "secondary" },
        ];
    } else {
        actions = [
            { label: t("chat.quick.competitors"), type: "secondary" },
            { label: t("chat.quick.ads"), type: "secondary" },
            { label: t("chat.quick.whatElse"), type: "secondary" },
        ];
    }

    messages.push({
        id: 2,
        role: "ai",
        model: "gpt-4o-mini",
        content: greetingContent,
        timestamp: timeNow(),
        actions,
    });

    return messages;
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

const AD_MOOD_LABELS = [
    "Energetic & bold",
    "Urgency & scarcity",
    "Friendly & trustworthy",
    "Premium & luxury",
    "Fun & playful",
    "Data-driven & professional",
] as const;

const AD_MOOD_OPTIONS: { label: string; type: "primary" | "secondary" }[] =
    AD_MOOD_LABELS.map((l) => ({ label: l, type: "secondary" as const }));

const AD_MOOD_SET = new Set<string>(AD_MOOD_LABELS);

function ChatPageInner() {
    const { activeBusiness, businesses, setActiveBusiness } = useBusiness();
    const { t, locale } = useTranslation();
    const searchParams = useSearchParams();
    const router = useRouter();
    const intentParam = searchParams.get("intent") as ChatIntent;
    // getOffTopicBusiness was removed — keep stable callback to avoid hook churn
    const getOffTopicBusiness = useCallback((_text: string): BusinessProfile | null => null, []);
    const chatHistoryRef = useRef<Map<string, Message[]>>(new Map());
    const [messages, setMessages] = useState<Message[]>(() => getInitialMessages(activeBusiness, t));
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
    const sendMessageRef = useRef<(text: string) => void>(() => { });
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
    const [kbContext, setKbContext] = useState<string>("");
    const [kbLoaded, setKbLoaded] = useState(false);
    const intentHandled = useRef(false);
    const [drawerData, setDrawerData] = useState<DetailDrawerData | null>(null);
    /** Track which action labels the user has already clicked in the session */
    const clickedActionsRef = useRef<Set<string>>(new Set());

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
                setMessages(getInitialMessages(activeBusiness, t, kbContext ? "has-content" : "empty"));
            }
            setInput("");
            setIsTyping(false);
            setKbLoaded(false);
            intentHandled.current = false;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeBusiness]);

    // Load knowledge base items for context injection
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await authFetch(`/api/knowledge-base?businessId=${activeBusiness.id}`);
                if (!res.ok || cancelled) return;
                const data = await res.json();
                const items = data.items || [];
                // Build context string from KB items (limit to ~8000 chars)
                const parts: string[] = [];
                let total = 0;
                for (const item of items) {
                    if (!item.content || total > 8000) break;
                    const snippet = item.content.slice(0, 2000);
                    parts.push(`[${item.type}: ${item.title}]\n${snippet}`);
                    total += snippet.length;
                }
                if (!cancelled) {
                    const ctx = parts.join("\n\n---\n\n");
                    setKbContext(ctx);
                    const hasContent = items.length > 0 && total > 0;
                    setKbLoaded(true);
                    // Rebuild initial messages with KB awareness + intent
                    setMessages(prev => {
                        // Only update if we're still on the initial greeting (haven't chatted yet)
                        if (prev.length <= 2 && prev[0]?.id === 1) {
                            return getInitialMessages(
                                activeBusiness, t,
                                hasContent ? "has-content" : "empty",
                                intentParam,
                            );
                        }
                        return prev;
                    });
                }
            } catch { if (!cancelled) { setKbLoaded(true); } }
        })();
        return () => { cancelled = true; };
    }, [activeBusiness.id, activeBusiness, t, intentParam]);

    // Auto-send intent message after KB is loaded
    useEffect(() => {
        if (!kbLoaded || !intentParam || intentHandled.current) return;
        const prompt = INTENT_PROMPTS[intentParam];
        if (!prompt) return;

        intentHandled.current = true;

        // Small delay so the greeting renders first
        const timer = setTimeout(() => {
            sendMessageRef.current(prompt.autoMessage);
            // Clean the URL without triggering navigation
            router.replace("/dashboard/chat", { scroll: false });
        }, 1200);

        return () => clearTimeout(timer);
    }, [kbLoaded, intentParam, router]);

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

    // Silence detection constants — tuned for noisy environments
    const SILENCE_THRESHOLD = 0.035;   // RMS level below which = silence (raised to filter ambient noise)
    const SILENCE_DURATION = 3500;     // ms of sustained silence → auto-send (longer for better UX)
    const GRACE_PERIOD = 2000;         // ms from start before silence detection kicks in (longer grace)
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
            // Map locale to BCP-47 speech recognition language codes
            const speechLangMap: Record<string, string> = {
                en: "en-US", es: "es-ES", fr: "fr-FR", de: "de-DE",
                it: "it-IT", pt: "pt-PT", nl: "nl-NL", sv: "sv-SE",
                no: "nb-NO", da: "da-DK", fi: "fi-FI", pl: "pl-PL",
            };
            recognition.lang = speechLangMap[locale] || "en-US";

            recognition.onstart = () => {
                setIsListening(true);
                setVoiceText(t("chat.voice.speakNow"));
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
                setVoiceText(display || t("chat.voice.speakNow"));

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
    }, [clearSilenceTimer, startSilenceCountdown, startAudioLevelMonitoring, stopAudioAnalysis, micPermission, locale, t]);

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
    }, [clearSilenceTimer, stopAudioAnalysis]);

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
        const baseHistory = saved && saved.length > 0 ? saved : getInitialMessages(biz, t, "empty");

        // Add a context-switch system message + greeting
        const switchMsg: Message = {
            id: Date.now(),
            role: "system",
            content: t("chat.switchedTo", { name: biz.name }),
            timestamp: timeNow(),
        };

        const greeting: Message = {
            id: Date.now() + 1,
            role: "ai",
            model: "gpt-4o-mini",
            content: `🔄 ${t("chat.switchedTo", { name: biz.name })} (${biz.industry}).\n\n` +
                `${t("chat.switchedUsing", { name: biz.name })}\n\n` +
                `${t("chat.switchedQuestion", { name: biz.name })}`,
            timestamp: timeNow(),
            actions: [
                { label: t("chat.quick.stats"), type: "primary" },
                { label: t("chat.quick.ads"), type: "secondary" },
                { label: t("chat.quick.leaks"), type: "secondary" },
            ],
        };

        setMessages([...baseHistory, switchMsg, greeting]);
        setIsTyping(false);
    }, [businesses, activeBusiness, messages, setActiveBusiness, t]);

    // ─── Call Real AI API ───────────────────────────────────────────────────

    const callAI = useCallback(async (message: string, chatHistory: Message[]) => {
        try {
            // Build full context: shortDesc + KB content
            const contextParts: string[] = [];
            if (activeBusiness.shortDesc) contextParts.push(activeBusiness.shortDesc);
            if (kbContext) contextParts.push("─── KNOWLEDGE BASE ───\n" + kbContext);

            const res = await authFetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message,
                    locale,
                    businessId: activeBusiness.id,
                    businessName: activeBusiness.name,
                    businessIndustry: activeBusiness.industry,
                    businessServices: activeBusiness.services,
                    businessLocation: activeBusiness.location,
                    businessWebsite: activeBusiness.website || activeBusiness.url || undefined,
                    context: contextParts.join("\n\n"),
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
    }, [activeBusiness, locale, kbContext]);

    // ─── Smart Contextual Actions ───────────────────────────────────────────
    // Analyzes the user's message, the AI response content, and the matched intent
    // to suggest intelligent next-step buttons that feel like the AI reads your mind.

    const getSmartActions = (
        userText: string,
        aiContent: string,
        intent: Intent,
        kb: string,
    ): { label: string; type: "primary" | "secondary" | "danger" }[] => {
        const clicked = clickedActionsRef.current;
        const content = aiContent.toLowerCase();
        const hasKb = kb.length > 100;

        // ── After competitor analysis → deeper competitor actions
        if (intent === "check_competitors" || content.includes("competitor") && content.includes("insight")) {
            const actions: { label: string; type: "primary" | "secondary" | "danger" }[] = [];
            if (!clicked.has("Show their likely keywords")) actions.push({ label: "Show their likely keywords", type: "primary" });
            if (!clicked.has("Show their estimated ad copy")) actions.push({ label: "Show their estimated ad copy", type: "secondary" });
            if (!clicked.has("How do I outperform them?")) actions.push({ label: "How do I outperform them?", type: "secondary" });
            if (!clicked.has("Create ads that beat them")) actions.push({ label: "Create ads that beat them", type: "secondary" });
            return actions.slice(0, 4);
        }

        // ── After ad creation / ad copy response → offer mood selection or next steps
        if (intent === "create_text_ads" || intent === "create_display_ads" ||
            content.includes("headlines:") || content.includes("ad variation") || content.includes("responsive search ad")) {
            const actions: { label: string; type: "primary" | "secondary" | "danger" }[] = [];
            if (!clicked.has("Save these as drafts")) actions.push({ label: "Save these as drafts", type: "primary" });
            if (!clicked.has("Show me more variations")) actions.push({ label: "Show me more variations", type: "secondary" });
            if (!clicked.has("Change the mood/tone")) actions.push({ label: "Change the mood/tone", type: "secondary" });
            if (!clicked.has("Check competitors' ads")) actions.push({ label: "Check competitors' ads", type: "secondary" });
            return actions.slice(0, 4);
        }

        // ── User wants to change mood/tone → show mood picker buttons
        if (/mood|tone|style|vibe|energy/i.test(userText)) {
            return AD_MOOD_OPTIONS.slice(0, 6);
        }

        // ── After keyword research → deeper keyword actions
        if (intent === "add_keywords" || content.includes("keyword") && (content.includes("volume") || content.includes("match type"))) {
            const actions: { label: string; type: "primary" | "secondary" | "danger" }[] = [];
            if (!clicked.has("Add these to my campaign")) actions.push({ label: "Add these to my campaign", type: "primary" });
            if (!clicked.has("Show negative keywords to block")) actions.push({ label: "Show negative keywords to block", type: "secondary" });
            if (!clicked.has("Create ads using these keywords")) actions.push({ label: "Create ads using these keywords", type: "secondary" });
            return actions.slice(0, 4);
        }

        // ── After showing stats → deeper analysis
        if (intent === "show_stats" || content.includes("click-through") || content.includes("conversion")) {
            const actions: { label: string; type: "primary" | "secondary" | "danger" }[] = [];
            if (!clicked.has("Find money leaks in these campaigns")) actions.push({ label: "Find money leaks in these campaigns", type: "primary" });
            if (!clicked.has("Which keywords are working best?")) actions.push({ label: "Which keywords are working best?", type: "secondary" });
            if (!clicked.has("Suggest budget changes")) actions.push({ label: "Suggest budget changes", type: "secondary" });
            if (!clicked.has("Export this as a report")) actions.push({ label: "Export this as a report", type: "secondary" });
            return actions.slice(0, 4);
        }

        // ── After finding leaks → actionable follow-ups
        if (intent === "find_leaks" || content.includes("wasting") || content.includes("waste") || content.includes("leak")) {
            const actions: { label: string; type: "primary" | "secondary" | "danger" }[] = [];
            if (!clicked.has("Pause the worst performers")) actions.push({ label: "Pause the worst performers", type: "danger" });
            if (!clicked.has("Reallocate budget to winners")) actions.push({ label: "Reallocate budget to winners", type: "primary" });
            if (!clicked.has("Add negative keywords")) actions.push({ label: "Add negative keywords", type: "secondary" });
            if (!clicked.has("Show me the full breakdown")) actions.push({ label: "Show me the full breakdown", type: "secondary" });
            return actions.slice(0, 4);
        }

        // ── After audit → natural next steps
        if (content.includes("audit") || content.includes("score") && content.includes("recommend")) {
            const actions: { label: string; type: "primary" | "secondary" | "danger" }[] = [];
            if (!clicked.has("Fix the top issues now")) actions.push({ label: "Fix the top issues now", type: "primary" });
            if (!clicked.has("Create ads based on audit")) actions.push({ label: "Create ads based on audit", type: "secondary" });
            if (!clicked.has("Research keywords for my industry")) actions.push({ label: "Research keywords for my industry", type: "secondary" });
            return actions.slice(0, 4);
        }

        // ── Default fallback — smart defaults based on setup state
        const isSetupDone = activeBusiness.setupComplete;
        if (!isSetupDone) {
            // Still in setup — nudge toward providing more business info
            return [
                { label: "📝 Tell you about my business", type: "primary" },
                { label: "🌐 Enter my website URL", type: "secondary" },
                { label: "What can you do for me?", type: "secondary" },
            ];
        }
        if (!hasKb) {
            return [
                { label: "📚 Add to Knowledge Base", type: "primary" },
                { label: "Check my competitors", type: "secondary" },
                { label: "Run a website audit", type: "secondary" },
            ];
        }
        return [
            { label: "Create new ads", type: "primary" },
            { label: "Research keywords", type: "secondary" },
            { label: "Check my competitors", type: "secondary" },
        ];
    };

    // ─── Send Message ───────────────────────────────────────────────────────

    const sendMessage = useCallback((text: string) => {
        if (!text.trim() || isTyping) return;

        // ── Handle onboarding / setup actions ──────────────────────
        if (text === "🔗 Connect Google Ads") {
            // Show instruction then redirect to settings
            const aiMsg: Message = {
                id: Date.now() + 1,
                role: "ai",
                model: "gpt-4o-mini",
                content: "Great choice! I'm taking you to the Settings page where you can connect your Google Ads account. Once connected, I'll automatically pull in your campaigns, keywords, and performance data so I can start optimizing.\n\nRedirecting now…",
                timestamp: timeNow(),
            };
            setMessages((prev) => [...prev, { id: Date.now(), role: "user", content: text, timestamp: timeNow() }, aiMsg]);
            setTimeout(() => router.push("/dashboard/settings"), 1500);
            return;
        }
        if (text === "🌐 Enter my website URL") {
            const aiMsg: Message = {
                id: Date.now() + 1,
                role: "ai",
                model: "gpt-4o-mini",
                content: "Perfect! Just paste or type your website URL below (e.g. `yoursite.com`) and I'll scan it to learn about your business — your services, products, pricing, and more.\n\nThis usually takes about 30 seconds.",
                timestamp: timeNow(),
            };
            setMessages((prev) => [...prev, { id: Date.now(), role: "user", content: text, timestamp: timeNow() }, aiMsg]);
            return;
        }
        if (text === "📝 Paste or type my business info" || text === "📝 Tell you about my business") {
            const aiMsg: Message = {
                id: Date.now() + 1,
                role: "ai",
                model: "gpt-4o-mini",
                content: "Sure thing! Just type or paste any of the following and I'll save it to your Knowledge Base:\n\n" +
                    "• **Your services and products** — what you offer\n" +
                    "• **Pricing info** — so I can highlight value in ads\n" +
                    "• **Target audience** — who you want to reach\n" +
                    "• **Unique selling points** — what makes you different\n" +
                    "• **Location / service area** — for geo-targeting\n\n" +
                    "Just start typing — I'll handle the rest!",
                timestamp: timeNow(),
            };
            setMessages((prev) => [...prev, { id: Date.now(), role: "user", content: text, timestamp: timeNow() }, aiMsg]);
            return;
        }

        // ── Detect URL input → auto-crawl and save to KB ──────────
        const urlPattern = /^(https?:\/\/)?([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}(\/\S*)?$/i;
        if (urlPattern.test(text.trim()) && text.trim().length < 200) {
            const url = text.trim();
            const userMsg: Message = { id: Date.now(), role: "user", content: url, timestamp: timeNow() };
            const scanMsg: Message = {
                id: Date.now() + 1,
                role: "ai",
                model: "gpt-4o-mini",
                content: `🔍 Scanning **${url}**… I'm pulling in your website content now. This usually takes 30–60 seconds.`,
                timestamp: timeNow(),
            };
            setMessages((prev) => [...prev, userMsg, scanMsg]);
            setIsTyping(true);
            setInput("");

            // Fire the crawl
            authFetch("/api/crawl", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url, businessId: activeBusiness.id, depth: 3 }),
            })
                .then(async (res) => {
                    if (res.ok) {
                        const data = await res.json();
                        const pageCount = data.pages?.length || data.pagesScanned || 1;
                        const doneMsg: Message = {
                            id: Date.now() + 2,
                            role: "ai",
                            model: "gpt-4o-mini",
                            content: `✅ **Done!** I scanned **${pageCount} page${pageCount > 1 ? "s" : ""}** from your website and saved the content to your Knowledge Base.\n\n` +
                                `I now know about your business, services, and offerings. Here's what I can do next:`,
                            timestamp: timeNow(),
                            actions: [
                                { label: "Create ad copy for my business", type: "primary" },
                                { label: "Find the best keywords", type: "secondary" },
                                { label: "Analyze my competitors", type: "secondary" },
                            ],
                        };
                        setMessages((prev) => [...prev, doneMsg]);
                        // Reload KB context
                        setKbLoaded(false);
                    } else {
                        const err = await res.json().catch(() => ({}));
                        const failMsg: Message = {
                            id: Date.now() + 2,
                            role: "ai",
                            model: "gpt-4o-mini",
                            content: `⚠️ I couldn't scan that website — ${err.error || "the site may be blocking automated requests"}.\n\nYou can:\n• Double-check the URL and try again\n• Paste your business info directly in the chat instead\n• Or go to **[Knowledge Base](/dashboard/knowledge-base)** to upload files`,
                            timestamp: timeNow(),
                            actions: [
                                { label: "📝 Paste or type my business info", type: "primary" },
                                { label: "🔗 Connect Google Ads", type: "secondary" },
                            ],
                        };
                        setMessages((prev) => [...prev, failMsg]);
                    }
                    setIsTyping(false);
                })
                .catch(() => {
                    const errMsg: Message = {
                        id: Date.now() + 2,
                        role: "ai",
                        model: "gpt-4o-mini",
                        content: "⚠️ Something went wrong while scanning. Please try again or paste your business info directly.",
                        timestamp: timeNow(),
                        actions: [
                            { label: "📝 Paste or type my business info", type: "primary" },
                        ],
                    };
                    setMessages((prev) => [...prev, errMsg]);
                    setIsTyping(false);
                });
            return;
        }

        // ── Detect pasted business content (long text, no URL) → save to KB ──
        const isSetupPhase = !activeBusiness.setupComplete;
        const isLongContent = text.trim().length > 120 && !urlPattern.test(text.trim());
        if (isSetupPhase && isLongContent) {
            const userMsg: Message = { id: Date.now(), role: "user", content: text, timestamp: timeNow() };
            const savingMsg: Message = {
                id: Date.now() + 1,
                role: "ai",
                model: "gpt-4o-mini",
                content: "📄 Got it! Let me save this to your Knowledge Base…",
                timestamp: timeNow(),
            };
            setMessages((prev) => [...prev, userMsg, savingMsg]);
            setIsTyping(true);
            setInput("");

            authFetch("/api/knowledge-base", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    businessId: activeBusiness.id,
                    title: "Business Info (from chat)",
                    content: text.trim(),
                    type: "text",
                }),
            })
                .then(async (res) => {
                    if (res.ok) {
                        const doneMsg: Message = {
                            id: Date.now() + 2,
                            role: "ai",
                            model: "gpt-4o-mini",
                            content: "✅ **Saved!** I've added your business info to the Knowledge Base. I'll use this to write more accurate ads and find better keywords.\n\nWhat would you like to do next?",
                            timestamp: timeNow(),
                            actions: [
                                { label: "Create ad copy for my business", type: "primary" },
                                { label: "Find the best keywords", type: "secondary" },
                                { label: "🌐 Enter my website URL", type: "secondary" },
                            ],
                        };
                        setMessages((prev) => [...prev, doneMsg]);
                        setKbLoaded(false);
                    } else {
                        const failMsg: Message = {
                            id: Date.now() + 2,
                            role: "ai",
                            model: "gpt-4o-mini",
                            content: "⚠️ I couldn't save that right now. You can try again or go to **[Knowledge Base](/dashboard/knowledge-base)** to add it manually.",
                            timestamp: timeNow(),
                        };
                        setMessages((prev) => [...prev, failMsg]);
                    }
                    setIsTyping(false);
                })
                .catch(() => {
                    setMessages((prev) => [...prev, {
                        id: Date.now() + 2, role: "ai" as const, model: "gpt-4o-mini" as const,
                        content: "⚠️ Something went wrong saving your content. Please try again.", timestamp: timeNow(),
                    }]);
                    setIsTyping(false);
                });
            return;
        }

        // ── Handle navigation actions (don't send as chat messages) ──
        if (text.includes("Add to Knowledge Base")) {
            router.push("/dashboard/knowledge-base");
            return;
        }
        if (text === "Run a website audit") {
            router.push("/audit");
            return;
        }

        // ── Handle mood/tone selection → rewrite as a proper prompt ──
        if (AD_MOOD_SET.has(text)) {
            const mood = text;
            text = `Create new ad copy for my business with a ${mood} tone. Make the headlines and descriptions feel ${mood.toLowerCase()}.`;
        }

        // ── Handle "Change the mood/tone" → show mood picker as next AI message ──
        if (/change the mood|change.*tone/i.test(text)) {
            const moodMsg: Message = {
                id: Date.now() + 1,
                role: "ai",
                model: "gpt-4o-mini",
                content: "What mood should the ads have? Pick a style and I'll rewrite them:",
                timestamp: timeNow(),
                actions: AD_MOOD_OPTIONS,
            };
            setMessages((prev) => [...prev, { id: Date.now(), role: "user", content: text, timestamp: timeNow() }, moodMsg]);
            return;
        }

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
                model: "gpt-4o-mini",
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
                    model: "gpt-4o-mini",
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
                    model: "gpt-4o-mini",
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
                model: "gpt-4o-mini",
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
            const bizList = businesses.map((b, i) =>
                `${i + 1}. ${b.name} — ${b.industry}${b.id === activeBusiness.id ? " (currently managing)" : ""}`
            ).join("\n");
            const enrichedMsg = `${text}\n\n[Context: The user has ${businesses.length} ad accounts:\n${bizList}\nCurrently managing: ${activeBusiness.name}. Provide a portfolio overview and offer to switch accounts or dive deeper.]`;
            callAI(enrichedMsg, messages).then((aiResult) => {
                const aiResponse: Message = {
                    id: Date.now() + 2,
                    role: "ai",
                    model: (aiResult?.model as LLMModel) || "gpt-4o-mini",
                    content: aiResult?.content || "I couldn\u2019t fetch your portfolio data right now. Please try again.",
                    timestamp: timeNow(),
                    actions: [
                        ...businesses
                            .filter(b => b.id !== activeBusiness.id)
                            .slice(0, 3)
                            .map(b => ({ label: `Switch to ${b.name}`, type: "secondary" as const })),
                        { label: "Show my stats", type: "primary" as const },
                    ],
                };
                const divider: Message = { id: Date.now() + 1, role: "divider", content: "", timestamp: `${dateNow()} \u2022 ${timeNow()}` };
                setMessages((prev) => [...prev, divider, aiResponse]);
                setIsTyping(false);
            });
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
                model: "gpt-4o-mini",
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
            // ── Route ALL intents through real AI API ────────────────────
            // Track the user's action so we don't repeat buttons
            clickedActionsRef.current.add(text);

            // During setup, enrich the prompt so AI nudges toward completing setup
            let enrichedText = text;
            if (!activeBusiness.setupComplete && !kbContext) {
                enrichedText = `${text}\n\n[SYSTEM NOTE: This user has NOT completed setup yet - their Knowledge Base is empty and they haven't connected Google Ads. Answer their question helpfully but briefly, then encourage them to either: (1) paste their website URL so you can scan it, (2) paste/type their business info, or (3) connect their Google Ads account in Settings. Keep it natural, not pushy.]`;
            }

            callAI(enrichedText, messages).then((aiResult) => {
                const aiContent = aiResult?.content || "Hmm, something went sideways. Give it another shot?";

                // ── Smart contextual next-step buttons ──
                // Analyze the AI response + user intent to offer relevant follow-ups
                let smartActions = getSmartActions(text, aiContent, intent.intent, kbContext);

                // During setup, always append setup nudge buttons if not already present
                if (!activeBusiness.setupComplete && !kbContext) {
                    const hasSetupAction = smartActions.some(a =>
                        a.label.includes("website URL") || a.label.includes("Connect Google") || a.label.includes("business info")
                    );
                    if (!hasSetupAction) {
                        smartActions = [
                            ...smartActions.slice(0, 2),
                            { label: "🌐 Enter my website URL", type: "secondary" as const },
                        ];
                    }
                }

                const aiResponse: Message = {
                    id: Date.now() + 2,
                    role: "ai",
                    model: (aiResult?.model as LLMModel) || "gpt-4o-mini",
                    content: aiContent,
                    timestamp: timeNow(),
                    actions: smartActions,
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
        }

        // Simulate AI processing for account-switch confirmation only
        setTimeout(() => {
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
        }, 800);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isTyping, activeBusiness, businesses, getOffTopicBusiness, switchToBusiness, callAI, messages, router, kbContext]);

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
        setMessages(getInitialMessages(activeBusiness, t, kbContext ? "has-content" : "empty"));
        intentHandled.current = false;
    };

    // ─── Render Helpers ─────────────────────────────────────────────────────

    const isSafeHref = (url: string) => /^https?:\/\//i.test(url) || (url.startsWith("/") && !url.startsWith("//"));

    const renderInline = (text: string) => {
        // Handle bold + links within a line
        return text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/).map((part, j) => {
            if (part.startsWith("**") && part.endsWith("**")) {
                return <strong key={j} className="font-semibold">{part.slice(2, -2)}</strong>;
            }
            const linkMatch = part.match(/\[([^\]]+)\]\(([^)]+)\)/);
            if (linkMatch) {
                if (linkMatch[2].startsWith("/")) {
                    // Internal link — use Next.js Link for SPA navigation
                    return <Link key={j} href={linkMatch[2]} className="text-primary underline hover:text-primary-dark font-medium">{linkMatch[1]}</Link>;
                }
                if (isSafeHref(linkMatch[2])) {
                    return <a key={j} href={linkMatch[2]} className="text-primary underline hover:text-primary-dark" rel="noopener noreferrer" target="_blank">{linkMatch[1]}</a>;
                }
                return <span key={j} className="text-primary">{linkMatch[1]}</span>;
            }
            // Inline code
            return <span key={j}>{part.split(/(`[^`]+`)/).map((seg, k) =>
                seg.startsWith("`") && seg.endsWith("`")
                    ? <code key={k} className="bg-muted/50 px-1 py-0.5 rounded text-xs font-mono">{seg.slice(1, -1)}</code>
                    : <span key={k}>{seg}</span>
            )}</span>;
        });
    };

    const renderMarkdown = (text: string) => {
        const lines = text.split("\n");
        const elements: React.ReactNode[] = [];
        let inCodeBlock = false;
        let codeLines: string[] = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Code block toggle
            if (line.trim().startsWith("```")) {
                if (inCodeBlock) {
                    elements.push(
                        <pre key={`code-${i}`} className="bg-muted/60 border border-border rounded-lg p-3 my-2 overflow-x-auto text-xs font-mono leading-relaxed">
                            <code>{codeLines.join("\n")}</code>
                        </pre>
                    );
                    codeLines = [];
                    inCodeBlock = false;
                } else {
                    inCodeBlock = true;
                }
                continue;
            }
            if (inCodeBlock) {
                codeLines.push(line);
                continue;
            }

            // Headings
            const h3Match = line.match(/^###\s+(.+)/);
            if (h3Match) {
                elements.push(<h4 key={i} className="text-sm font-bold mt-3 mb-1">{renderInline(h3Match[1])}</h4>);
                continue;
            }
            const h2Match = line.match(/^##\s+(.+)/);
            if (h2Match) {
                elements.push(<h3 key={i} className="text-base font-bold mt-3 mb-1">{renderInline(h2Match[1])}</h3>);
                continue;
            }
            const h1Match = line.match(/^#\s+(.+)/);
            if (h1Match) {
                elements.push(<h2 key={i} className="text-lg font-bold mt-3 mb-1">{renderInline(h1Match[1])}</h2>);
                continue;
            }

            // Horizontal rule
            if (/^[-*_]{3,}\s*$/.test(line.trim())) {
                elements.push(<hr key={i} className="border-border my-2" />);
                continue;
            }

            // Numbered list
            const numMatch = line.match(/^(\d+)\.\s+(.+)/);
            if (numMatch) {
                elements.push(
                    <div key={i} className="flex gap-2 ml-1 my-0.5">
                        <span className="text-muted font-medium min-w-[1.2em] text-right">{numMatch[1]}.</span>
                        <span className="flex-1">{renderInline(numMatch[2])}</span>
                    </div>
                );
                continue;
            }

            // Bullet list (-, *, •)
            const bulletMatch = line.match(/^[\s]*[-*•]\s+(.+)/);
            if (bulletMatch) {
                elements.push(
                    <div key={i} className="flex gap-2 ml-3 my-0.5">
                        <span className="text-muted">•</span>
                        <span className="flex-1">{renderInline(bulletMatch[1])}</span>
                    </div>
                );
                continue;
            }

            // Empty line
            if (line.trim() === "") {
                elements.push(<div key={i} className="h-2" />);
                continue;
            }

            // Regular paragraph
            elements.push(<span key={i}>{renderInline(line)}{i < lines.length - 1 && <br />}</span>);
        }

        return <>{elements}</>;
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
                    <ImageIcon className="w-3 h-3 text-orange-600" />
                    <span className="text-[10px] font-medium text-orange-600 uppercase tracking-wide">Display Ad</span>
                    {ad.dimensions && <span className="text-[10px] text-orange-400 ml-auto">{ad.format} ({ad.dimensions})</span>}
                </div>
                <div className={`relative h-28 ${!ad.imageUrl ? `bg-gradient-to-r ${ad.previewBg || "from-gray-400 to-gray-500"}` : ""}`}>
                    {ad.imageUrl && (
                        <NextImage
                            src={ad.imageUrl}
                            alt={ad.title || "Display ad image"}
                            fill
                            unoptimized
                            className="absolute inset-0 w-full h-full object-cover"
                        />
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
                                    {micPermission === "unsupported" ? t("chat.voice.notAvailable")
                                        : micPermission === "not-found" ? t("chat.voice.noMic")
                                            : t("chat.voice.blocked")}
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

            {/* Detail drawer */}
            <DetailDrawer data={drawerData} onClose={() => setDrawerData(null)} onAction={(action) => sendMessage(action)} />

            {/* Chat header */}
            <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <AiAvatar size="md" />
                    <div className="min-w-0">
                        <h1 className="font-semibold text-sm sm:text-base flex items-center gap-1.5 sm:gap-2 flex-wrap">
                            <span className="truncate">AI Assistant</span>
                            <Tooltip text="Your AI advertising expert. Ask me to create ads, analyze campaigns, find budget leaks, research competitors, or generate reports." position="bottom" />
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
                                <UserAvatar size="sm" />
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
                            <AiAvatar size="sm" />
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
                        <AiAvatar size="sm" />
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
                            <div className="text-sm mt-0.5 truncate">{voiceText || t("chat.voice.speakNow")}</div>
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
                            placeholder={t("chat.placeholder")}
                            disabled={isTyping || isListening}
                            className="w-full bg-card border border-border rounded-xl px-3 sm:px-4 py-3 pr-10 sm:pr-12 text-sm focus:outline-none focus:border-primary transition disabled:opacity-50"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                            <button className="p-1.5 text-muted hover:text-primary transition rounded-lg touch-compact opacity-50 cursor-not-allowed" title="File attachments coming soon">
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

                {/* Quick actions — only show when setup is complete, since the AI already shows contextual buttons in messages */}
                {activeBusiness.setupComplete && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
                    {quickActionKeys
                        .filter((a) => !a.needsAds || kbContext)
                        .map((action) => (
                            <button
                                key={action.key}
                                onClick={() => sendMessage(t(action.key))}
                                disabled={isTyping}
                                className="text-xs border border-border rounded-lg px-3 py-1.5 text-muted hover:border-primary hover:text-primary transition flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap shrink-0"
                            >
                                <action.icon className="w-3 h-3" />
                                {t(action.key)}
                            </button>
                        ))}
                    <span className="text-[10px] text-muted ml-auto hidden sm:inline whitespace-nowrap">{t("chat.micHint")}</span>
                </div>
                )}
            </div>
        </div>
    );
}

export default function ChatPage() {
    return (
        <Suspense fallback={
            <div className="max-w-3xl mx-auto flex items-center justify-center h-chat">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        }>
            <ChatPageInner />
        </Suspense>
    );
}
