import { FormEvent, useState } from "react";
import { Plus, RotateCcw, X } from "lucide-react";

import { AdminAttribute, AdminAttributeValue } from "../../../api/adminCatalog";
import styles from "../AdminAttributes.module.css";

interface AttributeValuesCellProps {
  attribute: AdminAttribute;
  busy: boolean;
  onAdd: (attribute: AdminAttribute, label: string) => Promise<boolean>;
  onDelete: (attribute: AdminAttribute, value: AdminAttributeValue) => void;
  onRestore: (attribute: AdminAttribute, value: AdminAttributeValue) => void;
}

/** Compact value manager used inside one attribute table row. */
export function AttributeValuesCell({ attribute, busy, onAdd, onDelete, onRestore }: AttributeValuesCellProps) {
  const [label, setLabel] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextLabel = label.trim();
    if (!nextLabel) return;
    if (await onAdd(attribute, nextLabel)) setLabel("");
  };

  return (
    <div className={styles.valueManager}>
      <div className={styles.valueList}>
        {attribute.values.length === 0 && <span className={styles.noValues}>No values</span>}
        {attribute.values.map((value) => (
          <span
            className={`${styles.valueChip}${value.deletedAt ? ` ${styles.removedValue}` : ""}`}
            key={value.id}
          >
            {value.label}
            {value.deletedAt ? (
              <button
                type="button"
                onClick={() => onRestore(attribute, value)}
                disabled={busy || Boolean(attribute.deletedAt)}
                aria-label={`Restore ${value.label}`}
                title="Restore value"
              >
                <RotateCcw size={13} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onDelete(attribute, value)}
                disabled={busy || Boolean(attribute.deletedAt)}
                aria-label={`Remove ${value.label}`}
                title="Remove value"
              >
                <X size={14} />
              </button>
            )}
          </span>
        ))}
      </div>

      {!attribute.deletedAt && (
        <form className={styles.valueForm} onSubmit={submit}>
          <input
            className="form-input"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            placeholder="Add value"
            aria-label={`Add value to ${attribute.name}`}
            maxLength={100}
          />
          <button type="submit" disabled={busy || !label.trim()} aria-label={`Add value to ${attribute.name}`}>
            <Plus size={15} /> Add
          </button>
        </form>
      )}
    </div>
  );
}
