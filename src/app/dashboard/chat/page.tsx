"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Zap, User, Loader2, ThumbsUp, ThumbsDown } from "lucide-react";

interface Message {
  id: number;
  role: "ai" | "user";
  content: string;
  actions?: { label: string; type: "primary" | "secondary" | "danger" }[];
  timestamp: string;
}

const initialMessages: Message[] = [
  {
    id: 1,
    role: "ai",
    content:
      "Hey! I just took a quick look at your account for the last 7 days. Here's what I found:\n\n" +
      "**Good news:** Your ads got 18 phone calls this week — that's 5 more than last week! 🎉\n\n" +
      "**Not-so-good news:** I found 3 keywords wasting your money:\n\n" +
      '• **"free plumbing tips"** — spent $22, got 0 calls\n' +
      '• **"plumber salary miami"** — spent $8.50, got 0 calls\n' +
      '• **"how to fix a leaky faucet"** — spent $15, got 0 calls\n\n' +
      "That's **$45.50 wasted** this week on people who weren't looking to hire a plumber.\n\n" +
      "Want me to pause these and add them as blocked searches? That alone could save you ~$45/week.",
    actions: [
      { label: "Yes, pause them all", type: "primary" },
      { label: "Let me review first", type: "secondary" },
      { label: "Tell me more", type: "secondary" },
    ],
    timestamp: "Just now",
  },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: messages.length + 1,
      role: "user",
      content: text,
      timestamp: "Just now",
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponses: Record<string, Message> = {
        "Yes, pause them all": {
          id: messages.length + 2,
          role: "ai",
          content:
            "Done! Here's what I did:\n\n" +
            '✅ Paused **"free plumbing tips"** — saving ~$22/week\n' +
            '✅ Added **"salary"** as a blocked search — saving ~$8.50/week\n' +
            '✅ Paused **"how to fix a leaky faucet"** — saving ~$15/week\n\n' +
            "**Total savings: ~$45.50/week** ($182/month)\n\n" +
            "Your daily budget is still set at $50/day, so you're well within limits. The money you were wasting will now go toward keywords that actually bring customers.\n\n" +
            "Anything else you'd like me to check?",
          actions: [
            { label: "Show me my best keywords", type: "primary" },
            { label: "Write new ad ideas", type: "secondary" },
            { label: "I'm good for now", type: "secondary" },
          ],
          timestamp: "Just now",
        },
        default: {
          id: messages.length + 2,
          role: "ai",
          content:
            'Sure! Let me break it down simply:\n\n**"free plumbing tips"** — People searching this want free DIY advice. They\'re not looking to hire anyone. I\'d bet money on pausing this one.\n\n**"plumber salary miami"** — This is someone researching plumber pay, maybe looking for a job. Definitely not a customer.\n\n**"how to fix a leaky faucet"** — Another DIY searcher. Worth testing a pause — if we see no drop in calls after a week, we know it was wasted money.\n\nAll three together cost you $45.50 this week with zero phone calls. That\'s pretty clear-cut waste.',
          actions: [
            { label: "Pause them all", type: "primary" },
            { label: "Pause just the obvious ones", type: "secondary" },
            { label: "Leave them for now", type: "secondary" },
          ],
          timestamp: "Just now",
        },
      };

      const response = aiResponses[text] || aiResponses["default"];
      setMessages((prev) => [...prev, response]);
      setIsTyping(false);
    }, 1500);
  };

  const handleActionClick = (label: string) => {
    sendMessage(label);
  };

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      {/* Chat header */}
      <div className="flex items-center gap-3 pb-4 border-b border-border mb-4">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-semibold">AI Assistant</h1>
          <div className="flex items-center gap-1.5 text-xs text-success">
            <div className="w-1.5 h-1.5 bg-success rounded-full"></div>
            Online • Watching your account
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto space-y-4 pb-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 animate-fade-in-up ${
              msg.role === "user" ? "flex-row-reverse" : ""
            }`}
          >
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                msg.role === "ai" ? "bg-primary" : "bg-muted/20"
              }`}
            >
              {msg.role === "ai" ? (
                <Zap className="w-4 h-4 text-white" />
              ) : (
                <User className="w-4 h-4 text-muted" />
              )}
            </div>

            {/* Message bubble */}
            <div
              className={`max-w-[80%] ${
                msg.role === "user" ? "text-right" : ""
              }`}
            >
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
                      onClick={() => handleActionClick(action.label)}
                      className={`text-xs px-3 py-1.5 rounded-lg transition ${
                        action.type === "primary"
                          ? "bg-primary text-white hover:bg-primary-dark"
                          : action.type === "danger"
                          ? "bg-danger/10 text-danger hover:bg-danger/20"
                          : "border border-border hover:border-primary text-foreground"
                      }`}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Feedback & timestamp */}
              {msg.role === "ai" && (
                <div className="flex items-center gap-3 mt-2 text-xs text-muted">
                  <span>{msg.timestamp}</span>
                  <div className="flex items-center gap-1">
                    <button className="p-1 hover:text-success transition">
                      <ThumbsUp className="w-3 h-3" />
                    </button>
                    <button className="p-1 hover:text-danger transition">
                      <ThumbsDown className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3 animate-fade-in-up">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div className="bg-card border border-border rounded-xl px-4 py-3">
              <Loader2 className="w-4 h-4 animate-spin text-muted" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border pt-4">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
            placeholder="Ask me anything about your ads..."
            className="flex-1 bg-card border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim()}
            className="bg-primary hover:bg-primary-dark text-white p-3 rounded-xl transition disabled:opacity-50 disabled:hover:bg-primary"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="flex gap-2 mt-2">
          {["Show my stats", "Find money leaks", "Write new ads", "Check my competitors"].map(
            (suggestion) => (
              <button
                key={suggestion}
                onClick={() => sendMessage(suggestion)}
                className="text-xs border border-border rounded-lg px-3 py-1.5 text-muted hover:border-primary hover:text-primary transition"
              >
                {suggestion}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
