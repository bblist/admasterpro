#!/usr/bin/env python3
"""Rewrite business-context.tsx to use real data from API."""

content = '''"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { authFetch } from "@/lib/auth-client";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface BusinessProfile {
    id: string;
    name: string;
    industry: string;
    website: string | null;
    googleAdsId: string | null;
    initials: string;
    color: string;
}

interface BusinessContextValue {
    businesses: BusinessProfile[];
    activeBusiness: BusinessProfile | null;
    setActiveBusiness: (id: string) => void;
    addBusiness: (name: string, website?: string, industry?: string) => Promise<BusinessProfile | null>;
    refreshBusinesses: () => Promise<void>;
    loading: boolean;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
    return name
        .split(/\\s+/)
        .map(w => w[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase();
}

const COLORS = [
    "from-blue-500 to-blue-700",
    "from-teal-500 to-blue-600",
    "from-amber-500 to-red-600",
    "from-gray-700 to-gray-900",
    "from-pink-500 to-purple-600",
    "from-green-500 to-emerald-700",
    "from-indigo-500 to-violet-700",
    "from-orange-500 to-red-500",
];

function getColor(index: number): string {
    return COLORS[index % COLORS.length];
}

// ─── Default Business (when no businesses exist) ────────────────────────────

const DEFAULT_BUSINESS: BusinessProfile = {
    id: "default",
    name: "My Business",
    industry: "",
    website: null,
    googleAdsId: null,
    initials: "MB",
    color: "from-blue-500 to-blue-700",
};

// ─── Context ────────────────────────────────────────────────────────────────

const BusinessContext = createContext<BusinessContextValue | null>(null);

export function BusinessProvider({ children }: { children: ReactNode }) {
    const [businesses, setBusinesses] = useState<BusinessProfile[]>([]);
    const [activeId, setActiveId] = useState<string>("");
    const [loading, setLoading] = useState(true);

    const fetchBusinesses = useCallback(async () => {
        try {
            const res = await authFetch("/api/businesses");
            if (!res.ok) {
                setBusinesses([]);
                return;
            }
            const data = await res.json();
            const biz: BusinessProfile[] = (data.businesses || []).map(
                (b: { id: string; name: string; industry?: string; website?: string; googleAdsId?: string }, i: number) => ({
                    id: b.id,
                    name: b.name,
                    industry: b.industry || "",
                    website: b.website || null,
                    googleAdsId: b.googleAdsId || null,
                    initials: getInitials(b.name),
                    color: getColor(i),
                })
            );
            setBusinesses(biz);
            // If no active business set, or active doesn\\u2019t exist, use first
            if (biz.length > 0 && (!activeId || !biz.find(b => b.id === activeId))) {
                setActiveId(biz[0].id);
            }
        } catch {
            setBusinesses([]);
        } finally {
            setLoading(false);
        }
    }, [activeId]);

    useEffect(() => {
        fetchBusinesses();
    }, [fetchBusinesses]);

    const activeBusiness = businesses.find(b => b.id === activeId) || (businesses.length > 0 ? businesses[0] : DEFAULT_BUSINESS);

    const setActiveBusiness = useCallback((id: string) => {
        setActiveId(id);
        // Persist in localStorage
        try { localStorage.setItem("admasterpro-active-business", id); } catch {}
    }, []);

    const addBusiness = useCallback(async (name: string, website?: string, industry?: string): Promise<BusinessProfile | null> => {
        try {
            const res = await authFetch("/api/businesses", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, website, industry }),
            });
            if (!res.ok) return null;
            const data = await res.json();
            const newBiz: BusinessProfile = {
                id: data.business.id,
                name: data.business.name,
                industry: data.business.industry || "",
                website: data.business.website || null,
                googleAdsId: data.business.googleAdsId || null,
                initials: getInitials(data.business.name),
                color: getColor(businesses.length),
            };
            setBusinesses(prev => [...prev, newBiz]);
            setActiveId(newBiz.id);
            return newBiz;
        } catch {
            return null;
        }
    }, [businesses.length]);

    const refreshBusinesses = useCallback(async () => {
        await fetchBusinesses();
    }, [fetchBusinesses]);

    // Restore active business from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem("admasterpro-active-business");
            if (stored) setActiveId(stored);
        } catch {}
    }, []);

    return (
        <BusinessContext.Provider
            value={{
                businesses,
                activeBusiness,
                setActiveBusiness,
                addBusiness,
                refreshBusinesses,
                loading,
            }}
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
'''

with open('/Users/bblist/admasterpro/src/lib/business-context.tsx', 'w') as f:
    f.write(content)

print("Business context rewritten successfully")
