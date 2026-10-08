type HttpMethod = "get" | "post" | "patch" | "delete";
type OpenApiObject = Record<string, unknown>;

interface EndpointDefinition {
  method: HttpMethod;
  path: string;
  tag: string;
  summary: string;
  description?: string;
  auth?: boolean;
  admin?: boolean;
  body?: string;
  bodyRequired?: boolean;
  multipart?: "image" | "media";
  parameters?: OpenApiObject[];
  success?: string;
  successDescription?: string;
  notFound?: boolean;
  conflict?: boolean;
  rateLimited?: boolean;
  responseSchema?: string;
}

const schemaRef = (name: string) => ({
  $ref: `#/components/schemas/${name}`,
});

const responseRef = (name: string) => ({
  $ref: `#/components/responses/${name}`,
});

const idParameter = (name: string, description: string): OpenApiObject => ({
  name,
  in: "path",
  required: true,
  description,
  schema: { type: "string", pattern: "^[1-9][0-9]*$" },
});

const queryParameter = (
  name: string,
  schema: OpenApiObject,
  description?: string,
): OpenApiObject => ({
  name,
  in: "query",
  ...(description ? { description } : {}),
  schema,
});

const paginationParameters = [
  queryParameter("page", { type: "integer", minimum: 1, default: 1 }),
  queryParameter("limit", {
    type: "integer",
    minimum: 1,
    maximum: 100,
    default: 20,
  }),
];

const endpointDefinitions: EndpointDefinition[] = [
  {
    method: "get",
    path: "/health",
    tag: "Health",
    summary: "Check API and database health",
    successDescription: "API and database are available",
  },
  {
    method: "post",
    path: "/auth/register",
    tag: "Authentication",
    summary: "Register a customer",
    description: "Creates a CUSTOMER account. Email is optional; phone must be unique.",
    body: "RegisterRequest",
    success: "201",
    successDescription: "Account created",
    conflict: true,
    rateLimited: true,
  },
  {
    method: "post",
    path: "/auth/login",
    tag: "Authentication",
    summary: "Log in with email or phone",
    description:
      "Returns a JWT access token and stores the refresh token in an HTTP-only cookie.",
    body: "LoginRequest",
    successDescription: "Login successful",
    rateLimited: true,
  },
  {
    method: "post",
    path: "/auth/refresh",
    tag: "Authentication",
    summary: "Rotate the refresh token and issue a new access token",
    body: "RefreshRequest",
    bodyRequired: false,
    successDescription: "Session refreshed",
    rateLimited: true,
  },
  {
    method: "post",
    path: "/auth/logout",
    tag: "Authentication",
    summary: "Revoke the current refresh session",
    body: "RefreshRequest",
    bodyRequired: false,
    successDescription: "Logged out",
  },
  {
    method: "post",
    path: "/auth/logout-all",
    tag: "Authentication",
    summary: "Revoke all refresh sessions for the current user",
    auth: true,
    successDescription: "All sessions revoked",
  },
  {
    method: "post",
    path: "/auth/verify-email",
    tag: "Authentication",
    summary: "Verify an email address with a one-time token",
    body: "TokenRequest",
    rateLimited: true,
  },
  {
    method: "post",
    path: "/auth/resend-verification",
    tag: "Authentication",
    summary: "Resend the email-verification message",
    body: "EmailRequest",
    rateLimited: true,
  },
  {
    method: "post",
    path: "/auth/forgot-password",
    tag: "Authentication",
    summary: "Request a password-reset email",
    body: "EmailRequest",
    rateLimited: true,
  },
  {
    method: "post",
    path: "/auth/reset-password",
    tag: "Authentication",
    summary: "Reset a password with a one-time token",
    body: "ResetPasswordRequest",
    rateLimited: true,
  },
  {
    method: "get",
    path: "/auth/me",
    tag: "Authentication",
    summary: "Get the authenticated user",
    auth: true,
    notFound: true,
  },
  {
    method: "get",
    path: "/users/me",
    tag: "Users",
    summary: "Get the current profile",
    auth: true,
    notFound: true,
  },
  {
    method: "patch",
    path: "/users/me",
    tag: "Users",
    summary: "Update the current profile",
    auth: true,
    body: "UpdateProfileRequest",
    conflict: true,
  },
  {
    method: "post",
    path: "/users/me/profile-image",
    tag: "Users",
    summary: "Upload one profile image",
    auth: true,
    multipart: "image",
  },
  {
    method: "get",
    path: "/users",
    tag: "Admin users",
    summary: "Search and list users",
    auth: true,
    admin: true,
    parameters: [
      ...paginationParameters,
      queryParameter("search", { type: "string", maxLength: 100 }),
      queryParameter("role", {
        type: "string",
        enum: ["CUSTOMER", "ADMIN", "OWNER"],
      }),
      queryParameter("isActive", { type: "boolean" }),
    ],
  },
  {
    method: "patch",
    path: "/users/{userId}",
    tag: "Admin users",
    summary: "Change a user's role or active status",
    auth: true,
    admin: true,
    parameters: [idParameter("userId", "User ID")],
    body: "AdminUpdateUserRequest",
    notFound: true,
  },
  {
    method: "get",
    path: "/addresses",
    tag: "Addresses",
    summary: "List the current user's addresses",
    auth: true,
    responseSchema: "AddressListResponse",
  },
  {
    method: "post",
    path: "/addresses",
    tag: "Addresses",
    summary: "Create a delivery address",
    auth: true,
    body: "AddressRequest",
    success: "201",
    responseSchema: "AddressResponse",
  },
  {
    method: "patch",
    path: "/addresses/{addressId}",
    tag: "Addresses",
    summary: "Update an owned address",
    auth: true,
    parameters: [idParameter("addressId", "Address ID")],
    body: "UpdateAddressRequest",
    responseSchema: "AddressResponse",
    notFound: true,
  },
  {
    method: "delete",
    path: "/addresses/{addressId}",
    tag: "Addresses",
    summary: "Delete an owned address",
    auth: true,
    parameters: [idParameter("addressId", "Address ID")],
    success: "204",
    notFound: true,
  },
  {
    method: "patch",
    path: "/addresses/{addressId}/default",
    tag: "Addresses",
    summary: "Make an owned address the default",
    auth: true,
    parameters: [idParameter("addressId", "Address ID")],
    responseSchema: "AddressResponse",
    notFound: true,
  },
  {
    method: "get",
    path: "/categories",
    tag: "Categories",
    summary: "List the public category tree",
    description:
      "Returns active categories with direct and descendant product counts. displayImageUrl uses the category image first, then an active product image, then a descendant category image.",
    responseSchema: "CategoryListResponse",
  },
  {
    method: "get",
    path: "/brands",
    tag: "Brands",
    summary: "List active public brands",
    responseSchema: "BrandListResponse",
  },
  {
    method: "get",
    path: "/admin/categories",
    tag: "Admin categories",
    summary: "List categories for administration",
    auth: true,
    admin: true,
    parameters: [
      queryParameter("includeDeleted", { type: "boolean", default: false }),
    ],
    responseSchema: "AdminCategoryListResponse",
  },
  {
    method: "post",
    path: "/admin/categories",
    tag: "Admin categories",
    summary: "Create a category",
    auth: true,
    admin: true,
    body: "CategoryRequest",
    success: "201",
    responseSchema: "AdminCategoryResponse",
    conflict: true,
  },
  {
    method: "patch",
    path: "/admin/categories/{id}",
    tag: "Admin categories",
    summary: "Update a category",
    auth: true,
    admin: true,
    parameters: [idParameter("id", "Category ID")],
    body: "UpdateCategoryRequest",
    responseSchema: "AdminCategoryResponse",
    notFound: true,
    conflict: true,
  },
  {
    method: "delete",
    path: "/admin/categories/{id}",
    tag: "Admin categories",
    summary: "Soft-delete a category",
    auth: true,
    admin: true,
    parameters: [idParameter("id", "Category ID")],
    success: "204",
    notFound: true,
  },
  {
    method: "post",
    path: "/admin/categories/{id}/restore",
    tag: "Admin categories",
    summary: "Restore a soft-deleted category",
    auth: true,
    admin: true,
    parameters: [idParameter("id", "Category ID")],
    responseSchema: "AdminCategoryResponse",
    notFound: true,
  },
  {
    method: "get",
    path: "/admin/brands",
    tag: "Admin brands",
    summary: "List brands for administration",
    auth: true,
    admin: true,
    parameters: [
      queryParameter("includeDeleted", { type: "boolean", default: false }),
    ],
    responseSchema: "AdminBrandListResponse",
  },
  {
    method: "post",
    path: "/admin/brands",
    tag: "Admin brands",
    summary: "Create a brand",
    auth: true,
    admin: true,
    body: "BrandRequest",
    success: "201",
    responseSchema: "AdminBrandResponse",
    conflict: true,
  },
  {
    method: "patch",
    path: "/admin/brands/{id}",
    tag: "Admin brands",
    summary: "Update a brand",
    auth: true,
    admin: true,
    parameters: [idParameter("id", "Brand ID")],
    body: "UpdateBrandRequest",
    responseSchema: "AdminBrandResponse",
    notFound: true,
    conflict: true,
  },
  {
    method: "delete",
    path: "/admin/brands/{id}",
    tag: "Admin brands",
    summary: "Soft-delete a brand",
    auth: true,
    admin: true,
    parameters: [idParameter("id", "Brand ID")],
    success: "204",
    notFound: true,
  },
  {
    method: "post",
    path: "/admin/brands/{id}/restore",
    tag: "Admin brands",
    summary: "Restore a soft-deleted brand",
    auth: true,
    admin: true,
    parameters: [idParameter("id", "Brand ID")],
    responseSchema: "AdminBrandResponse",
    notFound: true,
    conflict: true,
  },
  {
    method: "get",
    path: "/admin/product-types",
    tag: "Admin product types",
    summary: "List product types for administration",
    auth: true,
    admin: true,
    parameters: [queryParameter("includeDeleted", { type: "boolean", default: false })],
    responseSchema: "AdminProductTypeListResponse",
  },
  {
    method: "post",
    path: "/admin/product-types",
    tag: "Admin product types",
    summary: "Create a product type",
    auth: true,
    admin: true,
    body: "ProductTypeRequest",
    success: "201",
    responseSchema: "AdminProductTypeResponse",
    conflict: true,
  },
  {
    method: "patch",
    path: "/admin/product-types/{id}",
    tag: "Admin product types",
    summary: "Update a product type",
    auth: true,
    admin: true,
    parameters: [idParameter("id", "Product type ID")],
    body: "UpdateProductTypeRequest",
    responseSchema: "AdminProductTypeResponse",
    notFound: true,
    conflict: true,
  },
  {
    method: "delete",
    path: "/admin/product-types/{id}",
    tag: "Admin product types",
    summary: "Soft-delete a product type",
    auth: true,
    admin: true,
    parameters: [idParameter("id", "Product type ID")],
    success: "204",
    notFound: true,
  },
  {
    method: "post",
    path: "/admin/product-types/{id}/restore",
    tag: "Admin product types",
    summary: "Restore a soft-deleted product type",
    auth: true,
    admin: true,
    parameters: [idParameter("id", "Product type ID")],
    responseSchema: "AdminProductTypeResponse",
    notFound: true,
    conflict: true,
  },
  {
    method: "get",
    path: "/products",
    tag: "Products",
    summary: "Search, filter, sort, and paginate active products",
    parameters: [
      ...paginationParameters,
      queryParameter("search", { type: "string", maxLength: 100 }),
      queryParameter("category", { type: "string" }, "Category slug"),
      queryParameter("brand", { type: "string" }, "Brand ID or slug"),
      queryParameter("minPrice", { type: "number", minimum: 0 }),
      queryParameter("maxPrice", { type: "number", minimum: 0 }),
      queryParameter(
        "inStock",
        { type: "boolean" },
        "When true, return products with available active variant stock; when false, return products without available stock.",
      ),
      queryParameter("sort", {
        type: "string",
        enum: ["newest", "price_asc", "price_desc", "name_asc"],
        default: "newest",
      }),
    ],
  },
  {
    method: "get",
    path: "/products/search-suggestions",
    tag: "Products",
    summary: "Return lightweight product suggestions for autocomplete",
    description:
      "Matches active products by name, slug, category, brand, or active variant SKU. Exact and name-prefix matches are ranked first.",
    parameters: [
      {
        ...queryParameter("q", {
          type: "string",
          minLength: 2,
          maxLength: 100,
          example: "sung",
        }),
        required: true,
      },
      queryParameter("limit", {
        type: "integer",
        minimum: 1,
        maximum: 10,
        default: 8,
      }),
    ],
    responseSchema: "ProductSuggestionListResponse",
    rateLimited: true,
  },
  {
    method: "get",
    path: "/products/{identifier}",
    tag: "Products",
    summary: "Get an active product by ID or slug",
    parameters: [
      {
        name: "identifier",
        in: "path",
        required: true,
        schema: { type: "string" },
      },
    ],
    notFound: true,
  },
  {
    method: "get",
    path: "/admin/products",
    tag: "Admin products",
    summary: "Search and list products for administration",
    auth: true,
    admin: true,
    parameters: [
      ...paginationParameters,
      queryParameter("search", { type: "string" }),
      queryParameter("category", { type: "string" }),
      queryParameter("status", {
        type: "string",
        enum: ["DRAFT", "ACTIVE", "INACTIVE", "DISCONTINUED"],
      }),
      queryParameter("includeDeleted", { type: "boolean", default: false }),
    ],
  },
  {
    method: "post",
    path: "/admin/products",
    tag: "Admin products",
    summary: "Create a product",
    auth: true,
    admin: true,
    body: "ProductRequest",
    success: "201",
    notFound: true,
    conflict: true,
  },
  {
    method: "get",
    path: "/admin/products/{id}",
    tag: "Admin products",
    summary: "Get a product for administration",
    auth: true,
    admin: true,
    parameters: [idParameter("id", "Product ID")],
    notFound: true,
  },
  {
    method: "patch",
    path: "/admin/products/{id}",
    tag: "Admin products",
    summary: "Update a product",
    auth: true,
    admin: true,
    parameters: [idParameter("id", "Product ID")],
    body: "UpdateProductRequest",
    notFound: true,
    conflict: true,
  },
  {
    method: "delete",
    path: "/admin/products/{id}",
    tag: "Admin products",
    summary: "Soft-delete a product",
    auth: true,
    admin: true,
    parameters: [idParameter("id", "Product ID")],
    success: "204",
    notFound: true,
  },
  {
    method: "post",
    path: "/admin/products/{id}/restore",
    tag: "Admin products",
    summary: "Restore a soft-deleted product",
    auth: true,
    admin: true,
    parameters: [idParameter("id", "Product ID")],
    notFound: true,
  },
  {
    method: "post",
    path: "/admin/products/{productId}/variants",
    tag: "Admin products",
    summary: "Create a product variant and its initial stock",
    auth: true,
    admin: true,
    parameters: [idParameter("productId", "Product ID")],
    body: "ProductVariantRequest",
    success: "201",
    notFound: true,
    conflict: true,
  },
  {
    method: "patch",
    path: "/admin/products/{productId}/variants/{variantId}",
    tag: "Admin products",
    summary: "Update a variant and record stock changes",
    auth: true,
    admin: true,
    parameters: [
      idParameter("productId", "Product ID"),
      idParameter("variantId", "Variant ID"),
    ],
    body: "UpdateProductVariantRequest",
    notFound: true,
    conflict: true,
  },
  {
    method: "delete",
    path: "/admin/products/{productId}/variants/{variantId}",
    tag: "Admin products",
    summary: "Delete a product variant",
    auth: true,
    admin: true,
    parameters: [
      idParameter("productId", "Product ID"),
      idParameter("variantId", "Variant ID"),
    ],
    success: "204",
    notFound: true,
  },
  {
    method: "post",
    path: "/admin/products/{productId}/media",
    tag: "Admin products",
    summary: "Upload up to four product images or short videos",
    description:
      "Accepts JPEG, PNG and WebP images up to the configured image limit, plus MP4 and WebM videos up to the configured video limit. The product may have four media items in total.",
    auth: true,
    admin: true,
    parameters: [idParameter("productId", "Product ID")],
    multipart: "media",
    success: "201",
    responseSchema: "ProductMediaListResponse",
    notFound: true,
  },
  {
    method: "get",
    path: "/admin/products/{productId}/media",
    tag: "Admin products",
    summary: "List all media for a product",
    auth: true,
    admin: true,
    parameters: [idParameter("productId", "Product ID")],
    responseSchema: "ProductMediaListResponse",
    notFound: true,
  },
  {
    method: "patch",
    path: "/admin/products/{productId}/media/{mediaId}",
    tag: "Admin products",
    summary: "Update product media metadata",
    auth: true,
    admin: true,
    parameters: [
      idParameter("productId", "Product ID"),
      idParameter("mediaId", "Media ID"),
    ],
    body: "UpdateProductMediaRequest",
    responseSchema: "ProductMediaResponse",
    notFound: true,
  },
  {
    method: "delete",
    path: "/admin/products/{productId}/media/{mediaId}",
    tag: "Admin products",
    summary: "Delete a product media item",
    auth: true,
    admin: true,
    parameters: [
      idParameter("productId", "Product ID"),
      idParameter("mediaId", "Media ID"),
    ],
    success: "204",
    notFound: true,
  },
  {
    method: "get",
    path: "/cart",
    tag: "Cart",
    summary: "Get the current active cart and server-calculated totals",
    auth: true,
    responseSchema: "CartResponse",
  },
  {
    method: "post",
    path: "/cart/items",
    tag: "Cart",
    summary: "Add a product variant to the cart",
    auth: true,
    body: "AddCartItemRequest",
    responseSchema: "CartResponse",
    notFound: true,
    conflict: true,
  },
  {
    method: "delete",
    path: "/cart/items",
    tag: "Cart",
    summary: "Clear all cart items",
    auth: true,
    responseSchema: "CartResponse",
  },
  {
    method: "patch",
    path: "/cart/items/{itemId}",
    tag: "Cart",
    summary: "Change an owned cart item's quantity",
    auth: true,
    parameters: [idParameter("itemId", "Cart item ID")],
    body: "UpdateCartItemRequest",
    responseSchema: "CartResponse",
    notFound: true,
    conflict: true,
  },
  {
    method: "delete",
    path: "/cart/items/{itemId}",
    tag: "Cart",
    summary: "Remove an owned cart item",
    auth: true,
    parameters: [idParameter("itemId", "Cart item ID")],
    responseSchema: "CartResponse",
    notFound: true,
  },
  {
    method: "post",
    path: "/orders/checkout",
    tag: "Orders",
    summary: "Create an order from the active cart",
    description:
      "Uses a database transaction, snapshots address and product data, reduces stock, and clears the cart.",
    auth: true,
    body: "CheckoutRequest",
    success: "201",
    responseSchema: "OrderResponse",
    notFound: true,
    conflict: true,
  },
  {
    method: "get",
    path: "/orders/checkout-preview",
    tag: "Orders",
    summary: "Preview delivery charge and final total before checkout",
    auth: true,
    parameters: [
      {
        ...queryParameter(
          "addressId",
          { type: "string", pattern: "^[1-9][0-9]*$" },
          "Owned delivery address ID",
        ),
        required: true,
      },
    ],
    responseSchema: "CheckoutPreviewResponse",
    notFound: true,
    conflict: true,
  },
  {
    method: "get",
    path: "/orders",
    tag: "Orders",
    summary: "List the current user's orders",
    auth: true,
    parameters: [
      ...paginationParameters,
      queryParameter("status", {
        type: "string",
        enum: ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"],
      }),
    ],
    responseSchema: "OrderListResponse",
  },
  {
    method: "get",
    path: "/orders/{orderId}",
    tag: "Orders",
    summary: "Get an owned order",
    auth: true,
    parameters: [idParameter("orderId", "Order ID")],
    responseSchema: "OrderResponse",
    notFound: true,
  },
  {
    method: "post",
    path: "/orders/{orderId}/cancel",
    tag: "Orders",
    summary: "Cancel an owned order when its status allows it",
    auth: true,
    parameters: [idParameter("orderId", "Order ID")],
    body: "CancelOrderRequest",
    bodyRequired: false,
    responseSchema: "OrderResponse",
    notFound: true,
    conflict: true,
  },
  {
    method: "get",
    path: "/admin/orders",
    tag: "Admin orders",
    summary: "Search, filter, and paginate orders",
    auth: true,
    admin: true,
    parameters: [
      ...paginationParameters,
      queryParameter("status", {
        type: "string",
        enum: ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"],
      }),
      queryParameter("paymentStatus", {
        type: "string",
        enum: ["PENDING", "PAID", "FAILED", "REFUNDED"],
      }),
      queryParameter("userId", { type: "string" }),
      queryParameter("search", { type: "string", maxLength: 100 }),
    ],
    responseSchema: "OrderListResponse",
  },
  {
    method: "get",
    path: "/admin/orders/{orderId}",
    tag: "Admin orders",
    summary: "Get any order",
    auth: true,
    admin: true,
    parameters: [idParameter("orderId", "Order ID")],
    responseSchema: "OrderResponse",
    notFound: true,
  },
  {
    method: "patch",
    path: "/admin/orders/{orderId}/status",
    tag: "Admin orders",
    summary: "Move an order to an allowed next status",
    auth: true,
    admin: true,
    parameters: [idParameter("orderId", "Order ID")],
    body: "AdminOrderStatusRequest",
    responseSchema: "OrderResponse",
    notFound: true,
    conflict: true,
  },
];

function buildRequestBody(endpoint: EndpointDefinition) {
  if (endpoint.multipart) {
    const multiple = endpoint.multipart === "media";
    return {
      required: true,
      content: {
        "multipart/form-data": {
          schema: {
            type: "object",
            required: [endpoint.multipart],
            properties: {
              [endpoint.multipart]: multiple
                ? {
                    type: "array",
                    description:
                      "JPEG, PNG or WebP images (maximum 2 MB each), or MP4 and WebM videos (maximum 20 MB each).",
                    minItems: 1,
                    maxItems: 4,
                    items: { type: "string", format: "binary" },
                  }
                : { type: "string", format: "binary" },
              ...(multiple
                ? {
                    variantId: { type: "string" },
                    altText: { type: "string", maxLength: 255 },
                  }
                : {}),
            },
          },
        },
      },
    };
  }

  if (!endpoint.body) {
    return undefined;
  }

  return {
    required: endpoint.bodyRequired !== false,
    content: {
      "application/json": {
        schema: schemaRef(endpoint.body),
      },
    },
  };
}

function buildResponses(endpoint: EndpointDefinition) {
  const successCode = endpoint.success ?? "200";
  const responses: Record<string, unknown> = {
    [successCode]:
      successCode === "204"
        ? { description: endpoint.successDescription ?? "Completed successfully" }
        : {
            description: endpoint.successDescription ?? "Request completed successfully",
            content: {
              "application/json": {
                schema: schemaRef(endpoint.responseSchema ?? "SuccessResponse"),
              },
            },
          },
    "400": responseRef("ValidationError"),
    "500": responseRef("InternalServerError"),
  };

  if (endpoint.auth) responses["401"] = responseRef("AuthenticationError");
  if (endpoint.admin) responses["403"] = responseRef("ForbiddenError");
  if (endpoint.notFound) responses["404"] = responseRef("NotFoundError");
  if (endpoint.conflict) responses["409"] = responseRef("ConflictError");
  if (endpoint.rateLimited) responses["429"] = responseRef("RateLimitError");

  return responses;
}

function buildPaths() {
  const paths: Record<string, Record<string, unknown>> = {};

  for (const endpoint of endpointDefinitions) {
    const requestBody = buildRequestBody(endpoint);
    const operation: Record<string, unknown> = {
      tags: [endpoint.tag],
      summary: endpoint.summary,
      ...(endpoint.description ? { description: endpoint.description } : {}),
      ...(endpoint.auth ? { security: [{ bearerAuth: [] }] } : {}),
      ...(endpoint.parameters ? { parameters: endpoint.parameters } : {}),
      ...(requestBody ? { requestBody } : {}),
      responses: buildResponses(endpoint),
    };

    const pathItem = paths[endpoint.path] ?? {};
    pathItem[endpoint.method] = operation;
    paths[endpoint.path] = pathItem;
  }

  return paths;
}

const bangladeshPhone = {
  type: "string",
  pattern: "^01[3-9][0-9]{8}$",
  example: "01700000001",
};

const addressProperties = {
  label: { type: "string", nullable: true, maxLength: 50, example: "Home" },
  recipientName: { type: "string", minLength: 2, maxLength: 100 },
  phone: bangladeshPhone,
  addressLine1: { type: "string", minLength: 3, maxLength: 255 },
  addressLine2: { type: "string", nullable: true, maxLength: 255 },
  area: { type: "string", minLength: 2, maxLength: 100 },
  city: { type: "string", minLength: 2, maxLength: 100 },
  district: { type: "string", minLength: 2, maxLength: 100 },
  division: { type: "string", minLength: 2, maxLength: 100 },
  postalCode: { type: "string", nullable: true, maxLength: 20 },
  country: { type: "string", default: "Bangladesh" },
  isInsideDhaka: { type: "boolean" },
  isDefault: { type: "boolean", default: false },
};

const categoryProperties = {
  name: { type: "string", minLength: 2, maxLength: 100 },
  slug: {
    type: "string",
    pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
  },
  description: { type: "string", nullable: true, maxLength: 10000 },
  imageUrl: { type: "string", format: "uri", nullable: true },
  parentId: { type: "string", nullable: true },
  isActive: { type: "boolean" },
  showOnHomepage: {
    type: "boolean",
    description: "Show this category in the homepage category carousel.",
  },
  sortOrder: { type: "integer", minimum: 0 },
};

const brandProperties = {
  name: { type: "string", minLength: 2, maxLength: 100 },
  slug: {
    type: "string",
    pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
  },
  logoUrl: { type: "string", format: "uri", nullable: true },
  description: { type: "string", nullable: true, maxLength: 10000 },
  isActive: { type: "boolean" },
};

const productTypeProperties = {
  name: { type: "string", minLength: 2, maxLength: 100 },
  slug: { type: "string", pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$" },
  description: { type: "string", nullable: true, maxLength: 10000 },
  isActive: { type: "boolean" },
};

const productProperties = {
  productTypeId: { type: "string", example: "1" },
  categoryId: { type: "string", example: "1" },
  brandId: { type: "string", nullable: true },
  name: { type: "string", minLength: 2, maxLength: 200 },
  slug: {
    type: "string",
    pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
  },
  shortDescription: { type: "string", nullable: true, maxLength: 500 },
  description: { type: "string", minLength: 1, maxLength: 65535 },
  defaultPrice: { type: "number", minimum: 0, example: 1200 },
  defaultCostPrice: { type: "number", minimum: 0, nullable: true },
  discountPrice: { type: "number", minimum: 0, nullable: true },
  status: {
    type: "string",
    enum: ["DRAFT", "ACTIVE", "INACTIVE", "DISCONTINUED"],
  },
  isFeatured: { type: "boolean" },
  isActive: { type: "boolean" },
};

const variantProperties = {
  vendorId: { type: "string", nullable: true },
  sku: { type: "string", minLength: 1, maxLength: 100 },
  barcode: { type: "string", nullable: true, maxLength: 100 },
  variantName: { type: "string", nullable: true, maxLength: 150 },
  color: { type: "string", nullable: true, maxLength: 100 },
  size: { type: "string", nullable: true, maxLength: 100 },
  price: { type: "number", minimum: 0 },
  costPrice: { type: "number", minimum: 0, nullable: true },
  stockQuantity: { type: "integer", minimum: 0 },
  lowStockLevel: { type: "integer", minimum: 0 },
  weight: { type: "number", minimum: 0, nullable: true },
  isDefault: { type: "boolean" },
  isActive: { type: "boolean" },
};

export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "DokanBD API",
    version: "1.0.0",
    description:
      "DokanBD REST API built with Express, TypeScript, TypeORM, MySQL, Zod, JWT, refresh-token sessions, and Swagger UI.",
  },
  servers: [{ url: "/api/v1", description: "Current server" }],
  tags: [
    { name: "Health" },
    { name: "Authentication" },
    { name: "Users" },
    { name: "Admin users" },
    { name: "Addresses" },
    { name: "Categories" },
    { name: "Brands" },
    { name: "Admin categories" },
    { name: "Admin brands" },
    { name: "Admin product types" },
    { name: "Products" },
    { name: "Admin products" },
    { name: "Cart" },
    { name: "Orders" },
    { name: "Admin orders" },
  ],
  paths: buildPaths(),
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      RegisterRequest: {
        type: "object",
        required: ["name", "phone", "password"],
        properties: {
          name: { type: "string", minLength: 2, maxLength: 100 },
          phone: bangladeshPhone,
          email: { type: "string", format: "email" },
          password: {
            type: "string",
            format: "password",
            minLength: 8,
            maxLength: 72,
          },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["identifier", "password"],
        properties: {
          identifier: {
            type: "string",
            description: "Registered email address or Bangladesh phone number",
          },
          password: { type: "string", format: "password", maxLength: 72 },
        },
      },
      RefreshRequest: {
        type: "object",
        properties: {
          refreshToken: { type: "string", minLength: 64, maxLength: 64 },
        },
      },
      TokenRequest: {
        type: "object",
        required: ["token"],
        properties: {
          token: { type: "string", minLength: 64, maxLength: 64 },
        },
      },
      EmailRequest: {
        type: "object",
        required: ["email"],
        properties: { email: { type: "string", format: "email" } },
      },
      ResetPasswordRequest: {
        type: "object",
        required: ["token", "password"],
        properties: {
          token: { type: "string", minLength: 64, maxLength: 64 },
          password: {
            type: "string",
            format: "password",
            minLength: 8,
            maxLength: 72,
          },
        },
      },
      UpdateProfileRequest: {
        type: "object",
        minProperties: 1,
        properties: {
          name: { type: "string", minLength: 2, maxLength: 100 },
          phone: bangladeshPhone,
        },
      },
      AdminUpdateUserRequest: {
        type: "object",
        minProperties: 1,
        properties: {
          roleCode: {
            type: "string",
            enum: ["CUSTOMER", "ADMIN", "OWNER"],
          },
          isActive: { type: "boolean" },
        },
      },
      AddressRequest: {
        type: "object",
        required: [
          "recipientName",
          "phone",
          "addressLine1",
          "area",
          "city",
          "district",
          "division",
          "isInsideDhaka",
        ],
        properties: addressProperties,
      },
      UpdateAddressRequest: {
        type: "object",
        minProperties: 1,
        properties: addressProperties,
      },
      Address: {
        type: "object",
        required: [
          "id",
          "recipientName",
          "phone",
          "addressLine1",
          "area",
          "city",
          "district",
          "division",
          "country",
          "isInsideDhaka",
          "isDefault",
          "createdAt",
          "updatedAt",
        ],
        properties: {
          id: { type: "string", example: "3" },
          ...addressProperties,
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      AddressResponse: {
        type: "object",
        required: ["success", "data"],
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "object",
            required: ["address"],
            properties: { address: schemaRef("Address") },
          },
        },
      },
      AddressListResponse: {
        type: "object",
        required: ["success", "data"],
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "object",
            required: ["addresses"],
            properties: {
              addresses: { type: "array", items: schemaRef("Address") },
            },
          },
        },
      },
      PublicCategory: {
        type: "object",
        required: [
          "id",
          "parentId",
          "name",
          "slug",
          "description",
          "imageUrl",
          "displayImageUrl",
          "productCount",
          "sortOrder",
          "showOnHomepage",
          "children",
        ],
        properties: {
          id: { type: "string", example: "2" },
          parentId: { type: "string", nullable: true, example: null },
          name: { type: "string", example: "Accessories" },
          slug: { type: "string", example: "accessories" },
          description: { type: "string", nullable: true },
          imageUrl: { type: "string", nullable: true },
          displayImageUrl: {
            type: "string",
            nullable: true,
            example: "/uploads/products/sunglasses.webp",
          },
          productCount: { type: "integer", minimum: 0, example: 3 },
          sortOrder: { type: "integer", minimum: 0 },
          showOnHomepage: { type: "boolean" },
          children: {
            type: "array",
            items: schemaRef("PublicCategory"),
          },
        },
      },
      CategoryListResponse: {
        type: "object",
        required: ["success", "data"],
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "object",
            required: ["categories"],
            properties: {
              categories: {
                type: "array",
                items: schemaRef("PublicCategory"),
              },
            },
          },
        },
      },
      CategoryRequest: {
        type: "object",
        required: ["name"],
        properties: categoryProperties,
      },
      UpdateCategoryRequest: {
        type: "object",
        minProperties: 1,
        properties: categoryProperties,
      },
      AdminCategory: {
        type: "object",
        required: [
          "id",
          "parentId",
          "name",
          "slug",
          "description",
          "imageUrl",
          "isActive",
          "showOnHomepage",
          "sortOrder",
          "createdAt",
          "updatedAt",
          "deletedAt",
        ],
        properties: {
          id: { type: "string", example: "2" },
          ...categoryProperties,
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
          deletedAt: { type: "string", format: "date-time", nullable: true },
        },
      },
      AdminCategoryResponse: {
        type: "object",
        required: ["success", "data"],
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "object",
            required: ["category"],
            properties: { category: schemaRef("AdminCategory") },
          },
        },
      },
      AdminCategoryListResponse: {
        type: "object",
        required: ["success", "data"],
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "object",
            required: ["categories"],
            properties: {
              categories: { type: "array", items: schemaRef("AdminCategory") },
            },
          },
        },
      },
      Brand: {
        type: "object",
        required: ["id", "name", "slug", "logoUrl"],
        properties: {
          id: { type: "string", example: "1" },
          name: { type: "string", example: "DokanBD" },
          slug: { type: "string", example: "dokanbd" },
          logoUrl: {
            type: "string",
            nullable: true,
            example: "https://example.com/brands/dokanbd.svg",
          },
        },
      },
      BrandListResponse: {
        type: "object",
        required: ["success", "data"],
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "object",
            required: ["brands"],
            properties: {
              brands: { type: "array", items: schemaRef("Brand") },
            },
          },
        },
      },
      BrandRequest: {
        type: "object",
        required: ["name"],
        properties: brandProperties,
      },
      UpdateBrandRequest: {
        type: "object",
        minProperties: 1,
        properties: brandProperties,
      },
      AdminBrand: {
        type: "object",
        required: [
          "id",
          "name",
          "slug",
          "logoUrl",
          "description",
          "isActive",
          "createdAt",
          "updatedAt",
          "deletedAt",
        ],
        properties: {
          id: { type: "string", example: "1" },
          ...brandProperties,
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
          deletedAt: { type: "string", format: "date-time", nullable: true },
        },
      },
      AdminBrandResponse: {
        type: "object",
        required: ["success", "data"],
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "object",
            required: ["brand"],
            properties: { brand: schemaRef("AdminBrand") },
          },
        },
      },
      AdminBrandListResponse: {
        type: "object",
        required: ["success", "data"],
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "object",
            required: ["brands"],
            properties: {
              brands: { type: "array", items: schemaRef("AdminBrand") },
            },
          },
        },
      },
      ProductTypeRequest: {
        type: "object",
        required: ["name"],
        properties: productTypeProperties,
      },
      UpdateProductTypeRequest: {
        type: "object",
        minProperties: 1,
        properties: productTypeProperties,
      },
      AdminProductType: {
        type: "object",
        required: ["id", "name", "slug", "description", "isActive", "createdAt", "updatedAt", "deletedAt"],
        properties: {
          id: { type: "string", example: "1" },
          ...productTypeProperties,
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
          deletedAt: { type: "string", format: "date-time", nullable: true },
        },
      },
      AdminProductTypeResponse: {
        type: "object",
        required: ["success", "data"],
        properties: {
          success: { type: "boolean", example: true },
          data: { type: "object", required: ["productType"], properties: { productType: schemaRef("AdminProductType") } },
        },
      },
      AdminProductTypeListResponse: {
        type: "object",
        required: ["success", "data"],
        properties: {
          success: { type: "boolean", example: true },
          data: { type: "object", required: ["productTypes"], properties: { productTypes: { type: "array", items: schemaRef("AdminProductType") } } },
        },
      },
      ProductRequest: {
        type: "object",
        required: [
          "productTypeId",
          "categoryId",
          "name",
          "description",
          "defaultPrice",
        ],
        properties: productProperties,
      },
      UpdateProductRequest: {
        type: "object",
        minProperties: 1,
        properties: productProperties,
      },
      ProductVariantRequest: {
        type: "object",
        required: ["sku", "price"],
        properties: variantProperties,
      },
      UpdateProductVariantRequest: {
        type: "object",
        minProperties: 1,
        properties: variantProperties,
      },
      UpdateProductMediaRequest: {
        type: "object",
        minProperties: 1,
        properties: {
          altText: { type: "string", nullable: true, maxLength: 255 },
          sortOrder: { type: "integer", minimum: 0 },
          isPrimary: { type: "boolean" },
        },
      },
      ProductMedia: {
        type: "object",
        required: [
          "id",
          "productId",
          "type",
          "url",
          "sortOrder",
          "isPrimary",
          "createdAt",
        ],
        properties: {
          id: { type: "string", example: "1" },
          productId: { type: "string", example: "12" },
          variantId: { type: "string", nullable: true },
          type: { type: "string", enum: ["IMAGE", "VIDEO"] },
          url: { type: "string", example: "/uploads/products/example.webp" },
          thumbnailUrl: { type: "string", nullable: true },
          altText: { type: "string", nullable: true, maxLength: 255 },
          sortOrder: { type: "integer", minimum: 0 },
          isPrimary: {
            type: "boolean",
            description: "Only image media may be the primary catalog image.",
          },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      ProductMediaResponse: {
        type: "object",
        required: ["success", "data"],
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "object",
            required: ["media"],
            properties: { media: schemaRef("ProductMedia") },
          },
        },
      },
      ProductMediaListResponse: {
        type: "object",
        required: ["success", "data"],
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "object",
            required: ["media"],
            properties: {
              media: {
                type: "array",
                maxItems: 4,
                items: schemaRef("ProductMedia"),
              },
            },
          },
        },
      },
      ProductSuggestion: {
        type: "object",
        required: [
          "id",
          "name",
          "slug",
          "price",
          "regularPrice",
          "discountPrice",
          "category",
          "brand",
          "inStock",
          "thumbnail",
        ],
        properties: {
          id: { type: "string", example: "12" },
          name: { type: "string", example: "Sunglasses" },
          slug: { type: "string", example: "sunglasses" },
          price: { type: "string", example: "1999.00" },
          regularPrice: { type: "string", example: "2800.00" },
          discountPrice: { type: "string", nullable: true, example: "1999.00" },
          category: {
            type: "object",
            required: ["id", "name", "slug"],
            properties: {
              id: { type: "string", example: "3" },
              name: { type: "string", example: "Accessories" },
              slug: { type: "string", example: "accessories" },
            },
          },
          brand: {
            type: "object",
            nullable: true,
            required: ["id", "name", "slug"],
            properties: {
              id: { type: "string", example: "1" },
              name: { type: "string", example: "DokanBD" },
              slug: { type: "string", example: "dokanbd" },
            },
          },
          inStock: { type: "boolean", example: true },
          thumbnail: {
            type: "object",
            nullable: true,
            required: ["url", "altText"],
            properties: {
              url: { type: "string", example: "/uploads/products/sunglasses.webp" },
              altText: { type: "string", nullable: true },
            },
          },
        },
      },
      ProductSuggestionListResponse: {
        type: "object",
        required: ["success", "data"],
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "object",
            required: ["suggestions"],
            properties: {
              suggestions: {
                type: "array",
                maxItems: 10,
                items: schemaRef("ProductSuggestion"),
              },
            },
          },
        },
      },
      AddCartItemRequest: {
        type: "object",
        required: ["productVariantId", "quantity"],
        properties: {
          productVariantId: { type: "string", example: "1" },
          quantity: { type: "integer", minimum: 1, example: 2 },
        },
      },
      UpdateCartItemRequest: {
        type: "object",
        required: ["quantity"],
        properties: { quantity: { type: "integer", minimum: 1 } },
      },
      Cart: {
        type: "object",
        required: ["id", "status", "items", "totals", "createdAt", "updatedAt"],
        properties: {
          id: { type: "string", example: "1" },
          status: { type: "string", example: "ACTIVE" },
          items: {
            type: "array",
            items: {
              type: "object",
              required: [
                "id",
                "quantity",
                "unitPrice",
                "lineTotal",
                "available",
                "productVariant",
                "product",
                "createdAt",
                "updatedAt",
              ],
              properties: {
                id: { type: "string", example: "8" },
                quantity: { type: "integer", minimum: 1, example: 2 },
                unitPrice: { type: "string", example: "1200.00" },
                lineTotal: { type: "string", example: "2400.00" },
                available: { type: "boolean", example: true },
                productVariant: {
                  type: "object",
                  required: ["id", "sku", "stockQuantity"],
                  properties: {
                    id: { type: "string", example: "3" },
                    sku: { type: "string", example: "TSHIRT-BLK-M" },
                    barcode: { type: "string", nullable: true },
                    variantName: { type: "string", nullable: true },
                    color: { type: "string", nullable: true },
                    size: { type: "string", nullable: true },
                    stockQuantity: { type: "integer", minimum: 0 },
                  },
                },
                product: {
                  type: "object",
                  required: ["id", "name", "slug", "primaryImage"],
                  properties: {
                    id: { type: "string", example: "12" },
                    name: { type: "string", example: "Premium T-Shirt" },
                    slug: { type: "string", example: "premium-t-shirt" },
                    primaryImage: {
                      type: "object",
                      nullable: true,
                      required: ["url"],
                      properties: {
                        url: { type: "string", example: "/uploads/products/example.webp" },
                        thumbnailUrl: { type: "string", nullable: true },
                        altText: { type: "string", nullable: true },
                      },
                    },
                  },
                },
                createdAt: { type: "string", format: "date-time" },
                updatedAt: { type: "string", format: "date-time" },
              },
            },
          },
          totals: {
            type: "object",
            required: ["itemCount", "totalQuantity", "subtotal", "currency"],
            properties: {
              itemCount: { type: "integer", minimum: 0 },
              totalQuantity: { type: "integer", minimum: 0 },
              subtotal: { type: "string", example: "2400.00" },
              currency: { type: "string", example: "BDT" },
            },
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      CartResponse: {
        type: "object",
        required: ["success", "data"],
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "object",
            required: ["cart"],
            properties: { cart: schemaRef("Cart") },
          },
        },
      },
      CheckoutRequest: {
        type: "object",
        required: ["addressId"],
        properties: {
          addressId: { type: "string", example: "1" },
          customerNote: { type: "string", nullable: true, maxLength: 2000 },
        },
      },
      Order: {
        type: "object",
        required: [
          "id",
          "orderNumber",
          "orderStatus",
          "paymentMethod",
          "paymentStatus",
          "subtotal",
          "discountTotal",
          "deliveryCharge",
          "grandTotal",
          "currency",
          "recipientName",
          "recipientPhone",
          "deliveryAddress",
          "placedAt",
          "items",
          "statusHistory",
        ],
        properties: {
          id: { type: "string", example: "25" },
          orderNumber: { type: "string", example: "DBD-20261008-1A2B3C4D5E6F" },
          orderStatus: { type: "string", enum: ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"] },
          paymentMethod: { type: "string", example: "COD" },
          paymentStatus: { type: "string", enum: ["PENDING", "PAID", "FAILED", "REFUNDED"] },
          subtotal: { type: "string", example: "2400.00" },
          discountTotal: { type: "string", example: "0.00" },
          deliveryCharge: { type: "string", example: "80.00" },
          grandTotal: { type: "string", example: "2480.00" },
          currency: { type: "string", example: "BDT" },
          recipientName: { type: "string", example: "Mehedi Hasan" },
          recipientPhone: bangladeshPhone,
          deliveryAddress: {
            type: "object",
            properties: addressProperties,
          },
          customerNote: { type: "string", nullable: true },
          adminNote: { type: "string", nullable: true },
          placedAt: { type: "string", format: "date-time" },
          confirmedAt: { type: "string", format: "date-time", nullable: true },
          shippedAt: { type: "string", format: "date-time", nullable: true },
          deliveredAt: { type: "string", format: "date-time", nullable: true },
          cancelledAt: { type: "string", format: "date-time", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
          itemCount: { type: "integer", minimum: 0 },
          totalQuantity: { type: "integer", minimum: 0 },
          user: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              email: { type: "string", format: "email", nullable: true },
              phone: bangladeshPhone,
            },
          },
          items: {
            type: "array",
            items: {
              type: "object",
              required: ["id", "productName", "sku", "quantity", "unitPrice", "lineTotal"],
              properties: {
                id: { type: "string" },
                productId: { type: "string", nullable: true },
                productVariantId: { type: "string", nullable: true },
                productName: { type: "string" },
                variantName: { type: "string", nullable: true },
                sku: { type: "string" },
                barcode: { type: "string", nullable: true },
                quantity: { type: "integer", minimum: 1 },
                unitPrice: { type: "string" },
                discountAmount: { type: "string" },
                lineTotal: { type: "string" },
              },
            },
          },
          statusHistory: {
            type: "array",
            items: {
              type: "object",
              required: ["id", "newStatus", "createdAt"],
              properties: {
                id: { type: "string" },
                oldStatus: { type: "string", nullable: true },
                newStatus: { type: "string" },
                createdAt: { type: "string", format: "date-time" },
              },
            },
          },
        },
      },
      OrderResponse: {
        type: "object",
        required: ["success", "data"],
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "object",
            required: ["order"],
            properties: { order: schemaRef("Order") },
          },
        },
      },
      OrderListResponse: {
        type: "object",
        required: ["success", "data"],
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "object",
            required: ["orders", "pagination"],
            properties: {
              orders: { type: "array", items: schemaRef("Order") },
              pagination: {
                type: "object",
                required: ["page", "limit", "total", "totalPages"],
                properties: {
                  page: { type: "integer", minimum: 1 },
                  limit: { type: "integer", minimum: 1 },
                  total: { type: "integer", minimum: 0 },
                  totalPages: { type: "integer", minimum: 0 },
                },
              },
            },
          },
        },
      },
      CheckoutPreview: {
        type: "object",
        required: ["addressId", "isInsideDhaka", "subtotal", "discountTotal", "deliveryCharge", "grandTotal", "currency", "paymentMethod"],
        properties: {
          addressId: { type: "string", example: "3" },
          isInsideDhaka: { type: "boolean", example: true },
          subtotal: { type: "string", example: "2400.00" },
          discountTotal: { type: "string", example: "0.00" },
          deliveryCharge: { type: "string", example: "80.00" },
          grandTotal: { type: "string", example: "2480.00" },
          currency: { type: "string", example: "BDT" },
          paymentMethod: { type: "string", example: "COD" },
        },
      },
      CheckoutPreviewResponse: {
        type: "object",
        required: ["success", "data"],
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "object",
            required: ["preview"],
            properties: { preview: schemaRef("CheckoutPreview") },
          },
        },
      },
      CancelOrderRequest: {
        type: "object",
        properties: {
          note: { type: "string", nullable: true, maxLength: 500 },
        },
      },
      AdminOrderStatusRequest: {
        type: "object",
        required: ["status"],
        properties: {
          status: {
            type: "string",
            enum: ["CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"],
          },
          note: { type: "string", nullable: true, maxLength: 500 },
        },
      },
      SuccessResponse: {
        type: "object",
        required: ["success"],
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string" },
          data: {
            type: "object",
            description:
              "Response data differs by endpoint. It may contain a user, address, categories, products, cart, order, access token, or pagination.",
            additionalProperties: true,
          },
          developmentToken: {
            type: "string",
            description:
              "Only returned for email actions in development when email delivery is not configured.",
          },
        },
      },
      ErrorResponse: {
        type: "object",
        required: ["success", "error"],
        properties: {
          success: { type: "boolean", example: false },
          error: {
            type: "object",
            required: ["code", "message"],
            properties: {
              code: { type: "string", example: "VALIDATION_ERROR" },
              message: { type: "string" },
              details: { type: "object", additionalProperties: true },
            },
          },
        },
      },
    },
    responses: {
      ValidationError: {
        description: "Request validation failed",
        content: {
          "application/json": { schema: schemaRef("ErrorResponse") },
        },
      },
      AuthenticationError: {
        description: "Authentication failed or is required",
        content: {
          "application/json": { schema: schemaRef("ErrorResponse") },
        },
      },
      ForbiddenError: {
        description: "The user does not have the required role",
        content: {
          "application/json": { schema: schemaRef("ErrorResponse") },
        },
      },
      NotFoundError: {
        description: "The requested resource was not found",
        content: {
          "application/json": { schema: schemaRef("ErrorResponse") },
        },
      },
      ConflictError: {
        description: "The request conflicts with current data or state",
        content: {
          "application/json": { schema: schemaRef("ErrorResponse") },
        },
      },
      RateLimitError: {
        description: "Too many requests",
        content: {
          "application/json": { schema: schemaRef("ErrorResponse") },
        },
      },
      InternalServerError: {
        description: "Unexpected server error",
        content: {
          "application/json": { schema: schemaRef("ErrorResponse") },
        },
      },
    },
  },
};
