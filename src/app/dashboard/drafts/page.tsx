"use client";

import { FileText, Eye, Pencil, Trash2, Rocket, Clock, Image } from "lucide-react";

type AdType = "text" | "display";

interface TextDraft {
    id: number;
    type: "text";
    headline1: string;
    headline2: string;
    description: string;
    displayUrl: string;
    campaign: string;
    client: string;
    status: "ready" | "draft";
    createdAt: string;
    aiNote: string;
}

interface DisplayDraft {
    id: number;
    type: "display";
    title: string;
    dimensions: string;
    format: string;
    previewBg: string;
    previewText: string;
    campaign: string;
    client: string;
    status: "ready" | "draft";
    createdAt: string;
    aiNote: string;
    faceDetected?: boolean;
    layoutSuggestion?: string;
}

type Draft = TextDraft | DisplayDraft;

const drafts: Draft[] = [
    {
        id: 1,
        type: "text",
        headline1: "LASIK Surgery \u2014 See Clearly Today",
        headline2: "Free Consultation \u2022 Board Certified",
        description: "Tired of glasses? ClearVision Eye Clinic offers blade-free LASIK with 20/20 results. Financing available. Book your free consultation today.",
        displayUrl: "www.clearvisionclinic.com",
        campaign: "LASIK & Eye Exams",
        client: "ClearVision Eye Clinic",
        status: "ready",
        createdAt: "2 hours ago",
        aiNote: "Highlights free consultation and financing \u2014 top converting offers for LASIK searches.",
    },
    {
        id: 2,
        type: "display",
        title: "Summer Collection \u2014 40% Off Banner",
        dimensions: "728\u00d790",
        format: "Leaderboard Banner",
        previewBg: "from-pink-400 to-purple-500",
        previewText: "SUMMER SALE 40% OFF \u2014 Shop Now at Bella Fashion",
        campaign: "Summer Collection",
        client: "Bella Fashion Boutique",
        status: "ready",
        createdAt: "3 hours ago",
        aiNote: "Gradient design with bold CTA. AI detected no faces \u2014 text-centered layout recommended.",
        faceDetected: false,
        layoutSuggestion: "Text-centered with product images on sides",
    },
    {
        id: 3,
        type: "text",
        headline1: "24/7 Emergency Plumber Miami",
        headline2: "Fast Response \u2022 Licensed & Insured",
        description: "Burst pipe? Flooding? We\u2019re there in 30 minutes or less. Call now for emergency plumbing service in Miami-Dade County. Free estimates.",
        displayUrl: "www.mikesplumbing.com",
        campaign: "Emergency Plumbing",
        client: "Mike\u2019s Plumbing",
        status: "ready",
        createdAt: "5 hours ago",
        aiNote: "Emphasizes 30-min response time \u2014 matches top-performing competitor ads in this market.",
    },
    {
        id: 4,
        type: "display",
        title: "Fresh Sushi \u2014 Lunch Special $12.99",
        dimensions: "300\u00d7250",
        format: "Medium Rectangle",
        previewBg: "from-amber-400 to-red-500",
        previewText: "\ud83c\udf63 LUNCH SPECIAL $12.99 \u2014 Sakura Sushi Bar",
        campaign: "Lunch Specials",
        client: "Sakura Sushi Bar",
        status: "ready",
        createdAt: "Yesterday",
        aiNote: "AI detected food photography with warm tones. Face not present \u2014 product-focused layout applied.",
        faceDetected: false,
        layoutSuggestion: "Food image left, pricing right, CTA bottom",
    },
    {
        id: 5,
        type: "display",
        title: "ClearVision \u2014 Eye Exam Ad",
        dimensions: "160\u00d7600",
        format: "Wide Skyscraper",
        previewBg: "from-blue-400 to-teal-500",
        previewText: "Your Eyes Deserve the Best \u2014 ClearVision Eye Clinic",
        campaign: "Brand Awareness \u2014 Display",
        client: "ClearVision Eye Clinic",
        status: "draft",
        createdAt: "Yesterday",
        aiNote: "AI detected a face (doctor portrait) \u2014 positioned at top with text below for natural eye flow. Rule of thirds applied.",
        faceDetected: true,
        layoutSuggestion: "Face at top 1/3, headline middle, CTA bottom",
    },
    {
        id: 6,
        type: "text",
        headline1: "Premium Auto Detailing \u2014 $99",
        headline2: "Mobile Service \u2022 We Come to You",
        description: "Full interior & exterior detail from $99. Ceramic coating, paint correction, and headlight restoration. 5-star rated on Google. Book online today.",
        displayUrl: "www.pinnacleautospa.com",
        campaign: "Auto Detailing Specials",
        client: "Pinnacle Auto Spa",
        status: "draft",
        createdAt: "Yesterday",
        aiNote: "Targets mobile detailing searches. Price-forward approach matches market positioning.",
    },
    {
        id: 7,
        type: "display",
        title: "Bella Fashion \u2014 Designer Bags",
        dimensions: "300\u00d7600",
        format: "Half Page",
        previewBg: "from-rose-300 to-pink-500",
        previewText: "NEW ARRIVALS \u2014 Designer Handbags from $149",
        campaign: "Designer Handbags",
        client: "Bella Fashion Boutique",
        status: "draft",
        createdAt: "2 days ago",
        aiNote: "Product showcase layout. AI recommends adding lifestyle model image to increase CTR by ~15% based on industry benchmarks.",
        faceDetected: false,
        layoutSuggestion: "Grid layout with 4 product images + price overlay",
    },
];

export default function DraftsPage() {
    const textDrafts = drafts.filter((d) => d.type === "text");
    const displayDrafts = drafts.filter((d) => d.type === "display");

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Ad Drafts</h1>
                    <p className="text-muted text-sm mt-1">
                        Review AI-generated ads before they go live. Nothing runs until you approve it.
                    </p>
                </div>
                <div className="flex gap-3 items-center">
                    <div className="text-sm text-muted">
                        {drafts.length} drafts &bull; {drafts.filter((d) => d.status === "ready").length} ready
                    </div>
                    <div className="flex gap-1">
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                            {textDrafts.length} Text
                        </span>
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">
                            {displayDrafts.length} Display
                        </span>
                    </div>
                </div>
            </div>

            {/* Info banner */}
            <div className="bg-primary-light border border-primary/20 rounded-xl p-4 text-sm">
                <strong>&#128274; Draft-first safety:</strong> All these ads were created by your AI assistant based
                on your websites and uploaded files. They&apos;re saved here as drafts &mdash; nothing is running in
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
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span
                                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${draft.status === "ready"
                                                ? "bg-success/10 text-success"
                                                : "bg-muted/10 text-muted"
                                            }`}
                                    >
                                        {draft.status === "ready" ? "Ready to go live" : "Draft"}
                                    </span>
                                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                                        draft.type === "text" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"
                                    }`}>
                                        {draft.type === "text" ? (
                                            <><FileText className="w-3 h-3" /> Text Ad</>
                                        ) : (
                                            <><Image className="w-3 h-3" /> Display Ad</>
                                        )}
                                    </span>
                                    <span className="text-xs text-muted">{draft.campaign} &bull; {draft.client}</span>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-muted shrink-0">
                                    <Clock className="w-3 h-3" />
                                    {draft.createdAt}
                                </div>
                            </div>

                            {/* Ad Preview */}
                            {draft.type === "text" ? (
                                <div className="bg-sidebar border border-border rounded-lg p-4">
                                    <div className="text-xs text-muted mb-1">Ad Preview &mdash; Google Search</div>
                                    <div className="text-sm text-primary font-medium mb-0.5">
                                        {draft.headline1} | {draft.headline2}
                                    </div>
                                    <div className="text-xs text-success mb-1">{draft.displayUrl}</div>
                                    <div className="text-xs text-muted leading-relaxed">{draft.description}</div>
                                </div>
                            ) : (
                                <div className="bg-sidebar border border-border rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="text-xs text-muted">
                                            Display Preview &mdash; {draft.format} ({draft.dimensions})
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            {draft.faceDetected && (
                                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                                    &#128100; Face Detected
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {/* Simulated display ad */}
                                    <div className={`bg-gradient-to-r ${draft.previewBg} rounded-lg p-4 text-white text-center ${
                                        draft.dimensions === "728\u00d790" ? "h-16 flex items-center justify-center" :
                                        draft.dimensions === "160\u00d7600" ? "h-48" :
                                        draft.dimensions === "300\u00d7600" ? "h-56" :
                                        "h-32 flex items-center justify-center"
                                    }`}>
                                        <div className="font-bold text-sm drop-shadow">{draft.previewText}</div>
                                    </div>
                                    {draft.layoutSuggestion && (
                                        <div className="mt-2 text-xs text-primary bg-primary/5 rounded px-2 py-1">
                                            &#128208; AI Layout: {draft.layoutSuggestion}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* AI Note */}
                            <div className="mt-3 text-xs text-muted flex items-start gap-1.5">
                                <span className="shrink-0 mt-0.5">&#129302;</span>
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
