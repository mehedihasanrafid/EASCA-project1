import React, { useCallback, useEffect, useState } from "react";
import { AlertCircle, ExternalLink, Package, Pencil, Plus } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { AdminProduct, adminProductApi } from "../../api/adminProducts";
import { ApiException } from "../../api/client";

const priceFormatter = new Intl.NumberFormat("en-BD", {
  style: "currency",
  currency: "BDT",
  minimumFractionDigits: 0,
});

interface ProductLocationState {
  success?: string;
}

export const AdminProductsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success] = useState(
    () => (location.state as ProductLocationState | null)?.success ?? "",
  );

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await adminProductApi.getProducts();
      setProducts(result.products);
    } catch (requestError) {
      setError(
        requestError instanceof ApiException
          ? requestError.error.message
          : "Could not load the product catalog.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    if (!success) return;
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, navigate, success]);

  return (
    <div className="dashboard-container admin-catalog admin-page">
      <header className="admin-page-header">
        <div>
          <p className="eyebrow">Catalog</p>
          <h1>Products</h1>
          <p>Manage product information, prices, stock, variants, and media.</p>
        </div>
        <Link className="btn btn-primary" to="/admin/products/new">
          <Plus size={18} /> Add product
        </Link>
      </header>

      {error && <div className="alert alert-error"><AlertCircle size={18} />{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <section className="admin-products-panel">
        <div className="admin-panel-heading">
          <div>
            <h2>Catalog</h2>
            <p>{products.length} product{products.length === 1 ? "" : "s"}</p>
          </div>
        </div>

        {loading ? (
          <div className="admin-empty-state">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="admin-empty-state">
            <Package size={36} />
            <h3>No products yet</h3>
            <p>Add the first product to start building the catalog.</p>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-product-table">
              <thead>
                <tr>
                  <th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th><span className="sr-only">Actions</span></th>
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
                      <td>{priceFormatter.format(Number(product.price))}</td>
                      <td><span className={product.stockQuantity > 0 ? "stock-in" : "stock-out"}>{product.stockQuantity}</span></td>
                      <td><span className={`status-pill status-${product.status.toLowerCase()}`}>{product.status}</span></td>
                      <td>
                        <div className="admin-row-actions">
                          <Link className="admin-view-link" to={`/admin/products/${product.id}/edit`} title={`Edit ${product.name}`} aria-label={`Edit ${product.name}`}>
                            <Pencil size={17} />
                          </Link>
                          <Link to={`/products/${product.slug}`} className="admin-view-link" title="View storefront product" aria-label={`View ${product.name} on storefront`}>
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
        )}
      </section>
    </div>
  );
};
