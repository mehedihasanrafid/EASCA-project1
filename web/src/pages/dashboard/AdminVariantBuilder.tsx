import React, { useEffect, useMemo, useState } from "react";
import { Layers3, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

import { ProductTypeAttributeAssignment, adminCatalogApi } from "../../api/adminCatalog";
import { ApiException } from "../../api/client";

export interface VariantDraft {
  key: string;
  id?: string;
  optionValueIds: string[];
  optionLabel: string;
  sku: string;
  price: string;
  costPrice: string;
  stockQuantity: string;
  isDefault: boolean;
  isActive: boolean;
}

interface Props {
  productTypeId: string;
  productName: string;
  defaultPrice: string;
  defaultCostPrice: string;
  variants: VariantDraft[];
  onChange: (variants: VariantDraft[]) => void;
}

const skuPart = (value: string) => value.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "");

function combinations(groups: string[][]): string[][] {
  return groups.reduce<string[][]>(
    (result, group) => result.flatMap((prefix) => group.map((value) => [...prefix, value])),
    [[]],
  );
}

export const AdminVariantBuilder: React.FC<Props> = ({
  productTypeId, productName, defaultPrice, defaultCostPrice, variants, onChange,
}) => {
  const [assignments, setAssignments] = useState<ProductTypeAttributeAssignment[]>([]);
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!productTypeId) { setAssignments([]); return; }
    setLoading(true); setError("");
    adminCatalogApi.getProductTypeAttributes(productTypeId)
      .then((items) => {
        setAssignments(items.filter((item) => item.attribute.isActive && !item.attribute.deletedAt));
        const fromExisting: Record<string, string[]> = {};
        for (const item of items) {
          const used = new Set(
            variants.flatMap((variant) => variant.optionValueIds)
              .filter((id) => item.attribute.values.some((value) => value.id === id)),
          );
          fromExisting[item.attributeId] = [...used];
        }
        setSelected(fromExisting);
      })
      .catch((requestError) => setError(requestError instanceof ApiException ? requestError.error.message : "Could not load product properties."))
      .finally(() => setLoading(false));
  // Existing variants are intentionally read only when the product type changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productTypeId]);

  const valuesById = useMemo(
    () => new Map(assignments.flatMap((item) => item.attribute.values.map((value) => [value.id, value] as const))),
    [assignments],
  );

  const toggleValue = (attributeId: string, valueId: string) => {
    setSelected((current) => {
      const values = current[attributeId] ?? [];
      return { ...current, [attributeId]: values.includes(valueId) ? values.filter((id) => id !== valueId) : [...values, valueId] };
    });
  };

  const generate = () => {
    const groups = assignments
      .map((assignment) => selected[assignment.attributeId] ?? [])
      .filter((group) => group.length > 0);
    if (assignments.some((assignment) => assignment.isRequired && !(selected[assignment.attributeId]?.length))) {
      setError("Choose at least one value for every required property."); return;
    }
    if (!groups.length) { setError("Choose values before generating variants."); return; }

    const existingBySignature = new Map(variants.map((variant) => [[...variant.optionValueIds].sort().join(":"), variant]));
    const baseSku = skuPart(productName) || "PRODUCT";
    const next = combinations(groups).map((optionValueIds, index) => {
      const signature = [...optionValueIds].sort().join(":");
      const existing = existingBySignature.get(signature);
      const labels = optionValueIds.map((id) => valuesById.get(id)?.label ?? id);
      const codes = optionValueIds.map((id) => valuesById.get(id)?.code ?? id);
      return existing ?? {
        key: `new-${signature}`,
        optionValueIds,
        optionLabel: labels.join(" / "),
        sku: [baseSku, ...codes.map(skuPart)].filter(Boolean).join("-").slice(0, 100),
        price: defaultPrice,
        costPrice: defaultCostPrice,
        stockQuantity: "0",
        isDefault: index === 0 && !variants.some((variant) => variant.isDefault),
        isActive: true,
      };
    });
    if (next.length && !next.some((variant) => variant.isDefault)) next[0] = { ...next[0], isDefault: true };
    onChange(next); setError("");
  };

  const update = (key: string, change: Partial<VariantDraft>) => {
    onChange(variants.map((variant) => {
      if (change.isDefault === true) return { ...variant, isDefault: variant.key === key };
      return variant.key === key ? { ...variant, ...change } : variant;
    }));
  };

  const remove = (key: string) => {
    const next = variants.filter((variant) => variant.key !== key);
    if (next.length && !next.some((variant) => variant.isDefault)) next[0] = { ...next[0], isDefault: true };
    onChange(next);
  };

  return (
    <div className="admin-variant-builder admin-field-wide">
      <div className="admin-form-divider"><span>Product options and variants</span></div>
      {loading ? <p>Loading product properties...</p> : assignments.length === 0 ? (
        <div className="admin-variant-empty"><Layers3 size={24} /><div><strong>This product type has no properties yet.</strong><p>You can keep one simple stock variant, or <Link to="/admin/properties">configure reusable properties</Link> first.</p></div></div>
      ) : (
        <>
          <div className="admin-option-selector">
            {assignments.map((assignment) => (
              <fieldset key={assignment.attributeId}>
                <legend>{assignment.attribute.name}{assignment.isRequired ? " *" : ""}</legend>
                <div>{assignment.attribute.values.filter((value) => value.isActive && !value.deletedAt).map((value) => (
                  <label key={value.id}>
                    <input type="checkbox" checked={selected[assignment.attributeId]?.includes(value.id) ?? false} onChange={() => toggleValue(assignment.attributeId, value.id)} />
                    {value.colorHex && <i style={{ backgroundColor: value.colorHex }} />}{value.label}
                  </label>
                ))}</div>
              </fieldset>
            ))}
          </div>
          <button type="button" className="btn btn-ghost" onClick={generate}><Plus size={17} /> Generate combinations</button>
        </>
      )}
      {error && <p className="admin-variant-error">{error}</p>}

      {variants.length > 0 && (
        <div className="admin-variant-table-wrap">
          <table className="admin-variant-table">
            <thead><tr><th>Variant</th><th>SKU</th><th>Price</th><th>Cost</th><th>Stock</th><th>Default</th><th>Active</th><th><span className="sr-only">Remove</span></th></tr></thead>
            <tbody>{variants.map((variant) => (
              <tr key={variant.key}>
                <td><strong>{variant.optionLabel || "Default"}</strong></td>
                <td><input className="form-input" value={variant.sku} required maxLength={100} onChange={(event) => update(variant.key, { sku: event.target.value.toUpperCase() })} /></td>
                <td><input className="form-input" type="number" min="0" step="0.01" value={variant.price} required onChange={(event) => update(variant.key, { price: event.target.value })} /></td>
                <td><input className="form-input" type="number" min="0" step="0.01" value={variant.costPrice} onChange={(event) => update(variant.key, { costPrice: event.target.value })} /></td>
                <td><input className="form-input" type="number" min="0" step="1" value={variant.stockQuantity} required onChange={(event) => update(variant.key, { stockQuantity: event.target.value })} /></td>
                <td><input type="radio" name="default-variant" checked={variant.isDefault} onChange={() => update(variant.key, { isDefault: true })} /></td>
                <td><input type="checkbox" checked={variant.isActive} onChange={(event) => update(variant.key, { isActive: event.target.checked })} /></td>
                <td><button type="button" className="admin-view-link reference-delete-button" onClick={() => remove(variant.key)} aria-label={`Remove ${variant.optionLabel || "variant"}`}><Trash2 size={16} /></button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
};
