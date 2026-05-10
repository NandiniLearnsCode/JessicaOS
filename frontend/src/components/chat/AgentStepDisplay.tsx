"use client";

import { useState } from "react";
import type { AgentStep } from "@/lib/api";
import {
  Brain,
  Wrench,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

interface AgentStepDisplayProps {
  step: AgentStep;
}

export function AgentStepDisplay({ step }: AgentStepDisplayProps) {
  const [expanded, setExpanded] = useState(false);

  if (step.type === "response") {
    return null;
  }

  const icon = {
    thinking: <Brain className="h-4 w-4 text-blue-400" />,
    tool_call: <Wrench className="h-4 w-4 text-yellow-400" />,
    tool_result: step.toolResult?.isError ? (
      <AlertCircle className="h-4 w-4 text-red-400" />
    ) : (
      <CheckCircle2 className="h-4 w-4 text-green-400" />
    ),
    response: null,
  }[step.type];

  const label = {
    thinking: "Thinking",
    tool_call: `Using ${step.toolCall?.name ?? "tool"}`,
    tool_result: `Result from ${step.toolResult?.name ?? "tool"}`,
    response: "Response",
  }[step.type];

  const hasDetails =
    step.type === "tool_call" || step.type === "tool_result" || step.type === "thinking";

  return (
    <div className="border-l-2 border-[var(--border)] pl-3 py-1">
      <button
        onClick={() => hasDetails && setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors w-full text-left"
        disabled={!hasDetails}
      >
        {icon}
        <span className="font-medium">{label}</span>
        {hasDetails && (
          <span className="ml-auto">
            {expanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </span>
        )}
      </button>
      {expanded && (
        <div className="mt-2 ml-6">
          {step.type === "thinking" && (
            <pre className="text-xs text-[var(--muted-foreground)] whitespace-pre-wrap bg-[var(--secondary)] rounded p-2 max-h-40 overflow-auto">
              {step.content}
            </pre>
          )}
          {step.type === "tool_call" && step.toolCall && (
            <pre className="text-xs text-[var(--muted-foreground)] whitespace-pre-wrap bg-[var(--secondary)] rounded p-2 max-h-40 overflow-auto">
              {JSON.stringify(step.toolCall.arguments, null, 2)}
            </pre>
          )}
          {step.type === "tool_result" && (
            <pre className="text-xs text-[var(--muted-foreground)] whitespace-pre-wrap bg-[var(--secondary)] rounded p-2 max-h-60 overflow-auto">
              {(() => {
                try {
                  return JSON.stringify(JSON.parse(step.content), null, 2);
                } catch {
                  return step.content;
                }
              })()}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
