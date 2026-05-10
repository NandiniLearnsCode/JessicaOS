import type {
  AIProvider,
  ToolDefinition,
  ToolCall,
  AgentMessage,
} from "../agent/types.js";

export interface AIResponse {
  content: string;
  toolCalls: ToolCall[];
  finishReason: "end_turn" | "tool_use" | "stop" | "max_tokens";
  usage: { inputTokens: number; outputTokens: number };
}

export interface AIClientOptions {
  provider: AIProvider;
  model: string;
  apiKey: string;
  temperature?: number;
}

export async function chatCompletion(
  options: AIClientOptions,
  systemPrompt: string,
  messages: AgentMessage[],
  tools: ToolDefinition[],
): Promise<AIResponse> {
  switch (options.provider) {
    case "anthropic":
      return callAnthropic(options, systemPrompt, messages, tools);
    case "gemini":
      return callGemini(options, systemPrompt, messages, tools);
    case "openai":
      return callOpenAI(options, systemPrompt, messages, tools);
    default:
      throw new Error(`Unsupported provider: ${options.provider}`);
  }
}

async function callAnthropic(
  options: AIClientOptions,
  systemPrompt: string,
  messages: AgentMessage[],
  tools: ToolDefinition[],
): Promise<AIResponse> {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic({ apiKey: options.apiKey });

  const anthropicMessages: Array<{
    role: "user" | "assistant";
    content: string | Array<unknown>;
  }> = [];

  for (const m of messages) {
    if (m.role === "tool" && m.toolResults) {
      for (const tr of m.toolResults) {
        anthropicMessages.push({
          role: "user" as const,
          content: [
            {
              type: "tool_result",
              tool_use_id: tr.toolCallId,
              content: tr.content,
            },
          ],
        });
      }
    } else if (m.role === "assistant" && m.toolCalls?.length) {
      const content: Array<unknown> = [];
      if (m.content) {
        content.push({ type: "text", text: m.content });
      }
      for (const tc of m.toolCalls) {
        content.push({
          type: "tool_use",
          id: tc.id,
          name: tc.name,
          input: tc.arguments,
        });
      }
      anthropicMessages.push({ role: "assistant" as const, content });
    } else if (m.role !== "tool") {
      anthropicMessages.push({
        role: m.role as "user" | "assistant",
        content: m.content,
      });
    }
  }

  const anthropicTools = tools.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.parameters as Record<string, unknown>,
  }));

  const response = await client.messages.create({
    model: options.model,
    max_tokens: 4096,
    temperature: options.temperature ?? 0.3,
    system: systemPrompt,
    messages: anthropicMessages as Parameters<
      typeof client.messages.create
    >[0]["messages"],
    tools: anthropicTools as Parameters<
      typeof client.messages.create
    >[0]["tools"],
  });

  let content = "";
  const toolCalls: ToolCall[] = [];

  for (const block of response.content) {
    if (block.type === "text") {
      content += block.text;
    } else if (block.type === "tool_use") {
      toolCalls.push({
        id: block.id,
        name: block.name,
        arguments: block.input as Record<string, unknown>,
      });
    }
  }

  return {
    content,
    toolCalls,
    finishReason: response.stop_reason === "tool_use" ? "tool_use" : "end_turn",
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    },
  };
}

async function callGemini(
  options: AIClientOptions,
  systemPrompt: string,
  messages: AgentMessage[],
  tools: ToolDefinition[],
): Promise<AIResponse> {
  const { GoogleGenAI } = await import("@google/genai");
  const client = new GoogleGenAI({ apiKey: options.apiKey });

  const geminiTools = tools.length
    ? [
        {
          functionDeclarations: tools.map((t) => ({
            name: t.name,
            description: t.description,
            parameters: t.parameters,
          })),
        },
      ]
    : undefined;

  const contents = messages
    .filter((m) => m.role !== "tool")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  const response = await client.models.generateContent({
    model: options.model,
    contents,
    config: {
      systemInstruction: systemPrompt,
      temperature: options.temperature ?? 0.3,
      maxOutputTokens: 4096,
      tools: geminiTools,
    },
  });

  const toolCalls: ToolCall[] = [];
  let content = "";

  if (response.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.text) {
        content += part.text;
      }
      if (part.functionCall) {
        toolCalls.push({
          id: `gemini-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: part.functionCall.name ?? "",
          arguments: (part.functionCall.args as Record<string, unknown>) ?? {},
        });
      }
    }
  }

  return {
    content,
    toolCalls,
    finishReason: toolCalls.length > 0 ? "tool_use" : "end_turn",
    usage: {
      inputTokens: response.usageMetadata?.promptTokenCount ?? 0,
      outputTokens: response.usageMetadata?.candidatesTokenCount ?? 0,
    },
  };
}

async function callOpenAI(
  options: AIClientOptions,
  systemPrompt: string,
  messages: AgentMessage[],
  tools: ToolDefinition[],
): Promise<AIResponse> {
  const OpenAI = (await import("openai")).default;
  const client = new OpenAI({ apiKey: options.apiKey });

  const openaiMessages: Array<unknown> = [
    { role: "system", content: systemPrompt },
  ];

  for (const m of messages) {
    if (m.role === "assistant" && m.toolCalls?.length) {
      openaiMessages.push({
        role: "assistant",
        content: m.content || null,
        tool_calls: m.toolCalls.map((tc) => ({
          id: tc.id,
          type: "function",
          function: { name: tc.name, arguments: JSON.stringify(tc.arguments) },
        })),
      });
    } else if (m.role === "tool" && m.toolResults) {
      for (const tr of m.toolResults) {
        openaiMessages.push({
          role: "tool",
          tool_call_id: tr.toolCallId,
          content: tr.content,
        });
      }
    } else {
      openaiMessages.push({ role: m.role, content: m.content });
    }
  }

  const openaiTools = tools.map((t) => ({
    type: "function" as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    },
  }));

  const response = await client.chat.completions.create({
    model: options.model,
    messages: openaiMessages as unknown as Parameters<
      typeof client.chat.completions.create
    >[0]["messages"],
    tools: openaiTools.length ? openaiTools : undefined,
    temperature: options.temperature ?? 0.3,
    max_tokens: 4096,
  });

  const choice = response.choices[0];
  const toolCalls: ToolCall[] = [];

  if (choice.message.tool_calls) {
    for (const tc of choice.message.tool_calls) {
      toolCalls.push({
        id: tc.id,
        name: tc.function.name,
        arguments: JSON.parse(tc.function.arguments),
      });
    }
  }

  return {
    content: choice.message.content ?? "",
    toolCalls,
    finishReason: toolCalls.length > 0 ? "tool_use" : "end_turn",
    usage: {
      inputTokens: response.usage?.prompt_tokens ?? 0,
      outputTokens: response.usage?.completion_tokens ?? 0,
    },
  };
}
