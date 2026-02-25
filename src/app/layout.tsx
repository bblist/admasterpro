import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "AdMaster Pro — AI-Powered Google Ads Management for Small Business",
  description:
    "AdMaster Pro is an AI-powered Google Ads management platform. Create better ads, find money leaks, and grow your business — starting at $49/month. Built by NobleBlocks LLC.",
  keywords: [
    "Google Ads management",
    "AI Google Ads",
    "small business advertising",
    "PPC management tool",
    "Google Ads optimization",
    "AI ad copy generator",
    "AdMaster Pro",
    "NobleBlocks",
  ],
  authors: [{ name: "NobleBlocks LLC" }],
  creator: "NobleBlocks LLC",
  publisher: "NobleBlocks LLC",
  metadataBase: new URL("https://admasterai.nobleblocks.com"),
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://admasterai.nobleblocks.com",
    siteName: "AdMaster Pro",
    title: "AdMaster Pro — AI-Powered Google Ads Management",
    description:
      "Create better Google Ads, find money leaks, and grow your business with AI. Plans from $49/month.",
  },
  twitter: {
    card: "summary_large_image",
    title: "AdMaster Pro — AI-Powered Google Ads Management",
    description:
      "Create better Google Ads, find money leaks, and grow your business with AI.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "mobile-web-app-capable": "yes",
  },
};

/* JSON-LD Structured Data for AI search */
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "AdMaster Pro",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: "https://admasterai.nobleblocks.com",
  description:
    "AI-powered Google Ads management platform for small businesses. Create ads, detect money leaks, and optimize campaigns with GPT-4o and Claude.",
  offers: [
    {
      "@type": "Offer",
      name: "Free",
      price: "0",
      priceCurrency: "USD",
      description: "10 AI messages, 1 campaign",
    },
    {
      "@type": "Offer",
      name: "Starter",
      price: "49",
      priceCurrency: "USD",
      description: "200 AI messages, 5 campaigns, display ads, call tracking",
    },
    {
      "@type": "Offer",
      name: "Pro",
      price: "149",
      priceCurrency: "USD",
      description:
        "Unlimited AI messages, unlimited campaigns, multi-account, priority support",
    },
  ],
  publisher: {
    "@type": "Organization",
    name: "NobleBlocks LLC",
    url: "https://admasterai.nobleblocks.com",
  },
  featureList: [
    "AI-powered ad copy generation",
    "Money leak detection",
    "Voice and text campaign management",
    "Knowledge Base for business context",
    "Free website audit tool",
    "Multi-account management",
    "Performance analytics",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
