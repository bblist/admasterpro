"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Phone, PhoneCall, PhoneOff, PhoneMissed, Clock, TrendingUp,
    RefreshCw, AlertCircle, Loader2, ArrowRight, Zap, Calendar,
    BarChart3
} from "lucide-react";
import Link from "next/link";
import { authFetch } from "@/lib/auth-client";
import { useBusiness } from "@/lib/business-context";

interface CallData {
    date: string;
    campaignName: string;
    callerNumber: string;
    callDuration: number;
    callType: string;
    callStatus: string;
}

function formatDuration(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
}

function getCallStatusIcon(status: string) {
    switch (status) {
        case "RECEIVED": return <PhoneCall className="w-4 h-4 text-green-500" />;
        case "MISSED": return <PhoneMissed className="w-4 h-4 text-red-500" />;
        default: return <Phone className="w-4 h-4 text-muted" />;
    }
}

export default function CallsPage() {
    const { activeBusiness } = useBusiness();
    const [calls, setCalls] = useState<CallData[]>([]);
    const [loading, setLoading] = useState(true);
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState("LAST_30_DAYS");

    const fetchCalls = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({ type: "calls", dateRange });
            if (activeBusiness?.id) params.set("businessId", activeBusiness.id);

            const res = await authFetch(`/api/google-ads/performance?${params}`);
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Failed to fetch call data");
            setCalls(data.data || []);
            setConnected(data.connected !== false);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load call data");
        } finally {
            setLoading(false);
        }
    }, [dateRange, activeBusiness?.id]);

    useEffect(() => {
        fetchCalls();
    }, [fetchCalls]);

    // Stats
    const totalCalls = calls.length;
    const answeredCalls = calls.filter(c => c.callStatus === "RECEIVED").length;
    const missedCalls = calls.filter(c => c.callStatus === "MISSED").length;
    const avgDuration = totalCalls > 0
        ? Math.round(calls.reduce((sum, c) => sum + c.callDuration, 0) / totalCalls)
        : 0;
    const longCalls = calls.filter(c => c.callDuration >= 60).length;

    if (!loading && !connected) {
        return (
            <div className="max-w-4xl mx-auto space-y-6">
                <h1 className="text-2xl font-bold">Call Tracking</h1>
                <div className="bg-card border border-border rounded-2xl p-12 text-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Phone className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold mb-2">Connect Google Ads for Call Tracking</h2>
                    <p className="text-muted text-sm max-w-md mx-auto mb-8">
                        Link your Google Ads account with call extensions enabled to track phone calls from your ads.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link href="/dashboard/settings" className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-medium transition">
                            Connect Account <ArrowRight className="w-4 h-4" />
                        </Link>
                        <Link href="/dashboard/chat" className="inline-flex items-center gap-2 bg-card border border-border hover:border-primary px-6 py-3 rounded-xl font-medium transition">
                            <Zap className="w-4 h-4" /> Set Up Call Tracking with AI
                        </Link>
                    </div>
                </div>
                {/* Info cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-card border border-border rounded-xl p-5">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                            <PhoneCall className="w-5 h-5 text-green-600" />
                        </div>
                        <h3 className="font-semibold mb-1">Call Extensions</h3>
                        <p className="text-xs text-muted">Add your phone number to ads so customers can call directly from search results.</p>
                    </div>
                    <div className="bg-card border border-border rounded-xl p-5">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                            <BarChart3 className="w-5 h-5 text-blue-600" />
                        </div>
                        <h3 className="font-semibold mb-1">Call Analytics</h3>
                        <p className="text-xs text-muted">Track call duration, answered vs. missed, and which campaigns drive the most calls.</p>
                    </div>
                    <div className="bg-card border border-border rounded-xl p-5">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                            <TrendingUp className="w-5 h-5 text-purple-600" />
                        </div>
                        <h3 className="font-semibold mb-1">Call Conversions</h3>
                        <p className="text-xs text-muted">Set up call conversion tracking to measure calls as conversions in Google Ads.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Call Tracking</h1>
                    <p className="text-muted text-sm mt-1">Track phone calls from your Google Ads</p>
                </div>
                <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted" />
                    <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}
                        className="bg-card border border-border rounded-lg px-3 py-2 text-sm">
                        <option value="LAST_7_DAYS">Last 7 days</option>
                        <option value="LAST_14_DAYS">Last 14 days</option>
                        <option value="LAST_30_DAYS">Last 30 days</option>
                        <option value="THIS_MONTH">This month</option>
                    </select>
                    <button onClick={fetchCalls} className="p-2 bg-card border border-border rounded-lg hover:border-primary transition">
                        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 text-sm text-muted mb-1"><Phone className="w-4 h-4" /> Total Calls</div>
                    <div className="text-2xl font-bold">{totalCalls}</div>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 text-sm text-muted mb-1"><PhoneCall className="w-4 h-4 text-green-500" /> Answered</div>
                    <div className="text-2xl font-bold text-green-600">{answeredCalls}</div>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 text-sm text-muted mb-1"><PhoneMissed className="w-4 h-4 text-red-500" /> Missed</div>
                    <div className="text-2xl font-bold text-red-600">{missedCalls}</div>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 text-sm text-muted mb-1"><Clock className="w-4 h-4" /> Avg Duration</div>
                    <div className="text-2xl font-bold">{formatDuration(avgDuration)}</div>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 text-sm text-muted mb-1"><TrendingUp className="w-4 h-4" /> Quality Calls</div>
                    <div className="text-2xl font-bold">{longCalls}</div>
                    <div className="text-xs text-muted">60s+</div>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-700">
                    <AlertCircle className="w-5 h-5" />
                    <p className="text-sm">{error}</p>
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            )}

            {/* Call Log Table */}
            {!loading && calls.length > 0 && (
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                    <div className="p-4 border-b border-border">
                        <h2 className="text-lg font-semibold">Call Log</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border bg-muted/30">
                                    <th className="text-left p-3 font-medium">Status</th>
                                    <th className="text-left p-3 font-medium">Date</th>
                                    <th className="text-left p-3 font-medium">Campaign</th>
                                    <th className="text-left p-3 font-medium">Area Code</th>
                                    <th className="text-right p-3 font-medium">Duration</th>
                                    <th className="text-left p-3 font-medium">Source</th>
                                </tr>
                            </thead>
                            <tbody>
                                {calls.map((call, i) => (
                                    <tr key={i} className="border-b border-border/50 hover:bg-muted/10 transition">
                                        <td className="p-3">{getCallStatusIcon(call.callStatus)}</td>
                                        <td className="p-3">{call.date}</td>
                                        <td className="p-3 max-w-[200px] truncate">{call.campaignName}</td>
                                        <td className="p-3 font-mono">{call.callerNumber}</td>
                                        <td className="p-3 text-right font-medium">
                                            <span className={call.callDuration >= 60 ? "text-green-600" : call.callDuration === 0 ? "text-red-500" : ""}>
                                                {formatDuration(call.callDuration)}
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">
                                                {call.callType || "Ad"}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {!loading && calls.length === 0 && connected && (
                <div className="bg-card border border-border rounded-2xl p-12 text-center">
                    <PhoneOff className="w-12 h-12 text-muted mx-auto mb-4" />
                    <h2 className="text-xl font-bold mb-2">No call data found</h2>
                    <p className="text-muted text-sm max-w-md mx-auto mb-6">
                        Your account may not have call extensions set up, or there are no recorded calls in the selected period.
                        Ask the AI how to enable call tracking in your campaigns.
                    </p>
                    <Link href="/dashboard/chat" className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-medium transition">
                        <Zap className="w-4 h-4" /> Set Up Call Tracking <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            )}

            {/* AI Tip */}
            {calls.length > 0 && (
                <div className="bg-primary-light border border-primary/20 rounded-xl p-4">
                    <p className="text-sm">
                        <strong>\ud83d\udca1 Pro tip:</strong> Ask the AI &mdash; &ldquo;How can I improve my call conversion rate?&rdquo;
                        to get specific recommendations for call extensions, scheduling, and bidding strategies.
                    </p>
                </div>
            )}
        </div>
    );
}
