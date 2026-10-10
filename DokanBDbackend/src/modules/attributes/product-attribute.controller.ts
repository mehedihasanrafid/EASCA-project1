import type { RequestHandler } from "express";

import {
  adminAttributeListQuerySchema,
  attributeIdParamsSchema,
  attributeValueParamsSchema,
  createProductAttributeSchema,
  createProductAttributeValueSchema,
  productTypeAttributeParamsSchema,
  setProductTypeAttributesSchema,
  updateProductAttributeSchema,
  updateProductAttributeValueSchema,
} from "./product-attribute.schema.js";
import {
  createProductAttribute,
  createProductAttributeValue,
  deleteProductAttribute,
  deleteProductAttributeValue,
  getProductTypeAttributes,
  listProductAttributes,
  restoreProductAttribute,
  restoreProductAttributeValue,
  setProductTypeAttributes,
  updateProductAttribute,
  updateProductAttributeValue,
} from "./product-attribute.service.js";

export const listAttributesForAdmin: RequestHandler = async (request, response) => {
  const query = adminAttributeListQuerySchema.parse(request.query);
  response.status(200).json({ success: true, data: { attributes: await listProductAttributes(query.includeDeleted) } });
};
export const createAttributeForAdmin: RequestHandler = async (request, response) => {
  response.status(201).json({ success: true, data: { attribute: await createProductAttribute(createProductAttributeSchema.parse(request.body)) } });
};
export const updateAttributeForAdmin: RequestHandler = async (request, response) => {
  const { id } = attributeIdParamsSchema.parse(request.params);
  response.status(200).json({ success: true, data: { attribute: await updateProductAttribute(id, updateProductAttributeSchema.parse(request.body)) } });
};
export const deleteAttributeForAdmin: RequestHandler = async (request, response) => {
  const { id } = attributeIdParamsSchema.parse(request.params);
  await deleteProductAttribute(id); response.status(204).send();
};
export const restoreAttributeForAdmin: RequestHandler = async (request, response) => {
  const { id } = attributeIdParamsSchema.parse(request.params);
  response.status(200).json({ success: true, data: { attribute: await restoreProductAttribute(id) } });
};
export const createAttributeValueForAdmin: RequestHandler = async (request, response) => {
  const { id } = attributeIdParamsSchema.parse(request.params);
  response.status(201).json({ success: true, data: { value: await createProductAttributeValue(id, createProductAttributeValueSchema.parse(request.body)) } });
};
export const updateAttributeValueForAdmin: RequestHandler = async (request, response) => {
  const { id, valueId } = attributeValueParamsSchema.parse(request.params);
  response.status(200).json({ success: true, data: { value: await updateProductAttributeValue(id, valueId, updateProductAttributeValueSchema.parse(request.body)) } });
};
export const deleteAttributeValueForAdmin: RequestHandler = async (request, response) => {
  const { id, valueId } = attributeValueParamsSchema.parse(request.params);
  await deleteProductAttributeValue(id, valueId); response.status(204).send();
};
export const restoreAttributeValueForAdmin: RequestHandler = async (request, response) => {
  const { id, valueId } = attributeValueParamsSchema.parse(request.params);
  response.status(200).json({ success: true, data: { value: await restoreProductAttributeValue(id, valueId) } });
};
export const listProductTypeAttributesForAdmin: RequestHandler = async (request, response) => {
  const { productTypeId } = productTypeAttributeParamsSchema.parse(request.params);
  response.status(200).json({ success: true, data: { attributes: await getProductTypeAttributes(productTypeId) } });
};
export const setProductTypeAttributesForAdmin: RequestHandler = async (request, response) => {
  const { productTypeId } = productTypeAttributeParamsSchema.parse(request.params);
  response.status(200).json({ success: true, data: { attributes: await setProductTypeAttributes(productTypeId, setProductTypeAttributesSchema.parse(request.body)) } });
};
