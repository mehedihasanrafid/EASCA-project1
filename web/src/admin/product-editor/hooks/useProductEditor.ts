import type React from "react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import type { AdminProduct } from "../../../api/adminProducts";
import { adminProductApi } from "../../../api/adminProducts";
import { ApiException } from "../../../api/client";
import type {
  PreferenceScope,
  ProductPreferenceMode,
  PriceTierDraft,
  ProductFormState,
  VariantDraft,
} from "../types/productEditor.types";
import { createEmptyVariant, emptyProductForm, mapProductToEditor } from "../utils/productEditor.mappers";
import { ProductDraftSetupError, saveProductEditor } from "../utils/productEditor.save";
import {
  discountPercentageFromPrice,
  validateProductEditor,
} from "../utils/productEditor.validation";
import { exportVariantsToCsv, parseVariantCsv } from "../utils/variantCsv";
import { useProductCatalogOptions } from "./useProductCatalogOptions";
import { useProductMedia } from "./useProductMedia";

/** A remembered scope is not enabled until the user explicitly turns discount on. */
export const resolveDiscountPreferenceMode = (
  enabled: boolean,
  scope: PreferenceScope,
): ProductPreferenceMode => enabled ? scope : "off";

/**
 * Main Product Editor controller.
 *
 * The page consumes this hook as one controller, while specialized hooks own
 * catalog and media details. This keeps React rendering separate from business
 * validation and API persistence in `utils/`.
 */
export function useProductEditor() {
  const navigate = useNavigate();
  const { productId } = useParams();
  const [form, setForm] = useState<ProductFormState>(emptyProductForm);
  const [variantDrafts, setVariantDrafts] = useState<VariantDraft[]>([createEmptyVariant()]);
  const [originalVariantIds, setOriginalVariantIds] = useState<string[]>([]);
  const [priceTiers, setPriceTiers] = useState<PriceTierDraft[]>([]);
  const [priceTierScope, setPriceTierScope] = useState<PreferenceScope>("all");
  // Off is UI-only; the API stores price-tier rows, not an enabled flag.
  const [bulkPricingEnabled, setBulkPricingEnabled] = useState(false);
  // Scope remembers the last active choice; enabled=false is the actual new-product Off state.
  const [discountScope, setDiscountScope] = useState<PreferenceScope>("all");
  const [discountPreferenceEnabled, setDiscountPreferenceEnabled] = useState(false);
  const [globalDiscountEnabled, setGlobalDiscountEnabled] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productLoading, setProductLoading] = useState(Boolean(productId));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const mediaController = useProductMedia({
    editingProductId,
    variants: variantDrafts,
    reportError: setError,
  });

  const exportVariantCsv = () => {
    const csv = exportVariantsToCsv(variantDrafts);
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${form.name.trim().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "product"}-variants.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  /** CSV updates matching SKUs and adds new rows; database IDs remain untouched. */
  const importVariantCsv = async (file: File) => {
    setError("");
    setSuccess("");
    const parsed = parseVariantCsv(await file.text());
    if (parsed.errors.length > 0) {
      const preview = parsed.errors.slice(0, 3)
        .map((item) => `row ${item.row}${item.field ? ` (${item.field})` : ""}: ${item.message}`)
        .join("; ");
      setError(`CSV was not imported. ${preview}${parsed.errors.length > 3 ? `; plus ${parsed.errors.length - 3} more error(s).` : ""}`);
      return;
    }
    if (parsed.records.length === 0) {
      setError("The CSV contains no variant rows.");
      return;
    }

    const existingBySku = new Map(
      variantDrafts.map((variant) => [variant.sku.trim().toUpperCase(), variant] as const),
    );
    const importedBySku = new Map(parsed.records.map((record) => [record.sku, record] as const));
    const next = variantDrafts.map((variant) => {
      const patch = importedBySku.get(variant.sku.trim().toUpperCase());
      return patch ? { ...variant, ...patch } : variant;
    });
    for (const record of parsed.records) {
      if (existingBySku.has(record.sku)) continue;
      next.push({
        key: `csv-${crypto.randomUUID()}`,
        optionValueIds: record.optionValueIds ?? [],
        optionLabel: record.optionLabel || record.sku,
        sku: record.sku,
        barcode: record.barcode ?? "",
        price: record.price ?? "",
        discountPrice: record.discountPrice ?? "",
        discountStartsAt: "",
        discountEndsAt: "",
        costPrice: record.costPrice ?? "",
        stockQuantity: record.stockQuantity ?? "0",
        lowStockLevel: record.lowStockLevel ?? "5",
        isActive: record.isActive ?? true,
        isDefault: record.isDefault ?? false,
      });
    }
    const defaultSku = parsed.records.find((record) => record.isDefault)?.sku;
    const normalized = defaultSku
      ? next.map((variant) => ({
        ...variant,
        isDefault: variant.sku.trim().toUpperCase() === defaultSku,
      }))
      : next.some((variant) => variant.isDefault)
        ? next
        : next.map((variant, index) => ({ ...variant, isDefault: index === 0 }));
    setVariantDrafts(normalized);
    setSuccess(`${parsed.records.length} variant row${parsed.records.length === 1 ? "" : "s"} imported from ${file.name}.`);
  };

  const catalogController = useProductCatalogOptions({
    editingProductId,
    form,
    setForm,
    variants: variantDrafts,
    setVariants: setVariantDrafts,
    media: mediaController.media,
    pendingMedia: mediaController.pendingMedia,
    mediaBusyId: mediaController.mediaBusyId,
    mediaCountForScope: mediaController.mediaCountForScope,
    addPendingMedia: mediaController.addPendingMedia,
    deleteMedia: (id) => void mediaController.deleteImage(id),
    setPrimaryMedia: (id) => void mediaController.setPrimaryImage(id),
    variantMediaEnabled: mediaController.mediaScope === "individual",
    importCsv: importVariantCsv,
    exportCsv: exportVariantCsv,
    reportError: setError,
  });

  // Edit mode hydrates every editor slice from one complete product response.
  useEffect(() => {
    if (!productId) return;
    let current = true;
    setProductLoading(true);
    setError("");
    setSuccess("");
    void adminProductApi.getProduct(productId)
      .then((product) => {
        if (!current) return;
        const mapped = mapProductToEditor(product);
        setEditingProductId(product.id);
        setForm(mapped.form);
        setVariantDrafts(mapped.variants);
        setOriginalVariantIds(mapped.originalVariantIds);
        setPriceTiers(mapped.priceTiers);
        setPriceTierScope(mapped.priceTierScope);
        setBulkPricingEnabled(mapped.priceTiers.length > 0);
        setDiscountScope(mapped.discountScope);
        setDiscountPreferenceEnabled(mapped.globalDiscountEnabled || mapped.variants.some((variant) => Boolean(variant.discountPrice)));
        setGlobalDiscountEnabled(mapped.globalDiscountEnabled);
        mediaController.setMedia(product.media ?? []);
        mediaController.setPendingMedia([]);
        mediaController.setMediaScope(mapped.mediaScope);
      })
      .catch((requestError) => {
        if (!current) return;
        setError(requestError instanceof ApiException
          ? requestError.error.message
          : "Could not load this product for editing.");
      })
      .finally(() => { if (current) setProductLoading(false); });
    return () => { current = false; };
    // Loading is keyed by route ID; stable React setters intentionally stay out.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  // Remove tier rows whose unsaved SKU was removed in the option editor.
  useEffect(() => {
    const keys = new Set(variantDrafts.map((variant) => variant.key));
    setPriceTiers((current) => current.filter(
      (tier) => tier.variantKey === "all" || keys.has(tier.variantKey),
    ));
  }, [variantDrafts]);

  const setField = <K extends keyof ProductFormState>(key: K, value: ProductFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  /**
   * Select a quantity-pricing scope, or switch it off entirely.
   * Off removes tier rows on the NEXT Save; warn first to protect existing data.
   */
  const changeBulkPricingMode = (next: ProductPreferenceMode) => {
    if (next === "off") {
      if (priceTiers.length && !window.confirm(
        `Disable bulk pricing and remove ${priceTiers.length} price block${priceTiers.length === 1 ? "" : "s"} when you save?`,
      )) return;
      setPriceTiers([]);
      setBulkPricingEnabled(false);
    } else {
      const conflicting = priceTiers.filter((tier) =>
        next === "all" ? tier.variantKey !== "all" : tier.variantKey === "all",
      );
      if (next !== priceTierScope && conflicting.length && !window.confirm(
        `Changing the bulk pricing scope will remove ${conflicting.length} price block${conflicting.length === 1 ? "" : "s"} from the old scope. Continue?`,
      )) return;
      if (next !== priceTierScope) {
        setPriceTiers((current) => current.filter((tier) =>
          next === "all" ? tier.variantKey === "all" : tier.variantKey !== "all",
        ));
      }
      setPriceTierScope(next);
      setBulkPricingEnabled(true);
    }
    setError("");
  };

  /**
   * Shared discount and SKU discounts use different existing fields.
   * Switching them prompts before clearing the old values, preventing a silent loss.
   */
  const changeDiscountMode = (next: ProductPreferenceMode) => {
    const existingIndividualCount = variantDrafts.filter((variant) => Boolean(variant.discountPrice)).length;
    const hasShared = globalDiscountEnabled && Boolean(form.discountPrice);

    if (next === "off") {
      if ((hasShared || existingIndividualCount) && !window.confirm(
        "Disable discount offers and clear existing discount prices and schedules on the next save?",
      )) return;
      setVariantDrafts((current) => current.map((variant) => ({
        ...variant, discountPrice: "", discountStartsAt: "", discountEndsAt: "",
      })));
      setForm((current) => ({
        ...current, discountPrice: "", discountStartsAt: "", discountEndsAt: "",
      }));
      setGlobalDiscountEnabled(false);
      setDiscountPreferenceEnabled(false);
      setError("");
      return;
    }

    if (discountPreferenceEnabled && next !== discountScope) {
      if (next === "all") {
        if (existingIndividualCount && !window.confirm(
          `Switching to All SKUs clears ${existingIndividualCount} SKU discount${existingIndividualCount === 1 ? "" : "s"}. Continue?`,
        )) return;
        setVariantDrafts((current) => current.map((variant) => ({
          ...variant, discountPrice: "", discountStartsAt: "", discountEndsAt: "",
        })));
      } else if (hasShared) {
        if (!window.confirm("Switching to Individual SKU clears the shared product discount. Continue?")) return;
        setForm((current) => ({
          ...current, discountPrice: "", discountStartsAt: "", discountEndsAt: "",
        }));
      }
    }

    setDiscountScope(next);
    // The All SKUs checkbox itself enables the shared discount fields; no second toggle.
    setGlobalDiscountEnabled(next === "all");
    setDiscountPreferenceEnabled(true);
    setError("");
  };

  const handleSaveProduct = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const requestedStatus = (submitter?.dataset.status as AdminProduct["status"] | undefined)
      ?? form.status;
    const validation = validateProductEditor({
      form,
      variants: variantDrafts,
      tiers: priceTiers,
      globalDiscountEnabled,
      media: mediaController.media,
      pendingMedia: mediaController.pendingMedia,
      mediaScope: mediaController.mediaScope,
      requestedStatus,
    });
    if (!validation.ok) {
      setError(validation.error);
      return;
    }

    setSubmitting(true);
    try {
      const result = await saveProductEditor({
        editingProductId,
        form,
        requestedStatus,
        variants: variantDrafts,
        originalVariantIds,
        priceTiers,
        media: mediaController.media,
        pendingMedia: mediaController.pendingMedia,
        attributeAssignments: catalogController.variantBuilder.assignments,
        values: validation.values,
      });
      navigate("/admin/products", {
        state: { success: `${form.name} was ${result.created ? "created" : "updated"} successfully.` },
      });
    } catch (requestError) {
      const message = requestError instanceof ApiException
        ? requestError.error.message
        : requestError instanceof Error ? requestError.message : "Could not save the product.";
      setError(requestError instanceof ProductDraftSetupError
        ? `The product was saved as a draft, but setup did not finish: ${message}`
        : message);
    } finally {
      setSubmitting(false);
    }
  };

  const settingsDefaultVariant = variantDrafts.find((variant) => variant.isDefault) ?? variantDrafts[0];
  const settingsRegularPrice = settingsDefaultVariant?.price || form.defaultPrice;
  const discountMode = resolveDiscountPreferenceMode(discountPreferenceEnabled, discountScope);
  // Never expose a calculated percentage while the preference is Off. This also
  // prevents stale draft values from making a newly enabled row display 100%.
  const globalDiscountPercentage = discountMode === "all" && globalDiscountEnabled
    ? discountPercentageFromPrice(settingsRegularPrice, form.discountPrice)
    : "";

  return {
    ...catalogController,
    ...mediaController,
    loading: productLoading || catalogController.loading,
    submitting,
    editingProductId,
    variantDrafts,
    setVariantDrafts,
    originalVariantIds,
    priceTiers,
    setPriceTiers,
    error,
    success,
    form,
    setForm,
    setField,
    priceTierScope,
    discountScope,
    bulkPricingMode: bulkPricingEnabled ? priceTierScope : "off" as ProductPreferenceMode,
    discountMode,
    globalDiscountEnabled,
    setGlobalDiscountEnabled,
    settingsRegularPrice,
    globalDiscountPercentage,
    closeEditor: () => navigate("/admin/products"),
    changeBulkPricingMode,
    changeDiscountMode,
    exportVariantCsv,
    importVariantCsv,
    handleSaveProduct,
  };
}

export type ProductEditorController = ReturnType<typeof useProductEditor>;
