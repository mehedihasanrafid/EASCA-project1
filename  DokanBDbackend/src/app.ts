import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";
import { resolve } from "node:path";
import swaggerUi from "swagger-ui-express";

import { env } from "./config/env.js";
import { httpLogger } from "./config/logger.js";
import { openApiDocument } from "./docs/openapi.js";
import { errorHandler } from "./middlewares/error-handler.js";
import { notFound } from "./middlewares/not-found.js";
import { v1Router } from "./routes/v1.js";

const apiSecurityHeaders = helmet();
const documentationSecurityHeaders = helmet({ contentSecurityPolicy: false });

export const createApp = () => {
  const app = express();

  app.disable("x-powered-by");
  app.use((request, response, next) => {
    const securityHeaders = request.path.startsWith("/api-docs")
      ? documentationSecurityHeaders
      : apiSecurityHeaders;

    securityHeaders(request, response, next);
  });
  app.use(cors({ origin: env.WEB_ORIGIN, credentials: true }));
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(httpLogger);
  app.use("/uploads", express.static(resolve(env.UPLOAD_DIR)));

  app.get("/api-docs.json", (_request, response) => {
    response.status(200).json(openApiDocument);
  });
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(openApiDocument, {
      customSiteTitle: "DokanBD API documentation",
      swaggerOptions: { persistAuthorization: true },
    }),
  );

  app.use("/api/v1", v1Router);

  app.use(notFound);
  app.use(errorHandler);
  
  return app;
};
