import { apiClient } from "./client";

export interface CartItem {
  id: string;
  quantity: number;
  regularUnitPrice: string;
  baseUnitPrice: string;
  unitPrice: string;
  lineTotal: string;
  savingsTotal: string;
  pricing: {
    source: "REGULAR" | "DISCOUNT" | "QUANTITY_TIER";
    minimumQuantity: number | null;
    isPromotion: boolean;
  };
  available: boolean;
  productVariant: {
    id: string;
    sku: string;
    barcode: string | null;
    variantName: string | null;
    color: string | null;
    size: string | null;
    stockQuantity: number;
    optionValues: Array<{
      id: string;
      label: string;
      code: string;
      colorHex: string | null;
      attribute: {
        id: string;
        name: string;
        code: string;
        inputType: "SELECT" | "COLOR" | "TEXT";
      };
    }>;
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
    regularSubtotal: string;
    subtotal: string;
    savingsTotal: string;
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
