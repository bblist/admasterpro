"use client";

import { useState } from "react";
import { PoundSterling, TrendingUp, TrendingDown, ShoppingBag, ArrowUpDown, ChevronDown, ChevronUp } from "lucide-react";
import { useBusiness } from "@/lib/business-context";
import SetupChecklist from "@/components/SetupChecklist";

interface Product {
  id: string;
  name: string;
  channel: string;
  revenue: number;
  adSpend: number;
  cogs: number;
  unitsSold: number;
  margin: number;
  profit: number;
  roas: number;
  trend: "up" | "down" | "flat";
}

const DEMO_PRODUCTS: Product[] = [
  { id: "1", name: "Emergency Call-Out", channel: "Google Search", revenue: 3200, adSpend: 420, cogs: 850, unitsSold: 16, margin: 0, profit: 0, roas: 0, trend: "up" },
  { id: "2", name: "Boiler Installation", channel: "Google Search", revenue: 6800, adSpend: 680, cogs: 3400, unitsSold: 4, margin: 0, profit: 0, roas: 0, trend: "up" },
  { id: "3", name: "Bathroom Refit", channel: "Facebook Ads", revenue: 4500, adSpend: 520, cogs: 2250, unitsSold: 3, margin: 0, profit: 0, roas: 0, trend: "flat" },
  { id: "4", name: "Drain Unblocking", channel: "Google Search", revenue: 1800, adSpend: 380, cogs: 540, unitsSold: 12, margin: 0, profit: 0, roas: 0, trend: "down" },
  { id: "5", name: "Radiator Install", channel: "Facebook Ads", revenue: 2100, adSpend: 450, cogs: 1050, unitsSold: 7, margin: 0, profit: 0, roas: 0, trend: "down" },
  { id: "6", name: "Leak Detection", channel: "Google Search", revenue: 950, adSpend: 290, cogs: 380, unitsSold: 5, margin: 0, profit: 0, roas: 0, trend: "flat" },
  { id: "7", name: "Annual Boiler Service", channel: "Remarketing", revenue: 2400, adSpend: 180, cogs: 720, unitsSold: 20, margin: 0, profit: 0, roas: 0, trend: "up" },
  { id: "8", name: "Underfloor Heating", channel: "Facebook Ads", revenue: 3600, adSpend: 580, cogs: 2160, unitsSold: 2, margin: 0, profit: 0, roas: 0, trend: "flat" },
].map(p => {
  const profit = p.revenue - p.adSpend - p.cogs;
  const margin = Math.round((profit / p.revenue) * 100);
  const roas = p.adSpend > 0 ? parseFloat((p.revenue / p.adSpend).toFixed(1)) : 0;
  return { ...p, profit, margin, roas } as Product;
});

export default function ProfitTrackerPage() {
  const { activeBusiness } = useBusiness();
  const [products] = useState(DEMO_PRODUCTS);
  const [sortBy, setSortBy] = useState<"profit" | "margin" | "roas" | "revenue">("profit");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [expanded, setExpanded] = useState<string | null>(null);

  const totalRevenue = products.reduce((s, p) => s + p.revenue, 0);
  const totalAdSpend = products.reduce((s, p) => s + p.adSpend, 0);
  const totalCOGS = products.reduce((s, p) => s + p.cogs, 0);
  const totalProfit = totalRevenue - totalAdSpend - totalCOGS;
  const avgMargin = Math.round((totalProfit / totalRevenue) * 100);
  const overallROAS = (totalRevenue / totalAdSpend).toFixed(1);

  const sorted = [...products].sort((a, b) => {
    const mult = sortDir === "desc" ? -1 : 1;
    return (a[sortBy] - b[sortBy]) * mult;
  });

  const toggleSort = (col: "profit" | "margin" | "roas" | "revenue") => {
    if (sortBy === col) setSortDir(sortDir === "desc" ? "asc" : "desc");
    else { setSortBy(col); setSortDir("desc"); }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <PoundSterling className="w-5 h-5 text-primary" />
          </div>
          Profit Tracker
        </h1>
        <p className="text-muted text-sm mt-1">
          See the true profitability of each product or service after ad spend and costs. Not just revenue — real profit.
        </p>
      </div>

      <SetupChecklist
          prereqs={["google_ads", "business_info"]}
          pageContext="Connect your Google Ads account and add business info so the Profit Tracker can calculate true profitability per product"
      />

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-xs text-muted">Total revenue</div>
          <div className="text-xl font-bold mt-1">£{totalRevenue.toLocaleString()}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-xs text-muted">True profit</div>
          <div className={`text-xl font-bold mt-1 ${totalProfit > 0 ? "text-green-600" : "text-red-600"}`}>£{totalProfit.toLocaleString()}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-xs text-muted">Avg margin</div>
          <div className={`text-xl font-bold mt-1 ${avgMargin > 20 ? "text-green-600" : avgMargin > 0 ? "text-amber-600" : "text-red-600"}`}>{avgMargin}%</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-xs text-muted">Overall ROAS</div>
          <div className="text-xl font-bold mt-1">{overallROAS}x</div>
        </div>
      </div>

      {/* Profit Breakdown Visual */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="font-semibold mb-3">Where your money goes</h2>
        <div className="flex items-center gap-1 h-8 rounded-full overflow-hidden">
          <div className="h-full bg-green-500 flex items-center justify-center text-[10px] font-medium text-white" style={{ width: `${(totalProfit / totalRevenue) * 100}%` }}>
            Profit {Math.round((totalProfit / totalRevenue) * 100)}%
          </div>
          <div className="h-full bg-blue-500 flex items-center justify-center text-[10px] font-medium text-white" style={{ width: `${(totalAdSpend / totalRevenue) * 100}%` }}>
            Ad Spend {Math.round((totalAdSpend / totalRevenue) * 100)}%
          </div>
          <div className="h-full bg-gray-400 flex items-center justify-center text-[10px] font-medium text-white" style={{ width: `${(totalCOGS / totalRevenue) * 100}%` }}>
            Costs {Math.round((totalCOGS / totalRevenue) * 100)}%
          </div>
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted border-b border-border">
                <th className="p-4">Product / Service</th>
                <th className="p-4">Channel</th>
                <th className="p-4 cursor-pointer hover:text-foreground" onClick={() => toggleSort("revenue")}>
                  <span className="flex items-center gap-1">Revenue <ArrowUpDown className="w-3 h-3" /></span>
                </th>
                <th className="p-4 cursor-pointer hover:text-foreground" onClick={() => toggleSort("profit")}>
                  <span className="flex items-center gap-1">Profit <ArrowUpDown className="w-3 h-3" /></span>
                </th>
                <th className="p-4 cursor-pointer hover:text-foreground" onClick={() => toggleSort("margin")}>
                  <span className="flex items-center gap-1">Margin <ArrowUpDown className="w-3 h-3" /></span>
                </th>
                <th className="p-4 cursor-pointer hover:text-foreground" onClick={() => toggleSort("roas")}>
                  <span className="flex items-center gap-1">ROAS <ArrowUpDown className="w-3 h-3" /></span>
                </th>
                <th className="p-4">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sorted.map(p => (
                <tr key={p.id} className="hover:bg-muted/5 cursor-pointer" onClick={() => setExpanded(expanded === p.id ? null : p.id)}>
                  <td className="p-4">
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-muted">{p.unitsSold} units</div>
                  </td>
                  <td className="p-4 text-xs text-muted">{p.channel}</td>
                  <td className="p-4">£{p.revenue.toLocaleString()}</td>
                  <td className={`p-4 font-semibold ${p.profit > 0 ? "text-green-600" : "text-red-600"}`}>
                    £{p.profit.toLocaleString()}
                  </td>
                  <td className={`p-4 ${p.margin > 30 ? "text-green-600" : p.margin > 10 ? "text-amber-600" : "text-red-600"}`}>
                    {p.margin}%
                  </td>
                  <td className="p-4">{p.roas}x</td>
                  <td className="p-4">
                    {p.trend === "up" ? <TrendingUp className="w-4 h-4 text-green-600" /> :
                     p.trend === "down" ? <TrendingDown className="w-4 h-4 text-red-600" /> :
                     <span className="text-xs text-muted">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
