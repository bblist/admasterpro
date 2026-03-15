"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Mic,
  ArrowRight,
  ArrowDownRight,
  ArrowUpRight,
  TrendingDown,
  Sparkles,
  BarChart3,
  Shield,
  MessageCircle,
  Zap,
  Phone,
  FileText,
  Check,
  Star,
  CheckCircle,
  Menu,
  X,
} from "lucide-react";
import { useTranslation } from "@/i18n/context";
import { isAuthenticated } from "@/lib/auth-client";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const features = [
  { icon: BarChart3, title: "Dead-Simple Stats", desc: "See how much you spent, how many customers called, and which ads are working — at a glance." },
  { icon: Shield, title: "Money Leak Detection", desc: "We find keywords wasting your budget and tell you exactly how much you can save by fixing them." },
  { icon: MessageCircle, title: "AI That Speaks Human", desc: "No marketing jargon. Your AI assistant explains everything like a friend who knows ads inside out." },
  { icon: Zap, title: "Auto-Pilot Mode", desc: "Turn it on and we'll fix small problems automatically — pause bad keywords, block junk searches." },
  { icon: Phone, title: "Call & Lead Tracking", desc: "Know exactly which ads are bringing real phone calls and form submissions — not just clicks." },
  { icon: FileText, title: "Draft-First Safety", desc: "Every new ad we create starts as a draft. Nothing goes live until you say so. Your money, your control." },
];

const steps = [
  { title: "Connect Your Google Ads", desc: "Sign in securely with Google. We only analyze your ad data to find optimization opportunities." },
  { title: "Tell Us About Your Business", desc: "Provide your website URL. Upload a menu, price list, or brochure so the AI learns your exact offerings." },
  { title: "Get Your Free Audit", desc: "In under two minutes, see exactly where your campaigns are wasting money — and the steps to fix it." },
  { title: "Let AI Handle the Rest", desc: "Review simple suggestions, approve with one click, or enable Auto-Pilot for completely hands-free optimization." },
];

const testimonials = [
  { name: "Mike R.", biz: "Mike's Plumbing, Miami", initial: "M", text: "I was burning $200/week on ads that weren't working. AdMaster Pro found the problem in 2 minutes and cut my waste by 60%." },
  { name: "Sarah K.", biz: "Bloom Dental, Austin", initial: "S", text: "I don't know anything about ads. This thing just tells me what to do in plain English and handles the rest. My calls are up 40%." },
];

export default function LandingPage() {
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(isAuthenticated());
  }, []);

  return (
    <div className="bg-white text-neutral-900 antialiased selection:bg-indigo-100 selection:text-indigo-900 min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-neutral-100 z-50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 cursor-pointer">
            <div className="w-6 h-6 bg-neutral-900 rounded-md flex items-center justify-center">
              <span className="text-white text-xs font-medium tracking-tighter">AM</span>
            </div>
            <span className="font-medium tracking-tight text-sm">AdMaster Pro</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-normal text-neutral-500">
            <a href="#features" className="hover:text-neutral-900 transition-colors">{t("landing.navFeatures")}</a>
            <a href="#how-it-works" className="hover:text-neutral-900 transition-colors">{t("landing.navHowItWorks")}</a>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher compact />
            {loggedIn ? (
              <Link href="/dashboard" className="bg-neutral-900 hover:bg-neutral-800 text-white px-4 py-1.5 rounded-md text-sm font-medium transition-colors shadow-sm">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm font-normal text-neutral-500 hover:text-neutral-900 transition-colors hidden sm:block">
                  {t("common.logIn")}
                </Link>
                <Link href="/onboarding" className="bg-neutral-900 hover:bg-neutral-800 text-white px-4 py-1.5 rounded-md text-sm font-medium transition-colors shadow-sm">
                  {t("common.startFree")}
                </Link>
              </>
            )}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-1.5 text-neutral-500 hover:text-neutral-900" aria-label="Toggle menu">
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-neutral-100 px-6 py-3 space-y-2 bg-white">
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-neutral-500 hover:text-neutral-900 py-1">{t("landing.navFeatures")}</a>
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-neutral-500 hover:text-neutral-900 py-1">{t("landing.navHowItWorks")}</a>
            <Link href="/faq" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-neutral-500 hover:text-neutral-900 py-1">{t("common.faq")}</Link>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <main className="flex-grow pt-32 pb-24 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 border border-neutral-200 bg-neutral-50 text-neutral-600 px-3 py-1 rounded-full text-xs font-medium mb-8 shadow-sm">
            <Mic className="w-3.5 h-3.5 text-indigo-600" />
            {t("landing.badge")}
          </div>

          <h1 className="text-5xl md:text-7xl font-semibold tracking-tighter text-neutral-900 leading-[1.1] mb-6">
            {t("landing.heroTitle1")}{" "}
            <br className="hidden md:block" />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{t("landing.heroTitle2")}</span>
          </h1>

          <p className="text-base md:text-lg font-normal text-neutral-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            {t("landing.heroSubtitle")}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
            <Link href="/onboarding" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium text-sm transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2">
              {t("landing.ctaDemo")}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/audit" className="bg-white border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 text-neutral-500 px-6 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center justify-center shadow-sm">
              {t("landing.ctaAudit")}
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-xs font-medium text-neutral-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-indigo-500" />
              {t("landing.trustNoCreditCard")}
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-indigo-500" />
              {t("landing.trustQuickSetup")}
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-indigo-500" />
              {t("landing.trustExistingAds")}
            </div>
          </div>
        </div>

        {/* Dashboard UI Preview */}
        <div className="max-w-5xl mx-auto mt-20 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white z-10 top-1/2 pointer-events-none" />
          <div className="bg-white border border-neutral-200/80 rounded-2xl shadow-2xl shadow-neutral-200/50 overflow-hidden text-left relative z-0">
            {/* Mac-like Header */}
            <div className="bg-neutral-50/50 border-b border-neutral-100 px-4 py-3 flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-neutral-200" />
              <div className="w-2.5 h-2.5 rounded-full bg-neutral-200" />
              <div className="w-2.5 h-2.5 rounded-full bg-neutral-200" />
            </div>

            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* Stat Card 1 */}
                <div className="border border-neutral-100 rounded-xl p-5 shadow-sm">
                  <div className="text-xs font-medium text-neutral-400 mb-2 tracking-wide uppercase">Spent This Week</div>
                  <div className="text-2xl font-semibold tracking-tight text-neutral-900">$247.50</div>
                  <div className="text-xs text-neutral-500 mt-2 flex items-center gap-1">
                    <ArrowDownRight className="w-3 h-3 text-neutral-400" />
                    $38 less than last week
                  </div>
                </div>
                {/* Stat Card 2 */}
                <div className="border border-neutral-100 rounded-xl p-5 shadow-sm">
                  <div className="text-xs font-medium text-neutral-400 mb-2 tracking-wide uppercase">Phone Calls</div>
                  <div className="text-2xl font-semibold tracking-tight text-neutral-900">18</div>
                  <div className="text-xs text-neutral-500 mt-2 flex items-center gap-1">
                    <ArrowUpRight className="w-3 h-3 text-neutral-400" />
                    5 more than last week
                  </div>
                </div>
                {/* Stat Card 3 */}
                <div className="border border-neutral-100 rounded-xl p-5 shadow-sm">
                  <div className="text-xs font-medium text-neutral-400 mb-2 tracking-wide uppercase">Cost Per Customer</div>
                  <div className="text-2xl font-semibold tracking-tight text-neutral-900">$13.75</div>
                  <div className="text-xs text-neutral-500 mt-2 flex items-center gap-1">
                    <TrendingDown className="w-3 h-3 text-neutral-400" />
                    Getting cheaper
                  </div>
                </div>
              </div>

              {/* AI Chat Bubble */}
              <div className="bg-gradient-to-br from-indigo-50/80 to-blue-50/50 border border-indigo-100/60 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 bg-indigo-600 rounded-md flex items-center justify-center shadow-sm">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-xs font-semibold text-indigo-950">AdMaster AI</span>
                </div>
                <p className="text-sm font-medium text-neutral-800 leading-relaxed">
                  I took a quick look — your keyword <span className="font-semibold text-neutral-900">&quot;emergency plumber near me&quot;</span> got you 4 calls for $18 this week. But <span className="font-semibold text-neutral-900">&quot;free plumbing tips&quot;</span> cost $22 and got zero calls. Want me to pause it and save that money?
                </p>
                <div className="mt-5 flex gap-2">
                  <button className="text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-md shadow-sm transition-colors">Yes, pause it</button>
                  <button className="text-xs font-medium text-indigo-900/70 hover:text-indigo-950 bg-white/60 hover:bg-white px-4 py-2 rounded-md transition-colors border border-indigo-200/50 shadow-sm">No, keep it</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 border-t border-neutral-100 bg-neutral-50/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-semibold tracking-tight mb-4">{t("landing.featuresTitle")}</h2>
            <p className="text-base font-normal text-neutral-500 max-w-xl mx-auto">{t("landing.featuresSubtitle")}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="p-6 rounded-2xl border border-neutral-200/60 bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-lg border border-neutral-100 bg-neutral-50 flex items-center justify-center shrink-0">
                    <f.icon className="w-[18px] h-[18px] text-neutral-700" />
                  </div>
                  <h3 className="font-semibold text-base tracking-tight text-neutral-900">{f.title}</h3>
                </div>
                <p className="text-sm font-normal text-neutral-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-semibold tracking-tight mb-4">{t("landing.howItWorksTitle")}</h2>
            <p className="text-base font-normal text-neutral-500">{t("landing.howItWorksSubtitle")}</p>
          </div>
          <div className="space-y-12">
            {steps.map((s, i) => (
              <div key={i} className="flex gap-6 group">
                <div className="text-4xl font-light text-neutral-200 tracking-tighter w-8 text-right group-hover:text-indigo-600 transition-colors">{i + 1}</div>
                <div>
                  <h3 className="font-semibold text-base tracking-tight mb-1">{s.title}</h3>
                  <p className="text-sm font-normal text-neutral-500 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 px-6 border-t border-neutral-100 bg-neutral-50/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-semibold tracking-tight mb-12 text-center">{t("landing.testimonialsTitle")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {testimonials.map((item, i) => (
              <div key={i} className="bg-white border border-neutral-200/80 rounded-2xl p-8 shadow-sm">
                <div className="flex gap-1 mb-6">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm font-medium text-neutral-800 mb-6 leading-relaxed">&quot;{item.text}&quot;</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-xs font-medium text-neutral-600">{item.initial}</div>
                  <div>
                    <div className="font-medium text-xs tracking-tight text-neutral-900">{item.name}</div>
                    <div className="text-xs text-neutral-500">{item.biz}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Free Access Section */}
      <section id="pricing" className="py-24 px-6 border-t border-neutral-100">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 border border-emerald-200 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-medium mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            100% Free — No Credit Card Required
          </div>
          <h2 className="text-3xl font-semibold tracking-tight mb-4">Everything you need, completely free</h2>
          <p className="text-base font-normal text-neutral-500 mb-8 max-w-xl mx-auto">
            We&apos;re building the best AI ad management tool and want your feedback. All features are unlocked — AI ad creation, competitor analysis, keyword research, and more.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {["Unlimited AI Messages", "All Ad Formats", "Competitor Analysis", "Keyword Research", "Budget Optimization", "Campaign Drafts", "Google Ads Integration", "Shopify Integration"].map((feat) => (
              <div key={feat} className="flex items-center gap-2 text-xs text-neutral-600 bg-neutral-50 border border-neutral-100 rounded-lg px-3 py-2">
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                {feat}
              </div>
            ))}
          </div>
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white px-8 py-3.5 rounded-xl text-sm font-medium transition-colors shadow-lg shadow-neutral-900/10"
          >
            Get Started Free <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-24 px-6 bg-neutral-950 text-white mt-auto">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tighter mb-4">{t("landing.ctaTitle")}</h2>
          <p className="text-sm md:text-base font-normal text-neutral-400 mb-8">{t("landing.ctaSubtitle")}</p>
          <Link href="/onboarding" className="bg-indigo-600 text-white hover:bg-indigo-700 px-6 py-2.5 rounded-lg font-medium text-sm transition-colors inline-flex items-center gap-2">
            {t("landing.ctaButton")}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-200 py-12 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-5 h-5 bg-neutral-900 rounded-[4px] flex items-center justify-center">
                  <span className="text-white text-[10px] font-medium tracking-tighter">AM</span>
                </div>
                <span className="font-medium tracking-tight text-xs">AdMaster Pro</span>
              </div>
              <p className="text-xs text-neutral-500 leading-relaxed pr-4">{t("landing.footerTagline")}</p>
            </div>
            <div>
              <h4 className="font-medium text-xs tracking-tight mb-4 text-neutral-900">{t("common.product")}</h4>
              <div className="flex flex-col gap-3 text-xs font-normal text-neutral-500">
                <Link href="/onboarding" className="hover:text-neutral-900 transition-colors w-fit">Get Started</Link>
                <Link href="/audit" className="hover:text-neutral-900 transition-colors w-fit">{t("common.freeAudit")}</Link>
                <Link href="/faq" className="hover:text-neutral-900 transition-colors w-fit">{t("common.faq")}</Link>
                <Link href="/login" className="hover:text-neutral-900 transition-colors w-fit">{t("common.logIn")}</Link>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-xs tracking-tight mb-4 text-neutral-900">{t("common.company")}</h4>
              <div className="flex flex-col gap-3 text-xs font-normal text-neutral-500">
                <Link href="/about" className="hover:text-neutral-900 transition-colors w-fit">About Us</Link>
                <a href="mailto:support@admasterai.com" className="hover:text-neutral-900 transition-colors w-fit">Contact</a>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-xs tracking-tight mb-4 text-neutral-900">{t("common.legal")}</h4>
              <div className="flex flex-col gap-3 text-xs font-normal text-neutral-500">
                <Link href="/privacy" className="hover:text-neutral-900 transition-colors w-fit">Privacy Policy</Link>
                <Link href="/terms" className="hover:text-neutral-900 transition-colors w-fit">Terms of Service</Link>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-neutral-100 pt-6">
            <div className="text-[10px] text-neutral-400">&copy; {new Date().getFullYear()} NobleBlocks LLC. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
