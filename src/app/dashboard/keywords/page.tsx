"use client";

import Link from "next/link";
import { Search, Plus, ArrowRight, Zap, TrendingUp, Target, Brain } from "lucide-react";

export default function KeywordsPage() {
    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold">Keywords</h1>
                <p className="text-muted text-sm mt-1">AI-powered keyword management with Google Trends integration</p>
            </div>

            {/* Connect CTA */}
            <div className="bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-cyan-500/5 border border-emerald-500/20 rounded-2xl p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
                    <Search className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-xl font-bold mb-2">Connect Your Google Ads Account</h2>
                <p className="text-muted text-sm max-w-md mx-auto mb-6">
                    Connect your account to see real keyword performance data. The AI will analyze every keyword, find winners, eliminate waste, and suggest new opportunities using Google Trends.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl text-sm font-medium transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20">
                        <Plus className="w-4 h-4" />
                        Connect Google Ads
                    </button>
                    <Link
                        href="/dashboard/demo/keywords"
                        className="border border-border hover:border-emerald-500 text-foreground px-6 py-3 rounded-xl text-sm font-medium transition flex items-center justify-center gap-2"
                    >
                        <Search className="w-4 h-4" />
                        View Demo Keywords
                    </Link>
                </div>
            </div>

            {/* AI Control Banner */}
            <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/20 rounded-xl p-5">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                        <Brain className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm mb-1">AI Has the Final Say</h3>
                        <p className="text-xs text-muted leading-relaxed">
                            You can add any keywords you want, but the AI agent will analyze every single one before activating it.
                            Keywords that don\u2019t meet quality thresholds will be paused automatically. The AI uses Google Trends,
                            competitor data, and your business\u2019s Knowledge Base to make smart decisions about what works and what doesn\u2019t.
                        </p>
                    </div>
                </div>
            </div>

            {/* Features */}
            <div>
                <h3 className="font-semibold mb-4">What You\u2019ll Get</h3>
                <div className="grid md:grid-cols-3 gap-4">
                    {[
                        {
                            icon: TrendingUp,
                            title: "Google Trends Data",
                            desc: "See real-time trend direction, interest scores, search volume, and seasonal peaks for every keyword.",
                            color: "from-blue-500 to-cyan-600",
                        },
                        {
                            icon: Target,
                            title: "AI Quality Scoring",
                            desc: "Each keyword gets a quality score (1-10), AI verdict (approve/review/reject), and match type recommendation.",
                            color: "from-emerald-500 to-green-600",
                        },
                        {
                            icon: Zap,
                            title: "Smart Automation",
                            desc: "Add keywords manually or bulk import. The AI automatically analyzes, scores, and decides what to activate.",
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
                <h3 className="font-semibold mb-3">Once Connected</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                    {[
                        "All keywords with real performance data",
                        "AI verdicts: Winner, Money Leak, Testing, Suggested",
                        "Google Trends integration with trend direction",
                        "Quality scores and match type recommendations",
                        "Add single or bulk import keywords",
                        "Export branded reports (PDF, Excel, Word, CSV)",
                        "Competitor keyword gap analysis",
                        "30-day performance forecasts",
                    ].map((item, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                            <ArrowRight className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            <span className="text-muted">{item}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* AI Tip */}
            <div className="bg-primary-light border border-primary/20 rounded-xl p-4">
                <p className="text-sm">
                    <strong>\uD83D\uDCA1 Tip:</strong> You can already ask the{" "}
                    <Link href="/dashboard/chat" className="text-primary hover:underline font-medium">AI Assistant</Link>{" "}
                    for keyword suggestions right now! Say \u201CWhat keywords should I target?\u201D or \u201CShow me Google Trends for plumbing\u201D and the AI will research and recommend keywords based on your business.
                </p>
            </div>
        </div>
    );
}
