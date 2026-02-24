"use client";

import {
    DollarSign,
    TrendingUp,
    MessageCircle,
    Zap,
    ArrowRight,
    BookOpen,
    Settings,
    Lightbulb,
    Target,
    BarChart3,
    Shield,
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Welcome Header */}
            <div className="bg-gradient-to-br from-primary/10 via-blue-50/50 to-accent/10 dark:from-primary/5 dark:via-transparent dark:to-accent/5 border border-primary/20 rounded-2xl p-8">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shrink-0">
                        <Zap className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold mb-2">Welcome to AdMaster Pro</h1>
                        <p className="text-muted leading-relaxed max-w-2xl">
                            Your AI-powered Google Ads manager is ready. Connect your Google Ads account
                            to see real performance data, or start chatting with the AI assistant to get
                            campaign recommendations and ad copy.
                        </p>
                        <div className="flex flex-wrap gap-3 mt-5">
                            <Link
                                href="/dashboard/chat"
                                className="bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-lg text-sm font-medium transition flex items-center gap-2"
                            >
                                <MessageCircle className="w-4 h-4" />
                                Chat with AI Assistant
                            </Link>
                            <Link
                                href="/dashboard/knowledge-base"
                                className="border border-border hover:border-primary text-foreground px-5 py-2.5 rounded-lg text-sm font-medium transition flex items-center gap-2"
                            >
                                <BookOpen className="w-4 h-4" />
                                Set Up Knowledge Base
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Getting Started Steps */}
            <div>
                <h2 className="text-lg font-semibold mb-4">Get Started in 3 Steps</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link href="/dashboard/knowledge-base" className="group bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-3">
                            <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-medium">Step 1</span>
                        </div>
                        <h3 className="font-medium text-sm mb-1 group-hover:text-primary transition">Train Your AI</h3>
                        <p className="text-xs text-muted leading-relaxed">
                            Upload brand assets, enter your business profile, and let the AI learn your brand voice.
                        </p>
                    </Link>

                    <Link href="/dashboard/chat" className="group bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition">
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-3">
                            <MessageCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full font-medium">Step 2</span>
                        </div>
                        <h3 className="font-medium text-sm mb-1 group-hover:text-primary transition">Chat with AI</h3>
                        <p className="text-xs text-muted leading-relaxed">
                            Get campaign recommendations, ad copy, keyword ideas, and a full account audit.
                        </p>
                    </Link>

                    <Link href="/dashboard/settings" className="group bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition">
                        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-3">
                            <Settings className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full font-medium">Step 3</span>
                        </div>
                        <h3 className="font-medium text-sm mb-1 group-hover:text-primary transition">Connect Google Ads</h3>
                        <p className="text-xs text-muted leading-relaxed">
                            Link your Google Ads account to get real data and let the AI manage your campaigns.
                        </p>
                    </Link>
                </div>
            </div>

            {/* What You Get */}
            <div className="bg-card border border-border rounded-xl p-6">
                <h2 className="font-semibold mb-4">What AdMaster Pro Does For You</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-danger/10 rounded-lg flex items-center justify-center shrink-0">
                            <DollarSign className="w-4 h-4 text-danger" />
                        </div>
                        <div>
                            <h3 className="text-sm font-medium">Find Money Leaks</h3>
                            <p className="text-xs text-muted mt-0.5">AI identifies keywords wasting your budget with zero conversions.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-success/10 rounded-lg flex items-center justify-center shrink-0">
                            <TrendingUp className="w-4 h-4 text-success" />
                        </div>
                        <div>
                            <h3 className="text-sm font-medium">Boost Winners</h3>
                            <p className="text-xs text-muted mt-0.5">Double down on keywords that bring real customers at low cost.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center shrink-0">
                            <Lightbulb className="w-4 h-4 text-accent" />
                        </div>
                        <div>
                            <h3 className="text-sm font-medium">Write Better Ads</h3>
                            <p className="text-xs text-muted mt-0.5">AI-generated ad copy trained on your brand voice and industry.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                            <Target className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-sm font-medium">Smart Targeting</h3>
                            <p className="text-xs text-muted mt-0.5">Find the right keywords for your business and budget.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-warning/10 rounded-lg flex items-center justify-center shrink-0">
                            <BarChart3 className="w-4 h-4 text-warning" />
                        </div>
                        <div>
                            <h3 className="text-sm font-medium">Real-Time Analytics</h3>
                            <p className="text-xs text-muted mt-0.5">Clear dashboards showing exactly where every dollar goes.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center shrink-0">
                            <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h3 className="text-sm font-medium">Auto-Pilot Mode</h3>
                            <p className="text-xs text-muted mt-0.5">Let AI handle daily optimizations while you focus on your business.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link
                    href="/dashboard/demo/examples"
                    className="group bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition flex items-center gap-4"
                >
                    <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center shrink-0">
                        <Lightbulb className="w-5 h-5 text-accent" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-medium text-sm group-hover:text-primary transition">See AI in Action</h3>
                        <p className="text-xs text-muted mt-0.5">Browse real examples of AI-generated ads and strategies.</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted group-hover:text-primary transition" />
                </Link>

                <Link
                    href="/dashboard/faq"
                    className="group bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition flex items-center gap-4"
                >
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                        <MessageCircle className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-medium text-sm group-hover:text-primary transition">Frequently Asked Questions</h3>
                        <p className="text-xs text-muted mt-0.5">Learn how to get the most out of AdMaster Pro.</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted group-hover:text-primary transition" />
                </Link>
            </div>
        </div>
    );
}
