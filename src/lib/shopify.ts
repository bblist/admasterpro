/**
 * Shopify Integration Client
 *
 * Handles Shopify OAuth and Admin API calls.
 * Uses Shopify Admin REST API 2024-01.
 *
 * Requirements:
 *   SHOPIFY_CLIENT_ID      — Shopify app API key
 *   SHOPIFY_CLIENT_SECRET  — Shopify app API secret
 *   NEXT_PUBLIC_APP_URL    — Your app's base URL (for redirect URI)
 *
 * To create a Shopify app:
 *   1. Go to https://partners.shopify.com → Apps → Create app
 *   2. Set redirect URL to {NEXT_PUBLIC_APP_URL}/api/shopify/callback
 *   3. Request scopes: read_products,read_orders,read_analytics,read_inventory
 */

import { encrypt, decrypt } from "@/lib/crypto";

const API_VERSION = "2024-01";

const SHOPIFY_CLIENT_ID = process.env.SHOPIFY_CLIENT_ID || "";
const SHOPIFY_CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET || "";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const REQUIRED_SCOPES = "read_products,read_orders,read_analytics,read_inventory";

/* ── OAuth Helpers ──────────────────────────────────────────────── */

/**
 * Generate the Shopify OAuth authorization URL.
 * Redirects user to Shopify to authorize the app.
 */
export function getShopifyAuthUrl(shop: string, state: string): string {
    const cleanShop = shop.replace(/https?:\/\//, "").replace(/\/$/, "");
    const redirectUri = `${APP_URL}/api/shopify/callback`;

    return `https://${cleanShop}/admin/oauth/authorize?` +
        `client_id=${SHOPIFY_CLIENT_ID}` +
        `&scope=${REQUIRED_SCOPES}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&state=${state}`;
}

/**
 * Exchange the authorization code for an access token.
 */
export async function exchangeShopifyCode(shop: string, code: string): Promise<string> {
    const cleanShop = shop.replace(/https?:\/\//, "").replace(/\/$/, "");
    const res = await fetch(`https://${cleanShop}/admin/oauth/access_token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            client_id: SHOPIFY_CLIENT_ID,
            client_secret: SHOPIFY_CLIENT_SECRET,
            code,
        }),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Shopify token exchange failed: ${text}`);
    }

    const data = await res.json();
    return data.access_token;
}

/**
 * Encrypt a Shopify access token for database storage.
 */
export function encryptShopifyToken(token: string): string {
    return encrypt(token);
}

/**
 * Decrypt a stored Shopify access token.
 */
export function decryptShopifyToken(encrypted: string): string {
    return decrypt(encrypted);
}

/* ── Shopify Admin API Client ───────────────────────────────────── */

interface ShopifyRequestOptions {
    method?: string;
    body?: unknown;
}

/**
 * Make an authenticated request to the Shopify Admin REST API.
 */
async function shopifyFetch<T>(
    shop: string,
    accessToken: string,
    endpoint: string,
    options: ShopifyRequestOptions = {}
): Promise<T> {
    const cleanShop = shop.replace(/https?:\/\//, "").replace(/\/$/, "");
    const url = `https://${cleanShop}/admin/api/${API_VERSION}/${endpoint}`;

    const res = await fetch(url, {
        method: options.method || "GET",
        headers: {
            "X-Shopify-Access-Token": accessToken,
            "Content-Type": "application/json",
        },
        ...(options.body ? { body: JSON.stringify(options.body) } : {}),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Shopify API error (${res.status}): ${text}`);
    }

    return res.json();
}

/* ── Product Methods ────────────────────────────────────────────── */

export interface ShopifyProductRaw {
    id: number;
    title: string;
    body_html: string | null;
    product_type: string;
    vendor: string;
    status: string;
    tags: string;
    handle: string;
    image: { src: string } | null;
    images: { src: string }[];
    variants: {
        id: number;
        price: string;
        compare_at_price: string | null;
        sku: string;
        inventory_quantity: number;
    }[];
}

export interface ShopifyProductNormalized {
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

/**
 * Fetch all products from a Shopify store (paginated).
 */
export async function fetchShopifyProducts(
    shop: string,
    accessToken: string,
    limit = 50
): Promise<ShopifyProductNormalized[]> {
    const data = await shopifyFetch<{ products: ShopifyProductRaw[] }>(
        shop,
        accessToken,
        `products.json?limit=${limit}&status=active`
    );

    return (data.products || []).map(normalizeProduct);
}

/**
 * Fetch a single product by Shopify ID.
 */
export async function fetchShopifyProduct(
    shop: string,
    accessToken: string,
    productId: string
): Promise<ShopifyProductNormalized> {
    const data = await shopifyFetch<{ product: ShopifyProductRaw }>(
        shop,
        accessToken,
        `products/${productId}.json`
    );
    return normalizeProduct(data.product);
}

/**
 * Get product count for the store.
 */
export async function getShopifyProductCount(
    shop: string,
    accessToken: string
): Promise<number> {
    const data = await shopifyFetch<{ count: number }>(
        shop,
        accessToken,
        "products/count.json"
    );
    return data.count;
}

function normalizeProduct(p: ShopifyProductRaw): ShopifyProductNormalized {
    const firstVariant = p.variants?.[0];
    const totalInventory = p.variants?.reduce((sum, v) => sum + (v.inventory_quantity || 0), 0) || 0;

    return {
        shopifyId: String(p.id),
        title: p.title,
        description: p.body_html ? stripHtml(p.body_html) : null,
        productType: p.product_type || "",
        vendor: p.vendor || "",
        status: p.status,
        tags: p.tags || "",
        handle: p.handle || "",
        imageUrl: p.image?.src || p.images?.[0]?.src || null,
        price: firstVariant ? parseFloat(firstVariant.price) : null,
        compareAtPrice: firstVariant?.compare_at_price
            ? parseFloat(firstVariant.compare_at_price)
            : null,
        sku: firstVariant?.sku || null,
        inventoryQty: totalInventory,
    };
}

/* ── Order Methods ──────────────────────────────────────────────── */

export interface ShopifyOrderRaw {
    id: number;
    name: string;
    email: string;
    created_at: string;
    total_price: string;
    currency: string;
    financial_status: string;
    fulfillment_status: string | null;
    line_items: {
        product_id: number;
        title: string;
        quantity: number;
        price: string;
    }[];
}

export interface ShopifyOrderNormalized {
    shopifyId: string;
    orderNumber: string;
    email: string;
    createdAt: string;
    totalPrice: number;
    currency: string;
    financialStatus: string;
    fulfillmentStatus: string | null;
    itemCount: number;
    items: { productId: string; title: string; quantity: number; price: number }[];
}

/**
 * Fetch recent orders from a Shopify store.
 */
export async function fetchShopifyOrders(
    shop: string,
    accessToken: string,
    limit = 50
): Promise<ShopifyOrderNormalized[]> {
    const data = await shopifyFetch<{ orders: ShopifyOrderRaw[] }>(
        shop,
        accessToken,
        `orders.json?limit=${limit}&status=any&order=created_at+desc`
    );

    return (data.orders || []).map(o => ({
        shopifyId: String(o.id),
        orderNumber: o.name,
        email: o.email || "",
        createdAt: o.created_at,
        totalPrice: parseFloat(o.total_price),
        currency: o.currency,
        financialStatus: o.financial_status,
        fulfillmentStatus: o.fulfillment_status,
        itemCount: o.line_items.reduce((sum, li) => sum + li.quantity, 0),
        items: o.line_items.map(li => ({
            productId: String(li.product_id),
            title: li.title,
            quantity: li.quantity,
            price: parseFloat(li.price),
        })),
    }));
}

/* ── Shop Info ──────────────────────────────────────────────────── */

export interface ShopifyShopInfo {
    name: string;
    email: string;
    domain: string;
    myshopifyDomain: string;
    currency: string;
    country: string;
    plan: string;
    productsCount?: number;
}

export async function fetchShopInfo(
    shop: string,
    accessToken: string
): Promise<ShopifyShopInfo> {
    const data = await shopifyFetch<{ shop: Record<string, unknown> }>(
        shop,
        accessToken,
        "shop.json"
    );

    const s = data.shop;
    return {
        name: (s.name as string) || "",
        email: (s.email as string) || "",
        domain: (s.domain as string) || "",
        myshopifyDomain: (s.myshopify_domain as string) || "",
        currency: (s.currency as string) || "USD",
        country: (s.country_name as string) || "",
        plan: (s.plan_display_name as string) || "",
    };
}

/* ── Utilities ──────────────────────────────────────────────────── */

function stripHtml(html: string): string {
    return html
        .replace(/<[^>]*>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, " ")
        .trim();
}

/**
 * Validate a Shopify domain format.
 */
export function isValidShopifyDomain(shop: string): boolean {
    const cleaned = shop.replace(/https?:\/\//, "").replace(/\/$/, "");
    return /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/.test(cleaned);
}

/**
 * Verify HMAC for Shopify OAuth callbacks.
 */
export function verifyShopifyHmac(query: URLSearchParams): boolean {
    if (!SHOPIFY_CLIENT_SECRET) return false;

    const hmac = query.get("hmac");
    if (!hmac) return false;

    const params = new URLSearchParams(query);
    params.delete("hmac");
    params.sort();

    const message = params.toString();
    const crypto = require("crypto");
    const hash = crypto
        .createHmac("sha256", SHOPIFY_CLIENT_SECRET)
        .update(message)
        .digest("hex");

    return hash === hmac;
}
