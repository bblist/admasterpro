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
    Globe,
    Video,
    Type,
    CheckCircle2,
    AlertCircle,
    Loader2,
    RefreshCw,
    Search,
    ChevronDown,
    Building2,
    Target,
    Megaphone,
    Users,
    Star,
    Shield,
    FileVideo,
    FileImage,
    File,
    ExternalLink,
    Sparkles,
    Brain,
    Download,
    Copy,
    Edit3,
    Tag,
} from "lucide-react";
import { useState } from "react";
import Tooltip from "@/components/Tooltip";
import { useBusiness } from "@/lib/business-context";

// Types

type AssetType = "image" | "document" | "ad" | "video" | "text";
type TabId = "assets" | "text" | "urls" | "brand";
type CrawlStatus = "crawled" | "crawling" | "queued" | "failed";

interface KBAsset {
    id: number;
    type: AssetType;
    name: string;
    client: string;
    previewBg: string;
    previewText: string;
    dimensions?: string;
    duration?: string;
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
        videoNotes?: string;
    };
}

interface TextEntry {
    id: number;
    title: string;
    category: string;
    content: string;
    client: string;
    addedAt: string;
    wordCount: number;
    aiSummary: string;
}

interface CrawledURL {
    id: number;
    url: string;
    status: CrawlStatus;
    pagesFound: number;
    lastCrawled?: string;
    contentExtracted: string;
    client: string;
}

// Demo Data

const assets: KBAsset[] = [
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
            layoutNotes: "Face detected in center-right. Recommend placing text on left side for balance.",
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
        notes: "Show real patient results. Include disclaimer text at bottom. Dr. Martinez approved this image.",
        aiAnalysis: {
            format: "PNG",
            dimensions: "1200 x 628",
            faceDetected: true,
            dominantColors: ["#0EA5E9", "#14B8A6", "#FFFFFF"],
            layoutNotes: "Two faces detected (before/after split). Recommend keeping faces in upper 2/3.",
            textContent: "Detected: \u2018See the difference\u2019 watermark",
        },
    },
    {
        id: 3,
        type: "video",
        name: "30s Sushi Promo Reel",
        client: "Sakura Sushi Bar",
        previewBg: "from-amber-400 to-red-500",
        previewText: "Sushi Promo Video",
        duration: "0:30",
        fileSize: "18.2 MB",
        uploadedAt: "Jun 10, 2025 at 4:45 PM",
        notes: "Short-form video ad for YouTube and Instagram. Focus on close-up sushi shots.",
        aiAnalysis: {
            format: "MP4 (H.264)",
            dimensions: "1920 x 1080",
            faceDetected: true,
            dominantColors: ["#F59E0B", "#EF4444", "#1F2937"],
            videoNotes: "30 frames analyzed. Key scenes: 0:03 sushi prep, 0:12 plating close-up, 0:22 happy customer, 0:28 logo+CTA. Recommend keeping CTA visible for final 5 seconds.",
            textContent: "Detected at 0:28: \u2018Sakura Sushi - Order Now\u2019",
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
        notes: "Contains logo usage rules, color codes (#1A1A2E primary, #E94560 accent), font specs.",
        aiAnalysis: {
            format: "PDF (12 pages)",
            textContent: "Extracted: Primary #1A1A2E, Accent #E94560, Logo min 120px, Tagline: \u2018Drive in Style\u2019",
            layoutNotes: "Brand requires 20px clear space around logo. Dark backgrounds preferred.",
        },
    },
    {
        id: 5,
        type: "document",
        name: "Service Menu & Pricing",
        client: "Mike\u2019s Plumbing",
        previewBg: "from-blue-500 to-blue-700",
        previewText: "Services & Pricing DOCX",
        fileSize: "245 KB",
        uploadedAt: "Jun 8, 2025 at 3:20 PM",
        notes: "Full list of services with pricing. Emergency call-out $89. Free estimates on jobs over $200.",
        aiAnalysis: {
            format: "DOCX (8 pages)",
            textContent: "Extracted 23 services. Key: Emergency $89, Drain Cleaning $149+, Water Heater $899+, Pipe Repair $199+.",
            layoutNotes: "Structured price list. AI can reference exact prices in ad copy.",
        },
    },
    {
        id: 6,
        type: "video",
        name: "Customer Testimonial - Maria",
        client: "ClearVision Eye Clinic",
        previewBg: "from-teal-400 to-blue-500",
        previewText: "Patient Testimonial",
        duration: "1:15",
        fileSize: "32.5 MB",
        uploadedAt: "Jun 7, 2025 at 2:00 PM",
        notes: "Real patient testimonial. Maria had LASIK April 2025. She consented to use in advertising.",
        aiAnalysis: {
            format: "MOV (H.265)",
            dimensions: "1920 x 1080",
            faceDetected: true,
            dominantColors: ["#14B8A6", "#3B82F6", "#FFFFFF"],
            videoNotes: "Single speaker, well-lit. Key quotes: 0:25 \u2018best decision I ever made\u2019, 0:48 \u2018I can see clearly now\u2019. Good for pull-quote ads.",
            textContent: "Full transcript extracted (187 words). Sentiment: Very positive.",
        },
    },
    {
        id: 7,
        type: "ad",
        name: "Emergency Plumber - Google Ad",
        client: "Mike\u2019s Plumbing",
        previewBg: "from-blue-600 to-indigo-700",
        previewText: "24/7 Plumber Display Ad",
        dimensions: "300 x 250",
        fileSize: "145 KB",
        uploadedAt: "Jun 6, 2025 at 9:30 AM",
        notes: "Best-performing display ad. CTR is 2.8%. Keep bold phone number visible.",
        aiAnalysis: {
            format: "PNG",
            dimensions: "300 x 250",
            faceDetected: false,
            dominantColors: ["#3B82F6", "#1D4ED8", "#FFFFFF"],
            layoutNotes: "Text-heavy design. Phone number prominent. Consider adding technician image for +12-18% CTR.",
            textContent: "Detected: \u201824/7 Emergency Plumber\u2019, \u2018(305) 555-0123\u2019, \u2018Call Now\u2019",
        },
    },
    {
        id: 8,
        type: "image",
        name: "Designer Handbag Flat Lay",
        client: "Bella Fashion Boutique",
        previewBg: "from-rose-300 to-pink-500",
        previewText: "Handbag Collection Photo",
        dimensions: "1080 x 1080",
        fileSize: "1.6 MB",
        uploadedAt: "Jun 5, 2025 at 11:00 AM",
        notes: "Square format for social and shopping ads. Top 4 sellers from Q2.",
        aiAnalysis: {
            format: "JPEG",
            dimensions: "1080 x 1080",
            faceDetected: false,
            dominantColors: ["#FDA4AF", "#EC4899", "#FAFAF9"],
            layoutNotes: "4 products in grid. Clean background ideal for shopping ads.",
        },
    },
];

const textEntries: TextEntry[] = [
    {
        id: 1,
        title: "About Us - Company Story",
        category: "About Us",
        client: "ClearVision Eye Clinic",
        content: "ClearVision Eye Clinic was founded in 2012 by Dr. Elena Martinez, a board-certified ophthalmologist with over 20 years of experience. We specialize in LASIK, PRK, and cataract surgery. Our state-of-the-art facility in downtown Miami uses the latest Wavelight EX500 excimer laser. We have performed over 15,000 successful procedures with a 98.7% patient satisfaction rate.",
        addedAt: "Jun 10, 2025 at 9:00 AM",
        wordCount: 342,
        aiSummary: "Eye clinic founded 2012, Dr. Martinez, LASIK/PRK/cataract, 15K+ procedures, 98.7% satisfaction, Miami.",
    },
    {
        id: 2,
        title: "Services & Specialties",
        category: "Services",
        client: "Mike\u2019s Plumbing",
        content: "Mike\u2019s Plumbing offers residential and commercial plumbing across Miami-Dade County. 24/7 emergency service. Services: drain cleaning ($149+), water heater install ($899+), pipe repair ($199+), bathroom remodeling, sewer line repair, leak detection. Licensed #PLB-2847. All work guaranteed 2 years. Free estimates on jobs over $200. Senior discount: 10%.",
        addedAt: "Jun 8, 2025 at 2:30 PM",
        wordCount: 189,
        aiSummary: "24/7 plumbing, Miami-Dade, emergency, prices listed, 2-year guarantee, senior discounts, licensed #PLB-2847.",
    },
    {
        id: 3,
        title: "Customer Testimonials Collection",
        category: "Testimonials",
        client: "Sakura Sushi Bar",
        content: "\u201cBest sushi in Miami! The omakase experience is worth every penny.\u201d - Jennifer L. \u2605\u2605\u2605\u2605\u2605\n\u201cChef Tanaka\u2019s attention to detail is incredible. The fish is always fresh.\u201d - David R. \u2605\u2605\u2605\u2605\u2605\n\u201cThe sake pairing menu is a hidden gem.\u201d - Sarah T. \u2605\u2605\u2605\u2605\u2605",
        addedAt: "Jun 6, 2025 at 5:15 PM",
        wordCount: 156,
        aiSummary: "5 testimonials, mostly 5-star. Themes: quality, freshness, value, special occasions.",
    },
    {
        id: 4,
        title: "Unique Selling Points & Differentiators",
        category: "USPs",
        client: "Pinnacle Auto Spa",
        content: "What makes Pinnacle Auto Spa different:\n1. Only ceramic coating specialist in South Beach\n2. Use Gtechniq Crystal Serum Ultra (10-year warranty)\n3. Climate-controlled detailing bay\n4. Pick-up/drop-off within 15 miles\n5. VIP membership: unlimited washes + quarterly detail $199/mo\n6. IDA certified",
        addedAt: "Jun 4, 2025 at 10:00 AM",
        wordCount: 127,
        aiSummary: "6 USPs: ceramic coating specialist, Gtechniq products, climate-controlled, VIP $199/mo, IDA certified.",
    },
    {
        id: 5,
        title: "FAQ - Common Customer Questions",
        category: "FAQs",
        client: "ClearVision Eye Clinic",
        content: "Q: Does LASIK hurt? A: No, we use numbing drops. Most feel slight pressure for 30 seconds.\nQ: Recovery? A: Most see clearly within 24 hours. Full healing 3-6 months.\nQ: Cost? A: LASIK starts at $2,199 per eye. 0% financing for 24 months.\nQ: Insurance? A: LASIK is elective, but we accept HSA/FSA and CareCredit.",
        addedAt: "Jun 3, 2025 at 3:00 PM",
        wordCount: 203,
        aiSummary: "5 FAQs: pain, recovery, candidacy, cost ($2,199/eye), financing. Good for search ad copy.",
    },
];

const crawledURLs: CrawledURL[] = [
    {
        id: 1,
        url: "https://www.clearvisionmiami.com",
        status: "crawled",
        pagesFound: 24,
        lastCrawled: "Jun 11, 2025 at 8:00 AM",
        contentExtracted: "24 pages crawled. Extracted: about page, 6 service pages, 12 doctor bios, pricing, FAQ, 2 blog posts. Total: 8,420 words indexed.",
        client: "ClearVision Eye Clinic",
    },
    {
        id: 2,
        url: "https://www.mikesplumbing305.com",
        status: "crawled",
        pagesFound: 11,
        lastCrawled: "Jun 10, 2025 at 3:00 PM",
        contentExtracted: "11 pages crawled. Extracted: homepage, 5 service pages, pricing, about, contact, 2 blog posts. Total: 4,230 words indexed.",
        client: "Mike\u2019s Plumbing",
    },
    {
        id: 3,
        url: "https://www.sakurasushibar.com",
        status: "crawling",
        pagesFound: 8,
        contentExtracted: "Crawling in progress... 8 of ~15 pages processed so far.",
        client: "Sakura Sushi Bar",
    },
    {
        id: 4,
        url: "https://www.pinnacleautospa.com",
        status: "queued",
        pagesFound: 0,
        contentExtracted: "Queued for crawling. Will start automatically.",
        client: "Pinnacle Auto Spa",
    },
    {
        id: 5,
        url: "https://www.bellafashionmiami.com",
        status: "crawled",
        pagesFound: 38,
        lastCrawled: "Jun 9, 2025 at 11:00 AM",
        contentExtracted: "38 pages crawled. Extracted: 28 product pages, collections, about, shipping, returns, 5 blog posts, size guide. Total: 12,680 words indexed.",
        client: "Bella Fashion Boutique",
    },
    {
        id: 6,
        url: "https://blog.clearvisionmiami.com",
        status: "failed",
        pagesFound: 0,
        lastCrawled: "Jun 11, 2025 at 8:05 AM",
        contentExtracted: "Error: SSL certificate issue. Please verify the URL and try again.",
        client: "ClearVision Eye Clinic",
    },
];

const brandProfile = {
    businessName: "ClearVision Eye Clinic",
    industry: "Healthcare / Ophthalmology",
    brandVoice: "Professional, compassionate, reassuring. Avoid overly clinical jargon. Speak to patients\u2019 fears and aspirations.",
    targetAudience: "Adults 25-55, Miami metro area, considering vision correction. Secondary: parents researching for young adults 18-22.",
    competitors: "LensCrafters, Bascom Palmer, Miami Eye Institute",
    uniqueSellingPoints: "15,000+ successful procedures, 98.7% satisfaction, Wavelight EX500 laser, 0% financing, free screenings",
    avoidTopics: "Never guarantee outcomes. Don\u2019t compare negatively to competitors by name. Don\u2019t use \u2018cheap\u2019 or \u2018discount\u2019. Always include medical disclaimer.",
    toneExamples: "Good: \u2018Imagine waking up and seeing clearly \u2014 no glasses, no contacts.\u2019 Bad: \u2018Our laser surgery procedure utilizes advanced excimer technology...\u2019",
};

// Helpers

const typeIcon = (type: AssetType) => {
    switch (type) {
        case "image": return <FileImage className="w-8 h-8 text-white/80" />;
        case "video": return <FileVideo className="w-8 h-8 text-white/80" />;
        case "document": return <FileText className="w-8 h-8 text-white/80" />;
        case "ad": return <Image className="w-8 h-8 text-white/80" />;
        default: return <File className="w-8 h-8 text-white/80" />;
    }
};

const typeBadge = (type: AssetType) => {
    const styles: Record<AssetType, string> = {
        image: "bg-green-100 text-green-700",
        video: "bg-purple-100 text-purple-700",
        ad: "bg-blue-100 text-blue-700",
        document: "bg-gray-100 text-gray-700",
        text: "bg-amber-100 text-amber-700",
    };
    const labels: Record<AssetType, string> = {
        image: "Image",
        video: "Video",
        ad: "Ad",
        document: "Doc",
        text: "Text",
    };
    return (
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[type]}`}>
            {labels[type]}
        </span>
    );
};

const statusBadge = (status: CrawlStatus) => {
    switch (status) {
        case "crawled":
            return <span className="flex items-center gap-1 text-xs text-green-600 font-medium"><CheckCircle2 className="w-3.5 h-3.5" /> Crawled</span>;
        case "crawling":
            return <span className="flex items-center gap-1 text-xs text-blue-600 font-medium"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Crawling...</span>;
        case "queued":
            return <span className="flex items-center gap-1 text-xs text-amber-600 font-medium"><Clock className="w-3.5 h-3.5" /> Queued</span>;
        case "failed":
            return <span className="flex items-center gap-1 text-xs text-red-600 font-medium"><AlertCircle className="w-3.5 h-3.5" /> Failed</span>;
    }
};

// Component

export default function KnowledgeBasePage() {
    const { activeBusiness } = useBusiness();
    const [activeTab, setActiveTab] = useState<TabId>("assets");
    const [selectedAsset, setSelectedAsset] = useState<number | null>(null);
    const [selectedText, setSelectedText] = useState<number | null>(null);
    const [noteInput, setNoteInput] = useState("");
    const [urlInput, setUrlInput] = useState("");
    const [textTitle, setTextTitle] = useState("");
    const [textCategory, setTextCategory] = useState("About Us");
    const [textContent, setTextContent] = useState("");
    const [textClient, setTextClient] = useState("ClearVision Eye Clinic");
    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState<AssetType | "all">("all");

    const selected = assets.find((item) => item.id === selectedAsset);
    const selectedTextEntry = textEntries.find((item) => item.id === selectedText);

    const filteredAssets = assets.filter((a) => {
        if (filterType !== "all" && a.type !== filterType) return false;
        if (searchQuery && !a.name.toLowerCase().includes(searchQuery.toLowerCase()) && !a.client.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    const tabs: { id: TabId; label: string; icon: React.ReactNode; count: number }[] = [
        { id: "assets", label: "Files & Media", icon: <Upload className="w-4 h-4" />, count: assets.length },
        { id: "text", label: "Text Content", icon: <Type className="w-4 h-4" />, count: textEntries.length },
        { id: "urls", label: "Website URLs", icon: <Globe className="w-4 h-4" />, count: crawledURLs.length },
        { id: "brand", label: "Brand Profile", icon: <Building2 className="w-4 h-4" />, count: 0 },
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Brain className="w-6 h-6 text-primary" />
                        Knowledge Base
                        <Tooltip text="Everything you add here teaches the AI about your business. The more context you provide, the more accurate your AI-generated ads will be. No hallucinations!" />
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                        <div className={`w-5 h-5 rounded bg-gradient-to-br ${activeBusiness.color} flex items-center justify-center text-white text-[8px] font-bold`}>
                            {activeBusiness.initials}
                        </div>
                        <p className="text-muted text-sm">
                            <span className="font-medium text-foreground">{activeBusiness.name}</span>
                            <span className="mx-1.5">&bull;</span>
                            {activeBusiness.industry}
                            <span className="mx-1.5">&bull;</span>
                            <span className={activeBusiness.kbStatus === "trained" ? "text-green-600" : activeBusiness.kbStatus === "training" ? "text-amber-600" : "text-gray-400"}>
                                {activeBusiness.kbStatus === "trained" ? "KB Trained \u2705" : activeBusiness.kbStatus === "training" ? "Training\u2026" : "Not yet trained"}
                            </span>
                        </p>
                    </div>
                </div>
            </div>

            {/* AI Training Status */}
            <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border border-primary/20 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary/10 rounded-lg p-2">
                            <Sparkles className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <div className="text-sm font-semibold flex items-center gap-2">
                                AI Knowledge Status
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Trained</span>
                            </div>
                            <div className="text-xs text-muted mt-0.5">
                                {assets.length} files &bull; {textEntries.reduce((sum, t) => sum + t.wordCount, 0).toLocaleString()} words indexed &bull; {crawledURLs.filter(u => u.status === "crawled").reduce((sum, u) => sum + u.pagesFound, 0)} web pages crawled
                            </div>
                        </div>
                    </div>
                    <button className="text-xs bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary-dark transition flex items-center gap-1.5">
                        <RefreshCw className="w-3 h-3" />
                        Retrain AI
                    </button>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-card border border-border rounded-xl p-3 text-center">
                    <div className="text-lg font-bold">{assets.length + textEntries.length}</div>
                    <div className="text-xs text-muted">Total Assets</div>
                </div>
                <div className="bg-card border border-border rounded-xl p-3 text-center">
                    <div className="text-lg font-bold">{assets.filter(a => a.type === "image" || a.type === "ad").length}</div>
                    <div className="text-xs text-muted">Images & Ads</div>
                </div>
                <div className="bg-card border border-border rounded-xl p-3 text-center">
                    <div className="text-lg font-bold">{assets.filter(a => a.type === "video").length}</div>
                    <div className="text-xs text-muted">Videos</div>
                </div>
                <div className="bg-card border border-border rounded-xl p-3 text-center">
                    <div className="text-lg font-bold">{assets.filter(a => a.type === "document").length}</div>
                    <div className="text-xs text-muted">Documents</div>
                </div>
                <div className="bg-card border border-border rounded-xl p-3 text-center">
                    <div className="text-lg font-bold">{crawledURLs.filter(u => u.status === "crawled").reduce((sum, u) => sum + u.pagesFound, 0)}</div>
                    <div className="text-xs text-muted">Pages Crawled</div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-1 bg-sidebar border border-border rounded-xl p-1">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                            activeTab === tab.id
                                ? "bg-card text-foreground shadow-sm"
                                : "text-muted hover:text-foreground"
                        }`}
                    >
                        {tab.icon}
                        {tab.label}
                        {tab.count > 0 && (
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                                activeTab === tab.id ? "bg-primary/10 text-primary" : "bg-border text-muted"
                            }`}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* TAB: FILES & MEDIA */}
            {activeTab === "assets" && (
                <div className="space-y-5">
                    {/* Upload Zone */}
                    <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition cursor-pointer bg-card">
                        <Upload className="w-8 h-8 text-muted mx-auto mb-3" />
                        <div className="text-sm font-medium mb-1">Drag &amp; drop files here, or click to browse</div>
                        <div className="text-xs text-muted mb-3">
                            Images: JPG, PNG, GIF, WebP, SVG &bull; Videos: MP4, MOV, AVI, WebM &bull; Documents: PDF, DOCX, XLSX, PPTX, TXT &bull; Max 100MB per file
                        </div>
                        <div className="flex items-center justify-center gap-4 text-xs text-muted flex-wrap">
                            <span className="flex items-center gap-1"><Scan className="w-3 h-3" /> AI auto-analyzes content</span>
                            <span className="flex items-center gap-1"><User className="w-3 h-3" /> Face detection</span>
                            <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> Text extraction (OCR)</span>
                            <span className="flex items-center gap-1"><Video className="w-3 h-3" /> Video scene analysis</span>
                            <span className="flex items-center gap-1"><Maximize2 className="w-3 h-3" /> Auto-sizing</span>
                        </div>
                    </div>

                    {/* Search & Filter */}
                    <div className="flex gap-3">
                        <div className="flex-1 relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                            <input type="text" placeholder="Search assets by name or client..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-card border border-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary transition" />
                        </div>
                        <div className="relative">
                            <select value={filterType} onChange={(e) => setFilterType(e.target.value as AssetType | "all")} className="appearance-none bg-card border border-border rounded-lg pl-3 pr-8 py-2 text-sm focus:outline-none focus:border-primary transition cursor-pointer">
                                <option value="all">All Types</option>
                                <option value="image">Images</option>
                                <option value="video">Videos</option>
                                <option value="ad">Ads</option>
                                <option value="document">Documents</option>
                            </select>
                            <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Items List */}
                        <div className="lg:col-span-2 space-y-3">
                            {filteredAssets.map((item) => (
                                <div key={item.id} onClick={() => setSelectedAsset(item.id)} className={`bg-card border rounded-xl p-4 cursor-pointer transition hover:border-primary/50 ${selectedAsset === item.id ? "border-primary ring-1 ring-primary/20" : "border-border"}`}>
                                    <div className="flex gap-4">
                                        <div className={`w-20 h-20 rounded-lg bg-gradient-to-br ${item.previewBg} flex items-center justify-center shrink-0 relative`}>
                                            {typeIcon(item.type)}
                                            {item.duration && <span className="absolute bottom-1 right-1 text-[10px] bg-black/70 text-white px-1 rounded">{item.duration}</span>}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <div className="font-medium text-sm">{item.name}</div>
                                                    <div className="text-xs text-muted mt-0.5">{item.client}</div>
                                                </div>
                                                {typeBadge(item.type)}
                                            </div>
                                            <div className="flex items-center gap-3 mt-2 text-xs text-muted">
                                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{item.uploadedAt}</span>
                                                <span>{item.fileSize}</span>
                                                {item.dimensions && <span>{item.dimensions}</span>}
                                                {item.duration && <span>{item.duration}</span>}
                                            </div>
                                            <div className="flex items-center gap-2 mt-2">
                                                {item.aiAnalysis.faceDetected && <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">&#128100; Face</span>}
                                                {item.aiAnalysis.format && <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{item.aiAnalysis.format}</span>}
                                                {item.aiAnalysis.videoNotes && <span className="text-xs bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded">&#127909; Scenes analyzed</span>}
                                                {item.aiAnalysis.dominantColors && (
                                                    <div className="flex items-center gap-0.5">
                                                        {item.aiAnalysis.dominantColors.slice(0, 3).map((color, i) => (
                                                            <div key={i} className="w-3 h-3 rounded-full border border-white shadow-sm" style={{ backgroundColor: color }} />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            {item.notes && <div className="mt-2 text-xs text-muted truncate"><MessageSquare className="w-3 h-3 inline mr-1" />{item.notes}</div>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {filteredAssets.length === 0 && <div className="text-center text-sm text-muted py-12">No assets match your search.</div>}
                        </div>

                        {/* Detail Panel */}
                        <div className="lg:col-span-1">
                            {selected ? (
                                <div className="bg-card border border-border rounded-xl sticky top-4">
                                    <div className={`h-40 rounded-t-xl bg-gradient-to-br ${selected.previewBg} flex items-center justify-center relative`}>
                                        {typeIcon(selected.type)}
                                        {selected.duration && <span className="absolute bottom-2 right-2 text-xs bg-black/70 text-white px-2 py-0.5 rounded">{selected.duration}</span>}
                                    </div>
                                    <div className="p-4 space-y-4">
                                        <div>
                                            <h3 className="font-semibold text-sm">{selected.name}</h3>
                                            <div className="text-xs text-muted mt-0.5">{selected.client}</div>
                                        </div>
                                        <div className="space-y-1.5 text-xs">
                                            <div className="flex justify-between"><span className="text-muted">Format</span><span className="font-medium">{selected.aiAnalysis.format}</span></div>
                                            {selected.aiAnalysis.dimensions && <div className="flex justify-between"><span className="text-muted">Dimensions</span><span className="font-medium">{selected.aiAnalysis.dimensions}</span></div>}
                                            <div className="flex justify-between"><span className="text-muted">File Size</span><span className="font-medium">{selected.fileSize}</span></div>
                                            <div className="flex justify-between"><span className="text-muted">Uploaded</span><span className="font-medium">{selected.uploadedAt}</span></div>
                                            {selected.aiAnalysis.faceDetected !== undefined && (
                                                <div className="flex justify-between">
                                                    <span className="text-muted">Face Detected</span>
                                                    <span className={`font-medium ${selected.aiAnalysis.faceDetected ? "text-blue-600" : "text-muted"}`}>{selected.aiAnalysis.faceDetected ? "Yes" : "No"}</span>
                                                </div>
                                            )}
                                        </div>
                                        {(selected.aiAnalysis.layoutNotes || selected.aiAnalysis.videoNotes) && (
                                            <div className="bg-primary/5 border border-primary/10 rounded-lg p-3">
                                                <div className="text-xs font-medium text-primary mb-1 flex items-center gap-1"><Scan className="w-3 h-3" />AI Analysis</div>
                                                <p className="text-xs text-muted leading-relaxed">{selected.aiAnalysis.videoNotes || selected.aiAnalysis.layoutNotes}</p>
                                            </div>
                                        )}
                                        {selected.aiAnalysis.textContent && (
                                            <div className="bg-gray-50 rounded-lg p-3">
                                                <div className="text-xs font-medium mb-1">Detected Text (OCR)</div>
                                                <p className="text-xs text-muted">{selected.aiAnalysis.textContent}</p>
                                            </div>
                                        )}
                                        {selected.aiAnalysis.dominantColors && (
                                            <div>
                                                <div className="text-xs font-medium mb-1.5">Dominant Colors</div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    {selected.aiAnalysis.dominantColors.map((color, i) => (
                                                        <div key={i} className="flex items-center gap-1">
                                                            <div className="w-5 h-5 rounded border border-border" style={{ backgroundColor: color }} />
                                                            <span className="text-xs text-muted">{color}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        <div>
                                            <div className="text-xs font-medium mb-1.5 flex items-center gap-1">
                                                <MessageSquare className="w-3 h-3" />
                                                Notes &amp; Instructions for AI
                                                <Tooltip text="Tell the AI how to use this asset: target audience, brand tone, context." position="bottom" />
                                            </div>
                                            <div className="bg-sidebar border border-border rounded-lg p-3 text-xs leading-relaxed mb-2">{selected.notes}</div>
                                            <div className="flex gap-2">
                                                <input type="text" value={noteInput} onChange={(e) => setNoteInput(e.target.value)} placeholder="Add a note for the AI..." className="flex-1 bg-card border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-primary transition" />
                                                <button className="bg-primary text-white text-xs px-3 py-2 rounded-lg hover:bg-primary-dark transition">Add</button>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 pt-2 border-t border-border">
                                            <button className="flex-1 text-xs border border-border rounded-lg px-3 py-2 hover:border-primary transition flex items-center justify-center gap-1.5"><Eye className="w-3 h-3" /> Preview</button>
                                            <button className="flex-1 text-xs border border-border rounded-lg px-3 py-2 hover:border-primary transition flex items-center justify-center gap-1.5"><Download className="w-3 h-3" /> Download</button>
                                            <button className="text-xs border border-border rounded-lg px-3 py-2 hover:border-danger text-muted hover:text-danger transition flex items-center justify-center gap-1.5"><Trash2 className="w-3 h-3" /></button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-card border border-border rounded-xl p-8 text-center">
                                    <BookOpen className="w-8 h-8 text-muted mx-auto mb-3" />
                                    <div className="text-sm font-medium mb-1">Select an asset</div>
                                    <div className="text-xs text-muted">Click any item to see AI analysis, detected faces, text extraction, and add notes.</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: TEXT CONTENT */}
            {activeTab === "text" && (
                <div className="space-y-5">
                    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                        <div className="flex items-center gap-2">
                            <Type className="w-4 h-4 text-primary" />
                            <h3 className="text-sm font-semibold">Add Text Content</h3>
                            <Tooltip text="Paste any text about your business: about us, services, pricing, FAQs, testimonials, product descriptions, anything! The AI will learn from it." />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <input type="text" placeholder="Title (e.g., 'About Our Company')" value={textTitle} onChange={(e) => setTextTitle(e.target.value)} className="bg-sidebar border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition" />
                            <select value={textCategory} onChange={(e) => setTextCategory(e.target.value)} className="bg-sidebar border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition cursor-pointer">
                                <option>About Us</option>
                                <option>Services</option>
                                <option>Products</option>
                                <option>Pricing</option>
                                <option>FAQs</option>
                                <option>Testimonials</option>
                                <option>USPs / Differentiators</option>
                                <option>Promotions / Offers</option>
                                <option>Company Policies</option>
                                <option>Industry Knowledge</option>
                                <option>Competitor Notes</option>
                                <option>Email Templates</option>
                                <option>Social Media Posts</option>
                                <option>Blog Content</option>
                                <option>Press Releases</option>
                                <option>Other</option>
                            </select>
                            <select value={textClient} onChange={(e) => setTextClient(e.target.value)} className="bg-sidebar border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition cursor-pointer">
                                <option>ClearVision Eye Clinic</option>
                                <option>Bella Fashion Boutique</option>
                                <option>Mike&#39;s Plumbing</option>
                                <option>Sakura Sushi Bar</option>
                                <option>Pinnacle Auto Spa</option>
                            </select>
                        </div>
                        <textarea placeholder="Paste your text content here... About your business, services, pricing, FAQs, testimonials, product info, anything the AI should know to create accurate ads." value={textContent} onChange={(e) => setTextContent(e.target.value)} rows={6} className="w-full bg-sidebar border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary transition resize-y leading-relaxed" />
                        <div className="flex items-center justify-between">
                            <div className="text-xs text-muted">{textContent.split(/\s+/).filter(Boolean).length} words</div>
                            <button className="bg-primary text-white text-sm px-4 py-2 rounded-lg hover:bg-primary-dark transition flex items-center gap-2"><Plus className="w-4 h-4" />Add to Knowledge Base</button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-3">
                            <div className="text-sm font-medium text-muted flex items-center gap-2">Saved Text Content <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{textEntries.length}</span></div>
                            {textEntries.map((entry) => (
                                <div key={entry.id} onClick={() => setSelectedText(entry.id)} className={`bg-card border rounded-xl p-4 cursor-pointer transition hover:border-primary/50 ${selectedText === entry.id ? "border-primary ring-1 ring-primary/20" : "border-border"}`}>
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-medium text-sm">{entry.title}</span>
                                                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{entry.category}</span>
                                            </div>
                                            <div className="text-xs text-muted mb-2">{entry.client}</div>
                                            <p className="text-xs text-muted leading-relaxed line-clamp-2">{entry.content}</p>
                                            <div className="flex items-center gap-3 mt-2 text-xs text-muted">
                                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{entry.addedAt}</span>
                                                <span>{entry.wordCount} words</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="lg:col-span-1">
                            {selectedTextEntry ? (
                                <div className="bg-card border border-border rounded-xl p-4 sticky top-4 space-y-4">
                                    <div>
                                        <h3 className="font-semibold text-sm">{selectedTextEntry.title}</h3>
                                        <div className="flex items-center gap-2 text-xs text-muted mt-0.5">
                                            <span>{selectedTextEntry.client}</span><span>&bull;</span><span>{selectedTextEntry.wordCount} words</span>
                                        </div>
                                    </div>
                                    <div className="bg-primary/5 border border-primary/10 rounded-lg p-3">
                                        <div className="text-xs font-medium text-primary mb-1 flex items-center gap-1"><Sparkles className="w-3 h-3" />AI Summary</div>
                                        <p className="text-xs text-muted leading-relaxed">{selectedTextEntry.aiSummary}</p>
                                    </div>
                                    <div>
                                        <div className="text-xs font-medium mb-1.5">Full Content</div>
                                        <div className="bg-sidebar border border-border rounded-lg p-3 text-xs leading-relaxed max-h-48 overflow-y-auto">{selectedTextEntry.content}</div>
                                    </div>
                                    <div className="flex gap-2 pt-2 border-t border-border">
                                        <button className="flex-1 text-xs border border-border rounded-lg px-3 py-2 hover:border-primary transition flex items-center justify-center gap-1.5"><Edit3 className="w-3 h-3" /> Edit</button>
                                        <button className="flex-1 text-xs border border-border rounded-lg px-3 py-2 hover:border-primary transition flex items-center justify-center gap-1.5"><Copy className="w-3 h-3" /> Copy</button>
                                        <button className="text-xs border border-border rounded-lg px-3 py-2 hover:border-danger text-muted hover:text-danger transition flex items-center justify-center gap-1.5"><Trash2 className="w-3 h-3" /></button>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-card border border-border rounded-xl p-8 text-center">
                                    <Type className="w-8 h-8 text-muted mx-auto mb-3" />
                                    <div className="text-sm font-medium mb-1">Select a text entry</div>
                                    <div className="text-xs text-muted">Click any entry to see the full content and AI summary.</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: WEBSITE URLs */}
            {activeTab === "urls" && (
                <div className="space-y-5">
                    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                        <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-primary" />
                            <h3 className="text-sm font-semibold">Add Website URL</h3>
                            <Tooltip text="Enter your website URL and the AI will crawl it to learn about your business. It uses this to write accurate, factual ad copy instead of guessing." />
                        </div>
                        <p className="text-xs text-muted -mt-1">
                            Enter your website address and the AI will automatically crawl all pages to learn about your business. This is the fastest way to teach the AI everything it needs to know.
                        </p>
                        <div className="flex gap-3">
                            <div className="flex-1 relative">
                                <Globe className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                                <input type="url" placeholder="https://www.yourbusiness.com" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} className="w-full bg-sidebar border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary transition" />
                            </div>
                            <select className="bg-sidebar border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary transition cursor-pointer">
                                <option>ClearVision Eye Clinic</option>
                                <option>Bella Fashion Boutique</option>
                                <option>Mike&#39;s Plumbing</option>
                                <option>Sakura Sushi Bar</option>
                                <option>Pinnacle Auto Spa</option>
                            </select>
                            <button className="bg-primary text-white text-sm px-5 py-2.5 rounded-lg hover:bg-primary-dark transition flex items-center gap-2 whitespace-nowrap"><Plus className="w-4 h-4" />Crawl Website</button>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted pt-1 border-t border-border flex-wrap">
                            <label className="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" defaultChecked className="rounded border-border text-primary focus:ring-primary" />Follow internal links</label>
                            <label className="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" defaultChecked className="rounded border-border text-primary focus:ring-primary" />Auto-detect sitemap</label>
                            <label className="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" className="rounded border-border text-primary focus:ring-primary" />Include blog posts</label>
                            <label className="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" className="rounded border-border text-primary focus:ring-primary" />Crawl subdomains</label>
                            <div className="ml-auto flex items-center gap-1.5">
                                <span>Max pages:</span>
                                <select className="bg-sidebar border border-border rounded px-2 py-0.5 text-xs focus:outline-none focus:border-primary cursor-pointer">
                                    <option>25</option><option>50</option><option>100</option><option>250</option><option>All</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="text-sm font-medium text-muted flex items-center gap-2">Crawled Websites <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{crawledURLs.length}</span></div>
                        {crawledURLs.map((url) => (
                            <div key={url.id} className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Globe className="w-4 h-4 text-muted shrink-0" />
                                            <a href={url.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline truncate flex items-center gap-1">{url.url}<ExternalLink className="w-3 h-3 shrink-0" /></a>
                                        </div>
                                        <div className="text-xs text-muted mb-2 ml-6">{url.client}</div>
                                        <div className="ml-6 text-xs text-muted leading-relaxed bg-sidebar rounded-lg p-3">{url.contentExtracted}</div>
                                        <div className="flex items-center gap-3 mt-2 ml-6 text-xs text-muted">
                                            {url.lastCrawled && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{url.lastCrawled}</span>}
                                            {url.pagesFound > 0 && <span>{url.pagesFound} pages found</span>}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2 shrink-0">
                                        {statusBadge(url.status)}
                                        <div className="flex gap-1.5">
                                            {url.status === "crawled" && <button className="text-xs border border-border rounded-lg px-2.5 py-1.5 hover:border-primary transition flex items-center gap-1 text-muted hover:text-foreground"><RefreshCw className="w-3 h-3" /> Re-crawl</button>}
                                            {url.status === "failed" && <button className="text-xs border border-border rounded-lg px-2.5 py-1.5 hover:border-primary transition flex items-center gap-1 text-muted hover:text-foreground"><RefreshCw className="w-3 h-3" /> Retry</button>}
                                            <button className="text-xs border border-border rounded-lg px-2 py-1.5 hover:border-danger text-muted hover:text-danger transition"><Trash2 className="w-3 h-3" /></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <div className="flex gap-3">
                            <Shield className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                            <div>
                                <div className="text-sm font-medium text-blue-900 mb-1">How Website Crawling Works</div>
                                <ul className="text-xs text-blue-700 space-y-1 leading-relaxed">
                                    <li>&bull; The AI reads all text from your website pages &mdash; services, about, FAQs, pricing, team bios, etc.</li>
                                    <li>&bull; Content is securely stored and only used to generate your ads.</li>
                                    <li>&bull; Re-crawl anytime after updating your website to keep the AI in sync.</li>
                                    <li>&bull; The AI automatically detects your sitemap.xml for comprehensive coverage.</li>
                                    <li>&bull; For best results, make sure your website has up-to-date content.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: BRAND PROFILE */}
            {activeTab === "brand" && (
                <div className="space-y-5">
                    <div className="bg-card border border-border rounded-xl p-5 space-y-5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-primary" />
                                <h3 className="text-sm font-semibold">Brand Profile</h3>
                                <Tooltip text="Define your brand voice, target audience, and guardrails. This ensures the AI always writes on-brand." />
                            </div>
                            <button className="text-xs bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary-dark transition">Save Changes</button>
                        </div>
                        <p className="text-xs text-muted -mt-2">This profile guides the AI&#39;s tone, language, and accuracy. The more detail you provide, the better your ads will sound.</p>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            <div>
                                <label className="text-xs font-medium mb-1.5 flex items-center gap-1"><Building2 className="w-3 h-3 text-muted" />Business Name</label>
                                <input type="text" defaultValue={brandProfile.businessName} className="w-full bg-sidebar border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary transition" />
                            </div>
                            <div>
                                <label className="text-xs font-medium mb-1.5 flex items-center gap-1"><Tag className="w-3 h-3 text-muted" />Industry</label>
                                <input type="text" defaultValue={brandProfile.industry} className="w-full bg-sidebar border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary transition" />
                            </div>
                            <div className="lg:col-span-2">
                                <label className="text-xs font-medium mb-1.5 flex items-center gap-1"><Target className="w-3 h-3 text-muted" />Target Audience <Tooltip text="Who are your ideal customers? Include age, location, interests, and pain points." position="right" /></label>
                                <textarea defaultValue={brandProfile.targetAudience} rows={2} className="w-full bg-sidebar border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary transition resize-y leading-relaxed" />
                            </div>
                            <div className="lg:col-span-2">
                                <label className="text-xs font-medium mb-1.5 flex items-center gap-1"><Megaphone className="w-3 h-3 text-muted" />Brand Voice &amp; Tone <Tooltip text="How should your brand sound? Professional, casual, luxury, friendly? The AI matches this." position="right" /></label>
                                <textarea defaultValue={brandProfile.brandVoice} rows={3} className="w-full bg-sidebar border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary transition resize-y leading-relaxed" />
                            </div>
                            <div className="lg:col-span-2">
                                <label className="text-xs font-medium mb-1.5 flex items-center gap-1"><MessageSquare className="w-3 h-3 text-muted" />Tone Examples (Good vs Bad) <Tooltip text="Show the AI what good and bad copy looks like for your brand." position="right" /></label>
                                <textarea defaultValue={brandProfile.toneExamples} rows={3} className="w-full bg-sidebar border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary transition resize-y leading-relaxed" />
                            </div>
                            <div className="lg:col-span-2">
                                <label className="text-xs font-medium mb-1.5 flex items-center gap-1"><Star className="w-3 h-3 text-muted" />Unique Selling Points <Tooltip text="What makes you different from competitors? These get highlighted in AI-generated ads." position="right" /></label>
                                <textarea defaultValue={brandProfile.uniqueSellingPoints} rows={2} className="w-full bg-sidebar border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary transition resize-y leading-relaxed" />
                            </div>
                            <div>
                                <label className="text-xs font-medium mb-1.5 flex items-center gap-1"><Users className="w-3 h-3 text-muted" />Known Competitors</label>
                                <input type="text" defaultValue={brandProfile.competitors} className="w-full bg-sidebar border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary transition" placeholder="Comma-separated names" />
                            </div>
                            <div>
                                <label className="text-xs font-medium mb-1.5 flex items-center gap-1"><Shield className="w-3 h-3 text-muted" />Topics to Avoid</label>
                                <input type="text" defaultValue={brandProfile.avoidTopics} className="w-full bg-sidebar border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary transition" placeholder="Things the AI should never say" />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-medium mb-1.5 flex items-center gap-1"><Shield className="w-3 h-3 text-danger" />Detailed Guardrails &amp; Things AI Must Never Say <Tooltip text="Critical safety rules. List anything the AI should never claim, promise, or mention." position="right" /></label>
                            <textarea defaultValue={brandProfile.avoidTopics} rows={3} className="w-full bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-red-400 transition resize-y leading-relaxed" />
                        </div>
                    </div>

                    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-primary" />
                            <h3 className="text-sm font-semibold">AI Brand Understanding</h3>
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Analyzed</span>
                        </div>
                        <p className="text-xs text-muted">Based on your brand profile, uploaded content, and crawled website, here&#39;s what the AI understands:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="bg-sidebar border border-border rounded-lg p-3">
                                <div className="text-xs font-medium mb-1">Key Messages the AI Will Use</div>
                                <ul className="text-xs text-muted space-y-1">
                                    <li>&bull; &ldquo;Over 15,000 successful procedures&rdquo;</li>
                                    <li>&bull; &ldquo;98.7% patient satisfaction rate&rdquo;</li>
                                    <li>&bull; &ldquo;Free vision screening available&rdquo;</li>
                                    <li>&bull; &ldquo;0% financing for 24 months&rdquo;</li>
                                    <li>&bull; &ldquo;Board-certified ophthalmologist&rdquo;</li>
                                </ul>
                            </div>
                            <div className="bg-sidebar border border-border rounded-lg p-3">
                                <div className="text-xs font-medium mb-1">Emotional Triggers Identified</div>
                                <ul className="text-xs text-muted space-y-1">
                                    <li>&bull; Freedom from glasses/contacts</li>
                                    <li>&bull; Fear of surgery &rarr; reassurance</li>
                                    <li>&bull; Life-changing transformation</li>
                                    <li>&bull; Trusted expertise / proven results</li>
                                    <li>&bull; Affordability / financing options</li>
                                </ul>
                            </div>
                            <div className="bg-sidebar border border-border rounded-lg p-3">
                                <div className="text-xs font-medium mb-1">Services the AI Knows About</div>
                                <ul className="text-xs text-muted space-y-1">
                                    <li>&bull; LASIK ($2,199/eye)</li>
                                    <li>&bull; PRK (pricing on consultation)</li>
                                    <li>&bull; Cataract Surgery</li>
                                    <li>&bull; Free Vision Screening</li>
                                    <li>&bull; Follow-up Care Included</li>
                                </ul>
                            </div>
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                <div className="text-xs font-medium mb-1 text-red-700">Guardrails Active</div>
                                <ul className="text-xs text-red-600 space-y-1">
                                    <li>&bull; Will NOT guarantee surgical outcomes</li>
                                    <li>&bull; Will NOT bash competitors by name</li>
                                    <li>&bull; Will NOT use words: &ldquo;cheap&rdquo;, &ldquo;discount&rdquo;</li>
                                    <li>&bull; Will include medical disclaimers</li>
                                    <li>&bull; Will use &ldquo;affordable&rdquo; instead of &ldquo;cheap&rdquo;</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
