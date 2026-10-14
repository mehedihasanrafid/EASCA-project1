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
