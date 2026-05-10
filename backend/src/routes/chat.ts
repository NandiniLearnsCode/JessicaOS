import { Router } from "express";

export const chatRouter = Router();

chatRouter.get("/", (_req, res) => {
  res.json({ chats: [] });
});

chatRouter.post("/create", (req, res) => {
  const { title, projectId } = req.body;
  res.json({
    id: `chat-${Date.now()}`,
    title: title ?? "New Chat",
    projectId: projectId ?? null,
    createdAt: new Date().toISOString(),
  });
});
