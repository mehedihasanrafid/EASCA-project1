import React from "react";
import { Check, Circle, XCircle } from "lucide-react";

import { OrderStatus, OrderStatusHistory } from "../../../api/orders";
import { formatOrderDate } from "../utils/formatters";

const steps: Array<{ status: Exclude<OrderStatus, "CANCELLED">; label: string }> = [
  { status: "PENDING", label: "Order placed" },
  { status: "CONFIRMED", label: "Confirmed" },
  { status: "SHIPPED", label: "Shipped" },
  { status: "DELIVERED", label: "Delivered" },
];

interface Props {
  history: OrderStatusHistory[];
  showNotes?: boolean;
  status: OrderStatus;
}

const connectorBase = "after:absolute after:top-[1.7rem] after:bottom-0 after:left-[0.85rem] after:w-0.5 after:content-[''] min-[701px]:after:top-[0.85rem] min-[701px]:after:right-0 min-[701px]:after:bottom-auto min-[701px]:after:left-[1.7rem] min-[701px]:after:h-0.5 min-[701px]:after:w-auto";

export const OrderStatusTimeline: React.FC<Props> = ({ status, history, showNotes = false }) => {
  if (status === "CANCELLED") {
    const cancelled = [...history].reverse().find((entry) => entry.newStatus === "CANCELLED");
    return (
      <div className="flex items-start gap-3 rounded-control bg-danger-soft p-4 text-danger">
        <XCircle size={25} />
        <div className="flex flex-col gap-1">
          <strong>Order cancelled</strong>
          {cancelled && <span className="text-[0.8rem]">{formatOrderDate(cancelled.createdAt)}</span>}
          {showNotes && cancelled?.note && <p className="m-0 text-[0.8rem]">{cancelled.note}</p>}
        </div>
      </div>
    );
  }

  const currentIndex = steps.findIndex((step) => step.status === status);

  return (
    <ol className="m-0 grid list-none grid-cols-1 p-0 min-[701px]:grid-cols-4" aria-label="Order progress">
      {steps.map((step, index) => {
        const event = history.find((entry) => entry.newStatus === step.status);
        const complete = index <= currentIndex;
        const connector = index < steps.length - 1
          ? `${connectorBase} ${complete ? "after:bg-brand" : "after:bg-line"}`
          : "";

        return (
          <li
            className={`relative flex min-h-16 min-w-0 flex-row items-start gap-[0.65rem] min-[701px]:min-h-0 min-[701px]:flex-col min-[701px]:gap-2 ${connector}`}
            key={step.status}
          >
            <div className={`relative z-[1] grid size-7 shrink-0 place-items-center rounded-full border-2 ${complete ? "border-brand bg-brand text-white" : "border-line bg-surface text-muted"}`}>
              {complete ? <Check size={15} /> : <Circle size={13} />}
            </div>
            <div className="flex min-w-0 flex-col gap-1 pr-2">
              <strong className="text-[0.82rem]">{step.label}</strong>
              {event && <span className="text-[0.72rem] leading-[1.4] text-muted">{formatOrderDate(event.createdAt)}</span>}
              {showNotes && event?.note && <p className="m-0 text-[0.72rem] leading-[1.4] text-muted">{event.note}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
};
