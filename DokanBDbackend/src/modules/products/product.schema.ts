import { z } from "zod";

const entityIdSchema = z
  .string()
  .regex(/^[1-9]\d*$/, "The id must be a positive integer.");

const moneySchema = z.coerce.number().finite().min(0).max(999_999_999.99);
const optionalMoneySchema = z.union([moneySchema, z.null()]).optional();

export const productStatusSchema = z.enum([
  "DRAFT",
  "ACTIVE",
  "INACTIVE",
  "DISCONTINUED",
]);

export const publicProductListQuerySchema = z
  .object({
    search: z.string().trim().min(1).max(100).optional(),
    category: z.string().trim().min(1).max(120).optional(),
    minPrice: moneySchema.optional(),
    maxPrice: moneySchema.optional(),
    sort: z
      .enum(["newest", "price_asc", "price_desc", "name_asc"])
      .default("newest"),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .refine(
    ({ minPrice, maxPrice }) =>
      minPrice === undefined || maxPrice === undefined || minPrice <= maxPrice,
    { message: "minPrice cannot be greater than maxPrice.", path: ["minPrice"] },
  );

export const productSearchSuggestionsQuerySchema = z.object({
  q: z.string().trim().min(2).max(100),
  limit: z.coerce.number().int().min(1).max(10).default(8),
});

export const adminProductListQuerySchema = z.object({
  search: z.string().trim().min(1).max(100).optional(),
  category: z.string().trim().min(1).max(120).optional(),
  status: productStatusSchema.optional(),
  includeDeleted: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const productIdentifierParamsSchema = z.object({
  identifier: z.string().trim().min(1).max(220),
});

export const productIdParamsSchema = z.object({ id: entityIdSchema });

export const productVariantParamsSchema = z.object({
  productId: entityIdSchema,
  variantId: entityIdSchema,
});

export const productIdForVariantParamsSchema = z.object({
  productId: entityIdSchema,
});

const productFields = {
  productTypeId: entityIdSchema,
  categoryId: entityIdSchema,
  brandId: z.union([entityIdSchema, z.null()]).optional(),
  name: z.string().trim().min(2).max(200),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(220)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Use lowercase letters, numbers, and single hyphens.",
    )
    .optional(),
  shortDescription: z
    .union([z.string().trim().max(500), z.null()])
    .optional(),
  description: z.string().trim().min(1).max(65_535),
  defaultPrice: moneySchema,
  defaultCostPrice: optionalMoneySchema,
  discountPrice: optionalMoneySchema,
  status: productStatusSchema.optional(),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
};

export const createProductSchema = z
  .object(productFields)
  .strict()
  .refine(
    ({ defaultPrice, discountPrice }) =>
      discountPrice === undefined ||
      discountPrice === null ||
      discountPrice <= defaultPrice,
    {
      message: "discountPrice cannot be greater than defaultPrice.",
      path: ["discountPrice"],
    },
  );

export const updateProductSchema = z
  .object({
    productTypeId: productFields.productTypeId.optional(),
    categoryId: productFields.categoryId.optional(),
    brandId: productFields.brandId,
    name: productFields.name.optional(),
    slug: productFields.slug,
    shortDescription: productFields.shortDescription,
    description: productFields.description.optional(),
    defaultPrice: productFields.defaultPrice.optional(),
    defaultCostPrice: productFields.defaultCostPrice,
    discountPrice: productFields.discountPrice,
    status: productFields.status,
    isFeatured: productFields.isFeatured,
    isActive: productFields.isActive,
  })
  .strict()
  .refine((input) => Object.keys(input).length > 0, {
    message: "Provide at least one product field to update.",
  });

const variantFields = {
  vendorId: z.union([entityIdSchema, z.null()]).optional(),
  sku: z.string().trim().min(1).max(100),
  barcode: z.union([z.string().trim().min(1).max(100), z.null()]).optional(),
  variantName: z
    .union([z.string().trim().min(1).max(150), z.null()])
    .optional(),
  color: z.union([z.string().trim().min(1).max(100), z.null()]).optional(),
  size: z.union([z.string().trim().min(1).max(100), z.null()]).optional(),
  price: moneySchema,
  costPrice: optionalMoneySchema,
  stockQuantity: z.coerce.number().int().min(0).max(2_147_483_647).optional(),
  lowStockLevel: z.coerce.number().int().min(0).max(2_147_483_647).optional(),
  weight: z.union([z.coerce.number().finite().min(0).max(99_999_999.99), z.null()]).optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
};

export const createProductVariantSchema = z.object(variantFields).strict();

export const updateProductVariantSchema = z
  .object({
    vendorId: variantFields.vendorId,
    sku: variantFields.sku.optional(),
    barcode: variantFields.barcode,
    variantName: variantFields.variantName,
    color: variantFields.color,
    size: variantFields.size,
    price: variantFields.price.optional(),
    costPrice: variantFields.costPrice,
    stockQuantity: variantFields.stockQuantity,
    lowStockLevel: variantFields.lowStockLevel,
    weight: variantFields.weight,
    isDefault: variantFields.isDefault,
    isActive: variantFields.isActive,
  })
  .strict()
  .refine((input) => Object.keys(input).length > 0, {
    message: "Provide at least one variant field to update.",
  });

export type PublicProductListQuery = z.infer<
  typeof publicProductListQuerySchema
>;
export type ProductSearchSuggestionsQuery = z.infer<
  typeof productSearchSuggestionsQuerySchema
>;
export type AdminProductListQuery = z.infer<
  typeof adminProductListQuerySchema
>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CreateProductVariantInput = z.infer<
  typeof createProductVariantSchema
>;
export type UpdateProductVariantInput = z.infer<
  typeof updateProductVariantSchema
>;
