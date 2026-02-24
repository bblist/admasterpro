"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface BusinessProfile {
    id: string;
    name: string;
    industry: string;
    shortDesc: string;
    color: string;        // Tailwind gradient for avatar
    initials: string;
    url: string;
    services: string[];   // Key services / products for NLP matching
    location: string;
    kbStatus: "trained" | "training" | "empty";
    brandVoice: string;
    avoidTopics: string;
    competitors: string[];
}

interface BusinessContextValue {
    businesses: BusinessProfile[];
    activeBusiness: BusinessProfile;
    setActiveBusiness: (id: string) => void;
    isOwnBusiness: (text: string) => boolean;
    getOffTopicBusiness: (text: string) => BusinessProfile | null;
}

// ─── Demo Businesses (from Knowledge Base) ──────────────────────────────────

const BUSINESSES: BusinessProfile[] = [
    {
        id: "mikes-plumbing",
        name: "Mike\u2019s Plumbing",
        industry: "Home Services / Plumbing",
        shortDesc: "24/7 emergency plumbing, Miami-Dade",
        color: "from-blue-500 to-blue-700",
        initials: "MP",
        url: "mikesplumbing305.com",
        services: ["plumbing", "drain cleaning", "water heater", "pipe repair", "emergency plumber", "leak detection", "bathroom remodeling", "sewer"],
        location: "Miami-Dade County",
        kbStatus: "trained",
        brandVoice: "Friendly, trustworthy, urgent when needed. Emphasize speed, reliability, and local expertise.",
        avoidTopics: "Don\u2019t promise exact arrival times. Don\u2019t badmouth competitors by name.",
        competitors: ["Roto-Rooter", "Mr. Rooter", "ARS Rescue Rooter"],
    },
    {
        id: "clearvision",
        name: "ClearVision Eye Clinic",
        industry: "Healthcare / Ophthalmology",
        shortDesc: "LASIK & vision correction, Miami",
        color: "from-teal-500 to-blue-600",
        initials: "CV",
        url: "clearvisionmiami.com",
        services: ["LASIK", "PRK", "cataract surgery", "eye exam", "vision correction", "ophthalmology", "eye clinic"],
        location: "Downtown Miami",
        kbStatus: "trained",
        brandVoice: "Professional, compassionate, reassuring. Avoid overly clinical jargon.",
        avoidTopics: "Never guarantee outcomes. Don\u2019t use \u2018cheap\u2019 or \u2018discount\u2019. Always include medical disclaimer.",
        competitors: ["LensCrafters", "Bascom Palmer", "Miami Eye Institute"],
    },
    {
        id: "sakura-sushi",
        name: "Sakura Sushi Bar",
        industry: "Restaurant / Japanese Cuisine",
        shortDesc: "Premium sushi & omakase, Miami",
        color: "from-amber-500 to-red-600",
        initials: "SS",
        url: "sakurasushibar.com",
        services: ["sushi", "omakase", "Japanese food", "sake", "catering", "takeout", "restaurant"],
        location: "Miami",
        kbStatus: "training",
        brandVoice: "Elegant, warm, food-focused. Emphasize freshness, craftsmanship, and experience.",
        avoidTopics: "Don\u2019t use \u2018cheap\u2019. Don\u2019t compare to fast-food sushi.",
        competitors: ["Nobu", "Zuma", "Matsuri"],
    },
    {
        id: "pinnacle-auto",
        name: "Pinnacle Auto Spa",
        industry: "Automotive / Detailing",
        shortDesc: "Ceramic coating & detailing, South Beach",
        color: "from-gray-700 to-gray-900",
        initials: "PA",
        url: "pinnacleautospa.com",
        services: ["auto detailing", "ceramic coating", "car wash", "paint protection", "interior cleaning", "VIP membership"],
        location: "South Beach",
        kbStatus: "empty",
        brandVoice: "Premium, confident, results-driven. Emphasize quality and exclusivity.",
        avoidTopics: "Don\u2019t use \u2018budget\u2019 or \u2018cheap\u2019. Position as luxury only.",
        competitors: ["DetailXPerts", "Mister Car Wash"],
    },
    {
        id: "bella-fashion",
        name: "Bella Fashion Boutique",
        industry: "Retail / Fashion",
        shortDesc: "Designer fashion & accessories, Miami",
        color: "from-pink-500 to-purple-600",
        initials: "BF",
        url: "bellafashionmiami.com",
        services: ["fashion", "boutique", "handbags", "designer", "clothing", "accessories", "shopping", "women\u2019s fashion"],
        location: "Miami",
        kbStatus: "trained",
        brandVoice: "Trendy, aspirational, inclusive. Speak to style-conscious women 25-45.",
        avoidTopics: "Don\u2019t use \u2018knockoff\u2019 or \u2018replica\u2019. Don\u2019t reference competitor brands.",
        competitors: ["Nordstrom", "Saks Fifth Avenue", "Bloomingdale\u2019s"],
    },
];

// ─── Context ────────────────────────────────────────────────────────────────

const BusinessContext = createContext<BusinessContextValue | null>(null);

export function BusinessProvider({ children }: { children: ReactNode }) {
    const [activeId, setActiveId] = useState(BUSINESSES[0].id);

    const activeBusiness = BUSINESSES.find((b) => b.id === activeId) || BUSINESSES[0];

    const setActiveBusiness = useCallback((id: string) => {
        setActiveId(id);
    }, []);

    /** Check if the user input is talking about the current active business */
    const isOwnBusiness = useCallback(
        (text: string): boolean => {
            const t = text.toLowerCase();
            // Check if it matches active business name, services, or industry keywords
            const nameWords = activeBusiness.name.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/);
            if (nameWords.some((w) => w.length > 2 && t.includes(w))) return true;
            if (activeBusiness.services.some((s) => t.includes(s.toLowerCase()))) return true;
            return false;
        },
        [activeBusiness]
    );

    /** Check if the user is trying to create ads for a DIFFERENT known business */
    const getOffTopicBusiness = useCallback(
        (text: string): BusinessProfile | null => {
            const t = text.toLowerCase();

            // Only check when user is asking to create/write/make something
            const isCreativeRequest = /\b(create|write|make|generate|draft|design|build)\b.*\b(ads?|copy|banner|campaign|display)\b/i.test(t) ||
                /\b(ads?|copy|banner|campaign)\b.*\b(for|about)\b/i.test(t);

            if (!isCreativeRequest) return null;

            // Check if it mentions another business by name
            for (const biz of BUSINESSES) {
                if (biz.id === activeId) continue;

                const bizName = biz.name.toLowerCase().replace(/[^\w\s]/g, "");
                const nameWords = bizName.split(/\s+/).filter((w) => w.length > 2);

                // Exact business name match
                if (t.includes(bizName)) return biz;
                // Partial name match (e.g., "sakura", "clearvision", "pinnacle", "bella")
                if (nameWords.some((w) => w.length > 4 && t.includes(w))) return biz;

                // Industry-specific service match when used with "for [business type]"
                const forMatch = t.match(/(?:for|about)\s+(?:a\s+|an\s+|the\s+|my\s+)?(.+?)(?:\s*$|\s*with|\s*using|\s*campaign|\s*ad)/);
                if (forMatch) {
                    const topic = forMatch[1].toLowerCase().trim();
                    // Check if the topic matches another business's unique services but NOT the active one
                    const matchesOther = biz.services.some((s) => topic.includes(s.toLowerCase()));
                    const matchesActive = activeBusiness.services.some((s) => topic.includes(s.toLowerCase()));
                    if (matchesOther && !matchesActive) return biz;
                }
            }

            // Check for clearly unrelated industries (not matching any known business)
            const forMatch = t.match(/(?:for|about)\s+(?:a\s+|an\s+|the\s+|my\s+)?(.+?)(?:\s*$|\s*with|\s*using|\s*campaign|\s*ad)/);
            if (forMatch) {
                const topic = forMatch[1].toLowerCase().trim();
                // If the topic doesn't match ANY service of the active business, it's off-topic
                const matchesActive = activeBusiness.services.some((s) => topic.includes(s.toLowerCase()));
                const isGeneric = /\b(top service|my business|our products?|our services?|something cool|anything|new)\b/i.test(topic);
                if (!matchesActive && !isGeneric && topic.length > 3) {
                    // Return null but let the chat layer handle the "unrelated topic" case
                    return null; // Will be handled as a soft guard in the chat
                }
            }

            return null;
        },
        [activeId, activeBusiness]
    );

    return (
        <BusinessContext.Provider
            value={{ businesses: BUSINESSES, activeBusiness, setActiveBusiness, isOwnBusiness, getOffTopicBusiness }}
        >
            {children}
        </BusinessContext.Provider>
    );
}

export function useBusiness() {
    const ctx = useContext(BusinessContext);
    if (!ctx) throw new Error("useBusiness must be used within BusinessProvider");
    return ctx;
}
