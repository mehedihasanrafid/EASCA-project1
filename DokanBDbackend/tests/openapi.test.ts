import { describe, expect, it } from "vitest";

import { openApiDocument } from "../src/docs/openapi.js";

describe("OpenAPI documentation", () => {
  const paths = openApiDocument.paths as Record<
    string,
    Record<string, Record<string, unknown>>
  >;

  it("documents every currently connected API operation", () => {
    const operationCount = Object.values(paths).reduce(
      (total, pathItem) => total + Object.keys(pathItem).length,
      0,
    );

    expect(Object.keys(paths)).toHaveLength(65);
    expect(operationCount).toBe(90);
  });

  it("marks protected and administrator operations with bearer security", () => {
    expect(paths["/cart"]?.get?.security).toEqual([{ bearerAuth: [] }]);
    expect(paths["/admin/products"]?.post?.security).toEqual([
      { bearerAuth: [] },
    ]);
  });

  it("documents JSON and multipart request bodies", () => {
    expect(paths["/auth/register"]?.post?.requestBody).toBeDefined();
    expect(
      paths["/admin/products/{productId}/media"]?.post?.requestBody,
    ).toBeDefined();
    expect(paths["/users/me/profile-image"]?.post?.requestBody).toBeDefined();
  });

  it("documents product media listing and response schemas", () => {
    expect(paths["/admin/products/{productId}/media"]?.get).toBeDefined();
    const components = openApiDocument.components.schemas as Record<string, unknown>;
    expect(components.ProductMedia).toBeDefined();
    expect(components.ProductMediaListResponse).toBeDefined();
  });

  it("documents product attributes, type assignments, and bulk variants", () => {
    const components = openApiDocument.components.schemas as Record<string, unknown>;
    expect(paths["/admin/attributes"]?.get).toBeDefined();
    expect(paths["/admin/attributes/{id}/values"]?.post).toBeDefined();
    expect(paths["/admin/product-types/{productTypeId}/attributes"]?.put).toBeDefined();
    expect(paths["/admin/products/{productId}/attributes"]?.get).toBeDefined();
    expect(paths["/admin/products/{productId}/attributes"]?.put).toBeDefined();
    expect(paths["/admin/products/{productId}/variants/bulk"]?.post).toBeDefined();
    expect(components.AdminAttribute).toBeDefined();
    expect(components.ProductAttributeAssignment).toBeDefined();
    expect(components.BulkProductVariantRequest).toBeDefined();
  });

  it("documents direct category-to-type assignments and global brands", () => {
    const components = openApiDocument.components.schemas as Record<string, unknown>;

    expect(paths["/admin/categories/{id}/product-types"]?.get).toBeDefined();
    expect(paths["/admin/categories/{id}/product-types"]?.put).toBeDefined();
    expect(paths["/admin/product-types/{id}/brands"]).toBeUndefined();
    expect(components.SetCategoryProductTypesRequest).toBeDefined();
    expect(components.ProductTypeBrandAssignmentResponse).toBeUndefined();
  });

  it("documents the protected administrator dashboard analytics", () => {
    const components = openApiDocument.components.schemas as Record<string, unknown>;

    expect(paths["/admin/dashboard"]?.get?.security).toEqual([{ bearerAuth: [] }]);
    expect(paths["/admin/dashboard"]?.get?.responses).toMatchObject({
      "200": {
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/AdminDashboardResponse" },
          },
        },
      },
    });
    expect(components.AdminDashboard).toBeDefined();
    expect(components.AdminDashboardResponse).toBeDefined();
  });

  it("documents public product search suggestions", () => {
    const components = openApiDocument.components.schemas as Record<string, unknown>;

    expect(components.ProductSuggestion).toBeDefined();
    expect(components.ProductSuggestionListResponse).toBeDefined();
    expect(paths["/products/search-suggestions"]?.get?.responses).toMatchObject({
      "200": {
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ProductSuggestionListResponse" },
          },
        },
      },
      "429": { $ref: "#/components/responses/RateLimitError" },
    });
  });

  it("documents public brands and product discovery filters", () => {
    const components = openApiDocument.components.schemas as Record<string, unknown>;
    const productParameters = paths["/products"]?.get?.parameters as Array<{
      name?: string;
    }>;

    expect(components.Brand).toBeDefined();
    expect(components.BrandListResponse).toBeDefined();
    expect(paths["/brands"]?.get?.responses).toMatchObject({
      "200": {
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/BrandListResponse" },
          },
        },
      },
    });
    expect(productParameters.map(({ name }) => name)).toEqual(
      expect.arrayContaining(["category", "brand", "minPrice", "maxPrice", "inStock", "sort"]),
    );
  });

  it("documents public category images and product counts", () => {
    const components = openApiDocument.components.schemas as Record<string, unknown>;

    expect(components.PublicCategory).toBeDefined();
    expect(components.CategoryListResponse).toBeDefined();
    expect(paths["/categories"]?.get?.responses).toMatchObject({
      "200": {
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CategoryListResponse" },
          },
        },
      },
    });
  });

  it("documents the complete cart response", () => {
    const components = openApiDocument.components.schemas as Record<string, any>;

    expect(components.Cart).toBeDefined();
    expect(components.CartResponse).toBeDefined();
    expect(components.Cart.properties.items.items.required).toEqual(expect.arrayContaining([
      "regularUnitPrice",
      "baseUnitPrice",
      "unitPrice",
      "savingsTotal",
      "pricing",
    ]));
    expect(components.Cart.properties.totals.required).toEqual(expect.arrayContaining([
      "regularSubtotal",
      "subtotal",
      "savingsTotal",
    ]));
    expect(
      components.Cart.properties.items.items.properties.productVariant.required,
    ).toContain("optionValues");
    expect(paths["/cart"]?.get?.responses).toMatchObject({
      "200": {
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CartResponse" },
          },
        },
      },
    });
  });

  it("documents coupon administration and checkout application", () => {
    const components = openApiDocument.components.schemas as Record<string, any>;
    expect(components.Coupon).toBeDefined();
    expect(components.AdminCouponListResponse).toBeDefined();
    expect(paths["/admin/coupons"]?.get?.security).toEqual([{ bearerAuth: [] }]);
    expect(paths["/admin/coupons"]?.post?.requestBody).toBeDefined();
    expect(components.CheckoutPreview.required).toEqual(expect.arrayContaining([
      "productDiscountTotal", "couponDiscountTotal", "couponCode",
    ]));
  });

  it("documents address management and checkout responses", () => {
    const components = openApiDocument.components.schemas as Record<string, unknown>;

    expect(components.Address).toBeDefined();
    expect(components.AddressListResponse).toBeDefined();
    expect(components.Order).toBeDefined();
    expect(components.OrderResponse).toBeDefined();
    expect(components.OrderListResponse).toBeDefined();
    expect(components.CheckoutPreviewResponse).toBeDefined();
    expect((components.CheckoutPreview as any).required).toEqual(expect.arrayContaining([
      "items",
      "regularSubtotal",
      "discountTotal",
      "deliveryCharge",
      "grandTotal",
    ]));
    expect(paths["/addresses"]?.get?.responses).toMatchObject({
      "200": {
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/AddressListResponse" },
          },
        },
      },
    });
    expect(paths["/orders/checkout"]?.post?.responses).toMatchObject({
      "201": {
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/OrderResponse" },
          },
        },
      },
    });
    expect(paths["/orders/checkout-preview"]?.get?.responses).toMatchObject({
      "200": {
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CheckoutPreviewResponse" },
          },
        },
      },
    });
    expect(paths["/orders"]?.get?.responses).toMatchObject({
      "200": {
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/OrderListResponse" },
          },
        },
      },
    });
    expect(paths["/admin/orders/{orderId}/status"]?.patch?.responses).toMatchObject({
      "200": {
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/OrderResponse" },
          },
        },
      },
    });
  });
});
