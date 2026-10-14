import { z } from "zod";

const id = z.string().regex(/^[1-9]\d*$/);
const money = z.coerce.number().finite().min(0).max(9_999_999_999.99);
const nullableMoney = z.union([money, z.null()]).optional();
const nullableDate = z.union([z.string().datetime({ offset: true }), z.null()]).optional();

const fields = {
  code: z.string().trim().toUpperCase().min(3).max(40).regex(/^[A-Z0-9][A-Z0-9_-]*$/),
  name: z.string().trim().min(2).max(120),
  discountType: z.enum(["PERCENTAGE", "FIXED"]),
  value: money,
  minimumSubtotal: money.optional(),
  maximumDiscount: nullableMoney,
  startsAt: nullableDate,
  endsAt: nullableDate,
  usageLimit: z.union([z.coerce.number().int().positive(), z.null()]).optional(),
  perCustomerLimit: z.coerce.number().int().positive().max(100).optional(),
  isActive: z.boolean().optional(),
};

const validCoupon = (value: { discountType?: string; value?: number; startsAt?: string | null; endsAt?: string | null }) =>
  (value.discountType !== "PERCENTAGE" || value.value === undefined || value.value <= 100) &&
  (!value.startsAt || !value.endsAt || new Date(value.startsAt) < new Date(value.endsAt));

export const createCouponSchema = z.object(fields).strict().refine(validCoupon, {
  message: "Percentage must be 100 or less and the end date must be after the start date.",
});
export const updateCouponSchema = z.object(fields).partial().strict()
  .refine((value) => Object.keys(value).length > 0, "Provide at least one coupon field.")
  .refine(validCoupon, "Percentage must be 100 or less and the end date must be after the start date.");
export const couponIdParamsSchema = z.object({ id });
export const couponListQuerySchema = z.object({
  includeDeleted: z.enum(["true", "false"]).default("false").transform((value) => value === "true"),
});

export type CreateCouponInput = z.infer<typeof createCouponSchema>;
export type UpdateCouponInput = z.infer<typeof updateCouponSchema>;
