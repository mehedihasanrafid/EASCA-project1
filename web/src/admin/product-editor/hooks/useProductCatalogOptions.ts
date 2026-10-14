import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type {
  AdminBrand,
  AdminProductType,
  ProductTypeAttributeAssignment,
} from "../../../api/adminCatalog";
import { adminCatalogApi } from "../../../api/adminCatalog";
import type { CategoryOption } from "../../../api/adminProducts";
import { adminProductApi } from "../../../api/adminProducts";
import { ApiException } from "../../../api/client";
import type { ProductMedia } from "../../../api/products";
import type {
  BulkField,
  FlatCategoryOption,
  ProductFormState,
  VariantDraft,
  VariantPendingMedia,
} from "../types/productEditor.types";
import { discountPercentageFromPrice } from "../utils/productEditor.validation";
import {
  SKIP_OPTION_VALUE,
  analyzeVariantPathRemoval,
  buildVariantPathTree,
  changeVariantPathSelection,
  clearDeepestVariantPathChoice,
  selectedVariantPathIds,
  variantPathSignature,
} from "../utils/variantPaths";

interface UseProductCatalogOptionsInput {
  form: ProductFormState;
  setForm: React.Dispatch<React.SetStateAction<ProductFormState>>;
  variants: VariantDraft[];
  setVariants: React.Dispatch<React.SetStateAction<VariantDraft[]>>;
  media: ProductMedia[];
  pendingMedia: VariantPendingMedia[];
  mediaBusyId: string | null;
  mediaCountForScope: (variantKey: string) => number;
  addPendingMedia: (variantKey: string, files: File[]) => void;
  deleteMedia: (mediaId: string) => void;
  setPrimaryMedia: (mediaId: string) => void;
  variantMediaEnabled: boolean;
  importCsv: (file: File) => Promise<void> | void;
  exportCsv: () => void;
  reportError: (message: string) => void;
}

const flattenCategories = (
  items: CategoryOption[],
  ancestorNames: string[] = [],
): FlatCategoryOption[] => items.flatMap((item) => {
  const names = [...ancestorNames, item.name];
  return [
    { ...item, displayName: names.join(" › ") },
    ...flattenCategories(item.children, names),
  ];
});

const skuPart = (value: string) =>
  value.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "");

const valueCode = (value: string) =>
  value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/**
 * Loads category/type/brand choices and manages product-specific attribute paths.
 *
 * Attributes are catalog templates, but the paths built here belong only to the
 * current product. That separation allows Black -> XL while Green -> M without
 * generating a full unwanted Cartesian combination.
 */
export function useProductCatalogOptions(input: UseProductCatalogOptionsInput) {
  const [categories, setCategories] = useState<FlatCategoryOption[]>([]);
  const [brands, setBrands] = useState<AdminBrand[]>([]);
  const [productTypes, setProductTypes] = useState<AdminProductType[]>([]);
  const [allowedProductTypeIds, setAllowedProductTypeIds] = useState<string[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);

  const [assignments, setAssignments] = useState<ProductTypeAttributeAssignment[]>([]);
  const [pathSelection, setPathSelection] = useState<Record<string, string>>({});
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [focusedVariantKey, setFocusedVariantKey] = useState("");
  const [newValueLabels, setNewValueLabels] = useState<Record<string, string>>({});
  const [addingValueFor, setAddingValueFor] = useState<string | null>(null);
  const [bulkField, setBulkField] = useState<BulkField>("price");
  const [bulkValue, setBulkValue] = useState("");
  const [bulkOpen, setBulkOpen] = useState(false);
  const [attributesLoading, setAttributesLoading] = useState(false);
  const [variantError, setVariantError] = useState("");
  const csvInputRef = useRef<HTMLInputElement>(null);

  const loadCatalog = useCallback(async () => {
    setCatalogLoading(true);
    input.reportError("");
    try {
      const [categoryResult, brandResult, typeResult] = await Promise.all([
        adminProductApi.getCategories(),
        adminCatalogApi.getBrands(false),
        adminCatalogApi.getProductTypes(false),
      ]);
      setCategories(flattenCategories(categoryResult).filter((category) => category.allowProducts));
      setBrands(brandResult.filter((brand) => brand.isActive && !brand.deletedAt));
      setProductTypes(typeResult.filter((type) => type.isActive && !type.deletedAt));
    } catch (error) {
      input.reportError(error instanceof ApiException
        ? error.error.message
        : "Could not load the product catalog.");
    } finally {
      setCatalogLoading(false);
    }
  }, [input.reportError]);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  useEffect(() => {
    if (input.form.categoryId || categories.length === 0) return;
    input.setForm((current) => ({ ...current, categoryId: categories[0]?.id ?? "" }));
  }, [categories, input.form.categoryId, input.setForm]);

  // Category -> product type is an allowed-assignment relationship, not ownership.
  useEffect(() => {
    if (!input.form.categoryId) {
      setAllowedProductTypeIds([]);
      return;
    }
    let current = true;
    const categoryId = input.form.categoryId;
    setAllowedProductTypeIds([]);
    void adminCatalogApi.getCategoryProductTypes(categoryId)
      .then((assignment) => {
        if (!current) return;
        const activeIds = assignment.productTypeIds.filter((id) =>
          productTypes.some((type) => type.id === id),
        );
        setAllowedProductTypeIds(activeIds);
        input.setForm((form) => form.categoryId !== categoryId || form.productTypeId
          ? form
          : { ...form, productTypeId: activeIds[0] ?? "" });
      })
      .catch((error) => {
        if (!current) return;
        input.reportError(error instanceof ApiException
          ? error.error.message
          : "Could not load the product types assigned to this category.");
      });
    return () => { current = false; };
  }, [input.form.categoryId, input.reportError, input.setForm, productTypes]);

  // Product type assignments decide which attribute levels can be used.
  useEffect(() => {
    if (!input.form.productTypeId) {
      setAssignments([]);
      setPathSelection({});
      return;
    }
    setAttributesLoading(true);
    setVariantError("");
    void adminCatalogApi.getProductTypeAttributes(input.form.productTypeId)
      .then((items) => {
        const active = items
          .filter((item) => item.attribute.isActive && !item.attribute.deletedAt)
          .sort((left, right) => left.sortOrder - right.sortOrder);
        setAssignments(active);
        const seed = input.variants.find((variant) => variant.isDefault) ?? input.variants[0];
        const initial: Record<string, string> = {};
        for (const item of active) {
          const existingId = seed?.optionValueIds.find((id) =>
            item.attribute.values.some((value) => value.id === id),
          );
          if (existingId) initial[item.attributeId] = existingId;
          else if (!item.isRequired && seed?.optionValueIds.length) {
            initial[item.attributeId] = SKIP_OPTION_VALUE;
          }
        }
        setPathSelection(initial);
      })
      .catch((error) => setVariantError(error instanceof ApiException
        ? error.error.message
        : "Could not load product attributes."))
      .finally(() => setAttributesLoading(false));
    // Existing rows seed the path only when product type changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input.form.productTypeId]);

  useEffect(() => {
    setSelectedRows((current) => current.filter((key) =>
      input.variants.some((variant) => variant.key === key),
    ));
    if (!input.variants.some((variant) => variant.key === focusedVariantKey)) {
      setFocusedVariantKey(
        input.variants.find((variant) => variant.isDefault)?.key ?? input.variants[0]?.key ?? "",
      );
    }
  }, [focusedVariantKey, input.variants]);

  const valuesById = useMemo(() => new Map(assignments.flatMap((item) =>
    item.attribute.values.map((value) => [value.id, value] as const),
  )), [assignments]);
  const variantPathTree = useMemo(
    () => buildVariantPathTree(assignments, input.variants),
    [assignments, input.variants],
  );
  const currentPathLabels = assignments.flatMap((assignment) => {
    const valueId = pathSelection[assignment.attributeId];
    if (!valueId) return [];
    if (valueId === SKIP_OPTION_VALUE) return [`No ${assignment.attribute.name}`];
    return [valuesById.get(valueId)?.label ?? valueId];
  });
  const pathIsComplete = assignments.length > 0 && assignments.every((assignment) =>
    Object.hasOwn(pathSelection, assignment.attributeId),
  );
  const exactPathCount = input.variants.filter((variant) => variant.optionValueIds.length > 0).length;
  const focusedVariant = input.variants.find((variant) => variant.key === focusedVariantKey) ?? null;
  const focusedMedia = input.media.filter((item) =>
    item.variantId === (focusedVariant?.id ?? "__new_variant__") || item.variantId === null,
  );
  const focusedPendingMedia = input.pendingMedia.filter((item) =>
    item.variantKey === focusedVariantKey || item.variantKey === "all",
  );
  const focusedPreviewMedia = focusedMedia.find((item) =>
    item.type === "IMAGE" && item.variantId === focusedVariant?.id && item.isPrimary,
  ) ?? focusedMedia.find((item) =>
    item.type === "IMAGE" && item.variantId === focusedVariant?.id,
  ) ?? focusedMedia.find((item) => item.type === "IMAGE" && item.variantId === null && item.isPrimary)
    ?? focusedMedia.find((item) => item.type === "IMAGE");
  const focusedMediaLimitReached = focusedVariant
    ? input.mediaCountForScope(focusedVariant.key) >= 4
    : false;
  const focusedDiscountPercentage = focusedVariant
    ? discountPercentageFromPrice(focusedVariant.price, focusedVariant.discountPrice)
    : "";

  const choosePathValue = (attributeId: string, valueId: string) => {
    setPathSelection((current) =>
      changeVariantPathSelection(assignments, current, attributeId, valueId),
    );
  };

  const addSuggestedValue = async (assignment: ProductTypeAttributeAssignment) => {
    const label = newValueLabels[assignment.attributeId]?.trim();
    if (!label) return;
    setAddingValueFor(assignment.attributeId);
    setVariantError("");
    try {
      const created = await adminCatalogApi.createAttributeValue(assignment.attributeId, {
        label,
        code: valueCode(label) || undefined,
        sortOrder: assignment.attribute.values.length,
        isActive: true,
      });
      setAssignments((current) => current.map((item) =>
        item.attributeId === assignment.attributeId
          ? { ...item, attribute: { ...item.attribute, values: [...item.attribute.values, created] } }
          : item,
      ));
      setPathSelection((current) => changeVariantPathSelection(
        assignments,
        current,
        assignment.attributeId,
        created.id,
      ));
      setNewValueLabels((current) => ({ ...current, [assignment.attributeId]: "" }));
    } catch (error) {
      setVariantError(error instanceof ApiException ? error.error.message : `Could not add ${label}.`);
    } finally {
      setAddingValueFor(null);
    }
  };

  const addExactVariantPath = () => {
    const undecided = assignments.find((assignment) =>
      !Object.hasOwn(pathSelection, assignment.attributeId),
    );
    if (undecided) {
      setVariantError(`Choose a ${undecided.attribute.name} value${undecided.isRequired ? "" : " or select Not used"}.`);
      return;
    }
    const invalidRequired = assignments.find((assignment) =>
      assignment.isRequired && pathSelection[assignment.attributeId] === SKIP_OPTION_VALUE,
    );
    if (invalidRequired) {
      setVariantError(`${invalidRequired.attribute.name} is required for every variant.`);
      return;
    }
    const optionValueIds = selectedVariantPathIds(assignments, pathSelection);
    if (optionValueIds.length === 0) {
      setVariantError("Choose at least one attribute value for this variant.");
      return;
    }
    const baseVariants = input.variants.filter((variant) => !(
      !variant.id && variant.optionValueIds.length === 0 && !variant.sku.trim() &&
      Number(variant.stockQuantity) === 0
    ));
    const signature = variantPathSignature(optionValueIds);
    if (baseVariants.some((variant) => variantPathSignature(variant.optionValueIds) === signature)) {
      setVariantError("This exact variant path already exists. Choose a different child value.");
      return;
    }
    if (baseVariants.length >= 200) {
      setVariantError("A product can contain at most 200 exact variant paths.");
      return;
    }

    const labels = optionValueIds.map((id) => valuesById.get(id)?.label ?? id);
    const codes = optionValueIds.map((id) => valuesById.get(id)?.code ?? id);
    const created: VariantDraft = {
      key: `new-${signature}-${Date.now()}`,
      optionValueIds,
      optionLabel: labels.join(" / "),
      sku: [skuPart(input.form.name) || "PRODUCT", ...codes.map(skuPart)].filter(Boolean).join("-").slice(0, 100),
      barcode: "",
      price: input.form.defaultPrice,
      discountPrice: "",
      discountStartsAt: "",
      discountEndsAt: "",
      costPrice: input.form.costPrice,
      stockQuantity: "0",
      lowStockLevel: "5",
      isDefault: baseVariants.length === 0,
      isActive: true,
    };
    input.setVariants([...baseVariants, created]);
    setFocusedVariantKey(created.key);
    setPathSelection((current) => clearDeepestVariantPathChoice(assignments, current));
    setVariantError("");
  };

  const update = (key: string, change: Partial<VariantDraft>) => {
    input.setVariants((variants) => variants.map((variant) => {
      if (change.isDefault === true) return { ...variant, isDefault: variant.key === key };
      return variant.key === key ? { ...variant, ...change } : variant;
    }));
  };

  const remove = (key: string) => {
    const target = input.variants.find((variant) => variant.key === key);
    if (target && Number(target.stockQuantity) > 0) {
      setVariantError(`Set ${target.optionLabel || target.sku}'s stock to zero before removing it.`);
      return;
    }
    const next = input.variants.filter((variant) => variant.key !== key);
    if (next.length > 0 && !next.some((variant) => variant.isDefault)) {
      next[0] = { ...next[0], isDefault: true };
    }
    input.setVariants(next);
    setVariantError("");
  };

  const removePathBranch = (node: (typeof variantPathTree)[number]) => {
    const { affected, stocked } = analyzeVariantPathRemoval(node.variantKeys, input.variants);
    if (affected.length === 0) return;
    if (stocked.length > 0) {
      const preview = stocked.slice(0, 3).map((variant) => variant.optionLabel || variant.sku).join(", ");
      setVariantError(`Cannot remove ${node.label}. ${stocked.length} affected SKU${stocked.length === 1 ? " has" : "s have"} stock: ${preview}${stocked.length > 3 ? ` and ${stocked.length - 3} more` : ""}. Set all affected stock to zero first.`);
      return;
    }
    const savedCount = affected.filter((variant) => variant.id).length;
    if (!window.confirm(
      `Remove ${node.label} and ${affected.length} affected SKU path${affected.length === 1 ? "" : "s"}?${savedCount ? " Saved SKUs will be deleted when you save the product." : ""}`,
    )) return;
    const removed = new Set(affected.map((variant) => variant.key));
    const next = input.variants.filter((variant) => !removed.has(variant.key));
    if (next.length > 0 && !next.some((variant) => variant.isDefault)) {
      next[0] = { ...next[0], isDefault: true };
    }
    input.setVariants(next);
    setVariantError("");
  };

  const toggleRow = (key: string) => setSelectedRows((current) =>
    current.includes(key) ? current.filter((item) => item !== key) : [...current, key],
  );
  const toggleAllRows = () => setSelectedRows(
    selectedRows.length === input.variants.length ? [] : input.variants.map((variant) => variant.key),
  );

  const applyBulkValue = () => {
    if (selectedRows.length === 0) {
      setVariantError("Select at least one variant row for the bulk operation.");
      return;
    }
    if (bulkValue === "") {
      setVariantError(bulkField === "isActive"
        ? "Choose the active status you want to apply."
        : "Enter the value you want to apply.");
      return;
    }
    input.setVariants((variants) => variants.map((variant) => {
      if (!selectedRows.includes(variant.key)) return variant;
      return bulkField === "isActive"
        ? { ...variant, isActive: bulkValue === "true" }
        : { ...variant, [bulkField]: bulkValue };
    }));
    setVariantError("");
  };

  const valueForAssignment = (variant: VariantDraft, assignment: ProductTypeAttributeAssignment) =>
    assignment.attribute.values.find((item) => variant.optionValueIds.includes(item.id)) ?? null;

  return {
    categories,
    brands,
    productTypes,
    allowedProductTypeIds,
    loading: catalogLoading,
    variantBuilder: {
      assignments,
      pathSelection,
      setPathSelection,
      selectedRows,
      focusedVariantKey,
      setFocusedVariantKey,
      newValueLabels,
      setNewValueLabels,
      addingValueFor,
      bulkField,
      setBulkField,
      bulkValue,
      setBulkValue,
      bulkOpen,
      setBulkOpen,
      loading: attributesLoading,
      error: variantError,
      csvInputRef,
      variantPathTree,
      currentPathLabels,
      pathIsComplete,
      exactPathCount,
      focusedVariant,
      focusedMedia,
      focusedPendingMedia,
      focusedPreviewMedia,
      focusedMediaLimitReached,
      focusedDiscountPercentage,
      choosePathValue,
      addSuggestedValue,
      addExactVariantPath,
      update,
      remove,
      removePathBranch,
      toggleRow,
      toggleAllRows,
      applyBulkValue,
      valueForAssignment,
      variants: input.variants,
      mediaBusyId: input.mediaBusyId,
      onAddMedia: input.addPendingMedia,
      onDeleteMedia: input.deleteMedia,
      onSetPrimaryMedia: input.setPrimaryMedia,
      variantMediaEnabled: input.variantMediaEnabled,
      onImportCsv: input.importCsv,
      onExportCsv: input.exportCsv,
    },
  };
}

export type VariantOptionsController = ReturnType<typeof useProductCatalogOptions>["variantBuilder"];
