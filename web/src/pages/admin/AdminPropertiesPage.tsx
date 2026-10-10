import React, { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";

import { AdminProductType, adminCatalogApi } from "../../api/adminCatalog";
import { ApiException } from "../../api/client";
import { AdminProductProperties } from "./AdminProductProperties";

export const AdminPropertiesPage: React.FC = () => {
  const [productTypes, setProductTypes] = useState<AdminProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    adminCatalogApi
      .getProductTypes(true)
      .then(setProductTypes)
      .catch((requestError) => {
        setError(
          requestError instanceof ApiException
            ? requestError.error.message
            : "Could not load product types.",
        );
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="dashboard-container admin-catalog admin-taxonomy-page admin-page">
      <header className="admin-page-header">
        <div>
          <p className="eyebrow">Variant configuration</p>
          <h1>Product properties</h1>
          <p>Create reusable properties and assign them to the product types that need them.</p>
        </div>
      </header>

      {error && <div className="alert alert-error"><AlertCircle size={18} />{error}</div>}
      {loading ? (
        <div className="admin-page-loading">Loading product properties...</div>
      ) : (
        <AdminProductProperties productTypes={productTypes} />
      )}
    </div>
  );
};
