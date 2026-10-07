import type { RequestHandler } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";

import { env } from "../../config/env.js";
import { AppError } from "../../utils/app-error.js";

export const requireAuth: RequestHandler = (request, _response, next) => {
  const authorization = request.header("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    next(new AppError(401, "AUTHENTICATION_REQUIRED", "Authentication is required."));
    return;
  }

  const token = authorization.slice("Bearer ".length).trim();

  try {
    const payload = jwt.verify(token, env.JWT_SECRET, {
      algorithms: ["HS256"],
    });

    if (
      typeof payload === "string" ||
      !payload.sub ||
      typeof (payload as JwtPayload).role !== "string"
    ) {
      throw new Error("Invalid token payload");
    }

    request.auth = {
      userId: payload.sub,
      roleCode: (payload as JwtPayload).role as string,
    };

    next();
  } catch {
    next(new AppError(401, "INVALID_TOKEN", "The access token is invalid or expired."));
  }
};