import React from "react";

import { PaymentStatus } from "../../../api/orders";
import { formatOrderPrice } from "../utils/formatters";

interface Props {
  couponCode?: string | null;
  couponDiscountTotal?: string;
  deliveryCharge: string;
  grandTotal: string;
  paymentLabel?: string;
  paymentStatus: PaymentStatus;
  productDiscountTotal?: string;
  subtotal: string;
}

export const OrderTotals: React.FC<Props> = ({
  couponCode,
  couponDiscountTotal = "0.00",
  deliveryCharge,
  grandTotal,
  paymentLabel = "Payment status",
  paymentStatus,
  productDiscountTotal = "0.00",
  subtotal,
}) => {
  const hasProductSavings = Number(productDiscountTotal) > 0;
  const hasCouponSavings = Number(couponDiscountTotal) > 0;

  return (
    <div className="flex flex-col gap-[0.8rem]">
    <div className="flex justify-between gap-4 text-[0.88rem] text-muted">
      <span>{hasProductSavings ? "Discounted subtotal" : "Subtotal"}</span>
      <strong className="text-ink">{formatOrderPrice(subtotal)}</strong>
    </div>
    {hasProductSavings && (
      <div className="flex justify-between gap-4 text-[0.88rem] text-success">
        <span>Product savings</span>
        <strong>-{formatOrderPrice(productDiscountTotal)}</strong>
      </div>
    )}
    {hasCouponSavings && (
      <div className="flex justify-between gap-4 text-[0.88rem] text-success">
        <span>Coupon{couponCode ? ` (${couponCode})` : ""}</span>
        <strong>-{formatOrderPrice(couponDiscountTotal)}</strong>
      </div>
    )}
    <div className="flex justify-between gap-4 text-[0.88rem] text-muted">
      <span>Delivery</span>
      <strong className="text-ink">{formatOrderPrice(deliveryCharge)}</strong>
    </div>
    <div className="mt-[0.3rem] flex justify-between gap-4 border-t border-line pt-4 font-extrabold text-ink">
      <span>COD total</span>
      <strong className="text-brand">{formatOrderPrice(grandTotal)}</strong>
    </div>
    <small className="text-muted">{paymentLabel}: {paymentStatus}</small>
    </div>
  );
};
