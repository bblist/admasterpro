"use client";

import {
    ShoppingBag,
    RefreshCw,
    CheckCircle,
    AlertTriangle,
    ExternalLink,
    Settings,
    Zap,
} from "lucide-react";
import Tooltip from "@/components/Tooltip";

interface ShopifyProduct {
    id: number;
    name: string;
    image: string;
    price: number;
    salePrice?: number;
    category: string;
    status: "active" | "disapproved" | "pending";
    clicks: number;
    impressions: number;
    conversions: number;
    spent: number;
    roas: number;
}

const products: ShopifyProduct[] = [
    {
        id: 1,
        name: "Floral Maxi Dress - Summer Edition",
        image: "from-pink-300 to-rose-400",
        price: 89.99,
        salePrice: 62.99,
        category: "Dresses",
        status: "active",
        clicks: 145,
        impressions: 8420,
        conversions: 12,
        spent: 68.50,
        roas: 11.02,
    },
    {
        id: 2,
        name: "Leather Crossbody Bag - Classic",
        image: "from-amber-300 to-orange-400",
        price: 149.99,
        category: "Handbags",
        status: "active",
        clicks: 89,
        impressions: 5200,
        conversions: 5,
        spent: 42.30,
        roas: 17.73,
    },
    {
        id: 3,
        name: "Aviator Sunglasses - Gold Frame",
        image: "from-yellow-300 to-amber-400",
        price: 65.00,
        salePrice: 45.50,
        category: "Accessories",
        status: "active",
        clicks: 210,
        impressions: 12300,
        conversions: 18,
        spent: 95.20,
        roas: 8.60,
    },
    {
        id: 4,
        name: "Silk Blouse - Pearl White",
        image: "from-gray-200 to-gray-300",
        price: 120.00,
        category: "Tops",
        status: "disapproved",
        clicks: 0,
        impressions: 0,
        conversions: 0,
        spent: 0,
        roas: 0,
    },
    {
        id: 5,
        name: "Strappy Heels - Rose Gold",
        image: "from-rose-300 to-pink-400",
        price: 95.00,
        salePrice: 71.25,
        category: "Shoes",
        status: "active",
        clicks: 67,
        impressions: 3800,
        conversions: 4,
        spent: 31.40,
        roas: 9.08,
    },
    {
        id: 6,
        name: "Denim Jacket - Vintage Wash",
        image: "from-blue-300 to-indigo-400",
        price: 110.00,
        category: "Outerwear",
        status: "pending",
        clicks: 0,
        impressions: 0,
        conversions: 0,
        spent: 0,
        roas: 0,
    },
    {
        id: 7,
        name: "Canvas Tote - Eco Collection",
        image: "from-green-300 to-emerald-400",
        price: 35.00,
        category: "Bags",
        status: "active",
        clicks: 320,
        impressions: 18500,
        conversions: 28,
        spent: 112.00,
        roas: 8.75,
    },
    {
        id: 8,
        name: "Statement Earrings - Crystal",
        image: "from-purple-300 to-violet-400",
        price: 42.00,
        salePrice: 33.60,
        category: "Jewelry",
        status: "active",
        clicks: 156,
        impressions: 9100,
        conversions: 14,
        spent: 58.80,
        roas: 8.0,
    },
];

export default function ShoppingPage() {
    const activeProducts = products.filter((p) => p.status === "active");
    const totalSpent = activeProducts.reduce((sum, p) => sum + p.spent, 0);
    const totalConversions = activeProducts.reduce((sum, p) => sum + p.conversions, 0);
    const totalRevenue = activeProducts.reduce((sum, p) => sum + (p.salePrice || p.price) * p.conversions, 0);
    const avgRoas = totalSpent > 0 ? totalRevenue / totalSpent : 0;

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        Shopping Ads
                        <Tooltip text="Google Shopping ads show your products with images, prices, and store name directly in search results. Connect your Shopify store to sync products automatically." />
                    </h1>
                    <p className="text-muted text-sm mt-1">Bella Fashion Boutique &bull; Shopify Integration</p>
                </div>
                <div className="flex gap-2">
                    <button className="border border-border text-sm px-4 py-2 rounded-lg hover:border-primary transition flex items-center gap-2">
                        <RefreshCw className="w-4 h-4" />
                        Sync Products
                    </button>
                    <button className="border border-border text-sm px-4 py-2 rounded-lg hover:border-primary transition flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Feed Settings
                    </button>
                </div>
            </div>

            {/* Shopify Connection Banner */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                        <ShoppingBag className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <div className="text-sm font-medium text-green-800 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            Shopify Connected
                        </div>
                        <div className="text-xs text-green-600">
                            bellafashion.myshopify.com &bull; Last synced 2 hours ago &bull; {products.length} products
                        </div>
                    </div>
                </div>
                <button className="text-xs text-green-700 hover:text-green-900 flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" />
                    Open Shopify
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-card border border-border rounded-xl p-4">
                    <div className="text-muted text-xs mb-1 flex items-center gap-1">
                        Products
                        <Tooltip text="Total products synced from your Shopify store to Google Merchant Center." />
                    </div>
                    <div className="text-xl font-bold">{products.length}</div>
                    <div className="text-xs text-success mt-1">{activeProducts.length} active</div>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                    <div className="text-muted text-xs mb-1 flex items-center gap-1">
                        Ad Spend
                        <Tooltip text="Total amount spent on Shopping ads in the last 7 days." />
                    </div>
                    <div className="text-xl font-bold">${totalSpent.toFixed(2)}</div>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                    <div className="text-muted text-xs mb-1 flex items-center gap-1">
                        Sales
                        <Tooltip text="Number of purchases attributed to Shopping ads." />
                    </div>
                    <div className="text-xl font-bold">{totalConversions}</div>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                    <div className="text-muted text-xs mb-1 flex items-center gap-1">
                        Revenue
                        <Tooltip text="Total revenue generated from Shopping ad conversions." />
                    </div>
                    <div className="text-xl font-bold">${totalRevenue.toFixed(2)}</div>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                    <div className="text-muted text-xs mb-1 flex items-center gap-1">
                        ROAS
                        <Tooltip text="Return on Ad Spend. For every $1 spent on ads, this is how much revenue you earned back." />
                    </div>
                    <div className="text-xl font-bold text-success">{avgRoas.toFixed(1)}x</div>
                </div>
            </div>

            {/* Products Table */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="px-5 py-3 border-b border-border flex items-center justify-between bg-sidebar">
                    <h2 className="font-semibold text-sm">Product Listings</h2>
                    <div className="flex gap-2 text-xs">
                        <span className="bg-success/10 text-success px-2 py-1 rounded-full">{activeProducts.length} Active</span>
                        <span className="bg-danger/10 text-danger px-2 py-1 rounded-full">{products.filter((p) => p.status === "disapproved").length} Disapproved</span>
                        <span className="bg-warning/10 text-warning px-2 py-1 rounded-full">{products.filter((p) => p.status === "pending").length} Pending</span>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="text-left px-5 py-3 font-medium text-muted">Product</th>
                                <th className="text-left px-5 py-3 font-medium text-muted">Status</th>
                                <th className="text-right px-5 py-3 font-medium text-muted">Price</th>
                                <th className="text-right px-5 py-3 font-medium text-muted">Clicks</th>
                                <th className="text-right px-5 py-3 font-medium text-muted">Sales</th>
                                <th className="text-right px-5 py-3 font-medium text-muted">Spent</th>
                                <th className="text-right px-5 py-3 font-medium text-muted">ROAS</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {products.map((product) => (
                                <tr key={product.id} className="hover:bg-sidebar/50 transition">
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${product.image} shrink-0`} />
                                            <div>
                                                <div className="font-medium text-sm">{product.name}</div>
                                                <div className="text-xs text-muted">{product.category}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${product.status === "active" ? "bg-success/10 text-success" :
                                                product.status === "disapproved" ? "bg-danger/10 text-danger" :
                                                    "bg-warning/10 text-warning"
                                            }`}>
                                            {product.status === "active" ? <CheckCircle className="w-3 h-3" /> :
                                                product.status === "disapproved" ? <AlertTriangle className="w-3 h-3" /> :
                                                    <RefreshCw className="w-3 h-3" />}
                                            {product.status === "active" ? "Active" :
                                                product.status === "disapproved" ? "Disapproved" : "Pending"}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                        {product.salePrice ? (
                                            <div>
                                                <div className="font-medium text-success">${product.salePrice.toFixed(2)}</div>
                                                <div className="text-xs text-muted line-through">${product.price.toFixed(2)}</div>
                                            </div>
                                        ) : (
                                            <div className="font-medium">${product.price.toFixed(2)}</div>
                                        )}
                                    </td>
                                    <td className="px-5 py-4 text-right">{product.clicks > 0 ? product.clicks : "—"}</td>
                                    <td className="px-5 py-4 text-right font-medium">{product.conversions > 0 ? product.conversions : "—"}</td>
                                    <td className="px-5 py-4 text-right">{product.spent > 0 ? `$${product.spent.toFixed(2)}` : "—"}</td>
                                    <td className="px-5 py-4 text-right">
                                        {product.roas > 0 ? (
                                            <span className={`font-medium ${product.roas >= 5 ? "text-success" : product.roas >= 3 ? "text-warning" : "text-danger"}`}>
                                                {product.roas.toFixed(1)}x
                                            </span>
                                        ) : (
                                            "—"
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* AI Tips */}
            <div className="bg-primary-light border border-primary/20 rounded-xl p-4">
                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
                        <Zap className="w-4 h-4 text-white" />
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm">
                            <strong>Shopping Ad Insights:</strong>
                        </p>
                        <ul className="text-sm space-y-1.5">
                            <li>&bull; <strong>Canvas Tote</strong> has the most clicks (320) and best volume. Consider increasing its bid.</li>
                            <li>&bull; <strong>Silk Blouse</strong> was disapproved &mdash; likely needs better product images or description updates in Shopify.</li>
                            <li>&bull; <strong>Leather Crossbody Bag</strong> has 17.7x ROAS &mdash; your best performer! Feature it more prominently.</li>
                            <li>&bull; Products with <strong>sale prices</strong> show 40% higher CTR on average. Consider adding more promotions.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
