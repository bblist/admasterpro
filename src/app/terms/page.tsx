"use client";

import Link from "next/link";
import { Zap, ArrowLeft, Shield } from "lucide-react";

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-background">
            {/* Schema */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "WebPage",
                        name: "Terms of Service — AdMaster Pro",
                        description:
                            "Terms of Service for AdMaster Pro, an AI-powered Google Ads management platform by NobleBlocks LLC.",
                        url: "https://admasterai.nobleblocks.com/terms",
                        publisher: {
                            "@type": "Organization",
                            name: "NobleBlocks LLC",
                        },
                    }),
                }}
            />

            <nav className="border-b border-border bg-background/95 backdrop-blur">
                <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                            <Zap className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-lg text-foreground">
                            AdMaster <span className="text-primary">Pro</span>
                        </span>
                    </Link>
                    <Link
                        href="/"
                        className="text-sm text-muted hover:text-foreground flex items-center gap-1"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back
                    </Link>
                </div>
            </nav>

            <main className="max-w-3xl mx-auto px-4 py-12">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                        <Shield className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">
                            Terms of Service
                        </h1>
                        <p className="text-sm text-muted">
                            Last updated: February 2026
                        </p>
                    </div>
                </div>

                <div className="prose prose-sm dark:prose-invert space-y-6 text-muted">
                    <p>
                        These Terms of Service (&quot;Terms&quot;) govern your use of
                        AdMaster Pro (&quot;the Service&quot;), operated by NobleBlocks
                        LLC (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;). By
                        accessing or using AdMaster Pro at admasterai.nobleblocks.com,
                        you agree to these Terms in full.
                    </p>

                    <h2 className="text-lg font-semibold text-foreground mt-8">
                        1. Service Description
                    </h2>
                    <p>
                        AdMaster Pro is an AI-powered Google Ads management platform
                        designed for small businesses and marketing agencies. The Service
                        provides:
                    </p>
                    <ul className="list-disc pl-6 space-y-1">
                        <li>
                            AI-powered ad creation and optimization using GPT-4o-mini and
                            Claude
                        </li>
                        <li>Automated money leak detection and budget analysis</li>
                        <li>Voice and text-based campaign management</li>
                        <li>Knowledge Base for business-specific AI training</li>
                        <li>Free AI-powered website audits</li>
                        <li>Multi-account management (Pro plan)</li>
                        <li>Performance analytics and reporting</li>
                    </ul>

                    <h2 className="text-lg font-semibold text-foreground mt-8">
                        2. Eligibility
                    </h2>
                    <p>
                        You must be at least 18 years old and legally able to enter into
                        a binding agreement to use this Service. If you are using the
                        Service on behalf of an organization, you represent that you have
                        authority to bind that organization to these Terms.
                    </p>

                    <h2 className="text-lg font-semibold text-foreground mt-8">
                        3. Account Registration &amp; Security
                    </h2>
                    <p>
                        You may create an account using Google OAuth or email sign-in.
                        You are responsible for:
                    </p>
                    <ul className="list-disc pl-6 space-y-1">
                        <li>Maintaining the security of your account credentials</li>
                        <li>All activity that occurs under your account</li>
                        <li>Notifying us immediately of any unauthorized access</li>
                    </ul>
                    <p>
                        We reserve the right to suspend or terminate accounts that
                        violate these Terms or engage in fraudulent, abusive, or illegal
                        activity.
                    </p>

                    <h2 className="text-lg font-semibold text-foreground mt-8">
                        4. Google Ads Integration
                    </h2>
                    <p>
                        By connecting your Google Ads account via Google OAuth, you
                        authorize AdMaster Pro to:
                    </p>
                    <ul className="list-disc pl-6 space-y-1">
                        <li>
                            Read your campaign data (performance metrics, keywords, ads,
                            budgets)
                        </li>
                        <li>
                            Create and modify ads, keywords, and campaign settings upon
                            your explicit approval
                        </li>
                        <li>
                            Track conversions and call data associated with your
                            campaigns
                        </li>
                    </ul>
                    <p>
                        <strong className="text-foreground">Important:</strong> No
                        changes are made to your Google Ads account without your explicit
                        approval. All AI-generated ads are saved as drafts first. You
                        retain full ownership and control of your Google Ads account at
                        all times. You can revoke access at any time from your Google
                        Account settings.
                    </p>

                    <h2 className="text-lg font-semibold text-foreground mt-8">
                        5. AI-Generated Content
                    </h2>
                    <p>
                        Ad copy, recommendations, and audit reports are generated by
                        third-party AI models (OpenAI GPT-4o-mini and Anthropic Claude). While
                        we strive for accuracy and quality:
                    </p>
                    <ul className="list-disc pl-6 space-y-1">
                        <li>
                            You are responsible for reviewing all AI-generated content
                            before publishing
                        </li>
                        <li>
                            AI-generated content may contain errors, inaccuracies, or
                            content that doesn&apos;t align with your preferences
                        </li>
                        <li>
                            You should verify compliance with Google Ads policies before
                            publishing ads
                        </li>
                        <li>
                            We do not guarantee any specific advertising performance
                            outcomes
                        </li>
                        <li>
                            AI audit reports provide general assessments and should not be
                            considered professional consulting advice
                        </li>
                    </ul>

                    <h2 className="text-lg font-semibold text-foreground mt-8">
                        6. Subscriptions &amp; Billing
                    </h2>
                    <p>AdMaster Pro offers the following plans:</p>
                    <ul className="list-disc pl-6 space-y-1">
                        <li>
                            <strong className="text-foreground">Free:</strong> $0/month —
                            10 AI messages, 1 campaign, basic features
                        </li>
                        <li>
                            <strong className="text-foreground">Starter:</strong>{" "}
                            $49/month — 200 AI messages, 5 campaigns, display ads, call
                            tracking
                        </li>
                        <li>
                            <strong className="text-foreground">Pro:</strong> $149/month —
                            Unlimited AI messages, unlimited campaigns, multi-account,
                            priority support
                        </li>
                    </ul>
                    <p>
                        Paid subscriptions are billed monthly through Stripe. All paid
                        plans include a 7-day free trial. You can cancel at any time from
                        your Settings page — your plan continues until the end of the
                        current billing period. No refunds are provided for partial
                        billing periods.
                    </p>
                    <p>
                        Message top-up credits are one-time purchases that never expire
                        and carry over month to month. Top-up credit balances are
                        non-refundable.
                    </p>

                    <h2 className="text-lg font-semibold text-foreground mt-8">
                        7. Google Ads Budget (Separate)
                    </h2>
                    <p>
                        AdMaster Pro&apos;s subscription fees are separate from your
                        Google Ads advertising budget. Your ad spend goes directly to
                        Google. You are solely responsible for setting, managing, and
                        paying for your Google Ads budget. AdMaster Pro is not liable for
                        your advertising costs with Google.
                    </p>

                    <h2 className="text-lg font-semibold text-foreground mt-8">
                        8. Acceptable Use
                    </h2>
                    <p>You agree not to:</p>
                    <ul className="list-disc pl-6 space-y-1">
                        <li>
                            Use the Service for any unlawful purpose or in violation of
                            any applicable laws
                        </li>
                        <li>
                            Create ads that violate Google Ads policies or contain
                            misleading, defamatory, or illegal content
                        </li>
                        <li>
                            Attempt to reverse engineer, decompile, or disable any part
                            of the Service
                        </li>
                        <li>
                            Share your account credentials or allow unauthorized access
                        </li>
                        <li>
                            Use automated tools to scrape, bulk-access, or abuse the
                            Service
                        </li>
                        <li>Interfere with or disrupt the Service infrastructure</li>
                    </ul>

                    <h2 className="text-lg font-semibold text-foreground mt-8">
                        9. Intellectual Property
                    </h2>
                    <p>
                        The AdMaster Pro platform, including its code, design, branding,
                        and documentation, is the intellectual property of NobleBlocks
                        LLC. You may not copy, reproduce, or distribute any part of the
                        Service without permission.
                    </p>
                    <p>
                        Content you create using the Service (ad copy, Knowledge Base
                        entries, business data) remains your property. You grant us a
                        limited license to process this content solely to provide the
                        Service.
                    </p>

                    <h2 className="text-lg font-semibold text-foreground mt-8">
                        10. Limitation of Liability
                    </h2>
                    <p>To the maximum extent permitted by law:</p>
                    <ul className="list-disc pl-6 space-y-1">
                        <li>
                            AdMaster Pro is provided &quot;as is&quot; without warranties
                            of any kind, express or implied
                        </li>
                        <li>
                            We are not responsible for the performance of your Google Ads
                            campaigns
                        </li>
                        <li>
                            We are not liable for any indirect, incidental, special, or
                            consequential damages
                        </li>
                        <li>
                            Our total liability is limited to the amount you paid for the
                            Service in the 12 months preceding the claim
                        </li>
                        <li>
                            We do not guarantee uptime, availability, or error-free
                            operation
                        </li>
                    </ul>
                    <p>
                        We provide tools and AI-powered recommendations, but actual
                        advertising performance depends on many factors including your
                        budget, market conditions, industry competition, ad quality, and
                        landing page experience.
                    </p>

                    <h2 className="text-lg font-semibold text-foreground mt-8">
                        11. Indemnification
                    </h2>
                    <p>
                        You agree to indemnify and hold harmless NobleBlocks LLC from any
                        claims, losses, or damages arising from your use of the Service,
                        your violation of these Terms, or your violation of any
                        third-party rights (including Google Ads policies).
                    </p>

                    <h2 className="text-lg font-semibold text-foreground mt-8">
                        12. Termination
                    </h2>
                    <p>
                        You may terminate your account at any time from your Settings
                        page. We may suspend or terminate your account if you violate
                        these Terms. Upon termination, your right to use the Service
                        ceases immediately. We may retain anonymized usage data for
                        analytics purposes.
                    </p>

                    <h2 className="text-lg font-semibold text-foreground mt-8">
                        13. Modifications to Terms
                    </h2>
                    <p>
                        We may update these Terms from time to time. We will notify you
                        of material changes via the email associated with your account.
                        Continued use of the Service after changes constitutes acceptance
                        of the updated Terms. If you disagree with any changes, you may
                        cancel your account.
                    </p>

                    <h2 className="text-lg font-semibold text-foreground mt-8">
                        14. Governing Law
                    </h2>
                    <p>
                        These Terms are governed by the laws of the State of New York,
                        United States, without regard to conflict of law principles. Any
                        disputes will be resolved in the courts of New York.
                    </p>

                    <h2 className="text-lg font-semibold text-foreground mt-8">
                        15. Contact
                    </h2>
                    <p>For questions about these Terms, contact us at:</p>
                    <ul className="list-none space-y-1">
                        <li>
                            <strong className="text-foreground">Email:</strong>{" "}
                            <a
                                href="mailto:support@admasterai.com"
                                className="text-primary hover:underline"
                            >
                                support@admasterai.com
                            </a>
                        </li>
                        <li>
                            <strong className="text-foreground">Company:</strong>{" "}
                            NobleBlocks LLC
                        </li>
                        <li>
                            <strong className="text-foreground">Website:</strong>{" "}
                            <a
                                href="https://admasterai.nobleblocks.com"
                                className="text-primary hover:underline"
                            >
                                admasterai.nobleblocks.com
                            </a>
                        </li>
                    </ul>
                </div>

                {/* Related Links */}
                <div className="mt-12 pt-8 border-t border-border">
                    <h3 className="text-sm font-semibold text-foreground mb-3">
                        Related Pages
                    </h3>
                    <div className="flex gap-4 text-sm">
                        <Link href="/privacy" className="text-primary hover:underline">
                            Privacy Policy
                        </Link>
                        <Link href="/faq" className="text-primary hover:underline">
                            FAQ
                        </Link>
                        <Link href="/about" className="text-primary hover:underline">
                            About Us
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
