import { describe, expect, it } from "vitest";

import { createAddressSchema } from "../src/modules/addresses/address.schema.js";
import { addCartItemSchema } from "../src/modules/carts/cart.schema.js";
import { checkoutSchema } from "../src/modules/orders/order.schema.js";
import { publicProductListQuerySchema } from "../src/modules/products/product.schema.js";

describe("DokanBD business request validation", () => {
  it("accepts a complete Bangladesh delivery address", () => {
    const result = createAddressSchema.safeParse({
      label: "Home",
      recipientName: "Test Customer",
      phone: "01700000001",
      addressLine1: "Road 1, House 2",
      area: "Dhanmondi",
      city: "Dhaka",
      district: "Dhaka",
      division: "Dhaka",
      isInsideDhaka: true,
    });

    expect(result.success).toBe(true);
  });

  it("rejects a zero cart quantity", () => {
    expect(
      addCartItemSchema.safeParse({ productVariantId: "1", quantity: 0 })
        .success,
    ).toBe(false);
  });

  it("caps public product pagination at 100 items", () => {
    expect(
      publicProductListQuerySchema.safeParse({ page: "1", limit: "101" })
        .success,
    ).toBe(false);
  });

  it("requires a numeric address id for checkout", () => {
    expect(checkoutSchema.safeParse({ addressId: "1" }).success).toBe(true);
    expect(checkoutSchema.safeParse({ addressId: "abc" }).success).toBe(false);
  });
});
