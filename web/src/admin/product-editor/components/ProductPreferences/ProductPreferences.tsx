import { useState } from "react";

import type { ProductEditorController } from "../../hooks/useProductEditor";
import { discountPriceFromPercentage } from "../../utils/productEditor.validation";
import { PreferenceRow, type PreferenceDefinition } from "./PreferenceRow";
import { ProductMediaLibrary } from "./ProductMediaLibrary";
import { QuantityPricingEditor } from "./QuantityPricingEditor";
import styles from "./ProductPreferences.module.css";

interface Props { editor: ProductEditorController; }

/**
 * Product-wide settings matrix.
 * ADDING A PREFERENCE LATER:
 * 1. Add its state/action to useProductEditor (and persistence if necessary).
 * 2. Add one entry to `preferences` below with a title, summary and content.
 * 3. For a mandatory choice set allowOff=false; otherwise true.
 * PreferenceRow automatically draws its checkboxes and adjacent expanded panel.
 */
export const ProductPreferences = ({ editor }: Props) => {
  // Separate expand/collapse from the preference values. Selecting a mode opens that row.
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    bulk: true, discount: true, media: true,
  });

  const bulkMode = editor.bulkPricingMode;
  const discountMode = editor.discountMode;
  const mediaMode = editor.mediaScope; // Mandatory: "all" or "individual"; never "off".

  const sharedTierCount = editor.priceTiers.filter((tier) => tier.variantKey === "all").length;
  const individualTierCount = editor.priceTiers.filter((tier) => tier.variantKey !== "all").length;
  const individualDiscountCount = editor.variantDrafts.filter((variant) => Boolean(variant.discountPrice)).length;

  // Images, not videos, meet the publish requirement. Count only directly assigned SKU images.
  const activeVariants = editor.variantDrafts.filter((variant) => variant.isActive);
  const skuImagesReady = activeVariants.filter((variant) =>
    editor.media.some((item) => item.type === "IMAGE" && item.variantId === variant.id && Boolean(variant.id)) ||
    editor.pendingMedia.some((item) => item.variantKey === variant.key && item.file.type.startsWith("image/")),
  ).length;

  /** For future settings, add another definition; no new table/checkbox markup is necessary. */
  const preferences: PreferenceDefinition[] = [
    {
      id: "bulk",
      title: "Bulk pricing",
      mode: bulkMode,
      allowOff: true,
      summary: bulkMode === "off" ? "Not enabled"
        : bulkMode === "all" ? (sharedTierCount ? `${sharedTierCount} bulk price offer${sharedTierCount === 1 ? "" : "s"}` : "Shared")
        : (individualTierCount ? `${individualTierCount} SKU price block${individualTierCount === 1 ? "" : "s"}` : "Per SKU"),
      onChange: editor.changeBulkPricingMode,
      content: (
        <QuantityPricingEditor
          variants={editor.variantDrafts}
          tiers={editor.priceTiers}
          onChange={editor.setPriceTiers}
          scope={editor.priceTierScope}
        />
      ),
    },
    {
      id: "discount",
      title: "Offer discount",
      mode: discountMode,
      allowOff: true,
      summary: discountMode === "off" ? "Not enabled"
        : discountMode === "all" ? (editor.form.discountPrice ? "Shared offer" : "Shared")
        : (individualDiscountCount ? `${individualDiscountCount} SKU offer${individualDiscountCount === 1 ? "" : "s"}` : "Per SKU"),
      onChange: editor.changeDiscountMode,
      content: discountMode === "all" ? (
        <div className="variant-settings-controls">
          <label>Discount price
            <input className="form-input" type="number" min="0" step="0.01" value={editor.form.discountPrice} onChange={(event) => editor.setField("discountPrice", event.target.value)} />
          </label>
          <label>Discount % off
            <input className="form-input" type="number" min="0" max="100" step="0.01"
              value={editor.globalDiscountPercentage} placeholder="e.g. 30"
              onChange={(event) => editor.setField("discountPrice", discountPriceFromPercentage(editor.settingsRegularPrice, event.target.value))} />
          </label>
          <label>Start date
            <input className="form-input" type="datetime-local" value={editor.form.discountStartsAt} onChange={(event) => editor.setField("discountStartsAt", event.target.value)} />
          </label>
          <label>End date
            <input className="form-input" type="datetime-local" value={editor.form.discountEndsAt} onChange={(event) => editor.setField("discountEndsAt", event.target.value)} />
          </label>
        </div>
      ) : (
        <p className={styles.note}>Select a SKU below to enter its discount and optional offer dates.</p>
      ),
    },
    {
      id: "media",
      title: "Product media",
      mode: mediaMode,
      allowOff: false, // Media always requires exactly one choice.
      summary: mediaMode === "all" ? "Shared" : "1 per SKU",
      onChange: (mode) => {
        if (mode !== "off") editor.changeMediaScope(mode);
      },
      content: (
        <>
          <p className={styles.note}>
            {mediaMode === "all"
              ? "Shared: upload once; all SKUs use the same product images and videos. At least one shared image is required to publish."
              : "Each active SKU must have at least one of its own images to publish. Add images in the Selected SKU editor below."}
          </p>
          {mediaMode === "individual" && (
            <p className={`${styles.completeness} ${skuImagesReady < activeVariants.length ? styles.warning : ""}`}>
              SKU images ready: {skuImagesReady} / {activeVariants.length}
            </p>
          )}
          {/* The existing component keeps upload, preview, primary, delete, and assignment logic. */}
          <ProductMediaLibrary editor={editor} />
        </>
      ),
    },
  ];

  return (
    <section className={styles.root} aria-label="Product preferences">
      <h3 className={styles.heading}>Product Preferences</h3>
      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead><tr><th scope="col">Use case</th><th scope="col">All SKUs</th><th scope="col">Individual SKU</th></tr></thead>
          <tbody>
            {preferences.map((preference) => (
              <PreferenceRow
                key={preference.id}
                preference={{ ...preference, onChange: (next) => {
                  preference.onChange(next);
                  // A new selection opens its configuration immediately beneath this row.
                  if (next !== "off") setExpanded((current) => ({ ...current, [preference.id]: true }));
                } }}
                expanded={expanded[preference.id] ?? true}
                onToggleExpanded={() => setExpanded((current) => ({ ...current, [preference.id]: !(current[preference.id] ?? true) }))}
              />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};
