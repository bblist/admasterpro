"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslation } from "@/i18n/context";
import { Globe } from "lucide-react";

interface LanguageSwitcherProps {
    /** Compact mode for top bar / mobile */
    compact?: boolean;
    /** Show in sidebar style */
    variant?: "sidebar" | "topbar" | "settings";
}

export default function LanguageSwitcher({ compact = false, variant = "topbar" }: LanguageSwitcherProps) {
    const { locale, setLocale, languages } = useTranslation();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const currentLang = languages.find(l => l.code === locale);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    if (variant === "settings") {
        return (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {languages.map((lang) => (
                    <button
                        key={lang.code}
                        onClick={() => setLocale(lang.code)}
                        className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition text-center ${locale === lang.code
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border hover:border-primary/30 hover:bg-border/30"
                            }`}
                    >
                        <span className="text-xl">{lang.flag}</span>
                        <span className="text-xs font-medium truncate w-full">{lang.name}</span>
                        <span className="text-[10px] text-muted truncate w-full">{lang.englishName}</span>
                    </button>
                ))}
            </div>
        );
    }

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen(!open)}
                className={`flex items-center gap-1.5 transition ${variant === "sidebar"
                        ? "w-full px-3 py-2.5 rounded-lg text-sm text-muted hover:bg-border/50 hover:text-foreground"
                        : "p-2 text-muted hover:text-foreground"
                    }`}
                title={currentLang?.name || "Language"}
            >
                {variant === "sidebar" ? (
                    <>
                        <Globe className="w-4 h-4" />
                        <span className="flex-1 text-left">{currentLang?.flag} {currentLang?.name}</span>
                    </>
                ) : compact ? (
                    <span className="text-lg">{currentLang?.flag}</span>
                ) : (
                    <>
                        <Globe className="w-4.5 h-4.5" />
                        <span className="text-sm hidden sm:inline">{currentLang?.flag} {currentLang?.name}</span>
                        <span className="text-sm sm:hidden">{currentLang?.flag}</span>
                    </>
                )}
            </button>

            {open && (
                <div className={`absolute z-50 bg-card border border-border rounded-xl shadow-xl py-1 max-h-80 overflow-y-auto ${variant === "sidebar"
                        ? "left-0 right-0 bottom-full mb-1"
                        : "right-0 top-full mt-1 w-52"
                    }`}>
                    <div className="px-3 py-1.5 text-[10px] font-semibold text-muted uppercase tracking-wider">
                        Language
                    </div>
                    {languages.map((lang) => {
                        const isActive = lang.code === locale;
                        return (
                            <button
                                key={lang.code}
                                onClick={() => {
                                    setLocale(lang.code);
                                    setOpen(false);
                                }}
                                className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm transition ${isActive ? "bg-primary/10 text-primary font-medium" : "hover:bg-border/50"
                                    }`}
                            >
                                <span className="text-base">{lang.flag}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="truncate">{lang.name}</div>
                                    <div className="text-[10px] text-muted">{lang.englishName}</div>
                                </div>
                                {isActive && (
                                    <svg className="w-4 h-4 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
