/**
 * Stripe API Route
 *
 * POST — Create checkout session (subscription or top-up) or handle webhook
 * GET  — Check Stripe configuration status + plan info
 *
 * Environment variables:
 *   STRIPE_SECRET_KEY        - Stripe Secret Key
 *   STRIPE_WEBHOOK_SECRET    - Stripe Webhook Signing Secret
 *   NEXT_PUBLIC_STRIPE_KEY   - Stripe Publishable Key (client-side)
 *   STRIPE_STARTER_PRICE_ID  - Price ID for $49/mo Starter plan
 *   STRIPE_PRO_PRICE_ID      - Price ID for $149/mo Pro plan
 *   STRIPE_TOPUP_30_PRICE_ID - Price ID for $30 top-up
 *   STRIPE_TOPUP_50_PRICE_ID - Price ID for $50 top-up
 *   STRIPE_TOPUP_100_PRICE_ID- Price ID for $100 top-up
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { stripeLimiter, checkRateLimit } from "@/lib/rate-limit";
import {
    isStripeConfigured,
    createSubscriptionCheckout,
    createTopUpCheckout,
    createCustomerPortalSession,
    constructWebhookEvent,
    TOP_UP_TOKENS,
} from "@/lib/stripe";
import { PLANS, TOP_UPS } from "@/lib/plans";
import {
    sendSubscriptionEmail,
    sendPaymentReceipt,
    sendPaymentFailedEmail,
    sendTopUpEmail,
} from "@/lib/email";

// ─── POST: Checkout or Webhook ──────────────────────────────────────────────

export async function POST(req: NextRequest) {
    // Stripe webhook — skip rate limiting (Stripe handles its own)
    if (req.headers.get("stripe-signature")) {
        return handleWebhook(req);
    }

    // Rate limit checkout requests
    const rateLimited = checkRateLimit(req, stripeLimiter);
    if (rateLimited) return rateLimited;

    // Checkout session creation
    return handleCheckout(req);
}

async function handleCheckout(req: NextRequest) {
    if (!isStripeConfigured()) {
        return NextResponse.json({
            error: "Stripe not configured",
            message: "Set STRIPE_SECRET_KEY environment variable.",
            demo: true,
        }, { status: 503 });
    }

    try {
        const body = await req.json();
        const { action, plan, topUpId, userId, email } = body;

        if (!userId || !email) {
            return NextResponse.json({ error: "userId and email required" }, { status: 400 });
        }

        // Get user's existing Stripe customer ID
        const subscription = await prisma.subscription.findUnique({
            where: { userId },
        });

        if (action === "portal" && subscription?.stripeCustomerId) {
            // Customer portal for managing existing subscription
            const url = await createCustomerPortalSession(subscription.stripeCustomerId);
            return NextResponse.json({ url });
        }

        if (action === "topup" && topUpId) {
            // One-time token purchase
            const url = await createTopUpCheckout({
                topUpId,
                userId,
                email,
                stripeCustomerId: subscription?.stripeCustomerId || undefined,
            });

            if (!url) {
                return NextResponse.json({ error: "Invalid top-up package or price not configured" }, { status: 400 });
            }
            return NextResponse.json({ url });
        }

        // Subscription checkout
        if (!plan || !["starter", "pro"].includes(plan)) {
            return NextResponse.json({ error: "Invalid plan. Use 'starter' or 'pro'" }, { status: 400 });
        }

        const url = await createSubscriptionCheckout({
            plan,
            userId,
            email,
            stripeCustomerId: subscription?.stripeCustomerId || undefined,
        });

        if (!url) {
            return NextResponse.json({ error: "Price not configured for this plan" }, { status: 400 });
        }

        return NextResponse.json({ url });
    } catch (error) {
        console.error("[Stripe] Checkout error:", error);
        return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
    }
}

// ─── Webhook Handler ────────────────────────────────────────────────────────

async function handleWebhook(req: NextRequest) {
    try {
        const body = await req.text();
        const sig = req.headers.get("stripe-signature") || "";

        const event = constructWebhookEvent(body, sig);
        if (!event) {
            return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
        }

        console.log("[Stripe] Webhook event:", event.type);

        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object as {
                    client_reference_id?: string;
                    customer?: string;
                    mode?: string;
                    metadata?: Record<string, string>;
                    subscription?: string;
                    payment_intent?: string;
                };

                const userId = session.client_reference_id || session.metadata?.userId;
                if (!userId) break;

                if (session.mode === "subscription") {
                    // Subscription checkout completed
                    const plan = session.metadata?.plan || "starter";
                    const planConfig = PLANS[plan];

                    await prisma.subscription.upsert({
                        where: { userId },
                        update: {
                            plan,
                            status: "active",
                            stripeCustomerId: session.customer as string,
                            stripeSubscriptionId: session.subscription as string,
                            aiMessagesLimit: planConfig?.aiMessages || 200,
                            aiMessagesUsed: 0,
                            campaignsLimit: planConfig?.campaigns || 10,
                            adsAccountsLimit: planConfig?.adsAccounts || 2,
                            currentPeriodStart: new Date(),
                        },
                        create: {
                            userId,
                            plan,
                            status: "active",
                            stripeCustomerId: session.customer as string,
                            stripeSubscriptionId: session.subscription as string,
                            aiMessagesLimit: planConfig?.aiMessages || 200,
                            campaignsLimit: planConfig?.campaigns || 10,
                            adsAccountsLimit: planConfig?.adsAccounts || 2,
                            currentPeriodStart: new Date(),
                        },
                    });

                    console.log(`[Stripe] User ${userId} subscribed to ${plan}`);

                    // Send subscription confirmation email
                    try {
                        const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } });
                        if (user?.email) {
                            const amount = plan === "pro" ? 149 : 49;
                            await sendSubscriptionEmail(user.email, user.name || "there", plan === "pro" ? "Pro" : "Starter", amount);
                        }
                    } catch (e) { console.error("[Stripe] Email send failed:", e); }
                } else if (session.mode === "payment") {
                    // Top-up payment completed
                    const topUpId = session.metadata?.topUpId;
                    if (topUpId && TOP_UP_TOKENS[topUpId]) {
                        const tokens = TOP_UP_TOKENS[topUpId];

                        // Record the purchase
                        await prisma.tokenPurchase.create({
                            data: {
                                userId,
                                amount: topUpId === "topup_30" ? 30 : topUpId === "topup_50" ? 50 : 100,
                                tokens,
                                stripePaymentIntentId: session.payment_intent as string,
                                status: "completed",
                            },
                        });

                        // Add bonus tokens to subscription
                        await prisma.subscription.update({
                            where: { userId },
                            data: { bonusTokens: { increment: tokens } },
                        });

                        console.log(`[Stripe] User ${userId} purchased ${tokens} bonus tokens ($${topUpId})`);

                        // Send top-up confirmation email
                        try {
                            const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } });
                            if (user?.email) {
                                const amount = topUpId === "topup_30" ? 30 : topUpId === "topup_50" ? 50 : 100;
                                await sendTopUpEmail(user.email, user.name || "there", tokens, amount);
                            }
                        } catch (e) { console.error("[Stripe] Top-up email failed:", e); }
                    }
                }
                break;
            }

            case "customer.subscription.updated": {
                const sub = event.data.object as {
                    id?: string;
                    status?: string;
                    cancel_at_period_end?: boolean;
                    current_period_end?: number;
                    metadata?: Record<string, string>;
                };

                if (sub.id) {
                    const existing = await prisma.subscription.findFirst({
                        where: { stripeSubscriptionId: sub.id },
                    });

                    if (existing) {
                        await prisma.subscription.update({
                            where: { id: existing.id },
                            data: {
                                status: sub.status === "active" ? "active" : sub.status === "past_due" ? "past_due" : existing.status,
                                cancelAtPeriodEnd: sub.cancel_at_period_end || false,
                                currentPeriodEnd: sub.current_period_end ? new Date(sub.current_period_end * 1000) : undefined,
                            },
                        });
                    }
                }
                break;
            }

            case "customer.subscription.deleted": {
                const sub = event.data.object as { id?: string; metadata?: Record<string, string> };

                if (sub.id) {
                    const existing = await prisma.subscription.findFirst({
                        where: { stripeSubscriptionId: sub.id },
                    });

                    if (existing) {
                        // Downgrade to free
                        const freePlan = PLANS.free;
                        await prisma.subscription.update({
                            where: { id: existing.id },
                            data: {
                                plan: "free",
                                status: "cancelled",
                                aiMessagesLimit: freePlan.aiMessages,
                                campaignsLimit: freePlan.campaigns,
                                adsAccountsLimit: freePlan.adsAccounts,
                                cancelAtPeriodEnd: false,
                            },
                        });
                        console.log(`[Stripe] Subscription ${sub.id} cancelled — user downgraded to free`);
                    }
                }
                break;
            }

            case "invoice.payment_failed": {
                const invoice = event.data.object as {
                    subscription?: string;
                    customer_email?: string;
                };

                if (invoice.subscription) {
                    const existing = await prisma.subscription.findFirst({
                        where: { stripeSubscriptionId: invoice.subscription },
                    });

                    if (existing) {
                        await prisma.subscription.update({
                            where: { id: existing.id },
                            data: { status: "past_due" },
                        });

                        // Send payment failed email
                        try {
                            const user = await prisma.user.findUnique({ where: { id: existing.userId }, select: { email: true, name: true } });
                            if (user?.email) {
                                await sendPaymentFailedEmail(user.email, user.name || "there", existing.plan === "pro" ? "Pro" : "Starter");
                            }
                        } catch (e) { console.error("[Stripe] Payment failed email error:", e); }
                    }
                }
                console.log(`[Stripe] Payment failed for ${invoice.customer_email}`);
                break;
            }

            case "invoice.paid": {
                // Monthly renewal — reset usage counters
                const invoice = event.data.object as {
                    subscription?: string;
                    customer_email?: string;
                    amount_paid?: number;
                    billing_reason?: string;
                    hosted_invoice_url?: string;
                };

                // Only process recurring payments (not the initial subscription payment)
                if (invoice.subscription && invoice.billing_reason === "subscription_cycle") {
                    const existing = await prisma.subscription.findFirst({
                        where: { stripeSubscriptionId: invoice.subscription },
                    });

                    if (existing) {
                        const planConfig = PLANS[existing.plan];

                        await prisma.subscription.update({
                            where: { id: existing.id },
                            data: {
                                status: "active",
                                aiMessagesUsed: 0,  // Reset monthly usage
                                currentPeriodStart: new Date(),
                            },
                        });

                        // Send payment receipt email
                        try {
                            const user = await prisma.user.findUnique({ where: { id: existing.userId }, select: { email: true, name: true } });
                            if (user?.email) {
                                const amount = (invoice.amount_paid || 0) / 100;
                                await sendPaymentReceipt(
                                    user.email,
                                    user.name || "there",
                                    amount,
                                    `${existing.plan === "pro" ? "Pro" : "Starter"} Plan — Monthly Renewal`,
                                    invoice.hosted_invoice_url
                                );
                            }
                        } catch (e) { console.error("[Stripe] Receipt email error:", e); }

                        console.log(`[Stripe] Invoice paid for ${invoice.customer_email} — usage reset`);
                    }
                }
                break;
            }

            default:
                console.log("[Stripe] Unhandled event:", event.type);
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error("[Stripe] Webhook error:", error);
        return NextResponse.json({ error: "Webhook processing failed" }, { status: 400 });
    }
}

// ─── GET: Plan Info ─────────────────────────────────────────────────────────

export async function GET() {
    return NextResponse.json({
        configured: isStripeConfigured(),
        plans: {
            free: { price: "$0", period: "forever" },
            starter: { price: "$49", period: "/month" },
            pro: { price: "$149", period: "/month" },
        },
        topUps: TOP_UPS,
    });
}
