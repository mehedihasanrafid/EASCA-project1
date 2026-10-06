import "reflect-metadata";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { AppDataSource } from "./database/data-source.js";
import { logger } from "./config/logger.js";

async function startServer() {
  try {
    await AppDataSource.initialize();

    console.log("✅ MySQL database connected through TypeORM");

    const app = createApp();

    const server = app.listen(env.PORT, () => {
      const baseUrl = `http://localhost:${env.PORT}`;

      console.log(`✅ DokanBD API running at ${baseUrl}`);
      console.log(`📘 Swagger UI: ${baseUrl}/api-docs/`);
      console.log(`📄 OpenAPI JSON: ${baseUrl}/api-docs.json`);
    });

    const shutdown = (signal: string) => {
      logger.info({ signal }, "Shutting down DokanBD API");
      server.close(() => {
        void AppDataSource.destroy().finally(() => process.exit(0));
      });
    };

    process.once("SIGINT", () => shutdown("SIGINT"));
    process.once("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error) {
    console.error("❌ Unable to start DokanBD API.");
    console.error(error);

    process.exit(1);
  }
}

startServer();
