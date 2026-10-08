import React, { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, MapPin, Package, ReceiptText, XCircle } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { ApiException } from "../../api/client";
import { Order, orderApi } from "../../api/orders";
import { OrderAddress } from "../../features/orders/components/OrderAddress";
import { OrderDetailHeader } from "../../features/orders/components/OrderDetailHeader";
import { OrderDetailLayout } from "../../features/orders/components/OrderDetailLayout";
import { OrderItems } from "../../features/orders/components/OrderItems";
import { OrderPanel } from "../../features/orders/components/OrderPanel";
import { OrderStatusTimeline } from "../../features/orders/components/OrderStatusTimeline";
import { OrderTotals } from "../../features/orders/components/OrderTotals";

export const OrderDetailPage: React.FC = () => {
  const { orderId = "" } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelNote, setCancelNote] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    orderApi
      .get(orderId)
      .then(setOrder)
      .catch((requestError) => {
        setError(requestError instanceof ApiException ? requestError.error.message : "Could not load this order.");
      })
      .finally(() => setLoading(false));
  }, [orderId]);

  const cancelOrder = async (event: FormEvent) => {
    event.preventDefault();
    if (!window.confirm("Cancel this order? Stock will be returned to the catalog.")) return;

    setCancelling(true);
    setError("");
    try {
      setOrder(await orderApi.cancel(orderId, cancelNote));
      setShowCancel(false);
    } catch (requestError) {
      setError(requestError instanceof ApiException ? requestError.error.message : "Could not cancel this order.");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <div className="loading-screen">Loading order...</div>;
  if (!order) {
    return (
      <div className="account-page">
        <div className="alert alert-error">{error || "Order not found."}</div>
        <Link to="/account/orders" className="text-link">Return to orders</Link>
      </div>
    );
  }

  const main = (
    <>
      <OrderPanel title="Order progress">
        <OrderStatusTimeline status={order.orderStatus} history={order.statusHistory} />
      </OrderPanel>

      <OrderPanel title="Products" icon={<Package size={20} />}>
        <OrderItems items={order.items} />
      </OrderPanel>

      {order.orderStatus === "PENDING" && (
        <OrderPanel>
          {showCancel ? (
            <form onSubmit={cancelOrder}>
              <h2 className="mb-5 flex items-center gap-2 text-[1.15rem] font-bold">
                <XCircle size={20} />
                Cancel order
              </h2>
              <p className="leading-[1.6] text-muted">
                Pending orders can be cancelled before an administrator confirms them.
              </p>
              <div className="form-group">
                <label htmlFor="cancel-note">Reason (optional)</label>
                <textarea
                  id="cancel-note"
                  className="form-input min-h-[90px] resize-y"
                  maxLength={500}
                  value={cancelNote}
                  onChange={(event) => setCancelNote(event.target.value)}
                />
              </div>
              <div className="mt-4 flex flex-wrap justify-end gap-3">
                <button type="button" className="btn btn-ghost" onClick={() => setShowCancel(false)}>
                  Keep order
                </button>
                <button
                  type="submit"
                  className="btn bg-danger text-white hover:bg-danger-hover disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={cancelling}
                >
                  {cancelling ? "Cancelling..." : "Confirm cancellation"}
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              className="btn bg-danger text-white hover:bg-danger-hover"
              onClick={() => setShowCancel(true)}
            >
              Cancel this order
            </button>
          )}
        </OrderPanel>
      )}
    </>
  );

  const sidebar = (
    <>
      <OrderPanel title="Payment summary" icon={<ReceiptText size={20} />}>
        <OrderTotals
          subtotal={order.subtotal}
          deliveryCharge={order.deliveryCharge}
          grandTotal={order.grandTotal}
          paymentStatus={order.paymentStatus}
        />
      </OrderPanel>

      <OrderPanel title="Delivery address" icon={<MapPin size={20} />}>
        <OrderAddress order={order} showCountry showPhoneIcon />
      </OrderPanel>

      {order.customerNote && (
        <OrderPanel title="Delivery note">
          <p className="leading-[1.6] text-muted">{order.customerNote}</p>
        </OrderPanel>
      )}
    </>
  );

  return (
    <div className="account-page">
      <Link to="/account/orders" className="product-back-link">
        <ArrowLeft size={18} />
        My orders
      </Link>
      <OrderDetailHeader
        eyebrow="Order details"
        orderNumber={order.orderNumber}
        placedAt={order.placedAt}
        status={order.orderStatus}
      />
      {error && <div className="alert alert-error">{error}</div>}
      <OrderDetailLayout main={main} sidebar={sidebar} />
    </div>
  );
};
