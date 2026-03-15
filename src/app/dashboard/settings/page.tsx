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
  Crown,
  ChevronRight,
  Loader2,
  CheckCircle,
  Globe,
  Unlink,
} from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { authFetch } from "@/lib/auth-client";
import { useTranslation } from "@/i18n/context";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import Tooltip from "@/components/Tooltip";

interface SubscriptionInfo {
  plan: string;
  status: string;
  aiMessagesUsed: number;
  aiMessagesLimit: number;
  bonusTokens: number;
  currentPeriodEnd?: string;
}

export default function SettingsPage() {
  const { t } = useTranslation();
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

  // Load subscription + saved settings
  useEffect(() => {
    authFetch("/api/subscription")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setSub(data); })
      .catch(() => { })
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
      .catch(() => { });
  }, []);

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

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("settings.title")}</h1>
        <p className="text-muted text-sm mt-1">{t("settings.subtitle")}</p>
      </div>

      {/* ─── Plan & Billing Link ───────────────────────────────────────── */}
      <Link href="/dashboard/billing" className="bg-card border border-border rounded-xl p-6 flex items-center justify-between hover:border-primary/50 transition group block">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center shrink-0">
            <Crown className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h2 className="font-semibold">{t("settings.planBilling")}</h2>
            <p className="text-sm text-muted mt-1">
              {loadingSub ? "Loading…" : sub ? `${planLabel(sub.plan)} plan — ${sub.plan === "pro" ? "Unlimited" : `${sub.aiMessagesUsed}/${sub.aiMessagesLimit + sub.bonusTokens}`} messages` : t("settings.planBillingDesc")}
            </p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-muted group-hover:text-primary transition" />
      </Link>

      {/* Auto-Pilot */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h2 className="font-semibold">{t("settings.autoPilot")} <Tooltip text="When enabled, AI automatically pauses underperforming keywords and reallocates budget to top performers — hands-free optimization." position="right" /></h2>
              <p className="text-sm text-muted mt-1">
                {t("settings.autoPilotDesc")}
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
            <h3 className="text-sm font-medium mb-3">{t("settings.autoPilotWill")}</h3>
            <div className="space-y-2 text-sm text-muted">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-success rounded-full"></div>
                {t("settings.ap1")}
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-success rounded-full"></div>
                {t("settings.ap2")}
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-success rounded-full"></div>
                {t("settings.ap3")}
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-success rounded-full"></div>
                {t("settings.ap4")}
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-danger rounded-full"></div>
                <span className="text-foreground font-medium">{t("settings.apNever")}</span>
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
            <h2 className="font-semibold">{t("settings.budgetLimit")} <Tooltip text="Set a max daily ad spend. The AI will never exceed this amount, protecting you from accidental overspending." position="right" /></h2>
            <p className="text-sm text-muted mt-1">
              {t("settings.budgetLimitDesc")}
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
          <span className="text-sm text-muted">{t("settings.perDay")}</span>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-start gap-3 mb-6">
          <div className="w-10 h-10 bg-primary-light rounded-lg flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold">{t("settings.notifications")} <Tooltip text="Control how and when you get alerted about campaign performance, budget warnings, and AI actions." position="right" /></h2>
            <p className="text-sm text-muted mt-1">{t("settings.notificationsDesc")}</p>
          </div>
        </div>

        {/* Channels */}
        <div className="mb-6">
          <h3 className="text-sm font-medium mb-3">{t("settings.channels")}</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-muted" />
                {t("settings.emailNotifs")}
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
                {t("settings.whatsappNotifs")}
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
          <h3 className="text-sm font-medium mb-3">{t("settings.notifTypes")}</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm">{t("settings.dailySummary")}</div>
                <div className="text-xs text-muted">{t("settings.dailySummaryDesc")}</div>
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
                <span className="text-muted">{t("settings.sendAt")}</span>
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
                <div className="text-sm">{t("settings.instantAlerts")}</div>
                <div className="text-xs text-muted">{t("settings.instantAlertsDesc")}</div>
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
                <div className="text-sm">{t("settings.weeklyReport")}</div>
                <div className="text-xs text-muted">{t("settings.weeklyReportDesc")}</div>
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

      {/* Language */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-start gap-3 mb-5">
          <div className="w-10 h-10 bg-primary-light rounded-lg flex items-center justify-center shrink-0">
            <Globe className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold">{t("common.changeLanguage")}</h2>
            <p className="text-sm text-muted mt-1">{t("common.selectLanguage")}</p>
          </div>
        </div>
        <LanguageSwitcher variant="settings" />
      </div>

      {/* Account Safety */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-success" />
          </div>
          <div>
            <h2 className="font-semibold">{t("settings.safetyRules")}</h2>
            <p className="text-sm text-muted mt-1">{t("settings.safetyRulesDesc")}</p>
          </div>
        </div>
        <div className="space-y-2 text-sm text-muted">
          <div className="flex items-center gap-2">
            <Shield className="w-3 h-3 text-success" />
            {t("settings.safety1")}
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-3 h-3 text-success" />
            {t("settings.safety2")}
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-3 h-3 text-success" />
            {t("settings.safety3")}
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-3 h-3 text-success" />
            {t("settings.safety4")}
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-3 h-3 text-success" />
            {t("settings.safety5")}
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
              {t("settings.saving")}
            </>
          ) : saved ? (
            <>
              <CheckCircle className="w-4 h-4" />
              {t("settings.saved")}
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {t("settings.saveSettings")}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Connected Account Section ──────────────────────────────────────────────

function ConnectedAccountSection() {
  const { t } = useTranslation();
  const [accounts, setAccounts] = useState<Array<{ customerId: string; descriptiveName: string }>>([]);
  const [businesses, setBusinesses] = useState<Array<{ id: string; name: string; googleAdsId: string | null }>>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

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
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect your Google Ads account? You can reconnect anytime.")) return;
    setDisconnecting(true);
    try {
      const res = await authFetch("/api/google-ads/accounts", {
        method: "DELETE",
      });
      if (res.ok) {
        setConnected(false);
        setAccounts([]);
        setBusinesses(prev => prev.map(b => ({ ...b, googleAdsId: null })));
      }
    } catch { /* ignore */ }
    finally { setDisconnecting(false); }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h2 className="font-semibold mb-4">{t("settings.connectedAccounts")}</h2>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted">
          <Loader2 className="w-4 h-4 animate-spin" /> {t("settings.loadingAccount")}
        </div>
      ) : !connected ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-muted font-bold text-sm">G</span>
            </div>
            <div>
              <div className="text-sm font-medium text-muted">{t("settings.noGoogle")}</div>
              <div className="text-xs text-muted">Connect during onboarding or go to <a href="/onboarding" className="text-primary hover:underline">setup</a> to link your account.</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Connected status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-green-700 font-medium">{t("settings.googleConnected")}</span>
            </div>
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="text-sm text-danger hover:text-danger/80 font-medium flex items-center gap-1 transition disabled:opacity-50"
            >
              <Unlink className="w-3.5 h-3.5" />
              {disconnecting ? "Disconnecting…" : "Disconnect"}
            </button>
          </div>

          {/* Connected Google Ads accounts */}
          {accounts.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2">{t("settings.googleAdsAccounts")}</h3>
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
                          <CheckCircle className="w-3 h-3" /> {t("settings.linkedTo")} {linkedBiz.name}
                        </span>
                      ) : (
                        <span className="text-xs text-muted">Not linked to a business</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {accounts.length === 0 && (
            <div className="text-sm text-muted">
              {t("settings.noAdsAccounts")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
