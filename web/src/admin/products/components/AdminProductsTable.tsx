import React from "react";
import { ExternalLink, Package, Pencil } from "lucide-react";
import { Link } from "react-router-dom";

import { formatBdt } from "../../../shared/utils/currency";

import { AdminProduct } from "../../../api/adminProducts";



interface Props {
  loading: boolean;
  products: AdminProduct[];
  search: string;
}

/** Handles every visual state of the product list: loading, empty, and populated. */
export const AdminProductsTable: React.FC<Props> = ({ loading, products, search }) => {
  if (loading) return <div className="admin-empty-state">Loading products...</div>;

  if (products.length === 0) {
    return (
      <div className="admin-empty-state">
        <Package size={36} />
        <h3>{search ? "No matching products" : "No products yet"}</h3>
        <p>
          {search
            ? `No product matched “${search}”. Try another name, SKU, category, or brand.`
            : "Add the first product to start building the catalog."}
        </p>
      </div>
    );
  }

  return (
    <div className="admin-table-wrap">
      <table className="admin-product-table">
        <thead>
          <tr>
            <th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th>
            <th><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            const primaryMedia = product.primaryImage ?? product.media?.[0];

            return (
              <tr key={product.id}>
                <td>
                  <div className="admin-product-identity">
                    <div className="admin-product-thumbnail" aria-hidden="true">
                      {primaryMedia?.type === "VIDEO" ? (
                        <video src={primaryMedia.url} muted preload="metadata" />
                      ) : primaryMedia ? (
                        <img src={primaryMedia.thumbnailUrl || primaryMedia.url} alt="" loading="lazy" />
                      ) : (
                        <Package size={20} />
                      )}
                    </div>
                    <div className="admin-product-copy">
                      <strong>{product.name}</strong>
                      <span className="admin-product-brand">{product.brand?.name || "Unbranded"}</span>
                    </div>
                  </div>
                </td>
                <td>{product.category.name}</td>
                
                <td>{formatBdt(product.price)}</td>

                <td><span className={product.stockQuantity > 0 ? "stock-in" : "stock-out"}>{product.stockQuantity}</span></td>
                <td><span className={`status-pill status-${product.status.toLowerCase()}`}>{product.status}</span></td>
                <td>
                  <div className="admin-row-actions">
                    <Link className="admin-view-link" to={`/admin/products/${product.id}/edit`} title={`Edit ${product.name}`} aria-label={`Edit ${product.name}`}>
                      <Pencil size={17} />
                    </Link>
                    <Link className="admin-view-link" to={`/products/${product.slug}`} title="View storefront product" aria-label={`View ${product.name} on storefront`}>
                      <ExternalLink size={17} />
                    </Link>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
