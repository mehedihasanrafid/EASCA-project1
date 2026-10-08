import { apiClient } from "./client";

export interface CartItem {
  id: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
  available: boolean;
  productVariant: {
    id: string;
    sku: string;
    barcode: string | null;
    variantName: string | null;
    color: string | null;
    size: string | null;
    stockQuantity: number;
  };
  product: {
    id: string;
    name: string;
    slug: string;
    primaryImage: {
      url: string;
      thumbnailUrl: string | null;
      altText: string | null;
    } | null;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Cart {
  id: string;
  status: string;
  items: CartItem[];
  totals: {
    itemCount: number;
    totalQuantity: number;
    subtotal: string;
    currency: string;
  };
  createdAt: string;
  updatedAt: string;
}

export const cartApi = {
  getCart: () =>
    apiClient<{ cart: Cart }>("/cart", { method: "GET" }).then(({ cart }) => cart),

  addItem: (productVariantId: string, quantity: number) =>
    apiClient<{ cart: Cart }>("/cart/items", {
      method: "POST",
      body: JSON.stringify({ productVariantId, quantity }),
    }).then(({ cart }) => cart),

  updateItem: (itemId: string, quantity: number) =>
    apiClient<{ cart: Cart }>(`/cart/items/${encodeURIComponent(itemId)}`, {
      method: "PATCH",
      body: JSON.stringify({ quantity }),
    }).then(({ cart }) => cart),

  removeItem: (itemId: string) =>
    apiClient<{ cart: Cart }>(`/cart/items/${encodeURIComponent(itemId)}`, {
      method: "DELETE",
    }).then(({ cart }) => cart),

  clearCart: () =>
    apiClient<{ cart: Cart }>("/cart/items", { method: "DELETE" }).then(
      ({ cart }) => cart,
    ),
};
