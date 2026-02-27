"use client";

import { useState } from "react";
import { RefreshCw, Pencil, Check, X, Globe, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";

/**
 * Google Ads Preview — renders ad copy in authentic Google Search Ads format
 * with inline edit + regenerate capabilities per line.
 */

export interface GoogleAdData {
    headlines: string[];
    descriptions: string[];
    displayUrl?: string;
    sitelinks?: string[];
    callouts?: string[];
    businessName?: string;
}

interface GoogleAdPreviewProps {
    ad: GoogleAdData;
    index: number;
    onRegenerate?: (index: number, field: "headline" | "description", lineIndex: number) => void;
    onEdit?: (index: number, field: "headline" | "description", lineIndex: number, value: string) => void;
}

function EditableLine({
    value,
    maxLen,
    onSave,
    onRegenerate,
}: {
    value: string;
    maxLen: number;
    onSave: (v: string) => void;
    onRegenerate?: () => void;
}) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(value);

    if (editing) {
        return (
            <div className="flex items-center gap-1 group">
                <input
                    autoFocus
                    className="flex-1 bg-white border border-blue-300 rounded px-1.5 py-0.5 text-sm focus:outline-none focus:border-blue-500"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    maxLength={maxLen}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") { onSave(draft); setEditing(false); }
                        if (e.key === "Escape") { setDraft(value); setEditing(false); }
                    }}
                />
                <span className="text-[10px] text-gray-400 tabular-nums">{draft.length}/{maxLen}</span>
                <button onClick={() => { onSave(draft); setEditing(false); }} className="p-0.5 text-green-600 hover:text-green-700"><Check className="w-3.5 h-3.5" /></button>
                <button onClick={() => { setDraft(value); setEditing(false); }} className="p-0.5 text-red-400 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-1 group/line">
            <span className="flex-1 text-sm">{value}</span>
            <span className="text-[10px] text-gray-400 tabular-nums opacity-0 group-hover/line:opacity-100 transition">{value.length}/{maxLen}</span>
            <button onClick={() => { setDraft(value); setEditing(true); }} className="p-0.5 opacity-0 group-hover/line:opacity-100 text-gray-400 hover:text-blue-600 transition" title="Edit"><Pencil className="w-3 h-3" /></button>
            {onRegenerate && (
                <button onClick={onRegenerate} className="p-0.5 opacity-0 group-hover/line:opacity-100 text-gray-400 hover:text-indigo-600 transition" title="Regenerate"><RefreshCw className="w-3 h-3" /></button>
            )}
        </div>
    );
}

export default function GoogleAdPreview({ ad, index, onRegenerate, onEdit }: GoogleAdPreviewProps) {
    const [expanded, setExpanded] = useState(false);

    // Show first 3 headlines and first description as the "preview", expand for all
    const previewHeadlines = ad.headlines.slice(0, 3);
    const extraHeadlines = ad.headlines.slice(3);
    const displayUrl = ad.displayUrl || ad.businessName?.toLowerCase().replace(/\s+/g, "").slice(0, 20) + ".com" || "yourbusiness.com";

    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden my-3">
            {/* Header badge */}
            <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-100">
                <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center">
                        <span className="text-white text-[8px] font-bold">Ad</span>
                    </div>
                    <span className="text-xs font-semibold text-gray-700">Ad Variation {index + 1}</span>
                </div>
                <span className="text-[10px] text-gray-400">Google Search Ad Preview</span>
            </div>

            {/* Google Search Result Format */}
            <div className="px-4 py-3">
                {/* Sponsored label + URL line */}
                <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[11px] font-semibold text-gray-800 bg-gray-100 px-1.5 py-0.5 rounded">Sponsored</span>
                </div>
                <div className="flex items-center gap-1 mb-1">
                    <Globe className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-600">{displayUrl}</span>
                </div>

                {/* Headlines as clickable blue title */}
                <div className="text-[#1a0dab] text-lg font-medium leading-snug mb-1 hover:underline cursor-pointer">
                    {previewHeadlines.join(" | ")}
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600 leading-relaxed">
                    {ad.descriptions[0]}
                </p>

                {/* Sitelinks if available */}
                {ad.sitelinks && ad.sitelinks.length > 0 && (
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                        {ad.sitelinks.slice(0, 4).map((link, i) => (
                            <span key={i} className="text-xs text-[#1a0dab] hover:underline cursor-pointer">{link}</span>
                        ))}
                    </div>
                )}

                {/* Callouts */}
                {ad.callouts && ad.callouts.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                        {ad.callouts.map((c, i) => (
                            <span key={i} className="text-[10px] text-gray-500 bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded">{c}</span>
                        ))}
                    </div>
                )}
            </div>

            {/* Expand/collapse for full details */}
            <div className="border-t border-gray-100">
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="w-full flex items-center justify-center gap-1.5 px-4 py-2 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition"
                >
                    {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    {expanded ? "Hide details" : "Edit headlines & descriptions"}
                </button>
            </div>

            {expanded && (
                <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-4">
                    {/* All Headlines */}
                    <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Headlines (max 30 chars each)</h4>
                        <div className="space-y-1.5">
                            {ad.headlines.map((h, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <span className="text-[10px] text-gray-400 w-4 text-right">{i + 1}.</span>
                                    <div className="flex-1">
                                        <EditableLine
                                            value={h}
                                            maxLen={30}
                                            onSave={(v) => onEdit?.(index, "headline", i, v)}
                                            onRegenerate={onRegenerate ? () => onRegenerate(index, "headline", i) : undefined}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* All Descriptions */}
                    <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Descriptions (max 90 chars each)</h4>
                        <div className="space-y-1.5">
                            {ad.descriptions.map((d, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <span className="text-[10px] text-gray-400 w-4 text-right">{i + 1}.</span>
                                    <div className="flex-1">
                                        <EditableLine
                                            value={d}
                                            maxLen={90}
                                            onSave={(v) => onEdit?.(index, "description", i, v)}
                                            onRegenerate={onRegenerate ? () => onRegenerate(index, "description", i) : undefined}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
