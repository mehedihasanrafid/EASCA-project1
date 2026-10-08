import { Router } from "express";

import { requireAuth } from "../auth/auth.middleware.js";
import { requireRole } from "../auth/authorization.middleware.js";
import {
  createBrandForAdmin,
  deleteBrandForAdmin,
  listBrands,
  listBrandsForAdmin,
  restoreBrandForAdmin,
  updateBrandForAdmin,
} from "./brand.controller.js";

export const brandRouter = Router();
export const adminBrandRouter = Router();

brandRouter.get("/", listBrands);

adminBrandRouter.use(requireAuth, requireRole("ADMIN", "OWNER"));
adminBrandRouter.get("/", listBrandsForAdmin);
adminBrandRouter.post("/", createBrandForAdmin);
adminBrandRouter.patch("/:id", updateBrandForAdmin);
adminBrandRouter.delete("/:id", deleteBrandForAdmin);
adminBrandRouter.post("/:id/restore", restoreBrandForAdmin);
