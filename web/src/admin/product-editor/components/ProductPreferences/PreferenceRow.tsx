import { Fragment, type ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import type { ProductPreferenceMode } from "../../types/productEditor.types";
import styles from "./ProductPreferences.module.css";

/** One reusable row. Add future preferences through the list in ProductPreferences.tsx. */
export interface PreferenceDefinition {
  id: string;
  title: string;
  summary: string;
  mode: ProductPreferenceMode;
  /** false means one mode MUST remain selected (used for Product media). */
  allowOff: boolean;
  onChange: (mode: ProductPreferenceMode) => void;
  content: ReactNode;
}

interface Props {
  preference: PreferenceDefinition;
  expanded: boolean;
  onToggleExpanded: () => void;
}

export const PreferenceRow = ({ preference, expanded, onToggleExpanded }: Props) => {
  const selected = preference.mode !== "off";
  const detailId = `product-preference-${preference.id}`;

  /** Checkbox look, but exactly one scope at a time. Clicking again means Off only when allowed. */
  const choose = (mode: "all" | "individual") => {
    preference.onChange(preference.mode === mode && preference.allowOff ? "off" : mode);
  };

  return (
    <Fragment>
      <tr className={styles.choiceRow}>
        <th scope="row" className={styles.nameCell}>
          <span className={styles.preferenceName}>{preference.title}</span>
          <span className={styles.summary}>{preference.summary}</span>
          {selected && (
            <button
              type="button"
              className={styles.expandButton}
              onClick={onToggleExpanded}
              aria-expanded={expanded}
              aria-controls={detailId}
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {expanded ? "Hide settings" : "Show settings"}
            </button>
          )}
        </th>
        <td className={styles.checkCell}>
          <input
            type="checkbox"
            aria-label={`${preference.title}: All SKUs`}
            checked={preference.mode === "all"}
            onChange={() => choose("all")}
          />
        </td>
        <td className={styles.checkCell}>
          <input
            type="checkbox"
            aria-label={`${preference.title}: Individual SKU`}
            checked={preference.mode === "individual"}
            onChange={() => choose("individual")}
          />
        </td>
      </tr>
      {/* Render settings immediately after its own choice row, never at the bottom of the list. */}
      {selected && expanded && (
        <tr id={detailId} className={styles.detailRow}>
          <td colSpan={3}>
            <div className={styles.detailContent}>{preference.content}</div>
          </td>
        </tr>
      )}
    </Fragment>
  );
};
