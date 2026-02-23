"use client";

import {
    Upload,
    Image,
    FileText,
    Trash2,
    MessageSquare,
    Clock,
    Eye,
    Scan,
    Maximize2,
    User,
    Plus,
    BookOpen,
} from "lucide-react";
import { useState } from "react";
import Tooltip from "@/components/Tooltip";

interface KBItem {
    id: number;
    type: "image" | "document" | "ad";
    name: string;
    client: string;
    previewBg: string;
    previewText: string;
    dimensions?: string;
    fileSize: string;
    uploadedAt: string;
    notes: string;
    aiAnalysis: {
        format?: string;
        dimensions?: string;
        faceDetected?: boolean;
        dominantColors?: string[];
        layoutNotes?: string;
        textContent?: string;
    };
}

const kbItems: KBItem[] = [
    {
        id: 1,
        type: "image",
        name: "Hero Banner - Summer Sale",
        client: "Bella Fashion Boutique",
        previewBg: "from-pink-400 to-purple-500",
        previewText: "Summer Sale Hero Image",
        dimensions: "1920 x 1080",
        fileSize: "2.4 MB",
        uploadedAt: "Jun 12, 2025 at 2:30 PM",
        notes: "Main hero image for summer campaign. Use warm colors and lifestyle feel. Target audience: women 25-45.",
        aiAnalysis: {
            format: "JPEG",
            dimensions: "1920 x 1080",
            faceDetected: true,
            dominantColors: ["#E91E8C", "#8B5CF6", "#F8FAFC"],
            layoutNotes: "Face detected in center-right. Recommend placing text on left side for balance. Rule of thirds grid suggests headline at top-left intersection.",
            textContent: "No text detected in image",
        },
    },
    {
        id: 2,
        type: "ad",
        name: "LASIK Before/After",
        client: "ClearVision Eye Clinic",
        previewBg: "from-blue-400 to-teal-500",
        previewText: "Before & After LASIK Results",
        dimensions: "1200 x 628",
        fileSize: "890 KB",
        uploadedAt: "Jun 11, 2025 at 10:15 AM",
        notes: "Show real patient results. Include disclaimer text at bottom. Dr. Martinez approved this image for advertising.",
        aiAnalysis: {
            format: "PNG",
            dimensions: "1200 x 628",
            faceDetected: true,
            dominantColors: ["#0EA5E9", "#14B8A6", "#FFFFFF"],
            layoutNotes: "Two faces detected (before/after split). Recommend keeping faces in upper 2/3 and adding CTA bar at bottom. Ensure text contrast ratio meets accessibility standards.",
            textContent: "Detected: 'See the difference' watermark",
        },
    },
    {
        id: 3,
        type: "image",
        name: "Sushi Platter Photography",
        client: "Sakura Sushi Bar",
        previewBg: "from-amber-400 to-red-500",
        previewText: "Premium Sushi Platter",
        dimensions: "2400 x 1600",
        fileSize: "3.1 MB",
        uploadedAt: "Jun 10, 2025 at 4:45 PM",
        notes: "Professional food photography. Can be cropped for different ad sizes. Highlight the premium presentation and fresh ingredients.",
        aiAnalysis: {
            format: "JPEG",
            dimensions: "2400 x 1600",
            faceDetected: false,
            dominantColors: ["#F59E0B", "#EF4444", "#1F2937"],
            layoutNotes: "No faces detected. Food-centered composition. Warm tones ideal for appetite appeal. Can be cropped to 300x250, 728x90, or 1200x628 without losing key elements.",
            textContent: "No text detected",
        },
    },
    {
        id: 4,
        type: "document",
        name: "Brand Guidelines",
        client: "Pinnacle Auto Spa",
        previewBg: "from-gray-400 to-gray-600",
        previewText: "Brand Guide PDF",
        fileSize: "1.8 MB",
        uploadedAt: "Jun 9, 2025 at 11:00 AM",
        notes: "Contains logo usage rules, color codes (#1A1A2E primary, #E94560 accent), font specs (Montserrat headers, Open Sans body). Always use dark background version of logo for ads.",
        aiAnalysis: {
            format: "PDF (12 pages)",
            textContent: "Extracted: Primary color #1A1A2E, Accent #E94560, Logo min size 120px, Tagline: 'Drive in Style'",
            layoutNotes: "Brand requires 20px minimum clear space around logo. Dark backgrounds preferred for premium feel.",
        },
    },
    {
        id: 5,
        type: "ad",
        name: "Emergency Plumber - Google Ad",
        client: "Mike's Plumbing",
        previewBg: "from-blue-500 to-blue-700",
        previewText: "24/7 Emergency Plumbing Ad",
        dimensions: "300 x 250",
        fileSize: "145 KB",
        uploadedAt: "Jun 8, 2025 at 3:20 PM",
        notes: "Current best-performing display ad. CTR is 2.8%. Keep the bold phone number visible. Mike wants to test a version with his face/photo.",
        aiAnalysis: {
            format: "PNG",
            dimensions: "300 x 250",
            faceDetected: false,
            dominantColors: ["#3B82F6", "#1D4ED8", "#FFFFFF"],
            layoutNotes: "Text-heavy design. Phone number is prominent (good for service ads). Consider adding a person/technician image to increase trust and CTR by estimated 12-18%.",
            textContent: "Detected: '24/7 Emergency Plumber', '(305) 555-0123', 'Call Now - Free Estimates'",
        },
    },
    {
        id: 6,
        type: "image",
        name: "Designer Handbag Flat Lay",
        client: "Bella Fashion Boutique",
        previewBg: "from-rose-300 to-pink-500",
        previewText: "Handbag Collection Photo",
        dimensions: "1080 x 1080",
        fileSize: "1.6 MB",
        uploadedAt: "Jun 7, 2025 at 9:30 AM",
        notes: "Square format for social and shopping ads. Products should be the focus. Pricing overlay can be added by AI. These are the top 4 sellers from Q2.",
        aiAnalysis: {
            format: "JPEG",
            dimensions: "1080 x 1080",
            faceDetected: false,
            dominantColors: ["#FDA4AF", "#EC4899", "#FAFAF9"],
            layoutNotes: "4 products arranged in grid. Clean background ideal for shopping ads. Recommend adding price tags as overlays in bottom-right of each product quadrant.",
        },
    },
];

export default function KnowledgeBasePage() {
    const [selectedItem, setSelectedItem] = useState<number | null>(null);
    const [noteInput, setNoteInput] = useState("");

    const selected = kbItems.find((item) => item.id === selectedItem);

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        Knowledge Base
                        <Tooltip text="Upload images, ads, and documents. The AI will analyze them to create better, more relevant ads for your campaigns." />
                    </h1>
                    <p className="text-muted text-sm mt-1">
                        Upload ads, images &amp; files for AI to learn from. Everything is timestamped and searchable.
                    </p>
                </div>
                <button className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Upload Files
                </button>
            </div>

            {/* Upload Zone */}
            <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition cursor-pointer bg-card">
                <Upload className="w-8 h-8 text-muted mx-auto mb-3" />
                <div className="text-sm font-medium mb-1">Drag &amp; drop files here, or click to browse</div>
                <div className="text-xs text-muted">
                    Supports: JPG, PNG, GIF, PDF, DOCX &bull; Max 25MB per file
                </div>
                <div className="mt-3 flex items-center justify-center gap-4 text-xs text-muted">
                    <span className="flex items-center gap-1"><Scan className="w-3 h-3" /> AI auto-analyzes images</span>
                    <span className="flex items-center gap-1"><User className="w-3 h-3" /> Face detection</span>
                    <span className="flex items-center gap-1"><Maximize2 className="w-3 h-3" /> Size &amp; format detection</span>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-card border border-border rounded-xl p-3 text-center">
                    <div className="text-lg font-bold">{kbItems.length}</div>
                    <div className="text-xs text-muted">Total Assets</div>
                </div>
                <div className="bg-card border border-border rounded-xl p-3 text-center">
                    <div className="text-lg font-bold">{kbItems.filter((i) => i.type === "image").length}</div>
                    <div className="text-xs text-muted">Images</div>
                </div>
                <div className="bg-card border border-border rounded-xl p-3 text-center">
                    <div className="text-lg font-bold">{kbItems.filter((i) => i.type === "ad").length}</div>
                    <div className="text-xs text-muted">Ads</div>
                </div>
                <div className="bg-card border border-border rounded-xl p-3 text-center">
                    <div className="text-lg font-bold">{kbItems.filter((i) => i.type === "document").length}</div>
                    <div className="text-xs text-muted">Documents</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Items Grid */}
                <div className="lg:col-span-2 space-y-3">
                    {kbItems.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => setSelectedItem(item.id)}
                            className={`bg-card border rounded-xl p-4 cursor-pointer transition hover:border-primary/50 ${
                                selectedItem === item.id ? "border-primary ring-1 ring-primary/20" : "border-border"
                            }`}
                        >
                            <div className="flex gap-4">
                                {/* Thumbnail */}
                                <div className={`w-20 h-20 rounded-lg bg-gradient-to-br ${item.previewBg} flex items-center justify-center shrink-0`}>
                                    {item.type === "document" ? (
                                        <FileText className="w-8 h-8 text-white/80" />
                                    ) : (
                                        <Image className="w-8 h-8 text-white/80" />
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <div className="font-medium text-sm">{item.name}</div>
                                            <div className="text-xs text-muted mt-0.5">{item.client}</div>
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                                item.type === "image" ? "bg-green-100 text-green-700" :
                                                item.type === "ad" ? "bg-blue-100 text-blue-700" :
                                                "bg-gray-100 text-gray-700"
                                            }`}>
                                                {item.type === "image" ? "Image" : item.type === "ad" ? "Ad" : "Doc"}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 mt-2 text-xs text-muted">
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {item.uploadedAt}
                                        </span>
                                        <span>{item.fileSize}</span>
                                        {item.dimensions && <span>{item.dimensions}</span>}
                                    </div>

                                    {/* AI Indicators */}
                                    <div className="flex items-center gap-2 mt-2">
                                        {item.aiAnalysis.faceDetected && (
                                            <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
                                                &#128100; Face
                                            </span>
                                        )}
                                        {item.aiAnalysis.format && (
                                            <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                                                {item.aiAnalysis.format}
                                            </span>
                                        )}
                                        {item.aiAnalysis.dominantColors && (
                                            <div className="flex items-center gap-0.5">
                                                {item.aiAnalysis.dominantColors.slice(0, 3).map((color, i) => (
                                                    <div
                                                        key={i}
                                                        className="w-3 h-3 rounded-full border border-white shadow-sm"
                                                        style={{ backgroundColor: color }}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Notes Preview */}
                                    {item.notes && (
                                        <div className="mt-2 text-xs text-muted truncate">
                                            <MessageSquare className="w-3 h-3 inline mr-1" />
                                            {item.notes}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Detail Panel */}
                <div className="lg:col-span-1">
                    {selected ? (
                        <div className="bg-card border border-border rounded-xl sticky top-4">
                            {/* Preview */}
                            <div className={`h-40 rounded-t-xl bg-gradient-to-br ${selected.previewBg} flex items-center justify-center`}>
                                {selected.type === "document" ? (
                                    <FileText className="w-12 h-12 text-white/80" />
                                ) : (
                                    <Image className="w-12 h-12 text-white/80" />
                                )}
                            </div>

                            <div className="p-4 space-y-4">
                                <div>
                                    <h3 className="font-semibold text-sm">{selected.name}</h3>
                                    <div className="text-xs text-muted mt-0.5">{selected.client}</div>
                                </div>

                                {/* Meta */}
                                <div className="space-y-1.5 text-xs">
                                    <div className="flex justify-between">
                                        <span className="text-muted">Format</span>
                                        <span className="font-medium">{selected.aiAnalysis.format}</span>
                                    </div>
                                    {selected.aiAnalysis.dimensions && (
                                        <div className="flex justify-between">
                                            <span className="text-muted">Dimensions</span>
                                            <span className="font-medium">{selected.aiAnalysis.dimensions}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="text-muted">File Size</span>
                                        <span className="font-medium">{selected.fileSize}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted">Uploaded</span>
                                        <span className="font-medium">{selected.uploadedAt}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted">Face Detected</span>
                                        <span className={`font-medium ${selected.aiAnalysis.faceDetected ? "text-blue-600" : "text-muted"}`}>
                                            {selected.aiAnalysis.faceDetected ? "Yes" : "No"}
                                        </span>
                                    </div>
                                </div>

                                {/* AI Layout Analysis */}
                                {selected.aiAnalysis.layoutNotes && (
                                    <div className="bg-primary/5 border border-primary/10 rounded-lg p-3">
                                        <div className="text-xs font-medium text-primary mb-1 flex items-center gap-1">
                                            <Scan className="w-3 h-3" />
                                            AI Analysis
                                        </div>
                                        <p className="text-xs text-muted leading-relaxed">
                                            {selected.aiAnalysis.layoutNotes}
                                        </p>
                                    </div>
                                )}

                                {/* Detected Text */}
                                {selected.aiAnalysis.textContent && (
                                    <div className="bg-gray-50 rounded-lg p-3">
                                        <div className="text-xs font-medium mb-1">Detected Text</div>
                                        <p className="text-xs text-muted">{selected.aiAnalysis.textContent}</p>
                                    </div>
                                )}

                                {/* Dominant Colors */}
                                {selected.aiAnalysis.dominantColors && (
                                    <div>
                                        <div className="text-xs font-medium mb-1.5">Dominant Colors</div>
                                        <div className="flex items-center gap-2">
                                            {selected.aiAnalysis.dominantColors.map((color, i) => (
                                                <div key={i} className="flex items-center gap-1">
                                                    <div
                                                        className="w-5 h-5 rounded border border-border"
                                                        style={{ backgroundColor: color }}
                                                    />
                                                    <span className="text-xs text-muted">{color}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Notes */}
                                <div>
                                    <div className="text-xs font-medium mb-1.5 flex items-center gap-1">
                                        <MessageSquare className="w-3 h-3" />
                                        Notes &amp; Instructions for AI
                                        <Tooltip text="Add context so the AI knows how to use this asset. Include target audience, brand tone, and any dos/don'ts." position="bottom" />
                                    </div>
                                    <div className="bg-sidebar border border-border rounded-lg p-3 text-xs leading-relaxed mb-2">
                                        {selected.notes}
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={noteInput}
                                            onChange={(e) => setNoteInput(e.target.value)}
                                            placeholder="Add a note for the AI..."
                                            className="flex-1 bg-card border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-primary transition"
                                        />
                                        <button className="bg-primary text-white text-xs px-3 py-2 rounded-lg hover:bg-primary-dark transition">
                                            Add
                                        </button>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 pt-2 border-t border-border">
                                    <button className="flex-1 text-xs border border-border rounded-lg px-3 py-2 hover:border-primary transition flex items-center justify-center gap-1.5">
                                        <Eye className="w-3 h-3" />
                                        Full Preview
                                    </button>
                                    <button className="text-xs border border-border rounded-lg px-3 py-2 hover:border-danger text-muted hover:text-danger transition flex items-center justify-center gap-1.5">
                                        <Trash2 className="w-3 h-3" />
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-card border border-border rounded-xl p-8 text-center">
                            <BookOpen className="w-8 h-8 text-muted mx-auto mb-3" />
                            <div className="text-sm font-medium mb-1">Select an asset</div>
                            <div className="text-xs text-muted">
                                Click any item to see AI analysis, detected faces, layout suggestions, and add notes for the AI.
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
