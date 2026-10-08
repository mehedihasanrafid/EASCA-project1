import { z } from "zod";

const entityIdSchema = z
  .string()
  .regex(/^[1-9]\d*$/, "The id must be a positive integer.");

const nullableUrlSchema = z
  .union([z.string().trim().url().max(500), z.null()])
  .optional();

export const brandIdParamsSchema = z.object({ id: entityIdSchema });

export const createBrandSchema = z
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
    logoUrl: nullableUrlSchema,
    description: z.union([z.string().trim().max(10_000), z.null()]).optional(),
    isActive: z.boolean().optional(),
  })
  .strict();

export const updateBrandSchema = createBrandSchema
  .partial()
  .refine((input) => Object.keys(input).length > 0, {
    message: "Provide at least one brand field to update.",
  });

export const adminBrandListQuerySchema = z.object({
  includeDeleted: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
});

export type CreateBrandInput = z.infer<typeof createBrandSchema>;
export type UpdateBrandInput = z.infer<typeof updateBrandSchema>;
