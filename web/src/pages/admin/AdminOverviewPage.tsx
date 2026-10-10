import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Banknote,
  CalendarDays,
  PackagePlus,
  RefreshCw,
  ShoppingBag,
  TriangleAlert,
} from "lucide-react";
import { Link } from "react-router-dom";

import { AdminDashboardData, adminDashboardApi } from "../../api/adminDashboard";
import { ApiException } from "../../api/client";
import { SalesTrendChart } from "../../features/admin/dashboard/SalesTrendChart";
import { useAuth } from "../../features/auth/AuthContext";

const moneyFormatter = new Intl.NumberFormat("en-BD", {
  style: "currency",
  currency: "BDT",
  maximumFractionDigits: 0,
});

const integerFormatter = new Intl.NumberFormat("en-BD");

const updatedFormatter = new Intl.DateTimeFormat("en-BD", {
  hour: "numeric",
  minute: "2-digit",
});

export const AdminOverviewPage: React.FC = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setDashboard(await adminDashboardApi.get());
    } catch (requestError) {
      setError(
        requestError instanceof ApiException
          ? requestError.error.message
          : "Could not load the dashboard analytics.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const bestSellerMaximum = useMemo(
    () => Math.max(...(dashboard?.bestSellingProducts.map((product) => product.quantitySold) ?? []), 1),
    [dashboard],
  );

  const summaryCards = dashboard
    ? [
        {
          label: "Total sales",
          value: moneyFormatter.format(Number(dashboard.summary.totalSales)),
          note: "Excludes cancelled, failed and refunded orders",
          icon: Banknote,
          tone: "sales",
        },
        {
          label: "Total orders",
          value: integerFormatter.format(dashboard.summary.totalOrders),
          note: "All orders placed since launch",
          icon: ShoppingBag,
          tone: "orders",
        },
        {
          label: "Today's orders",
          value: integerFormatter.format(dashboard.summary.todayOrders),
          note: "Orders placed today",
          icon: CalendarDays,
          tone: "today",
        },
        {
          label: "Low stock",
          value: integerFormatter.format(dashboard.summary.lowStockCount),
          note: "Active variants at or below their limit",
          icon: TriangleAlert,
          tone: "stock",
        },
      ]
    : [];

  return (
    <div className="dashboard-container admin-page admin-dashboard-page">
      <header className="admin-page-header">
        <div>
          <p className="eyebrow">Store performance</p>
          <h1>Welcome, {user?.name}</h1>
          <p>Sales, orders, and inventory health in one place.</p>
        </div>
        <div className="admin-dashboard-actions">
          {dashboard && <span>Updated {updatedFormatter.format(new Date(dashboard.generatedAt))}</span>}
          <button className="btn btn-ghost" type="button" onClick={() => void loadDashboard()} disabled={loading}>
            <RefreshCw size={17} className={loading ? "is-spinning" : ""} /> Refresh
          </button>
          <Link className="btn btn-primary" to="/admin/products/new">
            <PackagePlus size={18} /> Add product
          </Link>
        </div>
      </header>

      {error && (
        <div className="alert alert-error admin-dashboard-error">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button type="button" onClick={() => void loadDashboard()}>Try again</button>
        </div>
      )}

      {loading && !dashboard ? (
        <div className="admin-dashboard-loading" aria-label="Loading dashboard analytics">
          {Array.from({ length: 4 }, (_, index) => <div key={index} />)}
        </div>
      ) : dashboard ? (
        <>
          <section className="admin-metric-grid" aria-label="Store summary">
            {summaryCards.map(({ label, value, note, icon: Icon, tone }) => (
              <article className={`admin-metric-card is-${tone}`} key={label}>
                <div>
                  <p>{label}</p>
                  <strong>{value}</strong>
                  <span>{note}</span>
                </div>
                <i><Icon size={22} /></i>
              </article>
            ))}
          </section>

          <div className="admin-analytics-grid">
            <section className="admin-dashboard-panel admin-sales-panel">
              <header>
                <div>
                  <p className="eyebrow">Last 30 days</p>
                  <h2>Daily sales</h2>
                </div>
                <span>BDT</span>
              </header>
              <SalesTrendChart data={dashboard.dailySales} />
            </section>

            <section className="admin-dashboard-panel admin-best-sellers-panel">
              <header>
                <div>
                  <p className="eyebrow">Product performance</p>
                  <h2>Best sellers</h2>
                </div>
              </header>
              {dashboard.bestSellingProducts.length === 0 ? (
                <div className="admin-dashboard-empty">No product sales yet.</div>
              ) : (
                <ol className="admin-best-seller-list">
                  {dashboard.bestSellingProducts.map((product, index) => (
                    <li key={`${product.productId ?? "deleted"}-${product.productName}`}>
                      <span className="admin-best-seller-rank">{index + 1}</span>
                      <div>
                        {product.productId ? (
                          <Link to={`/admin/products/${product.productId}/edit`}>{product.productName}</Link>
                        ) : (
                          <strong>{product.productName}</strong>
                        )}
                        <p>{integerFormatter.format(product.quantitySold)} sold · {moneyFormatter.format(Number(product.sales))}</p>
                        <span className="admin-rank-track"><i style={{ width: `${(product.quantitySold / bestSellerMaximum) * 100}%` }} /></span>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>

          <section className="admin-dashboard-panel admin-low-stock-panel">
            <header>
              <div>
                <p className="eyebrow">Inventory attention</p>
                <h2>Products running low on stock</h2>
              </div>
              <Link className="text-link" to="/admin/products">View products</Link>
            </header>
            {dashboard.lowStockProducts.length === 0 ? (
              <div className="admin-dashboard-empty">All active product variants are above their low-stock limits.</div>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-product-table admin-low-stock-table">
                  <thead>
                    <tr><th>Product</th><th>Variant</th><th>SKU</th><th>Stock</th><th>Low-stock limit</th><th><span className="sr-only">Action</span></th></tr>
                  </thead>
                  <tbody>
                    {dashboard.lowStockProducts.map((product) => (
                      <tr key={product.variantId}>
                        <td><strong>{product.productName}</strong></td>
                        <td>{product.variantName}</td>
                        <td><code>{product.sku}</code></td>
                        <td><span className={product.stockQuantity === 0 ? "stock-out" : "admin-stock-warning"}>{product.stockQuantity}</span></td>
                        <td>{product.lowStockLevel}</td>
                        <td><Link className="text-link" to={`/admin/products/${product.productId}/edit`}>Restock</Link></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
};
