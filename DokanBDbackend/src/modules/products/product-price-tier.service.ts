import { In, type EntityManager } from "typeorm";

import { AppDataSource } from "../../database/data-source.js";
import { AppError } from "../../utils/app-error.js";
import { ProductPriceTier } from "./product-price-tier.entity.js";
import { ProductVariant } from "./product-variant.entity.js";
import { Product } from "./product.entity.js";
import type { ReplaceProductPriceTiersInput } from "./product.schema.js";

export function publicPriceTier(tier: ProductPriceTier) {
  return {
    id: tier.id,
    productId: tier.productId,
    variantId: tier.variantId,
    minimumQuantity: tier.minimumQuantity,
    unitPrice: tier.unitPrice,
    isPromotion: tier.isPromotion,
    isActive: tier.isActive,
  };
}

export async function loadProductPriceTiers(
  productIds: string[],
  manager?: EntityManager,
) {
  if (productIds.length === 0) return [];
  const repository = (manager ?? AppDataSource.manager).getRepository(ProductPriceTier);
  return repository.find({
    where: { productId: In(productIds) },
    order: { variantId: "ASC", minimumQuantity: "ASC", id: "ASC" },
  });
}

export async function replaceProductPriceTiers(
  productId: string,
  input: ReplaceProductPriceTiersInput,
) {
  const product = await AppDataSource.getRepository(Product).findOneBy({ id: productId });
  if (!product) throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found.");

  const variantIds = [...new Set(input.tiers.flatMap((tier) => tier.variantId ? [tier.variantId] : []))];
  if (variantIds.length > 0) {
    const variants = await AppDataSource.getRepository(ProductVariant).findBy({
      id: In(variantIds),
      productId,
    });
    if (variants.length !== variantIds.length) {
      throw new AppError(400, "PRICE_TIER_VARIANT_INVALID", "A price tier references a variant outside this product.");
    }
  }

  const signatures = new Set<string>();
  for (const tier of input.tiers) {
    const signature = `${tier.variantId ?? "all"}:${tier.minimumQuantity}`;
    if (signatures.has(signature)) {
      throw new AppError(409, "PRICE_TIER_DUPLICATE", "Each price scope can only have one tier for a minimum quantity.");
    }
    signatures.add(signature);
  }

  return AppDataSource.transaction(async (manager) => {
    const repository = manager.getRepository(ProductPriceTier);
    await repository.delete({ productId });
    const created = input.tiers.map((tier) => repository.create({
      productId,
      variantId: tier.variantId ?? null,
      minimumQuantity: tier.minimumQuantity,
      unitPrice: tier.unitPrice.toFixed(2),
      isPromotion: tier.isPromotion,
      isActive: tier.isActive,
    }));
    if (created.length > 0) await repository.save(created);
    return created.map(publicPriceTier);
  });
}
