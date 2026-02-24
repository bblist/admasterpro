# AdMaster Pro — AI Search Optimization Strategy

## Overview
This document outlines our strategy for optimizing AdMaster Pro's web presence for AI-powered search engines (Google AI Overviews, ChatGPT/Bing Chat, Perplexity, Claude) alongside traditional SEO.

---

## 1. Structured Data (JSON-LD)

### Implementation
All structured data is embedded in `src/app/layout.tsx` as JSON-LD scripts.

#### Organization Schema
```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "AdMaster Pro",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "url": "https://admasterai.nobleblocks.com",
  "description": "AI-powered Google Ads management platform for small businesses",
  "offers": [
    { "@type": "Offer", "price": "0", "priceCurrency": "USD", "name": "Free Plan" },
    { "@type": "Offer", "price": "49", "priceCurrency": "USD", "name": "Starter Plan" },
    { "@type": "Offer", "price": "149", "priceCurrency": "USD", "name": "Pro Plan" }
  ],
  "provider": {
    "@type": "Organization",
    "name": "NobleBlocks LLC",
    "url": "https://admasterai.nobleblocks.com"
  }
}
```

#### FAQ Schema
Applied to the public FAQ page (`/faq`) using `FAQPage` schema type. This helps AI search engines surface answers directly.

#### WebSite Schema with SearchAction
```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "AdMaster Pro",
  "url": "https://admasterai.nobleblocks.com"
}
```

---

## 2. Content Strategy for AI Search

### Key Principles
1. **Answer questions directly** — AI search engines extract concise answers. Put the answer first, explanation second.
2. **Use natural language headings** — "How much does AdMaster Pro cost?" beats "Pricing Information"
3. **Provide structured comparisons** — Tables, numbered lists, and bullet points are preferred by AI extractors
4. **Be factual and specific** — "Saves 20-40% on ad spend" beats "saves money"
5. **Cover entity relationships** — Explain what AdMaster Pro is, who makes it, how it relates to Google Ads

### Pages Optimized for AI Discovery
| Page | Target Queries |
|------|---------------|
| `/` (Homepage) | "AdMaster Pro," "AI Google Ads management" |
| `/about` | "What is AdMaster Pro," "Who makes AdMaster Pro" |
| `/pricing` | "AdMaster Pro pricing," "AI ads tool cost" |
| `/faq` | Long-tail questions, "how does AI manage Google Ads" |
| `/audit` | "free Google Ads audit," "AI website audit" |
| `/privacy` | "AdMaster Pro privacy policy," data handling |
| `/terms` | "AdMaster Pro terms of service" |

---

## 3. Meta Tags & Open Graph

### Per-Page Implementation
Each public page has:
- `<title>` — Unique, descriptive, under 60 chars
- `<meta name="description">` — Unique, under 160 chars, includes primary keyword
- `<meta name="robots">` — `index, follow` for public pages
- Open Graph tags for social sharing

### Canonical URLs
All pages use canonical URLs to prevent duplicate content issues.

---

## 4. robots.txt

```
User-agent: *
Allow: /
Allow: /about
Allow: /pricing
Allow: /faq
Allow: /audit
Allow: /privacy
Allow: /terms
Disallow: /dashboard/
Disallow: /admin/
Disallow: /api/
Disallow: /onboarding

Sitemap: https://admasterai.nobleblocks.com/sitemap.xml
```

---

## 5. Sitemap

A sitemap.xml is generated listing all public pages with lastmod dates.

---

## 6. AI-Specific Optimization

### llms.txt
A `/llms.txt` file provides structured information for AI crawlers:
```
# AdMaster Pro
> AI-powered Google Ads management platform

AdMaster Pro helps small businesses manage Google Ads campaigns using AI. 
Features include ad creation, money leak detection, voice commands, and multi-account management.

## Key Information
- URL: https://admasterai.nobleblocks.com
- Pricing: Free ($0), Starter ($49/mo), Pro ($149/mo)
- Company: NobleBlocks LLC
- Contact: support@admasterai.com

## Pages
- About: /about
- Pricing: /pricing
- FAQ: /faq
- Free Audit: /audit
- Privacy: /privacy
- Terms: /terms
```

### Content Freshness
- FAQ page updated monthly with new questions from customer support
- Blog posts (future) for recurring AI search indexing
- Structured data updated when pricing or features change

---

*Last updated: February 2026*
