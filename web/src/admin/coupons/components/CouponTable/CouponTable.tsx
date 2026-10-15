import { Edit3, Plus, RotateCcw, TicketPercent, Trash2 } from "lucide-react";

import type { AdminCoupon } from "../../types/coupon.types";
import {
  formatCouponEnd,
  formatCouponOffer,
  formatCouponRequirements,
  formatCouponStart,
  getCouponStatus,
} from "../../utils/couponFormat";
import styles from "./CouponTable.module.css";

interface CouponTableProps {
  coupons: AdminCoupon[];
  loading: boolean;
  onArchive: (coupon: AdminCoupon) => Promise<void>;
  onCreate: () => void;
  onEdit: (coupon: AdminCoupon) => void;
  onRestore: (coupon: AdminCoupon) => Promise<void>;
}

/** Coupon listing, including loading, empty, active, and archived states. */
export const CouponTable = ({
  coupons,
  loading,
  onArchive,
  onCreate,
  onEdit,
  onRestore,
}: CouponTableProps) => (
  <section className="admin-products-panel">
    <div className="admin-panel-heading">
      <div>
        <h2>Coupon library</h2>
        <p>{coupons.length} coupon{coupons.length === 1 ? "" : "s"}, including archived records.</p>
      </div>
    </div>

    {loading ? (
      <div className="admin-page-loading">Loading coupons...</div>
    ) : coupons.length === 0 ? (
      <div className="admin-empty-state">
        <TicketPercent size={34} />
        <h3>No coupons yet</h3>
        <p>Create the first coupon for a campaign or customer offer.</p>
        <button type="button" className={`${styles.emptyAction} btn btn-primary`} onClick={onCreate}>
          <Plus size={16} /> Create one
        </button>
      </div>
    ) : (
      <div className="admin-table-wrap">
        <table className={`${styles.table} admin-product-table`}>
          <thead>
            <tr>
              <th>Coupon</th>
              <th>Offer</th>
              <th>Schedule</th>
              <th>Usage</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((coupon) => {
              const status = getCouponStatus(coupon);

              return (
                <tr key={coupon.id} className={coupon.deletedAt ? styles.deletedRow : undefined}>
                  <td>
                    <strong>{coupon.code}</strong>
                    <small>{coupon.name}</small>
                  </td>
                  <td>
                    <strong>{formatCouponOffer(coupon)}</strong>
                    <small>{formatCouponRequirements(coupon)}</small>
                  </td>
                  <td>
                    <span>{formatCouponStart(coupon)}</span>
                    <small>{formatCouponEnd(coupon)}</small>
                  </td>
                  <td>
                    <strong>
                      {coupon.usedCount}
                      {coupon.usageLimit === null ? "" : ` / ${coupon.usageLimit}`}
                    </strong>
                    <small>{coupon.perCustomerLimit} per customer</small>
                  </td>
                  <td>
                    <span className={`status-pill ${status.active ? "status-active" : "status-inactive"}`}>
                      {status.label}
                    </span>
                  </td>
                  <td>
                    <div className={styles.rowActions}>
                      {coupon.deletedAt ? (
                        <button
                          type="button"
                          className={styles.actionButton}
                          aria-label={`Restore ${coupon.code}`}
                          title="Restore"
                          onClick={() => void onRestore(coupon)}
                        >
                          <RotateCcw size={16} />
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            className={styles.actionButton}
                            aria-label={`Edit ${coupon.code}`}
                            title="Edit"
                            onClick={() => onEdit(coupon)}
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            type="button"
                            className={`${styles.actionButton} ${styles.dangerAction}`}
                            aria-label={`Archive ${coupon.code}`}
                            title="Archive"
                            onClick={() => void onArchive(coupon)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
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
);
