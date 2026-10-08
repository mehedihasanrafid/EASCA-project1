import { Router } from "express";

import { requireAuth } from "../auth/auth.middleware.js";
import {
  cancelOwnOrder,
  checkoutCart,
  getCheckoutPreview,
  getOwnOrder,
  listOwnOrders,
} from "./order.controller.js";

export const orderRouter = Router();

orderRouter.use(requireAuth);
orderRouter.post("/checkout", checkoutCart);
orderRouter.get("/checkout-preview", getCheckoutPreview);
orderRouter.get("/", listOwnOrders);
orderRouter.get("/:orderId", getOwnOrder);
orderRouter.post("/:orderId/cancel", cancelOwnOrder);
