import { Router } from "express";

import { requireAuth } from "../auth/auth.middleware.js";
import { requireRole } from "../auth/authorization.middleware.js";
import {
  createCategoryForAdmin,
  deleteCategoryForAdmin,
  listCategoriesForAdmin,
  listPublicCategories,
  restoreCategoryForAdmin,
  updateCategoryForAdmin,
} from "./category.controller.js";

export const categoryRouter = Router();
export const adminCategoryRouter = Router();

categoryRouter.get("/", listPublicCategories);

adminCategoryRouter.use(requireAuth, requireRole("ADMIN", "OWNER"));
adminCategoryRouter.get("/", listCategoriesForAdmin);
adminCategoryRouter.post("/", createCategoryForAdmin);
adminCategoryRouter.patch("/:id", updateCategoryForAdmin);
adminCategoryRouter.delete("/:id", deleteCategoryForAdmin);
adminCategoryRouter.post("/:id/restore", restoreCategoryForAdmin);
