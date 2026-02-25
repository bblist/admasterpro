/**
 * Stripe Client Utility
 *
 * Server-side Stripe SDK wrapper for subscriptions, checkout, and token purchases.
 * All Stripe operations go through this file.
 *
 * Environment variables:
 *   STRIPE_SECRET_KEY       - Stripe secret key (sk_test_... or sk_live_...)
 *   STRIPE_WEBHOOK_SECRET   - Webhook signing secret (whsec_...)
 *   NEXT_PUBLIC_STRIPE_KEY  - Publishable key for client-side (pk_test_... or pk_live_...)
 *
 * Stripe Products to create in Dashboard:
 *   1. "AdMaster Pro Starter" — $49/mo recurring
 *   2. "AdMaster Pro Pro"     — $149/mo recurring
 *   3. "AI Top-Up 50 Messages"  — $30 one-time
 *   4. "AI Top-Up 100 Messages" — $50 one-time
 *   5. "AI Top-Up 250 Messages" — $100 one-time
 */

import Stripe from "stripe";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

// Initialize Stripe only when key is available
export const stripe = STRIPE_SECRET_KEY
    ? new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-12-18.acacia" as Stripe.LatestApiVersion })
    : null;

export function isStripeConfigured(): boolean {
    return !!STRIPE_SECRET_KEY;
}

// ─── Price IDs (set in env or Stripe Dashboard) ─────────────────────────────

export const STRIPE_PRICES = {
    starter: process.env.STRIPE_STARTER_PRICE_ID || "",
    pro: process.env.STRIPE_PRO_PRICE_ID || "",
    topup_30: process.env.STRIPE_TOPUP_30_PRICE_ID || "",
    topup_50: process.env.STRIPE_TOPUP_50_PRICE_ID || "",
    topup_100: process.env.STRIPE_TOPUP_100_PRICE_ID || "",
};

const BASE_URL = process.env.NEXTAUTH_URL || "https://admasterai.nobleblocks.com";

// ─── Checkout Session ───────────────────────────────────────────────────────

export async function createSubscriptionCheckout(params: {
    plan: "starter" | "pro";
    userId: string;
    email: string;
    stripeCustomerId?: string;
}): Promise<string | null> {
    if (!stripe) return null;

    const priceId = STRIPE_PRICES[params.plan];
    if (!priceId) return null;

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
        mode: "subscription",
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${BASE_URL}/dashboard/settings?upgraded=true&plan=${params.plan}`,
        cancel_url: `${BASE_URL}/pricing?cancelled=true`,
        client_reference_id: params.userId,
        customer_email: params.stripeCustomerId ? undefined : params.email,
        customer: params.stripeCustomerId || undefined,
        subscription_data: {
            trial_period_days: 7,
            metadata: { userId: params.userId, plan: params.plan },
        },
        metadata: { userId: params.userId, plan: params.plan },
        allow_promotion_codes: true,
    };

    const session = await stripe.checkout.sessions.create({
        ...sessionParams,
        idempotencyKey: `sub_${params.userId}_${params.plan}`,
    } as any);
    return session.url;
}

export async function createTopUpCheckout(params: {
    topUpId: "topup_30" | "topup_50" | "topup_100";
    userId: string;
    email: string;
    stripeCustomerId?: string;
}): Promise<string | null> {
    if (!stripe) return null;

    const priceId = STRIPE_PRICES[params.topUpId];
    if (!priceId) return null;

    const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${BASE_URL}/dashboard/settings?topup=success&package=${params.topUpId}`,
        cancel_url: `${BASE_URL}/dashboard/settings?topup=cancelled`,
        client_reference_id: params.userId,
        customer_email: params.stripeCustomerId ? undefined : params.email,
        customer: params.stripeCustomerId || undefined,
        metadata: { userId: params.userId, topUpId: params.topUpId },
    }, {
        idempotencyKey: `topup_${params.userId}_${params.topUpId}`,
    });

    return session.url;
}

// ─── Customer Portal ────────────────────────────────────────────────────────

export async function createCustomerPortalSession(stripeCustomerId: string): Promise<string | null> {
    if (!stripe) return null;

    const session = await stripe.billingPortal.sessions.create({
        customer: stripeCustomerId,
        return_url: `${BASE_URL}/dashboard/settings`,
    });

    return session.url;
}

// ─── Webhook Verification ───────────────────────────────────────────────────

export function constructWebhookEvent(
    body: string,
    signature: string
): Stripe.Event | null {
    if (!stripe) return null;

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) return null;

    try {
        return stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
        console.error("[Stripe] Webhook signature verification failed:", err);
        return null;
    }
}

// ─── Top-Up Token Mapping ───────────────────────────────────────────────────

export const TOP_UP_TOKENS: Record<string, number> = {
    topup_30: 50,
    topup_50: 100,
    topup_100: 250,
};
