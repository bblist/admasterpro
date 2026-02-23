/**
 * Stripe Webhook & Checkout API
 *
 * Handles Stripe payment events for subscriptions.
 *
 * Environment variables needed:
 *   STRIPE_SECRET_KEY        - Stripe Secret Key (sk_live_... or sk_test_...)
 *   STRIPE_WEBHOOK_SECRET    - Stripe Webhook Signing Secret (whsec_...)
 *   NEXT_PUBLIC_STRIPE_KEY   - Stripe Publishable Key (pk_live_... or pk_test_...)
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

/** Minimal Stripe event shape for webhook handling */
interface StripeEvent {
    type: string;
    data: {
        object: {
            id?: string;
            customer_email?: string;
            status?: string;
        };
    };
}

/**
 * Verify Stripe webhook signature (HMAC-SHA256).
 * Mirrors stripe.webhooks.constructEvent() without requiring the stripe package.
 */
async function verifyStripeWebhook(
    payload: string,
    sigHeader: string,
    secret: string,
    tolerance = 300 // 5 minutes
): Promise<StripeEvent | null> {
    const parts = Object.fromEntries(
        sigHeader.split(",").map((p) => {
            const [k, v] = p.split("=");
            return [k, v];
        })
    );

    const timestamp = parseInt(parts.t, 10);
    if (isNaN(timestamp) || Math.abs(Date.now() / 1000 - timestamp) > tolerance) {
        return null; // Timestamp out of tolerance
    }

    const signedPayload = `${timestamp}.${payload}`;
    const expected = crypto.createHmac("sha256", secret).update(signedPayload).digest("hex");

    if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(parts.v1 || ""))) {
        return null; // Signature mismatch
    }

    try {
        return JSON.parse(payload);
    } catch {
        return null;
    }
}

// POST — Create checkout session or handle webhook
export async function POST(req: NextRequest) {
    // Stripe webhook (identified by stripe-signature header)
    if (req.headers.get("stripe-signature")) {
        return handleWebhook(req);
    }

    // Checkout session creation
    return createCheckoutSession(req);
}

async function createCheckoutSession(req: NextRequest) {
    if (!STRIPE_SECRET_KEY) {
        return NextResponse.json({
            error: "Stripe not configured",
            message: "Set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET environment variables.",
            demo: true,
            checkoutUrl: "/dashboard/settings?upgrade=demo",
        }, { status: 503 });
    }

    try {
        const body = await req.json();
        const plan = body.plan || "pro"; // "pro" or "agency"

        const prices: Record<string, string> = {
            pro: process.env.STRIPE_PRO_PRICE_ID || "",
            agency: process.env.STRIPE_AGENCY_PRICE_ID || "",
        };

        const priceId = prices[plan];
        if (!priceId) {
            return NextResponse.json({ error: "Invalid plan or price ID not configured" }, { status: 400 });
        }

        const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                "mode": "subscription",
                "success_url": `${process.env.NEXTAUTH_URL || "https://admasterai.nobleblocks.com"}/dashboard/settings?upgraded=true`,
                "cancel_url": `${process.env.NEXTAUTH_URL || "https://admasterai.nobleblocks.com"}/dashboard/settings?cancelled=true`,
                "line_items[0][price]": priceId,
                "line_items[0][quantity]": "1",
            }),
        });

        const session = await res.json();
        return NextResponse.json({ url: session.url });
    } catch (error) {
        console.error("[Stripe] Checkout error:", error);
        return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
    }
}

async function handleWebhook(req: NextRequest) {
    const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
    if (!WEBHOOK_SECRET || !STRIPE_SECRET_KEY) {
        return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
    }

    try {
        const body = await req.text();
        const sig = req.headers.get("stripe-signature") || "";

        // Verify webhook signature (HMAC-SHA256)
        const event = await verifyStripeWebhook(body, sig, WEBHOOK_SECRET);
        if (!event) {
            return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
        }

        switch (event.type) {
            case "checkout.session.completed":
                console.log("[Stripe] Checkout completed:", event.data.object.customer_email);
                // TODO: Update user plan in database
                break;

            case "customer.subscription.updated":
                console.log("[Stripe] Subscription updated:", event.data.object.id);
                // TODO: Update subscription status
                break;

            case "customer.subscription.deleted":
                console.log("[Stripe] Subscription cancelled:", event.data.object.id);
                // TODO: Downgrade user to free plan
                break;

            case "invoice.payment_failed":
                console.log("[Stripe] Payment failed:", event.data.object.customer_email);
                // TODO: Notify user, retry logic
                break;

            default:
                console.log("[Stripe] Unhandled event:", event.type);
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error("[Stripe] Webhook error:", error);
        return NextResponse.json({ error: "Webhook processing failed" }, { status: 400 });
    }
}

// GET — Check Stripe configuration status
export async function GET() {
    return NextResponse.json({
        configured: !!STRIPE_SECRET_KEY,
        plans: {
            pro: { price: "$49/mo", features: ["Unlimited AI", "10 campaigns", "Display ads", "Call tracking"] },
            agency: { price: "$149/mo", features: ["Everything in Pro", "Multi-client", "White-label", "API access"] },
        },
    });
}
