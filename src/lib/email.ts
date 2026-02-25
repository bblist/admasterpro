/**
 * Email Service — AWS SES (primary) or Resend (fallback)
 *
 * Handles all transactional & notification emails.
 * Uses AWS SES when configured (default on Lightsail), falls back to Resend.
 *
 * Environment variables:
 *   AWS_REGION (default: us-east-1) - AWS region for SES
 *   RESEND_API_KEY (optional) - Resend API key as fallback
 *   FROM_EMAIL - Sender email address
 */

import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { Resend } from "resend";

const AWS_REGION = process.env.AWS_REGION || "us-east-1";
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || "AdMaster Pro <noreply@admasterai.nobleblocks.com>";
const APP_URL = process.env.NEXTAUTH_URL || "https://admasterai.nobleblocks.com";

// Use SES if running on AWS (has credentials), otherwise Resend
const USE_SES = process.env.AWS_EXECUTION_ENV || process.env.USE_AWS_SES === "true";

let sesClient: SESClient | null = null;
let resend: Resend | null = null;

function getSES(): SESClient {
    if (!sesClient) {
        sesClient = new SESClient({ region: AWS_REGION });
    }
    return sesClient;
}

function getResend(): Resend | null {
    if (!RESEND_API_KEY) {
        return null;
    }
    if (!resend) {
        resend = new Resend(RESEND_API_KEY);
    }
    return resend;
}

interface EmailResult {
    success: boolean;
    id?: string;
    error?: string;
}

async function sendEmailViaSES(to: string, subject: string, html: string): Promise<EmailResult> {
    try {
        const ses = getSES();
        const fromAddress = FROM_EMAIL.includes("<")
            ? FROM_EMAIL.match(/<(.+)>/)?.[1] || FROM_EMAIL
            : FROM_EMAIL;

        const command = new SendEmailCommand({
            Source: FROM_EMAIL,
            Destination: { ToAddresses: [to] },
            Message: {
                Subject: { Data: subject, Charset: "UTF-8" },
                Body: { Html: { Data: html, Charset: "UTF-8" } },
            },
        });

        const response = await ses.send(command);
        console.log(`[Email/SES] Sent to ${to}: ${subject}`);
        return { success: true, id: response.MessageId };
    } catch (err) {
        console.error("[Email/SES] Error:", err);
        return { success: false, error: String(err) };
    }
}

async function sendEmailViaResend(to: string, subject: string, html: string): Promise<EmailResult> {
    const r = getResend();
    if (!r) {
        console.warn(`[Email] No email provider configured — dry-run. Would send to ${to}: ${subject}`);
        return { success: true, id: "dry-run" };
    }

    try {
        const { data, error } = await r.emails.send({
            from: FROM_EMAIL,
            to,
            subject,
            html,
        });

        if (error) {
            console.error("[Email/Resend] Send failed:", error);
            return { success: false, error: error.message };
        }

        return { success: true, id: data?.id };
    } catch (err) {
        console.error("[Email/Resend] Exception:", err);
        return { success: false, error: String(err) };
    }
}

async function sendEmail(to: string, subject: string, html: string): Promise<EmailResult> {
    // Try SES first (on AWS), then Resend
    if (USE_SES) {
        return sendEmailViaSES(to, subject, html);
    }
    return sendEmailViaResend(to, subject, html);
}

// ─── HTML Escaping ──────────────────────────────────────────────────────────

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

// ─── Email Templates ────────────────────────────────────────────────────────

function baseTemplate(title: string, body: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
        .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 32px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 24px; }
        .header p { color: #e0e7ff; margin: 8px 0 0; font-size: 14px; }
        .body { padding: 32px; color: #1f2937; line-height: 1.6; }
        .body h2 { color: #111827; margin-top: 0; }
        .btn { display: inline-block; background: #6366f1; color: #ffffff !important; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; margin: 16px 0; }
        .btn:hover { background: #4f46e5; }
        .stats { background: #f9fafb; border-radius: 8px; padding: 20px; margin: 16px 0; }
        .stats-grid { display: flex; flex-wrap: wrap; gap: 16px; }
        .stat { flex: 1; min-width: 120px; text-align: center; }
        .stat-value { font-size: 24px; font-weight: 700; color: #6366f1; }
        .stat-label { font-size: 12px; color: #6b7280; text-transform: uppercase; }
        .footer { padding: 24px 32px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #f3f4f6; }
        .footer a { color: #6366f1; text-decoration: none; }
        .alert { background: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 16px 0; border-radius: 0 8px 8px 0; }
        .success { background: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px; margin: 16px 0; border-radius: 0 8px 8px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>AdMaster Pro</h1>
            <p>AI-Powered Google Ads Management</p>
        </div>
        <div class="body">
            ${body}
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} AdMaster Pro by NobleBlocks. All rights reserved.</p>
            <p><a href="${APP_URL}">admasterai.nobleblocks.com</a></p>
        </div>
    </div>
</body>
</html>`;
}

// ─── Welcome Email ──────────────────────────────────────────────────────────

export async function sendWelcomeEmail(to: string, name: string): Promise<EmailResult> {
    const safeName = escapeHtml(name);
    const html = baseTemplate("Welcome to AdMaster Pro", `
        <h2>Welcome, ${safeName}! 🎉</h2>
        <p>Thanks for signing up for AdMaster Pro — your AI-powered Google Ads management platform.</p>
        <p>Here's how to get started:</p>
        <ol>
            <li><strong>Train your AI</strong> — Add your business details to the Knowledge Base so our AI understands your brand.</li>
            <li><strong>Chat with AdMaster</strong> — Ask anything about Google Ads strategy, campaign setup, or optimization.</li>
            <li><strong>Connect Google Ads</strong> — Link your Google Ads account for real-time campaign management.</li>
        </ol>
        <p style="text-align: center;">
            <a href="${APP_URL}/dashboard/chat" class="btn">Open AdMaster Pro</a>
        </p>
        <div class="success">
            <strong>Free tier included:</strong> You get 10 AI messages per month and a free account audit to start!
        </div>
    `);

    return sendEmail(to, "Welcome to AdMaster Pro! 🚀", html);
}

// ─── Subscription Confirmation ──────────────────────────────────────────────

export async function sendSubscriptionEmail(
    to: string,
    name: string,
    plan: string,
    amount: number
): Promise<EmailResult> {
    const safeName = escapeHtml(name);
    const safePlan = escapeHtml(plan);
    const html = baseTemplate("Subscription Confirmed", `
        <h2>Subscription Confirmed! ✅</h2>
        <p>Hi ${safeName},</p>
        <p>Your <strong>${safePlan}</strong> subscription is now active.</p>
        <div class="stats">
            <div class="stats-grid">
                <div class="stat">
                    <div class="stat-value">$${amount}</div>
                    <div class="stat-label">Per Month</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${safePlan}</div>
                    <div class="stat-label">Plan</div>
                </div>
            </div>
        </div>
        <p>Your plan includes:</p>
        <ul>
            ${safePlan === "Starter" ? `
                <li>100 AI messages per month</li>
                <li>Campaign creation & management</li>
                <li>Keyword research & optimization</li>
                <li>Basic analytics</li>
            ` : `
                <li>Unlimited AI messages</li>
                <li>Campaign creation & management</li>
                <li>Advanced analytics & reporting</li>
                <li>Auto-pilot mode</li>
                <li>Shopping ads support</li>
                <li>Priority support</li>
            `}
        </ul>
        <p style="text-align: center;">
            <a href="${APP_URL}/dashboard" class="btn">Go to Dashboard</a>
        </p>
    `);

    return sendEmail(to, `${plan} Plan Activated — AdMaster Pro`, html);
}

// ─── Payment Receipt ────────────────────────────────────────────────────────

export async function sendPaymentReceipt(
    to: string,
    name: string,
    amount: number,
    description: string,
    invoiceUrl?: string
): Promise<EmailResult> {
    const safeName = escapeHtml(name);
    const safeDesc = escapeHtml(description);
    const html = baseTemplate("Payment Receipt", `
        <h2>Payment Receipt</h2>
        <p>Hi ${safeName},</p>
        <p>We've received your payment. Here are the details:</p>
        <div class="stats">
            <div class="stats-grid">
                <div class="stat">
                    <div class="stat-value">$${amount.toFixed(2)}</div>
                    <div class="stat-label">Amount</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${new Date().toLocaleDateString()}</div>
                    <div class="stat-label">Date</div>
                </div>
            </div>
        </div>
        <p><strong>Description:</strong> ${safeDesc}</p>
        ${invoiceUrl ? `<p style="text-align: center;"><a href="${invoiceUrl}" class="btn">View Invoice</a></p>` : ""}
        <p style="font-size: 14px; color: #6b7280;">If you have any questions about this charge, reply to this email or contact support.</p>
    `);

    return sendEmail(to, `Payment Receipt — $${amount.toFixed(2)} — AdMaster Pro`, html);
}

// ─── Usage Warning ──────────────────────────────────────────────────────────

export async function sendUsageLimitWarning(
    to: string,
    name: string,
    used: number,
    limit: number,
    plan: string
): Promise<EmailResult> {
    const pct = Math.round((used / limit) * 100);

    const safeName = escapeHtml(name);
    const safePlan = escapeHtml(plan);
    const html = baseTemplate("Usage Alert", `
        <h2>Usage Alert ⚠️</h2>
        <p>Hi ${safeName},</p>
        <p>You've used <strong>${pct}%</strong> of your monthly AI messages on your <strong>${safePlan}</strong> plan.</p>
        <div class="stats">
            <div class="stats-grid">
                <div class="stat">
                    <div class="stat-value">${used}</div>
                    <div class="stat-label">Used</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${limit}</div>
                    <div class="stat-label">Limit</div>
                </div>
            </div>
        </div>
        ${pct >= 100 ? `
        <div class="alert">
            <strong>Limit reached!</strong> You can purchase a message top-up or upgrade your plan to continue using the AI assistant.
        </div>
        ` : `
        <p>To avoid interruption, consider upgrading your plan or purchasing a message top-up.</p>
        `}
        <p style="text-align: center;">
            <a href="${APP_URL}/dashboard/settings" class="btn">${pct >= 100 ? "Get More Messages" : "Manage Plan"}</a>
        </p>
    `);

    return sendEmail(
        to,
        pct >= 100 ? "Message Limit Reached — AdMaster Pro" : "Usage Alert — AdMaster Pro",
        html
    );
}

// ─── Weekly Performance Report ──────────────────────────────────────────────

export interface WeeklyReportData {
    impressions: number;
    clicks: number;
    cost: number;
    conversions: number;
    ctr: number;
    costPerConversion: number;
    topCampaign: string;
    topKeyword: string;
    weekOverWeekCost: number; // percentage change
}

export async function sendWeeklyReport(
    to: string,
    name: string,
    data: WeeklyReportData
): Promise<EmailResult> {
    const trend = data.weekOverWeekCost >= 0 ? "📈" : "📉";
    const trendColor = data.weekOverWeekCost <= 0 ? "#22c55e" : "#ef4444";

    const safeName = escapeHtml(name);
    const safeTopCampaign = escapeHtml(data.topCampaign);
    const safeTopKeyword = escapeHtml(data.topKeyword);
    const html = baseTemplate("Weekly Performance Report", `
        <h2>Weekly Performance Report ${trend}</h2>
        <p>Hi ${safeName}, here's your Google Ads performance for the past 7 days:</p>
        <div class="stats">
            <div class="stats-grid">
                <div class="stat">
                    <div class="stat-value">${data.impressions.toLocaleString()}</div>
                    <div class="stat-label">Impressions</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${data.clicks.toLocaleString()}</div>
                    <div class="stat-label">Clicks</div>
                </div>
                <div class="stat">
                    <div class="stat-value">$${data.cost.toFixed(2)}</div>
                    <div class="stat-label">Spend</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${data.conversions.toFixed(1)}</div>
                    <div class="stat-label">Conversions</div>
                </div>
            </div>
        </div>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 8px 0; color: #6b7280;">CTR</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 600;">${(data.ctr * 100).toFixed(2)}%</td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 8px 0; color: #6b7280;">Cost/Conversion</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 600;">$${data.costPerConversion.toFixed(2)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 8px 0; color: #6b7280;">Week-over-Week Spend</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 600; color: ${trendColor};">${data.weekOverWeekCost >= 0 ? "+" : ""}${data.weekOverWeekCost.toFixed(1)}%</td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 8px 0; color: #6b7280;">Top Campaign</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 600;">${safeTopCampaign}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; color: #6b7280;">Top Keyword</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 600;">${safeTopKeyword}</td>
            </tr>
        </table>
        <p style="text-align: center;">
            <a href="${APP_URL}/dashboard/analytics" class="btn">View Full Analytics</a>
        </p>
    `);

    return sendEmail(to, "Weekly Google Ads Report — AdMaster Pro", html);
}

// ─── Payment Failed ─────────────────────────────────────────────────────────

export async function sendPaymentFailedEmail(
    to: string,
    name: string,
    plan: string
): Promise<EmailResult> {
    const safeName = escapeHtml(name);
    const safePlan = escapeHtml(plan);
    const html = baseTemplate("Payment Failed", `
        <h2>Payment Failed ⚠️</h2>
        <p>Hi ${safeName},</p>
        <div class="alert">
            We were unable to process your payment for your <strong>${safePlan}</strong> subscription.
        </div>
        <p>Please update your payment method to continue using AdMaster Pro without interruption.</p>
        <p style="text-align: center;">
            <a href="${APP_URL}/dashboard/settings" class="btn">Update Payment Method</a>
        </p>
        <p style="font-size: 14px; color: #6b7280;">If your payment method is not updated within 7 days, your account will be downgraded to the Free plan.</p>
    `);

    return sendEmail(to, "Action Required: Payment Failed — AdMaster Pro", html);
}

// ─── Token Top-Up Confirmation ──────────────────────────────────────────────

export async function sendTopUpEmail(
    to: string,
    name: string,
    tokens: number,
    amount: number
): Promise<EmailResult> {
    const safeName = escapeHtml(name);
    const html = baseTemplate("Token Top-Up Confirmed", `
        <h2>Message Top-Up Confirmed! ✅</h2>
        <p>Hi ${safeName},</p>
        <p>Your message top-up has been applied to your account.</p>
        <div class="stats">
            <div class="stats-grid">
                <div class="stat">
                    <div class="stat-value">+${tokens}</div>
                    <div class="stat-label">Messages Added</div>
                </div>
                <div class="stat">
                    <div class="stat-value">$${amount.toFixed(2)}</div>
                    <div class="stat-label">Amount Paid</div>
                </div>
            </div>
        </div>
        <p style="text-align: center;">
            <a href="${APP_URL}/dashboard/chat" class="btn">Continue Chatting</a>
        </p>
    `);

    return sendEmail(to, `+${tokens} Messages Added — AdMaster Pro`, html);
}

export { sendEmail, getResend };
