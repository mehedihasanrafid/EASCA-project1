import { Search } from "lucide-react";
import { useState } from "react";

import type { ProductTypeAttributeAssignment } from "../../../../api/adminCatalog";
import { SKIP_OPTION_VALUE } from "../../utils/variantPaths";
import styles from "./ProductVariantPaths.module.css";

interface Props {
  assignment: ProductTypeAttributeAssignment;
  canChoose: boolean;
  selectedValueId?: string;
  onChoose: (valueId: string) => void;
}

/** Searchable value selector used by every level of the exact path builder. */
export function AttributeValueList({ assignment, canChoose, selectedValueId, onChoose }: Props) {
  const [search, setSearch] = useState("");
  const activeValues = assignment.attribute.values.filter((value) => value.isActive && !value.deletedAt);
  const normalizedSearch = search.trim().toLowerCase();
  const visibleValues = normalizedSearch
    ? activeValues.filter((value) => `${value.label} ${value.code}`.toLowerCase().includes(normalizedSearch))
    : activeValues;

  return (
    <>
      {activeValues.length > 8 && (
        <label className={styles.search}>
          <Search size={14} aria-hidden="true" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={`Search ${assignment.attribute.name.toLowerCase()}`}
            disabled={!canChoose}
          />
        </label>
      )}

      <div className={styles.valueList}>
        {visibleValues.map((value) => (
          <label key={value.id} className={selectedValueId === value.id ? styles.selectedValue : ""}>
            <input
              type="radio"
              name={`variant-path-${assignment.attributeId}`}
              checked={selectedValueId === value.id}
              disabled={!canChoose}
              onChange={() => onChoose(value.id)}
            />
            {value.colorHex && <i style={{ backgroundColor: value.colorHex }} />}
            <span>{value.label}</span>
          </label>
        ))}

        {visibleValues.length === 0 && (
          <p className={styles.noValues}>No matching values.</p>
        )}

        {!assignment.isRequired && (
          <label className={`${styles.skipValue} ${selectedValueId === SKIP_OPTION_VALUE ? styles.selectedValue : ""}`}>
            <input
              type="radio"
              name={`variant-path-${assignment.attributeId}`}
              checked={selectedValueId === SKIP_OPTION_VALUE}
              disabled={!canChoose}
              onChange={() => onChoose(SKIP_OPTION_VALUE)}
            />
            <span>Not used for this SKU</span>
          </label>
        )}
      </div>
    </>
  );
}
