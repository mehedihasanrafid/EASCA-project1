import type { RequestHandler } from "express";

import { AppError } from "../../utils/app-error.js";
import { loginSchema, registerSchema } from "./auth.schema.js";
import {
  getCurrentUser,
  loginUser,
  registerUser,
} from "./auth.service.js";

export const register: RequestHandler = async (request, response) => {
  const input = registerSchema.parse(request.body);
  const user = await registerUser(input);

  response.status(201).json({
    success: true,
    data: { user },
  });
};

export const login: RequestHandler = async (request, response) => {
  const input = loginSchema.parse(request.body);
  const result = await loginUser(input);

  response.status(200).json({
    success: true,
    data: result,
  });
};

export const me: RequestHandler = async (request, response) => {
  if (!request.auth) {
    throw new AppError(401, "AUTHENTICATION_REQUIRED", "Authentication is required.");
  }

  const user = await getCurrentUser(request.auth.userId);

  response.status(200).json({
    success: true,
    data: { user },
  });
};