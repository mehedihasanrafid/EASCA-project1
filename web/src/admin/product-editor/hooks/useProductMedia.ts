import type React from "react";
import { useEffect, useState } from "react";

import { adminProductApi } from "../../../api/adminProducts";
import { ApiException } from "../../../api/client";
import type { ProductMedia } from "../../../api/products";
import type {
  PreferenceScope,
  VariantDraft,
  VariantPendingMedia,
} from "../types/productEditor.types";

interface UseProductMediaInput {
  editingProductId: string | null;
  variants: VariantDraft[];
  reportError: (message: string) => void;
}

const allowedMediaTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/webm",
];

/**
 * Owns saved and pending media independently from the product form.
 *
 * Files remain local until save because a new product and its new SKUs do not
 * have database IDs yet. The save utility resolves editor keys to database IDs.
 */
export function useProductMedia({ editingProductId, reportError, variants }: UseProductMediaInput) {
  const [media, setMedia] = useState<ProductMedia[]>([]);
  const [pendingMedia, setPendingMedia] = useState<VariantPendingMedia[]>([]);
  const [mediaBusyId, setMediaBusyId] = useState<string | null>(null);
  const [mediaScope, setMediaScope] = useState<PreferenceScope>("all");

  // A removed unsaved SKU must not leave an orphaned local file in the save queue.
  useEffect(() => {
    const availableKeys = new Set(variants.map((variant) => variant.key));
    setPendingMedia((current) => current.filter(
      (item) => item.variantKey === "all" || availableKeys.has(item.variantKey),
    ));
  }, [variants]);

  const mediaCountForScope = (
    variantKey: "all" | string,
    pendingItems = pendingMedia,
  ) => {
    const variantId = variantKey === "all"
      ? null
      : variants.find((variant) => variant.key === variantKey)?.id;
    const savedCount = variantKey === "all"
      ? media.filter((item) => item.variantId === null).length
      : variantId ? media.filter((item) => item.variantId === variantId).length : 0;
    return savedCount + pendingItems.filter((item) => item.variantKey === variantKey).length;
  };

  const addPendingMedia = (variantKey: "all" | string, selected: File[]) => {
    if (selected.length === 0) return;
    const availableSlots = 4 - mediaCountForScope(variantKey);
    if (selected.length > availableSlots) {
      const name = variantKey === "all" ? "Shared product media" : "This variant";
      reportError(`${name} can accept ${Math.max(availableSlots, 0)} more item${availableSlots === 1 ? "" : "s"}.`);
      return;
    }

    const invalidType = selected.find((file) => !allowedMediaTypes.includes(file.type));
    if (invalidType) {
      reportError(`${invalidType.name} is not a supported image or video.`);
      return;
    }
    const oversized = selected.find((file) => {
      const limitMb = file.type.startsWith("video/") ? 20 : 2;
      return file.size > limitMb * 1024 * 1024;
    });
    if (oversized) {
      reportError(`${oversized.name} is larger than ${oversized.type.startsWith("video/") ? 20 : 2} MB.`);
      return;
    }

    reportError("");
    setPendingMedia((current) => [
      ...current,
      ...selected.map((file) => ({
        key: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
        file,
        variantKey,
      })),
    ]);
  };

  const handleImageSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = "";
    addPendingMedia("all", selected);
  };

  const setPrimaryImage = async (mediaId: string) => {
    if (!editingProductId) return;
    setMediaBusyId(mediaId);
    reportError("");
    try {
      const updated = await adminProductApi.updateMedia(editingProductId, mediaId, { isPrimary: true });
      setMedia((current) => current.map((item) =>
        item.variantId === updated.variantId
          ? { ...item, isPrimary: item.id === updated.id }
          : item,
      ));
    } catch (error) {
      reportError(error instanceof ApiException ? error.error.message : "Could not set the primary image.");
    } finally {
      setMediaBusyId(null);
    }
  };

  const deleteImage = async (mediaId: string) => {
    if (!editingProductId || !window.confirm("Delete this product image?")) return;
    setMediaBusyId(mediaId);
    reportError("");
    try {
      await adminProductApi.deleteMedia(editingProductId, mediaId);
      setMedia((current) => current.filter((item) => item.id !== mediaId));
    } catch (error) {
      reportError(error instanceof ApiException ? error.error.message : "Could not delete this image.");
    } finally {
      setMediaBusyId(null);
    }
  };

  const assignMediaToVariant = async (mediaId: string, variantId: string) => {
    if (!editingProductId) return;
    setMediaBusyId(mediaId);
    reportError("");
    try {
      const updated = await adminProductApi.updateMedia(editingProductId, mediaId, {
        variantId: variantId || null,
      });
      setMedia((current) => current.map((item) => item.id === mediaId ? updated : item));
    } catch (error) {
      reportError(error instanceof ApiException ? error.error.message : "Could not assign this media item.");
    } finally {
      setMediaBusyId(null);
    }
  };

  const movePendingMedia = (mediaKey: string, variantKey: "all" | string) => {
    const withoutCurrent = pendingMedia.filter((item) => item.key !== mediaKey);
    if (mediaCountForScope(variantKey, withoutCurrent) >= 4) {
      reportError(variantKey === "all"
        ? "Shared product media already contains four items."
        : "That variant already contains four media items.");
      return;
    }
    reportError("");
    setPendingMedia((current) => current.map((item) =>
      item.key === mediaKey ? { ...item, variantKey } : item,
    ));
  };

  const changeMediaScope = (nextScope: PreferenceScope) => {
    if (nextScope === mediaScope) return;
    if (nextScope === "all") {
      const individual = pendingMedia.filter((item) => item.variantKey !== "all");
      const shared = pendingMedia.filter((item) => item.variantKey === "all");
      const savedSharedCount = media.filter((item) => item.variantId === null).length;
      if (savedSharedCount + shared.length + individual.length > 4) {
        reportError("The individual pending media cannot be moved to All variants because the four-item shared limit would be exceeded.");
        return;
      }
      if (individual.length > 0 && !window.confirm(
        `Move ${individual.length} pending SKU media item${individual.length === 1 ? "" : "s"} to All variants?`,
      )) return;
      setPendingMedia((current) => current.map((item) => ({ ...item, variantKey: "all" })));
    }
    setMediaScope(nextScope);
    reportError("");
  };

  return {
    media,
    setMedia,
    pendingMedia,
    setPendingMedia,
    mediaBusyId,
    mediaScope,
    setMediaScope,
    mediaCountForScope,
    addPendingMedia,
    handleImageSelection,
    setPrimaryImage,
    deleteImage,
    assignMediaToVariant,
    movePendingMedia,
    changeMediaScope,
  };
}
