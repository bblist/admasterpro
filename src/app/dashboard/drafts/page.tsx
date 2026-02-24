"use client";

import { FileText, ArrowRight, Zap, Type, Image, Layers } from "lucide-react";
import Link from "next/link";

export default function DraftsPage() {
    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Ad Drafts</h1>
                    <p className="text-muted text-sm mt-1">Review, edit, and publish your AI-generated ads</p>
                </div>
            </div>

            {/* Empty State */}
            <div className="bg-card border border-border rounded-2xl p-12 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <FileText className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-xl font-bold mb-2">No drafts yet</h2>
                <p className="text-muted text-sm max-w-md mx-auto mb-8">
                    When you ask the AI to create ads, they&apos;ll appear here as drafts for you to
                    review, edit, and publish to your Google Ads account.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                        href="/dashboard/chat"
                        className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-medium transition"
                    >
                        <Zap className="w-4 h-4" />
                        Generate Ads with AI
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                        href="/dashboard/demo/drafts"
                        className="inline-flex items-center gap-2 bg-card border border-border hover:border-primary text-foreground px-6 py-3 rounded-xl font-medium transition"
                    >
                        See Example Drafts
                    </Link>
                </div>
            </div>

            {/* Ad format cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card border border-border rounded-xl p-5">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                        <Type className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="font-semibold mb-1">Text Ads (RSA)</h3>
                    <p className="text-xs text-muted">Responsive Search Ads with up to 15 headlines and 4 descriptions. Google picks the best combos.</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-5">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                        <Image className="w-5 h-5 text-purple-600" />
                    </div>
                    <h3 className="font-semibold mb-1">Display Ads (RDA)</h3>
                    <p className="text-xs text-muted">Responsive Display Ads with images, logos, and headlines for the Google Display Network.</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-5">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                        <Layers className="w-5 h-5 text-green-600" />
                    </div>
                    <h3 className="font-semibold mb-1">Ad Extensions</h3>
                    <p className="text-xs text-muted">Sitelinks, callouts, call extensions, and more — AI generates everything you need.</p>
                </div>
            </div>

            {/* Tip */}
            <div className="bg-primary-light border border-primary/20 rounded-xl p-4">
                <p className="text-sm">
                    <strong>💡 Pro tip:</strong> Ask the AI — &quot;Write 5 different Google Search ads for
                    a luxury car detailing service in Beverly Hills&quot; — and it will create complete
                    responsive search ads with headlines, descriptions, and extensions.
                </p>
            </div>
        </div>
    );
}
