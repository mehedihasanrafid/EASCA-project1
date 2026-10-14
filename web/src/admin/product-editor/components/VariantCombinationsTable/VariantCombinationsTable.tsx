import { Download, Pencil, SlidersHorizontal, Trash2, Upload } from "lucide-react";

import type { VariantOptionsController } from "../../hooks/useProductCatalogOptions";
import type { BulkField } from "../../types/productEditor.types";
import styles from "./VariantCombinationsTable.module.css";

interface Props {
  builder: VariantOptionsController;
}

/** Summary, selection, bulk edit, CSV, default selection, and safe removal for all SKUs. */
export const VariantCombinationsTable = ({ builder }: Props) => {
  if (builder.variants.length === 0) return null;

  return (
    <section className={`${styles.root} variant-table-panel`} aria-label="All variant combinations">
      <div className="variant-table-toolbar">
        <div><h3>All Variant Combinations ({builder.variants.length})</h3><span>Select a row to edit it above.</span></div>
        <div className="variant-table-actions">
          <button type="button" className="btn btn-ghost" onClick={() => builder.setBulkOpen((open) => !open)}><SlidersHorizontal size={15} /> Bulk edit</button>
          <button type="button" className="btn btn-ghost" onClick={() => builder.csvInputRef.current?.click()}><Upload size={15} /> Import CSV</button>
          <button type="button" className="btn btn-ghost" onClick={builder.onExportCsv}><Download size={15} /> Export CSV</button>
          <input
            ref={builder.csvInputRef}
            className="sr-only"
            type="file"
            accept=".csv,text/csv"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) void builder.onImportCsv(file);
            }}
          />
        </div>
      </div>

      {builder.bulkOpen && (
        <div className="variant-bulk-panel" aria-label="Bulk edit selected variants">
          <div><strong>Bulk edit</strong><span>{builder.selectedRows.length} of {builder.variants.length} selected</span></div>
          <select
            className="form-input"
            value={builder.bulkField}
            onChange={(event) => {
              builder.setBulkField(event.target.value as BulkField);
              builder.setBulkValue("");
            }}
          >
            <option value="price">Selling price</option>
            <option value="discountPrice">Discount price</option>
            <option value="costPrice">Cost price</option>
            <option value="stockQuantity">Stock quantity</option>
            <option value="lowStockLevel">Low-stock warning</option>
            <option value="isActive">Active status</option>
          </select>
          {builder.bulkField === "isActive" ? (
            <select className="form-input" value={builder.bulkValue} onChange={(event) => builder.setBulkValue(event.target.value)}>
              <option value="">Choose status</option><option value="true">Active</option><option value="false">Inactive</option>
            </select>
          ) : (
            <input className="form-input" type="number" min="0" step={builder.bulkField === "stockQuantity" || builder.bulkField === "lowStockLevel" ? "1" : "0.01"} value={builder.bulkValue} placeholder="Value" onChange={(event) => builder.setBulkValue(event.target.value)} />
          )}
          <button type="button" className="btn btn-primary" onClick={builder.applyBulkValue}>Apply to selected</button>
        </div>
      )}

      <div className="variant-summary-scroll">
        <table className="variant-summary-table">
          <thead><tr>
            <th><input type="checkbox" aria-label="Select all variants" checked={builder.selectedRows.length === builder.variants.length} onChange={builder.toggleAllRows} /></th>
            <th>Variant</th>
            {builder.assignments.map((assignment) => <th key={assignment.attributeId}>{assignment.attribute.name}</th>)}
            <th>SKU</th><th>Selling price</th><th>Cost</th><th>Discount</th><th>Stock</th><th>Status</th><th>Default</th><th>Actions</th>
          </tr></thead>
          <tbody>{builder.variants.map((variant) => (
            <tr key={variant.key} className={variant.key === builder.focusedVariantKey ? "is-selected" : ""} onClick={() => builder.setFocusedVariantKey(variant.key)}>
              <td onClick={(event) => event.stopPropagation()}><input type="checkbox" aria-label={`Select ${variant.optionLabel || variant.sku}`} checked={builder.selectedRows.includes(variant.key)} onChange={() => builder.toggleRow(variant.key)} /></td>
              <td><strong>{variant.optionLabel || "Default"}</strong>{variant.id ? <small>Saved</small> : <small>New</small>}</td>
              {builder.assignments.map((assignment) => {
                const value = builder.valueForAssignment(variant, assignment);
                return <td key={assignment.attributeId}>{value?.colorHex && <i className="variant-color-dot" style={{ backgroundColor: value.colorHex }} />}{value?.label ?? "—"}</td>;
              })}
              <td className="variant-sku-cell">{variant.sku || "—"}</td>
              <td>৳ {variant.price || "0"}</td>
              <td>{variant.costPrice ? `৳ ${variant.costPrice}` : "—"}</td>
              <td>{variant.discountPrice ? `৳ ${variant.discountPrice}` : "—"}</td>
              <td>{variant.stockQuantity}</td>
              <td><span className={`variant-status-dot${variant.isActive ? " is-active" : ""}`} />{variant.isActive ? "Active" : "Inactive"}</td>
              <td><input type="radio" name="variant-default-table" aria-label={`Make ${variant.optionLabel || variant.sku} default`} checked={variant.isDefault} onClick={(event) => event.stopPropagation()} onChange={() => builder.update(variant.key, { isDefault: true })} /></td>
              <td className="variant-row-actions" onClick={(event) => event.stopPropagation()}>
                <button type="button" onClick={() => builder.setFocusedVariantKey(variant.key)} aria-label={`Edit ${variant.optionLabel || variant.sku}`}><Pencil size={14} /></button>
                <button type="button" onClick={() => builder.remove(variant.key)} aria-label={`Remove ${variant.optionLabel || "variant"}`}><Trash2 size={14} /></button>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>

      <div className="variant-mobile-list">
        {builder.variants.map((variant) => (
          <article key={variant.key} className={`variant-mobile-card${variant.key === builder.focusedVariantKey ? " is-selected" : ""}`} onClick={() => builder.setFocusedVariantKey(variant.key)}>
            <div><strong>{variant.optionLabel || "Default"}</strong><span>{variant.sku || "SKU required"}</span></div>
            <dl><div><dt>Price</dt><dd>৳ {variant.price || "0"}</dd></div><div><dt>Stock</dt><dd>{variant.stockQuantity}</dd></div><div><dt>Status</dt><dd>{variant.isActive ? "Active" : "Inactive"}</dd></div></dl>
            <button type="button" onClick={(event) => { event.stopPropagation(); builder.remove(variant.key); }} aria-label={`Remove ${variant.optionLabel || "variant"}`}><Trash2 size={15} /></button>
          </article>
        ))}
      </div>
      <p className="variant-table-note">Saved variants keep their database ID. Set stock to zero before removing a saved combination.</p>
    </section>
  );
};

