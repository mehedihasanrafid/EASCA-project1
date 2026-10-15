import { AlertCircle, CheckCircle } from "lucide-react";

import { CouponForm } from "./components/CouponForm/CouponForm";
import { CouponHeader } from "./components/CouponHeader/CouponHeader";
import { CouponTable } from "./components/CouponTable/CouponTable";
import { useAdminCoupons } from "./hooks/useAdminCoupons";
import styles from "./AdminCouponsPage.module.css";

/** Thin page coordinator: state lives in the hook and visible sections own their JSX/CSS. */
export const AdminCouponsPage = () => {
  const controller = useAdminCoupons();

  return (
    <div className={`${styles.page} dashboard-container admin-page`}>
      <CouponHeader />

      {controller.error && (
        <div className="alert alert-error" role="alert">
          <AlertCircle size={18} /> {controller.error}
        </div>
      )}
      {controller.notice && (
        <div className="alert alert-success" role="status">
          <CheckCircle size={18} /> {controller.notice}
        </div>
      )}

      <CouponForm
        draft={controller.draft}
        editing={controller.editingId !== null}
        saving={controller.saving}
        onChange={controller.setDraftField}
        onReset={controller.reset}
        onSubmit={controller.submit}
      />

      <CouponTable
        coupons={controller.coupons}
        loading={controller.loading}
        onArchive={controller.remove}
        onCreate={controller.create}
        onEdit={controller.edit}
        onRestore={controller.restore}
      />
    </div>
  );
};
