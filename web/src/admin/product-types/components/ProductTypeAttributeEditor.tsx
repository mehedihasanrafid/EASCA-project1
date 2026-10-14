import { ChevronDown, ChevronUp, ListChecks } from "lucide-react";

import type { AdminAttribute } from "../../../api/adminCatalog";

import styles from "./ProductTypeAttributeEditor.module.css";

/**
 * This is the editable form shape sent to the Product Type assignment API.
 * sortOrder also defines the parent-to-child order used by the Product Editor.
 */
export interface ProductTypeAttributeSelection {
  attributeId: string;
  isRequired: boolean;
  sortOrder: number;
}

interface ProductTypeAttributeEditorProps {
  attributes: AdminAttribute[];
  selections: ProductTypeAttributeSelection[];
  disabled?: boolean;
  onChange: (selections: ProductTypeAttributeSelection[]) => void;
}

function normalizeOrder(selections: ProductTypeAttributeSelection[]) {
  return selections.map((selection, sortOrder) => ({ ...selection, sortOrder }));
}

/**
 * Lets an administrator build a reusable Product Type template. It does not
 * generate SKUs: each product later chooses its own exact paths and values.
 */
export function ProductTypeAttributeEditor({
  attributes,
  selections,
  disabled = false,
  onChange,
}: ProductTypeAttributeEditorProps) {
  const selectedById = new Map(selections.map((selection) => [selection.attributeId, selection]));
  const selectedRows = selections
    .map((selection) => ({
      selection,
      attribute: attributes.find((attribute) => attribute.id === selection.attributeId),
    }))
    .filter((row): row is { selection: ProductTypeAttributeSelection; attribute: AdminAttribute } => Boolean(row.attribute));
  const availableRows = attributes.filter(
    (attribute) => !attribute.deletedAt && !selectedById.has(attribute.id),
  );

  const addAttribute = (attributeId: string) => {
    if (disabled || selectedById.has(attributeId)) return;
    onChange(normalizeOrder([
      ...selections,
      { attributeId, isRequired: false, sortOrder: selections.length },
    ]));
  };

  const removeAttribute = (attributeId: string) => {
    if (disabled) return;
    onChange(normalizeOrder(selections.filter((selection) => selection.attributeId !== attributeId)));
  };

  const setRequired = (attributeId: string, isRequired: boolean) => {
    onChange(selections.map((selection) => (
      selection.attributeId === attributeId ? { ...selection, isRequired } : selection
    )));
  };

  const moveAttribute = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (disabled || targetIndex < 0 || targetIndex >= selections.length) return;
    const next = [...selections];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    onChange(normalizeOrder(next));
  };

  return (
    <fieldset className={`${styles.root} admin-reference-field-wide`} disabled={disabled}>
      <legend>Assigned attributes</legend>
      <div className={styles.intro}>
        <ListChecks size={19} aria-hidden="true" />
        <p>
          Choose the attributes this Product Type can use. Their order becomes the
          parent-to-child order in the Product Editor.
        </p>
      </div>

      {selectedRows.length > 0 ? (
        <div className={styles.selectedList}>
          {selectedRows.map(({ attribute, selection }, index) => {
            const activeValues = attribute.values.filter((value) => value.isActive && !value.deletedAt);
            const valuePreview = activeValues.slice(0, 4).map((value) => value.label).join(", ");
            return (
              <div className={styles.attributeRow} key={attribute.id}>
                <span className={styles.order}>{index + 1}</span>
                <div className={styles.attributeDetails}>
                  <strong>{attribute.name}</strong>
                  <small>
                    {valuePreview || "No active values"}
                    {activeValues.length > 4 ? ` +${activeValues.length - 4} more` : ""}
                  </small>
                </div>
                <label className={styles.requiredToggle}>
                  <input
                    type="checkbox"
                    checked={selection.isRequired}
                    onChange={(event) => setRequired(attribute.id, event.target.checked)}
                  />
                  Required for every SKU
                </label>
                <div className={styles.rowActions}>
                  <button
                    type="button"
                    onClick={() => moveAttribute(index, -1)}
                    disabled={disabled || index === 0}
                    aria-label={`Move ${attribute.name} up`}
                    title="Move up"
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveAttribute(index, 1)}
                    disabled={disabled || index === selectedRows.length - 1}
                    aria-label={`Move ${attribute.name} down`}
                    title="Move down"
                  >
                    <ChevronDown size={16} />
                  </button>
                  <button
                    type="button"
                    className={styles.removeButton}
                    onClick={() => removeAttribute(attribute.id)}
                    disabled={disabled}
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className={styles.empty}>No attributes assigned. Products of this type will use one simple stock variant.</p>
      )}

      {availableRows.length > 0 && (
        <div className={styles.available}>
          <strong>Add another attribute</strong>
          <div className={styles.availableGrid}>
            {availableRows.map((attribute) => (
              <button
                type="button"
                key={attribute.id}
                onClick={() => addAttribute(attribute.id)}
                disabled={disabled || !attribute.isActive}
                title={attribute.isActive ? `Add ${attribute.name}` : `${attribute.name} is inactive`}
              >
                <span>+</span> {attribute.name}{!attribute.isActive ? " (inactive)" : ""}
              </button>
            ))}
          </div>
        </div>
      )}

      <small className={styles.safetyNote}>
        Removing a used attribute or making it required when existing SKUs have no value will be blocked safely.
      </small>
    </fieldset>
  );
}
