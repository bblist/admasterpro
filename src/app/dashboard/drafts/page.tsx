"use client";

import { FileText, Eye, Pencil, Trash2, Rocket, Clock, CheckCircle } from "lucide-react";

const drafts = [
    {
        id: 1,
        headline1: "24/7 Emergency Plumber Miami",
        headline2: "Fast Response • Licensed & Insured",
        description: "Burst pipe? Flooding? We're there in 30 minutes or less. Call now for emergency plumbing service in Miami-Dade County. Free estimates.",
        campaign: "Emergency Plumbing",
        status: "ready" as const,
        createdAt: "2 hours ago",
        aiNote: "Based on your website — highlights your 30-min response time and free estimates.",
    },
    {
        id: 2,
        headline1: "Water Heater Broken? We Fix It Today",
        headline2: "Same-Day Repair • $50 Off First Visit",
        description: "No hot water? We repair all brands — tank and tankless. Same-day service available. Miami's top-rated water heater specialists.",
        campaign: "Water Heater Repair",
        status: "ready" as const,
        createdAt: "2 hours ago",
        aiNote: "Mentions your $50 off promotion from your uploaded price list.",
    },
    {
        id: 3,
        headline1: "Drain Clogged? $49 Drain Cleaning",
        headline2: "No Hidden Fees • Same Day Service",
        description: "Slow drains? Kitchen or bathroom clogs? Professional drain cleaning starting at $49. Serving all of Miami. Call for fast service.",
        campaign: "Drain Cleaning Special",
        status: "ready" as const,
        createdAt: "Yesterday",
        aiNote: "Uses your $49 introductory pricing from your services page.",
    },
    {
        id: 4,
        headline1: "Miami's Most Trusted Plumber",
        headline2: "500+ 5-Star Reviews • Family Owned",
        description: "From leaky faucets to full remodels — Mike's Plumbing has served Miami families for 15 years. Licensed, insured, and always on time.",
        campaign: "General Plumbing Services",
        status: "draft" as const,
        createdAt: "Yesterday",
        aiNote: "Brand awareness ad — highlights your reviews and years in business from your Google Business Profile.",
    },
    {
        id: 5,
        headline1: "Toilet Running? Quick & Affordable Fix",
        headline2: "Flat Rate Pricing • No Surprises",
        description: "Running toilet wasting water and money? We fix it fast with upfront pricing. No hourly charges. Call Mike's Plumbing today.",
        campaign: "General Plumbing Services",
        status: "draft" as const,
        createdAt: "Yesterday",
        aiNote: "Targets a common problem. Uses your flat-rate pricing model from your website.",
    },
];

export default function DraftsPage() {
    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Ad Drafts</h1>
                    <p className="text-muted text-sm mt-1">
                        Review AI-generated ads before they go live. Nothing runs until you approve it.
                    </p>
                </div>
                <div className="text-sm text-muted">
                    {drafts.length} drafts • {drafts.filter((d) => d.status === "ready").length} ready to go
                </div>
            </div>

            {/* Info banner */}
            <div className="bg-primary-light border border-primary/20 rounded-xl p-4 text-sm">
                <strong>🔒 Draft-first safety:</strong> All these ads were created by your AI assistant based
                on your website and uploaded files. They&apos;re saved here as drafts — nothing is running in
                Google Ads yet. Review them, edit if needed, then click &quot;Go Live&quot; when you&apos;re happy.
            </div>

            {/* Drafts */}
            <div className="space-y-4">
                {drafts.map((draft) => (
                    <div
                        key={draft.id}
                        className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 transition"
                    >
                        {/* Preview */}
                        <div className="p-5">
                            <div className="flex items-start justify-between gap-4 mb-3">
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${draft.status === "ready"
                                                ? "bg-success/10 text-success"
                                                : "bg-muted/10 text-muted"
                                            }`}
                                    >
                                        {draft.status === "ready" ? "Ready to go live" : "Draft"}
                                    </span>
                                    <span className="text-xs text-muted">for {draft.campaign}</span>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-muted">
                                    <Clock className="w-3 h-3" />
                                    {draft.createdAt}
                                </div>
                            </div>

                            {/* Ad Preview (Google-style) */}
                            <div className="bg-sidebar border border-border rounded-lg p-4">
                                <div className="text-xs text-muted mb-1">Ad Preview</div>
                                <div className="text-sm text-primary font-medium mb-0.5">
                                    {draft.headline1} | {draft.headline2}
                                </div>
                                <div className="text-xs text-success mb-1">www.mikesplumbing.com</div>
                                <div className="text-xs text-muted leading-relaxed">{draft.description}</div>
                            </div>

                            {/* AI Note */}
                            <div className="mt-3 text-xs text-muted flex items-start gap-1.5">
                                <span className="shrink-0 mt-0.5">🤖</span>
                                {draft.aiNote}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="border-t border-border px-5 py-3 bg-sidebar flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <button className="text-xs border border-border rounded-lg px-3 py-1.5 hover:border-primary transition flex items-center gap-1.5">
                                    <Eye className="w-3 h-3" />
                                    Preview
                                </button>
                                <button className="text-xs border border-border rounded-lg px-3 py-1.5 hover:border-primary transition flex items-center gap-1.5">
                                    <Pencil className="w-3 h-3" />
                                    Edit
                                </button>
                                <button className="text-xs border border-border rounded-lg px-3 py-1.5 hover:border-danger text-muted hover:text-danger transition flex items-center gap-1.5">
                                    <Trash2 className="w-3 h-3" />
                                    Delete
                                </button>
                            </div>
                            <button className="text-xs bg-primary text-white rounded-lg px-4 py-1.5 hover:bg-primary-dark transition flex items-center gap-1.5 font-medium">
                                <Rocket className="w-3 h-3" />
                                Go Live
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
