import { Router } from "express";

export const userRouter = Router();

userRouter.get("/profile", (_req, res) => {
  res.json({
    id: "anonymous",
    displayName: "Demo User",
    tier: "Free",
  });
});
