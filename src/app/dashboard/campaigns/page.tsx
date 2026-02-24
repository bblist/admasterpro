"use client";

import { BarChart3, ArrowRight, Search, ShoppingBag, Image, Zap } from "lucide-react";
import Link from "next/link";

export default function CampaignsPage() {
    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Your Campaigns</h1>
                    <p className="text-muted text-sm mt-1">Manage all your Google Ads campaigns</p>
                </div>
            </div>

            {/* Empty State */}
            <div className="bg-card border border-border rounded-2xl p-12 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <BarChart3 className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-xl font-bold mb-2">No campaigns yet</h2>
                <p className="text-muted text-sm max-w-md mx-auto mb-8">
                    Connect your Google Ads account to see your live campaigns here, or chat with our
                    AI to create your first campaign from scratch.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                        href="/dashboard/chat"
                        className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-medium transition"
                    >
                        <Zap className="w-4 h-4" />
                        Create Campaign with AI
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                        href="/dashboard/demo/campaigns"
                        className="inline-flex items-center gap-2 bg-card border border-border hover:border-primary text-foreground px-6 py-3 rounded-xl font-medium transition"
                    >
                        See Example Campaigns
                    </Link>
                </div>
            </div>

            {/* Campaign types */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card border border-border rounded-xl p-5">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                        <Search className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="font-semibold mb-1">Search Campaigns</h3>
                    <p className="text-xs text-muted">Text ads on Google Search results. Best for leads, calls, and direct response.</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-5">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                        <ShoppingBag className="w-5 h-5 text-purple-600" />
                    </div>
                    <h3 className="font-semibold mb-1">Shopping Campaigns</h3>
                    <p className="text-xs text-muted">Product listings with images and prices. Best for e-commerce stores.</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-5">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-3">
                        <Image className="w-5 h-5 text-orange-600" />
                    </div>
                    <h3 className="font-semibold mb-1">Display Campaigns</h3>
                    <p className="text-xs text-muted">Visual banner ads across millions of websites. Best for brand awareness.</p>
                </div>
            </div>

            {/* Tip */}
            <div className="bg-primary-light border border-primary/20 rounded-xl p-4">
                <p className="text-sm">
                    <strong>💡 Pro tip:</strong> Tell the AI assistant exactly what you need —
                    &quot;Create a search campaign for my dental practice targeting people looking for teeth whitening in Miami&quot; —
                    and it will build the full campaign structure for you.
                </p>
            </div>
        </div>
    );
}
