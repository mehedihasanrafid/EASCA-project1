# DokanBD Project Design — Version 1

**Status:** Planning baseline  
**Product type:** Web-first, mobile-ready e-commerce platform  
**Primary market:** Bangladesh  
**Version:** 1.0

## 1. Purpose

DokanBD will provide a marketplace for clothing, accessories, small electronics, and similar consumer products. Version 1 focuses on a responsive web application and a reusable REST API. A future React Native and Expo application will use the same API.

## 2. Version 1 goals

- Let customers discover, compare, purchase, and review products.
- Let vendors manage their products, prices, stock, and orders.
- Let administrators manage users, vendors, catalog data, orders, returns, and platform settings.
- Support guest browsing and authenticated checkout.
- Keep business logic independent from the web interface so a mobile client can be added later.
- Establish clear boundaries for security, testing, deployment, and future scaling.

## 3. User roles

### Guest

- Browse categories, brands, vendors, and products.
- Search and filter the catalog.
- View product details and public reviews.
- Register or sign in.

### Customer

- Manage profile and saved addresses.
- Add products to a cart and complete checkout.
- View order history and order status.
- Request eligible cancellations or returns.
- Submit product ratings and reviews after purchase.

### Vendor

- Maintain a vendor profile.
- Create and update products assigned to permitted categories and brands.
- Manage pricing, images, variants, and inventory.
- View and process vendor-related order items.
- Review sales and inventory summaries.

### Administrator

- Manage users, roles, vendors, categories, brands, and products.
- Approve or suspend vendors and product listings.
- Monitor orders, payments, inventory, returns, and audit activity.
- Configure platform-level settings and reports.

## 4. Proposed technology

| Area | Version 1 choice |
|---|---|
| Web client | React, Vite, TypeScript |
| API | Node.js, Express, TypeScript |
| Database | MySQL |
| Authentication | Short-lived access tokens and rotated refresh tokens |
| Validation | Schema-based request validation |
| API style | Versioned REST API under `/api/v1` |
| Future mobile | React Native, Expo, TypeScript |
| Testing | Unit, integration, API, and end-to-end tests |
| Deployment | Separate web, API, and managed database services |

Specific libraries and service providers should be selected when implementation begins rather than locked by this folder-design document.

## 5. High-level architecture

```text
Web client ───────────────┐
                         │ HTTPS/JSON
Future mobile client ────┼──────────────> Express REST API
                         │                     │
Admin web interface ─────┘                     ├── MySQL
                                               ├── Object storage for media
                                               ├── Payment provider
                                               ├── Email/SMS provider
                                               └── Logging and monitoring
```

The API is the system boundary for all clients. Controllers handle HTTP concerns, services implement business rules, repositories handle persistence, and entities/types define domain data. External providers are accessed through services so providers can be replaced without changing core modules.

## 6. Repository folder design

The repository initially keeps directories only. Implementation files will be added one step at a time.

```text
EASCA-project1/
├── web/
│   └── src/
│       ├── api/
│       ├── assets/
│       ├── components/
│       ├── features/
│       ├── hooks/
│       ├── layouts/
│       ├── pages/
│       ├── routes/
│       ├── styles/
│       ├── types/
│       └── utils/
├── server/
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── database/
│       ├── entities/
│       ├── middlewares/
│       ├── modules/
│       │   ├── addresses/
│       │   ├── admin/
│       │   ├── auth/
│       │   ├── brands/
│       │   ├── carts/
│       │   ├── categories/
│       │   ├── inventory/
│       │   ├── orders/
│       │   ├── payments/
│       │   ├── products/
│       │   ├── returns/
│       │   ├── users/
│       │   └── vendors/
│       ├── repositories/
│       ├── routes/
│       ├── services/
│       ├── types/
│       ├── utils/
│       └── validators/
├── mobile/
└── docs/
    ├── v1/
    │   └── PROJECT_DESIGN.md
    ├── requirements/
    ├── database/
    ├── api/
    ├── diagrams/
    ├── testing/
    └── deployment/
```

## 7. Folder responsibilities

### Web

- `api`: HTTP client configuration and typed API calls.
- `assets`: Images, icons, and other bundled static assets.
- `components`: Reusable, presentation-focused UI components.
- `features`: Business features such as authentication, catalog, cart, and checkout.
- `hooks`: Shared React hooks.
- `layouts`: Public, customer, vendor, and administrator page shells.
- `pages`: Route-level screens.
- `routes`: Route definitions, guards, and role-based access rules.
- `styles`: Global tokens, resets, themes, and shared styles.
- `types`: Web-specific TypeScript types.
- `utils`: Pure browser-side helper functions.

### Server

- `config`: Validated environment and application configuration.
- `controllers`: HTTP request/response adapters.
- `database`: Connection, migration, seed, and transaction support.
- `entities`: Domain and persistence entity definitions.
- `middlewares`: Authentication, authorization, errors, logging, and rate limiting.
- `modules`: Feature-owned code grouped by business domain.
- `repositories`: Database access abstractions and queries.
- `routes`: API route registration and version grouping.
- `services`: Business rules and external-service coordination.
- `types`: Shared server type declarations.
- `utils`: Small reusable server utilities.
- `validators`: Request and domain validation schemas.

### Documentation

- `requirements`: Functional requirements, non-functional requirements, and acceptance criteria.
- `database`: ER diagrams, table definitions, indexing, migrations, and seed plans.
- `api`: Endpoint contracts, payload examples, errors, and authentication rules.
- `diagrams`: Architecture, sequence, state, and workflow diagrams.
- `testing`: Test strategy, cases, test data, and release checklists.
- `deployment`: Environment, CI/CD, infrastructure, backup, and rollback guidance.

## 8. Server modules

### Auth

Registration, login, logout, token refresh, password reset, email/phone verification, session revocation, and authentication audit events.

### Users

Customer and staff profiles, role assignments, account status, preferences, and safe account deletion or anonymization.

### Products

Product details, descriptions, media, attributes, variants, pricing, publication state, search metadata, and product reviews integration.

### Categories

Hierarchical catalog navigation, category visibility, display order, and product assignment rules.

### Brands

Brand identity, descriptions, logos, status, and product association.

### Vendors

Vendor onboarding, approval, profile, store settings, status, ownership, and vendor-scoped permissions.

### Carts

Guest or customer carts, cart items, quantities, price snapshots, validation, and cart merging after login.

### Orders

Checkout, order creation, order items, totals, discounts, taxes, delivery charges, status history, cancellation, and fulfillment coordination.

### Addresses

Customer shipping and billing addresses, validation, default-address selection, and immutable order address snapshots.

### Inventory

Stock per product variant, reservations during checkout, adjustments, low-stock thresholds, and movement history.

### Returns

Return eligibility, requests, item inspection, approval or rejection, refund coordination, and return status history.

### Admin

Moderation, dashboard data, operational controls, configuration, reports, and audit-log access.

### Payments

Provider abstraction, payment initiation, provider callbacks, signature verification, transaction status, refunds, reconciliation, and idempotency.

## 9. Core data model

The initial database design should cover these entities:

- `users`, `roles`, `user_roles`, `refresh_tokens`
- `vendors`, `vendor_users`
- `categories`, `brands`
- `products`, `product_images`, `product_variants`, `product_attributes`
- `inventory_items`, `inventory_movements`, `inventory_reservations`
- `carts`, `cart_items`
- `addresses`
- `orders`, `order_items`, `order_addresses`, `order_status_history`
- `payments`, `payment_transactions`, `refunds`
- `returns`, `return_items`, `return_status_history`
- `reviews`
- `audit_logs`

Important modeling rules:

- Use numeric or UUID primary keys consistently across the system.
- Store money as fixed-precision decimal values and always record currency.
- Snapshot product name, SKU, price, tax, discount, and vendor on order items.
- Snapshot shipping and billing addresses on the order.
- Keep inventory changes append-only through movement records.
- Use soft deletion only where recovery or audit requirements justify it.
- Add timestamps and acting-user information to operational records.
- Protect against duplicate payment callbacks and duplicate order creation with idempotency keys.

## 10. Main workflows

### Customer purchase

1. Customer discovers a product and selects a variant.
2. The cart validates current product availability and quantity.
3. Checkout validates identity, address, pricing, delivery options, and stock.
4. The server creates a pending order and reserves inventory in one controlled workflow.
5. The payment provider is initialized.
6. A verified provider callback changes payment and order state.
7. Fulfillment begins only after the configured payment rule is satisfied.
8. Notifications are sent without blocking the order transaction.

### Vendor product publication

1. Vendor creates a draft product.
2. Required category, brand, variant, price, media, and stock data are validated.
3. The product is submitted for review when moderation is required.
4. An administrator approves or rejects the listing with a reason.
5. Approved products become searchable and purchasable.

### Return and refund

1. Customer selects eligible delivered order items.
2. The server validates the return window and item state.
3. A return request is created with evidence and reason.
4. Vendor or administrator reviews the request.
5. Received goods are inspected when required.
6. Approved value is refunded through the original or configured payment channel.
7. Inventory disposition and audit history are recorded.

## 11. API design conventions

- Prefix all Version 1 endpoints with `/api/v1`.
- Use plural resource names, for example `/products` and `/orders`.
- Use HTTP methods and status codes consistently.
- Return a consistent success and error envelope.
- Validate path, query, and body input before business logic runs.
- Paginate all unbounded collections.
- Support safe filtering and sorting through documented allowlists.
- Use stable machine-readable error codes in addition to human messages.
- Require idempotency for checkout, payment, refund, and other retry-sensitive operations.
- Never expose internal stack traces or secrets to clients.

Representative endpoint groups:

```text
/api/v1/auth/*
/api/v1/users/*
/api/v1/products/*
/api/v1/categories/*
/api/v1/brands/*
/api/v1/vendors/*
/api/v1/carts/*
/api/v1/orders/*
/api/v1/addresses/*
/api/v1/inventory/*
/api/v1/returns/*
/api/v1/payments/*
/api/v1/admin/*
```

## 12. Order and payment states

Suggested order states:

```text
pending_payment -> confirmed -> processing -> shipped -> delivered
       |               |            |
       v               v            v
    cancelled       cancelled    return_requested -> returned
```

Suggested payment states:

```text
pending -> authorized -> paid -> partially_refunded -> refunded
   |           |          |
   v           v          v
 failed      voided     disputed
```

State transitions must be enforced on the server and recorded in history tables. Payment callbacks must be verified and safely repeatable.

## 13. Security baseline

- Hash passwords with a modern adaptive password hashing algorithm.
- Keep access tokens short-lived and rotate refresh tokens.
- Store refresh tokens securely and allow session revocation.
- Enforce role and resource ownership checks on the server.
- Validate and normalize all client input.
- Rate-limit login, password reset, checkout, and payment endpoints.
- Apply secure HTTP headers and restricted cross-origin rules.
- Use parameterized database access.
- Validate uploads by size, content type, and actual file content.
- Keep secrets outside source control and rotate compromised values.
- Verify payment callback signatures and source requirements.
- Record sensitive administrative actions in append-only audit logs.
- Avoid logging passwords, tokens, payment credentials, or unnecessary personal data.

## 14. Non-functional requirements

- Responsive UI from small mobile screens to desktop.
- Accessible controls, navigation, forms, and semantic content.
- Predictable API error behavior and meaningful operational logs.
- Pagination and indexing for catalog and administrative lists.
- Database transactions around orders, payments, and inventory changes.
- Backup and restore procedures tested before production launch.
- Health checks and monitoring for the API and database dependencies.
- Clear separation of development, test, staging, and production environments.
- Localization-ready presentation, including Bangla and English support when prioritized.
- Currency and time-zone handling that does not depend on browser defaults.

## 15. Testing strategy

### Unit tests

Test price calculations, discount rules, inventory rules, state transitions, authorization decisions, and validation logic.

### Integration tests

Test repositories, database transactions, authentication flows, order creation, stock reservation, and payment callback handling against an isolated test database.

### API tests

Test endpoint contracts, status codes, pagination, validation failures, authorization, idempotency, and error envelopes.

### Web tests

Test components and user flows for authentication, catalog browsing, cart, checkout, customer orders, vendor management, and administration.

### End-to-end tests

Cover at least registration, login, product discovery, cart, checkout, order confirmation, vendor fulfillment, cancellation, return, and refund paths.

## 16. Deployment design

- Build the web application as static assets served through a CDN-capable host.
- Run the API as a stateless service behind HTTPS.
- Use a managed MySQL service where possible.
- Store product media in object storage rather than on API server disks.
- Run migrations as a controlled release step.
- Use environment-specific secrets and configuration.
- Centralize structured logs and error monitoring.
- Provide readiness and liveness health checks.
- Back up the database automatically and verify restore procedures.
- Define rollback steps for both application deployments and database migrations.

## 17. Version 1 implementation sequence

1. Confirm functional requirements and role permissions.
2. Finalize database ER design and naming conventions.
3. Create API conventions, environment strategy, and error format.
4. Scaffold the server and web applications.
5. Implement authentication, users, categories, brands, and vendors.
6. Implement products, variants, media, search, and inventory.
7. Implement carts, addresses, checkout, and orders.
8. Integrate the selected payment provider with verified callbacks.
9. Add vendor and administrator workflows.
10. Implement returns, refunds, reporting, and auditing.
11. Complete security review, performance checks, accessibility checks, and release testing.
12. Deploy to staging, complete acceptance testing, then release production.

## 18. Deferred work

These items are intentionally outside the initial foundation unless later requirements prioritize them:

- Native mobile application implementation
- Multiple countries or currencies
- Advanced promotions and loyalty programs
- Recommendation engines
- Real-time customer chat
- Multi-warehouse optimization
- Subscription products
- Cross-border tax and customs handling

## 19. Decisions required before implementation

- Marketplace commission and vendor settlement model
- Supported payment providers and cash-on-delivery rules
- Delivery partners, delivery zones, and delivery-charge calculation
- Product approval and moderation policy
- Return windows and refund rules by product category
- Inventory ownership and warehouse model
- Required languages and currency behavior
- Tax and invoice requirements
- Guest checkout policy
- Product review moderation policy
- Production hosting, storage, email, and SMS providers

This document is the Version 1 design baseline. Detailed requirements, database definitions, API contracts, diagrams, test cases, and deployment procedures should be added to their dedicated documentation folders as implementation decisions are approved.

