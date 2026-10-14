import { useCallback, useEffect, useState } from "react";

import { AdminAttribute, AdminAttributeValue, adminCatalogApi } from "../../../api/adminCatalog";
import { ApiException } from "../../../api/client";
import { parseAttributeValues } from "../attribute-values";

function requestMessage(error: unknown, fallback: string) {
  return error instanceof ApiException ? error.error.message : fallback;
}

/** Owns data loading and mutations so the route page remains presentation-focused. */
export function useAdminAttributes() {
  const [attributes, setAttributes] = useState<AdminAttribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadAttributes = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setAttributes(await adminCatalogApi.getAttributes(true));
    } catch (requestError) {
      setError(requestMessage(requestError, "Could not load product attributes."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAttributes();
  }, [loadAttributes]);

  const createAttribute = async (name: string, valueInput: string) => {
    const values = parseAttributeValues(valueInput);
    setBusy(true);
    setError("");
    setSuccess("");

    try {
      // Technical fields use safe defaults. The admin only needs to enter a name and values.
      const attribute = await adminCatalogApi.createAttribute({
        name: name.trim(),
        values,
        inputType: "SELECT",
        isActive: true,
      });

      setSuccess(`${attribute.name} created with ${values.length} value${values.length === 1 ? "" : "s"}.`);
      await loadAttributes();
      return true;
    } catch (requestError) {
      setError(requestMessage(requestError, "Could not create the product attribute."));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const deleteAttribute = async (attribute: AdminAttribute) => {
    if (!window.confirm(`Delete the product attribute “${attribute.name}”? You can restore it later.`)) return;

    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await adminCatalogApi.deleteAttribute(attribute.id);
      setSuccess("Product attribute deleted. No SKU variants were affected.");
      await loadAttributes();
    } catch (requestError) {
      setError(requestMessage(requestError, "Could not delete the product attribute."));
    } finally {
      setBusy(false);
    }
  };

  const updateAttributeName = async (attribute: AdminAttribute, name: string) => {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await adminCatalogApi.updateAttribute(attribute.id, { name: name.trim() });
      setSuccess("Product attribute updated.");
      await loadAttributes();
      return true;
    } catch (requestError) {
      setError(requestMessage(requestError, "Could not update the product attribute."));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const addAttributeValue = async (attribute: AdminAttribute, label: string) => {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const nextSortOrder = attribute.values.reduce(
        (largest, value) => Math.max(largest, value.sortOrder),
        -1,
      ) + 1;
      await adminCatalogApi.createAttributeValue(attribute.id, {
        label: label.trim(),
        colorHex: null,
        sortOrder: nextSortOrder,
        isActive: true,
      });
      setSuccess(`${label.trim()} added to ${attribute.name}.`);
      await loadAttributes();
      return true;
    } catch (requestError) {
      setError(requestMessage(requestError, "Could not add the attribute value."));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const deleteAttributeValue = async (attribute: AdminAttribute, value: AdminAttributeValue) => {
    if (!window.confirm(`Remove “${value.label}” from ${attribute.name}? This is allowed only when no SKU uses it.`)) return;

    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await adminCatalogApi.deleteAttributeValue(attribute.id, value.id);
      setSuccess(`${value.label} removed from ${attribute.name}.`);
      await loadAttributes();
    } catch (requestError) {
      // The backend returns the affected SKU count and examples when deletion is unsafe.
      setError(requestMessage(requestError, "Could not remove the attribute value."));
    } finally {
      setBusy(false);
    }
  };

  const restoreAttributeValue = async (attribute: AdminAttribute, value: AdminAttributeValue) => {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await adminCatalogApi.restoreAttributeValue(attribute.id, value.id);
      setSuccess(`${value.label} restored to ${attribute.name}.`);
      await loadAttributes();
    } catch (requestError) {
      setError(requestMessage(requestError, "Could not restore the attribute value."));
    } finally {
      setBusy(false);
    }
  };

  const restoreAttribute = async (attribute: AdminAttribute) => {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await adminCatalogApi.restoreAttribute(attribute.id);
      setSuccess("Product attribute restored.");
      await loadAttributes();
    } catch (requestError) {
      setError(requestMessage(requestError, "Could not restore the product attribute."));
    } finally {
      setBusy(false);
    }
  };

  return {
    attributes,
    addAttributeValue,
    busy,
    createAttribute,
    deleteAttribute,
    deleteAttributeValue,
    error,
    loading,
    restoreAttribute,
    restoreAttributeValue,
    success,
    updateAttributeName,
  };
}
