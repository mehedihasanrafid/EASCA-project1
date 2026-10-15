import { type FormEvent, useCallback, useEffect, useState } from "react";

import { ApiException } from "../../../api/client";
import { adminCouponApi } from "../api/adminCouponApi";
import type {
  AdminCoupon,
  CouponDraft,
  SetCouponDraftField,
} from "../types/coupon.types";
import {
  couponDraftToInput,
  couponToDraft,
  createEmptyCouponDraft,
} from "../utils/couponDraft";
import { validateCouponDraft } from "../utils/couponValidation";

const requestMessage = (error: unknown) => {
  if (error instanceof ApiException) return error.error.message;
  if (error instanceof Error) return error.message;
  return "Coupon operation failed.";
};

const scrollToEditor = () => {
  if (typeof window !== "undefined") {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
};

/** Owns coupon data, form state, and mutations so the route page stays thin. */
export const useAdminCoupons = () => {
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [draft, setDraft] = useState<CouponDraft>(createEmptyCouponDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setCoupons(await adminCouponApi.list(true));
      setError("");
    } catch (requestError) {
      setError(requestMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const setDraftField: SetCouponDraftField = useCallback((key, value) => {
    setDraft((current) => ({ ...current, [key]: value }));
  }, []);

  const reset = useCallback(() => {
    setDraft(createEmptyCouponDraft());
    setEditingId(null);
    setError("");
  }, []);

  const create = () => {
    reset();
    scrollToEditor();
  };

  const edit = (coupon: AdminCoupon) => {
    setEditingId(coupon.id);
    setDraft(couponToDraft(coupon));
    setError("");
    setNotice("");
    scrollToEditor();
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setNotice("");

    const validationError = validateCouponDraft(draft);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    const wasEditing = editingId !== null;

    try {
      const input = couponDraftToInput(draft);
      if (editingId) {
        await adminCouponApi.update(editingId, input);
      } else {
        await adminCouponApi.create(input);
      }

      setDraft(createEmptyCouponDraft());
      setEditingId(null);
      setNotice(wasEditing ? "Coupon updated." : "Coupon created.");
      await load();
    } catch (requestError) {
      setError(requestMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (coupon: AdminCoupon) => {
    if (!window.confirm(`Archive coupon ${coupon.code}? Existing order records will be preserved.`)) {
      return;
    }

    try {
      await adminCouponApi.remove(coupon.id);
      await load();
    } catch (requestError) {
      setError(requestMessage(requestError));
    }
  };

  const restore = async (coupon: AdminCoupon) => {
    try {
      await adminCouponApi.restore(coupon.id);
      await load();
    } catch (requestError) {
      setError(requestMessage(requestError));
    }
  };

  return {
    coupons,
    create,
    draft,
    edit,
    editingId,
    error,
    load,
    loading,
    notice,
    remove,
    reset,
    restore,
    saving,
    setDraftField,
    submit,
  };
};

export type AdminCouponsController = ReturnType<typeof useAdminCoupons>;
