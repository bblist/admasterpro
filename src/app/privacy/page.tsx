"use client";

import Link from "next/link";
import { Zap, ArrowLeft, Lock } from "lucide-react";

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-background">
            {/* Schema */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "WebPage",
                        name: "Privacy Policy — AdMaster Pro",
                        description:
                            "Privacy Policy for AdMaster Pro. Learn how we collect, use, and protect your data.",
                        url: "https://admasterai.nobleblocks.com/privacy",
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
                        <Lock className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">
                            Privacy Policy
                        </h1>
                        <p className="text-sm text-muted">
                            Last updated: February 2026
                        </p>
                    </div>
                </div>

                <div className="prose prose-sm dark:prose-invert space-y-6 text-muted">
                    <p>
                        NobleBlocks LLC (&quot;we,&quot; &quot;us,&quot; or
                        &quot;our&quot;) operates AdMaster Pro at
                        admasterai.nobleblocks.com. This Privacy Policy explains how we
                        collect, use, store, and protect your personal information when
                        you use our Service.
                    </p>

                    {/* ─── 1 ─── */}
                    <h2 className="text-lg font-semibold text-foreground mt-8">
                        1. Information We Collect
                    </h2>

                    <h3 className="text-base font-medium text-foreground">
                        1.1 Account Information
                    </h3>
                    <ul className="list-disc pl-6 space-y-1">
                        <li>Name and email address (via Google OAuth or email sign-up)</li>
                        <li>Profile picture (from Google, if provided)</li>
                        <li>Company name and website URL (optional, during onboarding)</li>
                    </ul>

                    <h3 className="text-base font-medium text-foreground">
                        1.2 Google Ads Data
                    </h3>
                    <p>
                        When you connect your Google Ads account, we access campaign
                        performance data including impressions, clicks, conversions, cost,
                        keywords, ad copy, and quality scores. This data is used
                        exclusively to power our AI analysis and recommendations.
                    </p>

                    <h3 className="text-base font-medium text-foreground">
                        1.3 Knowledge Base Content
                    </h3>
                    <p>
                        Information you voluntarily add to your Knowledge Base (business
                        descriptions, product details, brand guidelines) to train the AI
                        on your specific business context.
                    </p>

                    <h3 className="text-base font-medium text-foreground">
                        1.4 Usage Data
                    </h3>
                    <ul className="list-disc pl-6 space-y-1">
                        <li>AI conversation history (messages, commands, responses)</li>
                        <li>Feature usage patterns and session duration</li>
                        <li>Browser type, device information, IP address</li>
                        <li>Pages visited and actions taken within the platform</li>
                    </ul>

                    <h3 className="text-base font-medium text-foreground">
                        1.5 Payment Information
                    </h3>
                    <p>
                        Payment processing is handled entirely by Stripe. We do not
                        store, process, or have access to your full credit card number.
                        We only store your Stripe customer ID and subscription status.
                    </p>

                    <h3 className="text-base font-medium text-foreground">
                        1.6 Website Audit Data
                    </h3>
                    <p>
                        When you use our free website audit tool, we collect the URL you
                        submit and generate an AI-powered analysis. Audits submitted
                        without an account are stored locally in your browser and not
                        linked to any personal information.
                    </p>

                    {/* ─── 2 ─── */}
                    <h2 className="text-lg font-semibold text-foreground mt-8">
                        2. How We Use Your Information
                    </h2>
                    <ul className="list-disc pl-6 space-y-1">
                        <li>Provide and operate the AdMaster Pro platform</li>
                        <li>
                            Generate AI-powered ad recommendations, campaign analysis, and
                            website audit reports
                        </li>
                        <li>
                            Process subscription payments and manage your billing through
                            Stripe
                        </li>
                        <li>Send service-related emails (account confirmation, billing receipts, feature updates)</li>
                        <li>Improve our AI models and platform features</li>
                        <li>Detect and prevent fraud, abuse, or security threats</li>
                        <li>Comply with legal obligations</li>
                    </ul>

                    {/* ─── 3 ─── */}
                    <h2 className="text-lg font-semibold text-foreground mt-8">
                        3. AI Data Processing
                    </h2>
                    <p>
                        AdMaster Pro uses third-party AI providers to power its features:
                    </p>
                    <ul className="list-disc pl-6 space-y-1">
                        <li>
                            <strong className="text-foreground">OpenAI (GPT-4o):</strong>{" "}
                            Used for ad copy generation, campaign analysis, and
                            recommendations. Data sent to OpenAI is processed per their{" "}
                            <a
                                href="https://openai.com/policies/privacy-policy"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                            >
                                privacy policy
                            </a>
                            . We use the API tier which does not use your data for
                            training.
                        </li>
                        <li>
                            <strong className="text-foreground">
                                Anthropic (Claude):
                            </strong>{" "}
                            Used as an alternative AI model for ad generation and
                            analysis. Data sent to Anthropic is processed per their{" "}
                            <a
                                href="https://www.anthropic.com/privacy"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                            >
                                privacy policy
                            </a>
                            . API usage data is not used for training.
                        </li>
                    </ul>
                    <p>
                        We send only the minimum necessary data to these providers (e.g.,
                        your Knowledge Base context, campaign data relevant to the current
                        query). We do not send your email, payment details, or account
                        credentials to AI providers.
                    </p>

                    {/* ─── 4 ─── */}
                    <h2 className="text-lg font-semibold text-foreground mt-8">
                        4. Third-Party Services
                    </h2>
                    <p>We work with the following third-party services:</p>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="border-b border-border">
                                    <th className="text-left py-2 pr-4 font-semibold text-foreground">
                                        Service
                                    </th>
                                    <th className="text-left py-2 pr-4 font-semibold text-foreground">
                                        Purpose
                                    </th>
                                    <th className="text-left py-2 font-semibold text-foreground">
                                        Data Shared
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b border-border/50">
                                    <td className="py-2 pr-4">Google OAuth</td>
                                    <td className="py-2 pr-4">Authentication</td>
                                    <td className="py-2">Name, email, profile picture</td>
                                </tr>
                                <tr className="border-b border-border/50">
                                    <td className="py-2 pr-4">Google Ads API</td>
                                    <td className="py-2 pr-4">Campaign management</td>
                                    <td className="py-2">Campaign data (with your authorization)</td>
                                </tr>
                                <tr className="border-b border-border/50">
                                    <td className="py-2 pr-4">Stripe</td>
                                    <td className="py-2 pr-4">Payment processing</td>
                                    <td className="py-2">Payment details (handled by Stripe)</td>
                                </tr>
                                <tr className="border-b border-border/50">
                                    <td className="py-2 pr-4">OpenAI</td>
                                    <td className="py-2 pr-4">AI ad generation</td>
                                    <td className="py-2">Query context, campaign snippets</td>
                                </tr>
                                <tr className="border-b border-border/50">
                                    <td className="py-2 pr-4">Anthropic</td>
                                    <td className="py-2 pr-4">AI ad generation</td>
                                    <td className="py-2">Query context, campaign snippets</td>
                                </tr>
                                <tr>
                                    <td className="py-2 pr-4">AWS Lightsail</td>
                                    <td className="py-2 pr-4">Hosting</td>
                                    <td className="py-2">All platform data (encrypted at rest)</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* ─── 5 ─── */}
                    <h2 className="text-lg font-semibold text-foreground mt-8">
                        5. Cookies &amp; Local Storage
                    </h2>
                    <p>We use the following browser storage mechanisms:</p>
                    <ul className="list-disc pl-6 space-y-1">
                        <li>
                            <strong className="text-foreground">
                                Authentication tokens (cookies):
                            </strong>{" "}
                            Essential for keeping you logged in. These are HTTP-only,
                            secure cookies.
                        </li>
                        <li>
                            <strong className="text-foreground">Local Storage:</strong>{" "}
                            Used to store user preferences, audit report IDs (for anonymous
                            users), and UI state. No tracking or advertising cookies are used.
                        </li>
                    </ul>
                    <p>
                        We do not use third-party tracking cookies. We do not serve
                        advertisements. We do not share data with ad networks.
                    </p>

                    {/* ─── 6 ─── */}
                    <h2 className="text-lg font-semibold text-foreground mt-8">
                        6. Data Retention
                    </h2>
                    <ul className="list-disc pl-6 space-y-1">
                        <li>
                            <strong className="text-foreground">Account data:</strong>{" "}
                            Retained while your account is active, deleted within 30 days
                            of account deletion
                        </li>
                        <li>
                            <strong className="text-foreground">
                                AI conversation history:
                            </strong>{" "}
                            Retained for 90 days, then automatically purged
                        </li>
                        <li>
                            <strong className="text-foreground">
                                Google Ads campaign data:
                            </strong>{" "}
                            Cached for performance; refreshed on each session. Not
                            permanently stored beyond caching needs.
                        </li>
                        <li>
                            <strong className="text-foreground">Payment records:</strong>{" "}
                            Retained as required by tax and financial regulations (typically 7 years)
                        </li>
                        <li>
                            <strong className="text-foreground">Audit reports:</strong>{" "}
                            Anonymous audits stored in browser localStorage only. Authenticated
                            audits retained for 1 year.
                        </li>
                    </ul>

                    {/* ─── 7 ─── */}
                    <h2 className="text-lg font-semibold text-foreground mt-8">
                        7. Data Security
                    </h2>
                    <p>We implement the following security measures:</p>
                    <ul className="list-disc pl-6 space-y-1">
                        <li>HTTPS/TLS encryption for all data in transit</li>
                        <li>Encrypted database storage (PostgreSQL on AWS)</li>
                        <li>JWT-based authentication with HTTP-only secure cookies</li>
                        <li>Bcrypt password hashing for email-based accounts</li>
                        <li>Encrypted API key storage for Google Ads credentials</li>
                        <li>Regular security updates and dependency patching</li>
                    </ul>

                    {/* ─── 8 ─── */}
                    <h2 className="text-lg font-semibold text-foreground mt-8">
                        8. Your Rights (GDPR &amp; CCPA)
                    </h2>
                    <p>
                        Depending on your location, you may have the following rights:
                    </p>
                    <ul className="list-disc pl-6 space-y-1">
                        <li>
                            <strong className="text-foreground">Access:</strong> Request a
                            copy of all personal data we hold about you
                        </li>
                        <li>
                            <strong className="text-foreground">Rectification:</strong>{" "}
                            Request correction of inaccurate data
                        </li>
                        <li>
                            <strong className="text-foreground">Deletion:</strong> Request
                            deletion of your personal data (&quot;Right to be
                            Forgotten&quot;)
                        </li>
                        <li>
                            <strong className="text-foreground">Portability:</strong> Receive
                            your data in a machine-readable format
                        </li>
                        <li>
                            <strong className="text-foreground">Objection:</strong> Object
                            to certain processing of your data
                        </li>
                        <li>
                            <strong className="text-foreground">
                                Opt-out of sale (CCPA):
                            </strong>{" "}
                            We do not sell your personal information. Period.
                        </li>
                    </ul>
                    <p>
                        To exercise any of these rights, email us at{" "}
                        <a
                            href="mailto:privacy@admasterai.com"
                            className="text-primary hover:underline"
                        >
                            privacy@admasterai.com
                        </a>
                        . We will respond within 30 days.
                    </p>

                    {/* ─── 9 ─── */}
                    <h2 className="text-lg font-semibold text-foreground mt-8">
                        9. International Data Transfers
                    </h2>
                    <p>
                        Our servers are located in the United States (AWS us-east-1). If
                        you access AdMaster Pro from outside the US, your data will be
                        transferred to and processed in the United States. By using our
                        Service, you consent to this transfer. We take reasonable measures
                        to ensure your data is treated securely regardless of where it is
                        processed.
                    </p>

                    {/* ─── 10 ─── */}
                    <h2 className="text-lg font-semibold text-foreground mt-8">
                        10. Children&apos;s Privacy
                    </h2>
                    <p>
                        AdMaster Pro is not intended for use by anyone under the age of
                        18. We do not knowingly collect personal information from
                        children. If you believe a child has provided us with personal
                        data, please contact us and we will delete it.
                    </p>

                    {/* ─── 11 ─── */}
                    <h2 className="text-lg font-semibold text-foreground mt-8">
                        11. Changes to This Policy
                    </h2>
                    <p>
                        We may update this Privacy Policy from time to time. We will
                        notify you of material changes via email. The &quot;Last
                        updated&quot; date at the top of this page reflects the most
                        recent revision.
                    </p>

                    {/* ─── 12 ─── */}
                    <h2 className="text-lg font-semibold text-foreground mt-8">
                        12. Contact Us
                    </h2>
                    <p>
                        For privacy-related questions or to exercise your data rights:
                    </p>
                    <ul className="list-none space-y-1">
                        <li>
                            <strong className="text-foreground">Email:</strong>{" "}
                            <a
                                href="mailto:privacy@admasterai.com"
                                className="text-primary hover:underline"
                            >
                                privacy@admasterai.com
                            </a>
                        </li>
                        <li>
                            <strong className="text-foreground">General Support:</strong>{" "}
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
                        <Link href="/terms" className="text-primary hover:underline">
                            Terms of Service
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
