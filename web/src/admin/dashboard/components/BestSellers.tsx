import React from "react";
import { Link } from "react-router-dom";

import type { BestSellingProduct } from "../../../api/adminDashboard";
import styles from "../AdminDashboard.module.css";
import { formatInteger, formatMoney } from "../utils/formatters";

interface Props {
  products: BestSellingProduct[];
}

export const BestSellers: React.FC<Props> = ({ products }) => {
  const maximum = Math.max(...products.map((product) => product.quantitySold), 1);

  return (
    <section className={styles.panel}>
      <header className={styles.panelHeader}>
        <div>
          <p className="eyebrow">Product performance</p>
          <h2>Best sellers</h2>
        </div>
      </header>

      {products.length === 0 ? (
        <div className={styles.empty}>No product sales yet.</div>
      ) : (
        <ol className={styles.bestSellerList}>
          {products.map((product, index) => (
            <li key={`${product.productId ?? "deleted"}-${product.productName}`}>
              <span className={styles.bestSellerRank}>{index + 1}</span>
              <div>
                {product.productId ? (
                  <Link to={`/admin/products/${product.productId}/edit`}>{product.productName}</Link>
                ) : (
                  <strong>{product.productName}</strong>
                )}
                <p>{formatInteger(product.quantitySold)} sold · {formatMoney(product.sales)}</p>
                <span className={styles.rankTrack}>
                  <i style={{ width: `${(product.quantitySold / maximum) * 100}%` }} />
                </span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
};
