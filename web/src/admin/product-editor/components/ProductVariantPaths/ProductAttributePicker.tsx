import { Plus, X } from "lucide-react";
import { useMemo, useState } from "react";

import type { VariantOptionsController } from "../../hooks/useProductCatalogOptions";
import styles from "./ProductVariantPaths.module.css";

const NEW_ATTRIBUTE = "__new_attribute__";

interface Props {
  builder: VariantOptionsController;
}

/**
 * Chooses one reusable catalog attribute or creates a small custom definition.
 * The modal is unmounted on close, intentionally clearing the previous choice.
 */
export function ProductAttributePicker({ builder }: Props) {
  const defaultParent = builder.assignments.at(-1)?.attributeId ?? "";
  const [selectedId, setSelectedId] = useState("");
  const [parentId, setParentId] = useState(defaultParent);
  const [name, setName] = useState("");
  const [valuesText, setValuesText] = useState("");
  const [localError, setLocalError] = useState("");
  const selectedIds = useMemo(
    () => new Set(builder.assignments.map((item) => item.attributeId)),
    [builder.assignments],
  );

  const close = () => builder.setAttributePickerOpen(false);
  const submit = async () => {
    setLocalError("");
    if (!selectedId) {
      setLocalError("Choose an attribute or select New.");
      return;
    }
    const effectiveParentId = parentId || null;
    if (selectedId === NEW_ATTRIBUTE) {
      const cleanName = name.trim();
      const uniqueValues = [...new Map(valuesText
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
        .map((value) => [value.toLocaleLowerCase(), value] as const)).values()];
      if (cleanName.length < 2) {
        setLocalError("Enter an attribute name with at least 2 characters.");
        return;
      }
      if (uniqueValues.length === 0) {
        setLocalError("Enter at least one value, separated with commas.");
        return;
      }
      await builder.createAndAddProductAttribute(cleanName, uniqueValues, effectiveParentId);
      return;
    }
    const attribute = builder.attributeCatalog.find((item) => item.id === selectedId);
    if (attribute) builder.addProductAttribute(attribute, effectiveParentId);
  };

  return (
    <div className={styles.modalBackdrop} role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) close();
    }}>
      <section className={styles.attributeModal} role="dialog" aria-modal="true" aria-labelledby="attribute-picker-title">
        <header className={styles.modalHeader}>
          <div>
            <h4 id="attribute-picker-title">Choose product attribute</h4>
            <p>Pick an existing attribute or use the final New row.</p>
          </div>
          <button type="button" className={styles.iconButton} aria-label="Close attribute picker" onClick={close}>
            <X size={18} />
          </button>
        </header>

        <div className={styles.attributeTableWrap}>
          <table className={styles.attributeTable}>
            <thead>
              <tr><th>Select</th><th>Attribute</th><th>Available values</th></tr>
            </thead>
            <tbody>
              {builder.attributeCatalog.map((attribute) => {
                const alreadySelected = selectedIds.has(attribute.id);
                const values = attribute.values
                  .filter((value) => value.isActive && !value.deletedAt)
                  .map((value) => value.label);
                return (
                  <tr key={attribute.id} className={alreadySelected ? styles.alreadySelected : ""}>
                    <td>
                      <input
                        type="radio"
                        name="product-attribute-choice"
                        checked={selectedId === attribute.id}
                        disabled={alreadySelected}
                        aria-label={`Choose ${attribute.name}`}
                        onChange={() => setSelectedId(attribute.id)}
                      />
                    </td>
                    <td><strong>{attribute.name}</strong>{alreadySelected && <small>Selected</small>}</td>
                    <td>{values.join(", ") || "No values"}</td>
                  </tr>
                );
              })}
              <tr className={selectedId === NEW_ATTRIBUTE ? styles.newAttributeRow : ""}>
                <td>
                  <input
                    type="radio"
                    name="product-attribute-choice"
                    checked={selectedId === NEW_ATTRIBUTE}
                    aria-label="Create new attribute"
                    onChange={() => setSelectedId(NEW_ATTRIBUTE)}
                  />
                </td>
                <td><strong>New</strong></td>
                <td>Create a custom attribute for this product</td>
              </tr>
            </tbody>
          </table>
        </div>

        {selectedId === NEW_ATTRIBUTE && (
          <div className={styles.customAttributeFields}>
            <label>
              <span>Attribute name</span>
              <input className="form-input" value={name} onChange={(event) => setName(event.target.value)} placeholder="Example: Sleeve type" />
            </label>
            <label>
              <span>Values</span>
              <input className="form-input" value={valuesText} onChange={(event) => setValuesText(event.target.value)} placeholder="Full sleeve, Half sleeve, Sleeveless" />
              <small>Separate values with commas.</small>
            </label>
          </div>
        )}

        <label className={styles.parentChoice}>
          <span>Parent relationship</span>
          <select className="form-select" value={parentId} onChange={(event) => setParentId(event.target.value)}>
            <option value="">No parent — independent</option>
            {builder.assignments.map((assignment) => (
              <option key={assignment.attributeId} value={assignment.attributeId}>
                Child of {assignment.attribute.name}
              </option>
            ))}
          </select>
          <small>The most recently selected attribute is suggested as the parent.</small>
        </label>

        {localError && <p className={styles.modalError} role="alert">{localError}</p>}
        <footer className={styles.modalActions}>
          <button type="button" className="btn btn-ghost" onClick={close}>Cancel</button>
          <button type="button" className="btn btn-primary" disabled={builder.addingAttribute} onClick={() => void submit()}>
            <Plus size={15} /> {builder.addingAttribute ? "Creating..." : selectedId === NEW_ATTRIBUTE ? "Create and add" : "Add attribute"}
          </button>
        </footer>
      </section>
    </div>
  );
}
