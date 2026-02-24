"use client";

import { useState } from "react";
import Link from "next/link";
import {
    Lightbulb,
    MessageCircle,
    Mic,
    PenTool,
    Image,
    BarChart3,
    AlertTriangle,
    Users,
    Pause,
    Rocket,
    Move,
    Type,
    ArrowRight,
    Sparkles,
    Zap,
    Search,
    Eye,
    type LucideIcon,
} from "lucide-react";

interface Example {
    command: string;
    description: string;
    result: string;
    tags: string[];
}

interface ExampleCategory {
    label: string;
    icon: LucideIcon;
    color: string;
    gradient: string;
    emoji: string;
    description: string;
    examples: Example[];
}

const categories: ExampleCategory[] = [
    {
        label: "Create Text Ads",
        icon: PenTool,
        color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
        gradient: "from-blue-500 to-indigo-500",
        emoji: "\ud83d\udcdd",
        description: "Tell the AI what kind of ads you want and it creates them instantly",
        examples: [
            {
                command: "Create 3 text ads for drain cleaning",
                description: "AI writes 3 Google Search ad variations with headlines, descriptions, and display URLs tailored to your business",
                result: "3 text ad drafts with headlines like 'Drain Cleaning Miami \u2014 Fast Service' saved to Drafts page",
                tags: ["create", "text ads", "drain cleaning"],
            },
            {
                command: "Write ads for my summer sale",
                description: "Generates seasonal promotional ads using your business info from the Knowledge Base",
                result: "3 text ads featuring summer-specific offers, urgency language, and your pricing",
                tags: ["create", "seasonal", "promotion"],
            },
            {
                command: "Make search ads about emergency plumbing",
                description: "Creates urgency-focused ads highlighting fast response times and 24/7 availability",
                result: "3 emergency-themed ads with strong CTAs like 'Call Now' and '30-Min Response'",
                tags: ["create", "emergency", "service"],
            },
            {
                command: "Write 3 variations for my top service",
                description: "AI identifies your best-performing service category and creates diverse ad angles",
                result: "3 unique angles: price-focused, speed-focused, and trust-focused ad variations",
                tags: ["create", "variations", "optimization"],
            },
        ],
    },
    {
        label: "Create Display Ads",
        icon: Image,
        color: "text-orange-500 bg-orange-500/10 border-orange-500/20",
        gradient: "from-orange-500 to-red-500",
        emoji: "\ud83d\uddbc\ufe0f",
        description: "Design visual banner ads with images, overlays, and call-to-action buttons",
        examples: [
            {
                command: "Make a display ad for summer sale",
                description: "Creates a visual banner ad with product imagery, overlay text, and a CTA button",
                result: "Display ad with image, 'SUMMER SALE 40% OFF' overlay, and 'Shop Now' button \u2014 preview shown inline",
                tags: ["display", "banner", "sale"],
            },
            {
                command: "Design a banner ad for my restaurant",
                description: "Picks food imagery from the library and creates an appetizing display ad",
                result: "Restaurant banner with food photo, your special offer text, and 'Order Now' CTA",
                tags: ["display", "restaurant", "food"],
            },
            {
                command: "Create display ads in different sizes",
                description: "Generates ads in multiple formats: Leaderboard (728\u00d790), Medium Rectangle (300\u00d7250), etc.",
                result: "Multiple display ad formats ready for Google Display Network, all with consistent branding",
                tags: ["display", "sizes", "formats"],
            },
        ],
    },
    {
        label: "Manage Images",
        icon: Image,
        color: "text-pink-500 bg-pink-500/10 border-pink-500/20",
        gradient: "from-pink-500 to-rose-500",
        emoji: "\ud83d\udcf7",
        description: "Add, swap, or position images in your display ads with simple commands",
        examples: [
            {
                command: "Add a sushi image to the lunch ad",
                description: "Picks a relevant food image and inserts it into your display ad with auto-positioning",
                result: "Updated display ad preview showing the new sushi image with optimal positioning",
                tags: ["image", "add", "food"],
            },
            {
                command: "Use a different image",
                description: "Swaps the current image for a new one from the image library or a URL you provide",
                result: "Ad preview updated with the new image, maintaining overlay text and CTA",
                tags: ["image", "swap", "change"],
            },
            {
                command: "Insert this photo into ad number 3",
                description: "Places a specific image into a specific ad draft by number",
                result: "Ad #3 updated with your chosen image, saved to Drafts",
                tags: ["image", "insert", "specific"],
            },
        ],
    },
    {
        label: "Position & Layout",
        icon: Move,
        color: "text-violet-500 bg-violet-500/10 border-violet-500/20",
        gradient: "from-violet-500 to-purple-500",
        emoji: "\u2194\ufe0f",
        description: "Move images and adjust layouts using natural language directions",
        examples: [
            {
                command: "Move the image to the top left",
                description: "Repositions the image to the top-left corner of the display ad",
                result: "Display ad preview updated with image repositioned to top-left, overlay adjusted",
                tags: ["move", "position", "top left"],
            },
            {
                command: "Center the image",
                description: "Centers the image in the display ad frame",
                result: "Image centered with balanced overlay text placement",
                tags: ["move", "center", "position"],
            },
            {
                command: "Put the image on the right side",
                description: "Shifts the image to the right side of the ad canvas",
                result: "Layout updated: image right, text left \u2014 classic split layout",
                tags: ["move", "right", "layout"],
            },
        ],
    },
    {
        label: "Edit Text & Copy",
        icon: Type,
        color: "text-teal-500 bg-teal-500/10 border-teal-500/20",
        gradient: "from-teal-500 to-cyan-500",
        emoji: "\u270f\ufe0f",
        description: "Change headlines, overlay text, CTA buttons, and ad descriptions",
        examples: [
            {
                command: "Change the headline to 50% OFF",
                description: "Updates the overlay text on your display ad to '50% OFF'",
                result: "Display ad preview updated with new '50% OFF' headline, existing image and CTA preserved",
                tags: ["edit", "headline", "text"],
            },
            {
                command: "Set the button to Book Now",
                description: "Changes the CTA button text on your display ad",
                result: "CTA button updated from 'Shop Now' to 'Book Now'",
                tags: ["edit", "cta", "button"],
            },
            {
                command: "Update overlay text to Free Shipping Today",
                description: "Changes the main overlay text on your display ad",
                result: "Overlay text updated and restyled for readability",
                tags: ["edit", "overlay", "text"],
            },
        ],
    },
    {
        label: "View Stats & Performance",
        icon: BarChart3,
        color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
        gradient: "from-emerald-500 to-green-500",
        emoji: "\ud83d\udcca",
        description: "Get instant performance reports and analytics right in the chat",
        examples: [
            {
                command: "Show me my stats",
                description: "Shows a quick overview of your account: clicks, calls, CTR, cost, budget remaining",
                result: "Stats cards grid showing 18 calls (+38%), 342 clicks, 7.99% CTR, $295 cost",
                tags: ["stats", "overview", "performance"],
            },
            {
                command: "How are my ads doing?",
                description: "Same as 'Show me my stats' \u2014 the AI understands casual phrasing",
                result: "Full performance dashboard with trend arrows and week-over-week changes",
                tags: ["stats", "casual", "natural"],
            },
            {
                command: "Compare to last month",
                description: "Shows a month-over-month comparison table with all key metrics",
                result: "Comparison table: Jan vs Feb with change percentages and trend indicators",
                tags: ["stats", "compare", "trends"],
            },
            {
                command: "Show call details",
                description: "Lists all recent calls with date, duration, keyword, and booking status",
                result: "Table of 18 calls: 12 booked (67%), 3 estimates, 2 hangups, 1 wrong number",
                tags: ["stats", "calls", "details"],
            },
        ],
    },
    {
        label: "Find Wasted Spend",
        icon: AlertTriangle,
        color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
        gradient: "from-amber-500 to-yellow-500",
        emoji: "\ud83d\udcb8",
        description: "Let the AI scan your account for money leaks and wasted budget",
        examples: [
            {
                command: "Find money leaks",
                description: "Scans all keywords, ad schedules, and device bids for waste",
                result: "Found 3 junk keywords ($45.50/wk), night ads ($28/wk), mobile overbid ($35/wk) = $434/mo savings",
                tags: ["leaks", "waste", "savings"],
            },
            {
                command: "Where am I wasting money?",
                description: "Same as 'Find money leaks' \u2014 natural phrasing works perfectly",
                result: "Detailed breakdown of waste with fix-it buttons for each issue",
                tags: ["leaks", "waste", "casual"],
            },
            {
                command: "Pause the bad keywords",
                description: "Immediately pauses the keywords the AI identified as wasteful",
                result: "3 keywords paused, saving $45.50/week ($182/month). Summary with savings breakdown",
                tags: ["pause", "keywords", "fix"],
            },
        ],
    },
    {
        label: "Competitor Analysis",
        icon: Users,
        color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
        gradient: "from-indigo-500 to-blue-500",
        emoji: "\ud83c\udfc6",
        description: "See what your competitors are doing and how to beat them",
        examples: [
            {
                command: "Check my competitors",
                description: "Analyzes competitors in your market: their ad positions, ad count, offers, and estimated spend",
                result: "Top 3 competitors with positions, ad counts, and your competitive edge analysis",
                tags: ["competitors", "analysis", "market"],
            },
            {
                command: "How to beat Roto-Rooter?",
                description: "Creates a specific battle plan against a named competitor",
                result: "4-point strategy: speed advantage, price matching, local trust, brand bidding",
                tags: ["competitors", "strategy", "specific"],
            },
            {
                command: "Write counter-ads",
                description: "Creates ads specifically designed to compete against identified competitors",
                result: "3 competitive ads highlighting your advantages over the competition",
                tags: ["competitors", "counter", "ads"],
            },
        ],
    },
    {
        label: "Go Live & Manage",
        icon: Rocket,
        color: "text-red-500 bg-red-500/10 border-red-500/20",
        gradient: "from-red-500 to-pink-500",
        emoji: "\ud83d\ude80",
        description: "Push approved ads live, manage campaigns, and control your budget",
        examples: [
            {
                command: "Go live with all 3",
                description: "Publishes your approved text ads to Google Search campaigns",
                result: "5 ads published, 3 campaigns running, daily budget set, conversion tracking enabled",
                tags: ["launch", "publish", "live"],
            },
            {
                command: "Go live",
                description: "Publishes all approved drafts to their respective campaigns",
                result: "Summary of all ads pushed live with campaign details and budget confirmation",
                tags: ["launch", "all", "simple"],
            },
            {
                command: "Show my drafts",
                description: "Lists all your ad drafts \u2014 both text and display \u2014 right in the chat",
                result: "Inline preview of 6 text ads and 4 display ads with edit/launch options",
                tags: ["drafts", "list", "review"],
            },
        ],
    },
];

export default function ExamplesPage() {
    const [search, setSearch] = useState("");
    const [activeCategory, setActiveCategory] = useState<string | null>(null);

    const searchLower = search.toLowerCase();
    const filteredCategories = categories
        .map((cat) => ({
            ...cat,
            examples: cat.examples.filter(
                (ex) =>
                    (!search ||
                        ex.command.toLowerCase().includes(searchLower) ||
                        ex.description.toLowerCase().includes(searchLower) ||
                        ex.tags.some((t) => t.includes(searchLower))) &&
                    (!activeCategory || activeCategory === cat.label)
            ),
        }))
        .filter((cat) => cat.examples.length > 0);

    const totalExamples = categories.reduce((sum, cat) => sum + cat.examples.length, 0);

    return (
        <div className="max-w-5xl mx-auto">
            {/* Demo banner */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2 mb-6">
                <span className="text-xs font-bold bg-amber-400 text-amber-900 px-2 py-0.5 rounded-full">DEMO</span>
                <span className="text-xs text-amber-800">
                    Browse example AI commands you can use with your AI assistant. Try them in the chat!
                </span>
            </div>

            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                        <Lightbulb className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">AI Command Examples</h1>
                        <p className="text-sm text-muted">{totalExamples} things you can say to your AI assistant</p>
                    </div>
                </div>

                {/* Hero banner */}
                <div className="bg-gradient-to-r from-primary/10 to-blue-500/10 border border-primary/20 rounded-xl p-5 flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                        <Mic className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h2 className="font-semibold mb-1">Just speak or type naturally</h2>
                        <p className="text-sm text-muted leading-relaxed">
                            You don&apos;t need to memorize exact phrases. The AI understands natural language, so
                            &quot;create some ads for plumbing&quot; works just as well as &quot;write 3 text ads for emergency plumbing services.&quot;
                            Click the <strong>microphone button</strong> in the AI chat to use voice commands, or just type.
                        </p>
                        <div className="flex gap-2 mt-3">
                            <Link
                                href="/dashboard/chat"
                                className="inline-flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-primary-dark transition"
                            >
                                <MessageCircle className="w-3.5 h-3.5" />
                                Try it now
                            </Link>
                            <div className="flex items-center gap-1.5 text-xs text-muted px-3 py-2 border border-border rounded-lg">
                                <Zap className="w-3 h-3 text-emerald-500" /> GPT-4o
                                <span className="text-border">+</span>
                                <Sparkles className="w-3 h-3 text-orange-400" /> Claude 4.6
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="relative mb-5">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search commands... e.g. 'display ad', 'competitors', 'stats'"
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
                    All ({totalExamples})
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
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Examples grid */}
            <div className="space-y-8">
                {filteredCategories.map((cat) => (
                    <div key={cat.label}>
                        {/* Category header */}
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${cat.color}`}>
                                <cat.icon className="w-4 h-4" />
                            </div>
                            <div>
                                <h2 className="font-semibold flex items-center gap-2">
                                    {cat.emoji} {cat.label}
                                    <span className="text-[10px] text-muted bg-muted/10 px-1.5 py-0.5 rounded-full font-normal">{cat.examples.length}</span>
                                </h2>
                                <p className="text-xs text-muted">{cat.description}</p>
                            </div>
                        </div>

                        {/* Example cards */}
                        <div className="grid gap-3 md:grid-cols-2">
                            {cat.examples.map((ex, i) => (
                                <div
                                    key={i}
                                    className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition group"
                                >
                                    {/* Command */}
                                    <div className="flex items-start gap-2 mb-3">
                                        <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${cat.gradient} flex items-center justify-center shrink-0 mt-0.5`}>
                                            <Mic className="w-3 h-3 text-white" />
                                        </div>
                                        <div className="bg-primary/5 border border-primary/10 rounded-lg px-3 py-2 flex-1">
                                            <p className="text-sm font-medium text-primary">&quot;{ex.command}&quot;</p>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <p className="text-xs text-muted leading-relaxed mb-3 pl-8">{ex.description}</p>

                                    {/* Result */}
                                    <div className="flex items-start gap-2 pl-8">
                                        <ArrowRight className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                                        <p className="text-xs text-emerald-600 dark:text-emerald-400 leading-relaxed">
                                            <strong>Result:</strong> {ex.result}
                                        </p>
                                    </div>

                                    {/* Tags */}
                                    <div className="flex gap-1.5 mt-3 pl-8">
                                        {ex.tags.map((tag) => (
                                            <span key={tag} className="text-[10px] bg-muted/10 text-muted px-1.5 py-0.5 rounded-full">{tag}</span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Pro tips */}
            <div className="mt-10 grid gap-4 md:grid-cols-3">
                <div className="bg-card border border-border rounded-xl p-4">
                    <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center mb-2">
                        <Mic className="w-4 h-4 text-blue-500" />
                    </div>
                    <h3 className="font-semibold text-sm mb-1">Use Voice</h3>
                    <p className="text-xs text-muted leading-relaxed">
                        Click the mic button and speak \u2014 it&apos;s faster than typing.
                        Works on Chrome, Edge, and Safari.
                    </p>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                    <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center mb-2">
                        <Eye className="w-4 h-4 text-emerald-500" />
                    </div>
                    <h3 className="font-semibold text-sm mb-1">Preview First</h3>
                    <p className="text-xs text-muted leading-relaxed">
                        Every ad is a draft first. Nothing goes live until you say so.
                        Review, edit, regenerate \u2014 you&apos;re always in control.
                    </p>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                    <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center mb-2">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                    </div>
                    <h3 className="font-semibold text-sm mb-1">Be Casual</h3>
                    <p className="text-xs text-muted leading-relaxed">
                        Don&apos;t worry about exact phrases. &quot;How&apos;s my stuff doing?&quot; works
                        just as well as &quot;Show me performance stats.&quot;
                    </p>
                </div>
            </div>

            {/* CTA */}
            <div className="mt-8 text-center pb-4">
                <Link
                    href="/dashboard/chat"
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-blue-600 text-white px-6 py-3 rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-primary/30 transition"
                >
                    <MessageCircle className="w-4 h-4" />
                    Open AI Assistant &amp; Try These Commands
                </Link>
            </div>
        </div>
    );
}
