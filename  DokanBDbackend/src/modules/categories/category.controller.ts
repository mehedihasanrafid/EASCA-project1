import type { RequestHandler } from "express";

import {
  adminCategoryListQuerySchema,
  categoryIdParamsSchema,
  createCategorySchema,
  updateCategorySchema,
} from "./category.schema.js";
import {
  createCategory,
  deleteCategory,
  listAdminCategories,
  listPublicCategoryTree,
  restoreCategory,
  updateCategory,
} from "./category.service.js";

export const listPublicCategories: RequestHandler = async (_request, response) => {
  const categories = await listPublicCategoryTree();

  response.status(200).json({ success: true, data: { categories } });
};

export const listCategoriesForAdmin: RequestHandler = async (
  request,
  response,
) => {
  const query = adminCategoryListQuerySchema.parse(request.query);
  const categories = await listAdminCategories(query.includeDeleted);

  response.status(200).json({ success: true, data: { categories } });
};

export const createCategoryForAdmin: RequestHandler = async (
  request,
  response,
) => {
  const input = createCategorySchema.parse(request.body);
  const category = await createCategory(input);

  response.status(201).json({ success: true, data: { category } });
};

export const updateCategoryForAdmin: RequestHandler = async (
  request,
  response,
) => {
  const { id } = categoryIdParamsSchema.parse(request.params);
  const input = updateCategorySchema.parse(request.body);
  const category = await updateCategory(id, input);

  response.status(200).json({ success: true, data: { category } });
};

export const deleteCategoryForAdmin: RequestHandler = async (
  request,
  response,
) => {
  const { id } = categoryIdParamsSchema.parse(request.params);
  await deleteCategory(id);

  response.status(204).send();
};

export const restoreCategoryForAdmin: RequestHandler = async (
  request,
  response,
) => {
  const { id } = categoryIdParamsSchema.parse(request.params);
  const category = await restoreCategory(id);

  response.status(200).json({ success: true, data: { category } });
};

