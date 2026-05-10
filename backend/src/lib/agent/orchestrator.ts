import { v4 as uuid } from "uuid";
import { chatCompletion } from "../ai/client.js";
import { AGENT_TOOLS, executeTool } from "./tools.js";
import type {
  AgentConfig,
  AgentMessage,
  AgentRun,
  AgentStep,
  AIProvider,
  StreamEvent,
} from "./types.js";

const SYSTEM_PROMPT = `You are JessicaOS, an AI legal assistant with access to tools for working with legal documents. You help lawyers and legal professionals with:

- Reviewing and analyzing documents
- Drafting and editing contracts
- Extracting structured data from documents
- Comparing documents and identifying differences
- Summarizing key terms and obligations

You have access to the following tools and should use them when the user's request involves documents:

IMPORTANT GUIDELINES:
1. Always use tools when the user asks about documents — do not guess or fabricate document content.
2. When editing documents, explain each change and why you're making it.
3. When extracting data, confirm the column definitions with the user before proceeding if they're ambiguous.
4. Be precise with legal language. Flag any assumptions you make.
5. If a task requires multiple steps (e.g., "review all NDAs and create a comparison"), plan your approach first, then execute step by step.
6. After completing tool calls, synthesize the results into a clear, actionable response for the user.

You can perform multi-step workflows by chaining tool calls. For example:
- Search for relevant documents → Read them → Summarize findings
- List documents → Read specific ones → Extract tabular data
- Read a document → Edit specific clauses → Explain changes`;

export function getApiKey(provider: AIProvider): string | undefined {
  switch (provider) {
    case "anthropic":
      return process.env.ANTHROPIC_API_KEY;
    case "gemini":
      return process.env.GEMINI_API_KEY;
    case "openai":
      return process.env.OPENAI_API_KEY;
  }
}

export function detectAvailableProvider(): {
  provider: AIProvider;
  model: string;
} | null {
  if (process.env.ANTHROPIC_API_KEY) {
    return { provider: "anthropic", model: "claude-sonnet-4-20250514" };
  }
  if (process.env.GEMINI_API_KEY) {
    return { provider: "gemini", model: "gemini-2.5-flash" };
  }
  if (process.env.OPENAI_API_KEY) {
    return { provider: "openai", model: "gpt-4.1" };
  }
  return null;
}

export async function runAgent(
  userMessage: string,
  config: AgentConfig,
  context: { userId: string; projectId?: string; chatHistory?: AgentMessage[] },
  onEvent?: (event: StreamEvent) => void,
): Promise<AgentRun> {
  const runId = uuid();
  const steps: AgentStep[] = [];
  const messages: AgentMessage[] = [
    ...(context.chatHistory ?? []),
    { role: "user", content: userMessage },
  ];

  const run: AgentRun = {
    id: runId,
    chatId: uuid(),
    userId: context.userId,
    status: "running",
    steps,
    model: config.model,
    provider: config.provider,
    totalTokens: 0,
    createdAt: new Date().toISOString(),
  };

  const apiKey = getApiKey(config.provider);
  if (!apiKey) {
    const errorStep: AgentStep = {
      id: uuid(),
      type: "response",
      content: `No API key configured for ${config.provider}. Please add your API key in Account > Models & API Keys.`,
      timestamp: new Date().toISOString(),
    };
    steps.push(errorStep);
    onEvent?.({ type: "step", data: errorStep });
    onEvent?.({ type: "done", data: { runId } });
    run.status = "failed";
    run.completedAt = new Date().toISOString();
    return run;
  }

  try {
    for (let step = 0; step < config.maxSteps; step++) {
      const response = await chatCompletion(
        {
          provider: config.provider,
          model: config.model,
          apiKey,
          temperature: config.temperature,
        },
        config.systemPrompt ?? SYSTEM_PROMPT,
        messages,
        AGENT_TOOLS,
      );

      run.totalTokens += response.usage.inputTokens + response.usage.outputTokens;

      if (response.content) {
        const thinkingStep: AgentStep = {
          id: uuid(),
          type: response.toolCalls.length > 0 ? "thinking" : "response",
          content: response.content,
          timestamp: new Date().toISOString(),
        };
        steps.push(thinkingStep);
        onEvent?.({ type: "step", data: thinkingStep });
      }

      if (response.toolCalls.length === 0) {
        break;
      }

      messages.push({
        role: "assistant",
        content: response.content,
        toolCalls: response.toolCalls,
      });

      const toolResults = [];
      for (const toolCall of response.toolCalls) {
        const tcStep: AgentStep = {
          id: uuid(),
          type: "tool_call",
          content: `Calling ${toolCall.name}`,
          toolCall,
          timestamp: new Date().toISOString(),
        };
        steps.push(tcStep);
        onEvent?.({ type: "step", data: tcStep });

        const result = await executeTool(toolCall, {
          userId: context.userId,
          projectId: context.projectId,
        });
        toolResults.push(result);

        const trStep: AgentStep = {
          id: uuid(),
          type: "tool_result",
          content: result.content,
          toolResult: result,
          timestamp: new Date().toISOString(),
        };
        steps.push(trStep);
        onEvent?.({ type: "step", data: trStep });
      }

      messages.push({
        role: "tool",
        content: "",
        toolResults,
      });
    }

    run.status = "completed";
  } catch (err) {
    const errorStep: AgentStep = {
      id: uuid(),
      type: "response",
      content: `Agent error: ${err instanceof Error ? err.message : String(err)}`,
      timestamp: new Date().toISOString(),
    };
    steps.push(errorStep);
    onEvent?.({ type: "error", data: { error: errorStep.content } });
    run.status = "failed";
  }

  run.completedAt = new Date().toISOString();
  onEvent?.({ type: "done", data: { runId } });
  return run;
}
