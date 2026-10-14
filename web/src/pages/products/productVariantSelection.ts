import type { ProductOption, ProductVariant } from "../../api/products";

export type ProductOptionSelection = Record<string, string>;

export interface StorefrontOptionValueState {
  id: string;
  label: string;
  code: string;
  colorHex: string | null;
  inStock: boolean;
}

const variantValueMap = (variant: ProductVariant) => new Map(
  variant.optionValues.map((value) => [value.attribute.id, value.id]),
);

const variantMatchesSelection = (
  variant: ProductVariant,
  selection: ProductOptionSelection,
) => {
  const values = variantValueMap(variant);
  return Object.entries(selection).every(
    ([attributeId, valueId]) => values.get(attributeId) === valueId,
  );
};

export function selectionFromVariant(variant?: ProductVariant): ProductOptionSelection {
  return Object.fromEntries(
    (variant?.optionValues ?? []).map((value) => [value.attribute.id, value.id]),
  );
}

export function findExactStorefrontVariant(
  variants: ProductVariant[],
  selection: ProductOptionSelection,
) {
  const selectedCount = Object.keys(selection).length;
  if (selectedCount === 0) return undefined;

  return variants.find(
    (variant) =>
      variant.inStock &&
      variant.optionValues.length === selectedCount &&
      variantMatchesSelection(variant, selection),
  );
}

export function changeStorefrontOption(
  options: ProductOption[],
  variants: ProductVariant[],
  current: ProductOptionSelection,
  attributeId: string,
  valueId: string,
) {
  const changedIndex = options.findIndex((option) => option.attribute.id === attributeId);
  if (changedIndex < 0) {
    return { selection: current, variant: findExactStorefrontVariant(variants, current) };
  }

  if (current[attributeId] === valueId) {
    return { selection: current, variant: findExactStorefrontVariant(variants, current) };
  }

  const selection: ProductOptionSelection = {};
  for (const option of options.slice(0, changedIndex)) {
    const selectedValueId = current[option.attribute.id];
    if (selectedValueId) selection[option.attribute.id] = selectedValueId;
  }
  selection[attributeId] = valueId;

  return {
    selection,
    variant: findExactStorefrontVariant(variants, selection),
  };
}

export function storefrontOptionValueStates(
  options: ProductOption[],
  variants: ProductVariant[],
  selection: ProductOptionSelection,
  attributeId: string,
): StorefrontOptionValueState[] {
  const optionIndex = options.findIndex((option) => option.attribute.id === attributeId);
  if (optionIndex < 0) return [];

  const parentSelection: ProductOptionSelection = {};
  for (const parent of options.slice(0, optionIndex)) {
    const selectedValueId = selection[parent.attribute.id];
    if (!selectedValueId) return [];
    parentSelection[parent.attribute.id] = selectedValueId;
  }

  const option = options[optionIndex];
  return option.values.flatMap((value) => {
    const matchingVariants = variants.filter((variant) => {
      if (!variantMatchesSelection(variant, parentSelection)) return false;
      return variant.optionValues.some(
        (variantValue) =>
          variantValue.attribute.id === attributeId && variantValue.id === value.id,
      );
    });

    if (matchingVariants.length === 0) return [];
    return [{
      ...value,
      inStock: matchingVariants.some((variant) => variant.inStock),
    }];
  });
}

export function selectionHasTerminalVariant(
  variants: ProductVariant[],
  selection: ProductOptionSelection,
) {
  const selectedCount = Object.keys(selection).length;
  return selectedCount > 0 && variants.some(
    (variant) =>
      variant.optionValues.length === selectedCount &&
      variantMatchesSelection(variant, selection),
  );
}

export function nextStorefrontOptionName(
  options: ProductOption[],
  variants: ProductVariant[],
  selection: ProductOptionSelection,
) {
  return options.find((option) =>
    !selection[option.attribute.id] &&
    storefrontOptionValueStates(
      options,
      variants,
      selection,
      option.attribute.id,
    ).some((value) => value.inStock),
  )?.attribute.name;
}
