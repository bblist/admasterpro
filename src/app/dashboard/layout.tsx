"use client";

import Link from "next/link";
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
} from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { BusinessProvider, useBusiness } from "@/lib/business-context";
import { captureTokenFromHash, authFetch, clearAuth } from "@/lib/auth-client";

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
        message: "Start by training your AI — upload brand assets and enter your business profile in the Knowledge Base.",
        time: "Just now",
        read: false,
        action: "Get Started",
        actionHref: "/dashboard/knowledge-base",
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
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/chat", label: "AI Assistant", icon: MessageCircle },
    { href: "/dashboard/campaigns", label: "Campaigns", icon: FileText },
    { href: "/dashboard/keywords", label: "Keywords", icon: Search },
    { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/dashboard/calls", label: "Call Tracking", icon: Phone },
    { href: "/dashboard/drafts", label: "Ad Drafts", icon: FileText },
    { href: "/dashboard/shopping", label: "Shopping Ads", icon: ShoppingBag, shoppingOnly: true },
    { href: "/dashboard/knowledge-base", label: "Knowledge Base", icon: BookOpen },
    { href: "/dashboard/demo/examples", label: "AI Examples", icon: Lightbulb },
    { href: "/dashboard/faq", label: "FAQ", icon: HelpCircle },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

// Industries that can use shopping ads
const shoppingIndustries = ["Retail", "Fashion", "E-commerce", "Boutique"];

// ─── Business Switcher ──────────────────────────────────────────────────────

function BusinessSwitcher() {
    const { businesses, activeBusiness, setActiveBusiness } = useBusiness();
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
                        {activeBusiness?.name || "No Business"}
                        <div className={`w-1.5 h-1.5 rounded-full ${kbColor} shrink-0`} title={activeBusiness?.googleAdsId ? "Ads Connected" : "No Ads"} />
                    </div>
                    <div className="text-[11px] text-muted truncate">{activeBusiness?.industry || "Add a business"}</div>
                </div>
                <ChevronDown className={`w-4 h-4 text-muted shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>

            {open && (
                <div className="absolute left-2 right-2 top-full mt-1 bg-card border border-border rounded-xl shadow-xl z-50 py-1 max-h-80 overflow-y-auto">
                    <div className="px-3 py-1.5 text-[10px] font-semibold text-muted uppercase tracking-wider">
                        Your Businesses
                    </div>
                    {businesses.map((biz) => {
                        const isActive = biz.id === activeBusiness?.id;
                        const statusColor = biz.googleAdsId
                            ? "text-green-600"
                            : "text-gray-400";
                        const statusLabel = biz.googleAdsId
                            ? "Ads Connected"
                            : "No Ads";
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
                            Add New Business
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

    // Notification state
    const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
    const [notifOpen, setNotifOpen] = useState(false);
    const notifRef = useRef<HTMLDivElement>(null);

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
                            .map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setSidebarOpen(false)}
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${isActive
                                            ? "bg-primary text-white"
                                            : "text-muted hover:bg-border/50 hover:text-foreground"
                                            }`}
                                    >
                                        <item.icon className="w-4 h-4" />
                                        {item.label}
                                    </Link>
                                );
                            })}


                    </nav>

                    {/* Bottom */}
                    <div className="p-3 border-t border-border">
                        <div className="bg-primary-light rounded-lg p-3 mb-3">
                            <div className="text-xs font-medium text-primary mb-1">
                                {userPlan === "pro" ? "Pro Plan" : userPlan === "starter" ? "Starter Plan" : "Free Plan"}
                            </div>
                            <div className="text-xs text-primary/70">
                                {userPlan === "pro"
                                    ? "Unlimited AI messages + all features"
                                    : userPlan === "starter"
                                        ? "200 AI messages/mo + display ads"
                                        : "Upgrade for more AI messages + features"}
                            </div>
                            {userPlan !== "pro" && (
                                <Link
                                    href="/pricing"
                                    className="text-xs font-medium text-primary hover:underline mt-1 inline-block"
                                >
                                    {userPlan === "free" ? "View Plans →" : "Upgrade →"}
                                </Link>
                            )}
                        </div>
                        <button
                            onClick={async () => {
                                clearAuth(); // Clear localStorage token
                                await fetch("/api/auth/signout", { method: "POST" });
                                window.location.href = "/login";
                            }}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-muted hover:text-danger transition w-full"
                        >
                            <LogOut className="w-4 h-4" />
                            Sign Out
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
                    <div className="flex items-center gap-3">
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
                                            <h3 className="font-semibold text-sm">Notifications</h3>
                                            {unreadCount > 0 && (
                                                <span className="bg-danger text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unreadCount}</span>
                                            )}
                                        </div>
                                        {unreadCount > 0 && (
                                            <button
                                                onClick={markAllAsRead}
                                                className="text-[11px] text-primary hover:underline font-medium"
                                            >
                                                Mark all as read
                                            </button>
                                        )}
                                    </div>

                                    {/* Notification List */}
                                    <div className="max-h-96 overflow-y-auto divide-y divide-border">
                                        {notifications.length === 0 ? (
                                            <div className="py-12 text-center">
                                                <Bell className="w-8 h-8 text-muted mx-auto mb-2 opacity-40" />
                                                <p className="text-sm text-muted">No notifications</p>
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
                                                Clear all notifications
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-medium overflow-hidden">
                            {userPicture ? (
                                <img src={userPicture} alt="" className="w-full h-full object-cover" />
                            ) : (
                                userName ? userName.charAt(0).toUpperCase() : "U"
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
