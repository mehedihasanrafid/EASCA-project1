import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, MapPin, Package, ReceiptText, UserRound } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { ApiException } from "../../api/client";
import { AdminOrder, OrderStatus, adminOrderApi } from "../../api/orders";
import { OrderAddress } from "../../features/orders/components/OrderAddress";
import { OrderDetailHeader } from "../../features/orders/components/OrderDetailHeader";
import { OrderDetailLayout } from "../../features/orders/components/OrderDetailLayout";
import { OrderItems } from "../../features/orders/components/OrderItems";
import { OrderPanel } from "../../features/orders/components/OrderPanel";
import { OrderStatusTimeline } from "../../features/orders/components/OrderStatusTimeline";
import { OrderTotals } from "../../features/orders/components/OrderTotals";

interface OrderAction {
  danger?: boolean;
  label: string;
  status: Exclude<OrderStatus, "PENDING">;
}

function availableActions(status: OrderStatus): OrderAction[] {
  if (status === "PENDING") {
    return [
      { status: "CONFIRMED", label: "Confirm order" },
      { status: "CANCELLED", label: "Cancel order", danger: true },
    ];
  }
  if (status === "CONFIRMED") {
    return [
      { status: "SHIPPED", label: "Mark shipped" },
      { status: "CANCELLED", label: "Cancel order", danger: true },
    ];
  }
  if (status === "SHIPPED") return [{ status: "DELIVERED", label: "Mark delivered" }];
  return [];
}

export const AdminOrderDetailPage: React.FC = () => {
  const { orderId = "" } = useParams();
  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [note, setNote] = useState("");
  const [busyStatus, setBusyStatus] = useState<OrderStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const actions = useMemo(() => order ? availableActions(order.orderStatus) : [], [order]);

  useEffect(() => {
    adminOrderApi
      .get(orderId)
      .then(setOrder)
      .catch((requestError) => {
        setError(requestError instanceof ApiException ? requestError.error.message : "Could not load this order.");
      })
      .finally(() => setLoading(false));
  }, [orderId]);

  const updateStatus = async (status: Exclude<OrderStatus, "PENDING">, danger = false) => {
    if (danger && !window.confirm("Cancel this order and restore its stock?")) return;

    setBusyStatus(status);
    setError("");
    try {
      setOrder(await adminOrderApi.updateStatus(orderId, status, note));
      setNote("");
    } catch (requestError) {
      setError(requestError instanceof ApiException ? requestError.error.message : "Could not update the order status.");
    } finally {
      setBusyStatus(null);
    }
  };

  if (loading) return <div className="loading-screen">Loading order...</div>;
  if (!order) {
    return (
      <div className="dashboard-container">
        <div className="alert alert-error">{error || "Order not found."}</div>
        <Link to="/admin/orders" className="text-link">Return to orders</Link>
      </div>
    );
  }

  const main = (
    <>
      <OrderPanel title="Fulfilment progress">
        <OrderStatusTimeline status={order.orderStatus} history={order.statusHistory} showNotes />
      </OrderPanel>

      {actions.length > 0 && (
        <OrderPanel title="Update status">
          <div className="form-group">
            <label htmlFor="admin-order-note">Internal status note (optional)</label>
            <textarea
              id="admin-order-note"
              className="form-input min-h-[90px] resize-y"
              maxLength={500}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Example: Handed to courier"
            />
          </div>
          <div className="mt-4 flex flex-wrap justify-end gap-3">
            {actions.map((action) => (
              <button
                key={action.status}
                type="button"
                className={`btn ${action.danger ? "bg-danger text-white hover:bg-danger-hover" : "btn-primary"}`}
                disabled={busyStatus !== null}
                onClick={() => void updateStatus(action.status, action.danger)}
              >
                {busyStatus === action.status ? "Updating..." : action.label}
              </button>
            ))}
          </div>
        </OrderPanel>
      )}

      <OrderPanel title="Products" icon={<Package size={20} />}>
        <OrderItems items={order.items} />
      </OrderPanel>
    </>
  );

  const sidebar = (
    <>
      <OrderPanel title="Customer" icon={<UserRound size={20} />}>
        <div className="flex flex-col gap-3 text-muted">
          <strong className="text-ink">{order.user.name}</strong>
          <span>{order.user.phone}</span>
          <span>{order.user.email || "No email address"}</span>
        </div>
      </OrderPanel>

      <OrderPanel title="Totals" icon={<ReceiptText size={20} />}>
        <OrderTotals
          subtotal={order.subtotal}
          deliveryCharge={order.deliveryCharge}
          grandTotal={order.grandTotal}
          paymentStatus={order.paymentStatus}
          paymentLabel="Payment"
        />
      </OrderPanel>

      <OrderPanel title="Delivery" icon={<MapPin size={20} />}>
        <OrderAddress order={order} />
      </OrderPanel>

      {order.customerNote && (
        <OrderPanel title="Customer note">
          <p className="leading-[1.6] text-muted">{order.customerNote}</p>
        </OrderPanel>
      )}
    </>
  );

  return (
    <div className="dashboard-container pb-8">
      <Link to="/admin/orders" className="product-back-link">
        <ArrowLeft size={18} />
        Order queue
      </Link>
      <OrderDetailHeader
        eyebrow="Admin order"
        orderNumber={order.orderNumber}
        placedAt={order.placedAt}
        status={order.orderStatus}
      />
      {error && <div className="alert alert-error">{error}</div>}
      <OrderDetailLayout main={main} sidebar={sidebar} />
    </div>
  );
};
