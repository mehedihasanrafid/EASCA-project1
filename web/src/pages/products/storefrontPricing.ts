import type { ProductPriceTier, ProductVariant } from "../../api/products";

const activeTiers = (variant: ProductVariant) => (variant.priceTiers ?? []).filter(
  (tier) =>
    tier.isActive !== false &&
    (tier.variantId === null || tier.variantId === variant.id),
);

export function eligibleStorefrontTier(
  variant: ProductVariant,
  quantity: number,
) {
  return activeTiers(variant)
    .filter((tier) => tier.minimumQuantity <= quantity)
    .sort((left, right) =>
      right.minimumQuantity - left.minimumQuantity ||
      Number(left.unitPrice) - Number(right.unitPrice) ||
      Number(right.variantId !== null) - Number(left.variantId !== null),
    )[0];
}

export function resolveStorefrontPricing(
  variant: ProductVariant,
  quantity: number,
) {
  const safeQuantity = Math.max(1, Math.trunc(quantity) || 1);
  const regularUnitPrice = Number(variant.regularPrice ?? variant.price);
  const baseUnitPrice = Number(variant.price);
  const tier = eligibleStorefrontTier(variant, safeQuantity);
  const unitPrice = Number(tier?.unitPrice ?? baseUnitPrice);
  const lineTotal = unitPrice * safeQuantity;
  const savingsTotal = Math.max(0, regularUnitPrice * safeQuantity - lineTotal);
  const discountPercentage = regularUnitPrice > unitPrice
    ? Math.round(((regularUnitPrice - unitPrice) / regularUnitPrice) * 100)
    : 0;
  const nextMinimumQuantity = activeTiers(variant)
    .map((candidate) => candidate.minimumQuantity)
    .filter((minimumQuantity) => minimumQuantity > safeQuantity)
    .sort((left, right) => left - right)[0];
  const nextTier = nextMinimumQuantity === undefined
    ? undefined
    : eligibleStorefrontTier(variant, nextMinimumQuantity);

  return {
    quantity: safeQuantity,
    regularUnitPrice,
    baseUnitPrice,
    unitPrice,
    lineTotal,
    savingsTotal,
    discountPercentage,
    source: tier
      ? "QUANTITY_TIER" as const
      : baseUnitPrice < regularUnitPrice
        ? "DISCOUNT" as const
        : "REGULAR" as const,
    tier: tier ?? null,
    nextTier: nextTier ?? null,
  };
}

export function storefrontTierSchedule(variant: ProductVariant) {
  const byMinimum = new Map<number, ProductPriceTier>();
  const minimums = [...new Set(activeTiers(variant).map((tier) => tier.minimumQuantity))]
    .sort((left, right) => left - right);

  for (const minimumQuantity of minimums) {
    const selected = eligibleStorefrontTier(variant, minimumQuantity);
    if (selected) byMinimum.set(minimumQuantity, selected);
  }

  return [...byMinimum.entries()].map(([minimumQuantity, tier]) => ({
    minimumQuantity,
    unitPrice: Number(tier.unitPrice),
    isPromotion: tier.isPromotion,
    variantId: tier.variantId,
  }));
}
