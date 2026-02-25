"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import { Zap, Mail, ArrowRight, Shield } from "lucide-react";
import { setAuth, decodeTokenPayload, clearAuth } from "@/lib/auth-client";

const emailLoginEnabled = process.env.NEXT_PUBLIC_ENABLE_EMAIL_LOGIN !== "false";

function LoginForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const next = searchParams.get("next") || "/dashboard/chat";
    // Prevent open redirect: must start with / but not // or /\ and no protocol
    const isSafeRedirect = /^\/[a-zA-Z]/.test(next) && !next.includes(":");
    const redirectTo = isSafeRedirect ? next : "/dashboard/chat";
    const error = searchParams.get("error");

    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [emailError, setEmailError] = useState("");

    const handleGoogleSignIn = () => {
        setLoading(true);
        // Redirect to our OAuth callback which initiates the Google flow
        window.location.href = "/api/auth/callback";
        // Reset loading if redirect doesn't complete (e.g. popup blocked)
        setTimeout(() => setLoading(false), 5000);
    };

    const handleEmailSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) {
            setEmailError("Email is required");
            return;
        }
        if (!email.includes("@")) {
            setEmailError("Enter a valid email address");
            return;
        }
        setEmailError("");
        setLoading(true);

        try {
            const res = await fetch("/api/auth/email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            if (res.ok) {
                const data = await res.json();
                // Store JWT token in localStorage (works when cookies fail)
                if (data.token) {
                    const user = decodeTokenPayload(data.token);
                    setAuth(data.token, user || undefined);
                }
                router.push(redirectTo);
            } else {
                setEmailError("Sign-in failed. Please try again.");
                setLoading(false);
            }
        } catch {
            setEmailError("Network error. Please try again.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex">
            {/* Left side — branding */}
            <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-primary via-blue-600 to-indigo-700 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
                    <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
                </div>
                <div className="relative z-10 flex flex-col justify-center px-16 text-white">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                            <Zap className="w-7 h-7 text-white" />
                        </div>
                        <span className="text-2xl font-bold">AdMaster Pro</span>
                    </div>
                    <h2 className="text-4xl font-bold leading-tight mb-4">
                        Your AI-Powered<br />Google Ads Manager
                    </h2>
                    <p className="text-lg text-white/80 leading-relaxed mb-8 max-w-md">
                        Create campaigns, optimize keywords, generate ad copy, and manage your entire
                        Google Ads account with an AI agent that works 24/7.
                    </p>
                    <div className="space-y-3">
                        {[
                            "Sign in with your Google Ads account email",
                            "AI instantly connects to your ad campaigns",
                            "Full campaign management on autopilot",
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                                    <Shield className="w-3.5 h-3.5 text-white" />
                                </div>
                                <span className="text-sm text-white/90">{item}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right side — form */}
            <div className="flex-1 flex items-center justify-center px-6">
                <div className="w-full max-w-sm">
                    {/* Mobile logo */}
                    <div className="text-center mb-8">
                        <Link href="/" className="inline-flex items-center gap-2 mb-4 lg:hidden">
                            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                                <Zap className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-bold">AdMaster Pro</span>
                        </Link>
                        <h1 className="text-2xl font-bold">Welcome back</h1>
                        <p className="text-muted text-sm mt-1">Sign in to manage your Google Ads</p>
                    </div>

                    {/* Error messages */}
                    {error && (
                        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                            {error === "auth_failed" && "Google sign-in failed. Please try again."}
                            {error === "auth_error" && "Something went wrong during authentication. Please try again."}
                            {error === "no_ads_account" && "No Google Ads account found for this email. You can still use AdMaster Pro — connect your Ads account later in Settings."}
                        </div>
                    )}

                    {/* Google Sign In — Primary */}
                    <button
                        onClick={handleGoogleSignIn}
                        disabled={loading}
                        className="w-full bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-400 transition flex items-center justify-center gap-3 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        {loading ? "Connecting..." : "Sign in with Google"}
                    </button>

                    <p className="text-[11px] text-muted text-center mt-2">
                        Use the same Google account as your Google Ads account for instant access
                    </p>

                    {emailLoginEnabled && <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border"></div>
                        </div>
                        <div className="relative flex justify-center text-xs">
                            <span className="bg-background px-3 text-muted">or sign in with email</span>
                        </div>
                    </div>}

                    {/* Email Sign In */}
                    {emailLoginEnabled && <form onSubmit={handleEmailSignIn} className="space-y-3">
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                            <input
                                type="email"
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
                                className={`w-full bg-card border rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary transition ${emailError ? "border-red-400" : "border-border"}`}
                            />
                        </div>
                        {emailError && <p className="text-xs text-red-500 -mt-1">{emailError}</p>}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary hover:bg-primary-dark text-white py-2.5 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            Sign In
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </form>}

                    {!emailLoginEnabled && (
                        <p className="text-xs text-muted mt-4 text-center">
                            Email sign-in is disabled in production. Use Google sign-in.
                        </p>
                    )}

                    <div className="text-center mt-6 space-y-2">
                        <Link href="/onboarding" className="text-sm text-primary hover:underline block">
                            Don&apos;t have an account? Sign up free →
                        </Link>
                    </div>

                    {/* Trust badges */}
                    <div className="mt-8 pt-6 border-t border-border">
                        <div className="flex items-center justify-center gap-4 text-[10px] text-muted">
                            <div className="flex items-center gap-1">
                                <Shield className="w-3 h-3" />
                                <span>SSL Encrypted</span>
                            </div>
                            <span>•</span>
                            <span>Data Protected</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center animate-pulse">
                    <Zap className="w-6 h-6 text-white" />
                </div>
            </div>
        }>
            <LoginForm />
        </Suspense>
    );
}
