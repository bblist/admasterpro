"use client";

import { Key, ArrowRight, Zap, Target, Ban, TrendingUp } from "lucide-react";
import Link from "next/link";

export default function KeywordsPage() {
    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Keyword Management</h1>
                    <p className="text-muted text-sm mt-1">Manage keywords across all your campaigns</p>
                </div>
            </div>

            {/* Empty State */}
            <div className="bg-card border border-border rounded-2xl p-12 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Key className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-xl font-bold mb-2">No keywords yet</h2>
                <p className="text-muted text-sm max-w-md mx-auto mb-8">
                    Connect your Google Ads account to manage your keywords, or ask the AI to research
                    keywords for your business and build keyword lists.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                        href="/dashboard/chat"
                        className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-medium transition"
                    >
                        <Zap className="w-4 h-4" />
                        Research Keywords with AI
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                        href="/dashboard/demo/keywords"
                        className="inline-flex items-center gap-2 bg-card border border-border hover:border-primary text-foreground px-6 py-3 rounded-xl font-medium transition"
                    >
                        See Example Keywords
                    </Link>
                </div>
            </div>

            {/* Keyword capabilities */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card border border-border rounded-xl p-5">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                        <Target className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="font-semibold mb-1">Match Types</h3>
                    <p className="text-xs text-muted">Broad, Phrase, and Exact match keywords. AI recommends the best types for your goals.</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-5">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mb-3">
                        <Ban className="w-5 h-5 text-red-600" />
                    </div>
                    <h3 className="font-semibold mb-1">Negative Keywords</h3>
                    <p className="text-xs text-muted">Block irrelevant searches to stop wasting money on clicks that don&apos;t convert.</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-5">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                    <h3 className="font-semibold mb-1">Performance Tracking</h3>
                    <p className="text-xs text-muted">See which keywords drive results and which are burning budget with no returns.</p>
                </div>
            </div>

            {/* Tip */}
            <div className="bg-primary-light border border-primary/20 rounded-xl p-4">
                <p className="text-sm">
                    <strong>💡 Pro tip:</strong> Ask the AI — &quot;Find me 20 high-intent keywords for an
                    emergency plumber in Dallas with low competition&quot; — and it will build your keyword
                    list with match types and bid suggestions.
                </p>
            </div>
        </div>
    );
}
