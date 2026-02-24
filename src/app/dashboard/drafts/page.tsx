"use client";

import Link from "next/link";
import {
    FileText,
    Plus,
    MessageCircle,
    Sparkles,
    ArrowRight,
    Layers,
} from "lucide-react";

export default function DraftsPage() {
    return (
        <div className="max-w-3xl mx-auto">
            {/* Empty State */}
            <div className="text-center py-16">
                <div className="w-20 h-20 bg-gradient-to-br from-primary/10 to-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <FileText className="w-10 h-10 text-primary/60" />
                </div>

                <h1 className="text-2xl font-bold mb-2">Your Ad Drafts</h1>
                <p className="text-muted text-sm max-w-md mx-auto mb-8 leading-relaxed">
                    Your AI-generated ad drafts will appear here. Nothing runs until you approve it.
                    Start by asking the AI assistant to create ads for your business.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
                    <Link
                        href="/dashboard/chat"
                        className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-primary-dark transition shadow-lg shadow-primary/20"
                    >
                        <MessageCircle className="w-4 h-4" />
                        Create Your First Ad
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                        href="/dashboard/demo/drafts"
                        className="inline-flex items-center gap-2 border border-border px-6 py-3 rounded-xl text-sm font-medium text-muted hover:text-foreground hover:border-primary/50 transition"
                    >
                        <Layers className="w-4 h-4" />
                        View Demo Examples
                    </Link>
                </div>

                {/* How it works */}
                <div className="bg-card border border-border rounded-xl p-6 text-left max-w-lg mx-auto">
                    <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        How it works
                    </h3>
                    <div className="space-y-4">
                        {[
                            {
                                step: "1",
                                title: "Ask the AI assistant",
                                desc: "Tell the AI what kind of ads you need. For example: \"Create text ads for my plumbing business.\"",
                            },
                            {
                                step: "2",
                                title: "Review your drafts",
                                desc: "AI-generated ad variations will appear here. Compare versions, edit copy, and customize display ads.",
                            },
                            {
                                step: "3",
                                title: "Go live when ready",
                                desc: "Nothing runs until you click Go Live. You\u2019re always in control of what gets published.",
                            },
                        ].map((item) => (
                            <div key={item.step} className="flex gap-3">
                                <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                                    {item.step}
                                </div>
                                <div>
                                    <div className="text-sm font-medium">{item.title}</div>
                                    <div className="text-xs text-muted mt-0.5 leading-relaxed">{item.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick actions */}
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto">
                    <Link
                        href="/dashboard/chat"
                        className="flex items-center gap-3 bg-sidebar border border-border rounded-xl p-4 hover:border-primary/30 transition group text-left"
                    >
                        <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition">
                            <Plus className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                            <div className="text-sm font-medium group-hover:text-primary transition">Create text ads</div>
                            <div className="text-[11px] text-muted">Google Search ads</div>
                        </div>
                    </Link>
                    <Link
                        href="/dashboard/chat"
                        className="flex items-center gap-3 bg-sidebar border border-border rounded-xl p-4 hover:border-primary/30 transition group text-left"
                    >
                        <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center group-hover:bg-orange-200 transition">
                            <Plus className="w-4 h-4 text-orange-600" />
                        </div>
                        <div>
                            <div className="text-sm font-medium group-hover:text-primary transition">Create display ads</div>
                            <div className="text-[11px] text-muted">Banner & image ads</div>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
}
