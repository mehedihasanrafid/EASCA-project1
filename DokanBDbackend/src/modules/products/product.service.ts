import { In, type SelectQueryBuilder } from "typeorm";

import { AppDataSource } from "../../database/data-source.js";
import { AppError } from "../../utils/app-error.js";
import { Brand } from "../brands/brand.entity.js";
import { Category } from "../categories/category.entity.js";
import { InventoryMovement } from "../inventory/inventory-movement.entity.js";
import { ProductType } from "../product-types/product-type.entity.js";
import { Vendor } from "../vendors/vendor.entity.js";
import { ProductMedia } from "./product-media.entity.js";
import { ProductVariant } from "./product-variant.entity.js";
import { Product } from "./product.entity.js";
import type {
  AdminProductListQuery,
  CreateProductInput,
  CreateProductVariantInput,
  ProductSearchSuggestionsQuery,
  PublicProductListQuery,
  UpdateProductInput,
  UpdateProductVariantInput,
} from "./product.schema.js";

interface CatalogAssociations {
  variantsByProduct: Map<string, ProductVariant[]>;
  mediaByProduct: Map<string, ProductMedia[]>;
}

function productRepository() {
  return AppDataSource.getRepository(Product);
}

function createSlug(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 220)
    .replace(/-+$/g, "");

  if (!slug) {
    throw new AppError(
      400,
      "PRODUCT_SLUG_REQUIRED",
      "Provide an English slug when the product name cannot form one.",
    );
  }

  return slug;
}

function money(value: number) {
  return value.toFixed(2);
}

function toPublicVariant(variant: ProductVariant) {
  return {
    id: variant.id,
    sku: variant.sku,
    barcode: variant.barcode,
    name: variant.variantName,
    color: variant.color,
    size: variant.size,
    price: variant.price,
    stockQuantity: variant.stockQuantity,
    inStock: variant.stockQuantity > 0,
    weight: variant.weight,
    isDefault: variant.isDefault,
  };
}

function toAdminVariant(variant: ProductVariant) {
  return {
    ...toPublicVariant(variant),
    vendorId: variant.vendorId,
    costPrice: variant.costPrice,
    lowStockLevel: variant.lowStockLevel,
    isActive: variant.isActive,
    createdAt: variant.createdAt,
    updatedAt: variant.updatedAt,
    deletedAt: variant.deletedAt,
  };
}

function toPublicMedia(media: ProductMedia) {
  return {
    id: media.id,
    variantId: media.variantId,
    type: media.mediaType,
    url: media.url,
    thumbnailUrl: media.thumbnailUrl,
    altText: media.altText,
    sortOrder: media.sortOrder,
    isPrimary: media.isPrimary,
  };
}

function totalStock(variants: ProductVariant[]) {
  return variants.reduce((sum, variant) => sum + variant.stockQuantity, 0);
}

function toPublicProduct(
  product: Product,
  variants: ProductVariant[],
  media: ProductMedia[],
  includeDetail: boolean,
) {
  const stockQuantity = totalStock(variants);
  const primaryMedia =
    media.find((item) => item.mediaType === "IMAGE" && item.isPrimary) ??
    media.find((item) => item.mediaType === "IMAGE") ??
    null;

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    shortDescription: product.shortDescription,
    ...(includeDetail ? { description: product.description } : {}),
    price: product.discountPrice ?? product.defaultPrice,
    regularPrice: product.defaultPrice,
    discountPrice: product.discountPrice,
    isFeatured: product.isFeatured,
    category: {
      id: product.category.id,
      name: product.category.name,
      slug: product.category.slug,
    },
    productType: {
      id: product.productType.id,
      name: product.productType.name,
      slug: product.productType.slug,
    },
    brand: product.brand
      ? {
          id: product.brand.id,
          name: product.brand.name,
          slug: product.brand.slug,
        }
      : null,
    stockQuantity,
    inStock: stockQuantity > 0,
    primaryImage: primaryMedia ? toPublicMedia(primaryMedia) : null,
    media: media.map(toPublicMedia),
    ...(includeDetail
      ? {
          variants: variants.map(toPublicVariant),
        }
      : {}),
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

function toAdminProduct(
  product: Product,
  variants: ProductVariant[],
  media: ProductMedia[],
  includeDetail: boolean,
) {
  return {
    ...toPublicProduct(product, variants, media, includeDetail),
    productTypeId: product.productTypeId,
    categoryId: product.categoryId,
    brandId: product.brandId,
    defaultCostPrice: product.defaultCostPrice,
    status: product.status,
    isActive: product.isActive,
    deletedAt: product.deletedAt,
    ...(includeDetail ? { variants: variants.map(toAdminVariant) } : {}),
  };
}

function applyCategoryFilter(
  query: SelectQueryBuilder<Product>,
  category: string | undefined,
) {
  if (!category) return;

  if (/^[1-9]\d*$/.test(category)) {
    query.andWhere("category.id = :categoryId", { categoryId: category });
  } else {
    query.andWhere("category.slug = :categorySlug", {
      categorySlug: category.toLowerCase(),
    });
  }
}

function applySearchFilter(
  query: SelectQueryBuilder<Product>,
  search: string | undefined,
) {
  if (!search) return;

  query.andWhere(
    "(LOWER(product.name) LIKE :search OR LOWER(product.slug) LIKE :search)",
    { search: `%${search.toLowerCase()}%` },
  );
}

function applyPublicSearchFilter(
  query: SelectQueryBuilder<Product>,
  search: string | undefined,
) {
  if (!search) return;

  query
    .leftJoin(
      ProductVariant,
      "searchVariant",
      "searchVariant.productId = product.id AND searchVariant.isActive = :active AND searchVariant.deletedAt IS NULL",
    )
    .andWhere(
      `(
        LOWER(product.name) LIKE :search
        OR LOWER(product.slug) LIKE :search
        OR LOWER(category.name) LIKE :search
        OR LOWER(COALESCE(brand.name, '')) LIKE :search
        OR LOWER(searchVariant.sku) LIKE :search
      )`,
      { search: `%${search.toLowerCase()}%` },
    )
    .distinct(true);
}

async function loadProductsByIds(ids: string[], includeDeleted: boolean) {
  if (ids.length === 0) return [];

  const query = productRepository().createQueryBuilder("product");

  if (includeDeleted) query.withDeleted();

  query
    .innerJoinAndSelect("product.category", "category")
    .innerJoinAndSelect("product.productType", "productType")
    .leftJoinAndSelect("product.brand", "brand")
    .where("product.id IN (:...ids)", { ids });

  const products = await query.getMany();
  const byId = new Map(products.map((product) => [product.id, product]));
  return ids.flatMap((id) => {
    const product = byId.get(id);
    return product ? [product] : [];
  });
}

async function loadAssociations(
  productIds: string[],
  options: { publicOnly: boolean; includeDeletedVariants?: boolean },
): Promise<CatalogAssociations> {
  const variantsByProduct = new Map<string, ProductVariant[]>();
  const mediaByProduct = new Map<string, ProductMedia[]>();

  if (productIds.length === 0) {
    return { variantsByProduct, mediaByProduct };
  }

  const variantQuery = AppDataSource.getRepository(ProductVariant)
    .createQueryBuilder("variant")
    .where("variant.productId IN (:...productIds)", { productIds })
    .orderBy("variant.isDefault", "DESC")
    .addOrderBy("variant.id", "ASC");

  if (options.publicOnly) {
    variantQuery.andWhere("variant.isActive = :active", { active: true });
  }

  if (options.includeDeletedVariants) {
    variantQuery.withDeleted();
  }

  const [variants, media] = await Promise.all([
    variantQuery.getMany(),
    AppDataSource.getRepository(ProductMedia).find({
      where: { productId: In(productIds) },
      order: { sortOrder: "ASC", id: "ASC" },
    }),
  ]);

  for (const variant of variants) {
    const group = variantsByProduct.get(variant.productId) ?? [];
    group.push(variant);
    variantsByProduct.set(variant.productId, group);
  }

  for (const item of media) {
    const group = mediaByProduct.get(item.productId) ?? [];
    group.push(item);
    mediaByProduct.set(item.productId, group);
  }

  return { variantsByProduct, mediaByProduct };
}

async function assertSlugAvailable(slug: string, ignoredId?: string) {
  const query = productRepository()
    .createQueryBuilder("product")
    .withDeleted()
    .where("LOWER(product.slug) = :slug", { slug: slug.toLowerCase() });

  if (ignoredId) {
    query.andWhere("product.id != :ignoredId", { ignoredId });
  }

  if (await query.getOne()) {
    throw new AppError(
      409,
      "PRODUCT_SLUG_EXISTS",
      "A product with this slug already exists.",
    );
  }
}

async function assertProductRelations(
  productTypeId: string,
  categoryId: string,
  brandId: string | null,
) {
  const [productType, category, brand] = await Promise.all([
    AppDataSource.getRepository(ProductType).findOneBy({
      id: productTypeId,
      isActive: true,
    }),
    AppDataSource.getRepository(Category).findOneBy({
      id: categoryId,
      isActive: true,
    }),
    brandId
      ? AppDataSource.getRepository(Brand).findOneBy({
          id: brandId,
          isActive: true,
        })
      : Promise.resolve(null),
  ]);

  if (!productType) {
    throw new AppError(
      400,
      "PRODUCT_TYPE_INVALID",
      "The selected product type does not exist or is inactive.",
    );
  }

  if (!category) {
    throw new AppError(
      400,
      "PRODUCT_CATEGORY_INVALID",
      "The selected category does not exist or is inactive.",
    );
  }

  if (brandId && !brand) {
    throw new AppError(
      400,
      "PRODUCT_BRAND_INVALID",
      "The selected brand does not exist or is inactive.",
    );
  }
}

async function assertVendor(vendorId: string | null | undefined) {
  if (!vendorId) return;

  const vendor = await AppDataSource.getRepository(Vendor).findOneBy({
    id: vendorId,
    isActive: true,
  });

  if (!vendor) {
    throw new AppError(
      400,
      "PRODUCT_VENDOR_INVALID",
      "The selected vendor does not exist or is inactive.",
    );
  }
}

async function assertVariantIdentifiersAvailable(
  sku: string | undefined,
  barcode: string | null | undefined,
  ignoredId?: string,
) {
  const repository = AppDataSource.getRepository(ProductVariant);

  if (sku) {
    const query = repository
      .createQueryBuilder("variant")
      .withDeleted()
      .where("LOWER(variant.sku) = :sku", { sku: sku.toLowerCase() });

    if (ignoredId) query.andWhere("variant.id != :ignoredId", { ignoredId });

    if (await query.getOne()) {
      throw new AppError(
        409,
        "PRODUCT_SKU_EXISTS",
        "A product variant with this SKU already exists.",
      );
    }
  }

  if (barcode) {
    const query = repository
      .createQueryBuilder("variant")
      .withDeleted()
      .where("variant.barcode = :barcode", { barcode });

    if (ignoredId) query.andWhere("variant.id != :ignoredId", { ignoredId });

    if (await query.getOne()) {
      throw new AppError(
        409,
        "PRODUCT_BARCODE_EXISTS",
        "A product variant with this barcode already exists.",
      );
    }
  }
}

export async function listPublicProducts(input: PublicProductListQuery) {
  const effectivePrice = "COALESCE(product.discountPrice, product.defaultPrice)";
  const query = productRepository()
    .createQueryBuilder("product")
    .innerJoin("product.category", "category")
    .leftJoin("product.brand", "brand")
    .where("product.status = :status", { status: "ACTIVE" })
    .andWhere("product.isActive = :active", { active: true })
    .andWhere("category.isActive = :active", { active: true });

  applyPublicSearchFilter(query, input.search);
  applyCategoryFilter(query, input.category);

  if (input.minPrice !== undefined) {
    query.andWhere(`${effectivePrice} >= :minPrice`, { minPrice: input.minPrice });
  }

  if (input.maxPrice !== undefined) {
    query.andWhere(`${effectivePrice} <= :maxPrice`, { maxPrice: input.maxPrice });
  }

  const total = await query.getCount();
  const pageQuery = query.clone().select("product.id", "id");

  switch (input.sort) {
    case "price_asc":
      pageQuery.orderBy(effectivePrice, "ASC").addOrderBy("product.id", "ASC");
      break;
    case "price_desc":
      pageQuery.orderBy(effectivePrice, "DESC").addOrderBy("product.id", "ASC");
      break;
    case "name_asc":
      pageQuery.orderBy("product.name", "ASC").addOrderBy("product.id", "ASC");
      break;
    default:
      pageQuery.orderBy("product.createdAt", "DESC").addOrderBy("product.id", "DESC");
  }

  const rawIds = await pageQuery
    .offset((input.page - 1) * input.limit)
    .limit(input.limit)
    .getRawMany<{ id: string | number }>();
  const ids = rawIds.map(({ id }) => String(id));
  const products = await loadProductsByIds(ids, false);
  const associations = await loadAssociations(ids, { publicOnly: true });

  return {
    products: products.map((product) =>
      toPublicProduct(
        product,
        associations.variantsByProduct.get(product.id) ?? [],
        associations.mediaByProduct.get(product.id) ?? [],
        false,
      ),
    ),
    pagination: {
      page: input.page,
      limit: input.limit,
      total,
      totalPages: Math.ceil(total / input.limit),
    },
  };
}

export async function getProductSearchSuggestions(
  input: ProductSearchSuggestionsQuery,
) {
  const normalizedQuery = input.q.toLowerCase();
  const query = productRepository()
    .createQueryBuilder("product")
    .innerJoin("product.category", "category")
    .leftJoin("product.brand", "brand")
    .where("product.status = :status", { status: "ACTIVE" })
    .andWhere("product.isActive = :active", { active: true })
    .andWhere("category.isActive = :active", { active: true });

  applyPublicSearchFilter(query, input.q);

  const rawIds = await query
    .select("product.id", "id")
    .addSelect(
      `CASE
        WHEN LOWER(product.name) = :exactSearch THEN 0
        WHEN LOWER(product.name) LIKE :prefixSearch THEN 1
        ELSE 2
      END`,
      "searchRank",
    )
    .setParameters({
      exactSearch: normalizedQuery,
      prefixSearch: `${normalizedQuery}%`,
    })
    .orderBy("searchRank", "ASC")
    .addOrderBy("product.name", "ASC")
    .addOrderBy("product.id", "ASC")
    .limit(input.limit)
    .getRawMany<{ id: string | number }>();
  const ids = rawIds.map(({ id }) => String(id));
  const products = await loadProductsByIds(ids, false);
  const associations = await loadAssociations(ids, { publicOnly: true });

  return products.map((product) => {
    const publicProduct = toPublicProduct(
      product,
      associations.variantsByProduct.get(product.id) ?? [],
      associations.mediaByProduct.get(product.id) ?? [],
      false,
    );

    return {
      id: publicProduct.id,
      name: publicProduct.name,
      slug: publicProduct.slug,
      price: publicProduct.price,
      regularPrice: publicProduct.regularPrice,
      discountPrice: publicProduct.discountPrice,
      category: publicProduct.category,
      brand: publicProduct.brand,
      inStock: publicProduct.inStock,
      thumbnail: publicProduct.primaryImage
        ? {
            url:
              publicProduct.primaryImage.thumbnailUrl ??
              publicProduct.primaryImage.url,
            altText: publicProduct.primaryImage.altText,
          }
        : null,
    };
  });
}

export async function getPublicProduct(identifier: string) {
  const query = productRepository()
    .createQueryBuilder("product")
    .innerJoinAndSelect("product.category", "category")
    .innerJoinAndSelect("product.productType", "productType")
    .leftJoinAndSelect("product.brand", "brand")
    .where("product.status = :status", { status: "ACTIVE" })
    .andWhere("product.isActive = :active", { active: true })
    .andWhere("category.isActive = :active", { active: true });

  if (/^[1-9]\d*$/.test(identifier)) {
    query.andWhere("product.id = :id", { id: identifier });
  } else {
    query.andWhere("product.slug = :slug", { slug: identifier.toLowerCase() });
  }

  const product = await query.getOne();

  if (!product) {
    throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found.");
  }

  const associations = await loadAssociations([product.id], {
    publicOnly: true,
  });

  return toPublicProduct(
    product,
    associations.variantsByProduct.get(product.id) ?? [],
    associations.mediaByProduct.get(product.id) ?? [],
    true,
  );
}

export async function listAdminProducts(input: AdminProductListQuery) {
  const query = productRepository()
    .createQueryBuilder("product")
    .leftJoin("product.category", "category");

  if (input.includeDeleted) query.withDeleted();
  if (input.status) query.andWhere("product.status = :status", { status: input.status });
  applySearchFilter(query, input.search);
  applyCategoryFilter(query, input.category);

  const total = await query.getCount();
  const rawIds = await query
    .clone()
    .select("product.id", "id")
    .orderBy("product.createdAt", "DESC")
    .addOrderBy("product.id", "DESC")
    .offset((input.page - 1) * input.limit)
    .limit(input.limit)
    .getRawMany<{ id: string | number }>();
  const ids = rawIds.map(({ id }) => String(id));
  const products = await loadProductsByIds(ids, input.includeDeleted);
  const associations = await loadAssociations(ids, {
    publicOnly: false,
    includeDeletedVariants: input.includeDeleted,
  });

  return {
    products: products.map((product) =>
      toAdminProduct(
        product,
        associations.variantsByProduct.get(product.id) ?? [],
        associations.mediaByProduct.get(product.id) ?? [],
        false,
      ),
    ),
    pagination: {
      page: input.page,
      limit: input.limit,
      total,
      totalPages: Math.ceil(total / input.limit),
    },
  };
}

export async function getAdminProduct(productId: string) {
  const products = await loadProductsByIds([productId], true);
  const product = products[0];

  if (!product) {
    throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found.");
  }

  const associations = await loadAssociations([product.id], {
    publicOnly: false,
    includeDeletedVariants: true,
  });

  return toAdminProduct(
    product,
    associations.variantsByProduct.get(product.id) ?? [],
    associations.mediaByProduct.get(product.id) ?? [],
    true,
  );
}

export async function createProduct(input: CreateProductInput) {
  const slug = input.slug ?? createSlug(input.name);
  await Promise.all([
    assertSlugAvailable(slug),
    assertProductRelations(
      input.productTypeId,
      input.categoryId,
      input.brandId ?? null,
    ),
  ]);

  const repository = productRepository();
  const product = repository.create({
    productTypeId: input.productTypeId,
    categoryId: input.categoryId,
    brandId: input.brandId ?? null,
    name: input.name,
    slug,
    shortDescription: input.shortDescription ?? null,
    description: input.description,
    defaultPrice: money(input.defaultPrice),
    defaultCostPrice:
      input.defaultCostPrice === undefined || input.defaultCostPrice === null
        ? null
        : money(input.defaultCostPrice),
    discountPrice:
      input.discountPrice === undefined || input.discountPrice === null
        ? null
        : money(input.discountPrice),
    status: input.status ?? "DRAFT",
    isFeatured: input.isFeatured ?? false,
    isActive: input.isActive ?? true,
  });

  await repository.save(product);
  return getAdminProduct(product.id);
}

export async function updateProduct(
  productId: string,
  input: UpdateProductInput,
) {
  const repository = productRepository();
  const product = await repository.findOneBy({ id: productId });

  if (!product) {
    throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found.");
  }

  const productTypeId = input.productTypeId ?? product.productTypeId;
  const categoryId = input.categoryId ?? product.categoryId;
  const brandId = input.brandId === undefined ? product.brandId : input.brandId;

  await assertProductRelations(productTypeId, categoryId, brandId);

  if (input.slug !== undefined) {
    await assertSlugAvailable(input.slug, product.id);
    product.slug = input.slug;
  }

  const defaultPrice = input.defaultPrice ?? Number(product.defaultPrice);
  const discountPrice =
    input.discountPrice === undefined
      ? product.discountPrice === null
        ? null
        : Number(product.discountPrice)
      : input.discountPrice;

  if (discountPrice !== null && discountPrice > defaultPrice) {
    throw new AppError(
      400,
      "PRODUCT_DISCOUNT_INVALID",
      "discountPrice cannot be greater than defaultPrice.",
    );
  }

  product.productTypeId = productTypeId;
  product.categoryId = categoryId;
  product.brandId = brandId;
  if (input.name !== undefined) product.name = input.name;
  if (input.shortDescription !== undefined) {
    product.shortDescription = input.shortDescription;
  }
  if (input.description !== undefined) product.description = input.description;
  if (input.defaultPrice !== undefined) product.defaultPrice = money(input.defaultPrice);
  if (input.defaultCostPrice !== undefined) {
    product.defaultCostPrice =
      input.defaultCostPrice === null ? null : money(input.defaultCostPrice);
  }
  if (input.discountPrice !== undefined) {
    product.discountPrice =
      input.discountPrice === null ? null : money(input.discountPrice);
  }
  if (input.status !== undefined) product.status = input.status;
  if (input.isFeatured !== undefined) product.isFeatured = input.isFeatured;
  if (input.isActive !== undefined) product.isActive = input.isActive;

  await repository.save(product);
  return getAdminProduct(product.id);
}

export async function deleteProduct(productId: string) {
  const repository = productRepository();
  const product = await repository.findOneBy({ id: productId });

  if (!product) {
    throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found.");
  }

  await repository.softRemove(product);
}

export async function restoreProduct(productId: string) {
  const repository = productRepository();
  const product = await repository.findOne({
    where: { id: productId },
    withDeleted: true,
  });

  if (!product) {
    throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found.");
  }

  if (!product.deletedAt) {
    throw new AppError(409, "PRODUCT_NOT_DELETED", "This product is not deleted.");
  }

  await assertProductRelations(
    product.productTypeId,
    product.categoryId,
    product.brandId,
  );
  await repository.restore(product.id);
  return getAdminProduct(product.id);
}

export async function createProductVariant(
  productId: string,
  input: CreateProductVariantInput,
  actorUserId: string,
) {
  const product = await productRepository().findOneBy({ id: productId });

  if (!product) {
    throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found.");
  }

  await Promise.all([
    assertVendor(input.vendorId),
    assertVariantIdentifiersAvailable(input.sku, input.barcode),
  ]);

  return AppDataSource.transaction(async (manager) => {
    const repository = manager.getRepository(ProductVariant);
    const existingCount = await repository.countBy({ productId });
    const shouldBeDefault = input.isDefault === true || existingCount === 0;

    if (shouldBeDefault) {
      await repository.update(
        { productId, isDefault: true },
        { isDefault: false },
      );
    }

    const variant = repository.create({
      productId,
      vendorId: input.vendorId ?? null,
      sku: input.sku,
      barcode: input.barcode ?? null,
      variantName: input.variantName ?? null,
      color: input.color ?? null,
      size: input.size ?? null,
      price: money(input.price),
      costPrice:
        input.costPrice === undefined || input.costPrice === null
          ? null
          : money(input.costPrice),
      stockQuantity: input.stockQuantity ?? 0,
      lowStockLevel: input.lowStockLevel ?? 5,
      weight:
        input.weight === undefined || input.weight === null
          ? null
          : money(input.weight),
      isDefault: shouldBeDefault,
      isActive: input.isActive ?? true,
    });

    await repository.save(variant);

    if (variant.stockQuantity > 0) {
      await manager.getRepository(InventoryMovement).save(
        manager.getRepository(InventoryMovement).create({
          productVariantId: variant.id,
          movementType: "INITIAL_STOCK",
          quantity: variant.stockQuantity,
          quantityBefore: 0,
          quantityAfter: variant.stockQuantity,
          referenceType: "PRODUCT_VARIANT",
          referenceId: variant.id,
          note: "Initial stock set when the variant was created.",
          createdById: actorUserId,
        }),
      );
    }

    return toAdminVariant(variant);
  });
}

export async function updateProductVariant(
  productId: string,
  variantId: string,
  input: UpdateProductVariantInput,
  actorUserId: string,
) {
  await Promise.all([
    assertVendor(input.vendorId),
    assertVariantIdentifiersAvailable(input.sku, input.barcode, variantId),
  ]);

  return AppDataSource.transaction(async (manager) => {
    const repository = manager.getRepository(ProductVariant);
    const variant = await repository.findOneBy({ id: variantId, productId });

    if (!variant) {
      throw new AppError(
        404,
        "PRODUCT_VARIANT_NOT_FOUND",
        "Product variant not found.",
      );
    }

    if (input.isDefault === true) {
      await repository.update(
        { productId, isDefault: true },
        { isDefault: false },
      );
    }

    const quantityBefore = variant.stockQuantity;
    if (input.vendorId !== undefined) variant.vendorId = input.vendorId;
    if (input.sku !== undefined) variant.sku = input.sku;
    if (input.barcode !== undefined) variant.barcode = input.barcode;
    if (input.variantName !== undefined) variant.variantName = input.variantName;
    if (input.color !== undefined) variant.color = input.color;
    if (input.size !== undefined) variant.size = input.size;
    if (input.price !== undefined) variant.price = money(input.price);
    if (input.costPrice !== undefined) {
      variant.costPrice = input.costPrice === null ? null : money(input.costPrice);
    }
    if (input.stockQuantity !== undefined) {
      variant.stockQuantity = input.stockQuantity;
    }
    if (input.lowStockLevel !== undefined) {
      variant.lowStockLevel = input.lowStockLevel;
    }
    if (input.weight !== undefined) {
      variant.weight = input.weight === null ? null : money(input.weight);
    }
    if (input.isDefault !== undefined) variant.isDefault = input.isDefault;
    if (input.isActive !== undefined) variant.isActive = input.isActive;

    await repository.save(variant);

    if (
      input.stockQuantity !== undefined &&
      input.stockQuantity !== quantityBefore
    ) {
      await manager.getRepository(InventoryMovement).save(
        manager.getRepository(InventoryMovement).create({
          productVariantId: variant.id,
          movementType: "ADJUSTMENT",
          quantity: input.stockQuantity - quantityBefore,
          quantityBefore,
          quantityAfter: input.stockQuantity,
          referenceType: "PRODUCT_VARIANT",
          referenceId: variant.id,
          note: "Stock adjusted through product variant administration.",
          createdById: actorUserId,
        }),
      );
    }

    return toAdminVariant(variant);
  });
}

export async function deleteProductVariant(
  productId: string,
  variantId: string,
) {
  await AppDataSource.transaction(async (manager) => {
    const repository = manager.getRepository(ProductVariant);
    const variant = await repository.findOneBy({ id: variantId, productId });

    if (!variant) {
      throw new AppError(
        404,
        "PRODUCT_VARIANT_NOT_FOUND",
        "Product variant not found.",
      );
    }

    const wasDefault = variant.isDefault;
    await repository.softRemove(variant);

    if (wasDefault) {
      const replacement = await repository.findOne({
        where: { productId, isActive: true },
        order: { id: "ASC" },
      });

      if (replacement) {
        replacement.isDefault = true;
        await repository.save(replacement);
      }
    }
  });
}
