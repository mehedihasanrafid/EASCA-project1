import { randomUUID } from "node:crypto";
import pino from "pino";
import { pinoHttp } from "pino-http";

import { env } from "./env.js";

export const logger = pino({
  level: env.NODE_ENV === "production" ? "info" : "debug",
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "password",
      "token",
      "refreshToken",
    ],
    censor: "[REDACTED]",
  },
});

export const httpLogger = pinoHttp({
  logger,
  genReqId(request, response) {
    const suppliedId = request.headers["x-request-id"];
    const requestId = typeof suppliedId === "string" ? suppliedId : randomUUID();
    response.setHeader("x-request-id", requestId);
    return requestId;
  },
});
