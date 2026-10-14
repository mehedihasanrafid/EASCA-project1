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
