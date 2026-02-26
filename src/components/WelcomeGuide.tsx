"use client";

import { useState, useEffect, useCallback } from "react";
import {
    X,
    ArrowRight,
    ArrowLeft,
    Globe,
    Building2,
    Sparkles,
    FileText,
    Upload,
    MessageSquare,
    BarChart3,
    Zap,
    CheckCircle,
    Rocket,
} from "lucide-react";

const GUIDE_DISMISSED_KEY = "admasterpro_guide_dismissed";

interface WelcomeGuideProps {
    /** Force-open even if previously dismissed (for "View Guide" link) */
    forceOpen?: boolean;
    onClose?: () => void;
}

const SLIDES = [
    {
        id: "welcome",
        icon: Zap,
        iconBg: "bg-indigo-100",
        iconColor: "text-indigo-600",
        title: "Welcome to AdMaster Pro",
        subtitle: "Your AI-powered Google Ads assistant",
        description:
            "We help you create high-converting ads, optimize your budget, and grow your business — all from one dashboard. Let us show you how it works.",
        visual: (
            <div className="grid grid-cols-3 gap-3 mt-4">
                {[
                    { icon: MessageSquare, label: "AI Chat", color: "bg-blue-50 text-blue-600" },
                    { icon: BarChart3, label: "Analytics", color: "bg-emerald-50 text-emerald-600" },
                    { icon: FileText, label: "Ad Copy", color: "bg-amber-50 text-amber-600" },
                ].map((f) => (
                    <div key={f.label} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-50 border border-gray-100">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${f.color}`}>
                            <f.icon className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-medium text-gray-600">{f.label}</span>
                    </div>
                ))}
            </div>
        ),
    },
    {
        id: "step1",
        icon: Globe,
        iconBg: "bg-blue-100",
        iconColor: "text-blue-600",
        title: "Step 1: Create Your Account",
        subtitle: "Quick sign-in with Google",
        description:
            "Sign in securely with your Google account. If you have Google Ads, we can connect to it to read your campaign data — we never change anything without your permission.",
        visual: (
            <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-white rounded-lg border flex items-center justify-center shadow-sm">
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-900">Continue with Google</p>
                        <p className="text-xs text-gray-500">Safe, secure, 1-click sign-in</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-emerald-600">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Read-only access — we never modify your account</span>
                </div>
            </div>
        ),
    },
    {
        id: "step2",
        icon: Building2,
        iconBg: "bg-violet-100",
        iconColor: "text-violet-600",
        title: "Step 2: Tell Us About Your Business",
        subtitle: "Name, website URL, and industry",
        description:
            "Enter your business name and website. We'll use this to scan your site and learn about your products, services, and brand — so the AI writes ads that actually sound like you.",
        visual: (
            <div className="mt-4 space-y-2.5">
                {[
                    { label: "Business Name", value: "Bella's Dental Clinic", required: true },
                    { label: "Website URL", value: "bellasdentalclinic.com", required: true },
                    { label: "Industry", value: "Dentist", required: false },
                ].map((f) => (
                    <div key={f.label} className="bg-gray-50 rounded-lg border border-gray-100 px-4 py-2.5">
                        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-0.5">
                            {f.label} {f.required && <span className="text-red-400">*</span>}
                        </p>
                        <p className="text-sm text-gray-700">{f.value}</p>
                    </div>
                ))}
            </div>
        ),
    },
    {
        id: "step3",
        icon: Sparkles,
        iconBg: "bg-amber-100",
        iconColor: "text-amber-600",
        title: "Step 3: We Scan Your Website",
        subtitle: "AI reads your pages automatically",
        description:
            "Our crawler visits your website and reads every page — product listings, service pages, about page, everything. This content goes into your Knowledge Base so the AI can reference it when writing ads.",
        visual: (
            <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="space-y-2.5">
                    {["Home Page", "Services — Cosmetic Dentistry", "About Us — Caring For Smiles Since 2005"].map((page, i) => (
                        <div key={i} className="flex items-center gap-2.5">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${i < 2 ? "bg-emerald-100" : "bg-indigo-100"}`}>
                                {i < 2 ? (
                                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                                ) : (
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                                )}
                            </div>
                            <span className="text-sm text-gray-700">{page}</span>
                        </div>
                    ))}
                </div>
                <div className="mt-3 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: "72%" }} />
                </div>
                <p className="text-[10px] text-gray-400 mt-1.5 text-right">72% scanned</p>
            </div>
        ),
    },
    {
        id: "step4",
        icon: FileText,
        iconBg: "bg-teal-100",
        iconColor: "text-teal-600",
        title: "Step 4: Add Extra Details",
        subtitle: "Optional — but it helps a lot",
        description:
            "Share anything extra: current promotions, your target audience, what makes you unique, competitor info. The more context the AI has, the better your ads will be. You can always skip this and add it later.",
        visual: (
            <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="bg-white border border-gray-200 rounded-lg p-3 text-xs text-gray-500 leading-relaxed italic">
                    &ldquo;We&apos;re running a 20% off teeth whitening special this month. Our patients are professionals aged 25-50 in Kingston. We offer same-day appointments…&rdquo;
                </div>
                <div className="flex items-center gap-1.5 mt-2.5 text-xs text-gray-400">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    This gets saved to your Knowledge Base
                </div>
            </div>
        ),
    },
    {
        id: "step5",
        icon: Upload,
        iconBg: "bg-pink-100",
        iconColor: "text-pink-600",
        title: "Step 5: Upload Creatives",
        subtitle: "Banners, logos, product photos",
        description:
            "Upload any existing ad banners, your logo, or product photos. The AI uses these for display ad recommendations. This is optional — you can always add them from the Knowledge Base later.",
        visual: (
            <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-center">
                <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-500 font-medium">Drop files here or click to browse</p>
                <p className="text-[10px] text-gray-400 mt-1">JPG, PNG, GIF, WebP — up to 10 MB each</p>
                <div className="flex justify-center gap-4 mt-3">
                    {["logo.png", "banner-summer.jpg"].map((f) => (
                        <div key={f} className="flex items-center gap-1 text-[10px] text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                            <CheckCircle className="w-3 h-3" />
                            {f}
                        </div>
                    ))}
                </div>
            </div>
        ),
    },
    {
        id: "ready",
        icon: Rocket,
        iconBg: "bg-emerald-100",
        iconColor: "text-emerald-600",
        title: "You're All Set!",
        subtitle: "Start chatting with your AI assistant",
        description:
            "Once onboarding is complete, you'll land in the AI Chat. Ask it to write ads, analyze your campaigns, find budget leaks, or generate keyword ideas — it already knows your business.",
        visual: (
            <div className="mt-4 grid grid-cols-2 gap-2.5">
                {[
                    { text: "Write me 5 headlines for my summer sale", color: "bg-blue-50 border-blue-100 text-blue-700" },
                    { text: "What's wasting money in my campaigns?", color: "bg-amber-50 border-amber-100 text-amber-700" },
                    { text: "Suggest negative keywords for my clinic", color: "bg-violet-50 border-violet-100 text-violet-700" },
                    { text: "Create a display ad for teeth whitening", color: "bg-emerald-50 border-emerald-100 text-emerald-700" },
                ].map((q) => (
                    <div key={q.text} className={`text-[11px] leading-relaxed p-2.5 rounded-lg border ${q.color}`}>
                        {q.text}
                    </div>
                ))}
            </div>
        ),
    },
];

export default function WelcomeGuide({ forceOpen = false, onClose }: WelcomeGuideProps) {
    const [open, setOpen] = useState(false);
    const [slide, setSlide] = useState(0);
    const [exiting, setExiting] = useState(false);

    useEffect(() => {
        if (forceOpen) {
            setOpen(true);
            setSlide(0);
            return;
        }
        // Show only once per device
        const dismissed = localStorage.getItem(GUIDE_DISMISSED_KEY);
        if (!dismissed) {
            setOpen(true);
        }
    }, [forceOpen]);

    const dismiss = useCallback(() => {
        setExiting(true);
        setTimeout(() => {
            setOpen(false);
            setExiting(false);
            localStorage.setItem(GUIDE_DISMISSED_KEY, "1");
            onClose?.();
        }, 200);
    }, [onClose]);

    const next = () => {
        if (slide < SLIDES.length - 1) setSlide((s) => s + 1);
        else dismiss();
    };
    const prev = () => { if (slide > 0) setSlide((s) => s - 1); };

    if (!open) return null;

    const s = SLIDES[slide];
    const isLast = slide === SLIDES.length - 1;
    const Icon = s.icon;

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm transition-opacity duration-200 ${exiting ? "opacity-0" : "opacity-100"}`}
                onClick={dismiss}
            />

            {/* Modal */}
            <div
                className={`fixed inset-0 z-[101] flex items-center justify-center p-4 transition-all duration-200 ${
                    exiting ? "opacity-0 scale-95" : "opacity-100 scale-100"
                }`}
            >
                <div
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Close button */}
                    <button
                        onClick={dismiss}
                        className="absolute top-2 right-2 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition"
                        aria-label="Close guide"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    {/* Slide indicator dots */}
                    <div className="flex justify-center gap-1.5 pt-5 px-12">
                        {SLIDES.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setSlide(i)}
                                className={`h-1.5 rounded-full transition-all duration-300 ${
                                    i === slide ? "w-6 bg-indigo-500" : "w-1.5 bg-gray-200 hover:bg-gray-300"
                                }`}
                                aria-label={`Go to slide ${i + 1}`}
                            />
                        ))}
                    </div>

                    {/* Content */}
                    <div className="px-6 pt-5 pb-6">
                        {/* Icon — skip for welcome slide */}
                        {s.id !== "welcome" && (
                            <div className="flex justify-center mb-4">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${s.iconBg}`}>
                                    <Icon className={`w-7 h-7 ${s.iconColor}`} />
                                </div>
                            </div>
                        )}

                        {/* Text */}
                        <h2 className="text-xl font-bold text-gray-900 text-center mb-1">{s.title}</h2>
                        <p className="text-sm font-medium text-indigo-500 text-center mb-3">{s.subtitle}</p>
                        <p className="text-sm text-gray-500 text-center leading-relaxed">{s.description}</p>

                        {/* Visual */}
                        {s.visual}
                    </div>

                    {/* Footer */}
                    <div className="px-6 pb-6 flex items-center justify-between">
                        <div>
                            {slide > 0 ? (
                                <button
                                    onClick={prev}
                                    className="text-sm text-gray-500 hover:text-gray-700 transition flex items-center gap-1"
                                >
                                    <ArrowLeft className="w-3.5 h-3.5" /> Back
                                </button>
                            ) : (
                                <button
                                    onClick={dismiss}
                                    className="text-sm text-gray-400 hover:text-gray-600 transition"
                                >
                                    Skip tour
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-400">{slide + 1}/{SLIDES.length}</span>
                            <button
                                onClick={next}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition inline-flex items-center gap-1.5 shadow-sm"
                            >
                                {isLast ? "Let's Go!" : "Next"}
                                {!isLast && <ArrowRight className="w-3.5 h-3.5" />}
                                {isLast && <Rocket className="w-3.5 h-3.5" />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
