"use client";

import { ShoppingBag, ArrowRight, Zap, Package, TrendingUp, Tag } from "lucide-react";
import Link from "next/link";

export default function ShoppingPage() {
    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Shopping Ads</h1>
                    <p className="text-muted text-sm mt-1">Manage your product listings and shopping campaigns</p>
                </div>
            </div>

            {/* Empty State */}
            <div className="bg-card border border-border rounded-2xl p-12 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <ShoppingBag className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-xl font-bold mb-2">No shopping campaigns yet</h2>
                <p className="text-muted text-sm max-w-md mx-auto mb-8">
                    Connect your Google Ads account and Merchant Center to manage shopping campaigns,
                    or ask the AI to help you set up product listings.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                        href="/dashboard/chat"
                        className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-medium transition"
                    >
                        <Zap className="w-4 h-4" />
                        Set Up Shopping with AI
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                        href="/dashboard/demo/shopping"
                        className="inline-flex items-center gap-2 bg-card border border-border hover:border-primary text-foreground px-6 py-3 rounded-xl font-medium transition"
                    >
                        See Example Products
                    </Link>
                </div>
            </div>

            {/* Shopping capabilities */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card border border-border rounded-xl p-5">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                        <Package className="w-5 h-5 text-purple-600" />
                    </div>
                    <h3 className="font-semibold mb-1">Product Listings</h3>
                    <p className="text-xs text-muted">Show your products with images, prices, and store info directly in Google Search results.</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-5">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                    <h3 className="font-semibold mb-1">ROAS Tracking</h3>
                    <p className="text-xs text-muted">Track return on ad spend per product. See which items are making money and which aren&apos;t.</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-5">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-3">
                        <Tag className="w-5 h-5 text-orange-600" />
                    </div>
                    <h3 className="font-semibold mb-1">Smart Bidding</h3>
                    <p className="text-xs text-muted">AI-optimized bids to maximize sales while staying within your budget targets.</p>
                </div>
            </div>

            {/* Tip */}
            <div className="bg-primary-light border border-primary/20 rounded-xl p-4">
                <p className="text-sm">
                    <strong>💡 Pro tip:</strong> Tell the AI — &quot;Set up a shopping campaign for my
                    online clothing store with a $50/day budget targeting women 25-45&quot; — and it will
                    plan the full shopping campaign structure for you.
                </p>
            </div>
        </div>
    );
}
