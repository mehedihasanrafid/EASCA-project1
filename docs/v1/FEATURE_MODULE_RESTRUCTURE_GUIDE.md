# DokanBD Feature Module Restructure Guide

This document explains the structure now used by the Product Editor and how to
apply the same pattern safely to Orders, Coupons, Customers, Dashboard, Catalog,
and future modules.

Authentication is deliberately excluded. Keep the current authentication code,
context, guards, token handling, and routes in their existing `src` locations
until authentication receives a separate migration and security test plan.

## 1. Why this structure exists

A maintainable feature should answer five questions quickly:

1. Where is the page assembled?
2. Which component renders the part I can see?
3. Which hook owns the changing browser state?
4. Which pure function validates or transforms the data?
5. Which function writes the data to the backend?

The module structure gives each answer one predictable location. It is not a
new framework and does not change React, the API, or the database.

```text
Page -> components -> hooks -> API client
                     ↓
              pure utilities
                     ↓
                 shared types
```

The page controls order. Components control markup. Hooks control React state
and effects. Utilities control rules, mapping, and persistence. API clients
still control HTTP requests.

## 2. Product Editor reference structure

```text
web/src/admin/product-editor/
├── AdminProductEditorPage.tsx
├── AdminProductEditorPage.module.css
├── index.ts
├── components/
│   ├── ProductEditorHeader/
│   │   ├── ProductEditorHeader.tsx
│   │   └── ProductEditorHeader.module.css
│   ├── ProductGeneralSection/
│   │   ├── ProductGeneralSection.tsx
│   │   └── ProductGeneralSection.module.css
│   ├── VariantOptionsSection/
│   │   ├── VariantOptionsSection.tsx
│   │   └── VariantOptionsSection.module.css
│   ├── VariantPreferencesSection/
│   │   ├── VariantPreferencesSection.tsx
│   │   ├── VariantPreferencesSection.module.css
│   │   └── QuantityPricingEditor.tsx
│   ├── SelectedSkuEditor/
│   │   ├── SelectedSkuEditor.tsx
│   │   └── SelectedSkuEditor.module.css
│   ├── VariantCombinationsTable/
│   │   ├── VariantCombinationsTable.tsx
│   │   └── VariantCombinationsTable.module.css
│   └── AdditionalProductDetails/
│       ├── AdditionalProductDetails.tsx
│       ├── ProductMediaLibrary.tsx
│       └── AdditionalProductDetails.module.css
├── hooks/
│   ├── useProductEditor.ts
│   ├── useProductCatalogOptions.ts
│   └── useProductMedia.ts
├── utils/
│   ├── productEditor.validation.ts
│   ├── productEditor.mappers.ts
│   ├── productEditor.save.ts
│   ├── variantPaths.ts
│   └── variantCsv.ts
├── types/
│   └── productEditor.types.ts
└── tests/
    ├── ProductGeneralSection.test.tsx
    ├── VariantPreferencesSection.test.tsx
    ├── SelectedSkuEditor.test.tsx
    └── VariantCombinationsTable.test.tsx
```

## 3. What each Product Editor layer does

### Page

`AdminProductEditorPage.tsx` is the composition root. It decides that General
Information appears before Variant Options, Preferences, Selected SKU, the SKU
table, and Additional Details. It does not fetch, validate, or save directly.

Use the page when changing section order or adding/removing a complete visible
section.

### Components

Components render one user-facing responsibility:

- `ProductEditorHeader` renders breadcrumb and Cancel/Draft/Publish actions.
- `ProductGeneralSection` renders name, category, product type, and brand.
- `VariantOptionsSection` builds explicit product-specific parent-child paths.
- `VariantPreferencesSection` chooses all-SKU or individual-SKU policies.
- `QuantityPricingEditor` edits quantity-based unit prices.
- `SelectedSkuEditor` edits one focused SKU.
- `VariantCombinationsTable` summarizes and bulk-edits all SKUs.
- `AdditionalProductDetails` owns descriptions, publication defaults, and the
  featured flag.
- `ProductMediaLibrary` displays saved media and pending local uploads.

Use a component when changing labels, layout, fields, accessibility, or local
interaction markup. Do not call unrelated APIs from a display component.

### Hooks

`useProductEditor.ts` is the feature controller. It owns the form, variants,
preference scopes, edit-mode hydration, CSV commands, and save orchestration.

`useProductCatalogOptions.ts` loads categories, product types, brands, and type
attributes. It also owns product-specific option-path UI state because those
paths are built from catalog attribute templates.

`useProductMedia.ts` owns saved media, pending files, four-item limits, file
type/size validation, primary media, deletion, reassignment, and scope changes.

Use a hook for state, effects, loading, user interaction, and calls whose result
must update React. Hooks must not contain visual markup.

### Utilities

`productEditor.validation.ts` contains pure rules that run before writing. It
also contains percentage/price conversion helpers.

`productEditor.mappers.ts` translates API objects into editable string values
and translates validated editor drafts back into API inputs.

`productEditor.save.ts` writes in dependency order. For a new product it saves a
Draft first, then SKUs, media, and quantity tiers, and publishes last. For an
existing product it updates data before deleting removed zero-stock SKUs.

`variantPaths.ts` contains sparse parent-child tree algorithms.

`variantCsv.ts` owns CSV serialization and defensive parsing.

Use a utility for deterministic logic that does not render and does not require
React state. Pure utilities are easier to test than functions buried in a page.

### Types

`productEditor.types.ts` is the shared vocabulary: product form, SKU draft,
pending media, quantity tier, scope, and bulk-edit field. Keeping these shapes
in one file prevents two components from inventing incompatible versions.

### Tests

Component tests verify that each section exposes its essential controls. Pure
utility tests continue to verify variant paths, CSV behavior, and price
conversion. API tests verify the request contract separately.

## 4. Where Product Editor data is saved

The frontend does not save directly to the database.

```text
AdminProductEditorPage
  -> useProductEditor.handleSaveProduct
    -> productEditor.validation.ts
      -> productEditor.save.ts
        -> web/src/api/adminProducts.ts
          -> /api/v1/admin/products...
            -> backend controller/service
              -> MySQL through TypeORM
```

New product order:

1. Validate every field, SKU, discount, inventory value, and tier.
2. Create the base product as `DRAFT` to obtain its database ID.
3. Create SKU rows and map temporary browser keys to database IDs.
4. Upload shared and SKU-specific media.
5. Replace quantity-price tiers.
6. Change the product to the requested final status.

Edit order:

1. Update product-level fields.
2. Update existing SKUs.
3. Create new SKUs.
4. Upload pending media and replace tiers.
5. Delete media attached to removed SKUs.
6. Delete removed SKUs after all safer writes succeed.

This order reduces data loss. Backend rules still provide final enforcement,
including the rule that an SKU with stock above zero cannot be deleted.

## 5. Commenting standard

Comments should explain why, ownership, or business risk—not repeat the syntax.

Good comment:

```ts
// Delete last: a failed update must not remove the administrator's old data.
```

Unhelpful comment:

```ts
// Loop over removed IDs.
```

Add a file-level comment for the file's responsibility and a function comment
when the use case, save order, temporary IDs, security rule, or business reason
is not obvious. Keep comments updated when behavior changes.

## 6. Standard structure for another module

Use the same idea, but do not create folders that a smaller feature does not
need.

```text
admin/<module>/
├── <Module>Page.tsx
├── <Module>Page.module.css
├── index.ts
├── components/
│   └── <VisibleSection>/
│       ├── <VisibleSection>.tsx
│       └── <VisibleSection>.module.css
├── hooks/
│   └── use<Module>.ts
├── utils/
│   ├── <module>.validation.ts
│   └── <module>.mappers.ts
├── types/
│   └── <module>.types.ts
└── tests/
    └── <VisibleSection>.test.tsx
```

Create `save.ts` only if the feature has a meaningful multi-request workflow.
Do not create an empty `utils`, `types`, or `hooks` folder just to copy the
Product Editor.

## 7. Example: Orders

```text
admin/orders/
├── AdminOrdersPage.tsx
├── AdminOrdersPage.module.css
├── index.ts
├── components/
│   ├── OrderFilters/
│   ├── OrdersTable/
│   ├── OrderStatusBadge/
│   └── OrderDetailsPanel/
├── hooks/
│   ├── useAdminOrders.ts
│   └── useOrderStatusUpdate.ts
├── utils/
│   ├── orders.mappers.ts
│   └── orders.validation.ts
├── types/
│   └── orders.types.ts
└── tests/
```

The page orders filters, table, and detail panel. `useAdminOrders` loads and
paginates. `useOrderStatusUpdate` owns the mutation and refresh behavior.
Validation protects illegal status transitions.

## 8. Example: Coupons

```text
admin/coupons/
├── AdminCouponsPage.tsx
├── AdminCouponsPage.module.css
├── index.ts
├── components/
│   ├── CouponForm/
│   ├── CouponRules/
│   └── CouponsTable/
├── hooks/
│   └── useAdminCoupons.ts
├── utils/
│   ├── coupon.validation.ts
│   └── coupon.mappers.ts
├── types/
│   └── coupon.types.ts
└── tests/
```

Date conversion belongs in the mapper. Rules such as start-before-end,
percentage range, and minimum order value belong in validation. The component
only renders the inputs and their messages.

## 9. Example: Customers

```text
admin/customers/
├── AdminCustomersPage.tsx
├── AdminCustomersPage.module.css
├── index.ts
├── components/
│   ├── CustomerSearch/
│   ├── CustomersTable/
│   └── CustomerDetailsPanel/
├── hooks/
│   └── useAdminCustomers.ts
├── utils/
│   └── customer.mappers.ts
├── types/
│   └── customer.types.ts
└── tests/
```

Customer account authentication remains outside this admin feature. The admin
module only consumes authorized customer-management APIs.

## 10. CSS strategy

Each visible component gets a CSS Module for locally owned styles. Shared admin
tokens, layout primitives, form controls, and buttons remain shared.

```tsx
import styles from "./OrdersTable.module.css";

<section className={styles.root}>...</section>
```

Tailwind and CSS Modules can coexist. Tailwind is useful for shared utilities;
CSS Modules are useful for precise component styling. Migrate old global CSS
selector-by-selector and remove a global selector only after visual checks on
desktop and mobile.

## 11. Safe migration procedure

1. Record current routes, API calls, tests, and browser behavior.
2. Create the destination module without changing business behavior.
3. Move shared types first.
4. Extract pure validation and mapping functions.
5. Extract data/state hooks.
6. Extract visible sections into components with local CSS Modules.
7. Reduce the page to section composition.
8. Update the router import.
9. Keep a temporary compatibility export only when another file still imports
   the old path.
10. Run typecheck, focused tests, all tests, and production build.
11. Test add, edit, validation failure, API failure, mobile layout, and console.
12. Remove old files only after search confirms no active imports.

## 12. Rules that prevent unnecessary complexity

- One feature folder represents one user workflow, not one database table.
- Split by visible responsibility or business workflow, not arbitrary line count.
- A component should not know the backend save sequence.
- A utility should not call React hooks.
- A hook should not return JSX.
- Avoid a generic abstraction until at least two real modules need it.
- Do not copy the Product Editor's complexity into a simple Brand or Category page.
- Keep API request functions in `web/src/api`; feature hooks consume them.
- Keep backend validation authoritative even when frontend validation exists.
- Do not move authentication as part of an unrelated module restructure.

## 13. Completion checklist

- [ ] Page contains composition, not business algorithms.
- [ ] Each visible section has a named component.
- [ ] Component-specific styles use its CSS Module.
- [ ] State/effects live in hooks.
- [ ] Validation and mapping are pure utilities.
- [ ] Save order is documented when multiple requests are involved.
- [ ] Shared draft types have one source of truth.
- [ ] Focused tests cover important components and rules.
- [ ] Old imports have been searched and removed or intentionally wrapped.
- [ ] TypeScript passes.
- [ ] Full tests pass.
- [ ] Production build passes.
- [ ] Desktop/mobile browser behavior and console are checked.

