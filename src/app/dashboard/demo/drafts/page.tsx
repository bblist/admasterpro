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
    ChevronDown,
    ChevronUp,
    History,
    Star,
    CheckCircle2,
    X,
    Upload,
    Move,
    Type,
    ImagePlus,
    Palette,
    Filter,
    Search,
    RotateCcw,
    EyeOff,
} from "lucide-react";
import { useState, useRef, useCallback } from "react";
import Tooltip from "@/components/Tooltip";

// Types

type AdType = "text" | "display";
type AdFilter = "all" | "text" | "display";
type LLMModel = "gpt-4o" | "claude-4.6";

type ImagePosition =
    | "center"
    | "top"
    | "bottom"
    | "left"
    | "right"
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right";

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
    imageUrl?: string;
    imagePosition?: ImagePosition;
    imageOffsetX?: number;
    imageOffsetY?: number;
    overlayText?: string;
    ctaText?: string;
    textColor?: string;
    overlayOpacity?: number;
    hideText?: boolean;
    hideCta?: boolean;
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

// Image library

interface LibraryImage {
    id: string;
    url: string;
    name: string;
    category: string;
    aspect: string;
}

const imageLibrary: LibraryImage[] = [
    { id: "img1", url: "https://images.unsplash.com/photo-1607082349566-187342175e2f?w=400&h=300&fit=crop", name: "Shopping Bags", category: "Retail", aspect: "4:3" },
    { id: "img2", url: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop", name: "Summer Fashion", category: "Fashion", aspect: "4:3" },
    { id: "img3", url: "https://images.unsplash.com/photo-1574169208507-84376144848b?w=400&h=300&fit=crop", name: "Abstract Gradient", category: "Abstract", aspect: "4:3" },
    { id: "img4", url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=300&fit=crop", name: "Luxury Handbag", category: "Fashion", aspect: "4:3" },
    { id: "img5", url: "https://images.unsplash.com/photo-1612831455740-a2f6212eeeb2?w=400&h=300&fit=crop", name: "Eye Close-up", category: "Medical", aspect: "4:3" },
    { id: "img6", url: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=400&h=300&fit=crop", name: "Doctor Portrait", category: "Medical", aspect: "4:3" },
    { id: "img7", url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop", name: "Food Platter", category: "Food", aspect: "4:3" },
    { id: "img8", url: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&h=300&fit=crop", name: "Sushi Plate", category: "Food", aspect: "4:3" },
    { id: "img9", url: "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=400&h=300&fit=crop", name: "Beach Sunset", category: "Lifestyle", aspect: "4:3" },
    { id: "img10", url: "https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=400&h=300&fit=crop", name: "Car Detail", category: "Automotive", aspect: "4:3" },
    { id: "img11", url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&h=300&fit=crop", name: "Plumbing Tools", category: "Services", aspect: "4:3" },
    { id: "img12", url: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop", name: "Happy Customer", category: "People", aspect: "4:3" },
];

// Model helpers (internal only — not shown to users)

const modelLabel = (model: LLMModel) =>
    model === "gpt-4o" ? "Model A" : "Model B";

// Position label map

const positionLabels: Record<ImagePosition, string> = {
    "top-left": "Top Left",
    top: "Top Center",
    "top-right": "Top Right",
    left: "Center Left",
    center: "Center",
    right: "Center Right",
    "bottom-left": "Bottom Left",
    bottom: "Bottom Center",
    "bottom-right": "Bottom Right",
};

const positionToCSS = (pos: ImagePosition): string => {
    const map: Record<ImagePosition, string> = {
        center: "center center",
        top: "center top",
        bottom: "center bottom",
        left: "left center",
        right: "right center",
        "top-left": "left top",
        "top-right": "right top",
        "bottom-left": "left bottom",
        "bottom-right": "right bottom",
    };
    return map[pos] || "center center";
};

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
                    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop",
                    imagePosition: "center",
                    overlayText: "SUMMER SALE 40% OFF",
                    ctaText: "Shop Now",
                    textColor: "#ffffff",
                    overlayOpacity: 40,
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
                model: "claude-4.6",
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
                model: "claude-4.6",
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
                    imageUrl: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&h=300&fit=crop",
                    imagePosition: "center",
                    overlayText: "LUNCH SPECIAL $12.99",
                    ctaText: "Order Now",
                    textColor: "#ffffff",
                    overlayOpacity: 50,
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
                model: "claude-4.6",
                content: {
                    title: "ClearVision \u2014 Eye Exam Ad",
                    dimensions: "160\u00d7600",
                    format: "Wide Skyscraper",
                    previewBg: "from-blue-400 to-teal-500",
                    previewText: "Your Eyes Deserve the Best \u2014 ClearVision Eye Clinic",
                    faceDetected: true,
                    layoutSuggestion: "Face at top 1/3, headline middle, CTA bottom",
                    imageUrl: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=400&h=300&fit=crop",
                    imagePosition: "top",
                    overlayText: "Your Eyes Deserve the Best",
                    ctaText: "Book Eye Exam",
                    textColor: "#ffffff",
                    overlayOpacity: 45,
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
                model: "claude-4.6",
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
                    imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=300&fit=crop",
                    imagePosition: "center",
                    overlayText: "NEW ARRIVALS \u2014 Designer Handbags from $149",
                    ctaText: "Shop Collection",
                    textColor: "#ffffff",
                    overlayOpacity: 40,
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
    const [filter, setFilter] = useState<AdFilter>("all");
    const [searchQuery, setSearchQuery] = useState("");

    // Display ad editor state
    const [editorOpen, setEditorOpen] = useState<number | null>(null);
    const [editorTab, setEditorTab] = useState<"image" | "text" | "position">("image");
    const [imageSearch, setImageSearch] = useState("");
    const [selectedImageId, setSelectedImageId] = useState<string | null>(null);

    // Drag-to-reposition state (for editor preview)
    const previewImageRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);
    const dragStart = useRef({ x: 0, y: 0 });
    const dragOffsetStart = useRef({ x: 0, y: 0 });

    const handleDragStart = useCallback((e: React.PointerEvent, draftId: number, dc: DisplayAdContent) => {
        isDragging.current = true;
        dragStart.current = { x: e.clientX, y: e.clientY };
        dragOffsetStart.current = { x: dc.imageOffsetX || 0, y: dc.imageOffsetY || 0 };
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }, []);

    const handleDragMove = useCallback((e: React.PointerEvent, draftId: number) => {
        if (!isDragging.current) return;
        const dx = e.clientX - dragStart.current.x;
        const dy = e.clientY - dragStart.current.y;
        const newX = dragOffsetStart.current.x + dx;
        const newY = dragOffsetStart.current.y + dy;
        setDrafts((prev) =>
            prev.map((d) => {
                if (d.id !== draftId) return d;
                return {
                    ...d,
                    versions: d.versions.map((v) => {
                        if (!v.isActive) return v;
                        return { ...v, content: { ...v.content, imageOffsetX: newX, imageOffsetY: newY } };
                    }),
                };
            })
        );
    }, []);

    const handleDragEnd = useCallback(() => {
        isDragging.current = false;
    }, []);

    const resetImageOffset = useCallback((draftId: number) => {
        setDrafts((prev) =>
            prev.map((d) => {
                if (d.id !== draftId) return d;
                return {
                    ...d,
                    versions: d.versions.map((v) => {
                        if (!v.isActive) return v;
                        return { ...v, content: { ...v.content, imageOffsetX: 0, imageOffsetY: 0 } };
                    }),
                };
            })
        );
    }, []);

    // Toggle display ad text/CTA visibility
    const toggleDisplayField = useCallback((draftId: number, field: "hideText" | "hideCta") => {
        setDrafts((prev) =>
            prev.map((d) => {
                if (d.id !== draftId) return d;
                return {
                    ...d,
                    versions: d.versions.map((v) => {
                        if (!v.isActive) return v;
                        const dc = v.content as DisplayAdContent;
                        return { ...v, content: { ...dc, [field]: !dc[field] } };
                    }),
                };
            })
        );
    }, []);

    const textDrafts = drafts.filter((d) => d.type === "text");
    const displayDrafts = drafts.filter((d) => d.type === "display");
    const totalVersions = drafts.reduce((sum, d) => sum + d.versions.length, 0);

    // Filtered drafts
    const filteredDrafts = drafts
        .filter((d) => filter === "all" || d.type === filter)
        .filter(
            (d) =>
                !searchQuery ||
                d.campaign.toLowerCase().includes(searchQuery.toLowerCase()) ||
                d.client.toLowerCase().includes(searchQuery.toLowerCase())
        );

    // Filtered image library
    const filteredImages = imageLibrary.filter(
        (img) =>
            !imageSearch ||
            img.name.toLowerCase().includes(imageSearch.toLowerCase()) ||
            img.category.toLowerCase().includes(imageSearch.toLowerCase())
    );

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
        setTimeout(() => {
            setDrafts((prev) =>
                prev.map((d) => {
                    if (d.id !== draftId) return d;
                    const newVersionId = Math.max(...d.versions.map((v) => v.versionId)) + 1;
                    const models: LLMModel[] = ["gpt-4o", "claude-4.6"];
                    const model = models[Math.floor(Math.random() * 2)];
                    const now = new Date();
                    const timeStr = `${now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} \u2022 ${now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
                    const activeVersion = d.versions.find((v) => v.isActive);
                    let newContent: TextAdContent | DisplayAdContent;
                    if (d.type === "text" && activeVersion) {
                        const tc = activeVersion.content as TextAdContent;
                        newContent = { ...tc, headline1: tc.headline1 + " \u2014 v" + newVersionId, description: tc.description.replace(/\.$/, "") + ". New AI variation." };
                    } else if (activeVersion) {
                        const dc = activeVersion.content as DisplayAdContent;
                        newContent = { ...dc, previewText: dc.previewText + " (v" + newVersionId + ")" };
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
            setExpandedVersions((prev) => new Set(prev).add(draftId));
        }, 1500);
    };

    const setActiveVersion = (draftId: number, versionId: number) => {
        setDrafts((prev) =>
            prev.map((d) => {
                if (d.id !== draftId) return d;
                return { ...d, versions: d.versions.map((v) => ({ ...v, isActive: v.versionId === versionId })) };
            })
        );
    };

    const deleteVersion = (draftId: number, versionId: number) => {
        setDrafts((prev) =>
            prev.map((d) => {
                if (d.id !== draftId) return d;
                const updated = d.versions.filter((v) => v.versionId !== versionId);
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

    // Display ad editor helpers
    const updateDisplayField = (draftId: number, field: string, value: string | number) => {
        setDrafts((prev) =>
            prev.map((d) => {
                if (d.id !== draftId) return d;
                return {
                    ...d,
                    versions: d.versions.map((v) => {
                        if (!v.isActive) return v;
                        return { ...v, content: { ...v.content, [field]: value } };
                    }),
                };
            })
        );
    };

    const openEditor = (draftId: number) => {
        setEditorOpen(draftId);
        setEditorTab("image");
        setImageSearch("");
        setSelectedImageId(null);
    };

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

    const renderDisplayPreview = (content: DisplayAdContent, compact?: boolean) => {
        const hasImage = !!content.imageUrl;
        const heightClass = content.dimensions === "728\u00d790" ? (compact ? "h-16" : "h-20")
            : content.dimensions === "160\u00d7600" ? (compact ? "h-48" : "h-56")
            : content.dimensions === "300\u00d7600" ? (compact ? "h-48" : "h-56")
            : compact ? "h-28" : "h-36";

        return (
            <div className="bg-sidebar border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                    <div className="text-xs text-muted">
                        Display Preview &mdash; {content.format} ({content.dimensions})
                    </div>
                    <div className="flex items-center gap-2">
                        {content.faceDetected && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                &#128100; Face Detected
                            </span>
                        )}
                        {hasImage && (
                            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                                &#128247; Image Set
                            </span>
                        )}
                    </div>
                </div>

                {/* Display ad visual */}
                <div
                    className={`relative rounded-lg overflow-hidden ${heightClass} ${!hasImage ? `bg-gradient-to-r ${content.previewBg}` : ""}`}
                >
                    {hasImage && (
                        <img
                            src={content.imageUrl}
                            alt={content.title}
                            className="absolute inset-0 w-full h-full object-cover"
                            style={{
                                objectPosition: positionToCSS((content.imagePosition || "center") as ImagePosition),
                                transform: (content.imageOffsetX || content.imageOffsetY) ? `translate(${content.imageOffsetX || 0}px, ${content.imageOffsetY || 0}px)` : undefined,
                            }}
                        />
                    )}
                    {/* Overlay */}
                    {!content.hideText && (
                    <div
                        className="absolute inset-0 flex flex-col items-center justify-center p-4"
                        style={{
                            backgroundColor: hasImage ? `rgba(0,0,0,${(content.overlayOpacity || 40) / 100})` : "transparent",
                        }}
                    >
                        <div
                            className="font-bold text-sm drop-shadow-lg text-center leading-tight"
                            style={{ color: content.textColor || "#ffffff" }}
                        >
                            {content.overlayText || content.previewText}
                        </div>
                        {content.ctaText && !content.hideCta && (
                            <div className="mt-2 px-4 py-1 bg-white/90 text-gray-900 text-xs font-semibold rounded-full">
                                {content.ctaText}
                            </div>
                        )}
                    </div>
                    )}
                </div>

                {content.layoutSuggestion && (
                    <div className="mt-2 text-xs text-primary bg-primary/5 rounded px-2 py-1">
                        &#128208; AI Layout: {content.layoutSuggestion}
                    </div>
                )}
            </div>
        );
    };

    // Display ad editor panel
    const renderDisplayEditor = (draft: Draft) => {
        const active = getActiveVersion(draft);
        const dc = active.content as DisplayAdContent;

        return (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-card border border-border rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
                    {/* Editor header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-sidebar">
                        <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-br from-orange-500 to-pink-500 rounded-lg p-2">
                                <Image className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <h2 className="font-semibold text-sm">Display Ad Editor</h2>
                                <p className="text-xs text-muted">{dc.title} &bull; {dc.format} ({dc.dimensions})</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setEditorOpen(null)}
                            className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:border-primary transition"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Editor body */}
                    <div className="flex flex-1 overflow-hidden">
                        {/* Left: Controls */}
                        <div className="w-[420px] border-r border-border flex flex-col overflow-hidden">
                            {/* Tabs */}
                            <div className="flex border-b border-border bg-sidebar">
                                {[
                                    { key: "image" as const, label: "Image", icon: ImagePlus },
                                    { key: "text" as const, label: "Text & CTA", icon: Type },
                                    { key: "position" as const, label: "Position", icon: Move },
                                ].map((tab) => (
                                    <button
                                        key={tab.key}
                                        onClick={() => setEditorTab(tab.key)}
                                        className={`flex-1 py-2.5 text-xs font-medium flex items-center justify-center gap-1.5 border-b-2 transition ${
                                            editorTab === tab.key
                                                ? "border-primary text-primary bg-card"
                                                : "border-transparent text-muted hover:text-foreground"
                                        }`}
                                    >
                                        <tab.icon className="w-3.5 h-3.5" />
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            <div className="flex-1 overflow-auto p-4 space-y-4">
                                {/* IMAGE TAB */}
                                {editorTab === "image" && (
                                    <>
                                        <div>
                                            <label className="text-xs font-semibold text-foreground mb-2 block">Image Library</label>
                                            <p className="text-xs text-muted mb-3">Select an image from the library or use a custom URL.</p>
                                            <div className="relative mb-3">
                                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
                                                <input
                                                    type="text"
                                                    value={imageSearch}
                                                    onChange={(e) => setImageSearch(e.target.value)}
                                                    placeholder="Search images..."
                                                    className="w-full bg-sidebar border border-border rounded-lg pl-8 pr-3 py-2 text-xs focus:outline-none focus:border-primary"
                                                />
                                            </div>
                                            <div className="grid grid-cols-3 gap-2 max-h-[260px] overflow-auto">
                                                {filteredImages.map((img) => (
                                                    <button
                                                        key={img.id}
                                                        onClick={() => {
                                                            updateDisplayField(draft.id, "imageUrl", img.url);
                                                            setSelectedImageId(img.id);
                                                        }}
                                                        className={`relative rounded-lg overflow-hidden border-2 transition group ${
                                                            dc.imageUrl === img.url
                                                                ? "border-primary ring-2 ring-primary/20"
                                                                : "border-border hover:border-primary/50"
                                                        }`}
                                                    >
                                                        <img
                                                            src={img.url}
                                                            alt={img.name}
                                                            className="w-full h-20 object-cover"
                                                        />
                                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center">
                                                            {dc.imageUrl === img.url && (
                                                                <CheckCircle2 className="w-5 h-5 text-white drop-shadow-lg" />
                                                            )}
                                                        </div>
                                                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1.5 py-0.5">
                                                            <span className="text-[9px] text-white font-medium">{img.name}</span>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="border-t border-border pt-4">
                                            <label className="text-xs font-semibold text-foreground mb-1.5 block">Custom Image URL</label>
                                            <input
                                                type="text"
                                                value={dc.imageUrl || ""}
                                                onChange={(e) => updateDisplayField(draft.id, "imageUrl", e.target.value)}
                                                placeholder="https://example.com/my-image.jpg"
                                                className="w-full bg-sidebar border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-primary"
                                            />
                                            <p className="text-[10px] text-muted mt-1">Paste any image URL or select from the library above.</p>
                                        </div>

                                        <div className="border-t border-border pt-4">
                                            <label className="text-xs font-semibold text-foreground mb-1.5 block">Or Upload</label>
                                            <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition cursor-pointer">
                                                <Upload className="w-5 h-5 text-muted mx-auto mb-1" />
                                                <p className="text-xs text-muted">Drop an image here or click to upload</p>
                                                <p className="text-[10px] text-muted mt-0.5">PNG, JPG, WebP up to 5MB</p>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* TEXT TAB */}
                                {editorTab === "text" && (
                                    <>
                                        {/* Text / CTA visibility toggles */}
                                        <div className="bg-sidebar border border-border rounded-lg p-3 space-y-2.5">
                                            <label className="text-xs font-semibold text-foreground block">Visibility</label>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <EyeOff className="w-3.5 h-3.5 text-muted" />
                                                    <span className="text-xs">Show Overlay Text</span>
                                                </div>
                                                <button
                                                    onClick={() => toggleDisplayField(draft.id, "hideText")}
                                                    className={`relative w-9 h-5 rounded-full transition-colors ${!dc.hideText ? "bg-primary" : "bg-gray-300"}`}
                                                >
                                                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${!dc.hideText ? "translate-x-4" : "translate-x-0"}`} />
                                                </button>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <EyeOff className="w-3.5 h-3.5 text-muted" />
                                                    <span className="text-xs">Show CTA Button</span>
                                                </div>
                                                <button
                                                    onClick={() => toggleDisplayField(draft.id, "hideCta")}
                                                    className={`relative w-9 h-5 rounded-full transition-colors ${!dc.hideCta ? "bg-primary" : "bg-gray-300"}`}
                                                >
                                                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${!dc.hideCta ? "translate-x-4" : "translate-x-0"}`} />
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs font-semibold text-foreground mb-1.5 block">Headline / Overlay Text</label>
                                            <textarea
                                                value={dc.overlayText || ""}
                                                onChange={(e) => updateDisplayField(draft.id, "overlayText", e.target.value)}
                                                placeholder="Enter your headline text..."
                                                rows={3}
                                                className="w-full bg-sidebar border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-primary resize-none"
                                            />
                                            <p className="text-[10px] text-muted mt-1">This text appears over the image. Keep it short and punchy.</p>
                                        </div>

                                        <div>
                                            <label className="text-xs font-semibold text-foreground mb-1.5 block">Call-to-Action Button Text</label>
                                            <input
                                                type="text"
                                                value={dc.ctaText || ""}
                                                onChange={(e) => updateDisplayField(draft.id, "ctaText", e.target.value)}
                                                placeholder="e.g. Shop Now, Learn More, Book Today"
                                                className="w-full bg-sidebar border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-primary"
                                            />
                                            <div className="flex gap-1.5 mt-2 flex-wrap">
                                                {["Shop Now", "Learn More", "Book Today", "Get Started", "Order Now", "Sign Up"].map((cta) => (
                                                    <button
                                                        key={cta}
                                                        onClick={() => updateDisplayField(draft.id, "ctaText", cta)}
                                                        className={`text-[10px] px-2 py-0.5 rounded-full border transition ${
                                                            dc.ctaText === cta
                                                                ? "border-primary bg-primary/10 text-primary"
                                                                : "border-border text-muted hover:border-primary/50"
                                                        }`}
                                                    >
                                                        {cta}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs font-semibold text-foreground mb-1.5 block">Text Color</label>
                                            <div className="flex gap-2 items-center">
                                                <input
                                                    type="color"
                                                    value={dc.textColor || "#ffffff"}
                                                    onChange={(e) => updateDisplayField(draft.id, "textColor", e.target.value)}
                                                    className="w-8 h-8 rounded border border-border cursor-pointer"
                                                />
                                                <input
                                                    type="text"
                                                    value={dc.textColor || "#ffffff"}
                                                    onChange={(e) => updateDisplayField(draft.id, "textColor", e.target.value)}
                                                    className="flex-1 bg-sidebar border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-primary"
                                                />
                                                <div className="flex gap-1">
                                                    {["#ffffff", "#000000", "#f59e0b", "#ef4444", "#3b82f6"].map((c) => (
                                                        <button
                                                            key={c}
                                                            onClick={() => updateDisplayField(draft.id, "textColor", c)}
                                                            className={`w-6 h-6 rounded-full border-2 transition ${
                                                                dc.textColor === c ? "border-primary scale-110" : "border-border"
                                                            }`}
                                                            style={{ backgroundColor: c }}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs font-semibold text-foreground mb-1.5 block">
                                                Overlay Darkness: {dc.overlayOpacity || 40}%
                                            </label>
                                            <input
                                                type="range"
                                                min={0}
                                                max={90}
                                                value={dc.overlayOpacity || 40}
                                                onChange={(e) => updateDisplayField(draft.id, "overlayOpacity", parseInt(e.target.value))}
                                                className="w-full accent-primary"
                                            />
                                            <div className="flex justify-between text-[10px] text-muted mt-0.5">
                                                <span>No overlay</span>
                                                <span>Very dark</span>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs font-semibold text-foreground mb-1.5 block">Ad Title (internal)</label>
                                            <input
                                                type="text"
                                                value={dc.title || ""}
                                                onChange={(e) => updateDisplayField(draft.id, "title", e.target.value)}
                                                className="w-full bg-sidebar border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-primary"
                                            />
                                        </div>
                                    </>
                                )}

                                {/* POSITION TAB */}
                                {editorTab === "position" && (
                                    <>
                                        <div>
                                            <label className="text-xs font-semibold text-foreground mb-2 block">Image Position</label>
                                            <p className="text-xs text-muted mb-3">Choose how the image is cropped and positioned within the ad frame.</p>

                                            {/* 3x3 position grid */}
                                            <div className="grid grid-cols-3 gap-1.5 w-48 mx-auto mb-4">
                                                {(["top-left", "top", "top-right", "left", "center", "right", "bottom-left", "bottom", "bottom-right"] as ImagePosition[]).map(
                                                    (pos) => (
                                                        <button
                                                            key={pos}
                                                            onClick={() => updateDisplayField(draft.id, "imagePosition", pos)}
                                                            className={`h-12 rounded-lg border-2 text-[10px] font-medium transition flex items-center justify-center ${
                                                                dc.imagePosition === pos
                                                                    ? "border-primary bg-primary/10 text-primary"
                                                                    : "border-border text-muted hover:border-primary/50 hover:text-foreground"
                                                            }`}
                                                        >
                                                            {positionLabels[pos].split(" ").map((w, i) => (
                                                                <span key={i}>{i > 0 ? " " : ""}{w}</span>
                                                            ))}
                                                        </button>
                                                    )
                                                )}
                                            </div>

                                            <div className="bg-sidebar border border-border rounded-lg p-3">
                                                <div className="text-xs font-medium mb-1 flex items-center gap-1.5">
                                                    <Move className="w-3.5 h-3.5 text-primary" />
                                                    Current: {positionLabels[dc.imagePosition as ImagePosition || "center"]}
                                                </div>
                                                <p className="text-[10px] text-muted">
                                                    The image will be cropped to fit the ad dimensions ({dc.dimensions}).
                                                    Position determines which part of the image remains visible.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="border-t border-border pt-4">
                                            <label className="text-xs font-semibold text-foreground mb-2 block">Ad Dimensions</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {[
                                                    { dim: "728\u00d790", label: "Leaderboard", desc: "Top of page" },
                                                    { dim: "300\u00d7250", label: "Medium Rectangle", desc: "Sidebar/inline" },
                                                    { dim: "160\u00d7600", label: "Wide Skyscraper", desc: "Side panel" },
                                                    { dim: "300\u00d7600", label: "Half Page", desc: "Large sidebar" },
                                                    { dim: "320\u00d750", label: "Mobile Banner", desc: "Mobile top/bottom" },
                                                    { dim: "970\u00d7250", label: "Billboard", desc: "Top of page (large)" },
                                                ].map((size) => (
                                                    <button
                                                        key={size.dim}
                                                        onClick={() => {
                                                            updateDisplayField(draft.id, "dimensions", size.dim);
                                                            updateDisplayField(draft.id, "format", size.label);
                                                        }}
                                                        className={`text-left rounded-lg border-2 p-2.5 transition ${
                                                            dc.dimensions === size.dim
                                                                ? "border-primary bg-primary/5"
                                                                : "border-border hover:border-primary/50"
                                                        }`}
                                                    >
                                                        <div className="text-xs font-medium">{size.dim}</div>
                                                        <div className="text-[10px] text-muted">{size.label}</div>
                                                        <div className="text-[9px] text-muted mt-0.5">{size.desc}</div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="border-t border-border pt-4">
                                            <label className="text-xs font-semibold text-foreground mb-2 block">Background Gradient</label>
                                            <p className="text-[10px] text-muted mb-2">Used when no image is set, or as fallback.</p>
                                            <div className="grid grid-cols-3 gap-2">
                                                {[
                                                    { bg: "from-pink-400 to-purple-500", label: "Pink/Purple" },
                                                    { bg: "from-blue-400 to-teal-500", label: "Blue/Teal" },
                                                    { bg: "from-amber-400 to-red-500", label: "Amber/Red" },
                                                    { bg: "from-emerald-400 to-cyan-500", label: "Green/Cyan" },
                                                    { bg: "from-rose-300 to-pink-500", label: "Rose/Pink" },
                                                    { bg: "from-violet-400 to-indigo-500", label: "Violet/Indigo" },
                                                ].map((g) => (
                                                    <button
                                                        key={g.bg}
                                                        onClick={() => updateDisplayField(draft.id, "previewBg", g.bg)}
                                                        className={`rounded-lg border-2 p-1 transition ${
                                                            dc.previewBg === g.bg ? "border-primary" : "border-border hover:border-primary/50"
                                                        }`}
                                                    >
                                                        <div className={`bg-gradient-to-r ${g.bg} rounded h-6`} />
                                                        <div className="text-[9px] text-muted text-center mt-0.5">{g.label}</div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Right: Live Preview */}
                        <div className="flex-1 p-6 overflow-auto bg-gray-50 flex flex-col">
                            <div className="text-xs font-semibold text-foreground mb-3 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Eye className="w-3.5 h-3.5 text-primary" />
                                    Live Preview
                                    <span className="text-[10px] text-muted font-normal">&bull; Changes update in real-time</span>
                                </div>
                                {dc.imageUrl && (dc.imageOffsetX || dc.imageOffsetY) ? (
                                    <button
                                        onClick={() => resetImageOffset(draft.id)}
                                        className="text-[10px] text-primary hover:text-primary-dark flex items-center gap-1 font-medium"
                                    >
                                        <RotateCcw className="w-3 h-3" />
                                        Reset Position
                                    </button>
                                ) : null}
                            </div>

                            <div className="flex-1 flex items-center justify-center">
                                <div
                                    className="w-full max-w-lg"
                                    ref={previewImageRef}
                                >
                                    {/* Same preview but with drag-to-reposition on the image */}
                                    <div className="bg-sidebar border border-border rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="text-xs text-muted">
                                                Display Preview &mdash; {dc.format} ({dc.dimensions})
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {dc.faceDetected && (
                                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">&#128100; Face Detected</span>
                                                )}
                                                {dc.imageUrl && (
                                                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">&#128247; Image Set</span>
                                                )}
                                            </div>
                                        </div>

                                        <div
                                            className={`relative rounded-lg overflow-hidden ${
                                                dc.dimensions === "728\u00d790" ? "h-20"
                                                : dc.dimensions === "160\u00d7600" ? "h-56"
                                                : dc.dimensions === "300\u00d7600" ? "h-56"
                                                : "h-36"
                                            } ${!dc.imageUrl ? `bg-gradient-to-r ${dc.previewBg}` : ""}`}
                                            style={{ cursor: dc.imageUrl ? "grab" : undefined, touchAction: "none" }}
                                            onPointerDown={(e) => { if (dc.imageUrl) handleDragStart(e, draft.id, dc); }}
                                            onPointerMove={(e) => { if (dc.imageUrl) handleDragMove(e, draft.id); }}
                                            onPointerUp={handleDragEnd}
                                            onPointerCancel={handleDragEnd}
                                        >
                                            {dc.imageUrl && (
                                                <img
                                                    src={dc.imageUrl}
                                                    alt={dc.title}
                                                    className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
                                                    draggable={false}
                                                    style={{
                                                        objectPosition: positionToCSS((dc.imagePosition || "center") as ImagePosition),
                                                        transform: (dc.imageOffsetX || dc.imageOffsetY) ? `translate(${dc.imageOffsetX || 0}px, ${dc.imageOffsetY || 0}px)` : undefined,
                                                    }}
                                                />
                                            )}
                                            {!dc.hideText && (
                                                <div
                                                    className="absolute inset-0 flex flex-col items-center justify-center p-4 pointer-events-none"
                                                    style={{ backgroundColor: dc.imageUrl ? `rgba(0,0,0,${(dc.overlayOpacity || 40) / 100})` : "transparent" }}
                                                >
                                                    <div className="font-bold text-sm drop-shadow-lg text-center leading-tight" style={{ color: dc.textColor || "#ffffff" }}>
                                                        {dc.overlayText || dc.previewText}
                                                    </div>
                                                    {dc.ctaText && !dc.hideCta && (
                                                        <div className="mt-2 px-4 py-1 bg-white/90 text-gray-900 text-xs font-semibold rounded-full">
                                                            {dc.ctaText}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {dc.imageUrl && (
                                            <div className="mt-2 text-[10px] text-muted flex items-center gap-2">
                                                <Move className="w-3 h-3" />
                                                Drag the image to reposition
                                                {(dc.imageOffsetX || dc.imageOffsetY) ? (
                                                    <span className="text-primary font-medium ml-1">
                                                        Offset: {Math.round(dc.imageOffsetX || 0)}px, {Math.round(dc.imageOffsetY || 0)}px
                                                    </span>
                                                ) : null}
                                            </div>
                                        )}

                                        {dc.layoutSuggestion && (
                                            <div className="mt-2 text-xs text-primary bg-primary/5 rounded px-2 py-1">
                                                &#128208; AI Layout: {dc.layoutSuggestion}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Quick stats under preview */}
                            <div className="mt-4 grid grid-cols-3 gap-3">
                                <div className="bg-card border border-border rounded-lg p-3 text-center">
                                    <div className="text-xs text-muted">Format</div>
                                    <div className="text-sm font-semibold">{dc.format}</div>
                                </div>
                                <div className="bg-card border border-border rounded-lg p-3 text-center">
                                    <div className="text-xs text-muted">Size</div>
                                    <div className="text-sm font-semibold">{dc.dimensions}</div>
                                </div>
                                <div className="bg-card border border-border rounded-lg p-3 text-center">
                                    <div className="text-xs text-muted">Image</div>
                                    <div className="text-sm font-semibold">{dc.imageUrl ? "Custom" : "Gradient"}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Editor footer */}
                    <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-sidebar">
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted">{draft.campaign} &bull; {draft.client}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setEditorOpen(null)}
                                className="text-xs border border-border rounded-lg px-4 py-1.5 hover:border-primary transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => setEditorOpen(null)}
                                className="text-xs bg-primary text-white rounded-lg px-4 py-1.5 hover:bg-primary-dark transition font-medium flex items-center gap-1.5"
                            >
                                <CheckCircle2 className="w-3 h-3" />
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Demo banner */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2">
                <span className="text-xs font-bold bg-amber-400 text-amber-900 px-2 py-0.5 rounded-full">DEMO</span>
                <span className="text-xs text-amber-800">
                    You&apos;re viewing demo ad drafts with sample data. These are examples to help you explore the platform.
                </span>
            </div>

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        Ad Drafts
                        <span className="text-xs font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Demo</span>
                        <Tooltip text="All ads are AI-generated drafts. Nothing runs until you click Go Live. Use Regenerate to get fresh AI variations." />
                    </h1>
                    <p className="text-muted text-sm mt-1">
                        Review AI-generated ads before they go live. Nothing runs until you approve it.
                    </p>
                </div>
                <div className="flex gap-3 items-center">
                    <div className="text-sm text-muted">
                        {drafts.length} drafts &bull; {totalVersions} versions &bull; {drafts.filter((d) => d.status === "ready").length} ready
                    </div>
                </div>
            </div>

            {/* Filter bar */}
            <div className="bg-card border border-border rounded-xl p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <div className="flex bg-sidebar rounded-lg p-0.5 border border-border">
                        {[
                            { key: "all" as AdFilter, label: "All", count: drafts.length },
                            { key: "text" as AdFilter, label: "Text Ads", count: textDrafts.length, icon: FileText },
                            { key: "display" as AdFilter, label: "Display Ads", count: displayDrafts.length, icon: Image },
                        ].map((f) => (
                            <button
                                key={f.key}
                                onClick={() => setFilter(f.key)}
                                className={`text-xs px-3 py-1.5 rounded-md transition flex items-center gap-1.5 font-medium ${
                                    filter === f.key
                                        ? "bg-primary text-white shadow-sm"
                                        : "text-muted hover:text-foreground"
                                }`}
                            >
                                {f.icon && <f.icon className="w-3 h-3" />}
                                {f.label}
                                <span className={`text-[10px] px-1 py-0.5 rounded ${
                                    filter === f.key ? "bg-white/20" : "bg-muted/10"
                                }`}>
                                    {f.count}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search campaigns or clients..."
                        className="bg-sidebar border border-border rounded-lg pl-8 pr-3 py-1.5 text-xs w-56 focus:outline-none focus:border-primary"
                    />
                </div>
            </div>



            {/* Info banner */}
            <div className="bg-primary-light border border-primary/20 rounded-xl p-4 text-sm">
                <strong>&#128274; Draft-first safety:</strong> All these ads were created by your AI assistant based
                on your Knowledge Base content. They&apos;re saved here as drafts &mdash; nothing runs in
                Google Ads until you approve. Click <strong>Regenerate</strong> to create new variations. For display ads, click <strong>Edit Display</strong> to customize images, text, and positioning.
            </div>

            {/* Drafts */}
            <div className="space-y-4">
                {filteredDrafts.length === 0 && (
                    <div className="bg-card border border-border rounded-xl p-8 text-center">
                        <Filter className="w-8 h-8 text-muted mx-auto mb-2" />
                        <p className="text-sm text-muted">No drafts match your filter.</p>
                        <button
                            onClick={() => { setFilter("all"); setSearchQuery(""); }}
                            className="text-xs text-primary hover:text-primary-dark mt-2 font-medium"
                        >
                            Clear filters
                        </button>
                    </div>
                )}

                {filteredDrafts.map((draft) => {
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
                                            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                                draft.status === "ready"
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
                                                            <div className={`relative rounded overflow-hidden h-12 ${!(version.content as DisplayAdContent).imageUrl ? `bg-gradient-to-r ${(version.content as DisplayAdContent).previewBg}` : ""}`}>
                                                                {(version.content as DisplayAdContent).imageUrl && (
                                                                    <img
                                                                        src={(version.content as DisplayAdContent).imageUrl}
                                                                        alt=""
                                                                        className="absolute inset-0 w-full h-full object-cover"
                                                                        style={{ objectPosition: positionToCSS(((version.content as DisplayAdContent).imagePosition || "center") as ImagePosition) }}
                                                                    />
                                                                )}
                                                                <div
                                                                    className="absolute inset-0 flex items-center justify-center"
                                                                    style={{ backgroundColor: (version.content as DisplayAdContent).imageUrl ? `rgba(0,0,0,${((version.content as DisplayAdContent).overlayOpacity || 40) / 100})` : "transparent" }}
                                                                >
                                                                    <span className="text-xs font-bold text-white drop-shadow">
                                                                        {(version.content as DisplayAdContent).overlayText || (version.content as DisplayAdContent).previewText}
                                                                    </span>
                                                                </div>
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
                                    {draft.type === "display" ? (
                                        <button
                                            onClick={() => openEditor(draft.id)}
                                            className="text-xs border border-orange-300 bg-orange-50 text-orange-700 rounded-lg px-3 py-1.5 hover:bg-orange-100 hover:border-orange-400 transition flex items-center gap-1.5 font-medium"
                                        >
                                            <Palette className="w-3 h-3" />
                                            Edit Display
                                        </button>
                                    ) : (
                                        <button className="text-xs border border-border rounded-lg px-3 py-1.5 hover:border-primary transition flex items-center gap-1.5">
                                            <Pencil className="w-3 h-3" />
                                            Edit
                                        </button>
                                    )}
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

            {/* Display Ad Editor Modal */}
            {editorOpen !== null && (() => {
                const editorDraft = drafts.find((d) => d.id === editorOpen);
                if (!editorDraft || editorDraft.type !== "display") return null;
                return renderDisplayEditor(editorDraft);
            })()}
        </div>
    );
}
