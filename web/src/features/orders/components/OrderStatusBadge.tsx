import React from "react";

import { OrderStatus } from "../../../api/orders";

const statusStyles: Record<OrderStatus, string> = {
  PENDING: "bg-warning-soft text-warning",
  CONFIRMED: "bg-info-soft text-info",
  SHIPPED: "bg-accent-soft text-accent",
  DELIVERED: "bg-positive-soft text-positive",
  CANCELLED: "bg-danger-soft text-danger",
};

interface Props {
  status: OrderStatus;
}

export const OrderStatusBadge: React.FC<Props> = ({ status }) => (
  <span
    className={`inline-flex items-center justify-center rounded-full px-[0.65rem] py-[0.3rem] text-[0.68rem] font-extrabold tracking-[0.04em] uppercase ${statusStyles[status]}`}
  >
    {status}
  </span>
);
