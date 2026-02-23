"use client";

import Link from "next/link";
import { Zap } from "lucide-react";

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center px-4">
            <div className="w-full max-w-sm">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-2 mb-4">
                        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                            <Zap className="w-6 h-6 text-white" />
                        </div>
                    </Link>
                    <h1 className="text-2xl font-bold">Welcome back</h1>
                    <p className="text-muted text-sm mt-1">Sign in to your AdMaster Pro account</p>
                </div>

                {/* Google Sign In */}
                <button className="w-full bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition flex items-center justify-center gap-3 shadow-sm mb-6">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                        />
                        <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                    </svg>
                    Sign in with Google
                </button>

                <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                        <span className="bg-background px-2 text-muted">or</span>
                    </div>
                </div>

                {/* Email Sign In */}
                <div className="space-y-3">
                    <input
                        type="email"
                        placeholder="Email address"
                        className="w-full bg-card border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition"
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        className="w-full bg-card border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition"
                    />
                    <Link
                        href="/dashboard"
                        className="w-full bg-primary hover:bg-primary-dark text-white py-2.5 rounded-lg text-sm font-medium transition block text-center"
                    >
                        Sign In
                    </Link>
                </div>

                <div className="text-center mt-6">
                    <Link href="/onboarding" className="text-sm text-primary hover:underline">
                        Don&apos;t have an account? Start free →
                    </Link>
                </div>
            </div>
        </div>
    );
}
