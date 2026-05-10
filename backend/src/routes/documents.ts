import { Router } from "express";

export const documentsRouter = Router();

documentsRouter.get("/", (_req, res) => {
  res.json({ documents: [] });
});
