import { ImagePlus, Package, Star, Trash2 } from "lucide-react";

import type { VariantOptionsController } from "../../hooks/useProductCatalogOptions";
import { discountPriceFromPercentage } from "../../utils/productEditor.validation";
import styles from "./SelectedSkuEditor.module.css";

interface Props {
  builder: VariantOptionsController;
  /** Discount inputs should appear only when Product Preferences uses Individual SKU. */
  individualDiscountEnabled?: boolean;
}

/** Edit one focused SKU in detail while the complete table stays compact. */
export const SelectedSkuEditor = ({ builder, individualDiscountEnabled = true }: Props) => {
  const variant = builder.focusedVariant;
  if (!variant) return null;

  return (
    <section className={`${styles.root} selected-variant-card`} aria-label={`Selected variant ${variant.optionLabel || variant.sku}`}>
      <div className="selected-variant-heading">
        <div><span>Selected SKU</span><h3>{variant.optionLabel || "Default"}</h3></div>
        <span className={`variant-status-pill${variant.isActive ? " is-active" : ""}`}>
          {variant.isActive ? "Active" : "Inactive"}
        </span>
      </div>

      <div className="selected-variant-grid">
        <div className="selected-variant-media">
          <div className="selected-variant-preview">
            {builder.focusedPreviewMedia
              ? <img src={builder.focusedPreviewMedia.thumbnailUrl || builder.focusedPreviewMedia.url} alt={variant.optionLabel || variant.sku} />
              : <Package size={34} />}
          </div>
          <label className={`btn btn-ghost variant-media-button${builder.focusedMediaLimitReached || !builder.variantMediaEnabled ? " is-disabled" : ""}`}>
            <ImagePlus size={15} /> Add media
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
              multiple
              disabled={builder.focusedMediaLimitReached || !builder.variantMediaEnabled}
              onChange={(event) => {
                const files = Array.from(event.target.files ?? []);
                event.target.value = "";
                if (files.length) builder.onAddMedia(variant.key, files);
              }}
            />
          </label>
          {!builder.variantMediaEnabled && <small className="variant-media-scope-note">Media is set to All variants. Choose Individual SKU in Product Preferences to upload here.</small>}
        </div>

        <label>SKU <span>*</span><input className="form-input" value={variant.sku} required maxLength={100} onChange={(event) => builder.update(variant.key, { sku: event.target.value.toUpperCase() })} /></label>
        <label>Barcode / GTIN<input className="form-input" value={variant.barcode} maxLength={100} placeholder="Enter barcode" onChange={(event) => builder.update(variant.key, { barcode: event.target.value })} /></label>
        <label>Selling price <span>*</span><input className="form-input" type="number" min="0" step="0.01" value={variant.price} required onChange={(event) => builder.update(variant.key, { price: event.target.value })} /></label>
        <label>Cost price<input className="form-input" type="number" min="0" step="0.01" value={variant.costPrice} onChange={(event) => builder.update(variant.key, { costPrice: event.target.value })} /></label>
        {individualDiscountEnabled && (<>
        <label>Discount price<input className="form-input" type="number" min="0" step="0.01" value={variant.discountPrice} onChange={(event) => builder.update(variant.key, { discountPrice: event.target.value })} /></label>
        <label>Discount % off
          <input
            className="form-input"
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={builder.focusedDiscountPercentage}
            placeholder="e.g. 30"
            onChange={(event) => builder.update(variant.key, {
              discountPrice: discountPriceFromPercentage(variant.price, event.target.value),
            })}
          />
        </label>
        </>)}
        <label>Stock quantity <span>*</span><input className="form-input" type="number" min="0" step="1" value={variant.stockQuantity} required onChange={(event) => builder.update(variant.key, { stockQuantity: event.target.value })} /></label>
        <label>Low-stock warning<input className="form-input" type="number" min="0" step="1" value={variant.lowStockLevel} onChange={(event) => builder.update(variant.key, { lowStockLevel: event.target.value })} /></label>
        <label>Status
          <select className="form-input" value={variant.isActive ? "active" : "inactive"} onChange={(event) => builder.update(variant.key, { isActive: event.target.value === "active" })}>
            <option value="active">Active</option><option value="inactive">Inactive</option>
          </select>
        </label>
        <fieldset className="variant-default-choice">
          <legend>Default selection</legend>
          <label><input type="radio" name="selected-default-variant" checked={variant.isDefault} onChange={() => builder.update(variant.key, { isDefault: true })} /> Yes</label>
          <label><input type="radio" name="selected-default-variant" checked={!variant.isDefault} readOnly /> No</label>
        </fieldset>

        {individualDiscountEnabled && variant.discountPrice && (
          <fieldset className="variant-discount-schedule">
            <legend>Individual offer schedule</legend>
            <label>Starts<input className="form-input" type="datetime-local" value={variant.discountStartsAt} onChange={(event) => builder.update(variant.key, { discountStartsAt: event.target.value })} /></label>
            <label>Ends<input className="form-input" type="datetime-local" value={variant.discountEndsAt} onChange={(event) => builder.update(variant.key, { discountEndsAt: event.target.value })} /></label>
          </fieldset>
        )}
      </div>

      {(builder.focusedMedia.length > 0 || builder.focusedPendingMedia.length > 0) && (
        <div className="selected-variant-media-list">
          {builder.focusedMedia.map((item) => (
            <div key={item.id}>
              {item.type === "IMAGE" ? <img src={item.thumbnailUrl || item.url} alt={item.altText || variant.optionLabel} /> : <video src={item.url} muted preload="metadata" />}
              <span>{item.variantId ? "This variant" : "Shared"}</span>
              {item.type === "IMAGE" && !item.isPrimary && <button type="button" disabled={builder.mediaBusyId === item.id} onClick={() => builder.onSetPrimaryMedia(item.id)} aria-label="Set media as primary"><Star size={14} /></button>}
              {item.variantId && <button type="button" disabled={builder.mediaBusyId === item.id} onClick={() => builder.onDeleteMedia(item.id)} aria-label="Delete variant media"><Trash2 size={14} /></button>}
            </div>
          ))}
          {builder.focusedPendingMedia.map((item) => <div key={item.key} className="is-pending"><Package size={22} /><span>{item.file.name}</span></div>)}
        </div>
      )}
    </section>
  );
};
