import Link from "next/link";
import { Zap, ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-background">
            <nav className="border-b border-border">
                <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                            <Zap className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-lg">AdMaster Pro</span>
                    </Link>
                    <Link href="/" className="text-sm text-muted hover:text-foreground flex items-center gap-1">
                        <ArrowLeft className="w-4 h-4" /> Back
                    </Link>
                </div>
            </nav>

            <main className="max-w-3xl mx-auto px-4 py-12">
                <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
                <div className="prose prose-sm dark:prose-invert space-y-4 text-muted">
                    <p><strong>Last updated:</strong> January 2025</p>

                    <h2 className="text-lg font-semibold text-foreground mt-8">1. Information We Collect</h2>
                    <p>When you use AdMaster Pro, we collect information you provide directly: your name, email address, and Google Ads account data (when you connect your account via Google OAuth).</p>

                    <h2 className="text-lg font-semibold text-foreground mt-8">2. How We Use Your Information</h2>
                    <p>We use your information to provide and improve our AI-powered Google Ads management service. This includes analyzing your ad performance, generating recommendations, and creating ad copy tailored to your business.</p>

                    <h2 className="text-lg font-semibold text-foreground mt-8">3. Data Security</h2>
                    <p>We use SSL encryption for all data transmission. OAuth tokens are stored securely. We never store your Google password — authentication is handled entirely through Google&apos;s OAuth 2.0 system.</p>

                    <h2 className="text-lg font-semibold text-foreground mt-8">4. Third-Party Services</h2>
                    <p>We use the following third-party services:</p>
                    <ul className="list-disc pl-6 space-y-1">
                        <li>Google OAuth for authentication</li>
                        <li>Google Ads API for campaign management</li>
                        <li>Stripe for payment processing</li>
                        <li>OpenAI and Anthropic for AI features</li>
                    </ul>

                    <h2 className="text-lg font-semibold text-foreground mt-8">5. Data Sharing</h2>
                    <p>We never sell your data. We only share information with third-party services as necessary to provide our service (e.g., sending your prompts to AI providers for processing).</p>

                    <h2 className="text-lg font-semibold text-foreground mt-8">6. Your Rights</h2>
                    <p>You can request deletion of your account and all associated data at any time by contacting us at support@admasterai.com.</p>

                    <h2 className="text-lg font-semibold text-foreground mt-8">7. Contact</h2>
                    <p>For privacy questions, contact us at <a href="mailto:support@admasterai.com" className="text-primary hover:underline">support@admasterai.com</a>.</p>
                </div>
            </main>
        </div>
    );
}
