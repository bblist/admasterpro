"use client";

import {
  CreditCard,
  ArrowUpRight,
  Package,
  Sparkles,
  Crown,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { authFetch } from "@/lib/auth-client";
import { useTranslation } from "@/i18n/context";
import Tooltip from "@/components/Tooltip";

interface SubscriptionInfo {
  plan: string;
  status: string;
  aiMessagesUsed: number;
  aiMessagesLimit: number;
  bonusTokens: number;
  currentPeriodEnd?: string;
}

export default function BillingPage() {
  const { t } = useTranslation();
  const [sub, setSub] = useState<SubscriptionInfo | null>(null);
  const [loadingSub, setLoadingSub] = useState(true);
  const [billingAction, setBillingAction] = useState<string | null>(null);

  useEffect(() => {
    authFetch("/api/subscription")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setSub(data); })
      .catch(() => { })
      .finally(() => setLoadingSub(false));
  }, []);

  const handleBillingAction = async (action: string) => {
    setBillingAction(action);
    try {
      const res = await authFetch("/api/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          action === "portal"
            ? { action: "portal" }
            : action.startsWith("topup_")
              ? { action: "topup", amount: parseInt(action.split("_")[1]) }
              : { action: "checkout", plan: action }
        ),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      /* ignore */
    } finally {
      setBillingAction(null);
    }
  };

  const planLabel = (p: string) =>
    p === "pro" ? "Pro" : p === "starter" ? "Starter" : "Free";
  const planPrice = (p: string) =>
    p === "pro" ? "$149" : p === "starter" ? "$49" : "$0";
  const planColor = (p: string) =>
    p === "pro" ? "text-accent" : p === "starter" ? "text-primary" : "text-muted";

  const usagePercent = sub
    ? Math.min(100, Math.round((sub.aiMessagesUsed / (sub.aiMessagesLimit + sub.bonusTokens)) * 100))
    : 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("settings.planBilling")}</h1>
        <p className="text-muted text-sm mt-1">{t("settings.planBillingDesc")}</p>
      </div>

      {/* ─── Plan & Billing ─────────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-start gap-3 mb-5">
          <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center shrink-0">
            <Crown className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h2 className="font-semibold">Current Plan <Tooltip text="View your current subscription, track AI message usage, and upgrade or manage billing." position="right" /></h2>
            <p className="text-sm text-muted mt-1">Manage your subscription and track usage.</p>
          </div>
        </div>

        {loadingSub ? (
          <div className="animate-pulse space-y-3">
            <div className="h-5 bg-border rounded w-1/3" />
            <div className="h-3 bg-border rounded w-full" />
            <div className="h-3 bg-border rounded w-2/3" />
          </div>
        ) : sub ? (
          <div className="space-y-5">
            {/* Current Plan Row */}
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-bold ${planColor(sub.plan)}`}>
                    {planLabel(sub.plan)}
                  </span>
                  <span className="text-sm text-muted">{planPrice(sub.plan)}/mo</span>
                  {sub.status === "active" && (
                    <span className="text-[10px] bg-success/15 text-success px-2 py-0.5 rounded-full font-medium">
                      {t("settings.active")}
                    </span>
                  )}
                  {sub.status === "past_due" && (
                    <span className="text-[10px] bg-danger/15 text-danger px-2 py-0.5 rounded-full font-medium">
                      {t("settings.pastDue")}
                    </span>
                  )}
                </div>
                {sub.currentPeriodEnd && (
                  <p className="text-xs text-muted mt-0.5">
                    {t("settings.renews")} {new Date(sub.currentPeriodEnd).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </p>
                )}
              </div>
              {sub.plan !== "free" ? (
                <button
                  onClick={() => handleBillingAction("portal")}
                  disabled={billingAction === "portal"}
                  className="text-sm text-primary hover:text-primary-dark font-medium flex items-center gap-1 transition"
                >
                  <CreditCard className="w-4 h-4" />
                  {billingAction === "portal" ? t("common.loading") : t("settings.manageBilling")}
                </button>
              ) : null}
            </div>

            {/* Usage Meter */}
            <div>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="text-muted">{t("settings.aiMessagesMonth")} <Tooltip text="Each AI interaction (chat, ad generation, analysis) uses one message. Resets monthly on your billing date." position="right" /></span>
                <span className="font-medium">
                  {sub.plan === "pro" ? (
                    <span className="text-accent">{t("settings.unlimited")}</span>
                  ) : (
                    <>
                      {sub.aiMessagesUsed}{" "}
                      <span className="text-muted">
                        / {sub.aiMessagesLimit + sub.bonusTokens}
                      </span>
                    </>
                  )}
                </span>
              </div>
              {sub.plan !== "pro" && (
                <div className="w-full h-2.5 bg-border rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${usagePercent >= 90
                      ? "bg-danger"
                      : usagePercent >= 70
                        ? "bg-warning"
                        : "bg-primary"
                      }`}
                    style={{ width: `${usagePercent}%` }}
                  />
                </div>
              )}
              {sub.bonusTokens > 0 && (
                <p className="text-xs text-muted mt-1">
                  {t("settings.includesBonus", { count: sub.bonusTokens })}
                </p>
              )}
            </div>

            {/* Upgrade Buttons */}
            {sub.plan !== "pro" && (
              <div className="flex flex-wrap gap-2 pt-1">
                {sub.plan === "free" && (
                  <button
                    onClick={() => handleBillingAction("starter")}
                    disabled={!!billingAction}
                    className="bg-primary hover:bg-primary-dark text-white text-sm px-4 py-2 rounded-lg font-medium transition flex items-center gap-1.5"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    {billingAction === "starter" ? t("common.loading") : t("settings.upgradeStarter")}
                  </button>
                )}
                <button
                  onClick={() => handleBillingAction("pro")}
                  disabled={!!billingAction}
                  className="bg-accent hover:bg-accent/90 text-white text-sm px-4 py-2 rounded-lg font-medium transition flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  {billingAction === "pro" ? t("common.loading") : t("settings.upgradePro")}
                </button>
                <Link
                  href="/pricing"
                  className="text-sm text-muted hover:text-foreground border border-border px-4 py-2 rounded-lg transition flex items-center gap-1"
                >
                  {t("settings.comparePlans")} <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}

            {/* Top-ups (only for non-Pro) */}
            {sub.plan !== "pro" && (
              <div className="border-t border-border pt-4 mt-1">
                <div className="flex items-center gap-2 mb-3">
                  <Package className="w-4 h-4 text-muted" />
                  <span className="text-sm font-medium">{t("settings.needMore")}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { amount: 30, messages: 50, label: "$30" },
                    { amount: 50, messages: 100, label: "$50", badge: "Best Value" },
                    { amount: 100, messages: 250, label: "$100", badge: "Save 33%" },
                  ].map((topup) => (
                    <button
                      key={topup.amount}
                      onClick={() => handleBillingAction(`topup_${topup.amount}`)}
                      disabled={!!billingAction}
                      className="relative border border-border hover:border-primary rounded-lg p-3 text-center transition group"
                    >
                      {topup.badge && (
                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] bg-accent text-white px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap">
                          {topup.badge}
                        </span>
                      )}
                      <div className="text-lg font-bold group-hover:text-primary transition">
                        {topup.label}
                      </div>
                      <div className="text-xs text-muted">{topup.messages} {t("settings.messages")}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-muted">
            <p>{t("settings.subUnavailable")}</p>
          </div>
        )}
      </div>

      {/* Link back to settings */}
      <div className="text-center">
        <Link href="/dashboard/settings" className="text-sm text-primary hover:text-primary-dark transition">
          ← Back to Settings
        </Link>
      </div>
    </div>
  );
}
