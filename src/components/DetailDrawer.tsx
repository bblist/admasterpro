"use client";

import { X, ExternalLink, ChevronRight } from "lucide-react";

/**
 * General-purpose detail drawer — opens from the right to show
 * richer information about anything the AI mentions:
 * competitors, keywords, campaigns, ad groups, etc.
 *
 * Sections are dynamic key-value blocks that render automatically.
 */

export interface DrawerSection {
    label: string;
    /** Plain text, markdown-ish bullets, or a list of tags */
    type: "text" | "tags" | "list" | "link";
    value: string | string[];
}

export interface DetailDrawerData {
    title: string;
    subtitle?: string;
    sections: DrawerSection[];
    /** Optional CTA at the bottom */
    cta?: { label: string; action: string };
}

interface DetailDrawerProps {
    data: DetailDrawerData | null;
    onClose: () => void;
    /** When user clicks a CTA inside the drawer, bubble it up (e.g. to send a chat message) */
    onAction?: (action: string) => void;
}

export default function DetailDrawer({ data, onClose, onAction }: DetailDrawerProps) {
    if (!data) return null;

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/40 z-40 transition-opacity" onClick={onClose} />

            {/* Drawer */}
            <div className="fixed right-0 top-0 h-full w-full max-w-md bg-card border-l border-border z-50 shadow-2xl flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                    <div className="min-w-0">
                        <h2 className="font-semibold text-foreground truncate">{data.title}</h2>
                        {data.subtitle && <p className="text-xs text-muted mt-0.5 truncate">{data.subtitle}</p>}
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted/20 rounded-lg transition shrink-0">
                        <X className="w-5 h-5 text-muted" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
                    {data.sections.map((section, i) => (
                        <div key={i}>
                            <h3 className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">
                                {section.label}
                            </h3>

                            {section.type === "text" && (
                                <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                                    {Array.isArray(section.value) ? section.value.join("\n") : section.value}
                                </p>
                            )}

                            {section.type === "list" && Array.isArray(section.value) && (
                                <ul className="space-y-1.5">
                                    {section.value.map((item, j) => (
                                        <li key={j} className="flex items-start gap-2 text-sm text-foreground">
                                            <ChevronRight className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {section.type === "tags" && Array.isArray(section.value) && (
                                <div className="flex flex-wrap gap-1.5">
                                    {section.value.map((tag, j) => (
                                        <span key={j} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-md">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {section.type === "link" && (
                                <a
                                    href={Array.isArray(section.value) ? section.value[0] : section.value}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    {Array.isArray(section.value) ? section.value[0] : section.value}
                                </a>
                            )}
                        </div>
                    ))}
                </div>

                {/* CTA */}
                {data.cta && (
                    <div className="border-t border-border p-4">
                        <button
                            onClick={() => { onAction?.(data.cta!.action); onClose(); }}
                            className="w-full bg-primary hover:bg-primary-dark text-white py-2.5 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
                        >
                            {data.cta.label}
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}
