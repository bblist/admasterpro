/**
 * AI Chat API Route
 *
 * Handles AI chat requests, routing to GPT-4o (primary) or Claude 4.6 (fallback).
 * When API keys are provided via environment variables, this becomes fully functional.
 * Without keys, it returns a demo response.
 *
 * Environment variables needed:
 *   OPENAI_API_KEY     - OpenAI API key for GPT-4o
 *   ANTHROPIC_API_KEY  - Anthropic API key for Claude 4.6
 */

import { NextRequest, NextResponse } from "next/server";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

interface ChatRequest {
    message: string;
    model?: "gpt-4o" | "claude-4.6";
    context?: string;
    history?: { role: string; content: string }[];
}

const SYSTEM_PROMPT = `You are AdMaster Pro AI, an expert Google Ads assistant. You help clients create ads, optimize campaigns, find wasted spend, and analyze competitors. Be concise, actionable, and friendly. When creating ads, always provide complete headlines, descriptions, and display URLs. When analyzing data, give specific numbers and recommendations. You have access to the client's Knowledge Base, campaign data, and industry benchmarks.`;

async function callOpenAI(body: ChatRequest) {
    if (!OPENAI_API_KEY) return null;

    const messages = [
        { role: "system", content: SYSTEM_PROMPT },
        ...(body.context ? [{ role: "system", content: `Client context: ${body.context}` }] : []),
        ...(body.history || []),
        { role: "user", content: body.message },
    ];

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
            model: "gpt-4o",
            messages,
            max_tokens: 2048,
            temperature: 0.7,
        }),
    });

    if (!res.ok) {
        console.error("[OpenAI] Error:", res.status, await res.text());
        return null;
    }

    const data = await res.json();
    return {
        content: data.choices?.[0]?.message?.content || "No response generated.",
        model: "gpt-4o" as const,
        tokens: {
            prompt: data.usage?.prompt_tokens || 0,
            completion: data.usage?.completion_tokens || 0,
            total: data.usage?.total_tokens || 0,
        },
    };
}

async function callAnthropic(body: ChatRequest) {
    if (!ANTHROPIC_API_KEY) return null;

    const messages = [
        ...(body.history || []).map((m) => ({
            role: m.role === "system" ? ("user" as const) : (m.role as "user" | "assistant"),
            content: m.content,
        })),
        { role: "user" as const, content: body.message },
    ];

    const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-api-key": ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 2048,
            system: SYSTEM_PROMPT + (body.context ? `\n\nClient context: ${body.context}` : ""),
            messages,
        }),
    });

    if (!res.ok) {
        console.error("[Anthropic] Error:", res.status, await res.text());
        return null;
    }

    const data = await res.json();
    return {
        content: data.content?.[0]?.text || "No response generated.",
        model: "claude-4.6" as const,
        tokens: {
            prompt: data.usage?.input_tokens || 0,
            completion: data.usage?.output_tokens || 0,
            total: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
        },
    };
}

export async function POST(req: NextRequest) {
    try {
        const body: ChatRequest = await req.json();

        if (!body.message?.trim()) {
            return NextResponse.json({ error: "Message is required" }, { status: 400 });
        }

        // Try preferred model first, then fallback
        const preferredModel = body.model || "gpt-4o";
        let result = null;

        if (preferredModel === "gpt-4o") {
            result = await callOpenAI(body);
            if (!result) result = await callAnthropic(body);
        } else {
            result = await callAnthropic(body);
            if (!result) result = await callOpenAI(body);
        }

        // No API keys configured — return demo mode response
        if (!result) {
            return NextResponse.json({
                content: "🔧 **Demo Mode** — AI API keys not configured yet. The AI assistant is running in demo mode with pre-built responses. Once API keys are added, this will use real GPT-4o and Claude 4.6 models for dynamic responses.",
                model: "gpt-4o",
                demo: true,
                tokens: { prompt: 0, completion: 0, total: 0 },
            });
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error("[Chat API] Error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
