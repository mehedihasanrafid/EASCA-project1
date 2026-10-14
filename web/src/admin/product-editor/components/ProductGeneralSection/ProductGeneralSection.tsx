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
