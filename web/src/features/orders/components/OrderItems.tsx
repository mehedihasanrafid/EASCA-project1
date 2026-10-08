import React from "react";

import { OrderItem } from "../../../api/orders";
import { formatOrderPrice } from "../utils/formatters";

interface Props {
  items: OrderItem[];
}

export const OrderItems: React.FC<Props> = ({ items }) => (
  <div className="flex flex-col">
    {items.map((item, index) => (
      <div
        className={`grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-5 py-4 max-[700px]:grid-cols-[minmax(0,1fr)_auto] ${index === 0 ? "border-t-0 pt-0" : "border-t border-line"} ${index === items.length - 1 ? "pb-0" : ""}`}
        key={item.id}
      >
        <div className="flex min-w-0 flex-col gap-1">
          <strong>{item.productName}</strong>
          <span className="text-[0.82rem] text-muted">
            {[item.variantName, item.sku].filter(Boolean).join(" · ")}
          </span>
        </div>
        <span className="text-[0.82rem] text-muted">
          {item.quantity} × {formatOrderPrice(item.unitPrice)}
        </span>
        <strong className="text-brand max-[700px]:col-start-2">
          {formatOrderPrice(item.lineTotal)}
        </strong>
      </div>
    ))}
  </div>
);
