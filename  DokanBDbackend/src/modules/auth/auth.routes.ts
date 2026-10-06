import { Router } from "express";
import { rateLimit } from "express-rate-limit";

import {
  forgotPassword,
  login,
  logout,
  logoutAll,
  me,
  refresh,
  register,
  resendVerification,
  resetPassword,
  verifyEmail,
} from "./auth.controller.js";
import { requireAuth } from "./auth.middleware.js";

export const authRouter = Router();

const authenticationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 1000,
  standardHeaders: true,
  legacyHeaders: false,
});

const emailActionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 1000,
  standardHeaders: true,
  legacyHeaders: false,
});

authRouter.post("/register", authenticationLimiter, register);
authRouter.post("/login", authenticationLimiter, login);
authRouter.post("/refresh", authenticationLimiter, refresh);
authRouter.post("/logout", logout);
authRouter.post("/logout-all", requireAuth, logoutAll);
authRouter.post("/verify-email", emailActionLimiter, verifyEmail);
authRouter.post(
  "/resend-verification",
  emailActionLimiter,
  resendVerification,
);
authRouter.post("/forgot-password", emailActionLimiter, forgotPassword);
authRouter.post("/reset-password", emailActionLimiter, resetPassword);
authRouter.get("/me", requireAuth, me);
