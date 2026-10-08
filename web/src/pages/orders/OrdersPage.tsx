import React, { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Box, PackageSearch } from "lucide-react";
import { Link } from "react-router-dom";

import { ApiException } from "../../api/client";
import { OrderStatus, OrderSummary, orderApi } from "../../api/orders";
import { OrderPagination } from "../../features/orders/components/OrderPagination";
import { OrderStatusBadge } from "../../features/orders/components/OrderStatusBadge";
import { formatOrderDate, formatOrderPrice } from "../../features/orders/utils/formatters";

function message(error: unknown) {
  return error instanceof ApiException ? error.error.message : "Could not load your orders.";
}

export const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await orderApi.list({ page, limit: 10, status: status || undefined });
      setOrders(result.orders);
      setTotalPages(Math.max(1, result.pagination.totalPages));
    } catch (requestError) {
      setError(message(requestError));
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  return (
    <div className="account-page">
      <Link to="/account" className="product-back-link">
        <ArrowLeft size={18} />
        My account
      </Link>

      <div className="mb-8 flex items-end justify-between gap-8 max-[700px]:flex-col max-[700px]:items-start">
        <div>
          <p className="eyebrow">Purchase history</p>
          <h1 className="my-[0.55rem] text-[clamp(2rem,4vw,3rem)] leading-[1.1]">My orders</h1>
          <p className="m-0 text-muted">Track deliveries, review totals, and open order details.</p>
        </div>
        <label className="flex min-w-[185px] flex-col gap-[0.4rem] text-[0.8rem] font-bold max-[700px]:w-full">
          Status
          <select
            className="form-input"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as OrderStatus | "");
              setPage(1);
            }}
          >
            <option value="">All orders</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </label>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="account-loading">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="address-empty">
          <PackageSearch size={48} />
          <h2>No orders found</h2>
          <p>Your completed checkouts will appear here.</p>
          <Link to="/" className="btn btn-primary">Browse products</Link>
        </div>
      ) : (
        <div className="flex flex-col gap-[0.85rem]">
          {orders.map((order) => (
            <Link
              to={`/account/orders/${order.id}`}
              className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 rounded-control border border-line bg-surface p-5 transition-[border-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-brand hover:shadow-lifted max-[700px]:grid-cols-[auto_minmax(0,1fr)]"
              key={order.id}
            >
              <div className="grid size-[2.8rem] place-items-center rounded-full bg-positive-soft text-brand">
                <Box size={23} />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-[0.65rem]">
                  <strong className="break-words">{order.orderNumber}</strong>
                  <OrderStatusBadge status={order.orderStatus} />
                </div>
                <p className="mt-[0.35rem] mb-0 text-[0.82rem] text-muted">
                  {formatOrderDate(order.placedAt)} · {order.totalQuantity} item{order.totalQuantity === 1 ? "" : "s"}
                </p>
              </div>
              <div className="flex flex-col items-end max-[700px]:col-start-2 max-[700px]:items-start">
                <strong className="text-brand">{formatOrderPrice(order.grandTotal)}</strong>
                <span className="mt-[0.35rem] text-[0.82rem] text-muted">View details</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <OrderPagination
        loading={loading}
        onPageChange={setPage}
        page={page}
        totalPages={totalPages}
      />
    </div>
  );
};
