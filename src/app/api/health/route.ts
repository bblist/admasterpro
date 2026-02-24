/**
 * Health Check API
 *
 * GET — System health status including database, external services
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isStripeConfigured } from "@/lib/stripe";
import { isGoogleAdsConfigured } from "@/lib/google-ads";

export async function GET() {
    const checks: Record<string, { status: string; latency?: number; error?: string }> = {};

    // Database
    const dbStart = Date.now();
    try {
        await prisma.$queryRaw`SELECT 1`;
        checks.database = { status: "healthy", latency: Date.now() - dbStart };
    } catch (err) {
        checks.database = { status: "unhealthy", latency: Date.now() - dbStart, error: String(err) };
    }

    // Stripe
    checks.stripe = {
        status: isStripeConfigured() ? "configured" : "not_configured",
    };

    // Google Ads
    checks.googleAds = {
        status: isGoogleAdsConfigured() ? "configured" : "not_configured",
    };

    // Email (Resend)
    checks.email = {
        status: process.env.RESEND_API_KEY ? "configured" : "not_configured",
    };

    // Sentry
    checks.sentry = {
        status: process.env.SENTRY_DSN ? "configured" : "not_configured",
    };

    // OpenAI
    checks.openai = {
        status: process.env.OPENAI_API_KEY ? "configured" : "not_configured",
    };

    // Anthropic
    checks.anthropic = {
        status: process.env.ANTHROPIC_API_KEY ? "configured" : "not_configured",
    };

    // Overall stats
    let userCount = 0;
    let subscriptionCount = 0;
    try {
        userCount = await prisma.user.count();
        subscriptionCount = await prisma.subscription.count({ where: { status: "active" } });
    } catch { /* ignore */ }

    const allHealthy = Object.values(checks).every(
        (c) => c.status === "healthy" || c.status === "configured"
    );

    return NextResponse.json({
        status: allHealthy ? "healthy" : "degraded",
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || "1.0.0",
        uptime: process.uptime(),
        checks,
        stats: {
            users: userCount,
            activeSubscriptions: subscriptionCount,
        },
    }, { status: allHealthy ? 200 : 503 });
}
