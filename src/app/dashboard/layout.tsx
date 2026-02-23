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
} from "lucide-react";
import { useState } from "react";

const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/chat", label: "AI Assistant", icon: MessageCircle },
    { href: "/dashboard/campaigns", label: "Campaigns", icon: FileText },
    { href: "/dashboard/keywords", label: "Keywords", icon: Search },
    { href: "/dashboard/drafts", label: "Ad Drafts", icon: FileText },
    { href: "/dashboard/shopping", label: "Shopping Ads", icon: ShoppingBag },
    { href: "/dashboard/knowledge-base", label: "Knowledge Base", icon: BookOpen },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);

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

                    {/* Business info */}
                    <div className="px-4 py-3 border-b border-border">
                        <div className="text-sm font-medium">StyleVision Agency</div>
                        <div className="text-xs text-muted">Multi-client • Auto-Pilot: ON</div>
                    </div>

                    {/* Nav */}
                    <nav className="flex-1 p-3 space-y-1">
                        {navItems.map((item) => {
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
                            <div className="text-xs font-medium text-primary mb-1">Free Plan</div>
                            <div className="text-xs text-primary/70">2 of 3 AI suggestions used today</div>
                            <Link
                                href="/dashboard/settings"
                                className="text-xs font-medium text-primary hover:underline mt-1 inline-block"
                            >
                                Upgrade to Pro →
                            </Link>
                        </div>
                        <button className="flex items-center gap-2 px-3 py-2 text-sm text-muted hover:text-danger transition w-full">
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
