"use client";

import {
    Upload,
    Image as ImageIcon,
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
    Mic,
    X,
    Check,
} from "lucide-react";
import { useState, useRef, useCallback, useEffect } from "react";
import Tooltip from "@/components/Tooltip";
import { useBusiness } from "@/lib/business-context";
import { authFetch } from "@/lib/auth-client";
import { useTranslation } from "@/i18n/context";

// ─── Types ────────────────────────────────────────────────────────────────────

type AssetType = "image" | "document" | "ad" | "video" | "text";
type TabId = "assets" | "text" | "urls" | "brand";
type CrawlStatus = "crawled" | "crawling" | "queued" | "failed";

interface KBAsset {
    id: number;
    kbId?: string; // original KB item ID for API calls
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
        transcript?: string;
    };
}

interface TextEntry {
    id: number;
    kbId?: string; // original KB item ID for API calls
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

// ─── Industries Master List ──────────────────────────────────────────────────

const INDUSTRIES = [
    "Accounting / Tax Services",
    "Advertising / Marketing",
    "Agriculture / Farming",
    "Airlines / Aviation",
    "Apparel / Fashion",
    "Architecture / Design",
    "Arts / Entertainment",
    "Automotive / Dealership",
    "Automotive / Detailing",
    "Automotive / Repair & Service",
    "Banking / Financial Services",
    "Beauty / Cosmetics",
    "Biotechnology / Pharmaceuticals",
    "Cannabis / Dispensary",
    "Catering / Event Planning",
    "Childcare / Daycare",
    "Cleaning Services / Janitorial",
    "Construction / Contracting",
    "Consulting / Management",
    "Cryptocurrency / Blockchain",
    "Dating / Matchmaking",
    "Dental / Orthodontics",
    "E-commerce / Online Retail",
    "Education / Tutoring",
    "Electrical Services",
    "Energy / Solar / Utilities",
    "Engineering / Technical Services",
    "Entertainment / Media / Film",
    "Environmental Services",
    "Event Management / Venues",
    "Fitness / Gym / Personal Training",
    "Food & Beverage / Restaurant",
    "Funeral Services / Memorial",
    "Furniture / Home Decor",
    "Gaming / Esports",
    "Government / Public Sector",
    "Grocery / Supermarket",
    "Health & Wellness / Spa",
    "Healthcare / Chiropractic",
    "Healthcare / Dermatology",
    "Healthcare / General Practice",
    "Healthcare / Mental Health",
    "Healthcare / Ophthalmology",
    "Healthcare / Pediatrics",
    "Healthcare / Plastic Surgery",
    "Healthcare / Veterinary",
    "HVAC / Heating & Cooling",
    "Home Services / General",
    "Home Services / Landscaping",
    "Home Services / Pest Control",
    "Home Services / Plumbing",
    "Home Services / Roofing",
    "Hospitality / Hotels",
    "Human Resources / Staffing",
    "Import / Export / Trade",
    "Information Technology / Software",
    "Insurance / Brokerage",
    "Interior Design / Staging",
    "Investment / Wealth Management",
    "Jewelry / Watches",
    "Landscaping / Lawn Care",
    "Legal / Law Firm",
    "Logistics / Shipping / Freight",
    "Manufacturing / Industrial",
    "Marine / Boating",
    "Medical Devices / Equipment",
    "Mobile Apps / SaaS",
    "Mortgage / Lending",
    "Moving / Relocation Services",
    "Music / Recording / Production",
    "Nonprofit / Charity",
    "Nutrition / Dietetics",
    "Oil & Gas / Petroleum",
    "Optical / Eyewear",
    "Painting / Wall Covering",
    "Pet Care / Grooming",
    "Photography / Videography",
    "Physical Therapy / Rehabilitation",
    "Plumbing / Piping",
    "Printing / Signage",
    "Property Management",
    "Real Estate / Commercial",
    "Real Estate / Residential",
    "Religion / Faith-Based",
    "Restaurant / Bar / Nightlife",
    "Restaurant / Cafe / Coffee",
    "Restaurant / Fast Food",
    "Restaurant / Fine Dining",
    "Restaurant / Japanese Cuisine",
    "Retail / Boutique",
    "Retail / Electronics",
    "Retail / Fashion",
    "Retail / General",
    "Security / Alarm Systems",
    "Senior Care / Assisted Living",
    "Social Media / Influencer",
    "Sports / Recreation",
    "Storage / Warehousing",
    "Supplements / Vitamins",
    "Tattoo / Body Art",
    "Telecommunications",
    "Tourism / Travel Agency",
    "Transportation / Rideshare",
    "Trucking / CDL",
    "Tutoring / Test Prep",
    "Waste Management / Recycling",
    "Web Development / Digital Agency",
    "Wedding / Bridal Services",
    "Weight Loss / Diet Programs",
    "Wholesale / Distribution",
    "Other",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────


const typeIcon = (type: AssetType) => {
    switch (type) {
        case "image": return <FileImage className="w-8 h-8 text-white/80" />;
        case "video": return <FileVideo className="w-8 h-8 text-white/80" />;
        case "document": return <FileText className="w-8 h-8 text-white/80" />;
        case "ad": return <ImageIcon className="w-8 h-8 text-white/80" />;
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

// ─── Searchable Industry Dropdown ────────────────────────────────────────────

function IndustryDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const ref = useRef<HTMLDivElement>(null);

    const filtered = INDUSTRIES.filter((ind) =>
        ind.toLowerCase().includes(search.toLowerCase())
    );

    // Close on outside click
    const handleBlur = useCallback(() => {
        setTimeout(() => {
            if (ref.current && !ref.current.contains(document.activeElement)) {
                setOpen(false);
            }
        }, 150);
    }, []);

    return (
        <div ref={ref} className="relative" onBlur={handleBlur}>
            <button
                type="button"
                onClick={() => { setOpen(!open); setSearch(""); }}
                className="w-full bg-sidebar border border-border rounded-lg px-3 py-2.5 text-sm text-left focus:outline-none focus:border-primary transition flex items-center justify-between"
            >
                <span className={value ? "text-foreground" : "text-muted"}>{value || "Select industry..."}</span>
                <ChevronDown className={`w-4 h-4 text-muted transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
            {open && (
                <div className="absolute z-50 mt-1 w-full bg-card border border-border rounded-xl shadow-xl max-h-72 flex flex-col overflow-hidden">
                    <div className="p-2 border-b border-border">
                        <div className="relative">
                            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
                            <input
                                type="text"
                                autoFocus
                                placeholder="Search industries..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-sidebar border border-border rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:border-primary transition"
                            />
                        </div>
                    </div>
                    <div className="overflow-y-auto flex-1">
                        {filtered.length === 0 ? (
                            <div className="p-3 text-xs text-muted text-center">No industries match &ldquo;{search}&rdquo;</div>
                        ) : (
                            filtered.map((ind) => (
                                <button
                                    key={ind}
                                    onClick={() => { onChange(ind); setOpen(false); setSearch(""); }}
                                    className={`w-full text-left px-3 py-2 text-sm hover:bg-primary/5 transition flex items-center justify-between ${value === ind ? "bg-primary/10 text-primary font-medium" : "text-foreground"
                                        }`}
                                >
                                    <span>{ind}</span>
                                    {value === ind && <Check className="w-3.5 h-3.5 text-primary" />}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Quick Actions ──────────────────────────────────────────────────────────

// Helper: convert string ID to numeric for existing KBAsset interface
const hashId = (s: string): number => {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    return Math.abs(h);
};

const quickActions = [
    { label: "Show my stats", icon: null },
];

// ─── Component ──────────────────────────────────────────────────────────────

export default function KnowledgeBasePage() {
    const { t } = useTranslation();
    const { activeBusiness } = useBusiness();
    const [activeTab, setActiveTab] = useState<TabId>("assets");
    const [selectedAsset, setSelectedAsset] = useState<number | null>(null);
    const [selectedText, setSelectedText] = useState<number | null>(null);
    const [editingTextId, setEditingTextId] = useState<number | null>(null);
    const [editingTextContent, setEditingTextContent] = useState("");
    const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
    const [editingNoteContent, setEditingNoteContent] = useState("");
    const [noteInput, setNoteInput] = useState("");
    const [urlInput, setUrlInput] = useState("");
    const [textTitle, setTextTitle] = useState("");
    const [textCategory, setTextCategory] = useState("About Us");
    const [textContent, setTextContent] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState<AssetType | "all">("all");
    const [isDragging, setIsDragging] = useState(false);
    const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);
    const [transcribingId, setTranscribingId] = useState<number | null>(null);
    const [assets, setAssets] = useState<KBAsset[]>([]);
    const [textEntries, setTextEntries] = useState<TextEntry[]>([]);
    const [crawledURLs, setCrawledURLs] = useState<CrawledURL[]>([]);
    const [brandIndustry, setBrandIndustry] = useState("");
    const [brandName, setBrandName] = useState("");
    const [brandVoice, setBrandVoice] = useState("");
    const [brandAudience, setBrandAudience] = useState("");
    const [brandCompetitors, setBrandCompetitors] = useState("");
    const [brandUSPs, setBrandUSPs] = useState("");
    const [brandAvoid, setBrandAvoid] = useState("");
    const [brandGuardrails, setBrandGuardrails] = useState("");
    const [brandTone, setBrandTone] = useState("");
    const [brandSaving, setBrandSaving] = useState(false);
    const [retrainStatus, setRetrainStatus] = useState<"idle" | "running" | "done">("idle");
    const [loadingKB, setLoadingKB] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ── Fetch real KB data from API ──
    useEffect(() => {
        const fetchKBData = async () => {
            setLoadingKB(true);
            try {
                const res = await authFetch(`/api/knowledge-base?businessId=${activeBusiness.id}`);
                if (!res.ok) throw new Error("Failed to fetch");
                const data = await res.json();
                const items: { id: string; type: string; title: string; content: string; fileUrl?: string; mimeType?: string; sizeBytes?: number; createdAt: string }[] = data.items || [];

                // Map KB items into local state categories
                const fileAssets: KBAsset[] = [];
                const texts: TextEntry[] = [];
                const urls: CrawledURL[] = [];

                for (const item of items) {
                    if (item.type === "brand_profile") {
                        try {
                            const bp = JSON.parse(item.content);
                            setBrandName(bp.businessName || "");
                            setBrandIndustry(bp.industry || "");
                            setBrandVoice(bp.brandVoice || "");
                            setBrandAudience(bp.targetAudience || "");
                            setBrandCompetitors(bp.competitors || "");
                            setBrandUSPs(bp.uniqueSellingPoints || "");
                            setBrandAvoid(bp.avoidTopics || "");
                            setBrandTone(bp.toneExamples || "");
                            setBrandGuardrails(bp.guardrails || "");
                        } catch { /* ignore parse errors */ }
                    } else if (item.type === "file") {
                        const isVideo = item.mimeType?.startsWith("video/");
                        const isImage = item.mimeType?.startsWith("image/");
                        fileAssets.push({
                            id: hashId(item.id),
                            kbId: item.id,
                            type: isVideo ? "video" : isImage ? "image" : "document",
                            name: item.title,
                            client: activeBusiness.name,
                            previewBg: isVideo ? "from-purple-500 to-indigo-600" : isImage ? "from-emerald-400 to-cyan-500" : "from-gray-400 to-gray-600",
                            previewText: item.title,
                            fileSize: item.sizeBytes ? `${(item.sizeBytes / (1024 * 1024)).toFixed(1)} MB` : "—",
                            uploadedAt: new Date(item.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }),
                            notes: item.content || "",
                            aiAnalysis: { format: item.mimeType?.split("/")[1]?.toUpperCase() || "Unknown" },
                        });
                    } else if (item.type === "text") {
                        let category = "Other";
                        try { const meta = JSON.parse(item.content); category = meta.category || "Other"; } catch { /* plain text */ }
                        const plainContent = (() => { try { return JSON.parse(item.content).text || item.content; } catch { return item.content; } })();
                        texts.push({
                            id: hashId(item.id),
                            kbId: item.id,
                            title: item.title,
                            category,
                            content: plainContent,
                            client: activeBusiness.name,
                            addedAt: new Date(item.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }),
                            wordCount: plainContent.split(/\s+/).filter(Boolean).length,
                            aiSummary: "AI summary will be generated when content is analyzed.",
                        });
                    } else if (item.type === "url") {
                        urls.push({
                            id: hashId(item.id),
                            url: item.title,
                            status: "queued",
                            pagesFound: 0,
                            contentExtracted: item.content || "URL saved. Crawling not yet started.",
                            client: activeBusiness.name,
                        });
                    }
                }
                setAssets(fileAssets);
                setTextEntries(texts);
                setCrawledURLs(urls);

                // Set brand defaults from business if no brand profile saved
                if (!items.some(i => i.type === "brand_profile")) {
                    setBrandName(activeBusiness.name);
                    setBrandIndustry(activeBusiness.industry || "");
                }
            } catch (err) {
                console.error("[KB] Failed to fetch:", err);
            } finally {
                setLoadingKB(false);
            }
        };
        fetchKBData();
    }, [activeBusiness.id, activeBusiness.name, activeBusiness.industry]);

    const selected = assets.find((item) => item.id === selectedAsset);
    const selectedTextEntry = textEntries.find((item) => item.id === selectedText);

    const filteredAssets = assets.filter((a) => {
        if (filterType !== "all" && a.type !== filterType) return false;
        if (searchQuery && !a.name.toLowerCase().includes(searchQuery.toLowerCase()) && !a.client.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    // ── File upload handler ──
    const handleFileUpload = useCallback(async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        const fileNames = Array.from(files).map(f => f.name);
        setUploadingFiles(fileNames);

        try {
            // Upload images via /api/upload
            const imageFiles = Array.from(files).filter(f => f.type.startsWith("image/"));
            const otherFiles = Array.from(files).filter(f => !f.type.startsWith("image/"));

            // Upload images to storage
            if (imageFiles.length > 0) {
                const formData = new FormData();
                imageFiles.forEach(f => formData.append("images", f));
                const uploadRes = await authFetch("/api/upload", { method: "POST", body: formData });
                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json();
                    for (const uploaded of (uploadData.uploaded || [])) {
                        // Create KB record for each uploaded image
                        await authFetch("/api/knowledge-base", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                type: "file",
                                title: uploaded.filename,
                                content: "",
                                fileUrl: uploaded.url,
                                mimeType: "image/jpeg",
                                sizeBytes: uploaded.size,
                                businessId: activeBusiness.id,
                            }),
                        });
                    }
                }
            }

            // For non-image files, store as KB text entries with file metadata
            for (const file of otherFiles) {
                await authFetch("/api/knowledge-base", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        type: "file",
                        title: file.name,
                        content: `Uploaded file: ${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)`,
                        mimeType: file.type,
                        sizeBytes: file.size,
                        businessId: activeBusiness.id,
                    }),
                });
            }

            // Build local asset records for immediate UI update
            const newAssets: KBAsset[] = Array.from(files).map((file, i) => {
                const isVideo = file.type.startsWith("video/");
                const isImage = file.type.startsWith("image/");
                const type: AssetType = isVideo ? "video" : isImage ? "image" : "document";
                return {
                    id: Date.now() + i,
                    type,
                    name: file.name,
                    client: activeBusiness.name,
                    previewBg: isVideo ? "from-purple-500 to-indigo-600" : isImage ? "from-emerald-400 to-cyan-500" : "from-gray-400 to-gray-600",
                    previewText: file.name,
                    dimensions: isImage ? "Auto-detected" : undefined,
                    duration: isVideo ? "Analyzing..." : undefined,
                    fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
                    uploadedAt: new Date().toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }),
                    notes: "",
                    aiAnalysis: {
                        format: file.type.split("/")[1]?.toUpperCase() || "Unknown",
                    },
                };
            });
            setAssets(prev => [...newAssets, ...prev]);
        } catch (err) {
            console.error("[KB] Upload failed:", err);
        } finally {
            setUploadingFiles([]);
        }
    }, [activeBusiness.name, activeBusiness.id]);

    // ── Drag and drop handlers ──
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);
    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);
    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        handleFileUpload(e.dataTransfer.files);
    }, [handleFileUpload]);

    // ── Edit text entry ──
    const startEditingText = (entry: TextEntry) => {
        setEditingTextId(entry.id);
        setEditingTextContent(entry.content);
    };
    const saveTextEdit = () => {
        if (editingTextId === null) return;
        const entry = textEntries.find(e => e.id === editingTextId);
        setTextEntries(prev => prev.map(e => e.id === editingTextId ? {
            ...e,
            content: editingTextContent,
            wordCount: editingTextContent.split(/\s+/).filter(Boolean).length
        } : e));
        setEditingTextId(null);
        setEditingTextContent("");

        // Persist to API
        if (entry?.kbId) {
            authFetch("/api/knowledge-base", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: entry.kbId,
                    content: JSON.stringify({ text: editingTextContent, category: entry.category }),
                }),
            }).catch(err => console.error("[KB] Failed to save text edit:", err));
        }
    };

    // ── Edit asset note ──
    const startEditingNote = (asset: KBAsset) => {
        setEditingNoteId(asset.id);
        setEditingNoteContent(asset.notes);
    };
    const saveNoteEdit = () => {
        if (editingNoteId === null) return;
        const asset = assets.find(a => a.id === editingNoteId);
        setAssets(prev => prev.map(a => a.id === editingNoteId ? { ...a, notes: editingNoteContent } : a));
        setEditingNoteId(null);
        setEditingNoteContent("");

        // Persist to API
        if (asset?.kbId) {
            authFetch("/api/knowledge-base", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: asset.kbId,
                    content: editingNoteContent,
                }),
            }).catch(err => console.error("[KB] Failed to save note edit:", err));
        }
    };
    const addNote = () => {
        if (!noteInput.trim() || !selectedAsset) return;
        const asset = assets.find(a => a.id === selectedAsset);
        const newNote = asset?.notes ? `${asset.notes}\n${noteInput}` : noteInput;
        setAssets(prev => prev.map(a => a.id === selectedAsset ? { ...a, notes: newNote } : a));
        setNoteInput("");

        // Persist to API
        if (asset?.kbId) {
            authFetch("/api/knowledge-base", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: asset.kbId, content: newNote }),
            }).catch(err => console.error("[KB] Failed to save note:", err));
        }
    };

    // ── Delete asset ──
    const deleteAsset = async (id: number) => {
        setAssets(prev => prev.filter(a => a.id !== id));
        if (selectedAsset === id) setSelectedAsset(null);
        // Find original string ID from KB items (best-effort cleanup)
        try {
            const res = await authFetch(`/api/knowledge-base?businessId=${activeBusiness.id}`);
            if (res.ok) {
                const data = await res.json();
                const match = (data.items || []).find((i: { id: string }) => hashId(i.id) === id);
                if (match) await authFetch(`/api/knowledge-base?id=${match.id}`, { method: "DELETE" });
            }
        } catch { /* silent */ }
    };
    const deleteTextEntry = async (id: number) => {
        setTextEntries(prev => prev.filter(e => e.id !== id));
        if (selectedText === id) setSelectedText(null);
        try {
            const res = await authFetch(`/api/knowledge-base?businessId=${activeBusiness.id}`);
            if (res.ok) {
                const data = await res.json();
                const match = (data.items || []).find((i: { id: string }) => hashId(i.id) === id);
                if (match) await authFetch(`/api/knowledge-base?id=${match.id}`, { method: "DELETE" });
            }
        } catch { /* silent */ }
    };

    // ── Add text entry ──
    const addTextEntry = async () => {
        if (!textTitle.trim() || !textContent.trim()) return;
        const newEntry: TextEntry = {
            id: Date.now(),
            title: textTitle,
            category: textCategory,
            content: textContent,
            client: activeBusiness.name,
            addedAt: new Date().toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }),
            wordCount: textContent.split(/\s+/).filter(Boolean).length,
            aiSummary: "Processing... AI summary will appear shortly.",
        };
        setTextEntries(prev => [newEntry, ...prev]);
        setTextTitle("");
        setTextContent("");

        // Persist to API
        try {
            await authFetch("/api/knowledge-base", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "text",
                    title: textTitle.trim(),
                    content: JSON.stringify({ text: textContent, category: textCategory }),
                    businessId: activeBusiness.id,
                }),
            });
        } catch (err) { console.error("[KB] Failed to save text entry:", err); }
    };

    // ── Save brand profile ──
    const saveBrandProfile = async () => {
        setBrandSaving(true);
        try {
            // Check if brand_profile item already exists
            const res = await authFetch(`/api/knowledge-base?businessId=${activeBusiness.id}`);
            const data = res.ok ? await res.json() : { items: [] };
            const existing = (data.items || []).find((i: { type: string }) => i.type === "brand_profile");

            const profileData = JSON.stringify({
                businessName: brandName,
                industry: brandIndustry,
                brandVoice,
                targetAudience: brandAudience,
                competitors: brandCompetitors,
                uniqueSellingPoints: brandUSPs,
                avoidTopics: brandAvoid,
                toneExamples: brandTone,
                guardrails: brandGuardrails,
            });

            if (existing) {
                await authFetch("/api/knowledge-base", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: existing.id, title: "Brand Profile", content: profileData }),
                });
            } else {
                await authFetch("/api/knowledge-base", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        type: "brand_profile",
                        title: "Brand Profile",
                        content: profileData,
                        businessId: activeBusiness.id,
                    }),
                });
            }
        } catch (err) {
            console.error("[KB] Failed to save brand profile:", err);
        } finally {
            setBrandSaving(false);
        }
    };

    // ── Add URL entry ──
    const addURLEntry = async () => {
        if (!urlInput.trim()) return;
        const url = urlInput.trim();
        const newURL: CrawledURL = {
            id: Date.now(),
            url,
            status: "queued",
            pagesFound: 0,
            contentExtracted: "URL saved. Crawling will be available soon.",
            client: activeBusiness.name,
        };
        setCrawledURLs(prev => [newURL, ...prev]);
        setUrlInput("");

        try {
            await authFetch("/api/knowledge-base", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "url",
                    title: url,
                    content: "URL saved. Crawling not yet started.",
                    businessId: activeBusiness.id,
                }),
            });
        } catch (err) { console.error("[KB] Failed to save URL:", err); }
    };

    const tabs: { id: TabId; label: string; icon: React.ReactNode; count: number }[] = [
        { id: "assets", label: t("kb.tabFiles"), icon: <Upload className="w-4 h-4" />, count: assets.length },
        { id: "text", label: t("kb.tabText"), icon: <Type className="w-4 h-4" />, count: textEntries.length },
        { id: "urls", label: t("kb.tabUrls"), icon: <Globe className="w-4 h-4" />, count: crawledURLs.length },
        { id: "brand", label: t("kb.tabBrand"), icon: <Building2 className="w-4 h-4" />, count: 0 },
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Brain className="w-6 h-6 text-primary" />
                        {t("kb.title")}
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
                                {activeBusiness.kbStatus === "trained" ? t("kb.statusTrained") : activeBusiness.kbStatus === "training" ? t("kb.statusTraining") : t("kb.statusNotTrained")}
                            </span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Getting Started Tip */}
            {!loadingKB && assets.length === 0 && textEntries.length === 0 && (
                <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <div className="bg-amber-100 dark:bg-amber-900/30 rounded-lg p-2 shrink-0">
                            <Sparkles className="w-4 h-4 text-amber-600" />
                        </div>
                        <div>
                            <div className="text-sm font-medium text-amber-800 dark:text-amber-400">{t("kb.getStarted")}</div>
                            <p className="text-xs text-amber-700/80 dark:text-amber-500/80 mt-0.5">
                                {t("kb.getStartedDesc")}
                            </p>
                        </div>
                    </div>
                </div>
            )}

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
                                <span className={`text-xs px-2 py-0.5 rounded-full ${(assets.length + textEntries.length) > 0 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{(assets.length + textEntries.length) > 0 ? t("kb.active") : t("kb.empty")}</span>
                            </div>
                            <div className="text-xs text-muted mt-0.5">
                                {assets.length} files &bull; {textEntries.reduce((sum, t) => sum + t.wordCount, 0).toLocaleString()} words indexed &bull; {crawledURLs.filter(u => u.status === "crawled").reduce((sum, u) => sum + u.pagesFound, 0)} web pages crawled
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            if (retrainStatus !== "idle") return;
                            setRetrainStatus("running");
                            // Simulate retraining (KB is already used by AI via context injection)
                            setTimeout(() => {
                                setRetrainStatus("done");
                                setTimeout(() => setRetrainStatus("idle"), 2000);
                            }, 1500);
                        }}
                        disabled={retrainStatus !== "idle"}
                        className="text-xs bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary-dark transition flex items-center gap-1.5 disabled:opacity-60"
                    >
                        {retrainStatus === "running" ? (
                            <><Loader2 className="w-3 h-3 animate-spin" /> {t("kb.training")}</>
                        ) : retrainStatus === "done" ? (
                            <><CheckCircle2 className="w-3 h-3" /> {t("kb.updated")}</>
                        ) : (
                            <><RefreshCw className="w-3 h-3" /> {t("kb.retrainAi")}</>
                        )}
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
                    <div className="text-xs text-muted">{t("kb.videos")}</div>
                </div>
                <div className="bg-card border border-border rounded-xl p-3 text-center">
                    <div className="text-lg font-bold">{assets.filter(a => a.type === "document").length}</div>
                    <div className="text-xs text-muted">{t("kb.documents")}</div>
                </div>
                <div className="bg-card border border-border rounded-xl p-3 text-center">
                    <div className="text-lg font-bold">{crawledURLs.filter(u => u.status === "crawled").reduce((sum, u) => sum + u.pagesFound, 0)}</div>
                    <div className="text-xs text-muted">Pages Crawled</div>
                </div>
            </div>

            {/* Tab Navigation — Active tab stands out with primary bg + ring */}
            <div className="flex gap-1 bg-sidebar border border-border rounded-xl p-1.5">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                            ? "bg-primary text-white shadow-md shadow-primary/25 ring-1 ring-primary/30"
                            : "text-muted hover:text-foreground hover:bg-card/50"
                            }`}
                    >
                        {tab.icon}
                        {tab.label}
                        {tab.count > 0 && (
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? "bg-white/20 text-white" : "bg-border text-muted"
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
                    {/* Enhanced Upload Zone */}
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`relative overflow-hidden border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${isDragging
                            ? "border-primary bg-primary/5 scale-[1.01] shadow-lg shadow-primary/10"
                            : "border-primary/30 bg-gradient-to-br from-primary/[0.03] via-blue-500/[0.03] to-purple-500/[0.03] hover:border-primary/50 hover:shadow-md"
                            }`}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="image/*,video/*,.pdf,.docx,.xlsx,.pptx,.txt"
                            className="hidden"
                            onChange={(e) => handleFileUpload(e.target.files)}
                        />

                        {/* Background decoration */}
                        <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute -top-6 -right-6 w-32 h-32 bg-primary/5 rounded-full blur-2xl" />
                            <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl" />
                        </div>

                        {uploadingFiles.length > 0 ? (
                            <div className="relative z-10">
                                <Loader2 className="w-10 h-10 text-primary mx-auto mb-3 animate-spin" />
                                <div className="text-sm font-semibold text-primary mb-1">Uploading {uploadingFiles.length} file{uploadingFiles.length > 1 ? "s" : ""}...</div>
                                <div className="text-xs text-muted">{uploadingFiles.join(", ")}</div>
                            </div>
                        ) : (
                            <div className="relative z-10">
                                <div className="w-16 h-16 bg-gradient-to-br from-primary to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
                                    <Upload className="w-7 h-7 text-white" />
                                </div>
                                <div className="text-base font-semibold mb-1">{t("kb.dragDrop")}</div>
                                <div className="text-sm text-muted mb-5 max-w-lg mx-auto leading-relaxed">
                                    <span className="font-medium text-foreground/70">Images:</span> JPG, PNG, GIF, WebP, SVG{" "}
                                    <span className="text-border mx-1">&bull;</span>{" "}
                                    <span className="font-medium text-foreground/70">Videos:</span> MP4, MOV, AVI, WebM{" "}
                                    <span className="text-border mx-1">&bull;</span>{" "}
                                    <span className="font-medium text-foreground/70">Documents:</span> PDF, DOCX, XLSX, PPTX, TXT{" "}
                                    <span className="text-border mx-1">&bull;</span>{" "}
                                    <span className="font-medium text-foreground/70">Max 100MB</span> per file
                                </div>
                                <div className="flex items-center justify-center gap-3 flex-wrap">
                                    {[
                                        { icon: <Scan className="w-3.5 h-3.5" />, label: "AI auto-analyzes", color: "bg-blue-50 text-blue-700 border-blue-200" },
                                        { icon: <User className="w-3.5 h-3.5" />, label: "Face detection", color: "bg-purple-50 text-purple-700 border-purple-200" },
                                        { icon: <FileText className="w-3.5 h-3.5" />, label: "Text extraction (OCR)", color: "bg-amber-50 text-amber-700 border-amber-200" },
                                        { icon: <Mic className="w-3.5 h-3.5" />, label: "Video transcription", color: "bg-green-50 text-green-700 border-green-200" },
                                        { icon: <Video className="w-3.5 h-3.5" />, label: "Scene analysis", color: "bg-rose-50 text-rose-700 border-rose-200" },
                                        { icon: <Maximize2 className="w-3.5 h-3.5" />, label: "Auto-sizing", color: "bg-teal-50 text-teal-700 border-teal-200" },
                                    ].map((feat, i) => (
                                        <span key={i} className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border ${feat.color}`}>
                                            {feat.icon} {feat.label}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Search & Filter */}
                    <div className="flex gap-3">
                        <div className="flex-1 relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                            <input type="text" placeholder={t("kb.searchAssets")} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-card border border-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary transition" />
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
                                                <div className="flex items-center gap-2">
                                                    {typeBadge(item.type)}
                                                    {transcribingId === item.id && (
                                                        <span className="flex items-center gap-1 text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                                                            <Loader2 className="w-3 h-3 animate-spin" /> Transcribing...
                                                        </span>
                                                    )}
                                                </div>
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
                                                {item.aiAnalysis.transcript && <span className="text-xs bg-green-50 text-green-600 px-1.5 py-0.5 rounded flex items-center gap-1"><Mic className="w-3 h-3" />Transcribed</span>}
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
                            {filteredAssets.length === 0 && <div className="text-center text-sm text-muted py-12">{t("kb.noAssetsMatch")}</div>}
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
                                        {selected.aiAnalysis.transcript && (
                                            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                                <div className="text-xs font-medium text-green-700 mb-1 flex items-center gap-1"><Mic className="w-3 h-3" />Deepgram Transcript</div>
                                                <p className="text-xs text-green-900/70 leading-relaxed">{selected.aiAnalysis.transcript}</p>
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
                                                Notes & Instructions for AI
                                                <Tooltip text="Tell the AI how to use this asset: target audience, brand tone, context." position="bottom" />
                                            </div>
                                            {editingNoteId === selected.id ? (
                                                <div className="space-y-2">
                                                    <textarea
                                                        value={editingNoteContent}
                                                        onChange={(e) => setEditingNoteContent(e.target.value)}
                                                        rows={4}
                                                        className="w-full bg-sidebar border border-primary rounded-lg p-3 text-xs leading-relaxed focus:outline-none resize-y"
                                                    />
                                                    <div className="flex gap-2">
                                                        <button onClick={saveNoteEdit} className="bg-primary text-white text-xs px-3 py-1.5 rounded-lg hover:bg-primary-dark transition flex items-center gap-1"><Check className="w-3 h-3" />Save</button>
                                                        <button onClick={() => setEditingNoteId(null)} className="border border-border text-xs px-3 py-1.5 rounded-lg hover:border-primary transition">Cancel</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div
                                                        onClick={(e) => { e.stopPropagation(); startEditingNote(selected); }}
                                                        className="bg-sidebar border border-border rounded-lg p-3 text-xs leading-relaxed mb-2 cursor-pointer hover:border-primary/50 transition group"
                                                    >
                                                        {selected.notes || <span className="text-muted italic">Click to add notes...</span>}
                                                        <Edit3 className="w-3 h-3 text-muted opacity-0 group-hover:opacity-100 inline ml-2 transition" />
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <input type="text" value={noteInput} onChange={(e) => setNoteInput(e.target.value)} placeholder="Add a note for the AI..." className="flex-1 bg-card border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-primary transition" onKeyDown={(e) => e.key === "Enter" && addNote()} />
                                                        <button onClick={addNote} className="bg-primary text-white text-xs px-3 py-2 rounded-lg hover:bg-primary-dark transition">Add</button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                        <div className="flex gap-2 pt-2 border-t border-border">
                                            <button className="flex-1 text-xs border border-border rounded-lg px-3 py-2 hover:border-primary transition flex items-center justify-center gap-1.5"><Eye className="w-3 h-3" /> Preview</button>
                                            <button className="flex-1 text-xs border border-border rounded-lg px-3 py-2 hover:border-primary transition flex items-center justify-center gap-1.5"><Download className="w-3 h-3" /> Download</button>
                                            <button onClick={() => deleteAsset(selected.id)} className="text-xs border border-border rounded-lg px-3 py-2 hover:border-danger text-muted hover:text-danger transition flex items-center justify-center gap-1.5"><Trash2 className="w-3 h-3" /></button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-card border border-border rounded-xl p-8 text-center">
                                    <BookOpen className="w-8 h-8 text-muted mx-auto mb-3" />
                                    <div className="text-sm font-medium mb-1">{t("kb.selectAsset")}</div>
                                    <div className="text-xs text-muted">{t("kb.selectAssetDesc")}</div>
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
                            <h3 className="text-sm font-semibold">{t("kb.addTextContent")}</h3>
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
                            <div className="bg-sidebar border border-border rounded-lg px-3 py-2 text-sm text-muted">{activeBusiness.name}</div>
                        </div>
                        <textarea placeholder="Paste your text content here... About your business, services, pricing, FAQs, testimonials, product info, anything the AI should know to create accurate ads." value={textContent} onChange={(e) => setTextContent(e.target.value)} rows={6} className="w-full bg-sidebar border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary transition resize-y leading-relaxed" />
                        <div className="flex items-center justify-between">
                            <div className="text-xs text-muted">{textContent.split(/\s+/).filter(Boolean).length} words</div>
                            <button onClick={addTextEntry} className="bg-primary text-white text-sm px-4 py-2 rounded-lg hover:bg-primary-dark transition flex items-center gap-2"><Plus className="w-4 h-4" />{t("kb.addToKb")}</button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-3">
                            <div className="text-sm font-medium text-muted flex items-center gap-2">{t("kb.savedTextContent")} <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{textEntries.length}</span></div>
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
                                        {editingTextId === selectedTextEntry.id ? (
                                            <div className="space-y-2">
                                                <textarea
                                                    value={editingTextContent}
                                                    onChange={(e) => setEditingTextContent(e.target.value)}
                                                    rows={8}
                                                    className="w-full bg-sidebar border border-primary rounded-lg p-3 text-xs leading-relaxed focus:outline-none resize-y"
                                                />
                                                <div className="flex gap-2">
                                                    <button onClick={saveTextEdit} className="bg-primary text-white text-xs px-3 py-1.5 rounded-lg hover:bg-primary-dark transition flex items-center gap-1"><Check className="w-3 h-3" />Save</button>
                                                    <button onClick={() => setEditingTextId(null)} className="border border-border text-xs px-3 py-1.5 rounded-lg hover:border-primary transition">Cancel</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div
                                                onClick={(e) => { e.stopPropagation(); startEditingText(selectedTextEntry); }}
                                                className="bg-sidebar border border-border rounded-lg p-3 text-xs leading-relaxed max-h-48 overflow-y-auto cursor-pointer hover:border-primary/50 transition group"
                                            >
                                                {selectedTextEntry.content}
                                                <Edit3 className="w-3 h-3 text-muted opacity-0 group-hover:opacity-100 inline ml-2 transition" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-2 pt-2 border-t border-border">
                                        <button onClick={() => startEditingText(selectedTextEntry)} className="flex-1 text-xs border border-border rounded-lg px-3 py-2 hover:border-primary transition flex items-center justify-center gap-1.5"><Edit3 className="w-3 h-3" /> Edit</button>
                                        <button onClick={() => navigator.clipboard.writeText(selectedTextEntry.content)} className="flex-1 text-xs border border-border rounded-lg px-3 py-2 hover:border-primary transition flex items-center justify-center gap-1.5"><Copy className="w-3 h-3" /> Copy</button>
                                        <button onClick={() => deleteTextEntry(selectedTextEntry.id)} className="text-xs border border-border rounded-lg px-3 py-2 hover:border-danger text-muted hover:text-danger transition flex items-center justify-center gap-1.5"><Trash2 className="w-3 h-3" /></button>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-card border border-border rounded-xl p-8 text-center">
                                    <Type className="w-8 h-8 text-muted mx-auto mb-3" />
                                    <div className="text-sm font-medium mb-1">{t("kb.selectTextEntry")}</div>
                                    <div className="text-xs text-muted">{t("kb.selectTextEntryDesc")}</div>
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
                            <h3 className="text-sm font-semibold">{t("kb.addWebsiteUrl")}</h3>
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
                            <div className="bg-sidebar border border-border rounded-lg px-3 py-2.5 text-sm text-muted shrink-0">{activeBusiness.name}</div>
                            <button onClick={addURLEntry} className="bg-primary text-white text-sm px-5 py-2.5 rounded-lg hover:bg-primary-dark transition flex items-center gap-2 whitespace-nowrap"><Plus className="w-4 h-4" />{t("kb.addWebsite")}</button>
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
                        <div className="text-sm font-medium text-muted flex items-center gap-2">{t("kb.crawledWebsites")} <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{crawledURLs.length}</span></div>
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
                                <h3 className="text-sm font-semibold">{t("kb.brandProfile")}</h3>
                                <Tooltip text="Define your brand voice, target audience, and guardrails. This ensures the AI always writes on-brand." />
                            </div>
                            <button onClick={saveBrandProfile} disabled={brandSaving} className="text-xs bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary-dark transition disabled:opacity-50 flex items-center gap-1.5">{brandSaving ? <><Loader2 className="w-3 h-3 animate-spin" />{t("common.saving")}</> : t("kb.saveChanges")}</button>
                        </div>
                        <p className="text-xs text-muted -mt-2">This profile guides the AI&#39;s tone, language, and accuracy. The more detail you provide, the better your ads will sound.</p>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            <div>
                                <label className="text-xs font-medium mb-1.5 flex items-center gap-1"><Building2 className="w-3 h-3 text-muted" />Business Name</label>
                                <input type="text" value={brandName} onChange={(e) => setBrandName(e.target.value)} className="w-full bg-sidebar border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary transition" />
                            </div>
                            <div>
                                <label className="text-xs font-medium mb-1.5 flex items-center gap-1"><Tag className="w-3 h-3 text-muted" />Industry</label>
                                <IndustryDropdown value={brandIndustry} onChange={setBrandIndustry} />
                            </div>
                            <div className="lg:col-span-2">
                                <label className="text-xs font-medium mb-1.5 flex items-center gap-1"><Target className="w-3 h-3 text-muted" />Target Audience <Tooltip text="Who are your ideal customers? Include age, location, interests, and pain points." position="right" /></label>
                                <textarea value={brandAudience} onChange={(e) => setBrandAudience(e.target.value)} rows={2} className="w-full bg-sidebar border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary transition resize-y leading-relaxed" />
                            </div>
                            <div className="lg:col-span-2">
                                <label className="text-xs font-medium mb-1.5 flex items-center gap-1"><Megaphone className="w-3 h-3 text-muted" />Brand Voice & Tone <Tooltip text="How should your brand sound? Professional, casual, luxury, friendly? The AI matches this." position="right" /></label>
                                <textarea value={brandVoice} onChange={(e) => setBrandVoice(e.target.value)} rows={3} className="w-full bg-sidebar border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary transition resize-y leading-relaxed" />
                            </div>
                            <div className="lg:col-span-2">
                                <label className="text-xs font-medium mb-1.5 flex items-center gap-1"><MessageSquare className="w-3 h-3 text-muted" />Tone Examples (Good vs Bad) <Tooltip text="Show the AI what good and bad copy looks like for your brand." position="right" /></label>
                                <textarea value={brandTone} onChange={(e) => setBrandTone(e.target.value)} rows={3} className="w-full bg-sidebar border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary transition resize-y leading-relaxed" />
                            </div>
                            <div className="lg:col-span-2">
                                <label className="text-xs font-medium mb-1.5 flex items-center gap-1"><Star className="w-3 h-3 text-muted" />Unique Selling Points <Tooltip text="What makes you different from competitors? These get highlighted in AI-generated ads." position="right" /></label>
                                <textarea value={brandUSPs} onChange={(e) => setBrandUSPs(e.target.value)} rows={2} className="w-full bg-sidebar border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary transition resize-y leading-relaxed" />
                            </div>
                            <div>
                                <label className="text-xs font-medium mb-1.5 flex items-center gap-1"><Users className="w-3 h-3 text-muted" />Known Competitors</label>
                                <input type="text" value={brandCompetitors} onChange={(e) => setBrandCompetitors(e.target.value)} className="w-full bg-sidebar border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary transition" placeholder="Comma-separated names" />
                            </div>
                            <div>
                                <label className="text-xs font-medium mb-1.5 flex items-center gap-1"><Shield className="w-3 h-3 text-muted" />Topics to Avoid</label>
                                <input type="text" value={brandAvoid} onChange={(e) => setBrandAvoid(e.target.value)} className="w-full bg-sidebar border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary transition" placeholder="Things the AI should never say" />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-medium mb-1.5 flex items-center gap-1"><Shield className="w-3 h-3 text-danger" />Detailed Guardrails & Things AI Must Never Say <Tooltip text="Critical safety rules. List anything the AI should never claim, promise, or mention." position="right" /></label>
                            <textarea value={brandGuardrails} onChange={(e) => setBrandGuardrails(e.target.value)} rows={3} className="w-full bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-red-400 transition resize-y leading-relaxed" />
                        </div>
                    </div>

                    {(brandUSPs || brandVoice || brandAvoid) && (
                        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-primary" />
                                <h3 className="text-sm font-semibold">{t("kb.aiBrandUnderstanding")}</h3>
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Active</span>
                            </div>
                            <p className="text-xs text-muted">Based on your brand profile, the AI will use these guidelines when creating ads:</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {brandUSPs && (
                                    <div className="bg-sidebar border border-border rounded-lg p-3">
                                        <div className="text-xs font-medium mb-1">Unique Selling Points</div>
                                        <ul className="text-xs text-muted space-y-1">
                                            {brandUSPs.split(",").map((usp, i) => <li key={i}>&bull; {usp.trim()}</li>)}
                                        </ul>
                                    </div>
                                )}
                                {brandVoice && (
                                    <div className="bg-sidebar border border-border rounded-lg p-3">
                                        <div className="text-xs font-medium mb-1">Brand Voice</div>
                                        <p className="text-xs text-muted">{brandVoice}</p>
                                    </div>
                                )}
                                {brandAudience && (
                                    <div className="bg-sidebar border border-border rounded-lg p-3">
                                        <div className="text-xs font-medium mb-1">Target Audience</div>
                                        <p className="text-xs text-muted">{brandAudience}</p>
                                    </div>
                                )}
                                {brandAvoid && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                        <div className="text-xs font-medium mb-1 text-red-700">Guardrails Active</div>
                                        <p className="text-xs text-red-600">{brandAvoid}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
