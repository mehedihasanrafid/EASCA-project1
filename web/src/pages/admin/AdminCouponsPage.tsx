import React, { FormEvent, useEffect, useState } from "react";
import { Edit3, Plus, RotateCcw, Save, TicketPercent, Trash2, X } from "lucide-react";

import { AdminCoupon, SaveCouponInput, adminCouponApi } from "../../api/adminCoupons";
import { ApiException } from "../../api/client";

export interface CouponDraft {
  code: string; name: string; discountType: "PERCENTAGE" | "FIXED"; value: string;
  minimumSubtotal: string; maximumDiscount: string; startsAt: string; endsAt: string;
  usageLimit: string; perCustomerLimit: string; isActive: boolean;
}

const emptyDraft: CouponDraft = {
  code: "", name: "", discountType: "PERCENTAGE", value: "", minimumSubtotal: "0",
  maximumDiscount: "", startsAt: "", endsAt: "", usageLimit: "", perCustomerLimit: "1", isActive: true,
};

const localDateTime = (value: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
};

const apiDateTime = (value: string) => value ? new Date(value).toISOString() : null;
const message = (error: unknown) => error instanceof ApiException ? error.error.message : error instanceof Error ? error.message : "Coupon operation failed.";

const validNumber = (value: string) => value.trim() !== "" && Number.isFinite(Number(value));

export const validateCouponDraft = (draft: CouponDraft) => {
  if (!/^[A-Z0-9][A-Z0-9_-]{2,39}$/.test(draft.code.trim().toUpperCase())) return "Enter a coupon code using 3–40 letters, numbers, underscores, or hyphens.";
  if (draft.name.trim().length < 2) return "Enter a campaign name with at least 2 characters.";
  if (!validNumber(draft.value) || Number(draft.value) < 0) return "Enter a valid discount value.";
  if (draft.discountType === "PERCENTAGE" && Number(draft.value) > 100) return "Percentage discount cannot be more than 100%.";
  if (!validNumber(draft.minimumSubtotal) || Number(draft.minimumSubtotal) < 0) return "Enter a valid minimum subtotal.";
  if (draft.maximumDiscount !== "" && (!validNumber(draft.maximumDiscount) || Number(draft.maximumDiscount) < 0)) return "Enter a valid maximum discount or leave it empty.";
  if (draft.usageLimit !== "" && (!validNumber(draft.usageLimit) || !Number.isInteger(Number(draft.usageLimit)) || Number(draft.usageLimit) < 1)) return "Total usage limit must be a whole number of 1 or more, or left empty.";
  if (!validNumber(draft.perCustomerLimit) || !Number.isInteger(Number(draft.perCustomerLimit)) || Number(draft.perCustomerLimit) < 1 || Number(draft.perCustomerLimit) > 100) return "Per-customer limit must be a whole number from 1 to 100.";

  const startsAt = draft.startsAt ? new Date(draft.startsAt) : null;
  const endsAt = draft.endsAt ? new Date(draft.endsAt) : null;
  if (startsAt && Number.isNaN(startsAt.getTime())) return "Choose a valid start date and time.";
  if (endsAt && Number.isNaN(endsAt.getTime())) return "Choose a valid end date and time.";
  if (startsAt && endsAt && endsAt <= startsAt) return "The end date and time must be after the start date and time.";
  return null;
};

export const AdminCouponsPage: React.FC = () => {
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [draft, setDraft] = useState<CouponDraft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = async () => {
    setLoading(true);
    try { setCoupons(await adminCouponApi.list(true)); setError(""); }
    catch (requestError) { setError(message(requestError)); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);
  const set = <K extends keyof CouponDraft>(key: K, value: CouponDraft[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const reset = () => { setDraft(emptyDraft); setEditingId(null); setError(""); };
  const edit = (coupon: AdminCoupon) => {
    setEditingId(coupon.id);
    setDraft({
      code: coupon.code, name: coupon.name, discountType: coupon.discountType, value: coupon.value,
      minimumSubtotal: coupon.minimumSubtotal, maximumDiscount: coupon.maximumDiscount ?? "",
      startsAt: localDateTime(coupon.startsAt), endsAt: localDateTime(coupon.endsAt),
      usageLimit: coupon.usageLimit == null ? "" : String(coupon.usageLimit),
      perCustomerLimit: String(coupon.perCustomerLimit), isActive: coupon.isActive,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setError(""); setNotice("");
    const validationError = validateCouponDraft(draft);
    if (validationError) {
      setError(validationError);
      setSaving(false);
      return;
    }
    const input: SaveCouponInput = {
      code: draft.code.trim().toUpperCase(), name: draft.name.trim(), discountType: draft.discountType,
      value: Number(draft.value), minimumSubtotal: Number(draft.minimumSubtotal || 0),
      maximumDiscount: draft.maximumDiscount === "" ? null : Number(draft.maximumDiscount),
      startsAt: apiDateTime(draft.startsAt), endsAt: apiDateTime(draft.endsAt),
      usageLimit: draft.usageLimit === "" ? null : Number(draft.usageLimit),
      perCustomerLimit: Number(draft.perCustomerLimit), isActive: draft.isActive,
    };
    try {
      if (editingId) await adminCouponApi.update(editingId, input); else await adminCouponApi.create(input);
      setNotice(editingId ? "Coupon updated." : "Coupon created."); reset(); await load();
    } catch (requestError) { setError(message(requestError)); }
    finally { setSaving(false); }
  };

  const remove = async (coupon: AdminCoupon) => {
    if (!window.confirm(`Archive coupon ${coupon.code}? Existing order records will be preserved.`)) return;
    try { await adminCouponApi.remove(coupon.id); await load(); } catch (requestError) { setError(message(requestError)); }
  };

  const restore = async (coupon: AdminCoupon) => {
    try { await adminCouponApi.restore(coupon.id); await load(); } catch (requestError) { setError(message(requestError)); }
  };

  return (
    <div className="dashboard-container admin-page admin-coupons-page">
      <header className="admin-page-header">
        <div><p className="eyebrow">Marketing</p><h1>Coupons</h1><p>Create secure order discounts with schedules and usage limits.</p></div>
      </header>
      {error && <div className="alert alert-error">{error}</div>}
      {notice && <div className="alert alert-success">{notice}</div>}

      <form className="admin-product-form" onSubmit={submit} noValidate>
        <div className="admin-form-heading"><h2>{editingId ? "Edit coupon" : "Create coupon"}</h2><p>Coupons apply after product-level discounts and before delivery.</p></div>
        <div className="admin-form-grid coupon-form-grid">
          <label className="form-group"><span>Code</span><input className="form-input" required minLength={3} maxLength={40} value={draft.code} onChange={(event) => set("code", event.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""))} placeholder="SAVE10" /></label>
          <label className="form-group"><span>Campaign name</span><input className="form-input" required value={draft.name} onChange={(event) => set("name", event.target.value)} placeholder="October welcome offer" /></label>
          <label className="form-group"><span>Discount type</span><select className="form-input" value={draft.discountType} onChange={(event) => set("discountType", event.target.value as CouponDraft["discountType"])}><option value="PERCENTAGE">Percentage</option><option value="FIXED">Fixed BDT</option></select></label>
          <label className="form-group"><span>{draft.discountType === "PERCENTAGE" ? "Percentage off" : "Fixed amount"}</span><input className="form-input" required type="number" min="0" max={draft.discountType === "PERCENTAGE" ? 100 : undefined} step="0.01" value={draft.value} onChange={(event) => set("value", event.target.value)} /></label>
          <label className="form-group"><span>Minimum subtotal</span><input className="form-input" type="number" min="0" step="0.01" value={draft.minimumSubtotal} onChange={(event) => set("minimumSubtotal", event.target.value)} /></label>
          <label className="form-group"><span>Maximum discount</span><input className="form-input" type="number" min="0" step="0.01" value={draft.maximumDiscount} onChange={(event) => set("maximumDiscount", event.target.value)} placeholder="No cap" /></label>
          <label className="form-group"><span>Starts at</span><input className="form-input" type="datetime-local" step="60" value={draft.startsAt} onChange={(event) => set("startsAt", event.target.value)} /><small>Optional. Uses your local date and time.</small></label>
          <label className="form-group"><span>Ends at</span><input className="form-input" type="datetime-local" step="60" value={draft.endsAt} onChange={(event) => set("endsAt", event.target.value)} /><small>Optional. Must be after the start time.</small></label>
          <label className="form-group"><span>Total usage limit</span><input className="form-input" type="number" min="1" value={draft.usageLimit} onChange={(event) => set("usageLimit", event.target.value)} placeholder="Unlimited" /></label>
          <label className="form-group"><span>Per-customer limit</span><input className="form-input" required type="number" min="1" max="100" value={draft.perCustomerLimit} onChange={(event) => set("perCustomerLimit", event.target.value)} /></label>
          <label className="admin-checkbox coupon-active"><input type="checkbox" checked={draft.isActive} onChange={(event) => set("isActive", event.target.checked)} /> Active and available</label>
        </div>
        <div className="admin-form-actions"><button className="btn btn-primary" formNoValidate disabled={saving}><Save size={17} />{saving ? "Saving..." : editingId ? "Update coupon" : "Create coupon"}</button>{editingId && <button type="button" className="btn btn-ghost" onClick={reset}><X size={17} />Cancel</button>}</div>
      </form>

      <section className="admin-products-panel">
        <div className="admin-panel-heading"><div><h2>Coupon library</h2><p>{coupons.length} coupon{coupons.length === 1 ? "" : "s"}, including archived records.</p></div></div>
        {loading ? <div className="admin-page-loading">Loading coupons...</div> : coupons.length === 0 ? <div className="admin-dashboard-empty"><div><TicketPercent size={34} /><p>No coupons yet.</p><button className="btn btn-primary" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}><Plus size={16} />Create one</button></div></div> : (
          <div className="admin-table-wrapper"><table className="admin-table coupon-table"><thead><tr><th>Coupon</th><th>Offer</th><th>Schedule</th><th>Usage</th><th>Status</th><th>Actions</th></tr></thead><tbody>{coupons.map((coupon) => {
            const expired = coupon.endsAt ? new Date(coupon.endsAt) < new Date() : false;
            const offer = coupon.discountType === "PERCENTAGE" ? `${Number(coupon.value)}% off` : `BDT ${Number(coupon.value).toLocaleString("en-BD")} off`;
            return <tr key={coupon.id} className={coupon.deletedAt ? "is-deleted" : ""}><td><strong>{coupon.code}</strong><small>{coupon.name}</small></td><td><strong>{offer}</strong><small>Minimum BDT {Number(coupon.minimumSubtotal).toLocaleString("en-BD")}{coupon.maximumDiscount ? ` · cap BDT ${Number(coupon.maximumDiscount).toLocaleString("en-BD")}` : ""}</small></td><td><span>{coupon.startsAt ? new Date(coupon.startsAt).toLocaleString() : "Immediately"}</span><small>{coupon.endsAt ? `Until ${new Date(coupon.endsAt).toLocaleString()}` : "No expiry"}</small></td><td><strong>{coupon.usedCount}{coupon.usageLimit === null ? "" : ` / ${coupon.usageLimit}`}</strong><small>{coupon.perCustomerLimit} per customer</small></td><td><span className={`status-pill ${coupon.deletedAt || !coupon.isActive || expired ? "status-inactive" : "status-active"}`}>{coupon.deletedAt ? "Archived" : expired ? "Expired" : coupon.isActive ? "Active" : "Paused"}</span></td><td><div className="admin-row-actions">{coupon.deletedAt ? <button title="Restore" onClick={() => void restore(coupon)}><RotateCcw size={16} /></button> : <><button title="Edit" onClick={() => edit(coupon)}><Edit3 size={16} /></button><button className="is-danger" title="Archive" onClick={() => void remove(coupon)}><Trash2 size={16} /></button></>}</div></td></tr>;
          })}</tbody></table></div>
        )}
      </section>
    </div>
  );
};
