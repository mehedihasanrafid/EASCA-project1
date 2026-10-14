import { Layers3 } from "lucide-react";
import { Link } from "react-router-dom";

import styles from "./ProductVariantPaths.module.css";

export function VariantPathEmptyState() {
  return (
    <div className={styles.emptyState}>
      <Layers3 size={24} />
      <div>
        <strong>This Product Type has no assigned attributes.</strong>
        <p>
          Keep one simple stock variant or <Link to="/admin/product-types">edit the Product Type template</Link>.
        </p>
      </div>
    </div>
  );
}
