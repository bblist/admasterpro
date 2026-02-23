"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Zap,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Upload,
  Globe,
  Building2,
  MapPin,
  Phone,
  Loader2,
} from "lucide-react";

const steps = [
  { id: 1, title: "Connect Google Ads" },
  { id: 2, title: "Your Business" },
  { id: 3, title: "Knowledge Base" },
  { id: 4, title: "Free Audit" },
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [connected, setConnected] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [location, setLocation] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [auditing, setAuditing] = useState(false);
  const [auditDone, setAuditDone] = useState(false);

  const handleConnect = () => {
    setConnected(true);
  };

  const handleUpload = () => {
    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      setUploaded(true);
    }, 1500);
  };

  const handleAudit = () => {
    setAuditing(true);
    setTimeout(() => {
      setAuditing(false);
      setAuditDone(true);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">AdMaster Pro</span>
          </Link>
          <Link href="/login" className="text-sm text-muted hover:text-foreground">
            Already have an account?
          </Link>
        </div>
      </div>

      {/* Progress */}
      <div className="max-w-3xl mx-auto w-full px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          {steps.map((step, i) => (
            <div key={step.id} className="flex items-center">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep > step.id
                      ? "bg-success text-white"
                      : currentStep === step.id
                      ? "bg-primary text-white"
                      : "bg-border text-muted"
                  }`}
                >
                  {currentStep > step.id ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    step.id
                  )}
                </div>
                <span
                  className={`text-sm hidden sm:block ${
                    currentStep === step.id ? "font-medium" : "text-muted"
                  }`}
                >
                  {step.title}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`w-12 sm:w-24 h-0.5 mx-2 ${
                    currentStep > step.id ? "bg-success" : "bg-border"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Connect */}
        {currentStep === 1 && (
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <div className="w-16 h-16 bg-primary-light rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Globe className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Connect Your Google Ads Account</h2>
            <p className="text-muted mb-8 max-w-md mx-auto">
              Sign in with Google to let me see your ad account. I&apos;ll only access your ad data —
              nothing else.
            </p>

            {!connected ? (
              <button
                onClick={handleConnect}
                className="bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition inline-flex items-center gap-3 shadow-sm"
              >
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
            ) : (
              <div className="inline-flex items-center gap-2 text-success bg-success/10 px-4 py-2 rounded-lg">
                <CheckCircle className="w-5 h-5" />
                Connected successfully!
              </div>
            )}

            <p className="text-xs text-muted mt-6">
              We use read-only access by default. You can revoke access anytime from your Google account settings.
            </p>

            {connected && (
              <div className="mt-8">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-lg font-medium transition inline-flex items-center gap-2"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Business Info */}
        {currentStep === 2 && (
          <div className="bg-card border border-border rounded-xl p-8">
            <div className="w-16 h-16 bg-primary-light rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Building2 className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-center">Tell Me About Your Business</h2>
            <p className="text-muted mb-8 text-center max-w-md mx-auto">
              This helps me write ads that sound exactly like you — not generic.
            </p>

            <div className="max-w-md mx-auto space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Business Name</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g., Mike's Plumbing LLC"
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">What type of business?</label>
                <select
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition"
                >
                  <option value="">Select...</option>
                  <option value="plumber">Plumber</option>
                  <option value="electrician">Electrician</option>
                  <option value="hvac">HVAC</option>
                  <option value="dentist">Dentist</option>
                  <option value="lawyer">Lawyer</option>
                  <option value="restaurant">Restaurant</option>
                  <option value="retail">Retail Store</option>
                  <option value="ecommerce">Online Store</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  <MapPin className="w-3 h-3 inline mr-1" />
                  Service Area
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Miami, FL (25-mile radius)"
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  <Phone className="w-3 h-3 inline mr-1" />
                  Business Phone
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="(305) 555-1234"
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  <Globe className="w-3 h-3 inline mr-1" />
                  Website URL
                </label>
                <input
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://mikesplumbing.com"
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition"
                />
              </div>
            </div>

            <div className="flex justify-between mt-8 max-w-md mx-auto">
              <button
                onClick={() => setCurrentStep(1)}
                className="border border-border text-foreground px-4 py-2.5 rounded-lg text-sm transition hover:border-primary flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={() => setCurrentStep(3)}
                className="bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-lg text-sm font-medium transition flex items-center gap-2"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Knowledge Base */}
        {currentStep === 3 && (
          <div className="bg-card border border-border rounded-xl p-8">
            <div className="w-16 h-16 bg-primary-light rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-center">Build Your Knowledge Base</h2>
            <p className="text-muted mb-8 text-center max-w-md mx-auto">
              The more I know about your business, the better ads I can write. Upload anything —
              menus, price lists, brochures, photos.
            </p>

            <div className="max-w-md mx-auto">
              {/* Upload zone */}
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition cursor-pointer ${
                  uploaded
                    ? "border-success bg-success/5"
                    : "border-border hover:border-primary"
                }`}
                onClick={!uploaded ? handleUpload : undefined}
              >
                {uploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <p className="text-sm text-muted">Processing your files...</p>
                  </div>
                ) : uploaded ? (
                  <div className="flex flex-col items-center gap-2">
                    <CheckCircle className="w-8 h-8 text-success" />
                    <p className="text-sm font-medium">3 files uploaded successfully!</p>
                    <p className="text-xs text-muted">price-list.pdf, services.docx, logo.png</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-8 h-8 text-muted" />
                    <p className="text-sm font-medium">Drop files here or click to upload</p>
                    <p className="text-xs text-muted">
                      PDF, Word, images, or any document about your business
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-4 text-center text-sm text-muted">
                <p>You can also add more files later from your dashboard.</p>
              </div>
            </div>

            <div className="flex justify-between mt-8 max-w-md mx-auto">
              <button
                onClick={() => setCurrentStep(2)}
                className="border border-border text-foreground px-4 py-2.5 rounded-lg text-sm transition hover:border-primary flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={() => {
                  setCurrentStep(4);
                  handleAudit();
                }}
                className="bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-lg text-sm font-medium transition flex items-center gap-2"
              >
                Run Free Audit
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Audit */}
        {currentStep === 4 && (
          <div className="bg-card border border-border rounded-xl p-8">
            {auditing ? (
              <div className="text-center py-12">
                <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-2">Checking your account...</h2>
                <p className="text-muted text-sm">
                  Looking for money leaks, junk keywords, and missed opportunities...
                </p>
              </div>
            ) : auditDone ? (
              <div>
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-success/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-success" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Your Free Audit Is Ready!</h2>
                  <p className="text-muted">Here&apos;s what I found in your account:</p>
                </div>

                {/* Audit Results */}
                <div className="space-y-4 max-w-lg mx-auto">
                  <div className="bg-danger/5 border border-danger/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">🚨</span>
                      <h3 className="font-semibold text-sm">$45/week wasted on junk keywords</h3>
                    </div>
                    <p className="text-xs text-muted">
                      3 keywords are attracting the wrong people (DIY-ers, job seekers). Pausing
                      them would save you ~$180/month.
                    </p>
                  </div>

                  <div className="bg-warning/5 border border-warning/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">⚠️</span>
                      <h3 className="font-semibold text-sm">Ads running 24/7 but you close at 6pm</h3>
                    </div>
                    <p className="text-xs text-muted">
                      You&apos;re spending ~$8/day on clicks between midnight and 6am when nobody picks
                      up the phone. That&apos;s ~$56/week.
                    </p>
                  </div>

                  <div className="bg-success/5 border border-success/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">✅</span>
                      <h3 className="font-semibold text-sm">Your best keyword is a goldmine</h3>
                    </div>
                    <p className="text-xs text-muted">
                      &quot;emergency plumber near me&quot; gets you calls at $4.50 each. That&apos;s excellent
                      for your area. We should get more of those.
                    </p>
                  </div>

                  <div className="bg-primary-light border border-primary/20 rounded-xl p-4">
                    <div className="font-semibold text-sm mb-1">
                      Total potential savings: ~$236/month
                    </div>
                    <p className="text-xs text-muted">
                      By fixing these issues, you could get the same (or more) customers while
                      spending significantly less.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
                  <Link
                    href="/dashboard"
                    className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-lg font-medium transition flex items-center justify-center gap-2"
                  >
                    Go to Dashboard
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/dashboard/chat"
                    className="border border-border hover:border-primary px-6 py-3 rounded-lg font-medium transition text-center"
                  >
                    Fix These Now with AI
                  </Link>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
