import { Trash2 } from "lucide-react";

import type { VariantOptionsController } from "../../hooks/useProductCatalogOptions";
import { analyzeVariantPathRemoval, type VariantPathNode } from "../../utils/variantPaths";
import styles from "./ProductVariantPaths.module.css";

interface Props {
  node: VariantPathNode;
  builder: VariantOptionsController;
}

/** One recursive branch, including stock-aware removal information. */
export function VariantPathTreeNode({ node, builder }: Props) {
  const leafVariantKey = node.terminalVariantKeys[0] ?? null;
  const { affected, stocked } = analyzeVariantPathRemoval(node.variantKeys, builder.variants);
  const savedCount = affected.filter((variant) => variant.id).length;
  const removalTitle = stocked.length > 0
    ? `Blocked: ${stocked.length} affected SKU${stocked.length === 1 ? " has" : "s have"} stock`
    : `Remove ${affected.length} affected SKU path${affected.length === 1 ? "" : "s"}${savedCount ? `, including ${savedCount} saved` : ""}`;

  return (
    <li>
      <div className={styles.treeNode}>
        <button
          type="button"
          className={`${styles.nodeSelect}${leafVariantKey === builder.focusedVariantKey ? ` ${styles.focused}` : ""}`}
          onClick={() => leafVariantKey && builder.setFocusedVariantKey(leafVariantKey)}
          disabled={!leafVariantKey}
        >
          <small>{node.attributeName}</small>
          <span>{node.colorHex && <i style={{ backgroundColor: node.colorHex }} />}{node.label}</span>
          <em>{leafVariantKey ? "SKU" : "Branch"}</em>
        </button>
        <button
          type="button"
          className={`${styles.removeBranch}${stocked.length ? ` ${styles.removalBlocked}` : ""}`}
          onClick={() => builder.removePathBranch(node)}
          aria-label={`Remove ${node.label} branch affecting ${node.variantKeys.length} SKU paths`}
          title={removalTitle}
        >
          <Trash2 size={13} />
          <span>{node.variantKeys.length}</span>
          {stocked.length > 0 && <small>{stocked.length} stocked</small>}
        </button>
      </div>

      {node.children.length > 0 && (
        <ul className={styles.nestedTree}>
          {node.children.map((child) => (
            <VariantPathTreeNode
              key={`${child.attributeId}-${child.valueId}`}
              node={child}
              builder={builder}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
