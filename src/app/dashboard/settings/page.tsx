"use client";

import {
  Zap,
  ToggleLeft,
  ToggleRight,
  Bell,
  DollarSign,
  Shield,
  Mail,
  Smartphone,
  Clock,
  Save,
  CreditCard,
  ArrowUpRight,
  Package,
  Sparkles,
  Crown,
  ChevronRight,
} from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { authFetch } from "@/lib/auth-client";

interface SubscriptionInfo {
  plan: string;
  status: string;
  aiMessagesUsed: number;
  aiMessagesLimit: number;
  bonusTokens: number;
  currentPeriodEnd?: string;
}

export default function SettingsPage() {
  const [autoPilot, setAutoPilot] = useState(true);
  const [dailyBudget, setDailyBudget] = useState("100");
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [whatsappNotifs, setWhatsappNotifs] = useState(false);
  const [dailySummary, setDailySummary] = useState(true);
  const [instantAlerts, setInstantAlerts] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(true);
  const [summaryTime, setSummaryTime] = useState("08:00");
  const [saved, setSaved] = useState(false);
  const [sub, setSub] = useState<SubscriptionInfo | null>(null);
  const [loadingSub, setLoadingSub] = useState(true);
  const [billingAction, setBillingAction] = useState<string | null>(null);

  useEffect(() => {
    authFetch("/api/subscription")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setSub(data); })
      .catch(() => {})
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

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted text-sm mt-1">Manage your AdMaster Pro preferences</p>
      </div>

      {/* ─── Plan & Billing ─────────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-start gap-3 mb-5">
          <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center shrink-0">
            <Crown className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h2 className="font-semibold">Plan & Billing</h2>
            <p className="text-sm text-muted mt-1">Manage your subscription and AI message usage.</p>
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
                      Active
                    </span>
                  )}
                  {sub.status === "past_due" && (
                    <span className="text-[10px] bg-danger/15 text-danger px-2 py-0.5 rounded-full font-medium">
                      Past Due
                    </span>
                  )}
                </div>
                {sub.currentPeriodEnd && (
                  <p className="text-xs text-muted mt-0.5">
                    Renews {new Date(sub.currentPeriodEnd).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
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
                  {billingAction === "portal" ? "Loading..." : "Manage Billing"}
                </button>
              ) : null}
            </div>

            {/* Usage Meter */}
            <div>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="text-muted">AI Messages This Month</span>
                <span className="font-medium">
                  {sub.plan === "pro" ? (
                    <span className="text-accent">Unlimited</span>
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
                    className={`h-full rounded-full transition-all duration-500 ${
                      usagePercent >= 90
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
                  Includes {sub.bonusTokens} bonus messages from top-ups
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
                    {billingAction === "starter" ? "Loading..." : "Upgrade to Starter — $49/mo"}
                  </button>
                )}
                <button
                  onClick={() => handleBillingAction("pro")}
                  disabled={!!billingAction}
                  className="bg-accent hover:bg-accent/90 text-white text-sm px-4 py-2 rounded-lg font-medium transition flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  {billingAction === "pro" ? "Loading..." : "Upgrade to Pro — $149/mo"}
                </button>
                <Link
                  href="/pricing"
                  className="text-sm text-muted hover:text-foreground border border-border px-4 py-2 rounded-lg transition flex items-center gap-1"
                >
                  Compare Plans <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}

            {/* Top-ups (only for non-Pro) */}
            {sub.plan !== "pro" && (
              <div className="border-t border-border pt-4 mt-1">
                <div className="flex items-center gap-2 mb-3">
                  <Package className="w-4 h-4 text-muted" />
                  <span className="text-sm font-medium">Need more messages?</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
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
                      <div className="text-xs text-muted">{topup.messages} messages</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-muted">
            <p>Subscription info unavailable. Sign in to view your plan.</p>
          </div>
        )}
      </div>

      {/* Auto-Pilot */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h2 className="font-semibold">Auto-Pilot Mode</h2>
              <p className="text-sm text-muted mt-1">
                When on, I&apos;ll automatically handle small optimizations — pause clear losers, block junk
                searches, and adjust bids. I&apos;ll always notify you after every change and stay inside
                your daily budget.
              </p>
            </div>
          </div>
          <button
            onClick={() => setAutoPilot(!autoPilot)}
            className="shrink-0 mt-1"
          >
            {autoPilot ? (
              <ToggleRight className="w-10 h-10 text-success" />
            ) : (
              <ToggleLeft className="w-10 h-10 text-muted" />
            )}
          </button>
        </div>

        {autoPilot && (
          <div className="mt-4 pt-4 border-t border-border">
            <h3 className="text-sm font-medium mb-3">Auto-Pilot will:</h3>
            <div className="space-y-2 text-sm text-muted">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-success rounded-full"></div>
                Pause keywords with $50+ spend and zero results (after 7 days)
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-success rounded-full"></div>
                Add negative keywords for junk searches (free, DIY, jobs, how to)
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-success rounded-full"></div>
                Lower bids on keywords costing 3x more than your average
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-success rounded-full"></div>
                Turn off ads during hours with zero results
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-danger rounded-full"></div>
                <span className="text-foreground font-medium">Never</span> create new campaigns, increase budgets, or change bid strategies
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Budget */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 bg-primary-light rounded-lg flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold">Daily Budget Limit</h2>
            <p className="text-sm text-muted mt-1">
              I&apos;ll never let your total daily ad spend go above this amount.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-medium">$</span>
          <input
            type="number"
            value={dailyBudget}
            onChange={(e) => setDailyBudget(e.target.value)}
            className="w-32 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition"
          />
          <span className="text-sm text-muted">per day</span>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-start gap-3 mb-6">
          <div className="w-10 h-10 bg-primary-light rounded-lg flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold">Notifications</h2>
            <p className="text-sm text-muted mt-1">Choose how and when you want to hear from me.</p>
          </div>
        </div>

        {/* Channels */}
        <div className="mb-6">
          <h3 className="text-sm font-medium mb-3">Notification Channels</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-muted" />
                Email Notifications
              </div>
              <button onClick={() => setEmailNotifs(!emailNotifs)}>
                {emailNotifs ? (
                  <ToggleRight className="w-8 h-8 text-success" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-muted" />
                )}
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Smartphone className="w-4 h-4 text-muted" />
                WhatsApp Notifications
              </div>
              <button onClick={() => setWhatsappNotifs(!whatsappNotifs)}>
                {whatsappNotifs ? (
                  <ToggleRight className="w-8 h-8 text-success" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-muted" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Types */}
        <div className="pt-4 border-t border-border">
          <h3 className="text-sm font-medium mb-3">Notification Types</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm">Daily Summary</div>
                <div className="text-xs text-muted">A quick snapshot of yesterday&apos;s results</div>
              </div>
              <button onClick={() => setDailySummary(!dailySummary)}>
                {dailySummary ? (
                  <ToggleRight className="w-8 h-8 text-success" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-muted" />
                )}
              </button>
            </div>
            {dailySummary && (
              <div className="flex items-center gap-2 ml-4 text-sm">
                <Clock className="w-4 h-4 text-muted" />
                <span className="text-muted">Send at</span>
                <input
                  type="time"
                  value={summaryTime}
                  onChange={(e) => setSummaryTime(e.target.value)}
                  className="bg-background border border-border rounded px-2 py-1 text-sm focus:outline-none focus:border-primary"
                />
              </div>
            )}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm">Instant Alerts</div>
                <div className="text-xs text-muted">When a keyword burns money or something needs attention</div>
              </div>
              <button onClick={() => setInstantAlerts(!instantAlerts)}>
                {instantAlerts ? (
                  <ToggleRight className="w-8 h-8 text-success" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-muted" />
                )}
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm">Weekly Report</div>
                <div className="text-xs text-muted">Every Monday — week-over-week comparison</div>
              </div>
              <button onClick={() => setWeeklyReport(!weeklyReport)}>
                {weeklyReport ? (
                  <ToggleRight className="w-8 h-8 text-success" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-muted" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Account Safety */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-success" />
          </div>
          <div>
            <h2 className="font-semibold">Account Safety Rules</h2>
            <p className="text-sm text-muted mt-1">These rules are always enforced and cannot be changed.</p>
          </div>
        </div>
        <div className="space-y-2 text-sm text-muted">
          <div className="flex items-center gap-2">
            <Shield className="w-3 h-3 text-success" />
            New ads are always created as drafts — never pushed live without your approval
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-3 h-3 text-success" />
            Campaigns are only ever paused, never deleted
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-3 h-3 text-success" />
            Budget can never be increased more than 20% without your approval
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-3 h-3 text-success" />
            Bid strategy changes always require your approval
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-3 h-3 text-success" />
            Every change shows a preview before being applied
          </div>
        </div>
      </div>

      {/* Connected Account */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="font-semibold mb-4">Connected Account</h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
              <span className="text-muted font-bold text-sm">G</span>
            </div>
            <div>
              <div className="text-sm font-medium text-muted">No Google Ads account connected</div>
              <div className="text-xs text-muted">Sign in with Google to link your Ads account</div>
            </div>
          </div>
          <button
            onClick={() => window.location.href = "/api/auth/callback"}
            className="text-sm text-primary hover:text-primary-dark font-medium transition"
          >
            Connect
          </button>
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end pb-6">
        <button
          onClick={handleSave}
          className="bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-lg text-sm font-medium transition flex items-center gap-2"
        >
          {saved ? (
            <>
              <Shield className="w-4 h-4" />
              Saved!
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Settings
            </>
          )}
        </button>
      </div>
    </div>
  );
}
