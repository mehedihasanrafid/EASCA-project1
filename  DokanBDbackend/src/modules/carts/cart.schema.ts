import { z } from "zod";

const databaseIdSchema = z
  .string()
  .regex(/^[1-9]\d*$/, "ID must be a positive integer.");

const quantitySchema = z
  .number()
  .int()
  .positive()
  .max(2_147_483_647, "Quantity is too large.");

export const cartItemIdParamsSchema = z.object({
  itemId: databaseIdSchema,
});

export const addCartItemSchema = z.object({
  productVariantId: databaseIdSchema,
  quantity: quantitySchema,
});

export const updateCartItemSchema = z.object({
  quantity: quantitySchema,
});

export type AddCartItemInput = z.infer<typeof addCartItemSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
