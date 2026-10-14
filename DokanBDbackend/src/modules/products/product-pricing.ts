import type { ProductPriceTier } from "./product-price-tier.entity.js";
import type { ProductVariant } from "./product-variant.entity.js";

type DateLike = Date | string | null | undefined;

function timestamp(value: DateLike) {
  if (!value) return null;
  const result = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(result) ? result : null;
}

export function isDiscountActive(
  discountPrice: string | null,
  startsAt: DateLike,
  endsAt: DateLike,
  now = new Date(),
) {
  if (discountPrice === null) return false;
  const current = now.getTime();
  const start = timestamp(startsAt);
  const end = timestamp(endsAt);
  return (start === null || start <= current) && (end === null || current <= end);
}

export function activeDiscountPrice(
  regularPrice: string,
  discountPrice: string | null,
  startsAt: DateLike,
  endsAt: DateLike,
  now = new Date(),
) {
  return isDiscountActive(discountPrice, startsAt, endsAt, now)
    ? discountPrice ?? regularPrice
    : regularPrice;
}

export function effectiveVariantPrice(
  variant: ProductVariant,
  quantity: number,
  tiers: ProductPriceTier[],
  now = new Date(),
) {
  return effectiveVariantPricing(variant, quantity, tiers, now).unitPrice;
}

export function eligiblePriceTier(
  variant: Pick<ProductVariant, "id" | "productId">,
  quantity: number,
  tiers: ProductPriceTier[],
) {
  return tiers
    .filter((tier) =>
      tier.isActive &&
      tier.productId === variant.productId &&
      tier.minimumQuantity <= quantity &&
      (tier.variantId === null || tier.variantId === variant.id),
    )
    .sort((left, right) =>
      right.minimumQuantity - left.minimumQuantity ||
      Number(left.unitPrice) - Number(right.unitPrice) ||
      Number(right.variantId !== null) - Number(left.variantId !== null),
    )[0];
}

export function effectiveVariantPricing(
  variant: ProductVariant,
  quantity: number,
  tiers: ProductPriceTier[],
  now = new Date(),
) {
  const baseUnitPrice = activeDiscountPrice(
    variant.price,
    variant.discountPrice,
    variant.discountStartsAt,
    variant.discountEndsAt,
    now,
  );
  const tier = eligiblePriceTier(variant, quantity, tiers);

  return {
    regularUnitPrice: variant.price,
    baseUnitPrice,
    unitPrice: tier?.unitPrice ?? baseUnitPrice,
    source: tier
      ? "QUANTITY_TIER" as const
      : baseUnitPrice !== variant.price
        ? "DISCOUNT" as const
        : "REGULAR" as const,
    tier: tier ?? null,
  };
}
