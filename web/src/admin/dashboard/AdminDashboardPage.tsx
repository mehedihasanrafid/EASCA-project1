import React from "react";
import { AlertCircle, PackagePlus, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";

import { useAuth } from "../../features/auth/AuthContext";
import styles from "./AdminDashboard.module.css";
import { BestSellers } from "./components/BestSellers";
import { DashboardSummary } from "./components/DashboardSummary";
import { LowStockProducts } from "./components/LowStockProducts";
import { SalesTrendChart } from "./components/SalesTrendChart";
import { useAdminDashboard } from "./hooks/useAdminDashboard";
import { formatUpdatedTime } from "./utils/formatters";

/** Route page for /admin. It composes dashboard sections and page actions. */
export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { dashboard, error, loading, refresh } = useAdminDashboard();

  return (
    <div className={`dashboard-container admin-page ${styles.page}`}>
      <header className="admin-page-header">
        <div>
          <p className="eyebrow">Store performance</p>
          <h1>Welcome, {user?.name}</h1>
          <p>Sales, orders, and inventory health in one place.</p>
        </div>

        <div className={styles.actions}>
          {dashboard && <span>Updated {formatUpdatedTime(dashboard.generatedAt)}</span>}
          <button className="btn btn-ghost" type="button" onClick={() => void refresh()} disabled={loading}>
            <RefreshCw size={17} className={loading ? styles.spinning : ""} /> Refresh
          </button>
          <Link className="btn btn-primary" to="/admin/products/new">
            <PackagePlus size={18} /> Add product
          </Link>
        </div>
      </header>

      {error && (
        <div className={`alert alert-error ${styles.error}`}>
          <AlertCircle size={18} />
          <span>{error}</span>
          <button type="button" onClick={() => void refresh()}>Try again</button>
        </div>
      )}

      {loading && !dashboard ? (
        <div className={styles.loading} aria-label="Loading dashboard analytics">
          {Array.from({ length: 4 }, (_, index) => <div key={index} />)}
        </div>
      ) : dashboard ? (
        <>
          <DashboardSummary summary={dashboard.summary} />

          <div className={styles.analyticsGrid}>
            <section className={styles.panel}>
              <header className={styles.panelHeader}>
                <div>
                  <p className="eyebrow">Last 30 days</p>
                  <h2>Daily sales</h2>
                </div>
                <span>BDT</span>
              </header>
              <SalesTrendChart data={dashboard.dailySales} />
            </section>

            <BestSellers products={dashboard.bestSellingProducts} />
          </div>

          <LowStockProducts products={dashboard.lowStockProducts} />
        </>
      ) : null}
    </div>
  );
};
