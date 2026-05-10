import { Router } from "express";

export const projectsRouter = Router();

projectsRouter.get("/", (_req, res) => {
  res.json({ projects: [] });
});

projectsRouter.post("/", (req, res) => {
  const { name } = req.body;
  res.json({
    id: `proj-${Date.now()}`,
    name: name ?? "New Project",
    createdAt: new Date().toISOString(),
  });
});
