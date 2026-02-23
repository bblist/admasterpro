"use client";

import {
    FileText,
    Eye,
    Pencil,
    Trash2,
    Rocket,
    Clock,
    Image,
    RefreshCw,
    Sparkles,
    ChevronDown,
    ChevronUp,
    Cpu,
    History,
    Star,
    Zap,
    CheckCircle2,
    Copy,
    MoreVertical,
} from "lucide-react";
import { useState } from "react";
import Tooltip from "@/components/Tooltip";

// Types

type AdType = "text" | "display";
type LLMModel = "gpt-4o" | "claude-5.6";

interface TextAdContent {
    headline1: string;
    headline2: string;
    description: string;
    displayUrl: string;
}

interface DisplayAdContent {
    title: string;
    dimensions: string;
    format: string;
    previewBg: string;
    previewText: string;
    faceDetected?: boolean;
    layoutSuggestion?: string;
}

interface DraftVersion {
    versionId: number;
    model: LLMModel;
    content: TextAdContent | DisplayAdContent;
    generatedAt: string;
    aiNote: string;
    isActive: boolean;
}

interface Draft {
    id: number;
    type: AdType;
    campaign: string;
    client: string;
    status: "ready" | "draft";
    versions: DraftVersion[];
}

// Model helpers

const modelBadge = (model: LLMModel) => {
    if (model === "gpt-4o") {
        return (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                <Zap className="w-3 h-3" /> GPT-4o
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200">
            <Sparkles className="w-3 h-3" /> Claude 5.6
        </span>
    );
};

const modelLabel = (model: LLMModel) =>
    model === "gpt-4o" ? "GPT-4o (Primary)" : "Claude 5.6 (Fallback)";

// Demo Data

const initialDrafts: Draft[] = [
    {
        id: 1,
        type: "text",
        campaign: "LASIK & Eye Exams",
        client: "ClearVision Eye Clinic",
        status: "ready",
        versions: [
            {
                versionId: 1,
                model: "gpt-4o",
                content: {
                    headline1: "LASIK Surgery \u2014 See Clearly Today",
                    headline2: "Free Consultation \u2022 Board Certified",
                    description: "Tired of glasses? ClearVision Eye Clinic offers blade-free LASIK with 20/20 results. Financing available. Book your free consultation today.",
                    displayUrl: "www.clearvisionclinic.com",
                },
                generatedAt: "Feb 24, 2026 \u2022 2:30 PM",
                aiNote: "Highlights free consultation and financing \u2014 top converting offers for LASIK searches.",
                isActive: true,
            },
        ],
    },
    {
        id: 2,
        type: "display",
        campaign: "Summer Collection",
        client: "Bella Fashion Boutique",
        status: "ready",
        versions: [
            {
                versionId: 1,
                model: "gpt-4o",
                content: {
                    title: "Summer Collection \u2014 40% Off Banner",
                    dimensions: "728\u00d790",
                    format: "Leaderboard Banner",
                    previewBg: "from-pink-400 to-purple-500",
                    previewText: "SUMMER SALE 40% OFF \u2014 Shop Now at Bella Fashion",
                    faceDetected: false,
                    layoutSuggestion: "Text-centered with product images on sides",
                },
                generatedAt: "Feb 24, 2026 \u2022 1:45 PM",
                aiNote: "Gradient design with bold CTA. AI detected no faces \u2014 text-centered layout recommended.",
                isActive: true,
            },
        ],
    },
    {
        id: 3,
        type: "text",
        campaign: "Emergency Plumbing",
        client: "Mike\u2019s Plumbing",
        status: "ready",
        versions: [
            {
                versionId: 1,
                model: "gpt-4o",
                content: {
                    headline1: "24/7 Emergency Plumber Miami",
                    headline2: "Fast Response \u2022 Licensed & Insured",
                    description: "Burst pipe? Flooding? We\u2019re there in 30 minutes or less. Call now for emergency plumbing service in Miami-Dade County. Free estimates.",
                    displayUrl: "www.mikesplumbing.com",
                },
                generatedAt: "Feb 24, 2026 \u2022 12:10 PM",
                aiNote: "Based on your website \u2014 highlights your 30-min response time and free estimates.",
                isActive: true,
            },
            {
                versionId: 2,
                model: "claude-5.6",
                content: {
                    headline1: "Pipe Burst? We\u2019re On Our Way",
                    headline2: "30-Min Response \u2022 Free Estimates",
                    description: "Miami\u2019s fastest emergency plumber. Licensed, insured, and available 24/7. We handle burst pipes, flooding, and sewer emergencies. Call Mike\u2019s Plumbing now.",
                    displayUrl: "www.mikesplumbing.com",
                },
                generatedAt: "Feb 24, 2026 \u2022 12:15 PM",
                aiNote: "Alternative angle \u2014 leads with urgency and emotion. Uses \u2018fastest\u2019 claim from your 4.9-star Google reviews.",
                isActive: false,
            },
        ],
    },
    {
        id: 4,
        type: "text",
        campaign: "Water Heater Repair",
        client: "Mike\u2019s Plumbing",
        status: "ready",
        versions: [
            {
                versionId: 1,
                model: "gpt-4o",
                content: {
                    headline1: "Water Heater Broken? We Fix It Today",
                    headline2: "Same-Day Repair \u2022 $50 Off First Visit",
                    description: "No hot water? We repair all brands \u2014 tank and tankless. Same-day service available. Miami\u2019s top-rated water heater specialists.",
                    displayUrl: "www.mikesplumbing.com",
                },
                generatedAt: "Feb 24, 2026 \u2022 11:50 AM",
                aiNote: "Mentions your $50 off promotion from your uploaded price list.",
                isActive: true,
            },
        ],
    },
    {
        id: 5,
        type: "text",
        campaign: "Drain Cleaning Special",
        client: "Mike\u2019s Plumbing",
        status: "ready",
        versions: [
            {
                versionId: 1,
                model: "gpt-4o",
                content: {
                    headline1: "Drain Clogged? $49 Drain Cleaning",
                    headline2: "No Hidden Fees \u2022 Same Day Service",
                    description: "Slow drains? Kitchen or bathroom clogs? Professional drain cleaning starting at $49. Serving all of Miami. Call for fast service.",
                    displayUrl: "www.mikesplumbing.com",
                },
                generatedAt: "Feb 23, 2026 \u2022 4:30 PM",
                aiNote: "Uses your $49 introductory pricing from your services page.",
                isActive: true,
            },
            {
                versionId: 2,
                model: "gpt-4o",
                content: {
                    headline1: "$49 Drain Cleaning \u2014 Miami",
                    headline2: "Licensed Plumber \u2022 No Trip Fees",
                    description: "Clogged drain? Don\u2019t wait. Professional drain cleaning from $49. We clear kitchen, bathroom, and sewer drains. Same-day appointments. Call now!",
                    displayUrl: "www.mikesplumbing.com",
                },
                generatedAt: "Feb 23, 2026 \u2022 5:00 PM",
                aiNote: "Price-first approach \u2014 leads with $49 for higher CTR in price-sensitive searches.",
                isActive: false,
            },
            {
                versionId: 3,
                model: "claude-5.6",
                content: {
                    headline1: "Miami Drain Cleaning Experts",
                    headline2: "Starting at $49 \u2022 5-Star Rated",
                    description: "Kitchen drain slow? Bathroom backing up? Mike\u2019s Plumbing clears any clog fast. No hidden fees, no surprises. $49 drain cleaning \u2014 book online in 60 seconds.",
                    displayUrl: "www.mikesplumbing.com",
                },
                generatedAt: "Feb 24, 2026 \u2022 9:00 AM",
                aiNote: "Conversational tone \u2014 asks questions to match search intent. Adds \u2018book online\u2019 CTA for digital-first users.",
                isActive: false,
            },
        ],
    },
    {
        id: 6,
        type: "text",
        campaign: "General Plumbing Services",
        client: "Mike\u2019s Plumbing",
        status: "draft",
        versions: [
            {
                versionId: 1,
                model: "gpt-4o",
                content: {
                    headline1: "Miami\u2019s Most Trusted Plumber",
                    headline2: "500+ 5-Star Reviews \u2022 Family Owned",
                    description: "From leaky faucets to full remodels \u2014 Mike\u2019s Plumbing has served Miami families for 15 years. Licensed, insured, and always on time.",
                    displayUrl: "www.mikesplumbing.com",
                },
                generatedAt: "Feb 23, 2026 \u2022 3:15 PM",
                aiNote: "Brand awareness angle. Pulls \u2018500+ reviews\u2019 and \u201815 years\u2019 from your website.",
                isActive: true,
            },
        ],
    },
    {
        id: 7,
        type: "display",
        campaign: "Lunch Specials",
        client: "Sakura Sushi Bar",
        status: "ready",
        versions: [
            {
                versionId: 1,
                model: "gpt-4o",
                content: {
                    title: "Fresh Sushi \u2014 Lunch Special $12.99",
                    dimensions: "300\u00d7250",
                    format: "Medium Rectangle",
                    previewBg: "from-amber-400 to-red-500",
                    previewText: "\ud83c\udf63 LUNCH SPECIAL $12.99 \u2014 Sakura Sushi Bar",
                    faceDetected: false,
                    layoutSuggestion: "Food image left, pricing right, CTA bottom",
                },
                generatedAt: "Feb 23, 2026 \u2022 2:00 PM",
                aiNote: "AI detected food photography with warm tones. Face not present \u2014 product-focused layout applied.",
                isActive: true,
            },
        ],
    },
    {
        id: 8,
        type: "display",
        campaign: "Brand Awareness \u2014 Display",
        client: "ClearVision Eye Clinic",
        status: "draft",
        versions: [
            {
                versionId: 1,
                model: "claude-5.6",
                content: {
                    title: "ClearVision \u2014 Eye Exam Ad",
                    dimensions: "160\u00d7600",
                    format: "Wide Skyscraper",
                    previewBg: "from-blue-400 to-teal-500",
                    previewText: "Your Eyes Deserve the Best \u2014 ClearVision Eye Clinic",
                    faceDetected: true,
                    layoutSuggestion: "Face at top 1/3, headline middle, CTA bottom",
                },
                generatedAt: "Feb 23, 2026 \u2022 11:00 AM",
                aiNote: "AI detected a face (doctor portrait) \u2014 positioned at top with text below for natural eye flow. Rule of thirds applied.",
                isActive: true,
            },
        ],
    },
    {
        id: 9,
        type: "text",
        campaign: "Auto Detailing Specials",
        client: "Pinnacle Auto Spa",
        status: "draft",
        versions: [
            {
                versionId: 1,
                model: "gpt-4o",
                content: {
                    headline1: "Premium Auto Detailing \u2014 $99",
                    headline2: "Mobile Service \u2022 We Come to You",
                    description: "Full interior & exterior detail from $99. Ceramic coating, paint correction, and headlight restoration. 5-star rated on Google. Book online today.",
                    displayUrl: "www.pinnacleautospa.com",
                },
                generatedAt: "Feb 23, 2026 \u2022 10:00 AM",
                aiNote: "Targets mobile detailing searches. Price-forward approach matches market positioning.",
                isActive: true,
            },
            {
                versionId: 2,
                model: "claude-5.6",
                content: {
                    headline1: "Your Car Deserves Pinnacle Treatment",
                    headline2: "Ceramic Coating \u2022 Paint Correction",
                    description: "South Beach\u2019s only certified ceramic coating specialist. Gtechniq Crystal Serum Ultra with 10-year warranty. VIP membership from $199/mo. Book your detail today.",
                    displayUrl: "www.pinnacleautospa.com",
                },
                generatedAt: "Feb 23, 2026 \u2022 10:30 AM",
                aiNote: "Luxury angle \u2014 pulls USPs from your Knowledge Base (only ceramic specialist, Gtechniq, VIP membership).",
                isActive: false,
            },
        ],
    },
    {
        id: 10,
        type: "display",
        campaign: "Designer Handbags",
        client: "Bella Fashion Boutique",
        status: "draft",
        versions: [
            {
                versionId: 1,
                model: "gpt-4o",
                content: {
                    title: "Bella Fashion \u2014 Designer Bags",
                    dimensions: "300\u00d7600",
                    format: "Half Page",
                    previewBg: "from-rose-300 to-pink-500",
                    previewText: "NEW ARRIVALS \u2014 Designer Handbags from $149",
                    faceDetected: false,
                    layoutSuggestion: "Grid layout with 4 product images + price overlay",
                },
                generatedAt: "Feb 22, 2026 \u2022 3:00 PM",
                aiNote: "Product showcase layout. AI recommends adding lifestyle model image to increase CTR by ~15% based on industry benchmarks.",
                isActive: true,
            },
        ],
    },
];

// Component

export default function DraftsPage() {
    const [drafts, setDrafts] = useState<Draft[]>(initialDrafts);
    const [expandedVersions, setExpandedVersions] = useState<Set<number>>(new Set());
    const [regeneratingId, setRegeneratingId] = useState<number | null>(null);

    const textDrafts = drafts.filter((d) => d.type === "text");
    const displayDrafts = drafts.filter((d) => d.type === "display");
    const totalVersions = drafts.reduce((sum, d) => sum + d.versions.length, 0);

    const toggleVersions = (draftId: number) => {
        setExpandedVersions((prev) => {
            const next = new Set(prev);
            if (next.has(draftId)) next.delete(draftId);
            else next.add(draftId);
            return next;
        });
    };

    const handleRegenerate = (draftId: number) => {
        setRegeneratingId(draftId);
        // Simulate regeneration after 1.5s
        setTimeout(() => {
            setDrafts((prev) =>
                prev.map((d) => {
                    if (d.id !== draftId) return d;
                    const newVersionId = Math.max(...d.versions.map((v) => v.versionId)) + 1;
                    const models: LLMModel[] = ["gpt-4o", "claude-5.6"];
                    const model = models[Math.floor(Math.random() * 2)];
                    const now = new Date();
                    const timeStr = `${now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} \u2022 ${now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;

                    const activeVersion = d.versions.find((v) => v.isActive);
                    let newContent: TextAdContent | DisplayAdContent;
                    if (d.type === "text" && activeVersion) {
                        const tc = activeVersion.content as TextAdContent;
                        newContent = {
                            ...tc,
                            headline1: tc.headline1 + " \u2014 v" + newVersionId,
                            description: tc.description.replace(/\.$/, "") + ". New AI variation.",
                        };
                    } else if (activeVersion) {
                        const dc = activeVersion.content as DisplayAdContent;
                        newContent = {
                            ...dc,
                            previewText: dc.previewText + " (v" + newVersionId + ")",
                        };
                    } else {
                        return d;
                    }

                    const newVersion: DraftVersion = {
                        versionId: newVersionId,
                        model,
                        content: newContent,
                        generatedAt: timeStr,
                        aiNote: `Regenerated variation using ${modelLabel(model)}. This version explores a different angle while maintaining your brand voice.`,
                        isActive: false,
                    };

                    return { ...d, versions: [...d.versions, newVersion] };
                })
            );
            setRegeneratingId(null);
            // Auto-expand versions when regenerated
            setExpandedVersions((prev) => new Set(prev).add(draftId));
        }, 1500);
    };

    const setActiveVersion = (draftId: number, versionId: number) => {
        setDrafts((prev) =>
            prev.map((d) => {
                if (d.id !== draftId) return d;
                return {
                    ...d,
                    versions: d.versions.map((v) => ({
                        ...v,
                        isActive: v.versionId === versionId,
                    })),
                };
            })
        );
    };

    const deleteVersion = (draftId: number, versionId: number) => {
        setDrafts((prev) =>
            prev.map((d) => {
                if (d.id !== draftId) return d;
                const updated = d.versions.filter((v) => v.versionId !== versionId);
                // If we deleted the active version, make the latest remaining one active
                if (!updated.some((v) => v.isActive) && updated.length > 0) {
                    updated[updated.length - 1].isActive = true;
                }
                return { ...d, versions: updated };
            })
        );
    };

    const deleteDraft = (draftId: number) => {
        setDrafts((prev) => prev.filter((d) => d.id !== draftId));
    };

    const getActiveVersion = (draft: Draft) => draft.versions.find((v) => v.isActive) || draft.versions[0];

    const renderTextPreview = (content: TextAdContent) => (
        <div className="bg-sidebar border border-border rounded-lg p-4">
            <div className="text-xs text-muted mb-1">Ad Preview &mdash; Google Search</div>
            <div className="text-sm text-primary font-medium mb-0.5">
                {content.headline1} | {content.headline2}
            </div>
            <div className="text-xs text-success mb-1">{content.displayUrl}</div>
            <div className="text-xs text-muted leading-relaxed">{content.description}</div>
        </div>
    );

    const renderDisplayPreview = (content: DisplayAdContent) => (
        <div className="bg-sidebar border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-muted">
                    Display Preview &mdash; {content.format} ({content.dimensions})
                </div>
                {content.faceDetected && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        &#128100; Face Detected
                    </span>
                )}
            </div>
            <div className={`bg-gradient-to-r ${content.previewBg} rounded-lg p-4 text-white text-center ${
                content.dimensions === "728\u00d790" ? "h-16 flex items-center justify-center" :
                content.dimensions === "160\u00d7600" ? "h-48" :
                content.dimensions === "300\u00d7600" ? "h-56" :
                "h-32 flex items-center justify-center"
            }`}>
                <div className="font-bold text-sm drop-shadow">{content.previewText}</div>
            </div>
            {content.layoutSuggestion && (
                <div className="mt-2 text-xs text-primary bg-primary/5 rounded px-2 py-1">
                    &#128208; AI Layout: {content.layoutSuggestion}
                </div>
            )}
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        Ad Drafts
                        <Tooltip text="All ads are AI-generated drafts. Nothing runs until you click Go Live. Use Regenerate to get fresh variations from GPT-4o or Claude 5.6." />
                    </h1>
                    <p className="text-muted text-sm mt-1">
                        Review AI-generated ads before they go live. Nothing runs until you approve it.
                    </p>
                </div>
                <div className="flex gap-3 items-center">
                    <div className="text-sm text-muted">
                        {drafts.length} drafts &bull; {totalVersions} versions &bull; {drafts.filter((d) => d.status === "ready").length} ready
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

            {/* AI Model info */}
            <div className="bg-gradient-to-r from-emerald-50 via-white to-orange-50 border border-border rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-emerald-500 to-orange-500 rounded-lg p-2">
                        <Cpu className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <div className="text-sm font-semibold flex items-center gap-2">
                            AI Models Active
                        </div>
                        <div className="text-xs text-muted mt-0.5">
                            Primary: <strong>GPT-4o</strong> &bull; Fallback: <strong>Claude 5.6</strong> &bull; Each regeneration may use either model for diverse ad copy.
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    {modelBadge("gpt-4o")}
                    {modelBadge("claude-5.6")}
                </div>
            </div>

            {/* Info banner */}
            <div className="bg-primary-light border border-primary/20 rounded-xl p-4 text-sm">
                <strong>&#128274; Draft-first safety:</strong> All these ads were created by your AI assistant based
                on your Knowledge Base content. They&apos;re saved here as drafts &mdash; nothing runs in
                Google Ads until you approve. Click <strong>Regenerate</strong> to create new variations (all versions are kept). Click <strong>Go Live</strong> when happy.
            </div>

            {/* Drafts */}
            <div className="space-y-4">
                {drafts.map((draft) => {
                    const active = getActiveVersion(draft);
                    const isExpanded = expandedVersions.has(draft.id);
                    const isRegenerating = regeneratingId === draft.id;
                    const hasMultipleVersions = draft.versions.length > 1;

                    return (
                        <div
                            key={draft.id}
                            className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 transition"
                        >
                            {/* Header */}
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
                                        {modelBadge(active.model)}
                                        <span className="text-xs text-muted">{draft.campaign} &bull; {draft.client}</span>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        {hasMultipleVersions && (
                                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                                                {draft.versions.length} versions
                                            </span>
                                        )}
                                        <div className="flex items-center gap-1 text-xs text-muted">
                                            <Clock className="w-3 h-3" />
                                            {active.generatedAt}
                                        </div>
                                    </div>
                                </div>

                                {/* Active version preview */}
                                {draft.type === "text"
                                    ? renderTextPreview(active.content as TextAdContent)
                                    : renderDisplayPreview(active.content as DisplayAdContent)
                                }

                                {/* AI Note */}
                                <div className="mt-3 text-xs text-muted flex items-start gap-1.5">
                                    <span className="shrink-0 mt-0.5">&#129302;</span>
                                    <span>{active.aiNote}</span>
                                </div>

                                {/* Version History */}
                                {hasMultipleVersions && (
                                    <div className="mt-3">
                                        <button
                                            onClick={() => toggleVersions(draft.id)}
                                            className="flex items-center gap-1.5 text-xs text-primary font-medium hover:text-primary-dark transition"
                                        >
                                            <History className="w-3.5 h-3.5" />
                                            {isExpanded ? "Hide" : "Show"} all {draft.versions.length} versions
                                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                        </button>

                                        {isExpanded && (
                                            <div className="mt-3 space-y-3 border-t border-border pt-3">
                                                {draft.versions.map((version) => (
                                                    <div
                                                        key={version.versionId}
                                                        className={`rounded-lg border p-3 transition ${
                                                            version.isActive
                                                                ? "border-primary bg-primary/5"
                                                                : "border-border bg-sidebar hover:border-primary/30"
                                                        }`}
                                                    >
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs font-semibold">v{version.versionId}</span>
                                                                {modelBadge(version.model)}
                                                                {version.isActive && (
                                                                    <span className="inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                                                                        <Star className="w-3 h-3" /> Active
                                                                    </span>
                                                                )}
                                                                <span className="text-[11px] text-muted">{version.generatedAt}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                {!version.isActive && (
                                                                    <button
                                                                        onClick={() => setActiveVersion(draft.id, version.versionId)}
                                                                        className="text-[11px] border border-border rounded px-2 py-1 hover:border-primary text-muted hover:text-primary transition flex items-center gap-1"
                                                                    >
                                                                        <CheckCircle2 className="w-3 h-3" /> Use This
                                                                    </button>
                                                                )}
                                                                {draft.versions.length > 1 && (
                                                                    <button
                                                                        onClick={() => deleteVersion(draft.id, version.versionId)}
                                                                        className="text-[11px] border border-border rounded px-2 py-1 hover:border-danger text-muted hover:text-danger transition"
                                                                    >
                                                                        <Trash2 className="w-3 h-3" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Version content preview */}
                                                        {draft.type === "text" ? (
                                                            <div className="text-xs">
                                                                <div className="text-primary font-medium">
                                                                    {(version.content as TextAdContent).headline1} | {(version.content as TextAdContent).headline2}
                                                                </div>
                                                                <div className="text-muted mt-0.5 leading-relaxed line-clamp-2">
                                                                    {(version.content as TextAdContent).description}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className={`bg-gradient-to-r ${(version.content as DisplayAdContent).previewBg} rounded p-2 text-white text-center h-12 flex items-center justify-center`}>
                                                                <span className="text-xs font-bold drop-shadow">{(version.content as DisplayAdContent).previewText}</span>
                                                            </div>
                                                        )}

                                                        <div className="mt-1.5 text-[11px] text-muted flex items-start gap-1">
                                                            <span className="shrink-0">&#129302;</span> {version.aiNote}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="border-t border-border px-5 py-3 bg-sidebar flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleRegenerate(draft.id)}
                                        disabled={isRegenerating}
                                        className={`text-xs border rounded-lg px-3 py-1.5 transition flex items-center gap-1.5 font-medium ${
                                            isRegenerating
                                                ? "border-primary/30 text-primary/50 cursor-wait"
                                                : "border-primary/50 text-primary hover:bg-primary/5 hover:border-primary"
                                        }`}
                                    >
                                        <RefreshCw className={`w-3 h-3 ${isRegenerating ? "animate-spin" : ""}`} />
                                        {isRegenerating ? "Generating..." : "Regenerate"}
                                    </button>
                                    <button className="text-xs border border-border rounded-lg px-3 py-1.5 hover:border-primary transition flex items-center gap-1.5">
                                        <Eye className="w-3 h-3" />
                                        Preview
                                    </button>
                                    <button className="text-xs border border-border rounded-lg px-3 py-1.5 hover:border-primary transition flex items-center gap-1.5">
                                        <Pencil className="w-3 h-3" />
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => deleteDraft(draft.id)}
                                        className="text-xs border border-border rounded-lg px-3 py-1.5 hover:border-danger text-muted hover:text-danger transition flex items-center gap-1.5"
                                    >
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
                    );
                })}
            </div>
        </div>
    );
}
