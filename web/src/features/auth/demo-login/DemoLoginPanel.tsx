import React, { useEffect, useState } from "react";
import { ShieldCheck, UserRound } from "lucide-react";

import { authApi, type DemoLoginConfig, type DemoRole } from "../../../api/auth";
import styles from "./DemoLoginPanel.module.css";

interface DemoLoginPanelProps {
  busyRole: DemoRole | null;
  onSelect: (role: DemoRole) => void;
}

/**
 * Optional demo access stays separate from the normal credential form.
 * The panel renders only when the backend reports DEMO_LOGIN_ENABLED=true.
 */
export const DemoLoginPanel: React.FC<DemoLoginPanelProps> = ({
  busyRole,
  onSelect,
}) => {
  const [config, setConfig] = useState<DemoLoginConfig | null>(null);

  useEffect(() => {
    let active = true;

    authApi
      .getDemoLoginConfig()
      .then((result) => {
        if (active) setConfig(result);
      })
      // An unavailable or older API should never break the regular login form.
      .catch(() => {
        if (active) setConfig({ enabled: false, roles: [] });
      });

    return () => {
      active = false;
    };
  }, []);

  if (!config?.enabled) return null;

  const hasRole = (role: DemoRole) => config.roles.includes(role);

  return (
    <section className={styles.panel} aria-labelledby="demo-login-title">
      <div className={styles.divider} aria-hidden="true">
        <span>or explore the demo</span>
      </div>

      <div className={styles.heading}>
        <h2 id="demo-login-title">One-click demo access</h2>
        <p>No email or password is required.</p>
      </div>

      <div className={styles.actions}>
        {hasRole("CUSTOMER") && (
          <button
            type="button"
            className={styles.customerButton}
            disabled={busyRole !== null}
            onClick={() => onSelect("CUSTOMER")}
          >
            <UserRound size={18} aria-hidden="true" />
            {busyRole === "CUSTOMER" ? "Opening customer demo..." : "Customer Demo"}
          </button>
        )}

        {hasRole("ADMIN") && (
          <button
            type="button"
            className={styles.adminButton}
            disabled={busyRole !== null}
            onClick={() => onSelect("ADMIN")}
          >
            <ShieldCheck size={18} aria-hidden="true" />
            {busyRole === "ADMIN" ? "Opening admin demo..." : "Admin Demo"}
          </button>
        )}
      </div>
    </section>
  );
};
