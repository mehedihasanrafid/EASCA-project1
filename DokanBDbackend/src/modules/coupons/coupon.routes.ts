import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import { requireRole } from "../auth/authorization.middleware.js";
import { createCouponForAdmin, deleteCouponForAdmin, listCouponsForAdmin, restoreCouponForAdmin, updateCouponForAdmin } from "./coupon.controller.js";

export const adminCouponRouter = Router();
adminCouponRouter.use(requireAuth, requireRole("ADMIN", "OWNER"));
adminCouponRouter.get("/", listCouponsForAdmin);
adminCouponRouter.post("/", createCouponForAdmin);
adminCouponRouter.patch("/:id", updateCouponForAdmin);
adminCouponRouter.delete("/:id", deleteCouponForAdmin);
adminCouponRouter.post("/:id/restore", restoreCouponForAdmin);
