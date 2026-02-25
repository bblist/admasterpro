"use client";

/**
 * i18n Translation Context — AdMaster Pro
 *
 * Provides:
 * - t(key) — translate a key, with optional interpolation
 * - locale — current locale code
 * - setLocale — change language
 * - languages — all supported languages
 *
 * Falls back to English if a key isn't translated.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { Locale, DEFAULT_LOCALE, LANGUAGES, LanguageConfig, getStoredLocale, setStoredLocale } from "./config";
import type { Messages } from "./messages/en";

interface I18nContextValue {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: (key: string, params?: Record<string, string | number>) => string;
    languages: LanguageConfig[];
}

const I18nContext = createContext<I18nContextValue | null>(null);

// Lazy-load message modules
const messageLoaders: Record<Locale, () => Promise<{ default: Messages }>> = {
    en: () => import("./messages/en"),
    es: () => import("./messages/es"),
    fr: () => import("./messages/fr"),
    de: () => import("./messages/de"),
    it: () => import("./messages/it"),
    pt: () => import("./messages/pt"),
    nl: () => import("./messages/nl"),
    sv: () => import("./messages/sv"),
    no: () => import("./messages/no"),
    da: () => import("./messages/da"),
    fi: () => import("./messages/fi"),
    pl: () => import("./messages/pl"),
};

// Cache loaded messages
const messageCache: Partial<Record<Locale, Messages>> = {};

export function I18nProvider({ children }: { children: React.ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
    const [messages, setMessages] = useState<Messages>({});
    const [enMessages, setEnMessages] = useState<Messages>({});

    // Load English as fallback on mount
    useEffect(() => {
        messageLoaders.en().then(mod => {
            const msgs = mod.default;
            messageCache.en = msgs;
            setEnMessages(msgs);
        });
    }, []);

    // Detect locale on mount (client-side only)
    useEffect(() => {
        const detected = getStoredLocale();
        setLocaleState(detected);
    }, []);

    // Load messages when locale changes
    useEffect(() => {
        if (messageCache[locale]) {
            setMessages(messageCache[locale]!);
            return;
        }
        const loader = messageLoaders[locale];
        if (loader) {
            loader().then(mod => {
                const msgs = mod.default;
                messageCache[locale] = msgs;
                setMessages(msgs);
            });
        }
    }, [locale]);

    // Update html lang attribute
    useEffect(() => {
        document.documentElement.lang = locale;
    }, [locale]);

    const setLocale = useCallback((newLocale: Locale) => {
        setStoredLocale(newLocale);
        setLocaleState(newLocale);
    }, []);

    /**
     * Translate a key with optional parameter interpolation.
     * Falls back to English, then to the key itself.
     *
     * Usage:
     *   t("nav.pricing")  → "Pricing"
     *   t("chat.greeting", { name: "Mike" })  → "Hey Mike! I'm your AI assistant."
     */
    const t = useCallback((key: string, params?: Record<string, string | number>): string => {
        let value = messages[key] || enMessages[key] || key;

        // Interpolate {param} placeholders
        if (params) {
            for (const [k, v] of Object.entries(params)) {
                value = value.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
            }
        }

        return value;
    }, [messages, enMessages]);

    const contextValue = useMemo(() => ({
        locale,
        setLocale,
        t,
        languages: LANGUAGES,
    }), [locale, setLocale, t]);

    return (
        <I18nContext.Provider value={contextValue}>
            {children}
        </I18nContext.Provider>
    );
}

/**
 * Hook to access translations.
 *
 * const { t, locale, setLocale } = useTranslation();
 * <h1>{t("landing.hero.title")}</h1>
 */
export function useTranslation() {
    const ctx = useContext(I18nContext);
    if (!ctx) {
        // Return a passthrough for SSR or when provider is missing
        return {
            locale: DEFAULT_LOCALE as Locale,
            setLocale: () => { },
            t: (key: string) => key,
            languages: LANGUAGES,
        };
    }
    return ctx;
}
