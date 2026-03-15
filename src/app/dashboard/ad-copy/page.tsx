"use client";

import { useState, useEffect } from "react";
import {
    Zap, Loader2, Save, Copy, CheckCircle2, AlertTriangle, XCircle,
    Info, Shield, RefreshCw, Search, Monitor, ShoppingBag, Video,
    Target, ChevronDown, ChevronUp, Sparkles, Globe, Phone, Smartphone,
    Layers, Megaphone
} from "lucide-react";
import React from "react";
import { authFetch } from "@/lib/auth-client";
import { useBusiness } from "@/lib/business-context";
import { useTranslation } from "@/i18n/context";
import Tooltip from "@/components/Tooltip";

interface GeneratedAd {
    headlines?: string[];
    descriptions?: string[];
    keywords?: string[];
    negativeKeywords?: string[];
    sitelinks?: { title: string; description: string }[];
    callouts?: string[];
    notes?: string;
    raw?: string;
    parseError?: boolean;
}

interface PolicyResult {
    compliant?: boolean;
    score?: number;
    issues?: { severity: string; rule: string; detail: string; suggestion: string }[];
    summary?: string;
    raw?: string;
    parseError?: boolean;
}

const CAMPAIGN_TYPES = [
    { value: "search", label: "Search Ads", icon: Search, desc: "Text ads on Google Search" },
    { value: "rsa", label: "RSA (Responsive)", icon: Layers, desc: "Up to 15 headlines, AI picks combos" },
    { value: "shopping", label: "Shopping Ads", icon: ShoppingBag, desc: "Product listings with images" },
    { value: "display", label: "Display Ads", icon: Monitor, desc: "Visual ads on Display Network" },
    { value: "pmax", label: "Performance Max", icon: Zap, desc: "AI-driven across all channels" },
    { value: "video", label: "Video Ads", icon: Video, desc: "YouTube video campaigns" },
    { value: "app", label: "App Ads", icon: Smartphone, desc: "App install / engagement" },
    { value: "demand_gen", label: "Demand Gen", icon: Megaphone, desc: "Discover, Gmail, YouTube feeds" },
    { value: "call_only", label: "Call-Only Ads", icon: Phone, desc: "Mobile click-to-call" },
];

const TONES = [
    "Professional", "Friendly", "Urgent", "Luxury", "Casual",
    "Technical", "Humorous", "Authoritative", "Empathetic", "Bold",
];

export default function AdCopyPage() {
    const { t } = useTranslation();
    const { activeBusiness } = useBusiness();
    void t;

    // Form state
    const [campaignType, setCampaignType] = useState("search");
    const [productDesc, setProductDesc] = useState("");
    const [targetAudience, setTargetAudience] = useState("");
    const [tone, setTone] = useState("Professional");
    const [keywords, setKeywords] = useState("");

    // Results
    const [generating, setGenerating] = useState(false);
    const [result, setResult] = useState<GeneratedAd | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Policy check
    const [policyMode, setPolicyMode] = useState(false);
    const [policyText, setPolicyText] = useState("");
    const [policyResult, setPolicyResult] = useState<PolicyResult | null>(null);
    const [checkingPolicy, setCheckingPolicy] = useState(false);

    // Save to drafts state
    const [savingDraft, setSavingDraft] = useState(false);
    const [savedDraft, setSavedDraft] = useState(false);

    // UI toggles
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    // Pre-fill form from business context
    useEffect(() => {
        if (!activeBusiness || activeBusiness.id === "default") return;
        const biz = activeBusiness;

        // Build product/service description from business info
        const descParts: string[] = [];
        if (biz.name) descParts.push(biz.name);
        if (biz.industry) descParts.push(`${biz.industry} business`);
        if (biz.location) descParts.push(`located in ${biz.location}`);
        if (biz.website) descParts.push(`(${biz.website})`);
        if (descParts.length > 0 && !productDesc) {
            setProductDesc(descParts.join(" — ") + ". ");
        }

        // Pre-fill target audience from industry
        if (biz.industry && !targetAudience) {
            setTargetAudience(`People interested in ${biz.industry.toLowerCase()} services`);
        }

        // Pre-fill keywords from business name + industry
        if (!keywords) {
            const kw: string[] = [];
            if (biz.name) kw.push(biz.name.toLowerCase());
            if (biz.industry) kw.push(biz.industry.toLowerCase());
            if (biz.location) kw.push(`${biz.industry?.toLowerCase() || "services"} ${biz.location.toLowerCase()}`);
            if (kw.length > 0) setKeywords(kw.join(", "));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeBusiness?.id]);

    // Pre-fill form fields from business context
    React.useEffect(() => {
        if (activeBusiness && activeBusiness.id !== "default") {
            if (!productDesc) {
                const parts: string[] = [];
                if (activeBusiness.name) parts.push(activeBusiness.name);
                if (activeBusiness.shortDesc) parts.push(activeBusiness.shortDesc);
                else if (activeBusiness.industry) parts.push(activeBusiness.industry);
                if (activeBusiness.services?.length) parts.push(`Services: ${activeBusiness.services.join(", ")}`);
                if (activeBusiness.location) parts.push(`Located in ${activeBusiness.location}`);
                if (parts.length) setProductDesc(parts.join(". ") + ".");
            }
            if (!targetAudience && activeBusiness.targetAudience) {
                setTargetAudience(activeBusiness.targetAudience);
            }
            if (!keywords && activeBusiness.services?.length) {
                setKeywords(activeBusiness.services.join(", "));
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeBusiness?.id]);

    const generate = async () => {
        if (!productDesc.trim()) { setError("Product/service description is required"); return; }
        setGenerating(true);
        setError(null);
        setResult(null);

        try {
            const res = await authFetch("/api/ad-copy/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mode: "generate",
                    campaignType,
                    productDescription: productDesc,
                    targetAudience: targetAudience || undefined,
                    tone,
                    keywords: keywords ? keywords.split(",").map(k => k.trim()).filter(Boolean) : undefined,
                    businessName: activeBusiness?.name,
                    businessIndustry: activeBusiness?.industry,
                    businessWebsite: activeBusiness?.website,
                    businessLocation: activeBusiness?.location,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Generation failed");

            setResult(data.result);

            // Auto-populate policy check text
            if (data.result?.headlines?.length) {
                const preview = [
                    ...(data.result.headlines || []).slice(0, 3),
                    ...(data.result.descriptions || []).slice(0, 2),
                ].join("\n");
                setPolicyText(preview);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Generation failed");
        } finally {
            setGenerating(false);
        }
    };

    const checkPolicy = async () => {
        if (!policyText.trim()) return;
        setCheckingPolicy(true);
        setPolicyResult(null);

        try {
            const res = await authFetch("/api/ad-copy/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mode: "policy-check", adCopy: policyText }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Policy check failed");
            setPolicyResult(data.result);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Policy check failed");
        } finally {
            setCheckingPolicy(false);
        }
    };

    const saveToDraft = async () => {
        if (!result || !result.headlines?.length) return;
        setSavingDraft(true);
        try {
            const content = {
                headlines: result.headlines,
                descriptions: result.descriptions,
                keywords: result.keywords,
                targetUrl: activeBusiness?.website || "",
            };

            const res = await authFetch("/api/drafts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: `${campaignType.toUpperCase()} - ${productDesc.slice(0, 40)}`,
                    type: campaignType,
                    content,
                    notes: result.notes || `Generated with AI (${tone} tone)`,
                    businessId: activeBusiness?.id,
                }),
            });

            if (!res.ok) throw new Error("Failed to save draft");
            setSavedDraft(true);
            setTimeout(() => setSavedDraft(false), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save draft");
        } finally {
            setSavingDraft(false);
        }
    };

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    AI Ad Copy Generator
                    <Tooltip text="Generate ready-to-use Google Ads copy including headlines, descriptions, and keyword suggestions — all checked for policy compliance." position="bottom" />
                </h1>
                <p className="text-muted text-sm mt-1">
                    Generate Google Ads-compliant ad copy with AI — headlines, descriptions, keywords, and extensions
                </p>
            </div>

            {/* Mode toggle */}
            <div className="flex gap-2 bg-card border border-border rounded-xl p-1">
                <button
                    onClick={() => setPolicyMode(false)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition ${
                        !policyMode ? "bg-primary text-white" : "text-muted hover:text-foreground"
                    }`}
                >
                    <Zap className="w-4 h-4" />
                    Generate Ad Copy
                </button>
                <button
                    onClick={() => setPolicyMode(true)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition ${
                        policyMode ? "bg-primary text-white" : "text-muted hover:text-foreground"
                    }`}
                >
                    <Shield className="w-4 h-4" />
                    Policy Compliance Check
                </button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
                    {error}
                </div>
            )}

            {/* GENERATE MODE */}
            {!policyMode && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left: Form */}
                    <div className="space-y-5">
                        {/* Campaign Type */}
                        <div>
                            <label className="block text-sm font-medium mb-2 flex items-center gap-1">Campaign Type <Tooltip text="Choose the ad format. Search ads appear in Google results; Display ads are banners on websites; Video ads play on YouTube." position="right" /></label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {CAMPAIGN_TYPES.map(ct => {
                                    const Icon = ct.icon;
                                    return (
                                        <button
                                            key={ct.value}
                                            onClick={() => setCampaignType(ct.value)}
                                            className={`flex items-center gap-2 p-3 rounded-xl border text-sm transition ${
                                                campaignType === ct.value
                                                    ? "border-primary bg-primary/5 text-primary font-medium"
                                                    : "border-border hover:border-primary/50"
                                            }`}
                                        >
                                            <Icon className="w-4 h-4 shrink-0" />
                                            <span className="truncate">{ct.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Product Description */}
                        <div>
                            <label className="block text-sm font-medium mb-1.5 flex items-center gap-1">
                                Product / Service Description * <Tooltip text="Describe what you're advertising in detail. The more specific you are (features, location, pricing), the better the AI can craft targeted copy." position="right" />
                            </label>
                            <textarea
                                value={productDesc}
                                onChange={e => setProductDesc(e.target.value)}
                                placeholder="Describe what you're advertising. E.g., 'Premium car detailing service in Los Angeles. Hand wash, ceramic coating, interior deep clean. Prices from $99.'"
                                rows={4}
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm resize-none"
                            />
                        </div>

                        {/* Target Audience */}
                        <div>
                            <label className="block text-sm font-medium mb-1.5 flex items-center gap-1">Target Audience <Tooltip text="Who are your ideal customers? Include demographics, interests, and pain points to help the AI tailor messaging." position="right" /></label>
                            <input
                                type="text"
                                value={targetAudience}
                                onChange={e => setTargetAudience(e.target.value)}
                                placeholder="e.g., Car enthusiasts aged 25-55, luxury vehicle owners"
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
                            />
                        </div>

                        {/* Tone */}
                        <div>
                            <label className="block text-sm font-medium mb-1.5 flex items-center gap-1">Tone <Tooltip text="Sets the voice of your ad copy. Professional works for B2B, Urgent creates FOMO, Friendly suits lifestyle brands." position="right" /></label>
                            <div className="flex flex-wrap gap-2">
                                {TONES.map(t => (
                                    <button
                                        key={t}
                                        onClick={() => setTone(t)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                                            tone === t
                                                ? "border-primary bg-primary/5 text-primary"
                                                : "border-border hover:border-primary/50 text-muted"
                                        }`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Advanced */}
                        <button
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="flex items-center gap-1 text-sm text-muted hover:text-foreground transition"
                        >
                            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            Advanced Options
                        </button>

                        {showAdvanced && (
                            <div>
                                <label className="block text-sm font-medium mb-1.5 flex items-center gap-1">
                                    Focus Keywords <span className="text-muted font-normal">(comma-separated)</span> <Tooltip text="Include your top-performing or target keywords. The AI will weave them into headlines and descriptions for better Quality Score." position="right" />
                                </label>
                                <input
                                    type="text"
                                    value={keywords}
                                    onChange={e => setKeywords(e.target.value)}
                                    placeholder="car detailing, ceramic coating, hand wash"
                                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
                                />
                            </div>
                        )}

                        {/* Generate button */}
                        <button
                            onClick={generate}
                            disabled={generating || !productDesc.trim()}
                            className="w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-medium transition disabled:opacity-50"
                        >
                            {generating ? (
                                <><Loader2 className="w-5 h-5 animate-spin" /> Generating...</>
                            ) : (
                                <><Sparkles className="w-5 h-5" /> Generate Ad Copy</>
                            )}
                        </button>

                        {/* Business context info */}
                        {activeBusiness && activeBusiness.id !== "default" && (
                            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-xs text-muted">
                                <Target className="w-3.5 h-3.5 inline mr-1" />
                                Using context from <strong>{activeBusiness.name}</strong>
                                {activeBusiness.industry && ` (${activeBusiness.industry})`}
                            </div>
                        )}
                    </div>

                    {/* Right: Results */}
                    <div className="space-y-4">
                        {!result && !generating && (
                            <div className="bg-card border border-border rounded-2xl p-12 text-center">
                                <Sparkles className="w-12 h-12 text-muted/30 mx-auto mb-4" />
                                <p className="text-muted text-sm">
                                    Fill in the details and click Generate to create ad copy
                                </p>
                            </div>
                        )}

                        {generating && (
                            <div className="bg-card border border-border rounded-2xl p-12 text-center">
                                <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
                                <p className="text-sm font-medium">Generating your ad copy...</p>
                                <p className="text-xs text-muted mt-1">This usually takes 5-10 seconds</p>
                            </div>
                        )}

                        {result && !result.parseError && (
                            <>
                                {/* Action bar */}
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={saveToDraft}
                                        disabled={savingDraft || savedDraft}
                                        className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition disabled:opacity-70"
                                    >
                                        {savedDraft ? <CheckCircle2 className="w-4 h-4" /> : savingDraft ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        {savedDraft ? "Saved!" : "Save as Draft"}
                                    </button>
                                    <button
                                        onClick={generate}
                                        disabled={generating}
                                        className="inline-flex items-center gap-2 bg-card border border-border hover:border-primary text-foreground px-4 py-2 rounded-xl text-sm font-medium transition"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        Regenerate
                                    </button>
                                </div>

                                {/* Google Ad Preview — pixel-perfect Google Search Ad */}
                                {result.headlines && result.headlines.length > 0 && (
                                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                                        <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                                            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Google Search Preview</span>
                                        </div>
                                        <div className="px-5 py-4" style={{ fontFamily: "arial, sans-serif" }}>
                                            {/* Sponsored label — exactly like Google */}
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
                                                        {activeBusiness?.name || "Your Business"}
                                                    </div>
                                                    <div className="text-[12px] text-[#4d5156] leading-[16px] truncate" style={{ fontFamily: "arial, sans-serif" }}>
                                                        {activeBusiness?.website || "yourwebsite.com"}
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
                                            {/* Headline — Google blue link */}
                                            <h3
                                                className="text-[20px] leading-[26px] text-[#1a0dab] cursor-pointer mt-0.5 hover:underline"
                                                style={{ fontFamily: "arial, sans-serif", fontWeight: 400 }}
                                            >
                                                {result.headlines.slice(0, 3).join(" | ")}
                                            </h3>
                                            {/* Descriptions — concatenated like Google shows them */}
                                            {result.descriptions && result.descriptions.length > 0 && (
                                                <p className="text-[14px] leading-[22px] text-[#4d5156] mt-0.5" style={{ fontFamily: "arial, sans-serif" }}>
                                                    {result.descriptions.slice(0, 2).join(" ")}
                                                </p>
                                            )}
                                            {/* Sitelinks grid — like Google's 2x2 layout */}
                                            {result.sitelinks && result.sitelinks.length > 0 && (
                                                <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-3 pt-2.5 border-t border-[#dadce0]">
                                                    {result.sitelinks.slice(0, 4).map((sl, i) => (
                                                        <div key={i}>
                                                            <span className="text-[14px] text-[#1a0dab] hover:underline cursor-pointer leading-[20px]" style={{ fontFamily: "arial, sans-serif" }}>{sl.title}</span>
                                                            {sl.description && (
                                                                <div className="text-[12px] text-[#4d5156] leading-[16px]" style={{ fontFamily: "arial, sans-serif" }}>{sl.description}</div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            {/* Callouts — inline with middot separator */}
                                            {result.callouts && result.callouts.length > 0 && (
                                                <div className="text-[14px] text-[#4d5156] mt-2" style={{ fontFamily: "arial, sans-serif" }}>
                                                    {result.callouts.join(" · ")}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Headlines */}
                                {result.headlines && result.headlines.length > 0 && (
                                    <div className="bg-card border border-border rounded-xl p-5">
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="text-xs font-semibold text-muted uppercase tracking-wide">
                                                Headlines ({result.headlines.length})
                                            </h3>
                                            <button
                                                onClick={() => copyToClipboard(result.headlines!.join("\n"), "headlines")}
                                                className="text-xs text-muted hover:text-primary flex items-center gap-1"
                                            >
                                                {copiedField === "headlines" ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                                {copiedField === "headlines" ? "Copied!" : "Copy all"}
                                            </button>
                                        </div>
                                        <div className="space-y-1.5">
                                            {result.headlines.map((h, i) => (
                                                <div key={i} className="flex items-center justify-between bg-blue-50/50 px-3 py-1.5 rounded-lg">
                                                    <span className="text-sm">{h}</span>
                                                    <span className={`text-xs ${h.length > 30 ? "text-red-500 font-medium" : "text-muted"}`}>
                                                        {h.length}/30
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Descriptions */}
                                {result.descriptions && result.descriptions.length > 0 && (
                                    <div className="bg-card border border-border rounded-xl p-5">
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="text-xs font-semibold text-muted uppercase tracking-wide">
                                                Descriptions ({result.descriptions.length})
                                            </h3>
                                            <button
                                                onClick={() => copyToClipboard(result.descriptions!.join("\n"), "descriptions")}
                                                className="text-xs text-muted hover:text-primary flex items-center gap-1"
                                            >
                                                {copiedField === "descriptions" ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                                {copiedField === "descriptions" ? "Copied!" : "Copy all"}
                                            </button>
                                        </div>
                                        <div className="space-y-1.5">
                                            {result.descriptions.map((d, i) => (
                                                <div key={i} className="flex items-start justify-between bg-gray-50 px-3 py-2 rounded-lg">
                                                    <span className="text-sm flex-1">{d}</span>
                                                    <span className={`text-xs ml-2 shrink-0 ${d.length > 90 ? "text-red-500 font-medium" : "text-muted"}`}>
                                                        {d.length}/90
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Keywords */}
                                {result.keywords && result.keywords.length > 0 && (
                                    <div className="bg-card border border-border rounded-xl p-5">
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="text-xs font-semibold text-muted uppercase tracking-wide">
                                                Keywords ({result.keywords.length})
                                            </h3>
                                            <button
                                                onClick={() => copyToClipboard(result.keywords!.join(", "), "keywords")}
                                                className="text-xs text-muted hover:text-primary flex items-center gap-1"
                                            >
                                                {copiedField === "keywords" ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                                {copiedField === "keywords" ? "Copied!" : "Copy all"}
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {result.keywords.map((k, i) => (
                                                <span key={i} className="bg-green-50 text-green-700 px-2.5 py-1 rounded-lg text-xs">{k}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Negative Keywords */}
                                {result.negativeKeywords && result.negativeKeywords.length > 0 && (
                                    <div className="bg-card border border-border rounded-xl p-5">
                                        <h3 className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">
                                            Negative Keywords ({result.negativeKeywords.length})
                                        </h3>
                                        <div className="flex flex-wrap gap-1.5">
                                            {result.negativeKeywords.map((k, i) => (
                                                <span key={i} className="bg-red-50 text-red-600 px-2.5 py-1 rounded-lg text-xs">{k}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Extensions */}
                                {(result.sitelinks?.length || result.callouts?.length) && (
                                    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                                        <h3 className="text-xs font-semibold text-muted uppercase tracking-wide">Ad Extensions</h3>
                                        {result.sitelinks && result.sitelinks.length > 0 && (
                                            <div>
                                                <p className="text-xs font-medium mb-2">Sitelinks</p>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                    {result.sitelinks.map((sl, i) => (
                                                        <div key={i} className="bg-blue-50/50 px-3 py-2 rounded-lg">
                                                            <p className="text-sm font-medium text-blue-700">{sl.title}</p>
                                                            <p className="text-xs text-muted">{sl.description}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {result.callouts && result.callouts.length > 0 && (
                                            <div>
                                                <p className="text-xs font-medium mb-2">Callouts</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {result.callouts.map((c, i) => (
                                                        <span key={i} className="bg-purple-50 text-purple-700 px-2.5 py-1 rounded-lg text-xs">{c}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Strategy notes */}
                                {result.notes && (
                                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                                        <p className="text-xs font-semibold text-primary mb-1">Strategy Notes</p>
                                        <p className="text-sm text-muted">{result.notes}</p>
                                    </div>
                                )}
                            </>
                        )}

                        {result?.parseError && (
                            <div className="bg-card border border-border rounded-xl p-5">
                                <p className="text-sm whitespace-pre-wrap">{result.raw}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* POLICY CHECK MODE */}
            {policyMode && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left: Input */}
                    <div className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium mb-1.5">
                                Ad Copy to Check
                            </label>
                            <textarea
                                value={policyText}
                                onChange={e => setPolicyText(e.target.value)}
                                placeholder={"Paste your ad copy here — headlines and descriptions.\nOne per line.\n\nExample:\nBest Plumber in Town\nCall Now for Free Estimate!\nEmergency Service 24/7\nProfessional plumbing services for your home and business. Licensed & insured."}
                                rows={12}
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm resize-none"
                            />
                        </div>

                        <button
                            onClick={checkPolicy}
                            disabled={checkingPolicy || !policyText.trim()}
                            className="w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-medium transition disabled:opacity-50"
                        >
                            {checkingPolicy ? (
                                <><Loader2 className="w-5 h-5 animate-spin" /> Checking...</>
                            ) : (
                                <><Shield className="w-5 h-5" /> Check Compliance</>
                            )}
                        </button>
                    </div>

                    {/* Right: Results */}
                    <div className="space-y-4">
                        {!policyResult && !checkingPolicy && (
                            <div className="bg-card border border-border rounded-2xl p-12 text-center">
                                <Shield className="w-12 h-12 text-muted/30 mx-auto mb-4" />
                                <p className="text-muted text-sm">
                                    Paste your ad copy and click Check to analyze policy compliance
                                </p>
                            </div>
                        )}

                        {checkingPolicy && (
                            <div className="bg-card border border-border rounded-2xl p-12 text-center">
                                <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
                                <p className="text-sm font-medium">Analyzing compliance...</p>
                            </div>
                        )}

                        {policyResult && !policyResult.parseError && (
                            <>
                                {/* Compliance score */}
                                <div className={`border rounded-xl p-5 ${
                                    policyResult.compliant
                                        ? "bg-green-50 border-green-200"
                                        : "bg-red-50 border-red-200"
                                }`}>
                                    <div className="flex items-center gap-3">
                                        {policyResult.compliant ? (
                                            <CheckCircle2 className="w-8 h-8 text-green-600" />
                                        ) : (
                                            <XCircle className="w-8 h-8 text-red-600" />
                                        )}
                                        <div>
                                            <p className="font-bold text-lg">
                                                {policyResult.compliant ? "Compliant" : "Issues Found"}
                                            </p>
                                            <p className="text-sm text-muted">
                                                Score: {policyResult.score}/100
                                            </p>
                                        </div>
                                        <div className="ml-auto">
                                            <div className={`text-3xl font-bold ${
                                                (policyResult.score || 0) >= 80 ? "text-green-600" :
                                                (policyResult.score || 0) >= 50 ? "text-yellow-600" :
                                                "text-red-600"
                                            }`}>
                                                {policyResult.score}
                                            </div>
                                        </div>
                                    </div>
                                    {policyResult.summary && (
                                        <p className="mt-3 text-sm">{policyResult.summary}</p>
                                    )}
                                </div>

                                {/* Issues list */}
                                {policyResult.issues && policyResult.issues.length > 0 && (
                                    <div className="bg-card border border-border rounded-xl p-5 space-y-3">
                                        <h3 className="text-xs font-semibold text-muted uppercase tracking-wide">
                                            Issues ({policyResult.issues.length})
                                        </h3>
                                        {policyResult.issues.map((issue, i) => (
                                            <div key={i} className={`border rounded-lg p-3 ${
                                                issue.severity === "error" ? "border-red-200 bg-red-50/50" :
                                                issue.severity === "warning" ? "border-yellow-200 bg-yellow-50/50" :
                                                "border-blue-200 bg-blue-50/50"
                                            }`}>
                                                <div className="flex items-center gap-2 mb-1">
                                                    {issue.severity === "error" ? <XCircle className="w-4 h-4 text-red-500" /> :
                                                     issue.severity === "warning" ? <AlertTriangle className="w-4 h-4 text-yellow-500" /> :
                                                     <Info className="w-4 h-4 text-blue-500" />}
                                                    <span className="text-xs font-medium uppercase">{issue.severity}</span>
                                                    <span className="text-xs text-muted">— {issue.rule}</span>
                                                </div>
                                                <p className="text-sm">{issue.detail}</p>
                                                {issue.suggestion && (
                                                    <p className="text-xs text-muted mt-1">
                                                        <strong>Fix:</strong> {issue.suggestion}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}

                        {policyResult?.parseError && (
                            <div className="bg-card border border-border rounded-xl p-5">
                                <p className="text-sm whitespace-pre-wrap">{policyResult.raw}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
