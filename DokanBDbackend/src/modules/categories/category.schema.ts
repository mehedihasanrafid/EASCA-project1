import { z } from "zod";

const entityIdSchema = z
  .string()
  .regex(/^[1-9]\d*$/, "The id must be a positive integer.");

const nullableUrlSchema = z
  .union([z.string().trim().url().max(500), z.null()])
  .optional();

export const categoryIdParamsSchema = z.object({
  id: entityIdSchema,
});

export const createCategorySchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    slug: z
      .string()
      .trim()
      .min(1)
      .max(120)
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Use lowercase letters, numbers, and single hyphens.",
      )
      .optional(),
    description: z.union([z.string().trim().max(10_000), z.null()]).optional(),
    imageUrl: nullableUrlSchema,
    parentId: z.union([entityIdSchema, z.null()]).optional(),
    isActive: z.boolean().optional(),
    sortOrder: z.coerce.number().int().min(0).max(1_000_000).optional(),
  })
  .strict();

export const updateCategorySchema = createCategorySchema
  .partial()
  .refine((input) => Object.keys(input).length > 0, {
    message: "Provide at least one category field to update.",
  });

export const adminCategoryListQuerySchema = z.object({
  includeDeleted: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

