import { useCallback, useEffect, useState } from "react";

import { AdminDashboardData, adminDashboardApi } from "../../../api/adminDashboard";
import { ApiException } from "../../../api/client";

/** Loads dashboard analytics and exposes one refresh action to the page. */
export function useAdminDashboard() {
  const [dashboard, setDashboard] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
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
    void refresh();
  }, [refresh]);

  return { dashboard, error, loading, refresh };
}
