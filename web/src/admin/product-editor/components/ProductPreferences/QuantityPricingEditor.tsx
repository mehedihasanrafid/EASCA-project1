import { Plus, Trash2 } from "lucide-react";

import type {
  PreferenceScope,
  PriceTierDraft,
  VariantDraft,
} from "../../types/productEditor.types";

interface Props {
  variants: VariantDraft[];
  tiers: PriceTierDraft[];
  onChange: (tiers: PriceTierDraft[]) => void;
  scope: PreferenceScope;
}

/**
 * Edits quantity-based unit prices.
 * `variantKey` is an editor key here; the save utility resolves it to a database
 * variant ID only after new SKUs have been created.
 */
export const QuantityPricingEditor = ({ onChange, scope, tiers, variants }: Props) => {
  const visibleTiers = tiers.filter((tier) =>
    scope === "all" ? tier.variantKey === "all" : tier.variantKey !== "all",
  );
  const hiddenTierCount = tiers.length - visibleTiers.length;

  const addTier = () => {
    const variantKey = scope === "all" ? "all" : variants[0]?.key;
    if (!variantKey) return;
    onChange([...tiers, {
      key: `tier-${Date.now()}`,
      variantKey,
      minimumQuantity: "2",
      unitPrice: "",
      isPromotion: false,
      isActive: true,
    }]);
  };
  const update = (key: string, change: Partial<PriceTierDraft>) => {
    onChange(tiers.map((tier) => tier.key === key ? { ...tier, ...change } : tier));
  };

  return (
    <section className="admin-price-tier-builder admin-field-wide" aria-label="Block and quantity pricing">
      <div className="admin-form-divider"><span>Block and quantity pricing</span></div>
      <div className="variant-workbench-heading">
        <div>
          <h3>Set quantity price blocks</h3>
          <p>{scope === "all" ? "One quantity-price schedule applies across the product." : "Choose the exact SKU for every quantity-price row."}</p>
        </div>
        <button type="button" className="btn btn-ghost" onClick={addTier} disabled={scope === "individual" && variants.length === 0}><Plus size={16} /> Add price block</button>
      </div>

      {hiddenTierCount > 0 && (
        <p className="price-tier-scope-note">{hiddenTierCount} price block{hiddenTierCount === 1 ? " is" : "s are"} hidden because they use the other scope.</p>
      )}
      {visibleTiers.length === 0 ? (
        <div className="price-tier-empty">No block pricing configured. Normal or scheduled offer prices will be used.</div>
      ) : (
        <div className="admin-variant-table-wrap">
          <table className="admin-variant-table price-tier-table">
            <thead><tr><th>Apply to</th><th>Minimum quantity</th><th>Unit price (BDT)</th><th>Promotion</th><th>Active</th><th><span className="sr-only">Remove</span></th></tr></thead>
            <tbody>{visibleTiers.map((tier) => (
              <tr key={tier.key}>
                <td>{scope === "all" ? <strong>All variants</strong> : (
                  <select className="form-input" value={tier.variantKey} onChange={(event) => update(tier.key, { variantKey: event.target.value })}>
                    {variants.map((variant) => <option key={variant.key} value={variant.key}>{variant.optionLabel || variant.sku || "Default"}</option>)}
                  </select>
                )}</td>
                <td><input className="form-input" type="number" min="2" step="1" required value={tier.minimumQuantity} onChange={(event) => update(tier.key, { minimumQuantity: event.target.value })} /></td>
                <td><input className="form-input" type="number" min="0" step="0.01" required value={tier.unitPrice} onChange={(event) => update(tier.key, { unitPrice: event.target.value })} /></td>
                <td><input type="checkbox" checked={tier.isPromotion} onChange={(event) => update(tier.key, { isPromotion: event.target.checked })} /></td>
                <td><input type="checkbox" checked={tier.isActive} onChange={(event) => update(tier.key, { isActive: event.target.checked })} /></td>
                <td><button type="button" className="admin-view-link reference-delete-button" aria-label="Remove price block" onClick={() => onChange(tiers.filter((item) => item.key !== tier.key))}><Trash2 size={16} /></button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </section>
  );
};
