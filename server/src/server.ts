import "reflect-metadata";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { AppDataSource } from "./database/data-source.js";

async function startServer() {
  try {
    await AppDataSource.initialize();

    console.log("✅ MySQL database connected through TypeORM");

    const app = createApp();

    app.listen(env.PORT, () => {
      console.log(`✅ DokanBD API running on port ${env.PORT}`);
    });
  } catch (error) {
    console.error("❌ Unable to start DokanBD API.");
    console.error(error);

    process.exit(1);
  }
}

startServer();
