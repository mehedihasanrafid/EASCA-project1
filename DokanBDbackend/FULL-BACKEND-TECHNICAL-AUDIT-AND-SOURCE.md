# DokanBD Backend — Complete Technical Audit and Source Reference

Audit date: 6 October 2026 (Asia/Dhaka)

Project directory:

```text
/home/mehedi/Desktop/ DokanBD/ DokanBDbackend
```

## Security and scope notice

This document intentionally does not include `.env`, `node_modules`, `dist`, uploaded files, coverage output, or `package-lock.json`. Those files contain secrets, generated content, user content, or dependency-lock data that should not be copied into a study document.

The source appendix includes the safe project configuration, every application TypeScript file, all migrations and seeds, and every automated test file.

## Overall assessment

The backend is a substantial Cash on Delivery e-commerce MVP rather than an empty scaffold. The main Version 1 business foundation is approximately 80% complete. Authentication, database migrations, catalogue management, cart, transactional checkout, orders, inventory history, logging, mail delivery and API documentation are implemented. Full database-backed integration testing, several security refinements, optional commerce modules and deployment infrastructure are still required before production release.

## Technical snapshot

- 77 TypeScript source files.
- Approximately 8,368 lines of TypeScript application code.
- 21 TypeORM entities.
- 19 initial commerce tables and 2 authentication tables.
- 2 TypeORM migrations.
- 41 documented API paths.
- 53 documented API operations.
- 4 automated test files.
- 14 passing tests.
- TypeScript strict-mode checking passes.
- Gmail SMTP configuration loads successfully.
- MySQL migrations and seed data have been applied.

## Technology stack

- Node.js runtime.
- Express 5 HTTP framework.
- TypeScript with strict type checking.
- Node ESM using `NodeNext` module resolution.
- TypeORM with decorators and reflection metadata.
- MySQL through the `mysql2` driver.
- Zod validation.
- JSON Web Token access tokens.
- Opaque refresh tokens and one-time authentication tokens.
- bcrypt password hashing.
- Nodemailer with Gmail SMTP.
- Multer file uploads.
- Helmet security headers.
- CORS and cookie parsing.
- Pino structured logging.
- Swagger UI and OpenAPI 3.
- Vitest and Supertest.

Relative TypeScript imports use `.js` extensions because Node ESM executes the compiled JavaScript files.

## Runtime architecture

The request lifecycle is:

```text
HTTP request
  -> Express global middleware
  -> /api/v1 version router
  -> feature router
  -> authentication and authorization middleware
  -> controller
  -> Zod validation
  -> service and business rules
  -> TypeORM repository
  -> MySQL
  -> JSON response

Error
  -> centralized error middleware
  -> consistent JSON error response
```

Global middleware provides Helmet, CORS, a one-megabyte JSON limit, cookie parsing, request IDs, Pino HTTP logging, static upload serving, Swagger UI, 404 handling and centralized error handling.

The server initializes MySQL before accepting HTTP traffic and closes the HTTP server and DataSource during `SIGINT` or `SIGTERM`.

## Environment configuration

`src/config/env.ts` validates all runtime configuration before startup. It covers:

- Application environment and port.
- MySQL host, port, database, username and password.
- Browser origin.
- JWT secret and access-token lifetime.
- Refresh-token lifetime.
- Verification and password-reset token lifetimes.
- SMTP host, port, secure mode, username, password and sender.
- Optional Redis URL.
- Upload location and maximum size.
- Delivery charges.
- Optional development administrator values.

The actual `.env` is ignored by `.gitignore`. Secrets must never be copied into documentation or committed.

## Database architecture

TypeORM uses:

```ts
synchronize: false
migrationsRun: false
```

The schema is controlled by explicit migrations rather than automatic synchronization.

### Initial database tables

- `roles`
- `users`
- `addresses`
- `categories`
- `product_types`
- `brands`
- `vendors`
- `products`
- `product_variants`
- `product_media`
- `carts`
- `cart_items`
- `inventory_movements`
- `orders`
- `order_items`
- `order_status_history`
- `payments`
- `returns`
- `return_items`

### Authentication-security migration

The second migration adds:

- `users.email_verified_at`
- `auth_tokens`
- `refresh_sessions`

The 22-table live count includes the 21 application tables plus TypeORM's internal `migrations` table.

### Database design characteristics

- Unsigned `BIGINT` primary and foreign keys.
- TypeScript string representation for MySQL `BIGINT` IDs.
- `CASCADE`, `RESTRICT` and `SET NULL` foreign-key strategies.
- Unique email, phone, slug, SKU, barcode and token hashes.
- Decimal database columns for monetary values.
- Soft-delete columns on selected entities.
- Order address and product snapshots.
- Inventory movement history.
- Order-status history.
- Automatic created and updated timestamps.

### Seed data

The repeatable seed uses `upsert` to create or update:

- CUSTOMER, ADMIN and OWNER roles.
- Clothing, Accessories, Electronics and Footwear categories.
- Matching starter product types.
- DokanBD and Generic brands.
- An optional administrator configured through `.env`.

## Authentication and session management

Implemented endpoints:

```text
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
POST /api/v1/auth/logout-all
POST /api/v1/auth/verify-email
POST /api/v1/auth/resend-verification
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password
GET  /api/v1/auth/me
```

Registration always creates a CUSTOMER account. Phone numbers must match the Bangladesh mobile-number format. Email is optional, while email and phone uniqueness checks include soft-deleted accounts.

Passwords are hashed with bcrypt using 12 rounds. Login accepts either email or phone. JWT access tokens use HS256 and contain the user ID as `sub` plus the role code.

Refresh tokens are generated from 32 cryptographically secure random bytes, encoded as 64 hexadecimal characters and stored only as SHA-256 hashes. Sessions store expiry, revocation time, IP address and user agent. Rotation revokes the current token and creates a replacement inside a transaction.

Refresh tokens are sent through an HTTP-only, SameSite cookie. Production mode enables the Secure cookie flag.

## Email verification and password recovery

Email-verification and password-reset tokens:

- Are cryptographically random.
- Are stored only as SHA-256 hashes.
- Have configurable expiry times.
- Are one-time use.
- Invalidate earlier unused tokens of the same type.

Password reset also revokes every active refresh session for the account.

Nodemailer sends HTML and plain-text messages through Gmail SMTP. Action links use:

```text
WEB_ORIGIN/verify-email?token=...
WEB_ORIGIN/reset-password?token=...
```

The frontend must implement those pages, read the query token and submit it to the relevant backend POST endpoint.

## Authorization

Available roles:

- CUSTOMER
- ADMIN
- OWNER

ADMIN and OWNER currently share the same administration routes. Public registration cannot select a privileged role. An optional seed creates the first administrator, after which the user-management endpoint can change roles.

The `requireVerifiedEmail` middleware exists but is not currently attached to a route.

## Users module

Implemented functionality:

- Current profile retrieval.
- Name and phone update.
- Profile-image upload.
- Administrator user listing.
- Search and pagination.
- Role and active-status filters.
- Role changes.
- Account activation and deactivation.
- Protection against self-deactivation.

Profile uploads accept JPEG, PNG and WebP files with a configurable maximum size.

## Addresses module

Implemented functionality:

- Owned address listing.
- Address creation.
- Address update.
- Soft deletion.
- Default-address selection.
- Automatic default selection for the first address.
- Automatic replacement when the current default is deleted.

Transactions and pessimistic user-row locks protect the one-default-address rule.

## Categories module

Implemented functionality:

- Public active category tree.
- Administrator listing including optional deleted records.
- Creation and update.
- Automatic slug creation.
- Unique-slug validation.
- Parent validation.
- Parent-cycle prevention.
- Soft delete and restore.
- Child-category deletion protection.

## Product catalogue

Public functionality:

- Product listing and pagination.
- Search by product name or slug.
- Category filtering by ID or slug.
- Minimum and maximum price filters.
- Newest, price and alphabetical sorting.
- Product details by ID or slug.
- Active-product and active-category filtering.
- Variant and media output.
- Total-stock calculation.
- Primary-image selection.

Administrator functionality:

- Product creation and update.
- Draft, active, inactive and discontinued statuses.
- Product soft deletion and restoration.
- Product-type, category and brand validation.
- Unique slug validation.
- Cost price, sale price and discount-price validation.
- Featured and active flags.

## Product variants and inventory

Variant functionality includes:

- Unique SKU.
- Optional unique barcode.
- Optional vendor relationship.
- Colour and size.
- Price and cost price.
- Stock quantity and low-stock threshold.
- Weight.
- Default and active flags.
- Soft deletion.
- Automatic replacement default variant.

Initial stock and later stock changes create inventory movement records containing before/after quantities, movement type, reference and responsible user.

## Product media

Implemented functionality:

- Up to four images per product.
- JPEG, PNG and WebP filtering.
- Configurable file-size limit.
- Variant-specific media.
- Alternative text.
- Sort order.
- Primary-image selection.
- Physical-file cleanup after failed uploads.
- Physical-file removal during deletion.

## Shopping cart

Implemented endpoints:

```text
GET    /api/v1/cart
POST   /api/v1/cart/items
PATCH  /api/v1/cart/items/:itemId
DELETE /api/v1/cart/items/:itemId
DELETE /api/v1/cart/items
```

The service creates an active cart when required, enforces user ownership, merges duplicate variants, validates stock and calculates totals on the server. Currency calculations use integer minor units with `BigInt` to avoid floating-point rounding errors.

## Checkout and orders

Checkout executes in one MySQL transaction:

1. Lock the active customer.
2. Validate address ownership.
3. Lock the active cart.
4. Reject an empty cart.
5. Lock all selected variants.
6. Revalidate product and variant availability.
7. Revalidate stock.
8. Calculate totals.
9. Calculate delivery charge.
10. Create the order.
11. Create order-item snapshots.
12. Reduce inventory.
13. Create inventory movements.
14. Create order-status history.
15. Mark the cart as converted.

Failure at any stage rolls back the complete transaction.

Customer order functionality includes listing, filtering, details and pending-order cancellation. Administrator functionality includes global order search/filtering, detailed internal views and controlled status transitions:

```text
PENDING -> CONFIRMED -> SHIPPED -> DELIVERED
PENDING or CONFIRMED -> CANCELLED by administrator
PENDING -> CANCELLED by customer
```

Cancellation restores stock and creates inventory and order-status records. Checkout currently uses Cash on Delivery and BDT.

## Swagger and OpenAPI

Swagger currently describes:

- 41 API paths.
- 53 operations.
- Bearer authentication.
- JSON request bodies.
- Query and path parameters.
- Multipart file uploads.
- Standard error responses.

Swagger UI is available at `/api-docs/` and the OpenAPI JSON at `/api-docs.json`.

Most success responses currently use a generic response schema rather than precise endpoint-specific response models.

## Automated tests

Current tests cover:

- Registration validation and email normalization.
- Bangladesh phone validation.
- Password and authentication-token validation.
- Secure opaque-token generation and hashing.
- Delivery-address validation.
- Cart quantity validation.
- Product pagination limits.
- Checkout address validation.
- OpenAPI path and operation counts.
- Protected-route Swagger security metadata.
- JSON and multipart Swagger request bodies.

Current result:

```text
Test files: 4 passed
Tests: 14 passed
TypeScript type check: passed
```

The current suite does not contain MySQL-backed service or HTTP integration tests.

## Entity-only or deferred modules

The following areas have database entities or reference data but no complete route/controller/service workflow:

- Payments.
- Returns and return items.
- Vendors.
- Brands.
- Product types.

Inventory history exists, but there is no dedicated inventory listing, manual-adjustment or low-stock endpoint. Redis is installed but unused. Morgan is installed but unused because Pino is the active logger.

## Important technical gaps

### Development rate limits

Authentication and email-action limits are currently set to 1000 for testing. Production should restore strict values or load them from environment configuration.

### Email verification enforcement

The middleware exists but is not used. Unverified accounts can currently access authenticated business functionality.

### Role escalation

ADMIN can currently assign OWNER. A safer design reserves OWNER assignment for existing owners.

### Stale JWT role claims

Role information is stored in access tokens. A role change does not invalidate an already-issued access token, so previous permissions remain until token expiry.

### Browser refresh-cookie CORS

The CORS configuration does not currently set `credentials: true`. Browser refresh-cookie authentication will normally require backend credential support and frontend requests using `credentials: "include"`.

### Cart product-status validation

Cart validation checks active flags but does not require `product.status === "ACTIVE"`. Checkout catches this later, but the cart should reject draft or inactive-status products earlier.

### Upload hardening

Upload filters trust the client MIME type. Production should inspect file signatures. Replaced profile images are not deleted, and deleting a primary product image does not automatically assign another primary image.

### Distributed rate limiting and storage

Rate limiting uses process memory. Counters reset on restart and do not synchronize across multiple instances. Production should use a Redis-backed store.

### Frontend action pages

The `/verify-email` and `/reset-password` frontend pages still need implementation.

### Production operations

The project does not yet include Docker, CI/CD, monitoring, automated backups, object storage, Redis integration or production deployment configuration.

## Version 1 completion priorities

1. Restore environment-specific production rate limits.
2. Correct privileged role-management rules.
3. Add browser cookie/CORS credential support.
4. Decide where verified email is mandatory.
5. Reject non-ACTIVE products at cart time.
6. Complete the live product-to-order workflow.
7. Add MySQL-backed Supertest integration tests.
8. Implement the frontend verification/reset pages.
9. Decide whether payment, returns, vendors and inventory APIs belong in Version 1.
10. Add deployment, monitoring and backup infrastructure.

## Source-code appendix

The following appendix is generated from the current project files. It contains safe configuration and source code but excludes live secrets and generated/dependency content.


### Included file index

- `.gitignore`
- `.env.example`
- `package.json`
- `tsconfig.json`
- `src/app.ts`
- `src/config/env.ts`
- `src/config/logger.ts`
- `src/database/data-source.ts`
- `src/database/migrations/1791108013191-InitialSchema.ts`
- `src/database/migrations/1791190000000-AuthSecurity.ts`
- `src/database/seeds/seed.ts`
- `src/docs/openapi.ts`
- `src/middlewares/error-handler.ts`
- `src/middlewares/not-found.ts`
- `src/modules/addresses/address.controller.ts`
- `src/modules/addresses/address.entity.ts`
- `src/modules/addresses/address.routes.ts`
- `src/modules/addresses/address.schema.ts`
- `src/modules/addresses/address.service.ts`
- `src/modules/auth/auth-token.entity.ts`
- `src/modules/auth/auth-token.service.ts`
- `src/modules/auth/auth.controller.ts`
- `src/modules/auth/auth.middleware.ts`
- `src/modules/auth/auth.routes.ts`
- `src/modules/auth/auth.schema.ts`
- `src/modules/auth/auth.service.ts`
- `src/modules/auth/authorization.middleware.ts`
- `src/modules/auth/refresh-session.entity.ts`
- `src/modules/brands/brand.entity.ts`
- `src/modules/carts/cart-item.entity.ts`
- `src/modules/carts/cart.controller.ts`
- `src/modules/carts/cart.entity.ts`
- `src/modules/carts/cart.routes.ts`
- `src/modules/carts/cart.schema.ts`
- `src/modules/carts/cart.service.ts`
- `src/modules/categories/category.controller.ts`
- `src/modules/categories/category.entity.ts`
- `src/modules/categories/category.routes.ts`
- `src/modules/categories/category.schema.ts`
- `src/modules/categories/category.service.ts`
- `src/modules/health/health.controller.ts`
- `src/modules/health/health.routes.ts`
- `src/modules/inventory/inventory-movement.entity.ts`
- `src/modules/orders/order-admin.controller.ts`
- `src/modules/orders/order-admin.routes.ts`
- `src/modules/orders/order-item.entity.ts`
- `src/modules/orders/order-status-history.entity.ts`
- `src/modules/orders/order.controller.ts`
- `src/modules/orders/order.entity.ts`
- `src/modules/orders/order.routes.ts`
- `src/modules/orders/order.schema.ts`
- `src/modules/orders/order.service.ts`
- `src/modules/payments/payment.entity.ts`
- `src/modules/product-types/product-type.entity.ts`
- `src/modules/products/product-media-upload.middleware.ts`
- `src/modules/products/product-media.controller.ts`
- `src/modules/products/product-media.entity.ts`
- `src/modules/products/product-media.schema.ts`
- `src/modules/products/product-media.service.ts`
- `src/modules/products/product-variant.entity.ts`
- `src/modules/products/product.controller.ts`
- `src/modules/products/product.entity.ts`
- `src/modules/products/product.routes.ts`
- `src/modules/products/product.schema.ts`
- `src/modules/products/product.service.ts`
- `src/modules/returns/return-item.entity.ts`
- `src/modules/returns/return.entity.ts`
- `src/modules/role/role.entity.ts`
- `src/modules/users/user-upload.middleware.ts`
- `src/modules/users/user.controller.ts`
- `src/modules/users/user.entity.ts`
- `src/modules/users/user.routes.ts`
- `src/modules/users/user.schema.ts`
- `src/modules/users/user.service.ts`
- `src/modules/vendors/vendor.entity.ts`
- `src/routes/v1.ts`
- `src/server.ts`
- `src/services/mail.service.ts`
- `src/types/express.d.ts`
- `src/utils/app-error.ts`
- `src/utils/opaque-token.ts`
- `tests/auth-schema.test.ts`
- `tests/auth-token.test.ts`
- `tests/business-schema.test.ts`
- `tests/openapi.test.ts`


---

### `.gitignore`

```text
node_modules/
dist/
.env
.env.*
!.env.example
uploads/
coverage/
*.log
*.sql
*.dump
.DS_Store
```


---

### `.env.example`

```text
NODE_ENV=development
PORT=5000

DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=dokanbd_learning
DB_USER=dokanbd
DB_PASSWORD=replace_with_local_password

WEB_ORIGIN=http://localhost:5173

JWT_SECRET=replace_with_at_least_32_random_characters
JWT_EXPIRES_IN=86400
REFRESH_TOKEN_TTL_DAYS=30
EMAIL_VERIFICATION_TTL_MINUTES=1440
PASSWORD_RESET_TTL_MINUTES=30

# SMTP email delivery. Port 587 normally uses SMTP_SECURE=false.
# Port 465 normally uses SMTP_SECURE=true.
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=replace_with_smtp_username
SMTP_PASSWORD=replace_with_smtp_password
MAIL_FROM=DokanBD <no-reply@example.com>

# Optional Redis cache. Leave empty while learning locally.
# REDIS_URL=redis://127.0.0.1:6379

UPLOAD_DIR=uploads
MAX_UPLOAD_BYTES=2097152
DELIVERY_INSIDE_DHAKA=60
DELIVERY_OUTSIDE_DHAKA=120

# Optional development administrator created by npm run seed.
SEED_ADMIN_NAME=DokanBD Admin
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PHONE=01700000000
SEED_ADMIN_PASSWORD=replace_with_a_strong_password
```


---

### `package.json`

```json
{
  "name": "dokanbd-backend",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch --clear-screen=false --include \"./src/**/*.ts\" src/server.ts",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/server.js",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "typeorm": "tsx ./node_modules/typeorm/cli.js",
    "migration:generate": "npm run typeorm -- migration:generate -d ./src/database/data-source.ts -p",
    "migration:run": "npm run typeorm -- migration:run -d ./src/database/data-source.ts",
    "migration:show": "npm run typeorm -- migration:show -d ./src/database/data-source.ts",
    "migration:revert": "npm run typeorm -- migration:revert -d ./src/database/data-source.ts",
    "seed": "tsx src/database/seeds/seed.ts",
    "check": "npm run typecheck && npm run test && npm run build"
  },
  "dependencies": {
    "bcryptjs": "^3.0.3",
    "cookie-parser": "^1.4.7",
    "cors": "^2.8.5",
    "dotenv": "^17.4.2",
    "express": "^5.1.0",
    "express-rate-limit": "^8.7.0",
    "helmet": "^8.1.0",
    "ioredis": "^5.11.1",
    "jsonwebtoken": "^9.0.3",
    "morgan": "^1.10.1",
    "multer": "^2.4.0",
    "mysql2": "^3.24.5",
    "nodemailer": "^10.0.15",
    "pino": "^10.4.0",
    "pino-http": "^11.0.0",
    "reflect-metadata": "^0.2.2",
    "swagger-ui-express": "^5.0.1",
    "typeorm": "^1.1.1",
    "zod": "^4.6.5"
  },
  "devDependencies": {
    "@types/cookie-parser": "^1.4.10",
    "@types/cors": "^2.8.19",
    "@types/express": "^5.0.5",
    "@types/jsonwebtoken": "^9.0.10",
    "@types/morgan": "^1.9.10",
    "@types/multer": "^2.3.0",
    "@types/node": "^24.10.1",
    "@types/nodemailer": "^8.0.2",
    "@types/supertest": "^7.2.1",
    "@types/swagger-ui-express": "^4.1.8",
    "supertest": "^7.3.1",
    "tsx": "^4.20.6",
    "typescript": "^5.9.3",
    "vitest": "^4.0.8"
  }
}
```


---

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "rootDir": "src",
    "outDir": "dist",
    "strict": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "noUncheckedIndexedAccess": true,
    "sourceMap": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist", "tests"]
}
```


---

### `src/app.ts`

```ts
import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";
import { resolve } from "node:path";
import swaggerUi from "swagger-ui-express";

import { env } from "./config/env.js";
import { httpLogger } from "./config/logger.js";
import { openApiDocument } from "./docs/openapi.js";
import { errorHandler } from "./middlewares/error-handler.js";
import { notFound } from "./middlewares/not-found.js";
import { v1Router } from "./routes/v1.js";

const apiSecurityHeaders = helmet();
const documentationSecurityHeaders = helmet({ contentSecurityPolicy: false });

export const createApp = () => {
  const app = express();

  app.disable("x-powered-by");
  app.use((request, response, next) => {
    const securityHeaders = request.path.startsWith("/api-docs")
      ? documentationSecurityHeaders
      : apiSecurityHeaders;

    securityHeaders(request, response, next);
  });
  app.use(cors({ origin: env.WEB_ORIGIN }));
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(httpLogger);
  app.use("/uploads", express.static(resolve(env.UPLOAD_DIR)));

  app.get("/api-docs.json", (_request, response) => {
    response.status(200).json(openApiDocument);
  });
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(openApiDocument, {
      customSiteTitle: "DokanBD API documentation",
      swaggerOptions: { persistAuthorization: true },
    }),
  );

  app.use("/api/v1", v1Router);

  app.use(notFound);
  app.use(errorHandler);
  
  return app;
};
```


---

### `src/config/env.ts`

```ts
import "dotenv/config";
import { z } from "zod";

const environmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  DB_HOST: z.string().min(1).default("127.0.0.1"),
  DB_PORT: z.coerce.number().int().positive().default(3306),
  DB_NAME: z.string().min(1),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string(),
  WEB_ORIGIN: z.string().url().default("http://localhost:5173"),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.coerce.number().int().positive().default(86400),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
  EMAIL_VERIFICATION_TTL_MINUTES: z.coerce.number().int().positive().default(1440),
  PASSWORD_RESET_TTL_MINUTES: z.coerce.number().int().positive().default(30),
  SMTP_HOST: z.string().min(1).optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  SMTP_USER: z.string().min(1).optional(),
  SMTP_PASSWORD: z.string().min(1).optional(),
  MAIL_FROM: z.string().min(1).optional(),
  REDIS_URL: z.string().url().optional(),
  UPLOAD_DIR: z.string().min(1).default("uploads"),
  MAX_UPLOAD_BYTES: z.coerce.number().int().positive().default(2097152),
  DELIVERY_INSIDE_DHAKA: z.coerce.number().nonnegative().default(60),
  DELIVERY_OUTSIDE_DHAKA: z.coerce.number().nonnegative().default(120),
  SEED_ADMIN_NAME: z.string().min(2).optional(),
  SEED_ADMIN_EMAIL: z.string().email().optional(),
  SEED_ADMIN_PHONE: z.string().regex(/^01[3-9]\d{8}$/).optional(),
  SEED_ADMIN_PASSWORD: z.string().min(8).max(72).optional(),
});

const result = environmentSchema.safeParse(process.env);

if (!result.success) {
  console.error("Invalid environment configuration", result.error.flatten().fieldErrors);
  throw new Error("Invalid environment configuration");
}

export const env = result.data;
```


---

### `src/config/logger.ts`

```ts
import { randomUUID } from "node:crypto";
import pino from "pino";
import { pinoHttp } from "pino-http";

import { env } from "./env.js";

export const logger = pino({
  level: env.NODE_ENV === "production" ? "info" : "debug",
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "password",
      "token",
      "refreshToken",
    ],
    censor: "[REDACTED]",
  },
});

export const httpLogger = pinoHttp({
  logger,
  genReqId(request, response) {
    const suppliedId = request.headers["x-request-id"];
    const requestId = typeof suppliedId === "string" ? suppliedId : randomUUID();
    response.setHeader("x-request-id", requestId);
    return requestId;
  },
});
```


---

### `src/database/data-source.ts`

```ts
import "reflect-metadata";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { DataSource } from "typeorm";
import { env } from "../config/env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const AppDataSource = new DataSource({
  type: "mysql",

  host: env.DB_HOST,
  port: env.DB_PORT,

  username: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,

  synchronize: false,
  logging: env.NODE_ENV === "development",

  entities: [__dirname + "/../modules/**/*.entity.{ts,js}"],
  migrations: [__dirname + "/migrations/**/*{.ts,.js}"],
  migrationsRun: false,
  migrationsTableName: "migrations",
});
```


---

### `src/database/migrations/1791108013191-InitialSchema.ts`

```ts
import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1791108013191 implements MigrationInterface {
    name = 'InitialSchema1791108013191'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`brands\` (
                \`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
                \`name\` varchar(100) NOT NULL,
                \`slug\` varchar(120) NOT NULL,
                \`logo_url\` varchar(500) NULL,
                \`description\` text NULL,
                \`is_active\` tinyint NOT NULL DEFAULT 1,
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                UNIQUE INDEX \`IDX_b15428f362be2200922952dc26\` (\`slug\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`vendors\` (
                \`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
                \`name\` varchar(150) NOT NULL,
                \`company_name\` varchar(150) NULL,
                \`contact_person\` varchar(100) NULL,
                \`phone\` varchar(20) NULL,
                \`email\` varchar(255) NULL,
                \`address\` text NULL,
                \`notes\` text NULL,
                \`is_active\` tinyint NOT NULL DEFAULT 1,
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`categories\` (
                \`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
                \`parent_id\` bigint UNSIGNED NULL,
                \`name\` varchar(100) NOT NULL,
                \`slug\` varchar(120) NOT NULL,
                \`description\` text NULL,
                \`image_url\` varchar(500) NULL,
                \`is_active\` tinyint NOT NULL DEFAULT 1,
                \`sort_order\` int NOT NULL DEFAULT '0',
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                \`deleted_at\` datetime(6) NULL,
                UNIQUE INDEX \`IDX_420d9f679d41281f282f5bc7d0\` (\`slug\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`product_types\` (
                \`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
                \`name\` varchar(100) NOT NULL,
                \`slug\` varchar(120) NOT NULL,
                \`description\` text NULL,
                \`is_active\` tinyint NOT NULL DEFAULT 1,
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                UNIQUE INDEX \`IDX_3e8267a546afc4ce1967ba0ab9\` (\`slug\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`products\` (
                \`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
                \`product_type_id\` bigint UNSIGNED NOT NULL,
                \`category_id\` bigint UNSIGNED NOT NULL,
                \`brand_id\` bigint UNSIGNED NULL,
                \`name\` varchar(200) NOT NULL,
                \`slug\` varchar(220) NOT NULL,
                \`short_description\` varchar(500) NULL,
                \`description\` text NOT NULL,
                \`default_price\` decimal(12, 2) NOT NULL,
                \`default_cost_price\` decimal(12, 2) NULL,
                \`discount_price\` decimal(12, 2) NULL,
                \`status\` varchar(30) NOT NULL,
                \`is_featured\` tinyint NOT NULL DEFAULT 0,
                \`is_active\` tinyint NOT NULL DEFAULT 1,
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                \`deleted_at\` datetime(6) NULL,
                UNIQUE INDEX \`IDX_464f927ae360106b783ed0b410\` (\`slug\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`product_variants\` (
                \`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
                \`product_id\` bigint UNSIGNED NOT NULL,
                \`vendor_id\` bigint UNSIGNED NULL,
                \`sku\` varchar(100) NOT NULL,
                \`barcode\` varchar(100) NULL,
                \`variant_name\` varchar(150) NULL,
                \`color\` varchar(100) NULL,
                \`size\` varchar(100) NULL,
                \`price\` decimal(12, 2) NOT NULL,
                \`cost_price\` decimal(12, 2) NULL,
                \`stock_quantity\` int NOT NULL DEFAULT '0',
                \`low_stock_level\` int NOT NULL DEFAULT '5',
                \`weight\` decimal(10, 2) NULL,
                \`is_default\` tinyint NOT NULL DEFAULT 0,
                \`is_active\` tinyint NOT NULL DEFAULT 1,
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                \`deleted_at\` datetime(6) NULL,
                UNIQUE INDEX \`IDX_46f236f21640f9da218a063a86\` (\`sku\`),
                UNIQUE INDEX \`IDX_62124a7ca2686cbaed42f0d3a2\` (\`barcode\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`roles\` (
                \`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
                \`name\` varchar(50) NOT NULL,
                \`code\` varchar(50) NOT NULL,
                \`description\` varchar(255) NULL,
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                UNIQUE INDEX \`IDX_f6d54f95c31b73fb1bdd8e91d0\` (\`code\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`users\` (
                \`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
                \`role_id\` bigint UNSIGNED NOT NULL,
                \`name\` varchar(100) NOT NULL,
                \`email\` varchar(255) NULL,
                \`phone\` varchar(20) NOT NULL,
                \`password_hash\` varchar(255) NOT NULL,
                \`profile_image_url\` varchar(500) NULL,
                \`is_active\` tinyint NOT NULL DEFAULT 1,
                \`last_login_at\` datetime NULL,
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                \`deleted_at\` datetime(6) NULL,
                UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`),
                UNIQUE INDEX \`IDX_a000cca60bcf04454e72769949\` (\`phone\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`carts\` (
                \`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
                \`user_id\` bigint UNSIGNED NOT NULL,
                \`status\` varchar(30) NOT NULL,
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`cart_items\` (
                \`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
                \`cart_id\` bigint UNSIGNED NOT NULL,
                \`product_variant_id\` bigint UNSIGNED NOT NULL,
                \`quantity\` int NOT NULL,
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                UNIQUE INDEX \`UQ_cart_items_cart_variant\` (\`cart_id\`, \`product_variant_id\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`addresses\` (
                \`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
                \`user_id\` bigint UNSIGNED NOT NULL,
                \`label\` varchar(50) NULL,
                \`recipient_name\` varchar(100) NOT NULL,
                \`phone\` varchar(20) NOT NULL,
                \`address_line_1\` varchar(255) NOT NULL,
                \`address_line_2\` varchar(255) NULL,
                \`area\` varchar(100) NOT NULL,
                \`city\` varchar(100) NOT NULL,
                \`district\` varchar(100) NOT NULL,
                \`division\` varchar(100) NOT NULL,
                \`postal_code\` varchar(20) NULL,
                \`country\` varchar(100) NOT NULL DEFAULT 'Bangladesh',
                \`is_inside_dhaka\` tinyint NOT NULL,
                \`is_default\` tinyint NOT NULL DEFAULT 0,
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                \`deleted_at\` datetime(6) NULL,
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`inventory_movements\` (
                \`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
                \`product_variant_id\` bigint UNSIGNED NOT NULL,
                \`movement_type\` varchar(30) NOT NULL,
                \`quantity\` int NOT NULL,
                \`quantity_before\` int NULL,
                \`quantity_after\` int NULL,
                \`reference_type\` varchar(50) NULL,
                \`reference_id\` bigint UNSIGNED NULL,
                \`note\` varchar(500) NULL,
                \`created_by\` bigint UNSIGNED NULL,
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`orders\` (
                \`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
                \`order_number\` varchar(50) NOT NULL,
                \`user_id\` bigint UNSIGNED NOT NULL,
                \`order_status\` varchar(30) NOT NULL,
                \`payment_method\` varchar(30) NOT NULL DEFAULT 'COD',
                \`payment_status\` varchar(30) NOT NULL DEFAULT 'PENDING',
                \`subtotal\` decimal(12, 2) NOT NULL,
                \`discount_total\` decimal(12, 2) NOT NULL DEFAULT '0.00',
                \`delivery_charge\` decimal(12, 2) NOT NULL,
                \`grand_total\` decimal(12, 2) NOT NULL,
                \`currency\` varchar(10) NOT NULL DEFAULT 'BDT',
                \`recipient_name\` varchar(100) NOT NULL,
                \`recipient_phone\` varchar(20) NOT NULL,
                \`address_line_1\` varchar(255) NOT NULL,
                \`address_line_2\` varchar(255) NULL,
                \`area\` varchar(100) NOT NULL,
                \`city\` varchar(100) NOT NULL,
                \`district\` varchar(100) NOT NULL,
                \`division\` varchar(100) NOT NULL,
                \`postal_code\` varchar(20) NULL,
                \`country\` varchar(100) NOT NULL DEFAULT 'Bangladesh',
                \`is_inside_dhaka\` tinyint NOT NULL,
                \`customer_note\` text NULL,
                \`admin_note\` text NULL,
                \`placed_at\` datetime NOT NULL,
                \`confirmed_at\` datetime NULL,
                \`shipped_at\` datetime NULL,
                \`delivered_at\` datetime NULL,
                \`cancelled_at\` datetime NULL,
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                UNIQUE INDEX \`IDX_75eba1c6b1a66b09f2a97e6927\` (\`order_number\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`order_items\` (
                \`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
                \`order_id\` bigint UNSIGNED NOT NULL,
                \`product_id\` bigint UNSIGNED NULL,
                \`product_variant_id\` bigint UNSIGNED NULL,
                \`product_name\` varchar(200) NOT NULL,
                \`variant_name\` varchar(150) NULL,
                \`sku\` varchar(100) NULL,
                \`barcode\` varchar(100) NULL,
                \`quantity\` int NOT NULL,
                \`unit_price\` decimal(12, 2) NOT NULL,
                \`unit_cost\` decimal(12, 2) NULL,
                \`discount_amount\` decimal(12, 2) NOT NULL DEFAULT '0.00',
                \`line_total\` decimal(12, 2) NOT NULL,
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`order_status_history\` (
                \`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
                \`order_id\` bigint UNSIGNED NOT NULL,
                \`old_status\` varchar(30) NULL,
                \`new_status\` varchar(30) NOT NULL,
                \`changed_by\` bigint UNSIGNED NULL,
                \`note\` varchar(500) NULL,
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`payments\` (
                \`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
                \`order_id\` bigint UNSIGNED NOT NULL,
                \`payment_method\` varchar(30) NOT NULL,
                \`amount\` decimal(12, 2) NOT NULL,
                \`currency\` varchar(10) NOT NULL DEFAULT 'BDT',
                \`status\` varchar(30) NOT NULL,
                \`paid_at\` datetime NULL,
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`product_media\` (
                \`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
                \`product_id\` bigint UNSIGNED NOT NULL,
                \`variant_id\` bigint UNSIGNED NULL,
                \`media_type\` varchar(20) NOT NULL,
                \`url\` varchar(500) NOT NULL,
                \`thumbnail_url\` varchar(500) NULL,
                \`alt_text\` varchar(255) NULL,
                \`sort_order\` int NOT NULL DEFAULT '0',
                \`is_primary\` tinyint NOT NULL DEFAULT 0,
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`returns\` (
                \`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
                \`return_number\` varchar(50) NOT NULL,
                \`order_id\` bigint UNSIGNED NOT NULL,
                \`user_id\` bigint UNSIGNED NOT NULL,
                \`status\` varchar(30) NOT NULL,
                \`reason\` varchar(255) NOT NULL,
                \`customer_note\` text NULL,
                \`admin_note\` text NULL,
                \`requested_at\` datetime NOT NULL,
                \`approved_at\` datetime NULL,
                \`rejected_at\` datetime NULL,
                \`completed_at\` datetime NULL,
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                UNIQUE INDEX \`IDX_df468a204fb304989cea982f20\` (\`return_number\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`return_items\` (
                \`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
                \`return_id\` bigint UNSIGNED NOT NULL,
                \`order_item_id\` bigint UNSIGNED NOT NULL,
                \`quantity\` int NOT NULL,
                \`reason\` varchar(255) NOT NULL,
                \`item_condition\` varchar(100) NULL,
                \`restock\` tinyint NOT NULL DEFAULT 0,
                \`refund_amount\` decimal(12, 2) NOT NULL DEFAULT '0.00',
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            ALTER TABLE \`categories\`
            ADD CONSTRAINT \`FK_88cea2dc9c31951d06437879b40\` FOREIGN KEY (\`parent_id\`) REFERENCES \`categories\`(\`id\`) ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`products\`
            ADD CONSTRAINT \`FK_9adb63f24f86528856373f0ab9a\` FOREIGN KEY (\`product_type_id\`) REFERENCES \`product_types\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`products\`
            ADD CONSTRAINT \`FK_9a5f6868c96e0069e699f33e124\` FOREIGN KEY (\`category_id\`) REFERENCES \`categories\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`products\`
            ADD CONSTRAINT \`FK_1530a6f15d3c79d1b70be98f2be\` FOREIGN KEY (\`brand_id\`) REFERENCES \`brands\`(\`id\`) ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`product_variants\`
            ADD CONSTRAINT \`FK_6343513e20e2deab45edfce1316\` FOREIGN KEY (\`product_id\`) REFERENCES \`products\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`product_variants\`
            ADD CONSTRAINT \`FK_1a3f5b3fdcea288c7410726c7d3\` FOREIGN KEY (\`vendor_id\`) REFERENCES \`vendors\`(\`id\`) ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`users\`
            ADD CONSTRAINT \`FK_a2cecd1a3531c0b041e29ba46e1\` FOREIGN KEY (\`role_id\`) REFERENCES \`roles\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`carts\`
            ADD CONSTRAINT \`FK_2ec1c94a977b940d85a4f498aea\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`cart_items\`
            ADD CONSTRAINT \`FK_6385a745d9e12a89b859bb25623\` FOREIGN KEY (\`cart_id\`) REFERENCES \`carts\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`cart_items\`
            ADD CONSTRAINT \`FK_de29bab7b2bb3b49c07253275f1\` FOREIGN KEY (\`product_variant_id\`) REFERENCES \`product_variants\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`addresses\`
            ADD CONSTRAINT \`FK_16aac8a9f6f9c1dd6bcb75ec023\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`inventory_movements\`
            ADD CONSTRAINT \`FK_53f466e8e8bee109aea4cefddf5\` FOREIGN KEY (\`product_variant_id\`) REFERENCES \`product_variants\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`inventory_movements\`
            ADD CONSTRAINT \`FK_4a137ccc372acb73821c4dd3991\` FOREIGN KEY (\`created_by\`) REFERENCES \`users\`(\`id\`) ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`orders\`
            ADD CONSTRAINT \`FK_a922b820eeef29ac1c6800e826a\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`order_items\`
            ADD CONSTRAINT \`FK_145532db85752b29c57d2b7b1f1\` FOREIGN KEY (\`order_id\`) REFERENCES \`orders\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`order_items\`
            ADD CONSTRAINT \`FK_9263386c35b6b242540f9493b00\` FOREIGN KEY (\`product_id\`) REFERENCES \`products\`(\`id\`) ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`order_items\`
            ADD CONSTRAINT \`FK_11836543386b9135a47d54cab70\` FOREIGN KEY (\`product_variant_id\`) REFERENCES \`product_variants\`(\`id\`) ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`order_status_history\`
            ADD CONSTRAINT \`FK_1ca7d5228cf9dc589b60243933c\` FOREIGN KEY (\`order_id\`) REFERENCES \`orders\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`order_status_history\`
            ADD CONSTRAINT \`FK_de5bb51ff61072261b6b3419f83\` FOREIGN KEY (\`changed_by\`) REFERENCES \`users\`(\`id\`) ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`payments\`
            ADD CONSTRAINT \`FK_b2f7b823a21562eeca20e72b006\` FOREIGN KEY (\`order_id\`) REFERENCES \`orders\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`product_media\`
            ADD CONSTRAINT \`FK_e6bb4a69096db4f6a1f5bada151\` FOREIGN KEY (\`product_id\`) REFERENCES \`products\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`product_media\`
            ADD CONSTRAINT \`FK_b38718bc6a3891beb6e620be706\` FOREIGN KEY (\`variant_id\`) REFERENCES \`product_variants\`(\`id\`) ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`returns\`
            ADD CONSTRAINT \`FK_7c0b171a97595625487728ddb3e\` FOREIGN KEY (\`order_id\`) REFERENCES \`orders\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`returns\`
            ADD CONSTRAINT \`FK_e7a28fbb9eb438bc99e7326fc30\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`return_items\`
            ADD CONSTRAINT \`FK_afc80619fe38ae5911b464af463\` FOREIGN KEY (\`return_id\`) REFERENCES \`returns\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`return_items\`
            ADD CONSTRAINT \`FK_c57d201363c110de07d1fd32027\` FOREIGN KEY (\`order_item_id\`) REFERENCES \`order_items\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`return_items\` DROP FOREIGN KEY \`FK_c57d201363c110de07d1fd32027\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`return_items\` DROP FOREIGN KEY \`FK_afc80619fe38ae5911b464af463\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`returns\` DROP FOREIGN KEY \`FK_e7a28fbb9eb438bc99e7326fc30\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`returns\` DROP FOREIGN KEY \`FK_7c0b171a97595625487728ddb3e\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`product_media\` DROP FOREIGN KEY \`FK_b38718bc6a3891beb6e620be706\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`product_media\` DROP FOREIGN KEY \`FK_e6bb4a69096db4f6a1f5bada151\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`payments\` DROP FOREIGN KEY \`FK_b2f7b823a21562eeca20e72b006\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`order_status_history\` DROP FOREIGN KEY \`FK_de5bb51ff61072261b6b3419f83\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`order_status_history\` DROP FOREIGN KEY \`FK_1ca7d5228cf9dc589b60243933c\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`order_items\` DROP FOREIGN KEY \`FK_11836543386b9135a47d54cab70\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`order_items\` DROP FOREIGN KEY \`FK_9263386c35b6b242540f9493b00\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`order_items\` DROP FOREIGN KEY \`FK_145532db85752b29c57d2b7b1f1\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`orders\` DROP FOREIGN KEY \`FK_a922b820eeef29ac1c6800e826a\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`inventory_movements\` DROP FOREIGN KEY \`FK_4a137ccc372acb73821c4dd3991\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`inventory_movements\` DROP FOREIGN KEY \`FK_53f466e8e8bee109aea4cefddf5\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`addresses\` DROP FOREIGN KEY \`FK_16aac8a9f6f9c1dd6bcb75ec023\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`cart_items\` DROP FOREIGN KEY \`FK_de29bab7b2bb3b49c07253275f1\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`cart_items\` DROP FOREIGN KEY \`FK_6385a745d9e12a89b859bb25623\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`carts\` DROP FOREIGN KEY \`FK_2ec1c94a977b940d85a4f498aea\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`users\` DROP FOREIGN KEY \`FK_a2cecd1a3531c0b041e29ba46e1\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`product_variants\` DROP FOREIGN KEY \`FK_1a3f5b3fdcea288c7410726c7d3\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`product_variants\` DROP FOREIGN KEY \`FK_6343513e20e2deab45edfce1316\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`products\` DROP FOREIGN KEY \`FK_1530a6f15d3c79d1b70be98f2be\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`products\` DROP FOREIGN KEY \`FK_9a5f6868c96e0069e699f33e124\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`products\` DROP FOREIGN KEY \`FK_9adb63f24f86528856373f0ab9a\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`categories\` DROP FOREIGN KEY \`FK_88cea2dc9c31951d06437879b40\`
        `);
        await queryRunner.query(`
            DROP TABLE \`return_items\`
        `);
        await queryRunner.query(`
            DROP INDEX \`IDX_df468a204fb304989cea982f20\` ON \`returns\`
        `);
        await queryRunner.query(`
            DROP TABLE \`returns\`
        `);
        await queryRunner.query(`
            DROP TABLE \`product_media\`
        `);
        await queryRunner.query(`
            DROP TABLE \`payments\`
        `);
        await queryRunner.query(`
            DROP TABLE \`order_status_history\`
        `);
        await queryRunner.query(`
            DROP TABLE \`order_items\`
        `);
        await queryRunner.query(`
            DROP INDEX \`IDX_75eba1c6b1a66b09f2a97e6927\` ON \`orders\`
        `);
        await queryRunner.query(`
            DROP TABLE \`orders\`
        `);
        await queryRunner.query(`
            DROP TABLE \`inventory_movements\`
        `);
        await queryRunner.query(`
            DROP TABLE \`addresses\`
        `);
        await queryRunner.query(`
            DROP INDEX \`UQ_cart_items_cart_variant\` ON \`cart_items\`
        `);
        await queryRunner.query(`
            DROP TABLE \`cart_items\`
        `);
        await queryRunner.query(`
            DROP TABLE \`carts\`
        `);
        await queryRunner.query(`
            DROP INDEX \`IDX_a000cca60bcf04454e72769949\` ON \`users\`
        `);
        await queryRunner.query(`
            DROP INDEX \`IDX_97672ac88f789774dd47f7c8be\` ON \`users\`
        `);
        await queryRunner.query(`
            DROP TABLE \`users\`
        `);
        await queryRunner.query(`
            DROP INDEX \`IDX_f6d54f95c31b73fb1bdd8e91d0\` ON \`roles\`
        `);
        await queryRunner.query(`
            DROP TABLE \`roles\`
        `);
        await queryRunner.query(`
            DROP INDEX \`IDX_62124a7ca2686cbaed42f0d3a2\` ON \`product_variants\`
        `);
        await queryRunner.query(`
            DROP INDEX \`IDX_46f236f21640f9da218a063a86\` ON \`product_variants\`
        `);
        await queryRunner.query(`
            DROP TABLE \`product_variants\`
        `);
        await queryRunner.query(`
            DROP INDEX \`IDX_464f927ae360106b783ed0b410\` ON \`products\`
        `);
        await queryRunner.query(`
            DROP TABLE \`products\`
        `);
        await queryRunner.query(`
            DROP INDEX \`IDX_3e8267a546afc4ce1967ba0ab9\` ON \`product_types\`
        `);
        await queryRunner.query(`
            DROP TABLE \`product_types\`
        `);
        await queryRunner.query(`
            DROP INDEX \`IDX_420d9f679d41281f282f5bc7d0\` ON \`categories\`
        `);
        await queryRunner.query(`
            DROP TABLE \`categories\`
        `);
        await queryRunner.query(`
            DROP TABLE \`vendors\`
        `);
        await queryRunner.query(`
            DROP INDEX \`IDX_b15428f362be2200922952dc26\` ON \`brands\`
        `);
        await queryRunner.query(`
            DROP TABLE \`brands\`
        `);
    }

}
```


---

### `src/database/migrations/1791190000000-AuthSecurity.ts`

```ts
import type { MigrationInterface, QueryRunner } from "typeorm";

export class AuthSecurity1791190000000 implements MigrationInterface {
  name = "AuthSecurity1791190000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE `users` ADD `email_verified_at` datetime NULL AFTER `email`",
    );

    await queryRunner.query(`
      CREATE TABLE \`auth_tokens\` (
        \`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
        \`user_id\` bigint UNSIGNED NOT NULL,
        \`type\` varchar(30) NOT NULL,
        \`token_hash\` char(64) NOT NULL,
        \`expires_at\` datetime NOT NULL,
        \`used_at\` datetime NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        UNIQUE INDEX \`IDX_auth_tokens_hash\` (\`token_hash\`),
        INDEX \`IDX_auth_tokens_user_type\` (\`user_id\`, \`type\`),
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_auth_tokens_user\`
          FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`)
          ON DELETE CASCADE ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`refresh_sessions\` (
        \`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
        \`user_id\` bigint UNSIGNED NOT NULL,
        \`token_hash\` char(64) NOT NULL,
        \`expires_at\` datetime NOT NULL,
        \`revoked_at\` datetime NULL,
        \`ip_address\` varchar(64) NULL,
        \`user_agent\` varchar(500) NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        UNIQUE INDEX \`IDX_refresh_sessions_hash\` (\`token_hash\`),
        INDEX \`IDX_refresh_sessions_user\` (\`user_id\`),
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_refresh_sessions_user\`
          FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`)
          ON DELETE CASCADE ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TABLE `refresh_sessions`");
    await queryRunner.query("DROP TABLE `auth_tokens`");
    await queryRunner.query("ALTER TABLE `users` DROP COLUMN `email_verified_at`");
  }
}
```


---

### `src/database/seeds/seed.ts`

```ts
import bcrypt from "bcryptjs";

import { env } from "../../config/env.js";
import { Brand } from "../../modules/brands/brand.entity.js";
import { Category } from "../../modules/categories/category.entity.js";
import { ProductType } from "../../modules/product-types/product-type.entity.js";
import { Role } from "../../modules/role/role.entity.js";
import { User } from "../../modules/users/user.entity.js";
import { AppDataSource } from "../data-source.js";

async function seed() {
  await AppDataSource.initialize();

  await AppDataSource.transaction(async (manager) => {
    const roleRepository = manager.getRepository(Role);
    const categoryRepository = manager.getRepository(Category);
    const productTypeRepository = manager.getRepository(ProductType);
    const brandRepository = manager.getRepository(Brand);

    await roleRepository.upsert(
      [
        {
          name: "Customer",
          code: "CUSTOMER",
          description: "Regular DokanBD customer",
        },
        {
          name: "Administrator",
          code: "ADMIN",
          description: "Manages the DokanBD platform",
        },
        {
          name: "Owner",
          code: "OWNER",
          description: "Business owner with full access",
        },
      ],
      ["code"],
    );

    await categoryRepository.upsert(
      [
        {
          name: "Clothing",
          slug: "clothing",
          isActive: true,
          sortOrder: 1,
        },
        {
          name: "Accessories",
          slug: "accessories",
          isActive: true,
          sortOrder: 2,
        },
        {
          name: "Electronics",
          slug: "electronics",
          isActive: true,
          sortOrder: 3,
        },
        {
          name: "Footwear",
          slug: "footwear",
          isActive: true,
          sortOrder: 4,
        },
      ],
      ["slug"],
    );

    await productTypeRepository.upsert(
      [
        { name: "Clothing", slug: "clothing", isActive: true },
        { name: "Accessories", slug: "accessories", isActive: true },
        { name: "Electronics", slug: "electronics", isActive: true },
        { name: "Footwear", slug: "footwear", isActive: true },
      ],
      ["slug"],
    );

    await brandRepository.upsert(
      [
        { name: "DokanBD", slug: "dokanbd", isActive: true },
        { name: "Generic", slug: "generic", isActive: true },
      ],
      ["slug"],
    );

    if (
      env.SEED_ADMIN_NAME &&
      env.SEED_ADMIN_EMAIL &&
      env.SEED_ADMIN_PHONE &&
      env.SEED_ADMIN_PASSWORD
    ) {
      const adminRole = await roleRepository.findOneByOrFail({ code: "ADMIN" });
      const userRepository = manager.getRepository(User);
      const existingAdmin = await userRepository.findOne({
        where: [
          { email: env.SEED_ADMIN_EMAIL },
          { phone: env.SEED_ADMIN_PHONE },
        ],
        withDeleted: true,
      });
      const passwordHash = await bcrypt.hash(env.SEED_ADMIN_PASSWORD, 12);

      if (existingAdmin) {
        existingAdmin.roleId = adminRole.id;
        existingAdmin.name = env.SEED_ADMIN_NAME;
        existingAdmin.email = env.SEED_ADMIN_EMAIL;
        existingAdmin.emailVerifiedAt = new Date();
        existingAdmin.phone = env.SEED_ADMIN_PHONE;
        existingAdmin.passwordHash = passwordHash;
        existingAdmin.isActive = true;
        existingAdmin.deletedAt = null;
        await userRepository.save(existingAdmin);
      } else {
        await userRepository.save(
          userRepository.create({
            roleId: adminRole.id,
            name: env.SEED_ADMIN_NAME,
            email: env.SEED_ADMIN_EMAIL,
            emailVerifiedAt: new Date(),
            phone: env.SEED_ADMIN_PHONE,
            passwordHash,
            profileImageUrl: null,
            isActive: true,
            lastLoginAt: null,
          }),
        );
      }
    }
  });

  console.log("Seed completed successfully");
}

seed()
  .catch((error: unknown) => {
    console.error("Seed failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });
```


---

### `src/docs/openapi.ts`

```ts
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
  multipart?: "image" | "images";
  parameters?: OpenApiObject[];
  success?: string;
  successDescription?: string;
  notFound?: boolean;
  conflict?: boolean;
  rateLimited?: boolean;
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
    summary: "Upload up to four product images",
    auth: true,
    admin: true,
    parameters: [idParameter("productId", "Product ID")],
    multipart: "images",
    success: "201",
    notFound: true,
  },
  {
    method: "patch",
    path: "/admin/products/{productId}/media/{mediaId}",
    tag: "Admin products",
    summary: "Update product image metadata",
    auth: true,
    admin: true,
    parameters: [
      idParameter("productId", "Product ID"),
      idParameter("mediaId", "Media ID"),
    ],
    body: "UpdateProductMediaRequest",
    notFound: true,
  },
  {
    method: "delete",
    path: "/admin/products/{productId}/media/{mediaId}",
    tag: "Admin products",
    summary: "Delete a product image",
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
    const multiple = endpoint.multipart === "images";
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
              "application/json": { schema: schemaRef("SuccessResponse") },
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
```


---

### `src/middlewares/error-handler.ts`

```ts
import type { ErrorRequestHandler } from "express";
import multer from "multer";
import { ZodError } from "zod";

import { AppError } from "../utils/app-error.js";
import { logger } from "../config/logger.js";

export const errorHandler: ErrorRequestHandler = (
  error,
  _request,
  response,
  _next,
) => {
  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    });
    return;
  }

  if (error instanceof ZodError) {
    response.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "The request data is invalid.",
        details: error.flatten().fieldErrors,
      },
    });
    return;
  }

  if (error instanceof multer.MulterError) {
    response.status(400).json({
      success: false,
      error: {
        code: "UPLOAD_ERROR",
        message: error.message,
      },
    });
    return;
  }

  logger.error({ error }, "Unhandled request error");

  response.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred.",
    },
  });
};
```


---

### `src/middlewares/not-found.ts`

```ts
import type { RequestHandler } from "express";

export const notFound: RequestHandler = (request, response) => {
  response.status(404).json({
    success: false,
    error: {
      code: "ROUTE_NOT_FOUND",
      message: `Route ${request.method} ${request.originalUrl} was not found.`
    }
  });
};
```


---

### `src/modules/addresses/address.controller.ts`

```ts
import type { Request, RequestHandler } from "express";

import { AppError } from "../../utils/app-error.js";
import { addressIdParamsSchema, createAddressSchema, updateAddressSchema } from "./address.schema.js";
import {
  createAddress,
  deleteAddress,
  listAddresses,
  setDefaultAddress,
  updateAddress,
} from "./address.service.js";

function authenticatedUserId(request: Request) {
  if (!request.auth) {
    throw new AppError(401, "AUTHENTICATION_REQUIRED", "Authentication is required.");
  }

  return request.auth.userId;
}

export const list: RequestHandler = async (request, response) => {
  const addresses = await listAddresses(authenticatedUserId(request));

  response.status(200).json({ success: true, data: { addresses } });
};

export const create: RequestHandler = async (request, response) => {
  const input = createAddressSchema.parse(request.body);
  const address = await createAddress(authenticatedUserId(request), input);

  response.status(201).json({ success: true, data: { address } });
};

export const update: RequestHandler = async (request, response) => {
  const { addressId } = addressIdParamsSchema.parse(request.params);
  const input = updateAddressSchema.parse(request.body);
  const address = await updateAddress(authenticatedUserId(request), addressId, input);

  response.status(200).json({ success: true, data: { address } });
};

export const setDefault: RequestHandler = async (request, response) => {
  const { addressId } = addressIdParamsSchema.parse(request.params);
  const address = await setDefaultAddress(authenticatedUserId(request), addressId);

  response.status(200).json({ success: true, data: { address } });
};

export const remove: RequestHandler = async (request, response) => {
  const { addressId } = addressIdParamsSchema.parse(request.params);
  await deleteAddress(authenticatedUserId(request), addressId);

  response.status(204).send();
};
```


---

### `src/modules/addresses/address.entity.ts`

```ts
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import { User } from "../users/user.entity.js";

@Entity({ name: "addresses" })
export class Address {
  @PrimaryGeneratedColumn({
    type: "bigint",
    unsigned: true,
  })
  id!: string;

  @Column({
    name: "user_id",
    type: "bigint",
    unsigned: true,
  })
  userId!: string;

  @ManyToOne(() => User, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ type: "varchar", length: 50, nullable: true })
  label!: string | null;

  @Column({ name: "recipient_name", type: "varchar", length: 100 })
  recipientName!: string;

  @Column({ type: "varchar", length: 20 })
  phone!: string;

  @Column({ name: "address_line_1", type: "varchar", length: 255 })
  addressLine1!: string;

  @Column({
    name: "address_line_2",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  addressLine2!: string | null;

  @Column({ type: "varchar", length: 100 })
  area!: string;

  @Column({ type: "varchar", length: 100 })
  city!: string;

  @Column({ type: "varchar", length: 100 })
  district!: string;

  @Column({ type: "varchar", length: 100 })
  division!: string;

  @Column({
    name: "postal_code",
    type: "varchar",
    length: 20,
    nullable: true,
  })
  postalCode!: string | null;

  @Column({
    type: "varchar",
    length: 100,
    default: "Bangladesh",
  })
  country!: string;

  @Column({ name: "is_inside_dhaka", type: "boolean" })
  isInsideDhaka!: boolean;

  @Column({
    name: "is_default",
    type: "boolean",
    default: false,
  })
  isDefault!: boolean;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "datetime" })
  updatedAt!: Date;

  @DeleteDateColumn({
    name: "deleted_at",
    type: "datetime",
    nullable: true,
  })
  deletedAt!: Date | null;
}
```


---

### `src/modules/addresses/address.routes.ts`

```ts
import { Router } from "express";

import { requireAuth } from "../auth/auth.middleware.js";
import { create, list, remove, setDefault, update } from "./address.controller.js";

export const addressRouter = Router();

addressRouter.use(requireAuth);
addressRouter.get("/", list);
addressRouter.post("/", create);
addressRouter.patch("/:addressId/default", setDefault);
addressRouter.patch("/:addressId", update);
addressRouter.delete("/:addressId", remove);
```


---

### `src/modules/addresses/address.schema.ts`

```ts
import { z } from "zod";

const bangladeshPhoneSchema = z
  .string()
  .trim()
  .regex(/^01[3-9]\d{8}$/, "Use an 11-digit Bangladesh mobile number.");

const optionalText = (maximumLength: number) =>
  z.string().trim().min(1).max(maximumLength).nullable().optional();

const addressFields = {
  label: optionalText(50),
  recipientName: z.string().trim().min(2).max(100),
  phone: bangladeshPhoneSchema,
  addressLine1: z.string().trim().min(3).max(255),
  addressLine2: optionalText(255),
  area: z.string().trim().min(2).max(100),
  city: z.string().trim().min(2).max(100),
  district: z.string().trim().min(2).max(100),
  division: z.string().trim().min(2).max(100),
  postalCode: optionalText(20),
  country: z.string().trim().min(2).max(100).default("Bangladesh"),
  isInsideDhaka: z.boolean(),
};

export const addressIdParamsSchema = z.object({
  addressId: z.string().regex(/^[1-9]\d*$/, "Address ID must be a positive integer."),
});

export const createAddressSchema = z.object({
  ...addressFields,
  isDefault: z.boolean().optional().default(false),
});

export const updateAddressSchema = z
  .object(addressFields)
  .partial()
  .refine((input) => Object.keys(input).length > 0, {
    message: "Provide at least one address field to update.",
  });

export type CreateAddressInput = z.infer<typeof createAddressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
```


---

### `src/modules/addresses/address.service.ts`

```ts
import type { EntityManager } from "typeorm";

import { AppDataSource } from "../../database/data-source.js";
import { AppError } from "../../utils/app-error.js";
import { User } from "../users/user.entity.js";
import { Address } from "./address.entity.js";
import type { CreateAddressInput, UpdateAddressInput } from "./address.schema.js";

function toPublicAddress(address: Address) {
  return {
    id: address.id,
    label: address.label,
    recipientName: address.recipientName,
    phone: address.phone,
    addressLine1: address.addressLine1,
    addressLine2: address.addressLine2,
    area: address.area,
    city: address.city,
    district: address.district,
    division: address.division,
    postalCode: address.postalCode,
    country: address.country,
    isInsideDhaka: address.isInsideDhaka,
    isDefault: address.isDefault,
    createdAt: address.createdAt,
    updatedAt: address.updatedAt,
  };
}

async function lockUser(manager: EntityManager, userId: string) {
  const user = await manager.getRepository(User).findOne({
    where: { id: userId },
    lock: { mode: "pessimistic_write" },
  });

  if (!user || !user.isActive) {
    throw new AppError(404, "USER_NOT_FOUND", "User not found.");
  }
}

async function findOwnedAddress(
  manager: EntityManager,
  userId: string,
  addressId: string,
) {
  const address = await manager.getRepository(Address).findOneBy({
    id: addressId,
    userId,
  });

  if (!address) {
    throw new AppError(404, "ADDRESS_NOT_FOUND", "Address not found.");
  }

  return address;
}

async function clearCurrentDefault(manager: EntityManager, userId: string) {
  await manager.getRepository(Address).update(
    { userId, isDefault: true },
    { isDefault: false },
  );
}

export async function listAddresses(userId: string) {
  const addresses = await AppDataSource.getRepository(Address).find({
    where: { userId },
    order: { isDefault: "DESC", createdAt: "DESC" },
  });

  return addresses.map(toPublicAddress);
}

export async function createAddress(userId: string, input: CreateAddressInput) {
  return AppDataSource.transaction(async (manager) => {
    await lockUser(manager, userId);

    const addressRepository = manager.getRepository(Address);
    const activeAddressCount = await addressRepository.countBy({ userId });
    const shouldBeDefault = input.isDefault || activeAddressCount === 0;

    if (shouldBeDefault) {
      await clearCurrentDefault(manager, userId);
    }

    const address = addressRepository.create({
      userId,
      label: input.label ?? null,
      recipientName: input.recipientName,
      phone: input.phone,
      addressLine1: input.addressLine1,
      addressLine2: input.addressLine2 ?? null,
      area: input.area,
      city: input.city,
      district: input.district,
      division: input.division,
      postalCode: input.postalCode ?? null,
      country: input.country,
      isInsideDhaka: input.isInsideDhaka,
      isDefault: shouldBeDefault,
    });

    await addressRepository.save(address);
    return toPublicAddress(address);
  });
}

export async function updateAddress(
  userId: string,
  addressId: string,
  input: UpdateAddressInput,
) {
  return AppDataSource.transaction(async (manager) => {
    await lockUser(manager, userId);

    const addressRepository = manager.getRepository(Address);
    const address = await findOwnedAddress(manager, userId, addressId);

    addressRepository.merge(address, input);
    await addressRepository.save(address);

    return toPublicAddress(address);
  });
}

export async function setDefaultAddress(userId: string, addressId: string) {
  return AppDataSource.transaction(async (manager) => {
    await lockUser(manager, userId);

    const addressRepository = manager.getRepository(Address);
    const address = await findOwnedAddress(manager, userId, addressId);

    await clearCurrentDefault(manager, userId);
    address.isDefault = true;
    await addressRepository.save(address);

    return toPublicAddress(address);
  });
}

export async function deleteAddress(userId: string, addressId: string) {
  await AppDataSource.transaction(async (manager) => {
    await lockUser(manager, userId);

    const addressRepository = manager.getRepository(Address);
    const address = await findOwnedAddress(manager, userId, addressId);
    const wasDefault = address.isDefault;

    await addressRepository.softRemove(address);

    if (wasDefault) {
      const replacement = await addressRepository.findOne({
        where: { userId },
        order: { createdAt: "DESC" },
      });

      if (replacement) {
        replacement.isDefault = true;
        await addressRepository.save(replacement);
      }
    }
  });
}
```


---

### `src/modules/auth/auth-token.entity.ts`

```ts
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import { User } from "../users/user.entity.js";

export enum AuthTokenType {
  EmailVerification = "EMAIL_VERIFICATION",
  PasswordReset = "PASSWORD_RESET",
}

@Entity({ name: "auth_tokens" })
@Index("IDX_auth_tokens_user_type", ["userId", "type"])
export class AuthToken {
  @PrimaryGeneratedColumn({ type: "bigint", unsigned: true })
  id!: string;

  @Column({ name: "user_id", type: "bigint", unsigned: true })
  userId!: string;

  @ManyToOne(() => User, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ type: "varchar", length: 30 })
  type!: AuthTokenType;

  @Index("IDX_auth_tokens_hash", { unique: true })
  @Column({ name: "token_hash", type: "char", length: 64 })
  tokenHash!: string;

  @Column({ name: "expires_at", type: "datetime" })
  expiresAt!: Date;

  @Column({ name: "used_at", type: "datetime", nullable: true })
  usedAt!: Date | null;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt!: Date;
}
```


---

### `src/modules/auth/auth-token.service.ts`

```ts
import { IsNull, type EntityManager } from "typeorm";

import { AppDataSource } from "../../database/data-source.js";
import { AppError } from "../../utils/app-error.js";
import {
  generateOpaqueToken,
  hashOpaqueToken,
} from "../../utils/opaque-token.js";
import { AuthToken, AuthTokenType } from "./auth-token.entity.js";

export { generateOpaqueToken, hashOpaqueToken } from "../../utils/opaque-token.js";

export async function createOneTimeToken(
  userId: string,
  type: AuthTokenType,
  ttlMinutes: number,
  manager: EntityManager = AppDataSource.manager,
) {
  const repository = manager.getRepository(AuthToken);

  await repository.update(
    { userId, type, usedAt: IsNull() },
    { usedAt: new Date() },
  );

  const rawToken = generateOpaqueToken();
  const token = repository.create({
    userId,
    type,
    tokenHash: hashOpaqueToken(rawToken),
    expiresAt: new Date(Date.now() + ttlMinutes * 60_000),
    usedAt: null,
  });

  await repository.save(token);
  return rawToken;
}

export async function findValidOneTimeToken(
  rawToken: string,
  type: AuthTokenType,
  manager: EntityManager = AppDataSource.manager,
) {
  const token = await manager.getRepository(AuthToken).findOne({
    where: {
      tokenHash: hashOpaqueToken(rawToken),
      type,
      usedAt: IsNull(),
    },
    relations: { user: { role: true } },
  });

  if (!token || token.expiresAt.getTime() <= Date.now()) {
    throw new AppError(
      400,
      "INVALID_OR_EXPIRED_TOKEN",
      "The token is invalid or expired.",
    );
  }

  return token;
}
```


---

### `src/modules/auth/auth.controller.ts`

```ts
import type { CookieOptions, Request, RequestHandler } from "express";

import { env } from "../../config/env.js";
import { AppError } from "../../utils/app-error.js";
import {
  forgotPasswordSchema,
  loginSchema,
  refreshTokenSchema,
  registerSchema,
  resendVerificationSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from "./auth.schema.js";
import {
  forgotPassword as forgotPasswordService,
  getCurrentUser,
  loginUser,
  registerUser,
  resendVerification as resendVerificationService,
  resetPassword as resetPasswordService,
  revokeAllRefreshTokens,
  revokeRefreshToken,
  rotateRefreshToken,
  verifyEmail as verifyEmailService,
} from "./auth.service.js";

const REFRESH_COOKIE = "dokanbd_refresh_token";

function refreshCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/v1/auth",
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  };
}

function sessionMetadata(request: Request) {
  return {
    ipAddress: request.ip ?? null,
    userAgent: request.header("user-agent") ?? null,
  };
}

function readRefreshToken(request: Request) {
  const body = refreshTokenSchema.parse(request.body ?? {});
  const cookie = request.cookies?.[REFRESH_COOKIE];
  return body.refreshToken ?? (typeof cookie === "string" ? cookie : undefined);
}

export const register: RequestHandler = async (request, response) => {
  const result = await registerUser(registerSchema.parse(request.body));
  response.status(201).json({ success: true, data: result });
};

export const login: RequestHandler = async (request, response) => {
  const result = await loginUser(
    loginSchema.parse(request.body),
    sessionMetadata(request),
  );
  const { refreshToken, ...publicResult } = result;

  response.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions());
  response.status(200).json({ success: true, data: publicResult });
};

export const refresh: RequestHandler = async (request, response) => {
  const currentToken = readRefreshToken(request);

  if (!currentToken) {
    throw new AppError(
      401,
      "REFRESH_TOKEN_REQUIRED",
      "A refresh token is required.",
    );
  }

  const result = await rotateRefreshToken(
    currentToken,
    sessionMetadata(request),
  );
  const { refreshToken, ...publicResult } = result;

  response.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions());
  response.status(200).json({ success: true, data: publicResult });
};

export const logout: RequestHandler = async (request, response) => {
  const token = readRefreshToken(request);

  if (token) {
    await revokeRefreshToken(token);
  }

  response.clearCookie(REFRESH_COOKIE, refreshCookieOptions());
  response.status(200).json({ success: true, message: "Logged out." });
};

export const logoutAll: RequestHandler = async (request, response) => {
  if (!request.auth) {
    throw new AppError(401, "AUTHENTICATION_REQUIRED", "Authentication is required.");
  }

  await revokeAllRefreshTokens(request.auth.userId);
  response.clearCookie(REFRESH_COOKIE, refreshCookieOptions());
  response.status(200).json({
    success: true,
    message: "All sessions have been logged out.",
  });
};

export const verifyEmail: RequestHandler = async (request, response) => {
  await verifyEmailService(verifyEmailSchema.parse(request.body));
  response.status(200).json({
    success: true,
    message: "Email verified successfully.",
  });
};

export const resendVerification: RequestHandler = async (request, response) => {
  const developmentToken = await resendVerificationService(
    resendVerificationSchema.parse(request.body),
  );

  response.status(200).json({
    success: true,
    message:
      "If the account exists and needs verification, an email has been sent.",
    ...(developmentToken ? { developmentToken } : {}),
  });
};

export const forgotPassword: RequestHandler = async (request, response) => {
  const developmentToken = await forgotPasswordService(
    forgotPasswordSchema.parse(request.body),
  );

  response.status(200).json({
    success: true,
    message: "If the account exists, a password-reset email has been sent.",
    ...(developmentToken ? { developmentToken } : {}),
  });
};

export const resetPassword: RequestHandler = async (request, response) => {
  await resetPasswordService(resetPasswordSchema.parse(request.body));
  response.status(200).json({
    success: true,
    message: "Password reset successfully. Please log in again.",
  });
};

export const me: RequestHandler = async (request, response) => {
  if (!request.auth) {
    throw new AppError(401, "AUTHENTICATION_REQUIRED", "Authentication is required.");
  }

  const user = await getCurrentUser(request.auth.userId);
  response.status(200).json({ success: true, data: { user } });
};
```


---

### `src/modules/auth/auth.middleware.ts`

```ts
import type { RequestHandler } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";

import { env } from "../../config/env.js";
import { AppError } from "../../utils/app-error.js";

export const requireAuth: RequestHandler = (request, _response, next) => {
  const authorization = request.header("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    next(new AppError(401, "AUTHENTICATION_REQUIRED", "Authentication is required."));
    return;
  }

  const token = authorization.slice("Bearer ".length).trim();

  try {
    const payload = jwt.verify(token, env.JWT_SECRET, {
      algorithms: ["HS256"],
    });

    if (
      typeof payload === "string" ||
      !payload.sub ||
      typeof (payload as JwtPayload).role !== "string"
    ) {
      throw new Error("Invalid token payload");
    }

    request.auth = {
      userId: payload.sub,
      roleCode: (payload as JwtPayload).role as string,
    };

    next();
  } catch {
    next(new AppError(401, "INVALID_TOKEN", "The access token is invalid or expired."));
  }
};
```


---

### `src/modules/auth/auth.routes.ts`

```ts
import { Router } from "express";
import { rateLimit } from "express-rate-limit";

import {
  forgotPassword,
  login,
  logout,
  logoutAll,
  me,
  refresh,
  register,
  resendVerification,
  resetPassword,
  verifyEmail,
} from "./auth.controller.js";
import { requireAuth } from "./auth.middleware.js";

export const authRouter = Router();

const authenticationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 1000,
  standardHeaders: true,
  legacyHeaders: false,
});

const emailActionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 1000,
  standardHeaders: true,
  legacyHeaders: false,
});

authRouter.post("/register", authenticationLimiter, register);
authRouter.post("/login", authenticationLimiter, login);
authRouter.post("/refresh", authenticationLimiter, refresh);
authRouter.post("/logout", logout);
authRouter.post("/logout-all", requireAuth, logoutAll);
authRouter.post("/verify-email", emailActionLimiter, verifyEmail);
authRouter.post(
  "/resend-verification",
  emailActionLimiter,
  resendVerification,
);
authRouter.post("/forgot-password", emailActionLimiter, forgotPassword);
authRouter.post("/reset-password", emailActionLimiter, resetPassword);
authRouter.get("/me", requireAuth, me);
```


---

### `src/modules/auth/auth.schema.ts`

```ts
import { z } from "zod";

const bangladeshPhoneSchema = z
  .string()
  .trim()
  .regex(/^01[3-9]\d{8}$/, "Use an 11-digit Bangladesh mobile number.");

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: bangladeshPhoneSchema,
  email: z.string().trim().email().toLowerCase().optional(),
  password: z.string().min(8).max(72),
});

export const loginSchema = z.object({
  identifier: z.string().trim().min(1),
  password: z.string().min(1).max(72),
});

export const verifyEmailSchema = z.object({
  token: z.string().length(64),
});

export const resendVerificationSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
});

export const forgotPasswordSchema = resendVerificationSchema;

export const resetPasswordSchema = z.object({
  token: z.string().length(64),
  password: z.string().min(8).max(72),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().length(64).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;


/*Rules:

Phone format: 01XXXXXXXXX.
Email is optional during registration; omit it when not provided.
Password must contain 8–72 characters.
identifier accepts either phone or email during login.*/
```


---

### `src/modules/auth/auth.service.ts`

```ts
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { IsNull, type EntityManager } from "typeorm";

import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";
import { AppDataSource } from "../../database/data-source.js";
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "../../services/mail.service.js";
import { AppError } from "../../utils/app-error.js";
import { Role } from "../role/role.entity.js";
import { User } from "../users/user.entity.js";
import { AuthToken, AuthTokenType } from "./auth-token.entity.js";
import {
  createOneTimeToken,
  findValidOneTimeToken,
  generateOpaqueToken,
  hashOpaqueToken,
} from "./auth-token.service.js";
import { RefreshSession } from "./refresh-session.entity.js";
import type {
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResendVerificationInput,
  ResetPasswordInput,
  VerifyEmailInput,
} from "./auth.schema.js";

const PASSWORD_ROUNDS = 12;

interface SessionMetadata {
  ipAddress: string | null;
  userAgent: string | null;
}

function createAccessToken(userId: string, roleCode: string) {
  return jwt.sign({ role: roleCode }, env.JWT_SECRET, {
    algorithm: "HS256",
    subject: userId,
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

function toPublicUser(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerifiedAt: user.emailVerifiedAt,
    phone: user.phone,
    profileImageUrl: user.profileImageUrl,
    isActive: user.isActive,
    role: {
      id: user.role.id,
      code: user.role.code,
      name: user.role.name,
    },
    createdAt: user.createdAt,
  };
}

async function createRefreshSession(
  userId: string,
  metadata: SessionMetadata,
  manager: EntityManager = AppDataSource.manager,
) {
  const rawToken = generateOpaqueToken();
  const repository = manager.getRepository(RefreshSession);

  await repository.save(
    repository.create({
      userId,
      tokenHash: hashOpaqueToken(rawToken),
      expiresAt: new Date(
        Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
      ),
      revokedAt: null,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent?.slice(0, 500) ?? null,
    }),
  );

  return rawToken;
}

function verificationUrl(rawToken: string) {
  return `${env.WEB_ORIGIN}/verify-email?token=${rawToken}`;
}

function passwordResetUrl(rawToken: string) {
  return `${env.WEB_ORIGIN}/reset-password?token=${rawToken}`;
}

async function deliverVerificationEmail(user: User, rawToken: string) {
  if (!user.email || !env.SMTP_HOST || !env.MAIL_FROM) {
    return false;
  }

  try {
    await sendVerificationEmail({
      to: user.email,
      recipientName: user.name,
      actionUrl: verificationUrl(rawToken),
    });
    return true;
  } catch (error) {
    logger.error({ error, userId: user.id }, "Verification email delivery failed");
    return false;
  }
}

async function deliverPasswordResetEmail(user: User, rawToken: string) {
  if (!user.email || !env.SMTP_HOST || !env.MAIL_FROM) {
    return false;
  }

  try {
    await sendPasswordResetEmail({
      to: user.email,
      recipientName: user.name,
      actionUrl: passwordResetUrl(rawToken),
    });
    return true;
  } catch (error) {
    logger.error({ error, userId: user.id }, "Password-reset email delivery failed");
    return false;
  }
}

export async function registerUser(input: RegisterInput) {
  const userRepository = AppDataSource.getRepository(User);
  const roleRepository = AppDataSource.getRepository(Role);
  const duplicateQuery = userRepository
    .createQueryBuilder("user")
    .withDeleted()
    .where("user.phone = :phone", { phone: input.phone });

  if (input.email) {
    duplicateQuery.orWhere("LOWER(user.email) = :email", {
      email: input.email,
    });
  }

  if (await duplicateQuery.getOne()) {
    throw new AppError(
      409,
      "USER_ALREADY_EXISTS",
      "A user with this phone or email already exists.",
    );
  }

  const customerRole = await roleRepository.findOneBy({ code: "CUSTOMER" });

  if (!customerRole) {
    throw new AppError(
      500,
      "CUSTOMER_ROLE_MISSING",
      "The CUSTOMER role has not been seeded.",
    );
  }

  if (bcrypt.truncates(input.password)) {
    throw new AppError(400, "PASSWORD_TOO_LONG", "The password is too long.");
  }

  const user = userRepository.create({
    roleId: customerRole.id,
    name: input.name,
    email: input.email ?? null,
    emailVerifiedAt: null,
    phone: input.phone,
    passwordHash: await bcrypt.hash(input.password, PASSWORD_ROUNDS),
    profileImageUrl: null,
    isActive: true,
    lastLoginAt: null,
  });

  await userRepository.save(user);
  user.role = customerRole;

  let developmentVerificationToken: string | undefined;

  if (user.email) {
    const rawToken = await createOneTimeToken(
      user.id,
      AuthTokenType.EmailVerification,
      env.EMAIL_VERIFICATION_TTL_MINUTES,
    );
    const delivered = await deliverVerificationEmail(user, rawToken);

    if (env.NODE_ENV === "development" && !delivered) {
      developmentVerificationToken = rawToken;
    }
  }

  return {
    user: toPublicUser(user),
    ...(developmentVerificationToken
      ? { developmentVerificationToken }
      : {}),
  };
}

export async function loginUser(input: LoginInput, metadata: SessionMetadata) {
  const userRepository = AppDataSource.getRepository(User);
  const identifier = input.identifier.toLowerCase();
  const query = userRepository
    .createQueryBuilder("user")
    .addSelect("user.passwordHash")
    .leftJoinAndSelect("user.role", "role");

  if (identifier.includes("@")) {
    query.where("LOWER(user.email) = :identifier", { identifier });
  } else {
    query.where("user.phone = :identifier", { identifier });
  }

  const user = await query.getOne();

  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Invalid credentials.");
  }

  if (!user.isActive) {
    throw new AppError(403, "ACCOUNT_DISABLED", "This account is disabled.");
  }

  user.lastLoginAt = new Date();
  await userRepository.save(user);

  return {
    accessToken: createAccessToken(user.id, user.role.code),
    refreshToken: await createRefreshSession(user.id, metadata),
    tokenType: "Bearer",
    expiresIn: env.JWT_EXPIRES_IN,
    user: toPublicUser(user),
  };
}

export async function rotateRefreshToken(
  rawToken: string,
  metadata: SessionMetadata,
) {
  return AppDataSource.transaction(async (manager) => {
    const repository = manager.getRepository(RefreshSession);
    const session = await repository.findOne({
      where: {
        tokenHash: hashOpaqueToken(rawToken),
        revokedAt: IsNull(),
      },
      relations: { user: { role: true } },
    });

    if (
      !session ||
      session.expiresAt.getTime() <= Date.now() ||
      !session.user.isActive
    ) {
      throw new AppError(
        401,
        "INVALID_REFRESH_TOKEN",
        "The refresh token is invalid or expired.",
      );
    }

    session.revokedAt = new Date();
    await repository.save(session);

    return {
      accessToken: createAccessToken(session.user.id, session.user.role.code),
      refreshToken: await createRefreshSession(
        session.user.id,
        metadata,
        manager,
      ),
      tokenType: "Bearer",
      expiresIn: env.JWT_EXPIRES_IN,
    };
  });
}

export async function revokeRefreshToken(rawToken: string) {
  await AppDataSource.getRepository(RefreshSession).update(
    { tokenHash: hashOpaqueToken(rawToken), revokedAt: IsNull() },
    { revokedAt: new Date() },
  );
}

export async function revokeAllRefreshTokens(userId: string) {
  await AppDataSource.getRepository(RefreshSession).update(
    { userId, revokedAt: IsNull() },
    { revokedAt: new Date() },
  );
}

export async function verifyEmail(input: VerifyEmailInput) {
  await AppDataSource.transaction(async (manager) => {
    const token = await findValidOneTimeToken(
      input.token,
      AuthTokenType.EmailVerification,
      manager,
    );

    if (!token.user.emailVerifiedAt) {
      token.user.emailVerifiedAt = new Date();
      await manager.getRepository(User).save(token.user);
    }

    token.usedAt = new Date();
    await manager.getRepository(AuthToken).save(token);
  });
}

export async function resendVerification(input: ResendVerificationInput) {
  const user = await AppDataSource.getRepository(User)
    .createQueryBuilder("user")
    .leftJoinAndSelect("user.role", "role")
    .where("LOWER(user.email) = :email", { email: input.email })
    .getOne();

  if (!user || !user.isActive || user.emailVerifiedAt) {
    return undefined;
  }

  const rawToken = await createOneTimeToken(
    user.id,
    AuthTokenType.EmailVerification,
    env.EMAIL_VERIFICATION_TTL_MINUTES,
  );
  const delivered = await deliverVerificationEmail(user, rawToken);

  return env.NODE_ENV === "development" && !delivered
    ? rawToken
    : undefined;
}

export async function forgotPassword(input: ForgotPasswordInput) {
  const user = await AppDataSource.getRepository(User)
    .createQueryBuilder("user")
    .leftJoinAndSelect("user.role", "role")
    .where("LOWER(user.email) = :email", { email: input.email })
    .getOne();

  if (!user || !user.isActive) {
    return undefined;
  }

  const rawToken = await createOneTimeToken(
    user.id,
    AuthTokenType.PasswordReset,
    env.PASSWORD_RESET_TTL_MINUTES,
  );
  const delivered = await deliverPasswordResetEmail(user, rawToken);

  return env.NODE_ENV === "development" && !delivered
    ? rawToken
    : undefined;
}

export async function resetPassword(input: ResetPasswordInput) {
  if (bcrypt.truncates(input.password)) {
    throw new AppError(400, "PASSWORD_TOO_LONG", "The password is too long.");
  }

  await AppDataSource.transaction(async (manager) => {
    const token = await findValidOneTimeToken(
      input.token,
      AuthTokenType.PasswordReset,
      manager,
    );
    const now = new Date();

    await manager.getRepository(User).update(token.userId, {
      passwordHash: await bcrypt.hash(input.password, PASSWORD_ROUNDS),
    });
    token.usedAt = now;
    await manager.getRepository(AuthToken).save(token);
    await manager.getRepository(RefreshSession).update(
      { userId: token.userId, revokedAt: IsNull() },
      { revokedAt: now },
    );
  });
}

export async function getCurrentUser(userId: string) {
  const user = await AppDataSource.getRepository(User).findOne({
    where: { id: userId },
    relations: { role: true },
  });

  if (!user || !user.isActive) {
    throw new AppError(404, "USER_NOT_FOUND", "User not found.");
  }

  return toPublicUser(user);
}
```


---

### `src/modules/auth/authorization.middleware.ts`

```ts
import type { RequestHandler } from "express";

import { AppDataSource } from "../../database/data-source.js";
import { AppError } from "../../utils/app-error.js";
import { User } from "../users/user.entity.js";

export function requireRole(...allowedRoles: string[]): RequestHandler {
  return (request, _response, next) => {
    if (!request.auth) {
      next(
        new AppError(
          401,
          "AUTHENTICATION_REQUIRED",
          "Authentication is required.",
        ),
      );
      return;
    }

    if (!allowedRoles.includes(request.auth.roleCode)) {
      next(new AppError(403, "FORBIDDEN", "You cannot perform this action."));
      return;
    }

    next();
  };
}

export const requireVerifiedEmail: RequestHandler = async (
  request,
  _response,
  next,
) => {
  if (!request.auth) {
    next(
      new AppError(401, "AUTHENTICATION_REQUIRED", "Authentication is required."),
    );
    return;
  }

  const user = await AppDataSource.getRepository(User).findOneBy({
    id: request.auth.userId,
  });

  if (!user?.email || !user.emailVerifiedAt) {
    next(
      new AppError(
        403,
        "EMAIL_VERIFICATION_REQUIRED",
        "Please verify your email before continuing.",
      ),
    );
    return;
  }

  next();
};
```


---

### `src/modules/auth/refresh-session.entity.ts`

```ts
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import { User } from "../users/user.entity.js";

@Entity({ name: "refresh_sessions" })
@Index("IDX_refresh_sessions_user", ["userId"])
export class RefreshSession {
  @PrimaryGeneratedColumn({ type: "bigint", unsigned: true })
  id!: string;

  @Column({ name: "user_id", type: "bigint", unsigned: true })
  userId!: string;

  @ManyToOne(() => User, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Index("IDX_refresh_sessions_hash", { unique: true })
  @Column({ name: "token_hash", type: "char", length: 64 })
  tokenHash!: string;

  @Column({ name: "expires_at", type: "datetime" })
  expiresAt!: Date;

  @Column({ name: "revoked_at", type: "datetime", nullable: true })
  revokedAt!: Date | null;

  @Column({ name: "ip_address", type: "varchar", length: 64, nullable: true })
  ipAddress!: string | null;

  @Column({ name: "user_agent", type: "varchar", length: 500, nullable: true })
  userAgent!: string | null;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt!: Date;
}
```


---

### `src/modules/brands/brand.entity.ts`

```ts
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity({ name: "brands" })
export class Brand {
  @PrimaryGeneratedColumn({ type: "bigint", unsigned: true })
  id!: string;

  @Column({ type: "varchar", length: 100 })
  name!: string;

  @Column({ type: "varchar", length: 120, unique: true })
  slug!: string;

  @Column({ name: "logo_url", type: "varchar", length: 500, nullable: true })
  logoUrl!: string | null;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({ name: "is_active", type: "boolean", default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "datetime" })
  updatedAt!: Date;
}
```


---

### `src/modules/carts/cart-item.entity.ts`

```ts
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from "typeorm";

import { ProductVariant } from "../products/product-variant.entity.js";
import { Cart } from "./cart.entity.js";

@Entity({ name: "cart_items" })
@Unique("UQ_cart_items_cart_variant", ["cartId", "productVariantId"])
export class CartItem {
  @PrimaryGeneratedColumn({ type: "bigint", unsigned: true })
  id!: string;

  @Column({ name: "cart_id", type: "bigint", unsigned: true })
  cartId!: string;

  @ManyToOne(() => Cart, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "cart_id" })
  cart!: Cart;

  @Column({ name: "product_variant_id", type: "bigint", unsigned: true })
  productVariantId!: string;

  @ManyToOne(() => ProductVariant, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "product_variant_id" })
  productVariant!: ProductVariant;

  @Column({ type: "int" })
  quantity!: number;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "datetime" })
  updatedAt!: Date;
}
```


---

### `src/modules/carts/cart.controller.ts`

```ts
import type { Request, RequestHandler } from "express";

import { AppError } from "../../utils/app-error.js";
import { addCartItemSchema, cartItemIdParamsSchema, updateCartItemSchema } from "./cart.schema.js";
import {
  addCartItem,
  clearCart,
  getActiveCart,
  removeCartItem,
  updateCartItem,
} from "./cart.service.js";

function authenticatedUserId(request: Request) {
  if (!request.auth) {
    throw new AppError(401, "AUTHENTICATION_REQUIRED", "Authentication is required.");
  }

  return request.auth.userId;
}

export const get: RequestHandler = async (request, response) => {
  const cart = await getActiveCart(authenticatedUserId(request));

  response.status(200).json({ success: true, data: { cart } });
};

export const addItem: RequestHandler = async (request, response) => {
  const input = addCartItemSchema.parse(request.body);
  const cart = await addCartItem(authenticatedUserId(request), input);

  response.status(200).json({ success: true, data: { cart } });
};

export const updateItem: RequestHandler = async (request, response) => {
  const { itemId } = cartItemIdParamsSchema.parse(request.params);
  const input = updateCartItemSchema.parse(request.body);
  const cart = await updateCartItem(authenticatedUserId(request), itemId, input);

  response.status(200).json({ success: true, data: { cart } });
};

export const removeItem: RequestHandler = async (request, response) => {
  const { itemId } = cartItemIdParamsSchema.parse(request.params);
  const cart = await removeCartItem(authenticatedUserId(request), itemId);

  response.status(200).json({ success: true, data: { cart } });
};

export const clear: RequestHandler = async (request, response) => {
  const cart = await clearCart(authenticatedUserId(request));

  response.status(200).json({ success: true, data: { cart } });
};
```


---

### `src/modules/carts/cart.entity.ts`

```ts
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import { User } from "../users/user.entity.js";

@Entity({ name: "carts" })
export class Cart {
  @PrimaryGeneratedColumn({ type: "bigint", unsigned: true })
  id!: string;

  @Column({ name: "user_id", type: "bigint", unsigned: true })
  userId!: string;

  @ManyToOne(() => User, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ type: "varchar", length: 30 })
  status!: string;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "datetime" })
  updatedAt!: Date;
}
```


---

### `src/modules/carts/cart.routes.ts`

```ts
import { Router } from "express";

import { requireAuth } from "../auth/auth.middleware.js";
import { addItem, clear, get, removeItem, updateItem } from "./cart.controller.js";

export const cartRouter = Router();

cartRouter.use(requireAuth);
cartRouter.get("/", get);
cartRouter.post("/items", addItem);
cartRouter.patch("/items/:itemId", updateItem);
cartRouter.delete("/items", clear);
cartRouter.delete("/items/:itemId", removeItem);
```


---

### `src/modules/carts/cart.schema.ts`

```ts
import { z } from "zod";

const databaseIdSchema = z
  .string()
  .regex(/^[1-9]\d*$/, "ID must be a positive integer.");

const quantitySchema = z
  .number()
  .int()
  .positive()
  .max(2_147_483_647, "Quantity is too large.");

export const cartItemIdParamsSchema = z.object({
  itemId: databaseIdSchema,
});

export const addCartItemSchema = z.object({
  productVariantId: databaseIdSchema,
  quantity: quantitySchema,
});

export const updateCartItemSchema = z.object({
  quantity: quantitySchema,
});

export type AddCartItemInput = z.infer<typeof addCartItemSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
```


---

### `src/modules/carts/cart.service.ts`

```ts
import type { EntityManager } from "typeorm";

import { AppDataSource } from "../../database/data-source.js";
import { AppError } from "../../utils/app-error.js";
import { ProductVariant } from "../products/product-variant.entity.js";
import { User } from "../users/user.entity.js";
import { CartItem } from "./cart-item.entity.js";
import { Cart } from "./cart.entity.js";
import type { AddCartItemInput, UpdateCartItemInput } from "./cart.schema.js";

const ACTIVE_CART_STATUS = "ACTIVE";

function toMinorUnits(value: string) {
  const match = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(value);

  if (!match) {
    throw new Error(`Invalid database money value: ${value}`);
  }

  const sign = match[1] === "-" ? -1n : 1n;
  const whole = BigInt(match[2] ?? "0");
  const fraction = BigInt((match[3] ?? "").padEnd(2, "0"));

  return sign * (whole * 100n + fraction);
}

function formatMinorUnits(value: bigint) {
  const sign = value < 0n ? "-" : "";
  const absolute = value < 0n ? -value : value;
  const whole = absolute / 100n;
  const fraction = (absolute % 100n).toString().padStart(2, "0");

  return `${sign}${whole}.${fraction}`;
}

async function lockUser(manager: EntityManager, userId: string) {
  const user = await manager.getRepository(User).findOne({
    where: { id: userId },
    lock: { mode: "pessimistic_write" },
  });

  if (!user || !user.isActive) {
    throw new AppError(404, "USER_NOT_FOUND", "User not found.");
  }
}

async function findActiveCart(manager: EntityManager, userId: string) {
  return manager.getRepository(Cart).findOne({
    where: { userId, status: ACTIVE_CART_STATUS },
    order: { createdAt: "DESC" },
  });
}

async function getOrCreateActiveCart(manager: EntityManager, userId: string) {
  await lockUser(manager, userId);

  const existingCart = await findActiveCart(manager, userId);

  if (existingCart) {
    return existingCart;
  }

  const cartRepository = manager.getRepository(Cart);
  const cart = cartRepository.create({
    userId,
    status: ACTIVE_CART_STATUS,
  });

  return cartRepository.save(cart);
}

async function findAvailableVariant(
  manager: EntityManager,
  productVariantId: string,
) {
  const variant = await manager
    .getRepository(ProductVariant)
    .createQueryBuilder("variant")
    .innerJoinAndSelect("variant.product", "product")
    .where("variant.id = :productVariantId", { productVariantId })
    .andWhere("variant.is_active = :isActive", { isActive: true })
    .andWhere("product.is_active = :isActive", { isActive: true })
    .getOne();

  if (!variant) {
    throw new AppError(
      409,
      "PRODUCT_VARIANT_UNAVAILABLE",
      "The selected product variant is unavailable.",
    );
  }

  return variant;
}

function assertStock(variant: ProductVariant, quantity: number) {
  if (quantity > variant.stockQuantity) {
    throw new AppError(
      409,
      "INSUFFICIENT_STOCK",
      `Only ${variant.stockQuantity} item(s) are currently available.`,
    );
  }
}

async function touchCart(manager: EntityManager, cart: Cart) {
  cart.updatedAt = new Date();
  await manager.getRepository(Cart).save(cart);
}

async function buildCartView(cartId: string, userId: string) {
  const cart = await AppDataSource.getRepository(Cart).findOneBy({
    id: cartId,
    userId,
    status: ACTIVE_CART_STATUS,
  });

  if (!cart) {
    throw new AppError(404, "CART_NOT_FOUND", "Active cart not found.");
  }

  const items = await AppDataSource.getRepository(CartItem)
    .createQueryBuilder("item")
    .withDeleted()
    .innerJoinAndSelect("item.productVariant", "variant")
    .innerJoinAndSelect("variant.product", "product")
    .where("item.cart_id = :cartId", { cartId })
    .orderBy("item.created_at", "ASC")
    .getMany();

  let subtotal = 0n;
  let totalQuantity = 0;

  const publicItems = items.map((item) => {
    const unitPrice = toMinorUnits(item.productVariant.price);
    const lineTotal = unitPrice * BigInt(item.quantity);
    const product = item.productVariant.product;
    const available =
      item.productVariant.deletedAt === null &&
      product.deletedAt === null &&
      item.productVariant.isActive &&
      product.isActive &&
      item.quantity <= item.productVariant.stockQuantity;

    subtotal += lineTotal;
    totalQuantity += item.quantity;

    return {
      id: item.id,
      quantity: item.quantity,
      unitPrice: formatMinorUnits(unitPrice),
      lineTotal: formatMinorUnits(lineTotal),
      available,
      productVariant: {
        id: item.productVariant.id,
        sku: item.productVariant.sku,
        barcode: item.productVariant.barcode,
        variantName: item.productVariant.variantName,
        color: item.productVariant.color,
        size: item.productVariant.size,
        stockQuantity: item.productVariant.stockQuantity,
      },
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
      },
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  });

  return {
    id: cart.id,
    status: cart.status,
    items: publicItems,
    totals: {
      itemCount: publicItems.length,
      totalQuantity,
      subtotal: formatMinorUnits(subtotal),
      currency: "BDT",
    },
    createdAt: cart.createdAt,
    updatedAt: cart.updatedAt,
  };
}

export async function getActiveCart(userId: string) {
  const cart = await AppDataSource.transaction((manager) =>
    getOrCreateActiveCart(manager, userId),
  );

  return buildCartView(cart.id, userId);
}

export async function addCartItem(userId: string, input: AddCartItemInput) {
  const cartId = await AppDataSource.transaction(async (manager) => {
    const cart = await getOrCreateActiveCart(manager, userId);
    const variant = await findAvailableVariant(manager, input.productVariantId);
    const itemRepository = manager.getRepository(CartItem);
    const existingItem = await itemRepository.findOneBy({
      cartId: cart.id,
      productVariantId: variant.id,
    });
    const nextQuantity = (existingItem?.quantity ?? 0) + input.quantity;

    if (nextQuantity > 2_147_483_647) {
      throw new AppError(400, "QUANTITY_TOO_LARGE", "Quantity is too large.");
    }

    assertStock(variant, nextQuantity);

    const item = existingItem ??
      itemRepository.create({
        cartId: cart.id,
        productVariantId: variant.id,
        quantity: 0,
      });

    item.quantity = nextQuantity;
    await itemRepository.save(item);
    await touchCart(manager, cart);

    return cart.id;
  });

  return buildCartView(cartId, userId);
}

export async function updateCartItem(
  userId: string,
  itemId: string,
  input: UpdateCartItemInput,
) {
  const cartId = await AppDataSource.transaction(async (manager) => {
    const cart = await getOrCreateActiveCart(manager, userId);
    const itemRepository = manager.getRepository(CartItem);
    const item = await itemRepository.findOneBy({ id: itemId, cartId: cart.id });

    if (!item) {
      throw new AppError(404, "CART_ITEM_NOT_FOUND", "Cart item not found.");
    }

    const variant = await findAvailableVariant(manager, item.productVariantId);
    assertStock(variant, input.quantity);

    item.quantity = input.quantity;
    await itemRepository.save(item);
    await touchCart(manager, cart);

    return cart.id;
  });

  return buildCartView(cartId, userId);
}

export async function removeCartItem(userId: string, itemId: string) {
  const cartId = await AppDataSource.transaction(async (manager) => {
    const cart = await getOrCreateActiveCart(manager, userId);
    const itemRepository = manager.getRepository(CartItem);
    const item = await itemRepository.findOneBy({ id: itemId, cartId: cart.id });

    if (!item) {
      throw new AppError(404, "CART_ITEM_NOT_FOUND", "Cart item not found.");
    }

    await itemRepository.remove(item);
    await touchCart(manager, cart);

    return cart.id;
  });

  return buildCartView(cartId, userId);
}

export async function clearCart(userId: string) {
  const cartId = await AppDataSource.transaction(async (manager) => {
    const cart = await getOrCreateActiveCart(manager, userId);

    await manager.getRepository(CartItem).delete({ cartId: cart.id });
    await touchCart(manager, cart);

    return cart.id;
  });

  return buildCartView(cartId, userId);
}
```


---

### `src/modules/categories/category.controller.ts`

```ts
import type { RequestHandler } from "express";

import {
  adminCategoryListQuerySchema,
  categoryIdParamsSchema,
  createCategorySchema,
  updateCategorySchema,
} from "./category.schema.js";
import {
  createCategory,
  deleteCategory,
  listAdminCategories,
  listPublicCategoryTree,
  restoreCategory,
  updateCategory,
} from "./category.service.js";

export const listPublicCategories: RequestHandler = async (_request, response) => {
  const categories = await listPublicCategoryTree();

  response.status(200).json({ success: true, data: { categories } });
};

export const listCategoriesForAdmin: RequestHandler = async (
  request,
  response,
) => {
  const query = adminCategoryListQuerySchema.parse(request.query);
  const categories = await listAdminCategories(query.includeDeleted);

  response.status(200).json({ success: true, data: { categories } });
};

export const createCategoryForAdmin: RequestHandler = async (
  request,
  response,
) => {
  const input = createCategorySchema.parse(request.body);
  const category = await createCategory(input);

  response.status(201).json({ success: true, data: { category } });
};

export const updateCategoryForAdmin: RequestHandler = async (
  request,
  response,
) => {
  const { id } = categoryIdParamsSchema.parse(request.params);
  const input = updateCategorySchema.parse(request.body);
  const category = await updateCategory(id, input);

  response.status(200).json({ success: true, data: { category } });
};

export const deleteCategoryForAdmin: RequestHandler = async (
  request,
  response,
) => {
  const { id } = categoryIdParamsSchema.parse(request.params);
  await deleteCategory(id);

  response.status(204).send();
};

export const restoreCategoryForAdmin: RequestHandler = async (
  request,
  response,
) => {
  const { id } = categoryIdParamsSchema.parse(request.params);
  const category = await restoreCategory(id);

  response.status(200).json({ success: true, data: { category } });
};
```


---

### `src/modules/categories/category.entity.ts`

```ts
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity({ name: "categories" })
export class Category {
  @PrimaryGeneratedColumn({ type: "bigint", unsigned: true })
  id!: string;

  @Column({ name: "parent_id", type: "bigint", unsigned: true, nullable: true })
  parentId!: string | null;

  @ManyToOne(() => Category, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "parent_id" })
  parent!: Category | null;

  @Column({ type: "varchar", length: 100 })
  name!: string;

  @Column({ type: "varchar", length: 120, unique: true })
  slug!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({ name: "image_url", type: "varchar", length: 500, nullable: true })
  imageUrl!: string | null;

  @Column({ name: "is_active", type: "boolean", default: true })
  isActive!: boolean;

  @Column({ name: "sort_order", type: "int", default: 0 })
  sortOrder!: number;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "datetime" })
  updatedAt!: Date;

  @DeleteDateColumn({ name: "deleted_at", type: "datetime", nullable: true })
  deletedAt!: Date | null;
}
```


---

### `src/modules/categories/category.routes.ts`

```ts
import { Router } from "express";

import { requireAuth } from "../auth/auth.middleware.js";
import { requireRole } from "../auth/authorization.middleware.js";
import {
  createCategoryForAdmin,
  deleteCategoryForAdmin,
  listCategoriesForAdmin,
  listPublicCategories,
  restoreCategoryForAdmin,
  updateCategoryForAdmin,
} from "./category.controller.js";

export const categoryRouter = Router();
export const adminCategoryRouter = Router();

categoryRouter.get("/", listPublicCategories);

adminCategoryRouter.use(requireAuth, requireRole("ADMIN", "OWNER"));
adminCategoryRouter.get("/", listCategoriesForAdmin);
adminCategoryRouter.post("/", createCategoryForAdmin);
adminCategoryRouter.patch("/:id", updateCategoryForAdmin);
adminCategoryRouter.delete("/:id", deleteCategoryForAdmin);
adminCategoryRouter.post("/:id/restore", restoreCategoryForAdmin);
```


---

### `src/modules/categories/category.schema.ts`

```ts
import { z } from "zod";

const entityIdSchema = z
  .string()
  .regex(/^[1-9]\d*$/, "The id must be a positive integer.");

const nullableUrlSchema = z
  .union([z.string().trim().url().max(500), z.null()])
  .optional();

export const categoryIdParamsSchema = z.object({
  id: entityIdSchema,
});

export const createCategorySchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    slug: z
      .string()
      .trim()
      .min(1)
      .max(120)
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Use lowercase letters, numbers, and single hyphens.",
      )
      .optional(),
    description: z.union([z.string().trim().max(10_000), z.null()]).optional(),
    imageUrl: nullableUrlSchema,
    parentId: z.union([entityIdSchema, z.null()]).optional(),
    isActive: z.boolean().optional(),
    sortOrder: z.coerce.number().int().min(0).max(1_000_000).optional(),
  })
  .strict();

export const updateCategorySchema = createCategorySchema
  .partial()
  .refine((input) => Object.keys(input).length > 0, {
    message: "Provide at least one category field to update.",
  });

export const adminCategoryListQuerySchema = z.object({
  includeDeleted: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
```


---

### `src/modules/categories/category.service.ts`

```ts
import { AppDataSource } from "../../database/data-source.js";
import { AppError } from "../../utils/app-error.js";
import { Category } from "./category.entity.js";
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
} from "./category.schema.js";

export interface CategoryTreeItem {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  children: CategoryTreeItem[];
}

function categoryRepository() {
  return AppDataSource.getRepository(Category);
}

function createSlug(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120)
    .replace(/-+$/g, "");

  if (!slug) {
    throw new AppError(
      400,
      "CATEGORY_SLUG_REQUIRED",
      "Provide an English slug when the category name cannot form one.",
    );
  }

  return slug;
}

function toAdminCategory(category: Category) {
  return {
    id: category.id,
    parentId: category.parentId,
    name: category.name,
    slug: category.slug,
    description: category.description,
    imageUrl: category.imageUrl,
    isActive: category.isActive,
    sortOrder: category.sortOrder,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
    deletedAt: category.deletedAt,
  };
}

async function assertSlugAvailable(slug: string, ignoredId?: string) {
  const query = categoryRepository()
    .createQueryBuilder("category")
    .withDeleted()
    .where("LOWER(category.slug) = :slug", { slug: slug.toLowerCase() });

  if (ignoredId) {
    query.andWhere("category.id != :ignoredId", { ignoredId });
  }

  if (await query.getOne()) {
    throw new AppError(
      409,
      "CATEGORY_SLUG_EXISTS",
      "A category with this slug already exists.",
    );
  }
}

async function getActiveParent(parentId: string) {
  const parent = await categoryRepository().findOneBy({
    id: parentId,
    isActive: true,
  });

  if (!parent) {
    throw new AppError(
      400,
      "CATEGORY_PARENT_INVALID",
      "The parent category does not exist or is inactive.",
    );
  }

  return parent;
}

async function assertNoParentCycle(categoryId: string, parentId: string | null) {
  let currentId = parentId;
  const visited = new Set<string>();

  while (currentId) {
    if (currentId === categoryId || visited.has(currentId)) {
      throw new AppError(
        409,
        "CATEGORY_PARENT_CYCLE",
        "A category cannot be its own parent or descendant.",
      );
    }

    visited.add(currentId);
    const current = await categoryRepository().findOneBy({ id: currentId });

    if (!current) {
      throw new AppError(
        400,
        "CATEGORY_PARENT_INVALID",
        "The parent category does not exist or is deleted.",
      );
    }

    currentId = current.parentId;
  }
}

export async function listPublicCategoryTree() {
  const categories = await categoryRepository().find({
    where: { isActive: true },
    order: { sortOrder: "ASC", name: "ASC" },
  });

  const byId = new Map<string, CategoryTreeItem>();

  for (const category of categories) {
    byId.set(category.id, {
      id: category.id,
      parentId: category.parentId,
      name: category.name,
      slug: category.slug,
      description: category.description,
      imageUrl: category.imageUrl,
      sortOrder: category.sortOrder,
      children: [],
    });
  }

  const roots: CategoryTreeItem[] = [];

  for (const item of byId.values()) {
    if (!item.parentId) {
      roots.push(item);
      continue;
    }

    // If an ancestor is inactive or deleted, the whole branch stays hidden
    // instead of making a child category appear as a new root.
    byId.get(item.parentId)?.children.push(item);
  }

  return roots;
}

export async function listAdminCategories(includeDeleted: boolean) {
  const categories = await categoryRepository().find({
    withDeleted: includeDeleted,
    order: { sortOrder: "ASC", name: "ASC" },
  });

  return categories.map(toAdminCategory);
}

export async function createCategory(input: CreateCategoryInput) {
  const slug = input.slug ?? createSlug(input.name);
  await assertSlugAvailable(slug);

  if (input.parentId) {
    await getActiveParent(input.parentId);
  }

  const repository = categoryRepository();
  const category = repository.create({
    name: input.name,
    slug,
    description: input.description ?? null,
    imageUrl: input.imageUrl ?? null,
    parentId: input.parentId ?? null,
    isActive: input.isActive ?? true,
    sortOrder: input.sortOrder ?? 0,
  });

  await repository.save(category);
  return toAdminCategory(category);
}

export async function updateCategory(
  categoryId: string,
  input: UpdateCategoryInput,
) {
  const repository = categoryRepository();
  const category = await repository.findOneBy({ id: categoryId });

  if (!category) {
    throw new AppError(404, "CATEGORY_NOT_FOUND", "Category not found.");
  }

  if (input.slug !== undefined) {
    await assertSlugAvailable(input.slug, category.id);
    category.slug = input.slug;
  }

  if (input.parentId !== undefined) {
    if (input.parentId) {
      await getActiveParent(input.parentId);
    }

    await assertNoParentCycle(category.id, input.parentId);
    category.parentId = input.parentId;
  }

  if (input.name !== undefined) category.name = input.name;
  if (input.description !== undefined) category.description = input.description;
  if (input.imageUrl !== undefined) category.imageUrl = input.imageUrl;
  if (input.isActive !== undefined) category.isActive = input.isActive;
  if (input.sortOrder !== undefined) category.sortOrder = input.sortOrder;

  await repository.save(category);
  return toAdminCategory(category);
}

export async function deleteCategory(categoryId: string) {
  const repository = categoryRepository();
  const category = await repository.findOneBy({ id: categoryId });

  if (!category) {
    throw new AppError(404, "CATEGORY_NOT_FOUND", "Category not found.");
  }

  const childCount = await repository.countBy({ parentId: category.id });

  if (childCount > 0) {
    throw new AppError(
      409,
      "CATEGORY_HAS_CHILDREN",
      "Move or delete this category's child categories first.",
    );
  }

  await repository.softRemove(category);
}

export async function restoreCategory(categoryId: string) {
  const repository = categoryRepository();
  const category = await repository.findOne({
    where: { id: categoryId },
    withDeleted: true,
  });

  if (!category) {
    throw new AppError(404, "CATEGORY_NOT_FOUND", "Category not found.");
  }

  if (!category.deletedAt) {
    throw new AppError(
      409,
      "CATEGORY_NOT_DELETED",
      "This category is not deleted.",
    );
  }

  if (category.parentId) {
    await getActiveParent(category.parentId);
  }

  await repository.restore(category.id);
  category.deletedAt = null;
  return toAdminCategory(category);
}
```


---

### `src/modules/health/health.controller.ts`

```ts
import type { RequestHandler } from "express";

import { AppDataSource } from "../../database/data-source.js";

export const getHealth: RequestHandler = async (_request, response, next) => {
  try {
    await AppDataSource.query("SELECT 1");

    response.status(200).json({
      success: true,
      message: "DokanBD API is running",
      database: "connected"
    });
  } catch (error) {
    next(error);
  }
};
```


---

### `src/modules/health/health.routes.ts`

```ts
import { Router } from "express";

import { getHealth } from "./health.controller.js";

export const healthRouter = Router();

healthRouter.get("/", getHealth);
```


---

### `src/modules/inventory/inventory-movement.entity.ts`

```ts
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import { ProductVariant } from "../products/product-variant.entity.js";
import { User } from "../users/user.entity.js";

@Entity({ name: "inventory_movements" })
export class InventoryMovement {
  @PrimaryGeneratedColumn({ type: "bigint", unsigned: true })
  id!: string;

  @Column({ name: "product_variant_id", type: "bigint", unsigned: true })
  productVariantId!: string;

  @ManyToOne(() => ProductVariant, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "product_variant_id" })
  productVariant!: ProductVariant;

  @Column({ name: "movement_type", type: "varchar", length: 30 })
  movementType!: string;

  @Column({ type: "int" })
  quantity!: number;

  @Column({ name: "quantity_before", type: "int", nullable: true })
  quantityBefore!: number | null;

  @Column({ name: "quantity_after", type: "int", nullable: true })
  quantityAfter!: number | null;

  @Column({ name: "reference_type", type: "varchar", length: 50, nullable: true })
  referenceType!: string | null;

  @Column({ name: "reference_id", type: "bigint", unsigned: true, nullable: true })
  referenceId!: string | null;

  @Column({ type: "varchar", length: 500, nullable: true })
  note!: string | null;

  @Column({ name: "created_by", type: "bigint", unsigned: true, nullable: true })
  createdById!: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "created_by" })
  createdBy!: User | null;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt!: Date;
}
```


---

### `src/modules/orders/order-admin.controller.ts`

```ts
import type { Request, RequestHandler } from "express";

import { AppError } from "../../utils/app-error.js";
import {
  adminOrderListQuerySchema,
  adminOrderStatusSchema,
  orderIdParamsSchema,
} from "./order.schema.js";
import {
  getAdminOrder,
  listAdminOrders,
  updateAdminOrderStatus,
} from "./order.service.js";

function authenticatedUserId(request: Request) {
  if (!request.auth) {
    throw new AppError(401, "AUTHENTICATION_REQUIRED", "Authentication is required.");
  }

  return request.auth.userId;
}

export const listOrdersForAdmin: RequestHandler = async (request, response) => {
  const filters = adminOrderListQuerySchema.parse(request.query);
  const result = await listAdminOrders(filters);

  response.status(200).json({ success: true, data: result });
};

export const getOrderForAdmin: RequestHandler = async (request, response) => {
  const { orderId } = orderIdParamsSchema.parse(request.params);
  const order = await getAdminOrder(orderId);

  response.status(200).json({ success: true, data: { order } });
};

export const changeOrderStatus: RequestHandler = async (request, response) => {
  const { orderId } = orderIdParamsSchema.parse(request.params);
  const input = adminOrderStatusSchema.parse(request.body);
  const order = await updateAdminOrderStatus(
    authenticatedUserId(request),
    orderId,
    input,
  );

  response.status(200).json({ success: true, data: { order } });
};
```


---

### `src/modules/orders/order-admin.routes.ts`

```ts
import { Router } from "express";

import { requireAuth } from "../auth/auth.middleware.js";
import { requireRole } from "../auth/authorization.middleware.js";
import {
  changeOrderStatus,
  getOrderForAdmin,
  listOrdersForAdmin,
} from "./order-admin.controller.js";

export const adminOrderRouter = Router();

adminOrderRouter.use(requireAuth, requireRole("ADMIN", "OWNER"));
adminOrderRouter.get("/", listOrdersForAdmin);
adminOrderRouter.get("/:orderId", getOrderForAdmin);
adminOrderRouter.patch("/:orderId/status", changeOrderStatus);
```


---

### `src/modules/orders/order-item.entity.ts`

```ts
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import { ProductVariant } from "../products/product-variant.entity.js";
import { Product } from "../products/product.entity.js";
import { Order } from "./order.entity.js";

@Entity({ name: "order_items" })
export class OrderItem {
  @PrimaryGeneratedColumn({ type: "bigint", unsigned: true })
  id!: string;

  @Column({ name: "order_id", type: "bigint", unsigned: true })
  orderId!: string;

  @ManyToOne(() => Order, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "order_id" })
  order!: Order;

  @Column({ name: "product_id", type: "bigint", unsigned: true, nullable: true })
  productId!: string | null;

  @ManyToOne(() => Product, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "product_id" })
  product!: Product | null;

  @Column({ name: "product_variant_id", type: "bigint", unsigned: true, nullable: true })
  productVariantId!: string | null;

  @ManyToOne(() => ProductVariant, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "product_variant_id" })
  productVariant!: ProductVariant | null;

  @Column({ name: "product_name", type: "varchar", length: 200 })
  productName!: string;

  @Column({ name: "variant_name", type: "varchar", length: 150, nullable: true })
  variantName!: string | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  sku!: string | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  barcode!: string | null;

  @Column({ type: "int" })
  quantity!: number;

  @Column({ name: "unit_price", type: "decimal", precision: 12, scale: 2 })
  unitPrice!: string;

  @Column({ name: "unit_cost", type: "decimal", precision: 12, scale: 2, nullable: true })
  unitCost!: string | null;

  @Column({ name: "discount_amount", type: "decimal", precision: 12, scale: 2, default: 0 })
  discountAmount!: string;

  @Column({ name: "line_total", type: "decimal", precision: 12, scale: 2 })
  lineTotal!: string;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt!: Date;
}
```


---

### `src/modules/orders/order-status-history.entity.ts`

```ts
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import { User } from "../users/user.entity.js";
import { Order } from "./order.entity.js";

@Entity({ name: "order_status_history" })
export class OrderStatusHistory {
  @PrimaryGeneratedColumn({ type: "bigint", unsigned: true })
  id!: string;

  @Column({ name: "order_id", type: "bigint", unsigned: true })
  orderId!: string;

  @ManyToOne(() => Order, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "order_id" })
  order!: Order;

  @Column({ name: "old_status", type: "varchar", length: 30, nullable: true })
  oldStatus!: string | null;

  @Column({ name: "new_status", type: "varchar", length: 30 })
  newStatus!: string;

  @Column({ name: "changed_by", type: "bigint", unsigned: true, nullable: true })
  changedById!: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "changed_by" })
  changedBy!: User | null;

  @Column({ type: "varchar", length: 500, nullable: true })
  note!: string | null;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt!: Date;
}
```


---

### `src/modules/orders/order.controller.ts`

```ts
import type { Request, RequestHandler } from "express";

import { AppError } from "../../utils/app-error.js";
import {
  cancelOrderSchema,
  checkoutSchema,
  customerOrderListQuerySchema,
  orderIdParamsSchema,
} from "./order.schema.js";
import {
  cancelCustomerOrder,
  checkout,
  getCustomerOrder,
  listCustomerOrders,
} from "./order.service.js";

function authenticatedUserId(request: Request) {
  if (!request.auth) {
    throw new AppError(401, "AUTHENTICATION_REQUIRED", "Authentication is required.");
  }

  return request.auth.userId;
}

export const checkoutCart: RequestHandler = async (request, response) => {
  const input = checkoutSchema.parse(request.body);
  const order = await checkout(authenticatedUserId(request), input);

  response.status(201).json({ success: true, data: { order } });
};

export const listOwnOrders: RequestHandler = async (request, response) => {
  const filters = customerOrderListQuerySchema.parse(request.query);
  const result = await listCustomerOrders(authenticatedUserId(request), filters);

  response.status(200).json({ success: true, data: result });
};

export const getOwnOrder: RequestHandler = async (request, response) => {
  const { orderId } = orderIdParamsSchema.parse(request.params);
  const order = await getCustomerOrder(authenticatedUserId(request), orderId);

  response.status(200).json({ success: true, data: { order } });
};

export const cancelOwnOrder: RequestHandler = async (request, response) => {
  const { orderId } = orderIdParamsSchema.parse(request.params);
  const input = cancelOrderSchema.parse(request.body ?? {});
  const order = await cancelCustomerOrder(
    authenticatedUserId(request),
    orderId,
    input,
  );

  response.status(200).json({ success: true, data: { order } });
};
```


---

### `src/modules/orders/order.entity.ts`

```ts
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import { User } from "../users/user.entity.js";

@Entity({ name: "orders" })
export class Order {
  @PrimaryGeneratedColumn({ type: "bigint", unsigned: true })
  id!: string;

  @Column({ name: "order_number", type: "varchar", length: 50, unique: true })
  orderNumber!: string;

  @Column({ name: "user_id", type: "bigint", unsigned: true })
  userId!: string;

  @ManyToOne(() => User, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ name: "order_status", type: "varchar", length: 30 })
  orderStatus!: string;

  @Column({ name: "payment_method", type: "varchar", length: 30, default: "COD" })
  paymentMethod!: string;

  @Column({ name: "payment_status", type: "varchar", length: 30, default: "PENDING" })
  paymentStatus!: string;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  subtotal!: string;

  @Column({ name: "discount_total", type: "decimal", precision: 12, scale: 2, default: 0 })
  discountTotal!: string;

  @Column({ name: "delivery_charge", type: "decimal", precision: 12, scale: 2 })
  deliveryCharge!: string;

  @Column({ name: "grand_total", type: "decimal", precision: 12, scale: 2 })
  grandTotal!: string;

  @Column({ type: "varchar", length: 10, default: "BDT" })
  currency!: string;

  @Column({ name: "recipient_name", type: "varchar", length: 100 })
  recipientName!: string;

  @Column({ name: "recipient_phone", type: "varchar", length: 20 })
  recipientPhone!: string;

  @Column({ name: "address_line_1", type: "varchar", length: 255 })
  addressLine1!: string;

  @Column({ name: "address_line_2", type: "varchar", length: 255, nullable: true })
  addressLine2!: string | null;

  @Column({ type: "varchar", length: 100 })
  area!: string;

  @Column({ type: "varchar", length: 100 })
  city!: string;

  @Column({ type: "varchar", length: 100 })
  district!: string;

  @Column({ type: "varchar", length: 100 })
  division!: string;

  @Column({ name: "postal_code", type: "varchar", length: 20, nullable: true })
  postalCode!: string | null;

  @Column({ type: "varchar", length: 100, default: "Bangladesh" })
  country!: string;

  @Column({ name: "is_inside_dhaka", type: "boolean" })
  isInsideDhaka!: boolean;

  @Column({ name: "customer_note", type: "text", nullable: true })
  customerNote!: string | null;

  @Column({ name: "admin_note", type: "text", nullable: true })
  adminNote!: string | null;

  @Column({ name: "placed_at", type: "datetime" })
  placedAt!: Date;

  @Column({ name: "confirmed_at", type: "datetime", nullable: true })
  confirmedAt!: Date | null;

  @Column({ name: "shipped_at", type: "datetime", nullable: true })
  shippedAt!: Date | null;

  @Column({ name: "delivered_at", type: "datetime", nullable: true })
  deliveredAt!: Date | null;

  @Column({ name: "cancelled_at", type: "datetime", nullable: true })
  cancelledAt!: Date | null;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "datetime" })
  updatedAt!: Date;
}
```


---

### `src/modules/orders/order.routes.ts`

```ts
import { Router } from "express";

import { requireAuth } from "../auth/auth.middleware.js";
import {
  cancelOwnOrder,
  checkoutCart,
  getOwnOrder,
  listOwnOrders,
} from "./order.controller.js";

export const orderRouter = Router();

orderRouter.use(requireAuth);
orderRouter.post("/checkout", checkoutCart);
orderRouter.get("/", listOwnOrders);
orderRouter.get("/:orderId", getOwnOrder);
orderRouter.post("/:orderId/cancel", cancelOwnOrder);
```


---

### `src/modules/orders/order.schema.ts`

```ts
import { z } from "zod";

const databaseIdSchema = z
  .string()
  .regex(/^[1-9]\d*$/, "ID must be a positive integer.");

export const orderStatusSchema = z.enum([
  "PENDING",
  "CONFIRMED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
]);

const paymentStatusSchema = z.enum(["PENDING", "PAID", "FAILED", "REFUNDED"]);

const optionalNoteSchema = z
  .string()
  .trim()
  .min(1)
  .max(500)
  .nullable()
  .optional();

export const orderIdParamsSchema = z.object({
  orderId: databaseIdSchema,
});

export const checkoutSchema = z.object({
  addressId: databaseIdSchema,
  customerNote: z.string().trim().min(1).max(2000).nullable().optional(),
});

export const cancelOrderSchema = z.object({
  note: optionalNoteSchema,
});

export const customerOrderListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: orderStatusSchema.optional(),
});

export const adminOrderListQuerySchema = customerOrderListQuerySchema.extend({
  paymentStatus: paymentStatusSchema.optional(),
  userId: databaseIdSchema.optional(),
  search: z.string().trim().min(1).max(100).optional(),
});

export const adminOrderStatusSchema = z.object({
  status: z.enum(["CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"]),
  note: optionalNoteSchema,
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;
export type CustomerOrderListQuery = z.infer<typeof customerOrderListQuerySchema>;
export type AdminOrderListQuery = z.infer<typeof adminOrderListQuerySchema>;
export type AdminOrderStatusInput = z.infer<typeof adminOrderStatusSchema>;
export type OrderStatus = z.infer<typeof orderStatusSchema>;
```


---

### `src/modules/orders/order.service.ts`

```ts
import { randomBytes } from "node:crypto";

import type { EntityManager, SelectQueryBuilder } from "typeorm";

import { env } from "../../config/env.js";
import { AppDataSource } from "../../database/data-source.js";
import { AppError } from "../../utils/app-error.js";
import { Address } from "../addresses/address.entity.js";
import { CartItem } from "../carts/cart-item.entity.js";
import { Cart } from "../carts/cart.entity.js";
import { InventoryMovement } from "../inventory/inventory-movement.entity.js";
import { ProductVariant } from "../products/product-variant.entity.js";
import { User } from "../users/user.entity.js";
import { OrderItem } from "./order-item.entity.js";
import { OrderStatusHistory } from "./order-status-history.entity.js";
import { Order } from "./order.entity.js";
import type {
  AdminOrderListQuery,
  AdminOrderStatusInput,
  CancelOrderInput,
  CheckoutInput,
  CustomerOrderListQuery,
  OrderStatus,
} from "./order.schema.js";

const ACTIVE_CART_STATUS = "ACTIVE";
const CONVERTED_CART_STATUS = "CONVERTED";
const CURRENCY = "BDT";
const PAYMENT_METHOD = "COD";
const PENDING_PAYMENT_STATUS = "PENDING";
const MAX_MONEY_MINOR_UNITS = 999_999_999_999n;

const NEXT_ORDER_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  PENDING: "CONFIRMED",
  CONFIRMED: "SHIPPED",
  SHIPPED: "DELIVERED",
};

function toMinorUnits(value: string) {
  const match = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(value);

  if (!match) {
    throw new Error(`Invalid database money value: ${value}`);
  }

  const sign = match[1] === "-" ? -1n : 1n;
  const whole = BigInt(match[2] ?? "0");
  const fraction = BigInt((match[3] ?? "").padEnd(2, "0"));

  return sign * (whole * 100n + fraction);
}

function numberToMinorUnits(value: number) {
  const minorUnits = Math.round(value * 100);

  if (
    !Number.isSafeInteger(minorUnits) ||
    minorUnits < 0 ||
    BigInt(minorUnits) > MAX_MONEY_MINOR_UNITS
  ) {
    throw new Error("Invalid delivery charge configuration.");
  }

  return BigInt(minorUnits);
}

function formatMinorUnits(value: bigint) {
  const sign = value < 0n ? "-" : "";
  const absolute = value < 0n ? -value : value;
  const whole = absolute / 100n;
  const fraction = (absolute % 100n).toString().padStart(2, "0");

  return `${sign}${whole}.${fraction}`;
}

function createOrderNumber() {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const randomPart = randomBytes(6).toString("hex").toUpperCase();

  return `DBD-${date}-${randomPart}`;
}

async function lockActiveUser(manager: EntityManager, userId: string) {
  const user = await manager.getRepository(User).findOne({
    where: { id: userId },
    lock: { mode: "pessimistic_write" },
  });

  if (!user || !user.isActive) {
    throw new AppError(404, "USER_NOT_FOUND", "User not found.");
  }
}

async function loadLockedVariants(
  manager: EntityManager,
  variantIds: string[],
  includeUnavailable = false,
) {
  if (variantIds.length === 0) {
    return [];
  }

  const query = manager
    .getRepository(ProductVariant)
    .createQueryBuilder("variant");

  if (includeUnavailable) {
    query.withDeleted();
  }

  query
    .innerJoinAndSelect("variant.product", "product")
    .where("variant.id IN (:...variantIds)", { variantIds })
    .orderBy("variant.id", "ASC")
    .setLock("pessimistic_write");

  return query.getMany();
}

function toOrderBase(order: Order) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    orderStatus: order.orderStatus,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    subtotal: order.subtotal,
    discountTotal: order.discountTotal,
    deliveryCharge: order.deliveryCharge,
    grandTotal: order.grandTotal,
    currency: order.currency,
    recipientName: order.recipientName,
    recipientPhone: order.recipientPhone,
    deliveryAddress: {
      addressLine1: order.addressLine1,
      addressLine2: order.addressLine2,
      area: order.area,
      city: order.city,
      district: order.district,
      division: order.division,
      postalCode: order.postalCode,
      country: order.country,
      isInsideDhaka: order.isInsideDhaka,
    },
    customerNote: order.customerNote,
    placedAt: order.placedAt,
    confirmedAt: order.confirmedAt,
    shippedAt: order.shippedAt,
    deliveredAt: order.deliveredAt,
    cancelledAt: order.cancelledAt,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

function toOrderItem(item: OrderItem, includeCost: boolean) {
  return {
    id: item.id,
    productId: item.productId,
    productVariantId: item.productVariantId,
    productName: item.productName,
    variantName: item.variantName,
    sku: item.sku,
    barcode: item.barcode,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    discountAmount: item.discountAmount,
    lineTotal: item.lineTotal,
    ...(includeCost ? { unitCost: item.unitCost } : {}),
  };
}

function toStatusHistory(
  history: OrderStatusHistory,
  includeInternalDetails: boolean,
) {
  return {
    id: history.id,
    oldStatus: history.oldStatus,
    newStatus: history.newStatus,
    createdAt: history.createdAt,
    ...(includeInternalDetails
      ? { changedById: history.changedById, note: history.note }
      : {}),
  };
}

async function loadItemCounts(orderIds: string[]) {
  if (orderIds.length === 0) {
    return new Map<string, { itemCount: number; totalQuantity: number }>();
  }

  const rows = await AppDataSource.getRepository(OrderItem)
    .createQueryBuilder("item")
    .select("item.order_id", "orderId")
    .addSelect("COUNT(item.id)", "itemCount")
    .addSelect("SUM(item.quantity)", "totalQuantity")
    .where("item.order_id IN (:...orderIds)", { orderIds })
    .groupBy("item.order_id")
    .getRawMany<{
      orderId: string;
      itemCount: string;
      totalQuantity: string;
    }>();

  return new Map(
    rows.map((row) => [
      String(row.orderId),
      {
        itemCount: Number(row.itemCount),
        totalQuantity: Number(row.totalQuantity),
      },
    ]),
  );
}

async function buildOrderDetail(order: Order, includeInternalDetails: boolean) {
  const [items, statusHistory] = await Promise.all([
    AppDataSource.getRepository(OrderItem).find({
      where: { orderId: order.id },
      order: { id: "ASC" },
    }),
    AppDataSource.getRepository(OrderStatusHistory).find({
      where: { orderId: order.id },
      order: { createdAt: "ASC", id: "ASC" },
    }),
  ]);

  return {
    ...toOrderBase(order),
    ...(includeInternalDetails
      ? {
          user: {
            id: order.user.id,
            name: order.user.name,
            email: order.user.email,
            phone: order.user.phone,
          },
          adminNote: order.adminNote,
        }
      : {}),
    items: items.map((item) => toOrderItem(item, includeInternalDetails)),
    statusHistory: statusHistory.map((history) =>
      toStatusHistory(history, includeInternalDetails),
    ),
  };
}

function applyListFilters(
  query: SelectQueryBuilder<Order>,
  filters: CustomerOrderListQuery | AdminOrderListQuery,
) {
  if (filters.status) {
    query.andWhere("order.order_status = :orderStatus", {
      orderStatus: filters.status,
    });
  }

  if ("paymentStatus" in filters && filters.paymentStatus) {
    query.andWhere("order.payment_status = :paymentStatus", {
      paymentStatus: filters.paymentStatus,
    });
  }

  if ("userId" in filters && filters.userId) {
    query.andWhere("order.user_id = :filterUserId", {
      filterUserId: filters.userId,
    });
  }

  if ("search" in filters && filters.search) {
    query.andWhere(
      "(order.order_number LIKE :search OR order.recipient_name LIKE :search OR order.recipient_phone LIKE :search)",
      { search: `%${filters.search}%` },
    );
  }
}

async function cancelLockedOrder(
  manager: EntityManager,
  order: Order,
  actorUserId: string,
  note: string | null,
  allowConfirmed: boolean,
) {
  const cancellableStatuses = allowConfirmed
    ? ["PENDING", "CONFIRMED"]
    : ["PENDING"];

  if (!cancellableStatuses.includes(order.orderStatus)) {
    throw new AppError(
      409,
      "ORDER_CANNOT_BE_CANCELLED",
      `An order in ${order.orderStatus} status cannot be cancelled.`,
    );
  }

  if (order.paymentStatus !== PENDING_PAYMENT_STATUS) {
    throw new AppError(
      409,
      "PAID_ORDER_REQUIRES_REFUND",
      "This order must be refunded through the payment workflow.",
    );
  }

  const orderItems = await manager.getRepository(OrderItem).find({
    where: { orderId: order.id },
    order: { productVariantId: "ASC", id: "ASC" },
  });
  const quantityByVariant = new Map<string, number>();

  for (const item of orderItems) {
    if (!item.productVariantId) {
      throw new AppError(
        409,
        "STOCK_RESTORE_UNAVAILABLE",
        "Stock for this order cannot be restored automatically.",
      );
    }

    quantityByVariant.set(
      item.productVariantId,
      (quantityByVariant.get(item.productVariantId) ?? 0) + item.quantity,
    );
  }

  const variantIds = [...quantityByVariant.keys()].sort((left, right) =>
    BigInt(left) < BigInt(right) ? -1 : BigInt(left) > BigInt(right) ? 1 : 0,
  );
  const variants = await loadLockedVariants(manager, variantIds, true);

  if (variants.length !== variantIds.length) {
    throw new AppError(
      409,
      "STOCK_RESTORE_UNAVAILABLE",
      "Stock for this order cannot be restored automatically.",
    );
  }

  const movements: InventoryMovement[] = [];

  for (const variant of variants) {
    const quantity = quantityByVariant.get(variant.id) ?? 0;
    const quantityBefore = variant.stockQuantity;
    const quantityAfter = quantityBefore + quantity;

    if (!Number.isSafeInteger(quantityAfter) || quantityAfter > 2_147_483_647) {
      throw new AppError(
        409,
        "STOCK_LIMIT_EXCEEDED",
        "Stock cannot be restored because the quantity limit would be exceeded.",
      );
    }

    variant.stockQuantity = quantityAfter;
    movements.push(
      manager.getRepository(InventoryMovement).create({
        productVariantId: variant.id,
        movementType: "CANCELLATION",
        quantity,
        quantityBefore,
        quantityAfter,
        referenceType: "ORDER",
        referenceId: order.id,
        note: `Stock restored after cancellation of ${order.orderNumber}.`,
        createdById: actorUserId,
      }),
    );
  }

  await manager.getRepository(ProductVariant).save(variants);
  await manager.getRepository(InventoryMovement).save(movements);

  const previousStatus = order.orderStatus;
  order.orderStatus = "CANCELLED";
  order.cancelledAt = new Date();
  await manager.getRepository(Order).save(order);

  await manager.getRepository(OrderStatusHistory).save(
    manager.getRepository(OrderStatusHistory).create({
      orderId: order.id,
      oldStatus: previousStatus,
      newStatus: "CANCELLED",
      changedById: actorUserId,
      note,
    }),
  );
}

export async function checkout(userId: string, input: CheckoutInput) {
  const orderId = await AppDataSource.transaction(async (manager) => {
    await lockActiveUser(manager, userId);

    const address = await manager.getRepository(Address).findOneBy({
      id: input.addressId,
      userId,
    });

    if (!address) {
      throw new AppError(404, "ADDRESS_NOT_FOUND", "Address not found.");
    }

    const cart = await manager.getRepository(Cart).findOne({
      where: { userId, status: ACTIVE_CART_STATUS },
      order: { createdAt: "DESC" },
      lock: { mode: "pessimistic_write" },
    });

    if (!cart) {
      throw new AppError(409, "ACTIVE_CART_NOT_FOUND", "Active cart not found.");
    }

    const cartItems = await manager.getRepository(CartItem).find({
      where: { cartId: cart.id },
      order: { productVariantId: "ASC", id: "ASC" },
    });

    if (cartItems.length === 0) {
      throw new AppError(409, "CART_EMPTY", "Your cart is empty.");
    }

    const variantIds = cartItems.map((item) => item.productVariantId);
    const variants = await loadLockedVariants(manager, variantIds);
    const variantById = new Map(variants.map((variant) => [variant.id, variant]));

    if (variantById.size !== new Set(variantIds).size) {
      throw new AppError(
        409,
        "CART_ITEM_UNAVAILABLE",
        "One or more cart items are no longer available.",
      );
    }

    let subtotal = 0n;
    const preparedItems: Array<{
      cartItem: CartItem;
      variant: ProductVariant;
      unitPrice: bigint;
      lineTotal: bigint;
    }> = [];

    for (const cartItem of cartItems) {
      const variant = variantById.get(cartItem.productVariantId);

      if (
        !variant ||
        !variant.isActive ||
        !variant.product.isActive ||
        variant.product.status !== "ACTIVE"
      ) {
        throw new AppError(
          409,
          "CART_ITEM_UNAVAILABLE",
          "One or more cart items are no longer available.",
        );
      }

      if (cartItem.quantity <= 0 || cartItem.quantity > variant.stockQuantity) {
        throw new AppError(
          409,
          "INSUFFICIENT_STOCK",
          `${variant.product.name} does not have enough stock.`,
        );
      }

      const unitPrice = toMinorUnits(variant.price);

      if (unitPrice < 0n) {
        throw new AppError(
          500,
          "INVALID_PRODUCT_PRICE",
          "A product has an invalid price configuration.",
        );
      }

      const lineTotal = unitPrice * BigInt(cartItem.quantity);
      subtotal += lineTotal;
      preparedItems.push({ cartItem, variant, unitPrice, lineTotal });
    }

    const deliveryCharge = numberToMinorUnits(
      address.isInsideDhaka
        ? env.DELIVERY_INSIDE_DHAKA
        : env.DELIVERY_OUTSIDE_DHAKA,
    );
    const grandTotal = subtotal + deliveryCharge;

    if (grandTotal > MAX_MONEY_MINOR_UNITS) {
      throw new AppError(
        409,
        "ORDER_TOTAL_TOO_LARGE",
        "The cart total is too large to create an order.",
      );
    }

    const now = new Date();
    const orderRepository = manager.getRepository(Order);
    const order = orderRepository.create({
      orderNumber: createOrderNumber(),
      userId,
      orderStatus: "PENDING",
      paymentMethod: PAYMENT_METHOD,
      paymentStatus: PENDING_PAYMENT_STATUS,
      subtotal: formatMinorUnits(subtotal),
      discountTotal: "0.00",
      deliveryCharge: formatMinorUnits(deliveryCharge),
      grandTotal: formatMinorUnits(grandTotal),
      currency: CURRENCY,
      recipientName: address.recipientName,
      recipientPhone: address.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      area: address.area,
      city: address.city,
      district: address.district,
      division: address.division,
      postalCode: address.postalCode,
      country: address.country,
      isInsideDhaka: address.isInsideDhaka,
      customerNote: input.customerNote ?? null,
      adminNote: null,
      placedAt: now,
      confirmedAt: null,
      shippedAt: null,
      deliveredAt: null,
      cancelledAt: null,
    });

    await orderRepository.save(order);

    const orderItems = preparedItems.map(({ cartItem, variant, unitPrice, lineTotal }) =>
      manager.getRepository(OrderItem).create({
        orderId: order.id,
        productId: variant.productId,
        productVariantId: variant.id,
        productName: variant.product.name,
        variantName: variant.variantName,
        sku: variant.sku,
        barcode: variant.barcode,
        quantity: cartItem.quantity,
        unitPrice: formatMinorUnits(unitPrice),
        unitCost: variant.costPrice,
        discountAmount: "0.00",
        lineTotal: formatMinorUnits(lineTotal),
      }),
    );
    const movements: InventoryMovement[] = [];

    for (const { cartItem, variant } of preparedItems) {
      const quantityBefore = variant.stockQuantity;
      const quantityAfter = quantityBefore - cartItem.quantity;

      variant.stockQuantity = quantityAfter;
      movements.push(
        manager.getRepository(InventoryMovement).create({
          productVariantId: variant.id,
          movementType: "SALE",
          quantity: -cartItem.quantity,
          quantityBefore,
          quantityAfter,
          referenceType: "ORDER",
          referenceId: order.id,
          note: `Stock deducted for ${order.orderNumber}.`,
          createdById: userId,
        }),
      );
    }

    await manager.getRepository(OrderItem).save(orderItems);
    await manager.getRepository(ProductVariant).save(variants);
    await manager.getRepository(InventoryMovement).save(movements);
    await manager.getRepository(OrderStatusHistory).save(
      manager.getRepository(OrderStatusHistory).create({
        orderId: order.id,
        oldStatus: null,
        newStatus: "PENDING",
        changedById: userId,
        note: "Order placed by customer.",
      }),
    );

    cart.status = CONVERTED_CART_STATUS;
    cart.updatedAt = now;
    await manager.getRepository(Cart).save(cart);

    return order.id;
  });

  return getCustomerOrder(userId, orderId);
}

export async function listCustomerOrders(
  userId: string,
  filters: CustomerOrderListQuery,
) {
  const query = AppDataSource.getRepository(Order)
    .createQueryBuilder("order")
    .where("order.user_id = :userId", { userId });

  applyListFilters(query, filters);
  query
    .orderBy("order.created_at", "DESC")
    .addOrderBy("order.id", "DESC")
    .skip((filters.page - 1) * filters.limit)
    .take(filters.limit);

  const [orders, total] = await query.getManyAndCount();
  const counts = await loadItemCounts(orders.map((order) => order.id));

  return {
    orders: orders.map((order) => ({
      ...toOrderBase(order),
      ...(counts.get(order.id) ?? { itemCount: 0, totalQuantity: 0 }),
    })),
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.ceil(total / filters.limit),
    },
  };
}

export async function getCustomerOrder(userId: string, orderId: string) {
  const order = await AppDataSource.getRepository(Order).findOneBy({
    id: orderId,
    userId,
  });

  if (!order) {
    throw new AppError(404, "ORDER_NOT_FOUND", "Order not found.");
  }

  return buildOrderDetail(order, false);
}

export async function cancelCustomerOrder(
  userId: string,
  orderId: string,
  input: CancelOrderInput,
) {
  await AppDataSource.transaction(async (manager) => {
    const order = await manager
      .getRepository(Order)
      .createQueryBuilder("order")
      .where("order.id = :orderId", { orderId })
      .andWhere("order.user_id = :userId", { userId })
      .setLock("pessimistic_write")
      .getOne();

    if (!order) {
      throw new AppError(404, "ORDER_NOT_FOUND", "Order not found.");
    }

    await cancelLockedOrder(
      manager,
      order,
      userId,
      input.note ?? "Cancelled by customer.",
      false,
    );
  });

  return getCustomerOrder(userId, orderId);
}

export async function listAdminOrders(filters: AdminOrderListQuery) {
  const query = AppDataSource.getRepository(Order)
    .createQueryBuilder("order")
    .withDeleted()
    .innerJoinAndSelect("order.user", "user");

  applyListFilters(query, filters);
  query
    .orderBy("order.created_at", "DESC")
    .addOrderBy("order.id", "DESC")
    .skip((filters.page - 1) * filters.limit)
    .take(filters.limit);

  const [orders, total] = await query.getManyAndCount();
  const counts = await loadItemCounts(orders.map((order) => order.id));

  return {
    orders: orders.map((order) => ({
      ...toOrderBase(order),
      user: {
        id: order.user.id,
        name: order.user.name,
        email: order.user.email,
        phone: order.user.phone,
      },
      ...(counts.get(order.id) ?? { itemCount: 0, totalQuantity: 0 }),
    })),
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.ceil(total / filters.limit),
    },
  };
}

export async function getAdminOrder(orderId: string) {
  const order = await AppDataSource.getRepository(Order)
    .createQueryBuilder("order")
    .withDeleted()
    .innerJoinAndSelect("order.user", "user")
    .where("order.id = :orderId", { orderId })
    .getOne();

  if (!order) {
    throw new AppError(404, "ORDER_NOT_FOUND", "Order not found.");
  }

  return buildOrderDetail(order, true);
}

export async function updateAdminOrderStatus(
  actorUserId: string,
  orderId: string,
  input: AdminOrderStatusInput,
) {
  await AppDataSource.transaction(async (manager) => {
    const order = await manager
      .getRepository(Order)
      .createQueryBuilder("order")
      .where("order.id = :orderId", { orderId })
      .setLock("pessimistic_write")
      .getOne();

    if (!order) {
      throw new AppError(404, "ORDER_NOT_FOUND", "Order not found.");
    }

    if (input.status === "CANCELLED") {
      await cancelLockedOrder(
        manager,
        order,
        actorUserId,
        input.note ?? "Cancelled by administrator.",
        true,
      );
      return;
    }

    const expectedStatus = NEXT_ORDER_STATUS[order.orderStatus as OrderStatus];

    if (expectedStatus !== input.status) {
      throw new AppError(
        409,
        "INVALID_ORDER_STATUS_TRANSITION",
        `Order status cannot change from ${order.orderStatus} to ${input.status}.`,
      );
    }

    const previousStatus = order.orderStatus;
    const now = new Date();
    order.orderStatus = input.status;

    if (input.status === "CONFIRMED") {
      order.confirmedAt = now;
    } else if (input.status === "SHIPPED") {
      order.shippedAt = now;
    } else if (input.status === "DELIVERED") {
      order.deliveredAt = now;
    }

    await manager.getRepository(Order).save(order);
    await manager.getRepository(OrderStatusHistory).save(
      manager.getRepository(OrderStatusHistory).create({
        orderId: order.id,
        oldStatus: previousStatus,
        newStatus: input.status,
        changedById: actorUserId,
        note: input.note ?? null,
      }),
    );
  });

  return getAdminOrder(orderId);
}
```


---

### `src/modules/payments/payment.entity.ts`

```ts
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import { Order } from "../orders/order.entity.js";

@Entity({ name: "payments" })
export class Payment {
  @PrimaryGeneratedColumn({ type: "bigint", unsigned: true })
  id!: string;

  @Column({ name: "order_id", type: "bigint", unsigned: true })
  orderId!: string;

  @ManyToOne(() => Order, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "order_id" })
  order!: Order;

  @Column({ name: "payment_method", type: "varchar", length: 30 })
  paymentMethod!: string;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  amount!: string;

  @Column({ type: "varchar", length: 10, default: "BDT" })
  currency!: string;

  @Column({ type: "varchar", length: 30 })
  status!: string;

  @Column({ name: "paid_at", type: "datetime", nullable: true })
  paidAt!: Date | null;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "datetime" })
  updatedAt!: Date;
}
```


---

### `src/modules/product-types/product-type.entity.ts`

```ts
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity({ name: "product_types" })
export class ProductType {
  @PrimaryGeneratedColumn({ type: "bigint", unsigned: true })
  id!: string;

  @Column({ type: "varchar", length: 100 })
  name!: string;

  @Column({ type: "varchar", length: 120, unique: true })
  slug!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({ name: "is_active", type: "boolean", default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "datetime" })
  updatedAt!: Date;
}
```


---

### `src/modules/products/product-media-upload.middleware.ts`

```ts
import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { extname, resolve } from "node:path";
import multer from "multer";

import { env } from "../../config/env.js";
import { AppError } from "../../utils/app-error.js";

const productDirectory = resolve(env.UPLOAD_DIR, "products");
mkdirSync(productDirectory, { recursive: true });

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export const productImageUpload = multer({
  storage: multer.diskStorage({
    destination: productDirectory,
    filename(_request, file, callback) {
      callback(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`);
    },
  }),
  limits: { fileSize: env.MAX_UPLOAD_BYTES, files: 4 },
  fileFilter(_request, file, callback) {
    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(
        new AppError(
          400,
          "INVALID_IMAGE_TYPE",
          "Only JPEG, PNG and WebP images are allowed.",
        ),
      );
      return;
    }
    callback(null, true);
  },
});
```


---

### `src/modules/products/product-media.controller.ts`

```ts
import type { RequestHandler } from "express";

import { AppError } from "../../utils/app-error.js";
import {
  createProductMediaSchema,
  updateProductMediaSchema,
} from "./product-media.schema.js";
import {
  addProductImages,
  cleanupUploadedProductImages,
  deleteProductImage,
  updateProductImage,
} from "./product-media.service.js";

function requiredParam(value: string | string[] | undefined, name: string) {
  if (!value || Array.isArray(value)) {
    throw new AppError(400, "INVALID_PATH_PARAMETER", `${name} is required.`);
  }
  return value;
}

export const uploadProductImages: RequestHandler = async (request, response) => {
  const files = Array.isArray(request.files) ? request.files : [];

  try {
    const media = await addProductImages(
      requiredParam(request.params.productId, "productId"),
      files,
      createProductMediaSchema.parse(request.body),
    );
    response.status(201).json({ success: true, data: { media } });
  } catch (error) {
    await cleanupUploadedProductImages(files);
    throw error;
  }
};

export const updateProductImageHandler: RequestHandler = async (
  request,
  response,
) => {
  const media = await updateProductImage(
    requiredParam(request.params.productId, "productId"),
    requiredParam(request.params.mediaId, "mediaId"),
    updateProductMediaSchema.parse(request.body),
  );
  response.status(200).json({ success: true, data: { media } });
};

export const deleteProductImageHandler: RequestHandler = async (
  request,
  response,
) => {
  await deleteProductImage(
    requiredParam(request.params.productId, "productId"),
    requiredParam(request.params.mediaId, "mediaId"),
  );
  response.status(204).send();
};
```


---

### `src/modules/products/product-media.entity.ts`

```ts
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import { Product } from "./product.entity.js";
import { ProductVariant } from "./product-variant.entity.js";

@Entity({ name: "product_media" })
export class ProductMedia {
  @PrimaryGeneratedColumn({ type: "bigint", unsigned: true })
  id!: string;

  @Column({ name: "product_id", type: "bigint", unsigned: true })
  productId!: string;

  @ManyToOne(() => Product, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "product_id" })
  product!: Product;

  @Column({ name: "variant_id", type: "bigint", unsigned: true, nullable: true })
  variantId!: string | null;

  @ManyToOne(() => ProductVariant, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "variant_id" })
  variant!: ProductVariant | null;

  @Column({ name: "media_type", type: "varchar", length: 20 })
  mediaType!: string;

  @Column({ type: "varchar", length: 500 })
  url!: string;

  @Column({ name: "thumbnail_url", type: "varchar", length: 500, nullable: true })
  thumbnailUrl!: string | null;

  @Column({ name: "alt_text", type: "varchar", length: 255, nullable: true })
  altText!: string | null;

  @Column({ name: "sort_order", type: "int", default: 0 })
  sortOrder!: number;

  @Column({ name: "is_primary", type: "boolean", default: false })
  isPrimary!: boolean;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt!: Date;
}
```


---

### `src/modules/products/product-media.schema.ts`

```ts
import { z } from "zod";

export const createProductMediaSchema = z.object({
  variantId: z.string().regex(/^\d+$/).optional(),
  altText: z.string().trim().max(255).optional(),
});

export const updateProductMediaSchema = z
  .object({
    altText: z.string().trim().max(255).nullable().optional(),
    sortOrder: z.coerce.number().int().min(0).optional(),
    isPrimary: z.boolean().optional(),
  })
  .refine(
    (input) =>
      input.altText !== undefined ||
      input.sortOrder !== undefined ||
      input.isPrimary !== undefined,
    { message: "Provide at least one field to update." },
  );

export type CreateProductMediaInput = z.infer<
  typeof createProductMediaSchema
>;
export type UpdateProductMediaInput = z.infer<
  typeof updateProductMediaSchema
>;
```


---

### `src/modules/products/product-media.service.ts`

```ts
import { unlink } from "node:fs/promises";
import { basename, resolve } from "node:path";

import { AppDataSource } from "../../database/data-source.js";
import { env } from "../../config/env.js";
import { AppError } from "../../utils/app-error.js";
import { ProductMedia } from "./product-media.entity.js";
import type {
  CreateProductMediaInput,
  UpdateProductMediaInput,
} from "./product-media.schema.js";
import { ProductVariant } from "./product-variant.entity.js";
import { Product } from "./product.entity.js";

function publicMedia(media: ProductMedia) {
  return {
    id: media.id,
    productId: media.productId,
    variantId: media.variantId,
    mediaType: media.mediaType,
    url: media.url,
    thumbnailUrl: media.thumbnailUrl,
    altText: media.altText,
    sortOrder: media.sortOrder,
    isPrimary: media.isPrimary,
    createdAt: media.createdAt,
  };
}

async function removePhysicalFile(url: string) {
  if (!url.startsWith("/uploads/products/")) return;
  await unlink(resolve(env.UPLOAD_DIR, "products", basename(url))).catch(
    () => undefined,
  );
}

export async function addProductImages(
  productId: string,
  files: Express.Multer.File[],
  input: CreateProductMediaInput,
) {
  if (files.length === 0) {
    throw new AppError(400, "IMAGES_REQUIRED", "Select at least one image.");
  }

  const product = await AppDataSource.getRepository(Product).findOneBy({
    id: productId,
  });
  if (!product) {
    throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found.");
  }

  if (input.variantId) {
    const variant = await AppDataSource.getRepository(ProductVariant).findOneBy({
      id: input.variantId,
      productId,
    });
    if (!variant) {
      throw new AppError(400, "VARIANT_INVALID", "Variant does not belong to this product.");
    }
  }

  const repository = AppDataSource.getRepository(ProductMedia);
  const existing = await repository.find({
    where: { productId, mediaType: "IMAGE" },
    order: { sortOrder: "ASC" },
  });

  if (existing.length + files.length > 4) {
    throw new AppError(
      400,
      "PRODUCT_IMAGE_LIMIT",
      "A product can have at most four images.",
    );
  }

  const hasPrimary = existing.some((media) => media.isPrimary);
  const created = files.map((file, index) =>
    repository.create({
      productId,
      variantId: input.variantId ?? null,
      mediaType: "IMAGE",
      url: `/uploads/products/${file.filename}`,
      thumbnailUrl: null,
      altText: input.altText ?? product.name,
      sortOrder: existing.length + index,
      isPrimary: !hasPrimary && index === 0,
    }),
  );

  await repository.save(created);
  return created.map(publicMedia);
}

export async function updateProductImage(
  productId: string,
  mediaId: string,
  input: UpdateProductMediaInput,
) {
  return AppDataSource.transaction(async (manager) => {
    const repository = manager.getRepository(ProductMedia);
    const media = await repository.findOneBy({ id: mediaId, productId });
    if (!media) {
      throw new AppError(404, "PRODUCT_MEDIA_NOT_FOUND", "Product image not found.");
    }

    if (input.isPrimary === true) {
      await repository.update({ productId, isPrimary: true }, { isPrimary: false });
    }
    if (input.altText !== undefined) media.altText = input.altText;
    if (input.sortOrder !== undefined) media.sortOrder = input.sortOrder;
    if (input.isPrimary !== undefined) media.isPrimary = input.isPrimary;

    await repository.save(media);
    return publicMedia(media);
  });
}

export async function deleteProductImage(productId: string, mediaId: string) {
  const repository = AppDataSource.getRepository(ProductMedia);
  const media = await repository.findOneBy({ id: mediaId, productId });
  if (!media) {
    throw new AppError(404, "PRODUCT_MEDIA_NOT_FOUND", "Product image not found.");
  }

  await repository.remove(media);
  await removePhysicalFile(media.url);
}

export async function cleanupUploadedProductImages(files: Express.Multer.File[]) {
  await Promise.all(files.map((file) => unlink(file.path).catch(() => undefined)));
}
```


---

### `src/modules/products/product-variant.entity.ts`

```ts
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import { Vendor } from "../vendors/vendor.entity.js";
import { Product } from "./product.entity.js";

@Entity({ name: "product_variants" })
export class ProductVariant {
  @PrimaryGeneratedColumn({ type: "bigint", unsigned: true })
  id!: string;

  @Column({ name: "product_id", type: "bigint", unsigned: true })
  productId!: string;

  @ManyToOne(() => Product, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "product_id" })
  product!: Product;

  @Column({ name: "vendor_id", type: "bigint", unsigned: true, nullable: true })
  vendorId!: string | null;

  @ManyToOne(() => Vendor, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "vendor_id" })
  vendor!: Vendor | null;

  @Column({ type: "varchar", length: 100, unique: true })
  sku!: string;

  @Column({ type: "varchar", length: 100, unique: true, nullable: true })
  barcode!: string | null;

  @Column({ name: "variant_name", type: "varchar", length: 150, nullable: true })
  variantName!: string | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  color!: string | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  size!: string | null;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  price!: string;

  @Column({ name: "cost_price", type: "decimal", precision: 12, scale: 2, nullable: true })
  costPrice!: string | null;

  @Column({ name: "stock_quantity", type: "int", default: 0 })
  stockQuantity!: number;

  @Column({ name: "low_stock_level", type: "int", default: 5 })
  lowStockLevel!: number;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  weight!: string | null;

  @Column({ name: "is_default", type: "boolean", default: false })
  isDefault!: boolean;

  @Column({ name: "is_active", type: "boolean", default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "datetime" })
  updatedAt!: Date;

  @DeleteDateColumn({ name: "deleted_at", type: "datetime", nullable: true })
  deletedAt!: Date | null;
}
```


---

### `src/modules/products/product.controller.ts`

```ts
import type { Request, RequestHandler } from "express";

import { AppError } from "../../utils/app-error.js";
import {
  adminProductListQuerySchema,
  createProductSchema,
  createProductVariantSchema,
  productIdentifierParamsSchema,
  productIdForVariantParamsSchema,
  productIdParamsSchema,
  productVariantParamsSchema,
  publicProductListQuerySchema,
  updateProductSchema,
  updateProductVariantSchema,
} from "./product.schema.js";
import {
  createProduct,
  createProductVariant,
  deleteProduct,
  deleteProductVariant,
  getAdminProduct,
  getPublicProduct,
  listAdminProducts,
  listPublicProducts,
  restoreProduct,
  updateProduct,
  updateProductVariant,
} from "./product.service.js";

function authenticatedUserId(request: Request) {
  if (!request.auth) {
    throw new AppError(
      401,
      "AUTHENTICATION_REQUIRED",
      "Authentication is required.",
    );
  }

  return request.auth.userId;
}

export const listProducts: RequestHandler = async (request, response) => {
  const input = publicProductListQuerySchema.parse(request.query);
  const result = await listPublicProducts(input);

  response.status(200).json({ success: true, data: result });
};

export const showProduct: RequestHandler = async (request, response) => {
  const { identifier } = productIdentifierParamsSchema.parse(request.params);
  const product = await getPublicProduct(identifier);

  response.status(200).json({ success: true, data: { product } });
};

export const listProductsForAdmin: RequestHandler = async (
  request,
  response,
) => {
  const input = adminProductListQuerySchema.parse(request.query);
  const result = await listAdminProducts(input);

  response.status(200).json({ success: true, data: result });
};

export const showProductForAdmin: RequestHandler = async (
  request,
  response,
) => {
  const { id } = productIdParamsSchema.parse(request.params);
  const product = await getAdminProduct(id);

  response.status(200).json({ success: true, data: { product } });
};

export const createProductForAdmin: RequestHandler = async (
  request,
  response,
) => {
  const input = createProductSchema.parse(request.body);
  const product = await createProduct(input);

  response.status(201).json({ success: true, data: { product } });
};

export const updateProductForAdmin: RequestHandler = async (
  request,
  response,
) => {
  const { id } = productIdParamsSchema.parse(request.params);
  const input = updateProductSchema.parse(request.body);
  const product = await updateProduct(id, input);

  response.status(200).json({ success: true, data: { product } });
};

export const deleteProductForAdmin: RequestHandler = async (
  request,
  response,
) => {
  const { id } = productIdParamsSchema.parse(request.params);
  await deleteProduct(id);

  response.status(204).send();
};

export const restoreProductForAdmin: RequestHandler = async (
  request,
  response,
) => {
  const { id } = productIdParamsSchema.parse(request.params);
  const product = await restoreProduct(id);

  response.status(200).json({ success: true, data: { product } });
};

export const createVariantForAdmin: RequestHandler = async (
  request,
  response,
) => {
  const { productId } = productIdForVariantParamsSchema.parse(request.params);
  const input = createProductVariantSchema.parse(request.body);
  const variant = await createProductVariant(
    productId,
    input,
    authenticatedUserId(request),
  );

  response.status(201).json({ success: true, data: { variant } });
};

export const updateVariantForAdmin: RequestHandler = async (
  request,
  response,
) => {
  const { productId, variantId } = productVariantParamsSchema.parse(
    request.params,
  );
  const input = updateProductVariantSchema.parse(request.body);
  const variant = await updateProductVariant(
    productId,
    variantId,
    input,
    authenticatedUserId(request),
  );

  response.status(200).json({ success: true, data: { variant } });
};

export const deleteVariantForAdmin: RequestHandler = async (
  request,
  response,
) => {
  const { productId, variantId } = productVariantParamsSchema.parse(
    request.params,
  );
  await deleteProductVariant(productId, variantId);

  response.status(204).send();
};
```


---

### `src/modules/products/product.entity.ts`

```ts
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import { Brand } from "../brands/brand.entity.js";
import { Category } from "../categories/category.entity.js";
import { ProductType } from "../product-types/product-type.entity.js";

@Entity({ name: "products" })
export class Product {
  @PrimaryGeneratedColumn({ type: "bigint", unsigned: true })
  id!: string;

  @Column({ name: "product_type_id", type: "bigint", unsigned: true })
  productTypeId!: string;

  @ManyToOne(() => ProductType, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "product_type_id" })
  productType!: ProductType;

  @Column({ name: "category_id", type: "bigint", unsigned: true })
  categoryId!: string;

  @ManyToOne(() => Category, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "category_id" })
  category!: Category;

  @Column({ name: "brand_id", type: "bigint", unsigned: true, nullable: true })
  brandId!: string | null;

  @ManyToOne(() => Brand, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "brand_id" })
  brand!: Brand | null;

  @Column({ type: "varchar", length: 200 })
  name!: string;

  @Column({ type: "varchar", length: 220, unique: true })
  slug!: string;

  @Column({ name: "short_description", type: "varchar", length: 500, nullable: true })
  shortDescription!: string | null;

  @Column({ type: "text" })
  description!: string;

  @Column({ name: "default_price", type: "decimal", precision: 12, scale: 2 })
  defaultPrice!: string;

  @Column({ name: "default_cost_price", type: "decimal", precision: 12, scale: 2, nullable: true })
  defaultCostPrice!: string | null;

  @Column({ name: "discount_price", type: "decimal", precision: 12, scale: 2, nullable: true })
  discountPrice!: string | null;

  @Column({ type: "varchar", length: 30 })
  status!: string;

  @Column({ name: "is_featured", type: "boolean", default: false })
  isFeatured!: boolean;

  @Column({ name: "is_active", type: "boolean", default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "datetime" })
  updatedAt!: Date;

  @DeleteDateColumn({ name: "deleted_at", type: "datetime", nullable: true })
  deletedAt!: Date | null;
}
```


---

### `src/modules/products/product.routes.ts`

```ts
import { Router } from "express";

import { requireAuth } from "../auth/auth.middleware.js";
import { requireRole } from "../auth/authorization.middleware.js";
import {
  createProductForAdmin,
  createVariantForAdmin,
  deleteProductForAdmin,
  deleteVariantForAdmin,
  listProducts,
  listProductsForAdmin,
  restoreProductForAdmin,
  showProduct,
  showProductForAdmin,
  updateProductForAdmin,
  updateVariantForAdmin,
} from "./product.controller.js";
import {
  deleteProductImageHandler,
  updateProductImageHandler,
  uploadProductImages,
} from "./product-media.controller.js";
import { productImageUpload } from "./product-media-upload.middleware.js";

export const productRouter = Router();
export const adminProductRouter = Router();

productRouter.get("/", listProducts);
productRouter.get("/:identifier", showProduct);

adminProductRouter.use(requireAuth, requireRole("ADMIN", "OWNER"));
adminProductRouter.get("/", listProductsForAdmin);
adminProductRouter.post("/", createProductForAdmin);
adminProductRouter.get("/:id", showProductForAdmin);
adminProductRouter.patch("/:id", updateProductForAdmin);
adminProductRouter.delete("/:id", deleteProductForAdmin);
adminProductRouter.post("/:id/restore", restoreProductForAdmin);
adminProductRouter.post("/:productId/variants", createVariantForAdmin);
adminProductRouter.patch(
  "/:productId/variants/:variantId",
  updateVariantForAdmin,
);
adminProductRouter.delete(
  "/:productId/variants/:variantId",
  deleteVariantForAdmin,
);
adminProductRouter.post(
  "/:productId/media",
  productImageUpload.array("images", 4),
  uploadProductImages,
);
adminProductRouter.patch(
  "/:productId/media/:mediaId",
  updateProductImageHandler,
);
adminProductRouter.delete(
  "/:productId/media/:mediaId",
  deleteProductImageHandler,
);
```


---

### `src/modules/products/product.schema.ts`

```ts
import { z } from "zod";

const entityIdSchema = z
  .string()
  .regex(/^[1-9]\d*$/, "The id must be a positive integer.");

const moneySchema = z.coerce.number().finite().min(0).max(999_999_999.99);
const optionalMoneySchema = z.union([moneySchema, z.null()]).optional();

export const productStatusSchema = z.enum([
  "DRAFT",
  "ACTIVE",
  "INACTIVE",
  "DISCONTINUED",
]);

export const publicProductListQuerySchema = z
  .object({
    search: z.string().trim().min(1).max(100).optional(),
    category: z.string().trim().min(1).max(120).optional(),
    minPrice: moneySchema.optional(),
    maxPrice: moneySchema.optional(),
    sort: z
      .enum(["newest", "price_asc", "price_desc", "name_asc"])
      .default("newest"),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .refine(
    ({ minPrice, maxPrice }) =>
      minPrice === undefined || maxPrice === undefined || minPrice <= maxPrice,
    { message: "minPrice cannot be greater than maxPrice.", path: ["minPrice"] },
  );

export const adminProductListQuerySchema = z.object({
  search: z.string().trim().min(1).max(100).optional(),
  category: z.string().trim().min(1).max(120).optional(),
  status: productStatusSchema.optional(),
  includeDeleted: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const productIdentifierParamsSchema = z.object({
  identifier: z.string().trim().min(1).max(220),
});

export const productIdParamsSchema = z.object({ id: entityIdSchema });

export const productVariantParamsSchema = z.object({
  productId: entityIdSchema,
  variantId: entityIdSchema,
});

export const productIdForVariantParamsSchema = z.object({
  productId: entityIdSchema,
});

const productFields = {
  productTypeId: entityIdSchema,
  categoryId: entityIdSchema,
  brandId: z.union([entityIdSchema, z.null()]).optional(),
  name: z.string().trim().min(2).max(200),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(220)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Use lowercase letters, numbers, and single hyphens.",
    )
    .optional(),
  shortDescription: z
    .union([z.string().trim().max(500), z.null()])
    .optional(),
  description: z.string().trim().min(1).max(65_535),
  defaultPrice: moneySchema,
  defaultCostPrice: optionalMoneySchema,
  discountPrice: optionalMoneySchema,
  status: productStatusSchema.optional(),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
};

export const createProductSchema = z
  .object(productFields)
  .strict()
  .refine(
    ({ defaultPrice, discountPrice }) =>
      discountPrice === undefined ||
      discountPrice === null ||
      discountPrice <= defaultPrice,
    {
      message: "discountPrice cannot be greater than defaultPrice.",
      path: ["discountPrice"],
    },
  );

export const updateProductSchema = z
  .object({
    productTypeId: productFields.productTypeId.optional(),
    categoryId: productFields.categoryId.optional(),
    brandId: productFields.brandId,
    name: productFields.name.optional(),
    slug: productFields.slug,
    shortDescription: productFields.shortDescription,
    description: productFields.description.optional(),
    defaultPrice: productFields.defaultPrice.optional(),
    defaultCostPrice: productFields.defaultCostPrice,
    discountPrice: productFields.discountPrice,
    status: productFields.status,
    isFeatured: productFields.isFeatured,
    isActive: productFields.isActive,
  })
  .strict()
  .refine((input) => Object.keys(input).length > 0, {
    message: "Provide at least one product field to update.",
  });

const variantFields = {
  vendorId: z.union([entityIdSchema, z.null()]).optional(),
  sku: z.string().trim().min(1).max(100),
  barcode: z.union([z.string().trim().min(1).max(100), z.null()]).optional(),
  variantName: z
    .union([z.string().trim().min(1).max(150), z.null()])
    .optional(),
  color: z.union([z.string().trim().min(1).max(100), z.null()]).optional(),
  size: z.union([z.string().trim().min(1).max(100), z.null()]).optional(),
  price: moneySchema,
  costPrice: optionalMoneySchema,
  stockQuantity: z.coerce.number().int().min(0).max(2_147_483_647).optional(),
  lowStockLevel: z.coerce.number().int().min(0).max(2_147_483_647).optional(),
  weight: z.union([z.coerce.number().finite().min(0).max(99_999_999.99), z.null()]).optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
};

export const createProductVariantSchema = z.object(variantFields).strict();

export const updateProductVariantSchema = z
  .object({
    vendorId: variantFields.vendorId,
    sku: variantFields.sku.optional(),
    barcode: variantFields.barcode,
    variantName: variantFields.variantName,
    color: variantFields.color,
    size: variantFields.size,
    price: variantFields.price.optional(),
    costPrice: variantFields.costPrice,
    stockQuantity: variantFields.stockQuantity,
    lowStockLevel: variantFields.lowStockLevel,
    weight: variantFields.weight,
    isDefault: variantFields.isDefault,
    isActive: variantFields.isActive,
  })
  .strict()
  .refine((input) => Object.keys(input).length > 0, {
    message: "Provide at least one variant field to update.",
  });

export type PublicProductListQuery = z.infer<
  typeof publicProductListQuerySchema
>;
export type AdminProductListQuery = z.infer<
  typeof adminProductListQuerySchema
>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CreateProductVariantInput = z.infer<
  typeof createProductVariantSchema
>;
export type UpdateProductVariantInput = z.infer<
  typeof updateProductVariantSchema
>;
```


---

### `src/modules/products/product.service.ts`

```ts
import { In, type SelectQueryBuilder } from "typeorm";

import { AppDataSource } from "../../database/data-source.js";
import { AppError } from "../../utils/app-error.js";
import { Brand } from "../brands/brand.entity.js";
import { Category } from "../categories/category.entity.js";
import { InventoryMovement } from "../inventory/inventory-movement.entity.js";
import { ProductType } from "../product-types/product-type.entity.js";
import { Vendor } from "../vendors/vendor.entity.js";
import { ProductMedia } from "./product-media.entity.js";
import { ProductVariant } from "./product-variant.entity.js";
import { Product } from "./product.entity.js";
import type {
  AdminProductListQuery,
  CreateProductInput,
  CreateProductVariantInput,
  PublicProductListQuery,
  UpdateProductInput,
  UpdateProductVariantInput,
} from "./product.schema.js";

interface CatalogAssociations {
  variantsByProduct: Map<string, ProductVariant[]>;
  mediaByProduct: Map<string, ProductMedia[]>;
}

function productRepository() {
  return AppDataSource.getRepository(Product);
}

function createSlug(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 220)
    .replace(/-+$/g, "");

  if (!slug) {
    throw new AppError(
      400,
      "PRODUCT_SLUG_REQUIRED",
      "Provide an English slug when the product name cannot form one.",
    );
  }

  return slug;
}

function money(value: number) {
  return value.toFixed(2);
}

function toPublicVariant(variant: ProductVariant) {
  return {
    id: variant.id,
    sku: variant.sku,
    barcode: variant.barcode,
    name: variant.variantName,
    color: variant.color,
    size: variant.size,
    price: variant.price,
    stockQuantity: variant.stockQuantity,
    inStock: variant.stockQuantity > 0,
    weight: variant.weight,
    isDefault: variant.isDefault,
  };
}

function toAdminVariant(variant: ProductVariant) {
  return {
    ...toPublicVariant(variant),
    vendorId: variant.vendorId,
    costPrice: variant.costPrice,
    lowStockLevel: variant.lowStockLevel,
    isActive: variant.isActive,
    createdAt: variant.createdAt,
    updatedAt: variant.updatedAt,
    deletedAt: variant.deletedAt,
  };
}

function toPublicMedia(media: ProductMedia) {
  return {
    id: media.id,
    variantId: media.variantId,
    type: media.mediaType,
    url: media.url,
    thumbnailUrl: media.thumbnailUrl,
    altText: media.altText,
    sortOrder: media.sortOrder,
    isPrimary: media.isPrimary,
  };
}

function totalStock(variants: ProductVariant[]) {
  return variants.reduce((sum, variant) => sum + variant.stockQuantity, 0);
}

function toPublicProduct(
  product: Product,
  variants: ProductVariant[],
  media: ProductMedia[],
  includeDetail: boolean,
) {
  const stockQuantity = totalStock(variants);
  const primaryMedia = media.find((item) => item.isPrimary) ?? media[0] ?? null;

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    shortDescription: product.shortDescription,
    ...(includeDetail ? { description: product.description } : {}),
    price: product.discountPrice ?? product.defaultPrice,
    regularPrice: product.defaultPrice,
    discountPrice: product.discountPrice,
    isFeatured: product.isFeatured,
    category: {
      id: product.category.id,
      name: product.category.name,
      slug: product.category.slug,
    },
    productType: {
      id: product.productType.id,
      name: product.productType.name,
      slug: product.productType.slug,
    },
    brand: product.brand
      ? {
          id: product.brand.id,
          name: product.brand.name,
          slug: product.brand.slug,
        }
      : null,
    stockQuantity,
    inStock: stockQuantity > 0,
    primaryImage: primaryMedia ? toPublicMedia(primaryMedia) : null,
    ...(includeDetail
      ? {
          variants: variants.map(toPublicVariant),
          media: media.map(toPublicMedia),
        }
      : {}),
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

function toAdminProduct(
  product: Product,
  variants: ProductVariant[],
  media: ProductMedia[],
  includeDetail: boolean,
) {
  return {
    ...toPublicProduct(product, variants, media, includeDetail),
    productTypeId: product.productTypeId,
    categoryId: product.categoryId,
    brandId: product.brandId,
    defaultCostPrice: product.defaultCostPrice,
    status: product.status,
    isActive: product.isActive,
    deletedAt: product.deletedAt,
    ...(includeDetail ? { variants: variants.map(toAdminVariant) } : {}),
  };
}

function applyCategoryFilter(
  query: SelectQueryBuilder<Product>,
  category: string | undefined,
) {
  if (!category) return;

  if (/^[1-9]\d*$/.test(category)) {
    query.andWhere("category.id = :categoryId", { categoryId: category });
  } else {
    query.andWhere("category.slug = :categorySlug", {
      categorySlug: category.toLowerCase(),
    });
  }
}

function applySearchFilter(
  query: SelectQueryBuilder<Product>,
  search: string | undefined,
) {
  if (!search) return;

  query.andWhere(
    "(LOWER(product.name) LIKE :search OR LOWER(product.slug) LIKE :search)",
    { search: `%${search.toLowerCase()}%` },
  );
}

async function loadProductsByIds(ids: string[], includeDeleted: boolean) {
  if (ids.length === 0) return [];

  const query = productRepository().createQueryBuilder("product");

  if (includeDeleted) query.withDeleted();

  query
    .innerJoinAndSelect("product.category", "category")
    .innerJoinAndSelect("product.productType", "productType")
    .leftJoinAndSelect("product.brand", "brand")
    .where("product.id IN (:...ids)", { ids });

  const products = await query.getMany();
  const byId = new Map(products.map((product) => [product.id, product]));
  return ids.flatMap((id) => {
    const product = byId.get(id);
    return product ? [product] : [];
  });
}

async function loadAssociations(
  productIds: string[],
  options: { publicOnly: boolean; includeDeletedVariants?: boolean },
): Promise<CatalogAssociations> {
  const variantsByProduct = new Map<string, ProductVariant[]>();
  const mediaByProduct = new Map<string, ProductMedia[]>();

  if (productIds.length === 0) {
    return { variantsByProduct, mediaByProduct };
  }

  const variantQuery = AppDataSource.getRepository(ProductVariant)
    .createQueryBuilder("variant")
    .where("variant.productId IN (:...productIds)", { productIds })
    .orderBy("variant.isDefault", "DESC")
    .addOrderBy("variant.id", "ASC");

  if (options.publicOnly) {
    variantQuery.andWhere("variant.isActive = :active", { active: true });
  }

  if (options.includeDeletedVariants) {
    variantQuery.withDeleted();
  }

  const [variants, media] = await Promise.all([
    variantQuery.getMany(),
    AppDataSource.getRepository(ProductMedia).find({
      where: { productId: In(productIds) },
      order: { sortOrder: "ASC", id: "ASC" },
    }),
  ]);

  for (const variant of variants) {
    const group = variantsByProduct.get(variant.productId) ?? [];
    group.push(variant);
    variantsByProduct.set(variant.productId, group);
  }

  for (const item of media) {
    const group = mediaByProduct.get(item.productId) ?? [];
    group.push(item);
    mediaByProduct.set(item.productId, group);
  }

  return { variantsByProduct, mediaByProduct };
}

async function assertSlugAvailable(slug: string, ignoredId?: string) {
  const query = productRepository()
    .createQueryBuilder("product")
    .withDeleted()
    .where("LOWER(product.slug) = :slug", { slug: slug.toLowerCase() });

  if (ignoredId) {
    query.andWhere("product.id != :ignoredId", { ignoredId });
  }

  if (await query.getOne()) {
    throw new AppError(
      409,
      "PRODUCT_SLUG_EXISTS",
      "A product with this slug already exists.",
    );
  }
}

async function assertProductRelations(
  productTypeId: string,
  categoryId: string,
  brandId: string | null,
) {
  const [productType, category, brand] = await Promise.all([
    AppDataSource.getRepository(ProductType).findOneBy({
      id: productTypeId,
      isActive: true,
    }),
    AppDataSource.getRepository(Category).findOneBy({
      id: categoryId,
      isActive: true,
    }),
    brandId
      ? AppDataSource.getRepository(Brand).findOneBy({
          id: brandId,
          isActive: true,
        })
      : Promise.resolve(null),
  ]);

  if (!productType) {
    throw new AppError(
      400,
      "PRODUCT_TYPE_INVALID",
      "The selected product type does not exist or is inactive.",
    );
  }

  if (!category) {
    throw new AppError(
      400,
      "PRODUCT_CATEGORY_INVALID",
      "The selected category does not exist or is inactive.",
    );
  }

  if (brandId && !brand) {
    throw new AppError(
      400,
      "PRODUCT_BRAND_INVALID",
      "The selected brand does not exist or is inactive.",
    );
  }
}

async function assertVendor(vendorId: string | null | undefined) {
  if (!vendorId) return;

  const vendor = await AppDataSource.getRepository(Vendor).findOneBy({
    id: vendorId,
    isActive: true,
  });

  if (!vendor) {
    throw new AppError(
      400,
      "PRODUCT_VENDOR_INVALID",
      "The selected vendor does not exist or is inactive.",
    );
  }
}

async function assertVariantIdentifiersAvailable(
  sku: string | undefined,
  barcode: string | null | undefined,
  ignoredId?: string,
) {
  const repository = AppDataSource.getRepository(ProductVariant);

  if (sku) {
    const query = repository
      .createQueryBuilder("variant")
      .withDeleted()
      .where("LOWER(variant.sku) = :sku", { sku: sku.toLowerCase() });

    if (ignoredId) query.andWhere("variant.id != :ignoredId", { ignoredId });

    if (await query.getOne()) {
      throw new AppError(
        409,
        "PRODUCT_SKU_EXISTS",
        "A product variant with this SKU already exists.",
      );
    }
  }

  if (barcode) {
    const query = repository
      .createQueryBuilder("variant")
      .withDeleted()
      .where("variant.barcode = :barcode", { barcode });

    if (ignoredId) query.andWhere("variant.id != :ignoredId", { ignoredId });

    if (await query.getOne()) {
      throw new AppError(
        409,
        "PRODUCT_BARCODE_EXISTS",
        "A product variant with this barcode already exists.",
      );
    }
  }
}

export async function listPublicProducts(input: PublicProductListQuery) {
  const effectivePrice = "COALESCE(product.discountPrice, product.defaultPrice)";
  const query = productRepository()
    .createQueryBuilder("product")
    .innerJoin("product.category", "category")
    .where("product.status = :status", { status: "ACTIVE" })
    .andWhere("product.isActive = :active", { active: true })
    .andWhere("category.isActive = :active", { active: true });

  applySearchFilter(query, input.search);
  applyCategoryFilter(query, input.category);

  if (input.minPrice !== undefined) {
    query.andWhere(`${effectivePrice} >= :minPrice`, { minPrice: input.minPrice });
  }

  if (input.maxPrice !== undefined) {
    query.andWhere(`${effectivePrice} <= :maxPrice`, { maxPrice: input.maxPrice });
  }

  const total = await query.getCount();
  const pageQuery = query.clone().select("product.id", "id");

  switch (input.sort) {
    case "price_asc":
      pageQuery.orderBy(effectivePrice, "ASC").addOrderBy("product.id", "ASC");
      break;
    case "price_desc":
      pageQuery.orderBy(effectivePrice, "DESC").addOrderBy("product.id", "ASC");
      break;
    case "name_asc":
      pageQuery.orderBy("product.name", "ASC").addOrderBy("product.id", "ASC");
      break;
    default:
      pageQuery.orderBy("product.createdAt", "DESC").addOrderBy("product.id", "DESC");
  }

  const rawIds = await pageQuery
    .offset((input.page - 1) * input.limit)
    .limit(input.limit)
    .getRawMany<{ id: string | number }>();
  const ids = rawIds.map(({ id }) => String(id));
  const products = await loadProductsByIds(ids, false);
  const associations = await loadAssociations(ids, { publicOnly: true });

  return {
    products: products.map((product) =>
      toPublicProduct(
        product,
        associations.variantsByProduct.get(product.id) ?? [],
        associations.mediaByProduct.get(product.id) ?? [],
        false,
      ),
    ),
    pagination: {
      page: input.page,
      limit: input.limit,
      total,
      totalPages: Math.ceil(total / input.limit),
    },
  };
}

export async function getPublicProduct(identifier: string) {
  const query = productRepository()
    .createQueryBuilder("product")
    .innerJoinAndSelect("product.category", "category")
    .innerJoinAndSelect("product.productType", "productType")
    .leftJoinAndSelect("product.brand", "brand")
    .where("product.status = :status", { status: "ACTIVE" })
    .andWhere("product.isActive = :active", { active: true })
    .andWhere("category.isActive = :active", { active: true });

  if (/^[1-9]\d*$/.test(identifier)) {
    query.andWhere("product.id = :id", { id: identifier });
  } else {
    query.andWhere("product.slug = :slug", { slug: identifier.toLowerCase() });
  }

  const product = await query.getOne();

  if (!product) {
    throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found.");
  }

  const associations = await loadAssociations([product.id], {
    publicOnly: true,
  });

  return toPublicProduct(
    product,
    associations.variantsByProduct.get(product.id) ?? [],
    associations.mediaByProduct.get(product.id) ?? [],
    true,
  );
}

export async function listAdminProducts(input: AdminProductListQuery) {
  const query = productRepository()
    .createQueryBuilder("product")
    .leftJoin("product.category", "category");

  if (input.includeDeleted) query.withDeleted();
  if (input.status) query.andWhere("product.status = :status", { status: input.status });
  applySearchFilter(query, input.search);
  applyCategoryFilter(query, input.category);

  const total = await query.getCount();
  const rawIds = await query
    .clone()
    .select("product.id", "id")
    .orderBy("product.createdAt", "DESC")
    .addOrderBy("product.id", "DESC")
    .offset((input.page - 1) * input.limit)
    .limit(input.limit)
    .getRawMany<{ id: string | number }>();
  const ids = rawIds.map(({ id }) => String(id));
  const products = await loadProductsByIds(ids, input.includeDeleted);
  const associations = await loadAssociations(ids, {
    publicOnly: false,
    includeDeletedVariants: input.includeDeleted,
  });

  return {
    products: products.map((product) =>
      toAdminProduct(
        product,
        associations.variantsByProduct.get(product.id) ?? [],
        associations.mediaByProduct.get(product.id) ?? [],
        false,
      ),
    ),
    pagination: {
      page: input.page,
      limit: input.limit,
      total,
      totalPages: Math.ceil(total / input.limit),
    },
  };
}

export async function getAdminProduct(productId: string) {
  const products = await loadProductsByIds([productId], true);
  const product = products[0];

  if (!product) {
    throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found.");
  }

  const associations = await loadAssociations([product.id], {
    publicOnly: false,
    includeDeletedVariants: true,
  });

  return toAdminProduct(
    product,
    associations.variantsByProduct.get(product.id) ?? [],
    associations.mediaByProduct.get(product.id) ?? [],
    true,
  );
}

export async function createProduct(input: CreateProductInput) {
  const slug = input.slug ?? createSlug(input.name);
  await Promise.all([
    assertSlugAvailable(slug),
    assertProductRelations(
      input.productTypeId,
      input.categoryId,
      input.brandId ?? null,
    ),
  ]);

  const repository = productRepository();
  const product = repository.create({
    productTypeId: input.productTypeId,
    categoryId: input.categoryId,
    brandId: input.brandId ?? null,
    name: input.name,
    slug,
    shortDescription: input.shortDescription ?? null,
    description: input.description,
    defaultPrice: money(input.defaultPrice),
    defaultCostPrice:
      input.defaultCostPrice === undefined || input.defaultCostPrice === null
        ? null
        : money(input.defaultCostPrice),
    discountPrice:
      input.discountPrice === undefined || input.discountPrice === null
        ? null
        : money(input.discountPrice),
    status: input.status ?? "DRAFT",
    isFeatured: input.isFeatured ?? false,
    isActive: input.isActive ?? true,
  });

  await repository.save(product);
  return getAdminProduct(product.id);
}

export async function updateProduct(
  productId: string,
  input: UpdateProductInput,
) {
  const repository = productRepository();
  const product = await repository.findOneBy({ id: productId });

  if (!product) {
    throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found.");
  }

  const productTypeId = input.productTypeId ?? product.productTypeId;
  const categoryId = input.categoryId ?? product.categoryId;
  const brandId = input.brandId === undefined ? product.brandId : input.brandId;

  await assertProductRelations(productTypeId, categoryId, brandId);

  if (input.slug !== undefined) {
    await assertSlugAvailable(input.slug, product.id);
    product.slug = input.slug;
  }

  const defaultPrice = input.defaultPrice ?? Number(product.defaultPrice);
  const discountPrice =
    input.discountPrice === undefined
      ? product.discountPrice === null
        ? null
        : Number(product.discountPrice)
      : input.discountPrice;

  if (discountPrice !== null && discountPrice > defaultPrice) {
    throw new AppError(
      400,
      "PRODUCT_DISCOUNT_INVALID",
      "discountPrice cannot be greater than defaultPrice.",
    );
  }

  product.productTypeId = productTypeId;
  product.categoryId = categoryId;
  product.brandId = brandId;
  if (input.name !== undefined) product.name = input.name;
  if (input.shortDescription !== undefined) {
    product.shortDescription = input.shortDescription;
  }
  if (input.description !== undefined) product.description = input.description;
  if (input.defaultPrice !== undefined) product.defaultPrice = money(input.defaultPrice);
  if (input.defaultCostPrice !== undefined) {
    product.defaultCostPrice =
      input.defaultCostPrice === null ? null : money(input.defaultCostPrice);
  }
  if (input.discountPrice !== undefined) {
    product.discountPrice =
      input.discountPrice === null ? null : money(input.discountPrice);
  }
  if (input.status !== undefined) product.status = input.status;
  if (input.isFeatured !== undefined) product.isFeatured = input.isFeatured;
  if (input.isActive !== undefined) product.isActive = input.isActive;

  await repository.save(product);
  return getAdminProduct(product.id);
}

export async function deleteProduct(productId: string) {
  const repository = productRepository();
  const product = await repository.findOneBy({ id: productId });

  if (!product) {
    throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found.");
  }

  await repository.softRemove(product);
}

export async function restoreProduct(productId: string) {
  const repository = productRepository();
  const product = await repository.findOne({
    where: { id: productId },
    withDeleted: true,
  });

  if (!product) {
    throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found.");
  }

  if (!product.deletedAt) {
    throw new AppError(409, "PRODUCT_NOT_DELETED", "This product is not deleted.");
  }

  await assertProductRelations(
    product.productTypeId,
    product.categoryId,
    product.brandId,
  );
  await repository.restore(product.id);
  return getAdminProduct(product.id);
}

export async function createProductVariant(
  productId: string,
  input: CreateProductVariantInput,
  actorUserId: string,
) {
  const product = await productRepository().findOneBy({ id: productId });

  if (!product) {
    throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found.");
  }

  await Promise.all([
    assertVendor(input.vendorId),
    assertVariantIdentifiersAvailable(input.sku, input.barcode),
  ]);

  return AppDataSource.transaction(async (manager) => {
    const repository = manager.getRepository(ProductVariant);
    const existingCount = await repository.countBy({ productId });
    const shouldBeDefault = input.isDefault === true || existingCount === 0;

    if (shouldBeDefault) {
      await repository.update(
        { productId, isDefault: true },
        { isDefault: false },
      );
    }

    const variant = repository.create({
      productId,
      vendorId: input.vendorId ?? null,
      sku: input.sku,
      barcode: input.barcode ?? null,
      variantName: input.variantName ?? null,
      color: input.color ?? null,
      size: input.size ?? null,
      price: money(input.price),
      costPrice:
        input.costPrice === undefined || input.costPrice === null
          ? null
          : money(input.costPrice),
      stockQuantity: input.stockQuantity ?? 0,
      lowStockLevel: input.lowStockLevel ?? 5,
      weight:
        input.weight === undefined || input.weight === null
          ? null
          : money(input.weight),
      isDefault: shouldBeDefault,
      isActive: input.isActive ?? true,
    });

    await repository.save(variant);

    if (variant.stockQuantity > 0) {
      await manager.getRepository(InventoryMovement).save(
        manager.getRepository(InventoryMovement).create({
          productVariantId: variant.id,
          movementType: "INITIAL_STOCK",
          quantity: variant.stockQuantity,
          quantityBefore: 0,
          quantityAfter: variant.stockQuantity,
          referenceType: "PRODUCT_VARIANT",
          referenceId: variant.id,
          note: "Initial stock set when the variant was created.",
          createdById: actorUserId,
        }),
      );
    }

    return toAdminVariant(variant);
  });
}

export async function updateProductVariant(
  productId: string,
  variantId: string,
  input: UpdateProductVariantInput,
  actorUserId: string,
) {
  await Promise.all([
    assertVendor(input.vendorId),
    assertVariantIdentifiersAvailable(input.sku, input.barcode, variantId),
  ]);

  return AppDataSource.transaction(async (manager) => {
    const repository = manager.getRepository(ProductVariant);
    const variant = await repository.findOneBy({ id: variantId, productId });

    if (!variant) {
      throw new AppError(
        404,
        "PRODUCT_VARIANT_NOT_FOUND",
        "Product variant not found.",
      );
    }

    if (input.isDefault === true) {
      await repository.update(
        { productId, isDefault: true },
        { isDefault: false },
      );
    }

    const quantityBefore = variant.stockQuantity;
    if (input.vendorId !== undefined) variant.vendorId = input.vendorId;
    if (input.sku !== undefined) variant.sku = input.sku;
    if (input.barcode !== undefined) variant.barcode = input.barcode;
    if (input.variantName !== undefined) variant.variantName = input.variantName;
    if (input.color !== undefined) variant.color = input.color;
    if (input.size !== undefined) variant.size = input.size;
    if (input.price !== undefined) variant.price = money(input.price);
    if (input.costPrice !== undefined) {
      variant.costPrice = input.costPrice === null ? null : money(input.costPrice);
    }
    if (input.stockQuantity !== undefined) {
      variant.stockQuantity = input.stockQuantity;
    }
    if (input.lowStockLevel !== undefined) {
      variant.lowStockLevel = input.lowStockLevel;
    }
    if (input.weight !== undefined) {
      variant.weight = input.weight === null ? null : money(input.weight);
    }
    if (input.isDefault !== undefined) variant.isDefault = input.isDefault;
    if (input.isActive !== undefined) variant.isActive = input.isActive;

    await repository.save(variant);

    if (
      input.stockQuantity !== undefined &&
      input.stockQuantity !== quantityBefore
    ) {
      await manager.getRepository(InventoryMovement).save(
        manager.getRepository(InventoryMovement).create({
          productVariantId: variant.id,
          movementType: "ADJUSTMENT",
          quantity: input.stockQuantity - quantityBefore,
          quantityBefore,
          quantityAfter: input.stockQuantity,
          referenceType: "PRODUCT_VARIANT",
          referenceId: variant.id,
          note: "Stock adjusted through product variant administration.",
          createdById: actorUserId,
        }),
      );
    }

    return toAdminVariant(variant);
  });
}

export async function deleteProductVariant(
  productId: string,
  variantId: string,
) {
  await AppDataSource.transaction(async (manager) => {
    const repository = manager.getRepository(ProductVariant);
    const variant = await repository.findOneBy({ id: variantId, productId });

    if (!variant) {
      throw new AppError(
        404,
        "PRODUCT_VARIANT_NOT_FOUND",
        "Product variant not found.",
      );
    }

    const wasDefault = variant.isDefault;
    await repository.softRemove(variant);

    if (wasDefault) {
      const replacement = await repository.findOne({
        where: { productId, isActive: true },
        order: { id: "ASC" },
      });

      if (replacement) {
        replacement.isDefault = true;
        await repository.save(replacement);
      }
    }
  });
}
```


---

### `src/modules/returns/return-item.entity.ts`

```ts
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import { OrderItem } from "../orders/order-item.entity.js";
import { ProductReturn } from "./return.entity.js";

@Entity({ name: "return_items" })
export class ReturnItem {
  @PrimaryGeneratedColumn({ type: "bigint", unsigned: true })
  id!: string;

  @Column({ name: "return_id", type: "bigint", unsigned: true })
  returnId!: string;

  @ManyToOne(() => ProductReturn, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "return_id" })
  productReturn!: ProductReturn;

  @Column({ name: "order_item_id", type: "bigint", unsigned: true })
  orderItemId!: string;

  @ManyToOne(() => OrderItem, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "order_item_id" })
  orderItem!: OrderItem;

  @Column({ type: "int" })
  quantity!: number;

  @Column({ type: "varchar", length: 255 })
  reason!: string;

  @Column({ name: "item_condition", type: "varchar", length: 100, nullable: true })
  itemCondition!: string | null;

  @Column({ type: "boolean", default: false })
  restock!: boolean;

  @Column({ name: "refund_amount", type: "decimal", precision: 12, scale: 2, default: 0 })
  refundAmount!: string;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt!: Date;
}
```


---

### `src/modules/returns/return.entity.ts`

```ts
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import { Order } from "../orders/order.entity.js";
import { User } from "../users/user.entity.js";

@Entity({ name: "returns" })
export class ProductReturn {
  @PrimaryGeneratedColumn({ type: "bigint", unsigned: true })
  id!: string;

  @Column({ name: "return_number", type: "varchar", length: 50, unique: true })
  returnNumber!: string;

  @Column({ name: "order_id", type: "bigint", unsigned: true })
  orderId!: string;

  @ManyToOne(() => Order, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "order_id" })
  order!: Order;

  @Column({ name: "user_id", type: "bigint", unsigned: true })
  userId!: string;

  @ManyToOne(() => User, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ type: "varchar", length: 30 })
  status!: string;

  @Column({ type: "varchar", length: 255 })
  reason!: string;

  @Column({ name: "customer_note", type: "text", nullable: true })
  customerNote!: string | null;

  @Column({ name: "admin_note", type: "text", nullable: true })
  adminNote!: string | null;

  @Column({ name: "requested_at", type: "datetime" })
  requestedAt!: Date;

  @Column({ name: "approved_at", type: "datetime", nullable: true })
  approvedAt!: Date | null;

  @Column({ name: "rejected_at", type: "datetime", nullable: true })
  rejectedAt!: Date | null;

  @Column({ name: "completed_at", type: "datetime", nullable: true })
  completedAt!: Date | null;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "datetime" })
  updatedAt!: Date;
}
```


---

### `src/modules/role/role.entity.ts`

```ts
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity({ name: "roles" })
export class Role {
  @PrimaryGeneratedColumn({
    type: "bigint",
    unsigned: true,
  })
  id!: string;

  @Column({
    type: "varchar",
    length: 50,
  })
  name!: string;

  @Column({
    type: "varchar",
    length: 50,
    unique: true,
  })
  code!: string;

  @Column({
    type: "varchar",
    length: 255,
    nullable: true,
  })
  description!: string | null;

  @CreateDateColumn({
    name: "created_at",
    type: "datetime",
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: "updated_at",
    type: "datetime",
  })
  updatedAt!: Date;
}
```


---

### `src/modules/users/user-upload.middleware.ts`

```ts
import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { extname, resolve } from "node:path";
import multer from "multer";

import { env } from "../../config/env.js";
import { AppError } from "../../utils/app-error.js";

const profileDirectory = resolve(env.UPLOAD_DIR, "profiles");
mkdirSync(profileDirectory, { recursive: true });

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export const profileImageUpload = multer({
  storage: multer.diskStorage({
    destination: profileDirectory,
    filename(_request, file, callback) {
      callback(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`);
    },
  }),
  limits: { fileSize: env.MAX_UPLOAD_BYTES, files: 1 },
  fileFilter(_request, file, callback) {
    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(
        new AppError(
          400,
          "INVALID_IMAGE_TYPE",
          "Only JPEG, PNG and WebP images are allowed.",
        ),
      );
      return;
    }

    callback(null, true);
  },
});
```


---

### `src/modules/users/user.controller.ts`

```ts
import type { RequestHandler } from "express";

import { AppError } from "../../utils/app-error.js";
import {
  adminUpdateUserSchema,
  updateProfileSchema,
  userListQuerySchema,
} from "./user.schema.js";
import {
  adminUpdateUser,
  getProfile,
  listUsers,
  setProfileImage,
  updateProfile,
} from "./user.service.js";

function authUserId(request: Parameters<RequestHandler>[0]) {
  if (!request.auth) {
    throw new AppError(401, "AUTHENTICATION_REQUIRED", "Authentication is required.");
  }
  return request.auth.userId;
}

export const getMe: RequestHandler = async (request, response) => {
  response.status(200).json({
    success: true,
    data: { user: await getProfile(authUserId(request)) },
  });
};

export const updateMe: RequestHandler = async (request, response) => {
  response.status(200).json({
    success: true,
    data: {
      user: await updateProfile(
        authUserId(request),
        updateProfileSchema.parse(request.body),
      ),
    },
  });
};

export const uploadProfileImage: RequestHandler = async (request, response) => {
  if (!request.file) {
    throw new AppError(400, "IMAGE_REQUIRED", "Select an image to upload.");
  }

  response.status(200).json({
    success: true,
    data: {
      user: await setProfileImage(
        authUserId(request),
        `/uploads/profiles/${request.file.filename}`,
      ),
    },
  });
};

export const adminListUsers: RequestHandler = async (request, response) => {
  response.status(200).json({
    success: true,
    data: await listUsers(userListQuerySchema.parse(request.query)),
  });
};

export const adminUpdate: RequestHandler = async (request, response) => {
  const userId = request.params.userId;

  if (!userId || Array.isArray(userId)) {
    throw new AppError(400, "INVALID_USER_ID", "A valid user ID is required.");
  }

  response.status(200).json({
    success: true,
    data: {
      user: await adminUpdateUser(
        authUserId(request),
        userId,
        adminUpdateUserSchema.parse(request.body),
      ),
    },
  });
};
```


---

### `src/modules/users/user.entity.ts`

```ts
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import { Role } from "../role/role.entity.js";

@Entity({ name: "users" })
export class User {
  @PrimaryGeneratedColumn({
    type: "bigint",
    unsigned: true,
  })
  id!: string;

  @Column({
    name: "role_id",
    type: "bigint",
    unsigned: true,
  })
  roleId!: string;

  @ManyToOne(() => Role, {
    nullable: false,
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "role_id" })
  role!: Role;

  @Column({
    type: "varchar",
    length: 100,
  })
  name!: string;

  @Column({
    type: "varchar",
    length: 255,
    unique: true,
    nullable: true,
  })
  email!: string | null;

  @Column({
    name: "email_verified_at",
    type: "datetime",
    nullable: true,
  })
  emailVerifiedAt!: Date | null;

  @Column({
    type: "varchar",
    length: 20,
    unique: true,
  })
  phone!: string;

  @Column({
    name: "password_hash",
    type: "varchar",
    length: 255,
    select: false,
  })
  passwordHash!: string;

  @Column({
    name: "profile_image_url",
    type: "varchar",
    length: 500,
    nullable: true,
  })
  profileImageUrl!: string | null;

  @Column({
    name: "is_active",
    type: "boolean",
    default: true,
  })
  isActive!: boolean;

  @Column({
    name: "last_login_at",
    type: "datetime",
    nullable: true,
  })
  lastLoginAt!: Date | null;

  @CreateDateColumn({
    name: "created_at",
    type: "datetime",
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: "updated_at",
    type: "datetime",
  })
  updatedAt!: Date;

  @DeleteDateColumn({
    name: "deleted_at",
    type: "datetime",
    nullable: true,
  })
  deletedAt!: Date | null;
}
```


---

### `src/modules/users/user.routes.ts`

```ts
import { Router } from "express";

import { requireAuth } from "../auth/auth.middleware.js";
import { requireRole } from "../auth/authorization.middleware.js";
import {
  adminListUsers,
  adminUpdate,
  getMe,
  updateMe,
  uploadProfileImage,
} from "./user.controller.js";
import { profileImageUpload } from "./user-upload.middleware.js";

export const userRouter = Router();

userRouter.use(requireAuth);
userRouter.get("/me", getMe);
userRouter.patch("/me", updateMe);
userRouter.post(
  "/me/profile-image",
  profileImageUpload.single("image"),
  uploadProfileImage,
);
userRouter.get("/", requireRole("ADMIN", "OWNER"), adminListUsers);
userRouter.patch(
  "/:userId",
  requireRole("ADMIN", "OWNER"),
  adminUpdate,
);
```


---

### `src/modules/users/user.schema.ts`

```ts
import { z } from "zod";

const bangladeshPhoneSchema = z
  .string()
  .trim()
  .regex(/^01[3-9]\d{8}$/, "Use an 11-digit Bangladesh mobile number.");

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    phone: bangladeshPhoneSchema.optional(),
  })
  .refine((input) => input.name !== undefined || input.phone !== undefined, {
    message: "Provide at least one field to update.",
  });

export const userListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().max(100).optional(),
  role: z.enum(["CUSTOMER", "ADMIN", "OWNER"]).optional(),
  isActive: z.enum(["true", "false"]).transform((value) => value === "true").optional(),
});

export const adminUpdateUserSchema = z
  .object({
    roleCode: z.enum(["CUSTOMER", "ADMIN", "OWNER"]).optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (input) => input.roleCode !== undefined || input.isActive !== undefined,
    { message: "Provide a role or active status." },
  );

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UserListQuery = z.infer<typeof userListQuerySchema>;
export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>;
```


---

### `src/modules/users/user.service.ts`

```ts
import { Brackets } from "typeorm";

import { AppDataSource } from "../../database/data-source.js";
import { AppError } from "../../utils/app-error.js";
import { Role } from "../role/role.entity.js";
import { User } from "./user.entity.js";
import type {
  AdminUpdateUserInput,
  UpdateProfileInput,
  UserListQuery,
} from "./user.schema.js";

function publicProfile(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerifiedAt: user.emailVerifiedAt,
    phone: user.phone,
    profileImageUrl: user.profileImageUrl,
    isActive: user.isActive,
    role: user.role
      ? { id: user.role.id, code: user.role.code, name: user.role.name }
      : undefined,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

async function findActiveUser(userId: string) {
  const user = await AppDataSource.getRepository(User).findOne({
    where: { id: userId },
    relations: { role: true },
  });

  if (!user || !user.isActive) {
    throw new AppError(404, "USER_NOT_FOUND", "User not found.");
  }

  return user;
}

export async function getProfile(userId: string) {
  return publicProfile(await findActiveUser(userId));
}

export async function updateProfile(userId: string, input: UpdateProfileInput) {
  const repository = AppDataSource.getRepository(User);
  const user = await findActiveUser(userId);

  if (input.phone && input.phone !== user.phone) {
    const duplicate = await repository
      .createQueryBuilder("user")
      .withDeleted()
      .where("user.phone = :phone", { phone: input.phone })
      .andWhere("user.id <> :userId", { userId })
      .getOne();

    if (duplicate) {
      throw new AppError(409, "PHONE_ALREADY_USED", "The phone number is already used.");
    }
  }

  repository.merge(user, input);
  await repository.save(user);
  return publicProfile(user);
}

export async function setProfileImage(userId: string, imageUrl: string) {
  const repository = AppDataSource.getRepository(User);
  const user = await findActiveUser(userId);
  user.profileImageUrl = imageUrl;
  await repository.save(user);
  return publicProfile(user);
}

export async function listUsers(query: UserListQuery) {
  const repository = AppDataSource.getRepository(User);
  const builder = repository
    .createQueryBuilder("user")
    .leftJoinAndSelect("user.role", "role")
    .orderBy("user.createdAt", "DESC")
    .skip((query.page - 1) * query.limit)
    .take(query.limit);

  if (query.search) {
    builder.andWhere(
      new Brackets((where) => {
        where
          .where("LOWER(user.name) LIKE :search", {
            search: `%${query.search!.toLowerCase()}%`,
          })
          .orWhere("LOWER(user.email) LIKE :search", {
            search: `%${query.search!.toLowerCase()}%`,
          })
          .orWhere("user.phone LIKE :search", { search: `%${query.search}%` });
      }),
    );
  }

  if (query.role) {
    builder.andWhere("role.code = :role", { role: query.role });
  }

  if (query.isActive !== undefined) {
    builder.andWhere("user.isActive = :isActive", { isActive: query.isActive });
  }

  const [users, total] = await builder.getManyAndCount();
  return {
    users: users.map(publicProfile),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}

export async function adminUpdateUser(
  actorUserId: string,
  userId: string,
  input: AdminUpdateUserInput,
) {
  if (actorUserId === userId && input.isActive === false) {
    throw new AppError(400, "CANNOT_DISABLE_SELF", "You cannot disable your own account.");
  }

  const repository = AppDataSource.getRepository(User);
  const user = await repository.findOne({
    where: { id: userId },
    relations: { role: true },
  });

  if (!user) {
    throw new AppError(404, "USER_NOT_FOUND", "User not found.");
  }

  if (input.roleCode) {
    const role = await AppDataSource.getRepository(Role).findOneBy({
      code: input.roleCode,
    });
    if (!role) {
      throw new AppError(400, "ROLE_NOT_FOUND", "Role not found.");
    }
    user.role = role;
    user.roleId = role.id;
  }

  if (input.isActive !== undefined) {
    user.isActive = input.isActive;
  }

  await repository.save(user);
  return publicProfile(user);
}
```


---

### `src/modules/vendors/vendor.entity.ts`

```ts
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity({ name: "vendors" })
export class Vendor {
  @PrimaryGeneratedColumn({ type: "bigint", unsigned: true })
  id!: string;

  @Column({ type: "varchar", length: 150 })
  name!: string;

  @Column({ name: "company_name", type: "varchar", length: 150, nullable: true })
  companyName!: string | null;

  @Column({ name: "contact_person", type: "varchar", length: 100, nullable: true })
  contactPerson!: string | null;

  @Column({ type: "varchar", length: 20, nullable: true })
  phone!: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  email!: string | null;

  @Column({ type: "text", nullable: true })
  address!: string | null;

  @Column({ type: "text", nullable: true })
  notes!: string | null;

  @Column({ name: "is_active", type: "boolean", default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "datetime" })
  updatedAt!: Date;
}
```


---

### `src/routes/v1.ts`

```ts
import { Router } from "express";

import { authRouter } from "../modules/auth/auth.routes.js";
import { addressRouter } from "../modules/addresses/address.routes.js";
import { cartRouter } from "../modules/carts/cart.routes.js";
import {
  adminCategoryRouter,
  categoryRouter,
} from "../modules/categories/category.routes.js";
import { healthRouter } from "../modules/health/health.routes.js";
import { adminOrderRouter } from "../modules/orders/order-admin.routes.js";
import { orderRouter } from "../modules/orders/order.routes.js";
import {
  adminProductRouter,
  productRouter,
} from "../modules/products/product.routes.js";
import { userRouter } from "../modules/users/user.routes.js";

export const v1Router = Router();

v1Router.use("/health", healthRouter);
v1Router.use("/auth", authRouter);
v1Router.use("/addresses", addressRouter);
v1Router.use("/cart", cartRouter);
v1Router.use("/users", userRouter);
v1Router.use("/categories", categoryRouter);
v1Router.use("/products", productRouter);
v1Router.use("/admin/categories", adminCategoryRouter);
v1Router.use("/admin/products", adminProductRouter);
v1Router.use("/orders", orderRouter);
v1Router.use("/admin/orders", adminOrderRouter);
```


---

### `src/server.ts`

```ts
import "reflect-metadata";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { AppDataSource } from "./database/data-source.js";
import { logger } from "./config/logger.js";

async function startServer() {
  try {
    await AppDataSource.initialize();

    console.log("✅ MySQL database connected through TypeORM");

    const app = createApp();

    const server = app.listen(env.PORT, () => {
      const baseUrl = `http://localhost:${env.PORT}`;

      console.log(`✅ DokanBD API running at ${baseUrl}`);
      console.log(`📘 Swagger UI: ${baseUrl}/api-docs/`);
      console.log(`📄 OpenAPI JSON: ${baseUrl}/api-docs.json`);
    });

    const shutdown = (signal: string) => {
      logger.info({ signal }, "Shutting down DokanBD API");
      server.close(() => {
        void AppDataSource.destroy().finally(() => process.exit(0));
      });
    };

    process.once("SIGINT", () => shutdown("SIGINT"));
    process.once("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error) {
    console.error("❌ Unable to start DokanBD API.");
    console.error(error);

    process.exit(1);
  }
}

startServer();
```


---

### `src/services/mail.service.ts`

```ts
import nodemailer, { type Transporter } from "nodemailer";

import { env } from "../config/env.js";

interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

interface ActionEmailInput {
  to: string;
  recipientName: string;
  actionUrl: string;
}

let transporter: Transporter | null = null;

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[character] ?? character,
  );
}

function getTransporter() {
  if (!env.SMTP_HOST || !env.MAIL_FROM) {
    throw new Error(
      "Email is not configured. Set SMTP_HOST and MAIL_FROM in the environment.",
    );
  }

  const hasUsername = Boolean(env.SMTP_USER);
  const hasPassword = Boolean(env.SMTP_PASSWORD);

  if (hasUsername !== hasPassword) {
    throw new Error(
      "SMTP_USER and SMTP_PASSWORD must either both be set or both be omitted.",
    );
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      ...(env.SMTP_USER && env.SMTP_PASSWORD
        ? {
            auth: {
              user: env.SMTP_USER,
              pass: env.SMTP_PASSWORD,
            },
          }
        : {}),
    });
  }

  return transporter;
}

export async function sendMail(message: MailMessage) {
  if (!env.MAIL_FROM) {
    throw new Error("MAIL_FROM is not configured.");
  }

  return getTransporter().sendMail({
    from: env.MAIL_FROM,
    ...message,
  });
}

export function sendVerificationEmail({
  to,
  recipientName,
  actionUrl,
}: ActionEmailInput) {
  const safeName = escapeHtml(recipientName);
  const safeUrl = escapeHtml(actionUrl);

  return sendMail({
    to,
    subject: "Verify your DokanBD email",
    text: `Hello ${recipientName}, verify your email by opening this link: ${actionUrl}`,
    html: [
      `<p>Hello ${safeName},</p>`,
      "<p>Please verify your DokanBD email address.</p>",
      `<p><a href="${safeUrl}">Verify email</a></p>`,
      "<p>If you did not create this account, you can ignore this email.</p>",
    ].join(""),
  });
}

export function sendPasswordResetEmail({
  to,
  recipientName,
  actionUrl,
}: ActionEmailInput) {
  const safeName = escapeHtml(recipientName);
  const safeUrl = escapeHtml(actionUrl);

  return sendMail({
    to,
    subject: "Reset your DokanBD password",
    text: `Hello ${recipientName}, reset your password by opening this link: ${actionUrl}`,
    html: [
      `<p>Hello ${safeName},</p>`,
      "<p>We received a request to reset your DokanBD password.</p>",
      `<p><a href="${safeUrl}">Reset password</a></p>`,
      "<p>If you did not request this, you can ignore this email.</p>",
    ].join(""),
  });
}
```


---

### `src/types/express.d.ts`

```ts
declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        roleCode: string;
      };
    }
  }
}

export {};
```


---

### `src/utils/app-error.ts`

```ts
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}
```


---

### `src/utils/opaque-token.ts`

```ts
import { createHash, randomBytes } from "node:crypto";

export function hashOpaqueToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function generateOpaqueToken() {
  return randomBytes(32).toString("hex");
}
```


---

### `tests/auth-schema.test.ts`

```ts
import { describe, expect, it } from "vitest";

import {
  registerSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from "../src/modules/auth/auth.schema.js";

describe("authentication request validation", () => {
  it("normalizes a valid registration email", () => {
    const result = registerSchema.parse({
      name: "Test Customer",
      phone: "01700000001",
      email: "CUSTOMER@EXAMPLE.COM",
      password: "TestPass123",
    });

    expect(result.email).toBe("customer@example.com");
  });

  it("rejects an invalid Bangladesh phone number", () => {
    const result = registerSchema.safeParse({
      name: "Test Customer",
      phone: "12345",
      password: "TestPass123",
    });

    expect(result.success).toBe(false);
  });

  it("requires a 64-character email token", () => {
    expect(verifyEmailSchema.safeParse({ token: "short" }).success).toBe(false);
    expect(
      verifyEmailSchema.safeParse({ token: "a".repeat(64) }).success,
    ).toBe(true);
  });

  it("requires a strong-enough replacement password", () => {
    expect(
      resetPasswordSchema.safeParse({
        token: "a".repeat(64),
        password: "short",
      }).success,
    ).toBe(false);
  });
});
```


---

### `tests/auth-token.test.ts`

```ts
import { describe, expect, it } from "vitest";

import {
  generateOpaqueToken,
  hashOpaqueToken,
} from "../src/utils/opaque-token.js";

describe("opaque authentication tokens", () => {
  it("generates a 64-character hexadecimal token", () => {
    expect(generateOpaqueToken()).toMatch(/^[a-f0-9]{64}$/);
  });

  it("generates a different token each time", () => {
    expect(generateOpaqueToken()).not.toBe(generateOpaqueToken());
  });

  it("hashes the same token consistently without storing the raw token", () => {
    const rawToken = "a".repeat(64);
    const firstHash = hashOpaqueToken(rawToken);

    expect(firstHash).toBe(hashOpaqueToken(rawToken));
    expect(firstHash).toMatch(/^[a-f0-9]{64}$/);
    expect(firstHash).not.toBe(rawToken);
  });
});
```


---

### `tests/business-schema.test.ts`

```ts
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
```


---

### `tests/openapi.test.ts`

```ts
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

    expect(Object.keys(paths)).toHaveLength(41);
    expect(operationCount).toBe(53);
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
});
```
