import { Router } from "express";

import { requireAuth } from "../auth/auth.middleware.js";
import {
  cancelOwnOrder,
  checkoutCart,
  getOwnOrder,
  listOwnOrders,
} from "./order.controller.js";

export const orderRouter = Router();

orderRouter.use(requireAuth);
orderRouter.post("/checkout", checkoutCart);
orderRouter.get("/", listOwnOrders);
orderRouter.get("/:orderId", getOwnOrder);
orderRouter.post("/:orderId/cancel", cancelOwnOrder);
