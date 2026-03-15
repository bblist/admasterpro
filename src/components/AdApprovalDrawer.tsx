"use client";

/**
 * AdApprovalDrawer
 *
 * A full-featured slide-in drawer for reviewing, approving, or denying
 * AI-generated ad drafts. Shows a Google Ad preview, all headlines/descriptions,
 * keywords, and action buttons.
 *
 * Usage:
 *   <AdApprovalDrawer
 *     draft={selectedDraft}
 *     open={showDrawer}
 *     onClose={() => setShowDrawer(false)}
 *     onApprove={(id) => handleApprove(id)}
 *     onDeny={(id) => handleDeny(id)}
 *     onEdit={(draft) => handleEdit(draft)}
 *   />
 */

import { useState, useEffect, useCallback } from "react";
import {
    X, CheckCircle2, XCircle, Pencil, Eye, Copy, ExternalLink,
    ChevronRight, Loader2, Sparkles, AlertTriangle, ThumbsUp,
    ThumbsDown, Star, BarChart3, Tag, Globe, Target, Clock
} from "lucide-react";

export interface AdDraftForApproval {
    id: string;
    name: string;
    type: string;
    status: string;
    content: string;
    budget: number | null;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
}

interface ParsedContent {
    headlines?: string[];
    descriptions?: string[];
    keywords?: string[];
    negativeKeywords?: string[];
    targetUrl?: string;
    targetAudience?: string;
    locations?: string[];
    extensions?: { sitelinks?: string[]; callouts?: string[] };
    adGroups?: { name: string; keywords: string[]; ads: { headlines: string[]; descriptions: string[] }[] }[];
}

interface Props {
    draft: AdDraftForApproval | null;
    open: boolean;
    onClose: () => void;
    onApprove: (id: string) => Promise<void> | void;
    onDeny: (id: string) => Promise<void> | void;
    onEdit?: (draft: AdDraftForApproval) => void;
}

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
    search: { label: "Search", color: "bg-blue-100 text-blue-700" },
    display: { label: "Display", color: "bg-purple-100 text-purple-700" },
    shopping: { label: "Shopping", color: "bg-orange-100 text-orange-700" },
    pmax: { label: "PMax", color: "bg-green-100 text-green-700" },
    video: { label: "Video", color: "bg-red-100 text-red-700" },
};

export default function AdApprovalDrawer({ draft, open, onClose, onApprove, onDeny, onEdit }: Props) {
    const [approving, setApproving] = useState(false);
    const [denying, setDenying] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"preview" | "details" | "performance">("preview");
    const [showDenyConfirm, setShowDenyConfirm] = useState(false);

    // Close on Escape
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
    }, [onClose]);

    useEffect(() => {
        if (open) {
            document.addEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "hidden";
        }
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "";
        };
    }, [open, handleKeyDown]);

    if (!open || !draft) return null;

    let content: ParsedContent = {};
    try {
        content = JSON.parse(draft.content || "{}");
    } catch {
        content = {};
    }

    const typeInfo = TYPE_LABELS[draft.type] || TYPE_LABELS.search;
    const headlines = content.headlines || [];
    const descriptions = content.descriptions || [];
    const keywords = content.keywords || [];

    const handleApprove = async () => {
        setApproving(true);
        try {
            await onApprove(draft.id);
        } finally {
            setApproving(false);
        }
    };

    const handleDeny = async () => {
        setDenying(true);
        try {
            await onDeny(draft.id);
        } finally {
            setDenying(false);
            setShowDenyConfirm(false);
        }
    };

    const copyText = (text: string, key: string) => {
        navigator.clipboard.writeText(text);
        setCopied(key);
        setTimeout(() => setCopied(null), 1500);
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className="fixed right-0 top-0 h-full w-full max-w-xl bg-card border-l border-border shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Eye className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                            <h2 className="font-bold text-lg leading-tight">{draft.name}</h2>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeInfo.color}`}>
                                    {typeInfo.label}
                                </span>
                                <span className="text-xs text-muted flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {new Date(draft.updatedAt).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted/20 rounded-lg transition">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-border px-6">
                    {(["preview", "details", "performance"] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-3 text-sm font-medium border-b-2 transition capitalize ${
                                activeTab === tab
                                    ? "border-primary text-primary"
                                    : "border-transparent text-muted hover:text-foreground"
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                    {/* Preview Tab */}
                    {activeTab === "preview" && (
                        <>
                            {/* Google Ad Preview */}
                            {headlines.length > 0 && (
                                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Sparkles className="w-4 h-4 text-primary" />
                                        <span className="text-xs font-semibold text-primary uppercase tracking-wider">Ad Preview</span>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-green-700 flex items-center gap-1">
                                            <span className="font-medium bg-green-100 text-green-800 text-[10px] px-1 py-0.5 rounded">Ad</span>
                                            <Globe className="w-3 h-3" />
                                            {content.targetUrl || "yoursite.com"}
                                        </p>
                                        <h3 className="text-xl text-blue-800 font-medium leading-snug hover:underline cursor-pointer">
                                            {headlines.slice(0, 3).join(" | ")}
                                        </h3>
                                        {descriptions[0] && (
                                            <p className="text-sm text-gray-600 leading-relaxed">{descriptions[0]}</p>
                                        )}
                                        {content.extensions?.sitelinks && (
                                            <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-gray-100">
                                                {content.extensions.sitelinks.slice(0, 4).map((sl, i) => (
                                                    <span key={i} className="text-xs text-blue-700 hover:underline cursor-pointer">{sl}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Headlines */}
                            {headlines.length > 0 && (
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-xs font-semibold text-muted uppercase tracking-wider">
                                            Headlines ({headlines.length})
                                        </h4>
                                        <button
                                            onClick={() => copyText(headlines.join("\n"), "headlines")}
                                            className="text-xs text-muted hover:text-primary flex items-center gap-1 transition"
                                        >
                                            {copied === "headlines" ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                                            Copy all
                                        </button>
                                    </div>
                                    <div className="space-y-1.5">
                                        {headlines.map((h, i) => (
                                            <div key={i} className="flex items-center justify-between bg-blue-50/50 rounded-lg px-3 py-2 group">
                                                <span className="text-sm font-medium">{h}</span>
                                                <span className={`text-xs font-mono ${h.length > 30 ? "text-red-500" : "text-muted"}`}>
                                                    {h.length}/30
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Descriptions */}
                            {descriptions.length > 0 && (
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-xs font-semibold text-muted uppercase tracking-wider">
                                            Descriptions ({descriptions.length})
                                        </h4>
                                        <button
                                            onClick={() => copyText(descriptions.join("\n"), "descriptions")}
                                            className="text-xs text-muted hover:text-primary flex items-center gap-1 transition"
                                        >
                                            {copied === "descriptions" ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                                            Copy all
                                        </button>
                                    </div>
                                    <div className="space-y-1.5">
                                        {descriptions.map((d, i) => (
                                            <div key={i} className="bg-gray-50/80 rounded-lg px-3 py-2">
                                                <p className="text-sm">{d}</p>
                                                <span className={`text-xs font-mono ${d.length > 90 ? "text-red-500" : "text-muted"}`}>
                                                    {d.length}/90
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* Details Tab */}
                    {activeTab === "details" && (
                        <>
                            {/* Keywords */}
                            {keywords.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                                        Keywords ({keywords.length})
                                    </h4>
                                    <div className="flex flex-wrap gap-1.5">
                                        {keywords.map((k, i) => (
                                            <span key={i} className="bg-green-50 text-green-700 px-2.5 py-1 rounded-lg text-xs font-medium">
                                                {k}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Negative Keywords */}
                            {content.negativeKeywords && content.negativeKeywords.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                                        Negative Keywords
                                    </h4>
                                    <div className="flex flex-wrap gap-1.5">
                                        {content.negativeKeywords.map((k, i) => (
                                            <span key={i} className="bg-red-50 text-red-600 px-2.5 py-1 rounded-lg text-xs font-medium">
                                                -{k}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Target URL */}
                            {content.targetUrl && (
                                <div>
                                    <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                                        Landing Page
                                    </h4>
                                    <a
                                        href={content.targetUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                                    >
                                        <Globe className="w-4 h-4" />
                                        {content.targetUrl}
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                </div>
                            )}

                            {/* Target Audience */}
                            {content.targetAudience && (
                                <div>
                                    <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Target Audience</h4>
                                    <p className="text-sm bg-purple-50/50 rounded-lg px-3 py-2">{content.targetAudience}</p>
                                </div>
                            )}

                            {/* Locations */}
                            {content.locations && content.locations.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Locations</h4>
                                    <div className="flex flex-wrap gap-1.5">
                                        {content.locations.map((l, i) => (
                                            <span key={i} className="bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1">
                                                <Target className="w-3 h-3" /> {l}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Budget */}
                            {draft.budget && (
                                <div>
                                    <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Daily Budget</h4>
                                    <p className="text-lg font-bold text-foreground">${draft.budget}/day</p>
                                </div>
                            )}

                            {/* Notes */}
                            {draft.notes && (
                                <div>
                                    <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Notes</h4>
                                    <p className="text-sm text-muted bg-muted/10 rounded-lg px-3 py-2 whitespace-pre-wrap">{draft.notes}</p>
                                </div>
                            )}

                            {/* Ad Groups */}
                            {content.adGroups && content.adGroups.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                                        Ad Groups ({content.adGroups.length})
                                    </h4>
                                    <div className="space-y-2">
                                        {content.adGroups.map((ag, i) => (
                                            <div key={i} className="bg-muted/10 rounded-lg px-4 py-3">
                                                <p className="text-sm font-semibold mb-1">{ag.name}</p>
                                                <p className="text-xs text-muted">
                                                    {ag.keywords.length} keyword{ag.keywords.length > 1 ? "s" : ""} ·{" "}
                                                    {ag.ads.length} ad{ag.ads.length > 1 ? "s" : ""}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* Performance Tab (placeholder for integration) */}
                    {activeTab === "performance" && (
                        <div className="text-center py-10">
                            <BarChart3 className="w-12 h-12 text-muted/30 mx-auto mb-4" />
                            <h3 className="font-semibold mb-1">Performance Data</h3>
                            <p className="text-sm text-muted max-w-sm mx-auto">
                                After this ad is published to Google Ads, performance metrics
                                (impressions, clicks, conversions) will appear here.
                            </p>
                        </div>
                    )}
                </div>

                {/* Deny Confirmation Overlay */}
                {showDenyConfirm && (
                    <div className="absolute inset-x-0 bottom-20 mx-6 bg-red-50 border border-red-200 rounded-xl p-4 shadow-lg z-10">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-red-800">Deny this ad?</p>
                                <p className="text-xs text-red-600 mt-0.5">
                                    The draft will be marked as denied. You can still edit and resubmit later.
                                </p>
                                <div className="flex gap-2 mt-3">
                                    <button
                                        onClick={handleDeny}
                                        disabled={denying}
                                        className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-xs font-medium transition disabled:opacity-50"
                                    >
                                        {denying ? <Loader2 className="w-3 h-3 animate-spin" /> : <ThumbsDown className="w-3 h-3" />}
                                        Yes, Deny
                                    </button>
                                    <button
                                        onClick={() => setShowDenyConfirm(false)}
                                        className="px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-100 rounded-lg transition"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Action Bar */}
                <div className="border-t border-border bg-card px-6 py-4">
                    <div className="flex items-center gap-3">
                        {/* Approve */}
                        <button
                            onClick={handleApprove}
                            disabled={approving || draft.status === "ready"}
                            className="flex-1 inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-xl text-sm font-semibold transition disabled:opacity-50 shadow-lg shadow-green-600/20"
                        >
                            {approving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <ThumbsUp className="w-4 h-4" />
                            )}
                            {draft.status === "ready" ? "Approved" : "Approve"}
                        </button>

                        {/* Edit */}
                        {onEdit && (
                            <button
                                onClick={() => onEdit(draft)}
                                className="inline-flex items-center justify-center gap-2 bg-card border border-border hover:border-primary px-5 py-3 rounded-xl text-sm font-medium transition"
                            >
                                <Pencil className="w-4 h-4" />
                                Edit
                            </button>
                        )}

                        {/* Deny */}
                        <button
                            onClick={() => setShowDenyConfirm(true)}
                            disabled={denying || draft.status === "paused"}
                            className="inline-flex items-center justify-center gap-2 bg-card border border-red-200 hover:bg-red-50 text-red-600 px-5 py-3 rounded-xl text-sm font-medium transition disabled:opacity-50"
                        >
                            {denying ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <ThumbsDown className="w-4 h-4" />
                            )}
                            Deny
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
