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
  },
  {
    method: "post",
    path: "/addresses",
    tag: "Addresses",
    summary: "Create a delivery address",
    auth: true,
    body: "AddressRequest",
    success: "201",
  },
  {
    method: "patch",
    path: "/addresses/{addressId}",
    tag: "Addresses",
    summary: "Update an owned address",
    auth: true,
    parameters: [idParameter("addressId", "Address ID")],
    body: "UpdateAddressRequest",
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
    notFound: true,
  },
  {
    method: "get",
    path: "/categories",
    tag: "Categories",
    summary: "List the public category tree",
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
    notFound: true,
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
      queryParameter("minPrice", { type: "number", minimum: 0 }),
      queryParameter("maxPrice", { type: "number", minimum: 0 }),
      queryParameter("sort", {
        type: "string",
        enum: ["newest", "price_asc", "price_desc", "name_asc"],
        default: "newest",
      }),
    ],
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
  },
  {
    method: "post",
    path: "/cart/items",
    tag: "Cart",
    summary: "Add a product variant to the cart",
    auth: true,
    body: "AddCartItemRequest",
    notFound: true,
    conflict: true,
  },
  {
    method: "delete",
    path: "/cart/items",
    tag: "Cart",
    summary: "Clear all cart items",
    auth: true,
  },
  {
    method: "patch",
    path: "/cart/items/{itemId}",
    tag: "Cart",
    summary: "Change an owned cart item's quantity",
    auth: true,
    parameters: [idParameter("itemId", "Cart item ID")],
    body: "UpdateCartItemRequest",
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
  },
  {
    method: "get",
    path: "/orders/{orderId}",
    tag: "Orders",
    summary: "Get an owned order",
    auth: true,
    parameters: [idParameter("orderId", "Order ID")],
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
  },
  {
    method: "get",
    path: "/admin/orders/{orderId}",
    tag: "Admin orders",
    summary: "Get any order",
    auth: true,
    admin: true,
    parameters: [idParameter("orderId", "Order ID")],
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
  sortOrder: { type: "integer", minimum: 0 },
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
    { name: "Admin categories" },
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
      CheckoutRequest: {
        type: "object",
        required: ["addressId"],
        properties: {
          addressId: { type: "string", example: "1" },
          customerNote: { type: "string", nullable: true, maxLength: 2000 },
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
