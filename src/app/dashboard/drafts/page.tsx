"use client";

import { useState, useEffect, useCallback } from "react";
import {
    FileText, Plus, Pencil, Trash2, CheckCircle2, Clock, Send,
    Pause, Search, Monitor, ShoppingBag, Video, Zap, Loader2,
    X, ChevronDown, ArrowRight, AlertCircle, Eye
} from "lucide-react";
import Link from "next/link";
import { authFetch } from "@/lib/auth-client";
import { useBusiness } from "@/lib/business-context";
import { useTranslation } from "@/i18n/context";
import AdApprovalDrawer, { AdDraftForApproval } from "@/components/AdApprovalDrawer";

interface Draft {
    id: string;
    name: string;
    type: "search" | "display" | "shopping" | "pmax" | "video";
    status: "draft" | "ready" | "published" | "paused";
    content: string;
    budget: number | null;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
}

interface DraftContent {
    headlines?: string[];
    descriptions?: string[];
    keywords?: string[];
    extensions?: { sitelinks?: string[]; callouts?: string[] };
    targetUrl?: string;
    targetAudience?: string;
    locations?: string[];
    adGroups?: { name: string; keywords: string[]; ads: { headlines: string[]; descriptions: string[] }[] }[];
}

const TYPE_CONFIG: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
    search: { label: "Search", icon: Search, color: "bg-blue-100 text-blue-700" },
    display: { label: "Display", icon: Monitor, color: "bg-purple-100 text-purple-700" },
    shopping: { label: "Shopping", icon: ShoppingBag, color: "bg-orange-100 text-orange-700" },
    pmax: { label: "PMax", icon: Zap, color: "bg-green-100 text-green-700" },
    video: { label: "Video", icon: Video, color: "bg-red-100 text-red-700" },
};

const STATUS_CONFIG: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
    draft: { label: "Draft", icon: Clock, color: "bg-gray-100 text-gray-600" },
    ready: { label: "Ready", icon: CheckCircle2, color: "bg-green-100 text-green-700" },
    published: { label: "Published", icon: Send, color: "bg-blue-100 text-blue-700" },
    paused: { label: "Paused", icon: Pause, color: "bg-yellow-100 text-yellow-700" },
};

export default function DraftsPage() {
    const { t } = useTranslation();
    const { activeBusiness } = useBusiness();
    const [drafts, setDrafts] = useState<Draft[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [editingDraft, setEditingDraft] = useState<Draft | null>(null);
    const [previewDraft, setPreviewDraft] = useState<Draft | null>(null);
    const [approvalDraft, setApprovalDraft] = useState<Draft | null>(null);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [typeFilter, setTypeFilter] = useState<string>("all");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    // Form state
    const [formName, setFormName] = useState("");
    const [formType, setFormType] = useState<string>("search");
    const [formBudget, setFormBudget] = useState("");
    const [formNotes, setFormNotes] = useState("");
    const [formHeadlines, setFormHeadlines] = useState("");
    const [formDescriptions, setFormDescriptions] = useState("");
    const [formKeywords, setFormKeywords] = useState("");
    const [formTargetUrl, setFormTargetUrl] = useState("");

    void t; // i18n ready

    const fetchDrafts = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (activeBusiness?.id) params.set("businessId", activeBusiness.id);
            const res = await authFetch(`/api/drafts?${params}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to fetch drafts");
            setDrafts(data.drafts || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load drafts");
        } finally {
            setLoading(false);
        }
    }, [activeBusiness?.id]);

    useEffect(() => {
        fetchDrafts();
    }, [fetchDrafts]);

    const openCreateModal = () => {
        setEditingDraft(null);
        setFormName("");
        setFormType("search");
        setFormBudget("");
        setFormNotes("");
        setFormHeadlines("");
        setFormDescriptions("");
        setFormKeywords("");
        setFormTargetUrl("");
        setShowModal(true);
    };

    const openEditModal = (draft: Draft) => {
        setEditingDraft(draft);
        setFormName(draft.name);
        setFormType(draft.type);
        setFormBudget(draft.budget?.toString() || "");
        setFormNotes(draft.notes || "");
        try {
            const content: DraftContent = JSON.parse(draft.content || "{}");
            setFormHeadlines(content.headlines?.join("\n") || "");
            setFormDescriptions(content.descriptions?.join("\n") || "");
            setFormKeywords(content.keywords?.join(", ") || "");
            setFormTargetUrl(content.targetUrl || "");
        } catch {
            setFormHeadlines("");
            setFormDescriptions("");
            setFormKeywords("");
            setFormTargetUrl("");
        }
        setShowModal(true);
    };

    const saveDraft = async () => {
        if (!formName.trim()) return;
        setSaving(true);
        try {
            const content: DraftContent = {};
            if (formHeadlines.trim()) content.headlines = formHeadlines.split("\n").filter(h => h.trim());
            if (formDescriptions.trim()) content.descriptions = formDescriptions.split("\n").filter(d => d.trim());
            if (formKeywords.trim()) content.keywords = formKeywords.split(",").map(k => k.trim()).filter(Boolean);
            if (formTargetUrl.trim()) content.targetUrl = formTargetUrl.trim();

            const payload = {
                name: formName.trim(),
                type: formType,
                budget: formBudget || null,
                notes: formNotes || null,
                content,
                businessId: activeBusiness?.id,
                ...(editingDraft ? { id: editingDraft.id } : {}),
            };

            const res = await authFetch("/api/drafts", {
                method: editingDraft ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to save draft");
            }

            setShowModal(false);
            await fetchDrafts();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save");
        } finally {
            setSaving(false);
        }
    };

    const deleteDraft = async (id: string) => {
        if (!confirm("Delete this draft? This cannot be undone.")) return;
        setDeleting(id);
        try {
            const res = await authFetch(`/api/drafts?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                setDrafts(prev => prev.filter(d => d.id !== id));
                if (previewDraft?.id === id) setPreviewDraft(null);
            }
        } catch {
            setError("Failed to delete draft");
        } finally {
            setDeleting(null);
        }
    };

    const updateStatus = async (id: string, status: string) => {
        try {
            const res = await authFetch("/api/drafts", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, status }),
            });
            if (res.ok) await fetchDrafts();
        } catch {
            setError("Failed to update status");
        }
    };

    const handleApprove = async (id: string) => {
        await updateStatus(id, "ready");
        setApprovalDraft(null);
    };

    const handleDeny = async (id: string) => {
        await updateStatus(id, "paused");
        setApprovalDraft(null);
    };

    const filtered = drafts.filter(d => {
        if (typeFilter !== "all" && d.type !== typeFilter) return false;
        if (statusFilter !== "all" && d.status !== statusFilter) return false;
        return true;
    });

    const parseContent = (draft: Draft): DraftContent => {
        try { return JSON.parse(draft.content || "{}"); } catch { return {}; }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Ad Drafts</h1>
                    <p className="text-muted text-sm mt-1">Create, review, and manage your ad drafts before publishing</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        href="/dashboard/ad-copy"
                        className="inline-flex items-center gap-2 bg-card border border-border hover:border-primary text-foreground px-4 py-2.5 rounded-xl text-sm font-medium transition"
                    >
                        <Zap className="w-4 h-4" />
                        AI Generator
                    </Link>
                    <button
                        onClick={openCreateModal}
                        className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-xl text-sm font-medium transition"
                    >
                        <Plus className="w-4 h-4" />
                        New Draft
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span className="text-sm">{error}</span>
                    <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4" /></button>
                </div>
            )}

            {/* Filters */}
            {drafts.length > 0 && (
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2 text-sm text-muted">
                        <ChevronDown className="w-4 h-4" />
                        <span>Filter:</span>
                    </div>
                    <select
                        value={typeFilter}
                        onChange={e => setTypeFilter(e.target.value)}
                        className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm"
                    >
                        <option value="all">All Types</option>
                        {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                            <option key={key} value={key}>{cfg.label}</option>
                        ))}
                    </select>
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm"
                    >
                        <option value="all">All Statuses</option>
                        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                            <option key={key} value={key}>{cfg.label}</option>
                        ))}
                    </select>
                    <span className="text-xs text-muted ml-auto">
                        {filtered.length} draft{filtered.length !== 1 ? "s" : ""}
                    </span>
                </div>
            )}

            {/* Empty state */}
            {drafts.length === 0 && !error && (
                <div className="bg-card border border-border rounded-2xl p-12 text-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <FileText className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold mb-2">No drafts yet</h2>
                    <p className="text-muted text-sm max-w-md mx-auto mb-8">
                        Create ad drafts manually, or use the AI Ad Copy Generator to create
                        complete campaigns with headlines, descriptions, and keywords.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link
                            href="/dashboard/ad-copy"
                            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-medium transition"
                        >
                            <Zap className="w-4 h-4" />
                            Generate Ads with AI
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                        <button
                            onClick={openCreateModal}
                            className="inline-flex items-center gap-2 bg-card border border-border hover:border-primary text-foreground px-6 py-3 rounded-xl font-medium transition"
                        >
                            <Plus className="w-4 h-4" />
                            Create Manually
                        </button>
                    </div>
                </div>
            )}

            {/* Drafts list */}
            {filtered.length > 0 && (
                <div className="space-y-3">
                    {filtered.map(draft => {
                        const content = parseContent(draft);
                        const typeConf = TYPE_CONFIG[draft.type] || TYPE_CONFIG.search;
                        const statusConf = STATUS_CONFIG[draft.status] || STATUS_CONFIG.draft;
                        const TypeIcon = typeConf.icon;
                        const StatusIcon = statusConf.icon;

                        return (
                            <div key={draft.id} className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition">
                                <div className="flex items-start gap-4">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${typeConf.color.split(" ")[0]}`}>
                                        <TypeIcon className={`w-5 h-5 ${typeConf.color.split(" ")[1]}`} />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="font-semibold truncate">{draft.name}</h3>
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${typeConf.color}`}>
                                                {typeConf.label}
                                            </span>
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConf.color}`}>
                                                <StatusIcon className="w-3 h-3" />
                                                {statusConf.label}
                                            </span>
                                        </div>

                                        <div className="mt-2 flex items-center gap-4 text-xs text-muted flex-wrap">
                                            {content.headlines && content.headlines.length > 0 && (
                                                <span>{content.headlines.length} headline{content.headlines.length > 1 ? "s" : ""}</span>
                                            )}
                                            {content.descriptions && content.descriptions.length > 0 && (
                                                <span>{content.descriptions.length} description{content.descriptions.length > 1 ? "s" : ""}</span>
                                            )}
                                            {content.keywords && content.keywords.length > 0 && (
                                                <span>{content.keywords.length} keyword{content.keywords.length > 1 ? "s" : ""}</span>
                                            )}
                                            {draft.budget && <span>${draft.budget}/day</span>}
                                            <span>Updated {new Date(draft.updatedAt).toLocaleDateString()}</span>
                                        </div>

                                        {content.headlines && content.headlines[0] && (
                                            <p className="mt-2 text-sm text-primary font-medium truncate">
                                                {content.headlines.slice(0, 3).join(" | ")}
                                            </p>
                                        )}

                                        {draft.notes && (
                                            <p className="mt-1 text-xs text-muted truncate">{draft.notes}</p>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-1 shrink-0">
                                        <button
                                            onClick={() => setApprovalDraft(draft)}
                                            className="inline-flex items-center gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded-lg text-xs font-medium transition"
                                            title="Review & Approve"
                                        >
                                            <Eye className="w-3.5 h-3.5" />
                                            Review
                                        </button>
                                        <button
                                            onClick={() => openEditModal(draft)}
                                            className="p-2 hover:bg-muted/20 rounded-lg transition"
                                            title="Edit"
                                        >
                                            <Pencil className="w-4 h-4 text-muted" />
                                        </button>
                                        {draft.status === "draft" && (
                                            <button
                                                onClick={() => updateStatus(draft.id, "ready")}
                                                className="p-2 hover:bg-green-50 rounded-lg transition"
                                                title="Mark as Ready"
                                            >
                                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => deleteDraft(draft.id)}
                                            disabled={deleting === draft.id}
                                            className="p-2 hover:bg-red-50 rounded-lg transition"
                                            title="Delete"
                                        >
                                            {deleting === draft.id
                                                ? <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                                                : <Trash2 className="w-4 h-4 text-red-400" />
                                            }
                                        </button>
                                    </div>
                                </div>

                                {previewDraft?.id === draft.id && (
                                    <div className="mt-4 pt-4 border-t border-border space-y-4">
                                        {content.headlines && content.headlines.length > 0 && (
                                            <div className="bg-white border border-gray-200 rounded-lg p-4 max-w-lg">
                                                <p className="text-xs text-green-700 mb-1">Ad · {content.targetUrl || "example.com"}</p>
                                                <p className="text-lg text-blue-800 font-medium leading-snug">
                                                    {content.headlines.slice(0, 3).join(" | ")}
                                                </p>
                                                {content.descriptions && content.descriptions[0] && (
                                                    <p className="text-sm text-gray-600 mt-1">{content.descriptions[0]}</p>
                                                )}
                                            </div>
                                        )}

                                        {content.headlines && content.headlines.length > 0 && (
                                            <div>
                                                <h4 className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">
                                                    Headlines ({content.headlines.length})
                                                </h4>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {content.headlines.map((h, i) => (
                                                        <span key={i} className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg text-xs">
                                                            {h} <span className="text-blue-400">({h.length}/30)</span>
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {content.descriptions && content.descriptions.length > 0 && (
                                            <div>
                                                <h4 className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">
                                                    Descriptions ({content.descriptions.length})
                                                </h4>
                                                <div className="space-y-1.5">
                                                    {content.descriptions.map((d, i) => (
                                                        <p key={i} className="bg-gray-50 px-3 py-1.5 rounded-lg text-xs text-gray-700">
                                                            {d} <span className="text-gray-400">({d.length}/90)</span>
                                                        </p>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {content.keywords && content.keywords.length > 0 && (
                                            <div>
                                                <h4 className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">
                                                    Keywords ({content.keywords.length})
                                                </h4>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {content.keywords.map((k, i) => (
                                                        <span key={i} className="bg-green-50 text-green-700 px-2.5 py-1 rounded-lg text-xs">{k}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {draft.notes && (
                                            <div>
                                                <h4 className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Notes</h4>
                                                <p className="text-sm text-muted whitespace-pre-wrap">{draft.notes}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Summary cards */}
            {drafts.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-card border border-border rounded-xl p-4 text-center">
                        <p className="text-2xl font-bold">{drafts.length}</p>
                        <p className="text-xs text-muted">Total Drafts</p>
                    </div>
                    <div className="bg-card border border-border rounded-xl p-4 text-center">
                        <p className="text-2xl font-bold text-yellow-600">{drafts.filter(d => d.status === "draft").length}</p>
                        <p className="text-xs text-muted">In Progress</p>
                    </div>
                    <div className="bg-card border border-border rounded-xl p-4 text-center">
                        <p className="text-2xl font-bold text-green-600">{drafts.filter(d => d.status === "ready").length}</p>
                        <p className="text-xs text-muted">Ready</p>
                    </div>
                    <div className="bg-card border border-border rounded-xl p-4 text-center">
                        <p className="text-2xl font-bold text-blue-600">{drafts.filter(d => d.status === "published").length}</p>
                        <p className="text-xs text-muted">Published</p>
                    </div>
                </div>
            )}

            {/* Create/Edit Modal */}
            {/* Ad Approval Drawer */}
            <AdApprovalDrawer
                draft={approvalDraft as AdDraftForApproval | null}
                open={!!approvalDraft}
                onClose={() => setApprovalDraft(null)}
                onApprove={handleApprove}
                onDeny={handleDeny}
                onEdit={(d) => {
                    setApprovalDraft(null);
                    const found = drafts.find(dr => dr.id === d.id);
                    if (found) openEditModal(found);
                }}
            />

            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
                    <div
                        className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="sticky top-0 bg-card border-b border-border p-5 flex items-center justify-between rounded-t-2xl">
                            <h2 className="text-lg font-bold">{editingDraft ? "Edit Draft" : "New Draft"}</h2>
                            <button onClick={() => setShowModal(false)} className="p-1 hover:bg-muted/20 rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-5 space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1.5">Campaign Name *</label>
                                    <input
                                        type="text"
                                        value={formName}
                                        onChange={e => setFormName(e.target.value)}
                                        placeholder="e.g., Summer Sale - Search"
                                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1.5">Campaign Type</label>
                                    <select
                                        value={formType}
                                        onChange={e => setFormType(e.target.value)}
                                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
                                    >
                                        {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                                            <option key={key} value={key}>{cfg.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1.5">Daily Budget ($)</label>
                                    <input
                                        type="number"
                                        value={formBudget}
                                        onChange={e => setFormBudget(e.target.value)}
                                        placeholder="50"
                                        min="1"
                                        step="1"
                                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1.5">Landing Page URL</label>
                                    <input
                                        type="text"
                                        value={formTargetUrl}
                                        onChange={e => setFormTargetUrl(e.target.value)}
                                        placeholder="https://example.com/landing"
                                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5">
                                    Headlines <span className="text-muted font-normal">(one per line, max 30 chars each)</span>
                                </label>
                                <textarea
                                    value={formHeadlines}
                                    onChange={e => setFormHeadlines(e.target.value)}
                                    placeholder={"Expert Plumbing Services\n24/7 Emergency Repairs\nFree Estimates Today\nLicensed & Insured Pros"}
                                    rows={4}
                                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm resize-none"
                                />
                                <p className="text-xs text-muted mt-1">
                                    {formHeadlines.split("\n").filter(h => h.trim()).length} headline(s) entered
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5">
                                    Descriptions <span className="text-muted font-normal">(one per line, max 90 chars each)</span>
                                </label>
                                <textarea
                                    value={formDescriptions}
                                    onChange={e => setFormDescriptions(e.target.value)}
                                    placeholder={"Professional plumbing services for your home. Licensed, insured & ready to help.\nCall now for a free estimate. Same-day service available in your area."}
                                    rows={3}
                                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5">
                                    Keywords <span className="text-muted font-normal">(comma-separated)</span>
                                </label>
                                <textarea
                                    value={formKeywords}
                                    onChange={e => setFormKeywords(e.target.value)}
                                    placeholder="emergency plumber, plumber near me, 24 hour plumbing, pipe repair"
                                    rows={2}
                                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5">Notes</label>
                                <textarea
                                    value={formNotes}
                                    onChange={e => setFormNotes(e.target.value)}
                                    placeholder="Any special instructions or campaign context..."
                                    rows={2}
                                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm resize-none"
                                />
                            </div>
                        </div>

                        <div className="sticky bottom-0 bg-card border-t border-border p-5 flex items-center justify-end gap-3 rounded-b-2xl">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 text-sm font-medium text-muted hover:text-foreground transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveDraft}
                                disabled={saving || !formName.trim()}
                                className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-xl text-sm font-medium transition disabled:opacity-50"
                            >
                                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                                {editingDraft ? "Save Changes" : "Create Draft"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
