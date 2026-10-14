import React, { useEffect, useState } from "react";
import { AlertCircle, Plus } from "lucide-react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";

import { AdminProductSearch } from "./components/AdminProductSearch";
import { AdminProductsTable } from "./components/AdminProductsTable";
import { useAdminProducts } from "./hooks/useAdminProducts";

interface ProductLocationState {
  success?: string;
}

/** Thin page: reads the URL, composes product components, and owns page actions. */
export const AdminProductsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("search")?.trim() ?? "";
  const { error, loading, products } = useAdminProducts(search);
  const [success] = useState(
    () => (location.state as ProductLocationState | null)?.success ?? "",
  );

  useEffect(() => {
    if (!success) return;
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, navigate, success]);

  const updateSearch = (nextSearch: string) => {
    const nextParams = new URLSearchParams(searchParams);
    const normalizedSearch = nextSearch.trim();

    if (normalizedSearch) nextParams.set("search", normalizedSearch);
    else nextParams.delete("search");

    setSearchParams(nextParams, { replace: true });
  };

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
            <h2>{search ? `Results for “${search}”` : "Catalog"}</h2>
            <p>{products.length} product{products.length === 1 ? "" : "s"}</p>
          </div>
          <AdminProductSearch value={search} onSearch={updateSearch} />
        </div>

        <AdminProductsTable loading={loading} products={products} search={search} />
      </section>
    </div>
  );
};
