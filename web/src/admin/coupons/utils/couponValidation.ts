
/** Editable coupon form values before conversion into an API payload. */
export interface CouponDraft {
  code: string;
  name: string;
  discountType: "PERCENTAGE" | "FIXED";
  value: string;
  minimumSubtotal: string;
  maximumDiscount: string;
  startsAt: string;
  endsAt: string;
  usageLimit: string;
  perCustomerLimit: string;
  isActive: boolean;
}

const validNumber = (value: string) =>
  value.trim() !== "" && Number.isFinite(Number(value));

/** Returns an error message, or null when the draft is valid. */
export const validateCouponDraft = (draft: CouponDraft): string | null => {
  if (!/^[A-Z0-9][A-Z0-9_-]{2,39}$/.test(draft.code.trim().toUpperCase()))
    return "Enter a coupon code using 3–40 letters, numbers, underscores, or hyphens.";

  if (draft.name.trim().length < 2)
    return "Enter a campaign name with at least 2 characters.";

  if (!validNumber(draft.value) || Number(draft.value) < 0)
    return "Enter a valid discount value.";

  if (draft.discountType === "PERCENTAGE" && Number(draft.value) > 100)
    return "Percentage discount cannot be more than 100%.";

  if (!validNumber(draft.minimumSubtotal) || Number(draft.minimumSubtotal) < 0)
    return "Enter a valid minimum subtotal.";

  if (draft.maximumDiscount !== "" &&
      (!validNumber(draft.maximumDiscount) || Number(draft.maximumDiscount) < 0))
    return "Enter a valid maximum discount or leave it empty.";

  if (draft.usageLimit !== "" &&
      (!validNumber(draft.usageLimit) ||
       !Number.isInteger(Number(draft.usageLimit)) ||
       Number(draft.usageLimit) < 1))
    return "Total usage limit must be a whole number of 1 or more, or left empty.";

  if (!validNumber(draft.perCustomerLimit) ||
      !Number.isInteger(Number(draft.perCustomerLimit)) ||
      Number(draft.perCustomerLimit) < 1 ||
      Number(draft.perCustomerLimit) > 100)
    return "Per-customer limit must be a whole number from 1 to 100.";

  const startsAt = draft.startsAt ? new Date(draft.startsAt) : null;
  const endsAt = draft.endsAt ? new Date(draft.endsAt) : null;

  if (startsAt && Number.isNaN(startsAt.getTime()))
    return "Choose a valid start date and time.";

  if (endsAt && Number.isNaN(endsAt.getTime()))
    return "Choose a valid end date and time.";

  if (startsAt && endsAt && endsAt <= startsAt)
    return "The end date and time must be after the start date and time.";

  return null;
};
