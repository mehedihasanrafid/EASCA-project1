import React from "react";
import { Link } from "react-router-dom";

import styles from "./StorefrontSecondaryBar.module.css";

export interface StorefrontSecondaryItem {
  label: string;
  to: string;
}

interface Props {
  items?: StorefrontSecondaryItem[];
  promotion?: string;
}

/**
 * Optional second storefront header for future promotions, categories, brands,
 * or campaign links. With no content it deliberately renders nothing.
 */
export const StorefrontSecondaryBar: React.FC<Props> = ({ items = [], promotion }) => {
  if (!promotion && items.length === 0) return null;

  return (
    <nav className={styles.bar} aria-label="Store navigation and promotions">
      <div className={styles.content}>
        {promotion && <p className={styles.promotion}>{promotion}</p>}
        {items.length > 0 && (
          <ul className={styles.links}>
            {items.map((item) => (
              <li key={`${item.to}-${item.label}`}>
                <Link to={item.to}>{item.label}</Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </nav>
  );
};
