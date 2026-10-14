import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import { requireRole } from "../auth/authorization.middleware.js";
import {
  createAttributeForAdmin, createAttributeValueForAdmin, deleteAttributeForAdmin,
  deleteAttributeValueForAdmin, listAttributesForAdmin, listProductTypeAttributesForAdmin,
  restoreAttributeForAdmin, restoreAttributeValueForAdmin, setProductTypeAttributesForAdmin,
  listProductAttributesForAdmin, setProductAttributesForAdmin,
  updateAttributeForAdmin, updateAttributeValueForAdmin,
} from "./product-attribute.controller.js";

export const adminProductAttributeRouter = Router();
adminProductAttributeRouter.use(requireAuth, requireRole("ADMIN", "OWNER"));
adminProductAttributeRouter.get("/", listAttributesForAdmin);
adminProductAttributeRouter.post("/", createAttributeForAdmin);
adminProductAttributeRouter.patch("/:id", updateAttributeForAdmin);
adminProductAttributeRouter.delete("/:id", deleteAttributeForAdmin);
adminProductAttributeRouter.post("/:id/restore", restoreAttributeForAdmin);
adminProductAttributeRouter.post("/:id/values", createAttributeValueForAdmin);
adminProductAttributeRouter.patch("/:id/values/:valueId", updateAttributeValueForAdmin);
adminProductAttributeRouter.delete("/:id/values/:valueId", deleteAttributeValueForAdmin);
adminProductAttributeRouter.post("/:id/values/:valueId/restore", restoreAttributeValueForAdmin);

export const adminProductTypeAttributeRouter = Router();
adminProductTypeAttributeRouter.use(requireAuth, requireRole("ADMIN", "OWNER"));
adminProductTypeAttributeRouter.get("/:productTypeId/attributes", listProductTypeAttributesForAdmin);
adminProductTypeAttributeRouter.put("/:productTypeId/attributes", setProductTypeAttributesForAdmin);

export const adminProductAttributeAssignmentRouter = Router();
adminProductAttributeAssignmentRouter.use(requireAuth, requireRole("ADMIN", "OWNER"));
adminProductAttributeAssignmentRouter.get("/:productId/attributes", listProductAttributesForAdmin);
adminProductAttributeAssignmentRouter.put("/:productId/attributes", setProductAttributesForAdmin);
