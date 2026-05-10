"use client";

import { useState } from "react";
import {
  MessageSquare,
  FolderOpen,
  FileText,
  Workflow,
  Settings,
  PanelLeftClose,
  PanelLeft,
  Plus,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { icon: Sparkles, label: "Agent", href: "/", active: true },
  { icon: MessageSquare, label: "Chat", href: "/chat" },
  { icon: FolderOpen, label: "Projects", href: "/projects" },
  { icon: FileText, label: "Documents", href: "/documents" },
  { icon: Workflow, label: "Workflows", href: "/workflows" },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "h-full bg-[var(--card)] border-r border-[var(--border)] flex flex-col transition-all duration-200",
        collapsed ? "w-16" : "w-60",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-[var(--primary)] flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-sm">JessicaOS</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="h-7 w-7 flex items-center justify-center rounded hover:bg-[var(--secondary)] transition-colors text-[var(--muted-foreground)]"
        >
          {collapsed ? (
            <PanelLeft className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* New chat button */}
      <div className="p-3">
        <button
          className={cn(
            "flex items-center gap-2 rounded-lg border border-[var(--border)] hover:bg-[var(--secondary)] transition-colors text-sm",
            collapsed ? "w-10 h-10 justify-center p-0" : "w-full px-3 py-2",
          )}
        >
          <Plus className="h-4 w-4" />
          {!collapsed && <span>New Chat</span>}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {NAV_ITEMS.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              item.active
                ? "bg-[var(--secondary)] text-[var(--foreground)]"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]",
              collapsed && "justify-center px-0",
            )}
          >
            <item.icon className="h-4 w-4 flex-shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </a>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-[var(--border)]">
        <a
          href="/settings"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors",
            collapsed && "justify-center px-0",
          )}
        >
          <Settings className="h-4 w-4" />
          {!collapsed && <span>Settings</span>}
        </a>
      </div>
    </aside>
  );
}
