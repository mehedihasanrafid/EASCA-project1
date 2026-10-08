import React, { FormEvent, useCallback, useEffect, useState } from "react";
import { ArrowLeft, ClipboardList, Search } from "lucide-react";
import { Link } from "react-router-dom";

import { ApiException } from "../../api/client";
import { AdminOrderSummary, OrderStatus, PaymentStatus, adminOrderApi } from "../../api/orders";
import { OrderPagination } from "../../features/orders/components/OrderPagination";
import { OrderStatusBadge } from "../../features/orders/components/OrderStatusBadge";
import { formatOrderDate, formatOrderPrice } from "../../features/orders/utils/formatters";

export const AdminOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<AdminOrderSummary[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | "">("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await adminOrderApi.list({
        page,
        limit: 20,
        search: search || undefined,
        status: status || undefined,
        paymentStatus: paymentStatus || undefined,
      });
      setOrders(result.orders);
      setTotal(result.pagination.total);
      setTotalPages(Math.max(1, result.pagination.totalPages));
    } catch (requestError) {
      setError(requestError instanceof ApiException ? requestError.error.message : "Could not load orders.");
    } finally {
      setLoading(false);
    }
  }, [page, paymentStatus, search, status]);

  useEffect(() => {
    void load();
  }, [load]);

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  return (
    <div className="dashboard-container">
      <Link to="/admin" className="product-back-link">
        <ArrowLeft size={18} />
        Products
      </Link>

      <div className="mb-8 flex items-end justify-between gap-8 max-[700px]:flex-col max-[700px]:items-start">
        <div>
          <p className="eyebrow">Operations</p>
          <h1 className="my-[0.55rem] text-[clamp(2rem,4vw,3rem)] leading-[1.1]">Orders</h1>
          <p className="m-0 text-muted">Search customers, inspect purchases, and manage fulfilment.</p>
        </div>
        <span className="font-bold text-muted">{total} total order{total === 1 ? "" : "s"}</span>
      </div>

      <form
        className="mb-6 grid grid-cols-[minmax(320px,1fr)_190px_190px] gap-3 max-[980px]:grid-cols-2 max-[700px]:grid-cols-1"
        onSubmit={submitSearch}
      >
        <div className="relative flex items-center gap-[0.6rem] max-[980px]:col-span-full max-[700px]:col-auto max-[700px]:items-stretch">
          <Search className="absolute left-[0.85rem] text-muted" size={18} />
          <input
            className="form-input flex-1 pl-[2.6rem]"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Order number, customer or phone"
          />
          <button className="btn btn-primary" type="submit">Search</button>
        </div>
        <select
          className="form-input"
          aria-label="Filter by order status"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as OrderStatus | "");
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="SHIPPED">Shipped</option>
          <option value="DELIVERED">Delivered</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <select
          className="form-input"
          aria-label="Filter by payment status"
          value={paymentStatus}
          onChange={(event) => {
            setPaymentStatus(event.target.value as PaymentStatus | "");
            setPage(1);
          }}
        >
          <option value="">All payments</option>
          <option value="PENDING">Payment pending</option>
          <option value="PAID">Paid</option>
          <option value="FAILED">Failed</option>
          <option value="REFUNDED">Refunded</option>
        </select>
      </form>

      {error && <div className="alert alert-error">{error}</div>}

      <section className="admin-products-panel">
        <div className="admin-panel-heading">
          <div>
            <h2>Order queue</h2>
            <p>Newest orders appear first.</p>
          </div>
        </div>

        {loading ? (
          <div className="admin-empty-state">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="admin-empty-state">
            <ClipboardList size={38} />
            <h3>No matching orders</h3>
            <p>Try changing the search or filters.</p>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-product-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Placed</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="whitespace-nowrap"><strong>{order.orderNumber}</strong></td>
                    <td className="whitespace-nowrap">
                      <div className="flex flex-col gap-[0.2rem]">
                        <strong>{order.user.name}</strong>
                        <span className="text-[0.78rem] text-muted">{order.user.phone}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap">{formatOrderDate(order.placedAt)}</td>
                    <td className="whitespace-nowrap">{order.totalQuantity}</td>
                    <td className="whitespace-nowrap">{formatOrderPrice(order.grandTotal)}</td>
                    <td className="whitespace-nowrap"><OrderStatusBadge status={order.orderStatus} /></td>
                    <td className="whitespace-nowrap">{order.paymentStatus}</td>
                    <td className="whitespace-nowrap">
                      <Link to={`/admin/orders/${order.id}`} className="text-link">Manage</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <OrderPagination
        loading={loading}
        onPageChange={setPage}
        page={page}
        totalPages={totalPages}
      />
    </div>
  );
};
