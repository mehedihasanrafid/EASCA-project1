import type { ErrorRequestHandler } from "express";
import multer from "multer";
import { ZodError } from "zod";

import { AppError } from "../utils/app-error.js";
import { logger } from "../config/logger.js";

export const errorHandler: ErrorRequestHandler = (
  error,
  _request,
  response,
  _next,
) => {
  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    });
    return;
  }

  if (error instanceof ZodError) {
    response.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "The request data is invalid.",
        details: error.flatten().fieldErrors,
      },
    });
    return;
  }

  if (error instanceof multer.MulterError) {
    response.status(400).json({
      success: false,
      error: {
        code: "UPLOAD_ERROR",
        message: error.message,
      },
    });
    return;
  }

  logger.error({ error }, "Unhandled request error");

  response.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred.",
    },
  });
};
