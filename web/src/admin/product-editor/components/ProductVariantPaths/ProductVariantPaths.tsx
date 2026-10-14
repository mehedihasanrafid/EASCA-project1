import { GitBranch, Plus } from "lucide-react";
import { Link } from "react-router-dom";

import type { VariantOptionsController } from "../../hooks/useProductCatalogOptions";
import { AttributePathSelector } from "./AttributePathSelector";
import { ExactPathPreview } from "./ExactPathPreview";
import { ProductAttributePicker } from "./ProductAttributePicker";
import styles from "./ProductVariantPaths.module.css";
import { VariantPathEmptyState } from "./VariantPathEmptyState";
import { VariantPathTree } from "./VariantPathTree";

interface Props {
  builder: VariantOptionsController;
}

/**
 * Product-specific exact-path workbench.
 *
 * Product Type assignments are reusable templates; the paths built here belong
 * only to this product, so Black -> XL never forces Green -> XL.
 */
export function ProductVariantPaths({ builder }: Props) {
  return (
    <section className={styles.root} aria-label="Product-specific variant paths">
      <header className={styles.heading}>
        <div>
          <h3>Product-specific variant paths</h3>
          <p>Create one exact parent-to-child SKU path at a time. No unwanted combinations are generated.</p>
        </div>
        <div className={styles.headingActions}>
          <Link className="admin-view-link" to="/admin/attributes">Manage attributes</Link>
          <button type="button" className="btn btn-primary" onClick={() => builder.setAttributePickerOpen(true)}>
            <Plus size={15} /> Add attribute
          </button>
        </div>
      </header>

      {builder.loading ? (
        <p className={styles.loading}>Loading Product Type attributes...</p>
      ) : builder.assignments.length === 0 ? (
        <VariantPathEmptyState />
      ) : (
        <>
          <div className={styles.guide}>
            <GitBranch size={18} />
            <span>
              Changing a parent clears its child choices. After adding a SKU, the parent prefix stays selected so you can add a sibling.
            </span>
          </div>
          <AttributePathSelector builder={builder} />
          <ExactPathPreview builder={builder} />
          <VariantPathTree builder={builder} />
        </>
      )}
      {builder.attributePickerOpen && <ProductAttributePicker builder={builder} />}
    </section>
  );
}
