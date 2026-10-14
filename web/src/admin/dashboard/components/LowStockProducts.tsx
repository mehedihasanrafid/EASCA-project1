import React from "react";
import { Link } from "react-router-dom";

import type { LowStockProduct } from "../../../api/adminDashboard";
import styles from "../AdminDashboard.module.css";

interface Props {
  products: LowStockProduct[];
}

export const LowStockProducts: React.FC<Props> = ({ products }) => (
  <section className={`${styles.panel} ${styles.lowStockPanel}`}>
    <header className={styles.panelHeader}>
      <div>
        <p className="eyebrow">Inventory attention</p>
        <h2>Products running low on stock</h2>
      </div>
      <Link className="text-link" to="/admin/products">View products</Link>
    </header>

    {products.length === 0 ? (
      <div className={styles.empty}>All active product variants are above their low-stock limits.</div>
    ) : (
      <div className="admin-table-wrap">
        <table className={`admin-product-table ${styles.lowStockTable}`}>
          <thead>
            <tr>
              <th>Product</th><th>Variant</th><th>SKU</th><th>Stock</th>
              <th>Low-stock limit</th><th><span className="sr-only">Action</span></th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.variantId}>
                <td><strong>{product.productName}</strong></td>
                <td>{product.variantName}</td>
                <td><code>{product.sku}</code></td>
                <td>
                  <span className={product.stockQuantity === 0 ? "stock-out" : styles.stockWarning}>
                    {product.stockQuantity}
                  </span>
                </td>
                <td>{product.lowStockLevel}</td>
                <td><Link className="text-link" to={`/admin/products/${product.productId}/edit`}>Restock</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </section>
);
