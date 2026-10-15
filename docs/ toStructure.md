I completed a read-only audit of the full frontend. No project files were changed.

The project can be restructured safely, feature by feature. There are duplicate paths and repeated utilities, but there are no dependency cycles or major duplicated business engines.

## Current condition

Already reasonably modular:

- `admin/product-editor`
- `admin/dashboard`
- `admin/products`
- `admin/attributes`
- `admin/navigation/AdminSidebar`
- `features/catalog`
- `features/orders`

Still mixed or oversized:

| Area                           | Main problem                                                        |
| ------------------------------ | ------------------------------------------------------------------- |
| `AdminCatalogSettingsPage.tsx` | 615 lines containing categories, brands and product types           |
| `ProductDetail.tsx`            | 437 lines containing gallery, variants, pricing and cart operations |
| `AddressesPage.tsx`            | 326 lines                                                           |
| `CheckoutPage.tsx`             | 306 lines                                                           |
| `CategoryNavigation.tsx`       | 307 lines                                                           |
| `CartPage.tsx`                 | 240 lines                                                           |
| `AdminOrdersPage.tsx`          | 184 lines                                                           |
| `AdminOrderDetailPage.tsx`     | 174 lines                                                           |
| `AdminCouponsPage.tsx`         | 149 compressed lines                                                |
| `AppRouter.tsx`                | Routes and four repeated authentication guards                      |

## Duplicate and unnecessary code found

### 1. Eight obsolete compatibility files

These create duplicate import locations but are not used by the application:

- `pages/admin/AdminOverviewPage.tsx`
- `pages/admin/AdminProductEditorPage.tsx`
- `pages/admin/AdminProductsPage.tsx`
- `pages/admin/AdminPropertiesPage.tsx`
- `pages/dashboard/AdminPriceTierBuilder.tsx`
- `pages/dashboard/discountDraft.ts`
- `pages/dashboard/variantCsv.ts`
- `pages/dashboard/variantPaths.ts`

The last three are retained only because old tests import them.

We can move those tests to `admin/product-editor/tests` and remove all eight files. The browser redirects `/admin/properties` and `/admin/catalog` should remain.

### 2. Currency formatting

The same BDT formatter is recreated in at least eight places, including:

- Product cards
- Product details
- Cart
- Checkout
- Orders
- Admin products
- Admin dashboard
- Coupons

This should become one shared `formatBdt()` utility.

### 3. API error handling

`error instanceof ApiException` handling appears approximately 34 times.

It should become:

```ts
getApiErrorMessage(error, "Fallback message");
```

### 4. Role checking

This is repeated in the router, header, cart and product pages:

```ts
role === "ADMIN" || role === "OWNER";
```

It should become shared functions such as:

```ts
isStaffRole(role);
isCustomerRole(role);
```

### 5. Duplicate API types

Repeated or overlapping types include:

- Two `CategoryOption` definitions
- Multiple pagination shapes
- Multiple applied-pricing shapes
- Two unrelated types named `FlatCategoryOption`

These should have one source of truth or clearer names.

### 6. Checkout duplicates order UI

Checkout manually renders products, totals and delivery details even though reusable components already exist:

- `OrderItems`
- `OrderTotals`
- `OrderAddress`

### 7. Unnecessary pagination wrapper

`OrderPagination.tsx` only passes props to the shared `Pagination` component. It can be removed.

### 8. CSS duplication and leakage

Current large global files:

- `product-editor.css`: 964 lines
- `admin.css`: 920 lines
- `product.css`: 550 lines
- `checkout.css`: 441 lines
- `cart.css`: 365 lines

Specific problems:

- `.admin-row-actions` is defined twice.
- `.variant-table-note` is split between two global CSS files.
- Checkout CSS contains account/address styles.
- Cart CSS contains checkout and admin selectors.
- Several old admin selectors are no longer used.
- Four product-editor CSS modules are identical placeholder files.

## Product-editor is a good model—but not perfect

The good parts are:

- A thin 54-line page
- Feature-owned components
- Hooks, utilities, types and tests
- Public `index.ts`

But it still has:

- `useProductCatalogOptions.ts`: 540 lines
- `useProductEditor.ts`: 368 lines
- `variantCsv.ts`: 392 lines
- `ProductVariantPaths.module.css`: 688 lines
- Global `product-editor.css`: 964 lines

Therefore, we should copy its ownership pattern, not blindly copy all its internal decisions.

## Recommended final structure

This preserves your preferred `admin` and `customer` division. Public storefront pages can belong to `customer` because they share the same header, products and shopping flow.

```text
web/src/
├── app/
│   ├── App.tsx
│   ├── routes/
│   │   ├── AppRouter.tsx
│   │   ├── AdminRoutes.tsx
│   │   ├── CustomerRoutes.tsx
│   │   └── RouteGuards.tsx
│   └── layouts/
│       ├── AdminLayout/
│       └── CustomerLayout/
│
├── admin/
│   ├── shared/
│   ├── dashboard/
│   ├── products/
│   ├── product-editor/
│   ├── categories/
│   ├── brands/
│   ├── product-types/
│   ├── attributes/
│   ├── orders/
│   ├── coupons/
│   ├── layout/
│   └── navigation/
│
├── customer/
│   ├── home/
│   ├── catalog/
│   ├── product/
│   ├── account/
│   ├── addresses/
│   ├── cart/
│   ├── checkout/
│   ├── orders/
│   └── layout/
│
├── auth/
│   ├── pages/
│   ├── components/
│   ├── hooks/
│   ├── demo-login/
│   └── index.ts
│
├── shared/
│   ├── components/
│   │   ├── PageContainer/
│   │   ├── PageHeading/
│   │   ├── Pagination/
│   │   ├── AsyncState/
│   │   └── ProductMediaView/
│   ├── utils/
│   │   ├── apiError.ts
│   │   ├── currency.ts
│   │   ├── dateTime.ts
│   │   ├── queryParams.ts
│   │   └── roles.ts
│   └── types/
│
├── api/
│   ├── client.ts
│   ├── auth.ts
│   ├── products.ts
│   ├── cart.ts
│   ├── orders.ts
│   └── admin/
│
└── styles/
    ├── tokens.css
    ├── base.css
    └── tailwind.css
```

A normal module should look like:

```text
feature-name/
├── FeaturePage.tsx
├── FeaturePage.module.css
├── components/
├── hooks/
├── utils/
├── types/
├── tests/
└── index.ts
```

We should not create empty folders merely to satisfy this structure.

## Step-by-step implementation plan

### Step 1 — Remove obsolete compatibility code

- Move three old tests into `admin/product-editor/tests`.
- Change them to import the real utilities.
- Delete the eight unused compatibility files.
- Keep browser route redirects.
- Verify all tests and routes.

This is the safest first change.

### Step 2 — Shared frontend foundation

Create:

- `formatBdt`
- `getApiErrorMessage`
- `isStaffRole`
- `buildQueryParams`
- Shared pagination and pricing types
- `PageContainer`, `PageHeading` and common async states

Only replace duplication where tests already cover behaviour.

### Step 3 — Coupons as the first complete module

Create:

```text
admin/coupons/
├── AdminCouponsPage.tsx
├── components/CouponForm/
├── components/CouponsTable/
├── hooks/useAdminCoupons.ts
├── types/
├── utils/couponDraft.ts
├── tests/
└── index.ts
```

This is a smaller feature and will confirm our module standard.

### Step 4 — Separate Brands

Extract brands from the 615-line catalog page into `admin/brands`.

### Step 5 — Separate Categories

Create `admin/categories`, preserving:

- Parent/child relationships
- Product-type assignments
- Homepage visibility
- Cycle-prevention rules

### Step 6 — Complete Product Types

Move `ProductTypeAttributeEditor` into a complete `admin/product-types` module.

After Steps 4–6, delete `AdminCatalogSettingsPage.tsx`.

### Step 7 — Admin Orders

Create hooks and components for:

- Order filters
- Orders table
- Order loading
- Status actions
- Status workflow rules

Retain neutral shared order display components.

### Step 8 — Customer product and catalog

Move:

- `Home`
- Search results
- Product detail
- Product card
- Category carousel
- Product search

Break Product Detail into gallery, options, pricing and purchase controls.

### Step 9 — Customer account and addresses

Extract address hooks, form, cards, mapping utilities and tests.

### Step 10 — Cart, customer orders and checkout

- Modularize cart
- Move customer orders
- Reuse order components in checkout
- Extract coupon and confirmation components

### Step 11 — Authentication and routing

- Keep auth separate from admin/customer.
- Extract shared auth page shell.
- Centralize route guards.
- Give Admin and Customer separate route layouts.
- Remove pathname checking from `MainLayout`.

### Step 12 — Product-editor internal cleanup

After other modules are stable:

- Split the two oversized hooks.
- Split CSV parsing and exporting.
- Move global product-editor CSS into real component modules.
- Remove placeholder CSS modules and obsolete rules.

### Step 13 — Final CSS and API cleanup

- Leave only tokens, base styles and Tailwind globally.
- Delete verified unused selectors.
- Split `adminCatalog.ts` and `orders.ts` by domain.
- Add public `index.ts` files and prevent deep cross-feature imports.

## Verification rule for every step

Each step will:

1. Move only one bounded feature.
2. Preserve URLs and API behavior.
3. Add or move tests before deleting old files.
4. Run type-check.
5. Run focused tests.
6. Run all tests.
7. Run the production build.
8. Browser-test affected routes.
9. Remove old files only after imports reach zero.

The correct next action is **Step 1: remove the eight obsolete compatibility files and relocate their tests**.
