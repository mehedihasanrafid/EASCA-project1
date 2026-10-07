import type { RequestHandler } from "express";

import { AppError } from "../../utils/app-error.js";
import {
  createProductMediaSchema,
  updateProductMediaSchema,
} from "./product-media.schema.js";
import {
  addProductMedia,
  cleanupUploadedProductImages,
  deleteProductImage,
  listProductMedia,
  updateProductImage,
} from "./product-media.service.js";

function requiredParam(value: string | string[] | undefined, name: string) {
  if (!value || Array.isArray(value)) {
    throw new AppError(400, "INVALID_PATH_PARAMETER", `${name} is required.`);
  }
  return value;
}

export const uploadProductImages: RequestHandler = async (request, response) => {
  const files = Array.isArray(request.files)
    ? request.files
    : Object.values(request.files ?? {}).flat();

  try {
    const media = await addProductMedia(
      requiredParam(request.params.productId, "productId"),
      files,
      createProductMediaSchema.parse(request.body),
    );
    response.status(201).json({ success: true, data: { media } });
  } catch (error) {
    await cleanupUploadedProductImages(files);
    throw error;
  }
};

export const listProductMediaHandler: RequestHandler = async (request, response) => {
  const media = await listProductMedia(
    requiredParam(request.params.productId, "productId"),
  );
  response.status(200).json({ success: true, data: { media } });
};

export const updateProductImageHandler: RequestHandler = async (
  request,
  response,
) => {
  const media = await updateProductImage(
    requiredParam(request.params.productId, "productId"),
    requiredParam(request.params.mediaId, "mediaId"),
    updateProductMediaSchema.parse(request.body),
  );
  response.status(200).json({ success: true, data: { media } });
};

export const deleteProductImageHandler: RequestHandler = async (
  request,
  response,
) => {
  await deleteProductImage(
    requiredParam(request.params.productId, "productId"),
    requiredParam(request.params.mediaId, "mediaId"),
  );
  response.status(204).send();
};
