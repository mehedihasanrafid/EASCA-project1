import type { AdminProduct } from "../../../api/adminProducts";
import { adminProductApi } from "../../../api/adminProducts";
import type { ProductMedia } from "../../../api/products";
import type {
  PriceTierDraft,
  ProductFormState,
  VariantDraft,
  VariantPendingMedia,
} from "../types/productEditor.types";
import { mapProductInput, mapVariantInputs } from "./productEditor.mappers";
import type { ValidatedEditorValues } from "./productEditor.validation";

interface SaveEditorInput {
  editingProductId: string | null;
  form: ProductFormState;
  requestedStatus: AdminProduct["status"];
  variants: VariantDraft[];
  originalVariantIds: string[];
  priceTiers: PriceTierDraft[];
  media: ProductMedia[];
  pendingMedia: VariantPendingMedia[];
  values: ValidatedEditorValues;
}

/** Signals that the base product exists but a later SKU/media/tier step failed. */
export class ProductDraftSetupError extends Error {}

async function uploadPendingMedia(
  productId: string,
  productName: string,
  pendingMedia: VariantPendingMedia[],
  variantIdsByKey: Map<string, string>,
) {
  const grouped = new Map<string, File[]>();
  for (const item of pendingMedia) {
    const variantId = item.variantKey === "all" ? "all" : variantIdsByKey.get(item.variantKey);
    if (!variantId) throw new Error("A selected media item points to a variant that was not saved.");
    grouped.set(variantId, [...(grouped.get(variantId) ?? []), item.file]);
  }
  for (const [variantId, files] of grouped) {
    await adminProductApi.uploadMedia(
      productId,
      files,
      productName,
      variantId === "all" ? undefined : variantId,
    );
  }
}

async function replacePriceTiers(
  productId: string,
  tiers: PriceTierDraft[],
  variantIdsByKey: Map<string, string>,
) {
  const inputs = tiers.map((tier) => {
    const variantId = tier.variantKey === "all" ? null : variantIdsByKey.get(tier.variantKey);
    if (tier.variantKey !== "all" && !variantId) {
      throw new Error("A block price points to a variant that was not saved.");
    }
    return {
      variantId: variantId ?? null,
      minimumQuantity: Number(tier.minimumQuantity),
      unitPrice: Number(tier.unitPrice),
      isPromotion: tier.isPromotion,
      isActive: tier.isActive,
    };
  });
  await adminProductApi.replacePriceTiers(productId, inputs);
}

/**
 * Persist the editor in dependency order: product -> SKUs -> media/tiers -> removals.
 *
 * New products are intentionally created as DRAFT first. Variant uploads need a
 * real product ID, and keeping a recoverable draft is safer than losing all work
 * if a later media upload fails.
 */
export async function saveProductEditor(input: SaveEditorInput) {
  const variantInputs = mapVariantInputs(input.variants, input.values);

  if (input.editingProductId) {
    const productId = input.editingProductId;
    await adminProductApi.updateProduct(
      productId,
      mapProductInput(input.form, input.values, input.requestedStatus),
    );

    const variantIdsByKey = new Map<string, string>();
    for (let index = 0; index < input.variants.length; index += 1) {
      const draft = input.variants[index];
      if (!draft.id) continue;
      await adminProductApi.updateVariant(productId, draft.id, variantInputs[index]);
      variantIdsByKey.set(draft.key, draft.id);
    }

    const newDrafts = input.variants.filter((variant) => !variant.id);
    const newInputs = variantInputs.filter((_, index) => !input.variants[index].id);
    if (newInputs.length > 0) {
      const created = await adminProductApi.createVariantsBulk(productId, newInputs);
      newDrafts.forEach((draft, index) => {
        if (created[index]) variantIdsByKey.set(draft.key, created[index].id);
      });
    }

    await uploadPendingMedia(productId, input.form.name, input.pendingMedia, variantIdsByKey);
    await replacePriceTiers(productId, input.priceTiers, variantIdsByKey);

    // Delete last: a failed update must not remove the administrator's old data.
    const currentIds = new Set(input.variants.flatMap((variant) => variant.id ? [variant.id] : []));
    const removedIds = input.originalVariantIds.filter((id) => !currentIds.has(id));
    for (const item of input.media.filter((entry) => entry.variantId && removedIds.includes(entry.variantId))) {
      await adminProductApi.deleteMedia(productId, item.id);
    }
    for (const variantId of removedIds) await adminProductApi.deleteVariant(productId, variantId);
    return { productId, created: false };
  }

  let product: AdminProduct | null = null;
  try {
    product = await adminProductApi.createProduct(
      mapProductInput(input.form, input.values, "DRAFT"),
    );
    const createdVariants = await adminProductApi.createVariantsBulk(product.id, variantInputs);
    const variantIdsByKey = new Map<string, string>();
    input.variants.forEach((draft, index) => {
      if (createdVariants[index]) variantIdsByKey.set(draft.key, createdVariants[index].id);
    });

    await uploadPendingMedia(product.id, input.form.name, input.pendingMedia, variantIdsByKey);
    await replacePriceTiers(product.id, input.priceTiers, variantIdsByKey);
    if (input.requestedStatus !== "DRAFT") {
      await adminProductApi.updateProduct(product.id, { status: input.requestedStatus });
    }
    return { productId: product.id, created: true };
  } catch (error) {
    if (product) {
      const message = error instanceof Error ? error.message : "Unknown setup error";
      throw new ProductDraftSetupError(message);
    }
    throw error;
  }
}
