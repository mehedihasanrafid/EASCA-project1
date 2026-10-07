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
  };
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
}

export const cartApi = {
  addItem: (productVariantId: string, quantity: number) =>
    apiClient<{ cart: Cart }>("/cart/items", {
      method: "POST",
      body: JSON.stringify({ productVariantId, quantity }),
    }).then(({ cart }) => cart),
};
