import type { Request, RequestHandler } from "express";

import { AppError } from "../../utils/app-error.js";
import {
  adminProductListQuerySchema,
  createProductSchema,
  createProductVariantSchema,
  productIdentifierParamsSchema,
  productIdForVariantParamsSchema,
  productIdParamsSchema,
  productVariantParamsSchema,
  publicProductListQuerySchema,
  updateProductSchema,
  updateProductVariantSchema,
} from "./product.schema.js";
import {
  createProduct,
  createProductVariant,
  deleteProduct,
  deleteProductVariant,
  getAdminProduct,
  getPublicProduct,
  listAdminProducts,
  listPublicProducts,
  restoreProduct,
  updateProduct,
  updateProductVariant,
} from "./product.service.js";

function authenticatedUserId(request: Request) {
  if (!request.auth) {
    throw new AppError(
      401,
      "AUTHENTICATION_REQUIRED",
      "Authentication is required.",
    );
  }

  return request.auth.userId;
}

export const listProducts: RequestHandler = async (request, response) => {
  const input = publicProductListQuerySchema.parse(request.query);
  const result = await listPublicProducts(input);

  response.status(200).json({ success: true, data: result });
};

export const showProduct: RequestHandler = async (request, response) => {
  const { identifier } = productIdentifierParamsSchema.parse(request.params);
  const product = await getPublicProduct(identifier);

  response.status(200).json({ success: true, data: { product } });
};

export const listProductsForAdmin: RequestHandler = async (
  request,
  response,
) => {
  const input = adminProductListQuerySchema.parse(request.query);
  const result = await listAdminProducts(input);

  response.status(200).json({ success: true, data: result });
};

export const showProductForAdmin: RequestHandler = async (
  request,
  response,
) => {
  const { id } = productIdParamsSchema.parse(request.params);
  const product = await getAdminProduct(id);

  response.status(200).json({ success: true, data: { product } });
};

export const createProductForAdmin: RequestHandler = async (
  request,
  response,
) => {
  const input = createProductSchema.parse(request.body);
  const product = await createProduct(input);

  response.status(201).json({ success: true, data: { product } });
};

export const updateProductForAdmin: RequestHandler = async (
  request,
  response,
) => {
  const { id } = productIdParamsSchema.parse(request.params);
  const input = updateProductSchema.parse(request.body);
  const product = await updateProduct(id, input);

  response.status(200).json({ success: true, data: { product } });
};

export const deleteProductForAdmin: RequestHandler = async (
  request,
  response,
) => {
  const { id } = productIdParamsSchema.parse(request.params);
  await deleteProduct(id);

  response.status(204).send();
};

export const restoreProductForAdmin: RequestHandler = async (
  request,
  response,
) => {
  const { id } = productIdParamsSchema.parse(request.params);
  const product = await restoreProduct(id);

  response.status(200).json({ success: true, data: { product } });
};

export const createVariantForAdmin: RequestHandler = async (
  request,
  response,
) => {
  const { productId } = productIdForVariantParamsSchema.parse(request.params);
  const input = createProductVariantSchema.parse(request.body);
  const variant = await createProductVariant(
    productId,
    input,
    authenticatedUserId(request),
  );

  response.status(201).json({ success: true, data: { variant } });
};

export const updateVariantForAdmin: RequestHandler = async (
  request,
  response,
) => {
  const { productId, variantId } = productVariantParamsSchema.parse(
    request.params,
  );
  const input = updateProductVariantSchema.parse(request.body);
  const variant = await updateProductVariant(
    productId,
    variantId,
    input,
    authenticatedUserId(request),
  );

  response.status(200).json({ success: true, data: { variant } });
};

export const deleteVariantForAdmin: RequestHandler = async (
  request,
  response,
) => {
  const { productId, variantId } = productVariantParamsSchema.parse(
    request.params,
  );
  await deleteProductVariant(productId, variantId);

  response.status(204).send();
};

