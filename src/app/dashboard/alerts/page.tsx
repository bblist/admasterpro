"use client";

import { useState } from "react";
import { Bell, Mail, MessageSquare, Plus, Trash2, ToggleLeft, ToggleRight, Zap, AlertTriangle, TrendingUp, TrendingDown, DollarSign, Target } from "lucide-react";
import { useBusiness } from "@/lib/business-context";
import SetupChecklist from "@/components/SetupChecklist";

interface Alert {
  id: string;
  name: string;
  type: "spend" | "conversion" | "performance" | "anomaly" | "milestone";
  condition: string;
  channels: ("email" | "whatsapp")[];
  enabled: boolean;
  lastTriggered: string | null;
}

const DEMO_ALERTS: Alert[] = [
  { id: "1", name: "Daily spend exceeds budget", type: "spend", condition: "Daily spend goes above £100", channels: ["email", "whatsapp"], enabled: true, lastTriggered: "Yesterday at 14:32" },
  { id: "2", name: "No conversions for 24 hours", type: "conversion", condition: "Zero conversions in the last 24 hours", channels: ["whatsapp"], enabled: true, lastTriggered: "3 days ago" },
  { id: "3", name: "CPA spike", type: "anomaly", condition: "Cost per acquisition jumps more than 50%", channels: ["email", "whatsapp"], enabled: true, lastTriggered: null },
  { id: "4", name: "New conversion record", type: "milestone", condition: "Best campaign hits a new weekly conversion record", channels: ["email"], enabled: true, lastTriggered: "Last Monday" },
  { id: "5", name: "Click-through rate drops", type: "performance", condition: "CTR drops below 2% on any campaign", channels: ["email"], enabled: false, lastTriggered: null },
  { id: "6", name: "Budget 80% spent", type: "spend", condition: "Monthly budget reaches 80% before day 25", channels: ["whatsapp"], enabled: true, lastTriggered: null },
];

const RECENT_NOTIFICATIONS = [
  { id: "1", title: "Daily spend hit £112 on 'Local Services'", time: "Yesterday at 14:32", type: "spend", channel: "whatsapp" },
  { id: "2", title: "New weekly record: 47 conversions on 'Brand Search'", time: "Last Monday at 09:15", type: "milestone", channel: "email" },
  { id: "3", title: "No conversions on 'Competitor Keywords' for 28 hours", time: "3 days ago", type: "conversion", channel: "whatsapp" },
  { id: "4", title: "CTR dropped to 1.8% on 'Shopping Ads'", time: "5 days ago", type: "performance", channel: "email" },
];

function typeIcon(type: string) {
  switch (type) {
    case "spend": return <DollarSign className="w-4 h-4" />;
    case "conversion": return <Target className="w-4 h-4" />;
    case "performance": return <TrendingDown className="w-4 h-4" />;
    case "anomaly": return <AlertTriangle className="w-4 h-4" />;
    case "milestone": return <TrendingUp className="w-4 h-4" />;
    default: return <Bell className="w-4 h-4" />;
  }
}

function typeColor(type: string): string {
  switch (type) {
    case "spend": return "bg-red-100 text-red-700";
    case "conversion": return "bg-amber-100 text-amber-700";
    case "performance": return "bg-blue-100 text-blue-700";
    case "anomaly": return "bg-purple-100 text-purple-700";
    case "milestone": return "bg-green-100 text-green-700";
    default: return "bg-gray-100 text-gray-700";
  }
}

export default function AlertsPage() {
  const { activeBusiness } = useBusiness();
  const [alerts, setAlerts] = useState(DEMO_ALERTS);
  const [showCreate, setShowCreate] = useState(false);

  const toggleAlert = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));
  };
  const deleteAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };
  const enabledCount = alerts.filter(a => a.enabled).length;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          Smart Alerts
        </h1>
        <p className="text-muted text-sm mt-1">
          Get notified by email or WhatsApp when something important happens, so you never miss a beat.
        </p>
      </div>

      <SetupChecklist
          prereqs={["google_ads", "business_info"]}
          pageContext="Connect your Google Ads account so Smart Alerts can monitor your campaigns and notify you about important changes"
      />

      {/* Delivery Channels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <Mail className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold">Email Alerts</div>
            <div className="text-xs text-muted">Sent to your account email</div>
          </div>
          <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">Connected</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-green-600" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold">WhatsApp Alerts</div>
            <div className="text-xs text-muted">Messages sent to your phone</div>
          </div>
          <button className="text-xs bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary/90">
            Connect
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted">{enabledCount} active alerts</div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" /> Create Alert
        </button>
      </div>

      {/* Create Alert (simple) */}
      {showCreate && (
        <div className="bg-card border-2 border-primary/20 rounded-xl p-5 space-y-4">
          <h3 className="font-semibold">New alert</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted block mb-1">Alert name</label>
              <input type="text" placeholder="e.g. Budget limit warning" className="w-full text-sm border border-border rounded-xl px-3 py-2 bg-background" />
            </div>
            <div>
              <label className="text-xs text-muted block mb-1">Alert type</label>
              <select className="w-full text-sm border border-border rounded-xl px-3 py-2 bg-background">
                <option>Spend threshold</option>
                <option>Conversion alert</option>
                <option>Performance drop</option>
                <option>Anomaly detection</option>
                <option>Milestone celebration</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted block mb-1">Condition</label>
            <input type="text" placeholder="e.g. Daily spend goes above £150" className="w-full text-sm border border-border rounded-xl px-3 py-2 bg-background" />
          </div>
          <div>
            <label className="text-xs text-muted block mb-2">Send via</label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" defaultChecked className="rounded" /> Email
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="rounded" /> WhatsApp
              </label>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90">Save Alert</button>
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-muted hover:text-foreground">Cancel</button>
          </div>
        </div>
      )}

      {/* Alert Rules */}
      <div className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
        {alerts.map(alert => (
          <div key={alert.id} className={`p-4 flex items-center gap-4 ${!alert.enabled ? "opacity-50" : ""}`}>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${typeColor(alert.type)}`}>
              {typeIcon(alert.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">{alert.name}</div>
              <div className="text-xs text-muted mt-0.5">{alert.condition}</div>
              <div className="flex items-center gap-2 mt-1">
                {alert.channels.includes("email") && (
                  <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Mail className="w-2.5 h-2.5" /> Email
                  </span>
                )}
                {alert.channels.includes("whatsapp") && (
                  <span className="text-[10px] bg-green-50 text-green-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <MessageSquare className="w-2.5 h-2.5" /> WhatsApp
                  </span>
                )}
                {alert.lastTriggered && (
                  <span className="text-[10px] text-muted">Last: {alert.lastTriggered}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => toggleAlert(alert.id)} className="text-muted hover:text-foreground">
                {alert.enabled ? <ToggleRight className="w-6 h-6 text-primary" /> : <ToggleLeft className="w-6 h-6" />}
              </button>
              <button onClick={() => deleteAlert(alert.id)} className="text-muted hover:text-red-600">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Notifications */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="font-semibold mb-4">Recent notifications</h2>
        <div className="space-y-3">
          {RECENT_NOTIFICATIONS.map(n => (
            <div key={n.id} className="flex items-start gap-3">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center mt-0.5 ${typeColor(n.type)}`}>
                {typeIcon(n.type)}
              </div>
              <div>
                <div className="text-sm">{n.title}</div>
                <div className="text-xs text-muted mt-0.5 flex items-center gap-2">
                  <span>{n.time}</span>
                  <span>via {n.channel === "whatsapp" ? "WhatsApp" : "Email"}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
