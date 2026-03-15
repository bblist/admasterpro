// ─── Business Ad Strategy Engine ────────────────────────────────────────────
// Maps business types to optimal ad strategies, channel recommendations,
// local presence importance, and suggested budget splits.
// This module is used by the AI chat, strategy page, and onboarding.

export type AdChannel =
  | "search"
  | "display"
  | "shopping"
  | "video"
  | "pmax"
  | "local_services"
  | "discovery"
  | "remarketing";

export type LocalImportance = "critical" | "high" | "moderate" | "low" | "none";

export interface ChannelRecommendation {
  channel: AdChannel;
  label: string;
  budgetPct: number; // suggested % of total budget
  priority: "primary" | "secondary" | "optional";
  reason: string;
}

export interface BusinessStrategy {
  industry: string;
  businessType: string;
  localImportance: LocalImportance;
  localReasoning: string;
  mapsMatters: boolean;
  reviewsMatter: boolean;
  gbpMatters: boolean; // Google Business Profile
  channels: ChannelRecommendation[];
  splitTestSuggestions: string[];
  tips: string[];
  pMaxRecommendation: string;
  avoidChannels: { channel: string; reason: string }[];
}

// ─── Industry → Strategy Mapping ────────────────────────────────────────────

const STRATEGY_DATABASE: Record<string, BusinessStrategy> = {
  // ─── Healthcare / Medical ──
  dental: {
    industry: "Healthcare",
    businessType: "Dental Practice",
    localImportance: "critical",
    localReasoning: "Patients search for dentists near them. 76% of local searches result in a same-day visit.",
    mapsMatters: true,
    reviewsMatter: true,
    gbpMatters: true,
    channels: [
      { channel: "search", label: "Google Search Ads", budgetPct: 50, priority: "primary", reason: "People actively searching \"dentist near me\" have high intent. Text ads capture that moment." },
      { channel: "local_services", label: "Local Services Ads", budgetPct: 20, priority: "primary", reason: "LSAs show at the very top with a Google Guaranteed badge. You only pay per lead, not per click." },
      { channel: "pmax", label: "Performance Max", budgetPct: 20, priority: "secondary", reason: "PMax finds patients across Search, Display, YouTube, Maps, and Gmail with one campaign." },
      { channel: "remarketing", label: "Remarketing", budgetPct: 10, priority: "optional", reason: "Retarget people who visited your site but didn't book. Gentle nudge back." },
    ],
    splitTestSuggestions: [
      "Test 'Emergency Dentist' vs 'Same-Day Appointments' headlines",
      "Compare Local Services Ads vs Search Ads cost-per-lead",
      "A/B test review-focused ads vs price-focused ads",
    ],
    tips: [
      "Claim and fully optimise your Google Business Profile — photos, hours, services, Q&A",
      "Respond to every review within 24 hours. Google ranks responsive businesses higher.",
      "Use call extensions and call-only ads — many patients want to phone directly",
      "Target by radius (5-10 miles) not broad locations",
    ],
    pMaxRecommendation: "Good fit. PMax works well for dental because it covers Maps, Search, and Display in one campaign. Start with 20% of budget and scale if CPA is good.",
    avoidChannels: [
      { channel: "Shopping Ads", reason: "You're not selling products online. Shopping ads are for e-commerce." },
    ],
  },

  optician: {
    industry: "Healthcare",
    businessType: "Optician / Eye Clinic",
    localImportance: "critical",
    localReasoning: "Eye exams and glasses are always local. Patients won't travel far for routine eyecare.",
    mapsMatters: true,
    reviewsMatter: true,
    gbpMatters: true,
    channels: [
      { channel: "search", label: "Google Search Ads", budgetPct: 45, priority: "primary", reason: "High-intent searches like 'eye test near me' or 'optician [city]' convert well with text ads." },
      { channel: "shopping", label: "Google Shopping", budgetPct: 15, priority: "secondary", reason: "If you sell glasses/contacts online, Shopping ads show your products with images and prices." },
      { channel: "pmax", label: "Performance Max", budgetPct: 25, priority: "primary", reason: "PMax is excellent for opticians — covers Search, Maps, Display, and YouTube in one campaign." },
      { channel: "display", label: "Display Ads", budgetPct: 10, priority: "optional", reason: "Good for promoting seasonal offers (back-to-school eye tests, etc.)." },
      { channel: "remarketing", label: "Remarketing", budgetPct: 5, priority: "optional", reason: "Remind visitors who browsed frames but didn't buy/book." },
    ],
    splitTestSuggestions: [
      "Test 'Free Eye Test' vs '£25 Eye Test' offers",
      "Compare Search-only vs PMax cost per booking",
      "A/B test location-focused vs service-focused headlines",
    ],
    tips: [
      "If you sell glasses online, add Shopping ads — visual products sell better with images",
      "Highlight NHS availability if applicable — it's a major differentiator",
      "Use sitelink extensions for specific services: eye test, contact lenses, glasses, sunglasses",
    ],
    pMaxRecommendation: "Strong fit. PMax works well because it shows your practice on Maps and Search while also retargeting browsers with display ads.",
    avoidChannels: [],
  },

  plumbing: {
    industry: "Home Services",
    businessType: "Plumber",
    localImportance: "critical",
    localReasoning: "Emergency plumbing is hyper-local. People need someone who can arrive in under an hour.",
    mapsMatters: true,
    reviewsMatter: true,
    gbpMatters: true,
    channels: [
      { channel: "search", label: "Google Search Ads", budgetPct: 50, priority: "primary", reason: "Emergency searches ('plumber near me', 'blocked drain') have massive conversion intent." },
      { channel: "local_services", label: "Local Services Ads", budgetPct: 30, priority: "primary", reason: "LSAs appear at the very top. Google Guaranteed badge builds instant trust." },
      { channel: "pmax", label: "Performance Max", budgetPct: 15, priority: "secondary", reason: "PMax reaches people across Maps and Search without managing separate campaigns." },
      { channel: "remarketing", label: "Remarketing", budgetPct: 5, priority: "optional", reason: "Less useful for emergency plumbing but good for scheduled services like boiler installs." },
    ],
    splitTestSuggestions: [
      "Test 'No Call-Out Fee' vs '1 Hour Response' headline",
      "Compare LSA leads vs Search Ad leads quality",
      "A/B test call-only ads vs standard text ads",
    ],
    tips: [
      "Call-only ads are your best friend — 70% of emergency plumbing leads come from calls",
      "Bid higher during evenings and weekends when emergencies happen",
      "Negative keyword 'plumber salary', 'plumber course', 'free plumber' aggressively",
      "Respond to reviews fast — local ranking correlates with review velocity",
    ],
    pMaxRecommendation: "Good secondary option. Start with Search + LSAs first, then add PMax to cover Maps and Discovery channels.",
    avoidChannels: [
      { channel: "Shopping Ads", reason: "Service business, not e-commerce." },
      { channel: "Display Ads", reason: "Low intent. Nobody browses the web and thinks 'I should hire a plumber.' Focus on Search." },
    ],
  },

  ecommerce: {
    industry: "E-commerce / Retail",
    businessType: "Online Store",
    localImportance: "none",
    localReasoning: "Online stores sell nationally/globally. Local presence doesn't drive online sales.",
    mapsMatters: false,
    reviewsMatter: true, // Trustpilot, Google reviews still matter
    gbpMatters: false,
    channels: [
      { channel: "shopping", label: "Google Shopping", budgetPct: 35, priority: "primary", reason: "Shopping ads show your product image, price, and store — the #1 driver for e-commerce." },
      { channel: "pmax", label: "Performance Max", budgetPct: 30, priority: "primary", reason: "PMax is Google's top recommendation for e-commerce. It uses your feed across all placements." },
      { channel: "search", label: "Google Search Ads", budgetPct: 15, priority: "secondary", reason: "Capture high-intent branded and product searches." },
      { channel: "remarketing", label: "Remarketing", budgetPct: 15, priority: "primary", reason: "Retarget cart abandoners and product viewers — highest ROI channel for e-commerce." },
      { channel: "display", label: "Display Ads", budgetPct: 5, priority: "optional", reason: "Good for new product launches and seasonal promotions." },
    ],
    splitTestSuggestions: [
      "Test Standard Shopping vs Performance Max for the same product categories",
      "Compare dynamic remarketing vs static remarketing banners",
      "A/B test free shipping headline vs discount percentage headline",
      "Split test product feed with vs without sale prices",
    ],
    tips: [
      "Your product feed is everything. Optimise titles with keywords that buyers search for.",
      "Use custom labels in your feed to segment products by margin, bestsellers, clearance",
      "Set up dynamic remarketing — show people the exact products they viewed",
      "Don't ignore YouTube — product demos and unboxing ads convert surprisingly well",
    ],
    pMaxRecommendation: "Essential. PMax is built for e-commerce. It uses your Shopping feed across Search, Display, YouTube, Gmail, and Discover. Most e-commerce advertisers see 15-30% better ROAS vs standard Shopping alone.",
    avoidChannels: [
      { channel: "Local Services Ads", reason: "Only for service businesses, not product sellers." },
    ],
  },

  realtor: {
    industry: "Real Estate",
    businessType: "Estate Agent / Realtor",
    localImportance: "high",
    localReasoning: "Property searches are location-driven but buyers often search broader areas than their current location.",
    mapsMatters: true,
    reviewsMatter: true,
    gbpMatters: true,
    channels: [
      { channel: "search", label: "Google Search Ads", budgetPct: 35, priority: "primary", reason: "Capture high-intent searches like 'houses for sale in [area]' and 'estate agent [city]'." },
      { channel: "display", label: "Display Ads", budgetPct: 20, priority: "primary", reason: "Visual property ads with images drive engagement. Beautiful homes sell themselves visually." },
      { channel: "video", label: "YouTube Video Ads", budgetPct: 15, priority: "secondary", reason: "Property walkthrough videos on YouTube reach buyers in research mode." },
      { channel: "pmax", label: "Performance Max", budgetPct: 20, priority: "primary", reason: "PMax with property images works well across all Google surfaces." },
      { channel: "remarketing", label: "Remarketing", budgetPct: 10, priority: "secondary", reason: "Property buying is a long decision — stay in front of browsers for weeks/months." },
    ],
    splitTestSuggestions: [
      "Test property-image Display ads vs text-only Search ads for cost per lead",
      "Compare YouTube property tours vs Search-only campaigns",
      "A/B test 'Free Valuation' vs 'How Much Is Your Home Worth?' CTA",
    ],
    tips: [
      "High-quality photos are everything. Use them in Display and PMax campaigns.",
      "Target life events: recently married, recently moved, recently had a baby",
      "Long remarketing window (90+ days) — property decisions take months",
      "Bid on competitor brand names as keywords (their agency names)",
    ],
    pMaxRecommendation: "Strong fit. PMax with good property images reaches buyers across all touchpoints — Search, Maps, YouTube, Display, Gmail, and Discover.",
    avoidChannels: [
      { channel: "Shopping Ads", reason: "Properties aren't products in a Shopping feed (though some portals do this)." },
    ],
  },

  restaurant: {
    industry: "Food & Beverage",
    businessType: "Restaurant / Café",
    localImportance: "critical",
    localReasoning: "Diners search for food near their current location. Maps ranking is everything.",
    mapsMatters: true,
    reviewsMatter: true,
    gbpMatters: true,
    channels: [
      { channel: "search", label: "Google Search Ads", budgetPct: 40, priority: "primary", reason: "Searches like 'restaurant near me', 'best pizza [city]' have immediate dining intent." },
      { channel: "local_services", label: "Local Services Ads", budgetPct: 10, priority: "optional", reason: "Available in some food categories. Check eligibility." },
      { channel: "pmax", label: "Performance Max", budgetPct: 25, priority: "primary", reason: "PMax shows your restaurant across Maps, Search, and Discovery — all key surfaces for diners." },
      { channel: "display", label: "Display Ads", budgetPct: 15, priority: "secondary", reason: "Food is visual. Beautiful food photos drive bookings." },
      { channel: "video", label: "YouTube Ads", budgetPct: 10, priority: "optional", reason: "Short food videos grab attention. Good for delivery promos." },
    ],
    splitTestSuggestions: [
      "Test food photography Display ads vs text-only Search ads",
      "Compare 'Order Online' vs 'Book a Table' CTAs",
      "A/B test lunch deals vs dinner specials campaigns",
    ],
    tips: [
      "Your Google Business Profile is more important than ads. Perfect photos, menu, hours first.",
      "Post weekly updates on GBP — Google rewards active profiles with better Map placement",
      "Reviews are the #1 factor. Ask every happy customer. Respond to every review.",
      "Target radius 3-5 miles. People don't drive far for dinner.",
    ],
    pMaxRecommendation: "Great fit. PMax puts your restaurant in front of nearby diners across Maps, Search, and the Discover feed on their phones.",
    avoidChannels: [
      { channel: "Shopping Ads", reason: "You're selling an experience, not a physical product." },
    ],
  },

  lawyer: {
    industry: "Legal Services",
    businessType: "Law Firm / Solicitor",
    localImportance: "high",
    localReasoning: "People prefer local lawyers they can visit in person, but high-value cases may search nationally.",
    mapsMatters: true,
    reviewsMatter: true,
    gbpMatters: true,
    channels: [
      { channel: "search", label: "Google Search Ads", budgetPct: 60, priority: "primary", reason: "Legal searches have the highest CPCs but also highest intent. 'Personal injury lawyer near me' is a £50-100 click but one case = £10,000+." },
      { channel: "local_services", label: "Local Services Ads", budgetPct: 25, priority: "primary", reason: "LSAs are perfect for lawyers — pay per lead, not per click. Google Screened badge builds trust." },
      { channel: "pmax", label: "Performance Max", budgetPct: 10, priority: "secondary", reason: "PMax can work for lawyers but needs careful audience signals to avoid wasted spend." },
      { channel: "remarketing", label: "Remarketing", budgetPct: 5, priority: "optional", reason: "Legal decisions take time. Stay in front of potential clients." },
    ],
    splitTestSuggestions: [
      "Compare Local Services Ads vs Search Ads lead quality and cost-per-case",
      "Test 'No Win No Fee' vs 'Free Consultation' headlines",
      "A/B test city-specific vs generic headlines",
    ],
    tips: [
      "Legal CPCs are brutal — £50-200 per click. Negative keywords are critical.",
      "Focus on practice area keywords, not broad 'lawyer' terms",
      "Call tracking is essential — most high-value clients phone first",
      "Review count matters hugely for local ranking. Ask clients after successful outcomes.",
    ],
    pMaxRecommendation: "Use cautiously. Legal CPCs are high and PMax's automated targeting can waste budget. Start with Search + LSAs, add PMax only with strong audience signals.",
    avoidChannels: [
      { channel: "Shopping Ads", reason: "Not a product business." },
      { channel: "Display Ads", reason: "Very low intent. Nobody browses the web looking for a lawyer. Focus on Search." },
    ],
  },

  saas: {
    industry: "Technology",
    businessType: "SaaS / Software",
    localImportance: "none",
    localReasoning: "Software is sold globally online. No local presence needed.",
    mapsMatters: false,
    reviewsMatter: true, // G2, Capterra reviews
    gbpMatters: false,
    channels: [
      { channel: "search", label: "Google Search Ads", budgetPct: 40, priority: "primary", reason: "Capture people searching for solutions ('project management tool', 'CRM software')." },
      { channel: "display", label: "Display Ads", budgetPct: 15, priority: "secondary", reason: "Reach decision-makers on tech sites. Good for brand awareness." },
      { channel: "video", label: "YouTube Ads", budgetPct: 15, priority: "secondary", reason: "Product demo videos and thought leadership content convert B2B audiences." },
      { channel: "pmax", label: "Performance Max", budgetPct: 15, priority: "secondary", reason: "PMax can work for SaaS if you have good creative assets and audience signals." },
      { channel: "remarketing", label: "Remarketing", budgetPct: 15, priority: "primary", reason: "SaaS buying cycles are long. Stay in front of trial users and demo requesters." },
    ],
    splitTestSuggestions: [
      "Test feature-focused vs benefit-focused landing pages",
      "Compare branded search vs competitor name bidding ROI",
      "A/B test 'Free Trial' vs 'Book a Demo' CTAs",
      "Test YouTube product demos vs Search-only campaigns",
    ],
    tips: [
      "Bid on competitor brand names — 'alternative to [competitor]' campaigns convert well",
      "Use custom intent audiences on Display targeting people who searched competitor names",
      "Long remarketing lists (180 days) — enterprise deals take months",
      "Track micro-conversions (signups, demo requests) not just purchases",
    ],
    pMaxRecommendation: "Mixed results. PMax works better for B2C SaaS with clear visual products. For B2B SaaS, start with Search + Remarketing and only add PMax with strong audience signals.",
    avoidChannels: [
      { channel: "Shopping Ads", reason: "Software isn't a physical product. Unless you sell hardware too." },
      { channel: "Local Services Ads", reason: "National/global business, not local." },
    ],
  },

  gym: {
    industry: "Fitness",
    businessType: "Gym / Fitness Studio",
    localImportance: "critical",
    localReasoning: "Nobody drives 30 minutes to a gym. It's the most hyper-local business after food.",
    mapsMatters: true,
    reviewsMatter: true,
    gbpMatters: true,
    channels: [
      { channel: "search", label: "Google Search Ads", budgetPct: 40, priority: "primary", reason: "Searches like 'gym near me', 'personal trainer [area]' convert directly to memberships." },
      { channel: "display", label: "Display Ads", budgetPct: 15, priority: "secondary", reason: "Visual ads showing your facility, classes, and transformations." },
      { channel: "video", label: "YouTube Ads", budgetPct: 15, priority: "secondary", reason: "Gym tour videos and member testimonials perform well on YouTube." },
      { channel: "pmax", label: "Performance Max", budgetPct: 20, priority: "primary", reason: "PMax puts your gym in front of nearby searchers across Maps, YouTube, and Discovery." },
      { channel: "remarketing", label: "Remarketing", budgetPct: 10, priority: "secondary", reason: "Retarget website visitors during New Year / summer with promo offers." },
    ],
    splitTestSuggestions: [
      "Test 'Free Trial' vs 'No Joining Fee' offers",
      "Compare YouTube gym tour videos vs Search-only campaigns",
      "A/B test transformation photos in Display vs search text ads",
    ],
    tips: [
      "Seasonal campaigns: January (New Year), April (summer body), September (back to routine)",
      "Target people who moved recently — they need a new gym",
      "Tight radius targeting: 2-5 miles maximum",
      "Photos of real members and facilities beat stock images every time",
    ],
    pMaxRecommendation: "Excellent fit. PMax with facility photos and short videos reaches nearby people across Maps, YouTube, and Search all in one campaign.",
    avoidChannels: [
      { channel: "Shopping Ads", reason: "Memberships aren't products in a feed." },
    ],
  },

  fashion: {
    industry: "Fashion / Clothing",
    businessType: "Fashion Retailer",
    localImportance: "low",
    localReasoning: "Unless you're a boutique, fashion is sold online. Physical store traffic is a bonus, not primary.",
    mapsMatters: false,
    reviewsMatter: true,
    gbpMatters: false,
    channels: [
      { channel: "shopping", label: "Google Shopping", budgetPct: 35, priority: "primary", reason: "Fashion is visual. Shoppers want to see the clothes before clicking. Shopping ads show product images." },
      { channel: "pmax", label: "Performance Max", budgetPct: 25, priority: "primary", reason: "PMax with your product feed shows clothing across YouTube, Discover, and Shopping surfaces." },
      { channel: "display", label: "Display Ads", budgetPct: 15, priority: "secondary", reason: "Lifestyle imagery ads on fashion and lifestyle sites." },
      { channel: "remarketing", label: "Dynamic Remarketing", budgetPct: 15, priority: "primary", reason: "Show people the exact dresses/shoes they looked at. Fashion has high browse-to-buy time." },
      { channel: "video", label: "YouTube Ads", budgetPct: 10, priority: "secondary", reason: "Lookbook and styling videos reach fashion-conscious audiences." },
    ],
    splitTestSuggestions: [
      "Test lifestyle photos vs product-only photos in Shopping ads",
      "Compare PMax vs Standard Shopping campaign ROAS",
      "A/B test 'Free Returns' vs '20% Off First Order' headlines",
      "Test short-form video ads vs static Display banners",
    ],
    tips: [
      "Product feed quality is king — detailed titles, accurate sizes, lifestyle images",
      "Use seasonal campaigns tied to fashion seasons (spring/summer, autumn/winter)",
      "Dynamic remarketing is essential — show the exact item they viewed",
      "YouTube Shorts ads are growing fast for fashion discovery",
    ],
    pMaxRecommendation: "Essential. PMax was built for fashion e-commerce. It shows your products across every Google surface including YouTube, Discovery, and Gmail.",
    avoidChannels: [
      { channel: "Local Services Ads", reason: "Not a service business." },
    ],
  },

  accountant: {
    industry: "Professional Services",
    businessType: "Accountant / Tax Advisor",
    localImportance: "moderate",
    localReasoning: "Many clients prefer local accountants for trust, but virtual accounting is growing fast. Both local and national can work.",
    mapsMatters: true,
    reviewsMatter: true,
    gbpMatters: true,
    channels: [
      { channel: "search", label: "Google Search Ads", budgetPct: 55, priority: "primary", reason: "High-intent searches like 'accountant near me' or 'small business tax help' convert well." },
      { channel: "pmax", label: "Performance Max", budgetPct: 20, priority: "secondary", reason: "PMax covers Maps and Search in one campaign — good for local accountants." },
      { channel: "remarketing", label: "Remarketing", budgetPct: 15, priority: "secondary", reason: "Clients research accountants for weeks. Stay visible until they decide." },
      { channel: "display", label: "Display Ads", budgetPct: 10, priority: "optional", reason: "Good during tax season (Jan-April) for awareness campaigns." },
    ],
    splitTestSuggestions: [
      "Test 'Free Consultation' vs 'Save on Your Tax Bill' headlines",
      "Compare Search ads year-round vs tax-season-only campaigns",
      "A/B test industry-specific ads (freelancer, small business, contractor)",
    ],
    tips: [
      "Ramp up spend January-April for tax season. Scale back in summer.",
      "Target by profession: 'accountant for freelancers', 'small business accountant'",
      "Use call extensions — many professional service clients prefer to phone",
      "Content marketing complements ads well: 'tax tips' blog posts + remarketing",
    ],
    pMaxRecommendation: "Decent fit for local practices. For national/virtual firms, stick with Search + Remarketing first.",
    avoidChannels: [
      { channel: "Shopping Ads", reason: "Not an e-commerce business." },
      { channel: "Video Ads", reason: "Low impact for accounting. Budget is better spent on Search." },
    ],
  },
};

// ─── Fuzzy Industry Matcher ─────────────────────────────────────────────────

const INDUSTRY_ALIASES: Record<string, string> = {
  // Healthcare
  dental: "dental", dentist: "dental", orthodontist: "dental", "dental practice": "dental",
  optician: "optician", optometrist: "optician", "eye clinic": "optician", "eye doctor": "optician", ophthalmologist: "optician",
  // Home services
  plumber: "plumbing", plumbing: "plumbing", "home services": "plumbing", hvac: "plumbing", electrician: "plumbing",
  handyman: "plumbing", roofer: "plumbing", "pest control": "plumbing", locksmith: "plumbing",
  cleaning: "plumbing", "carpet cleaning": "plumbing",
  // E-commerce
  ecommerce: "ecommerce", "e-commerce": "ecommerce", retail: "ecommerce", "online store": "ecommerce", shop: "ecommerce",
  // Real estate
  realtor: "realtor", "real estate": "realtor", "estate agent": "realtor", "property": "realtor",
  "letting agent": "realtor", "real estate agent": "realtor",
  // Restaurants
  restaurant: "restaurant", café: "restaurant", cafe: "restaurant", "food & beverage": "restaurant",
  bakery: "restaurant", catering: "restaurant", "food truck": "restaurant", bar: "restaurant",
  // Legal
  lawyer: "lawyer", solicitor: "lawyer", "law firm": "lawyer", attorney: "lawyer", legal: "lawyer",
  barrister: "lawyer", notary: "lawyer",
  // SaaS / Tech
  saas: "saas", software: "saas", technology: "saas", "tech startup": "saas", app: "saas",
  // Fitness
  gym: "gym", fitness: "gym", "personal trainer": "gym", yoga: "gym", pilates: "gym",
  "crossfit": "gym", "martial arts": "gym",
  // Fashion
  fashion: "fashion", clothing: "fashion", boutique: "fashion", apparel: "fashion",
  "jewellery": "fashion", jewelry: "fashion", "shoes": "fashion",
  // Accountant
  accountant: "accountant", "tax advisor": "accountant", bookkeeper: "accountant",
  "financial advisor": "accountant", "tax consultant": "accountant",
};

/**
 * Get ad strategy for a business based on industry/type.
 * Falls back to a generic balanced strategy if no match found.
 */
export function getAdStrategy(industry: string): BusinessStrategy {
  const normalized = industry.toLowerCase().trim();

  // Direct match
  if (STRATEGY_DATABASE[normalized]) return STRATEGY_DATABASE[normalized];

  // Alias match
  const aliasKey = INDUSTRY_ALIASES[normalized];
  if (aliasKey && STRATEGY_DATABASE[aliasKey]) return STRATEGY_DATABASE[aliasKey];

  // Partial match — check if any alias is contained in the industry string
  for (const [alias, key] of Object.entries(INDUSTRY_ALIASES)) {
    if (normalized.includes(alias) || alias.includes(normalized)) {
      if (STRATEGY_DATABASE[key]) return STRATEGY_DATABASE[key];
    }
  }

  // Generic fallback
  return getGenericStrategy(industry);
}

function getGenericStrategy(industry: string): BusinessStrategy {
  return {
    industry: industry || "General",
    businessType: industry || "General Business",
    localImportance: "moderate",
    localReasoning: "Many businesses benefit from local presence, but this depends on whether you serve a specific area or sell online.",
    mapsMatters: true,
    reviewsMatter: true,
    gbpMatters: true,
    channels: [
      { channel: "search", label: "Google Search Ads", budgetPct: 40, priority: "primary", reason: "Search ads capture people actively looking for what you offer. Start here." },
      { channel: "pmax", label: "Performance Max", budgetPct: 25, priority: "primary", reason: "PMax uses AI to find your best customers across all Google surfaces. Currently the strongest-performing campaign type for most businesses." },
      { channel: "remarketing", label: "Remarketing", budgetPct: 15, priority: "secondary", reason: "Bring back visitors who didn't convert the first time." },
      { channel: "display", label: "Display Ads", budgetPct: 10, priority: "optional", reason: "Good for brand awareness and reaching new audiences." },
      { channel: "video", label: "YouTube Ads", budgetPct: 10, priority: "optional", reason: "Video content builds trust and brand recognition." },
    ],
    splitTestSuggestions: [
      "Test Search ads vs Performance Max to see which delivers better leads",
      "Compare text-only vs image ads for your industry",
      "A/B test different headlines and offers",
    ],
    tips: [
      "Start with Search ads to capture existing demand, then expand",
      "Performance Max is currently Google's best-performing campaign type for most advertisers",
      "Set up conversion tracking properly — without it, Google can't optimise",
      "Check your Google Business Profile if you have a physical location",
    ],
    pMaxRecommendation: "Performance Max is worth testing for almost every business. It uses Google's AI to find your best customers across Search, Display, YouTube, Maps, Gmail, and Discover — all in one campaign. Start with 25% of budget.",
    avoidChannels: [],
  };
}

/**
 * Get a plain-English strategy summary for the AI chat to use.
 */
export function getStrategySummaryForAI(industry: string): string {
  const s = getAdStrategy(industry);
  const primary = s.channels.filter(c => c.priority === "primary").map(c => c.label).join(", ");
  const secondary = s.channels.filter(c => c.priority === "secondary").map(c => c.label).join(", ");
  const avoid = s.avoidChannels.map(c => `${c.channel} (${c.reason})`).join("; ");

  return [
    `Business type: ${s.businessType} (${s.industry})`,
    `Local importance: ${s.localImportance} — ${s.localReasoning}`,
    `Maps ranking matters: ${s.mapsMatters ? "Yes" : "No"}`,
    `Reviews matter: ${s.reviewsMatter ? "Yes" : "No"}`,
    `Google Business Profile matters: ${s.gbpMatters ? "Yes" : "No"}`,
    `Primary channels: ${primary}`,
    secondary ? `Secondary channels: ${secondary}` : "",
    avoid ? `Avoid: ${avoid}` : "",
    `PMax: ${s.pMaxRecommendation}`,
    `Top tip: ${s.tips[0]}`,
  ].filter(Boolean).join("\n");
}

/** All known industry keys for UI dropdowns */
export const KNOWN_INDUSTRIES = Object.keys(STRATEGY_DATABASE);

// ─── Multi-Signal Business Type Inference ───────────────────────────────────
// Instead of trusting the industry dropdown alone, this engine cross-references
// multiple data points to determine the TRUE business type and optimal strategy.

export interface BusinessSignals {
  industryDropdown?: string;      // What user selected in onboarding dropdown
  businessName?: string;          // e.g. "Dr. Smith Dental", "FashionHive Store"
  services?: string[];            // e.g. ["teeth whitening", "root canal"]
  kbContent?: string;             // Knowledge base / website crawl text
  websiteUrl?: string;            // e.g. "https://smithdental.com"
  shopifyConnected?: boolean;     // True = e-commerce signal
  shopifyDomain?: string;         // e.g. "mystore.myshopify.com"
  location?: string;              // e.g. "Manchester, UK" or empty = likely online
  googleAdsConnected?: boolean;   // Whether they have Google Ads data
}

interface IndustryScore {
  industry: string;
  score: number;
  signals: string[];  // Explanation of why this scored high
}

// ─── Keyword → Industry Signal Maps ─────────────────────────────────────────

const NAME_SIGNALS: Record<string, string[]> = {
  dental: ["dental", "dentist", "orthodon", "smile", "tooth", "teeth", "oral"],
  optician: ["optic", "eye", "vision", "lens", "sight", "spectacle"],
  plumbing: ["plumb", "drain", "pipe", "heating", "hvac", "boiler", "rooter", "electric", "handyman", "locksmith", "pest", "roofing", "roof"],
  ecommerce: ["store", "shop", "mart", "outlet", "emporium", "bazaar", "goods", "supply", "supplies"],
  realtor: ["realty", "real estate", "property", "properties", "estate agent", "homes", "lettings", "mortgage"],
  restaurant: ["restaurant", "cafe", "café", "bistro", "grill", "kitchen", "pizza", "burger", "sushi", "bakery", "diner", "eatery", "food", "catering"],
  lawyer: ["law", "legal", "solicitor", "attorney", "barrister", "advocate", "notary", "litigation"],
  saas: ["software", "tech", "digital", "cloud", "platform", "app", "labs", "io", "systems", "solutions"],
  gym: ["gym", "fitness", "fit", "crossfit", "yoga", "pilates", "sport", "training", "athletic", "muscle"],
  fashion: ["fashion", "clothing", "apparel", "wear", "style", "boutique", "threads", "couture", "designer"],
  accountant: ["accounting", "accountant", "tax", "bookkeep", "financial", "cpa", "audit"],
};

const SERVICE_SIGNALS: Record<string, string[]> = {
  dental: ["teeth whitening", "root canal", "dental implant", "braces", "invisalign", "crown", "filling", "extraction", "oral surgery", "denture", "veneer", "tooth", "bridges", "fluoride", "dental check", "hygienist"],
  optician: ["eye test", "eye exam", "glasses", "contact lens", "spectacles", "frames", "prescription", "sight test", "varifocal", "laser eye", "cataract", "retina"],
  plumbing: ["plumbing", "drain", "leak", "boiler", "heating", "radiator", "pipe", "toilet", "faucet", "tap", "water heater", "sewer", "blocked drain", "hvac", "air conditioning", "electrical", "wiring", "rewire", "roof repair", "gutter", "pest control", "exterminator", "locksmith"],
  ecommerce: ["shipping", "delivery", "free returns", "product", "add to cart", "checkout", "order", "buy online", "shop now", "e-commerce", "online store", "dropship", "wholesale", "inventory"],
  realtor: ["property valuation", "house sale", "apartment", "rental", "lettings", "mortgage", "conveyancing", "viewing", "house viewing", "for sale", "to let", "real estate", "square feet", "bedroom"],
  restaurant: ["menu", "reservation", "booking", "dine in", "takeaway", "delivery", "chef", "cuisine", "brunch", "lunch", "dinner", "appetizer", "dessert", "bar", "cocktail"],
  lawyer: ["consultation", "litigation", "injury", "divorce", "criminal", "immigration", "court", "trial", "settlement", "legal advice", "will", "probate", "contract law", "asylum"],
  saas: ["free trial", "pricing plan", "api", "integration", "dashboard", "analytics", "saas", "subscription", "enterprise", "onboarding", "workflow", "automation", "login", "signup"],
  gym: ["membership", "class", "personal training", "workout", "treadmill", "weight", "cardio", "spin", "yoga class", "pilates class", "crossfit", "body transformation", "group class"],
  fashion: ["collection", "season", "outfit", "dress", "shirt", "pants", "accessories", "jewelry", "jewellery", "handbag", "shoe", "sneaker", "size guide", "fabric", "cotton", "silk"],
  accountant: ["tax return", "tax filing", "bookkeeping", "payroll", "vat", "self-assessment", "corporation tax", "annual accounts", "audit", "financial statement", "tax planning", "hmrc"],
};

const KB_SIGNALS: Record<string, string[]> = {
  dental: ["appointment", "patient", "clinic", "surgery", "nhs", "dental", "treatment plan", "oral health", "tooth", "gum", "cavity", "x-ray"],
  optician: ["prescription", "frames", "lenses", "eye health", "pupil", "squint", "astigmatism", "myopia", "glaucoma"],
  plumbing: ["emergency callout", "same day", "no call-out fee", "gas safe", "certified", "warranty", "parts", "repair", "install", "unblock"],
  ecommerce: ["cart", "checkout", "stock", "sku", "product description", "size chart", "returns policy", "shipping cost", "add to basket", "price", "£", "$", "€", "sale", "discount code", "coupon"],
  realtor: ["property", "bedroom", "bathroom", "square", "garden", "parking", "freehold", "leasehold", "flat", "bungalow", "detached", "semi-detached", "stamp duty"],
  restaurant: ["menu", "allergen", "gluten", "vegan", "vegetarian", "table", "book", "reserve", "opening hours", "chef", "kitchen", "dish", "starter", "main course"],
  lawyer: ["client", "case", "court", "legal aid", "solicitor", "regulated by", "law society", "bar association", "confidential", "privilege"],
  saas: ["documentation", "api", "sdk", "webhook", "changelog", "release", "feature", "integration", "endpoint", "oauth", "token"],
  gym: ["facility", "locker", "pool", "class timetable", "schedule", "instructor", "pt", "personal trainer", "equipement", "equipment"],
  fashion: ["look", "trend", "styling", "fabric", "material", "handmade", "limited edition", "new arrivals", "runway", "model"],
  accountant: ["compliance", "hmrc", "irs", "deadline", "financial year", "tax year", "quarter", "profit and loss", "balance sheet"],
};

const URL_SIGNALS: Record<string, string[]> = {
  dental: ["dental", "dentist", "smile", "teeth", "ortho"],
  optician: ["optic", "vision", "eye", "sight", "specs", "lens"],
  plumbing: ["plumb", "drain", "heating", "hvac", "fix", "repair", "electric", "handyman"],
  ecommerce: [".shop", "store", "mart", "buy", "goods"],
  realtor: ["realty", "property", "properties", "homes", "estate", "lettings"],
  restaurant: ["eat", "food", "restaurant", "cafe", "bistro", "grill", "kitchen", "pizza"],
  lawyer: ["law", "legal", "solicitor", "attorney"],
  saas: [".io", ".ai", ".app", ".dev", "cloud", "platform", "software"],
  gym: ["gym", "fit", "fitness", "sport", "training"],
  fashion: ["fashion", "wear", "style", "clothing", "boutique", "apparel"],
  accountant: ["account", "tax", "bookkeep", "cpa"],
};

/**
 * Infer the true business type from multiple signals, not just the dropdown.
 * Returns a strategy + confidence score + reasoning.
 */
export function inferBusinessType(signals: BusinessSignals): {
  strategy: BusinessStrategy;
  inferredIndustry: string;
  confidence: "high" | "medium" | "low";
  reasoning: string[];
  allScores: IndustryScore[];
} {
  const scores: Record<string, IndustryScore> = {};
  const industries = Object.keys(STRATEGY_DATABASE);

  // Initialize scores for all known industries
  for (const ind of industries) {
    scores[ind] = { industry: ind, score: 0, signals: [] };
  }

  // ─── Signal 1: Industry Dropdown (weak — user may be wrong) ───────────
  if (signals.industryDropdown) {
    const dropdownMatch = getAdStrategy(signals.industryDropdown);
    const matchKey = industries.find(k => STRATEGY_DATABASE[k] === dropdownMatch);
    if (matchKey) {
      scores[matchKey].score += 2; // Only 2 points — weakest signal
      scores[matchKey].signals.push(`User selected "${signals.industryDropdown}" in onboarding`);
    }
  }

  // ─── Signal 2: Business Name (moderate signal) ────────────────────────
  if (signals.businessName) {
    const nameLower = signals.businessName.toLowerCase();
    for (const [industry, keywords] of Object.entries(NAME_SIGNALS)) {
      for (const kw of keywords) {
        if (nameLower.includes(kw)) {
          scores[industry].score += 3;
          scores[industry].signals.push(`Business name "${signals.businessName}" contains "${kw}"`);
          break; // only count once per industry from name
        }
      }
    }

    // Special patterns in business name
    if (/\b(dr\.?|doctor)\b/i.test(signals.businessName)) {
      scores.dental.score += 1;
      scores.optician.score += 1;
      scores.dental.signals.push("Business name includes 'Dr.' — medical indicator");
      scores.optician.signals.push("Business name includes 'Dr.' — medical indicator");
    }
    if (/\b(clinic|practice|surgery|medical)\b/i.test(signals.businessName)) {
      scores.dental.score += 2;
      scores.optician.score += 2;
      scores.dental.signals.push("Business name suggests healthcare");
      scores.optician.signals.push("Business name suggests healthcare");
    }
    if (/\b(ltd|llp|partners|associates|chambers)\b/i.test(signals.businessName)) {
      scores.lawyer.score += 1;
      scores.accountant.score += 1;
      scores.lawyer.signals.push("Business name uses formal structure (Ltd/LLP/Partners)");
      scores.accountant.signals.push("Business name uses formal structure (Ltd/LLP/Partners)");
    }
  }

  // ─── Signal 3: Services List (strong signal) ──────────────────────────
  if (signals.services?.length) {
    const servicesText = signals.services.join(" ").toLowerCase();
    for (const [industry, keywords] of Object.entries(SERVICE_SIGNALS)) {
      let matchCount = 0;
      const matchedKws: string[] = [];
      for (const kw of keywords) {
        if (servicesText.includes(kw)) {
          matchCount++;
          matchedKws.push(kw);
        }
      }
      if (matchCount > 0) {
        const points = Math.min(matchCount * 3, 12); // up to 12 points
        scores[industry].score += points;
        scores[industry].signals.push(`Services match ${matchCount} keywords: ${matchedKws.slice(0, 3).join(", ")}${matchCount > 3 ? "..." : ""}`);
      }
    }
  }

  // ─── Signal 4: Knowledge Base Content (strongest signal) ──────────────
  if (signals.kbContent) {
    const kbLower = signals.kbContent.toLowerCase();
    const kbLength = kbLower.length;

    for (const [industry, keywords] of Object.entries(KB_SIGNALS)) {
      let matchCount = 0;
      const matchedKws: string[] = [];
      for (const kw of keywords) {
        // Count occurrences, not just presence
        const regex = new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
        const occurrences = (kbLower.match(regex) || []).length;
        if (occurrences > 0) {
          matchCount += Math.min(occurrences, 5); // cap per keyword at 5
          matchedKws.push(kw);
        }
      }
      if (matchCount > 0) {
        // Normalize by content length — don't over-score long KBs
        const densityBonus = kbLength > 2000 ? Math.min(matchCount * 2, 15) : Math.min(matchCount * 3, 15);
        scores[industry].score += densityBonus;
        scores[industry].signals.push(`KB content matches ${matchedKws.length} industry terms: ${matchedKws.slice(0, 4).join(", ")}${matchedKws.length > 4 ? "..." : ""}`);
      }
    }

    // E-commerce content detection (product listings, prices, SKUs)
    const pricePattern = /[\$£€]\s?\d+[.,]?\d{0,2}/g;
    const priceMatches = (kbLower.match(pricePattern) || []).length;
    if (priceMatches > 3) {
      scores.ecommerce.score += Math.min(priceMatches, 10);
      scores.ecommerce.signals.push(`KB contains ${priceMatches} price references — product catalog detected`);
      scores.fashion.score += Math.min(priceMatches / 2, 5);
      scores.fashion.signals.push(`Multiple product prices suggest retail/fashion`);
    }

    // Appointment/booking language = local service
    const appointmentWords = ["appointment", "book now", "schedule", "call us", "visit us", "walk-in", "same day"];
    const appointmentCount = appointmentWords.filter(w => kbLower.includes(w)).length;
    if (appointmentCount >= 2) {
      // Boost all local service industries
      for (const ind of ["dental", "optician", "plumbing", "lawyer", "accountant", "gym", "restaurant"]) {
        scores[ind].score += 3;
        scores[ind].signals.push(`KB has appointment/booking language — suggests local service`);
      }
    }
  }

  // ─── Signal 5: Shopify Connection (very strong e-commerce signal) ─────
  if (signals.shopifyConnected) {
    scores.ecommerce.score += 10;
    scores.ecommerce.signals.push("Shopify store connected — strong e-commerce signal");
    scores.fashion.score += 5;
    scores.fashion.signals.push("Shopify connection — may be fashion e-commerce");
    // Reduce all non-ecommerce scores
    for (const ind of ["dental", "optician", "plumbing", "realtor", "lawyer", "accountant"]) {
      scores[ind].score -= 3;
      scores[ind].signals.push("Shopify connected — unlikely for this industry");
    }
  }

  if (signals.shopifyDomain) {
    const shopDomain = signals.shopifyDomain.toLowerCase();
    for (const [industry, keywords] of Object.entries(URL_SIGNALS)) {
      for (const kw of keywords) {
        if (shopDomain.includes(kw)) {
          scores[industry].score += 3;
          scores[industry].signals.push(`Shopify domain contains "${kw}"`);
          break;
        }
      }
    }
  }

  // ─── Signal 6: Website URL (moderate signal) ──────────────────────────
  if (signals.websiteUrl) {
    const urlLower = signals.websiteUrl.toLowerCase();
    for (const [industry, keywords] of Object.entries(URL_SIGNALS)) {
      for (const kw of keywords) {
        if (urlLower.includes(kw)) {
          scores[industry].score += 3;
          scores[industry].signals.push(`Website URL contains "${kw}"`);
          break;
        }
      }
    }

    // .shop or .store TLD = e-commerce
    if (/\.(shop|store|market|buy)($|\/)/.test(urlLower)) {
      scores.ecommerce.score += 5;
      scores.ecommerce.signals.push("Website uses e-commerce TLD (.shop/.store)");
    }
  }

  // ─── Signal 7: Location (contextual signal) ──────────────────────────
  if (signals.location && signals.location.trim()) {
    // Having a specific location suggests local business
    for (const ind of ["dental", "optician", "plumbing", "realtor", "restaurant", "lawyer", "gym", "accountant"]) {
      scores[ind].score += 1;
      scores[ind].signals.push("Has a specific location — suggests local business");
    }
    // Penalize pure-online businesses slightly
    scores.saas.score -= 1;
    scores.saas.signals.push("Has location set — less likely to be pure SaaS");
  } else {
    // No location = more likely online business
    scores.ecommerce.score += 2;
    scores.ecommerce.signals.push("No location set — more likely online/national business");
    scores.saas.score += 2;
    scores.saas.signals.push("No location set — consistent with SaaS/technology");
    scores.fashion.score += 1;
    scores.fashion.signals.push("No location — could be online fashion retail");
  }

  // ─── Calculate Result ─────────────────────────────────────────────────
  const sortedScores = Object.values(scores)
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score);

  if (sortedScores.length === 0) {
    // No signals at all — use dropdown or generic
    const fallbackIndustry = signals.industryDropdown || "general";
    return {
      strategy: getAdStrategy(fallbackIndustry),
      inferredIndustry: fallbackIndustry,
      confidence: "low",
      reasoning: ["No strong signals detected. Using industry dropdown selection or generic strategy."],
      allScores: [],
    };
  }

  const winner = sortedScores[0];
  const runnerUp = sortedScores[1];

  // Determine confidence
  let confidence: "high" | "medium" | "low" = "low";
  if (winner.score >= 15 && (!runnerUp || winner.score > runnerUp.score * 1.5)) {
    confidence = "high";
  } else if (winner.score >= 8 && (!runnerUp || winner.score > runnerUp.score * 1.2)) {
    confidence = "medium";
  }

  // If dropdown disagrees with inference, note it
  const reasoning = [...winner.signals];
  if (signals.industryDropdown) {
    const dropdownKey = findIndustryKey(signals.industryDropdown);
    if (dropdownKey && dropdownKey !== winner.industry) {
      reasoning.push(
        `Note: User selected "${signals.industryDropdown}" but signals point to ${STRATEGY_DATABASE[winner.industry]?.businessType || winner.industry}. ` +
        `Using inferred type for better ad recommendations.`
      );
    }
  }

  return {
    strategy: STRATEGY_DATABASE[winner.industry] || getAdStrategy(winner.industry),
    inferredIndustry: winner.industry,
    confidence,
    reasoning,
    allScores: sortedScores.slice(0, 5), // top 5 for transparency
  };
}

/** Find the STRATEGY_DATABASE key for a given industry string */
function findIndustryKey(industry: string): string | null {
  const normalized = industry.toLowerCase().trim();
  if (STRATEGY_DATABASE[normalized]) return normalized;
  const aliasKey = INDUSTRY_ALIASES[normalized];
  if (aliasKey) return aliasKey;
  for (const [alias, key] of Object.entries(INDUSTRY_ALIASES)) {
    if (normalized.includes(alias) || alias.includes(normalized)) return key;
  }
  return null;
}

/**
 * Build a full strategy summary for the AI chat using multi-signal inference.
 * This replaces the simple getStrategySummaryForAI() when full signals are available.
 */
export function getInferredStrategySummaryForAI(signals: BusinessSignals): string {
  const result = inferBusinessType(signals);
  const s = result.strategy;

  const primary = s.channels.filter(c => c.priority === "primary").map(c => `${c.label} (${c.budgetPct}%)`).join(", ");
  const secondary = s.channels.filter(c => c.priority === "secondary").map(c => `${c.label} (${c.budgetPct}%)`).join(", ");
  const avoid = s.avoidChannels.map(c => `${c.channel} (${c.reason})`).join("; ");

  const lines = [
    `═══ AD STRATEGY INTELLIGENCE ═══`,
    `Inferred business type: ${s.businessType} (${result.confidence} confidence)`,
    result.confidence !== "high"
      ? `Note: Confidence is ${result.confidence} — recommendations may need adjustment based on conversation.`
      : "",
    `Industry: ${s.industry}`,
    ``,
    `── Local Presence ──`,
    `Importance: ${s.localImportance.toUpperCase()} — ${s.localReasoning}`,
    `Google Maps: ${s.mapsMatters ? "Important — optimise Maps listing" : "Not a priority"}`,
    `Google Business Profile: ${s.gbpMatters ? "Essential — claim and fully optimise" : "Not critical"}`,
    `Reviews: ${s.reviewsMatter ? "Very important — actively collect and respond" : "Less important for this business type"}`,
    ``,
    `── Recommended Ad Channels ──`,
    `PRIMARY (invest here first): ${primary}`,
    secondary ? `SECONDARY (add when budget allows): ${secondary}` : "",
    avoid ? `AVOID: ${avoid}` : "",
    ``,
    `── Performance Max ──`,
    s.pMaxRecommendation,
    ``,
    `── Split Test Ideas ──`,
    ...s.splitTestSuggestions.map(t => `• ${t}`),
    ``,
    `── Key Tips ──`,
    ...s.tips.map(t => `• ${t}`),
    ``,
    `── Inference Signals Used ──`,
    ...result.reasoning.slice(0, 5).map(r => `• ${r}`),
    `═══════════════════════════════`,
  ];

  return lines.filter(l => l !== undefined).join("\n");
}
