"use client";

import { useState, useRef, useEffect } from "react";
import {
    Send,
    Zap,
    User,
    Loader2,
    ThumbsUp,
    ThumbsDown,
    Sparkles,
    Cpu,
    Mic,
    Paperclip,
    RotateCcw,
    Copy,
    Check,
    Bot,
    MessageSquare,
    TrendingUp,
    Search,
    PenTool,
    Users,
    DollarSign,
    Target,
    BarChart3,
    AlertTriangle,
    CheckCircle2,
    ArrowRight,
} from "lucide-react";

// Types

type LLMModel = "gpt-4o" | "claude-5.6";

interface Message {
    id: number;
    role: "ai" | "user" | "system";
    content: string;
    model?: LLMModel;
    actions?: { label: string; type: "primary" | "secondary" | "danger" }[];
    timestamp: string;
    copied?: boolean;
}

// Model badge helper

const modelBadge = (model: LLMModel) => {
    if (model === "gpt-4o") {
        return (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                <Zap className="w-2.5 h-2.5" /> GPT-4o
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700">
            <Sparkles className="w-2.5 h-2.5" /> Claude 5.6
        </span>
    );
};

// Simulated AI response bank - each key maps to a response

const aiResponseBank: Record<string, { content: string; model: LLMModel; actions?: { label: string; type: "primary" | "secondary" | "danger" }[] }> = {
    "Yes, pause them all": {
        content:
            "Done! Here\u2019s what I did:\n\n" +
            "\u2705 Paused **\"free plumbing tips\"** \u2014 saving ~$22/week\n" +
            "\u2705 Added **\"salary\"** as a blocked search \u2014 saving ~$8.50/week\n" +
            "\u2705 Paused **\"how to fix a leaky faucet\"** \u2014 saving ~$15/week\n\n" +
            "**Total savings: ~$45.50/week** ($182/month)\n\n" +
            "Your daily budget is still set at $50/day, so you\u2019re well within limits. The money you were wasting will now go toward keywords that actually bring customers.\n\n" +
            "Anything else you\u2019d like me to check?",
        model: "gpt-4o",
        actions: [
            { label: "Show me my best keywords", type: "primary" },
            { label: "Write new ad ideas", type: "secondary" },
            { label: "I'm good for now", type: "secondary" },
        ],
    },
    "Let me review first": {
        content:
            "No problem! Here\u2019s a deeper look at each one so you can decide:\n\n" +
            "**1. \"free plumbing tips\"** \ud83d\udea9\n" +
            "\u2022 Spent: $22 this week (127 clicks)\n" +
            "\u2022 Calls: 0 | Forms: 0\n" +
            "\u2022 These are DIY searchers looking for free advice.\n" +
            "\u2022 **Recommendation: Pause** \u2014 zero chance of conversion.\n\n" +
            "**2. \"plumber salary miami\"** \ud83d\udea9\n" +
            "\u2022 Spent: $8.50 this week (34 clicks)\n" +
            "\u2022 Calls: 0 | Forms: 0\n" +
            "\u2022 Job seekers, not customers.\n" +
            "\u2022 **Recommendation: Pause** \u2014 completely irrelevant.\n\n" +
            "**3. \"how to fix a leaky faucet\"** \u26a0\ufe0f\n" +
            "\u2022 Spent: $15 this week (89 clicks)\n" +
            "\u2022 Calls: 0 | Forms: 0\n" +
            "\u2022 DIY intent, but ~5% of these searchers give up and call a plumber.\n" +
            "\u2022 **Recommendation: Pause for now**, re-test in 2 weeks.\n\n" +
            "Want me to pause any of these?",
        model: "gpt-4o",
        actions: [
            { label: "Pause them all", type: "primary" },
            { label: "Pause just #1 and #2", type: "secondary" },
            { label: "Leave them for now", type: "secondary" },
        ],
    },
    "Tell me more": {
        content:
            "Sure! Let me break it down simply:\n\n" +
            "**\"free plumbing tips\"** \u2014 People searching this want free DIY advice. They\u2019re not looking to hire anyone. I\u2019d bet money on pausing this one.\n\n" +
            "**\"plumber salary miami\"** \u2014 This is someone researching plumber pay, maybe looking for a job. Definitely not a customer.\n\n" +
            "**\"how to fix a leaky faucet\"** \u2014 Another DIY searcher. Worth testing a pause \u2014 if we see no drop in calls after a week, we know it was wasted money.\n\n" +
            "All three together cost you **$45.50 this week** with **zero phone calls**. That\u2019s pretty clear-cut waste.",
        model: "claude-5.6",
        actions: [
            { label: "Pause them all", type: "primary" },
            { label: "Pause just the obvious ones", type: "secondary" },
            { label: "Leave them for now", type: "secondary" },
        ],
    },
    "Show my stats": {
        content:
            "Here\u2019s your **last 7 days** at a glance:\n\n" +
            "\ud83d\udcc8 **Performance**\n" +
            "\u2022 Impressions: 4,281 (+12% vs last week)\n" +
            "\u2022 Clicks: 342 (CTR: 7.99%)\n" +
            "\u2022 Phone Calls: 18 (+5 vs last week) \ud83c\udf89\n" +
            "\u2022 Form Submissions: 7\n" +
            "\u2022 Cost: $295.40\n" +
            "\u2022 Cost per Call: $16.41\n\n" +
            "\ud83d\udcb0 **Budget**\n" +
            "\u2022 Daily Budget: $50/day\n" +
            "\u2022 Spent this month: $1,182 of $1,500\n" +
            "\u2022 Remaining: $318 (6.3 days at current pace)\n\n" +
            "\ud83c\udfaf **Top Performing Keyword**\n" +
            "\u2022 \"emergency plumber miami\" \u2014 9 calls, $4.20 cost/call\n\n" +
            "\ud83d\udcc9 **Worst Performer**\n" +
            "\u2022 \"plumber near me\" \u2014 $45 spent, 0 calls (too competitive)\n\n" +
            "Want me to dig deeper into any of these?",
        model: "gpt-4o",
        actions: [
            { label: "Show me call details", type: "primary" },
            { label: "Why is 'plumber near me' failing?", type: "secondary" },
            { label: "Compare to last month", type: "secondary" },
        ],
    },
    "Find money leaks": {
        content:
            "I scanned your account for the last 30 days. Here\u2019s where money is leaking:\n\n" +
            "\ud83d\udea8 **Critical Leaks** (fix these first)\n\n" +
            "1. **3 junk keywords** \u2014 $45.50/week wasted\n" +
            "   \u2022 \"free plumbing tips\", \"plumber salary\", \"fix a leaky faucet\"\n" +
            "   \u2022 Total: $182/month, 0 conversions\n\n" +
            "2. **Ads running 3am\u20136am** \u2014 $28/week wasted\n" +
            "   \u2022 You\u2019re getting clicks at 3am but nobody calls at that hour\n" +
            "   \u2022 Recommendation: Pause ads midnight to 6am\n\n" +
            "3. **Mobile bid too high** \u2014 ~$35/week overspent\n" +
            "   \u2022 Mobile clicks cost $3.20 avg but convert 40% less than desktop\n" +
            "   \u2022 Recommendation: Lower mobile bid adjustment to -25%\n\n" +
            "\u26a0\ufe0f **Minor Leaks**\n\n" +
            "4. **Geographic targeting too wide** \u2014 ~$15/week\n" +
            "   \u2022 You\u2019re showing ads in Homestead and Kendall but your service area is Miami Beach to Coral Gables\n\n" +
            "**Total potential savings: ~$123.50/week ($494/month)** \ud83d\udca1\n\n" +
            "That\u2019s money going straight back into your pocket. Want me to fix any of these?",
        model: "gpt-4o",
        actions: [
            { label: "Fix all critical leaks", type: "primary" },
            { label: "Fix leak #1 only", type: "secondary" },
            { label: "Show me the geographic issue", type: "secondary" },
        ],
    },
    "Write new ads": {
        content:
            "Sure! I\u2019ll write fresh ads based on your Knowledge Base. What type of ad do you need?\n\n" +
            "\ud83d\udcdd **Text Ads (Google Search)**\n" +
            "Best for: People actively searching for your services\n\n" +
            "\ud83d\uddbc\ufe0f **Display Ads (Banner/Image)**\n" +
            "Best for: Brand awareness and retargeting past visitors\n\n" +
            "\ud83d\udede\ufe0f **Shopping Ads**\n" +
            "Best for: Showcasing products with images and prices\n\n" +
            "Or tell me the **specific service or promotion** you want to advertise, and I\u2019ll pick the best format:\n\n" +
            "For example:\n" +
            "\u2022 \"Write an ad for my $49 drain cleaning special\"\n" +
            "\u2022 \"Create a display ad for water heater installation\"\n" +
            "\u2022 \"Write 3 ad variations for emergency plumbing\"",
        model: "gpt-4o",
        actions: [
            { label: "Write text ads for drain cleaning", type: "primary" },
            { label: "Create display ad for LASIK", type: "secondary" },
            { label: "Write 3 variations for my top service", type: "secondary" },
        ],
    },
    "Check my competitors": {
        content:
            "I analyzed your competitors in the **Miami plumbing** market. Here\u2019s what I found:\n\n" +
            "\ud83c\udfc6 **Your Main Competitors on Google Ads**\n\n" +
            "**1. Roto-Rooter Miami** \ud83d\udfe2\n" +
            "\u2022 Avg position: 1.2 (usually above you)\n" +
            "\u2022 Running 12 active ads\n" +
            "\u2022 Key message: \"$50 Off Any Service\"\n" +
            "\u2022 Weakness: No mention of response time\n\n" +
            "**2. Mr. Rooter Plumbing** \ud83d\udfe1\n" +
            "\u2022 Avg position: 2.1\n" +
            "\u2022 Running 8 active ads\n" +
            "\u2022 Key message: \"Neighborly Done Right Promise\"\n" +
            "\u2022 Weakness: Generic, not local enough\n\n" +
            "**3. Art Plumbing & AC** \ud83d\udfe0\n" +
            "\u2022 Avg position: 2.8\n" +
            "\u2022 Running 15 active ads\n" +
            "\u2022 Key message: \"Over 40 Years Experience\"\n" +
            "\u2022 Weakness: No pricing or offers shown\n\n" +
            "\ud83d\udca1 **Your Edge:** You\u2019re the only one mentioning **30-minute response time** and **free estimates**. That\u2019s a strong differentiator!\n\n" +
            "\ud83d\udcb0 **Estimated Competitor Spend:** $800\u2013$1,200/week each\n\n" +
            "Want me to write ads that counter their messaging?",
        model: "claude-5.6",
        actions: [
            { label: "Write counter-ads", type: "primary" },
            { label: "How can I beat Roto-Rooter?", type: "secondary" },
            { label: "What keywords are they bidding on?", type: "secondary" },
        ],
    },
    "Show me my best keywords": {
        content:
            "Here are your **top 5 keywords** by ROI this month:\n\n" +
            "| Keyword | Calls | Cost | Cost/Call |\n" +
            "|---------|-------|------|----------|\n" +
            "| emergency plumber miami | 32 | $134 | $4.19 \ud83c\udf1f |\n" +
            "| plumber miami beach | 18 | $89 | $4.94 |\n" +
            "| 24 hour plumber miami | 14 | $72 | $5.14 |\n" +
            "| burst pipe repair | 11 | $48 | $4.36 |\n" +
            "| water heater repair miami | 9 | $56 | $6.22 |\n\n" +
            "\ud83c\udf1f **\"emergency plumber miami\"** is your money maker \u2014 $4.19/call is excellent for plumbing!\n\n" +
            "I\u2019d recommend **increasing the bid on your top 3** by 15\u201320% to capture more impression share. You\u2019re currently showing for only 62% of eligible searches.\n\n" +
            "Want me to adjust bids?",
        model: "gpt-4o",
        actions: [
            { label: "Yes, increase top 3 bids", type: "primary" },
            { label: "Show me keywords to add", type: "secondary" },
            { label: "What about my worst keywords?", type: "secondary" },
        ],
    },
    "Write text ads for drain cleaning": {
        content:
            "Here are **3 text ad variations** for your drain cleaning service. I used your Knowledge Base data ($49 pricing, same-day service, Miami area):\n\n" +
            "---\n\n" +
            "**Ad 1 \u2014 Price-Forward** (best for cost-conscious searches)\n" +
            "\ud83d\udcdd Headline: $49 Drain Cleaning Miami | Same Day Service \u2022 No Trip Fees\n" +
            "\ud83c\udf10 URL: www.mikesplumbing.com/drains\n" +
            "\ud83d\udcc4 Description: Clogged drain? Professional drain cleaning starting at $49. Kitchen, bathroom, or sewer \u2014 we clear them all. Licensed #PLB-2847. Call now!\n\n" +
            "---\n\n" +
            "**Ad 2 \u2014 Urgency** (best for active-problem searches)\n" +
            "\ud83d\udcdd Headline: Drain Clogged Right Now? | We\u2019re On Our Way \u2022 Fast Service\n" +
            "\ud83c\udf10 URL: www.mikesplumbing.com/emergency\n" +
            "\ud83d\udcc4 Description: Don\u2019t wait with standing water. Mike\u2019s Plumbing clears any drain, any time. $49 drain cleaning \u2014 booking in 60 seconds. Miami-Dade.\n\n" +
            "---\n\n" +
            "**Ad 3 \u2014 Trust** (best for comparison shoppers)\n" +
            "\ud83d\udcdd Headline: Miami\u2019s #1 Drain Cleaning | 500+ 5-Star Reviews \u2022 From $49\n" +
            "\ud83c\udf10 URL: www.mikesplumbing.com/reviews\n" +
            "\ud83d\udcc4 Description: Trusted by 500+ Miami families. Professional drain cleaning from $49. No hidden fees, 2-year guarantee. Free estimates over $200.\n\n" +
            "---\n\n" +
            "All three are saved to your **Drafts** page. Want to edit any of these or go live?",
        model: "gpt-4o",
        actions: [
            { label: "Send all 3 to Drafts", type: "primary" },
            { label: "Regenerate Ad #2", type: "secondary" },
            { label: "Write display ads too", type: "secondary" },
        ],
    },
    "Fix all critical leaks": {
        content:
            "On it! Here\u2019s what I\u2019m doing:\n\n" +
            "\u2705 **Leak #1 \u2014 Junk keywords**\n" +
            "\u2022 Paused \"free plumbing tips\"\n" +
            "\u2022 Added \"salary\" to negative keyword list\n" +
            "\u2022 Paused \"how to fix a leaky faucet\"\n" +
            "\u2022 Savings: ~$45.50/week\n\n" +
            "\u2705 **Leak #2 \u2014 Overnight ads**\n" +
            "\u2022 Set ad schedule: 6:00 AM \u2013 11:59 PM\n" +
            "\u2022 Paused midnight to 6 AM\n" +
            "\u2022 Savings: ~$28/week\n\n" +
            "\u2705 **Leak #3 \u2014 Mobile bids**\n" +
            "\u2022 Set mobile bid adjustment to -25%\n" +
            "\u2022 Savings: ~$35/week\n\n" +
            "**Total fixed: ~$108.50/week ($434/month)** \ud83d\ude80\n\n" +
            "I\u2019ll monitor these changes over the next 7 days and report back. If anything looks off, I\u2019ll alert you immediately.\n\n" +
            "Want me to fix the geographic targeting issue too?",
        model: "gpt-4o",
        actions: [
            { label: "Yes, fix geographic too", type: "primary" },
            { label: "Show me the results next week", type: "secondary" },
            { label: "I'm good for now", type: "secondary" },
        ],
    },
    "Show me call details": {
        content:
            "Here are your **18 calls** from the last 7 days:\n\n" +
            "**\u260e\ufe0f Call Log**\n\n" +
            "| # | Date | Time | Duration | Keyword | Result |\n" +
            "|---|------|------|----------|---------|--------|\n" +
            "| 1 | Feb 24 | 9:12 AM | 4:32 | emergency plumber | \u2705 Booked |\n" +
            "| 2 | Feb 24 | 10:45 AM | 2:18 | burst pipe repair | \u2705 Booked |\n" +
            "| 3 | Feb 24 | 1:30 PM | 0:45 | plumber miami | \u274c Hangup |\n" +
            "| 4 | Feb 23 | 8:05 AM | 6:12 | water heater repair | \u2705 Booked |\n" +
            "| 5 | Feb 23 | 11:20 AM | 3:45 | emergency plumber | \u2705 Booked |\n" +
            "| 6 | Feb 23 | 2:15 PM | 1:02 | drain cleaning | \u2705 Estimate |\n" +
            "| 7 | Feb 23 | 4:30 PM | 0:22 | plumber near me | \u274c Wrong # |\n" +
            "| ... | | | | | |\n" +
            "| 18 | Feb 18 | 9:45 AM | 5:10 | 24hr plumber | \u2705 Booked |\n\n" +
            "**Summary:**\n" +
            "\u2022 \u2705 12 calls booked (67%)\n" +
            "\u2022 \ud83d\udccb 3 estimates given\n" +
            "\u2022 \u274c 2 hangups\n" +
            "\u2022 \u274c 1 wrong number\n\n" +
            "Your booking rate is **67%** which is great \u2014 industry average is around 45%. \ud83c\udf89",
        model: "claude-5.6",
        actions: [
            { label: "Which keywords get the most bookings?", type: "primary" },
            { label: "Why are people hanging up?", type: "secondary" },
            { label: "Show conversion value", type: "secondary" },
        ],
    },
    "How can I beat Roto-Rooter?": {
        content:
            "Great question! Here\u2019s a **battle plan to outrank Roto-Rooter**:\n\n" +
            "\ud83c\udfaf **What they do well:**\n" +
            "\u2022 Strong brand recognition\n" +
            "\u2022 \"$50 Off\" offer is compelling\n" +
            "\u2022 They bid aggressively on branded + generic terms\n\n" +
            "\ud83d\udca1 **How to beat them:**\n\n" +
            "**1. Speed \u2014 Your #1 weapon**\n" +
            "They don\u2019t mention response time. You guarantee 30 minutes.\n" +
            "Ad angle: \"Why Wait 2 Hours? We\u2019re There in 30 Minutes.\"\n\n" +
            "**2. Match their offer + one-up**\n" +
            "They offer $50 off. You could offer:\n" +
            "\u2022 \"Free estimates on all jobs over $200\" (you already do this)\n" +
            "\u2022 \"$49 drain cleaning\" (lower entry point)\n\n" +
            "**3. Local trust angle**\n" +
            "They\u2019re a franchise. You\u2019re family-owned.\n" +
            "Ad angle: \"Skip the Franchise, Call a Real Miami Plumber\"\n\n" +
            "**4. Bid on their brand name** (bold move)\n" +
            "Run an ad on \"Roto-Rooter Miami\" that says:\n" +
            "\"Looking for Roto-Rooter? Try Mike\u2019s \u2014 30-Min Response, No Franchise Fees\"\n\n" +
            "Want me to write any of these ads?",
        model: "claude-5.6",
        actions: [
            { label: "Write the speed ad", type: "primary" },
            { label: "Write the competitor ad", type: "secondary" },
            { label: "How much would competitor bidding cost?", type: "secondary" },
        ],
    },
    "Compare to last month": {
        content:
            "Here\u2019s your **month-over-month comparison**:\n\n" +
            "| Metric | January | February (so far) | Change |\n" +
            "|--------|---------|-------------------|--------|\n" +
            "| Impressions | 16,420 | 12,890 | \ud83d\udfe1 On pace |\n" +
            "| Clicks | 1,180 | 1,024 | \ud83d\udfe2 +9% pace |\n" +
            "| Phone Calls | 52 | 48 | \ud83d\udfe2 +15% pace |\n" +
            "| Cost | $1,420 | $1,182 | \ud83d\udfe2 Under budget |\n" +
            "| Cost/Call | $27.30 | $24.62 | \ud83d\udfe2 -10% \ud83c\udf89 |\n" +
            "| CTR | 7.19% | 7.99% | \ud83d\udfe2 +11% |\n\n" +
            "\ud83d\ude80 **You\u2019re trending better than January across the board!**\n\n" +
            "Key improvements:\n" +
            "\u2022 Cost per call dropped 10% ($27.30 \u2192 $24.62)\n" +
            "\u2022 Click-through rate up 11%\n" +
            "\u2022 On pace for 63 calls this month (vs 52 in Jan)\n\n" +
            "The ad copy changes we made on Feb 8 are clearly working.",
        model: "gpt-4o",
        actions: [
            { label: "What changes helped most?", type: "primary" },
            { label: "Predict next month", type: "secondary" },
            { label: "Show me the full report", type: "secondary" },
        ],
    },
    "I'm good for now": {
        content:
            "Sounds good! \ud83d\udc4d I\u2019ll keep watching your account 24/7 and alert you if:\n\n" +
            "\u2022 \ud83d\udea8 Any keyword suddenly spikes in cost\n" +
            "\u2022 \ud83d\udcc9 Click-through rate drops below 5%\n" +
            "\u2022 \ud83d\udcb0 Daily spend exceeds your budget by 20%+\n" +
            "\u2022 \ud83c\udfc6 A competitor changes their strategy\n\n" +
            "I\u2019ll send you a weekly summary every Monday at 9 AM.\n\n" +
            "Come back anytime \u2014 I\u2019m always here! \ud83d\ude0a",
        model: "gpt-4o",
        actions: [
            { label: "Set up Monday email reports", type: "primary" },
            { label: "Change alert settings", type: "secondary" },
        ],
    },
    "Write 3 variations for my top service": {
        content:
            "Your top service by calls is **Emergency Plumbing**. Here are 3 fresh variations:\n\n" +
            "---\n\n" +
            "**Version A \u2014 Speed Focus** (GPT-4o)\n" +
            "\ud83d\udcdd Pipe Burst? 30-Minute Plumber Miami | Licensed \u2022 Insured \u2022 24/7\n" +
            "\ud83d\udcc4 Miami\u2019s fastest emergency plumber. We guarantee arrival in 30 minutes or the service call is free. Call Mike\u2019s now.\n\n" +
            "---\n\n" +
            "**Version B \u2014 Emotion Focus** (Claude 5.6)\n" +
            "\ud83d\udcdd Don\u2019t Panic \u2014 Your Plumber Is On The Way | 24/7 Miami Emergency\n" +
            "\ud83d\udcc4 Flooding? Burst pipe? Take a breath. Mike\u2019s Plumbing responds in 30 minutes, fixes the problem, and gives you peace of mind. Free estimates.\n\n" +
            "---\n\n" +
            "**Version C \u2014 Social Proof** (GPT-4o)\n" +
            "\ud83d\udcdd 500+ Miami Families Trust This Plumber | 30-Min Response \u2022 Free Quotes\n" +
            "\ud83d\udcc4 There\u2019s a reason we have 500+ five-star reviews. Fast, honest, affordable emergency plumbing. Call Mike\u2019s \u2014 Miami\u2019s most trusted since 2011.\n\n" +
            "---\n\n" +
            "All 3 saved to your Drafts with version history. You can A/B test them!",
        model: "gpt-4o",
        actions: [
            { label: "Send all to Drafts", type: "primary" },
            { label: "Regenerate Version B", type: "secondary" },
            { label: "Write display ads for this", type: "secondary" },
        ],
    },
};

// Fallback response for anything not in the bank

const fallbackResponses = [
    {
        content:
            "I understand! Let me look into that for you.\n\n" +
            "Based on your account data, here\u2019s what I can tell you:\n\n" +
            "\u2022 Your account is healthy with a **7.99% CTR** (above industry average)\n" +
            "\u2022 You\u2019re spending ~$42/day of your $50 budget\n" +
            "\u2022 **18 calls** this week from Google Ads\n\n" +
            "Could you be more specific about what you\u2019d like me to help with? Here are some things I can do:",
        model: "gpt-4o" as LLMModel,
        actions: [
            { label: "Analyze my keywords", type: "primary" as const },
            { label: "Write new ads", type: "secondary" as const },
            { label: "Find wasted spend", type: "secondary" as const },
        ],
    },
    {
        content:
            "Great question! Let me pull up the relevant data from your account.\n\n" +
            "\ud83d\udcca **Quick Account Snapshot**\n\n" +
            "\u2022 Active campaigns: 4\n" +
            "\u2022 Active keywords: 47\n" +
            "\u2022 Monthly budget: $1,500\n" +
            "\u2022 This month so far: $1,182 spent (79%)\n" +
            "\u2022 Conversions: 48 calls + 7 forms = 55 total\n\n" +
            "Is there a specific area you\u2019d like me to dive into?",
        model: "claude-5.6" as LLMModel,
        actions: [
            { label: "Show my stats", type: "primary" as const },
            { label: "Find money leaks", type: "secondary" as const },
            { label: "Check my competitors", type: "secondary" as const },
        ],
    },
];

// Quick action buttons config

const quickActions = [
    { label: "Show my stats", icon: BarChart3 },
    { label: "Find money leaks", icon: AlertTriangle },
    { label: "Write new ads", icon: PenTool },
    { label: "Check my competitors", icon: Users },
];

// Initial message

const initialMessages: Message[] = [
    {
        id: 1,
        role: "system",
        content: "AI Assistant connected \u2022 Models: GPT-4o (primary) + Claude 5.6 (fallback)",
        timestamp: "Session started",
    },
    {
        id: 2,
        role: "ai",
        model: "gpt-4o",
        content:
            "Hey! I just took a quick look at your account for the last 7 days. Here\u2019s what I found:\n\n" +
            "**Good news:** Your ads got 18 phone calls this week \u2014 that\u2019s 5 more than last week! \ud83c\udf89\n\n" +
            "**Not-so-good news:** I found 3 keywords wasting your money:\n\n" +
            "\u2022 **\"free plumbing tips\"** \u2014 spent $22, got 0 calls\n" +
            "\u2022 **\"plumber salary miami\"** \u2014 spent $8.50, got 0 calls\n" +
            "\u2022 **\"how to fix a leaky faucet\"** \u2014 spent $15, got 0 calls\n\n" +
            "That\u2019s **$45.50 wasted** this week on people who weren\u2019t looking to hire a plumber.\n\n" +
            "Want me to pause these and add them as blocked searches? That alone could save you ~$45/week.",
        actions: [
            { label: "Yes, pause them all", type: "primary" },
            { label: "Let me review first", type: "secondary" },
            { label: "Tell me more", type: "secondary" },
        ],
        timestamp: "Just now",
    },
];

// Component

export default function ChatPage() {
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [copiedId, setCopiedId] = useState<number | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Focus input on mount
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const sendMessage = (text: string) => {
        if (!text.trim() || isTyping) return;

        const userMsg: Message = {
            id: Date.now(),
            role: "user",
            content: text,
            timestamp: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
        };

        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setIsTyping(true);

        // Look up response
        const lookup = aiResponseBank[text];
        const fallback = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
        const response = lookup || fallback;

        // Simulate typing delay (shorter for known responses)
        const delay = lookup ? 1200 + Math.random() * 800 : 1800 + Math.random() * 1200;

        setTimeout(() => {
            const aiMsg: Message = {
                id: Date.now() + 1,
                role: "ai",
                model: response.model,
                content: response.content,
                actions: response.actions,
                timestamp: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
            };
            setMessages((prev) => [...prev, aiMsg]);
            setIsTyping(false);
        }, delay);
    };

    const handleCopy = (id: number, content: string) => {
        navigator.clipboard.writeText(content.replace(/\*\*/g, ""));
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleClear = () => {
        setMessages(initialMessages);
    };

    return (
        <div className="max-w-3xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
            {/* Chat header */}
            <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                        <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="font-semibold flex items-center gap-2">
                            AI Assistant
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                                <Zap className="w-2.5 h-2.5" /> GPT-4o
                            </span>
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700">
                                <Sparkles className="w-2.5 h-2.5" /> Claude 5.6
                            </span>
                        </h1>
                        <div className="flex items-center gap-1.5 text-xs text-success">
                            <div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse"></div>
                            Online &bull; Watching your account 24/7
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleClear}
                        className="text-xs border border-border rounded-lg px-2.5 py-1.5 text-muted hover:text-foreground hover:border-primary transition flex items-center gap-1.5"
                        title="New conversation"
                    >
                        <RotateCcw className="w-3 h-3" />
                        New Chat
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-auto space-y-4 pb-4 scroll-smooth">
                {messages.map((msg) => {
                    if (msg.role === "system") {
                        return (
                            <div key={msg.id} className="flex justify-center">
                                <div className="text-[11px] text-muted bg-sidebar border border-border rounded-full px-3 py-1 flex items-center gap-1.5">
                                    <Cpu className="w-3 h-3" />
                                    {msg.content}
                                </div>
                            </div>
                        );
                    }

                    return (
                        <div
                            key={msg.id}
                            className={`flex gap-3 animate-fade-in-up ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                        >
                            {/* Avatar */}
                            <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                    msg.role === "ai"
                                        ? "bg-gradient-to-br from-primary to-blue-600 shadow-sm"
                                        : "bg-muted/20"
                                }`}
                            >
                                {msg.role === "ai" ? (
                                    <Bot className="w-4 h-4 text-white" />
                                ) : (
                                    <User className="w-4 h-4 text-muted" />
                                )}
                            </div>

                            {/* Message bubble */}
                            <div className={`max-w-[85%] ${msg.role === "user" ? "text-right" : ""}`}>
                                {/* Model badge for AI messages */}
                                {msg.role === "ai" && msg.model && (
                                    <div className="mb-1 flex items-center gap-1.5">
                                        {modelBadge(msg.model)}
                                    </div>
                                )}

                                <div
                                    className={`rounded-xl px-4 py-3 text-sm leading-relaxed ${
                                        msg.role === "ai"
                                            ? "bg-card border border-border"
                                            : "bg-primary text-white"
                                    }`}
                                >
                                    {msg.content.split("\n").map((line, i) => (
                                        <span key={i}>
                                            {line.split(/(\*\*[^*]+\*\*)/).map((part, j) =>
                                                part.startsWith("**") && part.endsWith("**") ? (
                                                    <strong key={j}>{part.slice(2, -2)}</strong>
                                                ) : (
                                                    <span key={j}>{part}</span>
                                                )
                                            )}
                                            {i < msg.content.split("\n").length - 1 && <br />}
                                        </span>
                                    ))}
                                </div>

                                {/* Actions */}
                                {msg.actions && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {msg.actions.map((action, i) => (
                                            <button
                                                key={i}
                                                onClick={() => sendMessage(action.label)}
                                                disabled={isTyping}
                                                className={`text-xs px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                                                    action.type === "primary"
                                                        ? "bg-primary text-white hover:bg-primary-dark disabled:opacity-50"
                                                        : action.type === "danger"
                                                            ? "bg-danger/10 text-danger hover:bg-danger/20 disabled:opacity-50"
                                                            : "border border-border hover:border-primary text-foreground disabled:opacity-50"
                                                }`}
                                            >
                                                {action.type === "primary" && <ArrowRight className="w-3 h-3" />}
                                                {action.label}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Feedback, copy, & timestamp */}
                                {msg.role === "ai" && (
                                    <div className="flex items-center gap-3 mt-2 text-xs text-muted">
                                        <span>{msg.timestamp}</span>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => handleCopy(msg.id, msg.content)}
                                                className="p-1 hover:text-primary transition"
                                                title="Copy response"
                                            >
                                                {copiedId === msg.id ? (
                                                    <Check className="w-3 h-3 text-success" />
                                                ) : (
                                                    <Copy className="w-3 h-3" />
                                                )}
                                            </button>
                                            <button className="p-1 hover:text-success transition" title="Good response">
                                                <ThumbsUp className="w-3 h-3" />
                                            </button>
                                            <button className="p-1 hover:text-danger transition" title="Bad response">
                                                <ThumbsDown className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

                {/* Typing indicator */}
                {isTyping && (
                    <div className="flex gap-3 animate-fade-in-up">
                        <div className="w-8 h-8 bg-gradient-to-br from-primary to-blue-600 rounded-lg flex items-center justify-center shrink-0">
                            <Bot className="w-4 h-4 text-white" />
                        </div>
                        <div className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                            <span className="text-xs text-muted">Thinking...</span>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="border-t border-border pt-4 space-y-3">
                <div className="flex gap-2">
                    <div className="flex-1 relative">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
                            placeholder="Ask me anything about your ads..."
                            disabled={isTyping}
                            className="w-full bg-card border border-border rounded-xl px-4 py-3 pr-20 text-sm focus:outline-none focus:border-primary transition disabled:opacity-50"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                            <button className="p-1.5 text-muted hover:text-primary transition rounded-lg" title="Attach file">
                                <Paperclip className="w-4 h-4" />
                            </button>
                            <button className="p-1.5 text-muted hover:text-primary transition rounded-lg" title="Voice input">
                                <Mic className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                    <button
                        onClick={() => sendMessage(input)}
                        disabled={!input.trim() || isTyping}
                        className="bg-primary hover:bg-primary-dark text-white p-3 rounded-xl transition disabled:opacity-50 disabled:hover:bg-primary"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>

                {/* Quick action buttons */}
                <div className="flex gap-2 flex-wrap">
                    {quickActions.map((action) => (
                        <button
                            key={action.label}
                            onClick={() => sendMessage(action.label)}
                            disabled={isTyping}
                            className="text-xs border border-border rounded-lg px-3 py-1.5 text-muted hover:border-primary hover:text-primary transition flex items-center gap-1.5 disabled:opacity-50"
                        >
                            <action.icon className="w-3 h-3" />
                            {action.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
