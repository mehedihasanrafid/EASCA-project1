import { z } from "zod";

const entityIdSchema = z.string().regex(/^[1-9]\d*$/, "The id must be a positive integer.");
const codeSchema = z.string().trim().min(1).max(120).regex(
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  "Use lowercase letters, numbers, and single hyphens.",
);

export const attributeIdParamsSchema = z.object({ id: entityIdSchema });
export const attributeValueParamsSchema = z.object({
  id: entityIdSchema,
  valueId: entityIdSchema,
});
export const productTypeAttributeParamsSchema = z.object({
  productTypeId: entityIdSchema,
});

export const createProductAttributeSchema = z.object({
  name: z.string().trim().min(2).max(100),
  code: codeSchema.optional(),
  inputType: z.enum(["SELECT", "COLOR", "TEXT"]).default("SELECT"),
  isActive: z.boolean().optional(),
}).strict();

export const updateProductAttributeSchema = createProductAttributeSchema
  .partial()
  .refine((input) => Object.keys(input).length > 0, {
    message: "Provide at least one attribute field to update.",
  });

export const createProductAttributeValueSchema = z.object({
  label: z.string().trim().min(1).max(100),
  code: codeSchema.optional(),
  colorHex: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional(),
  sortOrder: z.coerce.number().int().min(0).max(1_000_000).optional(),
  isActive: z.boolean().optional(),
}).strict();

export const updateProductAttributeValueSchema = createProductAttributeValueSchema
  .partial()
  .refine((input) => Object.keys(input).length > 0, {
    message: "Provide at least one attribute value field to update.",
  });

export const setProductTypeAttributesSchema = z.object({
  attributes: z.array(z.object({
    attributeId: entityIdSchema,
    isRequired: z.boolean().optional(),
    sortOrder: z.coerce.number().int().min(0).max(1_000_000).optional(),
  }).strict()).max(50),
}).strict().superRefine(({ attributes }, context) => {
  const ids = new Set<string>();
  attributes.forEach((attribute, index) => {
    if (ids.has(attribute.attributeId)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Each attribute can be assigned only once.",
        path: ["attributes", index, "attributeId"],
      });
    }
    ids.add(attribute.attributeId);
  });
});

export const adminAttributeListQuerySchema = z.object({
  includeDeleted: z.enum(["true", "false"]).default("false").transform((value) => value === "true"),
});

export type CreateProductAttributeInput = z.infer<typeof createProductAttributeSchema>;
export type UpdateProductAttributeInput = z.infer<typeof updateProductAttributeSchema>;
export type CreateProductAttributeValueInput = z.infer<typeof createProductAttributeValueSchema>;
export type UpdateProductAttributeValueInput = z.infer<typeof updateProductAttributeValueSchema>;
export type SetProductTypeAttributesInput = z.infer<typeof setProductTypeAttributesSchema>;
