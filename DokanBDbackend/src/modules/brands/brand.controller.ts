import type { RequestHandler } from "express";

import { listPublicBrands } from "./brand.service.js";

export const listBrands: RequestHandler = async (_request, response) => {
  const brands = await listPublicBrands();

  response.status(200).json({ success: true, data: { brands } });
};
