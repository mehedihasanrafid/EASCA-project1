import { z } from "zod";

const id = z.string().regex(/^[1-9]\d*$/, "The id must be a positive integer.");

export const productTypeIdParamsSchema = z.object({ id });

export const createProductTypeSchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z.string().trim().min(1).max(120).regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Use lowercase letters, numbers, and single hyphens.",
  ).optional(),
  description: z.union([z.string().trim().max(10_000), z.null()]).optional(),
  isActive: z.boolean().optional(),
}).strict();

export const updateProductTypeSchema = createProductTypeSchema.partial().refine(
  (input) => Object.keys(input).length > 0,
  { message: "Provide at least one product type field to update." },
);

export const adminProductTypeListQuerySchema = z.object({
  includeDeleted: z.enum(["true", "false"]).default("false").transform((value) => value === "true"),
});

export type CreateProductTypeInput = z.infer<typeof createProductTypeSchema>;
export type UpdateProductTypeInput = z.infer<typeof updateProductTypeSchema>;
