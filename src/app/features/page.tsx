"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Bell,
  Bot,
  Brain,
  ChevronDown,
  Clock,
  Crosshair,
  DollarSign,
  Eye,
  FlaskConical,
  Gauge,
  Globe,
  Mail,
  MessageCircle,
  Phone,
  PoundSterling,
  Search,
  Shield,
  Sparkles,
  Store,
  ShoppingBag,
  TrendingUp,
  Zap,
  CheckCircle,
  Mic,
  FileText,
  Target,
  MapPin,
} from "lucide-react";
import { useTranslation } from "@/i18n/context";
import LanguageSwitcher from "@/components/LanguageSwitcher";

// ─── Feature Categories ─────────────────────────────────────────────────────

interface Feature {
  icon: React.ElementType;
  name: string;
  headline: string;
  description: string;
  highlights: string[];
}

interface Category {
  id: string;
  title: string;
  subtitle: string;
  color: string;
  features: Feature[];
}

const CATEGORIES: Category[] = [
  {
    id: "ai-core",
    title: "AI Assistant & Intelligence",
    subtitle: "Your personal ad strategist that never sleeps",
    color: "indigo",
    features: [
      {
        icon: MessageCircle,
        name: "AI Chat Assistant",
        headline: "Talk to your ads like you'd talk to a colleague",
        description:
          "Ask questions in plain English — \"How are my ads doing?\" \"Create 5 ads for my plumbing business\" \"Where am I wasting money?\" — and get real answers with real numbers, not marketing jargon.",
        highlights: [
          "Voice input — just speak and your AI does the rest",
          "20+ intent types understood naturally",
          "Smart follow-up buttons after every response",
          "Works in 12 languages",
        ],
      },
      {
        icon: Brain,
        name: "Intelligence Command Center",
        headline: "Context-aware insights that actually matter",
        description:
          "Our Intelligence engine combines holiday calendars, seasonal trends, device data, geo-targeting, and even climate patterns to tell you what's happening and what to do about it — before you ask.",
        highlights: [
          "80+ holidays and events from 15+ regions",
          "Seasonal trends matched to your industry",
          "Device and geo-specific recommendations",
          "Climate-aware ad suggestions",
        ],
      },
      {
        icon: Bot,
        name: "AI Auto-Pilot",
        headline: "Turn it on. Walk away. We'll handle the small stuff.",
        description:
          "Auto-Pilot monitors your campaigns 24/7 and makes safe, small optimisations automatically — pausing bad keywords, adjusting bids, blocking junk searches. Nothing drastic, nothing risky. You stay in control of the big decisions.",
        highlights: [
          "Automatic negative keyword blocking",
          "Bid adjustments based on performance",
          "Safe guardrails — never overspends",
          "Full activity log so you see everything it did",
        ],
      },
      {
        icon: Target,
        name: "Strategy Advisor",
        headline: "Know exactly which ad types are right for YOUR business",
        description:
          "Our multi-signal inference engine analyzes your business name, services, website, KB content, Shopify connection, and location — not just a dropdown — to determine the optimal ad channels, budget splits, and Performance Max assessment for your specific business type.",
        highlights: [
          "11+ industry profiles with channel recommendations",
          "Multi-signal inference (not just dropdown selection)",
          "Budget split % for each channel",
          "Performance Max suitability assessment",
          "Channels to AVOID for your business type",
          "Split test ideas tailored to your industry",
        ],
      },
      {
        icon: MapPin,
        name: "Local Presence Checker",
        headline: "Dominate your local area with Maps, reviews, and GBP",
        description:
          "For businesses where local matters (dentists, restaurants, plumbers, gyms), we give you a complete local SEO checklist — Google Business Profile optimization, Maps ranking tips, review strategies, NAP consistency, and citation management.",
        highlights: [
          "Auto-detects if local presence matters for your business",
          "21-item interactive checklist with progress tracking",
          "Google Maps, GBP, Reviews, Citations, Website signals",
          "Priority-based (critical → high → medium)",
          "Persisted progress per business",
        ],
      },
    ],
  },
  {
    id: "budget-tools",
    title: "Budget & Spend Protection",
    subtitle: "Stop wasting money before it happens",
    color: "red",
    features: [
      {
        icon: DollarSign,
        name: "Wasted Spend Detector",
        headline: "Find exactly where your money is going down the drain",
        description:
          "We scan every search term that triggered your ads and flag the ones that are costing you money without converting. Job seekers, DIY queries, people looking for free stuff — we catch them all.",
        highlights: [
          "One-click blocking for each wasted term",
          "Block All button to clean up in seconds",
          "Shows cost, clicks, and why it's wasting money",
          "Updated daily with new problem terms",
        ],
      },
      {
        icon: Shield,
        name: "Negative Keyword Miner",
        headline: "Auto-groups junk keywords by theme so you can block them in batches",
        description:
          "Rather than blocking keywords one by one, we group them into themes — \"Job seekers\", \"DIY enthusiasts\", \"Free seekers\", \"Education queries\" — and let you block entire groups with a single click.",
        highlights: [
          "Automatic daily scanning",
          "Smart theme grouping (job seekers, DIY, etc.)",
          "Block individual keywords or entire groups",
          "Potential savings calculated for each theme",
        ],
      },
      {
        icon: Gauge,
        name: "Budget Pacing",
        headline: "Know if you're on track or about to run out of budget early",
        description:
          "A clear visual showing how your daily spend tracks against your monthly budget. If you're spending too fast, we'll tell you. If you have room to grow, we'll tell you that too. No surprises at month end.",
        highlights: [
          "Daily spend vs monthly budget progress bar",
          "Projected month-end spend",
          "Per-campaign breakdown with status badges",
          "Overspending / underspending alerts",
        ],
      },
      {
        icon: PoundSterling,
        name: "Profit Tracker",
        headline: "Revenue is vanity. Profit is sanity.",
        description:
          "Most tools show you revenue and ROAS. We go further — factor in your actual costs (product costs, delivery, overheads) to show you true profit per product, per channel. Because a £5,000 revenue month means nothing if you spent £4,800 getting there.",
        highlights: [
          "True profit after ad spend AND costs",
          "Per-product/service margin breakdown",
          "ROAS alongside real profit margin",
          "Connects to Shopify for automatic cost data",
        ],
      },
    ],
  },
  {
    id: "optimization",
    title: "Performance Optimisation",
    subtitle: "Make every click count",
    color: "green",
    features: [
      {
        icon: Clock,
        name: "Ad Scheduling Optimizer",
        headline: "Run ads when your customers are buying, not sleeping",
        description:
          "See a conversion heatmap showing exactly which hours and days bring results. If your best conversions happen Mon–Fri 10am–2pm, why pay for clicks at 3am on a Saturday?",
        highlights: [
          "Conversion heatmap by hour and day",
          "Best and worst time windows identified",
          "One-click recommended schedule",
          "Timezone-aware — perfect for digital nomads",
        ],
      },
      {
        icon: Globe,
        name: "Site Scorer",
        headline: "Score every page on your site — not just landing pages",
        description:
          "Most tools only check your landing page. We score everything — product pages, category pages, your blog, even your checkout. Because if a customer clicks your ad and lands on a slow, confusing page, you've just paid for nothing.",
        highlights: [
          "Mobile and desktop scores",
          "Load speed, CTA clarity, and ad relevance",
          "Product page and checkout scoring",
          "Paste any URL to scan instantly",
        ],
      },
      {
        icon: FlaskConical,
        name: "A/B Test Tracker",
        headline: "Stop guessing which headline works. Test it.",
        description:
          "Create a test with your current headline (A) and a new challenger (B). We track clicks, conversions, CTR, and conversion rate for each variant — and automatically declare a winner when the data reaches 95% statistical confidence.",
        highlights: [
          "Side-by-side variant comparison",
          "Statistical confidence tracking",
          "Auto-declares winners at 95%",
          "Test headlines, descriptions, or CTAs",
        ],
      },
      {
        icon: Sparkles,
        name: "Ad Copy Generator",
        headline: "AI-written ads that sound like you, not a robot",
        description:
          "Tell us what you want to promote and we'll generate complete Google Ads — headlines, descriptions, keywords — all matched to your brand voice from your Knowledge Base. Create 1 ad or 10 in one go.",
        highlights: [
          "9 ad format types supported",
          "Batch creation — make 10 ads at once",
          "Policy compliance checking built-in",
          "Multiple moods: urgent, friendly, premium, etc.",
        ],
      },
    ],
  },
  {
    id: "competitive",
    title: "Competitive Intelligence",
    subtitle: "Know what your rivals are up to",
    color: "purple",
    features: [
      {
        icon: Eye,
        name: "Competitor Ads",
        headline: "See exactly what your competitors are running",
        description:
          "We track your competitors' ads across Google Search, Facebook, and Shopping. See their headlines, descriptions, display URLs, targeted keywords, ad positions, and how long they've been running each ad.",
        highlights: [
          "Google, Facebook & Shopping coverage",
          "Ad copy previews with display URLs",
          "Keywords they're targeting",
          "First seen and last seen dates",
        ],
      },
      {
        icon: Crosshair,
        name: "Competitor Research",
        headline: "Find gaps in their strategy before they find yours",
        description:
          "Deep-dive into your competitors' estimated ad spend, keyword targeting, and positioning. Find the keywords they're missing and the angles they haven't tried.",
        highlights: [
          "Estimated competitor spend and keywords",
          "Gap analysis — what they're missing",
          "Strategy recommendations to outperform them",
          "AI-generated counter-ads",
        ],
      },
      {
        icon: TrendingUp,
        name: "Market Trends",
        headline: "Ride the trends before your competitors notice them",
        description:
          "Google Trends data integrated into your dashboard. See what's rising, what's falling, and seasonal patterns that affect your industry — so you can adjust your strategy before everyone else does.",
        highlights: [
          "Rising and falling keyword trends",
          "Seasonal prediction patterns",
          "Industry-specific trend analysis",
          "Breakout keyword alerts",
        ],
      },
    ],
  },
  {
    id: "alerts-reporting",
    title: "Alerts & Reporting",
    subtitle: "Stay informed without logging in",
    color: "amber",
    features: [
      {
        icon: Bell,
        name: "Smart Alerts",
        headline: "Get a ping on your phone when something important happens",
        description:
          "Set up rules like \"Tell me if spend goes over £100/day\" or \"Alert me if no conversions for 24 hours.\" We'll send you an email or WhatsApp message — you don't need to be staring at a dashboard.",
        highlights: [
          "Email and WhatsApp delivery",
          "Spend, conversion, performance & anomaly alerts",
          "Milestone celebrations (\"New record!\")",
          "Custom rules — set your own thresholds",
        ],
      },
      {
        icon: Mail,
        name: "Weekly Email Digest",
        headline: "Your week in ads — delivered to your inbox every Monday",
        description:
          "A beautiful summary email with your top wins, concerns to watch, key metrics, and a look ahead at upcoming events or holidays. Pick your day and time — no login required.",
        highlights: [
          "Top wins and things to watch",
          "Key metrics summary (spend, CPA, CTR, conversions)",
          "Seasonal heads-up for the coming week",
          "Preview and send test emails",
        ],
      },
      {
        icon: BarChart3,
        name: "Analytics Dashboard",
        headline: "Charts that actually make sense",
        description:
          "No 47-tab spreadsheet. Clean, visual charts showing spend, clicks, conversions, CTR, and CPA over time. Filter by campaign, date range, or device. Export when you need to.",
        highlights: [
          "Visual trend charts with date filtering",
          "Per-campaign and per-device breakdowns",
          "Export to CSV / PDF",
          "Comparison periods (this month vs last)",
        ],
      },
    ],
  },
  {
    id: "channels",
    title: "Multi-Channel Management",
    subtitle: "Google Ads, Facebook, Amazon, Shopify — all in one place",
    color: "blue",
    features: [
      {
        icon: Search,
        name: "Google Ads Management",
        headline: "The complete Google Ads toolkit",
        description:
          "Campaigns, ad groups, keywords, ad extensions, bid management, quality scores — everything you need to run Google Ads without needing a degree in digital marketing.",
        highlights: [
          "Campaign creation and management",
          "Keyword research and management",
          "Quality score tracking",
          "Call tracking integration",
        ],
      },
      {
        icon: Store,
        name: "Shopify Integration",
        headline: "Your products, automatically turned into ads",
        description:
          "Connect your Shopify store and we'll pull in your products, prices, and inventory. Create Shopping Ads and Performance Max campaigns directly from your catalog.",
        highlights: [
          "One-click Shopify connection",
          "Product catalog sync",
          "Shopping Ads and PMax campaign creation",
          "Revenue and ROAS tracking",
        ],
      },
      {
        icon: ShoppingBag,
        name: "Meta Ads (Facebook & Instagram)",
        headline: "Reach customers where they scroll",
        description:
          "Create and manage Facebook and Instagram ad campaigns alongside your Google Ads. Same dashboard, same AI assistant, same easy experience.",
        highlights: [
          "Facebook & Instagram campaign management",
          "Audience targeting recommendations",
          "Cross-platform performance comparison",
          "AI-generated social ad copy",
        ],
      },
    ],
  },
];

// ─── Color utilities ────────────────────────────────────────────────────────

const colorMap: Record<string, { bg: string; text: string; border: string; light: string; badge: string }> = {
  indigo: { bg: "bg-indigo-600", text: "text-indigo-600", border: "border-indigo-200", light: "bg-indigo-50", badge: "bg-indigo-100 text-indigo-700" },
  red: { bg: "bg-red-600", text: "text-red-600", border: "border-red-200", light: "bg-red-50", badge: "bg-red-100 text-red-700" },
  green: { bg: "bg-green-600", text: "text-green-600", border: "border-green-200", light: "bg-green-50", badge: "bg-green-100 text-green-700" },
  purple: { bg: "bg-purple-600", text: "text-purple-600", border: "border-purple-200", light: "bg-purple-50", badge: "bg-purple-100 text-purple-700" },
  amber: { bg: "bg-amber-600", text: "text-amber-600", border: "border-amber-200", light: "bg-amber-50", badge: "bg-amber-100 text-amber-700" },
  blue: { bg: "bg-blue-600", text: "text-blue-600", border: "border-blue-200", light: "bg-blue-50", badge: "bg-blue-100 text-blue-700" },
};

// ─── Feature Card ───────────────────────────────────────────────────────────

function FeatureCard({ feature, color }: { feature: Feature; color: string }) {
  const [open, setOpen] = useState(false);
  const c = colorMap[color];
  const Icon = feature.icon;

  return (
    <div
      className={`rounded-2xl border transition-all duration-300 ${
        open ? `${c.border} shadow-lg` : "border-neutral-200 hover:border-neutral-300"
      }`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left p-6 flex items-start gap-4"
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${c.light}`}>
          <Icon className={`w-5 h-5 ${c.text}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-semibold text-neutral-900">{feature.name}</h3>
          </div>
          <p className="text-sm text-neutral-600 leading-relaxed">{feature.headline}</p>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-neutral-400 shrink-0 mt-1 transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="px-6 pb-6 pt-0 space-y-4 animate-in fade-in duration-200">
          <p className="text-sm text-neutral-600 leading-relaxed pl-14">
            {feature.description}
          </p>
          <div className="pl-14 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {feature.highlights.map((h, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle className={`w-4 h-4 ${c.text} shrink-0 mt-0.5`} />
                <span className="text-neutral-700">{h}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Category Section ───────────────────────────────────────────────────────

function CategorySection({ category }: { category: Category }) {
  const c = colorMap[category.color];

  return (
    <section className="scroll-mt-24" id={category.id}>
      <div className="mb-6">
        <span className={`text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full ${c.badge}`}>
          {category.title}
        </span>
        <p className="text-sm text-neutral-500 mt-3">{category.subtitle}</p>
      </div>
      <div className="space-y-3">
        {category.features.map((f, i) => (
          <FeatureCard key={i} feature={f} color={category.color} />
        ))}
      </div>
    </section>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function FeaturesPage() {
  const { t } = useTranslation();

  return (
    <div className="bg-white text-neutral-900 antialiased min-h-screen">
      {/* Nav */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-neutral-100 z-50">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-6 h-6 bg-neutral-900 rounded-md flex items-center justify-center">
              <span className="text-white text-xs font-medium tracking-tighter">AM</span>
            </div>
            <span className="font-medium tracking-tight text-sm">AdMaster Pro</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/pricing" className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors">
              Pricing
            </Link>
            <LanguageSwitcher />
            <Link
              href="/login"
              className="text-sm font-medium bg-neutral-900 text-white px-4 py-2 rounded-lg hover:bg-neutral-800 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="pt-28 pb-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-neutral-100 rounded-full px-4 py-1.5 text-xs font-medium text-neutral-600 mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            {CATEGORIES.reduce((s, c) => s + c.features.length, 0)} features and counting
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
            Everything you need to{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              run better ads
            </span>
          </h1>
          <p className="text-lg text-neutral-500 mt-4 max-w-2xl mx-auto leading-relaxed">
            From AI-powered ad creation to wasted spend detection, budget pacing, competitor tracking, and smart alerts — all in plain English, no marketing degree required.
          </p>
        </div>
      </div>

      {/* Category Quick Nav */}
      <div className="sticky top-14 z-40 bg-white/80 backdrop-blur-md border-b border-neutral-100">
        <div className="max-w-5xl mx-auto px-6 overflow-x-auto">
          <div className="flex items-center gap-1 py-3 min-w-max">
            {CATEGORIES.map((cat) => {
              const c = colorMap[cat.color];
              return (
                <a
                  key={cat.id}
                  href={`#${cat.id}`}
                  className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900 whitespace-nowrap`}
                >
                  {cat.title}
                </a>
              );
            })}
          </div>
        </div>
      </div>

      {/* Feature Categories */}
      <div className="max-w-3xl mx-auto px-6 py-16 space-y-20">
        {CATEGORIES.map((cat) => (
          <CategorySection key={cat.id} category={cat} />
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="border-t border-neutral-100 bg-neutral-50/50">
        <div className="max-w-3xl mx-auto px-6 py-20 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Ready to stop guessing and start growing?
          </h2>
          <p className="text-neutral-500 mt-3 max-w-xl mx-auto">
            Start for free. No credit card. Connect your Google Ads and see results in under 5 minutes.
          </p>
          <div className="flex items-center justify-center gap-4 mt-8">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-neutral-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-neutral-800 transition-colors"
            >
              Start Free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 border border-neutral-200 text-neutral-700 px-6 py-3 rounded-xl font-medium hover:bg-neutral-50 transition-colors"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-neutral-100 py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-400">
          <span>© {new Date().getFullYear()} NobleBlocks LLC. All rights reserved.</span>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-neutral-600">Privacy</Link>
            <Link href="/terms" className="hover:text-neutral-600">Terms</Link>
            <Link href="/about" className="hover:text-neutral-600">About</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
