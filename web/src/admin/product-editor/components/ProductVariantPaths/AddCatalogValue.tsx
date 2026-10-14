import { Plus } from "lucide-react";

import type { ProductTypeAttributeAssignment } from "../../../../api/adminCatalog";
import type { VariantOptionsController } from "../../hooks/useProductCatalogOptions";
import styles from "./ProductVariantPaths.module.css";

interface Props {
  assignment: ProductTypeAttributeAssignment;
  builder: VariantOptionsController;
  disabled?: boolean;
}

/** Adds a reusable catalog value; this is intentionally not product-private data. */
export function AddCatalogValue({ assignment, builder, disabled = false }: Props) {
  const value = builder.newValueLabels[assignment.attributeId] ?? "";
  const isAdding = builder.addingValueFor === assignment.attributeId;

  return (
    <div className={styles.addValue}>
      <div>
        <input
          className="form-input"
          value={value}
          placeholder={`Add new ${assignment.attribute.name.toLowerCase()}`}
          aria-label={`New ${assignment.attribute.name} catalog value`}
          disabled={disabled}
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
        <small>Saved globally and reusable by other products.</small>
      </div>
      <button
        type="button"
        className="btn btn-ghost"
        disabled={disabled || isAdding || !value.trim()}
        onClick={() => void builder.addSuggestedValue(assignment)}
      >
        <Plus size={15} /> {isAdding ? "Adding..." : "Add value"}
      </button>
    </div>
  );
}
