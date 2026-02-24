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
  Loader2,
  CheckCircle,
  ExternalLink,
  Plus,
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
  const [saving, setSaving] = useState(false);
  const [sub, setSub] = useState<SubscriptionInfo | null>(null);
  const [loadingSub, setLoadingSub] = useState(true);
  const [billingAction, setBillingAction] = useState<string | null>(null);

  // Load subscription + saved settings
  useEffect(() => {
    authFetch("/api/subscription")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setSub(data); })
      .catch(() => {})
      .finally(() => setLoadingSub(false));

    authFetch("/api/settings")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.settings) {
          const s = data.settings;
          if (s.autoPilot !== undefined) setAutoPilot(s.autoPilot);
          if (s.budgetLimit) setDailyBudget(s.budgetLimit);
          if (s.notifications?.email !== undefined) setEmailNotifs(s.notifications.email);
          if (s.notifications?.whatsapp !== undefined) setWhatsappNotifs(s.notifications.whatsapp);
          if (s.notifications?.dailySummary !== undefined) setDailySummary(s.notifications.dailySummary);
          if (s.notifications?.instantAlerts !== undefined) setInstantAlerts(s.notifications.instantAlerts);
          if (s.notifications?.weeklyReport !== undefined) setWeeklyReport(s.notifications.weeklyReport);
          if (s.notifications?.summaryTime) setSummaryTime(s.notifications.summaryTime);
        }
      })
      .catch(() => {});
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

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await authFetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          autoPilot,
          budgetLimit: dailyBudget,
          notifications: {
            email: emailNotifs,
            whatsapp: whatsappNotifs,
            dailySummary,
            instantAlerts,
            weeklyReport,
            summaryTime,
          },
        }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch { /* ignore */ }
    finally { setSaving(false); }
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
      <ConnectedAccountSection />

      {/* Save */}
      <div className="flex justify-end pb-6">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-lg text-sm font-medium transition flex items-center gap-2 disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : saved ? (
            <>
              <CheckCircle className="w-4 h-4" />
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

// ─── Connected Account Section ──────────────────────────────────────────────

function ConnectedAccountSection() {
  const [accounts, setAccounts] = useState<Array<{ customerId: string; descriptiveName: string }>>([]);
  const [businesses, setBusinesses] = useState<Array<{ id: string; name: string; googleAdsId: string | null }>>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    authFetch("/api/google-ads/accounts")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setAccounts(data.accounts || []);
          setBusinesses(data.businesses || []);
          setConnected(data.connected === true);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const linkAccount = async (businessId: string, customerId: string) => {
    try {
      const res = await authFetch("/api/google-ads/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, googleAdsCustomerId: customerId }),
      });
      if (res.ok) {
        setBusinesses(prev => prev.map(b =>
          b.id === businessId ? { ...b, googleAdsId: customerId } : b
        ));
      }
    } catch { /* ignore */ }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h2 className="font-semibold mb-4">Connected Accounts</h2>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading account info...
        </div>
      ) : !connected ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-muted font-bold text-sm">G</span>
            </div>
            <div>
              <div className="text-sm font-medium text-muted">No Google account connected</div>
              <div className="text-xs text-muted">Sign in with Google to link your Ads account</div>
            </div>
          </div>
          <button
            onClick={() => window.location.href = "/api/auth/callback"}
            className="text-sm text-primary hover:text-primary-dark font-medium transition flex items-center gap-1"
          >
            Connect <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Connected status */}
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-green-700 font-medium">Google account connected</span>
          </div>

          {/* Available Google Ads accounts */}
          {accounts.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2">Google Ads Accounts</h3>
              <div className="space-y-2">
                {accounts.map(acc => {
                  const linkedBiz = businesses.find(b => b.googleAdsId === acc.customerId);
                  return (
                    <div key={acc.customerId} className="flex items-center justify-between bg-muted/20 rounded-lg p-3">
                      <div>
                        <div className="text-sm font-medium">{acc.descriptiveName}</div>
                        <div className="text-xs text-muted">ID: {acc.customerId}</div>
                      </div>
                      {linkedBiz ? (
                        <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Linked to {linkedBiz.name}
                        </span>
                      ) : businesses.length > 0 ? (
                        <select
                          onChange={(e) => { if (e.target.value) linkAccount(e.target.value, acc.customerId); }}
                          className="text-xs bg-card border border-border rounded px-2 py-1"
                          defaultValue=""
                        >
                          <option value="">Link to business...</option>
                          {businesses.filter(b => !b.googleAdsId).map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                          ))}
                        </select>
                      ) : (
                        <Link href="/dashboard/knowledge-base" className="text-xs text-primary hover:underline flex items-center gap-1">
                          <Plus className="w-3 h-3" /> Add business first
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {accounts.length === 0 && (
            <div className="text-sm text-muted">
              No Google Ads accounts found. Make sure your Google account has access to at least one Google Ads account.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
