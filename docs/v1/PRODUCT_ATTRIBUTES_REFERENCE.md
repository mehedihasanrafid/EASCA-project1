# Product Attributes Reference

This guide explains the simplified administrator page at `/admin/attributes`.
The old `/admin/properties` URL redirects here so existing bookmarks continue
to work.

## What the administrator sees

The page now has one small form:

1. **Property name** — the reusable option, for example `Size`, `Color`, or
   `Material`.
2. **Values** — comma-separated allowed choices, for example
   `S, M, L, XL`.
3. **Add property** — creates the attribute and all unique values.

Below the form, a table shows the attribute name, values, status, and a
Delete/Restore action. Each row can add a value, remove an unused value, or
restore a previously removed value. The old color picker, large value cards,
and product-type assignment panel are intentionally not part of this page.

The pencil action beside Delete opens the same style of editor used by Brands,
Product Types, and Categories. It changes the attribute name; values remain
separate controls in the Values column so SKU protection is not bypassed.

## SKU deletion protection

- An individual value can be removed only when no SKU uses that value.
- A complete attribute can be deleted only when no SKU uses any of its values.
- The backend performs this check, so API calls cannot bypass the rule.
- If deletion is blocked, the page shows the affected SKU count and up to three
  example SKU codes. Reassign or delete those SKU variants before retrying.
- This rule checks SKU relationships, not only stock. A zero-stock SKU still
  protects its attribute combination until it is reassigned or deleted.

## Code map

```text
web/src/admin/attributes/
├── AdminAttributesPage.tsx             # route layout and composition
├── AdminAttributes.module.css          # page-only layout and responsive CSS
├── attribute-values.ts                 # comma parsing and duplicate removal
├── attributes.test.tsx                 # form, table, and parser tests
├── components/
│   ├── AttributeForm.tsx               # name + comma-separated values form
│   ├── AttributeNameEditor.tsx          # edit the attribute name
│   ├── AttributesTable.tsx              # simple list with delete/restore
│   └── AttributeValuesCell.tsx           # add/remove/restore one value
├── hooks/
│   └── useAdminAttributes.ts            # API loading and mutations
└── index.ts                             # public feature export
```

The compatibility route file is
`web/src/pages/admin/AdminPropertiesPage.tsx`. API calls and TypeScript data
types remain in `web/src/api/adminCatalog.ts`.

## Data flow

```text
Administrator enters name and values
                 ↓
AttributeForm parses comma-separated values
                 ↓
useAdminAttributes sends one create request
                 ↓
The backend transaction creates the attribute and every unique value
                 ↓
The attributes table reloads
```

## Database note

The business data entered by the administrator is only an attribute name and
its values. The database still keeps technical fields such as IDs, generated
codes, status, sort order, timestamps, and soft-delete dates. Do not remove
these columns: product types, product variants, order history, safe restore,
and stable API references depend on them.

The two relevant tables are:

- `catalog_attributes` — one row per attribute.
- `catalog_attribute_values` — one row per value, connected by
  `attribute_id`.

The UI automatically supplies safe defaults: selector input, active status,
no color metadata, and the comma-list order as the value sort order. Attribute
and value rows are created in one transaction, so a failed value cannot leave
an incomplete attribute behind.

## Product-type assignments

Attribute-to-product-type assignment still exists in the backend because the
product editor needs it. It was removed only from this page to keep attribute
creation simple. A future Product Types editor should own that separate
workflow.

## Safe future changes

- Change page wording in `AdminAttributesPage.tsx`.
- Change form labels or placeholders in `AttributeForm.tsx`.
- Change table columns in `AttributesTable.tsx`.
- Change local spacing and responsive behavior in
  `AdminAttributes.module.css`.
- Keep HTTP calls inside `useAdminAttributes.ts` and `src/api/adminCatalog.ts`.
- Keep database IDs and generated codes hidden from ordinary administrator
  input.

After a change, run frontend type checking, tests, and the production build.
If API documentation changes, also run the backend test suite.
