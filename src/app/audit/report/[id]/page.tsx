"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
    Zap,
    Download,
    FileText,
    Printer,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    ArrowRight,
    Loader2,
    Star,
    TrendingUp,
    Shield,
    Globe,
    Target,
    BarChart3,
    Lightbulb,
    ChevronRight,
} from "lucide-react";

interface AuditSection {
    title: string;
    score: number;
    maxScore: number;
    status: "excellent" | "good" | "needs-work" | "critical";
    findings: string[];
    recommendations: string[];
}

interface AuditResult {
    overallScore: number;
    overallSummary: string;
    sections: AuditSection[];
    quickWins: string[];
    estimatedSavings: string;
    competitorInsight: string;
}

interface AuditData {
    websiteUrl: string;
    businessName: string;
    industry: string;
    email: string;
    monthlySpend: string;
    pageTitle: string;
    result: AuditResult;
    createdAt: string;
}

function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
    const radius = (size - 12) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = (score / 100) * circumference;
    const color = score >= 80 ? "#22c55e" : score >= 60 ? "#3b82f6" : score >= 40 ? "#f59e0b" : "#ef4444";

    return (
        <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#1f2937" strokeWidth="8" />
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth="8"
                    strokeDasharray={circumference} strokeDashoffset={circumference - progress}
                    strokeLinecap="round" className="transition-all duration-1000" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold" style={{ color }}>{score}</span>
                <span className="text-[10px] text-gray-500 uppercase tracking-wider">/ 100</span>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const config: Record<string, { bg: string; text: string; icon: React.ReactNode; label: string }> = {
        excellent: { bg: "bg-green-500/10 border-green-500/30", text: "text-green-400", icon: <CheckCircle2 className="w-3.5 h-3.5" />, label: "Excellent" },
        good: { bg: "bg-blue-500/10 border-blue-500/30", text: "text-blue-400", icon: <CheckCircle2 className="w-3.5 h-3.5" />, label: "Good" },
        "needs-work": { bg: "bg-amber-500/10 border-amber-500/30", text: "text-amber-400", icon: <AlertTriangle className="w-3.5 h-3.5" />, label: "Needs Work" },
        critical: { bg: "bg-red-500/10 border-red-500/30", text: "text-red-400", icon: <XCircle className="w-3.5 h-3.5" />, label: "Critical" },
    };
    const c = config[status] || config.good;
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${c.bg} ${c.text}`}>
            {c.icon} {c.label}
        </span>
    );
}

function SectionScoreBar({ score }: { score: number }) {
    const color = score >= 80 ? "from-green-600 to-green-400" : score >= 60 ? "from-blue-600 to-blue-400" : score >= 40 ? "from-amber-600 to-amber-400" : "from-red-600 to-red-400";
    return (
        <div className="w-full bg-gray-800 rounded-full h-2.5">
            <div className={`h-2.5 rounded-full bg-gradient-to-r ${color} transition-all duration-700`} style={{ width: `${score}%` }} />
        </div>
    );
}

const sectionIcons: Record<string, React.ReactNode> = {
    "Landing Page Quality": <Globe className="w-5 h-5 text-blue-400" />,
    "Call-to-Action Effectiveness": <Target className="w-5 h-5 text-green-400" />,
    "Mobile Optimization": <Zap className="w-5 h-5 text-purple-400" />,
    "Trust Signals": <Shield className="w-5 h-5 text-amber-400" />,
    "Ad-Readiness": <BarChart3 className="w-5 h-5 text-red-400" />,
    "SEO Foundation": <TrendingUp className="w-5 h-5 text-cyan-400" />,
    "Competitive Positioning": <Star className="w-5 h-5 text-pink-400" />,
    "Content Quality": <FileText className="w-5 h-5 text-indigo-400" />,
};

export default function AuditReportPage() {
    const params = useParams();
    const auditId = params.id as string;
    const [data, setData] = useState<AuditData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function load() {
            try {
                // Try server-side storage first (tamper-proof)
                const res = await fetch(`/api/audit?id=${encodeURIComponent(auditId)}`);
                if (res.ok) {
                    const d = await res.json();
                    setData(d);
                    return;
                }

                // Fall back to localStorage for older reports
                const stored = localStorage.getItem(`audit_${auditId}`);
                if (!stored) {
                    throw new Error("Audit not found. Please run a new audit.");
                }
                const d = JSON.parse(stored);
                setData(d);
            } catch (err: any) {
                setError(err.message || "Failed to load audit");
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [auditId]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
                    <p className="text-muted">Loading your audit report...</p>
                </div>
            </div>
        );
    }

    if (error || !data || !data.result) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center max-w-md">
                    <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-foreground mb-2">Audit Not Found</h2>
                    <p className="text-muted mb-6">{error || "This audit report could not be loaded."}</p>
                    <Link href="/audit" className="inline-flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-lg font-medium hover:bg-primary-dark transition">
                        Start New Audit <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        );
    }

    const { result } = data;
    const reportDate = data.createdAt ? new Date(data.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }) : new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

    return (
        <>
            {/* Print styles */}
            <style jsx global>{`
                @media print {
                    body { background: white !important; }
                    .no-print { display: none !important; }
                    .print-break { page-break-before: always; }
                    .bg-background, .bg-card, .bg-gray-900, .bg-gray-800 { background: white !important; }
                    .text-foreground, .text-white { color: #111 !important; }
                    .text-muted, .text-gray-400, .text-gray-500 { color: #555 !important; }
                    .border-border, .border-gray-800 { border-color: #ddd !important; }
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                }
            `}</style>

            <div className="min-h-screen bg-background">
                {/* Report header */}
                <header className="border-b border-border bg-background/95 backdrop-blur no-print">
                    <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                                <Zap className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold text-foreground">AdMaster <span className="text-primary">Pro</span></span>
                        </Link>
                        <div className="flex items-center gap-2">
                            <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition">
                                <Printer className="w-4 h-4" /> Print / Save PDF
                            </button>
                            <Link href="/audit" className="flex items-center gap-2 px-4 py-2 bg-card border border-border text-foreground rounded-lg text-sm font-medium hover:border-primary/30 transition">
                                New Audit
                            </Link>
                        </div>
                    </div>
                </header>

                <div className="max-w-5xl mx-auto px-4 py-8">
                    {/* Branded report header */}
                    <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-border rounded-2xl p-8 mb-8">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                                        <Zap className="w-5 h-5 text-white" />
                                    </div>
                                    <span className="text-sm font-medium text-primary">AdMaster Pro Audit Report</span>
                                </div>
                                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{data.businessName}</h1>
                                <p className="text-muted text-sm flex items-center gap-2">
                                    <Globe className="w-3.5 h-3.5" />
                                    <a href={data.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{data.websiteUrl}</a>
                                </p>
                                <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted">
                                    {data.industry && <span className="bg-card border border-border px-2 py-1 rounded">{data.industry}</span>}
                                    {data.monthlySpend && <span className="bg-card border border-border px-2 py-1 rounded">Ad Spend: {data.monthlySpend}</span>}
                                    <span className="bg-card border border-border px-2 py-1 rounded">{reportDate}</span>
                                </div>
                            </div>
                            <div className="text-center">
                                <ScoreRing score={result.overallScore} />
                                <div className="text-xs text-muted mt-2">Overall Score</div>
                            </div>
                        </div>
                    </div>

                    {/* Executive Summary */}
                    <div className="bg-card border border-border rounded-xl p-6 mb-8">
                        <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-primary" /> Executive Summary
                        </h2>
                        <p className="text-muted leading-relaxed">{result.overallSummary}</p>
                        {result.estimatedSavings && result.estimatedSavings !== "N/A" && (
                            <div className="mt-4 p-4 bg-green-500/5 border border-green-500/20 rounded-lg">
                                <div className="text-sm text-green-400 font-medium flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4" /> Estimated Improvement Potential
                                </div>
                                <div className="text-green-400 font-bold text-lg mt-1">{result.estimatedSavings}</div>
                            </div>
                        )}
                    </div>

                    {/* Quick Wins */}
                    {result.quickWins && result.quickWins.length > 0 && (
                        <div className="bg-card border border-border rounded-xl p-6 mb-8">
                            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                                <Lightbulb className="w-5 h-5 text-amber-400" /> Top Quick Wins
                            </h2>
                            <div className="space-y-3">
                                {result.quickWins.map((win, i) => (
                                    <div key={i} className="flex items-start gap-3 p-3 bg-amber-500/5 border border-amber-500/10 rounded-lg">
                                        <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">
                                            {i + 1}
                                        </div>
                                        <p className="text-foreground text-sm">{win}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Score overview bar chart */}
                    {result.sections && result.sections.length > 0 && (
                        <div className="bg-card border border-border rounded-xl p-6 mb-8">
                            <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-primary" /> Score Overview
                            </h2>
                            <div className="space-y-4">
                                {result.sections.map((section, i) => (
                                    <div key={i}>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <div className="flex items-center gap-2">
                                                {sectionIcons[section.title] || <ChevronRight className="w-4 h-4 text-gray-400" />}
                                                <span className="text-sm text-foreground font-medium">{section.title}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <StatusBadge status={section.status} />
                                                <span className="text-sm font-bold text-foreground w-8 text-right">{section.score}</span>
                                            </div>
                                        </div>
                                        <SectionScoreBar score={section.score} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Detailed sections */}
                    {result.sections && result.sections.map((section, i) => (
                        <div key={i} className={`bg-card border border-border rounded-xl p-6 mb-6 ${i === 4 ? "print-break" : ""}`}>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                                    {sectionIcons[section.title] || <ChevronRight className="w-5 h-5 text-gray-400" />}
                                    {section.title}
                                </h3>
                                <div className="flex items-center gap-3">
                                    <StatusBadge status={section.status} />
                                    <span className="text-lg font-bold text-foreground">{section.score}<span className="text-xs text-muted">/100</span></span>
                                </div>
                            </div>
                            <SectionScoreBar score={section.score} />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-5">
                                {/* Findings */}
                                <div>
                                    <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Findings</h4>
                                    <div className="space-y-2">
                                        {section.findings.map((f, j) => (
                                            <div key={j} className="flex items-start gap-2 text-sm">
                                                <span className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${section.status === "excellent" || section.status === "good" ? "bg-green-400" :
                                                    section.status === "needs-work" ? "bg-amber-400" : "bg-red-400"
                                                    }`} />
                                                <span className="text-muted">{f}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Recommendations */}
                                <div>
                                    <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Recommendations</h4>
                                    <div className="space-y-2">
                                        {section.recommendations.map((r, j) => (
                                            <div key={j} className="flex items-start gap-2 text-sm">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                                                <span className="text-foreground">{r}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Competitor insight */}
                    {result.competitorInsight && result.competitorInsight !== "N/A" && (
                        <div className="bg-card border border-border rounded-xl p-6 mb-8">
                            <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                                <Star className="w-5 h-5 text-pink-400" /> Competitive Insight
                            </h2>
                            <p className="text-muted leading-relaxed">{result.competitorInsight}</p>
                        </div>
                    )}

                    {/* CTA */}
                    <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-8 text-center mb-8 no-print">
                        <h2 className="text-xl font-bold text-foreground mb-3">
                            Ready to Fix These Issues Automatically?
                        </h2>
                        <p className="text-muted mb-6 max-w-lg mx-auto">
                            AdMaster Pro uses AI to manage your Google Ads campaigns, fix wasteful spending,
                            and optimize your ads — all on autopilot.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Link href="/onboarding" className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-lg font-semibold transition">
                                Start Free Trial <ArrowRight className="w-4 h-4" />
                            </Link>
                            <Link href="/pricing" className="inline-flex items-center gap-2 bg-card border border-border text-foreground px-6 py-3 rounded-lg font-medium hover:border-primary/30 transition">
                                View Pricing
                            </Link>
                        </div>
                    </div>

                    {/* Report footer */}
                    <div className="border-t border-border pt-6 pb-12">
                        <div className="flex items-center justify-between text-xs text-muted">
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 bg-primary rounded flex items-center justify-center">
                                    <Zap className="w-3 h-3 text-white" />
                                </div>
                                <span>Generated by AdMaster Pro</span>
                            </div>
                            <div>{reportDate}</div>
                        </div>
                        <div className="text-[10px] text-muted/50 mt-2">
                            This report was generated by AI and is for informational purposes only. Results may vary.
                            Report ID: {auditId}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
