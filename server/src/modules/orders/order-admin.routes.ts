import { Router } from "express";

import { requireAuth } from "../auth/auth.middleware.js";
import { requireRole } from "../auth/authorization.middleware.js";
import {
  changeOrderStatus,
  getOrderForAdmin,
  listOrdersForAdmin,
} from "./order-admin.controller.js";

export const adminOrderRouter = Router();

adminOrderRouter.use(requireAuth, requireRole("ADMIN", "OWNER"));
adminOrderRouter.get("/", listOrdersForAdmin);
adminOrderRouter.get("/:orderId", getOrderForAdmin);
adminOrderRouter.patch("/:orderId/status", changeOrderStatus);
