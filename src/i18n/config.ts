/**
 * i18n Configuration — AdMaster Pro
 *
 * 12 supported languages. Cookie-based locale detection.
 * Browser language auto-detect with manual override.
 */

export type Locale =
    | "en" | "es" | "fr" | "de" | "it" | "pt" | "nl"
    | "sv" | "no" | "da" | "fi" | "pl";

export const DEFAULT_LOCALE: Locale = "en";

export interface LanguageConfig {
    code: Locale;
    name: string;         // Native name
    englishName: string;  // English name
    flag: string;         // Emoji flag
    dir: "ltr" | "rtl";
}

export const LANGUAGES: LanguageConfig[] = [
    { code: "en", name: "English", englishName: "English", flag: "🇬🇧", dir: "ltr" },
    { code: "es", name: "Español", englishName: "Spanish", flag: "🇪🇸", dir: "ltr" },
    { code: "fr", name: "Français", englishName: "French", flag: "🇫🇷", dir: "ltr" },
    { code: "de", name: "Deutsch", englishName: "German", flag: "🇩🇪", dir: "ltr" },
    { code: "it", name: "Italiano", englishName: "Italian", flag: "🇮🇹", dir: "ltr" },
    { code: "pt", name: "Português", englishName: "Portuguese", flag: "🇵🇹", dir: "ltr" },
    { code: "nl", name: "Nederlands", englishName: "Dutch", flag: "🇳🇱", dir: "ltr" },
    { code: "sv", name: "Svenska", englishName: "Swedish", flag: "🇸🇪", dir: "ltr" },
    { code: "no", name: "Norsk", englishName: "Norwegian", flag: "🇳🇴", dir: "ltr" },
    { code: "da", name: "Dansk", englishName: "Danish", flag: "🇩🇰", dir: "ltr" },
    { code: "fi", name: "Suomi", englishName: "Finnish", flag: "🇫🇮", dir: "ltr" },
    { code: "pl", name: "Polski", englishName: "Polish", flag: "🇵🇱", dir: "ltr" },
];

export const LOCALE_CODES = LANGUAGES.map(l => l.code);

/**
 * Detect user's preferred locale from browser.
 * Matches browser language to supported locales.
 */
export function detectBrowserLocale(): Locale {
    if (typeof navigator === "undefined") return DEFAULT_LOCALE;

    const browserLangs = navigator.languages || [navigator.language];

    for (const lang of browserLangs) {
        const code = lang.split("-")[0].toLowerCase() as Locale;
        if (LOCALE_CODES.includes(code)) return code;
    }

    return DEFAULT_LOCALE;
}

/**
 * Get locale from cookie, localStorage, or browser detection.
 */
export function getStoredLocale(): Locale {
    if (typeof window === "undefined") return DEFAULT_LOCALE;

    // 1. Check cookie
    const cookieMatch = document.cookie.match(/(?:^|;\s*)locale=([a-z]{2})/);
    if (cookieMatch && LOCALE_CODES.includes(cookieMatch[1] as Locale)) {
        return cookieMatch[1] as Locale;
    }

    // 2. Check localStorage
    try {
        const stored = localStorage.getItem("locale");
        if (stored && LOCALE_CODES.includes(stored as Locale)) {
            return stored as Locale;
        }
    } catch { /* SSR or privacy mode */ }

    // 3. Detect from browser
    return detectBrowserLocale();
}

/**
 * Persist locale choice to cookie + localStorage.
 */
export function setStoredLocale(locale: Locale): void {
    if (typeof window === "undefined") return;

    // Set cookie (1 year, accessible by middleware too)
    document.cookie = `locale=${locale};path=/;max-age=31536000;samesite=lax`;

    // Also in localStorage for faster client reads
    try {
        localStorage.setItem("locale", locale);
    } catch { /* privacy mode */ }
}

/**
 * Get display name for a locale.
 */
export function getLanguageName(code: Locale): string {
    return LANGUAGES.find(l => l.code === code)?.name || code;
}

/**
 * Get the flag emoji for a locale.
 */
export function getLanguageFlag(code: Locale): string {
    return LANGUAGES.find(l => l.code === code)?.flag || "🌐";
}
