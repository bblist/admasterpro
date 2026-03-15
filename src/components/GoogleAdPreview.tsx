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
    const displayUrl = ad.displayUrl || ad.businessName?.toLowerCase().replace(/\s+/g, "").slice(0, 20) + ".com" || "yourbusiness.com";

    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden my-3">
            {/* Header badge */}
            <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-100">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Google Search Preview • Variation {index + 1}</span>
            </div>

            {/* Google Search Result Format — authentic styling */}
            <div className="px-4 py-3.5" style={{ fontFamily: "arial, sans-serif" }}>
                {/* Sponsored label */}
                <div className="mb-1.5">
                    <span className="text-[12px] font-bold text-[#202124]" style={{ fontFamily: "arial, sans-serif" }}>Sponsored</span>
                </div>

                {/* Favicon circle + site name + URL + 3-dot menu */}
                <div className="flex items-center gap-2.5 mb-1">
                    <div className="w-[28px] h-[28px] rounded-full bg-[#f1f3f4] flex items-center justify-center shrink-0">
                        <Globe className="w-[14px] h-[14px] text-[#70757a]" />
                    </div>
                    <div className="min-w-0">
                        <div className="text-[14px] text-[#202124] leading-[18px] truncate" style={{ fontFamily: "arial, sans-serif" }}>
                            {ad.businessName || "Your Business"}
                        </div>
                        <div className="text-[12px] text-[#4d5156] leading-[16px] truncate" style={{ fontFamily: "arial, sans-serif" }}>
                            {displayUrl}
                        </div>
                    </div>
                    <div className="ml-auto shrink-0">
                        <svg width="16" height="16" viewBox="0 0 16 16" className="text-[#70757a]">
                            <circle cx="8" cy="3" r="1.2" fill="currentColor" />
                            <circle cx="8" cy="8" r="1.2" fill="currentColor" />
                            <circle cx="8" cy="13" r="1.2" fill="currentColor" />
                        </svg>
                    </div>
                </div>

                {/* Headlines as clickable blue title */}
                <h3
                    className="text-[20px] leading-[26px] text-[#1a0dab] cursor-pointer mt-0.5 hover:underline"
                    style={{ fontFamily: "arial, sans-serif", fontWeight: 400 }}
                >
                    {previewHeadlines.join(" | ")}
                </h3>

                {/* Description — concatenate first two like Google */}
                <p className="text-[14px] leading-[22px] text-[#4d5156] mt-0.5" style={{ fontFamily: "arial, sans-serif" }}>
                    {ad.descriptions.slice(0, 2).join(" ")}
                </p>

                {/* Sitelinks if available — 2x2 grid like Google */}
                {ad.sitelinks && ad.sitelinks.length > 0 && (
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 mt-3 pt-2.5 border-t border-[#dadce0]">
                        {ad.sitelinks.slice(0, 4).map((link, i) => (
                            <span key={i} className="text-[14px] text-[#1a0dab] hover:underline cursor-pointer" style={{ fontFamily: "arial, sans-serif" }}>{link}</span>
                        ))}
                    </div>
                )}

                {/* Callouts */}
                {ad.callouts && ad.callouts.length > 0 && (
                    <div className="text-[14px] text-[#4d5156] mt-2" style={{ fontFamily: "arial, sans-serif" }}>
                        {ad.callouts.join(" · ")}
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
