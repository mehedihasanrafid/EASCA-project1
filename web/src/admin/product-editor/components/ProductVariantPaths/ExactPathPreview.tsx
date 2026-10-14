import { CheckCircle2, CircleAlert, Plus } from "lucide-react";

import type { VariantOptionsController } from "../../hooks/useProductCatalogOptions";
import { selectedVariantPathIds, variantPathSignature } from "../../utils/variantPaths";
import styles from "./ProductVariantPaths.module.css";

interface Props {
  builder: VariantOptionsController;
}

/** Live validation and actions for the exact path currently being assembled. */
export function ExactPathPreview({ builder }: Props) {
  const selectedIds = selectedVariantPathIds(builder.assignments, builder.pathSelection);
  const signature = variantPathSignature(selectedIds);
  const existingVariant = selectedIds.length > 0
    ? builder.variants.find((variant) => variantPathSignature(variant.optionValueIds) === signature)
    : undefined;
  const ready = builder.pathIsComplete && selectedIds.length > 0 && !existingVariant;

  const viewExistingVariant = () => {
    if (!existingVariant) return;
    builder.setFocusedVariantKey(existingVariant.key);
    requestAnimationFrame(() => {
      document.getElementById("selected-sku-editor")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  return (
    <div className={styles.pathPreview}>
      <div className={styles.pathCopy}>
        <small>Exact SKU path</small>
        <strong>{builder.currentPathLabels.length
          ? builder.currentPathLabels.join(" → ")
          : "Choose the first attribute"}</strong>
        <span className={ready ? styles.ready : existingVariant ? styles.duplicate : styles.incomplete}>
          {ready ? <CheckCircle2 size={14} /> : <CircleAlert size={14} />}
          {ready
            ? "Ready to create"
            : existingVariant
              ? `Already exists as ${existingVariant.sku || "an unsaved SKU"}`
              : builder.pathIsComplete && selectedIds.length === 0
                ? "Choose at least one actual value"
                : "Complete each attribute level"}
        </span>
      </div>

      {existingVariant ? (
        <button
          type="button"
          className="btn btn-primary"
          onClick={viewExistingVariant}
        >
          View existing SKU
        </button>
      ) : (
        <button
          type="button"
          className="btn btn-primary"
          onClick={builder.addExactVariantPath}
          disabled={!ready}
        >
          <Plus size={17} /> Add exact SKU
        </button>
      )}

      <button
        type="button"
        className="btn btn-ghost"
        onClick={() => builder.setPathSelection({})}
        disabled={builder.currentPathLabels.length === 0}
      >
        Clear path
      </button>
    </div>
  );
}
