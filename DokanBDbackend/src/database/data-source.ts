import "reflect-metadata";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { DataSource } from "typeorm";
import { env } from "../config/env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const AppDataSource = new DataSource({
  type: "mysql",

  host: env.DB_HOST,
  port: env.DB_PORT,

  username: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,

  synchronize: false,
  logging: env.NODE_ENV === "development",

  entities: [__dirname + "/../modules/**/*.entity.{ts,js}"],
  migrations: [__dirname + "/migrations/**/*{.ts,.js}"],
  migrationsRun: false,
  migrationsTableName: "migrations",
});
