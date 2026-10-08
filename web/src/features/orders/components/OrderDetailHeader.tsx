import React from "react";

import { OrderStatus } from "../../../api/orders";
import { formatOrderDate } from "../utils/formatters";
import { OrderStatusBadge } from "./OrderStatusBadge";

interface Props {
  eyebrow: string;
  orderNumber: string;
  placedAt: string;
  status: OrderStatus;
}

export const OrderDetailHeader: React.FC<Props> = ({
  eyebrow,
  orderNumber,
  placedAt,
  status,
}) => (
  <div className="mb-8 flex items-center justify-between gap-8 max-[700px]:flex-col max-[700px]:items-start">
    <div className="min-w-0">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="my-[0.55rem] [overflow-wrap:anywhere] text-[clamp(2rem,4vw,3rem)] leading-[1.1]">
        {orderNumber}
      </h1>
      <p className="m-0 text-muted">Placed {formatOrderDate(placedAt)}</p>
    </div>
    <OrderStatusBadge status={status} />
  </div>
);
