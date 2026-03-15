"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Store, Package, ShoppingBag, TrendingUp, DollarSign, RefreshCw,
    Loader2, AlertCircle, ExternalLink, ArrowRight, Zap, Sparkles,
    Search, Tag, Box, BarChart3, Link2, CheckCircle2, XCircle,
    ChevronDown, Image as ImageIcon
} from "lucide-react";
import Link from "next/link";
import { authFetch } from "@/lib/auth-client";
import { useBusiness } from "@/lib/business-context";

interface ShopifyProduct {
    shopifyId: string;
    title: string;
    description: string | null;
    productType: string;
    vendor: string;
    status: string;
    tags: string;
    handle: string;
    imageUrl: string | null;
    price: number | null;
    compareAtPrice: number | null;
    sku: string | null;
    inventoryQty: number;
}

interface ShopInfo {
    name: string;
    email: string;
    domain: string;
    myshopifyDomain: string;
    currency: string;
    country: string;
    plan: string;
}

export default function ShopifyPage() {
    const { activeBusiness } = useBusiness();

    const [products, setProducts] = useState<ShopifyProduct[]>([]);
    const [shopInfo, setShopInfo] = useState<ShopInfo | null>(null);
    const [connected, setConnected] = useState(false);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [connectingShop, setConnectingShop] = useState("");
    const [startingAuth, setStartingAuth] = useState(false);

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({ action: "products" });
            if (activeBusiness?.id) params.set("businessId", activeBusiness.id);
            const res = await authFetch(`/api/shopify?${params}`);
            const data = await res.json();

            if (data.connected === false) {
                setConnected(false);
                setProducts([]);
            } else {
                setConnected(true);
                setProducts(data.products || []);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load products");
        } finally {
            setLoading(false);
        }
    }, [activeBusiness?.id]);

    const fetchShopInfo = useCallback(async () => {
        try {
            const params = new URLSearchParams({ action: "shop-info" });
            if (activeBusiness?.id) params.set("businessId", activeBusiness.id);
            const res = await authFetch(`/api/shopify?${params}`);
            const data = await res.json();
            if (data.connected && data.shop) {
                setShopInfo(data.shop);
            }
        } catch { /* ignore */ }
    }, [activeBusiness?.id]);

    useEffect(() => {
        fetchProducts();
        fetchShopInfo();
    }, [fetchProducts, fetchShopInfo]);

    const syncProducts = async () => {
        setSyncing(true);
        setError(null);
        try {
            const res = await authFetch("/api/shopify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "sync", businessId: activeBusiness?.id }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Sync failed");
            await fetchProducts();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Sync failed");
        } finally {
            setSyncing(false);
        }
    };

    const startShopifyAuth = async () => {
        if (!connectingShop.trim()) {
            setError("Enter your Shopify store domain");
            return;
        }
        setStartingAuth(true);
        setError(null);
        try {
            let shop = connectingShop.trim();
            if (!shop.includes(".myshopify.com")) {
                shop = `${shop.replace(/\.myshopify\.com$/, "")}.myshopify.com`;
            }
            const params = new URLSearchParams({ action: "auth", shop });
            const res = await authFetch(`/api/shopify?${params}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Auth failed");
            if (data.authUrl) {
                window.location.href = data.authUrl;
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to start Shopify connection");
        } finally {
            setStartingAuth(false);
        }
    };

    // Filters
    const productTypes = [...new Set(products.map(p => p.productType).filter(Boolean))];
    const filtered = products.filter(p => {
        if (searchTerm && !p.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        if (typeFilter !== "all" && p.productType !== typeFilter) return false;
        return true;
    });

    const totalValue = products.reduce((sum, p) => sum + ((p.price || 0) * p.inventoryQty), 0);
    const totalInventory = products.reduce((sum, p) => sum + p.inventoryQty, 0);
    const avgPrice = products.length > 0 ? products.reduce((sum, p) => sum + (p.price || 0), 0) / products.length : 0;

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Store className="w-6 h-6 text-primary" />
                        Shopify Integration
                    </h1>
                    <p className="text-muted text-sm mt-1">
                        {connected
                            ? `${products.length} products synced from your store`
                            : "Connect your Shopify store to sync products and create ads"
                        }
                    </p>
                </div>
                {connected && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={syncProducts}
                            disabled={syncing}
                            className="inline-flex items-center gap-2 bg-card border border-border hover:border-primary px-4 py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-50"
                        >
                            <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
                            {syncing ? "Syncing..." : "Sync Products"}
                        </button>
                        <Link
                            href="/dashboard/ad-copy"
                            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-xl text-sm font-medium transition"
                        >
                            <Sparkles className="w-4 h-4" />
                            Create Product Ads
                        </Link>
                    </div>
                )}
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                </div>
            )}

            {/* Not Connected State */}
            {!connected && (
                <div className="space-y-6">
                    <div className="bg-card border border-border rounded-2xl p-10 text-center">
                        <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <Store className="w-10 h-10 text-green-600" />
                        </div>
                        <h2 className="text-xl font-bold mb-2">Connect Your Shopify Store</h2>
                        <p className="text-muted text-sm max-w-md mx-auto mb-8">
                            Sync your Shopify products to automatically create Google Shopping ads,
                            Performance Max campaigns, and AI-optimized product descriptions.
                        </p>

                        <div className="max-w-sm mx-auto space-y-3">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={connectingShop}
                                    onChange={e => setConnectingShop(e.target.value)}
                                    placeholder="your-store.myshopify.com"
                                    className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                                    onKeyDown={e => e.key === "Enter" && startShopifyAuth()}
                                />
                                <button
                                    onClick={startShopifyAuth}
                                    disabled={startingAuth}
                                    className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-xl text-sm font-semibold transition disabled:opacity-50"
                                >
                                    {startingAuth ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                                    Connect
                                </button>
                            </div>
                            <p className="text-xs text-muted">
                                We&apos;ll redirect you to Shopify to authorize read-only access to your products and orders.
                            </p>
                        </div>
                    </div>

                    {/* Benefits */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-card border border-border rounded-xl p-6">
                            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                                <Package className="w-5 h-5 text-blue-600" />
                            </div>
                            <h3 className="font-semibold mb-1">Product Sync</h3>
                            <p className="text-xs text-muted">
                                Automatically import your Shopify products with images, prices, and inventory
                                levels for ad creation.
                            </p>
                        </div>
                        <div className="bg-card border border-border rounded-xl p-6">
                            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                                <Sparkles className="w-5 h-5 text-purple-600" />
                            </div>
                            <h3 className="font-semibold mb-1">AI Ad Generation</h3>
                            <p className="text-xs text-muted">
                                Generate optimized Shopping ads and Product Feed descriptions using AI that
                                knows your catalog.
                            </p>
                        </div>
                        <div className="bg-card border border-border rounded-xl p-6">
                            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                                <BarChart3 className="w-5 h-5 text-green-600" />
                            </div>
                            <h3 className="font-semibold mb-1">Performance Tracking</h3>
                            <p className="text-xs text-muted">
                                See which products drive the most revenue and optimize your ad spend
                                with AI recommendations.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Connected State */}
            {connected && (
                <>
                    {/* Shop Info Bar */}
                    {shopInfo && (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between flex-wrap gap-3">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                                    <CheckCircle2 className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-green-800">{shopInfo.name}</p>
                                    <p className="text-xs text-green-600">
                                        {shopInfo.domain} · {shopInfo.plan} · {shopInfo.country}
                                    </p>
                                </div>
                            </div>
                            <a
                                href={`https://${shopInfo.myshopifyDomain || shopInfo.domain}/admin`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-green-700 hover:underline flex items-center gap-1"
                            >
                                Open Shopify Admin <ExternalLink className="w-3 h-3" />
                            </a>
                        </div>
                    )}

                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-card border border-border rounded-xl p-4">
                            <div className="flex items-center gap-2 text-xs text-muted mb-1">
                                <Package className="w-3.5 h-3.5" /> Products
                            </div>
                            <p className="text-2xl font-bold">{products.length}</p>
                        </div>
                        <div className="bg-card border border-border rounded-xl p-4">
                            <div className="flex items-center gap-2 text-xs text-muted mb-1">
                                <Box className="w-3.5 h-3.5" /> Total Inventory
                            </div>
                            <p className="text-2xl font-bold">{totalInventory.toLocaleString()}</p>
                        </div>
                        <div className="bg-card border border-border rounded-xl p-4">
                            <div className="flex items-center gap-2 text-xs text-muted mb-1">
                                <DollarSign className="w-3.5 h-3.5" /> Avg. Price
                            </div>
                            <p className="text-2xl font-bold">${avgPrice.toFixed(2)}</p>
                        </div>
                        <div className="bg-card border border-border rounded-xl p-4">
                            <div className="flex items-center gap-2 text-xs text-muted mb-1">
                                <TrendingUp className="w-3.5 h-3.5" /> Inventory Value
                            </div>
                            <p className="text-2xl font-bold">${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="relative flex-1 max-w-xs">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder="Search products..."
                                className="w-full bg-card border border-border rounded-lg pl-9 pr-3 py-2 text-sm"
                            />
                        </div>
                        {productTypes.length > 1 && (
                            <select
                                value={typeFilter}
                                onChange={e => setTypeFilter(e.target.value)}
                                className="bg-card border border-border rounded-lg px-3 py-2 text-sm"
                            >
                                <option value="all">All Types</option>
                                {productTypes.map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                        )}
                        <span className="text-xs text-muted ml-auto">
                            {filtered.length} of {products.length} products
                        </span>
                    </div>

                    {/* Product Grid */}
                    {filtered.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filtered.map(product => (
                                <div
                                    key={product.shopifyId}
                                    className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 hover:shadow-md transition group"
                                >
                                    {/* Image */}
                                    <div className="aspect-square bg-muted/10 relative overflow-hidden">
                                        {product.imageUrl ? (
                                            <img
                                                src={product.imageUrl}
                                                alt={product.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <ImageIcon className="w-12 h-12 text-muted/20" />
                                            </div>
                                        )}
                                        {product.compareAtPrice && product.price && product.compareAtPrice > product.price && (
                                            <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                                {Math.round((1 - product.price / product.compareAtPrice) * 100)}% OFF
                                            </div>
                                        )}
                                        {product.inventoryQty <= 0 && (
                                            <div className="absolute top-2 left-2 bg-gray-800 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                                Out of Stock
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="p-4">
                                        <h3 className="font-semibold text-sm leading-tight line-clamp-2 mb-1">
                                            {product.title}
                                        </h3>
                                        {product.productType && (
                                            <span className="inline-flex items-center gap-1 text-[10px] bg-muted/20 px-1.5 py-0.5 rounded text-muted mb-2">
                                                <Tag className="w-2.5 h-2.5" /> {product.productType}
                                            </span>
                                        )}
                                        <div className="flex items-center justify-between mt-2">
                                            <div className="flex items-baseline gap-1.5">
                                                <span className="text-lg font-bold">
                                                    ${product.price?.toFixed(2) || "0.00"}
                                                </span>
                                                {product.compareAtPrice && product.price && product.compareAtPrice > product.price && (
                                                    <span className="text-xs text-muted line-through">
                                                        ${product.compareAtPrice.toFixed(2)}
                                                    </span>
                                                )}
                                            </div>
                                            <span className={`text-xs font-medium ${product.inventoryQty > 10 ? "text-green-600" : product.inventoryQty > 0 ? "text-amber-600" : "text-red-600"}`}>
                                                {product.inventoryQty > 0 ? `${product.inventoryQty} in stock` : "Out of stock"}
                                            </span>
                                        </div>
                                        {product.vendor && (
                                            <p className="text-[10px] text-muted mt-1.5">by {product.vendor}</p>
                                        )}

                                        {/* Quick Action */}
                                        <Link
                                            href={`/dashboard/ad-copy?product=${encodeURIComponent(product.title)}&price=${product.price}`}
                                            className="mt-3 w-full inline-flex items-center justify-center gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium px-3 py-2 rounded-lg transition"
                                        >
                                            <Sparkles className="w-3 h-3" />
                                            Generate Ad for This Product
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : products.length > 0 ? (
                        <div className="bg-card border border-border rounded-xl p-8 text-center">
                            <Search className="w-8 h-8 text-muted/30 mx-auto mb-3" />
                            <p className="text-sm font-medium">No products match your filters</p>
                            <button onClick={() => { setSearchTerm(""); setTypeFilter("all"); }} className="text-xs text-primary hover:underline mt-1">
                                Clear filters
                            </button>
                        </div>
                    ) : (
                        <div className="bg-card border border-border rounded-xl p-10 text-center">
                            <Package className="w-12 h-12 text-muted/30 mx-auto mb-4" />
                            <h3 className="font-semibold mb-1">No Products Found</h3>
                            <p className="text-sm text-muted mb-4">
                                Your Shopify store appears to have no active products. Add products in Shopify, then sync again.
                            </p>
                            <button
                                onClick={syncProducts}
                                disabled={syncing}
                                className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-xl text-sm font-medium transition"
                            >
                                <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
                                Sync Again
                            </button>
                        </div>
                    )}

                    {/* AI Product Ads CTA */}
                    <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl p-6 flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                                <Zap className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold">AI-Powered Product Ads</h3>
                                <p className="text-sm text-muted mt-0.5">
                                    Tell the AI &quot;Create shopping ads for my top 10 products&quot; in chat
                                </p>
                            </div>
                        </div>
                        <Link
                            href="/dashboard/chat?intent=shopping"
                            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-xl text-sm font-medium transition"
                        >
                            <Sparkles className="w-4 h-4" />
                            Create Ads with AI
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </>
            )}
        </div>
    );
}
