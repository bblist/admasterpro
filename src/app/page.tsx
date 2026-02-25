"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Zap,
  Shield,
  TrendingUp,
  Phone,
  DollarSign,
  BarChart3,
  MessageCircle,
  ArrowRight,
  Check,
  Star,
  Menu,
  X,
} from "lucide-react";

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 w-full bg-background/80 backdrop-blur-md border-b border-border z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">AdMaster Pro</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted">
            <a href="#features" className="hover:text-foreground transition">Features</a>
            <a href="#how-it-works" className="hover:text-foreground transition">How It Works</a>
            <Link href="/pricing" className="hover:text-foreground transition">Pricing</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-muted hover:text-foreground transition">
              Log In
            </Link>
            <Link
              href="/onboarding"
              className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              Start Free
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-muted hover:text-foreground"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border px-4 py-3 space-y-2 bg-background">
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-muted hover:text-foreground py-1">Features</a>
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-muted hover:text-foreground py-1">How It Works</a>
            <Link href="/pricing" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-muted hover:text-foreground py-1">Pricing</Link>
            <Link href="/audit" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-muted hover:text-foreground py-1">Free Audit</Link>
            <Link href="/faq" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-muted hover:text-foreground py-1">FAQ</Link>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary-light text-primary px-3 py-1 rounded-full text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            AI-Powered Google Ads Management
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Stop wasting money on
            <span className="text-primary"> Google Ads</span>
          </h1>
          <p className="text-lg md:text-xl text-muted max-w-2xl mx-auto mb-8">
            Your AI assistant finds what&apos;s wasting your ad budget, tells you in plain English,
            and fixes it — so you get more customers for less money.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              href="/audit"
              className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-lg font-medium text-lg transition flex items-center justify-center gap-2"
            >
              Get Your Free Ad Audit
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/login?next=/dashboard/chat"
              className="border border-border hover:border-primary text-foreground px-8 py-3 rounded-lg font-medium text-lg transition"
            >
              Try the AI Demo
            </Link>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-success" />
              No credit card required
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-success" />
              2-minute setup
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-success" />
              Works with your existing ads
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="pb-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-sidebar px-6 py-3 border-b border-border flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-danger"></div>
              <div className="w-3 h-3 rounded-full bg-warning"></div>
              <div className="w-3 h-3 rounded-full bg-success"></div>
              <span className="text-xs text-muted ml-2">AdMaster Pro Dashboard</span>
            </div>
            <div className="p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-sidebar rounded-xl p-5 border border-border">
                  <div className="flex items-center gap-2 text-muted text-sm mb-2">
                    <DollarSign className="w-4 h-4" />
                    Spent This Week
                  </div>
                  <div className="text-2xl font-bold">$247.50</div>
                  <div className="text-sm text-success mt-1">↓ $38 less than last week</div>
                </div>
                <div className="bg-sidebar rounded-xl p-5 border border-border">
                  <div className="flex items-center gap-2 text-muted text-sm mb-2">
                    <Phone className="w-4 h-4" />
                    Phone Calls
                  </div>
                  <div className="text-2xl font-bold">18</div>
                  <div className="text-sm text-success mt-1">↑ 5 more than last week</div>
                </div>
                <div className="bg-sidebar rounded-xl p-5 border border-border">
                  <div className="flex items-center gap-2 text-muted text-sm mb-2">
                    <TrendingUp className="w-4 h-4" />
                    Cost Per Customer
                  </div>
                  <div className="text-2xl font-bold">$13.75</div>
                  <div className="text-sm text-success mt-1">↓ Getting cheaper</div>
                </div>
              </div>
              <div className="mt-6 bg-sidebar rounded-xl p-5 border border-border">
                <div className="flex items-center gap-2 mb-3">
                  <MessageCircle className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">AdMaster Pro AI</span>
                </div>
                <div className="bg-primary-light text-primary rounded-lg p-4 text-sm">
                  I took a quick look — your keyword &quot;emergency plumber near me&quot; got you 4 calls for
                  $18 this week. But &quot;free plumbing tips&quot; cost $22 and got zero calls.
                  Want me to pause it and save that money? <strong>Yes / No / Edit</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 bg-sidebar">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything your ads need. Nothing you don&apos;t.</h2>
            <p className="text-muted text-lg max-w-2xl mx-auto">
              No confusing dashboards. No marketing jargon. Just plain English updates and real results.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <BarChart3 className="w-6 h-6" />,
                title: "Dead-Simple Stats",
                desc: "See how much you spent, how many customers called, and which ads are working — at a glance.",
              },
              {
                icon: <Shield className="w-6 h-6" />,
                title: "Money Leak Detection",
                desc: "We find keywords wasting your budget and tell you exactly how much you can save by fixing them.",
              },
              {
                icon: <MessageCircle className="w-6 h-6" />,
                title: "AI That Speaks Human",
                desc: "No marketing jargon. Your AI assistant explains everything like a friend who knows ads inside out.",
              },
              {
                icon: <Zap className="w-6 h-6" />,
                title: "Auto-Pilot Mode",
                desc: "Turn it on and we'll fix small problems automatically — pause bad keywords, block junk searches, save money.",
              },
              {
                icon: <Phone className="w-6 h-6" />,
                title: "Call & Lead Tracking",
                desc: "Know exactly which ads are bringing real phone calls and form submissions — not just clicks.",
              },
              {
                icon: <DollarSign className="w-6 h-6" />,
                title: "Draft-First Safety",
                desc: "Every new ad we create starts as a draft. Nothing goes live until you say so. Your money, your control.",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="bg-card border border-border rounded-xl p-6 hover:border-primary transition"
              >
                <div className="w-12 h-12 bg-primary-light rounded-lg flex items-center justify-center text-primary mb-4">
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Up and running in 2 minutes</h2>
            <p className="text-muted text-lg">No tech skills needed. No agency required.</p>
          </div>
          <div className="space-y-8">
            {[
              { step: "1", title: "Connect Your Google Ads", desc: "Sign in with Google. We only see your ad data — nothing else." },
              { step: "2", title: "Tell Us About Your Business", desc: "Paste your website URL. Upload a menu, price list, or brochure. We learn your business." },
              { step: "3", title: "Get Your Free Audit", desc: "In 2 minutes, see exactly where your ads are wasting money — and how to fix it." },
              { step: "4", title: "Let AI Handle the Rest", desc: "Review suggestions, approve with one click, or turn on Auto-Pilot for hands-free optimization." },
            ].map((item, i) => (
              <div key={i} className="flex gap-6 items-start">
                <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold shrink-0">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
                  <p className="text-muted">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 bg-sidebar">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple pricing. No surprises.</h2>
            <p className="text-muted text-lg">Start free. Upgrade when you&apos;re ready.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: "Free",
                price: "$0",
                period: "forever",
                features: ["Free Google Ads audit", "10 AI messages/month", "1 campaign draft", "Basic keyword research", "Email support"],
                cta: "Start Free",
                popular: false,
                href: "/onboarding",
              },
              {
                name: "Starter",
                price: "$49",
                period: "/month",
                features: [
                  "Everything in Free",
                  "200 AI messages/month",
                  "10 campaign drafts",
                  "AI ad copy generation",
                  "Auto-Pilot mode",
                  "Daily reports",
                  "Priority support",
                ],
                cta: "Start 7-Day Free Trial",
                popular: true,
                href: "/pricing",
              },
              {
                name: "Pro",
                price: "$149",
                period: "/month",
                features: [
                  "Everything in Starter",
                  "Unlimited AI messages",
                  "Unlimited campaigns",
                  "Shopping, Display & Video ads",
                  "Performance Max campaigns",
                  "Competitor analysis",
                  "Dedicated account manager",
                ],
                cta: "Start 7-Day Free Trial",
                popular: false,
                href: "/pricing",
              },
            ].map((plan, i) => (
              <div
                key={i}
                className={`bg-card border rounded-xl p-6 relative ${plan.popular ? "border-primary shadow-lg scale-105" : "border-border"
                  }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-medium px-3 py-1 rounded-full">
                    Most Popular
                  </div>
                )}
                <h3 className="font-semibold text-lg mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-muted text-sm">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-success shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={`block text-center py-2.5 rounded-lg font-medium text-sm transition ${plan.popular
                    ? "bg-primary hover:bg-primary-dark text-white"
                    : "border border-border hover:border-primary text-foreground"
                    }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/pricing" className="text-sm text-primary hover:underline font-medium">
              View detailed feature comparison →
            </Link>
          </div>
        </div>
      </section>
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Loved by small business owners</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                name: "Mike R.",
                biz: "Mike's Plumbing, Miami",
                text: "I was burning $200/week on ads that weren't working. AdMaster Pro found the problem in 2 minutes and cut my waste by 60%.",
                stars: 5,
              },
              {
                name: "Sarah K.",
                biz: "Bloom Dental, Austin",
                text: "I don't know anything about ads. This thing just tells me what to do in plain English and handles the rest. My calls are up 40%.",
                stars: 5,
              },
            ].map((t, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-6">
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-accent text-accent" />
                  ))}
                </div>
                <p className="text-sm mb-4 leading-relaxed">&quot;{t.text}&quot;</p>
                <div>
                  <div className="font-medium text-sm">{t.name}</div>
                  <div className="text-muted text-xs">{t.biz}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-primary">
        <div className="max-w-3xl mx-auto text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to stop wasting money on ads?</h2>
          <p className="text-lg opacity-90 mb-8">
            Get your free audit in 2 minutes. No credit card. No commitment.
          </p>
          <Link
            href="/audit"
            className="bg-white text-primary hover:bg-gray-100 px-8 py-3 rounded-lg font-medium text-lg transition inline-flex items-center gap-2"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold text-sm">AdMaster Pro</span>
              </div>
              <p className="text-xs text-muted leading-relaxed">AI-powered Google Ads management for small businesses.</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Product</h4>
              <div className="flex flex-col gap-2 text-sm text-muted">
                <Link href="/pricing" className="hover:text-foreground transition">Pricing</Link>
                <Link href="/audit" className="hover:text-foreground transition">Free Audit</Link>
                <Link href="/faq" className="hover:text-foreground transition">FAQ</Link>
                <Link href="/login" className="hover:text-foreground transition">Login</Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Company</h4>
              <div className="flex flex-col gap-2 text-sm text-muted">
                <Link href="/about" className="hover:text-foreground transition">About Us</Link>
                <a href="mailto:support@admasterai.com" className="hover:text-foreground transition">Contact</a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Legal</h4>
              <div className="flex flex-col gap-2 text-sm text-muted">
                <Link href="/privacy" className="hover:text-foreground transition">Privacy Policy</Link>
                <Link href="/terms" className="hover:text-foreground transition">Terms of Service</Link>
              </div>
            </div>
          </div>
          <div className="border-t border-border pt-6 text-center text-xs text-muted">
            &copy; {new Date().getFullYear()} NobleBlocks LLC. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
