const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

export async function fetchAPI<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `API error: ${res.status}`);
  }
  return res.json();
}

export interface AgentStep {
  id: string;
  type: "thinking" | "tool_call" | "tool_result" | "response";
  content: string;
  toolCall?: {
    id: string;
    name: string;
    arguments: Record<string, unknown>;
  };
  toolResult?: {
    toolCallId: string;
    name: string;
    content: string;
    isError?: boolean;
  };
  timestamp: string;
}

export interface StreamEvent {
  type: "step" | "delta" | "done" | "error" | "run_complete";
  data: unknown;
}

export async function runAgent(
  message: string,
  options?: {
    provider?: string;
    model?: string;
    projectId?: string;
    onStep?: (step: AgentStep) => void;
    onDone?: (runId: string) => void;
    onError?: (error: string) => void;
  },
): Promise<void> {
  const res = await fetch(`${API_BASE}/agent/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      provider: options?.provider,
      model: options?.model,
      projectId: options?.projectId,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    options?.onError?.(body.error ?? `API error: ${res.status}`);
    return;
  }

  const reader = res.body?.getReader();
  if (!reader) return;

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      try {
        const event: StreamEvent = JSON.parse(line.slice(6));
        if (event.type === "step") {
          options?.onStep?.(event.data as AgentStep);
        } else if (event.type === "done") {
          options?.onDone?.((event.data as { runId: string }).runId);
        } else if (event.type === "error") {
          options?.onError?.((event.data as { error: string }).error);
        }
      } catch {
        // skip malformed events
      }
    }
  }
}
