import { GitBranch } from "lucide-react";

import type { VariantOptionsController } from "../../hooks/useProductCatalogOptions";
import { VariantPathTreeNode } from "./VariantPathTreeNode";
import styles from "./ProductVariantPaths.module.css";

interface Props {
  builder: VariantOptionsController;
}

/** Displays only combinations that really exist for the current product. */
export function VariantPathTree({ builder }: Props) {
  if (builder.variantPathTree.length === 0) return null;

  return (
    <div className={styles.tree}>
      <div className={styles.treeHeading}>
        <GitBranch size={17} />
        <strong>Current product tree</strong>
        <small>{builder.exactPathCount} exact SKU path{builder.exactPathCount === 1 ? "" : "s"}</small>
      </div>
      <ul className={styles.treeList}>
        {builder.variantPathTree.map((node) => (
          <VariantPathTreeNode
            key={`${node.attributeId}-${node.valueId}`}
            node={node}
            builder={builder}
          />
        ))}
      </ul>
    </div>
  );
}
