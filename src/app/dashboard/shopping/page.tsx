"use client";

import Link from "next/link";
import {
    ShoppingBag,
    MessageCircle,
    ArrowRight,
    Layers,
    Store,
    Sparkles,
    BarChart3,
    Image,
} from "lucide-react";

export default function ShoppingPage() {
    return (
        <div className="max-w-3xl mx-auto">
            {/* Empty State */}
            <div className="text-center py-16">
                <div className="w-20 h-20 bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <ShoppingBag className="w-10 h-10 text-green-500/60" />
                </div>

                <h1 className="text-2xl font-bold mb-2">Shopping Ads</h1>
                <p className="text-muted text-sm max-w-md mx-auto mb-8 leading-relaxed">
                    Connect your e-commerce store to create Google Shopping ads automatically.
                    Your products will appear with images, prices, and your store name directly in search results.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
                    <Link
                        href="/dashboard/chat"
                        className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-green-700 transition shadow-lg shadow-green-600/20"
                    >
                        <Store className="w-4 h-4" />
                        Connect Your Store
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                        href="/dashboard/demo/shopping"
                        className="inline-flex items-center gap-2 border border-border px-6 py-3 rounded-xl text-sm font-medium text-muted hover:text-foreground hover:border-primary/50 transition"
                    >
                        <Layers className="w-4 h-4" />
                        View Demo Example
                    </Link>
                </div>

                {/* Features */}
                <div className="bg-card border border-border rounded-xl p-6 text-left max-w-lg mx-auto">
                    <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-green-600" />
                        What you get with Shopping Ads
                    </h3>
                    <div className="space-y-4">
                        {[
                            {
                                icon: Store,
                                title: "Shopify integration",
                                desc: "One-click sync with your Shopify store. Products, prices, and inventory update automatically.",
                                color: "bg-green-100 text-green-600",
                            },
                            {
                                icon: Image,
                                title: "Visual product ads",
                                desc: "Show product images, prices, and your store name at the top of Google search results.",
                                color: "bg-blue-100 text-blue-600",
                            },
                            {
                                icon: Sparkles,
                                title: "AI-optimized titles",
                                desc: "Our AI rewrites product titles and descriptions to improve click-through rates.",
                                color: "bg-amber-100 text-amber-600",
                            },
                            {
                                icon: BarChart3,
                                title: "Performance tracking",
                                desc: "Track clicks, impressions, conversions, and ROAS for every product.",
                                color: "bg-purple-100 text-purple-600",
                            },
                        ].map((item) => (
                            <div key={item.title} className="flex gap-3">
                                <div className={`w-8 h-8 rounded-lg ${item.color} flex items-center justify-center shrink-0`}>
                                    <item.icon className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className="text-sm font-medium">{item.title}</div>
                                    <div className="text-xs text-muted mt-0.5 leading-relaxed">{item.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CTA */}
                <div className="mt-8 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5 max-w-lg mx-auto">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center shrink-0">
                            <MessageCircle className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-left">
                            <div className="text-sm font-semibold">Need help getting started?</div>
                            <div className="text-xs text-muted mt-0.5">
                                Ask the AI assistant: &quot;Help me set up shopping ads&quot; or &quot;Connect my Shopify store.&quot;
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
