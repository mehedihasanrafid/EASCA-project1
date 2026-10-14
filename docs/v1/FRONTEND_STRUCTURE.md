# DokanBD Frontend Structure

This guide defines a small, predictable structure for the React frontend. The
goal is not to create a folder for every function. The goal is to make each
business feature easy to find, understand, test, and change.

## 1. The simple rule

Use one module folder for one business area. Administrator modules live under
`src/admin`; storefront/auth features may remain under `src/features` until
their own migration:

```text
admin/<module>/
├── FeaturePage.tsx        # page composition
├── components/            # meaningful UI sections
├── hooks/                 # API loading and stateful workflows
├── utils/                 # pure calculations, only when needed
├── Feature.module.css     # feature-only styling, only when needed
└── index.ts               # the feature's public export
```

Do not create empty folders. A small feature can contain only its page and
`index.ts`. Do not put every button or tiny function in a separate file.

## 2. Responsibilities

### Route files

`AppRouter.tsx` imports migrated admin modules directly:

```ts
import { AdminProductsPage } from "../admin/products";
```

Old `pages/admin` one-line exports may remain temporarily only for compatibility
with older imports. They are not the primary route ownership location.

### Page

The page reads route parameters, composes sections, and handles page-level
actions. It should not contain a large table, complex form section, or raw API
loading workflow.

### Components

Create a component when a block has a clear name and responsibility, such as
`AdminProductSearch`, `AdminProductsTable`, or `VariantInventoryPanel`.
Keep small markup used only once inside its parent.

### Hooks

Hooks own asynchronous loading and related state. For example,
`useAdminProducts(search)` owns product loading, loading state, and errors.
Hooks must not contain visual markup.

### Utilities

Utilities are pure calculations with no React state and no browser side
effects. Variant combination generation, price calculations, CSV conversion,
and URL parameter conversion belong here.

### API

`src/api/` remains the central HTTP boundary. Components must not call
`fetch` directly. A hook or page calls a named API method.

### CSS

- Global tokens, reset, buttons, and feedback stay in `src/styles/`.
- Feature-specific CSS belongs beside the feature as a CSS Module.
- Tailwind utilities are suitable for small, local layout adjustments.
- Remove an old global rule only after its replacement has been verified.

## 3. Target application-area map

```text
src/
├── app/                 # router, providers and route guards
├── admin/               # administrator-only feature modules
│   ├── layout/          # administrator header
│   ├── navigation/      # administrator sidebar
│   ├── dashboard/
│   ├── products/
│   │   └── editor/
│   └── attributes/
├── storefront/          # public and signed-in customer experience
│   ├── shell/
│   ├── catalog/
│   ├── cart/
│   ├── checkout/
│   ├── account/
│   └── orders/
├── shared/              # reusable API client, UI, hooks, types and utilities
└── features/auth/       # authentication stays in its current location
```

Authentication is intentionally excluded from the current area migration. Its
routes, context, API calls, pages, and styles stay under their existing `src`
locations until a separate, explicitly tested authentication task is approved.

The administrator dashboard, header, sidebar, product list, product editor, and
attributes now live under `src/admin`. Their routes import those modules
directly. `pages/` remains valid only as a temporary compatibility location.

The existing `AdminSidebar` remains more deeply structured because it has
configuration, nested navigation, persistence, and reusable subcomponents.
Ordinary pages should use the smaller pattern shown in this guide.

## 4. Migration order

Migrate one working feature at a time:

1. Admin Product Editor and Variant Builder — implemented first under
   `src/admin/product-editor` with compatibility exports at the old paths.
2. Admin Products list and search — moved to `src/admin/products`.
3. Catalog management — replace the large combined settings file with
   categories, brands, product types, and properties features.
4. Admin Dashboard — moved to `src/admin/dashboard`; Orders and Coupons remain.
5. Storefront Home, Product Detail, and Search.
6. Customer Account, Addresses, Orders, Cart, and Checkout.
7. Keep authentication unchanged unless it receives its own migration task.
8. Remove verified unused global CSS and old compatibility files.

Every migration must finish with type checking, tests, a production build, and
a browser check before beginning the next feature.

The Admin Dashboard now follows this pattern as well. Its complete learning and
maintenance reference is `docs/v1/ADMIN_DASHBOARD_REFERENCE.md`.

The Product Attributes page also follows this pattern. Its form, database
notes, and safe editing guide are in
`docs/v1/PRODUCT_ATTRIBUTES_REFERENCE.md`.

## 5. Reference implementation: Admin Products

```text
admin/products/
├── AdminProductsPage.tsx
├── components/
│   ├── AdminProductSearch.tsx
│   ├── AdminProductSearch.module.css
│   └── AdminProductsTable.tsx
├── hooks/
│   └── useAdminProducts.ts
└── index.ts
```

The data flow is intentionally direct:

```text
URL search parameter
        ↓
AdminProductsPage
        ↓
useAdminProducts
        ↓
adminProductApi
        ↓
AdminProductsTable
```

This is the default model for future feature migrations.

## 6. Size guidelines

These are guidance rather than strict build rules:

- Page: usually under 150 lines.
- Component: usually under 250 lines.
- Hook: one workflow.
- Utility file: one related group of pure functions.
- CSS Module: styles for one feature or component.

When a file grows beyond these ranges, split it by visible responsibility, not
by arbitrary line count.

## 7. Reference implementation: Add/Edit Product

The product editor is the first application-area module:

```text
admin/product-editor/
├── AdminProductEditorPage.tsx                  # section-order coordinator
├── AdminProductEditorPage.module.css
├── index.ts
├── components/
│   ├── ProductEditorHeader/
│   ├── ProductGeneralSection/
│   ├── VariantOptionsSection/
│   ├── VariantPreferencesSection/
│   │   └── QuantityPricingEditor.tsx
│   ├── SelectedSkuEditor/
│   ├── VariantCombinationsTable/
│   └── AdditionalProductDetails/
│   │   └── ProductMediaLibrary.tsx
├── hooks/
│   ├── useProductEditor.ts                     # page state and orchestration
│   ├── useProductCatalogOptions.ts             # catalog and option-path state
│   └── useProductMedia.ts                      # saved/pending media workflow
├── utils/
│   ├── productEditor.validation.ts
│   ├── productEditor.mappers.ts
│   ├── productEditor.save.ts
│   ├── variantCsv.ts
│   └── variantPaths.ts
├── types/
│   └── productEditor.types.ts
├── tests/
│   ├── ProductGeneralSection.test.tsx
│   ├── VariantPreferencesSection.test.tsx
│   ├── SelectedSkuEditor.test.tsx
│   └── VariantCombinationsTable.test.tsx
```

The visible order is General Information, Variant Options, Variant
Preferences, Selected SKU, All Variant Combinations, and Additional Product
Details. Each visual section owns a CSS Module. The existing global product
editor stylesheet remains as a verified compatibility layer and should be
reduced gradually, selector by selector, rather than deleted in one change.
The reusable method for applying this structure to other modules is documented
in `docs/v1/FEATURE_MODULE_RESTRUCTURE_GUIDE.md`.
