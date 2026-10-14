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
