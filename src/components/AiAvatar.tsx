"use client";

import { Sparkles, User } from "lucide-react";

/**
 * AI Avatar — inline SVG, no external dependency.
 * Replaces the broken dicebear external image.
 */
export function AiAvatar({ size = "md" }: { size?: "sm" | "md" }) {
    const cls = size === "sm" ? "w-7 h-7 sm:w-8 sm:h-8" : "w-8 h-8 sm:w-10 sm:h-10";
    return (
        <div className={`${cls} rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0`}>
            <Sparkles className={size === "sm" ? "w-3.5 h-3.5 text-white" : "w-4 h-4 sm:w-5 sm:h-5 text-white"} />
        </div>
    );
}

/**
 * User Avatar — simple initials or user icon.
 */
export function UserAvatar({ size = "sm" }: { size?: "sm" | "md" }) {
    const cls = size === "sm" ? "w-7 h-7 sm:w-8 sm:h-8" : "w-8 h-8 sm:w-10 sm:h-10";
    return (
        <div className={`${cls} rounded-lg bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700 flex items-center justify-center shrink-0`}>
            <User className="w-3.5 h-3.5 text-slate-500 dark:text-slate-300" />
        </div>
    );
}
