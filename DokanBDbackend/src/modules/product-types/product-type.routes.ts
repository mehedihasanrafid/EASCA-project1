import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import { requireRole } from "../auth/authorization.middleware.js";
import { createProductTypeForAdmin, deleteProductTypeForAdmin, listProductTypesForAdmin, restoreProductTypeForAdmin, updateProductTypeForAdmin } from "./product-type.controller.js";

export const adminProductTypeRouter = Router();
adminProductTypeRouter.use(requireAuth, requireRole("ADMIN", "OWNER"));
adminProductTypeRouter.get("/", listProductTypesForAdmin);
adminProductTypeRouter.post("/", createProductTypeForAdmin);
adminProductTypeRouter.patch("/:id", updateProductTypeForAdmin);
adminProductTypeRouter.delete("/:id", deleteProductTypeForAdmin);
adminProductTypeRouter.post("/:id/restore", restoreProductTypeForAdmin);
