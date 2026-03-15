/**
 * Context Engine — Holiday / Seasonal / Geo / Device / Climate Intelligence
 *
 * This shared utility powers every intelligence feature in AdMaster Pro.
 * It enriches any dataset with contextual awareness so ads, budgets,
 * and recommendations automatically adapt to what's happening in the
 * real world — right now.
 */

/* ══════════════════════════════════════════════════════════════════════════
   TYPES
   ══════════════════════════════════════════════════════════════════════════ */

export interface Holiday {
  name: string;
  date: string; // MM-DD
  dateEnd?: string; // MM-DD (multi-day)
  region: "US" | "EU" | "UK" | "GLOBAL" | "DE" | "FR" | "ES" | "IT" | "NL" | "SE" | "NO" | "DK" | "FI" | "PL" | "AU" | "CA" | "BR" | "JP" | "CN" | "MX" | "IN";
  adImpact: "critical" | "high" | "medium" | "low";
  category: "shopping" | "travel" | "food" | "gifts" | "health" | "sports" | "cultural" | "awareness";
  budgetMultiplier: number; // 1.0 = normal, 2.0 = double budget recommended
  cpcChange: number; // percentage change expected (e.g., +35 means +35%)
  tips: string[];
  leadTimeDays: number; // how many days before to start ramping ads
}

/** Region groupings — when a user is in the UK, they also see EU + GLOBAL holidays */
const REGION_GROUPS: Record<string, string[]> = {
  US: ["US", "GLOBAL"],
  UK: ["UK", "EU", "GLOBAL"],
  AU: ["AU", "UK", "GLOBAL"], // Boxing Day etc.
  CA: ["CA", "US", "GLOBAL"],
  SE: ["SE", "EU", "GLOBAL"],
  NO: ["NO", "EU", "GLOBAL"],
  DK: ["DK", "EU", "GLOBAL"],
  FI: ["FI", "EU", "GLOBAL"],
  DE: ["DE", "EU", "GLOBAL"],
  FR: ["FR", "EU", "GLOBAL"],
  ES: ["ES", "EU", "GLOBAL"],
  IT: ["IT", "EU", "GLOBAL"],
  NL: ["NL", "EU", "GLOBAL"],
  PL: ["PL", "EU", "GLOBAL"],
};

export interface SeasonalContext {
  season: "spring" | "summer" | "fall" | "winter";
  hemisphere: "northern" | "southern";
  month: number;
  quarterLabel: string;
  isEndOfQuarter: boolean;
  isEndOfYear: boolean;
  retailSeason: string;
  demandTrend: "rising" | "peak" | "declining" | "low";
  industries: Record<string, { demand: "high" | "medium" | "low"; tip: string }>;
}

export interface GeoContext {
  timezone: string;
  currency: string;
  language: string;
  country: string;
  countryCode: string;
  region: string;
  isWorkingHours: boolean;
  localHour: number;
  peakAdHours: number[];
  offPeakDiscount: number; // suggested bid discount for off-peak (0-50%)
  localEvents: string[];
}

export interface DeviceContext {
  recommendedBidAdjustments: {
    mobile: number; // percentage adjustment
    desktop: number;
    tablet: number;
  };
  currentPeakDevice: "mobile" | "desktop" | "tablet";
  reasoning: string;
  tips: string[];
}

export interface ClimateContext {
  season: string;
  hemisphere: "northern" | "southern";
  weatherSensitiveCategories: string[];
  recommendations: string[];
  productOpportunities: string[];
}

export interface FullContext {
  timestamp: string;
  holidays: {
    upcoming: Holiday[];
    active: Holiday[];
    nextMajor: Holiday | null;
    daysUntilNextMajor: number;
  };
  seasonal: SeasonalContext;
  geo: GeoContext;
  device: DeviceContext;
  climate: ClimateContext;
  aiSummary: string;
  actionItems: string[];
}

/* ══════════════════════════════════════════════════════════════════════════
   HOLIDAY CALENDAR — 80+ ad-relevant holidays worldwide
   ══════════════════════════════════════════════════════════════════════════ */

const HOLIDAYS: Holiday[] = [
  // ─── Q1: January – March ────────────────────────────────────
  { name: "New Year's Day", date: "01-01", region: "GLOBAL", adImpact: "high", category: "shopping", budgetMultiplier: 1.3, cpcChange: 15, leadTimeDays: 7, tips: ["Great time for 'new year, new you' style campaigns — fitness, health, and self-improvement products fly off the shelves", "People are in resolution mode, so lean into fresh-start messaging", "Jan 2-3 often have lower CPCs than Dec — a good window to snap up bargain clicks"] },
  { name: "Martin Luther King Jr. Day", date: "01-15", region: "US", adImpact: "medium", category: "awareness", budgetMultiplier: 1.1, cpcChange: 5, leadTimeDays: 3, tips: ["Lots of retailers run sales around this long weekend", "Community and purpose-driven messaging tends to land well"] },
  { name: "Australia Day", date: "01-26", region: "AU", adImpact: "high", category: "shopping", budgetMultiplier: 1.3, cpcChange: 15, leadTimeDays: 7, tips: ["Huge long weekend in Australia — outdoor gear, BBQs, and party supplies do well", "Summer is in full swing down under, so think hot-weather products"] },
  { name: "Super Bowl Sunday", date: "02-09", region: "US", adImpact: "critical", category: "sports", budgetMultiplier: 2.0, cpcChange: 50, leadTimeDays: 14, tips: ["The snack and party supply ads absolutely explode around this time", "Electronics, TVs, and streaming subscriptions also see a big bump", "Even if you're not in food/sports, piggybacking on Super Bowl buzz can work"] },
  { name: "Valentine's Day", date: "02-14", region: "GLOBAL", adImpact: "critical", category: "gifts", budgetMultiplier: 1.8, cpcChange: 35, leadTimeDays: 14, tips: ["Jewellery, flowers, and chocolate searches go through the roof", "Last-minute urgency messaging genuinely works — people procrastinate on this one", "Gift guides tend to get really strong click-through rates", "Don't forget the 'Galentine's' angle — it's grown massively"] },
  { name: "Presidents' Day", date: "02-17", region: "US", adImpact: "medium", category: "shopping", budgetMultiplier: 1.2, cpcChange: 10, leadTimeDays: 5, tips: ["One of the big mattress and furniture sale weekends in the US", "Car dealerships push hard too — expect auto industry CPCs to climb"] },
  { name: "International Women's Day", date: "03-08", region: "GLOBAL", adImpact: "medium", category: "awareness", budgetMultiplier: 1.2, cpcChange: 10, leadTimeDays: 5, tips: ["Self-care and wellness products see a nice lift", "Campaigns celebrating women founders or female-led brands tend to resonate", "Keep it genuine — people can spot performative messaging a mile off"] },
  { name: "St. Patrick's Day", date: "03-17", region: "GLOBAL", adImpact: "medium", category: "food", budgetMultiplier: 1.2, cpcChange: 10, leadTimeDays: 5, tips: ["Green-themed anything gets attention, especially in food and drink", "Bar and restaurant ads see a spike", "Works well in the US, UK, and Ireland especially"] },
  { name: "UK Mother's Day", date: "03-30", region: "UK", adImpact: "critical", category: "gifts", budgetMultiplier: 1.8, cpcChange: 35, leadTimeDays: 14, tips: ["This is earlier than the US one — catches a lot of UK advertisers off guard", "Flowers, hampers, jewellery, and experience gifts all spike", "Urgency works brilliantly here — 'don't leave it too late' style messaging"] },

  // ─── Q2: April – June ──────────────────────────────────────
  { name: "Easter", date: "04-20", region: "GLOBAL", adImpact: "high", category: "gifts", budgetMultiplier: 1.5, cpcChange: 25, leadTimeDays: 14, tips: ["Chocolate and confectionery ads go wild", "Spring fashion launches tend to cluster around Easter too", "Family travel bookings get a bump — it's school holidays in most places"] },
  { name: "Anzac Day", date: "04-25", region: "AU", adImpact: "medium", category: "awareness", budgetMultiplier: 1.1, cpcChange: 5, leadTimeDays: 3, tips: ["Public holiday in Australia and New Zealand", "Keep ad messaging respectful — it's a commemorative day", "Retail tends to be quieter, but online browsing stays steady"] },
  { name: "King's Day (Koningsdag)", date: "04-27", region: "NL", adImpact: "medium", category: "cultural", budgetMultiplier: 1.2, cpcChange: 10, leadTimeDays: 5, tips: ["Everything turns orange in the Netherlands — great for themed promotions", "Huge outdoor festival vibe, so party and outdoor products do well"] },
  { name: "May Bank Holiday", date: "05-05", region: "UK", adImpact: "medium", category: "shopping", budgetMultiplier: 1.2, cpcChange: 10, leadTimeDays: 5, tips: ["Long weekend in the UK — DIY, gardening, and home improvement searches rise", "Good time for travel and experience ads too"] },
  { name: "Mother's Day (US/Global)", date: "05-11", region: "GLOBAL", adImpact: "critical", category: "gifts", budgetMultiplier: 1.8, cpcChange: 40, leadTimeDays: 14, tips: ["The single biggest day for flower delivery searches", "Jewellery, spa days, personalised gifts — all see huge demand", "The 'don't forget mum' angle has been done to death but it still works every single year", "Start your ads early — the competition heats up fast in the last week"] },
  { name: "Memorial Day", date: "05-26", region: "US", adImpact: "high", category: "shopping", budgetMultiplier: 1.4, cpcChange: 20, leadTimeDays: 7, tips: ["One of the really big sale weekends in the US", "Outdoor, BBQ, and pool products do brilliantly", "Many brands use it as their 'summer kickoff' sale moment"] },
  { name: "Spring Bank Holiday", date: "05-26", region: "UK", adImpact: "medium", category: "shopping", budgetMultiplier: 1.2, cpcChange: 10, leadTimeDays: 5, tips: ["Another UK long weekend — good for travel and outdoor products", "Garden centre and DIY ads tend to perform well"] },
  { name: "Father's Day", date: "06-15", region: "GLOBAL", adImpact: "high", category: "gifts", budgetMultiplier: 1.5, cpcChange: 30, leadTimeDays: 14, tips: ["Tools, tech, and sports gear are the classic winners", "Experience gifts have been growing year on year", "Grilling and outdoor equipment do really well", "'For the dad who's impossible to buy for' is a surprisingly effective hook"] },
  { name: "Pride Month", date: "06-01", dateEnd: "06-30", region: "GLOBAL", adImpact: "medium", category: "awareness", budgetMultiplier: 1.1, cpcChange: 5, leadTimeDays: 14, tips: ["Inclusive messaging genuinely resonates — but only if it's authentic", "Rainbow-themed products can work, but avoid looking like you're cashing in", "If your brand has a genuine connection to the community, lean into it"] },
  { name: "EOFY (End of Financial Year)", date: "06-30", region: "AU", adImpact: "high", category: "shopping", budgetMultiplier: 1.5, cpcChange: 25, leadTimeDays: 14, tips: ["Massive sale period in Australia — everyone's clearing stock", "Business purchases spike as companies use up remaining budgets", "Great time for B2B ads targeting Australian businesses"] },

  // ─── Q3: July – September ──────────────────────────────────
  { name: "Independence Day (US)", date: "07-04", region: "US", adImpact: "high", category: "shopping", budgetMultiplier: 1.4, cpcChange: 20, leadTimeDays: 7, tips: ["Outdoor, BBQ, and fireworks products surge", "Travel deals see strong engagement", "Big auto sales events happen around this time too"] },
  { name: "Amazon Prime Day", date: "07-15", dateEnd: "07-16", region: "GLOBAL", adImpact: "critical", category: "shopping", budgetMultiplier: 2.0, cpcChange: 45, leadTimeDays: 14, tips: ["Even if you don't sell on Amazon, CPCs spike across all e-commerce during Prime Day", "Running your own counter-sale can be really effective", "Shopify stores should prepare their own deals to capture the shopping frenzy", "Price-match messaging tends to convert well around this time"] },
  { name: "Bastille Day", date: "07-14", region: "FR", adImpact: "medium", category: "cultural", budgetMultiplier: 1.2, cpcChange: 10, leadTimeDays: 5, tips: ["Public holiday in France — B2B traffic drops but consumer browsing stays steady", "Good time for travel and tourism ads targeting French audiences"] },
  { name: "Back to School", date: "08-01", dateEnd: "09-01", region: "US", adImpact: "critical", category: "shopping", budgetMultiplier: 1.6, cpcChange: 30, leadTimeDays: 21, tips: ["This is the second-biggest retail season after Christmas — don't sleep on it", "Electronics, stationery, clothing, and dorm supplies all see massive demand", "College move-in products peak mid-August", "Parent targeting works incredibly well here"] },
  { name: "August Bank Holiday", date: "08-25", region: "UK", adImpact: "medium", category: "shopping", budgetMultiplier: 1.2, cpcChange: 10, leadTimeDays: 5, tips: ["Last summer long weekend in the UK — travel and outdoor ads perform well", "End-of-summer sales tend to kick off around here"] },
  { name: "Labor Day", date: "09-01", region: "US", adImpact: "high", category: "shopping", budgetMultiplier: 1.3, cpcChange: 15, leadTimeDays: 7, tips: ["End-of-summer clearance sales are everywhere", "Mattress and furniture brands go heavy on promotions", "Fall fashion starts to trend — a good time to launch autumn collections"] },

  // ─── Q4: October – December (The Money Quarter) ────────────
  { name: "German Unity Day", date: "10-03", region: "DE", adImpact: "low", category: "cultural", budgetMultiplier: 1.0, cpcChange: 0, leadTimeDays: 3, tips: ["Bank holiday in Germany — B2B traffic drops, so adjust your bids accordingly"] },
  { name: "Halloween", date: "10-31", region: "GLOBAL", adImpact: "high", category: "shopping", budgetMultiplier: 1.4, cpcChange: 20, leadTimeDays: 21, tips: ["Costumes, sweets, and decorations are the obvious winners", "Pet costumes have become genuinely huge — don't overlook that niche", "Party supplies and horror-themed entertainment see strong demand", "It's also the unofficial start of the holiday shopping mindset"] },
  { name: "Thanksgiving", date: "11-27", region: "US", adImpact: "high", category: "food", budgetMultiplier: 1.4, cpcChange: 20, leadTimeDays: 7, tips: ["Food and grocery ads see a big spike", "Travel bookings also climb as families get together", "Gratitude-themed messaging tends to feel genuine and perform well"] },
  { name: "Black Friday", date: "11-28", region: "GLOBAL", adImpact: "critical", category: "shopping", budgetMultiplier: 2.5, cpcChange: 60, leadTimeDays: 21, tips: ["This is where CPCs hit their absolute peak for the year — budget accordingly", "Start your ads before the day itself — the early birds get much cheaper clicks", "Countdown timers and scarcity messaging genuinely boost conversions", "Mobile traffic absolutely dominates on the day", "Your retargeting audiences from the previous weeks are worth their weight in gold"] },
  { name: "Small Business Saturday", date: "11-29", region: "US", adImpact: "high", category: "shopping", budgetMultiplier: 1.5, cpcChange: 25, leadTimeDays: 7, tips: ["'Shop local' messaging resonates strongly", "Highlighting your story as a small business owner works really well", "Community-focused ads tend to outperform generic sale messaging"] },
  { name: "Cyber Monday", date: "12-01", region: "GLOBAL", adImpact: "critical", category: "shopping", budgetMultiplier: 2.2, cpcChange: 55, leadTimeDays: 21, tips: ["Pure e-commerce day — if you sell online, this is your moment", "Free shipping isn't a nice-to-have, it's expected", "Flash deals and limited-time offers create genuine urgency", "Your email retargeting and display campaigns should be firing on all cylinders"] },
  { name: "Green Monday", date: "12-08", region: "US", adImpact: "high", category: "shopping", budgetMultiplier: 1.5, cpcChange: 25, leadTimeDays: 5, tips: ["This is when the panic buying really kicks in", "'Guaranteed delivery by Christmas' is the messaging that converts", "Gift cards start to become a major category"] },
  { name: "Lucia / Saint Lucy's Day", date: "12-13", region: "SE", adImpact: "medium", category: "cultural", budgetMultiplier: 1.1, cpcChange: 5, leadTimeDays: 5, tips: ["A beloved Swedish and Nordic tradition — candles and light products do well", "Good time for cosy, atmospheric product marketing in Nordic markets"] },
  { name: "Free Shipping Day", date: "12-14", region: "US", adImpact: "high", category: "shopping", budgetMultiplier: 1.4, cpcChange: 20, leadTimeDays: 3, tips: ["If you aren't offering free shipping around this time, you're leaving money on the table", "Last real push before shipping cutoff dates", "Express shipping upsells can boost average order values nicely"] },
  { name: "Hanukkah", date: "12-14", dateEnd: "12-22", region: "GLOBAL", adImpact: "medium", category: "gifts", budgetMultiplier: 1.3, cpcChange: 15, leadTimeDays: 7, tips: ["Eight-day gift-giving window — that's eight chances to convert", "Make sure your ad copy isn't exclusively Christmas-focused", "Inclusive holiday messaging shows you've thought about all your customers"] },
  { name: "Christmas", date: "12-25", region: "GLOBAL", adImpact: "critical", category: "gifts", budgetMultiplier: 2.0, cpcChange: 45, leadTimeDays: 30, tips: ["The single biggest gifting period of the year — plan your budget well in advance", "If you haven't started your campaign by early November, you're already behind", "Last-minute gift guides get incredible engagement from Dec 15 onwards", "Gift card ads peak Dec 20-24 for the true last-minute shoppers", "Don't switch everything off on Dec 26 — post-Christmas clearance is a goldmine"] },
  { name: "Boxing Day", date: "12-26", region: "UK", adImpact: "high", category: "shopping", budgetMultiplier: 1.5, cpcChange: 25, leadTimeDays: 3, tips: ["Massive clearance sales in the UK, Australia, and Canada", "Online shopping on Boxing Day has overtaken in-store in recent years", "People are already spending their Christmas money and gift cards"] },
  { name: "New Year's Eve", date: "12-31", region: "GLOBAL", adImpact: "medium", category: "food", budgetMultiplier: 1.2, cpcChange: 10, leadTimeDays: 5, tips: ["Party supplies, drinks, and event tickets see a bump", "Use this quiet period to get your January campaigns ready to go", "Resolution-themed product ads can start gaining traction from Dec 28 onwards"] },

  // ─── Nordic Holidays ───────────────────────────────────────
  { name: "Midsummer (Midsommar)", date: "06-21", region: "SE", adImpact: "high", category: "food", budgetMultiplier: 1.3, cpcChange: 15, leadTimeDays: 10, tips: ["One of the biggest celebrations in the Nordics — outdoor products and food do really well", "Flowers, garden items, and anything outdoors-related sees a spike", "B2B traffic tends to drop around Midsommar as everyone takes time off"] },

  // ─── Additional European ───────────────────────────────────
  { name: "Epiphany / Three Kings", date: "01-06", region: "ES", adImpact: "high", category: "gifts", budgetMultiplier: 1.5, cpcChange: 20, leadTimeDays: 10, tips: ["In Spain this is actually a bigger gift-giving day than Christmas itself", "If you're targeting Spanish audiences, this is one not to miss"] },
];

/* ══════════════════════════════════════════════════════════════════════════
   SEASONAL INTELLIGENCE
   ══════════════════════════════════════════════════════════════════════════ */

const INDUSTRY_SEASONALITY: Record<string, Record<string, { demand: "high" | "medium" | "low"; tip: string }>> = {
  spring: {
    "real-estate": { demand: "high", tip: "This is when house-hunting really kicks off — it's worth bumping your budgets 30-50%" },
    "landscaping": { demand: "high", tip: "Everyone's looking at their garden after winter — this is your busiest time" },
    "fitness": { demand: "high", tip: "People are shaking off the winter cobwebs and getting outdoors — ride that wave" },
    "wedding": { demand: "high", tip: "Wedding season is ramping up fast — engagement and venue ads are essential right now" },
    "hvac": { demand: "medium", tip: "AC tune-up season is getting going — preventive maintenance messaging works well" },
    "cleaning": { demand: "high", tip: "Spring cleaning is your golden moment — go as hard as your budget allows" },
    "solar": { demand: "high", tip: "Longer days mean more people thinking about solar — installation interest spikes" },
    "automotive": { demand: "medium", tip: "Post-winter service demand picks up — tyre changes, scratch repairs, the usual" },
    "ecommerce": { demand: "medium", tip: "Easter shopping plus spring fashion launches keep things ticking over nicely" },
    "travel": { demand: "high", tip: "This is when everyone books their summer holidays — get your ads in front of them early" },
  },
  summer: {
    "travel": { demand: "high", tip: "Peak travel season — bid confidently on destination keywords, the intent is there" },
    "hvac": { demand: "high", tip: "When the AC breaks in a heatwave, people will pay anything — emergency keywords are gold" },
    "pest-control": { demand: "high", tip: "Bug season at its worst — your budget should be at its highest" },
    "landscaping": { demand: "high", tip: "Maintenance contracts and outdoor living projects keep demand really strong" },
    "pool": { demand: "high", tip: "Pool service demand is at its peak — this is your time to shine" },
    "restaurant": { demand: "high", tip: "Outdoor dining, tourism, and delivery services all push demand up" },
    "moving": { demand: "high", tip: "June and July are peak moving months — families want to relocate before school starts" },
    "real-estate": { demand: "high", tip: "Everyone wants to move before the school year starts — showings are at their busiest" },
    "ecommerce": { demand: "medium", tip: "Back to school shopping starts earlier than you'd think — July is when it ramps" },
    "automotive": { demand: "medium", tip: "Road trip prep drives tyre, AC, and service bookings" },
  },
  fall: {
    "ecommerce": { demand: "high", tip: "Q4 planning is critical — if you're not prepping for Black Friday and Christmas now, you're already late" },
    "automotive": { demand: "high", tip: "New model year launches and winter-prep services drive strong demand" },
    "hvac": { demand: "high", tip: "Heating system tune-ups are on everyone's mind before winter hits" },
    "plumber": { demand: "medium", tip: "Pre-winter pipe checks and water heater servicing pick up" },
    "education": { demand: "high", tip: "Back to school, enrolment drives, and tutoring demand are all strong" },
    "roofing": { demand: "high", tip: "Nobody wants to discover a roof leak in January — pre-winter repairs are big business" },
    "insurance": { demand: "high", tip: "Open enrolment season means health insurance searches spike" },
    "fashion": { demand: "high", tip: "Autumn collections launch and early holiday shopping begins" },
    "fitness": { demand: "medium", tip: "Slight post-summer dip, but New Year prep marketing starts working surprisingly early" },
    "restaurant": { demand: "medium", tip: "Holiday catering enquiries start coming in — get ahead of the competition" },
  },
  winter: {
    "ecommerce": { demand: "high", tip: "The holiday shopping frenzy peaks Nov-Dec — this is where the year's profits are made" },
    "heating": { demand: "high", tip: "Emergency heating repairs have the highest CPC tolerance of almost any service — people will pay" },
    "plumber": { demand: "high", tip: "Frozen pipes and water heater failures create urgent demand — emergency keywords convert like crazy" },
    "fitness": { demand: "high", tip: "New Year's resolution surge — gym membership ads peak in the first two weeks of January" },
    "tax-prep": { demand: "high", tip: "Tax season is approaching — CPA and accounting firms should be ramping up now" },
    "travel": { demand: "medium", tip: "Ski holidays, winter sun getaways, and early spring break planning all generate demand" },
    "automotive": { demand: "medium", tip: "Winter tyres, battery replacements, and cold-weather servicing drive steady business" },
    "restaurant": { demand: "high", tip: "Holiday parties, catering orders, and New Year's Eve events keep things buzzing" },
    "jewelry": { demand: "high", tip: "Christmas gifting plus Valentine's Day prep make this your strongest quarter" },
    "fashion": { demand: "high", tip: "Winter clothing, party outfits, and gift purchases all drive demand" },
  },
};

/* ══════════════════════════════════════════════════════════════════════════
   DEVICE INTELLIGENCE
   ══════════════════════════════════════════════════════════════════════════ */

interface HourlyDevicePattern {
  hour: number;
  peakDevice: "mobile" | "desktop" | "tablet";
  mobileBidAdj: number;
  desktopBidAdj: number;
  tabletBidAdj: number;
}

const DEVICE_PATTERNS: HourlyDevicePattern[] = [
  // Early morning: mobile dominates (in bed, commuting)
  { hour: 5, peakDevice: "mobile", mobileBidAdj: 20, desktopBidAdj: -30, tabletBidAdj: -20 },
  { hour: 6, peakDevice: "mobile", mobileBidAdj: 25, desktopBidAdj: -25, tabletBidAdj: -15 },
  { hour: 7, peakDevice: "mobile", mobileBidAdj: 20, desktopBidAdj: -15, tabletBidAdj: -10 },
  { hour: 8, peakDevice: "mobile", mobileBidAdj: 15, desktopBidAdj: -5, tabletBidAdj: -10 },
  // Working hours: desktop rises (office, work)
  { hour: 9, peakDevice: "desktop", mobileBidAdj: -5, desktopBidAdj: 20, tabletBidAdj: -10 },
  { hour: 10, peakDevice: "desktop", mobileBidAdj: -10, desktopBidAdj: 25, tabletBidAdj: -5 },
  { hour: 11, peakDevice: "desktop", mobileBidAdj: -10, desktopBidAdj: 25, tabletBidAdj: -5 },
  { hour: 12, peakDevice: "mobile", mobileBidAdj: 10, desktopBidAdj: 10, tabletBidAdj: 0 }, // lunch break
  { hour: 13, peakDevice: "desktop", mobileBidAdj: -5, desktopBidAdj: 20, tabletBidAdj: -5 },
  { hour: 14, peakDevice: "desktop", mobileBidAdj: -10, desktopBidAdj: 25, tabletBidAdj: -5 },
  { hour: 15, peakDevice: "desktop", mobileBidAdj: -10, desktopBidAdj: 20, tabletBidAdj: -5 },
  { hour: 16, peakDevice: "desktop", mobileBidAdj: -5, desktopBidAdj: 15, tabletBidAdj: 0 },
  // Evening: mobile + tablet (home, couch browsing)
  { hour: 17, peakDevice: "mobile", mobileBidAdj: 10, desktopBidAdj: -5, tabletBidAdj: 5 },
  { hour: 18, peakDevice: "mobile", mobileBidAdj: 15, desktopBidAdj: -10, tabletBidAdj: 10 },
  { hour: 19, peakDevice: "mobile", mobileBidAdj: 20, desktopBidAdj: -15, tabletBidAdj: 15 },
  { hour: 20, peakDevice: "tablet", mobileBidAdj: 15, desktopBidAdj: -20, tabletBidAdj: 20 },
  { hour: 21, peakDevice: "tablet", mobileBidAdj: 10, desktopBidAdj: -25, tabletBidAdj: 25 },
  { hour: 22, peakDevice: "mobile", mobileBidAdj: 15, desktopBidAdj: -30, tabletBidAdj: 15 },
  { hour: 23, peakDevice: "mobile", mobileBidAdj: 10, desktopBidAdj: -35, tabletBidAdj: 5 },
  { hour: 0, peakDevice: "mobile", mobileBidAdj: 5, desktopBidAdj: -40, tabletBidAdj: 0 },
];

/* ══════════════════════════════════════════════════════════════════════════
   GEO INTELLIGENCE — Peak hours & local context per region
   ══════════════════════════════════════════════════════════════════════════ */

interface RegionProfile {
  timezone: string;
  currency: string;
  language: string;
  peakAdHours: number[];
  shoppingCulture: string;
  paymentPreferences: string[];
  mobileShare: number; // percentage of traffic from mobile
}

const REGION_PROFILES: Record<string, RegionProfile> = {
  US: { timezone: "America/New_York", currency: "USD", language: "en", peakAdHours: [9, 10, 11, 12, 13, 14, 19, 20, 21], shoppingCulture: "Convenience-driven, free shipping expected, returns-friendly", paymentPreferences: ["Credit card", "PayPal", "Apple Pay", "Buy Now Pay Later"], mobileShare: 65 },
  UK: { timezone: "Europe/London", currency: "GBP", language: "en", peakAdHours: [9, 10, 11, 12, 13, 19, 20, 21], shoppingCulture: "Price-conscious, loyalty programs important, next-day delivery expected", paymentPreferences: ["Debit card", "PayPal", "Apple Pay", "Klarna"], mobileShare: 62 },
  DE: { timezone: "Europe/Berlin", currency: "EUR", language: "de", peakAdHours: [9, 10, 11, 12, 13, 14, 19, 20], shoppingCulture: "Quality-focused, detailed product descriptions, invoice payment popular", paymentPreferences: ["PayPal", "Bank transfer", "Klarna", "Credit card"], mobileShare: 55 },
  FR: { timezone: "Europe/Paris", currency: "EUR", language: "fr", peakAdHours: [10, 11, 12, 14, 15, 20, 21], shoppingCulture: "Brand-conscious, fashion-focused, lunch break shopping", paymentPreferences: ["Credit card (Carte Bancaire)", "PayPal", "Apple Pay"], mobileShare: 60 },
  ES: { timezone: "Europe/Madrid", currency: "EUR", language: "es", peakAdHours: [10, 11, 12, 13, 17, 18, 21, 22], shoppingCulture: "Later shopping hours, social proof important, marketplace preference", paymentPreferences: ["Credit card", "PayPal", "Bizum"], mobileShare: 68 },
  IT: { timezone: "Europe/Rome", currency: "EUR", language: "it", peakAdHours: [10, 11, 12, 15, 16, 20, 21], shoppingCulture: "Fashion & design focused, COD still popular, brand loyalty strong", paymentPreferences: ["Credit card", "PayPal", "PostePay", "COD"], mobileShare: 63 },
  NL: { timezone: "Europe/Amsterdam", currency: "EUR", language: "nl", peakAdHours: [9, 10, 11, 12, 13, 19, 20], shoppingCulture: "iDEAL payment dominant, cycling culture affects delivery, direct & pragmatic", paymentPreferences: ["iDEAL", "Credit card", "PayPal", "Klarna"], mobileShare: 58 },
  SE: { timezone: "Europe/Stockholm", currency: "SEK", language: "sv", peakAdHours: [9, 10, 11, 12, 19, 20], shoppingCulture: "Tech-savvy, sustainability matters, Klarna originated here", paymentPreferences: ["Klarna", "Swish", "Credit card", "PayPal"], mobileShare: 60 },
  NO: { timezone: "Europe/Oslo", currency: "NOK", language: "no", peakAdHours: [9, 10, 11, 12, 19, 20], shoppingCulture: "High purchasing power, quality over price, Vipps mobile payment", paymentPreferences: ["Vipps", "Credit card", "Klarna", "PayPal"], mobileShare: 62 },
  DK: { timezone: "Europe/Copenhagen", currency: "DKK", language: "da", peakAdHours: [9, 10, 11, 12, 19, 20], shoppingCulture: "Design-focused, MobilePay dominant, trust important", paymentPreferences: ["MobilePay", "Credit card", "Klarna", "PayPal"], mobileShare: 61 },
  FI: { timezone: "Europe/Helsinki", currency: "EUR", language: "fi", peakAdHours: [9, 10, 11, 12, 19, 20], shoppingCulture: "Tech-savvy, privacy-conscious, bank payment popular", paymentPreferences: ["Bank payment", "Credit card", "MobilePay", "Klarna"], mobileShare: 58 },
  PL: { timezone: "Europe/Warsaw", currency: "PLN", language: "pl", peakAdHours: [9, 10, 11, 12, 13, 19, 20], shoppingCulture: "Price-sensitive, COD still common, Allegro marketplace dominant", paymentPreferences: ["BLIK", "Bank transfer", "COD", "PayPal"], mobileShare: 64 },
  AU: { timezone: "Australia/Sydney", currency: "AUD", language: "en", peakAdHours: [9, 10, 11, 12, 19, 20, 21], shoppingCulture: "Afterpay popular, free shipping expected, seasonal inversion", paymentPreferences: ["Credit card", "Afterpay", "PayPal", "Apple Pay"], mobileShare: 63 },
  CA: { timezone: "America/Toronto", currency: "CAD", language: "en", peakAdHours: [9, 10, 11, 12, 13, 19, 20, 21], shoppingCulture: "Similar to US, bilingual (EN/FR), cross-border shopping common", paymentPreferences: ["Credit card", "Interac", "PayPal", "Apple Pay"], mobileShare: 62 },
  BR: { timezone: "America/Sao_Paulo", currency: "BRL", language: "pt", peakAdHours: [10, 11, 12, 14, 15, 20, 21, 22], shoppingCulture: "Installment payments critical (parcelamento), Pix payment dominant, marketplace-focused", paymentPreferences: ["Pix", "Boleto", "Credit card (installments)", "PayPal"], mobileShare: 72 },
  JP: { timezone: "Asia/Tokyo", currency: "JPY", language: "ja", peakAdHours: [9, 10, 11, 12, 20, 21, 22], shoppingCulture: "Extremely high standards, detailed product info, gift wrapping important", paymentPreferences: ["Credit card", "Convenience store payment", "PayPay", "Line Pay"], mobileShare: 67 },
  IN: { timezone: "Asia/Kolkata", currency: "INR", language: "en", peakAdHours: [10, 11, 12, 14, 15, 20, 21, 22], shoppingCulture: "Mobile-first, price comparison intense, COD still huge, festival-driven", paymentPreferences: ["UPI", "COD", "Credit card", "Paytm", "PhonePe"], mobileShare: 78 },
  MX: { timezone: "America/Mexico_City", currency: "MXN", language: "es", peakAdHours: [10, 11, 12, 14, 15, 20, 21], shoppingCulture: "Growing e-commerce, OXXO cash payments, trust building important", paymentPreferences: ["Credit card (MSI)", "OXXO", "PayPal", "Mercado Pago"], mobileShare: 70 },
};

/* ══════════════════════════════════════════════════════════════════════════
   CLIMATE / WEATHER-TRIGGERED PRODUCT CATEGORIES
   ══════════════════════════════════════════════════════════════════════════ */

const CLIMATE_PRODUCT_MAP: Record<string, string[]> = {
  "hot-summer": ["air conditioning", "fans", "ice cream", "sunscreen", "swimwear", "pool supplies", "cold beverages", "outdoor furniture", "BBQ grills", "shade structures"],
  "cold-winter": ["heaters", "warm clothing", "snow equipment", "hot beverages", "fitness (indoor)", "home entertainment", "blankets", "boots", "soup/comfort food", "humidifiers"],
  "rainy": ["umbrellas", "raincoats", "waterproof gear", "indoor activities", "dehumidifiers", "home improvement", "streaming services", "board games", "cozy home items"],
  "spring-mild": ["gardening supplies", "allergy medicine", "cleaning supplies", "outdoor sports", "spring fashion", "home renovation", "bicycles", "hiking gear"],
  "fall-cool": ["warm beverages", "fall fashion", "home heating", "holiday prep", "comfort food", "candles", "blankets", "boots", "back-to-school"],
};

/* ══════════════════════════════════════════════════════════════════════════
   PLATFORM-SPECIFIC SETUP REQUIREMENTS
   (What customers need for each ad platform)
   ══════════════════════════════════════════════════════════════════════════ */

export interface PlatformRequirement {
  platform: string;
  displayName: string;
  icon: string;
  setupTime: string;
  difficulty: "easy" | "medium" | "advanced";
  prerequisites: string[];
  credentials: { name: string; description: string; howToGet: string }[];
  steps: { title: string; description: string; link?: string }[];
  features: string[];
  tips: string[];
}

export const PLATFORM_REQUIREMENTS: PlatformRequirement[] = [
  {
    platform: "google_ads",
    displayName: "Google Ads",
    icon: "🔍",
    setupTime: "~2 minutes",
    difficulty: "easy",
    prerequisites: [
      "A Google account (Gmail)",
      "An active Google Ads account (even if no campaigns are running)",
    ],
    credentials: [
      { name: "Google Account", description: "Your Gmail or Google Workspace email", howToGet: "Sign in with Google — we handle the OAuth connection automatically" },
    ],
    steps: [
      { title: "Click \"Connect Google Ads\"", description: "We'll redirect you to Google's secure sign-in page" },
      { title: "Choose your Google account", description: "Select the Gmail account linked to your Google Ads" },
      { title: "Grant read access", description: "AdMaster Pro only requests READ access to your campaigns — we can never change or spend your budget without your explicit approval" },
      { title: "Select your Ads account", description: "If you have multiple accounts, pick the one you want us to optimize" },
    ],
    features: [
      "Campaign performance analytics",
      "AI-powered keyword optimization",
      "Ad copy generation & testing",
      "Budget optimization with scenario modeling",
      "Search term analysis & negative keyword suggestions",
      "Device & geo performance breakdowns",
      "Competitor auction insights",
    ],
    tips: [
      "Don't have a Google Ads account? Create one free at ads.google.com — you don't need to run ads yet",
      "We recommend connecting your Google Analytics 4 too for full-funnel tracking",
    ],
  },
  {
    platform: "google_analytics",
    displayName: "Google Analytics 4",
    icon: "📊",
    setupTime: "~2 minutes",
    difficulty: "easy",
    prerequisites: [
      "A Google account with GA4 access",
      "GA4 property set up on your website",
      "At least 'Viewer' role on the GA4 property",
    ],
    credentials: [
      { name: "Google Account", description: "Same Google account that has GA4 access", howToGet: "Uses the same Google OAuth — if you connected Google Ads, this may already be linked" },
    ],
    steps: [
      { title: "Click \"Connect Google Analytics\"", description: "We'll use your existing Google connection or redirect you to sign in" },
      { title: "Select your GA4 property", description: "Choose the website property you want to analyze" },
      { title: "Grant read access", description: "We request Analytics read-only access to pull traffic, conversion, and audience data" },
    ],
    features: [
      "Full customer journey tracking (ad click → site visit → purchase)",
      "Traffic attribution across all channels",
      "Audience demographic analysis for ad targeting",
      "Conversion funnel analysis",
      "Landing page performance for ad campaigns",
      "Real-time visitor insights",
    ],
    tips: [
      "No GA4 yet? Install it free: analytics.google.com — takes 5 minutes with a site tag",
      "GA4 data + Google Ads data = complete picture of your ROI",
    ],
  },
  {
    platform: "meta_ads",
    displayName: "Facebook & Instagram Ads",
    icon: "📘",
    setupTime: "~5 minutes",
    difficulty: "medium",
    prerequisites: [
      "A Facebook account",
      "A Facebook Business Manager account (business.facebook.com)",
      "An active Facebook Ad Account inside Business Manager",
      "Admin or Advertiser role on the Ad Account",
    ],
    credentials: [
      { name: "Facebook Account", description: "Your personal Facebook login (used to access Business Manager)", howToGet: "Sign in with Facebook — we handle the OAuth" },
      { name: "Business Manager ID", description: "Your Business Manager numerical ID", howToGet: "Go to business.facebook.com → Business Settings → Business Info → Copy your Business ID" },
      { name: "Ad Account ID", description: "The ad account you want AdMaster Pro to analyze", howToGet: "In Business Manager → Ad Accounts → look for 'act_' followed by numbers" },
      { name: "Facebook Pixel ID (optional)", description: "For tracking conversions on your website", howToGet: "Business Manager → Events Manager → Data Sources → your Pixel → Settings → copy Pixel ID" },
    ],
    steps: [
      { title: "Create a Business Manager", description: "Go to business.facebook.com and click \"Create Account\". Enter your business name, your name, and business email.", link: "https://business.facebook.com" },
      { title: "Add your Ad Account", description: "In Business Manager, go to Business Settings → Accounts → Ad Accounts → Add → Create New or Claim Existing" },
      { title: "Click \"Connect Facebook\" in AdMaster Pro", description: "We'll redirect you to Facebook's secure OAuth page" },
      { title: "Grant permissions", description: "Allow AdMaster Pro to read your ad campaigns, performance data, and audience insights" },
      { title: "Select your Ad Account", description: "Pick the ad account you want analyzed — you can add more later" },
    ],
    features: [
      "Facebook + Instagram ad performance in one view",
      "AI audience targeting recommendations",
      "Creative performance analysis (which images/videos work best)",
      "Cross-platform comparison (Facebook vs Google Ads ROI)",
      "Lookalike audience suggestions",
      "Ad fatigue detection",
      "Budget allocation between Facebook and Google",
    ],
    tips: [
      "Install the Facebook Pixel on your site for conversion tracking — this unlocks the most powerful AI insights",
      "If you advertise on Instagram too, both are managed through the same Meta Business Manager",
      "We never post to your Facebook page or modify your ads without your explicit approval",
    ],
  },
  {
    platform: "amazon_ads",
    displayName: "Amazon Advertising",
    icon: "📦",
    setupTime: "~5 minutes",
    difficulty: "medium",
    prerequisites: [
      "An Amazon Seller Central OR Vendor Central account",
      "Products listed on Amazon (at least 1)",
      "Amazon Advertising console access",
      "Business registered in a supported marketplace (US, UK, DE, FR, IT, ES, JP, CA, AU, IN, MX, BR)",
    ],
    credentials: [
      { name: "Amazon Account", description: "Your Seller Central or Vendor Central login", howToGet: "Sign in with your Amazon seller credentials — we use Login with Amazon OAuth" },
      { name: "Advertising Profile", description: "Your Amazon Advertising profile for the marketplace you sell in", howToGet: "Go to advertising.amazon.com → sign in → your profiles are listed by marketplace" },
      { name: "Marketplace Selection", description: "Which Amazon marketplace(s) you sell on", howToGet: "Choose from: US (.com), UK (.co.uk), DE (.de), etc." },
    ],
    steps: [
      { title: "Set up Amazon Seller Central", description: "If you don't have one, register at sellercentral.amazon.com. Choose Individual (free) or Professional ($39.99/mo) plan.", link: "https://sellercentral.amazon.com" },
      { title: "Create your first product listing", description: "You need at least one active product listing before you can advertise. Go to Inventory → Add a Product in Seller Central." },
      { title: "Access Amazon Advertising", description: "Go to advertising.amazon.com and sign in with your Seller Central credentials. Accept the advertising terms.", link: "https://advertising.amazon.com" },
      { title: "Click \"Connect Amazon\" in AdMaster Pro", description: "We'll redirect you to Amazon's Login with Amazon page" },
      { title: "Authorize AdMaster Pro", description: "Grant read access to your advertising campaigns and product performance data" },
      { title: "Select your marketplace", description: "Choose which Amazon marketplace(s) — US, UK, DE, etc. — you want analyzed" },
    ],
    features: [
      "Sponsored Products campaign optimization",
      "Sponsored Brands & Display analytics",
      "ACOS (Advertising Cost of Sales) tracking & optimization",
      "Product-level ad performance analysis",
      "Search term mining — find profitable keywords automatically",
      "AI-powered listing optimization (titles, bullets, descriptions)",
      "Bid optimization per keyword/ASIN",
      "Cross-platform profit analysis (Amazon vs your own store)",
      "Holiday prep automation (Prime Day, Black Friday, Christmas)",
      "Competitor ASIN tracking",
    ],
    tips: [
      "Start with Sponsored Products — they have the best ROI for new advertisers",
      "We'll automatically detect your best-selling products and focus ad spend there",
      "Amazon ACOS under 25% is generally profitable — our AI targets this automatically",
      "Connect Shopify too if you sell on both — we'll help you optimize inventory allocation",
    ],
  },
  {
    platform: "shopify",
    displayName: "Shopify",
    icon: "🛒",
    setupTime: "~3 minutes",
    difficulty: "easy",
    prerequisites: [
      "A Shopify store (any plan)",
      "Owner or Staff account with 'Apps' permission",
    ],
    credentials: [
      { name: "Shopify Store URL", description: "Your myshopify.com domain", howToGet: "Found in your Shopify admin URL: your-store.myshopify.com" },
    ],
    steps: [
      { title: "Click \"Connect Shopify\"", description: "Enter your Shopify store URL (e.g., your-store.myshopify.com)" },
      { title: "Authorize in Shopify admin", description: "You'll be redirected to your Shopify admin to approve the AdMaster Pro app" },
      { title: "Grant permissions", description: "We request read access to: Products, Orders, Analytics, and Customers" },
      { title: "Automatic sync begins", description: "We'll immediately start pulling your product catalog and recent order data" },
    ],
    features: [
      "Real-time revenue tracking vs. ad spend (true ROAS)",
      "Product-level profitability analysis",
      "Inventory-aware ad recommendations (don't advertise out-of-stock items)",
      "Customer lifetime value analysis",
      "Cart abandonment insights for retargeting",
      "Best-selling product ad automation",
      "Seasonal product performance trends",
      "Cross-platform product matching (same SKU on Amazon, Google Shopping, etc.)",
    ],
    tips: [
      "Connecting Shopify gives us the full picture: ad spend → traffic → purchases → profit",
      "We auto-pause ads for products that go out of stock",
      "Customer data helps build better lookalike audiences on Facebook and Google",
    ],
  },
  {
    platform: "google_merchant",
    displayName: "Google Merchant Center",
    icon: "🏪",
    setupTime: "~3 minutes",
    difficulty: "medium",
    prerequisites: [
      "A Google Merchant Center account",
      "Product feed uploaded (or Shopify/WooCommerce auto-sync)",
      "Products approved in Merchant Center",
    ],
    credentials: [
      { name: "Google Account", description: "Same Google account linked to your Merchant Center", howToGet: "Uses Google OAuth — may auto-link if you connected Google Ads" },
    ],
    steps: [
      { title: "Set up Merchant Center", description: "If you don't have one, go to merchants.google.com and create an account. Verify your website.", link: "https://merchants.google.com" },
      { title: "Upload your product feed", description: "Add products via manual upload, spreadsheet, or connect Shopify/WooCommerce for automatic sync" },
      { title: "Link to Google Ads", description: "In Merchant Center → Settings → Linked Accounts → link your Google Ads account" },
      { title: "Click \"Connect Merchant Center\" in AdMaster Pro", description: "We'll detect your Merchant Center via your Google account" },
    ],
    features: [
      "Google Shopping ad performance analysis",
      "Product disapproval diagnosis & auto-fix suggestions",
      "Feed optimization (titles, descriptions, categories)",
      "Price competitiveness analysis",
      "Free listing performance tracking",
      "Shopping campaign structure recommendations",
    ],
    tips: [
      "Shopify stores can auto-sync products to Merchant Center via the Google & YouTube Shopify app",
      "Optimized product titles can improve Shopping ad CTR by 20-40%",
    ],
  },
  {
    platform: "tiktok_ads",
    displayName: "TikTok Ads",
    icon: "🎵",
    setupTime: "~5 minutes",
    difficulty: "medium",
    prerequisites: [
      "A TikTok for Business account",
      "TikTok Ads Manager access",
      "Active ad account with payment method",
    ],
    credentials: [
      { name: "TikTok Business Account", description: "Your TikTok for Business login", howToGet: "Register at ads.tiktok.com if you don't have one" },
    ],
    steps: [
      { title: "Create a TikTok for Business account", description: "Go to ads.tiktok.com and register with your business email", link: "https://ads.tiktok.com" },
      { title: "Set up your Ad Account", description: "Complete business verification and add a payment method" },
      { title: "Install TikTok Pixel (optional)", description: "Add the TikTok Pixel to your website for conversion tracking" },
      { title: "Click \"Connect TikTok\" in AdMaster Pro", description: "Authorize via TikTok's Marketing API OAuth" },
    ],
    features: [
      "Video ad performance analytics",
      "Audience insight analysis (age, interest, behavior)",
      "Creative performance scoring",
      "Cross-platform comparison (TikTok vs Meta vs Google)",
      "Trending hashtag integration for ad targeting",
      "AI video script suggestions",
    ],
    tips: [
      "TikTok works best for ages 18-34 — check if your audience matches",
      "Authentic, native-looking content outperforms polished ads on TikTok",
      "Average CPM on TikTok is often lower than Facebook — good for awareness",
    ],
  },
];

/* ══════════════════════════════════════════════════════════════════════════
   MAIN FUNCTIONS
   ══════════════════════════════════════════════════════════════════════════ */

/**
 * Get holidays within the next N days from a given date
 */
export function getUpcomingHolidays(fromDate: Date = new Date(), daysAhead: number = 60, regions?: string[]): Holiday[] {
  const results: Holiday[] = [];
  const now = fromDate;

  for (const h of HOLIDAYS) {
    const [mm, dd] = h.date.split("-").map(Number);
    const holidayDate = new Date(now.getFullYear(), mm - 1, dd);
    // If holiday already passed this year, check next year
    if (holidayDate < now) {
      holidayDate.setFullYear(holidayDate.getFullYear() + 1);
    }
    const diffDays = Math.ceil((holidayDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= daysAhead && diffDays >= 0) {
      if (!regions || regions.includes(h.region)) {
        results.push(h);
      }
    }
  }

  return results.sort((a, b) => {
    const dateA = new Date(now.getFullYear(), ...a.date.split("-").map((n, i) => (i === 0 ? Number(n) - 1 : Number(n))) as [number, number]);
    const dateB = new Date(now.getFullYear(), ...b.date.split("-").map((n, i) => (i === 0 ? Number(n) - 1 : Number(n))) as [number, number]);
    return dateA.getTime() - dateB.getTime();
  });
}

/**
 * Get any holidays happening right now (today or within range)
 */
export function getActiveHolidays(date: Date = new Date(), regions?: string[]): Holiday[] {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const today = `${mm}-${dd}`;

  return HOLIDAYS.filter(h => {
    if (!regions || regions.includes(h.region)) {
      if (h.dateEnd) {
        return today >= h.date && today <= h.dateEnd;
      }
      // Within lead time window
      const [hm, hd] = h.date.split("-").map(Number);
      const holidayDate = new Date(date.getFullYear(), hm - 1, hd);
      const diffDays = Math.ceil((holidayDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= h.leadTimeDays;
    }
    return false;
  });
}

/**
 * Get seasonal context for a given date and location
 */
export function getSeasonalContext(date: Date = new Date(), countryCode: string = "US"): SeasonalContext {
  const month = date.getMonth() + 1;
  const southernHemisphere = ["AU", "BR", "AR", "CL", "NZ", "ZA"].includes(countryCode);

  let season: "spring" | "summer" | "fall" | "winter";
  if (southernHemisphere) {
    if (month >= 3 && month <= 5) season = "fall";
    else if (month >= 6 && month <= 8) season = "winter";
    else if (month >= 9 && month <= 11) season = "spring";
    else season = "summer";
  } else {
    if (month >= 3 && month <= 5) season = "spring";
    else if (month >= 6 && month <= 8) season = "summer";
    else if (month >= 9 && month <= 11) season = "fall";
    else season = "winter";
  }

  const quarter = Math.ceil(month / 3);
  const isEndOfQuarter = month % 3 === 0 && date.getDate() >= 20;
  const isEndOfYear = month === 12;

  let retailSeason = "Regular";
  if (month >= 11 || month === 12) retailSeason = "Holiday Shopping Season";
  else if (month === 1) retailSeason = "New Year / Resolution Season";
  else if (month === 2) retailSeason = "Valentine's Season";
  else if (month >= 3 && month <= 4) retailSeason = "Spring / Easter Season";
  else if (month === 5) retailSeason = "Mother's Day / Memorial Day Season";
  else if (month === 6) retailSeason = "Summer Kickoff / Father's Day";
  else if (month === 7) retailSeason = "Prime Day / Mid-Summer Sales";
  else if (month >= 8 && month <= 9) retailSeason = "Back to School Season";
  else if (month === 10) retailSeason = "Fall / Halloween / Holiday Prep";

  let demandTrend: "rising" | "peak" | "declining" | "low" = "low";
  if ([11, 12].includes(month)) demandTrend = "peak";
  else if ([9, 10].includes(month)) demandTrend = "rising";
  else if ([1, 2].includes(month)) demandTrend = "declining";
  else if ([5, 6, 7].includes(month)) demandTrend = "rising";
  else demandTrend = "low";

  const industries = INDUSTRY_SEASONALITY[season] || {};

  return {
    season,
    hemisphere: southernHemisphere ? "southern" : "northern",
    month,
    quarterLabel: `Q${quarter}`,
    isEndOfQuarter,
    isEndOfYear,
    retailSeason,
    demandTrend,
    industries,
  };
}

/**
 * Get geo context for a given country code and time
 */
export function getGeoContext(countryCode: string = "US", date: Date = new Date()): GeoContext {
  const profile = REGION_PROFILES[countryCode] || REGION_PROFILES.US;
  
  // Get local hour in the region's timezone
  const formatter = new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: profile.timezone });
  const localHour = parseInt(formatter.format(date), 10);
  
  const isWorkingHours = localHour >= 9 && localHour <= 17;
  const isPeakHour = profile.peakAdHours.includes(localHour);
  const offPeakDiscount = isPeakHour ? 0 : 20; // Save 20% bidding off-peak

  return {
    timezone: profile.timezone,
    currency: profile.currency,
    language: profile.language,
    country: countryCode,
    countryCode,
    region: countryCode === "US" ? "North America" : countryCode === "UK" || ["DE", "FR", "ES", "IT", "NL", "SE", "NO", "DK", "FI", "PL"].includes(countryCode) ? "Europe" : "International",
    isWorkingHours,
    localHour,
    peakAdHours: profile.peakAdHours,
    offPeakDiscount,
    localEvents: [],
  };
}

/**
 * Get device optimization context for current hour
 */
export function getDeviceContext(hour?: number, industry?: string): DeviceContext {
  const h = hour ?? new Date().getHours();
  const pattern = DEVICE_PATTERNS.find(p => p.hour === h) || DEVICE_PATTERNS[0];

  // Industry-specific adjustments
  let tips: string[] = [];
  let adjustments = {
    mobile: pattern.mobileBidAdj,
    desktop: pattern.desktopBidAdj,
    tablet: pattern.tabletBidAdj,
  };

  if (industry) {
    // B2B industries: desktop dominates during work hours
    const b2bIndustries = ["saas", "consulting", "marketing-agency", "insurance", "financial-advisor"];
    if (b2bIndustries.includes(industry)) {
      adjustments.desktop += 15;
      adjustments.mobile -= 10;
      tips.push("For B2B, desktop traffic tends to convert 2-3x better during working hours — worth prioritising");
    }

    // Local services: mobile dominates (people search on-the-go)
    const localServices = ["plumber", "electrician", "hvac", "pest-control", "cleaning", "locksmith", "towing"];
    if (localServices.includes(industry)) {
      adjustments.mobile += 20;
      tips.push("Over 70% of local service searches happen on mobile — click-to-call ads are your best friend");
      tips.push("Location extensions make a real difference for nearby mobile searchers");
    }

    // E-commerce: tablet converts best in evening (couch shopping)
    const ecomIndustries = ["ecommerce", "fashion", "jewelry", "retail"];
    if (ecomIndustries.includes(industry) && h >= 19) {
      adjustments.tablet += 15;
      tips.push("Evening tablet browsing is big for e-commerce — people shop from the sofa after dinner");
    }

    // Restaurants: mobile peak during lunch/dinner
    if (industry === "restaurant" && (h === 11 || h === 12 || h === 17 || h === 18)) {
      adjustments.mobile += 25;
      tips.push("This is prime time for 'restaurants near me' searches — make sure your mobile bids are strong");
    }
  }

  const reasoning = h >= 9 && h <= 16
    ? "During the working day, people are mostly on their desktops — especially for research and B2B purchases"
    : h >= 17 && h <= 22
    ? "In the evenings, people switch to their phones and tablets as they browse from home — it's peak couch-shopping time"
    : "Late night and early morning traffic is mostly mobile. Competition is lighter, so CPCs tend to be lower — good for awareness campaigns";

  return {
    recommendedBidAdjustments: adjustments,
    currentPeakDevice: pattern.peakDevice,
    reasoning,
    tips: [
      ...tips,
      `Right now (${h}:00 local), ${pattern.peakDevice} is the dominant device`,
      `We'd suggest a ${adjustments.mobile > 0 ? "+" : ""}${adjustments.mobile}% mobile bid adjustment`,
      `Desktop bid adjustment: ${adjustments.desktop > 0 ? "+" : ""}${adjustments.desktop}%`,
    ],
  };
}

/**
 * Get climate/weather context
 */
export function getClimateContext(countryCode: string = "US", date: Date = new Date()): ClimateContext {
  const month = date.getMonth() + 1;
  const southernHemisphere = ["AU", "BR", "AR", "CL", "NZ", "ZA"].includes(countryCode);

  let climateSeason: string;
  let climateKey: string;

  if (southernHemisphere) {
    if (month >= 12 || month <= 2) { climateSeason = "Summer (Southern)"; climateKey = "hot-summer"; }
    else if (month >= 3 && month <= 5) { climateSeason = "Fall (Southern)"; climateKey = "fall-cool"; }
    else if (month >= 6 && month <= 8) { climateSeason = "Winter (Southern)"; climateKey = "cold-winter"; }
    else { climateSeason = "Spring (Southern)"; climateKey = "spring-mild"; }
  } else {
    if (month >= 6 && month <= 8) { climateSeason = "Summer"; climateKey = "hot-summer"; }
    else if (month >= 9 && month <= 11) { climateSeason = "Fall"; climateKey = "fall-cool"; }
    else if (month >= 12 || month <= 2) { climateSeason = "Winter"; climateKey = "cold-winter"; }
    else { climateSeason = "Spring"; climateKey = "spring-mild"; }
  }

  // Rainy regions
  const rainyRegions: Record<string, number[]> = {
    UK: [10, 11, 12, 1, 2, 3],
    NL: [10, 11, 12, 1],
    SE: [10, 11],
    NO: [9, 10, 11],
    IN: [6, 7, 8, 9], // Monsoon season
    BR: [12, 1, 2, 3],
    JP: [6, 7], // Rainy season (tsuyu)
  };

  if (rainyRegions[countryCode]?.includes(month)) {
    climateKey = "rainy";
    climateSeason += " (Rainy season)";
  }

  const products = CLIMATE_PRODUCT_MAP[climateKey] || CLIMATE_PRODUCT_MAP["spring-mild"];

  const recommendations: string[] = [];
  if (climateKey === "hot-summer") {
    recommendations.push("Summer's here — cooling products, outdoor gear, and swimwear are what people are searching for");
    recommendations.push("Evening hours tend to work better for ads right now, since that's when people plan their outdoor activities");
    recommendations.push("Bright, summery imagery in your display ads makes a noticeable difference to engagement");
  } else if (climateKey === "cold-winter") {
    recommendations.push("When it's cold outside, people want comfort — warm clothing, indoor entertainment, and cosy home products");
    recommendations.push("Fast delivery messaging hits harder in winter — nobody wants to trek to the shops in bad weather");
    recommendations.push("Keep an eye out for resolution-themed product searches, they start picking up from late December");
  } else if (climateKey === "rainy") {
    recommendations.push("Rainy weather means more time indoors browsing online — it's a good time to increase your display budgets");
    recommendations.push("Indoor activities, home delivery, and 'stay cosy' messaging all tend to resonate");
    recommendations.push("People are more likely to impulse-buy when they're stuck at home — make your offers compelling");
  } else if (climateKey === "spring-mild") {
    recommendations.push("Spring is all about fresh starts — lean into renewal and 'new beginning' messaging");
    recommendations.push("Outdoor activity products see a real surge as the weather improves");
    recommendations.push("Don't forget allergy season — health and wellness searches spike around this time");
  } else {
    recommendations.push("We're in a transition season — products that help people gear up for what's coming next tend to do well");
    recommendations.push("Early holiday prep messaging starts landing surprisingly well at this point");
    recommendations.push("Comfort products and indoor activities are picking up interest");
  }

  return {
    season: climateSeason,
    hemisphere: southernHemisphere ? "southern" : "northern",
    weatherSensitiveCategories: products,
    recommendations,
    productOpportunities: products.slice(0, 5),
  };
}

/**
 * Generate the full context summary — this is what the AI uses for every decision
 */
export function getFullContext(
  countryCode: string = "US",
  industry?: string,
  date: Date = new Date(),
): FullContext {
  const regions = REGION_GROUPS[countryCode] || [countryCode, "GLOBAL"];
  const upcoming = getUpcomingHolidays(date, 60, regions);
  const active = getActiveHolidays(date, regions);
  const seasonal = getSeasonalContext(date, countryCode);
  const geo = getGeoContext(countryCode, date);
  const device = getDeviceContext(geo.localHour, industry);
  const climate = getClimateContext(countryCode, date);

  // Find next major holiday
  const majorHolidays = upcoming.filter(h => h.adImpact === "critical" || h.adImpact === "high");
  const nextMajor = majorHolidays[0] || null;
  let daysUntilNextMajor = 999;
  if (nextMajor) {
    const [mm, dd] = nextMajor.date.split("-").map(Number);
    const hDate = new Date(date.getFullYear(), mm - 1, dd);
    if (hDate < date) hDate.setFullYear(hDate.getFullYear() + 1);
    daysUntilNextMajor = Math.ceil((hDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  }

  // Build action items — written in a natural, conversational tone
  const actionItems: string[] = [];

  if (active.length > 0) {
    active.forEach(h => {
      const budgetBump = Math.round((h.budgetMultiplier - 1) * 100);
      actionItems.push(`${h.name} is happening right now — you'll want to increase your budget by around ${budgetBump}%. Competition drives CPCs up roughly ${h.cpcChange}% during this period.`);
      if (h.tips.length > 0) {
        actionItems.push(`  Tip: ${h.tips[0]}`);
      }
    });
  }

  if (nextMajor && daysUntilNextMajor <= nextMajor.leadTimeDays) {
    actionItems.push(`${nextMajor.name} is ${daysUntilNextMajor} days away — now's the time to start ramping up your ads. We'd recommend budgeting around ${nextMajor.budgetMultiplier}x your normal spend.`);
  }

  if (industry && seasonal.industries[industry]) {
    const ind = seasonal.industries[industry];
    if (ind.demand === "high") {
      actionItems.push(`Your industry is in peak season right now. ${ind.tip}`);
    } else {
      actionItems.push(`For ${industry.replace(/-/g, " ")} this ${seasonal.season}, demand is ${ind.demand}. ${ind.tip}`);
    }
  }

  if (!geo.isWorkingHours) {
    actionItems.push(`It's ${geo.localHour}:00 in your timezone — outside of peak hours. You could save around ${geo.offPeakDiscount}% by reducing bids during this quieter period.`);
  }

  // Include a couple of device and climate tips — but keep them conversational
  if (device.tips.length > 0) {
    actionItems.push(device.tips[0]);
  }
  if (climate.recommendations.length > 0) {
    actionItems.push(climate.recommendations[0]);
  }

  // AI Summary — written like a knowledgeable colleague giving you a quick briefing
  const seasonNice = seasonal.season.charAt(0).toUpperCase() + seasonal.season.slice(1);
  const trendDescription: Record<string, string> = {
    peak: "demand is at its peak",
    rising: "demand is on the way up",
    declining: "things are quietening down a bit",
    low: "it's a steadier period — good for testing and optimising",
  };

  const summaryParts = [
    `It's ${seasonNice} and we're in ${seasonal.retailSeason}.`,
    active.length > 0
      ? `Right now, ${active.map(h => h.name).join(" and ")} ${active.length === 1 ? "is" : "are"} in full swing — worth paying attention to.`
      : "",
    nextMajor && daysUntilNextMajor <= 30
      ? `${nextMajor.name} is coming up in ${daysUntilNextMajor} days, so it's a good time to start preparing.`
      : "",
    `Overall, ${trendDescription[seasonal.demandTrend] || "demand is steady"}.`,
    `${device.currentPeakDevice.charAt(0).toUpperCase() + device.currentPeakDevice.slice(1)} is the dominant device right now.`,
    industry && seasonal.industries[industry]
      ? `For ${industry.replace(/-/g, " ")}, demand is looking ${seasonal.industries[industry].demand} this season.`
      : "",
  ];

  const aiSummary = summaryParts.filter(Boolean).join(" ");

  return {
    timestamp: date.toISOString(),
    holidays: { upcoming, active, nextMajor, daysUntilNextMajor },
    seasonal,
    geo,
    device,
    climate,
    aiSummary,
    actionItems,
  };
}

/**
 * Get platform requirements for a given platform
 */
export function getPlatformRequirements(platform: string): PlatformRequirement | undefined {
  return PLATFORM_REQUIREMENTS.find(p => p.platform === platform);
}

/**
 * Get all platform requirements
 */
export function getAllPlatformRequirements(): PlatformRequirement[] {
  return PLATFORM_REQUIREMENTS;
}
