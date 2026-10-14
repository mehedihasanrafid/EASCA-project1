# DokanBD Product Workbench Manual

This document explains the product operations added to the real DokanBD project. It is intended both as a maintenance guide and as a map for future development.

## 1. What the product workbench does

The admin product editor now manages one complete product workflow:

1. Choose a product-assignable category, then one of its directly assigned product types, and optionally choose any active global brand.
2. Enter the common product information and storefront status.
3. Add a product-level discount and an optional start/end time.
4. Select reusable property values, such as Color = Red and Size = M.
5. Build exact parent-to-child variant paths, adding only the SKUs the product really sells.
6. Select a combination and set its SKU, barcode, price, cost, discount, stock, low-stock level, status, default selection, and media.
7. Apply common values to selected variants with the bulk editor.
8. Add quantity/block prices for all variants or one exact variant.
9. Upload up to four shared media items plus up to four media items for each exact variant.
10. Save the work as a draft or publish it from the action buttons at the top of the page.
11. Save the product, variants, media, and quantity prices in a safe order.

The editor is shared by the **Add product** and **Edit product** screens. It does not use a separate demo or workbench application.

## 2. Editor screen and action flow

The redesigned editor is one product workbench, arranged from general information to exact SKU details:

1. **Product header** contains the breadcrumb, **Save Draft**, and **Publish Product** or **Save & Publish** actions.
2. **Product basics** contains product name, category, product type, and brand in a compact row.
3. **Product-specific variant paths** contains ordered parent-to-child selectors. Each completed path adds one exact SKU rather than a Cartesian set of combinations.
4. **Variant settings** contains three independent scope controls: quantity pricing, offer discounts, and product media. Each can target all variants or individual SKUs without forcing the other settings to use the same scope.
5. **Selected Variant** is the focused SKU editor. Clicking **Edit** or a table row loads that combination without leaving the page.
6. **All Variant Combinations** is the dense overview table. It supports row selection, bulk changes, CSV import/export, default selection, editing, and removal.
7. **Product details and shared media** is expandable so description, storefront settings, and product-level media remain available without making the main workbench too tall.

### Selected Variant panel

The selected-variant panel edits one exact stock unit. It includes:

- SKU and barcode/GTIN;
- selling price, cost price, and optional discount price;
- stock quantity and low-stock warning level;
- active/inactive status and the product default selection;
- optional discount start/end times;
- variant-specific images or short videos, with shared product media shown as the fallback.

Changing the selected row does not save immediately. The editor updates the React draft state, and the product save action persists the complete workflow in the safe order described below.

### Save Draft and Publish

- **Save Draft** submits the same validated product data with status `DRAFT`. Use it for incomplete catalog work that must not appear on the storefront.
- **Publish Product** creates a new product with status `ACTIVE`.
- **Save & Publish** updates an existing product and sets it to `ACTIVE`.
- The bottom save button keeps the status selected in the expandable product-details section.

Both draft and publish actions use the same variant, media, and price-tier validation. Publishing does not bypass required SKU, price, default-variant, or combination rules.

## 3. Business relationships

### Category

A category controls where a product is organized and found, for example `Fashion > Shirts`. Categories form a parent-child tree. A category can either accept products directly or act only as a grouping node for child categories.

Manage this from **Admin > Categories > Edit category**. Enable **Allow products directly in this category** for a product category, then assign at least one direct product type. Disable it for a grouping-only category. Product type assignments are not inherited: every product category owns its explicit list. An assigned type cannot be removed while a product in that category still uses it.

Moving a category does not rewrite its products or type assignments. The backend prevents parent cycles. A category cannot be made grouping-only, inactive, or deleted while it still owns products. It also cannot be deleted while it has children or direct type assignments. The public product list treats a selected parent category as the parent plus all of its active descendants.

### Product type

A product type defines which reusable properties can be used by a product. For example, the `T-shirt` type can be assigned `Color`, `Size`, and `Material`.

The same product type record can be assigned to many unrelated categories. Product types do not own brands; they only define reusable product structure and properties.

Product type assignments may mark a property as:

- required;
- usable for variants;
- filterable;
- searchable;
- displayed in a specific order.

For an existing product with saved variants, the product type is locked in the editor. Changing it would make the saved option-value relationships invalid. Create a new product or perform a dedicated migration if a type must change.

### Product property and value

A property is the reusable definition, such as `Color`. Property values are reusable choices, such as `Red`, `Blue`, and `Black`. The editor loads the values assigned through the selected product type. An admin can add a missing value inline; it is saved through the catalog API and becomes reusable.

The property order assigned to the product type becomes the path order in the product editor. The relationship between chosen values is stored by the product's exact variant rows, not as a global catalog rule.

### Brand

A brand is a global reusable catalog record. A product may have no brand or one active brand. Brand availability does not depend on the selected category or product type.

The enforced selection chain is:

`Category -> directly assigned Product Types`

Brand is an independent optional product relationship:

`Product -> optional global Brand`

The backend validates this chain during product creation and update, so an invalid combination cannot be submitted by bypassing the browser UI.

### Variant

A variant is the purchasable stock unit. Each variant contains one unique combination of option values and has its own SKU, price, stock, and other inventory data. Example:

`Red / M` -> SKU `TSHIRT-RED-M`, price `1200`, stock `10`.

One variant must be the default. The default variant supplies the normal storefront price/stock choice when the customer has not selected another option.

### Product-specific parent-child paths

The editor creates sparse paths instead of a global Cartesian product. Example:

```text
Color
├── Black
│   ├── XL
│   │   ├── Cotton     -> SKU-001
│   │   └── Synthetic  -> SKU-002
│   └── X               -> SKU-003
└── Green
    └── M               -> SKU-004
```

Workflow:

1. Choose the first property value, such as `Black`.
2. Choose its child value, such as `XL`.
3. Continue through the remaining properties and explicitly choose **Not used for this SKU** for an optional property when necessary.
4. Select **Add exact SKU**.
5. The editor keeps the parent prefix and clears the deepest choice, making it quick to add a sibling such as `Synthetic` after `Cotton`.
6. Changing an earlier parent clears all later child choices, preventing a value from remaining under the wrong parent.

### Removing a branch safely

Every node in the product tree shows the number of SKU paths below it. Removing `Black`, for example, first resolves every Black SKU across its Size and Material children.

- If any affected SKU has stock greater than zero, the whole branch removal is blocked and the editor identifies the stocked SKUs.
- If every affected SKU has zero stock, the editor shows one confirmation for the complete branch.
- Draft SKU paths disappear immediately after confirmation.
- Saved SKU paths are queued for deletion and are actually removed only when the product is saved.
- If the removed branch contained the default variant, the first remaining variant becomes the default.
- The backend independently rejects deletion of any stocked saved variant, so bypassing the browser does not bypass the inventory rule.

Existing saved variants are rebuilt into the visible product tree when editing. The database does not need a separate parent-child mapping table because each variant's ordered option values already represent one valid leaf. This keeps the relationship local to the product, as required.

### Quantity/block price

A price tier changes the unit price when a customer buys at least a configured quantity. It can apply to all variants or to one exact variant.

Example:

- normal unit price: BDT 500;
- minimum quantity 10: BDT 450 per unit;
- minimum quantity 20: BDT 420 per unit.

When several tiers qualify, the tier with the highest minimum quantity is used.

## 4. Independent variant settings

The Variant Settings panel deliberately separates three business decisions:

1. **Quantity pricing** — choose **All variants** for shared quantity tiers or **Individual SKU** to select an exact SKU on every tier row.
2. **Offer discount** — choose **All variants** for one shared discount or **Individual SKU** to edit discounts in the Selected Variant panel.
3. **Product media** — choose **All variants** for shared uploads or **Individual SKU** to enable the Selected Variant media picker.

Changing a pricing or discount scope never silently keeps conflicting rules. The editor explains how many rules will be removed and requires confirmation before clearing the previous scope. Pending individual media is moved to the shared scope only after checking the four-item shared limit and receiving confirmation.

Both shared and individual discounts support two equivalent inputs:

- final discount price, such as BDT 700 from BDT 1,000;
- percentage off, such as 30%.

The browser calculates the paired value immediately, while the backend continues to store and validate the final discount price used by cart and checkout.

## 5. Pricing priority

The backend is the source of truth. It calculates price in this order:

1. Start with the variant regular price.
2. If the variant has an active scheduled discount, use it.
3. Otherwise, if the product has an active scheduled discount, use it.
4. If an active quantity tier qualifies, use the best matching tier price for the cart quantity.

A discount without start/end values is active immediately. A start-only discount stays active from that time onward. An end-only discount stays active until that time.

Cart preview and checkout use the same pricing helper so the displayed price and charged order price stay consistent.

## 6. Safe variant rules

- A SKU is required and must be unique.
- A combination of option values must be unique within the product.
- A default variant is required.
- Discount price cannot be greater than regular price.
- Offer end time cannot be earlier than start time.
- A saved variant cannot be deleted while its stock is greater than zero.
- A parent branch cannot be removed while any descendant SKU has stock greater than zero.
- Adding an exact path creates only that missing row. It does not erase edited or saved variants.
- Removing a draft variant also removes price tiers that point to it and moves pending media assignments back to `All variants`.
- Existing media assigned to a deleted zero-stock variant is reassigned to the whole product before deletion.
- Soft-deleted variants are excluded from the edit response. This fixes the legacy `Product variant not found` problem.

## 7. Save sequence

For a new product:

1. Create the product as a draft.
2. Create all variants in bulk.
3. map temporary React row keys to database variant IDs;
4. upload media to the chosen product/variant scope;
5. replace the quantity-price tiers;
6. publish with the selected status.

For an existing product:

1. Update common product information.
2. Update existing variants.
3. Create new variants and map their new IDs.
4. Upload pending media.
5. Replace quantity-price tiers.
6. Reassign media from variants queued for deletion.
7. Delete removed zero-stock variants last.

This order prevents media or price rows from referring to variants that do not exist yet and prevents the old deleted-variant error.

## 8. Backend file map

| File | Responsibility |
| --- | --- |
| `DokanBDbackend/src/modules/products/product.entity.ts` | Product-level discount schedule fields |
| `DokanBDbackend/src/modules/products/product-variant.entity.ts` | Variant discount schedule and inventory fields; legacy measurement columns remain database-compatible but are not shown in the current editor |
| `DokanBDbackend/src/modules/products/product-price-tier.entity.ts` | Quantity/block price database model |
| `DokanBDbackend/src/modules/products/product-pricing.ts` | Active schedule and effective-price calculation |
| `DokanBDbackend/src/modules/products/product-price-tier.service.ts` | Validate, load, and replace tiers |
| `DokanBDbackend/src/modules/attributes/product-attribute.service.ts` | Property templates, type assignments, and assignment-ordered variant selections used by admin and storefront |
| `DokanBDbackend/src/modules/products/product.schema.ts` | Request validation |
| `DokanBDbackend/src/modules/products/product.service.ts` | Product and variant business logic |
| `DokanBDbackend/src/modules/categories/category-product-type.entity.ts` | Category-to-product-type assignment table model |
| `DokanBDbackend/src/modules/categories/category.service.ts` | Hierarchy, descendant summaries, direct type assignments, cycle prevention, and safe archive rules |
| `DokanBDbackend/src/modules/product-types/product-type.service.ts` | Reusable product type lifecycle; brands remain independent |
| `DokanBDbackend/src/modules/products/product.controller.ts` | HTTP request handlers |
| `DokanBDbackend/src/modules/products/product.routes.ts` | Product API routes |
| `DokanBDbackend/src/modules/carts/cart.service.ts` | Cart quantity pricing |
| `DokanBDbackend/src/modules/orders/order.service.ts` | Final checkout pricing and discount total |
| `DokanBDbackend/src/modules/coupons/coupon.entity.ts` | Coupon rules, schedule, limits, activation, and usage count |
| `DokanBDbackend/src/modules/coupons/coupon-redemption.entity.ts` | Per-customer and per-order coupon audit record |
| `DokanBDbackend/src/modules/coupons/coupon.service.ts` | Admin coupon lifecycle and authoritative discount validation |
| `DokanBDbackend/src/modules/coupons/coupon.controller.ts` | Admin coupon request handlers |
| `DokanBDbackend/src/modules/coupons/coupon.routes.ts` | Protected administrator coupon routes |
| `DokanBDbackend/src/docs/openapi.ts` | Swagger/OpenAPI contract |
| `DokanBDbackend/src/database/migrations/1791790000000-ProductWorkbenchPricing.ts` | Database upgrade |
| `DokanBDbackend/src/database/migrations/1791791000000-ProductVariantDimensions.ts` | Adds nullable length, width, and height columns to product variants |
| `DokanBDbackend/src/database/migrations/1791870000000-CatalogRelationshipAssignments.ts` | Adds category/type assignments, type/brand policy, and compatibility backfill |
| `DokanBDbackend/src/database/migrations/1791960000000-Coupons.ts` | Adds coupons, redemption audit records, and order coupon totals |
| `DokanBDbackend/src/database/migrations/1792040000000-CategoryHierarchyAndGlobalBrands.ts` | Adds product-assignable category control and removes the obsolete product-type brand policy |

## 9. Frontend file map

| File | Responsibility |
| --- | --- |
| `web/src/admin/product-editor/AdminProductEditorPage.tsx` | Thin Add/Edit Product page coordinator |
| `web/src/admin/product-editor/hooks/useProductEditor.ts` | Page state, edit hydration, preference changes, CSV actions, and save orchestration |
| `web/src/admin/product-editor/hooks/useProductCatalogOptions.ts` | Category/type/brand loading plus product-specific attribute path state |
| `web/src/admin/product-editor/hooks/useProductMedia.ts` | Saved media operations, pending uploads, scope changes, validation, and limits |
| `web/src/admin/product-editor/components/VariantOptionsSection/VariantOptionsSection.tsx` | Exact product-specific parent-child paths |
| `web/src/admin/product-editor/components/SelectedSkuEditor/SelectedSkuEditor.tsx` | Focused SKU price, stock, status, discount, default, and media controls |
| `web/src/admin/product-editor/components/VariantCombinationsTable/VariantCombinationsTable.tsx` | SKU table, bulk edit, CSV, default selection, and removal |
| `web/src/admin/product-editor/components/VariantPreferencesSection/QuantityPricingEditor.tsx` | Scope-aware shared or individual SKU quantity-price rows |
| `web/src/admin/product-editor/components/AdditionalProductDetails/ProductMediaLibrary.tsx` | Saved media library and pending upload queue |
| `web/src/admin/product-editor/utils/productEditor.validation.ts` | Pure validation and discount/percentage conversion |
| `web/src/admin/product-editor/utils/productEditor.mappers.ts` | API-to-editor and editor-to-API data conversion |
| `web/src/admin/product-editor/utils/productEditor.save.ts` | Ordered product, SKU, media, tier, and safe-deletion persistence |
| `web/src/admin/product-editor/types/productEditor.types.ts` | Shared product editor draft and scope types |
| `web/src/admin/product-editor/utils/variantPaths.ts` | Exact path selection, parent-change reset logic, and reconstruction of the product-specific tree |
| `web/src/pages/dashboard/variantPaths.test.ts` | Sparse-tree, optional-value, sibling-prefix, and parent-reset tests |
| `web/src/pages/dashboard/discountDraft.test.ts` | Discount conversion and boundary tests |
| `web/src/admin/product-editor/utils/variantCsv.ts` | Stable CSV export plus defensive parsing and validation for imported variant rows |
| `web/src/pages/dashboard/variantCsv.test.ts` | Unit tests for quoting, header aliases, value validation, and CSV round trips |
| `web/src/api/adminProducts.ts` | Admin product/variant/tier API types and requests |
| `web/src/api/adminCatalog.ts` | Category/type assignment plus global brand and reusable type requests |
| `web/src/pages/admin/AdminCatalogSettingsPage.tsx` | Category hierarchy/type assignment, global brand, and reusable product-type editors |
| `web/src/pages/admin/AdminCouponsPage.tsx` | Coupon create, edit, activation, archive, restore, schedule, and limit controls |
| `web/src/api/adminCoupons.ts` | Typed administrator coupon API client |
| `web/src/api/products.ts` | Public product price/media types |
| `web/src/pages/products/productVariantSelection.ts` | Storefront parent-child option filtering and exact sparse-SKU resolution |
| `web/src/pages/products/productVariantSelection.test.ts` | Storefront branch filtering, sold-out, parent-reset, and optional-terminal tests |
| `web/src/pages/products/ProductDetail.tsx` | Customer product gallery, cascading variant choices, and add-to-cart controls |
| `web/src/pages/products/storefrontPricing.ts` | Customer discount, quantity-tier, next-tier, total, and savings calculations |
| `web/src/pages/products/storefrontPricing.test.ts` | Storefront pricing precedence and schedule tests |
| `web/src/styles/features/product-editor.css` | Scoped desktop, table, selected-variant, and mobile-card styling for the redesigned editor |
| `web/src/styles/features/admin.css` | Shared admin shell, navigation, and general admin styles |
| `web/src/styles/tailwind.css` | Imports the feature stylesheets in their intended cascade order |

## 10. Variant CSV import and export

Use **Export CSV** as the safest starting template. The exported header is stable and contains:

`sku`, `barcode`, `option_label`, `option_value_ids`, `price`, `discount_price`, `cost_price`, `stock_quantity`, `low_stock_level`, `active`, and `default`.

Import behavior:

- `sku` is required and is matched case-insensitively after normalization to uppercase;
- a matching SKU updates the existing draft row;
- an unmatched SKU creates a new draft variant;
- the import never silently deletes variant rows that are absent from the file;
- `option_value_ids` accepts IDs separated with `|` or `;`, or a JSON string array;
- price and cost fields must be non-negative numbers, while stock and low-stock fields must be non-negative whole numbers;
- boolean fields accept `true/false`, `yes/no`, `1/0`, or `active/inactive`;
- common header aliases such as `selling_price` and `stock` are accepted;
- duplicate SKUs, duplicate recognized columns, malformed quoting, invalid numbers, and invalid booleans are reported with row numbers;
- if any validation error exists, the whole file is rejected so the editor is not left half imported;
- if one imported row is marked as default, it becomes the only default. Otherwise the existing default is preserved, or the first row becomes default when none exists.

CSV changes remain drafts until **Save Draft**, **Publish Product**, **Save & Publish**, or the bottom save action is used.

## 11. Product and variant media

Media capacity is enforced per scope:

- up to **four shared product media** items where `variantId` is `null`;
- up to **four media items for each individual variant**;
- moving an existing media item to another scope is allowed only when the destination still has capacity;
- the primary item is selected within its own scope, so choosing a variant image does not clear the shared product primary image;
- shared product media acts as the storefront fallback when an exact variant has no suitable media.

Accepted media types are JPEG, PNG, WebP, MP4, and WebM. The UI shows the configured image/video size limits next to the picker. The backend is the final authority for MIME type, size, scope, and ownership validation.

## 12. API summary

Main admin operations:

- `POST /api/v1/admin/products`
- `PATCH /api/v1/admin/products/{productId}`
- `POST /api/v1/admin/products/{productId}/variants/bulk`
- `PATCH /api/v1/admin/products/{productId}/variants/{variantId}`
- `DELETE /api/v1/admin/products/{productId}/variants/{variantId}`
- `PUT /api/v1/admin/products/{productId}/price-tiers`
- `GET|PUT /api/v1/admin/categories/{categoryId}/product-types`
- product media upload/update/delete routes already used by the editor.

Swagger is available during development at `http://localhost:5001/api-docs/`. The price-tier routes, scheduled discounts, catalog relationship endpoints, and scoped product-media behavior are included there.

## 13. Database update

The workbench migrations add scheduled discount columns to products and variants, create `product_price_tiers`, and add the catalog relationship structure.

`CatalogRelationshipAssignments1791870000000` originally added:

- `category_product_types`, containing the allowed product types for each category;
- the first product-type brand policy, which is removed by the later hierarchy migration because brands are now global.

Its data backfill preserves every category/type pair already used by an existing product. Categories with no products initially receive all active product types, preventing older admin flows from becoming empty after the upgrade.

`CategoryHierarchyAndGlobalBrands1792040000000` adds `categories.allow_products`. Existing categories that already contain products stay product-assignable; parent categories with children and no direct products are migrated to grouping-only categories. The migration removes `product_types.brand_mode` and `product_type_brands`, while keeping every product's existing optional `brand_id` unchanged.

`Coupons1791960000000` adds the coupon and coupon-redemption tables. It also adds separate product-discount, coupon-discount, and coupon-code snapshots to orders. Existing order discounts are safely copied into the product-discount field.

Run migrations from the project root:

```bash
npm run migration:run --workspace dokanbd-backend
```

Never edit an already-applied migration for a future database change. Add a new migration instead.

## 14. Development and verification

From the project root:

```bash
npm run dev
npm run typecheck
npm test
npm run build
```

Recommended manual test:

1. Open `/admin/products/new`.
2. Select a product type with Color, Size, and an optional Material property.
3. add `Black -> XL -> Cotton`, then use the retained prefix to add `Black -> XL -> Synthetic`;
4. change the parent to Green and confirm the Size and Material child selections clear before adding `Green -> M -> Not used`;
5. confirm no unselected Cartesian combinations appear, then add unique SKUs, prices, and stock;
6. use the bulk editor on selected rows;
7. export the CSV, change one safe value, import it, and confirm the intended SKU row changed;
8. add one all-variant quantity tier and one variant-only tier;
9. upload four shared media items and confirm a fifth shared upload is blocked;
10. select a variant, upload one variant-specific media item, and confirm it is still allowed;
11. save as draft and confirm the product is not published;
12. reopen the product and confirm the sparse tree, all rows, price tiers, and media assignments;
13. publish the product, then add it to the cart with a qualifying quantity and confirm the tier price;
14. attempt to remove a stocked variant and confirm it is blocked;
15. reduce stock to zero, save, then remove it.

### Storefront sparse-option test

1. Publish SKUs for `Black -> XL -> Cotton`, `Black -> X`, and `Green -> M` only.
2. Open the public product page and choose Green; confirm only M appears below it.
3. Change Green to Black; confirm the old M choice is cleared and only Black's sizes appear.
4. Choose Black then X; confirm the exact two-level SKU can be added without choosing Material.
5. Choose Black then XL; confirm only Material values belonging to that branch appear.
6. Set one Material SKU stock to zero; confirm it remains visible as Sold out but cannot be selected.

The customer selector never creates combinations from the global property templates. It walks only paths backed by saved product variants, clears child choices when a parent changes, and enables the cart only after an exact in-stock SKU is resolved.

### Storefront pricing test

1. Give one SKU a regular price of 100, an active discount price of 90, and quantity tiers of 5+ at 80 and 10+ at 70.
2. Select the SKU on the public product page and confirm quantity 1 shows 90 with 100 crossed out.
3. Click the 5+ block and confirm quantity becomes 5, unit price becomes 80, and the total becomes 400.
4. Increase to 10 and confirm the 10+ row becomes active, the unit price becomes 70, and the total becomes 700.
5. Add it to the cart and confirm the cart displays the same unit price, quantity-tier label, line total, and savings.

The backend remains the final pricing authority. The public preview mirrors the same precedence: highest eligible minimum quantity, then lowest unit price, then exact-SKU scope when otherwise tied. Cart and checkout recalculate prices from the database rather than trusting browser totals.

Product-wide quantity tiers are always filtered by `productId` before SKU matching. This is essential when a cart contains different products: an all-variant tier belongs to every SKU of its own product, never to another product. The cart also reads the variant's complete `optionValues`, so newer properties such as Material appear alongside Color and Size.

### Checkout pricing and confirmation

The checkout preview is an authenticated backend calculation. It returns every item with its exact SKU, selected property label, quantity, regular unit price, charged unit price, line total, saving, and pricing source. It also returns regular subtotal, product savings, discounted subtotal, address-based delivery charge, and the final cash-on-delivery total.

Changing the selected address requests a new preview because inside-Dhaka and outside-Dhaka delivery charges can differ. Placing the order recalculates price and stock again inside the database transaction. The successful response is a saved order snapshot; the confirmation screen therefore uses the order's stored items, address, savings, delivery charge, and grand total rather than the earlier browser preview.

Recommended checkout test:

1. Add a discounted or quantity-priced SKU to the cart.
2. Open checkout and confirm the SKU, pricing badge, regular subtotal, savings, and discounted subtotal.
3. Switch between an inside-Dhaka and outside-Dhaka address and confirm the delivery and grand total change.
4. Place the order and confirm the order number, item lines, saved delivery address, savings, delivery charge, and cash-on-delivery total appear.
5. Open **View order details** and confirm it matches the confirmation screen.

## 15. Coupons and promotion codes

Administrators manage coupons at **Admin > Coupons** (`/admin/coupons`). A coupon supports:

- a unique, case-insensitive code that is stored in uppercase;
- percentage or fixed-amount discounts;
- an optional minimum discounted merchandise subtotal;
- an optional maximum discount cap, especially useful for percentages;
- optional start and end times;
- an optional store-wide usage limit;
- a per-customer usage limit;
- active/inactive status plus recoverable archive and restore actions.

Checkout calculates money in this order:

1. calculate every product's effective discount or quantity-tier price;
2. add those charged line totals to produce the discounted merchandise subtotal;
3. validate and subtract the coupon from that subtotal;
4. add the address-based delivery charge.

The coupon never discounts the delivery charge. Product savings and coupon savings are stored separately, while `discountTotal` remains their combined value for reporting compatibility.

Preview validation is useful feedback, but checkout is the final authority. Inside the checkout database transaction, the backend locks the coupon row, rechecks its schedule and limits, counts this customer's redemptions, calculates the discount, increments usage, and creates one redemption record linked to the saved order. This prevents concurrent checkouts from exceeding the limit. The browser never submits or controls the charged discount amount.

Coupon usage is retained when an order is cancelled because the redemption is an audit record. If the business later decides that cancellation should restore coupon capacity, implement an explicit reversal record or idempotent release operation rather than deleting the original redemption.

Coupon API operations documented in Swagger:

- `GET|POST /api/v1/admin/coupons`
- `PATCH|DELETE /api/v1/admin/coupons/{couponId}`
- `POST /api/v1/admin/coupons/{couponId}/restore`
- `GET /api/v1/orders/checkout-preview?addressId=...&couponCode=...`
- `POST /api/v1/orders/checkout` with optional `couponCode`

Recommended coupon test:

1. Create `SAVE10` as 10% off, set a minimum subtotal and maximum discount, then activate it.
2. Add an eligible product to the cart, open checkout, enter `save10`, and confirm it is normalized and applied.
3. Confirm product savings, coupon savings, delivery, and grand total are shown separately.
4. Place the order and confirm the same code and savings appear on customer and admin order details.
5. Test a below-minimum cart, expired coupon, inactive coupon, total-limit exhaustion, and a second use beyond the per-customer limit.

## 16. How to extend it later

### Add a new variant field

Update, in order:

1. database entity and a new migration;
2. request schema;
3. service create/update mapping;
4. Swagger schema;
5. `AdminProduct`/variant TypeScript interfaces;
6. `VariantDraft` and its table input;
7. editor save mapping;
8. tests.

### Change workbench styling

Edit the product-workbench rules in `web/src/styles/features/product-editor.css`. The selectors are scoped under `.admin-product-editor-page` and use the `admin-workbench-*`, `admin-variant-*`, `selected-variant-*`, `variant-table-*`, `admin-bulk-*`, and `admin-price-tier-*` prefixes to avoid changing customer pages. Keep shared admin-shell changes in `web/src/styles/features/admin.css`.

The project can migrate this feature to Tailwind or CSS Modules later. Keep the React business logic unchanged, migrate one visual component at a time, compare desktop/mobile output, and remove the old CSS only after verification.

### Extend variant-specific media galleries

The database and admin assignment support a `variantId`, and the editor now manages media per selected SKU. A future storefront improvement can filter the product gallery by the customer's selected variant, with product-level media as the fallback. Preserve the four-items-per-scope rule or update both the frontend guidance and backend validation together.

### Add tier date schedules

Add start/end columns to `product_price_tiers`, extend tier validation, and include the schedule in the tier-selection helper. Reuse the product/variant schedule pattern instead of implementing time checks in the React UI.
