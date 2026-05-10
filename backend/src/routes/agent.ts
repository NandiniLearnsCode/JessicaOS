import { Router } from "express";
import {
  runAgent,
  detectAvailableProvider,
} from "../lib/agent/orchestrator.js";
import type { AgentConfig, StreamEvent } from "../lib/agent/types.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";

export const agentRouter = Router();

agentRouter.post("/run", async (req, res) => {
  const { message, provider, model, projectId, chatHistory } = req.body;

  if (!message || typeof message !== "string") {
    res.status(400).json({ error: "message is required" });
    return;
  }

  const detected = provider
    ? { provider, model: model ?? "claude-sonnet-4-20250514" }
    : detectAvailableProvider();

  if (!detected) {
    res.status(400).json({
      error:
        "No AI provider configured. Set ANTHROPIC_API_KEY, GEMINI_API_KEY, or OPENAI_API_KEY.",
    });
    return;
  }

  const config: AgentConfig = {
    provider: detected.provider,
    model: detected.model,
    maxSteps: 10,
    temperature: 0.3,
  };

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const onEvent = (event: StreamEvent) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  try {
    const run = await runAgent(message, config, {
      userId: (req as AuthenticatedRequest).userId ?? "anonymous",
      projectId,
      chatHistory,
    }, onEvent);

    res.write(`data: ${JSON.stringify({ type: "run_complete", data: run })}\n\n`);
  } catch (err) {
    res.write(
      `data: ${JSON.stringify({ type: "error", data: { error: String(err) } })}\n\n`,
    );
  }

  res.end();
});

agentRouter.get("/providers", (_req, res) => {
  const providers = [];

  if (process.env.ANTHROPIC_API_KEY) {
    providers.push({
      id: "anthropic",
      name: "Anthropic",
      models: ["claude-sonnet-4-20250514", "claude-3-5-haiku-20241022"],
      available: true,
    });
  }

  if (process.env.GEMINI_API_KEY) {
    providers.push({
      id: "gemini",
      name: "Google Gemini",
      models: ["gemini-2.5-flash", "gemini-2.5-pro"],
      available: true,
    });
  }

  if (process.env.OPENAI_API_KEY) {
    providers.push({
      id: "openai",
      name: "OpenAI",
      models: ["gpt-4.1", "gpt-4.1-mini"],
      available: true,
    });
  }

  if (providers.length === 0) {
    providers.push(
      { id: "anthropic", name: "Anthropic", models: [], available: false },
      { id: "gemini", name: "Google Gemini", models: [], available: false },
      { id: "openai", name: "OpenAI", models: [], available: false },
    );
  }

  res.json({ providers });
});
