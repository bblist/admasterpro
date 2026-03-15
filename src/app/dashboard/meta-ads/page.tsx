"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Facebook, Loader2, RefreshCw, Image, Film, Layers,
    MessageSquare, Eye, MousePointer, DollarSign, TrendingUp,
    Target, Users, Zap, ArrowUpRight, AlertTriangle, CheckCircle2,
    BarChart3, Sparkles
} from "lucide-react";
import { authFetch } from "@/lib/auth-client";
import { useBusiness } from "@/lib/business-context";

interface MetaStatus {
    configured: boolean;
    features?: string[];
    supportedFormats?: { name: string; specs: string }[];
    message?: string;
    comingSoon?: boolean;
}

interface MetaAdCreative {
    primaryText: string;
    headline: string;
    description: string;
    callToAction: string;
    format: string;
    audienceSuggestions: string[];
    notes: string;
}

const AD_FORMATS = [
    { id: "feed", label: "Feed", icon: Image, desc: "In-feed image ads" },
    { id: "stories", label: "Stories", icon: Film, desc: "Full-screen vertical" },
    { id: "reels", label: "Reels", icon: Film, desc: "Short-form video" },
    { id: "carousel", label: "Carousel", icon: Layers, desc: "Multi-card swipeable" },
    { id: "collection", label: "Collection", icon: Layers, desc: "Product showcase" },
    { id: "messenger", label: "Messenger", icon: MessageSquare, desc: "Conversation ads" },
];

export default function MetaAdsPage() {
    const { activeBusiness } = useBusiness();
    const [status, setStatus] = useState<MetaStatus | null>(null);
    const [loading, setLoading] = useState(true);

    const [selectedFormat, setSelectedFormat] = useState("feed");
    const [productName, setProductName] = useState("");
    const [targetAudience, setTargetAudience] = useState("");
    const [generating, setGenerating] = useState(false);
    const [creative, setCreative] = useState<MetaAdCreative | null>(null);

    const fetchStatus = useCallback(async () => {
        setLoading(true);
        try {
            const res = await authFetch("/api/meta-ads");
            const data = await res.json();
            setStatus(data);
        } catch {
            setStatus({ configured: false, message: "Failed to load" });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchStatus(); }, [fetchStatus]);

    const generateAd = async () => {
        if (!productName.trim()) return;
        setGenerating(true);
        setCreative(null);
        try {
            const res = await authFetch("/api/meta-ads", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "generate-ad",
                    format: selectedFormat,
                    productName,
                    targetAudience,
                    businessName: activeBusiness?.name || "",
                }),
            });
            const data = await res.json();
            if (data.result) setCreative(data.result);
        } catch {
            // noop
        } finally {
            setGenerating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Facebook className="w-7 h-7 text-blue-600" /> Meta Ads
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Facebook & Instagram advertising</p>
                </div>
                <button onClick={fetchStatus} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                    <RefreshCw className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>
            </div>

            {/* Status Banner */}
            {status?.comingSoon && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-100 dark:border-blue-800">
                    <div className="flex items-start gap-4">
                        <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-800">
                            <Zap className="w-6 h-6 text-blue-600 dark:text-blue-300" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-blue-900 dark:text-blue-100">Full Integration Coming Soon</h3>
                            <p className="text-blue-700 dark:text-blue-300 text-sm mt-1">{status.message}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Features Grid */}
            {status?.features && (
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Planned Features</h2>
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

            {/* Supported Formats */}
            {status?.supportedFormats && (
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Supported Ad Formats</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                        {status.supportedFormats.map((fmt) => (
                            <div key={fmt.name} className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
                                <div className="font-medium text-gray-900 dark:text-white text-sm">{fmt.name}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{fmt.specs}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* AI Ad Creative Generator */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-500" /> AI Ad Creative Generator
                </h2>

                {/* Format Selection */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                    {AD_FORMATS.map((fmt) => {
                        const Icon = fmt.icon;
                        return (
                            <button
                                key={fmt.id}
                                onClick={() => setSelectedFormat(fmt.id)}
                                className={`p-3 rounded-lg border text-center transition-all ${
                                    selectedFormat === fmt.id
                                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                                }`}
                            >
                                <Icon className={`w-5 h-5 mx-auto mb-1 ${selectedFormat === fmt.id ? "text-blue-600" : "text-gray-500"}`} />
                                <div className="text-xs font-medium">{fmt.label}</div>
                                <div className="text-[10px] text-gray-400">{fmt.desc}</div>
                            </button>
                        );
                    })}
                </div>

                {/* Input Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Product/Service Name</label>
                        <input
                            type="text"
                            value={productName}
                            onChange={(e) => setProductName(e.target.value)}
                            placeholder="e.g. Premium Yoga Mat"
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target Audience</label>
                        <input
                            type="text"
                            value={targetAudience}
                            onChange={(e) => setTargetAudience(e.target.value)}
                            placeholder="e.g. Women 25-45, fitness enthusiasts"
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        />
                    </div>
                </div>

                <button
                    onClick={generateAd}
                    disabled={!productName.trim() || generating}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium flex items-center gap-2"
                >
                    {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {generating ? "Generating..." : "Generate Ad Creative"}
                </button>
            </div>

            {/* Generated Creative */}
            {creative && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-500" /> Generated Creative — {selectedFormat.charAt(0).toUpperCase() + selectedFormat.slice(1)}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                            <div>
                                <div className="text-xs font-medium text-gray-500 uppercase">Primary Text</div>
                                <p className="text-sm text-gray-800 dark:text-gray-200 mt-1">{creative.primaryText}</p>
                            </div>
                            <div>
                                <div className="text-xs font-medium text-gray-500 uppercase">Headline</div>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">{creative.headline}</p>
                            </div>
                            <div>
                                <div className="text-xs font-medium text-gray-500 uppercase">Description</div>
                                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{creative.description}</p>
                            </div>
                            <div>
                                <div className="text-xs font-medium text-gray-500 uppercase">Call to Action</div>
                                <span className="inline-block mt-1 px-3 py-1 bg-blue-600 text-white text-xs rounded-lg font-medium">{creative.callToAction}</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <div className="text-xs font-medium text-gray-500 uppercase mb-2">Audience Suggestions</div>
                                <div className="flex flex-wrap gap-2">
                                    {creative.audienceSuggestions?.map((a, i) => (
                                        <span key={i} className="px-2 py-1 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-lg">
                                            {a}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            {creative.notes && (
                                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                                    <div className="text-xs font-medium text-yellow-700 dark:text-yellow-300">Strategy Notes</div>
                                    <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">{creative.notes}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Stats Preview */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Impressions", value: "—", icon: Eye, color: "text-blue-500" },
                    { label: "Clicks", value: "—", icon: MousePointer, color: "text-green-500" },
                    { label: "Spend", value: "—", icon: DollarSign, color: "text-orange-500" },
                    { label: "Conversions", value: "—", icon: Target, color: "text-purple-500" },
                ].map((s) => {
                    const Icon = s.icon;
                    return (
                        <div key={s.label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Icon className={`w-4 h-4 ${s.color}`} />
                                <span className="text-xs text-gray-500">{s.label}</span>
                            </div>
                            <div className="text-xl font-bold text-gray-400">{s.value}</div>
                            <div className="text-xs text-gray-400 mt-1">Connect account to view</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
