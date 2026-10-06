import { z } from "zod";

const databaseIdSchema = z
  .string()
  .regex(/^[1-9]\d*$/, "ID must be a positive integer.");

export const orderStatusSchema = z.enum([
  "PENDING",
  "CONFIRMED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
]);

const paymentStatusSchema = z.enum(["PENDING", "PAID", "FAILED", "REFUNDED"]);

const optionalNoteSchema = z
  .string()
  .trim()
  .min(1)
  .max(500)
  .nullable()
  .optional();

export const orderIdParamsSchema = z.object({
  orderId: databaseIdSchema,
});

export const checkoutSchema = z.object({
  addressId: databaseIdSchema,
  customerNote: z.string().trim().min(1).max(2000).nullable().optional(),
});

export const cancelOrderSchema = z.object({
  note: optionalNoteSchema,
});

export const customerOrderListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: orderStatusSchema.optional(),
});

export const adminOrderListQuerySchema = customerOrderListQuerySchema.extend({
  paymentStatus: paymentStatusSchema.optional(),
  userId: databaseIdSchema.optional(),
  search: z.string().trim().min(1).max(100).optional(),
});

export const adminOrderStatusSchema = z.object({
  status: z.enum(["CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"]),
  note: optionalNoteSchema,
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;
export type CustomerOrderListQuery = z.infer<typeof customerOrderListQuerySchema>;
export type AdminOrderListQuery = z.infer<typeof adminOrderListQuerySchema>;
export type AdminOrderStatusInput = z.infer<typeof adminOrderStatusSchema>;
export type OrderStatus = z.infer<typeof orderStatusSchema>;
