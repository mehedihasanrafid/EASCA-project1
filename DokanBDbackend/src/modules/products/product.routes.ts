import { Router } from "express";

import { requireAuth } from "../auth/auth.middleware.js";
import { requireRole } from "../auth/authorization.middleware.js";
import {
  createProductForAdmin,
  createVariantForAdmin,
  deleteProductForAdmin,
  deleteVariantForAdmin,
  listProducts,
  listProductsForAdmin,
  restoreProductForAdmin,
  showProduct,
  showProductForAdmin,
  updateProductForAdmin,
  updateVariantForAdmin,
} from "./product.controller.js";
import {
  deleteProductImageHandler,
  listProductMediaHandler,
  updateProductImageHandler,
  uploadProductImages,
} from "./product-media.controller.js";
import { productMediaUpload } from "./product-media-upload.middleware.js";

export const productRouter = Router();
export const adminProductRouter = Router();

productRouter.get("/", listProducts);
productRouter.get("/:identifier", showProduct);

adminProductRouter.use(requireAuth, requireRole("ADMIN", "OWNER"));
adminProductRouter.get("/", listProductsForAdmin);
adminProductRouter.post("/", createProductForAdmin);
adminProductRouter.get("/:id", showProductForAdmin);
adminProductRouter.patch("/:id", updateProductForAdmin);
adminProductRouter.delete("/:id", deleteProductForAdmin);
adminProductRouter.post("/:id/restore", restoreProductForAdmin);
adminProductRouter.post("/:productId/variants", createVariantForAdmin);
adminProductRouter.patch(
  "/:productId/variants/:variantId",
  updateVariantForAdmin,
);
adminProductRouter.delete(
  "/:productId/variants/:variantId",
  deleteVariantForAdmin,
);
adminProductRouter.post(
  "/:productId/media",
  productMediaUpload.fields([
    { name: "media", maxCount: 4 },
    { name: "images", maxCount: 4 },
  ]),
  uploadProductImages,
);
adminProductRouter.get("/:productId/media", listProductMediaHandler);
adminProductRouter.patch(
  "/:productId/media/:mediaId",
  updateProductImageHandler,
);
adminProductRouter.delete(
  "/:productId/media/:mediaId",
  deleteProductImageHandler,
);
