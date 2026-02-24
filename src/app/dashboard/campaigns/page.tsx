"use client";

import Link from "next/link";
import { FileText, Plus, ArrowRight, Zap, BarChart3, Globe, Shield } from "lucide-react";

export default function CampaignsPage() {
    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold">Campaigns</h1>
                <p className="text-muted text-sm mt-1">Manage and monitor all your Google Ads campaigns</p>
            </div>

            {/* Connect CTA */}
            <div className="bg-gradient-to-br from-primary/5 via-blue-500/5 to-purple-500/5 border border-primary/20 rounded-2xl p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
                    <Globe className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-xl font-bold mb-2">Connect Your Google Ads Account</h2>
                <p className="text-muted text-sm max-w-md mx-auto mb-6">
                    Link your Google Ads account to see real campaign data, manage budgets, and let the AI optimize your ads automatically.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl text-sm font-medium transition flex items-center justify-center gap-2 shadow-lg shadow-primary/20">
                        <Plus className="w-4 h-4" />
                        Connect Google Ads
                    </button>
                    <Link
                        href="/dashboard/demo/campaigns"
                        className="border border-border hover:border-primary text-foreground px-6 py-3 rounded-xl text-sm font-medium transition flex items-center justify-center gap-2"
                    >
                        <FileText className="w-4 h-4" />
                        View Demo Campaigns
                    </Link>
                </div>
            </div>

            {/* How It Works */}
            <div>
                <h3 className="font-semibold mb-4">How It Works</h3>
                <div className="grid md:grid-cols-3 gap-4">
                    {[
                        {
                            icon: Shield,
                            title: "Secure Connection",
                            desc: "We use Google OAuth 2.0 \u2014 we never see or store your password. You can revoke access anytime.",
                            color: "from-green-500 to-emerald-600",
                        },
                        {
                            icon: BarChart3,
                            title: "Real-Time Data",
                            desc: "See clicks, calls, spend, and conversions in real-time. The AI analyzes your data to find optimization opportunities.",
                            color: "from-blue-500 to-cyan-600",
                        },
                        {
                            icon: Zap,
                            title: "AI Optimization",
                            desc: "Your AI assistant will monitor campaigns 24/7, find money leaks, suggest keyword changes, and create better ads.",
                            color: "from-purple-500 to-pink-600",
                        },
                    ].map((item, i) => (
                        <div key={i} className="bg-card border border-border rounded-xl p-5">
                            <div className={`w-10 h-10 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center mb-3`}>
                                <item.icon className="w-5 h-5 text-white" />
                            </div>
                            <h4 className="font-medium text-sm mb-1">{item.title}</h4>
                            <p className="text-xs text-muted leading-relaxed">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* What You\u2019ll See */}
            <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-semibold mb-3">Once Connected, You\u2019ll See</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                    {[
                        "All active & paused campaigns with live stats",
                        "Daily budget, spend, clicks, and conversions",
                        "Cost per call / cost per conversion metrics",
                        "Campaign performance trends (up/down/flat)",
                        "AI-powered optimization suggestions",
                        "One-click campaign actions (pause, adjust budget)",
                        "Shopping campaign ROAS & purchase tracking",
                        "Display campaign impressions & click-through rates",
                    ].map((item, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                            <ArrowRight className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                            <span className="text-muted">{item}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* AI Tip */}
            <div className="bg-primary-light border border-primary/20 rounded-xl p-4">
                <p className="text-sm">
                    <strong>\uD83D\uDCA1 Tip:</strong> While you set up your Google Ads connection, you can already use the{" "}
                    <Link href="/dashboard/chat" className="text-primary hover:underline font-medium">AI Assistant</Link>{" "}
                    to create ad drafts, get keyword suggestions, and plan your campaigns. The AI will integrate with your real data once connected.
                </p>
            </div>
        </div>
    );
}
