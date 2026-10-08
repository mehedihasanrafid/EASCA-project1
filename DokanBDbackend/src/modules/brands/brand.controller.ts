import type { RequestHandler } from "express";

import {
  adminBrandListQuerySchema,
  brandIdParamsSchema,
  createBrandSchema,
  updateBrandSchema,
} from "./brand.schema.js";
import {
  createBrand,
  deleteBrand,
  listAdminBrands,
  listPublicBrands,
  restoreBrand,
  updateBrand,
} from "./brand.service.js";

export const listBrands: RequestHandler = async (_request, response) => {
  const brands = await listPublicBrands();

  response.status(200).json({ success: true, data: { brands } });
};

export const listBrandsForAdmin: RequestHandler = async (request, response) => {
  const query = adminBrandListQuerySchema.parse(request.query);
  const brands = await listAdminBrands(query.includeDeleted);

  response.status(200).json({ success: true, data: { brands } });
};

export const createBrandForAdmin: RequestHandler = async (request, response) => {
  const input = createBrandSchema.parse(request.body);
  const brand = await createBrand(input);

  response.status(201).json({ success: true, data: { brand } });
};

export const updateBrandForAdmin: RequestHandler = async (request, response) => {
  const { id } = brandIdParamsSchema.parse(request.params);
  const input = updateBrandSchema.parse(request.body);
  const brand = await updateBrand(id, input);

  response.status(200).json({ success: true, data: { brand } });
};

export const deleteBrandForAdmin: RequestHandler = async (request, response) => {
  const { id } = brandIdParamsSchema.parse(request.params);
  await deleteBrand(id);

  response.status(204).send();
};

export const restoreBrandForAdmin: RequestHandler = async (request, response) => {
  const { id } = brandIdParamsSchema.parse(request.params);
  const brand = await restoreBrand(id);

  response.status(200).json({ success: true, data: { brand } });
};
