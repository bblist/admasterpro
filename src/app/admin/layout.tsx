"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Shield,
    LayoutDashboard,
    Users,
    DollarSign,
    BarChart3,
    ArrowLeft,
    Menu,
    X,
    Bell,
    Settings,
} from "lucide-react";
import { useState } from "react";

const adminNav = [
    { href: "/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/revenue", label: "Revenue", icon: DollarSign },
    { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
];

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gray-950 flex">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-gray-900 border-r border-gray-800 transform transition-transform lg:transform-none ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                    }`}
            >
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="p-5 border-b border-gray-800">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                                    <Shield className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <span className="text-white font-bold text-lg">Admin</span>
                                    <span className="text-red-400 text-xs block -mt-1">AdMaster Pro</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setSidebarOpen(false)}
                                className="lg:hidden text-gray-400"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Nav */}
                    <nav className="flex-1 p-4 space-y-1">
                        {adminNav.map((item) => {
                            const isActive =
                                pathname === item.href ||
                                (item.href !== "/admin" && pathname.startsWith(item.href));
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                                            ? "bg-red-600/20 text-red-400 border border-red-600/30"
                                            : "text-gray-400 hover:text-white hover:bg-gray-800"
                                        }`}
                                    onClick={() => setSidebarOpen(false)}
                                >
                                    <item.icon className="w-5 h-5" />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Footer */}
                    <div className="p-4 border-t border-gray-800">
                        <Link
                            href="/dashboard"
                            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to User Dashboard
                        </Link>
                        <div className="mt-3 text-xs text-gray-600">
                            Logged in as <span className="text-gray-400">admin@admasterpro.com</span>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top bar */}
                <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between lg:px-6">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden text-gray-400 hover:text-white"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <div className="hidden sm:block">
                            <h1 className="text-white font-semibold">Platform Control Center</h1>
                            <p className="text-xs text-gray-500">AdMaster Pro Internal Dashboard</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-900/30 border border-green-700/30 rounded-full">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-xs text-green-400 font-medium">System Online</span>
                        </div>
                        <button className="relative p-2 text-gray-400 hover:text-white">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-white">
                            <Settings className="w-5 h-5" />
                        </button>
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
            </div>
        </div>
    );
}
