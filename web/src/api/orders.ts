import { apiClient } from "./client";

export type OrderStatus = "PENDING" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED";
export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export interface OrderBase {
  id: string;
  orderNumber: string;
  orderStatus: OrderStatus;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  subtotal: string;
  discountTotal: string;
  deliveryCharge: string;
  grandTotal: string;
  currency: string;
  recipientName: string;
  recipientPhone: string;
  deliveryAddress: {
    addressLine1: string;
    addressLine2: string | null;
    area: string;
    city: string;
    district: string;
    division: string;
    postalCode: string | null;
    country: string;
    isInsideDhaka: boolean;
  };
  customerNote: string | null;
  placedAt: string;
  confirmedAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  productId: string | null;
  productVariantId: string | null;
  productName: string;
  variantName: string | null;
  sku: string;
  barcode: string | null;
  quantity: number;
  unitPrice: string;
  discountAmount: string;
  lineTotal: string;
  unitCost?: string | null;
}

export interface OrderStatusHistory {
  id: string;
  oldStatus: OrderStatus | null;
  newStatus: OrderStatus;
  createdAt: string;
  changedById?: string | null;
  note?: string | null;
}

export interface Order extends OrderBase {
  items: OrderItem[];
  statusHistory: OrderStatusHistory[];
}

export interface OrderSummary extends OrderBase {
  itemCount: number;
  totalQuantity: number;
}

export interface AdminOrderSummary extends OrderSummary {
  user: {
    id: string;
    name: string;
    email: string | null;
    phone: string;
  };
}

export interface AdminOrder extends Order {
  user: AdminOrderSummary["user"];
  adminNote: string | null;
}

export interface OrderPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CheckoutPreview {
  addressId: string;
  isInsideDhaka: boolean;
  subtotal: string;
  discountTotal: string;
  deliveryCharge: string;
  grandTotal: string;
  currency: string;
  paymentMethod: string;
}

export const orderApi = {
  previewCheckout: (addressId: string) =>
    apiClient<{ preview: CheckoutPreview }>(
      `/orders/checkout-preview?addressId=${encodeURIComponent(addressId)}`,
      { method: "GET" },
    ).then(({ preview }) => preview),

  checkout: (addressId: string, customerNote?: string) =>
    apiClient<{ order: Order }>("/orders/checkout", {
      method: "POST",
      body: JSON.stringify({
        addressId,
        customerNote: customerNote?.trim() || undefined,
      }),
    }).then(({ order }) => order),

  list: (params: { page?: number; limit?: number; status?: OrderStatus } = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) query.set(key, String(value));
    });
    const suffix = query.toString();
    return apiClient<{ orders: OrderSummary[]; pagination: OrderPagination }>(
      `/orders${suffix ? `?${suffix}` : ""}`,
      { method: "GET" },
    );
  },

  get: (orderId: string) =>
    apiClient<{ order: Order }>(`/orders/${encodeURIComponent(orderId)}`, {
      method: "GET",
    }).then(({ order }) => order),

  cancel: (orderId: string, note?: string) =>
    apiClient<{ order: Order }>(`/orders/${encodeURIComponent(orderId)}/cancel`, {
      method: "POST",
      body: JSON.stringify({ note: note?.trim() || undefined }),
    }).then(({ order }) => order),
};

export const adminOrderApi = {
  list: (
    params: {
      page?: number;
      limit?: number;
      status?: OrderStatus;
      paymentStatus?: PaymentStatus;
      search?: string;
    } = {},
  ) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") query.set(key, String(value));
    });
    const suffix = query.toString();
    return apiClient<{ orders: AdminOrderSummary[]; pagination: OrderPagination }>(
      `/admin/orders${suffix ? `?${suffix}` : ""}`,
      { method: "GET" },
    );
  },

  get: (orderId: string) =>
    apiClient<{ order: AdminOrder }>(`/admin/orders/${encodeURIComponent(orderId)}`, {
      method: "GET",
    }).then(({ order }) => order),

  updateStatus: (orderId: string, status: Exclude<OrderStatus, "PENDING">, note?: string) =>
    apiClient<{ order: AdminOrder }>(
      `/admin/orders/${encodeURIComponent(orderId)}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({ status, note: note?.trim() || undefined }),
      },
    ).then(({ order }) => order),
};
