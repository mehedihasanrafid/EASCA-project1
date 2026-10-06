import type { RequestHandler } from "express";

import { AppDataSource } from "../../database/data-source.js";

export const getHealth: RequestHandler = async (_request, response, next) => {
  try {
    await AppDataSource.query("SELECT 1");

    response.status(200).json({
      success: true,
      message: "DokanBD API is running",
      database: "connected"
    });
  } catch (error) {
    next(error);
  }
};

