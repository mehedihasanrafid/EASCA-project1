import { z } from "zod";

export const createProductMediaSchema = z.object({
  variantId: z.string().regex(/^\d+$/).optional(),
  altText: z.string().trim().max(255).optional(),
});

export const updateProductMediaSchema = z
  .object({
    altText: z.string().trim().max(255).nullable().optional(),
    sortOrder: z.coerce.number().int().min(0).optional(),
    isPrimary: z.boolean().optional(),
  })
  .refine(
    (input) =>
      input.altText !== undefined ||
      input.sortOrder !== undefined ||
      input.isPrimary !== undefined,
    { message: "Provide at least one field to update." },
  );

export type CreateProductMediaInput = z.infer<
  typeof createProductMediaSchema
>;
export type UpdateProductMediaInput = z.infer<
  typeof updateProductMediaSchema
>;
