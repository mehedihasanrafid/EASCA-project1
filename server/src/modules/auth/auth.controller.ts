import type { CookieOptions, Request, RequestHandler } from "express";

import { env } from "../../config/env.js";
import { AppError } from "../../utils/app-error.js";
import {
  forgotPasswordSchema,
  loginSchema,
  refreshTokenSchema,
  registerSchema,
  resendVerificationSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from "./auth.schema.js";
import {
  forgotPassword as forgotPasswordService,
  getCurrentUser,
  loginUser,
  registerUser,
  resendVerification as resendVerificationService,
  resetPassword as resetPasswordService,
  revokeAllRefreshTokens,
  revokeRefreshToken,
  rotateRefreshToken,
  verifyEmail as verifyEmailService,
} from "./auth.service.js";

const REFRESH_COOKIE = "dokanbd_refresh_token";

function refreshCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/v1/auth",
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  };
}

function sessionMetadata(request: Request) {
  return {
    ipAddress: request.ip ?? null,
    userAgent: request.header("user-agent") ?? null,
  };
}

function readRefreshToken(request: Request) {
  const body = refreshTokenSchema.parse(request.body ?? {});
  const cookie = request.cookies?.[REFRESH_COOKIE];
  return body.refreshToken ?? (typeof cookie === "string" ? cookie : undefined);
}

export const register: RequestHandler = async (request, response) => {
  const result = await registerUser(registerSchema.parse(request.body));
  response.status(201).json({ success: true, data: result });
};

export const login: RequestHandler = async (request, response) => {
  const result = await loginUser(
    loginSchema.parse(request.body),
    sessionMetadata(request),
  );
  const { refreshToken, ...publicResult } = result;

  response.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions());
  response.status(200).json({ success: true, data: publicResult });
};

export const refresh: RequestHandler = async (request, response) => {
  const currentToken = readRefreshToken(request);

  if (!currentToken) {
    throw new AppError(
      401,
      "REFRESH_TOKEN_REQUIRED",
      "A refresh token is required.",
    );
  }

  const result = await rotateRefreshToken(
    currentToken,
    sessionMetadata(request),
  );
  const { refreshToken, ...publicResult } = result;

  response.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions());
  response.status(200).json({ success: true, data: publicResult });
};

export const logout: RequestHandler = async (request, response) => {
  const token = readRefreshToken(request);

  if (token) {
    await revokeRefreshToken(token);
  }

  response.clearCookie(REFRESH_COOKIE, refreshCookieOptions());
  response.status(200).json({ success: true, message: "Logged out." });
};

export const logoutAll: RequestHandler = async (request, response) => {
  if (!request.auth) {
    throw new AppError(401, "AUTHENTICATION_REQUIRED", "Authentication is required.");
  }

  await revokeAllRefreshTokens(request.auth.userId);
  response.clearCookie(REFRESH_COOKIE, refreshCookieOptions());
  response.status(200).json({
    success: true,
    message: "All sessions have been logged out.",
  });
};

export const verifyEmail: RequestHandler = async (request, response) => {
  await verifyEmailService(verifyEmailSchema.parse(request.body));
  response.status(200).json({
    success: true,
    message: "Email verified successfully.",
  });
};

export const resendVerification: RequestHandler = async (request, response) => {
  const developmentToken = await resendVerificationService(
    resendVerificationSchema.parse(request.body),
  );

  response.status(200).json({
    success: true,
    message:
      "If the account exists and needs verification, an email has been sent.",
    ...(developmentToken ? { developmentToken } : {}),
  });
};

export const forgotPassword: RequestHandler = async (request, response) => {
  const developmentToken = await forgotPasswordService(
    forgotPasswordSchema.parse(request.body),
  );

  response.status(200).json({
    success: true,
    message: "If the account exists, a password-reset email has been sent.",
    ...(developmentToken ? { developmentToken } : {}),
  });
};

export const resetPassword: RequestHandler = async (request, response) => {
  await resetPasswordService(resetPasswordSchema.parse(request.body));
  response.status(200).json({
    success: true,
    message: "Password reset successfully. Please log in again.",
  });
};

export const me: RequestHandler = async (request, response) => {
  if (!request.auth) {
    throw new AppError(401, "AUTHENTICATION_REQUIRED", "Authentication is required.");
  }

  const user = await getCurrentUser(request.auth.userId);
  response.status(200).json({ success: true, data: { user } });
};
