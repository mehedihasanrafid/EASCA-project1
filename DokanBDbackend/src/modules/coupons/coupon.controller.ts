import type { RequestHandler } from "express";
import { couponIdParamsSchema, couponListQuerySchema, createCouponSchema, updateCouponSchema } from "./coupon.schema.js";
import { createCoupon, deleteCoupon, listCoupons, restoreCoupon, updateCoupon } from "./coupon.service.js";

export const listCouponsForAdmin: RequestHandler = async (request, response) => response.json({ success: true, data: { coupons: await listCoupons(couponListQuerySchema.parse(request.query).includeDeleted) } });
export const createCouponForAdmin: RequestHandler = async (request, response) => response.status(201).json({ success: true, data: { coupon: await createCoupon(createCouponSchema.parse(request.body)) } });
export const updateCouponForAdmin: RequestHandler = async (request, response) => response.json({ success: true, data: { coupon: await updateCoupon(couponIdParamsSchema.parse(request.params).id, updateCouponSchema.parse(request.body)) } });
export const deleteCouponForAdmin: RequestHandler = async (request, response) => { await deleteCoupon(couponIdParamsSchema.parse(request.params).id); response.status(204).send(); };
export const restoreCouponForAdmin: RequestHandler = async (request, response) => response.json({ success: true, data: { coupon: await restoreCoupon(couponIdParamsSchema.parse(request.params).id) } });
