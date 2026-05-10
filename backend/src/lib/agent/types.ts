export type AIProvider = "anthropic" | "gemini" | "openai";

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolResult {
  toolCallId: string;
  name: string;
  content: string;
  isError?: boolean;
}

export interface AgentMessage {
  role: "user" | "assistant" | "tool";
  content: string;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
}

export interface AgentStep {
  id: string;
  type: "thinking" | "tool_call" | "tool_result" | "response";
  content: string;
  toolCall?: ToolCall;
  toolResult?: ToolResult;
  timestamp: string;
}

export interface AgentRun {
  id: string;
  chatId: string;
  userId: string;
  status: "running" | "completed" | "failed" | "cancelled";
  steps: AgentStep[];
  model: string;
  provider: AIProvider;
  totalTokens: number;
  createdAt: string;
  completedAt?: string;
}

export interface AgentConfig {
  provider: AIProvider;
  model: string;
  maxSteps: number;
  temperature?: number;
  systemPrompt?: string;
}

export interface StreamEvent {
  type: "step" | "delta" | "done" | "error";
  data: AgentStep | { text: string } | { runId: string } | { error: string };
}

export const DEFAULT_MODELS: Record<AIProvider, string> = {
  anthropic: "claude-sonnet-4-20250514",
  gemini: "gemini-2.5-flash",
  openai: "gpt-4.1",
};
