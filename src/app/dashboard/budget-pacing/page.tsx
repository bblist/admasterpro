"use client";

import { useState, useEffect } from "react";
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle, Calendar, Target, Gauge, ArrowRight } from "lucide-react";
import { useBusiness } from "@/lib/business-context";

export default function BudgetPacingPage() {
  const { activeBusiness } = useBusiness();
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const dayOfMonth = today.getDate();
  const percentThroughMonth = Math.round((dayOfMonth / daysInMonth) * 100);

  // Demo data
  const monthlyBudget = 2500;
  const spent = 1650;
  const percentSpent = Math.round((spent / monthlyBudget) * 100);
  const dailyTarget = monthlyBudget / daysInMonth;
  const actualDailyAvg = spent / dayOfMonth;
  const projectedSpend = actualDailyAvg * daysInMonth;
  const overspend = projectedSpend - monthlyBudget;
  const isPacing = Math.abs(percentSpent - percentThroughMonth) <= 10;

  const dailyData = Array.from({ length: dayOfMonth }, (_, i) => {
    const dayBudget = dailyTarget;
    const variance = (Math.random() - 0.4) * dailyTarget * 0.6;
    return {
      day: i + 1,
      target: dayBudget,
      actual: Math.max(dayBudget * 0.3, dayBudget + variance),
    };
  });

  const campaigns = [
    { name: "Brand Search", budget: 800, spent: 520, conversions: 34, status: "on-track" },
    { name: "Competitor Keywords", budget: 600, spent: 480, conversions: 12, status: "overspending" },
    { name: "Local Services", budget: 500, spent: 310, conversions: 22, status: "on-track" },
    { name: "Remarketing", budget: 400, spent: 240, conversions: 18, status: "underspending" },
    { name: "Shopping Ads", budget: 200, spent: 100, conversions: 8, status: "underspending" },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Gauge className="w-5 h-5 text-primary" />
          </div>
          Budget Pacing
        </h1>
        <p className="text-muted text-sm mt-1">
          Track your daily spend against your monthly budget to avoid running out early or underspending.
        </p>
      </div>

      {/* Main Pacing Card */}
      <div className={`rounded-2xl p-6 border ${isPacing ? "bg-green-50 border-green-200" : overspend > 0 ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"}`}>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold">
              {isPacing ? "You're pacing well this month" : overspend > 0 ? "You're spending faster than planned" : "You're underspending — you have room to grow"}
            </h2>
            <p className="text-sm text-muted mt-1">
              {isPacing
                ? "Your spend is tracking closely to your daily target. Keep it up."
                : overspend > 0
                ? `At this rate, you'll overshoot your budget by about £${Math.round(overspend)} by month end.`
                : "You have budget headroom. Consider increasing bids on your best campaigns."
              }
            </p>
          </div>
          <div className={`px-4 py-2 rounded-xl text-sm font-bold ${isPacing ? "bg-green-200 text-green-800" : overspend > 0 ? "bg-red-200 text-red-800" : "bg-amber-200 text-amber-800"}`}>
            {isPacing ? "On Track" : overspend > 0 ? "Overspending" : "Underspending"}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>£0</span>
            <span>£{monthlyBudget.toLocaleString()} monthly budget</span>
          </div>
          <div className="relative h-6 bg-white/60 rounded-full overflow-hidden border border-white/80">
            <div className="absolute h-full bg-primary/20 rounded-full" style={{ width: `${percentThroughMonth}%` }} />
            <div className={`absolute h-full rounded-full ${overspend > 0 ? "bg-red-500" : "bg-primary"}`} style={{ width: `${Math.min(percentSpent, 100)}%` }} />
            <div className="absolute top-0 bottom-0 w-0.5 bg-gray-400"
              style={{ left: `${percentThroughMonth}%` }}
              title={`Today: Day ${dayOfMonth} of ${daysInMonth}`} />
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold">£{spent.toLocaleString()} spent ({percentSpent}%)</span>
            <span className="text-muted">{percentThroughMonth}% through the month</span>
          </div>
        </div>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-xs text-muted">Daily target</div>
          <div className="text-xl font-bold mt-1">£{dailyTarget.toFixed(0)}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-xs text-muted">Actual daily avg</div>
          <div className={`text-xl font-bold mt-1 ${actualDailyAvg > dailyTarget * 1.1 ? "text-red-600" : "text-foreground"}`}>£{actualDailyAvg.toFixed(0)}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-xs text-muted">Projected month-end</div>
          <div className={`text-xl font-bold mt-1 ${projectedSpend > monthlyBudget ? "text-red-600" : "text-green-600"}`}>£{Math.round(projectedSpend).toLocaleString()}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-xs text-muted">Days remaining</div>
          <div className="text-xl font-bold mt-1">{daysInMonth - dayOfMonth}</div>
        </div>
      </div>

      {/* Campaign Breakdown */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="font-semibold mb-4">Campaign budget breakdown</h2>
        <div className="space-y-4">
          {campaigns.map((c, i) => {
            const pct = Math.round((c.spent / c.budget) * 100);
            const statusColor = c.status === "on-track" ? "text-green-600 bg-green-100" : c.status === "overspending" ? "text-red-600 bg-red-100" : "text-amber-600 bg-amber-100";
            return (
              <div key={i}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{c.name}</span>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusColor}`}>
                      {c.status === "on-track" ? "On track" : c.status === "overspending" ? "Overspending" : "Room to grow"}
                    </span>
                  </div>
                  <span className="text-sm">£{c.spent} / £{c.budget}</span>
                </div>
                <div className="h-2 bg-muted/20 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${c.status === "overspending" ? "bg-red-500" : "bg-primary"}`}
                    style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>
                <div className="flex items-center justify-between mt-1 text-xs text-muted">
                  <span>{pct}% spent</span>
                  <span>{c.conversions} conversions</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
