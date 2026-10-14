import { FormEvent, useState } from "react";
import { X } from "lucide-react";

import { AdminAttribute } from "../../../api/adminCatalog";
import styles from "../AdminAttributes.module.css";

interface AttributeNameEditorProps {
  attribute: AdminAttribute;
  busy: boolean;
  onCancel: () => void;
  onSave: (attribute: AdminAttribute, name: string) => Promise<boolean>;
}

/** Small editor matching the edit workflow used by brands, types, and categories. */
export function AttributeNameEditor({ attribute, busy, onCancel, onSave }: AttributeNameEditorProps) {
  const [name, setName] = useState(attribute.name);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextName = name.trim();
    if (!nextName || nextName === attribute.name) return;
    if (await onSave(attribute, nextName)) onCancel();
  };

  return (
    <form className={styles.editForm} onSubmit={submit}>
      <div className={styles.editHeading}>
        <div>
          <h3>Edit product attribute</h3>
          <p>Change the attribute name. Manage its values directly in the table.</p>
        </div>
        <button type="button" onClick={onCancel} aria-label="Close attribute editor">
          <X size={18} />
        </button>
      </div>

      <div className={styles.editFields}>
        <div className="form-group">
          <label htmlFor="edit-attribute-name">Property name</label>
          <input
            id="edit-attribute-name"
            className="form-input"
            value={name}
            onChange={(event) => setName(event.target.value)}
            minLength={2}
            maxLength={100}
            autoFocus
            required
          />
        </div>
        <div className={styles.editActions}>
          <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={busy}>Cancel</button>
          <button className="btn btn-primary" disabled={busy || !name.trim() || name.trim() === attribute.name}>
            {busy ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    </form>
  );
}
