import React from "react";

import { PaymentStatus } from "../../../api/orders";
import { formatOrderPrice } from "../utils/formatters";

interface Props {
  deliveryCharge: string;
  grandTotal: string;
  paymentLabel?: string;
  paymentStatus: PaymentStatus;
  subtotal: string;
}

export const OrderTotals: React.FC<Props> = ({
  deliveryCharge,
  grandTotal,
  paymentLabel = "Payment status",
  paymentStatus,
  subtotal,
}) => (
  <div className="flex flex-col gap-[0.8rem]">
    <div className="flex justify-between gap-4 text-[0.88rem] text-muted">
      <span>Subtotal</span>
      <strong className="text-ink">{formatOrderPrice(subtotal)}</strong>
    </div>
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
