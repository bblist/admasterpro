"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
    Zap,
    LayoutDashboard,
    MessageCircle,
    Settings,
    FileText,
    Search,
    Bell,
    LogOut,
    Menu,
    X,
    ShoppingBag,
    BookOpen,
    HelpCircle,
    Lightbulb,
    ChevronDown,
    Check,
    Plus,
    Brain,
    BarChart3,
    Phone,
    Sparkles,
    DollarSign,
    CreditCard,
    Store,
    Facebook,
    ShoppingCart,
    TrendingUp,
    Bot,
    Crosshair,
    Eye,
    Shield,
    Gauge,
    Clock,
    Globe,
    PoundSterling,
    FlaskConical,
    Mail,
    ChevronRight,
    Target,
    MapPin,
} from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { BusinessProvider, useBusiness } from "@/lib/business-context";
import { captureTokenFromHash, authFetch, clearAuth } from "@/lib/auth-client";
import { useTranslation } from "@/i18n/context";
import LanguageSwitcher from "@/components/LanguageSwitcher";

// ─── Notification System ────────────────────────────────────────────────────

type NotificationType = "policy" | "review" | "success" | "warning" | "info";

interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    time: string;
    read: boolean;
    action?: string;
    actionHref?: string;
}

const INITIAL_NOTIFICATIONS: Notification[] = [
    {
        id: "welcome",
        type: "info",
        title: "Welcome to AdMaster Pro!",
        message: "Your AI ad assistant is ready. Chat with it to create ads, research keywords, or analyze competitors.",
        time: "Just now",
        read: false,
        action: "Start Chatting",
        actionHref: "/dashboard/chat",
    },
];

const notificationIcons: Record<NotificationType, { bg: string; text: string; icon: string }> = {
    policy: { bg: "bg-blue-100", text: "text-blue-600", icon: "🛡️" },
    review: { bg: "bg-purple-100", text: "text-purple-600", icon: "📋" },
    success: { bg: "bg-green-100", text: "text-green-600", icon: "✅" },
    warning: { bg: "bg-amber-100", text: "text-amber-600", icon: "⚠️" },
    info: { bg: "bg-gray-100", text: "text-gray-600", icon: "ℹ️" },
};

// ─── Nav items ─────────────────────────────────────────────────────────────

const mainNavItems = [
    // ── Core ──
    { href: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard, tip: "Overview of your account, plan usage, and quick actions", requiresSetup: true },
    { href: "/dashboard/intelligence", labelKey: "nav.intelligence", icon: Brain, tip: "AI-powered cross-platform intelligence — holiday, seasonal, device, geo & climate aware", requiresSetup: false },
    { href: "/dashboard/chat", labelKey: "nav.aiAssistant", icon: MessageCircle, tip: "Chat with AI to create ads, analyze performance, and find budget leaks", requiresSetup: false },
    { href: "/dashboard/strategy", labelKey: "nav.strategyAdvisor", icon: Target, tip: "AI-recommended ad channels, budget splits, and PMax assessment for your business type", requiresSetup: false },
    { href: "/dashboard/local-presence", labelKey: "nav.localPresence", icon: MapPin, tip: "Local SEO checklist — Maps, GBP, reviews, citations, and NAP consistency", requiresSetup: false },

    // ── Campaigns & Ads ──
    { href: "/dashboard/campaigns", labelKey: "nav.campaigns", icon: FileText, tip: "View and manage your live Google Ads campaigns", requiresSetup: true, group: "Campaigns" },
    { href: "/dashboard/ad-copy", labelKey: "nav.adCopyGenerator", icon: Sparkles, tip: "Generate Google Ads headlines, descriptions, and keywords", requiresSetup: true },
    { href: "/dashboard/drafts", labelKey: "nav.adDrafts", icon: FileText, tip: "Review and edit AI-generated ad drafts before publishing", requiresSetup: true },
    { href: "/dashboard/ad-analysis", labelKey: "nav.adAnalysis", icon: Eye, tip: "Deep analysis of your existing ads with AI grading", requiresSetup: true },
    { href: "/dashboard/ab-tests", labelKey: "nav.abTests", icon: FlaskConical, tip: "A/B test ad headlines and track statistical winners", requiresSetup: true },

    // ── Keywords & Research ──
    { href: "/dashboard/keywords", labelKey: "nav.keywords", icon: Search, tip: "Discover keyword opportunities and manage negative keywords", requiresSetup: true, group: "Research" },
    { href: "/dashboard/keyword-research", labelKey: "nav.keywordResearch", icon: Sparkles, tip: "AI-powered keyword discovery and analysis", requiresSetup: false },
    { href: "/dashboard/negative-keywords", labelKey: "nav.negativeKeywords", icon: Shield, tip: "Auto-mined negative keywords to stop wasted spend", requiresSetup: true },
    { href: "/dashboard/competitors", labelKey: "nav.competitors", icon: Crosshair, tip: "Research competitors and find gaps in their strategy", requiresSetup: true },
    { href: "/dashboard/competitor-ads", labelKey: "nav.competitorAds", icon: Eye, tip: "See what your competitors are running on Google & Facebook", requiresSetup: true },

    // ── Budget & Performance ──
    { href: "/dashboard/analytics", labelKey: "nav.analytics", icon: BarChart3, tip: "Charts and trends for your Google Ads performance", requiresSetup: true, group: "Performance" },
    { href: "/dashboard/budget", labelKey: "nav.budgetOptimizer", icon: DollarSign, tip: "AI recommendations to optimize your ad spend and bids", requiresSetup: true },
    { href: "/dashboard/budget-pacing", labelKey: "nav.budgetPacing", icon: Gauge, tip: "Track daily spend against monthly budget", requiresSetup: true },
    { href: "/dashboard/wasted-spend", labelKey: "nav.wastedSpend", icon: DollarSign, tip: "Find and block search terms wasting your budget", requiresSetup: true },
    { href: "/dashboard/profit-tracker", labelKey: "nav.profitTracker", icon: PoundSterling, tip: "True profitability per product after ad spend and costs", requiresSetup: true },
    { href: "/dashboard/ad-scheduling", labelKey: "nav.adScheduling", icon: Clock, tip: "Optimise when your ads run based on conversion data", requiresSetup: true },
    { href: "/dashboard/site-scorer", labelKey: "nav.siteScorer", icon: Globe, tip: "Score every page on your site — speed, mobile, CTAs, ad relevance", requiresSetup: false },
    { href: "/dashboard/calls", labelKey: "nav.callTracking", icon: Phone, tip: "Track phone calls driven by your ads", requiresSetup: true },

    // ── Alerts & Reporting ──
    { href: "/dashboard/alerts", labelKey: "nav.smartAlerts", icon: Bell, tip: "Email and WhatsApp alerts when something important happens", requiresSetup: false, group: "Alerts" },
    { href: "/dashboard/weekly-digest", labelKey: "nav.weeklyDigest", icon: Mail, tip: "Weekly email summary of wins, concerns, and metrics", requiresSetup: false },

    // ── Channels ──
    { href: "/dashboard/shopping", labelKey: "nav.shoppingAds", icon: ShoppingBag, shoppingOnly: true, tip: "Manage product listing and shopping ads", requiresSetup: true, group: "Channels" },
    { href: "/dashboard/shopify", labelKey: "nav.shopify", icon: Store, tip: "Connect and manage your Shopify store products", requiresSetup: false },
    { href: "/dashboard/shopify-analytics", labelKey: "nav.shopifyAnalytics", icon: ShoppingBag, tip: "Revenue, ROAS, and e-commerce analytics from Shopify", requiresSetup: true },
    { href: "/dashboard/meta-ads", labelKey: "nav.metaAds", icon: Facebook, tip: "Facebook & Instagram ad management", requiresSetup: false },
    { href: "/dashboard/amazon-ads", labelKey: "nav.amazonAds", icon: ShoppingCart, tip: "Amazon Sponsored Products, Brands & Display", requiresSetup: false },
    { href: "/dashboard/merchant-center", labelKey: "nav.merchantCenter", icon: Store, tip: "Google Shopping product feed optimization", requiresSetup: false },
    { href: "/dashboard/google-trends", labelKey: "nav.googleTrends", icon: TrendingUp, tip: "Market trends, seasonal predictions, rising keywords", requiresSetup: false },
    { href: "/dashboard/etsy-intelligence", labelKey: "nav.etsyIntelligence", icon: Store, tip: "Etsy marketplace research & listing optimization", requiresSetup: false },
    { href: "/dashboard/auto-pilot", labelKey: "nav.autoPilot", icon: Bot, tip: "AI-powered autonomous ad management", requiresSetup: true },

    // ── Account ──
    { href: "/dashboard/knowledge-base", labelKey: "nav.knowledgeBase", icon: BookOpen, tip: "Upload brand assets and info to train the AI on your business", requiresSetup: false, group: "Account" },
    { href: "/dashboard/demo/examples", labelKey: "nav.aiExamples", icon: Lightbulb, tip: "See example prompts and what the AI can do for you", requiresSetup: true },
    { href: "/dashboard/faq", labelKey: "nav.faq", icon: HelpCircle, tip: "Frequently asked questions about features and billing", requiresSetup: false },
    { href: "/dashboard/billing", labelKey: "nav.billing", icon: CreditCard, tip: "Manage your subscription, upgrade plans, and purchase top-ups", requiresSetup: false },
    { href: "/dashboard/settings", labelKey: "nav.settings", icon: Settings, tip: "Account settings, notifications, and integrations", requiresSetup: false },
];

// Industries that can use shopping ads
const shoppingIndustries = ["Retail", "Fashion", "E-commerce", "Boutique"];

// ─── Business Switcher ──────────────────────────────────────────────────────

function BusinessSwitcher() {
    const { businesses, activeBusiness, setActiveBusiness } = useBusiness();
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const kbColor = activeBusiness?.googleAdsId
        ? "bg-green-500"
        : "bg-gray-400";

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center gap-2.5 px-4 py-3 border-b border-border hover:bg-border/30 transition text-left group"
            >
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${activeBusiness?.color || "from-blue-500 to-blue-700"} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                    {activeBusiness?.initials || "?"}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate flex items-center gap-1.5">
                        {activeBusiness?.name || t("business.noBusiness")}
                        <div className={`w-1.5 h-1.5 rounded-full ${kbColor} shrink-0`} title={activeBusiness?.googleAdsId ? t("business.adsConnected") : t("business.noAds")} />
                    </div>
                    <div className="text-[11px] text-muted truncate">{activeBusiness?.industry || t("business.add")}</div>
                </div>
                <ChevronDown className={`w-4 h-4 text-muted shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>

            {open && (
                <div className="absolute left-2 right-2 top-full mt-1 bg-card border border-border rounded-xl shadow-xl z-50 py-1 max-h-80 overflow-y-auto">
                    <div className="px-3 py-1.5 text-[10px] font-semibold text-muted uppercase tracking-wider">
                        {t("business.yours")}
                    </div>
                    {businesses.map((biz) => {
                        const isActive = biz.id === activeBusiness?.id;
                        const statusColor = biz.googleAdsId
                            ? "text-green-600"
                            : "text-gray-400";
                        const statusLabel = biz.googleAdsId
                            ? t("business.adsConnected")
                            : t("business.noAds");
                        return (
                            <button
                                key={biz.id}
                                onClick={() => {
                                    setActiveBusiness(biz.id);
                                    setOpen(false);
                                }}
                                className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition rounded-lg mx-1 ${isActive
                                    ? "bg-primary/10"
                                    : "hover:bg-border/50"
                                    }`}
                                style={{ width: "calc(100% - 0.5rem)" }}
                            >
                                <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${biz.color} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}>
                                    {biz.initials}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs font-medium truncate">{biz.name}</div>
                                    <div className={`text-[10px] ${statusColor} flex items-center gap-1`}>
                                        <Brain className="w-2.5 h-2.5" />
                                        {statusLabel}
                                    </div>
                                </div>
                                {isActive && <Check className="w-4 h-4 text-primary shrink-0" />}
                            </button>
                        );
                    })}
                    <div className="border-t border-border mt-1 pt-1 px-1">
                        <Link
                            href="/dashboard/knowledge-base"
                            onClick={() => setOpen(false)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-primary hover:bg-primary/5 transition rounded-lg"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            {t("business.addNew")}
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Dashboard Layout ───────────────────────────────────────────────────────

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { activeBusiness } = useBusiness();
    const { t } = useTranslation();

    // Notification state — use translations (sync-loaded so always available)
    const [notifications, setNotifications] = useState<Notification[]>([
        {
            id: "welcome",
            type: "info",
            title: t("notifications.welcome.title"),
            message: t("notifications.welcome.message"),
            time: "Just now",
            read: false,
            action: t("notifications.welcome.action"),
            actionHref: "/dashboard/knowledge-base",
        },
    ]);
    const [notifOpen, setNotifOpen] = useState(false);
    const notifRef = useRef<HTMLDivElement>(null);
    const [profileOpen, setProfileOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    // User session and plan state
    const [userPlan, setUserPlan] = useState<string>("free");
    const [userName, setUserName] = useState<string>("");
    const [userPicture, setUserPicture] = useState<string | null>(null);

    useEffect(() => {
        // Capture JWT token from URL hash (after Google OAuth redirect)
        captureTokenFromHash();

        // Fetch subscription info (authFetch adds JWT Authorization header)
        authFetch("/api/subscription")
            .then((r) => r.ok ? r.json() : null)
            .then((data) => {
                if (data?.plan) setUserPlan(data.plan);
                if (data?.userName) setUserName(data.userName);
                if (data?.userPicture) setUserPicture(data.userPicture);
            })
            .catch(() => { });
    }, []);

    const unreadCount = notifications.filter((n) => !n.read).length;

    // Close notification panel on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
            if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const markAsRead = useCallback((id: string) => {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    }, []);

    const markAllAsRead = useCallback(() => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }, []);

    const dismissNotification = useCallback((id: string) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, []);

    // Determine if current business supports shopping ads
    const hasShoppingAds = activeBusiness ? shoppingIndustries.some((kw) =>
        activeBusiness.industry.toLowerCase().includes(kw.toLowerCase())
    ) : false;

    const setupDone = activeBusiness?.setupComplete ?? false;

    // Redirect new users to onboarding if setup not complete
    useEffect(() => {
        if (!setupDone && pathname !== "/dashboard/chat" && pathname !== "/dashboard/settings" && pathname !== "/dashboard/knowledge-base" && pathname !== "/dashboard/faq" && pathname !== "/dashboard/billing" && pathname !== "/dashboard/drafts") {
            window.location.href = "/dashboard/chat";
        }
    }, [setupDone, pathname]);

    return (
        <div className="min-h-screen bg-background flex">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-border transform transition-transform lg:transform-none ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                    }`}
            >
                <div className="h-full flex flex-col">
                    {/* Logo */}
                    <div className="h-16 flex items-center justify-between px-4 border-b border-border">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                                <Zap className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-bold text-lg">AdMaster Pro</span>
                        </Link>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden p-1 text-muted hover:text-foreground"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Business switcher */}
                    <BusinessSwitcher />

                    {/* Nav */}
                    <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                        {mainNavItems
                            .filter((item) => !(item as { shoppingOnly?: boolean }).shoppingOnly || hasShoppingAds)
                            .filter((item) => setupDone || !item.requiresSetup)
                            .map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setSidebarOpen(false)}
                                        title={item.tip}
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${isActive
                                            ? "bg-primary text-white"
                                            : "text-muted hover:bg-border/50 hover:text-foreground"
                                            }`}
                                    >
                                        <item.icon className="w-4 h-4" />
                                        {t(item.labelKey)}
                                    </Link>
                                );
                            })}

                        {/* Setup progress hint when not complete */}
                        {!setupDone && (
                            <div className="mt-4 mx-1 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                <div className="text-xs font-semibold text-blue-600 mb-1">Getting Started</div>
                                <p className="text-[11px] text-blue-600/80 leading-relaxed">
                                    Connect your Google Ads account and add more info to your Knowledge Base to unlock the full power of AI.
                                </p>
                            </div>
                        )}
                    </nav>

                    {/* Bottom */}
                    <div className="p-3 border-t border-border">
                        <div className="bg-primary-light rounded-lg p-3 mb-3">
                            <div className="text-xs font-medium text-primary mb-1">
                                Free Plan
                            </div>
                            <div className="text-xs text-primary/70">
                                All features are currently free to use
                            </div>
                        </div>
                        <Link
                            href="/onboarding?guide=1"
                            className="flex items-center gap-2 px-3 py-2 text-xs text-muted hover:text-primary transition w-full rounded-lg hover:bg-primary/5"
                            title="Re-watch the step-by-step onboarding walkthrough"
                        >
                            <HelpCircle className="w-3.5 h-3.5" />
                            View Setup Guide
                        </Link>
                        <button
                            onClick={async () => {
                                clearAuth(); // Clear localStorage token
                                await fetch("/api/auth/signout", { method: "POST" });
                                window.location.href = "/login";
                            }}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-muted hover:text-danger transition w-full"
                        >
                            <LogOut className="w-4 h-4" />
                            {t("common.signOut")}
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top bar */}
                <header className="h-16 border-b border-border flex items-center justify-between px-4 bg-card">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="lg:hidden p-2 text-muted hover:text-foreground"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                    <div className="hidden lg:block" />
                    <div className="flex items-center gap-1.5">
                        {/* Language Switcher */}
                        <LanguageSwitcher compact />
                        {/* Notification Bell */}
                        <div ref={notifRef} className="relative">
                            <button
                                onClick={() => setNotifOpen(!notifOpen)}
                                className="relative p-2 text-muted hover:text-foreground transition"
                            >
                                <Bell className="w-5 h-5" />
                                {unreadCount > 0 && (
                                    <div className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-danger rounded-full flex items-center justify-center">
                                        <span className="text-[10px] font-bold text-white leading-none">{unreadCount}</span>
                                    </div>
                                )}
                            </button>

                            {notifOpen && (
                                <div className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] sm:w-96 max-w-96 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden">
                                    {/* Header */}
                                    <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-sm">{t("notifications.title")}</h3>
                                            {unreadCount > 0 && (
                                                <span className="bg-danger text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unreadCount}</span>
                                            )}
                                        </div>
                                        {unreadCount > 0 && (
                                            <button
                                                onClick={markAllAsRead}
                                                className="text-[11px] text-primary hover:underline font-medium"
                                            >
                                                {t("notifications.markAllRead")}
                                            </button>
                                        )}
                                    </div>

                                    {/* Notification List */}
                                    <div className="max-h-96 overflow-y-auto divide-y divide-border">
                                        {notifications.length === 0 ? (
                                            <div className="py-12 text-center">
                                                <Bell className="w-8 h-8 text-muted mx-auto mb-2 opacity-40" />
                                                <p className="text-sm text-muted">{t("notifications.empty")}</p>
                                            </div>
                                        ) : (
                                            notifications.map((n) => {
                                                const style = notificationIcons[n.type];
                                                return (
                                                    <div
                                                        key={n.id}
                                                        className={`px-4 py-3 hover:bg-border/30 transition cursor-pointer group ${!n.read ? "bg-primary/[0.03]" : ""}`}
                                                        onClick={() => markAsRead(n.id)}
                                                    >
                                                        <div className="flex gap-3">
                                                            <div className={`w-8 h-8 rounded-lg ${style.bg} flex items-center justify-center text-sm shrink-0`}>
                                                                {style.icon}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-start justify-between gap-2">
                                                                    <p className={`text-sm leading-snug ${!n.read ? "font-semibold" : "font-medium"}`}>
                                                                        {n.title}
                                                                    </p>
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); dismissNotification(n.id); }}
                                                                        className="opacity-0 group-hover:opacity-100 text-muted hover:text-foreground transition p-0.5"
                                                                    >
                                                                        <X className="w-3 h-3" />
                                                                    </button>
                                                                </div>
                                                                <p className="text-xs text-muted mt-0.5 leading-relaxed line-clamp-2">{n.message}</p>
                                                                <div className="flex items-center justify-between mt-1.5">
                                                                    <span className="text-[10px] text-muted">{n.time}</span>
                                                                    {n.action && n.actionHref && (
                                                                        <Link
                                                                            href={n.actionHref}
                                                                            onClick={(e) => { e.stopPropagation(); markAsRead(n.id); setNotifOpen(false); }}
                                                                            className="text-[11px] font-medium text-primary hover:underline"
                                                                        >
                                                                            {n.action} →
                                                                        </Link>
                                                                    )}
                                                                </div>
                                                                {!n.read && (
                                                                    <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-primary rounded-full" />
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>

                                    {/* Footer */}
                                    {notifications.length > 0 && (
                                        <div className="px-4 py-2.5 border-t border-border bg-card text-center">
                                            <button
                                                onClick={() => { setNotifications([]); setNotifOpen(false); }}
                                                className="text-[11px] text-muted hover:text-foreground transition font-medium"
                                            >
                                                {t("notifications.clear")}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div ref={profileRef} className="relative">
                            <button
                                onClick={() => setProfileOpen(!profileOpen)}
                                className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-medium overflow-hidden hover:ring-2 hover:ring-primary/30 transition"
                            >
                                {userPicture ? (
                                    <Image src={userPicture} alt="User profile" width={32} height={32} unoptimized className="w-full h-full object-cover" />
                                ) : (
                                    userName ? userName.charAt(0).toUpperCase() : "U"
                                )}
                            </button>

                            {profileOpen && (
                                <div className="absolute right-0 top-full mt-2 w-64 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden">
                                    {/* User Info */}
                                    <div className="px-4 py-3 border-b border-border">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white text-sm font-medium overflow-hidden shrink-0">
                                                {userPicture ? (
                                                    <Image src={userPicture} alt="User profile" width={40} height={40} unoptimized className="w-full h-full object-cover" />
                                                ) : (
                                                    userName ? userName.charAt(0).toUpperCase() : "U"
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold truncate">{userName || "User"}</p>
                                                <p className="text-xs text-muted capitalize">{userPlan} plan</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Menu Items */}
                                    <div className="py-1">
                                        <Link
                                            href="/dashboard/settings"
                                            onClick={() => setProfileOpen(false)}
                                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-border/30 transition"
                                        >
                                            <Settings className="w-4 h-4 text-muted" />
                                            {t("nav.settings")}
                                        </Link>
                                        <Link
                                            href="/dashboard/billing"
                                            onClick={() => setProfileOpen(false)}
                                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-border/30 transition"
                                        >
                                            <CreditCard className="w-4 h-4 text-muted" />
                                            {t("nav.billing")}
                                        </Link>
                                        <Link
                                            href="/dashboard/knowledge-base"
                                            onClick={() => setProfileOpen(false)}
                                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-border/30 transition"
                                        >
                                            <BookOpen className="w-4 h-4 text-muted" />
                                            {t("nav.knowledgeBase")}
                                        </Link>
                                    </div>

                                    {/* Sign Out */}
                                    <div className="border-t border-border py-1">
                                        <button
                                            onClick={async () => {
                                                setProfileOpen(false);
                                                clearAuth();
                                                await fetch("/api/auth/signout", { method: "POST" });
                                                window.location.href = "/login";
                                            }}
                                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-danger hover:bg-danger/5 transition w-full"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            {t("common.signOut")}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
            </div>
        </div>
    );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <BusinessProvider>
            <DashboardLayoutInner>{children}</DashboardLayoutInner>
        </BusinessProvider>
    );
}
