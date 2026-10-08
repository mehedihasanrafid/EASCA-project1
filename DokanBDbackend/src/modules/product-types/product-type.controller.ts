import type { RequestHandler } from "express";
import { adminProductTypeListQuerySchema, createProductTypeSchema, productTypeIdParamsSchema, updateProductTypeSchema } from "./product-type.schema.js";
import { createProductType, deleteProductType, listAdminProductTypes, restoreProductType, updateProductType } from "./product-type.service.js";

export const listProductTypesForAdmin: RequestHandler = async (request, response) => {
  const query = adminProductTypeListQuerySchema.parse(request.query);
  response.status(200).json({ success: true, data: { productTypes: await listAdminProductTypes(query.includeDeleted) } });
};

export const createProductTypeForAdmin: RequestHandler = async (request, response) => {
  const productType = await createProductType(createProductTypeSchema.parse(request.body));
  response.status(201).json({ success: true, data: { productType } });
};

export const updateProductTypeForAdmin: RequestHandler = async (request, response) => {
  const { id } = productTypeIdParamsSchema.parse(request.params);
  const productType = await updateProductType(id, updateProductTypeSchema.parse(request.body));
  response.status(200).json({ success: true, data: { productType } });
};

export const deleteProductTypeForAdmin: RequestHandler = async (request, response) => {
  const { id } = productTypeIdParamsSchema.parse(request.params);
  await deleteProductType(id);
  response.status(204).send();
};

export const restoreProductTypeForAdmin: RequestHandler = async (request, response) => {
  const { id } = productTypeIdParamsSchema.parse(request.params);
  response.status(200).json({ success: true, data: { productType: await restoreProductType(id) } });
};
