"use client";

import { useBusiness } from "@/lib/business-context";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  BookOpen,
  Plug,
  ArrowRight,
  Sparkles,
} from "lucide-react";

// ─── Prerequisite definitions ────────────────────────────────────────────

export type Prereq =
  | "google_ads"      // User must connect Google Ads
  | "business_info"   // User must add business info (onboarding)
  | "knowledge_base"; // User must add KB content (≥1 item)

interface PrereqMeta {
  key: Prereq;
  label: string;
  desc: string;
  action: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const PREREQ_META: Record<Prereq, PrereqMeta> = {
  google_ads: {
    key: "google_ads",
    label: "Connect Google Ads",
    desc: "Link your Google Ads account so the AI can access your campaigns, keywords, and performance data.",
    action: "Connect Account",
    href: "/onboarding",
    icon: Plug,
  },
  business_info: {
    key: "business_info",
    label: "Add Business Info",
    desc: "Complete onboarding with your business name, industry, and website so the AI can tailor recommendations.",
    action: "Go to Onboarding",
    href: "/onboarding",
    icon: Sparkles,
  },
  knowledge_base: {
    key: "knowledge_base",
    label: "Add Knowledge Base Content",
    desc: "Upload brand assets, describe your services, or crawl your website — this trains the AI on your business.",
    action: "Open Knowledge Base",
    href: "/dashboard/knowledge-base",
    icon: BookOpen,
  },
};

// ─── Check which prereqs are missing ─────────────────────────────────────

function useMissingPrereqs(needed: Prereq[]): { missing: Prereq[]; completed: Prereq[]; allDone: boolean } {
  const { activeBusiness } = useBusiness();

  const check = (p: Prereq): boolean => {
    switch (p) {
      case "google_ads":
        return !!activeBusiness?.googleAdsId;
      case "business_info":
        return !!activeBusiness && activeBusiness.id !== "default" && !!activeBusiness.name && activeBusiness.name !== "My Business";
      case "knowledge_base":
        return activeBusiness?.kbStatus === "has-content";
      default:
        return false;
    }
  };

  const missing = needed.filter((p) => !check(p));
  const completed = needed.filter((p) => check(p));

  return { missing, completed, allDone: missing.length === 0 };
}

// ─── The Banner Component ────────────────────────────────────────────────

interface SetupChecklistProps {
  /** Which prerequisites this page needs */
  prereqs: Prereq[];
  /** Page-specific context for the banner headline */
  pageContext: string;
  /** Whether to block the page content or just show an advisory banner */
  mode?: "blocking" | "advisory";
}

/**
 * Shows a contextual setup checklist banner when prerequisites are incomplete.
 *
 * - **blocking**: Replaces page content entirely — user can't proceed.
 * - **advisory**: Shows a dismissible banner above the page content.
 *
 * Returns `null` when all prerequisites are met.
 */
export default function SetupChecklist({ prereqs, pageContext, mode = "advisory" }: SetupChecklistProps) {
  const { missing, completed } = useMissingPrereqs(prereqs);

  if (missing.length === 0) return null;

  const total = prereqs.length;
  const done = completed.length;

  if (mode === "blocking") {
    return (
      <div className="bg-card border border-border rounded-2xl p-10 text-center max-w-xl mx-auto">
        <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8 text-amber-600" />
        </div>
        <h2 className="text-xl font-bold mb-2">Setup Required</h2>
        <p className="text-muted text-sm max-w-md mx-auto mb-6">
          {pageContext}. Complete the steps below to get started.
        </p>

        <div className="space-y-3 text-left max-w-sm mx-auto mb-8">
          {prereqs.map((p) => {
            const meta = PREREQ_META[p];
            const isDone = completed.includes(p);
            return (
              <div
                key={p}
                className={`flex items-center gap-3 p-3 rounded-xl border transition ${
                  isDone
                    ? "bg-green-50 border-green-200"
                    : "bg-amber-50 border-amber-200"
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-amber-400 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${isDone ? "text-green-700 line-through" : "text-amber-900"}`}>
                    {meta.label}
                  </p>
                  {!isDone && (
                    <p className="text-xs text-amber-700/80 mt-0.5">{meta.desc}</p>
                  )}
                </div>
                {!isDone && (
                  <Link
                    href={meta.href}
                    className="text-xs text-primary font-semibold hover:underline flex items-center gap-1 shrink-0"
                  >
                    {meta.action} <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href={PREREQ_META[missing[0]].href}
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-medium transition"
          >
            {PREREQ_META[missing[0]].action}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  // ─── Advisory mode: compact banner ──────────────────────────────────────

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border border-amber-300/70 rounded-xl p-4 sm:p-5">
      <div className="absolute top-0 right-0 w-24 h-24 bg-amber-200/20 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 bg-amber-100 border border-amber-300 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
            <AlertCircle className="w-5 h-5 text-amber-600" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-amber-900 text-sm">
                {done}/{total} steps complete
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">
                Setup Needed
              </span>
            </div>
            <p className="text-xs text-amber-700/90 mt-1 leading-relaxed">
              {pageContext}
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
              {prereqs.map((p) => {
                const meta = PREREQ_META[p];
                const isDone = completed.includes(p);
                return isDone ? (
                  <span key={p} className="flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {meta.label}
                  </span>
                ) : (
                  <Link
                    key={p}
                    href={meta.href}
                    className="flex items-center gap-1 text-xs text-amber-800 font-medium hover:text-primary transition"
                  >
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-amber-400 shrink-0" />
                    {meta.label}
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
        <Link
          href={PREREQ_META[missing[0]].href}
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-xs font-semibold transition shrink-0 whitespace-nowrap"
        >
          {PREREQ_META[missing[0]].action}
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

/**
 * Hook variant — returns { missing, completed, allDone } so pages can
 * conditionally render their own UI.
 */
export { useMissingPrereqs };
