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
    ChevronRight,
    Check,
    Plus,
    Brain,
    Layers,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { BusinessProvider, useBusiness } from "@/lib/business-context";

// ─── Nav items (real sections + demo section) ─────────────────────────────

const mainNavItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/chat", label: "AI Assistant", icon: MessageCircle },
    { href: "/dashboard/campaigns", label: "Campaigns", icon: FileText },
    { href: "/dashboard/keywords", label: "Keywords", icon: Search },
    { href: "/dashboard/drafts", label: "Ad Drafts", icon: FileText },
    { href: "/dashboard/shopping", label: "Shopping Ads", icon: ShoppingBag, shoppingOnly: true },
    { href: "/dashboard/knowledge-base", label: "Knowledge Base", icon: BookOpen },
    { href: "/dashboard/faq", label: "FAQ", icon: HelpCircle },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

const demoNavItems = [
    { href: "/dashboard/demo/drafts", label: "Ad Drafts", icon: FileText },
    { href: "/dashboard/demo/shopping", label: "Shopping Ads", icon: ShoppingBag },
    { href: "/dashboard/demo/examples", label: "AI Examples", icon: Lightbulb },
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

    const kbColor = activeBusiness.kbStatus === "trained"
        ? "bg-green-500"
        : activeBusiness.kbStatus === "training"
            ? "bg-amber-500 animate-pulse"
            : "bg-gray-400";

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center gap-2.5 px-4 py-3 border-b border-border hover:bg-border/30 transition text-left group"
            >
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${activeBusiness.color} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                    {activeBusiness.initials}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate flex items-center gap-1.5">
                        {activeBusiness.name}
                        <div className={`w-1.5 h-1.5 rounded-full ${kbColor} shrink-0`} title={`KB: ${activeBusiness.kbStatus}`} />
                    </div>
                    <div className="text-[11px] text-muted truncate">{activeBusiness.industry}</div>
                </div>
                <ChevronDown className={`w-4 h-4 text-muted shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>

            {open && (
                <div className="absolute left-2 right-2 top-full mt-1 bg-card border border-border rounded-xl shadow-xl z-50 py-1 max-h-80 overflow-y-auto">
                    <div className="px-3 py-1.5 text-[10px] font-semibold text-muted uppercase tracking-wider">
                        Your Businesses
                    </div>
                    {businesses.map((biz) => {
                        const isActive = biz.id === activeBusiness.id;
                        const statusColor = biz.kbStatus === "trained"
                            ? "text-green-600"
                            : biz.kbStatus === "training"
                                ? "text-amber-600"
                                : "text-gray-400";
                        const statusLabel = biz.kbStatus === "trained"
                            ? "KB Trained"
                            : biz.kbStatus === "training"
                                ? "Training..."
                                : "No KB";
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
    const [demoOpen, setDemoOpen] = useState(() => pathname.startsWith("/dashboard/demo"));
    const { activeBusiness } = useBusiness();

    // Determine if current business supports shopping ads
    const hasShoppingAds = shoppingIndustries.some((kw) =>
        activeBusiness.industry.toLowerCase().includes(kw.toLowerCase())
    );

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

                        {/* Demo Examples section */}
                        <div className="pt-2 mt-2 border-t border-border">
                            <button
                                onClick={() => setDemoOpen(!demoOpen)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                                    pathname.startsWith("/dashboard/demo")
                                        ? "bg-primary/10 text-primary font-medium"
                                        : "text-muted hover:bg-border/50 hover:text-foreground"
                                }`}
                            >
                                <Layers className="w-4 h-4" />
                                <span className="flex-1 text-left">Demo Examples</span>
                                {demoOpen ? (
                                    <ChevronDown className="w-3.5 h-3.5" />
                                ) : (
                                    <ChevronRight className="w-3.5 h-3.5" />
                                )}
                            </button>

                            {demoOpen && (
                                <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-border pl-2">
                                    {demoNavItems.map((item) => {
                                        const isActive = pathname === item.href;
                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                onClick={() => setSidebarOpen(false)}
                                                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] transition ${isActive
                                                    ? "bg-primary text-white"
                                                    : "text-muted hover:bg-border/50 hover:text-foreground"
                                                    }`}
                                            >
                                                <item.icon className="w-3.5 h-3.5" />
                                                {item.label}
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </nav>

                    {/* Bottom */}
                    <div className="p-3 border-t border-border">
                        <div className="bg-primary-light rounded-lg p-3 mb-3">
                            <div className="text-xs font-medium text-primary mb-1">Free Plan</div>
                            <div className="text-xs text-primary/70">2 of 3 AI suggestions used today</div>
                            <Link
                                href="/dashboard/settings"
                                className="text-xs font-medium text-primary hover:underline mt-1 inline-block"
                            >
                                Upgrade to Pro →
                            </Link>
                        </div>
                        <Link
                            href="/login"
                            className="flex items-center gap-2 px-3 py-2 text-sm text-muted hover:text-danger transition w-full"
                        >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                        </Link>
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
                        <button className="relative p-2 text-muted hover:text-foreground transition">
                            <Bell className="w-5 h-5" />
                            <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full"></div>
                        </button>
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-medium">
                            S
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
