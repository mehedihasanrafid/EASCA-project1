import { FormEvent, useState } from "react";
import { Plus } from "lucide-react";

import styles from "../AdminAttributes.module.css";
import { parseAttributeValues } from "../attribute-values";

interface AttributeFormProps {
  busy: boolean;
  onSubmit: (name: string, values: string) => Promise<boolean>;
}

/** The complete business input for a reusable attribute: its name and values. */
export function AttributeForm({ busy, onSubmit }: AttributeFormProps) {
  const [name, setName] = useState("");
  const [values, setValues] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim() || parseAttributeValues(values).length === 0) return;

    if (await onSubmit(name, values)) {
      setName("");
      setValues("");
    }
  };

  return (
    <form className={styles.form} onSubmit={submit}>
      <div className="form-group">
        <label htmlFor="attribute-name">Property name</label>
        <input
          id="attribute-name"
          className="form-input"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Size"
          minLength={2}
          maxLength={100}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="attribute-values">Values</label>
        <input
          id="attribute-values"
          className="form-input"
          value={values}
          onChange={(event) => setValues(event.target.value)}
          placeholder="S, M, L, XL"
          required
        />
        <small className={styles.helpText}>Separate values with commas.</small>
      </div>

      <button className={`btn btn-primary ${styles.submitButton}`} disabled={busy}>
        <Plus size={17} /> {busy ? "Adding..." : "Add property"}
      </button>
    </form>
  );
}
