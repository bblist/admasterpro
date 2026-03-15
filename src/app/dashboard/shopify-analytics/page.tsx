"use client";

import { useState, useEffect, useCallback } from "react";
import {
    ShoppingBag, DollarSign, TrendingUp, Package, Loader2, RefreshCw,
    ArrowUpRight, ArrowDownRight, BarChart3, Eye, Users, Zap,
    AlertTriangle, ShoppingCart, Truck, CreditCard
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { authFetch } from "@/lib/auth-client";
import { useBusiness } from "@/lib/business-context";

interface ShopifyOverview {
    totalRevenue: number;
    recentRevenue: number;
    totalOrders: number;
    avgOrderValue: number;
    productCount: number;
}

interface DailyRevenue { date: string; revenue: number }
interface StatusBreakdown { fulfilled: number; unfulfilled: number; partial: number; refunded: number }
interface ProductPerf { id: string; title: string; status: string; price: number; inventory: number; productType: string; imageUrl: string | null }
interface RecentOrder { id: string; name: string; total: number; currency: string; createdAt: string; fulfillmentStatus: string | null; financialStatus: string; itemCount: number }

export default function ShopifyAnalyticsPage() {
    const { activeBusiness } = useBusiness();
    const [overview, setOverview] = useState<ShopifyOverview | null>(null);
    const [dailyChart, setDailyChart] = useState<DailyRevenue[]>([]);
    const [statusBreakdown, setStatusBreakdown] = useState<StatusBreakdown | null>(null);
    const [topProducts, setTopProducts] = useState<ProductPerf[]>([]);
    const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
    const [roas, setRoas] = useState<{ roas: number; adSpend: number; totalRevenue: number; cac: number } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        if (!activeBusiness || activeBusiness.id === "default") return;
        setLoading(true);
        setError(null);
        try {
            const [overviewRes, roasRes] = await Promise.all([
                authFetch(`/api/shopify-analytics?businessId=${activeBusiness.id}&type=overview`),
                authFetch(`/api/shopify-analytics?businessId=${activeBusiness.id}&type=roas`),
            ]);

            if (!overviewRes.ok) throw new Error((await overviewRes.json()).error || "Failed to load");
            const overviewData = await overviewRes.json();
            setOverview(overviewData.overview);
            setDailyChart(overviewData.dailyChart || []);
            setStatusBreakdown(overviewData.statusBreakdown);
            setTopProducts(overviewData.topProducts || []);
            setRecentOrders(overviewData.recentOrders || []);

            if (roasRes.ok) {
                const roasData = await roasRes.json();
                setRoas(roasData.roas);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load Shopify analytics");
        } finally {
            setLoading(false);
        }
    }, [activeBusiness]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const fmtMoney = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    if (loading) return (
        <div className="max-w-6xl mx-auto flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
    );

    if (error) return (
        <div className="max-w-6xl mx-auto">
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
                <AlertTriangle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                <p className="text-yellow-700 font-medium">{error}</p>
                <p className="text-yellow-500 text-sm mt-1">Connect your Shopify store to see analytics</p>
            </div>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <ShoppingBag className="w-6 h-6 text-green-600" /> Shopify Analytics
                    </h1>
                    <p className="text-muted text-sm mt-1">Revenue attribution, ROAS, and product performance insights</p>
                </div>
                <button onClick={fetchData} className="text-xs border border-border rounded-lg px-3 py-2 text-muted hover:text-foreground transition flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5" /> Refresh
                </button>
            </div>

            {/* Key Metrics */}
            {overview && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {[
                        { label: "Total Revenue", value: fmtMoney(overview.totalRevenue), icon: DollarSign, color: "text-green-600" },
                        { label: "Last 30 Days", value: fmtMoney(overview.recentRevenue), icon: TrendingUp, color: "text-blue-600" },
                        { label: "Total Orders", value: overview.totalOrders.toString(), icon: ShoppingCart, color: "text-purple-600" },
                        { label: "Avg Order Value", value: fmtMoney(overview.avgOrderValue), icon: CreditCard, color: "text-orange-600" },
                        { label: "Products", value: overview.productCount.toString(), icon: Package, color: "text-pink-600" },
                    ].map((s, i) => (
                        <div key={i} className="bg-card border border-border rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-1">
                                <s.icon className={`w-4 h-4 ${s.color}`} />
                                <span className="text-xs text-muted">{s.label}</span>
                            </div>
                            <p className="text-xl font-bold">{s.value}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* ROAS Card */}
            {roas && roas.adSpend > 0 && (
                <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-5">
                    <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-green-600" /> Return on Ad Spend (ROAS)
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div>
                            <p className="text-xs text-muted">ROAS</p>
                            <p className={`text-2xl font-bold ${roas.roas >= 3 ? "text-green-600" : roas.roas >= 1 ? "text-yellow-600" : "text-red-600"}`}>
                                {roas.roas}x
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-muted">Ad Spend</p>
                            <p className="text-2xl font-bold">{fmtMoney(roas.adSpend)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted">Revenue from Ads</p>
                            <p className="text-2xl font-bold text-green-600">{fmtMoney(roas.totalRevenue)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted">Cost per Acquisition</p>
                            <p className="text-2xl font-bold">{fmtMoney(roas.cac)}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Revenue Chart */}
            {dailyChart.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-5">
                    <h2 className="text-sm font-semibold mb-4">Daily Revenue (Last 30 Days)</h2>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dailyChart}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${v}`} />
                                <Tooltip formatter={(v) => [fmtMoney(Number(v)), "Revenue"]} />
                                <Bar dataKey="revenue" fill="#22c55e" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Order Status & Top Products Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Order Status */}
                {statusBreakdown && (
                    <div className="bg-card border border-border rounded-xl p-5">
                        <h2 className="text-sm font-semibold mb-3">Order Status</h2>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: "Fulfilled", value: statusBreakdown.fulfilled, icon: Truck, color: "text-green-600 bg-green-50" },
                                { label: "Unfulfilled", value: statusBreakdown.unfulfilled, icon: ShoppingCart, color: "text-yellow-600 bg-yellow-50" },
                                { label: "Partial", value: statusBreakdown.partial, icon: Package, color: "text-blue-600 bg-blue-50" },
                                { label: "Refunded", value: statusBreakdown.refunded, icon: ArrowDownRight, color: "text-red-600 bg-red-50" },
                            ].map((s, i) => (
                                <div key={i} className={`rounded-lg p-3 ${s.color.split(" ")[1]}`}>
                                    <s.icon className={`w-4 h-4 ${s.color.split(" ")[0]} mb-1`} />
                                    <p className="text-xl font-bold">{s.value}</p>
                                    <p className="text-xs text-muted">{s.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Top Products */}
                {topProducts.length > 0 && (
                    <div className="bg-card border border-border rounded-xl p-5">
                        <h2 className="text-sm font-semibold mb-3">Top Products</h2>
                        <div className="space-y-2">
                            {topProducts.slice(0, 8).map((p, i) => (
                                <div key={i} className="flex items-center gap-3 bg-background border border-border rounded-lg p-2.5">
                                    {p.imageUrl ? (
                                        <img src={p.imageUrl} alt={p.title} className="w-10 h-10 rounded-lg object-cover" />
                                    ) : (
                                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center"><Package className="w-4 h-4 text-gray-400" /></div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{p.title}</p>
                                        <p className="text-xs text-muted">{p.productType || "General"} • {p.inventory} in stock</p>
                                    </div>
                                    <p className="text-sm font-semibold">{fmtMoney(p.price)}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Recent Orders */}
            {recentOrders.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-5">
                    <h2 className="text-sm font-semibold mb-3">Recent Orders</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border text-left text-xs text-muted">
                                    <th className="pb-2 pr-4">Order</th>
                                    <th className="pb-2 pr-4">Date</th>
                                    <th className="pb-2 pr-4 text-right">Total</th>
                                    <th className="pb-2 pr-4">Items</th>
                                    <th className="pb-2">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentOrders.map((o, i) => (
                                    <tr key={i} className="border-b border-border/50">
                                        <td className="py-2 pr-4 font-medium">{o.name}</td>
                                        <td className="py-2 pr-4 text-muted">{new Date(o.createdAt).toLocaleDateString()}</td>
                                        <td className="py-2 pr-4 text-right font-medium">{fmtMoney(o.total)}</td>
                                        <td className="py-2 pr-4">{o.itemCount}</td>
                                        <td className="py-2">
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                                                o.fulfillmentStatus === "fulfilled" ? "bg-green-100 text-green-700" :
                                                o.financialStatus === "refunded" ? "bg-red-100 text-red-700" :
                                                "bg-yellow-100 text-yellow-700"
                                            }`}>
                                                {o.fulfillmentStatus || "Unfulfilled"}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
