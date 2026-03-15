"use client";

import { useState, useEffect, useCallback } from "react";
import {
    ShoppingCart, Loader2, RefreshCw, Package, DollarSign, TrendingUp,
    Target, Zap, CheckCircle2, Sparkles, ArrowUpRight, BarChart3,
    Search, Award, Eye, Tag
} from "lucide-react";
import { authFetch } from "@/lib/auth-client";
import { useBusiness } from "@/lib/business-context";

interface AmazonStatus {
    configured: boolean;
    features?: string[];
    supportedCampaignTypes?: { name: string; description: string }[];
    metrics?: string[];
    message?: string;
    comingSoon?: boolean;
}

interface ListingResult {
    title: string;
    bulletPoints: string[];
    description: string;
    searchTerms: string;
    ppcKeywords: { exact: string[]; phrase: string[]; broad: string[]; negative: string[] };
    bidSuggestions: Record<string, Record<string, string>>;
    notes: string;
}

export default function AmazonAdsPage() {
    const { activeBusiness } = useBusiness();
    const [status, setStatus] = useState<AmazonStatus | null>(null);
    const [loading, setLoading] = useState(true);

    const [productName, setProductName] = useState("");
    const [category, setCategory] = useState("");
    const [features, setFeatures] = useState("");
    const [generating, setGenerating] = useState(false);
    const [listing, setListing] = useState<ListingResult | null>(null);

    const fetchStatus = useCallback(async () => {
        setLoading(true);
        try {
            const res = await authFetch("/api/amazon-ads");
            const data = await res.json();
            setStatus(data);
        } catch {
            setStatus({ configured: false, message: "Failed to load" });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchStatus(); }, [fetchStatus]);

    const generateListing = async () => {
        if (!productName.trim()) return;
        setGenerating(true);
        setListing(null);
        try {
            const res = await authFetch("/api/amazon-ads", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "generate-listing",
                    productName,
                    category,
                    features,
                }),
            });
            const data = await res.json();
            if (data.result) setListing(data.result);
        } catch { /* noop */ } finally { setGenerating(false); }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <ShoppingCart className="w-7 h-7 text-orange-500" /> Amazon Ads
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Sponsored Products, Brands & Display</p>
                </div>
                <button onClick={fetchStatus} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                    <RefreshCw className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>
            </div>

            {/* Coming Soon Banner */}
            {status?.comingSoon && (
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl p-6 border border-orange-100 dark:border-orange-800">
                    <div className="flex items-start gap-4">
                        <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-800">
                            <Zap className="w-6 h-6 text-orange-600 dark:text-orange-300" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-orange-900 dark:text-orange-100">Amazon Ads Integration Coming Soon</h3>
                            <p className="text-orange-700 dark:text-orange-300 text-sm mt-1">{status.message}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Campaign Types */}
            {status?.supportedCampaignTypes && (
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Campaign Types</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {status.supportedCampaignTypes.map((ct) => (
                            <div key={ct.name} className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                                <div className="flex items-center gap-2 mb-2">
                                    <Award className="w-5 h-5 text-orange-500" />
                                    <h3 className="font-medium text-gray-900 dark:text-white">{ct.name}</h3>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{ct.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Features */}
            {status?.features && (
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Features</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {status.features.map((f, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                <span className="text-sm text-gray-700 dark:text-gray-300">{f}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Amazon Metrics Preview */}
            {status?.metrics && (
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                    {status.metrics.map((m) => (
                        <div key={m} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 text-center">
                            <div className="text-xs text-gray-500">{m}</div>
                            <div className="text-lg font-bold text-gray-400 mt-1">—</div>
                        </div>
                    ))}
                </div>
            )}

            {/* AI Listing Optimizer */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-500" /> AI Listing Optimizer
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Product Name *</label>
                        <input
                            type="text"
                            value={productName}
                            onChange={(e) => setProductName(e.target.value)}
                            placeholder="e.g. Stainless Steel Water Bottle"
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                        <input
                            type="text"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            placeholder="e.g. Sports & Outdoors"
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Key Features</label>
                        <input
                            type="text"
                            value={features}
                            onChange={(e) => setFeatures(e.target.value)}
                            placeholder="e.g. BPA-free, 32oz, insulated"
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        />
                    </div>
                </div>

                <button
                    onClick={generateListing}
                    disabled={!productName.trim() || generating}
                    className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium flex items-center gap-2"
                >
                    {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {generating ? "Generating..." : "Generate Optimized Listing"}
                </button>
            </div>

            {/* Generated Listing */}
            {listing && (
                <div className="space-y-6">
                    {/* Title */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                            <Tag className="w-4 h-4 text-orange-500" /> Optimized Title
                        </h3>
                        <p className="text-gray-800 dark:text-gray-200 font-medium">{listing.title}</p>
                        <div className="text-xs text-gray-400 mt-1">{listing.title?.length || 0}/200 characters</div>
                    </div>

                    {/* Bullet Points */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Bullet Points</h3>
                        <ul className="space-y-2">
                            {listing.bulletPoints?.map((bp, i) => (
                                <li key={i} className="flex items-start gap-2">
                                    <span className="text-orange-500 font-bold text-sm mt-0.5">•</span>
                                    <span className="text-sm text-gray-700 dark:text-gray-300">{bp}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* PPC Keywords */}
                    {listing.ppcKeywords && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <Search className="w-4 h-4 text-blue-500" /> PPC Keywords
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {Object.entries(listing.ppcKeywords).map(([type, keywords]) => (
                                    <div key={type}>
                                        <div className="text-xs font-medium text-gray-500 uppercase mb-2">{type} Match</div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {(keywords as string[])?.map((kw, i) => (
                                                <span key={i} className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                                                    {kw}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Backend Search Terms */}
                    {listing.searchTerms && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Backend Search Terms</h3>
                            <p className="text-sm text-gray-700 dark:text-gray-300 font-mono bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">{listing.searchTerms}</p>
                            <div className="text-xs text-gray-400 mt-1">{listing.searchTerms?.length || 0}/250 characters</div>
                        </div>
                    )}

                    {/* Notes */}
                    {listing.notes && (
                        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-100 dark:border-yellow-800">
                            <div className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Strategy Notes</div>
                            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">{listing.notes}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
