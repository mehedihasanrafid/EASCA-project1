import type { FormEventHandler } from "react";
import { Save, X } from "lucide-react";

import type {
  CouponDraft,
  SetCouponDraftField,
} from "../../types/coupon.types";
import styles from "./CouponForm.module.css";

interface CouponFormProps {
  draft: CouponDraft;
  editing: boolean;
  saving: boolean;
  onChange: SetCouponDraftField;
  onReset: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
}

/** Coupon inputs and form interaction; data operations stay in the controller. */
export const CouponForm = ({
  draft,
  editing,
  saving,
  onChange,
  onReset,
  onSubmit,
}: CouponFormProps) => (
  <form className={`${styles.form} admin-product-form`} onSubmit={onSubmit} noValidate>
    <div className="admin-form-heading">
      <h2>{editing ? "Edit coupon" : "Create coupon"}</h2>
      <p>Coupons apply after product-level discounts and before delivery.</p>
    </div>

    <div className={`${styles.grid} admin-form-grid`}>
      <label className="form-group">
        <span>Code</span>
        <input
          className="form-input"
          required
          minLength={3}
          maxLength={40}
          value={draft.code}
          onChange={(event) => onChange(
            "code",
            event.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""),
          )}
          placeholder="SAVE10"
        />
      </label>

      <label className="form-group">
        <span>Campaign name</span>
        <input
          className="form-input"
          required
          value={draft.name}
          onChange={(event) => onChange("name", event.target.value)}
          placeholder="October welcome offer"
        />
      </label>

      <label className="form-group">
        <span>Discount type</span>
        <select
          className="form-input"
          value={draft.discountType}
          onChange={(event) => onChange(
            "discountType",
            event.target.value as CouponDraft["discountType"],
          )}
        >
          <option value="PERCENTAGE">Percentage</option>
          <option value="FIXED">Fixed BDT</option>
        </select>
      </label>

      <label className="form-group">
        <span>{draft.discountType === "PERCENTAGE" ? "Percentage off" : "Fixed amount"}</span>
        <input
          className="form-input"
          required
          type="number"
          min="0"
          max={draft.discountType === "PERCENTAGE" ? 100 : undefined}
          step="0.01"
          value={draft.value}
          onChange={(event) => onChange("value", event.target.value)}
        />
      </label>

      <label className="form-group">
        <span>Minimum subtotal</span>
        <input
          className="form-input"
          type="number"
          min="0"
          step="0.01"
          value={draft.minimumSubtotal}
          onChange={(event) => onChange("minimumSubtotal", event.target.value)}
        />
      </label>

      <label className="form-group">
        <span>Maximum discount</span>
        <input
          className="form-input"
          type="number"
          min="0"
          step="0.01"
          value={draft.maximumDiscount}
          onChange={(event) => onChange("maximumDiscount", event.target.value)}
          placeholder="No cap"
        />
      </label>

      <label className="form-group">
        <span>Starts at</span>
        <input
          className="form-input"
          type="datetime-local"
          step="60"
          value={draft.startsAt}
          onChange={(event) => onChange("startsAt", event.target.value)}
        />
        <small>Optional. Uses your local date and time.</small>
      </label>

      <label className="form-group">
        <span>Ends at</span>
        <input
          className="form-input"
          type="datetime-local"
          step="60"
          value={draft.endsAt}
          onChange={(event) => onChange("endsAt", event.target.value)}
        />
        <small>Optional. Must be after the start time.</small>
      </label>

      <label className="form-group">
        <span>Total usage limit</span>
        <input
          className="form-input"
          type="number"
          min="1"
          value={draft.usageLimit}
          onChange={(event) => onChange("usageLimit", event.target.value)}
          placeholder="Unlimited"
        />
      </label>

      <label className="form-group">
        <span>Per-customer limit</span>
        <input
          className="form-input"
          required
          type="number"
          min="1"
          max="100"
          value={draft.perCustomerLimit}
          onChange={(event) => onChange("perCustomerLimit", event.target.value)}
        />
      </label>

      <label className={`${styles.active} admin-checkbox`}>
        <input
          type="checkbox"
          checked={draft.isActive}
          onChange={(event) => onChange("isActive", event.target.checked)}
        />
        Active and available
      </label>
    </div>

    <div className="admin-form-actions">
      <button className="btn btn-primary" formNoValidate disabled={saving}>
        <Save size={17} />
        {saving ? "Saving..." : editing ? "Update coupon" : "Create coupon"}
      </button>
      {editing && (
        <button type="button" className="btn btn-ghost" disabled={saving} onClick={onReset}>
          <X size={17} /> Cancel
        </button>
      )}
    </div>
  </form>
);
