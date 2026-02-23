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
} from "lucide-react";
import { useState } from "react";

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

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted text-sm mt-1">Manage your AdMaster Pro preferences</p>
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
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 font-bold text-sm">G</span>
            </div>
            <div>
              <div className="text-sm font-medium">Mike&apos;s Plumbing LLC</div>
              <div className="text-xs text-muted">Google Ads Account: xxx-xxx-1234</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-success rounded-full"></div>
            <span className="text-xs text-success">Connected</span>
          </div>
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
