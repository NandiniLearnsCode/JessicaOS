"use client";

import { useState, useRef, useEffect } from "react";
import { runAgent, type AgentStep } from "@/lib/api";
import { AgentStepDisplay } from "./AgentStepDisplay";
import { Send, Loader2, Bot, User, Sparkles } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  steps?: AgentStep[];
  isStreaming?: boolean;
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [backendStatus, setBackendStatus] = useState<
    "checking" | "online" | "offline"
  >("checking");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const apiBase =
      process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";
    fetch(`${apiBase}/health`)
      .then((r) => r.json())
      .then((d) => setBackendStatus(d.ok ? "online" : "offline"))
      .catch(() => setBackendStatus("offline"));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isRunning) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
    };

    const assistantMsg: Message = {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      content: "",
      steps: [],
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
    setIsRunning(true);

    try {
      await runAgent(trimmed, {
        onStep: (step) => {
          setMessages((prev) => {
            const updated = [...prev];
            const lastMsg = updated[updated.length - 1];
            if (lastMsg.role === "assistant") {
              lastMsg.steps = [...(lastMsg.steps ?? []), step];
              if (step.type === "response") {
                lastMsg.content += step.content;
              }
            }
            return [...updated];
          });
        },
        onDone: () => {
          setMessages((prev) => {
            const updated = [...prev];
            const lastMsg = updated[updated.length - 1];
            if (lastMsg.role === "assistant") {
              lastMsg.isStreaming = false;
            }
            return [...updated];
          });
        },
        onError: (error) => {
          setMessages((prev) => {
            const updated = [...prev];
            const lastMsg = updated[updated.length - 1];
            if (lastMsg.role === "assistant") {
              lastMsg.content = error;
              lastMsg.isStreaming = false;
            }
            return [...updated];
          });
        },
      });
    } catch (err) {
      setMessages((prev) => {
        const updated = [...prev];
        const lastMsg = updated[updated.length - 1];
        if (lastMsg.role === "assistant") {
          lastMsg.content = `Connection error: ${err instanceof Error ? err.message : String(err)}`;
          lastMsg.isStreaming = false;
        }
        return [...updated];
      });
    }

    setIsRunning(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4">
            <div className="rounded-full bg-[var(--primary)] p-4">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">JessicaOS Agent</h2>
              <p className="text-[var(--muted-foreground)] max-w-md">
                AI legal assistant with multi-step reasoning. Ask me to review
                documents, draft contracts, extract data, or compare agreements.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 w-full max-w-lg">
              {[
                "Review the service agreement and summarize key terms",
                "List all documents and compare the NDA with the MSA",
                "Extract payment terms from all contracts into a table",
                "Draft an amendment to extend the agreement by 6 months",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="text-left text-sm p-3 rounded-lg border border-[var(--border)] hover:bg-[var(--secondary)] transition-colors text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                >
                  {suggestion}
                </button>
              ))}
            </div>
            {backendStatus !== "online" && (
              <div className="mt-4 px-4 py-2 rounded-lg bg-yellow-900/30 border border-yellow-700 text-yellow-300 text-sm">
                {backendStatus === "checking"
                  ? "Checking backend connection..."
                  : "Backend is offline. Start it with: npm run dev --prefix backend"}
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((msg) => (
              <div key={msg.id} className="flex gap-3">
                <div className="flex-shrink-0 mt-1">
                  {msg.role === "user" ? (
                    <div className="h-7 w-7 rounded-full bg-[var(--secondary)] flex items-center justify-center">
                      <User className="h-4 w-4" />
                    </div>
                  ) : (
                    <div className="h-7 w-7 rounded-full bg-[var(--primary)] flex items-center justify-center">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium mb-1">
                    {msg.role === "user" ? "You" : "JessicaOS"}
                  </div>

                  {/* Agent steps */}
                  {msg.steps && msg.steps.length > 0 && (
                    <div className="space-y-1 mb-3">
                      {msg.steps.map((step) => (
                        <AgentStepDisplay key={step.id} step={step} />
                      ))}
                    </div>
                  )}

                  {/* Message content */}
                  {msg.content && (
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </div>
                  )}

                  {/* Streaming indicator */}
                  {msg.isStreaming && !msg.content && (
                    <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Working...</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-[var(--border)] px-4 py-3">
        <form
          onSubmit={handleSubmit}
          className="max-w-3xl mx-auto flex items-end gap-2"
        >
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask JessicaOS to review, draft, or analyze documents..."
              rows={1}
              className="w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] min-h-[44px] max-h-[200px]"
              style={{
                height: "auto",
                minHeight: "44px",
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
              }}
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim() || isRunning}
            className="flex-shrink-0 h-[44px] w-[44px] rounded-lg bg-[var(--primary)] text-white flex items-center justify-center hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            {isRunning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </form>
        <p className="text-center text-xs text-[var(--muted-foreground)] mt-2">
          JessicaOS uses AI models to assist with legal work. Always verify AI
          output.
        </p>
      </div>
    </div>
  );
}
