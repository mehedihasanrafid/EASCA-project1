import React from "react";
import { Phone } from "lucide-react";

import { OrderBase } from "../../../api/orders";

interface Props {
  order: OrderBase;
  showCountry?: boolean;
  showPhoneIcon?: boolean;
}

export const OrderAddress: React.FC<Props> = ({
  order,
  showCountry = false,
  showPhoneIcon = false,
}) => (
  <address className="flex flex-col gap-[0.45rem] text-[0.88rem] leading-[1.45] text-muted not-italic">
    <strong className="text-ink">{order.recipientName}</strong>
    <span className="flex items-center gap-[0.35rem]">
      {showPhoneIcon && <Phone size={14} />}
      {order.recipientPhone}
    </span>
    <span>
      {order.deliveryAddress.addressLine1}
      {order.deliveryAddress.addressLine2 ? `, ${order.deliveryAddress.addressLine2}` : ""}
    </span>
    <span>
      {order.deliveryAddress.area}, {order.deliveryAddress.city}, {order.deliveryAddress.district}, {order.deliveryAddress.division}
    </span>
    {showCountry && <span>{order.deliveryAddress.country}</span>}
  </address>
);
