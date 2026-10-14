# DokanBD Product Editor — Complete File Structure and Source Code

> Generated from the current project source on 2026-10-14. This document is a learning and maintenance reference; the files under `web/src/admin/product-editor/` remain the source of truth.

## Module summary

The Product Editor is an independent admin module used by both Add Product and Edit Product routes. The page composes focused sections, while hooks own state and API coordination, utilities own validation/mapping/persistence, and CSS Modules keep each visual section locally editable.

- Source files: 34
- Approximate source lines: 3620
- Add route: `/admin/products/new`
- Edit route: `/admin/products/:productId/edit`

## Folder responsibilities

| Folder/file | Responsibility |
| --- | --- |
| `AdminProductEditorPage.tsx` | Thin composition page that places editor sections in order |
| `components/` | UI sections for general data, option paths, preferences, selected SKU, variants, and media |
| `hooks/` | Editor state, catalog choices, media actions, loading, and save orchestration |
| `utils/` | Validation, API mapping, ordered persistence, CSV handling, and variant-path business rules |
| `types/` | Shared draft, preference, media, and pricing types |
| `tests/` | Focused component behaviour tests |
| `*.module.css` | Styles scoped to the owning page or component |

## Complete file structure

```text
product-editor/
  ├── components
  │   ├── AdditionalProductDetails
  │   │   ├── AdditionalProductDetails.module.css
  │   │   └── AdditionalProductDetails.tsx
  │   ├── ProductEditorHeader
  │   │   ├── ProductEditorHeader.module.css
  │   │   └── ProductEditorHeader.tsx
  │   ├── ProductGeneralSection
  │   │   ├── ProductGeneralSection.module.css
  │   │   └── ProductGeneralSection.tsx
  │   ├── ProductPreferences
  │   │   ├── PreferenceRow.tsx
  │   │   ├── ProductMediaLibrary.tsx
  │   │   ├── ProductPreferences.module.css
  │   │   ├── ProductPreferences.tsx
  │   │   └── QuantityPricingEditor.tsx
  │   ├── SelectedSkuEditor
  │   │   ├── SelectedSkuEditor.module.css
  │   │   └── SelectedSkuEditor.tsx
  │   ├── VariantCombinationsTable
  │   │   ├── VariantCombinationsTable.module.css
  │   │   └── VariantCombinationsTable.tsx
  │   └── VariantOptionsSection
  │       ├── VariantOptionsSection.module.css
  │       └── VariantOptionsSection.tsx
  ├── hooks
  │   ├── useProductCatalogOptions.ts
  │   ├── useProductEditor.ts
  │   └── useProductMedia.ts
  ├── tests
  │   ├── ProductGeneralSection.test.tsx
  │   ├── ProductPreferences.test.tsx
  │   ├── ProductPreferences.validation.test.ts
  │   ├── SelectedSkuEditor.test.tsx
  │   └── VariantCombinationsTable.test.tsx
  ├── types
  │   └── productEditor.types.ts
  ├── utils
  │   ├── productEditor.mappers.ts
  │   ├── productEditor.save.ts
  │   ├── productEditor.validation.ts
  │   ├── variantCsv.ts
  │   └── variantPaths.ts
  ├── AdminProductEditorPage.module.css
  ├── AdminProductEditorPage.tsx
  └── index.ts
```

## Reading order

1. Start with `AdminProductEditorPage.tsx` to understand section composition.
2. Read `hooks/useProductEditor.ts` to follow the main state and save flow.
3. Read `hooks/useProductCatalogOptions.ts` for category, type, brand, attribute-path, and SKU combination behaviour.
4. Read the files under `components/` to understand each visible panel.
5. Read `utils/productEditor.save.ts`, validation, and mapper files to understand backend persistence.
6. Read `variantPaths.ts` and `variantCsv.ts` for combination rules and import/export behaviour.

# Complete source code

## 1. `web/src/admin/product-editor/components/AdditionalProductDetails/AdditionalProductDetails.module.css`

Lines: 16 · Size: 261 bytes

````css
.root {
  min-width: 0;
}

.descriptions {
  display: grid;
  grid-template-columns: minmax(14rem, 0.8fr) minmax(20rem, 1.7fr);
  gap: 0.75rem 0.9rem;
  margin-bottom: 1rem;
}

@media (max-width: 760px) {
  .descriptions {
    grid-template-columns: 1fr;
  }
}
````
## 2. `web/src/admin/product-editor/components/AdditionalProductDetails/AdditionalProductDetails.tsx`

Lines: 61 · Size: 2510 bytes

````tsx
import type { ProductEditorController } from "../../hooks/useProductEditor";
import type { ProductFormState } from "../../types/productEditor.types";
import styles from "./AdditionalProductDetails.module.css";

interface Props {
  editor: ProductEditorController;
}

/** Storefront copy, publication defaults, feature flag, and shared media. */
export const AdditionalProductDetails = ({ editor }: Props) => (
  <details className={`${styles.root} product-editor-panel product-details-panel`} open>
    <summary>Additional Product Details</summary>

    <div className={styles.descriptions}>
      <div className="form-group">
        <label htmlFor="short-description">Short description</label>
        <textarea
          id="short-description"
          className="form-input admin-textarea product-short-description"
          value={editor.form.shortDescription}
          onChange={(event) => editor.setField("shortDescription", event.target.value)}
          maxLength={500}
          placeholder="A short note shown near the product title"
        />
        <small className="admin-field-help">A quick customer-facing summary, up to 500 characters.</small>
      </div>
      <div className="form-group">
        <label htmlFor="description">Full description</label>
        <textarea
          id="description"
          className="form-input admin-textarea"
          value={editor.form.description}
          onChange={(event) => editor.setField("description", event.target.value)}
          placeholder="Describe the product, materials, features and care information"
        />
      </div>
    </div>

    <div className="product-details-grid">
      <div className="form-group">
        <label htmlFor="product-status">Default save status</label>
        <select
          id="product-status"
          className="form-input"
          value={editor.form.status}
          onChange={(event) => editor.setField("status", event.target.value as ProductFormState["status"])}
        >
          <option value="ACTIVE">Active</option>
          <option value="DRAFT">Draft</option>
          <option value="INACTIVE">Inactive</option>
          <option value="DISCONTINUED">Discontinued</option>
        </select>
      </div>
      <label className="admin-checkbox">
        <input type="checkbox" checked={editor.form.isFeatured} onChange={(event) => editor.setField("isFeatured", event.target.checked)} />
        Feature this product on the storefront
      </label>
    </div>

  </details>
);
````
## 3. `web/src/admin/product-editor/components/ProductEditorHeader/ProductEditorHeader.module.css`

Lines: 3 · Size: 26 bytes

````css
.root {
  min-width: 0;
}
````
## 4. `web/src/admin/product-editor/components/ProductEditorHeader/ProductEditorHeader.tsx`

Lines: 59 · Size: 1819 bytes

````tsx
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

import type { ProductEditorController } from "../../hooks/useProductEditor";
import styles from "./ProductEditorHeader.module.css";

interface Props {
  editor: ProductEditorController;
}

/**
 * Page identity and save actions.
 * Buttons target the form by ID so the header can remain outside the form while
 * still using the browser's normal validation and submit event.
 */
export const ProductEditorHeader = ({ editor }: Props) => {
  const disabled = editor.submitting || editor.productTypes.length === 0;

  return (
    <header className={`${styles.root} product-editor-header`}>
      <div>
        <div className="product-editor-breadcrumb">
          <Link to="/admin/products">Products</Link>
          <span>/</span>
          <span>{editor.editingProductId ? "Edit Product" : "Add Product"}</span>
        </div>
        <h1>{editor.editingProductId ? "Edit Product" : "Add New Product"}</h1>
      </div>

      <div className="product-editor-actions">
        <button type="button" className="btn btn-ghost" onClick={editor.closeEditor}>
          <ArrowLeft size={16} /> Cancel
        </button>
        <button
          form="product-editor-form"
          type="submit"
          data-status="DRAFT"
          className="btn btn-ghost"
          disabled={disabled}
        >
          Save Draft
        </button>
        <button
          form="product-editor-form"
          type="submit"
          data-status="ACTIVE"
          className="btn btn-primary"
          disabled={disabled}
        >
          {editor.submitting
            ? "Saving..."
            : editor.editingProductId
              ? "Save & Publish"
              : "Publish Product"}
        </button>
      </div>
    </header>
  );
};
````
## 5. `web/src/admin/product-editor/components/ProductGeneralSection/ProductGeneralSection.module.css`

Lines: 3 · Size: 26 bytes

````css
.root {
  min-width: 0;
}
````
## 6. `web/src/admin/product-editor/components/ProductGeneralSection/ProductGeneralSection.tsx`

Lines: 123 · Size: 4355 bytes

````tsx
import { Link } from "react-router-dom";

import type { ProductEditorController } from "../../hooks/useProductEditor";
import styles from "./ProductGeneralSection.module.css";

interface Props {
  editor: ProductEditorController;
}

/**
 * Product identity and catalog relationships only.
 * Category limits the visible product types; brand remains global and optional.
 */
export const ProductGeneralSection = ({ editor }: Props) => {
  const {
    allowedProductTypeIds,
    brands,
    categories,
    editingProductId,
    form,
    originalVariantIds,
    productTypes,
    setField,
    setForm,
  } = editor;

  return (
    <section className={`${styles.root} product-editor-panel product-summary-panel`}>
      <div className="product-summary-grid">
        <div className="form-group">
          <label htmlFor="product-name">Product name <span>*</span></label>
          <input
            id="product-name"
            className="form-input"
            value={form.name}
            placeholder="Enter product name"
            onChange={(event) => setField("name", event.target.value)}
            required
            minLength={2}
            maxLength={200}
          />
        </div>

        <div className="form-group">
          <div className="admin-field-label-row">
            <label htmlFor="product-category">Category <span>*</span></label>
            <Link to="/admin/categories">+ New</Link>
          </div>
          <select
            id="product-category"
            className="form-input"
            value={form.categoryId}
            onChange={(event) => {
              const nextCategoryId = event.target.value;
              setForm((current) => ({
                ...current,
                categoryId: nextCategoryId,
                productTypeId: editingProductId && originalVariantIds.length > 0
                  ? current.productTypeId
                  : "",
              }));
            }}
            required
          >
            <option value="">Select category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.displayName}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <div className="admin-field-label-row">
            <label htmlFor="product-type">Product type <span>*</span></label>
            <Link to="/admin/categories">Manage category types</Link>
          </div>
          <select
            id="product-type"
            className="form-input"
            value={form.productTypeId}
            onChange={(event) => setField("productTypeId", event.target.value)}
            disabled={Boolean(editingProductId && originalVariantIds.length)}
            required
          >
            <option value="">Select product type</option>
            {productTypes
              .filter((type) => allowedProductTypeIds.includes(type.id))
              .map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
          </select>
          {editingProductId && originalVariantIds.length > 0 && (
            <small className="admin-field-help">
              Locked because saved variants use this type&apos;s attributes.
            </small>
          )}
          {form.categoryId && allowedProductTypeIds.length === 0 && (
            <small className="admin-field-help admin-field-help-error">
              Assign at least one product type to this category before saving a product.
            </small>
          )}
        </div>

        <div className="form-group">
          <div className="admin-field-label-row">
            <label htmlFor="product-brand">Brand</label>
            <Link to="/admin/brands">+ New brand</Link>
          </div>
          <select
            id="product-brand"
            className="form-input"
            value={form.brandId}
            onChange={(event) => setField("brandId", event.target.value)}
          >
            <option value="">No brand</option>
            {brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
          </select>
          <small className="admin-field-help">
            Brands are global and optional; they do not depend on category or product type.
          </small>
        </div>
      </div>
    </section>
  );
};
````
## 7. `web/src/admin/product-editor/components/ProductPreferences/PreferenceRow.tsx`

Lines: 80 · Size: 2794 bytes

````tsx
import { Fragment, type ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import type { ProductPreferenceMode } from "../../types/productEditor.types";
import styles from "./ProductPreferences.module.css";

/** One reusable row. Add future preferences through the list in ProductPreferences.tsx. */
export interface PreferenceDefinition {
  id: string;
  title: string;
  summary: string;
  mode: ProductPreferenceMode;
  /** false means one mode MUST remain selected (used for Product media). */
  allowOff: boolean;
  onChange: (mode: ProductPreferenceMode) => void;
  content: ReactNode;
}

interface Props {
  preference: PreferenceDefinition;
  expanded: boolean;
  onToggleExpanded: () => void;
}

export const PreferenceRow = ({ preference, expanded, onToggleExpanded }: Props) => {
  const selected = preference.mode !== "off";
  const detailId = `product-preference-${preference.id}`;

  /** Checkbox look, but exactly one scope at a time. Clicking again means Off only when allowed. */
  const choose = (mode: "all" | "individual") => {
    preference.onChange(preference.mode === mode && preference.allowOff ? "off" : mode);
  };

  return (
    <Fragment>
      <tr className={styles.choiceRow}>
        <th scope="row" className={styles.nameCell}>
          <span className={styles.preferenceName}>{preference.title}</span>
          <span className={styles.summary}>{preference.summary}</span>
          {selected && (
            <button
              type="button"
              className={styles.expandButton}
              onClick={onToggleExpanded}
              aria-expanded={expanded}
              aria-controls={detailId}
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {expanded ? "Hide settings" : "Show settings"}
            </button>
          )}
        </th>
        <td className={styles.checkCell}>
          <input
            type="checkbox"
            aria-label={`${preference.title}: All SKUs`}
            checked={preference.mode === "all"}
            onChange={() => choose("all")}
          />
        </td>
        <td className={styles.checkCell}>
          <input
            type="checkbox"
            aria-label={`${preference.title}: Individual SKU`}
            checked={preference.mode === "individual"}
            onChange={() => choose("individual")}
          />
        </td>
      </tr>
      {/* Render settings immediately after its own choice row, never at the bottom of the list. */}
      {selected && expanded && (
        <tr id={detailId} className={styles.detailRow}>
          <td colSpan={3}>
            <div className={styles.detailContent}>{preference.content}</div>
          </td>
        </tr>
      )}
    </Fragment>
  );
};
````
## 8. `web/src/admin/product-editor/components/ProductPreferences/ProductMediaLibrary.tsx`

Lines: 97 · Size: 4519 bytes

````tsx
import { ImagePlus, Star, Trash2, X } from "lucide-react";

import type { ProductEditorController } from "../../hooks/useProductEditor";

interface Props {
  editor: ProductEditorController;
}

/**
 * Shows saved media and the local upload queue.
 * Saved media changes immediately in edit mode; pending files upload during save
 * after product and SKU database IDs are available.
 */
export const ProductMediaLibrary = ({ editor }: Props) => (
  <div className="product-media-library">
    <div className="variant-workbench-heading">
      <div>
        <h3>Product media library</h3>
        <p>{editor.mediaScope === "all"
          ? "New uploads are shared by all variants."
          : "Add SKU media from the Selected Variant panel; shared media remains available as fallback."}</p>
      </div>
    </div>

    {editor.media.length > 0 && (
      <div className="admin-media-grid">
        {editor.media.map((item) => (
          <article className="admin-media-card" key={item.id}>
            <div className="admin-media-image">
              {item.type === "VIDEO"
                ? <video src={item.url} controls muted playsInline preload="metadata" />
                : <img src={item.thumbnailUrl || item.url} alt={item.altText || editor.form.name} />}
              {item.isPrimary && <span className="admin-primary-badge"><Star size={13} /> Primary</span>}
            </div>
            <div className="admin-media-actions">
              {editor.editingProductId && (
                <select
                  className="form-input"
                  aria-label={`Assign ${item.altText || "media"} to a variant`}
                  value={item.variantId ?? ""}
                  disabled={editor.mediaBusyId === item.id}
                  onChange={(event) => void editor.assignMediaToVariant(item.id, event.target.value)}
                >
                  <option value="">All variants</option>
                  {editor.variantDrafts.filter((variant) => variant.id).map((variant) => (
                    <option key={variant.id} value={variant.id}>{variant.optionLabel || variant.sku}</option>
                  ))}
                </select>
              )}
              {item.type === "IMAGE" && !item.isPrimary && (
                <button type="button" onClick={() => void editor.setPrimaryImage(item.id)} disabled={editor.mediaBusyId === item.id}><Star size={16} /> Primary</button>
              )}
              <button className="media-delete-button" type="button" onClick={() => void editor.deleteImage(item.id)} disabled={editor.mediaBusyId === item.id}><Trash2 size={16} /> Delete</button>
            </div>
          </article>
        ))}
      </div>
    )}

    {editor.pendingMedia.length > 0 && (
      <div className="pending-image-list">
        {editor.pendingMedia.map((item) => (
          <div key={item.key}>
            <span>{item.file.name}</span>
            {editor.mediaScope === "all" ? <small>All variants</small> : (
              <select
                className="form-input"
                aria-label={`Assign ${item.file.name} to a variant`}
                value={item.variantKey}
                onChange={(event) => editor.movePendingMedia(item.key, event.target.value)}
              >
                <option value="all">Shared fallback</option>
                {editor.variantDrafts.map((variant) => (
                  <option key={variant.key} value={variant.key}>{variant.optionLabel || variant.sku || "Default"}</option>
                ))}
              </select>
            )}
            <button type="button" aria-label={`Remove ${item.file.name}`} onClick={() => editor.setPendingMedia((current) => current.filter((entry) => entry.key !== item.key))}><X size={15} /></button>
          </div>
        ))}
      </div>
    )}

    {editor.mediaScope === "all" && editor.mediaCountForScope("all") < 4 ? (
      <label className="admin-image-picker">
        <ImagePlus size={22} />
        <span>Add shared media</span>
        <small>JPEG, PNG, WebP up to 2 MB · MP4, WebM up to 20 MB · 4 shared items</small>
        <input type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" multiple onChange={editor.handleImageSelection} />
      </label>
    ) : editor.mediaScope === "all" ? (
      <p className="admin-media-limit">The four-item shared media limit has been reached.</p>
    ) : (
      <p className="admin-media-limit">Individual SKU uploads are available in the Selected Variant panel.</p>
    )}
  </div>
);
````
## 9. `web/src/admin/product-editor/components/ProductPreferences/ProductPreferences.module.css`

Lines: 30 · Size: 2259 bytes

````css
/* Only preference-layout styles go here. Existing pricing/media controls keep their styles. */
.root { display: grid; gap: 0.75rem; min-width: 0; }
.heading { margin: 0; font-size: 1.05rem; font-weight: 700; }
.tableScroll { min-width: 0; overflow-x: auto; border: 1px solid #e2e8f0; border-radius: 0.75rem; background: #fff; }
.table { width: 100%; table-layout: fixed; border-collapse: collapse; }
.table thead { background: #f8fafc; }
.table thead th { font-size: 0.76rem; font-weight: 700; text-align: center; color: #475569; padding: 0.7rem 0.35rem; }
.table thead th:first-child { width: 46%; text-align: left; padding-left: 0.9rem; }
.table thead th:nth-child(2), .table thead th:nth-child(3) { width: 27%; }
.choiceRow { border-top: 1px solid #e2e8f0; }
.nameCell { padding: 0.85rem 0.5rem 0.75rem 0.9rem; text-align: left; vertical-align: middle; font-weight: normal; }
.preferenceName { display: block; font-size: 0.9rem; font-weight: 650; color: #172033; }
.summary { display: block; margin-top: 0.22rem; font-size: 0.76rem; color: #64748b; line-height: 1.35; }
.checkCell { text-align: center; vertical-align: middle; padding: 0.5rem 0.25rem; }
.checkCell input { cursor: pointer; width: 1.08rem; height: 1.08rem; accent-color: #2563eb; }
.expandButton { display: inline-flex; align-items: center; gap: 0.18rem; margin-top: 0.34rem; padding: 0; border: 0; background: transparent; color: #1d4ed8; font-size: 0.73rem; cursor: pointer; }
.expandButton:hover { text-decoration: underline; }
.detailRow { background: #f8fafc; border-top: 1px solid #e2e8f0; }
.detailRow > td { padding: 0; }
.detailContent { padding: 0.8rem 0.85rem 1rem; min-width: 0; overflow-wrap: anywhere; }
.note { margin: 0 0 0.6rem; font-size: 0.8rem; line-height: 1.45; color: #475569; }
.completeness { margin: 0 0 0.5rem; padding: 0.65rem 0.75rem; border-radius: 0.4rem; background: #eff6ff; color: #1e40af; font-size: 0.8rem; }
.warning { background: #fff7ed; color: #9a3412; }
@media (max-width: 540px) {
  .table thead th { font-size: 0.68rem; }
  .nameCell { padding-left: 0.5rem; }
  .table thead th:first-child { padding-left: 0.5rem; width: 42%; }
  .table thead th:nth-child(2), .table thead th:nth-child(3) { width: 29%; }
  .detailContent { padding: 0.65rem; }
}
````
## 10. `web/src/admin/product-editor/components/ProductPreferences/ProductPreferences.tsx`

Lines: 143 · Size: 6937 bytes

````tsx
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
````
## 11. `web/src/admin/product-editor/components/ProductPreferences/QuantityPricingEditor.tsx`

Lines: 82 · Size: 4149 bytes

````tsx
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
````
## 12. `web/src/admin/product-editor/components/SelectedSkuEditor/SelectedSkuEditor.module.css`

Lines: 3 · Size: 27 bytes

````css
.root {
  min-width: 0;
}
````
## 13. `web/src/admin/product-editor/components/SelectedSkuEditor/SelectedSkuEditor.tsx`

Lines: 109 · Size: 7120 bytes

````tsx
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
````
## 14. `web/src/admin/product-editor/components/VariantCombinationsTable/VariantCombinationsTable.module.css`

Lines: 3 · Size: 27 bytes

````css
.root {
  min-width: 0;
}
````
## 15. `web/src/admin/product-editor/components/VariantCombinationsTable/VariantCombinationsTable.tsx`

Lines: 110 · Size: 7304 bytes

````tsx
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
````
## 16. `web/src/admin/product-editor/components/VariantOptionsSection/VariantOptionsSection.module.css`

Lines: 3 · Size: 27 bytes

````css
.root {
  min-width: 0;
}
````
## 17. `web/src/admin/product-editor/components/VariantOptionsSection/VariantOptionsSection.tsx`

Lines: 175 · Size: 8249 bytes

````tsx
import { GitBranch, Layers3, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

import type { VariantOptionsController } from "../../hooks/useProductCatalogOptions";
import { SKIP_OPTION_VALUE, type VariantPathNode } from "../../utils/variantPaths";
import styles from "./VariantOptionsSection.module.css";

interface Props {
  builder: VariantOptionsController;
}

/**
 * Builds explicit parent-child paths for this product only.
 * Example: Black -> XL -> Cotton can exist without forcing Green -> XL -> Cotton.
 */
export const VariantOptionsSection = ({ builder }: Props) => {
  const renderPathTree = (nodes: VariantPathNode[], depth = 0): React.ReactNode => (
    <ul className={`variant-path-tree-level depth-${depth}`}>
      {nodes.map((node) => {
        const leafVariantKey = node.terminalVariantKeys[0] ?? null;
        return (
          <li key={`${node.attributeId}-${node.valueId}`}>
            <div className="variant-path-tree-node">
              <button
                type="button"
                className={`variant-path-node-select${leafVariantKey === builder.focusedVariantKey ? " is-selected" : ""}`}
                onClick={() => leafVariantKey && builder.setFocusedVariantKey(leafVariantKey)}
                disabled={!leafVariantKey}
              >
                <small>{node.attributeName}</small>
                <span>{node.colorHex && <i style={{ backgroundColor: node.colorHex }} />}{node.label}</span>
                {leafVariantKey && <em>SKU</em>}
              </button>
              <button
                type="button"
                className="variant-path-branch-remove"
                onClick={() => builder.removePathBranch(node)}
                aria-label={`Remove ${node.label} branch affecting ${node.variantKeys.length} SKU paths`}
                title={`Remove ${node.variantKeys.length} affected SKU path${node.variantKeys.length === 1 ? "" : "s"}`}
              >
                <Trash2 size={13} /> <span>{node.variantKeys.length}</span>
              </button>
            </div>
            {node.children.length > 0 && renderPathTree(node.children, depth + 1)}
          </li>
        );
      })}
    </ul>
  );

  return (
    <section className={`${styles.root} variant-options-panel`} aria-label="Variant options">
      <div className="variant-workbench-heading">
        <div>
          <h3>Product-specific variant paths</h3>
          <p>Build one valid parent-to-child path at a time. No unwanted combinations are generated.</p>
        </div>
        <Link className="admin-view-link" to="/admin/attributes"><Plus size={15} /> Add attribute</Link>
      </div>

      {builder.loading ? <p>Loading product attributes...</p> : builder.assignments.length === 0 ? (
        <div className="admin-variant-empty">
          <Layers3 size={24} />
          <div>
            <strong>This product type has no attributes yet.</strong>
            <p>Keep one simple stock variant or <Link to="/admin/attributes">add reusable attributes</Link>.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="variant-path-guide">
            <GitBranch size={18} />
            <span>Changing a parent clears its child choices. After adding a SKU, the parent prefix stays ready so you can add a sibling.</span>
          </div>

          <div className="admin-option-selector variant-options-grid variant-path-selector">
            {builder.assignments.map((assignment, assignmentIndex) => {
              const canChoose = builder.assignments.slice(0, assignmentIndex).every((parent) =>
                Object.hasOwn(builder.pathSelection, parent.attributeId),
              );
              const selectedValueId = builder.pathSelection[assignment.attributeId];
              return (
                <fieldset key={assignment.attributeId} className={canChoose ? "" : "is-locked"}>
                  <legend>
                    <span>{assignmentIndex + 1}</span>
                    {assignment.attribute.name}{assignment.isRequired ? " *" : ""}
                    <small>{canChoose ? selectedValueId ? "Chosen" : "Choose one" : "Choose parent first"}</small>
                  </legend>
                  <div className="variant-value-chips">
                    {assignment.attribute.values
                      .filter((value) => value.isActive && !value.deletedAt)
                      .map((value) => (
                        <label key={value.id}>
                          <input
                            type="radio"
                            name={`variant-path-${assignment.attributeId}`}
                            checked={selectedValueId === value.id}
                            disabled={!canChoose}
                            onChange={() => builder.choosePathValue(assignment.attributeId, value.id)}
                          />
                          {value.colorHex && <i style={{ backgroundColor: value.colorHex }} />}
                          {value.label}
                        </label>
                      ))}
                    {!assignment.isRequired && (
                      <label className="variant-path-skip">
                        <input
                          type="radio"
                          name={`variant-path-${assignment.attributeId}`}
                          checked={selectedValueId === SKIP_OPTION_VALUE}
                          disabled={!canChoose}
                          onChange={() => builder.choosePathValue(assignment.attributeId, SKIP_OPTION_VALUE)}
                        />
                        Not used for this SKU
                      </label>
                    )}
                  </div>
                  <div className="variant-inline-add">
                    <input
                      className="form-input"
                      value={builder.newValueLabels[assignment.attributeId] ?? ""}
                      placeholder={`Add new ${assignment.attribute.name.toLowerCase()}`}
                      onChange={(event) => builder.setNewValueLabels((current) => ({
                        ...current,
                        [assignment.attributeId]: event.target.value,
                      }))}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          void builder.addSuggestedValue(assignment);
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="btn btn-ghost"
                      disabled={builder.addingValueFor === assignment.attributeId}
                      onClick={() => void builder.addSuggestedValue(assignment)}
                    >
                      <Plus size={15} /> {builder.addingValueFor === assignment.attributeId ? "Adding..." : "Add"}
                    </button>
                  </div>
                </fieldset>
              );
            })}
          </div>

          <div className="variant-path-create-bar">
            <div>
              <small>Exact SKU path</small>
              <strong>{builder.currentPathLabels.length ? builder.currentPathLabels.join(" → ") : "Choose the first attribute"}</strong>
            </div>
            <button type="button" className="btn btn-primary" onClick={builder.addExactVariantPath} disabled={!builder.pathIsComplete}>
              <Plus size={17} /> Add exact SKU
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => builder.setPathSelection({})} disabled={builder.currentPathLabels.length === 0}>
              Clear path
            </button>
          </div>

          {builder.variantPathTree.length > 0 && (
            <div className="variant-path-tree">
              <div>
                <GitBranch size={17} />
                <strong>Current product tree</strong>
                <small>{builder.exactPathCount} exact SKU path{builder.exactPathCount === 1 ? "" : "s"}</small>
              </div>
              {renderPathTree(builder.variantPathTree)}
            </div>
          )}
        </>
      )}
    </section>
  );
};
````
## 18. `web/src/admin/product-editor/hooks/useProductCatalogOptions.ts`

Lines: 461 · Size: 18360 bytes

````ts
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
````
## 19. `web/src/admin/product-editor/hooks/useProductEditor.ts`

Lines: 366 · Size: 14840 bytes

````ts
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
````
## 20. `web/src/admin/product-editor/hooks/useProductMedia.ts`

Lines: 198 · Size: 7074 bytes

````ts
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
````
## 21. `web/src/admin/product-editor/tests/ProductGeneralSection.test.tsx`

Lines: 31 · Size: 1408 bytes

````tsx
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { ProductGeneralSection } from "../components/ProductGeneralSection/ProductGeneralSection";
import type { ProductEditorController } from "../hooks/useProductEditor";
import { emptyProductForm } from "../utils/productEditor.mappers";

describe("ProductGeneralSection", () => {
  it("shows only product identity and catalog relationships", () => {
    const editor = {
      form: { ...emptyProductForm, categoryId: "category-1", productTypeId: "type-1" },
      categories: [{ id: "category-1", name: "Clothing", displayName: "Clothing", children: [], allowProducts: true }],
      brands: [{ id: "brand-1", name: "DokanBD", isActive: true, deletedAt: null }],
      productTypes: [{ id: "type-1", name: "T-shirt", isActive: true, deletedAt: null }],
      allowedProductTypeIds: ["type-1"],
      editingProductId: null,
      originalVariantIds: [],
      setField: vi.fn(),
      setForm: vi.fn(),
    } as unknown as ProductEditorController;

    const html = renderToStaticMarkup(
      <MemoryRouter><ProductGeneralSection editor={editor} /></MemoryRouter>,
    );
    expect(html).toContain("Product name");
    expect(html).toContain("Clothing");
    expect(html).toContain("T-shirt");
    expect(html).toContain("DokanBD");
  });
});
````
## 22. `web/src/admin/product-editor/tests/ProductPreferences.test.tsx`

Lines: 70 · Size: 2915 bytes

````tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { ProductPreferences } from "../components/ProductPreferences/ProductPreferences";
import type { ProductEditorController } from "../hooks/useProductEditor";
import { createEmptyVariant, emptyProductForm } from "../utils/productEditor.mappers";

/** Keep the test fixture small: it models only controller values used by this panel. */
const mockEditor = (overrides: Record<string, unknown> = {}) => ({
  form: emptyProductForm,
  variantDrafts: [createEmptyVariant()],
  priceTiers: [],
  setPriceTiers: vi.fn(),
  priceTierScope: "all",
  bulkPricingMode: "off",
  discountScope: "all",
  discountMode: "off",
  mediaScope: "all",
  media: [],
  pendingMedia: [],
  mediaBusyId: null,
  mediaCountForScope: vi.fn().mockReturnValue(0),
  handleImageSelection: vi.fn(),
  changeBulkPricingMode: vi.fn(),
  changeDiscountMode: vi.fn(),
  changeMediaScope: vi.fn(),
  globalDiscountPercentage: "",
  settingsRegularPrice: "",
  editingProductId: null,
  setField: vi.fn(),
  ...overrides,
}) as unknown as ProductEditorController;

describe("ProductPreferences", () => {
  it("starts a new product with discount Off and empty discount controls", () => {
    const html = renderToStaticMarkup(<ProductPreferences editor={mockEditor()} />);

    expect(html).toContain("Offer discount");
    expect(html).toContain("Not enabled");
    expect(html).not.toMatch(/aria-label="Offer discount: All SKUs"[^>]*checked/);
    expect(html).not.toMatch(/aria-label="Offer discount: Individual SKU"[^>]*checked/);
    expect(html).not.toContain("Discount % off");
  });

  it("has a clean heading, three rows, and mandatory shared media", () => {
    const html = renderToStaticMarkup(<ProductPreferences editor={mockEditor()} />);
    expect(html).toContain("Product Preferences");
    expect(html).not.toContain("Choose the features to enable");
    expect(html).toContain("Bulk pricing");
    expect(html).toContain("Offer discount");
    expect(html).toContain("Product media");
    expect(html).toContain("Shared");
    expect(html).toContain("Add shared media");
  });

  it("shows the shared bulk price count when offers exist", () => {
    const html = renderToStaticMarkup(<ProductPreferences editor={mockEditor({
      bulkPricingMode: "all",
      priceTiers: [{ key: "tier-1", variantKey: "all", minimumQuantity: "3", unitPrice: "95", isPromotion: false, isActive: true }],
    })} />);
    expect(html).toContain("1 bulk price offer");
    expect(html).toContain("Set quantity price blocks");
  });

  it("requires one image per active SKU when individual media is selected", () => {
    const html = renderToStaticMarkup(<ProductPreferences editor={mockEditor({ mediaScope: "individual" })} />);
    expect(html).toContain("1 per SKU");
    expect(html).toContain("SKU images ready: 0 / 1");
  });
});
````
## 23. `web/src/admin/product-editor/tests/ProductPreferences.validation.test.ts`

Lines: 112 · Size: 4212 bytes

````ts
import { describe, expect, it } from "vitest";
import type { AdminProduct } from "../../../api/adminProducts";
import type { ProductMedia } from "../../../api/products";
import { resolveDiscountPreferenceMode } from "../hooks/useProductEditor";
import {
  createEmptyVariant,
  emptyProductForm,
  mapProductToEditor,
} from "../utils/productEditor.mappers";
import {
  discountPercentageFromPrice,
  discountPriceFromPercentage,
  validateProductEditor,
} from "../utils/productEditor.validation";

const form = { ...emptyProductForm, name: "Example shirt", categoryId: "1", productTypeId: "2" };
const variant = { ...createEmptyVariant(), key: "variant-1", sku: "SHIRT-1", price: "100" };
const input = { form, variants: [variant], tiers: [], globalDiscountEnabled: false };

describe("media publication requirements", () => {
  it("allows incomplete media on Save Draft", () => {
    expect(validateProductEditor({ ...input, requestedStatus: "DRAFT", mediaScope: "all" }).ok).toBe(true);
  });
  it("rejects missing shared image on Publish", () => {
    expect(validateProductEditor({ ...input, requestedStatus: "ACTIVE", mediaScope: "all" })).toEqual({
      ok: false, error: "Add at least one shared product image before publishing.",
    });
  });
  it("rejects a shared image as fulfillment of individual SKU image requirement", () => {
    const shared = { id: "image1", type: "IMAGE", variantId: null } as ProductMedia;
    expect(validateProductEditor({ ...input, requestedStatus: "ACTIVE", mediaScope: "individual", media: [shared] }).ok).toBe(false);
  });
  it("accepts an image pending for the exact SKU", () => {
    const file = new File(["image"], "picture.jpg", { type: "image/jpeg" });
    expect(validateProductEditor({
      ...input,
      requestedStatus: "ACTIVE", mediaScope: "individual",
      pendingMedia: [{ key: "file-1", file, variantKey: "variant-1" }],
    }).ok).toBe(true);
  });
});

describe("discount preference regressions", () => {
  it("resolves a new product's remembered All scope to Off until explicitly enabled", () => {
    expect(resolveDiscountPreferenceMode(false, "all")).toBe("off");
    expect(resolveDiscountPreferenceMode(true, "all")).toBe("all");
  });

  it("keeps blank and legacy zero discount prices from displaying 100 percent", () => {
    expect(discountPercentageFromPrice("100", "")).toBe("");
    expect(discountPercentageFromPrice("100", "0")).toBe("");
    expect(discountPriceFromPercentage("100", "")).toBe("");
  });

  it("still calculates legitimate discounts", () => {
    expect(discountPercentageFromPrice("100", "70")).toBe("30");
    expect(discountPriceFromPercentage("100", "30")).toBe("70.00");
  });

  it("preserves a legitimate product discount when editing", () => {
    const product = {
      id: "product-1",
      name: "Existing shirt",
      shortDescription: null,
      description: "Existing shirt",
      productTypeId: "type-1",
      categoryId: "category-1",
      brandId: null,
      regularPrice: 100,
      discountPrice: 70,
      discountStartsAt: null,
      discountEndsAt: null,
      defaultCostPrice: null,
      status: "ACTIVE",
      isFeatured: false,
      variants: [],
      priceTiers: [],
      media: [],
    } as unknown as AdminProduct;

    const mapped = mapProductToEditor(product);
    expect(mapped.globalDiscountEnabled).toBe(true);
    expect(mapped.discountScope).toBe("all");
    expect(mapped.form.discountPrice).toBe("70");
  });

  it("treats a legacy zero product discount as Off", () => {
    const product = {
      id: "product-2",
      name: "Product without an offer",
      shortDescription: null,
      description: "Product without an offer",
      productTypeId: "type-1",
      categoryId: "category-1",
      brandId: null,
      regularPrice: 100,
      discountPrice: 0,
      discountStartsAt: null,
      discountEndsAt: null,
      defaultCostPrice: null,
      status: "ACTIVE",
      isFeatured: false,
      variants: [],
      priceTiers: [],
      media: [],
    } as unknown as AdminProduct;

    const mapped = mapProductToEditor(product);
    expect(mapped.globalDiscountEnabled).toBe(false);
    expect(mapped.form.discountPrice).toBe("");
  });
});
````
## 24. `web/src/admin/product-editor/tests/SelectedSkuEditor.test.tsx`

Lines: 32 · Size: 1271 bytes

````tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { SelectedSkuEditor } from "../components/SelectedSkuEditor/SelectedSkuEditor";
import type { VariantOptionsController } from "../hooks/useProductCatalogOptions";
import { createEmptyVariant } from "../utils/productEditor.mappers";

describe("SelectedSkuEditor", () => {
  it("renders the focused SKU's commercial and inventory fields", () => {
    const variant = { ...createEmptyVariant(), sku: "SHIRT-BLACK-XL", optionLabel: "Black / XL" };
    const builder = {
      focusedVariant: variant,
      focusedPreviewMedia: undefined,
      focusedMediaLimitReached: false,
      variantMediaEnabled: true,
      focusedDiscountPercentage: "",
      focusedMedia: [],
      focusedPendingMedia: [],
      mediaBusyId: null,
      update: vi.fn(),
      onAddMedia: vi.fn(),
      onSetPrimaryMedia: vi.fn(),
      onDeleteMedia: vi.fn(),
    } as unknown as VariantOptionsController;

    const html = renderToStaticMarkup(<SelectedSkuEditor builder={builder} />);
    expect(html).toContain("Black / XL");
    expect(html).toContain("SHIRT-BLACK-XL");
    expect(html).toContain("Selling price");
    expect(html).toContain("Stock quantity");
  });
});
````
## 25. `web/src/admin/product-editor/tests/VariantCombinationsTable.test.tsx`

Lines: 40 · Size: 1532 bytes

````tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { VariantCombinationsTable } from "../components/VariantCombinationsTable/VariantCombinationsTable";
import type { VariantOptionsController } from "../hooks/useProductCatalogOptions";
import { createEmptyVariant } from "../utils/productEditor.mappers";

describe("VariantCombinationsTable", () => {
  it("lists SKUs with bulk, CSV, default, edit, and remove operations", () => {
    const variant = { ...createEmptyVariant(), sku: "SHIRT-BLACK-XL", optionLabel: "Black / XL", price: "899" };
    const builder = {
      variants: [variant],
      assignments: [],
      selectedRows: [],
      focusedVariantKey: variant.key,
      bulkOpen: false,
      bulkField: "price",
      bulkValue: "",
      csvInputRef: { current: null },
      setBulkOpen: vi.fn(),
      setBulkField: vi.fn(),
      setBulkValue: vi.fn(),
      onImportCsv: vi.fn(),
      onExportCsv: vi.fn(),
      toggleAllRows: vi.fn(),
      toggleRow: vi.fn(),
      setFocusedVariantKey: vi.fn(),
      valueForAssignment: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
      applyBulkValue: vi.fn(),
    } as unknown as VariantOptionsController;

    const html = renderToStaticMarkup(<VariantCombinationsTable builder={builder} />);
    expect(html).toContain("All Variant Combinations (1)");
    expect(html).toContain("SHIRT-BLACK-XL");
    expect(html).toContain("Import CSV");
    expect(html).toContain("Export CSV");
  });
});
````
## 26. `web/src/admin/product-editor/types/productEditor.types.ts`

Lines: 78 · Size: 2128 bytes

````ts
import type { AdminProduct, CategoryOption } from "../../../api/adminProducts";

/**
 * Editable product-level fields.
 *
 * Prices stay as strings while the administrator is typing. Converting an empty
 * input to a number too early would turn it into `0`, which is not the same as
 * "not entered". Conversion happens only in the validation/save layer.
 */
export interface ProductFormState {
  name: string;
  shortDescription: string;
  description: string;
  productTypeId: string;
  categoryId: string;
  brandId: string;
  defaultPrice: string;
  discountPrice: string;
  discountStartsAt: string;
  discountEndsAt: string;
  costPrice: string;
  status: AdminProduct["status"];
  isFeatured: boolean;
}

/** Category row prepared for the nested "Parent › Child" select label. */
export interface FlatCategoryOption extends CategoryOption {
  displayName: string;
}

/** One editable SKU row in the browser before it is converted to an API body. */
export interface VariantDraft {
  key: string;
  id?: string;
  optionValueIds: string[];
  optionLabel: string;
  sku: string;
  barcode: string;
  price: string;
  discountPrice: string;
  discountStartsAt: string;
  discountEndsAt: string;
  costPrice: string;
  stockQuantity: string;
  lowStockLevel: string;
  isDefault: boolean;
  isActive: boolean;
}

/** A file selected locally but not uploaded until a product ID exists. */
export interface VariantPendingMedia {
  key: string;
  file: File;
  variantKey: "all" | string;
}

/** Quantity-price row kept in editor keys until database variant IDs are known. */
export interface PriceTierDraft {
  key: string;
  variantKey: "all" | string;
  minimumQuantity: string;
  unitPrice: string;
  isPromotion: boolean;
  isActive: boolean;
}

/** Scope used by existing pricing/media APIs. */
export type PreferenceScope = "all" | "individual";
/** UI adds an optional Off mode without changing the backend API's scope type. */
export type ProductPreferenceMode = PreferenceScope | "off";

export type BulkField =
  | "price"
  | "discountPrice"
  | "costPrice"
  | "stockQuantity"
  | "lowStockLevel"
  | "isActive";
````
## 27. `web/src/admin/product-editor/utils/productEditor.mappers.ts`

Lines: 171 · Size: 6511 bytes

````ts
import type { CreateProductInput, CreateVariantInput, AdminProduct } from "../../../api/adminProducts";
import type {
  PriceTierDraft,
  ProductFormState,
  VariantDraft,
} from "../types/productEditor.types";
import type { ValidatedEditorValues } from "./productEditor.validation";
import { toApiDateTime } from "./productEditor.validation";

export const emptyProductForm: ProductFormState = {
  name: "",
  shortDescription: "",
  description: "",
  productTypeId: "",
  categoryId: "",
  brandId: "",
  defaultPrice: "",
  discountPrice: "",
  discountStartsAt: "",
  discountEndsAt: "",
  costPrice: "",
  status: "ACTIVE",
  isFeatured: false,
};

/** A simple product still needs one database SKU to hold price and inventory. */
export const createEmptyVariant = (): VariantDraft => ({
  key: `new-simple-${Date.now()}`,
  optionValueIds: [],
  optionLabel: "Default",
  sku: "",
  barcode: "",
  price: "",
  discountPrice: "",
  discountStartsAt: "",
  discountEndsAt: "",
  costPrice: "",
  stockQuantity: "0",
  lowStockLevel: "5",
  isDefault: true,
  isActive: true,
});

const toLocalDateTime = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

/**
 * The API may return zero for an old record that never had a discount.
 * Keep real positive discounts, but restore zero/null as an empty editor field.
 */
const normalizeDiscountPrice = (value: number | string | null | undefined) => {
  if (value === null || value === undefined || value === "") return "";
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue > 0 ? String(value) : "";
};

/** Convert the API response into editable strings and stable editor keys. */
export function mapProductToEditor(product: AdminProduct) {
  const variants: VariantDraft[] = (product.variants ?? []).map((variant) => ({
    key: `existing-${variant.id}`,
    id: variant.id,
    optionValueIds: variant.optionValues?.map((value) => value.id) ?? [],
    optionLabel: variant.optionValues?.map((value) => value.label).join(" / ") || variant.name || "Default",
    sku: variant.sku,
    barcode: variant.barcode ?? "",
    price: String(variant.regularPrice ?? variant.price),
    discountPrice: normalizeDiscountPrice(variant.discountPrice),
    discountStartsAt: toLocalDateTime(variant.discountStartsAt),
    discountEndsAt: toLocalDateTime(variant.discountEndsAt),
    costPrice: variant.costPrice == null ? "" : String(variant.costPrice),
    stockQuantity: String(variant.stockQuantity),
    lowStockLevel: String(variant.lowStockLevel ?? 5),
    isDefault: variant.isDefault,
    isActive: variant.isActive ?? true,
  }));
  const usableVariants = variants.length ? variants : [createEmptyVariant()];
  const productDiscountPrice = normalizeDiscountPrice(product.discountPrice);
  const keyByVariantId = new Map(
    variants.flatMap((variant) => variant.id ? [[variant.id, variant.key] as const] : []),
  );
  const priceTiers: PriceTierDraft[] = (product.priceTiers ?? []).map((tier) => ({
    key: `saved-tier-${tier.id}`,
    variantKey: tier.variantId ? keyByVariantId.get(tier.variantId) ?? "all" : "all",
    minimumQuantity: String(tier.minimumQuantity),
    unitPrice: String(tier.unitPrice),
    isPromotion: tier.isPromotion,
    isActive: tier.isActive ?? true,
  }));

  return {
    form: {
      name: product.name,
      shortDescription: product.shortDescription ?? "",
      description: product.description ?? "",
      productTypeId: product.productTypeId,
      categoryId: product.categoryId,
      brandId: product.brandId ?? "",
      defaultPrice: String(product.regularPrice),
      discountPrice: productDiscountPrice,
      discountStartsAt: toLocalDateTime(product.discountStartsAt),
      discountEndsAt: toLocalDateTime(product.discountEndsAt),
      costPrice: product.defaultCostPrice === null ? "" : String(product.defaultCostPrice),
      status: product.status,
      isFeatured: product.isFeatured,
    } satisfies ProductFormState,
    variants: usableVariants,
    originalVariantIds: variants.flatMap((variant) => variant.id ? [variant.id] : []),
    priceTiers,
    priceTierScope: priceTiers.some((tier) => tier.variantKey !== "all") ? "individual" as const : "all" as const,
    discountScope: productDiscountPrice
      ? "all" as const
      : variants.some((variant) => Boolean(variant.discountPrice)) ? "individual" as const : "all" as const,
    mediaScope: (product.media ?? []).some((item) => item.variantId !== null)
      ? "individual" as const
      : "all" as const,
    globalDiscountEnabled: Boolean(productDiscountPrice),
  };
}

export function mapProductInput(
  form: ProductFormState,
  values: ValidatedEditorValues,
  status: AdminProduct["status"],
): CreateProductInput {
  return {
    productTypeId: form.productTypeId,
    categoryId: form.categoryId,
    brandId: form.brandId || null,
    name: form.name.trim(),
    shortDescription: form.shortDescription.trim() || null,
    description: form.description.trim() || form.name.trim(),
    defaultPrice: values.regularPrice,
    defaultCostPrice: values.costPrice,
    discountPrice: values.discountPrice,
    discountStartsAt: values.discountStartsAt,
    discountEndsAt: values.discountEndsAt,
    status,
    isFeatured: form.isFeatured,
    isActive: true,
  };
}

/** Translate temporary editor rows into the backend variant contract. */
export function mapVariantInputs(
  variants: VariantDraft[],
  values: ValidatedEditorValues,
): CreateVariantInput[] {
  return variants.map((variant) => ({
    sku: variant.sku.trim(),
    barcode: variant.barcode.trim() || null,
    variantName: variant.optionLabel || "Default",
    price: Number(variant.price || values.regularPrice),
    discountPrice: variant.discountPrice ? Number(variant.discountPrice) : values.discountPrice,
    discountStartsAt: variant.discountPrice
      ? toApiDateTime(variant.discountStartsAt)
      : values.discountStartsAt,
    discountEndsAt: variant.discountPrice
      ? toApiDateTime(variant.discountEndsAt)
      : values.discountEndsAt,
    costPrice: variant.costPrice ? Number(variant.costPrice) : values.costPrice,
    stockQuantity: Number(variant.stockQuantity),
    lowStockLevel: Number(variant.lowStockLevel || 0),
    isDefault: variant.isDefault,
    isActive: variant.isActive,
    optionValueIds: variant.optionValueIds,
  }));
}
````
## 28. `web/src/admin/product-editor/utils/productEditor.save.ts`

Lines: 142 · Size: 5540 bytes

````ts
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
````
## 29. `web/src/admin/product-editor/utils/productEditor.validation.ts`

Lines: 197 · Size: 8626 bytes

````ts
import type { ProductMedia } from "../../../api/products";
import type {
  PriceTierDraft,
  PreferenceScope,
  VariantPendingMedia,
  ProductFormState,
  VariantDraft,
} from "../types/productEditor.types";

/** Convert a regular price and percentage into the final customer price. */
export function discountPriceFromPercentage(
  regularPriceValue: string,
  percentageValue: string,
) {
  const regularPrice = Number(regularPriceValue);
  const percentage = Number(percentageValue);
  if (
    regularPriceValue === "" ||
    percentageValue === "" ||
    !Number.isFinite(regularPrice) ||
    !Number.isFinite(percentage) ||
    regularPrice < 0 ||
    percentage < 0 ||
    percentage > 100
  ) return "";
  return (regularPrice * (1 - percentage / 100)).toFixed(2);
}

/** Show the percentage represented by an already-entered final discount price. */
export function discountPercentageFromPrice(
  regularPriceValue: string,
  discountPriceValue: string,
) {
  const regularPrice = Number(regularPriceValue);
  const discountPrice = Number(discountPriceValue);
  if (
    regularPriceValue === "" ||
    discountPriceValue === "" ||
    !Number.isFinite(regularPrice) ||
    !Number.isFinite(discountPrice) ||
    regularPrice <= 0 ||
    // Zero is the legacy/unset value in some product records. It must not make
    // a blank discount look like an intentional 100% offer in the editor.
    discountPrice <= 0 ||
    discountPrice > regularPrice
  ) return "";
  return String(Number((((regularPrice - discountPrice) / regularPrice) * 100).toFixed(2)));
}

export const toApiDateTime = (value: string) =>
  value ? new Date(value).toISOString() : null;

export interface ValidatedEditorValues {
  regularPrice: number;
  discountPrice: number | null;
  costPrice: number | null;
  discountStartsAt: string | null;
  discountEndsAt: string | null;
}

interface ValidationInput {
  form: ProductFormState;
  variants: VariantDraft[];
  tiers: PriceTierDraft[];
  globalDiscountEnabled: boolean;
  // Optional for compatibility with existing validation callers; the page supplies all four.
  media?: ProductMedia[];
  pendingMedia?: VariantPendingMedia[];
  mediaScope?: PreferenceScope;
  requestedStatus?: string;
}

/**
 * Validate the complete editor before any write request starts.
 *
 * Keeping these rules outside React makes them reusable in tests and prevents a
 * partially-created product caused by discovering a bad SKU halfway through save.
 */
export function validateProductEditor(
  input: ValidationInput,
): { ok: false; error: string } | { ok: true; values: ValidatedEditorValues } {
  const { form, globalDiscountEnabled, tiers, variants } = input;
  const defaultVariant = variants.find((variant) => variant.isDefault) ?? variants[0];
  const regularPrice = Number(defaultVariant?.price || form.defaultPrice);
  const discountPrice = globalDiscountEnabled && form.discountPrice
    ? Number(form.discountPrice)
    : null;
  const costPrice = defaultVariant?.costPrice
    ? Number(defaultVariant.costPrice)
    : form.costPrice ? Number(form.costPrice) : null;
  const discountStartsAt = discountPrice === null ? null : toApiDateTime(form.discountStartsAt);
  const discountEndsAt = discountPrice === null ? null : toApiDateTime(form.discountEndsAt);

  if (!form.name.trim()) return { ok: false, error: "Enter the product name." };
  if (!form.categoryId) return { ok: false, error: "Choose a category." };
  if (!form.productTypeId) return { ok: false, error: "Choose a product type assigned to this category." };
  if (!defaultVariant || defaultVariant.price === "" || !Number.isFinite(regularPrice)) {
    return { ok: false, error: "Choose a default variant and enter its selling price." };
  }
  if (discountPrice !== null && discountPrice > regularPrice) {
    return { ok: false, error: "The discount price cannot be higher than the regular price." };
  }
  if (discountStartsAt && discountEndsAt && discountStartsAt > discountEndsAt) {
    return { ok: false, error: "The product offer end date must be after its start date." };
  }
  if (variants.length === 0 || variants.some((variant) => !variant.sku.trim())) {
    return { ok: false, error: "Add at least one variant and provide a unique SKU for every row." };
  }

  const normalizedSkus = variants.map((variant) => variant.sku.trim().toUpperCase());
  if (new Set(normalizedSkus).size !== normalizedSkus.length) {
    return { ok: false, error: "Every variant needs a unique SKU. Remove or rename the duplicate SKU before saving." };
  }

  const invalidPrice = variants.find((variant) =>
    variant.price === "" || !Number.isFinite(Number(variant.price)) || Number(variant.price) < 0,
  );
  if (invalidPrice) {
    return { ok: false, error: `${invalidPrice.optionLabel || invalidPrice.sku} needs a selling price.` };
  }

  const invalidInventory = variants.find((variant) => {
    const stock = Number(variant.stockQuantity);
    const lowStock = Number(variant.lowStockLevel || 0);
    return variant.stockQuantity === "" || !Number.isInteger(stock) || stock < 0 ||
      !Number.isInteger(lowStock) || lowStock < 0;
  });
  if (invalidInventory) {
    return { ok: false, error: `${invalidInventory.optionLabel || invalidInventory.sku} needs non-negative whole numbers for stock and low-stock warning.` };
  }

  const invalidCost = variants.find((variant) => variant.costPrice !== "" && (
    !Number.isFinite(Number(variant.costPrice)) || Number(variant.costPrice) < 0
  ));
  if (invalidCost) {
    return { ok: false, error: `${invalidCost.optionLabel || invalidCost.sku} contains an invalid cost price.` };
  }

  const invalidGlobalDiscount = discountPrice === null
    ? undefined
    : variants.find((variant) => !variant.discountPrice && discountPrice > Number(variant.price));
  if (invalidGlobalDiscount) {
    return { ok: false, error: `The all-variant discount is higher than ${invalidGlobalDiscount.optionLabel || invalidGlobalDiscount.sku}'s selling price.` };
  }

  const invalidVariantDiscount = variants.find((variant) => variant.discountPrice && (
    !Number.isFinite(Number(variant.discountPrice)) ||
    Number(variant.discountPrice) < 0 ||
    Number(variant.discountPrice) > Number(variant.price || regularPrice)
  ));
  if (invalidVariantDiscount) {
    return { ok: false, error: `${invalidVariantDiscount.optionLabel || invalidVariantDiscount.sku}'s discount price is higher than its selling price.` };
  }

  const invalidVariantSchedule = variants.find((variant) => {
    const startsAt = toApiDateTime(variant.discountStartsAt);
    const endsAt = toApiDateTime(variant.discountEndsAt);
    return startsAt && endsAt && startsAt > endsAt;
  });
  if (invalidVariantSchedule) {
    return { ok: false, error: `${invalidVariantSchedule.optionLabel || invalidVariantSchedule.sku}'s offer end date must be after its start date.` };
  }

  // Media is checked on Publish, not Save Draft. A video does not replace a product image.
  if (input.requestedStatus === "ACTIVE" && input.mediaScope) {
    const savedImages = (input.media ?? []).filter((item) => item.type === "IMAGE");
    const pendingImages = (input.pendingMedia ?? []).filter((item) => item.file.type.startsWith("image/"));
    if (input.mediaScope === "all") {
      const hasShared = savedImages.some((item) => item.variantId === null) ||
        pendingImages.some((item) => item.variantKey === "all");
      if (!hasShared) return { ok: false, error: "Add at least one shared product image before publishing." };
    } else {
      // A shared fallback image does NOT satisfy an Individual SKU requirement.
      const missing = variants.find((variant) => variant.isActive && !(
        savedImages.some((item) => Boolean(variant.id) && item.variantId === variant.id) ||
        pendingImages.some((item) => item.variantKey === variant.key)
      ));
      if (missing) return { ok: false, error: `${missing.optionLabel || missing.sku} needs its own image before publishing.` };
    }
  }

  const tierSignatures = new Set<string>();
  for (const tier of tiers) {
    if (Number(tier.minimumQuantity) < 2 || tier.unitPrice === "") {
      return { ok: false, error: "Every block price needs a minimum quantity of 2 or more and a unit price." };
    }
    const signature = `${tier.variantKey}:${tier.minimumQuantity}`;
    if (tierSignatures.has(signature)) {
      return { ok: false, error: "The same price scope cannot contain duplicate minimum quantities." };
    }
    tierSignatures.add(signature);
  }

  return { ok: true,
    values: { costPrice, discountEndsAt, discountPrice, discountStartsAt, regularPrice },
  };
}
````
## 30. `web/src/admin/product-editor/utils/variantCsv.ts`

Lines: 392 · Size: 12126 bytes

````ts
/**
 * CSV interchange helpers for the product variant workbench.
 *
 * This module deliberately does not import the editor's VariantDraft type. The
 * editor can map its current (or future) draft shape to VariantCsvSource and
 * apply the returned VariantCsvPatch records without coupling CSV support to a
 * specific UI component.
 */

export type VariantCsvValue = string | number | null | undefined;

export interface VariantCsvSource {
  sku: string;
  barcode?: VariantCsvValue;
  optionLabel?: VariantCsvValue;
  optionValueIds?: readonly string[] | string | null;
  price?: VariantCsvValue;
  discountPrice?: VariantCsvValue;
  costPrice?: VariantCsvValue;
  stockQuantity?: VariantCsvValue;
  lowStockLevel?: VariantCsvValue;
  isActive?: boolean | null;
  isDefault?: boolean | null;
}

/**
 * Numeric values stay as validated strings so they can be assigned directly to
 * controlled form inputs without losing decimal precision or formatting.
 * Missing numeric/boolean cells are omitted from the patch.
 */
export interface VariantCsvPatch {
  sku: string;
  barcode?: string;
  optionLabel?: string;
  optionValueIds?: string[];
  price?: string;
  discountPrice?: string;
  costPrice?: string;
  stockQuantity?: string;
  lowStockLevel?: string;
  isActive?: boolean;
  isDefault?: boolean;
}

export interface VariantCsvError {
  /** One-based logical CSV row number; the header is row 1. */
  row: number;
  field?: keyof VariantCsvPatch | "csv";
  message: string;
  value?: string;
}

export interface VariantCsvParseResult {
  records: VariantCsvPatch[];
  errors: VariantCsvError[];
}

type ColumnKey = keyof VariantCsvPatch;
type DecimalPatchField =
  | "price"
  | "discountPrice"
  | "costPrice";
type IntegerPatchField = "stockQuantity" | "lowStockLevel";
type BooleanPatchField = "isActive" | "isDefault";

interface CsvColumn {
  key: ColumnKey;
  header: string;
  aliases?: readonly string[];
}

export const VARIANT_CSV_COLUMNS: readonly CsvColumn[] = [
  { key: "sku", header: "sku" },
  { key: "barcode", header: "barcode", aliases: ["gtin", "barcode_gtin"] },
  { key: "optionLabel", header: "option_label", aliases: ["variant", "variant_name", "option"] },
  { key: "optionValueIds", header: "option_value_ids", aliases: ["value_ids", "option_ids"] },
  { key: "price", header: "price", aliases: ["selling_price", "regular_price"] },
  { key: "discountPrice", header: "discount_price", aliases: ["discount", "sale_price"] },
  { key: "costPrice", header: "cost_price", aliases: ["cost"] },
  { key: "stockQuantity", header: "stock_quantity", aliases: ["stock", "quantity"] },
  { key: "lowStockLevel", header: "low_stock_level", aliases: ["low_stock", "low_stock_warning"] },
  { key: "isActive", header: "active", aliases: ["is_active", "status"] },
  { key: "isDefault", header: "default", aliases: ["is_default", "default_selection"] },
] as const;

const DECIMAL_FIELDS = new Set<DecimalPatchField>([
  "price",
  "discountPrice",
  "costPrice",
]);

const INTEGER_FIELDS = new Set<IntegerPatchField>(["stockQuantity", "lowStockLevel"]);
const BOOLEAN_FIELDS = new Set<BooleanPatchField>(["isActive", "isDefault"]);

const isDecimalField = (key: ColumnKey): key is DecimalPatchField =>
  DECIMAL_FIELDS.has(key as DecimalPatchField);
const isIntegerField = (key: ColumnKey): key is IntegerPatchField =>
  INTEGER_FIELDS.has(key as IntegerPatchField);
const isBooleanField = (key: ColumnKey): key is BooleanPatchField =>
  BOOLEAN_FIELDS.has(key as BooleanPatchField);

const normalizeHeader = (value: string) =>
  value
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const columnByHeader = new Map<string, CsvColumn>(
  VARIANT_CSV_COLUMNS.flatMap((column) =>
    [column.header, ...(column.aliases ?? [])].map(
      (header) => [normalizeHeader(header), column] as const,
    ),
  ),
);

const escapeCsvCell = (value: string) =>
  /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;

const sourceValue = (variant: VariantCsvSource, key: ColumnKey): string => {
  if (key === "optionValueIds") {
    const ids = variant.optionValueIds;
    if (Array.isArray(ids)) return ids.join("|");
    return ids == null ? "" : String(ids);
  }
  if (key === "isActive" || key === "isDefault") {
    const value = variant[key];
    return value == null ? "" : value ? "true" : "false";
  }
  const value = variant[key];
  return value == null ? "" : String(value);
};

/** Serializes variant-like records using a stable, machine-readable header. */
export const exportVariantsToCsv = (variants: readonly VariantCsvSource[]): string => {
  const header = VARIANT_CSV_COLUMNS.map((column) => column.header).join(",");
  const rows = variants.map((variant) =>
    VARIANT_CSV_COLUMNS.map((column) =>
      escapeCsvCell(sourceValue(variant, column.key)),
    ).join(","),
  );
  return [header, ...rows].join("\r\n");
};

interface ParsedCsv {
  rows: string[][];
  error?: string;
}

/** Parses RFC-4180-style commas, escaped quotes, and quoted line breaks. */
const parseCsvRows = (csv: string): ParsedCsv => {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  let quoteClosed = false;

  const pushCell = () => {
    row.push(cell);
    cell = "";
    quoteClosed = false;
  };
  const pushRow = () => {
    pushCell();
    rows.push(row);
    row = [];
  };

  for (let index = 0; index < csv.length; index += 1) {
    const character = csv[index];

    if (inQuotes) {
      if (character === '"') {
        if (csv[index + 1] === '"') {
          cell += '"';
          index += 1;
        } else {
          inQuotes = false;
          quoteClosed = true;
        }
      } else if (character === "\r") {
        if (csv[index + 1] === "\n") index += 1;
        cell += "\n";
      } else {
        cell += character;
      }
      continue;
    }

    if (quoteClosed) {
      if (character === ",") {
        pushCell();
      } else if (character === "\n" || character === "\r") {
        if (character === "\r" && csv[index + 1] === "\n") index += 1;
        pushRow();
      } else if (character !== " " && character !== "\t") {
        return { rows: [], error: "Unexpected character after a closing quote." };
      }
      continue;
    }

    if (character === '"') {
      if (cell.length > 0) {
        return { rows: [], error: "A quoted field must begin with a quote." };
      }
      inQuotes = true;
    } else if (character === ",") {
      pushCell();
    } else if (character === "\n" || character === "\r") {
      if (character === "\r" && csv[index + 1] === "\n") index += 1;
      pushRow();
    } else {
      cell += character;
    }
  }

  if (inQuotes) return { rows: [], error: "The CSV ends inside a quoted field." };
  if (cell.length > 0 || row.length > 0 || quoteClosed) pushRow();

  return { rows };
};

const parseBoolean = (value: string): boolean | undefined => {
  const normalized = value.trim().toLowerCase();
  if (["true", "yes", "y", "1", "active"].includes(normalized)) return true;
  if (["false", "no", "n", "0", "inactive"].includes(normalized)) return false;
  return undefined;
};

const parseOptionValueIds = (value: string): string[] | undefined => {
  const trimmed = value.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith("[")) {
    try {
      const parsed: unknown = JSON.parse(trimmed);
      if (!Array.isArray(parsed) || parsed.some((item) => typeof item !== "string")) {
        return undefined;
      }
      return [...new Set(parsed.map((item) => item.trim()).filter(Boolean))];
    } catch {
      return undefined;
    }
  }

  return [...new Set(trimmed.split(/[|;]/).map((item) => item.trim()).filter(Boolean))];
};

const isBlankRow = (row: readonly string[]) => row.every((value) => value.trim() === "");

/**
 * Parses CSV into validated patches. Invalid rows are excluded from `records`
 * and described in `errors`, allowing the UI to show all problems at once.
 */
export const parseVariantCsv = (csv: string): VariantCsvParseResult => {
  const parsed = parseCsvRows(csv);
  if (parsed.error) {
    return { records: [], errors: [{ row: 1, field: "csv", message: parsed.error }] };
  }

  const nonEmptyRows = parsed.rows.filter((row) => !isBlankRow(row));
  if (nonEmptyRows.length === 0) {
    return { records: [], errors: [{ row: 1, field: "csv", message: "The CSV file is empty." }] };
  }

  const [headerRow, ...dataRows] = nonEmptyRows;
  const columns = headerRow.map((header) => columnByHeader.get(normalizeHeader(header)));
  const errors: VariantCsvError[] = [];
  const seenColumns = new Set<ColumnKey>();

  columns.forEach((column, index) => {
    if (!column) return;
    if (seenColumns.has(column.key)) {
      errors.push({
        row: 1,
        field: column.key,
        value: headerRow[index],
        message: `The ${column.header} column appears more than once.`,
      });
    }
    seenColumns.add(column.key);
  });

  if (!seenColumns.has("sku")) {
    errors.push({ row: 1, field: "sku", message: "A sku column is required." });
  }
  if (errors.length > 0) return { records: [], errors };

  const records: VariantCsvPatch[] = [];
  const seenSkus = new Set<string>();

  dataRows.forEach((row, dataIndex) => {
    const rowNumber = dataIndex + 2;
    const rowErrors: VariantCsvError[] = [];
    const patch: VariantCsvPatch = { sku: "" };

    if (row.length > headerRow.length) {
      rowErrors.push({
        row: rowNumber,
        field: "csv",
        message: "This row contains more values than the header.",
      });
    }

    columns.forEach((column, columnIndex) => {
      if (!column) return;
      const rawValue = row[columnIndex] ?? "";
      const value = rawValue.trim();

      if (column.key === "sku") {
        patch.sku = value.toUpperCase();
        if (!patch.sku) {
          rowErrors.push({ row: rowNumber, field: "sku", message: "SKU is required." });
        }
        return;
      }

      if (column.key === "barcode" || column.key === "optionLabel") {
        patch[column.key] = value;
        return;
      }

      if (column.key === "optionValueIds") {
        const ids = parseOptionValueIds(rawValue);
        if (!ids) {
          rowErrors.push({
            row: rowNumber,
            field: column.key,
            value: rawValue,
            message: "Option value IDs must use | or ; separators, or a JSON string array.",
          });
        } else {
          patch.optionValueIds = ids;
        }
        return;
      }

      if (isDecimalField(column.key) || isIntegerField(column.key)) {
        if (!value) return;
        const numberValue = Number(value);
        const requiresInteger = isIntegerField(column.key);
        if (!Number.isFinite(numberValue) || numberValue < 0 || (requiresInteger && !Number.isInteger(numberValue))) {
          rowErrors.push({
            row: rowNumber,
            field: column.key,
            value: rawValue,
            message: requiresInteger
              ? "Enter a non-negative whole number."
              : "Enter a non-negative number.",
          });
        } else {
          patch[column.key] = value;
        }
        return;
      }

      if (isBooleanField(column.key)) {
        if (!value) return;
        const booleanValue = parseBoolean(value);
        if (booleanValue === undefined) {
          rowErrors.push({
            row: rowNumber,
            field: column.key,
            value: rawValue,
            message: "Use true/false, yes/no, 1/0, or active/inactive.",
          });
        } else {
          patch[column.key] = booleanValue;
        }
      }
    });

    if (patch.sku) {
      if (seenSkus.has(patch.sku)) {
        rowErrors.push({
          row: rowNumber,
          field: "sku",
          value: patch.sku,
          message: "SKU appears more than once in this CSV file.",
        });
      } else {
        seenSkus.add(patch.sku);
      }
    }

    if (rowErrors.length > 0) errors.push(...rowErrors);
    else records.push(patch);
  });

  return { records, errors };
};
````
## 31. `web/src/admin/product-editor/utils/variantPaths.ts`

Lines: 129 · Size: 3812 bytes

````ts
import type { ProductTypeAttributeAssignment } from "../../../api/adminCatalog";

export const SKIP_OPTION_VALUE = "__skip_option_value__";

export interface VariantPathSource {
  key: string;
  optionValueIds: string[];
}

export interface VariantPathStockSource extends VariantPathSource {
  stockQuantity: string | number;
}

export interface VariantPathNode {
  valueId: string;
  label: string;
  code: string;
  colorHex: string | null;
  attributeId: string;
  attributeName: string;
  variantKeys: string[];
  terminalVariantKeys: string[];
  children: VariantPathNode[];
}

export const variantPathSignature = (ids: string[]) => [...ids].sort().join(":");

export function changeVariantPathSelection(
  assignments: ProductTypeAttributeAssignment[],
  current: Record<string, string>,
  attributeId: string,
  valueId: string,
) {
  const changedIndex = assignments.findIndex((item) => item.attributeId === attributeId);
  if (changedIndex < 0) return current;

  const next = { ...current, [attributeId]: valueId };
  for (const assignment of assignments.slice(changedIndex + 1)) {
    delete next[assignment.attributeId];
  }
  return next;
}

export function selectedVariantPathIds(
  assignments: ProductTypeAttributeAssignment[],
  selection: Record<string, string>,
) {
  return assignments.flatMap((assignment) => {
    const valueId = selection[assignment.attributeId];
    return valueId && valueId !== SKIP_OPTION_VALUE ? [valueId] : [];
  });
}

export function clearDeepestVariantPathChoice(
  assignments: ProductTypeAttributeAssignment[],
  current: Record<string, string>,
) {
  const next = { ...current };
  const deepest = [...assignments]
    .reverse()
    .find((assignment) => Object.hasOwn(current, assignment.attributeId));
  if (deepest) delete next[deepest.attributeId];
  return next;
}

export function buildVariantPathTree(
  assignments: ProductTypeAttributeAssignment[],
  variants: VariantPathSource[],
): VariantPathNode[] {
  const assignmentOrder = new Map(
    assignments.map((assignment, index) => [assignment.attributeId, index]),
  );
  const valueDetails = new Map(assignments.flatMap((assignment) =>
    assignment.attribute.values.map((value) => [value.id, {
      ...value,
      attributeId: assignment.attributeId,
      attributeName: assignment.attribute.name,
    }] as const),
  ));
  const roots: VariantPathNode[] = [];

  for (const variant of variants) {
    const values = variant.optionValueIds
      .map((id) => valueDetails.get(id))
      .filter((value): value is NonNullable<typeof value> => Boolean(value))
      .sort((left, right) =>
        (assignmentOrder.get(left.attributeId) ?? 0) -
        (assignmentOrder.get(right.attributeId) ?? 0),
      );

    let siblings = roots;
    let lastNode: VariantPathNode | null = null;
    for (const value of values) {
      let node = siblings.find((item) => item.valueId === value.id);
      if (!node) {
        node = {
          valueId: value.id,
          label: value.label,
          code: value.code,
          colorHex: value.colorHex,
          attributeId: value.attributeId,
          attributeName: value.attributeName,
          variantKeys: [],
          terminalVariantKeys: [],
          children: [],
        };
        siblings.push(node);
      }
      node.variantKeys.push(variant.key);
      lastNode = node;
      siblings = node.children;
    }
    lastNode?.terminalVariantKeys.push(variant.key);
  }

  return roots;
}

export function analyzeVariantPathRemoval<T extends VariantPathStockSource>(
  variantKeys: string[],
  variants: T[],
) {
  const keySet = new Set(variantKeys);
  const affected = variants.filter((variant) => keySet.has(variant.key));
  return {
    affected,
    stocked: affected.filter((variant) => Number(variant.stockQuantity) > 0),
  };
}
````
## 32. `web/src/admin/product-editor/AdminProductEditorPage.module.css`

Lines: 4 · Size: 33 bytes

````css
.page,
.form {
  min-width: 0;
}
````
## 33. `web/src/admin/product-editor/AdminProductEditorPage.tsx`

Lines: 54 · Size: 2644 bytes

````tsx
import { AlertCircle, CheckCircle } from "lucide-react";

import { AdditionalProductDetails } from "./components/AdditionalProductDetails/AdditionalProductDetails";
import { ProductEditorHeader } from "./components/ProductEditorHeader/ProductEditorHeader";
import { ProductGeneralSection } from "./components/ProductGeneralSection/ProductGeneralSection";
import { SelectedSkuEditor } from "./components/SelectedSkuEditor/SelectedSkuEditor";
import { VariantCombinationsTable } from "./components/VariantCombinationsTable/VariantCombinationsTable";
import { VariantOptionsSection } from "./components/VariantOptionsSection/VariantOptionsSection";
import { ProductPreferences } from "./components/ProductPreferences/ProductPreferences";
import { useProductEditor } from "./hooks/useProductEditor";
import styles from "./AdminProductEditorPage.module.css";

/**
 * Add and Edit share this thin page coordinator.
 *
 * This file controls section order only. State lives in hooks, save rules live in
 * utils, and each visible section owns its JSX/CSS so future changes stay local.
 */
export const AdminProductEditorPage = () => {
  const editor = useProductEditor();
  const builder = editor.variantBuilder;

  if (editor.loading) {
    return <div className="admin-page-loading">Loading product editor...</div>;
  }

  return (
    <div className={`${styles.page} dashboard-container admin-catalog admin-page admin-product-editor-page`}>
      <ProductEditorHeader editor={editor} />

      {editor.error && <div className="alert alert-error"><AlertCircle size={18} />{editor.error}</div>}
      {editor.success && <div className="alert alert-success"><CheckCircle size={18} />{editor.success}</div>}

      <form id="product-editor-form" className={`${styles.form} product-editor-form`} onSubmit={editor.handleSaveProduct}>
        <ProductGeneralSection editor={editor} />

        <section className="admin-variant-builder admin-field-wide" aria-label="Product options and variants">
          <div className="variant-config-grid">
            <VariantOptionsSection builder={builder} />
            <aside className="variant-settings-panel" aria-label="Product preferences">
              <ProductPreferences editor={editor} />
            </aside>
          </div>

          {builder.error && <p className="admin-variant-error" role="alert">{builder.error}</p>}
          <SelectedSkuEditor builder={builder} individualDiscountEnabled={editor.discountMode === "individual"} />
          <VariantCombinationsTable builder={builder} />
        </section>

        <AdditionalProductDetails editor={editor} />
      </form>
    </div>
  );
};
````
## 34. `web/src/admin/product-editor/index.ts`

Lines: 1 · Size: 67 bytes

````ts
export { AdminProductEditorPage } from "./AdminProductEditorPage";
````
