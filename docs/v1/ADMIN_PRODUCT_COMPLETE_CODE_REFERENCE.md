# DokanBD Admin Products — Complete Code, API, and Database Reference

Generated from the working project on 2026-10-14.

Source revision: unavailable. This snapshot contains 171 files and approximately 21,045 source lines.

> This is a generated learning and maintenance snapshot. Edit the real source files, not the copied code below, and regenerate this document after future product changes.

## What this document covers

- administrator product list, search, add, edit, draft, and publish workflows;
- category hierarchy and category-to-product-type assignment;
- reusable product types, global optional brands, attributes, and attribute values;
- per-product parent-child option paths and generated SKU combinations;
- regular price, scheduled discounts, percentage helpers, quantity/block pricing, stock, low-stock levels, and defaults;
- shared or per-SKU JPEG, PNG, WebP, MP4, and WebM media;
- CSV variant import/export and bulk SKU editing;
- frontend API clients and backend Express/TypeORM implementation;
- Swagger/OpenAPI definitions and product-related database migrations;
- relevant tests and storefront code that consumes saved product data.

## End-to-end architecture

```text
Admin React page
  -> frontend API client
    -> /api/v1/admin/* Express route
      -> ADMIN/OWNER authentication and authorization
        -> Zod request validation in controller
          -> service business rules and TypeORM transaction
            -> MySQL tables/entities
              -> normalized API response back to React
```

The browser does not write directly to the database. Every product change passes through the API validation and service rules.

## Frontend administrator routes

| Browser route | React entry point | Purpose |
| --- | --- | --- |
| `/admin/products` | `admin/products/AdminProductsPage.tsx` | Search and list all products |
| `/admin/products/new` | `admin/product-editor/AdminProductEditorPage.tsx` | Add product and its SKUs |
| `/admin/products/:productId/edit` | `admin/product-editor/AdminProductEditorPage.tsx` | Edit product, variants, offers, media, and tiers |
| `/admin/categories` | `pages/admin/AdminCategoriesPage.tsx` | Category hierarchy and type assignments |
| `/admin/brands` | `pages/admin/AdminBrandsPage.tsx` | Global brand management |
| `/admin/product-types` | `pages/admin/AdminProductTypesPage.tsx` | Product type management and attribute assignments |
| `/admin/attributes` | `admin/attributes/AdminAttributesPage.tsx` | Attribute names and values |

`AdminProductEditorPage` is deliberately shared by Add and Edit. The presence of `productId` decides whether it loads an existing product or starts an empty draft.

## Product editor business workflow

### 1. Catalog selection

1. Load product-assignable categories, active product types, active brands, and reusable attributes.
2. When the administrator chooses a category, request only that category's assigned product types.
3. The backend rejects a type that is not assigned to the selected category.
4. A brand is optional and global; it is not owned by a category or type.
5. A parent category can be a grouping node with `allowProducts = false`; products must use an active product-assignable category.

### 2. Attributes, option paths, and SKU combinations

Attributes such as Color, Size, and Material are reusable templates. Product-type assignments decide which templates are suggested, but they do not force every possible Cartesian combination.

The administrator builds paths independently for each product. This supports structures such as:

```text
Color: Black
  -> Size: XL
       -> Material: Cotton    -> SKU-001
       -> Material: Synthetic -> SKU-002
  -> Size: X                  -> SKU-003
Color: Green
  -> Size: M                  -> SKU-004
```

Therefore Black can have different sizes or materials from Green. Generated rows are editable and can also be imported/exported through CSV.

### 3. Independent variant settings

The Variant Preferences panel keeps three decisions independent:

- quantity/block pricing: one shared product tier set or individual SKU tiers;
- discount: one shared product offer or individual SKU offers;
- media: shared product media or files attached to individual SKUs.

Discounts support a final discount price, a calculated percentage helper, and optional start/end dates. Quantity tiers require a minimum quantity of at least 2 and disallow duplicate quantities within the same scope.

### 4. Add-product save order

1. Validate product fields and every SKU draft in React.
2. Create the base product as DRAFT.
3. Create all variants in bulk and map temporary editor keys to database variant IDs.
4. Upload shared and per-SKU media using the saved IDs.
5. Replace the complete quantity-price tier set.
6. If Publish was requested, update the product status after setup completes.

If a later setup step fails, the base product remains a recoverable draft and the editor reports that setup did not finish.

### 5. Edit-product save order

1. Patch product-level data.
2. Update existing variants.
3. Bulk-create newly added variants.
4. Upload pending media and replace quantity-price tiers.
5. Remove media belonging to deleted variants.
6. Delete removed variants only after the preceding writes succeed.

A removed SKU is rejected while its stock is greater than zero. When a default SKU is removed, the backend promotes another active SKU when available. Attribute values and full attributes are also protected when any SKU currently uses them; the API returns an explanation instead of silently breaking combinations.

## Backend API endpoint map

Base URL: `/api/v1`. All `/admin/*` endpoints require a valid access token and the ADMIN or OWNER role.

### Public product endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/products` | Paginated products with search, category, brand, price, stock, and sorting filters |
| GET | `/products/search-suggestions` | Rate-limited product suggestions |
| GET | `/products/:identifier` | Product detail by numeric ID or slug |
| GET | `/categories` | Active public category tree |
| GET | `/brands` | Active public brands |

### Admin product endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/admin/products` | Search/list products, optionally including deleted records |
| POST | `/admin/products` | Create base product |
| GET | `/admin/products/:id` | Load the complete editor model |
| PATCH | `/admin/products/:id` | Update product-level fields |
| DELETE | `/admin/products/:id` | Soft-delete product |
| POST | `/admin/products/:id/restore` | Restore product |
| POST | `/admin/products/:productId/variants` | Create one SKU |
| POST | `/admin/products/:productId/variants/bulk` | Create many generated SKUs |
| PATCH | `/admin/products/:productId/variants/:variantId` | Update one SKU |
| DELETE | `/admin/products/:productId/variants/:variantId` | Safely remove zero-stock SKU |
| PUT | `/admin/products/:id/price-tiers` | Replace shared and SKU quantity tiers |
| POST | `/admin/products/:productId/media` | Upload up to four product/variant files per request |
| GET | `/admin/products/:productId/media` | List product media |
| PATCH | `/admin/products/:productId/media/:mediaId` | Change media metadata, ordering, primary flag, or SKU |
| DELETE | `/admin/products/:productId/media/:mediaId` | Delete media record and managed local file |

### Admin catalog endpoints

| Resource | Supported operations | Extra relationship operations |
| --- | --- | --- |
| Categories | list, create, patch, soft-delete, restore | GET/PUT `/admin/categories/:id/product-types` |
| Brands | list, create, patch, soft-delete, restore | Global optional product relation |
| Product types | list, create, patch, soft-delete, restore | GET/PUT `/admin/product-types/:productTypeId/attributes` |
| Attributes | list, create, patch, soft-delete, restore | Add/update/delete/restore individual values |

## Database relationship map

```text
categories (self parentId hierarchy)
  many-to-many product_types through category_product_types

products
  many-to-one category
  many-to-one product_type
  optional many-to-one brand
  one-to-many product_variants
  one-to-many product_media
  one-to-many product_price_tiers

product_types
  many-to-many product_attributes through product_type_attributes

product_attributes
  one-to-many product_attribute_values

product_variants
  many-to-many product_attribute_values through product_variant_attribute_values
  one-to-many variant-scoped product_media
  one-to-many variant-scoped product_price_tiers
  one-to-many inventory_movements
```

### Important tables

| Table | Responsibility |
| --- | --- |
| `categories` | Hierarchy, storefront visibility, sort order, product assignment permission |
| `product_types` | Reusable type definitions |
| `category_product_types` | Allowed types for each category |
| `brands` | Global optional brand records |
| `products` | Product-level content, status, default prices, schedule, and feature flag |
| `product_variants` | SKU, barcode, price, discount, cost, stock, low-stock level, and default/active flags |
| `product_attributes` | Attribute names/templates |
| `product_attribute_values` | Reusable values such as Black, XL, Cotton |
| `product_type_attributes` | Attribute templates assigned to a type |
| `product_variant_attribute_values` | The exact values selected by each SKU |
| `product_media` | Shared product or variant-specific image/video metadata |
| `product_price_tiers` | Shared or variant-specific quantity pricing |
| `inventory_movements` | Initial stock and stock-adjustment audit trail |

## Validation and safety rules

- product slug, SKU, and barcode uniqueness is checked against active and soft-deleted rows;
- selected category must be active and permit direct product assignment;
- selected product type must be active and assigned to that category;
- selected brand must be active when provided;
- SKU option values must belong to attributes assigned to the selected product type;
- duplicate value combinations within one product are rejected;
- exactly one practical default is maintained, with the first SKU becoming default when necessary;
- prices, costs, stock, and low-stock values cannot be negative;
- a discount cannot exceed its regular price and its end date cannot precede its start date;
- a SKU with stock greater than zero cannot be deleted;
- an attribute/value used by a SKU cannot be deleted;
- category parent cycles and unsafe catalog deletion are rejected;
- product media accepts JPEG, PNG, WebP, MP4, and WebM, with at most four files per request and the configured video-size limit;
- destructive catalog operations use soft deletion and provide restore endpoints.

## Where to change common behavior

| Desired change | Primary files |
| --- | --- |
| Editor layout or fields | `admin/product-editor/components/` and each component's CSS module |
| Editor state and save orchestration | `admin/product-editor/hooks/useProductEditor.ts` |
| Catalog and product-specific option paths | `admin/product-editor/hooks/useProductCatalogOptions.ts`, `admin/product-editor/utils/variantPaths.ts` |
| Product media workflow | `admin/product-editor/hooks/useProductMedia.ts`, `admin/product-editor/components/AdditionalProductDetails/ProductMediaLibrary.tsx` |
| Validation, mapping, and ordered persistence | `admin/product-editor/utils/productEditor.validation.ts`, `productEditor.mappers.ts`, `productEditor.save.ts` |
| Product list/search UI | `admin/products/` |
| Category/type/brand rules | frontend `adminCatalog.ts`; matching backend module service/schema |
| Attribute screen | `admin/attributes/`; backend `modules/attributes/` |
| Product request/response model | `api/adminProducts.ts`, `product.schema.ts`, `product.controller.ts`, `product.service.ts` |
| Variant deletion or inventory rules | `product.service.ts`, `inventory-movement.entity.ts` |
| Media formats/limits | `product-media-upload.middleware.ts`, `env.ts`, Swagger schema |
| Database columns/relations | TypeORM entity plus a new migration; never edit a migration already applied in production |
| Swagger contract | `DokanBDbackend/src/docs/openapi.ts` |

## Included file structure

```text
[Frontend routing, layouts, navigation, and HTTP foundation]
  web/src/routes/AppRouter.tsx
  web/src/layouts/AdminLayout.tsx
  web/src/layouts/AdminLayout.module.css
  web/src/admin/navigation/AdminSidebar/adminSidebar.config.ts
  web/src/admin/navigation/AdminSidebar/adminSidebar.types.ts
  web/src/api/client.ts
  web/src/api/adminProducts.ts
  web/src/api/adminProducts.test.ts
  web/src/api/adminCatalog.ts
  web/src/api/products.ts
  web/src/api/catalog.ts

[Admin product list, search, add, and edit workflow]
  web/src/pages/admin/AdminProductsPage.tsx
  web/src/pages/admin/AdminProductEditorPage.tsx
  web/src/pages/dashboard/AdminPriceTierBuilder.tsx
  web/src/pages/dashboard/discountDraft.ts
  web/src/pages/dashboard/discountDraft.test.ts
  web/src/pages/dashboard/variantCsv.ts
  web/src/pages/dashboard/variantCsv.test.ts
  web/src/pages/dashboard/variantPaths.ts
  web/src/pages/dashboard/variantPaths.test.ts
  web/src/admin/product-editor/AdminProductEditorPage.module.css
  web/src/admin/product-editor/AdminProductEditorPage.tsx
  web/src/admin/product-editor/components/AdditionalProductDetails/AdditionalProductDetails.module.css
  web/src/admin/product-editor/components/AdditionalProductDetails/AdditionalProductDetails.tsx
  web/src/admin/product-editor/components/AdditionalProductDetails/ProductMediaLibrary.tsx
  web/src/admin/product-editor/components/ProductEditorHeader/ProductEditorHeader.module.css
  web/src/admin/product-editor/components/ProductEditorHeader/ProductEditorHeader.tsx
  web/src/admin/product-editor/components/ProductGeneralSection/ProductGeneralSection.module.css
  web/src/admin/product-editor/components/ProductGeneralSection/ProductGeneralSection.tsx
  web/src/admin/product-editor/components/SelectedSkuEditor/SelectedSkuEditor.module.css
  web/src/admin/product-editor/components/SelectedSkuEditor/SelectedSkuEditor.tsx
  web/src/admin/product-editor/components/VariantCombinationsTable/VariantCombinationsTable.module.css
  web/src/admin/product-editor/components/VariantCombinationsTable/VariantCombinationsTable.tsx
  web/src/admin/product-editor/components/VariantOptionsSection/VariantOptionsSection.module.css
  web/src/admin/product-editor/components/VariantOptionsSection/VariantOptionsSection.tsx
  web/src/admin/product-editor/components/VariantPreferencesSection/QuantityPricingEditor.tsx
  web/src/admin/product-editor/components/VariantPreferencesSection/VariantPreferencesSection.module.css
  web/src/admin/product-editor/components/VariantPreferencesSection/VariantPreferencesSection.tsx
  web/src/admin/product-editor/hooks/useProductCatalogOptions.ts
  web/src/admin/product-editor/hooks/useProductEditor.ts
  web/src/admin/product-editor/hooks/useProductMedia.ts
  web/src/admin/product-editor/index.ts
  web/src/admin/product-editor/tests/ProductGeneralSection.test.tsx
  web/src/admin/product-editor/tests/SelectedSkuEditor.test.tsx
  web/src/admin/product-editor/tests/VariantCombinationsTable.test.tsx
  web/src/admin/product-editor/tests/VariantPreferencesSection.test.tsx
  web/src/admin/product-editor/types/productEditor.types.ts
  web/src/admin/product-editor/utils/productEditor.mappers.ts
  web/src/admin/product-editor/utils/productEditor.save.ts
  web/src/admin/product-editor/utils/productEditor.validation.ts
  web/src/admin/product-editor/utils/variantCsv.ts
  web/src/admin/product-editor/utils/variantPaths.ts
  web/src/admin/products/AdminProductsPage.tsx
  web/src/admin/products/components/AdminProductSearch.module.css
  web/src/admin/products/components/AdminProductSearch.tsx
  web/src/admin/products/components/AdminProductsTable.tsx
  web/src/admin/products/hooks/useAdminProducts.ts
  web/src/admin/products/index.ts

[Admin category, product type, brand, and attribute management]
  web/src/pages/admin/AdminCatalogSettingsPage.tsx
  web/src/pages/admin/AdminCategoriesPage.tsx
  web/src/pages/admin/AdminBrandsPage.tsx
  web/src/pages/admin/AdminProductTypesPage.tsx
  web/src/pages/admin/AdminPropertiesPage.tsx
  web/src/admin/attributes/AdminAttributes.module.css
  web/src/admin/attributes/AdminAttributesPage.tsx
  web/src/admin/attributes/attribute-values.ts
  web/src/admin/attributes/attributes.test.tsx
  web/src/admin/attributes/components/AttributeForm.tsx
  web/src/admin/attributes/components/AttributeNameEditor.tsx
  web/src/admin/attributes/components/AttributeValuesCell.tsx
  web/src/admin/attributes/components/AttributesTable.tsx
  web/src/admin/attributes/hooks/useAdminAttributes.ts
  web/src/admin/attributes/index.ts

[Storefront product consumers]
  web/src/pages/Home.tsx
  web/src/pages/products/ProductDetail.tsx
  web/src/pages/products/SearchResultsPage.tsx
  web/src/pages/products/productVariantSelection.ts
  web/src/pages/products/productVariantSelection.test.ts
  web/src/pages/products/storefrontPricing.ts
  web/src/pages/products/storefrontPricing.test.ts
  web/src/features/catalog/components/ActiveFilterChips.tsx
  web/src/features/catalog/components/CatalogFilters.tsx
  web/src/features/catalog/components/CatalogToolbar.tsx
  web/src/features/catalog/components/CategoryNavigation.tsx
  web/src/features/catalog/components/MobileFilterDrawer.tsx
  web/src/features/catalog/components/ProductGrid.tsx
  web/src/features/catalog/components/ProductSearch.tsx
  web/src/features/catalog/components/SortSelect.tsx
  web/src/features/catalog/components/catalog-components.test.tsx
  web/src/features/catalog/hooks/useCatalogFilters.ts
  web/src/features/catalog/hooks/useCatalogProducts.ts
  web/src/features/catalog/hooks/useCatalogReferences.ts
  web/src/features/catalog/hooks/useProductSuggestions.ts
  web/src/features/catalog/types/catalog.ts
  web/src/features/catalog/utils/catalogOptions.ts
  web/src/features/catalog/utils/catalogParams.test.ts
  web/src/features/catalog/utils/catalogParams.ts
  web/src/features/catalog/utils/formatters.ts

[Product and administration styles]
  web/src/styles/features/product-editor.css
  web/src/styles/features/product.css
  web/src/styles/features/admin.css
  web/src/styles/layout.css
  web/src/styles/tailwind.css

[Backend API entry, security, configuration, and database connection]
  DokanBDbackend/src/app.ts
  DokanBDbackend/src/routes/v1.ts
  DokanBDbackend/src/modules/auth/auth.middleware.ts
  DokanBDbackend/src/modules/auth/authorization.middleware.ts
  DokanBDbackend/src/utils/app-error.ts
  DokanBDbackend/src/config/env.ts
  DokanBDbackend/src/database/data-source.ts

[Backend product, variant, pricing, media, and search module]
  DokanBDbackend/src/modules/products/README.md
  DokanBDbackend/src/modules/products/product-category-hierarchy.test.ts
  DokanBDbackend/src/modules/products/product-media-upload.middleware.ts
  DokanBDbackend/src/modules/products/product-media.controller.ts
  DokanBDbackend/src/modules/products/product-media.entity.ts
  DokanBDbackend/src/modules/products/product-media.schema.ts
  DokanBDbackend/src/modules/products/product-media.service.ts
  DokanBDbackend/src/modules/products/product-price-tier.entity.ts
  DokanBDbackend/src/modules/products/product-price-tier.service.ts
  DokanBDbackend/src/modules/products/product-pricing.test.ts
  DokanBDbackend/src/modules/products/product-pricing.ts
  DokanBDbackend/src/modules/products/product-variant.entity.ts
  DokanBDbackend/src/modules/products/product.controller.ts
  DokanBDbackend/src/modules/products/product.entity.ts
  DokanBDbackend/src/modules/products/product.routes.ts
  DokanBDbackend/src/modules/products/product.schema.test.ts
  DokanBDbackend/src/modules/products/product.schema.ts
  DokanBDbackend/src/modules/products/product.service.ts

[Backend categories]
  DokanBDbackend/src/modules/categories/README.md
  DokanBDbackend/src/modules/categories/category-product-type.entity.ts
  DokanBDbackend/src/modules/categories/category.controller.ts
  DokanBDbackend/src/modules/categories/category.entity.ts
  DokanBDbackend/src/modules/categories/category.routes.ts
  DokanBDbackend/src/modules/categories/category.schema.test.ts
  DokanBDbackend/src/modules/categories/category.schema.ts
  DokanBDbackend/src/modules/categories/category.service.ts

[Backend brands]
  DokanBDbackend/src/modules/brands/README.md
  DokanBDbackend/src/modules/brands/brand.controller.ts
  DokanBDbackend/src/modules/brands/brand.entity.ts
  DokanBDbackend/src/modules/brands/brand.routes.ts
  DokanBDbackend/src/modules/brands/brand.schema.test.ts
  DokanBDbackend/src/modules/brands/brand.schema.ts
  DokanBDbackend/src/modules/brands/brand.service.ts

[Backend product types]
  DokanBDbackend/src/modules/product-types/product-type.controller.ts
  DokanBDbackend/src/modules/product-types/product-type.entity.ts
  DokanBDbackend/src/modules/product-types/product-type.routes.ts
  DokanBDbackend/src/modules/product-types/product-type.schema.test.ts
  DokanBDbackend/src/modules/product-types/product-type.schema.ts
  DokanBDbackend/src/modules/product-types/product-type.service.ts

[Backend attributes and option values]
  DokanBDbackend/src/modules/attributes/product-attribute-value.entity.ts
  DokanBDbackend/src/modules/attributes/product-attribute.controller.ts
  DokanBDbackend/src/modules/attributes/product-attribute.entity.ts
  DokanBDbackend/src/modules/attributes/product-attribute.routes.ts
  DokanBDbackend/src/modules/attributes/product-attribute.schema.test.ts
  DokanBDbackend/src/modules/attributes/product-attribute.schema.ts
  DokanBDbackend/src/modules/attributes/product-attribute.service.test.ts
  DokanBDbackend/src/modules/attributes/product-attribute.service.ts
  DokanBDbackend/src/modules/attributes/product-type-attribute.entity.ts
  DokanBDbackend/src/modules/attributes/product-variant-attribute-value.entity.ts

[Inventory and entity dependencies]
  DokanBDbackend/src/modules/inventory/inventory-movement.entity.ts
  DokanBDbackend/src/modules/vendors/vendor.entity.ts

[Product-related database migrations]
  DokanBDbackend/src/database/migrations/1791108013191-InitialSchema.ts
  DokanBDbackend/src/database/migrations/1791270000000-AdminCatalogManagement.ts
  DokanBDbackend/src/database/migrations/1791271000000-ProductTypeManagement.ts
  DokanBDbackend/src/database/migrations/1791620000000-ProductAttributesAndVariants.ts
  DokanBDbackend/src/database/migrations/1791790000000-ProductWorkbenchPricing.ts
  DokanBDbackend/src/database/migrations/1791791000000-ProductVariantDimensions.ts
  DokanBDbackend/src/database/migrations/1791870000000-CatalogRelationshipAssignments.ts
  DokanBDbackend/src/database/migrations/1792040000000-CategoryHierarchyAndGlobalBrands.ts

[Swagger / OpenAPI contract]
  DokanBDbackend/src/docs/openapi.ts
  DokanBDbackend/tests/openapi.test.ts

```

## Source file index

| # | Group | File | Lines |
| ---: | --- | --- | ---: |
| 1 | Frontend routing, layouts, navigation, and HTTP foundation | `web/src/routes/AppRouter.tsx` | 147 |
| 2 | Frontend routing, layouts, navigation, and HTTP foundation | `web/src/layouts/AdminLayout.tsx` | 22 |
| 3 | Frontend routing, layouts, navigation, and HTTP foundation | `web/src/layouts/AdminLayout.module.css` | 63 |
| 4 | Frontend routing, layouts, navigation, and HTTP foundation | `web/src/admin/navigation/AdminSidebar/adminSidebar.config.ts` | 53 |
| 5 | Frontend routing, layouts, navigation, and HTTP foundation | `web/src/admin/navigation/AdminSidebar/adminSidebar.types.ts` | 19 |
| 6 | Frontend routing, layouts, navigation, and HTTP foundation | `web/src/api/client.ts` | 93 |
| 7 | Frontend routing, layouts, navigation, and HTTP foundation | `web/src/api/adminProducts.ts` | 165 |
| 8 | Frontend routing, layouts, navigation, and HTTP foundation | `web/src/api/adminProducts.test.ts` | 34 |
| 9 | Frontend routing, layouts, navigation, and HTTP foundation | `web/src/api/adminCatalog.ts` | 243 |
| 10 | Frontend routing, layouts, navigation, and HTTP foundation | `web/src/api/products.ts` | 173 |
| 11 | Frontend routing, layouts, navigation, and HTTP foundation | `web/src/api/catalog.ts` | 33 |
| 12 | Admin product list, search, add, and edit workflow | `web/src/pages/admin/AdminProductsPage.tsx` | 3 |
| 13 | Admin product list, search, add, and edit workflow | `web/src/pages/admin/AdminProductEditorPage.tsx` | 3 |
| 14 | Admin product list, search, add, and edit workflow | `web/src/pages/dashboard/AdminPriceTierBuilder.tsx` | 4 |
| 15 | Admin product list, search, add, and edit workflow | `web/src/pages/dashboard/discountDraft.ts` | 5 |
| 16 | Admin product list, search, add, and edit workflow | `web/src/pages/dashboard/discountDraft.test.ts` | 22 |
| 17 | Admin product list, search, add, and edit workflow | `web/src/pages/dashboard/variantCsv.ts` | 2 |
| 18 | Admin product list, search, add, and edit workflow | `web/src/pages/dashboard/variantCsv.test.ts` | 144 |
| 19 | Admin product list, search, add, and edit workflow | `web/src/pages/dashboard/variantPaths.ts` | 2 |
| 20 | Admin product list, search, add, and edit workflow | `web/src/pages/dashboard/variantPaths.test.ts` | 116 |
| 21 | Admin product list, search, add, and edit workflow | `web/src/admin/product-editor/AdminProductEditorPage.module.css` | 5 |
| 22 | Admin product list, search, add, and edit workflow | `web/src/admin/product-editor/AdminProductEditorPage.tsx` | 56 |
| 23 | Admin product list, search, add, and edit workflow | `web/src/admin/product-editor/components/AdditionalProductDetails/AdditionalProductDetails.module.css` | 17 |
| 24 | Admin product list, search, add, and edit workflow | `web/src/admin/product-editor/components/AdditionalProductDetails/AdditionalProductDetails.tsx` | 65 |
| 25 | Admin product list, search, add, and edit workflow | `web/src/admin/product-editor/components/AdditionalProductDetails/ProductMediaLibrary.tsx` | 99 |
| 26 | Admin product list, search, add, and edit workflow | `web/src/admin/product-editor/components/ProductEditorHeader/ProductEditorHeader.module.css` | 4 |
| 27 | Admin product list, search, add, and edit workflow | `web/src/admin/product-editor/components/ProductEditorHeader/ProductEditorHeader.tsx` | 60 |
| 28 | Admin product list, search, add, and edit workflow | `web/src/admin/product-editor/components/ProductGeneralSection/ProductGeneralSection.module.css` | 4 |
| 29 | Admin product list, search, add, and edit workflow | `web/src/admin/product-editor/components/ProductGeneralSection/ProductGeneralSection.tsx` | 124 |
| 30 | Admin product list, search, add, and edit workflow | `web/src/admin/product-editor/components/SelectedSkuEditor/SelectedSkuEditor.module.css` | 5 |
| 31 | Admin product list, search, add, and edit workflow | `web/src/admin/product-editor/components/SelectedSkuEditor/SelectedSkuEditor.tsx` | 107 |
| 32 | Admin product list, search, add, and edit workflow | `web/src/admin/product-editor/components/VariantCombinationsTable/VariantCombinationsTable.module.css` | 5 |
| 33 | Admin product list, search, add, and edit workflow | `web/src/admin/product-editor/components/VariantCombinationsTable/VariantCombinationsTable.tsx` | 112 |
| 34 | Admin product list, search, add, and edit workflow | `web/src/admin/product-editor/components/VariantOptionsSection/VariantOptionsSection.module.css` | 5 |
| 35 | Admin product list, search, add, and edit workflow | `web/src/admin/product-editor/components/VariantOptionsSection/VariantOptionsSection.tsx` | 177 |
| 36 | Admin product list, search, add, and edit workflow | `web/src/admin/product-editor/components/VariantPreferencesSection/QuantityPricingEditor.tsx` | 84 |
| 37 | Admin product list, search, add, and edit workflow | `web/src/admin/product-editor/components/VariantPreferencesSection/VariantPreferencesSection.module.css` | 5 |
| 38 | Admin product list, search, add, and edit workflow | `web/src/admin/product-editor/components/VariantPreferencesSection/VariantPreferencesSection.tsx` | 154 |
| 39 | Admin product list, search, add, and edit workflow | `web/src/admin/product-editor/hooks/useProductCatalogOptions.ts` | 462 |
| 40 | Admin product list, search, add, and edit workflow | `web/src/admin/product-editor/hooks/useProductEditor.ts` | 308 |
| 41 | Admin product list, search, add, and edit workflow | `web/src/admin/product-editor/hooks/useProductMedia.ts` | 199 |
| 42 | Admin product list, search, add, and edit workflow | `web/src/admin/product-editor/index.ts` | 2 |
| 43 | Admin product list, search, add, and edit workflow | `web/src/admin/product-editor/tests/ProductGeneralSection.test.tsx` | 33 |
| 44 | Admin product list, search, add, and edit workflow | `web/src/admin/product-editor/tests/SelectedSkuEditor.test.tsx` | 34 |
| 45 | Admin product list, search, add, and edit workflow | `web/src/admin/product-editor/tests/VariantCombinationsTable.test.tsx` | 42 |
| 46 | Admin product list, search, add, and edit workflow | `web/src/admin/product-editor/tests/VariantPreferencesSection.test.tsx` | 37 |
| 47 | Admin product list, search, add, and edit workflow | `web/src/admin/product-editor/types/productEditor.types.ts` | 76 |
| 48 | Admin product list, search, add, and edit workflow | `web/src/admin/product-editor/utils/productEditor.mappers.ts` | 161 |
| 49 | Admin product list, search, add, and edit workflow | `web/src/admin/product-editor/utils/productEditor.save.ts` | 143 |
| 50 | Admin product list, search, add, and edit workflow | `web/src/admin/product-editor/utils/productEditor.validation.ts` | 170 |
| 51 | Admin product list, search, add, and edit workflow | `web/src/admin/product-editor/utils/variantCsv.ts` | 393 |
| 52 | Admin product list, search, add, and edit workflow | `web/src/admin/product-editor/utils/variantPaths.ts` | 130 |
| 53 | Admin product list, search, add, and edit workflow | `web/src/admin/products/AdminProductsPage.tsx` | 69 |
| 54 | Admin product list, search, add, and edit workflow | `web/src/admin/products/components/AdminProductSearch.module.css` | 62 |
| 55 | Admin product list, search, add, and edit workflow | `web/src/admin/products/components/AdminProductSearch.tsx` | 56 |
| 56 | Admin product list, search, add, and edit workflow | `web/src/admin/products/components/AdminProductsTable.tsx` | 91 |
| 57 | Admin product list, search, add, and edit workflow | `web/src/admin/products/hooks/useAdminProducts.ts` | 36 |
| 58 | Admin product list, search, add, and edit workflow | `web/src/admin/products/index.ts` | 2 |
| 59 | Admin category, product type, brand, and attribute management | `web/src/pages/admin/AdminCatalogSettingsPage.tsx` | 572 |
| 60 | Admin category, product type, brand, and attribute management | `web/src/pages/admin/AdminCategoriesPage.tsx` | 8 |
| 61 | Admin category, product type, brand, and attribute management | `web/src/pages/admin/AdminBrandsPage.tsx` | 8 |
| 62 | Admin category, product type, brand, and attribute management | `web/src/pages/admin/AdminProductTypesPage.tsx` | 8 |
| 63 | Admin category, product type, brand, and attribute management | `web/src/pages/admin/AdminPropertiesPage.tsx` | 3 |
| 64 | Admin category, product type, brand, and attribute management | `web/src/admin/attributes/AdminAttributes.module.css` | 216 |
| 65 | Admin category, product type, brand, and attribute management | `web/src/admin/attributes/AdminAttributesPage.tsx` | 76 |
| 66 | Admin category, product type, brand, and attribute management | `web/src/admin/attributes/attribute-values.ts` | 16 |
| 67 | Admin category, product type, brand, and attribute management | `web/src/admin/attributes/attributes.test.tsx` | 61 |
| 68 | Admin category, product type, brand, and attribute management | `web/src/admin/attributes/components/AttributeForm.tsx` | 62 |
| 69 | Admin category, product type, brand, and attribute management | `web/src/admin/attributes/components/AttributeNameEditor.tsx` | 61 |
| 70 | Admin category, product type, brand, and attribute management | `web/src/admin/attributes/components/AttributeValuesCell.tsx` | 79 |
| 71 | Admin category, product type, brand, and attribute management | `web/src/admin/attributes/components/AttributesTable.tsx` | 117 |
| 72 | Admin category, product type, brand, and attribute management | `web/src/admin/attributes/hooks/useAdminAttributes.ts` | 184 |
| 73 | Admin category, product type, brand, and attribute management | `web/src/admin/attributes/index.ts` | 2 |
| 74 | Storefront product consumers | `web/src/pages/Home.tsx` | 99 |
| 75 | Storefront product consumers | `web/src/pages/products/ProductDetail.tsx` | 424 |
| 76 | Storefront product consumers | `web/src/pages/products/SearchResultsPage.tsx` | 117 |
| 77 | Storefront product consumers | `web/src/pages/products/productVariantSelection.ts` | 138 |
| 78 | Storefront product consumers | `web/src/pages/products/productVariantSelection.test.ts` | 123 |
| 79 | Storefront product consumers | `web/src/pages/products/storefrontPricing.ts` | 79 |
| 80 | Storefront product consumers | `web/src/pages/products/storefrontPricing.test.ts` | 67 |
| 81 | Storefront product consumers | `web/src/features/catalog/components/ActiveFilterChips.tsx` | 78 |
| 82 | Storefront product consumers | `web/src/features/catalog/components/CatalogFilters.tsx` | 151 |
| 83 | Storefront product consumers | `web/src/features/catalog/components/CatalogToolbar.tsx` | 40 |
| 84 | Storefront product consumers | `web/src/features/catalog/components/CategoryNavigation.tsx` | 308 |
| 85 | Storefront product consumers | `web/src/features/catalog/components/MobileFilterDrawer.tsx` | 125 |
| 86 | Storefront product consumers | `web/src/features/catalog/components/ProductGrid.tsx` | 56 |
| 87 | Storefront product consumers | `web/src/features/catalog/components/ProductSearch.tsx` | 248 |
| 88 | Storefront product consumers | `web/src/features/catalog/components/SortSelect.tsx` | 27 |
| 89 | Storefront product consumers | `web/src/features/catalog/components/catalog-components.test.tsx` | 107 |
| 90 | Storefront product consumers | `web/src/features/catalog/hooks/useCatalogFilters.ts` | 28 |
| 91 | Storefront product consumers | `web/src/features/catalog/hooks/useCatalogProducts.ts` | 43 |
| 92 | Storefront product consumers | `web/src/features/catalog/hooks/useCatalogReferences.ts` | 36 |
| 93 | Storefront product consumers | `web/src/features/catalog/hooks/useProductSuggestions.ts` | 58 |
| 94 | Storefront product consumers | `web/src/features/catalog/types/catalog.ts` | 15 |
| 95 | Storefront product consumers | `web/src/features/catalog/utils/catalogOptions.ts` | 16 |
| 96 | Storefront product consumers | `web/src/features/catalog/utils/catalogParams.test.ts` | 45 |
| 97 | Storefront product consumers | `web/src/features/catalog/utils/catalogParams.ts` | 79 |
| 98 | Storefront product consumers | `web/src/features/catalog/utils/formatters.ts` | 10 |
| 99 | Product and administration styles | `web/src/styles/features/product-editor.css` | 1240 |
| 100 | Product and administration styles | `web/src/styles/features/product.css` | 551 |
| 101 | Product and administration styles | `web/src/styles/features/admin.css` | 965 |
| 102 | Product and administration styles | `web/src/styles/layout.css` | 13 |
| 103 | Product and administration styles | `web/src/styles/tailwind.css` | 49 |
| 104 | Backend API entry, security, configuration, and database connection | `DokanBDbackend/src/app.ts` | 54 |
| 105 | Backend API entry, security, configuration, and database connection | `DokanBDbackend/src/routes/v1.ts` | 50 |
| 106 | Backend API entry, security, configuration, and database connection | `DokanBDbackend/src/modules/auth/auth.middleware.ts` | 39 |
| 107 | Backend API entry, security, configuration, and database connection | `DokanBDbackend/src/modules/auth/authorization.middleware.ts` | 58 |
| 108 | Backend API entry, security, configuration, and database connection | `DokanBDbackend/src/utils/app-error.ts` | 10 |
| 109 | Backend API entry, security, configuration, and database connection | `DokanBDbackend/src/config/env.ts` | 47 |
| 110 | Backend API entry, security, configuration, and database connection | `DokanBDbackend/src/database/data-source.ts` | 28 |
| 111 | Backend product, variant, pricing, media, and search module | `DokanBDbackend/src/modules/products/README.md` | 6 |
| 112 | Backend product, variant, pricing, media, and search module | `DokanBDbackend/src/modules/products/product-category-hierarchy.test.ts` | 22 |
| 113 | Backend product, variant, pricing, media, and search module | `DokanBDbackend/src/modules/products/product-media-upload.middleware.ts` | 42 |
| 114 | Backend product, variant, pricing, media, and search module | `DokanBDbackend/src/modules/products/product-media.controller.ts` | 70 |
| 115 | Backend product, variant, pricing, media, and search module | `DokanBDbackend/src/modules/products/product-media.entity.ts` | 53 |
| 116 | Backend product, variant, pricing, media, and search module | `DokanBDbackend/src/modules/products/product-media.schema.ts` | 30 |
| 117 | Backend product, variant, pricing, media, and search module | `DokanBDbackend/src/modules/products/product-media.service.ts` | 220 |
| 118 | Backend product, variant, pricing, media, and search module | `DokanBDbackend/src/modules/products/product-price-tier.entity.ts` | 51 |
| 119 | Backend product, variant, pricing, media, and search module | `DokanBDbackend/src/modules/products/product-price-tier.service.ts` | 76 |
| 120 | Backend product, variant, pricing, media, and search module | `DokanBDbackend/src/modules/products/product-pricing.test.ts` | 110 |
| 121 | Backend product, variant, pricing, media, and search module | `DokanBDbackend/src/modules/products/product-pricing.ts` | 92 |
| 122 | Backend product, variant, pricing, media, and search module | `DokanBDbackend/src/modules/products/product-variant.entity.ts` | 97 |
| 123 | Backend product, variant, pricing, media, and search module | `DokanBDbackend/src/modules/products/product.controller.ts` | 202 |
| 124 | Backend product, variant, pricing, media, and search module | `DokanBDbackend/src/modules/products/product.entity.ts` | 87 |
| 125 | Backend product, variant, pricing, media, and search module | `DokanBDbackend/src/modules/products/product.routes.ts` | 83 |
| 126 | Backend product, variant, pricing, media, and search module | `DokanBDbackend/src/modules/products/product.schema.test.ts` | 161 |
| 127 | Backend product, variant, pricing, media, and search module | `DokanBDbackend/src/modules/products/product.schema.ts` | 265 |
| 128 | Backend product, variant, pricing, media, and search module | `DokanBDbackend/src/modules/products/product.service.ts` | 1397 |
| 129 | Backend categories | `DokanBDbackend/src/modules/categories/README.md` | 8 |
| 130 | Backend categories | `DokanBDbackend/src/modules/categories/category-product-type.entity.ts` | 25 |
| 131 | Backend categories | `DokanBDbackend/src/modules/categories/category.controller.ts` | 100 |
| 132 | Backend categories | `DokanBDbackend/src/modules/categories/category.entity.ts` | 57 |
| 133 | Backend categories | `DokanBDbackend/src/modules/categories/category.routes.ts` | 29 |
| 134 | Backend categories | `DokanBDbackend/src/modules/categories/category.schema.test.ts` | 42 |
| 135 | Backend categories | `DokanBDbackend/src/modules/categories/category.schema.ts` | 61 |
| 136 | Backend categories | `DokanBDbackend/src/modules/categories/category.service.ts` | 498 |
| 137 | Backend brands | `DokanBDbackend/src/modules/brands/README.md` | 7 |
| 138 | Backend brands | `DokanBDbackend/src/modules/brands/brand.controller.ts` | 59 |
| 139 | Backend brands | `DokanBDbackend/src/modules/brands/brand.entity.ts` | 39 |
| 140 | Backend brands | `DokanBDbackend/src/modules/brands/brand.routes.ts` | 25 |
| 141 | Backend brands | `DokanBDbackend/src/modules/brands/brand.schema.test.ts` | 21 |
| 142 | Backend brands | `DokanBDbackend/src/modules/brands/brand.schema.ts` | 47 |
| 143 | Backend brands | `DokanBDbackend/src/modules/brands/brand.service.ts` | 153 |
| 144 | Backend product types | `DokanBDbackend/src/modules/product-types/product-type.controller.ts` | 31 |
| 145 | Backend product types | `DokanBDbackend/src/modules/product-types/product-type.entity.ts` | 36 |
| 146 | Backend product types | `DokanBDbackend/src/modules/product-types/product-type.routes.ts` | 13 |
| 147 | Backend product types | `DokanBDbackend/src/modules/product-types/product-type.schema.test.ts` | 14 |
| 148 | Backend product types | `DokanBDbackend/src/modules/product-types/product-type.schema.ts` | 28 |
| 149 | Backend product types | `DokanBDbackend/src/modules/product-types/product-type.service.ts` | 70 |
| 150 | Backend attributes and option values | `DokanBDbackend/src/modules/attributes/product-attribute-value.entity.ts` | 52 |
| 151 | Backend attributes and option values | `DokanBDbackend/src/modules/attributes/product-attribute.controller.ts` | 71 |
| 152 | Backend attributes and option values | `DokanBDbackend/src/modules/attributes/product-attribute.entity.ts` | 36 |
| 153 | Backend attributes and option values | `DokanBDbackend/src/modules/attributes/product-attribute.routes.ts` | 27 |
| 154 | Backend attributes and option values | `DokanBDbackend/src/modules/attributes/product-attribute.schema.test.ts` | 30 |
| 155 | Backend attributes and option values | `DokanBDbackend/src/modules/attributes/product-attribute.schema.ts` | 93 |
| 156 | Backend attributes and option values | `DokanBDbackend/src/modules/attributes/product-attribute.service.test.ts` | 24 |
| 157 | Backend attributes and option values | `DokanBDbackend/src/modules/attributes/product-attribute.service.ts` | 335 |
| 158 | Backend attributes and option values | `DokanBDbackend/src/modules/attributes/product-type-attribute.entity.ts` | 28 |
| 159 | Backend attributes and option values | `DokanBDbackend/src/modules/attributes/product-variant-attribute-value.entity.ts` | 22 |
| 160 | Inventory and entity dependencies | `DokanBDbackend/src/modules/inventory/inventory-movement.entity.ts` | 56 |
| 161 | Inventory and entity dependencies | `DokanBDbackend/src/modules/vendors/vendor.entity.ts` | 44 |
| 162 | Product-related database migrations | `DokanBDbackend/src/database/migrations/1791108013191-InitialSchema.ts` | 627 |
| 163 | Product-related database migrations | `DokanBDbackend/src/database/migrations/1791270000000-AdminCatalogManagement.ts` | 25 |
| 164 | Product-related database migrations | `DokanBDbackend/src/database/migrations/1791271000000-ProductTypeManagement.ts` | 14 |
| 165 | Product-related database migrations | `DokanBDbackend/src/database/migrations/1791620000000-ProductAttributesAndVariants.ts` | 104 |
| 166 | Product-related database migrations | `DokanBDbackend/src/database/migrations/1791790000000-ProductWorkbenchPricing.ts` | 41 |
| 167 | Product-related database migrations | `DokanBDbackend/src/database/migrations/1791791000000-ProductVariantDimensions.ts` | 30 |
| 168 | Product-related database migrations | `DokanBDbackend/src/database/migrations/1791870000000-CatalogRelationshipAssignments.ts` | 60 |
| 169 | Product-related database migrations | `DokanBDbackend/src/database/migrations/1792040000000-CategoryHierarchyAndGlobalBrands.ts` | 51 |
| 170 | Swagger / OpenAPI contract | `DokanBDbackend/src/docs/openapi.ts` | 2574 |
| 171 | Swagger / OpenAPI contract | `DokanBDbackend/tests/openapi.test.ts` | 240 |

# Complete source code

## Frontend routing, layouts, navigation, and HTTP foundation

Shows how administrators reach the product screens and how browser requests are sent.

### `web/src/routes/AppRouter.tsx`

Source lines: 146

````tsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import { MainLayout } from "../layouts/MainLayout";
import { Login } from "../pages/auth/Login";
import { Register } from "../pages/auth/Register";
import { ForgotPassword } from "../pages/auth/ForgotPassword";
import { ResetPassword } from "../pages/auth/ResetPassword";
import { VerifyEmail } from "../pages/auth/VerifyEmail";
import { CustomerDashboard } from "../pages/dashboard/CustomerDashboard";
import { Home } from "../pages/Home";
import { ProductDetail } from "../pages/products/ProductDetail";
import { SearchResultsPage } from "../pages/products/SearchResultsPage";
import { CartPage } from "../pages/cart/CartPage";
import { AddressesPage } from "../pages/account/AddressesPage";
import { CheckoutPage } from "../pages/checkout/CheckoutPage";
import { OrdersPage } from "../pages/orders/OrdersPage";
import { OrderDetailPage } from "../pages/orders/OrderDetailPage";
import { AdminOrdersPage } from "../pages/admin/AdminOrdersPage";
import { AdminOrderDetailPage } from "../pages/admin/AdminOrderDetailPage";
import { AdminLayout } from "../layouts/AdminLayout";
import { AdminBrandsPage } from "../pages/admin/AdminBrandsPage";
import { AdminCategoriesPage } from "../pages/admin/AdminCategoriesPage";
import { AdminDashboardPage } from "../admin/dashboard";
import { AdminProductEditorPage } from "../admin/product-editor";
import { AdminProductsPage } from "../admin/products";
import { AdminProductTypesPage } from "../pages/admin/AdminProductTypesPage";
import { AdminAttributesPage } from "../admin/attributes";
import { AdminCouponsPage } from "../pages/admin/AdminCouponsPage";

const ProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) return <div className="loading-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return <Outlet />;
};

const AccountRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) return <div className="loading-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role.code === "ADMIN" || user.role.code === "OWNER") {
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
};

const RoleRoute: React.FC<{ roles: string[] }> = ({ roles }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="loading-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  
  if (!roles.includes(user.role.code)) {
    return <Navigate to="/forbidden" replace />;
  }

  return <Outlet />;
};

const PublicOnlyRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) return <div className="loading-screen">Loading...</div>;
  
  if (user) {
    if (user.role.code === "ADMIN" || user.role.code === "OWNER") {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/account" replace />;
  }

  return <Outlet />;
};

const Forbidden: React.FC = () => (
  <div className="app-shell">
    <div className="welcome-card">
      <h1 style={{ color: "#d93025" }}>Access Denied</h1>
      <p>You don't have permission to view this page.</p>
    </div>
  </div>
);

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          {/* Public Home Page accessible to everyone */}
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<SearchResultsPage />} />
          <Route path="/products/:slug" element={<ProductDetail />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          {/* Auth routes (Logged out only) */}
          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* Customer account route; administrators return to their dashboard. */}
          <Route element={<AccountRoute />}>
            <Route path="/account" element={<CustomerDashboard />} />
            <Route path="/account/addresses" element={<AddressesPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/account/orders" element={<OrdersPage />} />
            <Route path="/account/orders/:orderId" element={<OrderDetailPage />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route path="/forbidden" element={<Forbidden />} />
          </Route>

          {/* Protected Admin Routes */}
          <Route element={<RoleRoute roles={["ADMIN", "OWNER"]} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboardPage />} />
              <Route path="products" element={<AdminProductsPage />} />
              <Route path="products/new" element={<AdminProductEditorPage />} />
              <Route path="products/:productId/edit" element={<AdminProductEditorPage />} />
              <Route path="orders" element={<AdminOrdersPage />} />
              <Route path="orders/:orderId" element={<AdminOrderDetailPage />} />
              <Route path="categories" element={<AdminCategoriesPage />} />
              <Route path="brands" element={<AdminBrandsPage />} />
              <Route path="product-types" element={<AdminProductTypesPage />} />
              <Route path="attributes" element={<AdminAttributesPage />} />
              <Route path="properties" element={<Navigate to="/admin/attributes" replace />} />
              <Route path="coupons" element={<AdminCouponsPage />} />
              <Route path="catalog" element={<Navigate to="/admin/categories" replace />} />
            </Route>
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
````

### `web/src/layouts/AdminLayout.tsx`

Source lines: 21

````tsx
import React from "react";
import { Outlet } from "react-router-dom";

import {
  AdminSidebar,
  useAdminSidebarState,
} from "../admin/navigation/AdminSidebar";
import styles from "./AdminLayout.module.css";

export const AdminLayout: React.FC = () => {
  const { collapsed, toggle } = useAdminSidebarState();

  return (
    <div className={`${styles.shell}${collapsed ? ` ${styles.collapsed}` : ""}`}>
      <AdminSidebar collapsed={collapsed} onToggle={toggle} />
      <section className={styles.workspace}>
        <Outlet />
      </section>
    </div>
  );
};
````

### `web/src/layouts/AdminLayout.module.css`

Source lines: 59

````css
.shell {
  /* Admin-only design tokens do not affect customer or storefront screens. */
  --primary: #2563eb;
  --primary-hover: #1d4ed8;
  --bg-color: #f3f6fb;
  --surface: #ffffff;
  --text-main: #172033;
  --text-muted: #667085;
  --border: #e2e8f0;
  --success: #15803d;
  --success-bg: #ecfdf3;
  --info: #175cd3;
  --info-bg: #eff8ff;
  --admin-accent: #3b82f6;
  --admin-sidebar-width: 248px;
  --admin-sidebar-collapsed-width: 76px;

  width: 100%;
  max-width: none;
  height: calc(100dvh - 73px);
  display: grid;
  grid-template-columns: var(--admin-sidebar-width) minmax(0, 1fr);
  align-items: stretch;
  overflow: hidden;
  color: var(--text-main);
  background: var(--bg-color);
  transition: grid-template-columns 0.22s ease;
}

.collapsed {
  grid-template-columns: var(--admin-sidebar-collapsed-width) minmax(0, 1fr);
}

.workspace {
  min-width: 0;
  min-height: 0;
  height: 100%;
  overflow: auto;
  overscroll-behavior: contain;
  scrollbar-gutter: stable;
}

@media (max-width: 900px) {
  .shell,
  .collapsed {
    grid-template-columns: 1fr;
    grid-template-rows: auto minmax(0, 1fr);
  }
}


/* HEADER CONTENT: Logo on left, admin actions on right. */
.content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 16px;
}
````

### `web/src/admin/navigation/AdminSidebar/adminSidebar.config.ts`

Source lines: 52

````ts
import {
  Boxes,
  ClipboardList,
  FolderTree,
  LayoutDashboard,
  Package,
  Shapes,
  Tags,
  TicketPercent,
} from "lucide-react";

import type { AdminSidebarSection } from "./adminSidebar.types";

/**
 * Single source of truth for admin navigation.
 * Add or reorder sidebar links here, then register the same route in AppRouter.
 */
export const adminSidebarSections: AdminSidebarSection[] = [
  {
    id: "overview",
    items: [
      { to: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
    ],
  },
  {
    id: "catalog",
    label: "Catalog",
    items: [
      {
        to: "/admin/products",
        label: "Products",
        icon: Package,
        children: [
          { to: "/admin/products", label: "All products", icon: Package, exact: true },
          { to: "/admin/products/new", label: "Add product", icon: Package },
        ],
      },
      { to: "/admin/categories", label: "Categories", icon: FolderTree },
      { to: "/admin/brands", label: "Brands", icon: Tags },
      { to: "/admin/product-types", label: "Product types", icon: Boxes },
      { to: "/admin/attributes", label: "Product attributes", icon: Shapes },
    ],
  },
  {
    id: "sales",
    label: "Sales",
    items: [
      { to: "/admin/orders", label: "Orders", icon: ClipboardList },
      { to: "/admin/coupons", label: "Coupons", icon: TicketPercent },
    ],
  },
];
````

### `web/src/admin/navigation/AdminSidebar/adminSidebar.types.ts`

Source lines: 18

````ts
import type { LucideIcon } from "lucide-react";

/** One destination in the administrator navigation. */
export interface AdminSidebarItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Match only this exact URL instead of matching its nested URLs. */
  exact?: boolean;
  children?: AdminSidebarItem[];
}

/** A labelled group such as Catalog or Sales. */
export interface AdminSidebarSection {
  id: string;
  label?: string;
  items: AdminSidebarItem[];
}
````

### `web/src/api/client.ts`

Source lines: 92

````ts
let accessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

export class ApiException extends Error {
  constructor(public statusCode: number, public error: ApiError) {
    super(error.message);
    this.name = "ApiException";
  }
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: ApiError;
}

const apiBaseUrl = import.meta.env.VITE_API_URL ?? "/api/v1";

export const apiClient = async <T>(path: string, init?: RequestInit, isRetry = false): Promise<T> => {
  const headers = new Headers(init?.headers);
  if (!headers.has("Content-Type") && !(init?.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (accessToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const data: ApiResponse<T> = await response.json().catch(() => ({
    success: false,
    error: { code: "PARSE_ERROR", message: "Failed to parse response" },
  }));

  if (response.ok && data.success) {
    return data.data as T;
  }

  if (response.status === 401 && !isRetry && path !== "/auth/refresh" && path !== "/auth/login") {
    if (!refreshPromise) {
      refreshPromise = apiClient<{ accessToken: string }>(
        "/auth/refresh",
        { method: "POST" },
        true,
      )
        .then(({ accessToken: refreshedToken }) => {
          setAccessToken(refreshedToken);
          return refreshedToken;
        })
        .catch(() => {
          setAccessToken(null);
          if (typeof window !== "undefined") {
            window.dispatchEvent(new Event("auth:session-expired"));
          }
          return null;
        })
        .finally(() => {
          refreshPromise = null;
        });
    }

    const newToken = await refreshPromise;

    if (newToken) {
      return apiClient<T>(path, init, true);
    }
  }

  throw new ApiException(response.status, data.error || { code: "UNKNOWN", message: data.message || "An unknown error occurred" });
};
````

### `web/src/api/adminProducts.ts`

Source lines: 164

````ts
import { apiClient } from "./client";
import type { Money, Product, ProductMedia, ProductPriceTier, ProductTaxonomy, ProductVariant } from "./products";

export interface AdminProduct extends Product {
  productTypeId: string;
  categoryId: string;
  brandId: string | null;
  defaultCostPrice: Money | null;
  status: "DRAFT" | "ACTIVE" | "INACTIVE" | "DISCONTINUED";
  isActive: boolean;
  deletedAt: string | null;
}

export interface CategoryOption extends ProductTaxonomy {
  parentId: string | null;
  allowProducts: boolean;
  children: CategoryOption[];
}

interface AdminProductList {
  products: AdminProduct[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateProductInput {
  productTypeId: string;
  categoryId: string;
  brandId: string | null;
  name: string;
  shortDescription: string | null;
  description: string;
  defaultPrice: number;
  defaultCostPrice: number | null;
  discountPrice: number | null;
  discountStartsAt?: string | null;
  discountEndsAt?: string | null;
  status: AdminProduct["status"];
  isFeatured: boolean;
  isActive: boolean;
}

export interface CreateVariantInput {
  sku: string;
  barcode?: string | null;
  variantName?: string;
  color?: string;
  size?: string;
  price: number;
  discountPrice?: number | null;
  discountStartsAt?: string | null;
  discountEndsAt?: string | null;
  costPrice: number | null;
  stockQuantity: number;
  lowStockLevel?: number;
  weight?: number | null;
  lengthCm?: number | null;
  widthCm?: number | null;
  heightCm?: number | null;
  isDefault: boolean;
  isActive: boolean;
  optionValueIds?: string[];
}

export type UpdateVariantInput = Partial<Omit<CreateVariantInput, "isDefault">> & {
  isDefault?: boolean;
};

export const adminProductApi = {
  getProducts: (search = "") =>
    apiClient<AdminProductList>(`/admin/products?limit=100&includeDeleted=false${search.trim() ? `&search=${encodeURIComponent(search.trim())}` : ""}`, {
      method: "GET",
    }),

  getCategories: () =>
    apiClient<{ categories: CategoryOption[] }>("/categories", { method: "GET" }).then(
      ({ categories }) => categories,
    ),

  getProduct: (productId: string) =>
    apiClient<{ product: AdminProduct }>(`/admin/products/${productId}`, {
      method: "GET",
    }).then(({ product }) => product),

  createProduct: (input: CreateProductInput) =>
    apiClient<{ product: AdminProduct }>("/admin/products", {
      method: "POST",
      body: JSON.stringify(input),
    }).then(({ product }) => product),

  createVariant: (productId: string, input: CreateVariantInput) =>
    apiClient<{ variant: ProductVariant }>(`/admin/products/${productId}/variants`, {
      method: "POST",
      body: JSON.stringify(input),
    }).then(({ variant }) => variant),

  createVariantsBulk: (productId: string, variants: CreateVariantInput[]) =>
    apiClient<{ variants: ProductVariant[] }>(`/admin/products/${productId}/variants/bulk`, {
      method: "POST",
      body: JSON.stringify({ variants }),
    }).then(({ variants: created }) => created),

  updateVariant: (productId: string, variantId: string, input: UpdateVariantInput) =>
    apiClient(`/admin/products/${productId}/variants/${variantId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),

  deleteVariant: (productId: string, variantId: string) =>
    apiClient<void>(`/admin/products/${productId}/variants/${variantId}`, {
      method: "DELETE",
    }),

  updateProduct: (productId: string, input: Partial<CreateProductInput>) =>
    apiClient<{ product: AdminProduct }>(`/admin/products/${productId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }).then(({ product }) => product),

  replacePriceTiers: (
    productId: string,
    tiers: Array<{
      variantId: string | null;
      minimumQuantity: number;
      unitPrice: number;
      isPromotion: boolean;
      isActive: boolean;
    }>,
  ) => apiClient<{ priceTiers: ProductPriceTier[] }>(
    `/admin/products/${productId}/price-tiers`,
    { method: "PUT", body: JSON.stringify({ tiers }) },
  ).then(({ priceTiers }) => priceTiers),

  uploadMedia: (productId: string, files: File[], altText?: string, variantId?: string) => {
    const body = new FormData();
    files.forEach((file) => body.append("media", file));
    if (altText) body.append("altText", altText);
    if (variantId) body.append("variantId", variantId);

    return apiClient<{ media: ProductMedia[] }>(`/admin/products/${productId}/media`, {
      method: "POST",
      body,
    }).then(({ media }) => media);
  },

  updateMedia: (
    productId: string,
    mediaId: string,
    input: { altText?: string | null; sortOrder?: number; isPrimary?: boolean; variantId?: string | null },
  ) =>
    apiClient<{ media: ProductMedia }>(`/admin/products/${productId}/media/${mediaId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }).then(({ media }) => media),

  deleteMedia: (productId: string, mediaId: string) =>
    apiClient<void>(`/admin/products/${productId}/media/${mediaId}`, {
      method: "DELETE",
    }),
};
````

### `web/src/api/adminProducts.test.ts`

Source lines: 33

````ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiClient } = vi.hoisted(() => ({ apiClient: vi.fn() }));

vi.mock("./client", () => ({ apiClient }));

import { adminProductApi } from "./adminProducts";

describe("adminProductApi", () => {
  beforeEach(() => apiClient.mockReset());

  it("loads the unfiltered active catalog by default", async () => {
    const response = { products: [], pagination: { page: 1, limit: 100, total: 0, totalPages: 0 } };
    apiClient.mockResolvedValue(response);

    await expect(adminProductApi.getProducts()).resolves.toBe(response);
    expect(apiClient).toHaveBeenCalledWith(
      "/admin/products?limit=100&includeDeleted=false",
      { method: "GET" },
    );
  });

  it("trims and safely encodes the product search", async () => {
    apiClient.mockResolvedValue({ products: [], pagination: {} });

    await adminProductApi.getProducts("  cotton & silk  ");

    expect(apiClient).toHaveBeenCalledWith(
      "/admin/products?limit=100&includeDeleted=false&search=cotton%20%26%20silk",
      { method: "GET" },
    );
  });
});
````

### `web/src/api/adminCatalog.ts`

Source lines: 242

````ts
import { apiClient } from "./client";

export interface AdminCategory {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  allowProducts: boolean;
  showOnHomepage: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface AdminBrand {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface AdminProductType {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CategoryProductTypeAssignment {
  categoryId: string;
  productTypeIds: string[];
}

export interface AdminAttributeValue {
  id: string;
  attributeId: string;
  label: string;
  code: string;
  colorHex: string | null;
  sortOrder: number;
  isActive: boolean;
  deletedAt: string | null;
}

export interface AdminAttribute {
  id: string;
  name: string;
  code: string;
  inputType: "SELECT" | "COLOR" | "TEXT";
  isActive: boolean;
  values: AdminAttributeValue[];
  deletedAt: string | null;
}

export interface ProductTypeAttributeAssignment {
  attributeId: string;
  isRequired: boolean;
  sortOrder: number;
  attribute: AdminAttribute;
}

export interface SaveCategoryInput {
  name: string;
  slug?: string;
  description: string | null;
  imageUrl: string | null;
  parentId: string | null;
  isActive: boolean;
  allowProducts: boolean;
  showOnHomepage: boolean;
  sortOrder: number;
}

export interface SaveBrandInput {
  name: string;
  slug?: string;
  logoUrl: string | null;
  description: string | null;
  isActive: boolean;
}

export interface SaveProductTypeInput {
  name: string;
  slug?: string;
  description: string | null;
  isActive: boolean;
}

export const adminCatalogApi = {
  getCategories: (includeDeleted = true) =>
    apiClient<{ categories: AdminCategory[] }>(
      `/admin/categories?includeDeleted=${includeDeleted}`,
      { method: "GET" },
    ).then(({ categories }) => categories),

  createCategory: (input: SaveCategoryInput) =>
    apiClient<{ category: AdminCategory }>("/admin/categories", {
      method: "POST",
      body: JSON.stringify(input),
    }).then(({ category }) => category),

  updateCategory: (id: string, input: Partial<SaveCategoryInput>) =>
    apiClient<{ category: AdminCategory }>(`/admin/categories/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }).then(({ category }) => category),

  deleteCategory: (id: string) =>
    apiClient<void>(`/admin/categories/${id}`, { method: "DELETE" }),

  restoreCategory: (id: string) =>
    apiClient<{ category: AdminCategory }>(`/admin/categories/${id}/restore`, {
      method: "POST",
    }).then(({ category }) => category),

  getCategoryProductTypes: (categoryId: string) =>
    apiClient<CategoryProductTypeAssignment>(`/admin/categories/${categoryId}/product-types`, {
      method: "GET",
    }),

  setCategoryProductTypes: (categoryId: string, productTypeIds: string[]) =>
    apiClient<CategoryProductTypeAssignment>(`/admin/categories/${categoryId}/product-types`, {
      method: "PUT",
      body: JSON.stringify({ productTypeIds }),
    }),

  getBrands: (includeDeleted = true) =>
    apiClient<{ brands: AdminBrand[] }>(
      `/admin/brands?includeDeleted=${includeDeleted}`,
      { method: "GET" },
    ).then(({ brands }) => brands),

  createBrand: (input: SaveBrandInput) =>
    apiClient<{ brand: AdminBrand }>("/admin/brands", {
      method: "POST",
      body: JSON.stringify(input),
    }).then(({ brand }) => brand),

  updateBrand: (id: string, input: Partial<SaveBrandInput>) =>
    apiClient<{ brand: AdminBrand }>(`/admin/brands/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }).then(({ brand }) => brand),

  deleteBrand: (id: string) =>
    apiClient<void>(`/admin/brands/${id}`, { method: "DELETE" }),

  restoreBrand: (id: string) =>
    apiClient<{ brand: AdminBrand }>(`/admin/brands/${id}/restore`, {
      method: "POST",
    }).then(({ brand }) => brand),

  getProductTypes: (includeDeleted = true) =>
    apiClient<{ productTypes: AdminProductType[] }>(
      `/admin/product-types?includeDeleted=${includeDeleted}`,
      { method: "GET" },
    ).then(({ productTypes }) => productTypes),

  createProductType: (input: SaveProductTypeInput) =>
    apiClient<{ productType: AdminProductType }>("/admin/product-types", {
      method: "POST",
      body: JSON.stringify(input),
    }).then(({ productType }) => productType),

  updateProductType: (id: string, input: Partial<SaveProductTypeInput>) =>
    apiClient<{ productType: AdminProductType }>(`/admin/product-types/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }).then(({ productType }) => productType),

  deleteProductType: (id: string) =>
    apiClient<void>(`/admin/product-types/${id}`, { method: "DELETE" }),

  restoreProductType: (id: string) =>
    apiClient<{ productType: AdminProductType }>(`/admin/product-types/${id}/restore`, {
      method: "POST",
    }).then(({ productType }) => productType),

  getAttributes: (includeDeleted = true) =>
    apiClient<{ attributes: AdminAttribute[] }>(
      `/admin/attributes?includeDeleted=${includeDeleted}`,
      { method: "GET" },
    ).then(({ attributes }) => attributes),

  createAttribute: (input: { name: string; values: string[]; code?: string; inputType?: AdminAttribute["inputType"]; isActive?: boolean }) =>
    apiClient<{ attribute: AdminAttribute }>("/admin/attributes", {
      method: "POST",
      body: JSON.stringify(input),
    }).then(({ attribute }) => attribute),

  updateAttribute: (id: string, input: Partial<{ name: string; code: string; inputType: AdminAttribute["inputType"]; isActive: boolean }>) =>
    apiClient<{ attribute: AdminAttribute }>(`/admin/attributes/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }).then(({ attribute }) => attribute),

  deleteAttribute: (id: string) =>
    apiClient<void>(`/admin/attributes/${id}`, { method: "DELETE" }),

  restoreAttribute: (id: string) =>
    apiClient<{ attribute: AdminAttribute }>(`/admin/attributes/${id}/restore`, { method: "POST" }).then(({ attribute }) => attribute),

  createAttributeValue: (attributeId: string, input: { label: string; code?: string; colorHex?: string | null; sortOrder?: number; isActive?: boolean }) =>
    apiClient<{ value: AdminAttributeValue }>(`/admin/attributes/${attributeId}/values`, {
      method: "POST",
      body: JSON.stringify(input),
    }).then(({ value }) => value),

  updateAttributeValue: (attributeId: string, valueId: string, input: Partial<{ label: string; code: string; colorHex: string | null; sortOrder: number; isActive: boolean }>) =>
    apiClient<{ value: AdminAttributeValue }>(`/admin/attributes/${attributeId}/values/${valueId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }).then(({ value }) => value),

  deleteAttributeValue: (attributeId: string, valueId: string) =>
    apiClient<void>(`/admin/attributes/${attributeId}/values/${valueId}`, { method: "DELETE" }),

  restoreAttributeValue: (attributeId: string, valueId: string) =>
    apiClient<{ value: AdminAttributeValue }>(`/admin/attributes/${attributeId}/values/${valueId}/restore`, { method: "POST" }).then(({ value }) => value),

  getProductTypeAttributes: (productTypeId: string) =>
    apiClient<{ attributes: ProductTypeAttributeAssignment[] }>(`/admin/product-types/${productTypeId}/attributes`, { method: "GET" }).then(({ attributes }) => attributes),

  setProductTypeAttributes: (productTypeId: string, attributes: Array<{ attributeId: string; isRequired: boolean; sortOrder: number }>) =>
    apiClient<{ attributes: ProductTypeAttributeAssignment[] }>(`/admin/product-types/${productTypeId}/attributes`, {
      method: "PUT",
      body: JSON.stringify({ attributes }),
    }).then(({ attributes: result }) => result),
};
````

### `web/src/api/products.ts`

Source lines: 172

````ts
import { apiClient } from "./client";

export type Money = string | number;

export interface ProductMedia {
  id: string;
  variantId: string | null;
  type: "IMAGE" | "VIDEO";
  url: string;
  thumbnailUrl: string | null;
  altText: string | null;
  sortOrder: number;
  isPrimary: boolean;
}

export interface ProductVariant {
  id: string;
  sku: string;
  barcode: string | null;
  name: string | null;
  color: string | null;
  size: string | null;
  price: Money;
  regularPrice?: Money;
  discountPrice?: Money | null;
  discountStartsAt?: string | null;
  discountEndsAt?: string | null;
  stockQuantity: number;
  inStock: boolean;
  weight: Money | null;
  lengthCm?: Money | null;
  widthCm?: Money | null;
  heightCm?: Money | null;
  isDefault: boolean;
  optionValues: ProductOptionValue[];
  costPrice?: Money | null;
  isActive?: boolean;
  lowStockLevel?: number;
  priceTiers?: ProductPriceTier[];
}

export interface ProductPriceTier {
  id: string;
  variantId: string | null;
  minimumQuantity: number;
  unitPrice: Money;
  isPromotion: boolean;
  isActive?: boolean;
}

export interface ProductOptionValue {
  id: string;
  label: string;
  code: string;
  colorHex: string | null;
  attribute: ProductOptionAttribute;
}

export interface ProductOptionAttribute {
  id: string;
  name: string;
  code: string;
  inputType: "SELECT" | "COLOR" | "TEXT";
}

export interface ProductOption {
  attribute: ProductOptionAttribute;
  values: Array<Omit<ProductOptionValue, "attribute">>;
}

export interface ProductTaxonomy {
  id: string;
  name: string;
  slug: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  description?: string;
  price: Money;
  regularPrice: Money;
  discountPrice: Money | null;
  discountStartsAt?: string | null;
  discountEndsAt?: string | null;
  isFeatured: boolean;
  category: ProductTaxonomy;
  productType: ProductTaxonomy;
  brand: ProductTaxonomy | null;
  stockQuantity: number;
  inStock: boolean;
  primaryImage: ProductMedia | null;
  variants?: ProductVariant[];
  options?: ProductOption[];
  media?: ProductMedia[];
  priceTiers?: ProductPriceTier[];
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedProducts {
  products: Product[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ProductSuggestion {
  id: string;
  name: string;
  slug: string;
  price: Money;
  regularPrice: Money;
  discountPrice: Money | null;
  category: ProductTaxonomy;
  brand: ProductTaxonomy | null;
  inStock: boolean;
  thumbnail: {
    url: string;
    altText: string | null;
  } | null;
}

export type ProductSort = "newest" | "price_asc" | "price_desc" | "name_asc";

export interface ProductListParams {
  search?: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sort?: ProductSort;
  page?: number;
  limit?: number;
}

export const productApi = {
  getProducts: (params: ProductListParams = {}, signal?: AbortSignal) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          query.append(key, String(value));
        }
      });
    }
    const queryString = query.toString();
    const url = `/products${queryString ? `?${queryString}` : ""}`;
    
    return apiClient<PaginatedProducts>(url, { method: "GET", signal });
  },

  getSearchSuggestions: (search: string, limit = 8, signal?: AbortSignal) => {
    const query = new URLSearchParams({ q: search.trim(), limit: String(limit) });
    return apiClient<{ suggestions: ProductSuggestion[] }>(
      `/products/search-suggestions?${query.toString()}`,
      { method: "GET", signal },
    ).then(({ suggestions }) => suggestions);
  },

  getProductBySlug: (slug: string) => {
    return apiClient<{ product: Product }>(`/products/${encodeURIComponent(slug)}`, {
      method: "GET",
    }).then(({ product }) => product);
  },
};
````

### `web/src/api/catalog.ts`

Source lines: 32

````ts
import { apiClient } from "./client";
import type { ProductTaxonomy } from "./products";

export interface CategoryOption extends ProductTaxonomy {
  parentId: string | null;
  description: string | null;
  imageUrl: string | null;
  displayImageUrl: string | null;
  productCount: number;
  sortOrder: number;
  allowProducts: boolean;
  showOnHomepage: boolean;
  children: CategoryOption[];
}

export interface BrandOption extends ProductTaxonomy {
  logoUrl: string | null;
}

export const catalogApi = {
  getCategories: (signal?: AbortSignal) =>
    apiClient<{ categories: CategoryOption[] }>("/categories", {
      method: "GET",
      signal,
    }).then(({ categories }) => categories),

  getBrands: (signal?: AbortSignal) =>
    apiClient<{ brands: BrandOption[] }>("/brands", {
      method: "GET",
      signal,
    }).then(({ brands }) => brands),
};
````

## Admin product list, search, add, and edit workflow

Contains the product table, product search, editor orchestration, option-path builder, SKU editor, CSV tools, offer settings, media scope, and quantity pricing.

### `web/src/pages/admin/AdminProductsPage.tsx`

Source lines: 2

````tsx
// Route compatibility: implementation lives with the admin-products feature.
export { AdminProductsPage } from "../../admin/products";
````

### `web/src/pages/admin/AdminProductEditorPage.tsx`

Source lines: 2

````tsx
// Compatibility export while admin pages are migrated feature by feature.
export { AdminProductEditorPage } from "../../admin/product-editor";
````

### `web/src/pages/dashboard/AdminPriceTierBuilder.tsx`

Source lines: 3

````tsx
// Compatibility exports for older imports during the incremental restructure.
export { QuantityPricingEditor as AdminPriceTierBuilder } from "../../admin/product-editor/components/VariantPreferencesSection/QuantityPricingEditor";
export type { PriceTierDraft } from "../../admin/product-editor/types/productEditor.types";
````

### `web/src/pages/dashboard/discountDraft.ts`

Source lines: 4

````ts
export {
  discountPercentageFromPrice,
  discountPriceFromPercentage,
} from "../../admin/product-editor/utils/productEditor.validation";
````

### `web/src/pages/dashboard/discountDraft.test.ts`

Source lines: 21

````ts
import { describe, expect, it } from "vitest";

import {
  discountPercentageFromPrice,
  discountPriceFromPercentage,
} from "./discountDraft";

describe("discount draft calculations", () => {
  it("calculates a final price from percentage off", () => {
    expect(discountPriceFromPercentage("1000", "30")).toBe("700.00");
  });

  it("calculates percentage off from a final price", () => {
    expect(discountPercentageFromPrice("1000", "700")).toBe("30");
  });

  it("rejects percentages outside zero to one hundred", () => {
    expect(discountPriceFromPercentage("1000", "101")).toBe("");
    expect(discountPercentageFromPrice("100", "120")).toBe("");
  });
});
````

### `web/src/pages/dashboard/variantCsv.ts`

Source lines: 1

````ts
export * from "../../admin/product-editor/utils/variantCsv";
````

### `web/src/pages/dashboard/variantCsv.test.ts`

Source lines: 143

````ts
import { describe, expect, it } from "vitest";

import { exportVariantsToCsv, parseVariantCsv } from "./variantCsv";

describe("variant CSV interchange", () => {
  it("exports stable columns and escapes commas, quotes, and newlines", () => {
    const csv = exportVariantsToCsv([{
      sku: "shirt-green-xl",
      barcode: '123,"456"',
      optionLabel: "Green, XL\nLimited Edition",
      optionValueIds: ["color-green", "size-xl"],
      price: "899.00",
      discountPrice: 799,
      costPrice: 500,
      stockQuantity: 30,
      lowStockLevel: 5,
      isActive: true,
      isDefault: false,
    }]);

    expect(csv.split("\r\n")[0]).toBe(
      "sku,barcode,option_label,option_value_ids,price,discount_price,cost_price,stock_quantity,low_stock_level,active,default",
    );
    expect(csv).toContain('"123,""456"""');
    expect(csv).toContain('"Green, XL\nLimited Edition"');
    expect(csv).toContain("color-green|size-xl");
    expect(csv).toContain(",true,false");
  });

  it("round-trips every supported field without importing the editor draft type", () => {
    const csv = exportVariantsToCsv([{
      sku: "TSHIRT-GRN-XXL-MESH",
      barcode: "8901234567890",
      optionLabel: "Green / XXL / Mesh",
      optionValueIds: ["11", "22", "33"],
      price: "899.50",
      discountPrice: "799",
      costPrice: "500",
      stockQuantity: "30",
      lowStockLevel: "4",
      isActive: true,
      isDefault: true,
    }]);

    expect(parseVariantCsv(csv)).toEqual({
      errors: [],
      records: [{
        sku: "TSHIRT-GRN-XXL-MESH",
        barcode: "8901234567890",
        optionLabel: "Green / XXL / Mesh",
        optionValueIds: ["11", "22", "33"],
        price: "899.50",
        discountPrice: "799",
        costPrice: "500",
        stockQuantity: "30",
        lowStockLevel: "4",
        isActive: true,
        isDefault: true,
      }],
    });
  });

  it("parses BOM, friendly headers, quoted line breaks, escaped quotes, and boolean aliases", () => {
    const csv = [
      '\uFEFFSKU,Barcode / GTIN,Variant Name,Option IDs,Selling Price,Stock,Active,Default Selection',
      'abc-1,,"Blue, XL\nSpecial ""Drop""","[""blue"",""xl""]",749.95,8,active,yes',
      "abc-2,,Plain,blue;large,500,0,0,no",
    ].join("\r\n");

    expect(parseVariantCsv(csv)).toEqual({
      errors: [],
      records: [
        {
          sku: "ABC-1",
          barcode: "",
          optionLabel: 'Blue, XL\nSpecial "Drop"',
          optionValueIds: ["blue", "xl"],
          price: "749.95",
          stockQuantity: "8",
          isActive: true,
          isDefault: true,
        },
        {
          sku: "ABC-2",
          barcode: "",
          optionLabel: "Plain",
          optionValueIds: ["blue", "large"],
          price: "500",
          stockQuantity: "0",
          isActive: false,
          isDefault: false,
        },
      ],
    });
  });

  it("keeps valid rows and reports unsafe numeric, boolean, duplicate, and missing SKU rows", () => {
    const csv = [
      "sku,price,stock_quantity,low_stock_level,active,default",
      "GOOD-1,100.25,5,2,true,false",
      "BAD-NUMBER,-4,1,2,true,false",
      "BAD-INTEGER,100,1.5,2,true,false",
      "BAD-BOOLEAN,100,1,2,maybe,false",
      "GOOD-1,100,1,2,true,false",
      ",100,1,2,true,false",
    ].join("\n");

    const result = parseVariantCsv(csv);

    expect(result.records).toEqual([{
      sku: "GOOD-1",
      price: "100.25",
      stockQuantity: "5",
      lowStockLevel: "2",
      isActive: true,
      isDefault: false,
    }]);
    expect(result.errors.map((error) => [error.row, error.field])).toEqual([
      [3, "price"],
      [4, "stockQuantity"],
      [5, "isActive"],
      [6, "sku"],
      [7, "sku"],
    ]);
  });

  it("rejects malformed CSV and missing or duplicate required headers", () => {
    expect(parseVariantCsv('sku,price\n"OPEN,10')).toEqual({
      records: [],
      errors: [{ row: 1, field: "csv", message: "The CSV ends inside a quoted field." }],
    });

    expect(parseVariantCsv("price,active\n10,true").errors[0]).toMatchObject({
      row: 1,
      field: "sku",
    });

    expect(parseVariantCsv("sku,SKU,price\nA,A,10").errors[0]).toMatchObject({
      row: 1,
      field: "sku",
    });
  });
});
````

### `web/src/pages/dashboard/variantPaths.ts`

Source lines: 1

````ts
export * from "../../admin/product-editor/utils/variantPaths";
````

### `web/src/pages/dashboard/variantPaths.test.ts`

Source lines: 115

````ts
import { describe, expect, it } from "vitest";

import type { ProductTypeAttributeAssignment } from "../../api/adminCatalog";
import {
  SKIP_OPTION_VALUE,
  analyzeVariantPathRemoval,
  buildVariantPathTree,
  changeVariantPathSelection,
  clearDeepestVariantPathChoice,
  selectedVariantPathIds,
} from "./variantPaths";

const assignments = [
  {
    attributeId: "color",
    isRequired: true,
    sortOrder: 0,
    attribute: {
      id: "color",
      name: "Color",
      code: "color",
      inputType: "COLOR",
      isActive: true,
      deletedAt: null,
      values: [
        { id: "black", attributeId: "color", label: "Black", code: "black", colorHex: "#000000", sortOrder: 0, isActive: true, deletedAt: null },
        { id: "green", attributeId: "color", label: "Green", code: "green", colorHex: "#008000", sortOrder: 1, isActive: true, deletedAt: null },
      ],
    },
  },
  {
    attributeId: "size",
    isRequired: true,
    sortOrder: 1,
    attribute: {
      id: "size",
      name: "Size",
      code: "size",
      inputType: "SELECT",
      isActive: true,
      deletedAt: null,
      values: [
        { id: "xl", attributeId: "size", label: "XL", code: "xl", colorHex: null, sortOrder: 0, isActive: true, deletedAt: null },
        { id: "m", attributeId: "size", label: "M", code: "m", colorHex: null, sortOrder: 1, isActive: true, deletedAt: null },
      ],
    },
  },
  {
    attributeId: "material",
    isRequired: false,
    sortOrder: 2,
    attribute: {
      id: "material",
      name: "Material",
      code: "material",
      inputType: "SELECT",
      isActive: true,
      deletedAt: null,
      values: [
        { id: "cotton", attributeId: "material", label: "Cotton", code: "cotton", colorHex: null, sortOrder: 0, isActive: true, deletedAt: null },
      ],
    },
  },
] satisfies ProductTypeAttributeAssignment[];

describe("product-specific variant paths", () => {
  it("clears child choices when a parent changes", () => {
    expect(changeVariantPathSelection(
      assignments,
      { color: "black", size: "xl", material: "cotton" },
      "color",
      "green",
    )).toEqual({ color: "green" });
  });

  it("keeps only real option values and supports an explicit optional skip", () => {
    expect(selectedVariantPathIds(assignments, {
      color: "green",
      size: "m",
      material: SKIP_OPTION_VALUE,
    })).toEqual(["green", "m"]);
  });

  it("keeps the parent prefix ready for a sibling leaf", () => {
    expect(clearDeepestVariantPathChoice(assignments, {
      color: "black",
      size: "xl",
      material: "cotton",
    })).toEqual({ color: "black", size: "xl" });
  });

  it("builds a sparse tree without inventing Cartesian combinations", () => {
    const tree = buildVariantPathTree(assignments, [
      { key: "sku-1", optionValueIds: ["black", "xl", "cotton"] },
      { key: "sku-optional-material", optionValueIds: ["black", "xl"] },
      { key: "sku-2", optionValueIds: ["green", "m"] },
    ]);

    expect(tree.map((node) => node.label)).toEqual(["Black", "Green"]);
    expect(tree[0]?.children[0]?.children[0]?.variantKeys).toEqual(["sku-1"]);
    expect(tree[0]?.children[0]?.terminalVariantKeys).toEqual(["sku-optional-material"]);
    expect(tree[1]?.children[0]?.variantKeys).toEqual(["sku-2"]);
  });

  it("reports every affected SKU and blocks a branch containing stock", () => {
    const result = analyzeVariantPathRemoval(["sku-1", "sku-2"], [
      { key: "sku-1", optionValueIds: ["black", "xl"], stockQuantity: "0" },
      { key: "sku-2", optionValueIds: ["black", "m"], stockQuantity: "4" },
      { key: "sku-3", optionValueIds: ["green", "m"], stockQuantity: "0" },
    ]);

    expect(result.affected.map((variant) => variant.key)).toEqual(["sku-1", "sku-2"]);
    expect(result.stocked.map((variant) => variant.key)).toEqual(["sku-2"]);
  });
});
````

### `web/src/admin/product-editor/AdminProductEditorPage.module.css`

Source lines: 4

````css
.page,
.form {
  min-width: 0;
}
````

### `web/src/admin/product-editor/AdminProductEditorPage.tsx`

Source lines: 54

````tsx
import { AlertCircle, CheckCircle } from "lucide-react";

import { AdditionalProductDetails } from "./components/AdditionalProductDetails/AdditionalProductDetails";
import { ProductEditorHeader } from "./components/ProductEditorHeader/ProductEditorHeader";
import { ProductGeneralSection } from "./components/ProductGeneralSection/ProductGeneralSection";
import { SelectedSkuEditor } from "./components/SelectedSkuEditor/SelectedSkuEditor";
import { VariantCombinationsTable } from "./components/VariantCombinationsTable/VariantCombinationsTable";
import { VariantOptionsSection } from "./components/VariantOptionsSection/VariantOptionsSection";
import { VariantPreferencesSection } from "./components/VariantPreferencesSection/VariantPreferencesSection";
import { useProductEditor } from "./hooks/useProductEditor";
import styles from "./AdminProductEditorPage.module.css";

/**
 * Add and Edit share this thin page coordinator.
 *
 * This file controls section order only. State lives in hooks, save rules live in
 * utils, and each visible section owns its JSX/CSS so future changes stay local.
 */
export const AdminProductEditorPage = () => {
  const editor = useProductEditor();
  const builder = editor.variantBuilder;

  if (editor.loading) {
    return <div className="admin-page-loading">Loading product editor...</div>;
  }

  return (
    <div className={`${styles.page} dashboard-container admin-catalog admin-page admin-product-editor-page`}>
      <ProductEditorHeader editor={editor} />

      {editor.error && <div className="alert alert-error"><AlertCircle size={18} />{editor.error}</div>}
      {editor.success && <div className="alert alert-success"><CheckCircle size={18} />{editor.success}</div>}

      <form id="product-editor-form" className={`${styles.form} product-editor-form`} onSubmit={editor.handleSaveProduct}>
        <ProductGeneralSection editor={editor} />

        <section className="admin-variant-builder admin-field-wide" aria-label="Product options and variants">
          <div className="variant-config-grid">
            <VariantOptionsSection builder={builder} />
            <aside className="variant-settings-panel" aria-label="Variant preferences">
              <VariantPreferencesSection editor={editor} />
            </aside>
          </div>

          {builder.error && <p className="admin-variant-error" role="alert">{builder.error}</p>}
          <SelectedSkuEditor builder={builder} />
          <VariantCombinationsTable builder={builder} />
        </section>

        <AdditionalProductDetails editor={editor} />
      </form>
    </div>
  );
};
````

### `web/src/admin/product-editor/components/AdditionalProductDetails/AdditionalProductDetails.module.css`

Source lines: 16

````css
.root {
  min-width: 0;
}

.descriptions {
  display: grid;
  grid-template-columns: minmax(14rem, 0.8fr) minmax(20rem, 1.7fr);
  gap: 0.75rem 0.9rem;
  margin-bottom: 1rem;
}

@media (max-width: 760px) {
  .descriptions {
    grid-template-columns: 1fr;
  }
}
````

### `web/src/admin/product-editor/components/AdditionalProductDetails/AdditionalProductDetails.tsx`

Source lines: 63

````tsx
import type { ProductEditorController } from "../../hooks/useProductEditor";
import type { ProductFormState } from "../../types/productEditor.types";
import styles from "./AdditionalProductDetails.module.css";
import { ProductMediaLibrary } from "./ProductMediaLibrary";

interface Props {
  editor: ProductEditorController;
}

/** Storefront copy, publication defaults, feature flag, and shared media. */
export const AdditionalProductDetails = ({ editor }: Props) => (
  <details className={`${styles.root} product-editor-panel product-details-panel`} open>
    <summary>Additional Product Details</summary>

    <div className={styles.descriptions}>
      <div className="form-group">
        <label htmlFor="short-description">Short description</label>
        <textarea
          id="short-description"
          className="form-input admin-textarea product-short-description"
          value={editor.form.shortDescription}
          onChange={(event) => editor.setField("shortDescription", event.target.value)}
          maxLength={500}
          placeholder="A short note shown near the product title"
        />
        <small className="admin-field-help">A quick customer-facing summary, up to 500 characters.</small>
      </div>
      <div className="form-group">
        <label htmlFor="description">Full description</label>
        <textarea
          id="description"
          className="form-input admin-textarea"
          value={editor.form.description}
          onChange={(event) => editor.setField("description", event.target.value)}
          placeholder="Describe the product, materials, features and care information"
        />
      </div>
    </div>

    <div className="product-details-grid">
      <div className="form-group">
        <label htmlFor="product-status">Default save status</label>
        <select
          id="product-status"
          className="form-input"
          value={editor.form.status}
          onChange={(event) => editor.setField("status", event.target.value as ProductFormState["status"])}
        >
          <option value="ACTIVE">Active</option>
          <option value="DRAFT">Draft</option>
          <option value="INACTIVE">Inactive</option>
          <option value="DISCONTINUED">Discontinued</option>
        </select>
      </div>
      <label className="admin-checkbox">
        <input type="checkbox" checked={editor.form.isFeatured} onChange={(event) => editor.setField("isFeatured", event.target.checked)} />
        Feature this product on the storefront
      </label>
    </div>

    <ProductMediaLibrary editor={editor} />
  </details>
);
````

### `web/src/admin/product-editor/components/AdditionalProductDetails/ProductMediaLibrary.tsx`

Source lines: 97

````tsx
import { ImagePlus, Star, Trash2, X } from "lucide-react";

import type { ProductEditorController } from "../../hooks/useProductEditor";

interface Props {
  editor: ProductEditorController;
}

/**
 * Shows saved media and the local upload queue.
 * Saved media changes immediately in edit mode; pending files upload during save
 * after product and SKU database IDs are available.
 */
export const ProductMediaLibrary = ({ editor }: Props) => (
  <div className="product-media-library">
    <div className="variant-workbench-heading">
      <div>
        <h3>Product media library</h3>
        <p>{editor.mediaScope === "all"
          ? "New uploads are shared by all variants."
          : "Add SKU media from the Selected Variant panel; shared media remains available as fallback."}</p>
      </div>
    </div>

    {editor.media.length > 0 && (
      <div className="admin-media-grid">
        {editor.media.map((item) => (
          <article className="admin-media-card" key={item.id}>
            <div className="admin-media-image">
              {item.type === "VIDEO"
                ? <video src={item.url} controls muted playsInline preload="metadata" />
                : <img src={item.thumbnailUrl || item.url} alt={item.altText || editor.form.name} />}
              {item.isPrimary && <span className="admin-primary-badge"><Star size={13} /> Primary</span>}
            </div>
            <div className="admin-media-actions">
              {editor.editingProductId && (
                <select
                  className="form-input"
                  aria-label={`Assign ${item.altText || "media"} to a variant`}
                  value={item.variantId ?? ""}
                  disabled={editor.mediaBusyId === item.id}
                  onChange={(event) => void editor.assignMediaToVariant(item.id, event.target.value)}
                >
                  <option value="">All variants</option>
                  {editor.variantDrafts.filter((variant) => variant.id).map((variant) => (
                    <option key={variant.id} value={variant.id}>{variant.optionLabel || variant.sku}</option>
                  ))}
                </select>
              )}
              {item.type === "IMAGE" && !item.isPrimary && (
                <button type="button" onClick={() => void editor.setPrimaryImage(item.id)} disabled={editor.mediaBusyId === item.id}><Star size={16} /> Primary</button>
              )}
              <button className="media-delete-button" type="button" onClick={() => void editor.deleteImage(item.id)} disabled={editor.mediaBusyId === item.id}><Trash2 size={16} /> Delete</button>
            </div>
          </article>
        ))}
      </div>
    )}

    {editor.pendingMedia.length > 0 && (
      <div className="pending-image-list">
        {editor.pendingMedia.map((item) => (
          <div key={item.key}>
            <span>{item.file.name}</span>
            {editor.mediaScope === "all" ? <small>All variants</small> : (
              <select
                className="form-input"
                aria-label={`Assign ${item.file.name} to a variant`}
                value={item.variantKey}
                onChange={(event) => editor.movePendingMedia(item.key, event.target.value)}
              >
                <option value="all">Shared fallback</option>
                {editor.variantDrafts.map((variant) => (
                  <option key={variant.key} value={variant.key}>{variant.optionLabel || variant.sku || "Default"}</option>
                ))}
              </select>
            )}
            <button type="button" aria-label={`Remove ${item.file.name}`} onClick={() => editor.setPendingMedia((current) => current.filter((entry) => entry.key !== item.key))}><X size={15} /></button>
          </div>
        ))}
      </div>
    )}

    {editor.mediaScope === "all" && editor.mediaCountForScope("all") < 4 ? (
      <label className="admin-image-picker">
        <ImagePlus size={22} />
        <span>Add shared media</span>
        <small>JPEG, PNG, WebP up to 2 MB · MP4, WebM up to 20 MB · 4 shared items</small>
        <input type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" multiple onChange={editor.handleImageSelection} />
      </label>
    ) : editor.mediaScope === "all" ? (
      <p className="admin-media-limit">The four-item shared media limit has been reached.</p>
    ) : (
      <p className="admin-media-limit">Individual SKU uploads are available in the Selected Variant panel.</p>
    )}
  </div>
);
````

### `web/src/admin/product-editor/components/ProductEditorHeader/ProductEditorHeader.module.css`

Source lines: 3

````css
.root {
  min-width: 0;
}
````

### `web/src/admin/product-editor/components/ProductEditorHeader/ProductEditorHeader.tsx`

Source lines: 59

````tsx
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

import type { ProductEditorController } from "../../hooks/useProductEditor";
import styles from "./ProductEditorHeader.module.css";

interface Props {
  editor: ProductEditorController;
}

/**
 * Page identity and save actions.
 * Buttons target the form by ID so the header can remain outside the form while
 * still using the browser's normal validation and submit event.
 */
export const ProductEditorHeader = ({ editor }: Props) => {
  const disabled = editor.submitting || editor.productTypes.length === 0;

  return (
    <header className={`${styles.root} product-editor-header`}>
      <div>
        <div className="product-editor-breadcrumb">
          <Link to="/admin/products">Products</Link>
          <span>/</span>
          <span>{editor.editingProductId ? "Edit Product" : "Add Product"}</span>
        </div>
        <h1>{editor.editingProductId ? "Edit Product" : "Add New Product"}</h1>
      </div>

      <div className="product-editor-actions">
        <button type="button" className="btn btn-ghost" onClick={editor.closeEditor}>
          <ArrowLeft size={16} /> Cancel
        </button>
        <button
          form="product-editor-form"
          type="submit"
          data-status="DRAFT"
          className="btn btn-ghost"
          disabled={disabled}
        >
          Save Draft
        </button>
        <button
          form="product-editor-form"
          type="submit"
          data-status="ACTIVE"
          className="btn btn-primary"
          disabled={disabled}
        >
          {editor.submitting
            ? "Saving..."
            : editor.editingProductId
              ? "Save & Publish"
              : "Publish Product"}
        </button>
      </div>
    </header>
  );
};
````

### `web/src/admin/product-editor/components/ProductGeneralSection/ProductGeneralSection.module.css`

Source lines: 3

````css
.root {
  min-width: 0;
}
````

### `web/src/admin/product-editor/components/ProductGeneralSection/ProductGeneralSection.tsx`

Source lines: 123

````tsx
import { Link } from "react-router-dom";

import type { ProductEditorController } from "../../hooks/useProductEditor";
import styles from "./ProductGeneralSection.module.css";

interface Props {
  editor: ProductEditorController;
}

/**
 * Product identity and catalog relationships only.
 * Category limits the visible product types; brand remains global and optional.
 */
export const ProductGeneralSection = ({ editor }: Props) => {
  const {
    allowedProductTypeIds,
    brands,
    categories,
    editingProductId,
    form,
    originalVariantIds,
    productTypes,
    setField,
    setForm,
  } = editor;

  return (
    <section className={`${styles.root} product-editor-panel product-summary-panel`}>
      <div className="product-summary-grid">
        <div className="form-group">
          <label htmlFor="product-name">Product name <span>*</span></label>
          <input
            id="product-name"
            className="form-input"
            value={form.name}
            placeholder="Enter product name"
            onChange={(event) => setField("name", event.target.value)}
            required
            minLength={2}
            maxLength={200}
          />
        </div>

        <div className="form-group">
          <div className="admin-field-label-row">
            <label htmlFor="product-category">Category <span>*</span></label>
            <Link to="/admin/categories">+ New</Link>
          </div>
          <select
            id="product-category"
            className="form-input"
            value={form.categoryId}
            onChange={(event) => {
              const nextCategoryId = event.target.value;
              setForm((current) => ({
                ...current,
                categoryId: nextCategoryId,
                productTypeId: editingProductId && originalVariantIds.length > 0
                  ? current.productTypeId
                  : "",
              }));
            }}
            required
          >
            <option value="">Select category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.displayName}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <div className="admin-field-label-row">
            <label htmlFor="product-type">Product type <span>*</span></label>
            <Link to="/admin/categories">Manage category types</Link>
          </div>
          <select
            id="product-type"
            className="form-input"
            value={form.productTypeId}
            onChange={(event) => setField("productTypeId", event.target.value)}
            disabled={Boolean(editingProductId && originalVariantIds.length)}
            required
          >
            <option value="">Select product type</option>
            {productTypes
              .filter((type) => allowedProductTypeIds.includes(type.id))
              .map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
          </select>
          {editingProductId && originalVariantIds.length > 0 && (
            <small className="admin-field-help">
              Locked because saved variants use this type&apos;s attributes.
            </small>
          )}
          {form.categoryId && allowedProductTypeIds.length === 0 && (
            <small className="admin-field-help admin-field-help-error">
              Assign at least one product type to this category before saving a product.
            </small>
          )}
        </div>

        <div className="form-group">
          <div className="admin-field-label-row">
            <label htmlFor="product-brand">Brand</label>
            <Link to="/admin/brands">+ New brand</Link>
          </div>
          <select
            id="product-brand"
            className="form-input"
            value={form.brandId}
            onChange={(event) => setField("brandId", event.target.value)}
          >
            <option value="">No brand</option>
            {brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
          </select>
          <small className="admin-field-help">
            Brands are global and optional; they do not depend on category or product type.
          </small>
        </div>
      </div>
    </section>
  );
};
````

### `web/src/admin/product-editor/components/SelectedSkuEditor/SelectedSkuEditor.module.css`

Source lines: 3

````css
.root {
  min-width: 0;
}
````

### `web/src/admin/product-editor/components/SelectedSkuEditor/SelectedSkuEditor.tsx`

Source lines: 105

````tsx
import { ImagePlus, Package, Star, Trash2 } from "lucide-react";

import type { VariantOptionsController } from "../../hooks/useProductCatalogOptions";
import { discountPriceFromPercentage } from "../../utils/productEditor.validation";
import styles from "./SelectedSkuEditor.module.css";

interface Props {
  builder: VariantOptionsController;
}

/** Edit one focused SKU in detail while the complete table stays compact. */
export const SelectedSkuEditor = ({ builder }: Props) => {
  const variant = builder.focusedVariant;
  if (!variant) return null;

  return (
    <section className={`${styles.root} selected-variant-card`} aria-label={`Selected variant ${variant.optionLabel || variant.sku}`}>
      <div className="selected-variant-heading">
        <div><span>Selected SKU</span><h3>{variant.optionLabel || "Default"}</h3></div>
        <span className={`variant-status-pill${variant.isActive ? " is-active" : ""}`}>
          {variant.isActive ? "Active" : "Inactive"}
        </span>
      </div>

      <div className="selected-variant-grid">
        <div className="selected-variant-media">
          <div className="selected-variant-preview">
            {builder.focusedPreviewMedia
              ? <img src={builder.focusedPreviewMedia.thumbnailUrl || builder.focusedPreviewMedia.url} alt={variant.optionLabel || variant.sku} />
              : <Package size={34} />}
          </div>
          <label className={`btn btn-ghost variant-media-button${builder.focusedMediaLimitReached || !builder.variantMediaEnabled ? " is-disabled" : ""}`}>
            <ImagePlus size={15} /> Add media
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
              multiple
              disabled={builder.focusedMediaLimitReached || !builder.variantMediaEnabled}
              onChange={(event) => {
                const files = Array.from(event.target.files ?? []);
                event.target.value = "";
                if (files.length) builder.onAddMedia(variant.key, files);
              }}
            />
          </label>
          {!builder.variantMediaEnabled && <small className="variant-media-scope-note">Media is set to All variants. Choose Individual SKU in Variant Preferences to upload here.</small>}
        </div>

        <label>SKU <span>*</span><input className="form-input" value={variant.sku} required maxLength={100} onChange={(event) => builder.update(variant.key, { sku: event.target.value.toUpperCase() })} /></label>
        <label>Barcode / GTIN<input className="form-input" value={variant.barcode} maxLength={100} placeholder="Enter barcode" onChange={(event) => builder.update(variant.key, { barcode: event.target.value })} /></label>
        <label>Selling price <span>*</span><input className="form-input" type="number" min="0" step="0.01" value={variant.price} required onChange={(event) => builder.update(variant.key, { price: event.target.value })} /></label>
        <label>Cost price<input className="form-input" type="number" min="0" step="0.01" value={variant.costPrice} onChange={(event) => builder.update(variant.key, { costPrice: event.target.value })} /></label>
        <label>Discount price<input className="form-input" type="number" min="0" step="0.01" value={variant.discountPrice} onChange={(event) => builder.update(variant.key, { discountPrice: event.target.value })} /></label>
        <label>Discount % off
          <input
            className="form-input"
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={builder.focusedDiscountPercentage}
            placeholder="e.g. 30"
            onChange={(event) => builder.update(variant.key, {
              discountPrice: discountPriceFromPercentage(variant.price, event.target.value),
            })}
          />
        </label>
        <label>Stock quantity <span>*</span><input className="form-input" type="number" min="0" step="1" value={variant.stockQuantity} required onChange={(event) => builder.update(variant.key, { stockQuantity: event.target.value })} /></label>
        <label>Low-stock warning<input className="form-input" type="number" min="0" step="1" value={variant.lowStockLevel} onChange={(event) => builder.update(variant.key, { lowStockLevel: event.target.value })} /></label>
        <label>Status
          <select className="form-input" value={variant.isActive ? "active" : "inactive"} onChange={(event) => builder.update(variant.key, { isActive: event.target.value === "active" })}>
            <option value="active">Active</option><option value="inactive">Inactive</option>
          </select>
        </label>
        <fieldset className="variant-default-choice">
          <legend>Default selection</legend>
          <label><input type="radio" name="selected-default-variant" checked={variant.isDefault} onChange={() => builder.update(variant.key, { isDefault: true })} /> Yes</label>
          <label><input type="radio" name="selected-default-variant" checked={!variant.isDefault} readOnly /> No</label>
        </fieldset>

        {variant.discountPrice && (
          <fieldset className="variant-discount-schedule">
            <legend>Individual offer schedule</legend>
            <label>Starts<input className="form-input" type="datetime-local" value={variant.discountStartsAt} onChange={(event) => builder.update(variant.key, { discountStartsAt: event.target.value })} /></label>
            <label>Ends<input className="form-input" type="datetime-local" value={variant.discountEndsAt} onChange={(event) => builder.update(variant.key, { discountEndsAt: event.target.value })} /></label>
          </fieldset>
        )}
      </div>

      {(builder.focusedMedia.length > 0 || builder.focusedPendingMedia.length > 0) && (
        <div className="selected-variant-media-list">
          {builder.focusedMedia.map((item) => (
            <div key={item.id}>
              {item.type === "IMAGE" ? <img src={item.thumbnailUrl || item.url} alt={item.altText || variant.optionLabel} /> : <video src={item.url} muted preload="metadata" />}
              <span>{item.variantId ? "This variant" : "Shared"}</span>
              {item.type === "IMAGE" && !item.isPrimary && <button type="button" disabled={builder.mediaBusyId === item.id} onClick={() => builder.onSetPrimaryMedia(item.id)} aria-label="Set media as primary"><Star size={14} /></button>}
              {item.variantId && <button type="button" disabled={builder.mediaBusyId === item.id} onClick={() => builder.onDeleteMedia(item.id)} aria-label="Delete variant media"><Trash2 size={14} /></button>}
            </div>
          ))}
          {builder.focusedPendingMedia.map((item) => <div key={item.key} className="is-pending"><Package size={22} /><span>{item.file.name}</span></div>)}
        </div>
      )}
    </section>
  );
};
````

### `web/src/admin/product-editor/components/VariantCombinationsTable/VariantCombinationsTable.module.css`

Source lines: 3

````css
.root {
  min-width: 0;
}
````

### `web/src/admin/product-editor/components/VariantCombinationsTable/VariantCombinationsTable.tsx`

Source lines: 110

````tsx
import { Download, Pencil, SlidersHorizontal, Trash2, Upload } from "lucide-react";

import type { VariantOptionsController } from "../../hooks/useProductCatalogOptions";
import type { BulkField } from "../../types/productEditor.types";
import styles from "./VariantCombinationsTable.module.css";

interface Props {
  builder: VariantOptionsController;
}

/** Summary, selection, bulk edit, CSV, default selection, and safe removal for all SKUs. */
export const VariantCombinationsTable = ({ builder }: Props) => {
  if (builder.variants.length === 0) return null;

  return (
    <section className={`${styles.root} variant-table-panel`} aria-label="All variant combinations">
      <div className="variant-table-toolbar">
        <div><h3>All Variant Combinations ({builder.variants.length})</h3><span>Select a row to edit it above.</span></div>
        <div className="variant-table-actions">
          <button type="button" className="btn btn-ghost" onClick={() => builder.setBulkOpen((open) => !open)}><SlidersHorizontal size={15} /> Bulk edit</button>
          <button type="button" className="btn btn-ghost" onClick={() => builder.csvInputRef.current?.click()}><Upload size={15} /> Import CSV</button>
          <button type="button" className="btn btn-ghost" onClick={builder.onExportCsv}><Download size={15} /> Export CSV</button>
          <input
            ref={builder.csvInputRef}
            className="sr-only"
            type="file"
            accept=".csv,text/csv"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) void builder.onImportCsv(file);
            }}
          />
        </div>
      </div>

      {builder.bulkOpen && (
        <div className="variant-bulk-panel" aria-label="Bulk edit selected variants">
          <div><strong>Bulk edit</strong><span>{builder.selectedRows.length} of {builder.variants.length} selected</span></div>
          <select
            className="form-input"
            value={builder.bulkField}
            onChange={(event) => {
              builder.setBulkField(event.target.value as BulkField);
              builder.setBulkValue("");
            }}
          >
            <option value="price">Selling price</option>
            <option value="discountPrice">Discount price</option>
            <option value="costPrice">Cost price</option>
            <option value="stockQuantity">Stock quantity</option>
            <option value="lowStockLevel">Low-stock warning</option>
            <option value="isActive">Active status</option>
          </select>
          {builder.bulkField === "isActive" ? (
            <select className="form-input" value={builder.bulkValue} onChange={(event) => builder.setBulkValue(event.target.value)}>
              <option value="">Choose status</option><option value="true">Active</option><option value="false">Inactive</option>
            </select>
          ) : (
            <input className="form-input" type="number" min="0" step={builder.bulkField === "stockQuantity" || builder.bulkField === "lowStockLevel" ? "1" : "0.01"} value={builder.bulkValue} placeholder="Value" onChange={(event) => builder.setBulkValue(event.target.value)} />
          )}
          <button type="button" className="btn btn-primary" onClick={builder.applyBulkValue}>Apply to selected</button>
        </div>
      )}

      <div className="variant-summary-scroll">
        <table className="variant-summary-table">
          <thead><tr>
            <th><input type="checkbox" aria-label="Select all variants" checked={builder.selectedRows.length === builder.variants.length} onChange={builder.toggleAllRows} /></th>
            <th>Variant</th>
            {builder.assignments.map((assignment) => <th key={assignment.attributeId}>{assignment.attribute.name}</th>)}
            <th>SKU</th><th>Selling price</th><th>Cost</th><th>Discount</th><th>Stock</th><th>Status</th><th>Default</th><th>Actions</th>
          </tr></thead>
          <tbody>{builder.variants.map((variant) => (
            <tr key={variant.key} className={variant.key === builder.focusedVariantKey ? "is-selected" : ""} onClick={() => builder.setFocusedVariantKey(variant.key)}>
              <td onClick={(event) => event.stopPropagation()}><input type="checkbox" aria-label={`Select ${variant.optionLabel || variant.sku}`} checked={builder.selectedRows.includes(variant.key)} onChange={() => builder.toggleRow(variant.key)} /></td>
              <td><strong>{variant.optionLabel || "Default"}</strong>{variant.id ? <small>Saved</small> : <small>New</small>}</td>
              {builder.assignments.map((assignment) => {
                const value = builder.valueForAssignment(variant, assignment);
                return <td key={assignment.attributeId}>{value?.colorHex && <i className="variant-color-dot" style={{ backgroundColor: value.colorHex }} />}{value?.label ?? "—"}</td>;
              })}
              <td className="variant-sku-cell">{variant.sku || "—"}</td>
              <td>৳ {variant.price || "0"}</td>
              <td>{variant.costPrice ? `৳ ${variant.costPrice}` : "—"}</td>
              <td>{variant.discountPrice ? `৳ ${variant.discountPrice}` : "—"}</td>
              <td>{variant.stockQuantity}</td>
              <td><span className={`variant-status-dot${variant.isActive ? " is-active" : ""}`} />{variant.isActive ? "Active" : "Inactive"}</td>
              <td><input type="radio" name="variant-default-table" aria-label={`Make ${variant.optionLabel || variant.sku} default`} checked={variant.isDefault} onClick={(event) => event.stopPropagation()} onChange={() => builder.update(variant.key, { isDefault: true })} /></td>
              <td className="variant-row-actions" onClick={(event) => event.stopPropagation()}>
                <button type="button" onClick={() => builder.setFocusedVariantKey(variant.key)} aria-label={`Edit ${variant.optionLabel || variant.sku}`}><Pencil size={14} /></button>
                <button type="button" onClick={() => builder.remove(variant.key)} aria-label={`Remove ${variant.optionLabel || "variant"}`}><Trash2 size={14} /></button>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>

      <div className="variant-mobile-list">
        {builder.variants.map((variant) => (
          <article key={variant.key} className={`variant-mobile-card${variant.key === builder.focusedVariantKey ? " is-selected" : ""}`} onClick={() => builder.setFocusedVariantKey(variant.key)}>
            <div><strong>{variant.optionLabel || "Default"}</strong><span>{variant.sku || "SKU required"}</span></div>
            <dl><div><dt>Price</dt><dd>৳ {variant.price || "0"}</dd></div><div><dt>Stock</dt><dd>{variant.stockQuantity}</dd></div><div><dt>Status</dt><dd>{variant.isActive ? "Active" : "Inactive"}</dd></div></dl>
            <button type="button" onClick={(event) => { event.stopPropagation(); builder.remove(variant.key); }} aria-label={`Remove ${variant.optionLabel || "variant"}`}><Trash2 size={15} /></button>
          </article>
        ))}
      </div>
      <p className="variant-table-note">Saved variants keep their database ID. Set stock to zero before removing a saved combination.</p>
    </section>
  );
};
````

### `web/src/admin/product-editor/components/VariantOptionsSection/VariantOptionsSection.module.css`

Source lines: 3

````css
.root {
  min-width: 0;
}
````

### `web/src/admin/product-editor/components/VariantOptionsSection/VariantOptionsSection.tsx`

Source lines: 175

````tsx
import { GitBranch, Layers3, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

import type { VariantOptionsController } from "../../hooks/useProductCatalogOptions";
import { SKIP_OPTION_VALUE, type VariantPathNode } from "../../utils/variantPaths";
import styles from "./VariantOptionsSection.module.css";

interface Props {
  builder: VariantOptionsController;
}

/**
 * Builds explicit parent-child paths for this product only.
 * Example: Black -> XL -> Cotton can exist without forcing Green -> XL -> Cotton.
 */
export const VariantOptionsSection = ({ builder }: Props) => {
  const renderPathTree = (nodes: VariantPathNode[], depth = 0): React.ReactNode => (
    <ul className={`variant-path-tree-level depth-${depth}`}>
      {nodes.map((node) => {
        const leafVariantKey = node.terminalVariantKeys[0] ?? null;
        return (
          <li key={`${node.attributeId}-${node.valueId}`}>
            <div className="variant-path-tree-node">
              <button
                type="button"
                className={`variant-path-node-select${leafVariantKey === builder.focusedVariantKey ? " is-selected" : ""}`}
                onClick={() => leafVariantKey && builder.setFocusedVariantKey(leafVariantKey)}
                disabled={!leafVariantKey}
              >
                <small>{node.attributeName}</small>
                <span>{node.colorHex && <i style={{ backgroundColor: node.colorHex }} />}{node.label}</span>
                {leafVariantKey && <em>SKU</em>}
              </button>
              <button
                type="button"
                className="variant-path-branch-remove"
                onClick={() => builder.removePathBranch(node)}
                aria-label={`Remove ${node.label} branch affecting ${node.variantKeys.length} SKU paths`}
                title={`Remove ${node.variantKeys.length} affected SKU path${node.variantKeys.length === 1 ? "" : "s"}`}
              >
                <Trash2 size={13} /> <span>{node.variantKeys.length}</span>
              </button>
            </div>
            {node.children.length > 0 && renderPathTree(node.children, depth + 1)}
          </li>
        );
      })}
    </ul>
  );

  return (
    <section className={`${styles.root} variant-options-panel`} aria-label="Variant options">
      <div className="variant-workbench-heading">
        <div>
          <h3>Product-specific variant paths</h3>
          <p>Build one valid parent-to-child path at a time. No unwanted combinations are generated.</p>
        </div>
        <Link className="admin-view-link" to="/admin/attributes"><Plus size={15} /> Add attribute</Link>
      </div>

      {builder.loading ? <p>Loading product attributes...</p> : builder.assignments.length === 0 ? (
        <div className="admin-variant-empty">
          <Layers3 size={24} />
          <div>
            <strong>This product type has no attributes yet.</strong>
            <p>Keep one simple stock variant or <Link to="/admin/attributes">add reusable attributes</Link>.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="variant-path-guide">
            <GitBranch size={18} />
            <span>Changing a parent clears its child choices. After adding a SKU, the parent prefix stays ready so you can add a sibling.</span>
          </div>

          <div className="admin-option-selector variant-options-grid variant-path-selector">
            {builder.assignments.map((assignment, assignmentIndex) => {
              const canChoose = builder.assignments.slice(0, assignmentIndex).every((parent) =>
                Object.hasOwn(builder.pathSelection, parent.attributeId),
              );
              const selectedValueId = builder.pathSelection[assignment.attributeId];
              return (
                <fieldset key={assignment.attributeId} className={canChoose ? "" : "is-locked"}>
                  <legend>
                    <span>{assignmentIndex + 1}</span>
                    {assignment.attribute.name}{assignment.isRequired ? " *" : ""}
                    <small>{canChoose ? selectedValueId ? "Chosen" : "Choose one" : "Choose parent first"}</small>
                  </legend>
                  <div className="variant-value-chips">
                    {assignment.attribute.values
                      .filter((value) => value.isActive && !value.deletedAt)
                      .map((value) => (
                        <label key={value.id}>
                          <input
                            type="radio"
                            name={`variant-path-${assignment.attributeId}`}
                            checked={selectedValueId === value.id}
                            disabled={!canChoose}
                            onChange={() => builder.choosePathValue(assignment.attributeId, value.id)}
                          />
                          {value.colorHex && <i style={{ backgroundColor: value.colorHex }} />}
                          {value.label}
                        </label>
                      ))}
                    {!assignment.isRequired && (
                      <label className="variant-path-skip">
                        <input
                          type="radio"
                          name={`variant-path-${assignment.attributeId}`}
                          checked={selectedValueId === SKIP_OPTION_VALUE}
                          disabled={!canChoose}
                          onChange={() => builder.choosePathValue(assignment.attributeId, SKIP_OPTION_VALUE)}
                        />
                        Not used for this SKU
                      </label>
                    )}
                  </div>
                  <div className="variant-inline-add">
                    <input
                      className="form-input"
                      value={builder.newValueLabels[assignment.attributeId] ?? ""}
                      placeholder={`Add new ${assignment.attribute.name.toLowerCase()}`}
                      onChange={(event) => builder.setNewValueLabels((current) => ({
                        ...current,
                        [assignment.attributeId]: event.target.value,
                      }))}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          void builder.addSuggestedValue(assignment);
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="btn btn-ghost"
                      disabled={builder.addingValueFor === assignment.attributeId}
                      onClick={() => void builder.addSuggestedValue(assignment)}
                    >
                      <Plus size={15} /> {builder.addingValueFor === assignment.attributeId ? "Adding..." : "Add"}
                    </button>
                  </div>
                </fieldset>
              );
            })}
          </div>

          <div className="variant-path-create-bar">
            <div>
              <small>Exact SKU path</small>
              <strong>{builder.currentPathLabels.length ? builder.currentPathLabels.join(" → ") : "Choose the first attribute"}</strong>
            </div>
            <button type="button" className="btn btn-primary" onClick={builder.addExactVariantPath} disabled={!builder.pathIsComplete}>
              <Plus size={17} /> Add exact SKU
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => builder.setPathSelection({})} disabled={builder.currentPathLabels.length === 0}>
              Clear path
            </button>
          </div>

          {builder.variantPathTree.length > 0 && (
            <div className="variant-path-tree">
              <div>
                <GitBranch size={17} />
                <strong>Current product tree</strong>
                <small>{builder.exactPathCount} exact SKU path{builder.exactPathCount === 1 ? "" : "s"}</small>
              </div>
              {renderPathTree(builder.variantPathTree)}
            </div>
          )}
        </>
      )}
    </section>
  );
};
````

### `web/src/admin/product-editor/components/VariantPreferencesSection/QuantityPricingEditor.tsx`

Source lines: 82

````tsx
import { Plus, Trash2 } from "lucide-react";

import type {
  PreferenceScope,
  PriceTierDraft,
  VariantDraft,
} from "../../types/productEditor.types";

interface Props {
  variants: VariantDraft[];
  tiers: PriceTierDraft[];
  onChange: (tiers: PriceTierDraft[]) => void;
  scope: PreferenceScope;
}

/**
 * Edits quantity-based unit prices.
 * `variantKey` is an editor key here; the save utility resolves it to a database
 * variant ID only after new SKUs have been created.
 */
export const QuantityPricingEditor = ({ onChange, scope, tiers, variants }: Props) => {
  const visibleTiers = tiers.filter((tier) =>
    scope === "all" ? tier.variantKey === "all" : tier.variantKey !== "all",
  );
  const hiddenTierCount = tiers.length - visibleTiers.length;

  const addTier = () => {
    const variantKey = scope === "all" ? "all" : variants[0]?.key;
    if (!variantKey) return;
    onChange([...tiers, {
      key: `tier-${Date.now()}`,
      variantKey,
      minimumQuantity: "2",
      unitPrice: "",
      isPromotion: false,
      isActive: true,
    }]);
  };
  const update = (key: string, change: Partial<PriceTierDraft>) => {
    onChange(tiers.map((tier) => tier.key === key ? { ...tier, ...change } : tier));
  };

  return (
    <section className="admin-price-tier-builder admin-field-wide" aria-label="Block and quantity pricing">
      <div className="admin-form-divider"><span>Block and quantity pricing</span></div>
      <div className="variant-workbench-heading">
        <div>
          <h3>Set quantity price blocks</h3>
          <p>{scope === "all" ? "One quantity-price schedule applies across the product." : "Choose the exact SKU for every quantity-price row."}</p>
        </div>
        <button type="button" className="btn btn-ghost" onClick={addTier} disabled={scope === "individual" && variants.length === 0}><Plus size={16} /> Add price block</button>
      </div>

      {hiddenTierCount > 0 && (
        <p className="price-tier-scope-note">{hiddenTierCount} price block{hiddenTierCount === 1 ? " is" : "s are"} hidden because they use the other scope.</p>
      )}
      {visibleTiers.length === 0 ? (
        <div className="price-tier-empty">No block pricing configured. Normal or scheduled offer prices will be used.</div>
      ) : (
        <div className="admin-variant-table-wrap">
          <table className="admin-variant-table price-tier-table">
            <thead><tr><th>Apply to</th><th>Minimum quantity</th><th>Unit price (BDT)</th><th>Promotion</th><th>Active</th><th><span className="sr-only">Remove</span></th></tr></thead>
            <tbody>{visibleTiers.map((tier) => (
              <tr key={tier.key}>
                <td>{scope === "all" ? <strong>All variants</strong> : (
                  <select className="form-input" value={tier.variantKey} onChange={(event) => update(tier.key, { variantKey: event.target.value })}>
                    {variants.map((variant) => <option key={variant.key} value={variant.key}>{variant.optionLabel || variant.sku || "Default"}</option>)}
                  </select>
                )}</td>
                <td><input className="form-input" type="number" min="2" step="1" required value={tier.minimumQuantity} onChange={(event) => update(tier.key, { minimumQuantity: event.target.value })} /></td>
                <td><input className="form-input" type="number" min="0" step="0.01" required value={tier.unitPrice} onChange={(event) => update(tier.key, { unitPrice: event.target.value })} /></td>
                <td><input type="checkbox" checked={tier.isPromotion} onChange={(event) => update(tier.key, { isPromotion: event.target.checked })} /></td>
                <td><input type="checkbox" checked={tier.isActive} onChange={(event) => update(tier.key, { isActive: event.target.checked })} /></td>
                <td><button type="button" className="admin-view-link reference-delete-button" aria-label="Remove price block" onClick={() => onChange(tiers.filter((item) => item.key !== tier.key))}><Trash2 size={16} /></button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </section>
  );
};
````

### `web/src/admin/product-editor/components/VariantPreferencesSection/VariantPreferencesSection.module.css`

Source lines: 4

````css
.root {
  display: grid;
  gap: 0.65rem;
}
````

### `web/src/admin/product-editor/components/VariantPreferencesSection/VariantPreferencesSection.tsx`

Source lines: 153

````tsx
import type { ProductEditorController } from "../../hooks/useProductEditor";
import { discountPriceFromPercentage } from "../../utils/productEditor.validation";
import { QuantityPricingEditor } from "./QuantityPricingEditor";
import styles from "./VariantPreferencesSection.module.css";

interface Props {
  editor: ProductEditorController;
}

/**
 * Chooses whether pricing, discount, and media rules apply globally or per SKU.
 * These scopes are independent business choices; selecting one never silently
 * changes the other two.
 */
export const VariantPreferencesSection = ({ editor }: Props) => (
  <div className={styles.root}>
    <div className="variant-settings-heading">
      <div>
        <h3>Variant Preferences</h3>
        <p>Choose an independent scope for quantity pricing, discounts, and media.</p>
      </div>
    </div>

    <section className="variant-policy-card">
      <div className="variant-policy-heading">
        <div>
          <strong>1. Quantity pricing</strong>
          <small>Offer a lower unit price at selected quantities.</small>
        </div>
        <div className="variant-policy-scope">
          <label>
            <input type="radio" name="price-tier-scope" checked={editor.priceTierScope === "all"} onChange={() => editor.changePriceTierScope("all")} />
            All variants
          </label>
          <label>
            <input type="radio" name="price-tier-scope" checked={editor.priceTierScope === "individual"} onChange={() => editor.changePriceTierScope("individual")} />
            Individual SKU
          </label>
        </div>
      </div>
      <QuantityPricingEditor
        variants={editor.variantDrafts}
        tiers={editor.priceTiers}
        onChange={editor.setPriceTiers}
        scope={editor.priceTierScope}
      />
    </section>

    <section className="variant-policy-card">
      <div className="variant-policy-heading">
        <div>
          <strong>2. Offer discount</strong>
          <small>Use one product offer or configure each SKU separately.</small>
        </div>
        <div className="variant-policy-scope">
          <label>
            <input type="radio" name="discount-scope" checked={editor.discountScope === "all"} onChange={() => editor.changeDiscountScope("all")} />
            All variants
          </label>
          <label>
            <input type="radio" name="discount-scope" checked={editor.discountScope === "individual"} onChange={() => editor.changeDiscountScope("individual")} />
            Individual SKU
          </label>
        </div>
      </div>

      {editor.discountScope === "all" ? (
        <div className="variant-policy-content">
          <label className="variant-settings-toggle">
            <input
              type="checkbox"
              checked={editor.globalDiscountEnabled}
              onChange={(event) => {
                editor.setGlobalDiscountEnabled(event.target.checked);
                if (!event.target.checked) {
                  editor.setField("discountPrice", "");
                  editor.setField("discountStartsAt", "");
                  editor.setField("discountEndsAt", "");
                }
              }}
            />
            <span>
              <strong>Offer discount</strong>
              <small>Apply the final sale price to every variant without its own offer.</small>
            </span>
          </label>

          {editor.globalDiscountEnabled && (
            <div className="variant-settings-controls">
              <label>Discount price
                <input className="form-input" type="number" min="0" step="0.01" value={editor.form.discountPrice} onChange={(event) => editor.setField("discountPrice", event.target.value)} />
              </label>
              <label>Discount % off
                <input
                  className="form-input"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={editor.globalDiscountPercentage}
                  placeholder="e.g. 30"
                  onChange={(event) => editor.setField(
                    "discountPrice",
                    discountPriceFromPercentage(editor.settingsRegularPrice, event.target.value),
                  )}
                />
              </label>
              <label>Start date
                <input className="form-input" type="datetime-local" value={editor.form.discountStartsAt} onChange={(event) => editor.setField("discountStartsAt", event.target.value)} />
              </label>
              <label>End date
                <input className="form-input" type="datetime-local" value={editor.form.discountEndsAt} onChange={(event) => editor.setField("discountEndsAt", event.target.value)} />
              </label>
            </div>
          )}
        </div>
      ) : (
        <div className="variant-policy-content variant-settings-help">
          Select an SKU below and enter its discount price and schedule in the Selected Variant panel.
        </div>
      )}
    </section>

    <section className="variant-policy-card">
      <div className="variant-policy-heading">
        <div>
          <strong>3. Product media</strong>
          <small>Use shared product media or enable separate uploads per SKU.</small>
        </div>
        <div className="variant-policy-scope">
          <label>
            <input type="radio" name="media-scope" checked={editor.mediaScope === "all"} onChange={() => editor.changeMediaScope("all")} />
            All variants
          </label>
          <label>
            <input type="radio" name="media-scope" checked={editor.mediaScope === "individual"} onChange={() => editor.changeMediaScope("individual")} />
            Individual SKU
          </label>
        </div>
      </div>
      <div className="variant-policy-content variant-settings-help">
        {editor.mediaScope === "all"
          ? "Upload shared product media in Additional Product Details. SKU-specific upload buttons are disabled."
          : "Select an SKU and use Add media in the Selected Variant panel. Shared media can remain as a fallback."}
        {editor.mediaScope === "all" && editor.media.some((item) => item.variantId !== null) && (
          <small className="variant-policy-warning">
            Existing SKU-specific media is preserved. Reassign or delete it from the media library if you want a strictly shared gallery.
          </small>
        )}
      </div>
    </section>
  </div>
);
````

### `web/src/admin/product-editor/hooks/useProductCatalogOptions.ts`

Source lines: 461

````ts
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type {
  AdminBrand,
  AdminProductType,
  ProductTypeAttributeAssignment,
} from "../../../api/adminCatalog";
import { adminCatalogApi } from "../../../api/adminCatalog";
import type { CategoryOption } from "../../../api/adminProducts";
import { adminProductApi } from "../../../api/adminProducts";
import { ApiException } from "../../../api/client";
import type { ProductMedia } from "../../../api/products";
import type {
  BulkField,
  FlatCategoryOption,
  ProductFormState,
  VariantDraft,
  VariantPendingMedia,
} from "../types/productEditor.types";
import { discountPercentageFromPrice } from "../utils/productEditor.validation";
import {
  SKIP_OPTION_VALUE,
  analyzeVariantPathRemoval,
  buildVariantPathTree,
  changeVariantPathSelection,
  clearDeepestVariantPathChoice,
  selectedVariantPathIds,
  variantPathSignature,
} from "../utils/variantPaths";

interface UseProductCatalogOptionsInput {
  form: ProductFormState;
  setForm: React.Dispatch<React.SetStateAction<ProductFormState>>;
  variants: VariantDraft[];
  setVariants: React.Dispatch<React.SetStateAction<VariantDraft[]>>;
  media: ProductMedia[];
  pendingMedia: VariantPendingMedia[];
  mediaBusyId: string | null;
  mediaCountForScope: (variantKey: string) => number;
  addPendingMedia: (variantKey: string, files: File[]) => void;
  deleteMedia: (mediaId: string) => void;
  setPrimaryMedia: (mediaId: string) => void;
  variantMediaEnabled: boolean;
  importCsv: (file: File) => Promise<void> | void;
  exportCsv: () => void;
  reportError: (message: string) => void;
}

const flattenCategories = (
  items: CategoryOption[],
  ancestorNames: string[] = [],
): FlatCategoryOption[] => items.flatMap((item) => {
  const names = [...ancestorNames, item.name];
  return [
    { ...item, displayName: names.join(" › ") },
    ...flattenCategories(item.children, names),
  ];
});

const skuPart = (value: string) =>
  value.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "");

const valueCode = (value: string) =>
  value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/**
 * Loads category/type/brand choices and manages product-specific attribute paths.
 *
 * Attributes are catalog templates, but the paths built here belong only to the
 * current product. That separation allows Black -> XL while Green -> M without
 * generating a full unwanted Cartesian combination.
 */
export function useProductCatalogOptions(input: UseProductCatalogOptionsInput) {
  const [categories, setCategories] = useState<FlatCategoryOption[]>([]);
  const [brands, setBrands] = useState<AdminBrand[]>([]);
  const [productTypes, setProductTypes] = useState<AdminProductType[]>([]);
  const [allowedProductTypeIds, setAllowedProductTypeIds] = useState<string[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);

  const [assignments, setAssignments] = useState<ProductTypeAttributeAssignment[]>([]);
  const [pathSelection, setPathSelection] = useState<Record<string, string>>({});
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [focusedVariantKey, setFocusedVariantKey] = useState("");
  const [newValueLabels, setNewValueLabels] = useState<Record<string, string>>({});
  const [addingValueFor, setAddingValueFor] = useState<string | null>(null);
  const [bulkField, setBulkField] = useState<BulkField>("price");
  const [bulkValue, setBulkValue] = useState("");
  const [bulkOpen, setBulkOpen] = useState(false);
  const [attributesLoading, setAttributesLoading] = useState(false);
  const [variantError, setVariantError] = useState("");
  const csvInputRef = useRef<HTMLInputElement>(null);

  const loadCatalog = useCallback(async () => {
    setCatalogLoading(true);
    input.reportError("");
    try {
      const [categoryResult, brandResult, typeResult] = await Promise.all([
        adminProductApi.getCategories(),
        adminCatalogApi.getBrands(false),
        adminCatalogApi.getProductTypes(false),
      ]);
      setCategories(flattenCategories(categoryResult).filter((category) => category.allowProducts));
      setBrands(brandResult.filter((brand) => brand.isActive && !brand.deletedAt));
      setProductTypes(typeResult.filter((type) => type.isActive && !type.deletedAt));
    } catch (error) {
      input.reportError(error instanceof ApiException
        ? error.error.message
        : "Could not load the product catalog.");
    } finally {
      setCatalogLoading(false);
    }
  }, [input.reportError]);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  useEffect(() => {
    if (input.form.categoryId || categories.length === 0) return;
    input.setForm((current) => ({ ...current, categoryId: categories[0]?.id ?? "" }));
  }, [categories, input.form.categoryId, input.setForm]);

  // Category -> product type is an allowed-assignment relationship, not ownership.
  useEffect(() => {
    if (!input.form.categoryId) {
      setAllowedProductTypeIds([]);
      return;
    }
    let current = true;
    const categoryId = input.form.categoryId;
    setAllowedProductTypeIds([]);
    void adminCatalogApi.getCategoryProductTypes(categoryId)
      .then((assignment) => {
        if (!current) return;
        const activeIds = assignment.productTypeIds.filter((id) =>
          productTypes.some((type) => type.id === id),
        );
        setAllowedProductTypeIds(activeIds);
        input.setForm((form) => form.categoryId !== categoryId || form.productTypeId
          ? form
          : { ...form, productTypeId: activeIds[0] ?? "" });
      })
      .catch((error) => {
        if (!current) return;
        input.reportError(error instanceof ApiException
          ? error.error.message
          : "Could not load the product types assigned to this category.");
      });
    return () => { current = false; };
  }, [input.form.categoryId, input.reportError, input.setForm, productTypes]);

  // Product type assignments decide which attribute levels can be used.
  useEffect(() => {
    if (!input.form.productTypeId) {
      setAssignments([]);
      setPathSelection({});
      return;
    }
    setAttributesLoading(true);
    setVariantError("");
    void adminCatalogApi.getProductTypeAttributes(input.form.productTypeId)
      .then((items) => {
        const active = items
          .filter((item) => item.attribute.isActive && !item.attribute.deletedAt)
          .sort((left, right) => left.sortOrder - right.sortOrder);
        setAssignments(active);
        const seed = input.variants.find((variant) => variant.isDefault) ?? input.variants[0];
        const initial: Record<string, string> = {};
        for (const item of active) {
          const existingId = seed?.optionValueIds.find((id) =>
            item.attribute.values.some((value) => value.id === id),
          );
          if (existingId) initial[item.attributeId] = existingId;
          else if (!item.isRequired && seed?.optionValueIds.length) {
            initial[item.attributeId] = SKIP_OPTION_VALUE;
          }
        }
        setPathSelection(initial);
      })
      .catch((error) => setVariantError(error instanceof ApiException
        ? error.error.message
        : "Could not load product attributes."))
      .finally(() => setAttributesLoading(false));
    // Existing rows seed the path only when product type changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input.form.productTypeId]);

  useEffect(() => {
    setSelectedRows((current) => current.filter((key) =>
      input.variants.some((variant) => variant.key === key),
    ));
    if (!input.variants.some((variant) => variant.key === focusedVariantKey)) {
      setFocusedVariantKey(
        input.variants.find((variant) => variant.isDefault)?.key ?? input.variants[0]?.key ?? "",
      );
    }
  }, [focusedVariantKey, input.variants]);

  const valuesById = useMemo(() => new Map(assignments.flatMap((item) =>
    item.attribute.values.map((value) => [value.id, value] as const),
  )), [assignments]);
  const variantPathTree = useMemo(
    () => buildVariantPathTree(assignments, input.variants),
    [assignments, input.variants],
  );
  const currentPathLabels = assignments.flatMap((assignment) => {
    const valueId = pathSelection[assignment.attributeId];
    if (!valueId) return [];
    if (valueId === SKIP_OPTION_VALUE) return [`No ${assignment.attribute.name}`];
    return [valuesById.get(valueId)?.label ?? valueId];
  });
  const pathIsComplete = assignments.length > 0 && assignments.every((assignment) =>
    Object.hasOwn(pathSelection, assignment.attributeId),
  );
  const exactPathCount = input.variants.filter((variant) => variant.optionValueIds.length > 0).length;
  const focusedVariant = input.variants.find((variant) => variant.key === focusedVariantKey) ?? null;
  const focusedMedia = input.media.filter((item) =>
    item.variantId === (focusedVariant?.id ?? "__new_variant__") || item.variantId === null,
  );
  const focusedPendingMedia = input.pendingMedia.filter((item) =>
    item.variantKey === focusedVariantKey || item.variantKey === "all",
  );
  const focusedPreviewMedia = focusedMedia.find((item) =>
    item.type === "IMAGE" && item.variantId === focusedVariant?.id && item.isPrimary,
  ) ?? focusedMedia.find((item) =>
    item.type === "IMAGE" && item.variantId === focusedVariant?.id,
  ) ?? focusedMedia.find((item) => item.type === "IMAGE" && item.variantId === null && item.isPrimary)
    ?? focusedMedia.find((item) => item.type === "IMAGE");
  const focusedMediaLimitReached = focusedVariant
    ? input.mediaCountForScope(focusedVariant.key) >= 4
    : false;
  const focusedDiscountPercentage = focusedVariant
    ? discountPercentageFromPrice(focusedVariant.price, focusedVariant.discountPrice)
    : "";

  const choosePathValue = (attributeId: string, valueId: string) => {
    setPathSelection((current) =>
      changeVariantPathSelection(assignments, current, attributeId, valueId),
    );
  };

  const addSuggestedValue = async (assignment: ProductTypeAttributeAssignment) => {
    const label = newValueLabels[assignment.attributeId]?.trim();
    if (!label) return;
    setAddingValueFor(assignment.attributeId);
    setVariantError("");
    try {
      const created = await adminCatalogApi.createAttributeValue(assignment.attributeId, {
        label,
        code: valueCode(label) || undefined,
        sortOrder: assignment.attribute.values.length,
        isActive: true,
      });
      setAssignments((current) => current.map((item) =>
        item.attributeId === assignment.attributeId
          ? { ...item, attribute: { ...item.attribute, values: [...item.attribute.values, created] } }
          : item,
      ));
      setPathSelection((current) => changeVariantPathSelection(
        assignments,
        current,
        assignment.attributeId,
        created.id,
      ));
      setNewValueLabels((current) => ({ ...current, [assignment.attributeId]: "" }));
    } catch (error) {
      setVariantError(error instanceof ApiException ? error.error.message : `Could not add ${label}.`);
    } finally {
      setAddingValueFor(null);
    }
  };

  const addExactVariantPath = () => {
    const undecided = assignments.find((assignment) =>
      !Object.hasOwn(pathSelection, assignment.attributeId),
    );
    if (undecided) {
      setVariantError(`Choose a ${undecided.attribute.name} value${undecided.isRequired ? "" : " or select Not used"}.`);
      return;
    }
    const invalidRequired = assignments.find((assignment) =>
      assignment.isRequired && pathSelection[assignment.attributeId] === SKIP_OPTION_VALUE,
    );
    if (invalidRequired) {
      setVariantError(`${invalidRequired.attribute.name} is required for every variant.`);
      return;
    }
    const optionValueIds = selectedVariantPathIds(assignments, pathSelection);
    if (optionValueIds.length === 0) {
      setVariantError("Choose at least one attribute value for this variant.");
      return;
    }
    const baseVariants = input.variants.filter((variant) => !(
      !variant.id && variant.optionValueIds.length === 0 && !variant.sku.trim() &&
      Number(variant.stockQuantity) === 0
    ));
    const signature = variantPathSignature(optionValueIds);
    if (baseVariants.some((variant) => variantPathSignature(variant.optionValueIds) === signature)) {
      setVariantError("This exact variant path already exists. Choose a different child value.");
      return;
    }
    if (baseVariants.length >= 200) {
      setVariantError("A product can contain at most 200 exact variant paths.");
      return;
    }

    const labels = optionValueIds.map((id) => valuesById.get(id)?.label ?? id);
    const codes = optionValueIds.map((id) => valuesById.get(id)?.code ?? id);
    const created: VariantDraft = {
      key: `new-${signature}-${Date.now()}`,
      optionValueIds,
      optionLabel: labels.join(" / "),
      sku: [skuPart(input.form.name) || "PRODUCT", ...codes.map(skuPart)].filter(Boolean).join("-").slice(0, 100),
      barcode: "",
      price: input.form.defaultPrice,
      discountPrice: "",
      discountStartsAt: "",
      discountEndsAt: "",
      costPrice: input.form.costPrice,
      stockQuantity: "0",
      lowStockLevel: "5",
      isDefault: baseVariants.length === 0,
      isActive: true,
    };
    input.setVariants([...baseVariants, created]);
    setFocusedVariantKey(created.key);
    setPathSelection((current) => clearDeepestVariantPathChoice(assignments, current));
    setVariantError("");
  };

  const update = (key: string, change: Partial<VariantDraft>) => {
    input.setVariants((variants) => variants.map((variant) => {
      if (change.isDefault === true) return { ...variant, isDefault: variant.key === key };
      return variant.key === key ? { ...variant, ...change } : variant;
    }));
  };

  const remove = (key: string) => {
    const target = input.variants.find((variant) => variant.key === key);
    if (target && Number(target.stockQuantity) > 0) {
      setVariantError(`Set ${target.optionLabel || target.sku}'s stock to zero before removing it.`);
      return;
    }
    const next = input.variants.filter((variant) => variant.key !== key);
    if (next.length > 0 && !next.some((variant) => variant.isDefault)) {
      next[0] = { ...next[0], isDefault: true };
    }
    input.setVariants(next);
    setVariantError("");
  };

  const removePathBranch = (node: (typeof variantPathTree)[number]) => {
    const { affected, stocked } = analyzeVariantPathRemoval(node.variantKeys, input.variants);
    if (affected.length === 0) return;
    if (stocked.length > 0) {
      const preview = stocked.slice(0, 3).map((variant) => variant.optionLabel || variant.sku).join(", ");
      setVariantError(`Cannot remove ${node.label}. ${stocked.length} affected SKU${stocked.length === 1 ? " has" : "s have"} stock: ${preview}${stocked.length > 3 ? ` and ${stocked.length - 3} more` : ""}. Set all affected stock to zero first.`);
      return;
    }
    const savedCount = affected.filter((variant) => variant.id).length;
    if (!window.confirm(
      `Remove ${node.label} and ${affected.length} affected SKU path${affected.length === 1 ? "" : "s"}?${savedCount ? " Saved SKUs will be deleted when you save the product." : ""}`,
    )) return;
    const removed = new Set(affected.map((variant) => variant.key));
    const next = input.variants.filter((variant) => !removed.has(variant.key));
    if (next.length > 0 && !next.some((variant) => variant.isDefault)) {
      next[0] = { ...next[0], isDefault: true };
    }
    input.setVariants(next);
    setVariantError("");
  };

  const toggleRow = (key: string) => setSelectedRows((current) =>
    current.includes(key) ? current.filter((item) => item !== key) : [...current, key],
  );
  const toggleAllRows = () => setSelectedRows(
    selectedRows.length === input.variants.length ? [] : input.variants.map((variant) => variant.key),
  );

  const applyBulkValue = () => {
    if (selectedRows.length === 0) {
      setVariantError("Select at least one variant row for the bulk operation.");
      return;
    }
    if (bulkValue === "") {
      setVariantError(bulkField === "isActive"
        ? "Choose the active status you want to apply."
        : "Enter the value you want to apply.");
      return;
    }
    input.setVariants((variants) => variants.map((variant) => {
      if (!selectedRows.includes(variant.key)) return variant;
      return bulkField === "isActive"
        ? { ...variant, isActive: bulkValue === "true" }
        : { ...variant, [bulkField]: bulkValue };
    }));
    setVariantError("");
  };

  const valueForAssignment = (variant: VariantDraft, assignment: ProductTypeAttributeAssignment) =>
    assignment.attribute.values.find((item) => variant.optionValueIds.includes(item.id)) ?? null;

  return {
    categories,
    brands,
    productTypes,
    allowedProductTypeIds,
    loading: catalogLoading,
    variantBuilder: {
      assignments,
      pathSelection,
      setPathSelection,
      selectedRows,
      focusedVariantKey,
      setFocusedVariantKey,
      newValueLabels,
      setNewValueLabels,
      addingValueFor,
      bulkField,
      setBulkField,
      bulkValue,
      setBulkValue,
      bulkOpen,
      setBulkOpen,
      loading: attributesLoading,
      error: variantError,
      csvInputRef,
      variantPathTree,
      currentPathLabels,
      pathIsComplete,
      exactPathCount,
      focusedVariant,
      focusedMedia,
      focusedPendingMedia,
      focusedPreviewMedia,
      focusedMediaLimitReached,
      focusedDiscountPercentage,
      choosePathValue,
      addSuggestedValue,
      addExactVariantPath,
      update,
      remove,
      removePathBranch,
      toggleRow,
      toggleAllRows,
      applyBulkValue,
      valueForAssignment,
      variants: input.variants,
      mediaBusyId: input.mediaBusyId,
      onAddMedia: input.addPendingMedia,
      onDeleteMedia: input.deleteMedia,
      onSetPrimaryMedia: input.setPrimaryMedia,
      variantMediaEnabled: input.variantMediaEnabled,
      onImportCsv: input.importCsv,
      onExportCsv: input.exportCsv,
    },
  };
}

export type VariantOptionsController = ReturnType<typeof useProductCatalogOptions>["variantBuilder"];
````

### `web/src/admin/product-editor/hooks/useProductEditor.ts`

Source lines: 307

````ts
import type React from "react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import type { AdminProduct } from "../../../api/adminProducts";
import { adminProductApi } from "../../../api/adminProducts";
import { ApiException } from "../../../api/client";
import type {
  PreferenceScope,
  PriceTierDraft,
  ProductFormState,
  VariantDraft,
} from "../types/productEditor.types";
import { createEmptyVariant, emptyProductForm, mapProductToEditor } from "../utils/productEditor.mappers";
import { ProductDraftSetupError, saveProductEditor } from "../utils/productEditor.save";
import {
  discountPercentageFromPrice,
  validateProductEditor,
} from "../utils/productEditor.validation";
import { exportVariantsToCsv, parseVariantCsv } from "../utils/variantCsv";
import { useProductCatalogOptions } from "./useProductCatalogOptions";
import { useProductMedia } from "./useProductMedia";

/**
 * Main Product Editor controller.
 *
 * The page consumes this hook as one controller, while specialized hooks own
 * catalog and media details. This keeps React rendering separate from business
 * validation and API persistence in `utils/`.
 */
export function useProductEditor() {
  const navigate = useNavigate();
  const { productId } = useParams();
  const [form, setForm] = useState<ProductFormState>(emptyProductForm);
  const [variantDrafts, setVariantDrafts] = useState<VariantDraft[]>([createEmptyVariant()]);
  const [originalVariantIds, setOriginalVariantIds] = useState<string[]>([]);
  const [priceTiers, setPriceTiers] = useState<PriceTierDraft[]>([]);
  const [priceTierScope, setPriceTierScope] = useState<PreferenceScope>("all");
  const [discountScope, setDiscountScope] = useState<PreferenceScope>("all");
  const [globalDiscountEnabled, setGlobalDiscountEnabled] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productLoading, setProductLoading] = useState(Boolean(productId));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const mediaController = useProductMedia({
    editingProductId,
    variants: variantDrafts,
    reportError: setError,
  });

  const exportVariantCsv = () => {
    const csv = exportVariantsToCsv(variantDrafts);
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${form.name.trim().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "product"}-variants.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  /** CSV updates matching SKUs and adds new rows; database IDs remain untouched. */
  const importVariantCsv = async (file: File) => {
    setError("");
    setSuccess("");
    const parsed = parseVariantCsv(await file.text());
    if (parsed.errors.length > 0) {
      const preview = parsed.errors.slice(0, 3)
        .map((item) => `row ${item.row}${item.field ? ` (${item.field})` : ""}: ${item.message}`)
        .join("; ");
      setError(`CSV was not imported. ${preview}${parsed.errors.length > 3 ? `; plus ${parsed.errors.length - 3} more error(s).` : ""}`);
      return;
    }
    if (parsed.records.length === 0) {
      setError("The CSV contains no variant rows.");
      return;
    }

    const existingBySku = new Map(
      variantDrafts.map((variant) => [variant.sku.trim().toUpperCase(), variant] as const),
    );
    const importedBySku = new Map(parsed.records.map((record) => [record.sku, record] as const));
    const next = variantDrafts.map((variant) => {
      const patch = importedBySku.get(variant.sku.trim().toUpperCase());
      return patch ? { ...variant, ...patch } : variant;
    });
    for (const record of parsed.records) {
      if (existingBySku.has(record.sku)) continue;
      next.push({
        key: `csv-${crypto.randomUUID()}`,
        optionValueIds: record.optionValueIds ?? [],
        optionLabel: record.optionLabel || record.sku,
        sku: record.sku,
        barcode: record.barcode ?? "",
        price: record.price ?? "",
        discountPrice: record.discountPrice ?? "",
        discountStartsAt: "",
        discountEndsAt: "",
        costPrice: record.costPrice ?? "",
        stockQuantity: record.stockQuantity ?? "0",
        lowStockLevel: record.lowStockLevel ?? "5",
        isActive: record.isActive ?? true,
        isDefault: record.isDefault ?? false,
      });
    }
    const defaultSku = parsed.records.find((record) => record.isDefault)?.sku;
    const normalized = defaultSku
      ? next.map((variant) => ({
        ...variant,
        isDefault: variant.sku.trim().toUpperCase() === defaultSku,
      }))
      : next.some((variant) => variant.isDefault)
        ? next
        : next.map((variant, index) => ({ ...variant, isDefault: index === 0 }));
    setVariantDrafts(normalized);
    setSuccess(`${parsed.records.length} variant row${parsed.records.length === 1 ? "" : "s"} imported from ${file.name}.`);
  };

  const catalogController = useProductCatalogOptions({
    form,
    setForm,
    variants: variantDrafts,
    setVariants: setVariantDrafts,
    media: mediaController.media,
    pendingMedia: mediaController.pendingMedia,
    mediaBusyId: mediaController.mediaBusyId,
    mediaCountForScope: mediaController.mediaCountForScope,
    addPendingMedia: mediaController.addPendingMedia,
    deleteMedia: (id) => void mediaController.deleteImage(id),
    setPrimaryMedia: (id) => void mediaController.setPrimaryImage(id),
    variantMediaEnabled: mediaController.mediaScope === "individual",
    importCsv: importVariantCsv,
    exportCsv: exportVariantCsv,
    reportError: setError,
  });

  // Edit mode hydrates every editor slice from one complete product response.
  useEffect(() => {
    if (!productId) return;
    let current = true;
    setProductLoading(true);
    setError("");
    setSuccess("");
    void adminProductApi.getProduct(productId)
      .then((product) => {
        if (!current) return;
        const mapped = mapProductToEditor(product);
        setEditingProductId(product.id);
        setForm(mapped.form);
        setVariantDrafts(mapped.variants);
        setOriginalVariantIds(mapped.originalVariantIds);
        setPriceTiers(mapped.priceTiers);
        setPriceTierScope(mapped.priceTierScope);
        setDiscountScope(mapped.discountScope);
        setGlobalDiscountEnabled(mapped.globalDiscountEnabled);
        mediaController.setMedia(product.media ?? []);
        mediaController.setPendingMedia([]);
        mediaController.setMediaScope(mapped.mediaScope);
      })
      .catch((requestError) => {
        if (!current) return;
        setError(requestError instanceof ApiException
          ? requestError.error.message
          : "Could not load this product for editing.");
      })
      .finally(() => { if (current) setProductLoading(false); });
    return () => { current = false; };
    // Loading is keyed by route ID; stable React setters intentionally stay out.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  // Remove tier rows whose unsaved SKU was removed in the option editor.
  useEffect(() => {
    const keys = new Set(variantDrafts.map((variant) => variant.key));
    setPriceTiers((current) => current.filter(
      (tier) => tier.variantKey === "all" || keys.has(tier.variantKey),
    ));
  }, [variantDrafts]);

  const setField = <K extends keyof ProductFormState>(key: K, value: ProductFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const changePriceTierScope = (next: PreferenceScope) => {
    if (next === priceTierScope) return;
    const conflicting = priceTiers.filter((tier) =>
      next === "all" ? tier.variantKey !== "all" : tier.variantKey === "all",
    );
    if (conflicting.length > 0 && !window.confirm(
      `Switching quantity pricing to ${next === "all" ? "All variants" : "Individual SKU"} will remove ${conflicting.length} price block${conflicting.length === 1 ? "" : "s"} from the other scope. Continue?`,
    )) return;
    setPriceTiers((current) => current.filter((tier) =>
      next === "all" ? tier.variantKey === "all" : tier.variantKey !== "all",
    ));
    setPriceTierScope(next);
    setError("");
  };

  const changeDiscountScope = (next: PreferenceScope) => {
    if (next === discountScope) return;
    if (next === "all") {
      const individualCount = variantDrafts.filter((variant) => variant.discountPrice).length;
      if (individualCount > 0 && !window.confirm(
        `Switching discounts to All variants will clear ${individualCount} individual SKU discount${individualCount === 1 ? "" : "s"}. Continue?`,
      )) return;
      setVariantDrafts((current) => current.map((variant) => ({
        ...variant,
        discountPrice: "",
        discountStartsAt: "",
        discountEndsAt: "",
      })));
    } else if (globalDiscountEnabled || form.discountPrice) {
      if (!window.confirm("Switching discounts to Individual SKU will clear the shared product discount. Continue?")) return;
      setGlobalDiscountEnabled(false);
      setForm((current) => ({
        ...current,
        discountPrice: "",
        discountStartsAt: "",
        discountEndsAt: "",
      }));
    }
    setDiscountScope(next);
    setError("");
  };

  const handleSaveProduct = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const requestedStatus = (submitter?.dataset.status as AdminProduct["status"] | undefined)
      ?? form.status;
    const validation = validateProductEditor({
      form,
      variants: variantDrafts,
      tiers: priceTiers,
      globalDiscountEnabled,
    });
    if (!validation.ok) {
      setError(validation.error);
      return;
    }

    setSubmitting(true);
    try {
      const result = await saveProductEditor({
        editingProductId,
        form,
        requestedStatus,
        variants: variantDrafts,
        originalVariantIds,
        priceTiers,
        media: mediaController.media,
        pendingMedia: mediaController.pendingMedia,
        values: validation.values,
      });
      navigate("/admin/products", {
        state: { success: `${form.name} was ${result.created ? "created" : "updated"} successfully.` },
      });
    } catch (requestError) {
      const message = requestError instanceof ApiException
        ? requestError.error.message
        : requestError instanceof Error ? requestError.message : "Could not save the product.";
      setError(requestError instanceof ProductDraftSetupError
        ? `The product was saved as a draft, but setup did not finish: ${message}`
        : message);
    } finally {
      setSubmitting(false);
    }
  };

  const settingsDefaultVariant = variantDrafts.find((variant) => variant.isDefault) ?? variantDrafts[0];
  const settingsRegularPrice = settingsDefaultVariant?.price || form.defaultPrice;

  return {
    ...catalogController,
    ...mediaController,
    loading: productLoading || catalogController.loading,
    submitting,
    editingProductId,
    variantDrafts,
    setVariantDrafts,
    originalVariantIds,
    priceTiers,
    setPriceTiers,
    error,
    success,
    form,
    setForm,
    setField,
    priceTierScope,
    discountScope,
    globalDiscountEnabled,
    setGlobalDiscountEnabled,
    settingsRegularPrice,
    globalDiscountPercentage: discountPercentageFromPrice(settingsRegularPrice, form.discountPrice),
    closeEditor: () => navigate("/admin/products"),
    changePriceTierScope,
    changeDiscountScope,
    exportVariantCsv,
    importVariantCsv,
    handleSaveProduct,
  };
}

export type ProductEditorController = ReturnType<typeof useProductEditor>;
````

### `web/src/admin/product-editor/hooks/useProductMedia.ts`

Source lines: 198

````ts
import type React from "react";
import { useEffect, useState } from "react";

import { adminProductApi } from "../../../api/adminProducts";
import { ApiException } from "../../../api/client";
import type { ProductMedia } from "../../../api/products";
import type {
  PreferenceScope,
  VariantDraft,
  VariantPendingMedia,
} from "../types/productEditor.types";

interface UseProductMediaInput {
  editingProductId: string | null;
  variants: VariantDraft[];
  reportError: (message: string) => void;
}

const allowedMediaTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/webm",
];

/**
 * Owns saved and pending media independently from the product form.
 *
 * Files remain local until save because a new product and its new SKUs do not
 * have database IDs yet. The save utility resolves editor keys to database IDs.
 */
export function useProductMedia({ editingProductId, reportError, variants }: UseProductMediaInput) {
  const [media, setMedia] = useState<ProductMedia[]>([]);
  const [pendingMedia, setPendingMedia] = useState<VariantPendingMedia[]>([]);
  const [mediaBusyId, setMediaBusyId] = useState<string | null>(null);
  const [mediaScope, setMediaScope] = useState<PreferenceScope>("all");

  // A removed unsaved SKU must not leave an orphaned local file in the save queue.
  useEffect(() => {
    const availableKeys = new Set(variants.map((variant) => variant.key));
    setPendingMedia((current) => current.filter(
      (item) => item.variantKey === "all" || availableKeys.has(item.variantKey),
    ));
  }, [variants]);

  const mediaCountForScope = (
    variantKey: "all" | string,
    pendingItems = pendingMedia,
  ) => {
    const variantId = variantKey === "all"
      ? null
      : variants.find((variant) => variant.key === variantKey)?.id;
    const savedCount = variantKey === "all"
      ? media.filter((item) => item.variantId === null).length
      : variantId ? media.filter((item) => item.variantId === variantId).length : 0;
    return savedCount + pendingItems.filter((item) => item.variantKey === variantKey).length;
  };

  const addPendingMedia = (variantKey: "all" | string, selected: File[]) => {
    if (selected.length === 0) return;
    const availableSlots = 4 - mediaCountForScope(variantKey);
    if (selected.length > availableSlots) {
      const name = variantKey === "all" ? "Shared product media" : "This variant";
      reportError(`${name} can accept ${Math.max(availableSlots, 0)} more item${availableSlots === 1 ? "" : "s"}.`);
      return;
    }

    const invalidType = selected.find((file) => !allowedMediaTypes.includes(file.type));
    if (invalidType) {
      reportError(`${invalidType.name} is not a supported image or video.`);
      return;
    }
    const oversized = selected.find((file) => {
      const limitMb = file.type.startsWith("video/") ? 20 : 2;
      return file.size > limitMb * 1024 * 1024;
    });
    if (oversized) {
      reportError(`${oversized.name} is larger than ${oversized.type.startsWith("video/") ? 20 : 2} MB.`);
      return;
    }

    reportError("");
    setPendingMedia((current) => [
      ...current,
      ...selected.map((file) => ({
        key: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
        file,
        variantKey,
      })),
    ]);
  };

  const handleImageSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = "";
    addPendingMedia("all", selected);
  };

  const setPrimaryImage = async (mediaId: string) => {
    if (!editingProductId) return;
    setMediaBusyId(mediaId);
    reportError("");
    try {
      const updated = await adminProductApi.updateMedia(editingProductId, mediaId, { isPrimary: true });
      setMedia((current) => current.map((item) =>
        item.variantId === updated.variantId
          ? { ...item, isPrimary: item.id === updated.id }
          : item,
      ));
    } catch (error) {
      reportError(error instanceof ApiException ? error.error.message : "Could not set the primary image.");
    } finally {
      setMediaBusyId(null);
    }
  };

  const deleteImage = async (mediaId: string) => {
    if (!editingProductId || !window.confirm("Delete this product image?")) return;
    setMediaBusyId(mediaId);
    reportError("");
    try {
      await adminProductApi.deleteMedia(editingProductId, mediaId);
      setMedia((current) => current.filter((item) => item.id !== mediaId));
    } catch (error) {
      reportError(error instanceof ApiException ? error.error.message : "Could not delete this image.");
    } finally {
      setMediaBusyId(null);
    }
  };

  const assignMediaToVariant = async (mediaId: string, variantId: string) => {
    if (!editingProductId) return;
    setMediaBusyId(mediaId);
    reportError("");
    try {
      const updated = await adminProductApi.updateMedia(editingProductId, mediaId, {
        variantId: variantId || null,
      });
      setMedia((current) => current.map((item) => item.id === mediaId ? updated : item));
    } catch (error) {
      reportError(error instanceof ApiException ? error.error.message : "Could not assign this media item.");
    } finally {
      setMediaBusyId(null);
    }
  };

  const movePendingMedia = (mediaKey: string, variantKey: "all" | string) => {
    const withoutCurrent = pendingMedia.filter((item) => item.key !== mediaKey);
    if (mediaCountForScope(variantKey, withoutCurrent) >= 4) {
      reportError(variantKey === "all"
        ? "Shared product media already contains four items."
        : "That variant already contains four media items.");
      return;
    }
    reportError("");
    setPendingMedia((current) => current.map((item) =>
      item.key === mediaKey ? { ...item, variantKey } : item,
    ));
  };

  const changeMediaScope = (nextScope: PreferenceScope) => {
    if (nextScope === mediaScope) return;
    if (nextScope === "all") {
      const individual = pendingMedia.filter((item) => item.variantKey !== "all");
      const shared = pendingMedia.filter((item) => item.variantKey === "all");
      const savedSharedCount = media.filter((item) => item.variantId === null).length;
      if (savedSharedCount + shared.length + individual.length > 4) {
        reportError("The individual pending media cannot be moved to All variants because the four-item shared limit would be exceeded.");
        return;
      }
      if (individual.length > 0 && !window.confirm(
        `Move ${individual.length} pending SKU media item${individual.length === 1 ? "" : "s"} to All variants?`,
      )) return;
      setPendingMedia((current) => current.map((item) => ({ ...item, variantKey: "all" })));
    }
    setMediaScope(nextScope);
    reportError("");
  };

  return {
    media,
    setMedia,
    pendingMedia,
    setPendingMedia,
    mediaBusyId,
    mediaScope,
    setMediaScope,
    mediaCountForScope,
    addPendingMedia,
    handleImageSelection,
    setPrimaryImage,
    deleteImage,
    assignMediaToVariant,
    movePendingMedia,
    changeMediaScope,
  };
}
````

### `web/src/admin/product-editor/index.ts`

Source lines: 1

````ts
export { AdminProductEditorPage } from "./AdminProductEditorPage";
````

### `web/src/admin/product-editor/tests/ProductGeneralSection.test.tsx`

Source lines: 31

````tsx
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { ProductGeneralSection } from "../components/ProductGeneralSection/ProductGeneralSection";
import type { ProductEditorController } from "../hooks/useProductEditor";
import { emptyProductForm } from "../utils/productEditor.mappers";

describe("ProductGeneralSection", () => {
  it("shows only product identity and catalog relationships", () => {
    const editor = {
      form: { ...emptyProductForm, categoryId: "category-1", productTypeId: "type-1" },
      categories: [{ id: "category-1", name: "Clothing", displayName: "Clothing", children: [], allowProducts: true }],
      brands: [{ id: "brand-1", name: "DokanBD", isActive: true, deletedAt: null }],
      productTypes: [{ id: "type-1", name: "T-shirt", isActive: true, deletedAt: null }],
      allowedProductTypeIds: ["type-1"],
      editingProductId: null,
      originalVariantIds: [],
      setField: vi.fn(),
      setForm: vi.fn(),
    } as unknown as ProductEditorController;

    const html = renderToStaticMarkup(
      <MemoryRouter><ProductGeneralSection editor={editor} /></MemoryRouter>,
    );
    expect(html).toContain("Product name");
    expect(html).toContain("Clothing");
    expect(html).toContain("T-shirt");
    expect(html).toContain("DokanBD");
  });
});
````

### `web/src/admin/product-editor/tests/SelectedSkuEditor.test.tsx`

Source lines: 32

````tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { SelectedSkuEditor } from "../components/SelectedSkuEditor/SelectedSkuEditor";
import type { VariantOptionsController } from "../hooks/useProductCatalogOptions";
import { createEmptyVariant } from "../utils/productEditor.mappers";

describe("SelectedSkuEditor", () => {
  it("renders the focused SKU's commercial and inventory fields", () => {
    const variant = { ...createEmptyVariant(), sku: "SHIRT-BLACK-XL", optionLabel: "Black / XL" };
    const builder = {
      focusedVariant: variant,
      focusedPreviewMedia: undefined,
      focusedMediaLimitReached: false,
      variantMediaEnabled: true,
      focusedDiscountPercentage: "",
      focusedMedia: [],
      focusedPendingMedia: [],
      mediaBusyId: null,
      update: vi.fn(),
      onAddMedia: vi.fn(),
      onSetPrimaryMedia: vi.fn(),
      onDeleteMedia: vi.fn(),
    } as unknown as VariantOptionsController;

    const html = renderToStaticMarkup(<SelectedSkuEditor builder={builder} />);
    expect(html).toContain("Black / XL");
    expect(html).toContain("SHIRT-BLACK-XL");
    expect(html).toContain("Selling price");
    expect(html).toContain("Stock quantity");
  });
});
````

### `web/src/admin/product-editor/tests/VariantCombinationsTable.test.tsx`

Source lines: 40

````tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { VariantCombinationsTable } from "../components/VariantCombinationsTable/VariantCombinationsTable";
import type { VariantOptionsController } from "../hooks/useProductCatalogOptions";
import { createEmptyVariant } from "../utils/productEditor.mappers";

describe("VariantCombinationsTable", () => {
  it("lists SKUs with bulk, CSV, default, edit, and remove operations", () => {
    const variant = { ...createEmptyVariant(), sku: "SHIRT-BLACK-XL", optionLabel: "Black / XL", price: "899" };
    const builder = {
      variants: [variant],
      assignments: [],
      selectedRows: [],
      focusedVariantKey: variant.key,
      bulkOpen: false,
      bulkField: "price",
      bulkValue: "",
      csvInputRef: { current: null },
      setBulkOpen: vi.fn(),
      setBulkField: vi.fn(),
      setBulkValue: vi.fn(),
      onImportCsv: vi.fn(),
      onExportCsv: vi.fn(),
      toggleAllRows: vi.fn(),
      toggleRow: vi.fn(),
      setFocusedVariantKey: vi.fn(),
      valueForAssignment: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
      applyBulkValue: vi.fn(),
    } as unknown as VariantOptionsController;

    const html = renderToStaticMarkup(<VariantCombinationsTable builder={builder} />);
    expect(html).toContain("All Variant Combinations (1)");
    expect(html).toContain("SHIRT-BLACK-XL");
    expect(html).toContain("Import CSV");
    expect(html).toContain("Export CSV");
  });
});
````

### `web/src/admin/product-editor/tests/VariantPreferencesSection.test.tsx`

Source lines: 35

````tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { VariantPreferencesSection } from "../components/VariantPreferencesSection/VariantPreferencesSection";
import type { ProductEditorController } from "../hooks/useProductEditor";
import { createEmptyVariant, emptyProductForm } from "../utils/productEditor.mappers";

describe("VariantPreferencesSection", () => {
  it("keeps quantity pricing, discount, and media as independent scopes", () => {
    const editor = {
      form: emptyProductForm,
      variantDrafts: [createEmptyVariant()],
      priceTiers: [],
      setPriceTiers: vi.fn(),
      priceTierScope: "all",
      discountScope: "all",
      mediaScope: "all",
      media: [],
      globalDiscountEnabled: false,
      globalDiscountPercentage: "",
      settingsRegularPrice: "",
      changePriceTierScope: vi.fn(),
      changeDiscountScope: vi.fn(),
      changeMediaScope: vi.fn(),
      setGlobalDiscountEnabled: vi.fn(),
      setField: vi.fn(),
    } as unknown as ProductEditorController;

    const html = renderToStaticMarkup(<VariantPreferencesSection editor={editor} />);
    expect(html).toContain("1. Quantity pricing");
    expect(html).toContain("2. Offer discount");
    expect(html).toContain("3. Product media");
    expect(html.match(/All variants/g)?.length).toBeGreaterThanOrEqual(3);
  });
});
````

### `web/src/admin/product-editor/types/productEditor.types.ts`

Source lines: 75

````ts
import type { AdminProduct, CategoryOption } from "../../../api/adminProducts";

/**
 * Editable product-level fields.
 *
 * Prices stay as strings while the administrator is typing. Converting an empty
 * input to a number too early would turn it into `0`, which is not the same as
 * "not entered". Conversion happens only in the validation/save layer.
 */
export interface ProductFormState {
  name: string;
  shortDescription: string;
  description: string;
  productTypeId: string;
  categoryId: string;
  brandId: string;
  defaultPrice: string;
  discountPrice: string;
  discountStartsAt: string;
  discountEndsAt: string;
  costPrice: string;
  status: AdminProduct["status"];
  isFeatured: boolean;
}

/** Category row prepared for the nested "Parent › Child" select label. */
export interface FlatCategoryOption extends CategoryOption {
  displayName: string;
}

/** One editable SKU row in the browser before it is converted to an API body. */
export interface VariantDraft {
  key: string;
  id?: string;
  optionValueIds: string[];
  optionLabel: string;
  sku: string;
  barcode: string;
  price: string;
  discountPrice: string;
  discountStartsAt: string;
  discountEndsAt: string;
  costPrice: string;
  stockQuantity: string;
  lowStockLevel: string;
  isDefault: boolean;
  isActive: boolean;
}

/** A file selected locally but not uploaded until a product ID exists. */
export interface VariantPendingMedia {
  key: string;
  file: File;
  variantKey: "all" | string;
}

/** Quantity-price row kept in editor keys until database variant IDs are known. */
export interface PriceTierDraft {
  key: string;
  variantKey: "all" | string;
  minimumQuantity: string;
  unitPrice: string;
  isPromotion: boolean;
  isActive: boolean;
}

export type PreferenceScope = "all" | "individual";

export type BulkField =
  | "price"
  | "discountPrice"
  | "costPrice"
  | "stockQuantity"
  | "lowStockLevel"
  | "isActive";
````

### `web/src/admin/product-editor/utils/productEditor.mappers.ts`

Source lines: 160

````ts
import type { CreateProductInput, CreateVariantInput, AdminProduct } from "../../../api/adminProducts";
import type {
  PriceTierDraft,
  ProductFormState,
  VariantDraft,
} from "../types/productEditor.types";
import type { ValidatedEditorValues } from "./productEditor.validation";
import { toApiDateTime } from "./productEditor.validation";

export const emptyProductForm: ProductFormState = {
  name: "",
  shortDescription: "",
  description: "",
  productTypeId: "",
  categoryId: "",
  brandId: "",
  defaultPrice: "",
  discountPrice: "",
  discountStartsAt: "",
  discountEndsAt: "",
  costPrice: "",
  status: "ACTIVE",
  isFeatured: false,
};

/** A simple product still needs one database SKU to hold price and inventory. */
export const createEmptyVariant = (): VariantDraft => ({
  key: `new-simple-${Date.now()}`,
  optionValueIds: [],
  optionLabel: "Default",
  sku: "",
  barcode: "",
  price: "",
  discountPrice: "",
  discountStartsAt: "",
  discountEndsAt: "",
  costPrice: "",
  stockQuantity: "0",
  lowStockLevel: "5",
  isDefault: true,
  isActive: true,
});

const toLocalDateTime = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

/** Convert the API response into editable strings and stable editor keys. */
export function mapProductToEditor(product: AdminProduct) {
  const variants: VariantDraft[] = (product.variants ?? []).map((variant) => ({
    key: `existing-${variant.id}`,
    id: variant.id,
    optionValueIds: variant.optionValues?.map((value) => value.id) ?? [],
    optionLabel: variant.optionValues?.map((value) => value.label).join(" / ") || variant.name || "Default",
    sku: variant.sku,
    barcode: variant.barcode ?? "",
    price: String(variant.regularPrice ?? variant.price),
    discountPrice: variant.discountPrice == null ? "" : String(variant.discountPrice),
    discountStartsAt: toLocalDateTime(variant.discountStartsAt),
    discountEndsAt: toLocalDateTime(variant.discountEndsAt),
    costPrice: variant.costPrice == null ? "" : String(variant.costPrice),
    stockQuantity: String(variant.stockQuantity),
    lowStockLevel: String(variant.lowStockLevel ?? 5),
    isDefault: variant.isDefault,
    isActive: variant.isActive ?? true,
  }));
  const usableVariants = variants.length ? variants : [createEmptyVariant()];
  const keyByVariantId = new Map(
    variants.flatMap((variant) => variant.id ? [[variant.id, variant.key] as const] : []),
  );
  const priceTiers: PriceTierDraft[] = (product.priceTiers ?? []).map((tier) => ({
    key: `saved-tier-${tier.id}`,
    variantKey: tier.variantId ? keyByVariantId.get(tier.variantId) ?? "all" : "all",
    minimumQuantity: String(tier.minimumQuantity),
    unitPrice: String(tier.unitPrice),
    isPromotion: tier.isPromotion,
    isActive: tier.isActive ?? true,
  }));

  return {
    form: {
      name: product.name,
      shortDescription: product.shortDescription ?? "",
      description: product.description ?? "",
      productTypeId: product.productTypeId,
      categoryId: product.categoryId,
      brandId: product.brandId ?? "",
      defaultPrice: String(product.regularPrice),
      discountPrice: product.discountPrice === null ? "" : String(product.discountPrice),
      discountStartsAt: toLocalDateTime(product.discountStartsAt),
      discountEndsAt: toLocalDateTime(product.discountEndsAt),
      costPrice: product.defaultCostPrice === null ? "" : String(product.defaultCostPrice),
      status: product.status,
      isFeatured: product.isFeatured,
    } satisfies ProductFormState,
    variants: usableVariants,
    originalVariantIds: variants.flatMap((variant) => variant.id ? [variant.id] : []),
    priceTiers,
    priceTierScope: priceTiers.some((tier) => tier.variantKey !== "all") ? "individual" as const : "all" as const,
    discountScope: product.discountPrice !== null
      ? "all" as const
      : variants.some((variant) => Boolean(variant.discountPrice)) ? "individual" as const : "all" as const,
    mediaScope: (product.media ?? []).some((item) => item.variantId !== null)
      ? "individual" as const
      : "all" as const,
    globalDiscountEnabled: product.discountPrice !== null,
  };
}

export function mapProductInput(
  form: ProductFormState,
  values: ValidatedEditorValues,
  status: AdminProduct["status"],
): CreateProductInput {
  return {
    productTypeId: form.productTypeId,
    categoryId: form.categoryId,
    brandId: form.brandId || null,
    name: form.name.trim(),
    shortDescription: form.shortDescription.trim() || null,
    description: form.description.trim() || form.name.trim(),
    defaultPrice: values.regularPrice,
    defaultCostPrice: values.costPrice,
    discountPrice: values.discountPrice,
    discountStartsAt: values.discountStartsAt,
    discountEndsAt: values.discountEndsAt,
    status,
    isFeatured: form.isFeatured,
    isActive: true,
  };
}

/** Translate temporary editor rows into the backend variant contract. */
export function mapVariantInputs(
  variants: VariantDraft[],
  values: ValidatedEditorValues,
): CreateVariantInput[] {
  return variants.map((variant) => ({
    sku: variant.sku.trim(),
    barcode: variant.barcode.trim() || null,
    variantName: variant.optionLabel || "Default",
    price: Number(variant.price || values.regularPrice),
    discountPrice: variant.discountPrice ? Number(variant.discountPrice) : values.discountPrice,
    discountStartsAt: variant.discountPrice
      ? toApiDateTime(variant.discountStartsAt)
      : values.discountStartsAt,
    discountEndsAt: variant.discountPrice
      ? toApiDateTime(variant.discountEndsAt)
      : values.discountEndsAt,
    costPrice: variant.costPrice ? Number(variant.costPrice) : values.costPrice,
    stockQuantity: Number(variant.stockQuantity),
    lowStockLevel: Number(variant.lowStockLevel || 0),
    isDefault: variant.isDefault,
    isActive: variant.isActive,
    optionValueIds: variant.optionValueIds,
  }));
}
````

### `web/src/admin/product-editor/utils/productEditor.save.ts`

Source lines: 142

````ts
import type { AdminProduct } from "../../../api/adminProducts";
import { adminProductApi } from "../../../api/adminProducts";
import type { ProductMedia } from "../../../api/products";
import type {
  PriceTierDraft,
  ProductFormState,
  VariantDraft,
  VariantPendingMedia,
} from "../types/productEditor.types";
import { mapProductInput, mapVariantInputs } from "./productEditor.mappers";
import type { ValidatedEditorValues } from "./productEditor.validation";

interface SaveEditorInput {
  editingProductId: string | null;
  form: ProductFormState;
  requestedStatus: AdminProduct["status"];
  variants: VariantDraft[];
  originalVariantIds: string[];
  priceTiers: PriceTierDraft[];
  media: ProductMedia[];
  pendingMedia: VariantPendingMedia[];
  values: ValidatedEditorValues;
}

/** Signals that the base product exists but a later SKU/media/tier step failed. */
export class ProductDraftSetupError extends Error {}

async function uploadPendingMedia(
  productId: string,
  productName: string,
  pendingMedia: VariantPendingMedia[],
  variantIdsByKey: Map<string, string>,
) {
  const grouped = new Map<string, File[]>();
  for (const item of pendingMedia) {
    const variantId = item.variantKey === "all" ? "all" : variantIdsByKey.get(item.variantKey);
    if (!variantId) throw new Error("A selected media item points to a variant that was not saved.");
    grouped.set(variantId, [...(grouped.get(variantId) ?? []), item.file]);
  }
  for (const [variantId, files] of grouped) {
    await adminProductApi.uploadMedia(
      productId,
      files,
      productName,
      variantId === "all" ? undefined : variantId,
    );
  }
}

async function replacePriceTiers(
  productId: string,
  tiers: PriceTierDraft[],
  variantIdsByKey: Map<string, string>,
) {
  const inputs = tiers.map((tier) => {
    const variantId = tier.variantKey === "all" ? null : variantIdsByKey.get(tier.variantKey);
    if (tier.variantKey !== "all" && !variantId) {
      throw new Error("A block price points to a variant that was not saved.");
    }
    return {
      variantId: variantId ?? null,
      minimumQuantity: Number(tier.minimumQuantity),
      unitPrice: Number(tier.unitPrice),
      isPromotion: tier.isPromotion,
      isActive: tier.isActive,
    };
  });
  await adminProductApi.replacePriceTiers(productId, inputs);
}

/**
 * Persist the editor in dependency order: product -> SKUs -> media/tiers -> removals.
 *
 * New products are intentionally created as DRAFT first. Variant uploads need a
 * real product ID, and keeping a recoverable draft is safer than losing all work
 * if a later media upload fails.
 */
export async function saveProductEditor(input: SaveEditorInput) {
  const variantInputs = mapVariantInputs(input.variants, input.values);

  if (input.editingProductId) {
    const productId = input.editingProductId;
    await adminProductApi.updateProduct(
      productId,
      mapProductInput(input.form, input.values, input.requestedStatus),
    );

    const variantIdsByKey = new Map<string, string>();
    for (let index = 0; index < input.variants.length; index += 1) {
      const draft = input.variants[index];
      if (!draft.id) continue;
      await adminProductApi.updateVariant(productId, draft.id, variantInputs[index]);
      variantIdsByKey.set(draft.key, draft.id);
    }

    const newDrafts = input.variants.filter((variant) => !variant.id);
    const newInputs = variantInputs.filter((_, index) => !input.variants[index].id);
    if (newInputs.length > 0) {
      const created = await adminProductApi.createVariantsBulk(productId, newInputs);
      newDrafts.forEach((draft, index) => {
        if (created[index]) variantIdsByKey.set(draft.key, created[index].id);
      });
    }

    await uploadPendingMedia(productId, input.form.name, input.pendingMedia, variantIdsByKey);
    await replacePriceTiers(productId, input.priceTiers, variantIdsByKey);

    // Delete last: a failed update must not remove the administrator's old data.
    const currentIds = new Set(input.variants.flatMap((variant) => variant.id ? [variant.id] : []));
    const removedIds = input.originalVariantIds.filter((id) => !currentIds.has(id));
    for (const item of input.media.filter((entry) => entry.variantId && removedIds.includes(entry.variantId))) {
      await adminProductApi.deleteMedia(productId, item.id);
    }
    for (const variantId of removedIds) await adminProductApi.deleteVariant(productId, variantId);
    return { productId, created: false };
  }

  let product: AdminProduct | null = null;
  try {
    product = await adminProductApi.createProduct(
      mapProductInput(input.form, input.values, "DRAFT"),
    );
    const createdVariants = await adminProductApi.createVariantsBulk(product.id, variantInputs);
    const variantIdsByKey = new Map<string, string>();
    input.variants.forEach((draft, index) => {
      if (createdVariants[index]) variantIdsByKey.set(draft.key, createdVariants[index].id);
    });

    await uploadPendingMedia(product.id, input.form.name, input.pendingMedia, variantIdsByKey);
    await replacePriceTiers(product.id, input.priceTiers, variantIdsByKey);
    if (input.requestedStatus !== "DRAFT") {
      await adminProductApi.updateProduct(product.id, { status: input.requestedStatus });
    }
    return { productId: product.id, created: true };
  } catch (error) {
    if (product) {
      const message = error instanceof Error ? error.message : "Unknown setup error";
      throw new ProductDraftSetupError(message);
    }
    throw error;
  }
}
````

### `web/src/admin/product-editor/utils/productEditor.validation.ts`

Source lines: 169

````ts
import type {
  PriceTierDraft,
  ProductFormState,
  VariantDraft,
} from "../types/productEditor.types";

/** Convert a regular price and percentage into the final customer price. */
export function discountPriceFromPercentage(
  regularPriceValue: string,
  percentageValue: string,
) {
  const regularPrice = Number(regularPriceValue);
  const percentage = Number(percentageValue);
  if (
    regularPriceValue === "" ||
    percentageValue === "" ||
    !Number.isFinite(regularPrice) ||
    !Number.isFinite(percentage) ||
    regularPrice < 0 ||
    percentage < 0 ||
    percentage > 100
  ) return "";
  return (regularPrice * (1 - percentage / 100)).toFixed(2);
}

/** Show the percentage represented by an already-entered final discount price. */
export function discountPercentageFromPrice(
  regularPriceValue: string,
  discountPriceValue: string,
) {
  const regularPrice = Number(regularPriceValue);
  const discountPrice = Number(discountPriceValue);
  if (
    regularPriceValue === "" ||
    discountPriceValue === "" ||
    !Number.isFinite(regularPrice) ||
    !Number.isFinite(discountPrice) ||
    regularPrice <= 0 ||
    discountPrice < 0 ||
    discountPrice > regularPrice
  ) return "";
  return String(Number((((regularPrice - discountPrice) / regularPrice) * 100).toFixed(2)));
}

export const toApiDateTime = (value: string) =>
  value ? new Date(value).toISOString() : null;

export interface ValidatedEditorValues {
  regularPrice: number;
  discountPrice: number | null;
  costPrice: number | null;
  discountStartsAt: string | null;
  discountEndsAt: string | null;
}

interface ValidationInput {
  form: ProductFormState;
  variants: VariantDraft[];
  tiers: PriceTierDraft[];
  globalDiscountEnabled: boolean;
}

/**
 * Validate the complete editor before any write request starts.
 *
 * Keeping these rules outside React makes them reusable in tests and prevents a
 * partially-created product caused by discovering a bad SKU halfway through save.
 */
export function validateProductEditor(
  input: ValidationInput,
): { ok: false; error: string } | { ok: true; values: ValidatedEditorValues } {
  const { form, globalDiscountEnabled, tiers, variants } = input;
  const defaultVariant = variants.find((variant) => variant.isDefault) ?? variants[0];
  const regularPrice = Number(defaultVariant?.price || form.defaultPrice);
  const discountPrice = globalDiscountEnabled && form.discountPrice
    ? Number(form.discountPrice)
    : null;
  const costPrice = defaultVariant?.costPrice
    ? Number(defaultVariant.costPrice)
    : form.costPrice ? Number(form.costPrice) : null;
  const discountStartsAt = discountPrice === null ? null : toApiDateTime(form.discountStartsAt);
  const discountEndsAt = discountPrice === null ? null : toApiDateTime(form.discountEndsAt);

  if (!form.name.trim()) return { ok: false, error: "Enter the product name." };
  if (!form.categoryId) return { ok: false, error: "Choose a category." };
  if (!form.productTypeId) return { ok: false, error: "Choose a product type assigned to this category." };
  if (!defaultVariant || defaultVariant.price === "" || !Number.isFinite(regularPrice)) {
    return { ok: false, error: "Choose a default variant and enter its selling price." };
  }
  if (discountPrice !== null && discountPrice > regularPrice) {
    return { ok: false, error: "The discount price cannot be higher than the regular price." };
  }
  if (discountStartsAt && discountEndsAt && discountStartsAt > discountEndsAt) {
    return { ok: false, error: "The product offer end date must be after its start date." };
  }
  if (variants.length === 0 || variants.some((variant) => !variant.sku.trim())) {
    return { ok: false, error: "Add at least one variant and provide a unique SKU for every row." };
  }

  const normalizedSkus = variants.map((variant) => variant.sku.trim().toUpperCase());
  if (new Set(normalizedSkus).size !== normalizedSkus.length) {
    return { ok: false, error: "Every variant needs a unique SKU. Remove or rename the duplicate SKU before saving." };
  }

  const invalidPrice = variants.find((variant) =>
    variant.price === "" || !Number.isFinite(Number(variant.price)) || Number(variant.price) < 0,
  );
  if (invalidPrice) {
    return { ok: false, error: `${invalidPrice.optionLabel || invalidPrice.sku} needs a selling price.` };
  }

  const invalidInventory = variants.find((variant) => {
    const stock = Number(variant.stockQuantity);
    const lowStock = Number(variant.lowStockLevel || 0);
    return variant.stockQuantity === "" || !Number.isInteger(stock) || stock < 0 ||
      !Number.isInteger(lowStock) || lowStock < 0;
  });
  if (invalidInventory) {
    return { ok: false, error: `${invalidInventory.optionLabel || invalidInventory.sku} needs non-negative whole numbers for stock and low-stock warning.` };
  }

  const invalidCost = variants.find((variant) => variant.costPrice !== "" && (
    !Number.isFinite(Number(variant.costPrice)) || Number(variant.costPrice) < 0
  ));
  if (invalidCost) {
    return { ok: false, error: `${invalidCost.optionLabel || invalidCost.sku} contains an invalid cost price.` };
  }

  const invalidGlobalDiscount = discountPrice === null
    ? undefined
    : variants.find((variant) => !variant.discountPrice && discountPrice > Number(variant.price));
  if (invalidGlobalDiscount) {
    return { ok: false, error: `The all-variant discount is higher than ${invalidGlobalDiscount.optionLabel || invalidGlobalDiscount.sku}'s selling price.` };
  }

  const invalidVariantDiscount = variants.find((variant) => variant.discountPrice && (
    !Number.isFinite(Number(variant.discountPrice)) ||
    Number(variant.discountPrice) < 0 ||
    Number(variant.discountPrice) > Number(variant.price || regularPrice)
  ));
  if (invalidVariantDiscount) {
    return { ok: false, error: `${invalidVariantDiscount.optionLabel || invalidVariantDiscount.sku}'s discount price is higher than its selling price.` };
  }

  const invalidVariantSchedule = variants.find((variant) => {
    const startsAt = toApiDateTime(variant.discountStartsAt);
    const endsAt = toApiDateTime(variant.discountEndsAt);
    return startsAt && endsAt && startsAt > endsAt;
  });
  if (invalidVariantSchedule) {
    return { ok: false, error: `${invalidVariantSchedule.optionLabel || invalidVariantSchedule.sku}'s offer end date must be after its start date.` };
  }

  const tierSignatures = new Set<string>();
  for (const tier of tiers) {
    if (Number(tier.minimumQuantity) < 2 || tier.unitPrice === "") {
      return { ok: false, error: "Every block price needs a minimum quantity of 2 or more and a unit price." };
    }
    const signature = `${tier.variantKey}:${tier.minimumQuantity}`;
    if (tierSignatures.has(signature)) {
      return { ok: false, error: "The same price scope cannot contain duplicate minimum quantities." };
    }
    tierSignatures.add(signature);
  }

  return { ok: true,
    values: { costPrice, discountEndsAt, discountPrice, discountStartsAt, regularPrice },
  };
}
````

### `web/src/admin/product-editor/utils/variantCsv.ts`

Source lines: 392

````ts
/**
 * CSV interchange helpers for the product variant workbench.
 *
 * This module deliberately does not import the editor's VariantDraft type. The
 * editor can map its current (or future) draft shape to VariantCsvSource and
 * apply the returned VariantCsvPatch records without coupling CSV support to a
 * specific UI component.
 */

export type VariantCsvValue = string | number | null | undefined;

export interface VariantCsvSource {
  sku: string;
  barcode?: VariantCsvValue;
  optionLabel?: VariantCsvValue;
  optionValueIds?: readonly string[] | string | null;
  price?: VariantCsvValue;
  discountPrice?: VariantCsvValue;
  costPrice?: VariantCsvValue;
  stockQuantity?: VariantCsvValue;
  lowStockLevel?: VariantCsvValue;
  isActive?: boolean | null;
  isDefault?: boolean | null;
}

/**
 * Numeric values stay as validated strings so they can be assigned directly to
 * controlled form inputs without losing decimal precision or formatting.
 * Missing numeric/boolean cells are omitted from the patch.
 */
export interface VariantCsvPatch {
  sku: string;
  barcode?: string;
  optionLabel?: string;
  optionValueIds?: string[];
  price?: string;
  discountPrice?: string;
  costPrice?: string;
  stockQuantity?: string;
  lowStockLevel?: string;
  isActive?: boolean;
  isDefault?: boolean;
}

export interface VariantCsvError {
  /** One-based logical CSV row number; the header is row 1. */
  row: number;
  field?: keyof VariantCsvPatch | "csv";
  message: string;
  value?: string;
}

export interface VariantCsvParseResult {
  records: VariantCsvPatch[];
  errors: VariantCsvError[];
}

type ColumnKey = keyof VariantCsvPatch;
type DecimalPatchField =
  | "price"
  | "discountPrice"
  | "costPrice";
type IntegerPatchField = "stockQuantity" | "lowStockLevel";
type BooleanPatchField = "isActive" | "isDefault";

interface CsvColumn {
  key: ColumnKey;
  header: string;
  aliases?: readonly string[];
}

export const VARIANT_CSV_COLUMNS: readonly CsvColumn[] = [
  { key: "sku", header: "sku" },
  { key: "barcode", header: "barcode", aliases: ["gtin", "barcode_gtin"] },
  { key: "optionLabel", header: "option_label", aliases: ["variant", "variant_name", "option"] },
  { key: "optionValueIds", header: "option_value_ids", aliases: ["value_ids", "option_ids"] },
  { key: "price", header: "price", aliases: ["selling_price", "regular_price"] },
  { key: "discountPrice", header: "discount_price", aliases: ["discount", "sale_price"] },
  { key: "costPrice", header: "cost_price", aliases: ["cost"] },
  { key: "stockQuantity", header: "stock_quantity", aliases: ["stock", "quantity"] },
  { key: "lowStockLevel", header: "low_stock_level", aliases: ["low_stock", "low_stock_warning"] },
  { key: "isActive", header: "active", aliases: ["is_active", "status"] },
  { key: "isDefault", header: "default", aliases: ["is_default", "default_selection"] },
] as const;

const DECIMAL_FIELDS = new Set<DecimalPatchField>([
  "price",
  "discountPrice",
  "costPrice",
]);

const INTEGER_FIELDS = new Set<IntegerPatchField>(["stockQuantity", "lowStockLevel"]);
const BOOLEAN_FIELDS = new Set<BooleanPatchField>(["isActive", "isDefault"]);

const isDecimalField = (key: ColumnKey): key is DecimalPatchField =>
  DECIMAL_FIELDS.has(key as DecimalPatchField);
const isIntegerField = (key: ColumnKey): key is IntegerPatchField =>
  INTEGER_FIELDS.has(key as IntegerPatchField);
const isBooleanField = (key: ColumnKey): key is BooleanPatchField =>
  BOOLEAN_FIELDS.has(key as BooleanPatchField);

const normalizeHeader = (value: string) =>
  value
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const columnByHeader = new Map<string, CsvColumn>(
  VARIANT_CSV_COLUMNS.flatMap((column) =>
    [column.header, ...(column.aliases ?? [])].map(
      (header) => [normalizeHeader(header), column] as const,
    ),
  ),
);

const escapeCsvCell = (value: string) =>
  /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;

const sourceValue = (variant: VariantCsvSource, key: ColumnKey): string => {
  if (key === "optionValueIds") {
    const ids = variant.optionValueIds;
    if (Array.isArray(ids)) return ids.join("|");
    return ids == null ? "" : String(ids);
  }
  if (key === "isActive" || key === "isDefault") {
    const value = variant[key];
    return value == null ? "" : value ? "true" : "false";
  }
  const value = variant[key];
  return value == null ? "" : String(value);
};

/** Serializes variant-like records using a stable, machine-readable header. */
export const exportVariantsToCsv = (variants: readonly VariantCsvSource[]): string => {
  const header = VARIANT_CSV_COLUMNS.map((column) => column.header).join(",");
  const rows = variants.map((variant) =>
    VARIANT_CSV_COLUMNS.map((column) =>
      escapeCsvCell(sourceValue(variant, column.key)),
    ).join(","),
  );
  return [header, ...rows].join("\r\n");
};

interface ParsedCsv {
  rows: string[][];
  error?: string;
}

/** Parses RFC-4180-style commas, escaped quotes, and quoted line breaks. */
const parseCsvRows = (csv: string): ParsedCsv => {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  let quoteClosed = false;

  const pushCell = () => {
    row.push(cell);
    cell = "";
    quoteClosed = false;
  };
  const pushRow = () => {
    pushCell();
    rows.push(row);
    row = [];
  };

  for (let index = 0; index < csv.length; index += 1) {
    const character = csv[index];

    if (inQuotes) {
      if (character === '"') {
        if (csv[index + 1] === '"') {
          cell += '"';
          index += 1;
        } else {
          inQuotes = false;
          quoteClosed = true;
        }
      } else if (character === "\r") {
        if (csv[index + 1] === "\n") index += 1;
        cell += "\n";
      } else {
        cell += character;
      }
      continue;
    }

    if (quoteClosed) {
      if (character === ",") {
        pushCell();
      } else if (character === "\n" || character === "\r") {
        if (character === "\r" && csv[index + 1] === "\n") index += 1;
        pushRow();
      } else if (character !== " " && character !== "\t") {
        return { rows: [], error: "Unexpected character after a closing quote." };
      }
      continue;
    }

    if (character === '"') {
      if (cell.length > 0) {
        return { rows: [], error: "A quoted field must begin with a quote." };
      }
      inQuotes = true;
    } else if (character === ",") {
      pushCell();
    } else if (character === "\n" || character === "\r") {
      if (character === "\r" && csv[index + 1] === "\n") index += 1;
      pushRow();
    } else {
      cell += character;
    }
  }

  if (inQuotes) return { rows: [], error: "The CSV ends inside a quoted field." };
  if (cell.length > 0 || row.length > 0 || quoteClosed) pushRow();

  return { rows };
};

const parseBoolean = (value: string): boolean | undefined => {
  const normalized = value.trim().toLowerCase();
  if (["true", "yes", "y", "1", "active"].includes(normalized)) return true;
  if (["false", "no", "n", "0", "inactive"].includes(normalized)) return false;
  return undefined;
};

const parseOptionValueIds = (value: string): string[] | undefined => {
  const trimmed = value.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith("[")) {
    try {
      const parsed: unknown = JSON.parse(trimmed);
      if (!Array.isArray(parsed) || parsed.some((item) => typeof item !== "string")) {
        return undefined;
      }
      return [...new Set(parsed.map((item) => item.trim()).filter(Boolean))];
    } catch {
      return undefined;
    }
  }

  return [...new Set(trimmed.split(/[|;]/).map((item) => item.trim()).filter(Boolean))];
};

const isBlankRow = (row: readonly string[]) => row.every((value) => value.trim() === "");

/**
 * Parses CSV into validated patches. Invalid rows are excluded from `records`
 * and described in `errors`, allowing the UI to show all problems at once.
 */
export const parseVariantCsv = (csv: string): VariantCsvParseResult => {
  const parsed = parseCsvRows(csv);
  if (parsed.error) {
    return { records: [], errors: [{ row: 1, field: "csv", message: parsed.error }] };
  }

  const nonEmptyRows = parsed.rows.filter((row) => !isBlankRow(row));
  if (nonEmptyRows.length === 0) {
    return { records: [], errors: [{ row: 1, field: "csv", message: "The CSV file is empty." }] };
  }

  const [headerRow, ...dataRows] = nonEmptyRows;
  const columns = headerRow.map((header) => columnByHeader.get(normalizeHeader(header)));
  const errors: VariantCsvError[] = [];
  const seenColumns = new Set<ColumnKey>();

  columns.forEach((column, index) => {
    if (!column) return;
    if (seenColumns.has(column.key)) {
      errors.push({
        row: 1,
        field: column.key,
        value: headerRow[index],
        message: `The ${column.header} column appears more than once.`,
      });
    }
    seenColumns.add(column.key);
  });

  if (!seenColumns.has("sku")) {
    errors.push({ row: 1, field: "sku", message: "A sku column is required." });
  }
  if (errors.length > 0) return { records: [], errors };

  const records: VariantCsvPatch[] = [];
  const seenSkus = new Set<string>();

  dataRows.forEach((row, dataIndex) => {
    const rowNumber = dataIndex + 2;
    const rowErrors: VariantCsvError[] = [];
    const patch: VariantCsvPatch = { sku: "" };

    if (row.length > headerRow.length) {
      rowErrors.push({
        row: rowNumber,
        field: "csv",
        message: "This row contains more values than the header.",
      });
    }

    columns.forEach((column, columnIndex) => {
      if (!column) return;
      const rawValue = row[columnIndex] ?? "";
      const value = rawValue.trim();

      if (column.key === "sku") {
        patch.sku = value.toUpperCase();
        if (!patch.sku) {
          rowErrors.push({ row: rowNumber, field: "sku", message: "SKU is required." });
        }
        return;
      }

      if (column.key === "barcode" || column.key === "optionLabel") {
        patch[column.key] = value;
        return;
      }

      if (column.key === "optionValueIds") {
        const ids = parseOptionValueIds(rawValue);
        if (!ids) {
          rowErrors.push({
            row: rowNumber,
            field: column.key,
            value: rawValue,
            message: "Option value IDs must use | or ; separators, or a JSON string array.",
          });
        } else {
          patch.optionValueIds = ids;
        }
        return;
      }

      if (isDecimalField(column.key) || isIntegerField(column.key)) {
        if (!value) return;
        const numberValue = Number(value);
        const requiresInteger = isIntegerField(column.key);
        if (!Number.isFinite(numberValue) || numberValue < 0 || (requiresInteger && !Number.isInteger(numberValue))) {
          rowErrors.push({
            row: rowNumber,
            field: column.key,
            value: rawValue,
            message: requiresInteger
              ? "Enter a non-negative whole number."
              : "Enter a non-negative number.",
          });
        } else {
          patch[column.key] = value;
        }
        return;
      }

      if (isBooleanField(column.key)) {
        if (!value) return;
        const booleanValue = parseBoolean(value);
        if (booleanValue === undefined) {
          rowErrors.push({
            row: rowNumber,
            field: column.key,
            value: rawValue,
            message: "Use true/false, yes/no, 1/0, or active/inactive.",
          });
        } else {
          patch[column.key] = booleanValue;
        }
      }
    });

    if (patch.sku) {
      if (seenSkus.has(patch.sku)) {
        rowErrors.push({
          row: rowNumber,
          field: "sku",
          value: patch.sku,
          message: "SKU appears more than once in this CSV file.",
        });
      } else {
        seenSkus.add(patch.sku);
      }
    }

    if (rowErrors.length > 0) errors.push(...rowErrors);
    else records.push(patch);
  });

  return { records, errors };
};
````

### `web/src/admin/product-editor/utils/variantPaths.ts`

Source lines: 129

````ts
import type { ProductTypeAttributeAssignment } from "../../../api/adminCatalog";

export const SKIP_OPTION_VALUE = "__skip_option_value__";

export interface VariantPathSource {
  key: string;
  optionValueIds: string[];
}

export interface VariantPathStockSource extends VariantPathSource {
  stockQuantity: string | number;
}

export interface VariantPathNode {
  valueId: string;
  label: string;
  code: string;
  colorHex: string | null;
  attributeId: string;
  attributeName: string;
  variantKeys: string[];
  terminalVariantKeys: string[];
  children: VariantPathNode[];
}

export const variantPathSignature = (ids: string[]) => [...ids].sort().join(":");

export function changeVariantPathSelection(
  assignments: ProductTypeAttributeAssignment[],
  current: Record<string, string>,
  attributeId: string,
  valueId: string,
) {
  const changedIndex = assignments.findIndex((item) => item.attributeId === attributeId);
  if (changedIndex < 0) return current;

  const next = { ...current, [attributeId]: valueId };
  for (const assignment of assignments.slice(changedIndex + 1)) {
    delete next[assignment.attributeId];
  }
  return next;
}

export function selectedVariantPathIds(
  assignments: ProductTypeAttributeAssignment[],
  selection: Record<string, string>,
) {
  return assignments.flatMap((assignment) => {
    const valueId = selection[assignment.attributeId];
    return valueId && valueId !== SKIP_OPTION_VALUE ? [valueId] : [];
  });
}

export function clearDeepestVariantPathChoice(
  assignments: ProductTypeAttributeAssignment[],
  current: Record<string, string>,
) {
  const next = { ...current };
  const deepest = [...assignments]
    .reverse()
    .find((assignment) => Object.hasOwn(current, assignment.attributeId));
  if (deepest) delete next[deepest.attributeId];
  return next;
}

export function buildVariantPathTree(
  assignments: ProductTypeAttributeAssignment[],
  variants: VariantPathSource[],
): VariantPathNode[] {
  const assignmentOrder = new Map(
    assignments.map((assignment, index) => [assignment.attributeId, index]),
  );
  const valueDetails = new Map(assignments.flatMap((assignment) =>
    assignment.attribute.values.map((value) => [value.id, {
      ...value,
      attributeId: assignment.attributeId,
      attributeName: assignment.attribute.name,
    }] as const),
  ));
  const roots: VariantPathNode[] = [];

  for (const variant of variants) {
    const values = variant.optionValueIds
      .map((id) => valueDetails.get(id))
      .filter((value): value is NonNullable<typeof value> => Boolean(value))
      .sort((left, right) =>
        (assignmentOrder.get(left.attributeId) ?? 0) -
        (assignmentOrder.get(right.attributeId) ?? 0),
      );

    let siblings = roots;
    let lastNode: VariantPathNode | null = null;
    for (const value of values) {
      let node = siblings.find((item) => item.valueId === value.id);
      if (!node) {
        node = {
          valueId: value.id,
          label: value.label,
          code: value.code,
          colorHex: value.colorHex,
          attributeId: value.attributeId,
          attributeName: value.attributeName,
          variantKeys: [],
          terminalVariantKeys: [],
          children: [],
        };
        siblings.push(node);
      }
      node.variantKeys.push(variant.key);
      lastNode = node;
      siblings = node.children;
    }
    lastNode?.terminalVariantKeys.push(variant.key);
  }

  return roots;
}

export function analyzeVariantPathRemoval<T extends VariantPathStockSource>(
  variantKeys: string[],
  variants: T[],
) {
  const keySet = new Set(variantKeys);
  const affected = variants.filter((variant) => keySet.has(variant.key));
  return {
    affected,
    stocked: affected.filter((variant) => Number(variant.stockQuantity) > 0),
  };
}
````

### `web/src/admin/products/AdminProductsPage.tsx`

Source lines: 68

````tsx
import React, { useEffect, useState } from "react";
import { AlertCircle, Plus } from "lucide-react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";

import { AdminProductSearch } from "./components/AdminProductSearch";
import { AdminProductsTable } from "./components/AdminProductsTable";
import { useAdminProducts } from "./hooks/useAdminProducts";

interface ProductLocationState {
  success?: string;
}

/** Thin page: reads the URL, composes product components, and owns page actions. */
export const AdminProductsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("search")?.trim() ?? "";
  const { error, loading, products } = useAdminProducts(search);
  const [success] = useState(
    () => (location.state as ProductLocationState | null)?.success ?? "",
  );

  useEffect(() => {
    if (!success) return;
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, navigate, success]);

  const updateSearch = (nextSearch: string) => {
    const nextParams = new URLSearchParams(searchParams);
    const normalizedSearch = nextSearch.trim();

    if (normalizedSearch) nextParams.set("search", normalizedSearch);
    else nextParams.delete("search");

    setSearchParams(nextParams, { replace: true });
  };

  return (
    <div className="dashboard-container admin-catalog admin-page">
      <header className="admin-page-header">
        <div>
          <p className="eyebrow">Catalog</p>
          <h1>Products</h1>
          <p>Manage product information, prices, stock, variants, and media.</p>
        </div>
        <Link className="btn btn-primary" to="/admin/products/new">
          <Plus size={18} /> Add product
        </Link>
      </header>

      {error && <div className="alert alert-error"><AlertCircle size={18} />{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <section className="admin-products-panel">
        <div className="admin-panel-heading">
          <div>
            <h2>{search ? `Results for “${search}”` : "Catalog"}</h2>
            <p>{products.length} product{products.length === 1 ? "" : "s"}</p>
          </div>
          <AdminProductSearch value={search} onSearch={updateSearch} />
        </div>

        <AdminProductsTable loading={loading} products={products} search={search} />
      </section>
    </div>
  );
};
````

### `web/src/admin/products/components/AdminProductSearch.module.css`

Source lines: 61

````css
.form {
  width: min(100%, 34rem);
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.35rem;
  padding-left: 0.8rem;
  border: 1px solid var(--border);
  border-radius: 0.7rem;
  color: var(--text-muted);
  background: #f8fafc;
  transition: border-color 0.18s ease, background 0.18s ease, box-shadow 0.18s ease;
}

.form:focus-within {
  border-color: var(--admin-accent);
  background: var(--surface);
  box-shadow: 0 0 0 3px rgb(59 130 246 / 12%);
}

.form input {
  min-width: 0;
  flex: 1;
  border: 0;
  outline: 0;
  color: var(--text-main);
  background: transparent;
  font: inherit;
}

.clearButton {
  width: 2rem;
  height: 2rem;
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 0.45rem;
  color: var(--text-muted);
  background: transparent;
  cursor: pointer;
}

.clearButton:hover {
  color: var(--text-main);
  background: var(--bg-color);
}

.submitButton {
  width: auto;
  min-height: 2.35rem;
  flex: 0 0 auto;
  padding: 0.55rem 1rem;
}

@media (max-width: 600px) {
  .form {
    width: 100%;
  }
}
````

### `web/src/admin/products/components/AdminProductSearch.tsx`

Source lines: 55

````tsx
import React, { useEffect, useState } from "react";
import { Search, X } from "lucide-react";

import styles from "./AdminProductSearch.module.css";

interface Props {
  value: string;
  onSearch: (value: string) => void;
}

/** Search form for the admin catalog. The parent owns the URL value. */
export const AdminProductSearch: React.FC<Props> = ({ value, onSearch }) => {
  const [input, setInput] = useState(value);

  useEffect(() => {
    setInput(value);
  }, [value]);

  const clear = () => {
    setInput("");
    onSearch("");
  };

  return (
    <form
      className={styles.form}
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        onSearch(input);
      }}
    >
      <Search size={18} aria-hidden="true" />
      <label className="sr-only" htmlFor="admin-product-search">Search products</label>
      <input
        id="admin-product-search"
        type="search"
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder="Search name, SKU, category or brand"
        autoComplete="off"
      />

      {input && (
        <button className={styles.clearButton} type="button" onClick={clear} aria-label="Clear product search">
          <X size={16} aria-hidden="true" />
        </button>
      )}

      <button className={`btn btn-primary ${styles.submitButton}`} type="submit">
        Search
      </button>
    </form>
  );
};
````

### `web/src/admin/products/components/AdminProductsTable.tsx`

Source lines: 90

````tsx
import React from "react";
import { ExternalLink, Package, Pencil } from "lucide-react";
import { Link } from "react-router-dom";

import { AdminProduct } from "../../../api/adminProducts";

const priceFormatter = new Intl.NumberFormat("en-BD", {
  style: "currency",
  currency: "BDT",
  minimumFractionDigits: 0,
});

interface Props {
  loading: boolean;
  products: AdminProduct[];
  search: string;
}

/** Handles every visual state of the product list: loading, empty, and populated. */
export const AdminProductsTable: React.FC<Props> = ({ loading, products, search }) => {
  if (loading) return <div className="admin-empty-state">Loading products...</div>;

  if (products.length === 0) {
    return (
      <div className="admin-empty-state">
        <Package size={36} />
        <h3>{search ? "No matching products" : "No products yet"}</h3>
        <p>
          {search
            ? `No product matched “${search}”. Try another name, SKU, category, or brand.`
            : "Add the first product to start building the catalog."}
        </p>
      </div>
    );
  }

  return (
    <div className="admin-table-wrap">
      <table className="admin-product-table">
        <thead>
          <tr>
            <th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th>
            <th><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            const primaryMedia = product.primaryImage ?? product.media?.[0];

            return (
              <tr key={product.id}>
                <td>
                  <div className="admin-product-identity">
                    <div className="admin-product-thumbnail" aria-hidden="true">
                      {primaryMedia?.type === "VIDEO" ? (
                        <video src={primaryMedia.url} muted preload="metadata" />
                      ) : primaryMedia ? (
                        <img src={primaryMedia.thumbnailUrl || primaryMedia.url} alt="" loading="lazy" />
                      ) : (
                        <Package size={20} />
                      )}
                    </div>
                    <div className="admin-product-copy">
                      <strong>{product.name}</strong>
                      <span className="admin-product-brand">{product.brand?.name || "Unbranded"}</span>
                    </div>
                  </div>
                </td>
                <td>{product.category.name}</td>
                <td>{priceFormatter.format(Number(product.price))}</td>
                <td><span className={product.stockQuantity > 0 ? "stock-in" : "stock-out"}>{product.stockQuantity}</span></td>
                <td><span className={`status-pill status-${product.status.toLowerCase()}`}>{product.status}</span></td>
                <td>
                  <div className="admin-row-actions">
                    <Link className="admin-view-link" to={`/admin/products/${product.id}/edit`} title={`Edit ${product.name}`} aria-label={`Edit ${product.name}`}>
                      <Pencil size={17} />
                    </Link>
                    <Link className="admin-view-link" to={`/products/${product.slug}`} title="View storefront product" aria-label={`View ${product.name} on storefront`}>
                      <ExternalLink size={17} />
                    </Link>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
````

### `web/src/admin/products/hooks/useAdminProducts.ts`

Source lines: 35

````ts
import { useCallback, useEffect, useState } from "react";

import { AdminProduct, adminProductApi } from "../../../api/adminProducts";
import { ApiException } from "../../../api/client";

/** Owns product-list loading so the page only describes its layout and actions. */
export function useAdminProducts(search: string) {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await adminProductApi.getProducts(search);
      setProducts(result.products);
    } catch (requestError) {
      setError(
        requestError instanceof ApiException
          ? requestError.error.message
          : "Could not load the product catalog.",
      );
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  return { error, loading, products, reload: loadProducts };
}
````

### `web/src/admin/products/index.ts`

Source lines: 1

````ts
export { AdminProductsPage } from "./AdminProductsPage";
````

## Admin category, product type, brand, and attribute management

Contains the catalog pages that supply the product editor's selectable categories, allowed product types, global brands, reusable attributes, and attribute values.

### `web/src/pages/admin/AdminCatalogSettingsPage.tsx`

Source lines: 571

````tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  RotateCcw,
  Tags,
  Trash2,
  X,
} from "lucide-react";

import {
  AdminBrand,
  AdminCategory,
  AdminProductType,
  adminCatalogApi,
  SaveBrandInput,
  SaveCategoryInput,
  SaveProductTypeInput,
} from "../../api/adminCatalog";
import { ApiException } from "../../api/client";

export type AdminCatalogSection = "categories" | "brands" | "product-types";

interface AdminCatalogSettingsPageProps {
  section: AdminCatalogSection;
}

interface CategoryFormState {
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  parentId: string;
  sortOrder: string;
  isActive: boolean;
  allowProducts: boolean;
  showOnHomepage: boolean;
}

interface BrandFormState {
  name: string;
  slug: string;
  description: string;
  logoUrl: string;
  isActive: boolean;
}

interface ProductTypeFormState {
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
}

const emptyCategoryForm: CategoryFormState = {
  name: "",
  slug: "",
  description: "",
  imageUrl: "",
  parentId: "",
  sortOrder: "0",
  isActive: true,
  allowProducts: true,
  showOnHomepage: false,
};

const emptyBrandForm: BrandFormState = {
  name: "",
  slug: "",
  description: "",
  logoUrl: "",
  isActive: true,
};

const emptyProductTypeForm: ProductTypeFormState = {
  name: "",
  slug: "",
  description: "",
  isActive: true,
};

function requestMessage(error: unknown, fallback: string) {
  return error instanceof ApiException ? error.error.message : fallback;
}

const pageCopy: Record<AdminCatalogSection, { eyebrow: string; title: string; description: string }> = {
  categories: {
    eyebrow: "Catalog organization",
    title: "Categories",
    description: "Control where products appear and which categories are featured on the homepage.",
  },
  brands: {
    eyebrow: "Catalog identity",
    title: "Brands",
    description: "Manage the reusable manufacturers that can be attached to products.",
  },
  "product-types": {
    eyebrow: "Catalog structure",
    title: "Product types",
    description: "Define the product structures that receive reusable properties and variants.",
  },
};

export const AdminCatalogSettingsPage: React.FC<AdminCatalogSettingsPageProps> = ({ section }) => {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [brands, setBrands] = useState<AdminBrand[]>([]);
  const [productTypes, setProductTypes] = useState<AdminProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [categoryEditorOpen, setCategoryEditorOpen] = useState(false);
  const [brandEditorOpen, setBrandEditorOpen] = useState(false);
  const [productTypeEditorOpen, setProductTypeEditorOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingBrandId, setEditingBrandId] = useState<string | null>(null);
  const [editingProductTypeId, setEditingProductTypeId] = useState<string | null>(null);
  const [categoryForm, setCategoryForm] = useState<CategoryFormState>(emptyCategoryForm);
  const [brandForm, setBrandForm] = useState<BrandFormState>(emptyBrandForm);
  const [productTypeForm, setProductTypeForm] = useState<ProductTypeFormState>(emptyProductTypeForm);
  const [categoryProductTypeIds, setCategoryProductTypeIds] = useState<string[]>([]);
  const copy = pageCopy[section];

  const loadReferences = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [categoryResult, brandResult, productTypeResult] = await Promise.all([
        section === "categories" ? adminCatalogApi.getCategories(true) : Promise.resolve([]),
        section === "brands" ? adminCatalogApi.getBrands(true) : Promise.resolve([]),
        section === "product-types" || section === "categories" ? adminCatalogApi.getProductTypes(true) : Promise.resolve([]),
      ]);
      setCategories(categoryResult);
      setBrands(brandResult);
      setProductTypes(productTypeResult);
    } catch (requestError) {
      setError(requestMessage(requestError, "Could not load catalog settings."));
    } finally {
      setLoading(false);
    }
  }, [section]);

  useEffect(() => {
    loadReferences();
  }, [loadReferences]);

  const activeParentOptions = useMemo(() => {
    const disallowedIds = new Set<string>();
    if (editingCategoryId) {
      disallowedIds.add(editingCategoryId);
      let changed = true;
      while (changed) {
        changed = false;
        for (const category of categories) {
          if (category.parentId && disallowedIds.has(category.parentId) && !disallowedIds.has(category.id)) {
            disallowedIds.add(category.id);
            changed = true;
          }
        }
      }
    }
    return categories.filter(
      (category) => !category.deletedAt && category.isActive && !disallowedIds.has(category.id),
    );
  },
    [categories, editingCategoryId],
  );

  const closeCategoryEditor = () => {
    setCategoryEditorOpen(false);
    setEditingCategoryId(null);
    setCategoryForm(emptyCategoryForm);
    setCategoryProductTypeIds([]);
  };

  const closeBrandEditor = () => {
    setBrandEditorOpen(false);
    setEditingBrandId(null);
    setBrandForm(emptyBrandForm);
  };

  const closeProductTypeEditor = () => {
    setProductTypeEditorOpen(false);
    setEditingProductTypeId(null);
    setProductTypeForm(emptyProductTypeForm);
  };

  const startNewCategory = () => {
    setError("");
    setSuccess("");
    setEditingCategoryId(null);
    setCategoryForm(emptyCategoryForm);
    setCategoryProductTypeIds([]);
    setCategoryEditorOpen(true);
  };

  const editCategory = async (category: AdminCategory) => {
    setError("");
    setSuccess("");
    setEditingCategoryId(category.id);
    setCategoryForm({
      name: category.name,
      slug: category.slug,
      description: category.description ?? "",
      imageUrl: category.imageUrl ?? "",
      parentId: category.parentId ?? "",
      sortOrder: String(category.sortOrder),
      isActive: category.isActive,
      allowProducts: category.allowProducts,
      showOnHomepage: category.showOnHomepage,
    });
    setCategoryEditorOpen(true);
    setBusy(true);
    try {
      const assignment = await adminCatalogApi.getCategoryProductTypes(category.id);
      setCategoryProductTypeIds(assignment.productTypeIds);
    } catch (requestError) {
      setError(requestMessage(requestError, "Could not load this category's product types."));
    } finally {
      setBusy(false);
    }
  };

  const saveCategory = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");

    if (categoryForm.allowProducts && categoryProductTypeIds.length === 0) {
      setError("Choose at least one product type for this category.");
      setBusy(false);
      return;
    }

    const input: SaveCategoryInput = {
      name: categoryForm.name,
      ...(categoryForm.slug.trim() ? { slug: categoryForm.slug.trim() } : {}),
      description: categoryForm.description.trim() || null,
      imageUrl: categoryForm.imageUrl.trim() || null,
      parentId: categoryForm.parentId || null,
      sortOrder: Number(categoryForm.sortOrder),
      isActive: categoryForm.isActive,
      allowProducts: categoryForm.allowProducts,
      showOnHomepage: categoryForm.showOnHomepage,
    };

    try {
      let savedCategory: AdminCategory;
      if (editingCategoryId) {
        savedCategory = await adminCatalogApi.updateCategory(editingCategoryId, input);
      } else {
        savedCategory = await adminCatalogApi.createCategory(input);
      }
      await adminCatalogApi.setCategoryProductTypes(
        savedCategory.id,
        categoryForm.allowProducts ? categoryProductTypeIds : [],
      );
      setSuccess(editingCategoryId ? "Category and product types updated." : "Category created with its product types.");
      closeCategoryEditor();
      await loadReferences();
    } catch (requestError) {
      setError(requestMessage(requestError, "Could not save the category."));
    } finally {
      setBusy(false);
    }
  };

  const removeCategory = async (category: AdminCategory) => {
    if (!window.confirm(`Delete the category “${category.name}”? You can restore it later.`)) return;
    setBusy(true);
    setError("");
    try {
      await adminCatalogApi.deleteCategory(category.id);
      setSuccess("Category deleted. It can be restored from this page.");
      await loadReferences();
    } catch (requestError) {
      setError(requestMessage(requestError, "Could not delete the category."));
    } finally {
      setBusy(false);
    }
  };

  const restoreCategory = async (category: AdminCategory) => {
    setBusy(true);
    setError("");
    try {
      await adminCatalogApi.restoreCategory(category.id);
      setSuccess("Category restored.");
      await loadReferences();
    } catch (requestError) {
      setError(requestMessage(requestError, "Could not restore the category."));
    } finally {
      setBusy(false);
    }
  };

  const startNewBrand = () => {
    setError("");
    setSuccess("");
    setEditingBrandId(null);
    setBrandForm(emptyBrandForm);
    setBrandEditorOpen(true);
  };

  const editBrand = (brand: AdminBrand) => {
    setError("");
    setSuccess("");
    setEditingBrandId(brand.id);
    setBrandForm({
      name: brand.name,
      slug: brand.slug,
      description: brand.description ?? "",
      logoUrl: brand.logoUrl ?? "",
      isActive: brand.isActive,
    });
    setBrandEditorOpen(true);
  };

  const saveBrand = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");

    const input: SaveBrandInput = {
      name: brandForm.name,
      ...(brandForm.slug.trim() ? { slug: brandForm.slug.trim() } : {}),
      logoUrl: brandForm.logoUrl.trim() || null,
      description: brandForm.description.trim() || null,
      isActive: brandForm.isActive,
    };

    try {
      if (editingBrandId) {
        await adminCatalogApi.updateBrand(editingBrandId, input);
        setSuccess("Brand updated.");
      } else {
        await adminCatalogApi.createBrand(input);
        setSuccess("Brand created.");
      }
      closeBrandEditor();
      await loadReferences();
    } catch (requestError) {
      setError(requestMessage(requestError, "Could not save the brand."));
    } finally {
      setBusy(false);
    }
  };

  const removeBrand = async (brand: AdminBrand) => {
    if (!window.confirm(`Delete the brand “${brand.name}”? You can restore it later.`)) return;
    setBusy(true);
    setError("");
    try {
      await adminCatalogApi.deleteBrand(brand.id);
      setSuccess("Brand deleted. Existing product history remains unchanged.");
      await loadReferences();
    } catch (requestError) {
      setError(requestMessage(requestError, "Could not delete the brand."));
    } finally {
      setBusy(false);
    }
  };

  const restoreBrand = async (brand: AdminBrand) => {
    setBusy(true);
    setError("");
    try {
      await adminCatalogApi.restoreBrand(brand.id);
      setSuccess("Brand restored.");
      await loadReferences();
    } catch (requestError) {
      setError(requestMessage(requestError, "Could not restore the brand."));
    } finally {
      setBusy(false);
    }
  };

  const startNewProductType = () => {
    setError("");
    setSuccess("");
    setEditingProductTypeId(null);
    setProductTypeForm(emptyProductTypeForm);
    setProductTypeEditorOpen(true);
  };

  const editProductType = (type: AdminProductType) => {
    setError("");
    setSuccess("");
    setEditingProductTypeId(type.id);
    setProductTypeForm({
      name: type.name,
      slug: type.slug,
      description: type.description ?? "",
      isActive: type.isActive,
    });
    setProductTypeEditorOpen(true);
  };

  const saveProductType = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    const input: SaveProductTypeInput = {
      name: productTypeForm.name,
      ...(productTypeForm.slug.trim() ? { slug: productTypeForm.slug.trim() } : {}),
      description: productTypeForm.description.trim() || null,
      isActive: productTypeForm.isActive,
    };
    try {
      if (editingProductTypeId) {
        await adminCatalogApi.updateProductType(editingProductTypeId, input);
      } else {
        await adminCatalogApi.createProductType(input);
      }
      setSuccess(editingProductTypeId ? "Product type updated." : "Product type created. Assign it directly from a category when needed.");
      closeProductTypeEditor();
      await loadReferences();
    } catch (requestError) {
      setError(requestMessage(requestError, "Could not save the product type."));
    } finally {
      setBusy(false);
    }
  };

  const removeProductType = async (type: AdminProductType) => {
    if (!window.confirm(`Delete the product type “${type.name}”? You can restore it later.`)) return;
    setBusy(true);
    setError("");
    try {
      await adminCatalogApi.deleteProductType(type.id);
      setSuccess("Product type deleted.");
      await loadReferences();
    } catch (requestError) {
      setError(requestMessage(requestError, "Could not delete the product type."));
    } finally {
      setBusy(false);
    }
  };

  const restoreProductType = async (type: AdminProductType) => {
    setBusy(true);
    setError("");
    try {
      await adminCatalogApi.restoreProductType(type.id);
      setSuccess("Product type restored.");
      await loadReferences();
    } catch (requestError) {
      setError(requestMessage(requestError, "Could not restore the product type."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="dashboard-container admin-catalog admin-taxonomy-page admin-page">
      <header className="admin-page-header">
        <div>
          <p className="eyebrow">{copy.eyebrow}</p>
          <h1>{copy.title}</h1>
          <p>{copy.description}</p>
        </div>
      </header>

      {error && <div className="alert alert-error"><AlertCircle size={18} />{error}</div>}
      {success && <div className="alert alert-success"><CheckCircle size={18} />{success}</div>}

      <div className="admin-taxonomy-grid is-single">
        {section === "categories" && <section className="admin-products-panel">
          <div className="admin-panel-heading">
            <div>
              <h2>Categories</h2>
              <p>Choose which active categories appear on the homepage.</p>
            </div>
            <button type="button" className="btn btn-primary" onClick={startNewCategory}>
              <Plus size={17} /> Add category
            </button>
          </div>

          {categoryEditorOpen && (
            <form className="admin-reference-form" onSubmit={saveCategory}>
              <div className="admin-form-heading">
                <h2>{editingCategoryId ? "Edit category" : "New category"}</h2>
                <button type="button" className="admin-view-link" onClick={closeCategoryEditor} aria-label="Close category editor"><X size={18} /></button>
              </div>
              <div className="admin-reference-form-grid">
                <div className="form-group"><label htmlFor="category-name">Name</label><input id="category-name" className="form-input" value={categoryForm.name} onChange={(event) => setCategoryForm((current) => ({ ...current, name: event.target.value }))} minLength={2} maxLength={100} required /></div>
                <div className="form-group"><label htmlFor="category-slug">Slug <small>(optional)</small></label><input id="category-slug" className="form-input" value={categoryForm.slug} onChange={(event) => setCategoryForm((current) => ({ ...current, slug: event.target.value.toLowerCase() }))} maxLength={120} placeholder="created-from-name" /></div>
                <div className="form-group"><label htmlFor="category-parent">Parent category</label><select id="category-parent" className="form-input" value={categoryForm.parentId} onChange={(event) => setCategoryForm((current) => ({ ...current, parentId: event.target.value }))}><option value="">No parent</option>{activeParentOptions.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></div>
                <div className="form-group"><label htmlFor="category-order">Display order</label><input id="category-order" className="form-input" type="number" min="0" step="1" value={categoryForm.sortOrder} onChange={(event) => setCategoryForm((current) => ({ ...current, sortOrder: event.target.value }))} required /></div>
                <div className="form-group admin-reference-field-wide"><label htmlFor="category-image">Image URL</label><input id="category-image" className="form-input" type="url" value={categoryForm.imageUrl} onChange={(event) => setCategoryForm((current) => ({ ...current, imageUrl: event.target.value }))} placeholder="https://example.com/category.webp" /></div>
                <div className="form-group admin-reference-field-wide"><label htmlFor="category-description">Description</label><textarea id="category-description" className="form-input admin-textarea" value={categoryForm.description} onChange={(event) => setCategoryForm((current) => ({ ...current, description: event.target.value }))} /></div>
                <fieldset className="admin-reference-assignment admin-reference-field-wide">
                  <legend>Direct product types {categoryForm.allowProducts && <span>*</span>}</legend>
                  <p>Only these types are available for products assigned directly to this category. Child categories keep their own assignments.</p>
                  <div className="admin-reference-checklist">
                    {productTypes.filter((type) => type.isActive && !type.deletedAt).map((type) => <label key={type.id}><input type="checkbox" checked={categoryProductTypeIds.includes(type.id)} onChange={(event) => setCategoryProductTypeIds((current) => event.target.checked ? [...current, type.id] : current.filter((id) => id !== type.id))} /> {type.name}</label>)}
                  </div>
                </fieldset>
              </div>
              <div className="admin-reference-options">
                <label className="admin-checkbox"><input type="checkbox" checked={categoryForm.isActive} onChange={(event) => setCategoryForm((current) => ({ ...current, isActive: event.target.checked }))} /> Active category</label>
                <label className="admin-checkbox"><input type="checkbox" checked={categoryForm.allowProducts} onChange={(event) => { const allowProducts = event.target.checked; setCategoryForm((current) => ({ ...current, allowProducts })); if (!allowProducts) setCategoryProductTypeIds([]); }} /> Allow products directly in this category</label>
                <label className="admin-checkbox"><input type="checkbox" checked={categoryForm.showOnHomepage} onChange={(event) => setCategoryForm((current) => ({ ...current, showOnHomepage: event.target.checked }))} /> Show on homepage</label>
              </div>
              <div className="admin-form-actions"><button type="button" className="btn btn-ghost" onClick={closeCategoryEditor}>Cancel</button><button className="btn btn-primary" disabled={busy}>{busy ? "Saving..." : "Save category"}</button></div>
            </form>
          )}

          {loading ? <div className="admin-empty-state">Loading categories...</div> : (
            <div className="admin-table-wrap"><table className="admin-product-table admin-reference-table"><thead><tr><th>Category</th><th>Purpose</th><th>Homepage</th><th>Order</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{categories.map((category) => <tr key={category.id} className={category.deletedAt ? "is-deleted" : ""}><td><strong>{category.name}</strong><span className="admin-product-brand">/{category.slug}{category.parentId ? ` · child of ${categories.find((item) => item.id === category.parentId)?.name ?? "category"}` : ""}</span></td><td>{category.allowProducts ? "Product category" : "Grouping category"}</td><td>{category.showOnHomepage ? <span className="reference-visibility is-visible"><Eye size={15} /> Shown</span> : <span className="reference-visibility"><EyeOff size={15} /> Hidden</span>}</td><td>{category.sortOrder}</td><td><span className={`status-pill ${category.deletedAt || !category.isActive ? "status-inactive" : "status-active"}`}>{category.deletedAt ? "Deleted" : category.isActive ? "Active" : "Inactive"}</span></td><td><div className="admin-row-actions">{category.deletedAt ? <button type="button" className="admin-view-link" aria-label={`Restore ${category.name}`} title="Restore" disabled={busy} onClick={() => restoreCategory(category)}><RotateCcw size={17} /></button> : <><button type="button" className="admin-view-link" aria-label={`Edit ${category.name}`} title="Edit" onClick={() => editCategory(category)}><Pencil size={17} /></button><button type="button" className="admin-view-link reference-delete-button" aria-label={`Delete ${category.name}`} title="Delete" disabled={busy} onClick={() => removeCategory(category)}><Trash2 size={17} /></button></>}</div></td></tr>)}</tbody></table></div>
          )}
        </section>}

        {section === "brands" && <section className="admin-products-panel">
          <div className="admin-panel-heading">
            <div><h2>Brands</h2><p>Brands become available in the product editor.</p></div>
            <button type="button" className="btn btn-primary" onClick={startNewBrand}><Plus size={17} /> Add brand</button>
          </div>

          {brandEditorOpen && (
            <form className="admin-reference-form" onSubmit={saveBrand}>
              <div className="admin-form-heading"><h2>{editingBrandId ? "Edit brand" : "New brand"}</h2><button type="button" className="admin-view-link" onClick={closeBrandEditor} aria-label="Close brand editor"><X size={18} /></button></div>
              <div className="admin-reference-form-grid">
                <div className="form-group"><label htmlFor="brand-name">Name</label><input id="brand-name" className="form-input" value={brandForm.name} onChange={(event) => setBrandForm((current) => ({ ...current, name: event.target.value }))} minLength={2} maxLength={100} required /></div>
                <div className="form-group"><label htmlFor="brand-slug">Slug <small>(optional)</small></label><input id="brand-slug" className="form-input" value={brandForm.slug} onChange={(event) => setBrandForm((current) => ({ ...current, slug: event.target.value.toLowerCase() }))} maxLength={120} placeholder="created-from-name" /></div>
                <div className="form-group admin-reference-field-wide"><label htmlFor="brand-logo">Logo URL</label><input id="brand-logo" className="form-input" type="url" value={brandForm.logoUrl} onChange={(event) => setBrandForm((current) => ({ ...current, logoUrl: event.target.value }))} placeholder="https://example.com/logo.svg" /></div>
                <div className="form-group admin-reference-field-wide"><label htmlFor="brand-description">Description</label><textarea id="brand-description" className="form-input admin-textarea" value={brandForm.description} onChange={(event) => setBrandForm((current) => ({ ...current, description: event.target.value }))} /></div>
              </div>
              <div className="admin-reference-options"><label className="admin-checkbox"><input type="checkbox" checked={brandForm.isActive} onChange={(event) => setBrandForm((current) => ({ ...current, isActive: event.target.checked }))} /> Active brand</label></div>
              <div className="admin-form-actions"><button type="button" className="btn btn-ghost" onClick={closeBrandEditor}>Cancel</button><button className="btn btn-primary" disabled={busy}>{busy ? "Saving..." : "Save brand"}</button></div>
            </form>
          )}

          {loading ? <div className="admin-empty-state">Loading brands...</div> : brands.length === 0 ? <div className="admin-empty-state"><Tags size={34} /><h3>No brands yet</h3><p>Create the first reusable brand.</p></div> : (
            <div className="admin-table-wrap"><table className="admin-product-table admin-reference-table"><thead><tr><th>Brand</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{brands.map((brand) => <tr key={brand.id} className={brand.deletedAt ? "is-deleted" : ""}><td><strong>{brand.name}</strong><span className="admin-product-brand">/{brand.slug}</span></td><td><span className={`status-pill ${brand.deletedAt || !brand.isActive ? "status-inactive" : "status-active"}`}>{brand.deletedAt ? "Deleted" : brand.isActive ? "Active" : "Inactive"}</span></td><td><div className="admin-row-actions">{brand.deletedAt ? <button type="button" className="admin-view-link" aria-label={`Restore ${brand.name}`} title="Restore" disabled={busy} onClick={() => restoreBrand(brand)}><RotateCcw size={17} /></button> : <><button type="button" className="admin-view-link" aria-label={`Edit ${brand.name}`} title="Edit" onClick={() => editBrand(brand)}><Pencil size={17} /></button><button type="button" className="admin-view-link reference-delete-button" aria-label={`Delete ${brand.name}`} title="Delete" disabled={busy} onClick={() => removeBrand(brand)}><Trash2 size={17} /></button></>}</div></td></tr>)}</tbody></table></div>
          )}
        </section>}

        {section === "product-types" && <section className="admin-products-panel admin-product-types-panel">
          <div className="admin-panel-heading">
            <div><h2>Product types</h2><p>Types group products by shared behavior, such as Clothing, Phone, or Shoes.</p></div>
            <button type="button" className="btn btn-primary" onClick={startNewProductType}><Plus size={17} /> Add product type</button>
          </div>

          {productTypeEditorOpen && (
            <form className="admin-reference-form" onSubmit={saveProductType}>
              <div className="admin-form-heading"><h2>{editingProductTypeId ? "Edit product type" : "New product type"}</h2><button type="button" className="admin-view-link" onClick={closeProductTypeEditor} aria-label="Close product type editor"><X size={18} /></button></div>
              <div className="admin-reference-form-grid">
                <div className="form-group"><label htmlFor="type-name">Name</label><input id="type-name" className="form-input" value={productTypeForm.name} onChange={(event) => setProductTypeForm((current) => ({ ...current, name: event.target.value }))} minLength={2} maxLength={100} required /></div>
                <div className="form-group"><label htmlFor="type-slug">Slug <small>(optional)</small></label><input id="type-slug" className="form-input" value={productTypeForm.slug} onChange={(event) => setProductTypeForm((current) => ({ ...current, slug: event.target.value.toLowerCase() }))} maxLength={120} placeholder="created-from-name" /></div>
                <div className="form-group admin-reference-field-wide"><label htmlFor="type-description">Description</label><textarea id="type-description" className="form-input admin-textarea" value={productTypeForm.description} onChange={(event) => setProductTypeForm((current) => ({ ...current, description: event.target.value }))} /></div>
              </div>
              <div className="admin-reference-options"><label className="admin-checkbox"><input type="checkbox" checked={productTypeForm.isActive} onChange={(event) => setProductTypeForm((current) => ({ ...current, isActive: event.target.checked }))} /> Active product type</label></div>
              <div className="admin-form-actions"><button type="button" className="btn btn-ghost" onClick={closeProductTypeEditor}>Cancel</button><button className="btn btn-primary" disabled={busy}>{busy ? "Saving..." : "Save product type"}</button></div>
            </form>
          )}

          {loading ? <div className="admin-empty-state">Loading product types...</div> : (
            <div className="admin-table-wrap"><table className="admin-product-table admin-reference-table"><thead><tr><th>Product type</th><th>Description</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{productTypes.map((type) => <tr key={type.id} className={type.deletedAt ? "is-deleted" : ""}><td><strong>{type.name}</strong><span className="admin-product-brand">/{type.slug}</span></td><td>{type.description || "—"}</td><td><span className={`status-pill ${type.deletedAt || !type.isActive ? "status-inactive" : "status-active"}`}>{type.deletedAt ? "Deleted" : type.isActive ? "Active" : "Inactive"}</span></td><td><div className="admin-row-actions">{type.deletedAt ? <button type="button" className="admin-view-link" aria-label={`Restore ${type.name}`} title="Restore" disabled={busy} onClick={() => restoreProductType(type)}><RotateCcw size={17} /></button> : <><button type="button" className="admin-view-link" aria-label={`Edit ${type.name}`} title="Edit" onClick={() => editProductType(type)}><Pencil size={17} /></button><button type="button" className="admin-view-link reference-delete-button" aria-label={`Delete ${type.name}`} title="Delete" disabled={busy} onClick={() => removeProductType(type)}><Trash2 size={17} /></button></>}</div></td></tr>)}</tbody></table></div>
          )}
        </section>}
      </div>
    </div>
  );
};
````

### `web/src/pages/admin/AdminCategoriesPage.tsx`

Source lines: 7

````tsx
import React from "react";

import { AdminCatalogSettingsPage } from "./AdminCatalogSettingsPage";

export const AdminCategoriesPage: React.FC = () => (
  <AdminCatalogSettingsPage section="categories" />
);
````

### `web/src/pages/admin/AdminBrandsPage.tsx`

Source lines: 7

````tsx
import React from "react";

import { AdminCatalogSettingsPage } from "./AdminCatalogSettingsPage";

export const AdminBrandsPage: React.FC = () => (
  <AdminCatalogSettingsPage section="brands" />
);
````

### `web/src/pages/admin/AdminProductTypesPage.tsx`

Source lines: 7

````tsx
import React from "react";

import { AdminCatalogSettingsPage } from "./AdminCatalogSettingsPage";

export const AdminProductTypesPage: React.FC = () => (
  <AdminCatalogSettingsPage section="product-types" />
);
````

### `web/src/pages/admin/AdminPropertiesPage.tsx`

Source lines: 2

````tsx
// Compatibility export: existing imports keep working while the feature uses its new name.
export { AdminAttributesPage as AdminPropertiesPage } from "../../admin/attributes";
````

### `web/src/admin/attributes/AdminAttributes.module.css`

Source lines: 215

````css
.form {
  align-items: start;
  background: var(--color-surface-soft, #f8fafc);
  border: 1px solid var(--color-border, #e1e5ea);
  border-radius: 0.75rem;
  display: grid;
  gap: 1rem;
  grid-template-columns: minmax(12rem, 0.8fr) minmax(18rem, 1.5fr) auto;
  margin: 1rem 0 1.5rem;
  padding: 1rem;
}

.helpText {
  color: var(--color-text-muted, #667085);
  display: block;
  font-size: 0.75rem;
  margin-top: 0.35rem;
}

.submitButton {
  margin-top: 1.42rem;
  white-space: nowrap;
}

.editForm {
  background: var(--color-surface-soft, #f8fafc);
  border: 1px solid var(--color-border, #e1e5ea);
  border-radius: 0.75rem;
  display: grid;
  gap: 1rem;
  margin: 1rem 0 1.5rem;
  padding: 1rem;
}

.editHeading,
.editFields,
.editActions {
  align-items: center;
  display: flex;
}

.editHeading {
  justify-content: space-between;
}

.editHeading h3,
.editHeading p {
  margin: 0;
}

.editHeading p {
  color: var(--color-text-muted, #667085);
  font-size: 0.82rem;
  margin-top: 0.2rem;
}

.editHeading > button {
  background: transparent;
  border: 0;
  cursor: pointer;
  padding: 0.4rem;
}

.editFields {
  align-items: end;
  gap: 1rem;
}

.editFields > :first-child {
  flex: 1;
}

.editActions {
  gap: 0.5rem;
}

.table {
  table-layout: fixed;
}

.table th:first-child,
.table td:first-child {
  width: 24%;
}

.table th:nth-child(3),
.table td:nth-child(3) {
  width: 8rem;
}

.table th:last-child,
.table td:last-child {
  width: 7rem;
}

.values {
  line-height: 1.6;
  overflow-wrap: anywhere;
}

.valueManager {
  display: grid;
  gap: 0.65rem;
}

.valueList {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.valueChip {
  align-items: center;
  background: #eef5ff;
  border: 1px solid #d7e6fb;
  border-radius: 999px;
  color: #27476e;
  display: inline-flex;
  font-size: 0.78rem;
  font-weight: 650;
  gap: 0.25rem;
  padding: 0.24rem 0.36rem 0.24rem 0.58rem;
}

.valueChip button {
  align-items: center;
  background: transparent;
  border: 0;
  border-radius: 50%;
  color: currentColor;
  cursor: pointer;
  display: inline-flex;
  justify-content: center;
  padding: 0.12rem;
}

.valueChip button:hover:not(:disabled) {
  background: rgb(39 71 110 / 12%);
}

.valueChip button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.removedValue {
  background: #f4f4f5;
  border-color: #e4e4e7;
  color: #71717a;
  text-decoration: line-through;
}

.noValues {
  color: var(--color-text-muted, #667085);
  font-size: 0.82rem;
}

.valueForm {
  align-items: center;
  display: flex;
  gap: 0.4rem;
  max-width: 22rem;
}

.valueForm input {
  min-width: 7rem;
  padding-block: 0.48rem;
}

.valueForm button {
  align-items: center;
  background: transparent;
  border: 1px solid var(--color-border, #d7dce2);
  border-radius: 0.5rem;
  color: var(--primary, #176b45);
  cursor: pointer;
  display: inline-flex;
  font-weight: 700;
  gap: 0.25rem;
  padding: 0.48rem 0.65rem;
  white-space: nowrap;
}

.valueForm button:hover:not(:disabled) {
  background: var(--success-bg, #eef8f2);
}

.valueForm button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

@media (max-width: 760px) {
  .form {
    grid-template-columns: 1fr;
  }

  .submitButton {
    margin-top: 0;
    width: 100%;
  }

  .editFields {
    align-items: stretch;
    flex-direction: column;
  }

  .editActions .btn {
    flex: 1;
  }

  .table {
    min-width: 680px;
  }
}
````

### `web/src/admin/attributes/AdminAttributesPage.tsx`

Source lines: 75

````tsx
import { useState } from "react";
import { AlertCircle, CheckCircle } from "lucide-react";

import { AdminAttribute } from "../../api/adminCatalog";

import { AttributeForm } from "./components/AttributeForm";
import { AttributeNameEditor } from "./components/AttributeNameEditor";
import { AttributesTable } from "./components/AttributesTable";
import { useAdminAttributes } from "./hooks/useAdminAttributes";

/** Simple catalog page for defining reusable variant attributes and their values. */
export function AdminAttributesPage() {
  const {
    attributes,
    addAttributeValue,
    busy,
    createAttribute,
    deleteAttribute,
    deleteAttributeValue,
    error,
    loading,
    restoreAttribute,
    restoreAttributeValue,
    success,
    updateAttributeName,
  } = useAdminAttributes();
  const [editingAttribute, setEditingAttribute] = useState<AdminAttribute | null>(null);

  return (
    <div className="dashboard-container admin-catalog admin-taxonomy-page admin-page">
      <header className="admin-page-header">
        <div>
          <p className="eyebrow">Variant configuration</p>
          <h1>Product attributes</h1>
          <p>Create reusable attributes and values for product variants.</p>
        </div>
      </header>

      {error && <div className="alert alert-error"><AlertCircle size={18} />{error}</div>}
      {success && <div className="alert alert-success"><CheckCircle size={18} />{success}</div>}

      <section className="admin-products-panel">
        <div className="admin-panel-heading">
          <div>
            <h2>Product attributes</h2>
            <p>Add a name and its allowed values. These values become available when building product variants.</p>
          </div>
        </div>

        {editingAttribute ? (
          <AttributeNameEditor
            key={editingAttribute.id}
            attribute={editingAttribute}
            busy={busy}
            onCancel={() => setEditingAttribute(null)}
            onSave={updateAttributeName}
          />
        ) : (
          <AttributeForm busy={busy} onSubmit={createAttribute} />
        )}
        <AttributesTable
          attributes={attributes}
          busy={busy}
          loading={loading}
          onAddValue={addAttributeValue}
          onDelete={(attribute) => void deleteAttribute(attribute)}
          onDeleteValue={(attribute, value) => void deleteAttributeValue(attribute, value)}
          onEdit={setEditingAttribute}
          onRestore={(attribute) => void restoreAttribute(attribute)}
          onRestoreValue={(attribute, value) => void restoreAttributeValue(attribute, value)}
        />
      </section>
    </div>
  );
}
````

### `web/src/admin/attributes/attribute-values.ts`

Source lines: 15

````ts
/** Convert the administrator's comma-separated input into clean, unique values. */
export function parseAttributeValues(input: string) {
  const seen = new Set<string>();

  return input
    .split(",")
    .map((value) => value.trim())
    .filter((value) => {
      if (!value) return false;
      const key = value.toLocaleLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}
````

### `web/src/admin/attributes/attributes.test.tsx`

Source lines: 60

````tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { AdminAttribute } from "../../api/adminCatalog";
import { parseAttributeValues } from "./attribute-values";
import { AttributeForm } from "./components/AttributeForm";
import { AttributesTable } from "./components/AttributesTable";

const sizeAttribute: AdminAttribute = {
  id: "attribute-size",
  name: "Size",
  code: "size",
  inputType: "SELECT",
  isActive: true,
  deletedAt: null,
  values: [
    { id: "small", attributeId: "attribute-size", label: "S", code: "s", colorHex: null, sortOrder: 0, isActive: true, deletedAt: null },
    { id: "medium", attributeId: "attribute-size", label: "M", code: "m", colorHex: null, sortOrder: 1, isActive: true, deletedAt: null },
  ],
};

describe("product attributes", () => {
  it("normalizes comma-separated values and removes duplicates", () => {
    expect(parseAttributeValues(" S, M, s, XL,  ")).toEqual(["S", "M", "XL"]);
  });

  it("renders the simple two-field form", () => {
    const html = renderToStaticMarkup(<AttributeForm busy={false} onSubmit={vi.fn()} />);

    expect(html).toContain("Property name");
    expect(html).toContain("Values");
    expect(html).toContain("Separate values with commas.");
    expect(html).toContain("Add property");
  });

  it("renders attributes and their values in a table", () => {
    const html = renderToStaticMarkup(
      <AttributesTable
        attributes={[sizeAttribute]}
        busy={false}
        loading={false}
        onAddValue={vi.fn()}
        onDelete={vi.fn()}
        onDeleteValue={vi.fn()}
        onEdit={vi.fn()}
        onRestore={vi.fn()}
        onRestoreValue={vi.fn()}
      />,
    );

    expect(html).toContain("Attribute name");
    expect(html).toContain("Size");
    expect(html).toContain("S");
    expect(html).toContain("M");
    expect(html).toContain("Add value to Size");
    expect(html).toContain("Remove S");
    expect(html).toContain("Edit Size");
    expect(html).toContain("Active");
  });
});
````

### `web/src/admin/attributes/components/AttributeForm.tsx`

Source lines: 61

````tsx
import { FormEvent, useState } from "react";
import { Plus } from "lucide-react";

import styles from "../AdminAttributes.module.css";
import { parseAttributeValues } from "../attribute-values";

interface AttributeFormProps {
  busy: boolean;
  onSubmit: (name: string, values: string) => Promise<boolean>;
}

/** The complete business input for a reusable attribute: its name and values. */
export function AttributeForm({ busy, onSubmit }: AttributeFormProps) {
  const [name, setName] = useState("");
  const [values, setValues] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim() || parseAttributeValues(values).length === 0) return;

    if (await onSubmit(name, values)) {
      setName("");
      setValues("");
    }
  };

  return (
    <form className={styles.form} onSubmit={submit}>
      <div className="form-group">
        <label htmlFor="attribute-name">Property name</label>
        <input
          id="attribute-name"
          className="form-input"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Size"
          minLength={2}
          maxLength={100}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="attribute-values">Values</label>
        <input
          id="attribute-values"
          className="form-input"
          value={values}
          onChange={(event) => setValues(event.target.value)}
          placeholder="S, M, L, XL"
          required
        />
        <small className={styles.helpText}>Separate values with commas.</small>
      </div>

      <button className={`btn btn-primary ${styles.submitButton}`} disabled={busy}>
        <Plus size={17} /> {busy ? "Adding..." : "Add property"}
      </button>
    </form>
  );
}
````

### `web/src/admin/attributes/components/AttributeNameEditor.tsx`

Source lines: 60

````tsx
import { FormEvent, useState } from "react";
import { X } from "lucide-react";

import { AdminAttribute } from "../../../api/adminCatalog";
import styles from "../AdminAttributes.module.css";

interface AttributeNameEditorProps {
  attribute: AdminAttribute;
  busy: boolean;
  onCancel: () => void;
  onSave: (attribute: AdminAttribute, name: string) => Promise<boolean>;
}

/** Small editor matching the edit workflow used by brands, types, and categories. */
export function AttributeNameEditor({ attribute, busy, onCancel, onSave }: AttributeNameEditorProps) {
  const [name, setName] = useState(attribute.name);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextName = name.trim();
    if (!nextName || nextName === attribute.name) return;
    if (await onSave(attribute, nextName)) onCancel();
  };

  return (
    <form className={styles.editForm} onSubmit={submit}>
      <div className={styles.editHeading}>
        <div>
          <h3>Edit product attribute</h3>
          <p>Change the attribute name. Manage its values directly in the table.</p>
        </div>
        <button type="button" onClick={onCancel} aria-label="Close attribute editor">
          <X size={18} />
        </button>
      </div>

      <div className={styles.editFields}>
        <div className="form-group">
          <label htmlFor="edit-attribute-name">Property name</label>
          <input
            id="edit-attribute-name"
            className="form-input"
            value={name}
            onChange={(event) => setName(event.target.value)}
            minLength={2}
            maxLength={100}
            autoFocus
            required
          />
        </div>
        <div className={styles.editActions}>
          <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={busy}>Cancel</button>
          <button className="btn btn-primary" disabled={busy || !name.trim() || name.trim() === attribute.name}>
            {busy ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    </form>
  );
}
````

### `web/src/admin/attributes/components/AttributeValuesCell.tsx`

Source lines: 78

````tsx
import { FormEvent, useState } from "react";
import { Plus, RotateCcw, X } from "lucide-react";

import { AdminAttribute, AdminAttributeValue } from "../../../api/adminCatalog";
import styles from "../AdminAttributes.module.css";

interface AttributeValuesCellProps {
  attribute: AdminAttribute;
  busy: boolean;
  onAdd: (attribute: AdminAttribute, label: string) => Promise<boolean>;
  onDelete: (attribute: AdminAttribute, value: AdminAttributeValue) => void;
  onRestore: (attribute: AdminAttribute, value: AdminAttributeValue) => void;
}

/** Compact value manager used inside one attribute table row. */
export function AttributeValuesCell({ attribute, busy, onAdd, onDelete, onRestore }: AttributeValuesCellProps) {
  const [label, setLabel] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextLabel = label.trim();
    if (!nextLabel) return;
    if (await onAdd(attribute, nextLabel)) setLabel("");
  };

  return (
    <div className={styles.valueManager}>
      <div className={styles.valueList}>
        {attribute.values.length === 0 && <span className={styles.noValues}>No values</span>}
        {attribute.values.map((value) => (
          <span
            className={`${styles.valueChip}${value.deletedAt ? ` ${styles.removedValue}` : ""}`}
            key={value.id}
          >
            {value.label}
            {value.deletedAt ? (
              <button
                type="button"
                onClick={() => onRestore(attribute, value)}
                disabled={busy || Boolean(attribute.deletedAt)}
                aria-label={`Restore ${value.label}`}
                title="Restore value"
              >
                <RotateCcw size={13} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onDelete(attribute, value)}
                disabled={busy || Boolean(attribute.deletedAt)}
                aria-label={`Remove ${value.label}`}
                title="Remove value"
              >
                <X size={14} />
              </button>
            )}
          </span>
        ))}
      </div>

      {!attribute.deletedAt && (
        <form className={styles.valueForm} onSubmit={submit}>
          <input
            className="form-input"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            placeholder="Add value"
            aria-label={`Add value to ${attribute.name}`}
            maxLength={100}
          />
          <button type="submit" disabled={busy || !label.trim()} aria-label={`Add value to ${attribute.name}`}>
            <Plus size={15} /> Add
          </button>
        </form>
      )}
    </div>
  );
}
````

### `web/src/admin/attributes/components/AttributesTable.tsx`

Source lines: 116

````tsx
import { Pencil, RotateCcw, Shapes, Trash2 } from "lucide-react";

import { AdminAttribute, AdminAttributeValue } from "../../../api/adminCatalog";
import styles from "../AdminAttributes.module.css";
import { AttributeValuesCell } from "./AttributeValuesCell";

interface AttributesTableProps {
  attributes: AdminAttribute[];
  busy: boolean;
  loading: boolean;
  onAddValue: (attribute: AdminAttribute, label: string) => Promise<boolean>;
  onDelete: (attribute: AdminAttribute) => void;
  onDeleteValue: (attribute: AdminAttribute, value: AdminAttributeValue) => void;
  onEdit: (attribute: AdminAttribute) => void;
  onRestore: (attribute: AdminAttribute) => void;
  onRestoreValue: (attribute: AdminAttribute, value: AdminAttributeValue) => void;
}

export function AttributesTable({
  attributes,
  busy,
  loading,
  onAddValue,
  onDelete,
  onDeleteValue,
  onEdit,
  onRestore,
  onRestoreValue,
}: AttributesTableProps) {
  if (loading) return <div className="admin-empty-state">Loading product attributes...</div>;

  if (attributes.length === 0) {
    return (
      <div className="admin-empty-state">
        <Shapes size={34} />
        <h3>No product attributes yet</h3>
        <p>Add an attribute such as Color, Size, Material, or Storage.</p>
      </div>
    );
  }

  return (
    <div className="admin-table-wrap">
      <table className={`admin-product-table admin-reference-table ${styles.table}`}>
        <thead>
          <tr>
            <th>Attribute name</th>
            <th>Values</th>
            <th>Status</th>
            <th><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {attributes.map((attribute) => (
              <tr key={attribute.id} className={attribute.deletedAt ? "is-deleted" : ""}>
                <td><strong>{attribute.name}</strong></td>
                <td className={styles.values}>
                  <AttributeValuesCell
                    attribute={attribute}
                    busy={busy}
                    onAdd={onAddValue}
                    onDelete={onDeleteValue}
                    onRestore={onRestoreValue}
                  />
                </td>
                <td>
                  <span className={`status-pill ${attribute.deletedAt ? "status-inactive" : "status-active"}`}>
                    {attribute.deletedAt ? "Deleted" : "Active"}
                  </span>
                </td>
                <td>
                  <div className="admin-row-actions">
                    {attribute.deletedAt ? (
                      <button
                        type="button"
                        className="admin-view-link"
                        aria-label={`Restore ${attribute.name}`}
                        title="Restore"
                        disabled={busy}
                        onClick={() => onRestore(attribute)}
                      >
                        <RotateCcw size={17} />
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="admin-view-link"
                          aria-label={`Edit ${attribute.name}`}
                          title="Edit"
                          disabled={busy}
                          onClick={() => onEdit(attribute)}
                        >
                          <Pencil size={17} />
                        </button>
                        <button
                          type="button"
                          className="admin-view-link reference-delete-button"
                          aria-label={`Delete ${attribute.name}`}
                          title="Delete"
                          disabled={busy}
                          onClick={() => onDelete(attribute)}
                        >
                          <Trash2 size={17} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
````

### `web/src/admin/attributes/hooks/useAdminAttributes.ts`

Source lines: 183

````ts
import { useCallback, useEffect, useState } from "react";

import { AdminAttribute, AdminAttributeValue, adminCatalogApi } from "../../../api/adminCatalog";
import { ApiException } from "../../../api/client";
import { parseAttributeValues } from "../attribute-values";

function requestMessage(error: unknown, fallback: string) {
  return error instanceof ApiException ? error.error.message : fallback;
}

/** Owns data loading and mutations so the route page remains presentation-focused. */
export function useAdminAttributes() {
  const [attributes, setAttributes] = useState<AdminAttribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadAttributes = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setAttributes(await adminCatalogApi.getAttributes(true));
    } catch (requestError) {
      setError(requestMessage(requestError, "Could not load product attributes."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAttributes();
  }, [loadAttributes]);

  const createAttribute = async (name: string, valueInput: string) => {
    const values = parseAttributeValues(valueInput);
    setBusy(true);
    setError("");
    setSuccess("");

    try {
      // Technical fields use safe defaults. The admin only needs to enter a name and values.
      const attribute = await adminCatalogApi.createAttribute({
        name: name.trim(),
        values,
        inputType: "SELECT",
        isActive: true,
      });

      setSuccess(`${attribute.name} created with ${values.length} value${values.length === 1 ? "" : "s"}.`);
      await loadAttributes();
      return true;
    } catch (requestError) {
      setError(requestMessage(requestError, "Could not create the product attribute."));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const deleteAttribute = async (attribute: AdminAttribute) => {
    if (!window.confirm(`Delete the product attribute “${attribute.name}”? You can restore it later.`)) return;

    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await adminCatalogApi.deleteAttribute(attribute.id);
      setSuccess("Product attribute deleted. No SKU variants were affected.");
      await loadAttributes();
    } catch (requestError) {
      setError(requestMessage(requestError, "Could not delete the product attribute."));
    } finally {
      setBusy(false);
    }
  };

  const updateAttributeName = async (attribute: AdminAttribute, name: string) => {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await adminCatalogApi.updateAttribute(attribute.id, { name: name.trim() });
      setSuccess("Product attribute updated.");
      await loadAttributes();
      return true;
    } catch (requestError) {
      setError(requestMessage(requestError, "Could not update the product attribute."));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const addAttributeValue = async (attribute: AdminAttribute, label: string) => {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const nextSortOrder = attribute.values.reduce(
        (largest, value) => Math.max(largest, value.sortOrder),
        -1,
      ) + 1;
      await adminCatalogApi.createAttributeValue(attribute.id, {
        label: label.trim(),
        colorHex: null,
        sortOrder: nextSortOrder,
        isActive: true,
      });
      setSuccess(`${label.trim()} added to ${attribute.name}.`);
      await loadAttributes();
      return true;
    } catch (requestError) {
      setError(requestMessage(requestError, "Could not add the attribute value."));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const deleteAttributeValue = async (attribute: AdminAttribute, value: AdminAttributeValue) => {
    if (!window.confirm(`Remove “${value.label}” from ${attribute.name}? This is allowed only when no SKU uses it.`)) return;

    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await adminCatalogApi.deleteAttributeValue(attribute.id, value.id);
      setSuccess(`${value.label} removed from ${attribute.name}.`);
      await loadAttributes();
    } catch (requestError) {
      // The backend returns the affected SKU count and examples when deletion is unsafe.
      setError(requestMessage(requestError, "Could not remove the attribute value."));
    } finally {
      setBusy(false);
    }
  };

  const restoreAttributeValue = async (attribute: AdminAttribute, value: AdminAttributeValue) => {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await adminCatalogApi.restoreAttributeValue(attribute.id, value.id);
      setSuccess(`${value.label} restored to ${attribute.name}.`);
      await loadAttributes();
    } catch (requestError) {
      setError(requestMessage(requestError, "Could not restore the attribute value."));
    } finally {
      setBusy(false);
    }
  };

  const restoreAttribute = async (attribute: AdminAttribute) => {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await adminCatalogApi.restoreAttribute(attribute.id);
      setSuccess("Product attribute restored.");
      await loadAttributes();
    } catch (requestError) {
      setError(requestMessage(requestError, "Could not restore the product attribute."));
    } finally {
      setBusy(false);
    }
  };

  return {
    attributes,
    addAttributeValue,
    busy,
    createAttribute,
    deleteAttribute,
    deleteAttributeValue,
    error,
    loading,
    restoreAttribute,
    restoreAttributeValue,
    success,
    updateAttributeName,
  };
}
````

### `web/src/admin/attributes/index.ts`

Source lines: 1

````ts
export { AdminAttributesPage } from "./AdminAttributesPage";
````

## Storefront product consumers

Shows how saved products, variants, prices, inventory, media, filters, suggestions, and option selections are read on public pages.

### `web/src/pages/Home.tsx`

Source lines: 98

````tsx
import React, { useEffect, useState } from 'react';
import { Product, productApi } from '../api/products';
import { ProductCard } from '../components/ProductCard';
import { ProductSearch } from '../features/catalog/components/ProductSearch';
import { CategoryNavigation } from '../features/catalog/components/CategoryNavigation';
import { catalogApi, CategoryOption } from '../api/catalog';

export const Home: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await productApi.getProducts({ limit: 12, sort: 'newest' });
        setProducts(data.products);
      } catch (err: any) {
        setError(err.message || 'Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    catalogApi
      .getCategories(controller.signal)
      .then(setCategories)
      .catch(() => {
        if (!controller.signal.aborted) setCategories([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setCategoriesLoading(false);
      });

    return () => controller.abort();
  }, []);

  return (
    <div className="home-page">
      <div className="hero-section">
        <h1>Welcome to DokanBD</h1>
        <p>Discover premium products at unbeatable prices.</p>
        <ProductSearch className="mt-8" stickySource />
      </div>

      <CategoryNavigation
        categories={categories.filter((category) => category.showOnHomepage)}
        loading={categoriesLoading}
      />

      <div className="product-section">
        <h2 className="section-title">New Arrivals</h2>
        
        {loading && (
          <div className="product-grid">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="product-card skeleton" style={{ minHeight: '320px' }}>
                <div className="skeleton-image"></div>
                <div className="skeleton-content">
                  <div className="skeleton-text title"></div>
                  <div className="skeleton-text price"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="alert alert-error" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <div className="empty-state" style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
            <p>No products found right now. Check back later!</p>
          </div>
        )}

        {!loading && !error && products.length > 0 && (
          <div className="product-grid">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
````

### `web/src/pages/products/ProductDetail.tsx`

Source lines: 423

````tsx
import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BadgePercent, CheckCircle, ChevronLeft, ChevronRight, Play, ShoppingCart } from "lucide-react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

import { ApiException } from "../../api/client";
import { Product, productApi } from "../../api/products";
import { useAuth } from "../../features/auth/AuthContext";
import { useCart } from "../../features/cart/CartContext";
import {
  changeStorefrontOption,
  nextStorefrontOptionName,
  selectionFromVariant,
  selectionHasTerminalVariant,
  storefrontOptionValueStates,
} from "./productVariantSelection";
import { resolveStorefrontPricing, storefrontTierSchedule } from "./storefrontPricing";

const priceFormatter = new Intl.NumberFormat("en-BD", {
  style: "currency",
  currency: "BDT",
  minimumFractionDigits: 0,
});

export const ProductDetail: React.FC = () => {
  const { slug = "" } = useParams();
  const { user } = useAuth();
  const { addItem } = useCart();
  const isAdmin = user?.role.code === "ADMIN" || user?.role.code === "OWNER";
  const navigate = useNavigate();
  const location = useLocation();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [selectedOptionValues, setSelectedOptionValues] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [selectedMediaId, setSelectedMediaId] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    productApi
      .getProductBySlug(slug)
      .then((result) => {
        if (!active) return;
        setProduct(result);
        const defaultVariant =
          result.variants?.find((variant) => variant.isDefault && variant.inStock) ??
          result.variants?.find((variant) => variant.inStock);
        setSelectedVariantId(defaultVariant?.id ?? "");
        setSelectedOptionValues(selectionFromVariant(defaultVariant));
        const initialMedia =
          result.media?.find((item) => item.isPrimary) ?? result.media?.[0];
        setSelectedMediaId(initialMedia?.id ?? "");
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        setError(requestError instanceof Error ? requestError.message : "Failed to load product.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [slug]);

  const selectedVariant = useMemo(
    () => product?.variants?.find((variant) => variant.id === selectedVariantId),
    [product, selectedVariantId],
  );

  const mediaItems = useMemo(() => {
    const allMedia = product?.media ?? [];
    const matchingMedia = allMedia.filter(
      (item) => item.variantId === null || item.variantId === selectedVariantId,
    );
    return [...matchingMedia].sort((left, right) => {
      if (left.variantId === selectedVariantId && right.variantId !== selectedVariantId) return -1;
      if (right.variantId === selectedVariantId && left.variantId !== selectedVariantId) return 1;
      return left.sortOrder - right.sortOrder;
    });
  }, [product, selectedVariantId]);

  useEffect(() => {
    if (!mediaItems.some((item) => item.id === selectedMediaId)) {
      setSelectedMediaId(mediaItems[0]?.id ?? "");
    }
  }, [mediaItems, selectedMediaId]);
  const selectedMedia =
    mediaItems.find((item) => item.id === selectedMediaId) ?? mediaItems[0];

  const moveMedia = (direction: -1 | 1) => {
    if (!selectedMedia || mediaItems.length < 2) return;
    const currentIndex = mediaItems.findIndex((item) => item.id === selectedMedia.id);
    const nextIndex = (currentIndex + direction + mediaItems.length) % mediaItems.length;
    setSelectedMediaId(mediaItems[nextIndex].id);
  };

  const chooseOption = (attributeId: string, valueId: string) => {
    if (!product) return;
    const result = changeStorefrontOption(
      product.options ?? [],
      product.variants ?? [],
      selectedOptionValues,
      attributeId,
      valueId,
    );
    setSelectedOptionValues(result.selection);
    setSelectedVariantId(result.variant?.id ?? "");
    setQuantity(1);
    setError("");
    setMessage("");
  };

  const handleAddToCart = async () => {
    if (!user) {
      navigate("/login", { state: { from: location.pathname } });
      return;
    }

    if (isAdmin) {
      setError("Use a customer account to add products to a cart.");
      return;
    }

    if (!selectedVariant) {
      setError("Choose an available product option.");
      return;
    }

    setAdding(true);
    setError("");
    setMessage("");

    try {
      await addItem(selectedVariant.id, quantity);
      setMessage(`${quantity} item${quantity === 1 ? "" : "s"} added to your cart.`);
    } catch (requestError) {
      setError(
        requestError instanceof ApiException
          ? requestError.error.message
          : "Could not add this item to your cart.",
      );
    } finally {
      setAdding(false);
    }
  };

  if (loading) return <div className="loading-screen">Loading product...</div>;

  if (!product) {
    return (
      <div className="app-shell">
        <div className="welcome-card">
          <h1>Product unavailable</h1>
          <p>{error || "This product could not be found."}</p>
          <Link to="/" className="btn btn-primary">Back to products</Link>
        </div>
      </div>
    );
  }

  const pricing = selectedVariant
    ? resolveStorefrontPricing(selectedVariant, quantity)
    : null;
  const displayedPrice = pricing?.unitPrice ?? Number(product.price);
  const displayedRegularPrice = pricing?.regularUnitPrice ?? Number(product.regularPrice);
  const tierSchedule = selectedVariant ? storefrontTierSchedule(selectedVariant) : [];
  const nextOptionName = nextStorefrontOptionName(
    product.options ?? [],
    product.variants ?? [],
    selectedOptionValues,
  );

  return (
    <div className="product-detail-page">
      <Link to="/" className="product-back-link">
        <ArrowLeft size={18} /> Back to products
      </Link>

      <div className="product-detail-grid">
        <div className="product-gallery">
          <div className="product-detail-media">
            {selectedMedia?.type === "VIDEO" ? (
              <video
                key={selectedMedia.id}
                src={selectedMedia.url}
                aria-label={selectedMedia.altText || `${product.name} video`}
                controls
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
              />
            ) : selectedMedia ? (
              <img src={selectedMedia.url} alt={selectedMedia.altText || product.name} />
            ) : (
              <span className="product-image-placeholder">No media available</span>
            )}

            {mediaItems.length > 1 && (
              <>
                <button type="button" className="gallery-arrow gallery-arrow-left" aria-label="Previous media" onClick={() => moveMedia(-1)}><ChevronLeft size={22} /></button>
                <button type="button" className="gallery-arrow gallery-arrow-right" aria-label="Next media" onClick={() => moveMedia(1)}><ChevronRight size={22} /></button>
                <span className="gallery-counter">{mediaItems.findIndex((item) => item.id === selectedMedia?.id) + 1} / {mediaItems.length}</span>
              </>
            )}
          </div>

          {mediaItems.length > 1 && (
            <div className="product-gallery-thumbnails" aria-label="Product media gallery">
              {mediaItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={item.id === selectedMedia?.id ? "is-selected" : ""}
                  aria-label={`Show ${item.type === "VIDEO" ? "video" : "image"}: ${item.altText || product.name}`}
                  onClick={() => setSelectedMediaId(item.id)}
                >
                  {item.type === "VIDEO" ? (
                    <span className="gallery-video-thumbnail"><Play size={22} fill="currentColor" /></span>
                  ) : (
                    <img src={item.thumbnailUrl || item.url} alt="" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <section className="product-detail-content">
          <p className="product-detail-category">{product.category.name}</p>
          <h1>{product.name}</h1>
          <div className="product-detail-pricing" aria-live="polite">
            <p className="product-detail-price">{priceFormatter.format(displayedPrice)}</p>
            {displayedRegularPrice > displayedPrice && (
              <del>{priceFormatter.format(displayedRegularPrice)}</del>
            )}
            {pricing && pricing.discountPercentage > 0 && (
              <span><BadgePercent size={15} /> Save {pricing.discountPercentage}%</span>
            )}
          </div>
          {pricing?.source === "QUANTITY_TIER" && (
            <p className="product-active-tier">
              Quantity price applied for {pricing.tier?.minimumQuantity}+ items.
            </p>
          )}
          {product.shortDescription && <p className="product-detail-summary">{product.shortDescription}</p>}

          {(product.options?.length ?? 0) > 0 ? (
            <div className="product-option-groups">
              {product.options?.map((option, optionIndex) => {
                const valueStates = storefrontOptionValueStates(
                  product.options ?? [],
                  product.variants ?? [],
                  selectedOptionValues,
                  option.attribute.id,
                );
                if (valueStates.length === 0) return null;

                const parentSelection = Object.fromEntries(
                  (product.options ?? []).slice(0, optionIndex).flatMap((parent) => {
                    const valueId = selectedOptionValues[parent.attribute.id];
                    return valueId ? [[parent.attribute.id, valueId]] : [];
                  }),
                );
                const optionalAtThisPath = optionIndex > 0 && selectionHasTerminalVariant(
                  product.variants ?? [],
                  parentSelection,
                );

                return (
                  <fieldset className="product-option-group" key={option.attribute.id}>
                    <legend>
                      {option.attribute.name}
                      {optionalAtThisPath && <span> (optional)</span>}
                    </legend>
                    <div className="product-option-values">
                      {valueStates.map((value) => {
                        const selected = selectedOptionValues[option.attribute.id] === value.id;
                        return (
                          <button
                            key={value.id}
                            type="button"
                            className={`product-option-button${selected ? " is-selected" : ""}${!value.inStock ? " is-sold-out" : ""}`}
                            disabled={!value.inStock}
                            onClick={() => chooseOption(option.attribute.id, value.id)}
                            aria-pressed={selected}
                            title={!value.inStock ? `${value.label} is sold out for this selection` : undefined}
                          >
                            {option.attribute.inputType === "COLOR" && value.colorHex && (
                              <span className="product-color-swatch" style={{ backgroundColor: value.colorHex }} aria-hidden="true" />
                            )}
                            {value.label}
                            {!value.inStock && <small>Sold out</small>}
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>
                );
              })}
              {!selectedVariant && nextOptionName && (
                <p className="product-option-help">Choose {nextOptionName} to continue.</p>
              )}
              {selectedVariant && (
                <p className="product-option-ready">
                  <CheckCircle size={16} /> {selectedVariant.sku} is ready to add.
                </p>
              )}
            </div>
          ) : (product.variants?.length ?? 0) > 0 && (
            <div className="form-group">
              <label htmlFor="variant">Product option</label>
              <select
                id="variant"
                className="form-input"
                value={selectedVariantId}
                onChange={(event) => setSelectedVariantId(event.target.value)}
              >
                <option value="">Choose an option</option>
                {product.variants?.map((variant) => (
                  <option key={variant.id} value={variant.id} disabled={!variant.inStock}>
                    {[variant.name, variant.color, variant.size].filter(Boolean).join(" · ") || variant.sku}
                    {variant.inStock ? ` — ${priceFormatter.format(Number(variant.price))}` : " — Out of stock"}
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedVariant && tierSchedule.length > 0 && (
            <section className="product-tier-panel" aria-labelledby="quantity-pricing-title">
              <div>
                <h2 id="quantity-pricing-title">Buy more, save more</h2>
                <p>Select a price block to update the quantity.</p>
              </div>
              <div className="product-tier-list">
                {tierSchedule.map((tier) => {
                  const active = pricing?.tier?.minimumQuantity === tier.minimumQuantity;
                  const unavailable = tier.minimumQuantity > selectedVariant.stockQuantity;
                  return (
                    <button
                      key={tier.minimumQuantity}
                      type="button"
                      className={active ? "is-active" : ""}
                      disabled={unavailable}
                      onClick={() => setQuantity(tier.minimumQuantity)}
                      title={unavailable ? "Not enough stock for this price block" : undefined}
                    >
                      <span>{tier.minimumQuantity}+ items</span>
                      <strong>{priceFormatter.format(tier.unitPrice)} each</strong>
                      {tier.isPromotion && <small>Promotion</small>}
                    </button>
                  );
                })}
              </div>
              {pricing?.nextTier && pricing.nextTier.minimumQuantity <= selectedVariant.stockQuantity && (
                <p className="product-next-tier">
                  Add {pricing.nextTier.minimumQuantity - quantity} more to unlock {priceFormatter.format(Number(pricing.nextTier.unitPrice))} each.
                </p>
              )}
            </section>
          )}

          <div className="product-purchase-row">
            <div className="form-group quantity-field">
              <label htmlFor="quantity">Quantity</label>
              <input
                id="quantity"
                className="form-input"
                type="number"
                min={1}
                max={selectedVariant?.stockQuantity ?? 1}
                value={quantity}
                onChange={(event) => setQuantity(Math.min(
                  selectedVariant?.stockQuantity ?? 1,
                  Math.max(1, Math.trunc(Number(event.target.value)) || 1),
                ))}
              />
            </div>
            <button
              type="button"
              className="btn btn-primary product-cart-button"
              disabled={adding || !selectedVariant?.inStock || isAdmin}
              onClick={handleAddToCart}
            >
              <ShoppingCart size={19} />
              {adding ? "Adding..." : isAdmin ? "Customer cart only" : user ? "Add to cart" : "Log in to add"}
            </button>
          </div>

          {pricing && (
            <div className="product-price-preview" aria-live="polite">
              <span>
                {quantity} × {priceFormatter.format(pricing.unitPrice)}
              </span>
              <strong>Total {priceFormatter.format(pricing.lineTotal)}</strong>
              {pricing.savingsTotal > 0 && (
                <small>You save {priceFormatter.format(pricing.savingsTotal)}</small>
              )}
            </div>
          )}

          {message && <div className="alert alert-success"><CheckCircle size={18} />{message}</div>}
          {error && <div className="alert alert-error">{error}</div>}

          {product.description && (
            <div className="product-description">
              <h2>About this product</h2>
              <p>{product.description}</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
````

### `web/src/pages/products/SearchResultsPage.tsx`

Source lines: 116

````tsx
import React, { useCallback, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

import { Pagination } from "../../components/ui/Pagination";
import { ActiveFilterChips } from "../../features/catalog/components/ActiveFilterChips";
import { CatalogFilters } from "../../features/catalog/components/CatalogFilters";
import { CatalogToolbar } from "../../features/catalog/components/CatalogToolbar";
import { MobileFilterDrawer } from "../../features/catalog/components/MobileFilterDrawer";
import { ProductGrid } from "../../features/catalog/components/ProductGrid";
import { ProductSearch } from "../../features/catalog/components/ProductSearch";
import { useCatalogFilters } from "../../features/catalog/hooks/useCatalogFilters";
import { useCatalogProducts } from "../../features/catalog/hooks/useCatalogProducts";
import { useCatalogReferences } from "../../features/catalog/hooks/useCatalogReferences";

export const SearchResultsPage: React.FC = () => {
  const { filters, updateFilters, clearFilters } = useCatalogFilters();
  const { products, pagination, loading, error } = useCatalogProducts(filters);
  const references = useCatalogReferences();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const closeMobileFilters = useCallback(() => setMobileFiltersOpen(false), []);
  const heading = filters.search ? `Results for “${filters.search}”` : "All products";

  const changePage = (nextPage: number) => {
    updateFilters({ page: nextPage });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-[calc(100vh-70px)] bg-page">
      <section className="bg-brand px-8 py-12 max-[640px]:px-4">
        <div className="mx-auto max-w-[1200px]">
          <Link to="/" className="mb-6 inline-flex items-center gap-2 font-semibold text-white/85 hover:text-white">
            <ArrowLeft size={18} aria-hidden="true" />
            Storefront
          </Link>
          <p className="m-0 text-center text-sm font-bold tracking-[0.14em] text-white/80 uppercase">Product discovery</p>
          <h1 className="mt-2 mb-7 text-center text-[clamp(2rem,5vw,3.25rem)] leading-tight text-white">Find your next product</h1>
          <ProductSearch initialValue={filters.search ?? ""} stickySource />
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1200px] px-8 py-12 max-[640px]:px-4">
        <div className="mb-7">
          <p className="eyebrow">Catalog</p>
          <h2 className="mt-2 mb-0 text-[clamp(1.8rem,4vw,2.5rem)]">{heading}</h2>
        </div>

        {references.error && <div className="alert alert-error">{references.error}</div>}

        <CatalogToolbar
          count={pagination.total}
          loading={loading}
          onOpenFilters={() => setMobileFiltersOpen(true)}
          onSortChange={(sort) => updateFilters({ sort })}
          sort={filters.sort}
        />

        <ActiveFilterChips
          brands={references.brands}
          categories={references.categories}
          filters={filters}
          onChange={updateFilters}
          onClear={clearFilters}
        />

        <div className="grid items-start gap-8 lg:grid-cols-[270px_minmax(0,1fr)]">
          <aside className="sticky top-24 hidden rounded-card border border-line bg-surface p-5 lg:block">
            <div className="mb-5 flex items-center justify-between gap-3 border-b border-line pb-4">
              <h2 className="m-0 text-xl">Filters</h2>
              <button
                className="cursor-pointer border-0 bg-transparent text-xs font-bold text-muted underline hover:text-brand"
                type="button"
                onClick={clearFilters}
              >
                Clear
              </button>
            </div>
            <CatalogFilters
              brands={references.brands}
              categories={references.categories}
              disabled={references.loading}
              filters={filters}
              onChange={updateFilters}
            />
          </aside>

          <main>
            <ProductGrid
              error={error}
              loading={loading}
              onClearFilters={clearFilters}
              products={products}
            />
            <Pagination
              ariaLabel="Catalog result pages"
              disabled={loading}
              onPageChange={changePage}
              page={pagination.page}
              totalPages={pagination.totalPages}
            />
          </main>
        </div>

        <MobileFilterDrawer
          brands={references.brands}
          categories={references.categories}
          filters={filters}
          onApply={updateFilters}
          onClose={closeMobileFilters}
          open={mobileFiltersOpen}
        />
      </section>
    </div>
  );
};
````

### `web/src/pages/products/productVariantSelection.ts`

Source lines: 137

````ts
import type { ProductOption, ProductVariant } from "../../api/products";

export type ProductOptionSelection = Record<string, string>;

export interface StorefrontOptionValueState {
  id: string;
  label: string;
  code: string;
  colorHex: string | null;
  inStock: boolean;
}

const variantValueMap = (variant: ProductVariant) => new Map(
  variant.optionValues.map((value) => [value.attribute.id, value.id]),
);

const variantMatchesSelection = (
  variant: ProductVariant,
  selection: ProductOptionSelection,
) => {
  const values = variantValueMap(variant);
  return Object.entries(selection).every(
    ([attributeId, valueId]) => values.get(attributeId) === valueId,
  );
};

export function selectionFromVariant(variant?: ProductVariant): ProductOptionSelection {
  return Object.fromEntries(
    (variant?.optionValues ?? []).map((value) => [value.attribute.id, value.id]),
  );
}

export function findExactStorefrontVariant(
  variants: ProductVariant[],
  selection: ProductOptionSelection,
) {
  const selectedCount = Object.keys(selection).length;
  if (selectedCount === 0) return undefined;

  return variants.find(
    (variant) =>
      variant.inStock &&
      variant.optionValues.length === selectedCount &&
      variantMatchesSelection(variant, selection),
  );
}

export function changeStorefrontOption(
  options: ProductOption[],
  variants: ProductVariant[],
  current: ProductOptionSelection,
  attributeId: string,
  valueId: string,
) {
  const changedIndex = options.findIndex((option) => option.attribute.id === attributeId);
  if (changedIndex < 0) {
    return { selection: current, variant: findExactStorefrontVariant(variants, current) };
  }

  if (current[attributeId] === valueId) {
    return { selection: current, variant: findExactStorefrontVariant(variants, current) };
  }

  const selection: ProductOptionSelection = {};
  for (const option of options.slice(0, changedIndex)) {
    const selectedValueId = current[option.attribute.id];
    if (selectedValueId) selection[option.attribute.id] = selectedValueId;
  }
  selection[attributeId] = valueId;

  return {
    selection,
    variant: findExactStorefrontVariant(variants, selection),
  };
}

export function storefrontOptionValueStates(
  options: ProductOption[],
  variants: ProductVariant[],
  selection: ProductOptionSelection,
  attributeId: string,
): StorefrontOptionValueState[] {
  const optionIndex = options.findIndex((option) => option.attribute.id === attributeId);
  if (optionIndex < 0) return [];

  const parentSelection: ProductOptionSelection = {};
  for (const parent of options.slice(0, optionIndex)) {
    const selectedValueId = selection[parent.attribute.id];
    if (!selectedValueId) return [];
    parentSelection[parent.attribute.id] = selectedValueId;
  }

  const option = options[optionIndex];
  return option.values.flatMap((value) => {
    const matchingVariants = variants.filter((variant) => {
      if (!variantMatchesSelection(variant, parentSelection)) return false;
      return variant.optionValues.some(
        (variantValue) =>
          variantValue.attribute.id === attributeId && variantValue.id === value.id,
      );
    });

    if (matchingVariants.length === 0) return [];
    return [{
      ...value,
      inStock: matchingVariants.some((variant) => variant.inStock),
    }];
  });
}

export function selectionHasTerminalVariant(
  variants: ProductVariant[],
  selection: ProductOptionSelection,
) {
  const selectedCount = Object.keys(selection).length;
  return selectedCount > 0 && variants.some(
    (variant) =>
      variant.optionValues.length === selectedCount &&
      variantMatchesSelection(variant, selection),
  );
}

export function nextStorefrontOptionName(
  options: ProductOption[],
  variants: ProductVariant[],
  selection: ProductOptionSelection,
) {
  return options.find((option) =>
    !selection[option.attribute.id] &&
    storefrontOptionValueStates(
      options,
      variants,
      selection,
      option.attribute.id,
    ).some((value) => value.inStock),
  )?.attribute.name;
}
````

### `web/src/pages/products/productVariantSelection.test.ts`

Source lines: 122

````ts
import { describe, expect, it } from "vitest";

import type {
  ProductOption,
  ProductOptionAttribute,
  ProductOptionValue,
  ProductVariant,
} from "../../api/products";
import {
  changeStorefrontOption,
  findExactStorefrontVariant,
  nextStorefrontOptionName,
  selectionHasTerminalVariant,
  storefrontOptionValueStates,
} from "./productVariantSelection";

const attributes = {
  color: { id: "color", name: "Color", code: "color", inputType: "COLOR" },
  size: { id: "size", name: "Size", code: "size", inputType: "SELECT" },
  material: { id: "material", name: "Material", code: "material", inputType: "SELECT" },
} satisfies Record<string, ProductOptionAttribute>;

const value = (
  id: string,
  label: string,
  attribute: ProductOptionAttribute,
): ProductOptionValue => ({ id, label, code: id, colorHex: null, attribute });

const values = {
  black: value("black", "Black", attributes.color),
  green: value("green", "Green", attributes.color),
  xl: value("xl", "XL", attributes.size),
  x: value("x", "X", attributes.size),
  m: value("m", "M", attributes.size),
  cotton: value("cotton", "Cotton", attributes.material),
  synthetic: value("synthetic", "Synthetic", attributes.material),
};

const options: ProductOption[] = [
  { attribute: attributes.color, values: [values.black, values.green] },
  { attribute: attributes.size, values: [values.xl, values.x, values.m] },
  { attribute: attributes.material, values: [values.cotton, values.synthetic] },
];

const variant = (
  id: string,
  optionValues: ProductOptionValue[],
  inStock = true,
): ProductVariant => ({
  id,
  sku: id.toUpperCase(),
  barcode: null,
  name: null,
  color: null,
  size: null,
  price: 100,
  stockQuantity: inStock ? 5 : 0,
  inStock,
  weight: null,
  isDefault: false,
  optionValues,
});

const variants = [
  variant("black-xl-cotton", [values.black, values.xl, values.cotton]),
  variant("black-xl-synthetic", [values.black, values.xl, values.synthetic], false),
  variant("black-x", [values.black, values.x]),
  variant("green-m", [values.green, values.m]),
];

describe("storefront sparse variant selection", () => {
  it("shows only child values that exist below the selected parent", () => {
    const sizes = storefrontOptionValueStates(options, variants, { color: "green" }, "size");

    expect(sizes.map((item) => item.label)).toEqual(["M"]);
    expect(storefrontOptionValueStates(options, variants, {}, "size")).toEqual([]);
  });

  it("keeps sold-out paths visible but unavailable", () => {
    const materials = storefrontOptionValueStates(
      options,
      variants,
      { color: "black", size: "xl" },
      "material",
    );

    expect(materials.map(({ label, inStock }) => ({ label, inStock }))).toEqual([
      { label: "Cotton", inStock: true },
      { label: "Synthetic", inStock: false },
    ]);
  });

  it("clears child choices when a parent changes", () => {
    const result = changeStorefrontOption(
      options,
      variants,
      { color: "black", size: "xl", material: "cotton" },
      "color",
      "green",
    );

    expect(result.selection).toEqual({ color: "green" });
    expect(result.variant).toBeUndefined();
    expect(nextStorefrontOptionName(options, variants, result.selection)).toBe("Size");
  });

  it("does not clear children when the selected parent is clicked again", () => {
    const current = { color: "black", size: "xl", material: "cotton" };
    const result = changeStorefrontOption(options, variants, current, "color", "black");

    expect(result.selection).toBe(current);
    expect(result.variant?.id).toBe("black-xl-cotton");
  });

  it("resolves an exact terminal SKU even when a later property is optional", () => {
    const selection = { color: "black", size: "x" };

    expect(findExactStorefrontVariant(variants, selection)?.id).toBe("black-x");
    expect(selectionHasTerminalVariant(variants, selection)).toBe(true);
    expect(storefrontOptionValueStates(options, variants, selection, "material")).toEqual([]);
  });
});
````

### `web/src/pages/products/storefrontPricing.ts`

Source lines: 78

````ts
import type { ProductPriceTier, ProductVariant } from "../../api/products";

const activeTiers = (variant: ProductVariant) => (variant.priceTiers ?? []).filter(
  (tier) =>
    tier.isActive !== false &&
    (tier.variantId === null || tier.variantId === variant.id),
);

export function eligibleStorefrontTier(
  variant: ProductVariant,
  quantity: number,
) {
  return activeTiers(variant)
    .filter((tier) => tier.minimumQuantity <= quantity)
    .sort((left, right) =>
      right.minimumQuantity - left.minimumQuantity ||
      Number(left.unitPrice) - Number(right.unitPrice) ||
      Number(right.variantId !== null) - Number(left.variantId !== null),
    )[0];
}

export function resolveStorefrontPricing(
  variant: ProductVariant,
  quantity: number,
) {
  const safeQuantity = Math.max(1, Math.trunc(quantity) || 1);
  const regularUnitPrice = Number(variant.regularPrice ?? variant.price);
  const baseUnitPrice = Number(variant.price);
  const tier = eligibleStorefrontTier(variant, safeQuantity);
  const unitPrice = Number(tier?.unitPrice ?? baseUnitPrice);
  const lineTotal = unitPrice * safeQuantity;
  const savingsTotal = Math.max(0, regularUnitPrice * safeQuantity - lineTotal);
  const discountPercentage = regularUnitPrice > unitPrice
    ? Math.round(((regularUnitPrice - unitPrice) / regularUnitPrice) * 100)
    : 0;
  const nextMinimumQuantity = activeTiers(variant)
    .map((candidate) => candidate.minimumQuantity)
    .filter((minimumQuantity) => minimumQuantity > safeQuantity)
    .sort((left, right) => left - right)[0];
  const nextTier = nextMinimumQuantity === undefined
    ? undefined
    : eligibleStorefrontTier(variant, nextMinimumQuantity);

  return {
    quantity: safeQuantity,
    regularUnitPrice,
    baseUnitPrice,
    unitPrice,
    lineTotal,
    savingsTotal,
    discountPercentage,
    source: tier
      ? "QUANTITY_TIER" as const
      : baseUnitPrice < regularUnitPrice
        ? "DISCOUNT" as const
        : "REGULAR" as const,
    tier: tier ?? null,
    nextTier: nextTier ?? null,
  };
}

export function storefrontTierSchedule(variant: ProductVariant) {
  const byMinimum = new Map<number, ProductPriceTier>();
  const minimums = [...new Set(activeTiers(variant).map((tier) => tier.minimumQuantity))]
    .sort((left, right) => left - right);

  for (const minimumQuantity of minimums) {
    const selected = eligibleStorefrontTier(variant, minimumQuantity);
    if (selected) byMinimum.set(minimumQuantity, selected);
  }

  return [...byMinimum.entries()].map(([minimumQuantity, tier]) => ({
    minimumQuantity,
    unitPrice: Number(tier.unitPrice),
    isPromotion: tier.isPromotion,
    variantId: tier.variantId,
  }));
}
````

### `web/src/pages/products/storefrontPricing.test.ts`

Source lines: 66

````ts
import { describe, expect, it } from "vitest";

import type { ProductVariant } from "../../api/products";
import {
  eligibleStorefrontTier,
  resolveStorefrontPricing,
  storefrontTierSchedule,
} from "./storefrontPricing";

const variant = {
  id: "sku-1",
  sku: "SKU-1",
  barcode: null,
  name: null,
  color: null,
  size: null,
  price: "90.00",
  regularPrice: "100.00",
  stockQuantity: 30,
  inStock: true,
  weight: null,
  isDefault: true,
  optionValues: [],
  priceTiers: [
    { id: "all-5", variantId: null, minimumQuantity: 5, unitPrice: "80.00", isPromotion: false },
    { id: "all-10", variantId: null, minimumQuantity: 10, unitPrice: "75.00", isPromotion: false },
    { id: "sku-10", variantId: "sku-1", minimumQuantity: 10, unitPrice: "70.00", isPromotion: true },
  ],
} satisfies ProductVariant;

describe("storefront quantity pricing", () => {
  it("keeps the active discount before a quantity tier is reached", () => {
    expect(resolveStorefrontPricing(variant, 2)).toMatchObject({
      unitPrice: 90,
      lineTotal: 180,
      savingsTotal: 20,
      source: "DISCOUNT",
      nextTier: { id: "all-5" },
    });
  });

  it("previews the tier that will actually win at the next threshold", () => {
    expect(resolveStorefrontPricing(variant, 6).nextTier?.id).toBe("sku-10");
  });

  it("applies the highest eligible quantity tier", () => {
    expect(resolveStorefrontPricing(variant, 10)).toMatchObject({
      unitPrice: 70,
      lineTotal: 700,
      savingsTotal: 300,
      discountPercentage: 30,
      source: "QUANTITY_TIER",
    });
  });

  it("prefers the exact SKU tier when quantity is tied", () => {
    expect(eligibleStorefrontTier(variant, 10)?.id).toBe("sku-10");
  });

  it("creates one accurate row for each quantity threshold", () => {
    expect(storefrontTierSchedule(variant)).toEqual([
      { minimumQuantity: 5, unitPrice: 80, isPromotion: false, variantId: null },
      { minimumQuantity: 10, unitPrice: 70, isPromotion: true, variantId: "sku-1" },
    ]);
  });
});
````

### `web/src/features/catalog/components/ActiveFilterChips.tsx`

Source lines: 77

````tsx
import React from "react";
import { X } from "lucide-react";

import type { BrandOption, CategoryOption } from "../../../api/catalog";
import type { CatalogFilterChanges, CatalogFilters } from "../types/catalog";
import { flattenCategories } from "../utils/catalogOptions";
import { formatProductPrice } from "../utils/formatters";

interface Props {
  brands: BrandOption[];
  categories: CategoryOption[];
  filters: CatalogFilters;
  onChange: (changes: CatalogFilterChanges) => void;
  onClear: () => void;
}

export const ActiveFilterChips: React.FC<Props> = ({
  brands,
  categories,
  filters,
  onChange,
  onClear,
}) => {
  const chips: Array<{ key: string; label: string; remove: CatalogFilterChanges }> = [];
  const category = flattenCategories(categories).find(({ slug }) => slug === filters.category);
  const brand = brands.find(({ slug }) => slug === filters.brand);

  if (filters.category) chips.push({
    key: "category",
    label: `Category: ${category?.name ?? filters.category}`,
    remove: { category: undefined },
  });
  if (filters.brand) chips.push({
    key: "brand",
    label: `Brand: ${brand?.name ?? filters.brand}`,
    remove: { brand: undefined },
  });
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    const range = filters.minPrice !== undefined && filters.maxPrice !== undefined
      ? `${formatProductPrice(filters.minPrice)}–${formatProductPrice(filters.maxPrice)}`
      : filters.minPrice !== undefined
        ? `From ${formatProductPrice(filters.minPrice)}`
        : `Up to ${formatProductPrice(filters.maxPrice ?? 0)}`;
    chips.push({ key: "price", label: range, remove: { minPrice: undefined, maxPrice: undefined } });
  }
  if (filters.inStock !== undefined) chips.push({
    key: "stock",
    label: filters.inStock ? "In stock" : "Out of stock",
    remove: { inStock: undefined },
  });

  if (chips.length === 0) return null;

  return (
    <div className="mb-5 flex flex-wrap items-center gap-2" aria-label="Active filters">
      {chips.map((chip) => (
        <button
          key={chip.key}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-brand/25 bg-positive-soft px-3 py-1.5 text-xs font-bold text-brand hover:border-brand"
          type="button"
          onClick={() => onChange(chip.remove)}
          aria-label={`Remove ${chip.label} filter`}
        >
          {chip.label}
          <X size={14} aria-hidden="true" />
        </button>
      ))}
      <button
        className="cursor-pointer border-0 bg-transparent px-2 py-1 text-xs font-bold text-muted underline hover:text-brand"
        type="button"
        onClick={onClear}
      >
        Clear filters
      </button>
    </div>
  );
};
````

### `web/src/features/catalog/components/CatalogFilters.tsx`

Source lines: 150

````tsx
import React, { FormEvent, useEffect, useMemo, useState } from "react";

import type { BrandOption, CategoryOption } from "../../../api/catalog";
import type { CatalogFilterChanges, CatalogFilters as CatalogFilterValues } from "../types/catalog";
import { flattenCategories } from "../utils/catalogOptions";

interface Props {
  brands: BrandOption[];
  categories: CategoryOption[];
  disabled?: boolean;
  filters: CatalogFilterValues;
  idPrefix?: string;
  onChange: (changes: CatalogFilterChanges) => void;
}

const controlClass =
  "w-full rounded-control border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none transition focus:border-brand focus:ring-3 focus:ring-brand/15 disabled:opacity-60";

export const CatalogFilters: React.FC<Props> = ({
  brands,
  categories,
  disabled = false,
  filters,
  idPrefix = "catalog",
  onChange,
}) => {
  const flatCategories = useMemo(() => flattenCategories(categories), [categories]);
  const [minimum, setMinimum] = useState(filters.minPrice?.toString() ?? "");
  const [maximum, setMaximum] = useState(filters.maxPrice?.toString() ?? "");
  const [priceError, setPriceError] = useState("");

  useEffect(() => {
    setMinimum(filters.minPrice?.toString() ?? "");
    setMaximum(filters.maxPrice?.toString() ?? "");
  }, [filters.maxPrice, filters.minPrice]);

  const applyPrice = (event: FormEvent) => {
    event.preventDefault();
    const minPrice = minimum === "" ? undefined : Number(minimum);
    const maxPrice = maximum === "" ? undefined : Number(maximum);

    if (
      (minPrice !== undefined && (!Number.isFinite(minPrice) || minPrice < 0)) ||
      (maxPrice !== undefined && (!Number.isFinite(maxPrice) || maxPrice < 0))
    ) {
      setPriceError("Prices must be zero or greater.");
      return;
    }

    if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
      setPriceError("Minimum price cannot be greater than maximum price.");
      return;
    }

    setPriceError("");
    onChange({ minPrice, maxPrice });
  };

  return (
    <div className="space-y-6" aria-label="Product filters">
      <div>
        <label className="mb-2 block text-sm font-bold text-ink" htmlFor={`${idPrefix}-category`}>
          Category
        </label>
        <select
          id={`${idPrefix}-category`}
          className={controlClass}
          value={filters.category ?? ""}
          disabled={disabled}
          onChange={(event) => onChange({ category: event.target.value || undefined })}
        >
          <option value="">All categories</option>
          {flatCategories.map((category) => (
            <option key={category.id} value={category.slug}>
              {`${"— ".repeat(category.depth)}${category.name}`}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-bold text-ink" htmlFor={`${idPrefix}-brand`}>
          Brand
        </label>
        <select
          id={`${idPrefix}-brand`}
          className={controlClass}
          value={filters.brand ?? ""}
          disabled={disabled}
          onChange={(event) => onChange({ brand: event.target.value || undefined })}
        >
          <option value="">All brands</option>
          {brands.map((brand) => (
            <option key={brand.id} value={brand.slug}>{brand.name}</option>
          ))}
        </select>
      </div>

      <form onSubmit={applyPrice}>
        <fieldset className="m-0 border-0 p-0" disabled={disabled}>
          <legend className="mb-2 text-sm font-bold text-ink">Price range</legend>
          <div className="grid grid-cols-2 gap-2">
            <label>
              <span className="sr-only">Minimum price</span>
              <input
                className={controlClass}
                inputMode="decimal"
                min="0"
                placeholder="Minimum"
                type="number"
                value={minimum}
                onChange={(event) => setMinimum(event.target.value)}
              />
            </label>
            <label>
              <span className="sr-only">Maximum price</span>
              <input
                className={controlClass}
                inputMode="decimal"
                min="0"
                placeholder="Maximum"
                type="number"
                value={maximum}
                onChange={(event) => setMaximum(event.target.value)}
              />
            </label>
          </div>
          {priceError && <p className="mt-2 mb-0 text-xs text-danger" role="alert">{priceError}</p>}
          <button
            className="mt-3 w-full cursor-pointer rounded-control border border-brand bg-transparent px-3 py-2 text-sm font-bold text-brand transition hover:bg-positive-soft disabled:cursor-not-allowed"
            type="submit"
          >
            Apply price
          </button>
        </fieldset>
      </form>

      <label className="flex cursor-pointer items-center gap-3 rounded-control border border-line p-3 text-sm font-semibold text-ink">
        <input
          className="size-4 accent-brand"
          type="checkbox"
          checked={filters.inStock === true}
          disabled={disabled}
          onChange={(event) => onChange({ inStock: event.target.checked ? true : undefined })}
        />
        In-stock products only
      </label>
    </div>
  );
};
````

### `web/src/features/catalog/components/CatalogToolbar.tsx`

Source lines: 39

````tsx
import React from "react";
import { SlidersHorizontal } from "lucide-react";

import type { ProductSort } from "../../../api/products";
import { SortSelect } from "./SortSelect";

interface Props {
  count: number;
  loading: boolean;
  onOpenFilters: () => void;
  onSortChange: (sort: ProductSort) => void;
  sort: ProductSort;
}

export const CatalogToolbar: React.FC<Props> = ({
  count,
  loading,
  onOpenFilters,
  onSortChange,
  sort,
}) => (
  <div className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-card border border-line bg-surface p-4">
    <p className="m-0 text-sm text-muted" aria-live="polite">
      {loading ? "Loading products..." : `${count} product${count === 1 ? "" : "s"} found`}
    </p>
    <div className="flex flex-wrap items-center gap-3">
      <button
        className="inline-flex cursor-pointer items-center gap-2 rounded-control border border-line bg-surface px-3 py-2 text-sm font-bold text-ink hover:border-brand hover:text-brand lg:hidden"
        type="button"
        aria-haspopup="dialog"
        onClick={onOpenFilters}
      >
        <SlidersHorizontal size={17} aria-hidden="true" />
        Filters
      </button>
      <SortSelect disabled={loading} value={sort} onChange={onSortChange} />
    </div>
  </div>
);
````

### `web/src/features/catalog/components/CategoryNavigation.tsx`

Source lines: 307

````tsx
import React, {
  KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { ArrowLeft, ArrowRight, Image as ImageIcon } from "lucide-react";
import { Link } from "react-router-dom";

import type { CategoryOption } from "../../../api/catalog";

interface Props {
  categories: CategoryOption[];
  loading?: boolean;
}

// HOW OFTEN THE NEXT CATEGORY STARTS MOVING.
// Keep only one value uncommented, save the file, and test in the browser.
//const AUTO_ADVANCE_MS = 1800; // Current: move every 1.8 seconds.
// const AUTO_ADVANCE_MS = 1000; // Very fast: every 1 second.
// const AUTO_ADVANCE_MS = 1500; // Fast: every 1.5 seconds.
// const AUTO_ADVANCE_MS = 2000; // Balanced: every 2 seconds.
 const AUTO_ADVANCE_MS = 3000; // Relaxed: every 3 seconds.
 //const AUTO_ADVANCE_MS = 4500; // Original setting: every 4.5 seconds.

// HOW LONG ONE SLIDE MOVEMENT TAKES.
// Keep this lower than AUTO_ADVANCE_MS so one movement finishes before the next.
const TRANSITION_DURATION_MS = 1000; // Current: slow, smooth 1-second movement.
// const TRANSITION_DURATION_MS = 400; // Fast movement.
//const TRANSITION_DURATION_MS = 700; // Medium movement.
// const TRANSITION_DURATION_MS = 1200; // Slower movement.
// const TRANSITION_DURATION_MS = 1500; // Very slow movement.

function easeInOutCubic(progress: number) {
  return progress < 0.5
    ? 4 * progress * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 3) / 2;
}

function productLabel(count: number) {
  return `${count} product${count === 1 ? "" : "s"}`;
}

export const CategoryNavigation: React.FC<Props> = ({ categories, loading = false }) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const scrollFrameRef = useRef<number | null>(null);
  const motionFrameRef = useRef<number | null>(null);
  const programmaticScrollRef = useRef(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const goTo = useCallback(
    (requestedIndex: number, smooth = true) => {
      if (categories.length === 0) return;
      const nextIndex = (requestedIndex + categories.length) % categories.length;
      const card = cardRefs.current[nextIndex];
      const track = trackRef.current;
      if (card && track) {
        if (motionFrameRef.current !== null) {
          window.cancelAnimationFrame(motionFrameRef.current);
          motionFrameRef.current = null;
        }

        const targetLeft = card.offsetLeft - track.offsetLeft;

        if (!smooth || reducedMotion || TRANSITION_DURATION_MS <= 0) {
          programmaticScrollRef.current = false;
          track.scrollLeft = targetLeft;
        } else {
          const startLeft = track.scrollLeft;
          const distance = targetLeft - startLeft;
          const startTime = performance.now();
          programmaticScrollRef.current = true;

          const animate = (currentTime: number) => {
            const progress = Math.min(
              (currentTime - startTime) / TRANSITION_DURATION_MS,
              1,
            );
            track.scrollLeft = startLeft + distance * easeInOutCubic(progress);

            if (progress < 1) {
              motionFrameRef.current = window.requestAnimationFrame(animate);
            } else {
              motionFrameRef.current = null;
              programmaticScrollRef.current = false;
            }
          };

          motionFrameRef.current = window.requestAnimationFrame(animate);
        }
      }
      setActiveIndex(nextIndex);
    },
    [categories.length, reducedMotion],
  );

  const move = useCallback(
    (direction: -1 | 1) => {
      const track = trackRef.current;
      if (!track) return;
      const atStart = track.scrollLeft <= 2;
      const atEnd = track.scrollLeft >= track.scrollWidth - track.clientWidth - 2;

      if (direction === 1 && atEnd) goTo(0);
      else if (direction === -1 && atStart) goTo(categories.length - 1);
      else goTo(activeIndex + direction);
    },
    [activeIndex, categories.length, goTo],
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(mediaQuery.matches);
    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);
    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    if (paused || reducedMotion || categories.length <= 1) return;
    const timer = window.setTimeout(
      () => move(1),
      AUTO_ADVANCE_MS,
    );
    return () => window.clearTimeout(timer);
  }, [categories.length, move, paused, reducedMotion]);

  useEffect(() => {
    if (activeIndex >= categories.length) setActiveIndex(0);
  }, [activeIndex, categories.length]);

  useEffect(() => () => {
    if (scrollFrameRef.current !== null) {
      window.cancelAnimationFrame(scrollFrameRef.current);
    }
    if (motionFrameRef.current !== null) {
      window.cancelAnimationFrame(motionFrameRef.current);
    }
    programmaticScrollRef.current = false;
  }, []);

  const updateActiveCard = () => {
    if (programmaticScrollRef.current) return;
    if (scrollFrameRef.current !== null) return;
    scrollFrameRef.current = window.requestAnimationFrame(() => {
      scrollFrameRef.current = null;
      const track = trackRef.current;
      if (!track) return;

      let closestIndex = 0;
      let closestDistance = Number.POSITIVE_INFINITY;
      cardRefs.current.forEach((card, index) => {
        if (!card) return;
        const distance = Math.abs(card.offsetLeft - track.scrollLeft);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });
      setActiveIndex(closestIndex);
    });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      move(1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      move(-1);
    }
  };

  if (loading) {
    return (
      <section className="mx-auto w-full max-w-[1200px] px-8 pt-12 max-[640px]:px-4" aria-label="Loading product categories">
        <div className="mb-5">
          <p className="eyebrow">Explore the catalog</p>
          <h2 className="mt-2 mb-0 text-[clamp(1.6rem,4vw,2.2rem)]">Shop by category</h2>
        </div>
        <div className="flex gap-4 overflow-hidden pb-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div
              className="h-[310px] min-w-[88%] animate-pulse rounded-card bg-[#e1ece5] sm:h-[280px] sm:min-w-[calc(50%-0.5rem)] lg:h-[300px] lg:min-w-[calc(33.333%-0.667rem)]"
              key={index}
            />
          ))}
        </div>
      </section>
    );
  }

  if (categories.length === 0) return null;

  return (
    <section
      className="mx-auto w-full max-w-[1200px] px-8 pt-12 max-[640px]:px-4"
      aria-labelledby="shop-category-title"
      aria-roledescription="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
      }}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Explore the catalog</p>
          <h2 className="mt-2 mb-0 text-[clamp(1.6rem,4vw,2.2rem)]" id="shop-category-title">
            Shop by category
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="grid size-10 cursor-pointer place-items-center rounded-full border border-line bg-surface text-ink transition hover:border-brand hover:text-brand"
            type="button"
            aria-label="Previous category"
            onClick={() => move(-1)}
          >
            <ArrowLeft size={18} aria-hidden="true" />
          </button>
          <button
            className="grid size-10 cursor-pointer place-items-center rounded-full border border-line bg-surface text-ink transition hover:border-brand hover:text-brand"
            type="button"
            aria-label="Next category"
            onClick={() => move(1)}
          >
            <ArrowRight size={18} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        tabIndex={0}
        aria-label="Product categories"
        onKeyDown={handleKeyDown}
        onScroll={updateActiveCard}
      >
        {categories.map((category, index) => (
          <Link
            ref={(element) => { cardRefs.current[index] = element; }}
            className="group relative h-[310px] min-w-[88%] snap-start overflow-hidden rounded-card border border-line bg-brand text-white no-underline shadow-[0_12px_35px_rgba(15,48,30,0.16)] sm:h-[280px] sm:min-w-[calc(50%-0.5rem)] lg:h-[300px] lg:min-w-[calc(33.333%-0.667rem)]"
            key={category.id}
            to={`/search?category=${encodeURIComponent(category.slug)}`}
            aria-label={`Shop ${category.name}, ${productLabel(category.productCount)}`}
          >
            {category.displayImageUrl ? (
              <img
                className="absolute inset-0 size-full object-cover transition duration-500 group-hover:scale-105 group-focus-visible:scale-105"
                src={category.displayImageUrl}
                alt=""
                loading={index === 0 ? "eager" : "lazy"}
              />
            ) : (
              <span className="absolute inset-0 grid place-items-center bg-[linear-gradient(135deg,var(--primary),var(--primary-hover))] text-white/70">
                <ImageIcon size={54} aria-hidden="true" />
              </span>
            )}
            <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,36,23,0.05)_20%,rgba(8,36,23,0.88)_100%)]" aria-hidden="true" />
            <span className="absolute right-0 bottom-0 left-0 flex items-end justify-between gap-4 p-6">
              <span>
                <small className="mb-1 block text-xs font-bold tracking-[0.12em] text-white/75 uppercase">
                  {productLabel(category.productCount)}
                </small>
                <strong className="block text-[clamp(1.5rem,4vw,2rem)] leading-tight">{category.name}</strong>
                <span className="mt-2 block text-sm font-semibold text-white/85">Shop now</span>
              </span>
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-brand transition group-hover:translate-x-1 group-focus-visible:translate-x-1">
                <ArrowRight size={19} aria-hidden="true" />
              </span>
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-2 flex items-center justify-between gap-4">
        <div className="flex gap-2" aria-label="Choose category slide">
          {categories.map((category, index) => (
            <button
              key={category.id}
              className={`h-2.5 cursor-pointer rounded-full border-0 transition-all ${index === activeIndex ? "w-8 bg-brand" : "w-2.5 bg-line hover:bg-muted"}`}
              type="button"
              aria-label={`Show ${category.name}`}
              aria-current={index === activeIndex ? "true" : undefined}
              onClick={() => goTo(index)}
            />
          ))}
        </div>
        <Link className="inline-flex items-center gap-2 text-sm font-bold text-brand" to="/search">
          All products <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
      <p className="sr-only" aria-live="polite">
        Showing category {activeIndex + 1} of {categories.length}: {categories[activeIndex]?.name}
      </p>
    </section>
  );
};
````

### `web/src/features/catalog/components/MobileFilterDrawer.tsx`

Source lines: 124

````tsx
import React, { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

import type { BrandOption, CategoryOption } from "../../../api/catalog";
import type { CatalogFilterChanges, CatalogFilters } from "../types/catalog";
import { CatalogFilters as FilterControls } from "./CatalogFilters";

interface Props {
  brands: BrandOption[];
  categories: CategoryOption[];
  filters: CatalogFilters;
  onApply: (changes: CatalogFilterChanges) => void;
  onClose: () => void;
  open: boolean;
}

export const MobileFilterDrawer: React.FC<Props> = ({
  brands,
  categories,
  filters,
  onApply,
  onClose,
  open,
}) => {
  const [draft, setDraft] = useState(filters);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setDraft(filters);
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab" || !drawerRef.current) return;

      const focusable = Array.from(
        drawerRef.current.querySelectorAll<HTMLElement>(
          "button:not([disabled]), input:not([disabled]), select:not([disabled]), [href]",
        ),
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
      returnFocusRef.current?.focus();
    };
  }, [filters, onClose, open]);

  if (!open) return null;

  const apply = () => {
    onApply({
      category: draft.category,
      brand: draft.brand,
      minPrice: draft.minPrice,
      maxPrice: draft.maxPrice,
      inStock: draft.inStock,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/45 lg:hidden" onMouseDown={onClose}>
      <section
        ref={drawerRef}
        aria-labelledby="mobile-filter-title"
        aria-modal="true"
        className="ml-auto flex h-full w-[min(90vw,390px)] flex-col bg-surface shadow-2xl"
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="m-0 text-xl" id="mobile-filter-title">Filter products</h2>
          <button
            ref={closeButtonRef}
            className="grid size-10 cursor-pointer place-items-center rounded-full border border-line bg-surface text-ink hover:border-brand hover:text-brand"
            type="button"
            aria-label="Close product filters"
            onClick={onClose}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-5">
          <FilterControls
            brands={brands}
            categories={categories}
            filters={draft}
            idPrefix="mobile-catalog"
            onChange={(changes) => setDraft((current) => ({ ...current, ...changes }))}
          />
        </div>
        <footer className="border-t border-line p-4">
          <button
            className="w-full cursor-pointer rounded-control border-0 bg-brand px-5 py-3 font-bold text-white hover:bg-brand-hover"
            type="button"
            onClick={apply}
          >
            Apply filters
          </button>
        </footer>
      </section>
    </div>
  );
};
````

### `web/src/features/catalog/components/ProductGrid.tsx`

Source lines: 55

````tsx
import React from "react";
import { PackageSearch } from "lucide-react";

import type { Product } from "../../../api/products";
import { ProductCard } from "../../../components/ProductCard";

interface Props {
  error: string;
  loading: boolean;
  onClearFilters: () => void;
  products: Product[];
}

export const ProductGrid: React.FC<Props> = ({ error, loading, onClearFilters, products }) => {
  if (error) return <div className="alert alert-error">{error}</div>;

  if (loading) {
    return (
      <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-6" aria-label="Loading products">
        {Array.from({ length: 8 }, (_, index) => (
          <div className="overflow-hidden rounded-control border border-line bg-surface" key={index}>
            <div className="aspect-square animate-pulse bg-[#e7eee9]" />
            <div className="space-y-3 p-5">
              <div className="h-4 w-3/4 animate-pulse rounded bg-[#e7eee9]" />
              <div className="h-5 w-1/2 animate-pulse rounded bg-[#e7eee9]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="rounded-card border border-line bg-surface p-10 text-center">
        <PackageSearch className="mx-auto text-brand" size={44} />
        <h2 className="mt-4 mb-2 text-2xl">No products match these filters</h2>
        <p className="m-0 text-muted">Try a different category, brand, price range, or stock option.</p>
        <button
          className="mt-5 cursor-pointer rounded-control border-0 bg-brand px-5 py-2.5 font-bold text-white hover:bg-brand-hover"
          type="button"
          onClick={onClearFilters}
        >
          Clear filters
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-6">
      {products.map((product) => <ProductCard key={product.id} product={product} />)}
    </div>
  );
};
````

### `web/src/features/catalog/components/ProductSearch.tsx`

Source lines: 247

````tsx
import React, { FormEvent, KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { ArrowRight, LoaderCircle, Package, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { ProductSuggestion } from "../../../api/products";
import { formatProductPrice } from "../utils/formatters";
import { useProductSuggestions } from "../hooks/useProductSuggestions";
import {
  PRODUCT_SEARCH_DRAFT_EVENT,
  publishProductSearchDraft,
} from "../../storefront/storefrontSearch";

interface Props {
  className?: string;
  initialValue?: string;
  placeholder?: string;
  stickySource?: boolean;
  variant?: "default" | "compact";
}

interface HighlightedTextProps {
  query: string;
  text: string;
}

const HighlightedText: React.FC<HighlightedTextProps> = ({ query, text }) => {
  const index = text.toLocaleLowerCase().indexOf(query.trim().toLocaleLowerCase());
  if (index < 0 || !query.trim()) return <>{text}</>;

  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded-sm bg-warning-soft px-0 text-inherit">
        {text.slice(index, index + query.trim().length)}
      </mark>
      {text.slice(index + query.trim().length)}
    </>
  );
};

export const ProductSearch: React.FC<Props> = ({
  className = "",
  initialValue = "",
  placeholder = "Search products, brands, categories or SKU",
  stickySource = false,
  variant = "default",
}) => {
  const navigate = useNavigate();
  const rootRef = useRef<HTMLDivElement>(null);
  const listboxId = `product-search-${useId().replace(/:/g, "")}`;
  const [query, setQuery] = useState(initialValue);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const { suggestions, loading, error } = useProductSuggestions(query);
  const normalizedQuery = query.trim();
  const showDropdown = open && normalizedQuery.length >= 2;
  const compact = variant === "compact";

  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const synchronizeDraft = (event: Event) => {
      setQuery((event as CustomEvent<string>).detail);
    };
    window.addEventListener(PRODUCT_SEARCH_DRAFT_EVENT, synchronizeDraft);
    return () => window.removeEventListener(PRODUCT_SEARCH_DRAFT_EVENT, synchronizeDraft);
  }, []);

  useEffect(() => {
    setActiveIndex(-1);
  }, [suggestions]);

  useEffect(() => {
    const closeWhenOutside = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", closeWhenOutside);
    return () => document.removeEventListener("pointerdown", closeWhenOutside);
  }, []);

  const openSuggestion = (suggestion: ProductSuggestion) => {
    setOpen(false);
    navigate(`/products/${suggestion.slug}`);
  };

  const openResults = () => {
    if (normalizedQuery.length < 2) return;
    setOpen(false);
    navigate(`/search?q=${encodeURIComponent(normalizedQuery)}`);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (activeIndex >= 0 && suggestions[activeIndex]) {
      openSuggestion(suggestions[activeIndex]);
      return;
    }
    openResults();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) => Math.min(current + 1, suggestions.length - 1));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) => Math.max(current - 1, 0));
    }
  };

  return (
    <div
      className={`relative z-30 w-full ${compact ? "min-w-0 max-w-none" : "mx-auto max-w-2xl"} ${className}`}
      data-header-search-source={stickySource ? "true" : undefined}
      data-search-variant={variant}
      ref={rootRef}
    >
      <form
        className={`flex items-stretch rounded-card border bg-surface focus-within:ring-brand/20 ${compact ? "border-line p-1 shadow-sm focus-within:ring-2" : "border-transparent p-1.5 shadow-[0_18px_45px_rgba(15,48,30,0.18)] focus-within:ring-4"}`}
        onSubmit={submit}
        role="search"
      >
        <label className="sr-only" htmlFor={`${listboxId}-input`}>Search products</label>
        <Search className={`my-auto shrink-0 text-muted ${compact ? "ml-2" : "ml-3"}`} aria-hidden="true" size={compact ? 18 : 21} />
        <input
          id={`${listboxId}-input`}
          type="search"
          className={`min-w-0 flex-1 border-0 bg-transparent text-left text-ink outline-none placeholder:text-muted ${compact ? "px-2.5 py-2 text-sm" : "px-3 py-3 text-base"}`}
          value={query}
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-expanded={showDropdown}
          aria-activedescendant={activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined}
          onChange={(event) => {
            const nextQuery = event.target.value;
            setQuery(nextQuery);
            publishProductSearchDraft(nextQuery);
            setOpen(true);
          }}
          onFocus={() => {
            if (normalizedQuery.length >= 2) setOpen(true);
          }}
          onKeyDown={handleKeyDown}
        />
        <button
          type="submit"
          className={`inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-control border-0 bg-brand font-bold text-white transition-colors hover:bg-brand-hover ${compact ? "px-3" : "px-5"}`}
        >
          <span className={compact ? "sr-only" : "max-[480px]:sr-only"}>Search</span>
          <ArrowRight aria-hidden="true" size={compact ? 16 : 18} />
        </button>
      </form>

      {showDropdown && (
        <div className="absolute top-full right-0 left-0 mt-2 overflow-hidden rounded-card border border-line bg-surface text-left text-ink shadow-[0_20px_55px_rgba(15,48,30,0.2)]">
          <div id={listboxId} role="listbox" aria-label="Product suggestions" className="max-h-[26rem] overflow-y-auto p-2">
            {loading && (
              <div className="flex items-center gap-2 px-4 py-5 text-sm text-muted" role="status">
                <LoaderCircle className="animate-spin" size={18} />
                Finding products...
              </div>
            )}

            {!loading && error && (
              <div className="px-4 py-5 text-sm text-danger" role="status">
                {error} Press Enter to search the catalog.
              </div>
            )}

            {!loading && !error && suggestions.length === 0 && (
              <div className="px-4 py-5 text-sm text-muted" role="status">
                No product suggestions for “{normalizedQuery}”.
              </div>
            )}

            {!loading && !error && suggestions.map((suggestion, index) => (
              <button
                id={`${listboxId}-option-${index}`}
                key={suggestion.id}
                type="button"
                role="option"
                aria-selected={activeIndex === index}
                className={`flex w-full cursor-pointer items-center gap-3 rounded-control border-0 px-3 py-2.5 text-left transition-colors ${activeIndex === index ? "bg-positive-soft" : "bg-transparent hover:bg-page"}`}
                onClick={() => openSuggestion(suggestion)}
                onMouseEnter={() => setActiveIndex(index)}
              >
                <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-control border border-line bg-page text-muted">
                  {suggestion.thumbnail ? (
                    <img
                      src={suggestion.thumbnail.url}
                      alt={suggestion.thumbnail.altText || suggestion.name}
                      className="size-full object-cover"
                    />
                  ) : (
                    <Package aria-hidden="true" size={22} />
                  )}
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <strong className="truncate text-sm">
                    <HighlightedText text={suggestion.name} query={normalizedQuery} />
                  </strong>
                  <span className="truncate text-xs text-muted">
                    {suggestion.category.name}{suggestion.brand ? ` · ${suggestion.brand.name}` : ""}
                  </span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1">
                  <strong className="text-sm text-brand">{formatProductPrice(suggestion.price)}</strong>
                  <small className={suggestion.inStock ? "text-positive" : "text-danger"}>
                    {suggestion.inStock ? "In stock" : "Out of stock"}
                  </small>
                </span>
              </button>
            ))}
          </div>

          <button
            type="button"
            className="flex w-full cursor-pointer items-center justify-between border-0 border-t border-line bg-page px-5 py-3 text-left text-sm font-bold text-brand hover:bg-positive-soft"
            onClick={openResults}
          >
            View all results for “{normalizedQuery}”
            <ArrowRight aria-hidden="true" size={17} />
          </button>
        </div>
      )}
    </div>
  );
};
````

### `web/src/features/catalog/components/SortSelect.tsx`

Source lines: 26

````tsx
import React from "react";

import type { ProductSort } from "../../../api/products";

interface Props {
  disabled?: boolean;
  onChange: (sort: ProductSort) => void;
  value: ProductSort;
}

export const SortSelect: React.FC<Props> = ({ disabled = false, onChange, value }) => (
  <label className="flex items-center gap-3 text-sm font-semibold text-ink">
    <span className="shrink-0">Sort by</span>
    <select
      className="rounded-control border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand focus:ring-3 focus:ring-brand/15"
      disabled={disabled}
      value={value}
      onChange={(event) => onChange(event.target.value as ProductSort)}
    >
      <option value="newest">Newest</option>
      <option value="price_asc">Price: low to high</option>
      <option value="price_desc">Price: high to low</option>
      <option value="name_asc">Name: A–Z</option>
    </select>
  </label>
);
````

### `web/src/features/catalog/components/catalog-components.test.tsx`

Source lines: 106

````tsx
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import type { BrandOption, CategoryOption } from "../../../api/catalog";
import type { CatalogFilters as CatalogFilterValues } from "../types/catalog";
import { ActiveFilterChips } from "./ActiveFilterChips";
import { CatalogFilters } from "./CatalogFilters";
import { CategoryNavigation } from "./CategoryNavigation";
import { ProductSearch } from "./ProductSearch";

const categories: CategoryOption[] = [
  {
    id: "2",
    parentId: null,
    name: "Accessories",
    slug: "accessories",
    description: null,
    imageUrl: null,
    displayImageUrl: "/uploads/products/sunglasses.webp",
    productCount: 3,
    sortOrder: 1,
    allowProducts: true,
    showOnHomepage: true,
    children: [],
  },
];

const brands: BrandOption[] = [
  { id: "1", name: "DokanBD", slug: "dokanbd", logoUrl: null },
];

const filters: CatalogFilterValues = {
  category: "accessories",
  brand: "dokanbd",
  minPrice: 500,
  maxPrice: 3000,
  inStock: true,
  sort: "newest",
  page: 1,
  limit: 12,
};

describe("catalog discovery components", () => {
  it("renders typed category, brand, price, and stock controls", () => {
    const html = renderToStaticMarkup(
      <CatalogFilters
        brands={brands}
        categories={categories}
        filters={filters}
        onChange={vi.fn()}
      />,
    );

    expect(html).toContain("Category");
    expect(html).toContain("Accessories");
    expect(html).toContain("DokanBD");
    expect(html).toContain("Minimum price");
    expect(html).toContain("In-stock products only");
  });

  it("renders removable active-filter descriptions", () => {
    const html = renderToStaticMarkup(
      <ActiveFilterChips
        brands={brands}
        categories={categories}
        filters={filters}
        onChange={vi.fn()}
        onClear={vi.fn()}
      />,
    );

    expect(html).toContain("Category: Accessories");
    expect(html).toContain("Brand: DokanBD");
    expect(html).toContain("In stock");
    expect(html).toContain("Clear filters");
  });

  it("links homepage categories to shareable catalog URLs", () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <CategoryNavigation categories={categories} />
      </MemoryRouter>,
    );

    expect(html).toContain("Shop by category");
    expect(html).toContain("/search?category=accessories");
    expect(html).toContain("/uploads/products/sunglasses.webp");
    expect(html).toContain("3 products");
    expect(html).toContain("Previous category");
    expect(html).toContain("Next category");
  });

  it("renders compact and sticky-source search variants", () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <ProductSearch stickySource variant="compact" />
      </MemoryRouter>,
    );

    expect(html).toContain('data-header-search-source="true"');
    expect(html).toContain('data-search-variant="compact"');
    expect(html).toContain("Search products");
  });
});
````

### `web/src/features/catalog/hooks/useCatalogFilters.ts`

Source lines: 27

````ts
import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import type { CatalogFilterChanges } from "../types/catalog";
import {
  clearCatalogParameters,
  parseCatalogFilters,
  updateCatalogParameters,
} from "../utils/catalogParams";

export function useCatalogFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(
    () => parseCatalogFilters(searchParams),
    [searchParams],
  );

  const updateFilters = (changes: CatalogFilterChanges) => {
    setSearchParams(updateCatalogParameters(searchParams, changes));
  };

  const clearFilters = () => {
    setSearchParams(clearCatalogParameters(searchParams));
  };

  return { filters, updateFilters, clearFilters };
}
````

### `web/src/features/catalog/hooks/useCatalogProducts.ts`

Source lines: 42

````ts
import { useEffect, useState } from "react";

import { ApiException } from "../../../api/client";
import { PaginatedProducts, productApi } from "../../../api/products";
import type { CatalogFilters } from "../types/catalog";

const emptyResult: PaginatedProducts = {
  products: [],
  pagination: { page: 1, limit: 12, total: 0, totalPages: 0 },
};

export function useCatalogProducts(filters: CatalogFilters) {
  const [result, setResult] = useState<PaginatedProducts>(emptyResult);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");

    productApi
      .getProducts(filters, controller.signal)
      .then(setResult)
      .catch((requestError) => {
        if (controller.signal.aborted) return;
        setResult(emptyResult);
        setError(
          requestError instanceof ApiException
            ? requestError.error.message
            : "Products could not be loaded.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [filters]);

  return { ...result, loading, error };
}
````

### `web/src/features/catalog/hooks/useCatalogReferences.ts`

Source lines: 35

````ts
import { useEffect, useState } from "react";

import { BrandOption, catalogApi, CategoryOption } from "../../../api/catalog";

export function useCatalogReferences() {
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [brands, setBrands] = useState<BrandOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    Promise.all([
      catalogApi.getCategories(controller.signal),
      catalogApi.getBrands(controller.signal),
    ])
      .then(([categoryOptions, brandOptions]) => {
        setCategories(categoryOptions);
        setBrands(brandOptions);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setError("Product filters could not be loaded.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  return { categories, brands, loading, error };
}
````

### `web/src/features/catalog/hooks/useProductSuggestions.ts`

Source lines: 57

````ts
import { useEffect, useState } from "react";

import { ApiException } from "../../../api/client";
import { ProductSuggestion, productApi } from "../../../api/products";

interface SuggestionState {
  error: string;
  loading: boolean;
  suggestions: ProductSuggestion[];
}

const emptyState: SuggestionState = {
  error: "",
  loading: false,
  suggestions: [],
};

export function useProductSuggestions(query: string, delay = 280) {
  const [state, setState] = useState<SuggestionState>(emptyState);

  useEffect(() => {
    const search = query.trim();

    if (search.length < 2) {
      setState(emptyState);
      return;
    }

    const controller = new AbortController();
    let active = true;
    const timeout = window.setTimeout(async () => {
      setState((current) => ({ ...current, loading: true, error: "" }));

      try {
        const suggestions = await productApi.getSearchSuggestions(search, 8, controller.signal);
        if (active) setState({ suggestions, loading: false, error: "" });
      } catch (error) {
        if (!active || controller.signal.aborted) return;
        setState({
          suggestions: [],
          loading: false,
          error: error instanceof ApiException
            ? error.error.message
            : "Suggestions are temporarily unavailable.",
        });
      }
    }, delay);

    return () => {
      active = false;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [delay, query]);

  return state;
}
````

### `web/src/features/catalog/types/catalog.ts`

Source lines: 14

````ts
import type { ProductListParams, ProductSort } from "../../../api/products";

export interface CatalogFilters extends ProductListParams {
  sort: ProductSort;
  page: number;
  limit: number;
}

export type CatalogFilterChanges = Partial<
  Pick<
    CatalogFilters,
    "search" | "category" | "brand" | "minPrice" | "maxPrice" | "inStock" | "sort" | "page"
  >
>;
````

### `web/src/features/catalog/utils/catalogOptions.ts`

Source lines: 15

````ts
import type { CategoryOption } from "../../../api/catalog";

export interface FlatCategoryOption extends CategoryOption {
  depth: number;
}

export function flattenCategories(
  categories: CategoryOption[],
  depth = 0,
): FlatCategoryOption[] {
  return categories.flatMap((category) => [
    { ...category, depth },
    ...flattenCategories(category.children, depth + 1),
  ]);
}
````

### `web/src/features/catalog/utils/catalogParams.test.ts`

Source lines: 44

````ts
import { describe, expect, it } from "vitest";

import {
  clearCatalogParameters,
  parseCatalogFilters,
  updateCatalogParameters,
} from "./catalogParams";

describe("catalog URL parameters", () => {
  it("parses valid filters and repairs unsafe URL values", () => {
    const filters = parseCatalogFilters(
      new URLSearchParams(
        "q=watch&category=accessories&brand=dokanbd&minPrice=500&maxPrice=3000&inStock=true&sort=price_asc&page=-4",
      ),
    );

    expect(filters).toEqual({
      search: "watch",
      category: "accessories",
      brand: "dokanbd",
      minPrice: 500,
      maxPrice: 3000,
      inStock: true,
      sort: "price_asc",
      page: 1,
      limit: 12,
    });
  });

  it("resets pagination when filters change and preserves unrelated filters", () => {
    const next = updateCatalogParameters(
      new URLSearchParams("q=watch&brand=dokanbd&page=4"),
      { category: "accessories" },
    );

    expect(next.toString()).toBe("q=watch&brand=dokanbd&page=1&category=accessories");
  });

  it("changes pages without resetting them and clears filters while keeping search", () => {
    const current = new URLSearchParams("q=watch&brand=dokanbd&page=4");
    expect(updateCatalogParameters(current, { page: 2 }).get("page")).toBe("2");
    expect(clearCatalogParameters(current).toString()).toBe("q=watch");
  });
});
````

### `web/src/features/catalog/utils/catalogParams.ts`

Source lines: 78

````ts
import type { ProductSort } from "../../../api/products";
import type { CatalogFilterChanges, CatalogFilters } from "../types/catalog";

const validSorts: ProductSort[] = [
  "newest",
  "price_asc",
  "price_desc",
  "name_asc",
];

function optionalText(value: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function optionalMoney(value: string | null) {
  if (value === null || value.trim() === "") return undefined;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : undefined;
}

function positivePage(value: string | null) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : 1;
}

export function parseCatalogFilters(searchParams: URLSearchParams): CatalogFilters {
  const requestedSort = searchParams.get("sort") as ProductSort | null;
  const search = optionalText(searchParams.get("q"));
  const stock = searchParams.get("inStock");

  return {
    search: search && search.length >= 2 ? search : undefined,
    category: optionalText(searchParams.get("category")),
    brand: optionalText(searchParams.get("brand")),
    minPrice: optionalMoney(searchParams.get("minPrice")),
    maxPrice: optionalMoney(searchParams.get("maxPrice")),
    inStock: stock === "true" ? true : stock === "false" ? false : undefined,
    sort: requestedSort && validSorts.includes(requestedSort) ? requestedSort : "newest",
    page: positivePage(searchParams.get("page")),
    limit: 12,
  };
}

function parameterName(key: keyof CatalogFilterChanges) {
  return key === "search" ? "q" : key;
}

export function updateCatalogParameters(
  current: URLSearchParams,
  changes: CatalogFilterChanges,
) {
  const next = new URLSearchParams(current);

  for (const [key, value] of Object.entries(changes) as Array<
    [keyof CatalogFilterChanges, string | number | boolean | undefined]
  >) {
    const name = parameterName(key);
    if (value === undefined || value === "") next.delete(name);
    else next.set(name, String(value));
  }

  if (!(Object.keys(changes).length === 1 && changes.page !== undefined)) {
    next.set("page", "1");
  }

  return next;
}

export function clearCatalogParameters(
  current: URLSearchParams,
  preserveSearch = true,
) {
  const next = new URLSearchParams();
  const search = current.get("q")?.trim();
  if (preserveSearch && search) next.set("q", search);
  return next;
}
````

### `web/src/features/catalog/utils/formatters.ts`

Source lines: 9

````ts
export const productPriceFormatter = new Intl.NumberFormat("en-BD", {
  style: "currency",
  currency: "BDT",
  minimumFractionDigits: 0,
});

export function formatProductPrice(value: string | number) {
  return productPriceFormatter.format(Number(value));
}
````

## Product and administration styles

Contains the CSS that controls the editor, product pages, catalog tables, and shared administration presentation.

### `web/src/styles/features/product-editor.css`

Source lines: 1239

````css
/* Product editor workbench
 *
 * This file is intentionally scoped to .admin-product-editor-page. The editor
 * uses a denser, operational layout without changing forms or tables elsewhere
 * in the admin application.
 */

.admin-product-editor-page {
  --product-editor-panel-radius: 0.5rem;
  --product-editor-control-radius: 0.375rem;
  --product-editor-soft-bg: color-mix(in srgb, var(--primary) 4%, var(--surface));
  --product-editor-soft-border: color-mix(in srgb, var(--primary) 30%, var(--border));
  width: 100%;
  max-width: none;
  min-width: 0;
  padding: 1.125rem 1.25rem 2rem;
  overflow-x: clip;
}

.admin-product-editor-page,
.admin-product-editor-page * {
  min-inline-size: 0;
}

.product-editor-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.product-editor-header > div:first-child {
  min-width: 0;
}

.product-editor-header .product-back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  margin: 0 0 0.25rem;
  color: var(--text-muted);
  font-size: 0.75rem;
  font-weight: 650;
}

.product-editor-header .eyebrow {
  margin: 0;
  font-size: 0.7rem;
}

.product-editor-header h1 {
  margin: 0.18rem 0 0;
  font-size: clamp(1.45rem, 2vw, 1.8rem);
  line-height: 1.15;
  letter-spacing: -0.025em;
}

.product-editor-header p:last-child {
  max-width: 48rem;
  margin: 0.25rem 0 0;
  color: var(--text-muted);
  font-size: 0.78rem;
}

.product-editor-breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--text-muted);
  font-size: 0.7rem;
}

.product-editor-breadcrumb a {
  color: var(--primary);
  font-weight: 700;
}

.product-editor-actions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: flex-end;
  gap: 0.6rem;
}

.product-editor-actions .btn,
.product-editor-bottom-actions .btn {
  min-height: 2.35rem;
  padding: 0.55rem 1rem;
  border: 1px solid var(--border);
  border-radius: var(--product-editor-control-radius);
  font-size: 0.82rem;
  line-height: 1;
  white-space: nowrap;
}

.product-editor-actions .btn-primary,
.product-editor-bottom-actions .btn-primary {
  border-color: var(--primary);
}

.product-editor-form {
  display: grid;
  gap: 0.75rem;
  margin: 0 0 1.25rem;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.product-editor-panel {
  width: 100%;
  min-width: 0;
  padding: 0.85rem;
  border: 1px solid var(--border);
  border-radius: var(--product-editor-panel-radius);
  background: var(--surface);
  box-shadow: 0 2px 10px rgb(28 67 43 / 4%);
}

.product-editor-panel > :first-child,
.product-details-panel > :first-child {
  margin-top: 0;
}

.product-editor-panel > :last-child,
.product-details-panel > :last-child {
  margin-bottom: 0;
}

.product-summary-grid {
  display: grid;
  grid-template-columns: minmax(15rem, 1.35fr) repeat(3, minmax(10rem, 1fr));
  align-items: start;
  gap: 0.7rem 0.9rem;
}

.product-summary-copy {
  display: grid;
  grid-column: 1 / -1;
  grid-template-columns: minmax(14rem, 0.8fr) minmax(20rem, 1.7fr);
  gap: 0.7rem 0.9rem;
  padding-top: 0.15rem;
}

.admin-product-editor-page textarea.product-short-description {
  min-height: 5rem;
}

.product-details-panel { display: block; }

.product-details-panel > summary {
  cursor: pointer;
  font-size: 0.82rem;
  font-weight: 800;
  list-style-position: inside;
}

.product-details-panel[open] > summary { margin-bottom: 0.9rem; }

.product-details-grid {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(11rem, 0.7fr);
  gap: 0.75rem 0.9rem;
  margin-bottom: 1rem;
}

.product-details-description { grid-column: 1 / -1; }

.admin-product-editor-page .form-group {
  gap: 0.32rem;
}

.admin-product-editor-page .form-group > label,
.admin-product-editor-page .admin-field-label-row label,
.admin-product-editor-page .product-editor-panel label {
  color: var(--text-main);
  font-size: 0.72rem;
  font-weight: 700;
}

.admin-product-editor-page .admin-field-label-row {
  gap: 0.5rem;
}

.admin-product-editor-page .admin-field-label-row a {
  color: var(--primary);
  font-size: 0.68rem;
  font-weight: 750;
}

.admin-product-editor-page .form-input {
  width: 100%;
  min-height: 2.25rem;
  padding: 0.45rem 0.62rem;
  border-radius: var(--product-editor-control-radius);
  font-size: 0.79rem;
  line-height: 1.25;
}

.admin-product-editor-page textarea.form-input {
  min-height: 5rem;
  line-height: 1.45;
}

.admin-product-editor-page .admin-field-help {
  color: var(--text-muted);
  font-size: 0.66rem;
  line-height: 1.35;
}

.variant-config-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.08fr) minmax(23rem, 0.92fr);
  align-items: stretch;
  gap: 0.75rem;
}

.variant-options-panel,
.variant-settings-panel {
  min-width: 0;
  padding: 0.8rem;
  border: 1px solid var(--border);
  border-radius: var(--product-editor-panel-radius);
  background: var(--surface);
}

.variant-options-panel,
.variant-settings-panel,
.variant-settings-controls {
  display: grid;
  align-content: start;
  gap: 0.7rem;
}

.variant-options-panel .variant-workbench-heading,
.variant-settings-panel .variant-workbench-heading {
  align-items: center;
}

.admin-product-editor-page .variant-workbench-heading h2,
.admin-product-editor-page .variant-workbench-heading h3 {
  margin: 0;
  font-size: 0.92rem;
  line-height: 1.25;
}

.admin-product-editor-page .variant-workbench-heading p {
  margin-top: 0.15rem;
  font-size: 0.68rem;
  line-height: 1.35;
}

.variant-options-panel .admin-option-selector {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(10.5rem, 1fr));
  gap: 0.55rem;
}

.variant-options-panel .admin-option-selector fieldset {
  min-width: 0;
  padding: 0.55rem;
  border-radius: 0.4rem;
  background: #fcfdfc;
}

.variant-options-panel .admin-option-selector legend {
  padding-inline: 0.2rem;
  font-size: 0.75rem;
}

.variant-options-panel .variant-suggestion-label {
  margin-bottom: 0.4rem;
  font-size: 0.62rem;
}

.variant-options-panel .variant-value-chips {
  display: grid;
  gap: 0.25rem;
}

.variant-options-panel .variant-value-chips label {
  width: 100%;
  min-height: 1.8rem;
  justify-content: flex-start;
  padding: 0.3rem 0.45rem;
  border: 1px solid var(--border);
  border-radius: 0.32rem;
  background: var(--surface);
  font-size: 0.7rem;
}

.variant-options-panel .variant-inline-add {
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.35rem !important;
  margin-top: 0.4rem;
  padding-top: 0.4rem;
}

.variant-options-panel .variant-inline-add .btn,
.variant-options-panel .variant-generate-button {
  min-height: 2.1rem;
  padding: 0.4rem 0.6rem;
  border: 1px solid var(--border);
  border-radius: var(--product-editor-control-radius);
  font-size: 0.7rem;
}

.variant-path-guide {
  display: flex;
  align-items: flex-start;
  gap: 0.55rem;
  padding: 0.6rem 0.7rem;
  border: 1px solid #cfe1ff;
  border-radius: 0.45rem;
  background: #f3f7ff;
  color: #315a94;
  font-size: 0.68rem;
  line-height: 1.4;
}

.variant-path-guide svg {
  flex: 0 0 auto;
  margin-top: 0.05rem;
}

.variant-path-selector fieldset {
  transition: opacity 160ms ease, border-color 160ms ease;
}

.variant-path-selector fieldset.is-locked {
  opacity: 0.58;
}

.variant-path-selector legend > span {
  display: inline-grid;
  width: 1.25rem;
  height: 1.25rem;
  margin-right: 0.35rem;
  border-radius: 999px;
  place-items: center;
  background: var(--primary);
  color: #fff;
  font-size: 0.64rem;
}

.variant-options-panel .variant-value-chips .variant-path-skip {
  border-style: dashed;
  color: var(--text-muted);
}

.variant-path-create-bar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 0.55rem;
  padding: 0.65rem;
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  background: #f8faf9;
}

.variant-path-create-bar > div {
  display: grid;
  min-width: 0;
  gap: 0.15rem;
}

.variant-path-create-bar small {
  color: var(--text-muted);
  font-size: 0.62rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.variant-path-create-bar strong {
  overflow: hidden;
  color: var(--text-primary);
  font-size: 0.75rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.variant-path-create-bar .btn {
  min-height: 2.2rem;
  padding: 0.42rem 0.65rem;
  font-size: 0.68rem;
  white-space: nowrap;
}

.variant-path-tree {
  padding: 0.7rem;
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  background: #fff;
}

.variant-path-tree > div {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.55rem;
  color: var(--text-primary);
  font-size: 0.72rem;
}

.variant-path-tree > div small {
  margin-left: auto;
  color: var(--text-muted);
}

.variant-path-tree-level {
  display: grid;
  gap: 0.3rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.variant-path-tree-level .variant-path-tree-level {
  margin: 0.3rem 0 0.1rem 0.75rem;
  padding-left: 0.75rem;
  border-left: 2px solid #dce6e0;
}

.variant-path-tree-node {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: stretch;
  gap: 0.3rem;
}

.variant-path-tree-level .variant-path-node-select {
  display: grid;
  grid-template-columns: 5rem minmax(0, 1fr) auto;
  align-items: center;
  width: 100%;
  gap: 0.45rem;
  padding: 0.38rem 0.5rem;
  border: 1px solid transparent;
  border-radius: 0.35rem;
  background: #f8faf9;
  color: var(--text-primary);
  text-align: left;
}

.variant-path-tree-level .variant-path-node-select:disabled {
  opacity: 1;
  cursor: default;
}

.variant-path-tree-level .variant-path-node-select:not(:disabled):hover,
.variant-path-tree-level .variant-path-node-select.is-selected {
  border-color: #9bcdb0;
  background: #edf8f1;
}

.variant-path-tree-level .variant-path-node-select small,
.variant-path-tree-level .variant-path-node-select em {
  color: var(--text-muted);
  font-size: 0.6rem;
  font-style: normal;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.variant-path-tree-level .variant-path-node-select > span {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.7rem;
  font-weight: 750;
}

.variant-path-tree-level .variant-path-node-select > span i {
  width: 0.65rem;
  height: 0.65rem;
  border: 1px solid rgb(0 0 0 / 12%);
  border-radius: 999px;
}

.variant-path-branch-remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.22rem;
  min-width: 2.65rem;
  padding: 0.35rem 0.45rem;
  border: 1px solid #f1cdcd;
  border-radius: 0.35rem;
  background: #fff7f7;
  color: #a33b3b;
}

.variant-path-branch-remove:hover {
  border-color: #dc9696;
  background: #ffeded;
}

.variant-path-branch-remove span {
  font-size: 0.62rem;
  font-weight: 750;
}

.variant-settings-controls {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.variant-settings-heading h3,
.variant-settings-heading p { margin: 0; }
.variant-settings-heading h3 { font-size: 0.92rem; }
.variant-settings-heading p { color: var(--text-muted); font-size: 0.68rem; margin-top: 0.15rem; }

.variant-settings-scope {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 0;
  padding: 0.55rem 0;
  border: 0;
  border-block: 1px solid var(--border);
}

.variant-settings-scope legend { float: left; margin-right: auto; font-size: 0.7rem; font-weight: 800; }
.variant-settings-scope label { display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.7rem; }

.variant-settings-card {
  padding: 0.65rem;
  border: 1px solid var(--border);
  border-radius: 0.4rem;
  background: #fcfdfc;
}

.variant-settings-toggle { display: flex; align-items: flex-start; gap: 0.55rem; }
.variant-settings-toggle span,
.variant-settings-toggle strong,
.variant-settings-toggle small { display: block; }
.variant-settings-toggle small { color: var(--text-muted); font-weight: 500; line-height: 1.35; margin-top: 0.1rem; }
.variant-settings-card .variant-settings-controls { margin-top: 0.65rem; }
.variant-settings-card .variant-settings-controls label { display: grid; gap: 0.25rem; }
.variant-settings-help { color: var(--text-muted); font-size: 0.7rem; line-height: 1.45; }
.variant-settings-help strong { display: block; color: var(--text-main); margin-bottom: 0.15rem; }

.variant-policy-card {
  display: grid;
  gap: 0.6rem;
  padding: 0.7rem;
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  background: #fcfdfc;
}

.variant-policy-heading {
  display: grid;
  gap: 0.5rem;
}

.variant-policy-heading > div:first-child {
  display: grid;
  gap: 0.12rem;
}

.variant-policy-heading strong {
  color: var(--text-primary);
  font-size: 0.74rem;
}

.variant-policy-heading small,
.variant-policy-content {
  color: var(--text-muted);
  font-size: 0.66rem;
  line-height: 1.4;
}

.variant-policy-scope {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.35rem;
}

.variant-policy-scope label {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  min-height: 2rem;
  padding: 0.35rem 0.45rem;
  border: 1px solid var(--border);
  border-radius: 0.35rem;
  background: #fff;
  color: var(--text-primary);
  font-size: 0.66rem;
  cursor: pointer;
}

.variant-policy-scope label:has(input:checked) {
  border-color: #93c8a9;
  background: #edf8f1;
  box-shadow: inset 0 0 0 1px #c8e7d4;
}

.variant-policy-content {
  padding-top: 0.55rem;
  border-top: 1px solid var(--border);
}

.variant-policy-warning {
  display: block;
  margin-top: 0.45rem;
  padding: 0.45rem;
  border-radius: 0.3rem;
  background: #fff6df;
  color: #8a6220;
}

.price-tier-scope-note,
.variant-media-scope-note {
  margin: 0;
  color: #8a6220;
  font-size: 0.64rem;
  line-height: 1.35;
}

.variant-media-scope-note {
  text-align: center;
}

.variant-settings-panel .admin-price-tier-builder { gap: 0.55rem; }
.variant-settings-panel .admin-price-tier-builder .admin-form-divider { display: none; }
.variant-settings-panel .admin-price-tier-builder .variant-workbench-heading { align-items: flex-start; }
.variant-settings-panel .admin-price-tier-builder .variant-workbench-heading h3 { font-size: 0.78rem; }
.variant-settings-panel .admin-price-tier-builder .variant-workbench-heading .btn { min-height: 2rem; padding: 0.35rem 0.5rem; font-size: 0.65rem; }
.variant-settings-panel .price-tier-empty { padding: 0.65rem; font-size: 0.68rem; }
.variant-settings-panel .price-tier-table { min-width: 42rem; }

.variant-settings-controls > fieldset {
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}

.variant-settings-controls legend {
  margin-bottom: 0.4rem;
  font-size: 0.7rem;
  font-weight: 750;
}

.variant-settings-controls label {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  min-height: 1.85rem;
  font-size: 0.7rem;
}

.variant-settings-controls input[type="checkbox"],
.variant-settings-controls input[type="radio"],
.admin-product-editor-page input[type="checkbox"],
.admin-product-editor-page input[type="radio"] {
  accent-color: var(--primary);
}

.variant-settings-cards {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.6rem;
}

.variant-settings-cards > section,
.variant-settings-cards > div {
  min-width: 0;
  padding: 0.65rem;
  border: 1px solid var(--border);
  border-radius: 0.4rem;
  background: #fcfdfc;
}

.variant-settings-cards h3,
.variant-settings-cards h4 {
  margin: 0 0 0.5rem;
  font-size: 0.74rem;
}

.variant-settings-cards .admin-offer-schedule {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.5rem;
  padding: 0;
  border: 0;
  background: transparent;
}

.variant-settings-cards .admin-offer-schedule > div {
  grid-column: 1 / -1;
}

.selected-variant-card {
  display: grid;
  gap: 0.7rem;
  min-width: 0;
  padding: 0.85rem;
  border: 1px solid var(--product-editor-soft-border);
  border-radius: var(--product-editor-panel-radius);
  background: var(--product-editor-soft-bg);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 70%);
}

.selected-variant-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.selected-variant-heading h2,
.selected-variant-heading h3 {
  margin: 0;
  color: var(--primary);
  font-size: 0.94rem;
}

.selected-variant-heading > div > span {
  color: var(--text-muted);
  font-size: 0.62rem;
  font-weight: 800;
  text-transform: uppercase;
}

.variant-status-pill {
  padding: 0.25rem 0.5rem;
  border-radius: 999px;
  color: var(--text-muted);
  background: var(--bg-color);
  font-size: 0.64rem;
  font-weight: 800;
}
.variant-status-pill.is-active { color: var(--success); background: var(--success-bg); }

.selected-variant-grid {
  display: grid;
  grid-template-columns: minmax(6rem, 0.75fr) repeat(6, minmax(6.5rem, 1fr));
  align-items: end;
  gap: 0.6rem;
}

.selected-variant-grid > label { display: grid; align-content: end; gap: 0.25rem; }
.selected-variant-grid > label > span { color: var(--error); }

.selected-variant-grid > .admin-field-wide {
  grid-column: 1 / -1;
}

.selected-variant-media {
  display: grid;
  grid-row: span 2;
  align-self: stretch;
  gap: 0.35rem;
  min-height: 6.4rem;
}

.selected-variant-preview {
  display: grid;
  place-items: center;
  width: 100%;
  height: 5rem;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 0.35rem;
  background: var(--surface);
  color: var(--text-muted);
}

.selected-variant-preview img,
.selected-variant-preview video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.selected-variant-media .btn {
  min-height: 1.9rem;
  padding: 0.35rem 0.45rem;
  border: 1px solid var(--border);
  border-radius: var(--product-editor-control-radius);
  font-size: 0.66rem;
}

.variant-media-button input { position: absolute; width: 1px; height: 1px; overflow: hidden; opacity: 0; }
.variant-media-button.is-disabled { cursor: not-allowed; opacity: 0.5; }

.variant-default-choice,
.variant-discount-schedule {
  margin: 0;
  padding: 0;
  border: 0;
}

.variant-default-choice legend,
.variant-discount-schedule legend { margin-bottom: 0.25rem; font-size: 0.7rem; font-weight: 800; }
.variant-default-choice {
  display: grid;
  grid-template-columns: repeat(2, auto);
  align-content: end;
  align-self: stretch;
  justify-content: start;
  gap: 0.3rem 0.7rem;
}
.variant-default-choice legend { grid-column: 1 / -1; position: static; width: 100%; }
.variant-default-choice label { display: inline-flex; align-items: center; gap: 0.25rem; }
.variant-discount-schedule { display: grid; grid-column: 1 / -1; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.55rem; padding-top: 0.45rem; border-top: 1px solid var(--border); }
.variant-discount-schedule legend { grid-column: 1 / -1; }
.variant-discount-schedule label { display: grid; gap: 0.25rem; }

.selected-variant-media-list { display: flex; flex-wrap: wrap; gap: 0.5rem; padding-top: 0.55rem; border-top: 1px solid var(--product-editor-soft-border); }
.selected-variant-media-list > div { position: relative; display: grid; grid-template-columns: 2.5rem minmax(4rem, 1fr) auto; align-items: center; gap: 0.4rem; min-width: 9rem; padding: 0.35rem; border: 1px solid var(--border); border-radius: 0.35rem; background: var(--surface); }
.selected-variant-media-list img,
.selected-variant-media-list video { width: 2.5rem; height: 2.5rem; border-radius: 0.25rem; object-fit: cover; }
.selected-variant-media-list span { overflow: hidden; color: var(--text-muted); font-size: 0.62rem; text-overflow: ellipsis; white-space: nowrap; }
.selected-variant-media-list button { display: grid; place-items: center; padding: 0.2rem; border: 0; color: var(--primary); background: transparent; cursor: pointer; }

.variant-table-panel {
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: var(--product-editor-panel-radius);
  background: var(--surface);
}

.variant-table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  min-height: 2.75rem;
  padding: 0.55rem 0.75rem;
  border-bottom: 1px solid var(--border);
}

.variant-table-toolbar h2,
.variant-table-toolbar h3,
.variant-table-toolbar p {
  margin: 0;
}

.variant-table-toolbar h2,
.variant-table-toolbar h3 {
  font-size: 0.9rem;
}

.variant-table-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 0.4rem;
}

.variant-table-actions .btn {
  min-height: 2rem;
  padding: 0.38rem 0.6rem;
  border: 1px solid var(--border);
  border-radius: var(--product-editor-control-radius);
  font-size: 0.68rem;
}

.variant-summary-scroll {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow-x: auto;
  overscroll-behavior-inline: contain;
  scrollbar-gutter: stable;
  -webkit-overflow-scrolling: touch;
}

.admin-product-editor-page .variant-summary-table {
  width: 100%;
  min-width: 68rem;
  border-collapse: collapse;
  table-layout: auto;
}

.admin-product-editor-page .variant-summary-table th,
.admin-product-editor-page .variant-summary-table td {
  height: 2.25rem;
  padding: 0.38rem 0.5rem;
  border-bottom: 1px solid var(--border);
  color: var(--text-main);
  font-size: 0.68rem;
  line-height: 1.25;
  text-align: left;
  vertical-align: middle;
  white-space: nowrap;
}

.admin-product-editor-page .variant-summary-table th {
  position: sticky;
  top: 0;
  z-index: 1;
  color: var(--text-muted);
  background: #f8faf9;
  font-size: 0.62rem;
  font-weight: 750;
  letter-spacing: 0.01em;
  text-transform: none;
}

.admin-product-editor-page .variant-summary-table tbody tr {
  cursor: pointer;
  transition: background-color 140ms ease;
}

.admin-product-editor-page .variant-summary-table tbody tr:hover,
.admin-product-editor-page .variant-summary-table tbody tr.is-selected {
  background: var(--product-editor-soft-bg);
}

.admin-product-editor-page .variant-summary-table tbody tr.is-selected td:first-child {
  box-shadow: inset 0.18rem 0 var(--primary);
}

.admin-product-editor-page .variant-summary-table tbody tr:last-child td {
  border-bottom: 0;
}

.admin-product-editor-page .variant-summary-table td strong,
.admin-product-editor-page .variant-summary-table td small { display: block; }
.admin-product-editor-page .variant-summary-table td small { color: var(--text-muted); font-size: 0.56rem; margin-top: 0.1rem; }
.variant-sku-cell { color: var(--primary); font-weight: 700; }
.variant-color-dot,
.variant-status-dot { display: inline-block; width: 0.5rem; height: 0.5rem; margin-right: 0.3rem; border: 1px solid rgb(0 0 0 / 8%); border-radius: 999px; background: #98a2b3; }
.variant-status-dot.is-active { background: #12b76a; }
.variant-row-actions { display: flex; align-items: center; gap: 0.25rem; }
.variant-row-actions button,
.variant-mobile-card > button { display: inline-grid; place-items: center; padding: 0.28rem; border: 0; border-radius: 0.3rem; color: var(--primary); background: var(--product-editor-soft-bg); cursor: pointer; }
.variant-row-actions button:last-child,
.variant-mobile-card > button { color: var(--error); background: var(--error-bg); }
.variant-table-toolbar > div:first-child > span { color: var(--text-muted); font-size: 0.62rem; }
.variant-table-note { padding: 0.45rem 0.7rem; }

.admin-product-editor-page .variant-summary-table a,
.admin-product-editor-page .variant-summary-table .variant-sku {
  color: var(--primary);
  font-weight: 650;
}

.admin-product-editor-page .variant-summary-table .status-pill {
  padding: 0.2rem 0.42rem;
  font-size: 0.62rem;
}

.variant-mobile-list {
  display: none;
}

.variant-mobile-card {
  min-width: 0;
  padding: 0.7rem;
  border: 1px solid var(--border);
  border-radius: var(--product-editor-panel-radius);
  background: var(--surface);
}

.variant-mobile-card.is-selected {
  border-color: var(--product-editor-soft-border);
  background: var(--product-editor-soft-bg);
  box-shadow: inset 0.18rem 0 var(--primary);
}

.variant-mobile-card > header,
.variant-mobile-card > footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.65rem;
}

.variant-mobile-card { position: relative; cursor: pointer; }
.variant-mobile-card > div:first-child strong,
.variant-mobile-card > div:first-child span { display: block; }
.variant-mobile-card > div:first-child span { color: var(--text-muted); font-size: 0.62rem; margin-top: 0.15rem; }
.variant-mobile-card > button { position: absolute; top: 0.6rem; right: 0.6rem; }
.variant-mobile-card dl { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.5rem; margin: 0.65rem 0 0; }
.variant-mobile-card dl > div { min-width: 0; }

.variant-mobile-card dl {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.5rem;
  margin: 0.65rem 0;
}

.variant-mobile-card dt {
  color: var(--text-muted);
  font-size: 0.6rem;
  font-weight: 700;
}

.variant-mobile-card dd {
  overflow: hidden;
  margin: 0.1rem 0 0;
  font-size: 0.72rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-media-library {
  display: grid;
  gap: 0.65rem;
  min-width: 0;
}

.product-media-library .admin-media-grid {
  grid-template-columns: repeat(auto-fit, minmax(8rem, 1fr));
  gap: 0.65rem;
}

.product-media-library .admin-media-card {
  border-radius: 0.45rem;
}

.product-media-library .admin-media-actions {
  padding: 0.45rem;
}

.product-media-library .admin-image-picker {
  min-height: 5.5rem;
  padding: 0.8rem;
  border-width: 1px;
  border-radius: 0.45rem;
}

.product-editor-bottom-actions {
  position: sticky;
  bottom: 0;
  z-index: 6;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.6rem;
  margin: 0;
  padding: 0.75rem 0;
  border-top: 0;
  background: linear-gradient(to bottom, rgb(244 247 245 / 0%), var(--bg-color) 28%);
}

@media (max-width: 1200px) {
  .product-summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .product-details-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .variant-config-grid {
    grid-template-columns: 1fr;
  }

  .selected-variant-grid {
    grid-template-columns: minmax(6rem, 0.7fr) repeat(3, minmax(7rem, 1fr));
  }
}

@media (max-width: 900px) {
  .admin-product-editor-page {
    padding: 0.9rem 1rem 1.5rem;
  }

  .product-editor-header {
    align-items: center;
  }

  .variant-settings-cards {
    grid-template-columns: 1fr;
  }

  .variant-table-toolbar {
    align-items: flex-start;
  }

  .variant-table-actions {
    max-width: 60%;
  }
}

@media (max-width: 700px) {
  .admin-product-editor-page {
    padding-inline: 0.75rem;
  }

  .product-editor-header {
    align-items: stretch;
    flex-direction: column;
  }

  .product-editor-header p:last-child {
    display: none;
  }

  .product-editor-actions {
    width: 100%;
  }

  .product-editor-actions .btn {
    flex: 1 1 0;
  }

  .product-summary-grid,
  .product-summary-copy,
  .product-details-grid,
  .selected-variant-grid,
  .variant-settings-controls {
    grid-template-columns: 1fr;
  }

  .product-details-description,
  .selected-variant-grid > .admin-field-wide,
  .variant-discount-schedule {
    grid-column: auto;
  }

  .variant-discount-schedule { grid-template-columns: 1fr; }

  .variant-options-panel .admin-option-selector {
    grid-template-columns: 1fr;
  }

  .selected-variant-media {
    grid-row: auto;
    grid-template-columns: 5rem minmax(0, 1fr);
    align-items: center;
    min-height: 0;
  }

  .selected-variant-preview {
    height: 5rem;
  }

  .variant-table-toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .variant-table-actions {
    max-width: none;
    justify-content: flex-start;
  }

  .variant-path-create-bar {
    grid-template-columns: 1fr;
  }

  .variant-path-create-bar > div {
    grid-column: auto;
  }

  .variant-path-create-bar .btn {
    width: 100%;
  }

  .variant-path-tree-level .variant-path-node-select {
    grid-template-columns: 3.8rem minmax(0, 1fr) auto;
  }

  .product-media-library .pending-image-list > div {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 520px) {
  .admin-product-editor-page {
    padding: 0.7rem 0.6rem 5rem;
  }

  .product-editor-panel,
  .variant-options-panel,
  .variant-settings-panel,
  .selected-variant-card {
    padding: 0.7rem;
  }

  .product-editor-actions {
    display: none;
  }

  .variant-summary-scroll {
    display: none;
  }

  .variant-mobile-list {
    display: grid;
    gap: 0.55rem;
    padding: 0.65rem;
  }

  .variant-table-actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    width: 100%;
  }

  .variant-table-actions .btn {
    width: 100%;
  }

  .variant-mobile-card dl {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .product-editor-bottom-actions {
    position: fixed;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 20;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.5rem;
    padding: 0.65rem;
    border-top: 1px solid var(--border);
    background: color-mix(in srgb, var(--surface) 96%, transparent);
    box-shadow: 0 -8px 24px rgb(28 67 43 / 10%);
    backdrop-filter: blur(10px);
  }

  .product-editor-bottom-actions .btn {
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .admin-product-editor-page .variant-summary-table tbody tr {
    transition: none;
  }
}
````

### `web/src/styles/features/product.css`

Source lines: 550

````css
/* Product Card */
.product-card {
  background: var(--surface);
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
  border: 1px solid var(--border);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.08);
  border-color: #c4d4ca;
}

.product-image-link {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  background: #f8faf9;
  display: block;
  overflow: hidden;
}

.product-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.product-card-video {
  pointer-events: none;
}

.product-card-media {
  animation: product-media-reveal 240ms ease-out;
}

@keyframes product-media-reveal {
  from { opacity: 0.35; transform: scale(1.025); }
  to { opacity: 1; transform: scale(1); }
}

.product-image-placeholder {
  width: 100%;
  height: 100%;
  min-height: 240px;
  display: grid;
  place-items: center;
  color: var(--text-muted);
  background: #eef3f0;
  font-weight: 600;
}

.product-card:hover .product-image {
  transform: scale(1.05);
}

@media (prefers-reduced-motion: reduce) {
  .product-card-media {
    animation: none;
  }
}

.product-badge {
  position: absolute;
  top: 1rem;
  left: 1rem;
  background: var(--error);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 2rem;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.product-details {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 0.75rem;
}

.product-title-link {
  color: var(--text-main);
}

.product-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-title-link:hover .product-title {
  color: var(--primary);
}

.product-price-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-top: auto;
}

.product-price {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.current-price {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--primary);
}

.original-price {
  font-size: 0.85rem;
  color: var(--text-muted);
  text-decoration: line-through;
}

.btn-add-cart {
  background: var(--bg-color);
  border: none;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-add-cart:hover {
  background: var(--primary);
  color: white;
  transform: scale(1.05);
}

/* Product Detail */
.product-detail-page {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2.5rem 2rem 4rem;
}

.product-back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-muted);
  font-weight: 600;
  margin-bottom: 2rem;
}

.product-back-link:hover {
  color: var(--primary);
}

.product-detail-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(320px, 0.95fr);
  gap: 3rem;
  align-items: start;
}

.product-detail-media {
  position: relative;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  background: var(--surface);
}

.product-detail-media img,
.product-detail-media video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-detail-media video {
  background: #101410;
}

.product-gallery {
  min-width: 0;
}

.gallery-arrow {
  position: absolute;
  top: 50%;
  width: 2.6rem;
  height: 2.6rem;
  display: grid;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 50%;
  color: var(--text-main);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.14);
  cursor: pointer;
  transform: translateY(-50%);
}

.gallery-arrow:hover {
  color: var(--primary);
  background: #fff;
}

.gallery-arrow-left {
  left: 1rem;
}

.gallery-arrow-right {
  right: 1rem;
}

.gallery-counter {
  position: absolute;
  right: 1rem;
  bottom: 1rem;
  padding: 0.35rem 0.65rem;
  border-radius: 2rem;
  color: #fff;
  background: rgba(0, 0, 0, 0.62);
  font-size: 0.78rem;
  font-weight: 700;
}

.product-gallery-thumbnails {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.75rem;
  margin-top: 0.75rem;
}

.product-gallery-thumbnails button {
  aspect-ratio: 1 / 1;
  overflow: hidden;
  padding: 0;
  border: 2px solid transparent;
  border-radius: 0.65rem;
  background: #e7eee9;
  cursor: pointer;
}

.product-gallery-thumbnails button.is-selected {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(21, 115, 71, 0.14);
}

.product-gallery-thumbnails img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.gallery-video-thumbnail {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  color: #fff;
  background: linear-gradient(145deg, #27372d, #101410);
}

.product-detail-content {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 2rem;
}

.product-detail-category {
  color: var(--primary);
  font-weight: 700;
  margin: 0 0 0.5rem;
}

.product-detail-content h1 {
  font-size: clamp(2rem, 4vw, 3rem);
  line-height: 1.1;
  margin: 0;
}

.product-detail-price {
  color: var(--primary);
  font-size: 1.75rem;
  font-weight: 800;
  margin: 0;
}

.product-detail-pricing {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  margin: 1.25rem 0 0.4rem;
}

.product-detail-pricing del {
  color: var(--text-muted);
}

.product-detail-pricing > span,
.product-active-tier {
  align-items: center;
  color: var(--success, #067647);
  display: inline-flex;
  font-size: 0.82rem;
  font-weight: 750;
  gap: 0.3rem;
}

.product-active-tier {
  margin: 0 0 1.2rem;
}

.product-detail-summary,
.product-description p {
  color: var(--text-muted);
  line-height: 1.7;
}

.product-purchase-row {
  display: flex;
  gap: 1rem;
  align-items: flex-end;
  margin: 1.5rem 0;
}

.quantity-field {
  width: 100px;
  flex: 0 0 auto;
}

.product-cart-button {
  gap: 0.6rem;
  flex: 1;
}

.product-tier-panel {
  display: grid;
  gap: 0.8rem;
  margin-top: 1.25rem;
  padding: 1rem;
  border: 1px solid color-mix(in srgb, var(--primary) 24%, var(--border));
  border-radius: var(--radius);
  background: color-mix(in srgb, var(--primary) 5%, var(--surface));
}

.product-tier-panel h2,
.product-tier-panel p {
  margin: 0;
}

.product-tier-panel h2 {
  font-size: 1rem;
}

.product-tier-panel > div:first-child p,
.product-next-tier {
  color: var(--text-muted);
  font-size: 0.78rem;
  margin-top: 0.2rem;
}

.product-tier-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(125px, 1fr));
  gap: 0.55rem;
}

.product-tier-list button {
  display: grid;
  gap: 0.15rem;
  padding: 0.65rem;
  border: 1px solid var(--border);
  border-radius: 0.55rem;
  color: var(--text-main);
  background: var(--surface);
  text-align: left;
  cursor: pointer;
}

.product-tier-list button:hover:not(:disabled),
.product-tier-list button.is-active {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary) 16%, transparent);
}

.product-tier-list button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.product-tier-list span,
.product-tier-list small {
  color: var(--text-muted);
  font-size: 0.72rem;
}

.product-tier-list small {
  color: var(--success, #067647);
  font-weight: 700;
}

.product-price-preview {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem 0.85rem;
  margin-top: -0.75rem;
  color: var(--text-muted);
  font-size: 0.85rem;
}

.product-price-preview strong {
  color: var(--text-main);
}

.product-price-preview small {
  color: var(--success, #067647);
  font-weight: 750;
}

.product-description {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border);
}

.product-description h2 {
  font-size: 1.2rem;
  margin: 0 0 0.75rem;
}

@media (max-width: 760px) {
  .product-detail-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .product-detail-page {
    padding: 1.5rem 1rem 3rem;
  }

  .product-detail-content {
    padding: 1.5rem;
  }
}
.product-option-groups {
  display: grid;
  gap: 1rem;
  margin: 1.25rem 0;
}

.product-option-group {
  border: 0;
  margin: 0;
  padding: 0;
}

.product-option-group legend {
  font-weight: 700;
  margin-bottom: 0.55rem;
}

.product-option-group legend span {
  color: var(--color-text-muted, #667085);
  font-size: 0.82rem;
  font-weight: 500;
}

.product-option-values {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
}

.product-option-button {
  align-items: center;
  background: var(--color-surface, #fff);
  border: 1px solid var(--color-border, #d7dce2);
  border-radius: 0.55rem;
  color: inherit;
  cursor: pointer;
  display: inline-flex;
  gap: 0.45rem;
  min-height: 2.5rem;
  padding: 0.5rem 0.8rem;
}

.product-option-button.is-selected {
  border-color: var(--color-primary, #e85d04);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary, #e85d04) 22%, transparent);
}

.product-option-button small {
  font-size: 0.68rem;
  font-weight: 600;
}

.product-option-button:disabled {
  cursor: not-allowed;
  opacity: 0.4;
  text-decoration: line-through;
}

.product-color-swatch {
  border: 1px solid rgb(0 0 0 / 16%);
  border-radius: 50%;
  height: 1rem;
  width: 1rem;
}

.product-option-help {
  color: var(--color-text-muted, #667085);
  font-size: 0.9rem;
  margin: 0;
}

.product-option-ready {
  align-items: center;
  color: var(--color-success, #067647);
  display: flex;
  font-size: 0.9rem;
  font-weight: 650;
  gap: 0.4rem;
  margin: 0;
}
````

### `web/src/styles/features/admin.css`

Source lines: 964

````css
/* Admin Catalog */
.admin-page {
  width: 100%;
  max-width: none;
}

.admin-page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 2rem;
  margin-bottom: 1.5rem;
}

.admin-page-header h1 {
  margin: 0.35rem 0;
  font-size: clamp(2rem, 4vw, 3rem);
  line-height: 1.1;
}

.admin-page-header p:last-child {
  margin: 0;
  color: var(--text-muted);
}

.admin-page-header .product-back-link {
  margin-bottom: 1rem;
}

.admin-page-loading {
  min-height: 260px;
  display: grid;
  place-items: center;
  color: var(--text-muted);
}

.admin-overview-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.admin-overview-card {
  position: relative;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 1rem;
  padding: 1.35rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface);
  box-shadow: 0 8px 30px rgb(28 67 43 / 5%);
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.admin-overview-card:hover {
  transform: translateY(-2px);
  border-color: #bad0c2;
  box-shadow: 0 12px 34px rgb(28 67 43 / 10%);
}

.admin-overview-icon {
  width: 2.8rem;
  height: 2.8rem;
  display: grid;
  place-items: center;
  border-radius: 0.8rem;
  color: var(--primary);
  background: var(--success-bg);
}

.admin-overview-card h2 {
  margin: 0 0 0.3rem;
  font-size: 1.05rem;
}

.admin-overview-card p {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.86rem;
  line-height: 1.5;
}

.admin-overview-arrow {
  color: var(--text-muted);
}

.admin-catalog {
  max-width: 1320px;
}

.admin-catalog-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 2rem;
  margin-bottom: 1.5rem;
}

.admin-catalog-header .dashboard-header {
  margin-bottom: 0;
}

.admin-catalog-header .btn,
.admin-form-actions .btn {
  gap: 0.5rem;
}

.admin-header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.admin-product-form,
.admin-products-panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: 0 8px 30px rgb(28 67 43 / 6%);
}

.admin-product-form {
  padding: 2rem;
  margin-bottom: 2rem;
}

.admin-form-heading h2,
.admin-panel-heading h2 {
  margin: 0 0 0.35rem;
  font-size: 1.35rem;
}

.admin-form-heading p,
.admin-panel-heading p {
  margin: 0;
  color: var(--text-muted);
}

.admin-form-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1.25rem;
  margin-top: 1.75rem;
  min-width: 0;
}

.admin-coupons-page { max-width: 1380px; }
.coupon-form-grid { grid-template-columns: repeat(5, minmax(0, 1fr)); }
.coupon-active { align-self: end; min-height: 2.8rem; }
.coupon-table { min-width: 1080px; }
.coupon-table td > strong,
.coupon-table td > span,
.coupon-table td > small { display: block; }
.coupon-table td > small { margin-top: 0.2rem; color: var(--text-muted); font-size: 0.7rem; }
.coupon-table tr.is-deleted { opacity: 0.65; }
.admin-row-actions { display: flex; gap: 0.35rem; }
.admin-row-actions button { display: grid; place-items: center; padding: 0.4rem; border: 0; border-radius: 0.4rem; color: var(--primary); background: var(--success-bg); cursor: pointer; }
.admin-row-actions button.is-danger { color: var(--error); background: var(--error-bg); }

@media (max-width: 1180px) {
  .coupon-form-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 640px) {
  .coupon-form-grid { grid-template-columns: 1fr; }
}

.admin-field-wide {
  grid-column: 1 / -1;
  min-width: 0;
}

.admin-textarea {
  min-height: 120px;
  resize: vertical;
}

.admin-form-divider {
  position: relative;
  margin-top: 0.5rem;
  border-top: 1px solid var(--border);
}

.admin-form-divider span {
  position: relative;
  top: -0.7rem;
  background: var(--surface);
  padding-right: 0.75rem;
  color: var(--text-muted);
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.admin-checkbox {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  color: var(--text-main);
  font-weight: 600;
  cursor: pointer;
}

.admin-checkbox input {
  width: 1.1rem;
  height: 1.1rem;
  accent-color: var(--primary);
}

.admin-media-manager {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.admin-media-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
}

.admin-media-card {
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: #f8faf9;
}

.admin-media-image {
  position: relative;
  aspect-ratio: 1 / 1;
  background: #edf2ef;
}

.admin-media-image img,
.admin-media-image video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.admin-media-image video {
  background: #111;
}

.admin-primary-badge {
  position: absolute;
  left: 0.6rem;
  bottom: 0.6rem;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.3rem 0.55rem;
  border-radius: 2rem;
  color: #fff;
  background: rgba(21, 115, 71, 0.92);
  font-size: 0.7rem;
  font-weight: 800;
}

.admin-media-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  padding: 0.65rem;
}

.admin-media-actions button {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.4rem 0.55rem;
  border: 0;
  border-radius: 0.45rem;
  color: var(--primary);
  background: transparent;
  font: inherit;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
}

.admin-media-actions button:hover:not(:disabled) {
  background: var(--success-bg);
}

.admin-media-actions .media-delete-button {
  color: var(--error);
}

.admin-media-actions .media-delete-button:hover:not(:disabled) {
  background: var(--error-bg);
}

.admin-media-actions button:disabled {
  opacity: 0.5;
  cursor: wait;
}

.admin-image-picker {
  min-height: 130px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  padding: 1.5rem;
  border: 2px dashed #bad0c2;
  border-radius: var(--radius);
  color: var(--primary);
  background: #f8fbf9;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease;
}

.admin-image-picker:hover {
  border-color: var(--primary);
  background: var(--success-bg);
}

.admin-image-picker span {
  font-weight: 750;
}

.admin-image-picker small {
  color: var(--text-muted);
}

.admin-image-picker input {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  opacity: 0;
}

.pending-image-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.pending-image-list > div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.65rem 0.8rem;
  border: 1px solid var(--border);
  border-radius: 0.55rem;
  background: #f8faf9;
  font-size: 0.85rem;
}

.pending-image-list button {
  display: grid;
  place-items: center;
  padding: 0.3rem;
  border: 0;
  border-radius: 50%;
  color: var(--error);
  background: transparent;
  cursor: pointer;
}

.pending-image-list button:hover {
  background: var(--error-bg);
}

.admin-media-note,
.admin-media-limit {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.82rem;
}

.admin-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border);
}

.admin-products-panel {
  overflow: hidden;
}

.admin-panel-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  padding: 1.5rem 1.75rem;
  border-bottom: 1px solid var(--border);
}

.admin-table-wrap {
  overflow-x: auto;
}

.admin-product-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 760px;
}

.admin-product-table th,
.admin-product-table td {
  padding: 1rem 1.25rem;
  text-align: left;
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
}

.admin-product-table th {
  color: var(--text-muted);
  background: #f8faf9;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.admin-product-table tbody tr:last-child td {
  border-bottom: 0;
}

.admin-product-table tbody tr:hover {
  background: #fbfdfc;
}

.admin-product-table td:first-child {
  min-width: 220px;
}

.admin-product-copy strong,
.admin-product-brand {
  display: block;
}

.admin-product-brand {
  color: var(--text-muted);
  font-size: 0.82rem;
  margin-top: 0.25rem;
}

.admin-product-identity {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.admin-product-thumbnail {
  width: 48px;
  height: 48px;
  flex: 0 0 48px;
  display: grid;
  place-items: center;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 0.7rem;
  color: var(--text-muted);
  background: #eef3f0;
}

.admin-product-thumbnail img,
.admin-product-thumbnail video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.status-pill {
  display: inline-flex;
  padding: 0.3rem 0.65rem;
  border-radius: 2rem;
  background: var(--bg-color);
  color: var(--text-muted);
  font-size: 0.72rem;
  font-weight: 800;
}

.status-active {
  color: var(--success);
  background: var(--success-bg);
}

.status-draft {
  color: #895d00;
  background: #fff4ce;
}

.status-inactive,
.status-discontinued {
  color: var(--error);
  background: var(--error-bg);
}

.stock-in {
  color: var(--success);
  font-weight: 700;
}

.stock-out {
  color: var(--error);
  font-weight: 700;
}

.admin-view-link {
  width: 2.25rem;
  height: 2.25rem;
  display: inline-grid;
  place-items: center;
  border-radius: 50%;
  border: 0;
  background: transparent;
  color: var(--primary);
  cursor: pointer;
}

.admin-view-link:hover {
  background: var(--success-bg);
}

.admin-view-link:disabled {
  opacity: 0.45;
  cursor: wait;
}

.admin-row-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.25rem;
}

.admin-empty-state {
  display: grid;
  place-items: center;
  text-align: center;
  color: var(--text-muted);
  min-height: 240px;
  padding: 2rem;
}

.admin-empty-state h3 {
  color: var(--text-main);
  margin: 1rem 0 0.25rem;
}

.admin-empty-state p {
  margin: 0;
}

.admin-taxonomy-page {
  max-width: 1440px;
}

.admin-taxonomy-page .product-back-link {
  margin-bottom: 1.25rem;
}

.admin-taxonomy-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(420px, 0.85fr);
  gap: 1.5rem;
  align-items: start;
}

.admin-taxonomy-grid.is-single {
  grid-template-columns: minmax(0, 1fr);
}

.admin-taxonomy-grid.is-single .admin-product-types-panel {
  grid-column: auto;
}

.admin-taxonomy-grid .admin-panel-heading {
  gap: 1rem;
}

.admin-taxonomy-grid .admin-panel-heading .btn {
  flex: 0 0 auto;
  gap: 0.4rem;
  white-space: nowrap;
}

.admin-product-types-panel {
  grid-column: 1 / -1;
}

.admin-reference-form {
  padding: 1.5rem;
  border-bottom: 1px solid var(--border);
  background: #fbfdfc;
}

.admin-reference-form .admin-form-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.admin-reference-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  margin-top: 1.25rem;
}

.admin-reference-field-wide {
  grid-column: 1 / -1;
}

.admin-reference-assignment {
  margin: 0;
  padding: 1rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
}

.admin-reference-assignment legend {
  padding: 0 0.4rem;
  color: var(--text-primary);
  font-weight: 750;
}

.admin-reference-assignment legend span {
  color: var(--error);
}

.admin-reference-assignment > p {
  margin: 0 0 0.8rem;
  color: var(--text-muted);
  font-size: 0.84rem;
}

.admin-reference-scope,
.admin-reference-checklist {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
}

.admin-reference-scope {
  margin-bottom: 0.9rem;
}

.admin-reference-scope label,
.admin-reference-checklist label {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  min-height: 2.25rem;
  padding: 0.45rem 0.7rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: #fff;
  color: var(--text-primary);
  cursor: pointer;
}

.admin-reference-scope label:has(input:checked),
.admin-reference-checklist label:has(input:checked) {
  border-color: var(--primary);
  background: var(--primary-soft);
}

.admin-field-help-error {
  color: var(--error);
}

.admin-reference-options {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  margin-top: 1.25rem;
}

.admin-reference-form .admin-form-actions {
  margin-top: 1.25rem;
  padding-top: 1.25rem;
}

.admin-reference-table {
  min-width: 620px;
}

.admin-reference-table tr.is-deleted {
  opacity: 0.62;
}

.reference-visibility {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: var(--text-muted);
  font-size: 0.78rem;
  font-weight: 700;
}

.reference-visibility.is-visible {
  color: var(--success);
}

.admin-view-link.reference-delete-button {
  color: var(--error);
}

.admin-view-link.reference-delete-button:hover {
  background: var(--error-bg);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 900px) {
  .admin-form-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .admin-media-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .admin-taxonomy-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .admin-page-header {
    align-items: flex-start;
    flex-direction: column;
    gap: 1rem;
  }

  .admin-page-header .btn {
    width: 100%;
  }

  .admin-panel-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .admin-overview-grid {
    grid-template-columns: 1fr;
  }

  .admin-catalog-header {
    flex-direction: column;
    gap: 1rem;
  }

  .admin-catalog-header .btn {
    width: 100%;
  }

  .admin-form-grid {
    grid-template-columns: 1fr;
  }

  .admin-field-wide {
    grid-column: auto;
  }

  .admin-product-form {
    padding: 1.25rem;
  }

  .admin-taxonomy-grid .admin-panel-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .admin-taxonomy-grid .admin-panel-heading .btn,
  .admin-reference-form .admin-form-actions .btn {
    width: 100%;
  }

  .admin-reference-form-grid {
    grid-template-columns: 1fr;
  }

  .admin-reference-field-wide {
    grid-column: auto;
  }
}

.admin-variant-builder { display: grid; gap: 1rem; min-width: 0; }
.admin-variant-builder .admin-form-divider { margin: 0; }
.admin-variant-empty { align-items: center; background: #f8fafb; border: 1px dashed var(--color-border, #d7dce2); border-radius: 0.75rem; display: flex; gap: 0.8rem; padding: 1rem; }
.admin-variant-empty p { margin: 0.2rem 0 0; }
.admin-option-selector { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr)); }
.admin-option-selector fieldset { border: 1px solid var(--color-border, #d7dce2); border-radius: 0.65rem; margin: 0; padding: 0.75rem; }
.admin-option-selector legend { font-weight: 700; padding: 0 0.3rem; }
.admin-option-selector fieldset > div { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.admin-option-selector label { align-items: center; background: #f5f7f9; border-radius: 999px; display: inline-flex; gap: 0.35rem; padding: 0.4rem 0.6rem; }
.admin-option-selector i { border: 1px solid rgb(0 0 0 / 15%); border-radius: 50%; height: 0.85rem; width: 0.85rem; }
.admin-variant-error { color: var(--color-danger, #b42318); margin: 0; }
.admin-variant-table-wrap { contain: layout paint; max-width: 100%; min-width: 0; overflow-x: auto; }
.admin-variant-table { border-collapse: collapse; min-width: 900px; width: 100%; }
.admin-variant-table th,
.admin-variant-table td { border-bottom: 1px solid var(--color-border, #e1e5ea); padding: 0.55rem; text-align: left; }
.admin-variant-table th { color: var(--color-text-muted, #667085); font-size: 0.78rem; text-transform: uppercase; }
.admin-variant-table .form-input { min-width: 6.5rem; }
.admin-variant-table td:first-child { min-width: 9rem; }
.admin-media-actions .form-input { font-size: 0.8rem; min-width: 8rem; padding: 0.35rem; }

.admin-field-label-row {
  align-items: center;
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
}

.admin-field-label-row a {
  color: var(--primary);
  font-size: 0.76rem;
  font-weight: 750;
}

.admin-offer-schedule {
  align-items: end;
  background: #f7fbf8;
  border: 1px solid #d9e9df;
  border-radius: 0.75rem;
  display: grid;
  gap: 1rem;
  grid-template-columns: minmax(16rem, 1fr) repeat(2, minmax(12rem, 0.6fr));
  padding: 1rem;
}

.admin-offer-schedule strong,
.admin-offer-schedule p { display: block; margin: 0; }
.admin-offer-schedule p { color: var(--text-muted); font-size: 0.8rem; margin-top: 0.25rem; }
.admin-offer-schedule label { font-size: 0.78rem; font-weight: 700; min-width: 0; }
.admin-offer-schedule .form-input { margin-top: 0.35rem; min-width: 0; width: 100%; }

.variant-workbench-heading {
  align-items: flex-start;
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.variant-workbench-heading h3,
.variant-workbench-heading p { margin: 0; }
.variant-workbench-heading h3 { font-size: 1rem; }
.variant-workbench-heading p { color: var(--text-muted); font-size: 0.82rem; margin-top: 0.25rem; max-width: 52rem; }
.variant-workbench-heading .btn { flex: 0 0 auto; }

.admin-option-selector fieldset {
  background: #fcfdfc;
  min-width: 0;
}

.admin-option-selector legend small {
  color: var(--text-muted);
  font-size: 0.7rem;
  font-weight: 600;
  margin-left: 0.45rem;
}

.variant-suggestion-label {
  color: var(--text-muted);
  font-size: 0.72rem;
  margin: 0 0 0.6rem;
}

.variant-value-chips { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.variant-value-chips label:has(input:checked) { background: #e7f5ec; box-shadow: inset 0 0 0 1px #95cbaa; }
.variant-value-chips input { accent-color: var(--primary); }

.variant-inline-add {
  align-items: center;
  border-top: 1px solid var(--border);
  display: grid !important;
  gap: 0.5rem !important;
  grid-template-columns: minmax(0, 1fr) auto;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
}

.variant-inline-add .btn,
.variant-generate-button { gap: 0.4rem; }
.variant-generate-button { justify-self: start; }

.variant-bulk-panel {
  align-items: end;
  background: #f7f9f8;
  border: 1px solid var(--border);
  border-radius: 0.75rem;
  display: grid;
  gap: 0.75rem;
  grid-template-columns: minmax(10rem, 1fr) minmax(10rem, 0.8fr) minmax(8rem, 0.7fr) auto;
  padding: 0.9rem;
}

.variant-bulk-panel > div strong,
.variant-bulk-panel > div span { display: block; }
.variant-bulk-panel > div span { color: var(--text-muted); font-size: 0.75rem; margin-top: 0.15rem; }

.variant-workbench-table { min-width: 1540px; }
.variant-workbench-table td:first-child { min-width: 2.5rem; width: 2.5rem; }
.variant-workbench-table .variant-name-cell { min-width: 9rem; }
.variant-name-cell strong,
.variant-name-cell small { display: block; }
.variant-name-cell small { color: var(--text-muted); font-size: 0.68rem; margin-top: 0.2rem; }
.variant-workbench-table input[type="checkbox"],
.variant-workbench-table input[type="radio"] { accent-color: var(--primary); }

.variant-schedule-row td { background: #fafcfb; padding-block: 0.7rem; }
.variant-schedule-fields { align-items: end; display: flex; gap: 1rem; }
.variant-schedule-fields > span { color: var(--primary); font-size: 0.76rem; font-weight: 800; margin-right: auto; }
.variant-schedule-fields label { align-items: center; display: flex; gap: 0.45rem; font-size: 0.75rem; font-weight: 700; }
.variant-schedule-fields .form-input { min-width: 12rem; }
.variant-table-note { color: var(--text-muted); font-size: 0.78rem; margin: -0.35rem 0 0; }

.admin-price-tier-builder { display: grid; gap: 1rem; min-width: 0; }
.admin-price-tier-builder .admin-form-divider { margin: 0; }
.price-tier-empty { background: #fafcfb; border: 1px dashed var(--border); border-radius: 0.75rem; color: var(--text-muted); padding: 1rem; }
.price-tier-table { min-width: 850px; }
.price-tier-table td:first-child { min-width: 14rem; }
.price-tier-table input[type="checkbox"] { accent-color: var(--primary); }

.pending-image-list > div { display: grid; grid-template-columns: minmax(10rem, 1fr) minmax(11rem, 0.7fr) auto; }
.pending-image-list .form-input { font-size: 0.78rem; padding: 0.45rem; }

@media (max-width: 900px) {
  .admin-offer-schedule { grid-template-columns: 1fr 1fr; }
  .admin-offer-schedule > div { grid-column: 1 / -1; }
  .variant-bulk-panel { grid-template-columns: 1fr 1fr; }
}

@media (max-width: 600px) {
  .admin-offer-schedule,
  .variant-bulk-panel,
  .pending-image-list > div { grid-template-columns: 1fr; }
  .admin-offer-schedule > div { grid-column: auto; }
  .variant-workbench-heading,
  .variant-schedule-fields { align-items: stretch; flex-direction: column; }
  .variant-workbench-heading .btn { width: 100%; }
  .variant-schedule-fields > span { margin-right: 0; }
  .variant-schedule-fields label { align-items: stretch; flex-direction: column; }
}
````

### `web/src/styles/layout.css`

Source lines: 12

````css
/* Shared page shell only. Header styles live with their own components. */
.layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}
````

### `web/src/styles/tailwind.css`

Source lines: 48

````css
/*
 * Tailwind is intentionally loaded without Preflight while the application is
 * being migrated feature by feature. Existing screens therefore keep their
 * current browser defaults and global styles.
 */
@layer theme, legacy, components, utilities;
@import "tailwindcss/theme.css" layer(theme);
@import "./base.css" layer(legacy);
@import "./layout.css" layer(legacy);
@import "./components/buttons.css" layer(legacy);
@import "./features/auth.css" layer(legacy);
@import "./components/feedback.css" layer(legacy);
@import "./features/dashboard.css" layer(legacy);
@import "./features/admin.css" layer(legacy);
@import "./features/product-editor.css" layer(legacy);
@import "./components/states.css" layer(legacy);
@import "./features/storefront.css" layer(legacy);
@import "./features/product.css" layer(legacy);
@import "./features/cart.css" layer(legacy);
@import "./features/account.css" layer(legacy);
@import "./features/checkout.css" layer(legacy);
@import "./components/skeleton.css" layer(legacy);
@import "tailwindcss/utilities.css" layer(utilities);

@theme inline {
  --color-brand: var(--primary);
  --color-brand-hover: var(--primary-hover);
  --color-page: var(--bg-color);
  --color-surface: var(--surface);
  --color-ink: var(--text-main);
  --color-muted: var(--text-muted);
  --color-line: var(--border);
  --color-danger: var(--error);
  --color-danger-hover: var(--error-hover);
  --color-danger-soft: var(--error-bg);
  --color-positive: var(--success);
  --color-positive-soft: var(--success-bg);
  --color-warning: var(--warning);
  --color-warning-soft: var(--warning-bg);
  --color-info: var(--info);
  --color-info-soft: var(--info-bg);
  --color-accent: var(--accent);
  --color-accent-soft: var(--accent-bg);
  --radius-control: var(--radius);
  --radius-card: var(--radius-lg);
  --shadow-lifted: var(--app-shadow-lifted);
  --font-sans: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
````

## Backend API entry, security, configuration, and database connection

Shows the /api/v1 mounting point, administrator authorization, error format, upload limits, and TypeORM registration.

### `DokanBDbackend/src/app.ts`

Source lines: 53

````ts
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
  app.use(cors({ origin: env.WEB_ORIGIN, credentials: true }));
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
````

### `DokanBDbackend/src/routes/v1.ts`

Source lines: 49

````ts
import { Router } from "express";

import { authRouter } from "../modules/auth/auth.routes.js";
import { addressRouter } from "../modules/addresses/address.routes.js";
import { cartRouter } from "../modules/carts/cart.routes.js";
import {
  adminCategoryRouter,
  categoryRouter,
} from "../modules/categories/category.routes.js";
import {
  adminBrandRouter,
  brandRouter,
} from "../modules/brands/brand.routes.js";
import { healthRouter } from "../modules/health/health.routes.js";
import { adminOrderRouter } from "../modules/orders/order-admin.routes.js";
import { orderRouter } from "../modules/orders/order.routes.js";
import {
  adminProductRouter,
  productRouter,
} from "../modules/products/product.routes.js";
import { userRouter } from "../modules/users/user.routes.js";
import { adminProductTypeRouter } from "../modules/product-types/product-type.routes.js";
import {
  adminProductAttributeRouter,
  adminProductTypeAttributeRouter,
} from "../modules/attributes/product-attribute.routes.js";
import { adminDashboardRouter } from "../modules/admin-dashboard/admin-dashboard.routes.js";
import { adminCouponRouter } from "../modules/coupons/coupon.routes.js";

export const v1Router = Router();

v1Router.use("/health", healthRouter);
v1Router.use("/auth", authRouter);
v1Router.use("/addresses", addressRouter);
v1Router.use("/cart", cartRouter);
v1Router.use("/users", userRouter);
v1Router.use("/categories", categoryRouter);
v1Router.use("/brands", brandRouter);
v1Router.use("/products", productRouter);
v1Router.use("/admin/categories", adminCategoryRouter);
v1Router.use("/admin/brands", adminBrandRouter);
v1Router.use("/admin/product-types", adminProductTypeRouter);
v1Router.use("/admin/product-types", adminProductTypeAttributeRouter);
v1Router.use("/admin/attributes", adminProductAttributeRouter);
v1Router.use("/admin/products", adminProductRouter);
v1Router.use("/admin/dashboard", adminDashboardRouter);
v1Router.use("/admin/coupons", adminCouponRouter);
v1Router.use("/orders", orderRouter);
v1Router.use("/admin/orders", adminOrderRouter);
````

### `DokanBDbackend/src/modules/auth/auth.middleware.ts`

Source lines: 39

````ts
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
````

### `DokanBDbackend/src/modules/auth/authorization.middleware.ts`

Source lines: 57

````ts
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
````

### `DokanBDbackend/src/utils/app-error.ts`

Source lines: 10

````ts
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
````

### `DokanBDbackend/src/config/env.ts`

Source lines: 46

````ts
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
  MAX_VIDEO_UPLOAD_BYTES: z.coerce.number().int().positive().default(20971520),
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
````

### `DokanBDbackend/src/database/data-source.ts`

Source lines: 27

````ts
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
````

## Backend product, variant, pricing, media, and search module

Contains the product HTTP routes, validation, controllers, business services, TypeORM entities, pricing logic, media upload logic, and tests.

### `DokanBDbackend/src/modules/products/README.md`

Source lines: 4

````md
# Products module

Products, variants, media, pricing, and publication status will be implemented
here.
````

### `DokanBDbackend/src/modules/products/product-category-hierarchy.test.ts`

Source lines: 21

````ts
import { describe, expect, it } from "vitest";

import { collectDescendantCategoryIds } from "./product.service.js";

describe("public product category hierarchy", () => {
  const categories = [
    { id: "1", parentId: null },
    { id: "2", parentId: "1" },
    { id: "3", parentId: "2" },
    { id: "4", parentId: null },
  ];

  it("includes the selected category and every nested descendant", () => {
    expect(collectDescendantCategoryIds(categories, "1")).toEqual(["1", "2", "3"]);
  });

  it("does not include siblings or unrelated roots", () => {
    expect(collectDescendantCategoryIds(categories, "2")).toEqual(["2", "3"]);
    expect(collectDescendantCategoryIds(categories, "4")).toEqual(["4"]);
  });
});
````

### `DokanBDbackend/src/modules/products/product-media-upload.middleware.ts`

Source lines: 41

````ts
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
  "video/mp4",
  "video/webm",
]);

export const productMediaUpload = multer({
  storage: multer.diskStorage({
    destination: productDirectory,
    filename(_request, file, callback) {
      callback(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`);
    },
  }),
  limits: { fileSize: env.MAX_VIDEO_UPLOAD_BYTES, files: 4 },
  fileFilter(_request, file, callback) {
    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(
        new AppError(
          400,
          "INVALID_MEDIA_TYPE",
          "Only JPEG, PNG, WebP, MP4 and WebM product media are allowed.",
        ),
      );
      return;
    }
    callback(null, true);
  },
});
````

### `DokanBDbackend/src/modules/products/product-media.controller.ts`

Source lines: 69

````ts
import type { RequestHandler } from "express";

import { AppError } from "../../utils/app-error.js";
import {
  createProductMediaSchema,
  updateProductMediaSchema,
} from "./product-media.schema.js";
import {
  addProductMedia,
  cleanupUploadedProductImages,
  deleteProductImage,
  listProductMedia,
  updateProductImage,
} from "./product-media.service.js";

function requiredParam(value: string | string[] | undefined, name: string) {
  if (!value || Array.isArray(value)) {
    throw new AppError(400, "INVALID_PATH_PARAMETER", `${name} is required.`);
  }
  return value;
}

export const uploadProductImages: RequestHandler = async (request, response) => {
  const files = Array.isArray(request.files)
    ? request.files
    : Object.values(request.files ?? {}).flat();

  try {
    const media = await addProductMedia(
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

export const listProductMediaHandler: RequestHandler = async (request, response) => {
  const media = await listProductMedia(
    requiredParam(request.params.productId, "productId"),
  );
  response.status(200).json({ success: true, data: { media } });
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
````

### `DokanBDbackend/src/modules/products/product-media.entity.ts`

Source lines: 52

````ts
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
````

### `DokanBDbackend/src/modules/products/product-media.schema.ts`

Source lines: 29

````ts
import { z } from "zod";

export const createProductMediaSchema = z.object({
  variantId: z.string().regex(/^\d+$/).optional(),
  altText: z.string().trim().max(255).optional(),
});

export const updateProductMediaSchema = z
  .object({
    variantId: z.union([z.string().regex(/^[1-9]\d*$/), z.null()]).optional(),
    altText: z.string().trim().max(255).nullable().optional(),
    sortOrder: z.coerce.number().int().min(0).optional(),
    isPrimary: z.boolean().optional(),
  })
  .refine(
    (input) =>
      input.altText !== undefined ||
      input.sortOrder !== undefined ||
      input.isPrimary !== undefined ||
      input.variantId !== undefined,
    { message: "Provide at least one field to update." },
  );

export type CreateProductMediaInput = z.infer<
  typeof createProductMediaSchema
>;
export type UpdateProductMediaInput = z.infer<
  typeof updateProductMediaSchema
>;
````

### `DokanBDbackend/src/modules/products/product-media.service.ts`

Source lines: 219

````ts
import { unlink } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { IsNull } from "typeorm";

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
    type: media.mediaType,
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

export async function addProductMedia(
  productId: string,
  files: Express.Multer.File[],
  input: CreateProductMediaInput,
) {
  if (files.length === 0) {
    throw new AppError(400, "MEDIA_REQUIRED", "Select at least one image or video.");
  }

  const oversizedImage = files.find(
    (file) => file.mimetype.startsWith("image/") && file.size > env.MAX_UPLOAD_BYTES,
  );
  if (oversizedImage) {
    throw new AppError(
      400,
      "IMAGE_TOO_LARGE",
      `Images must be ${Math.floor(env.MAX_UPLOAD_BYTES / 1024 / 1024)} MB or smaller.`,
    );
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
  const targetVariantId = input.variantId ?? null;
  const existing = await repository.find({
    where: {
      productId,
      variantId: targetVariantId === null ? IsNull() : targetVariantId,
    },
    order: { sortOrder: "ASC" },
  });

  if (existing.length + files.length > 4) {
    throw new AppError(
      400,
      "PRODUCT_MEDIA_LIMIT",
      targetVariantId === null
        ? "A product can have at most four shared media items."
        : "A product variant can have at most four media items.",
    );
  }

  let hasPrimaryImage = existing.some(
    (media) => media.mediaType === "IMAGE" && media.isPrimary,
  );
  const created = files.map((file, index) => {
    const mediaType = file.mimetype.startsWith("video/") ? "VIDEO" : "IMAGE";
    const isPrimary = mediaType === "IMAGE" && !hasPrimaryImage;
    if (isPrimary) hasPrimaryImage = true;

    return repository.create({
      productId,
      variantId: targetVariantId,
      mediaType,
      url: `/uploads/products/${file.filename}`,
      thumbnailUrl: null,
      altText: input.altText ?? product.name,
      sortOrder: existing.length + index,
      isPrimary,
    });
  });

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

    if (input.isPrimary === true && media.mediaType !== "IMAGE") {
      throw new AppError(
        400,
        "VIDEO_PRIMARY_INVALID",
        "A video cannot be the primary catalog image.",
      );
    }

    const targetVariantId = input.variantId === undefined ? media.variantId : input.variantId;
    if (input.variantId !== undefined && input.variantId !== null) {
      const variant = await manager.getRepository(ProductVariant).findOneBy({
        id: input.variantId,
        productId,
      });
      if (!variant) {
        throw new AppError(400, "VARIANT_INVALID", "Variant does not belong to this product.");
      }
    }
    if (input.variantId !== undefined && targetVariantId !== media.variantId) {
      const targetCount = await repository.countBy({
        productId,
        variantId: targetVariantId === null ? IsNull() : targetVariantId,
      });
      if (targetCount >= 4) {
        throw new AppError(
          400,
          "PRODUCT_MEDIA_LIMIT",
          targetVariantId === null
            ? "A product can have at most four shared media items."
            : "A product variant can have at most four media items.",
        );
      }
      if (media.mediaType === "IMAGE" && input.isPrimary === undefined) {
        const targetPrimary = await repository.findOneBy({
          productId,
          variantId: targetVariantId === null ? IsNull() : targetVariantId,
          isPrimary: true,
        });
        media.isPrimary = !targetPrimary;
      }
    }
    if (input.isPrimary === true) {
      await repository.update(
        {
          productId,
          variantId: targetVariantId === null ? IsNull() : targetVariantId,
          isPrimary: true,
        },
        { isPrimary: false },
      );
    }
    if (input.variantId !== undefined) media.variantId = input.variantId;
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

export async function listProductMedia(productId: string) {
  const product = await AppDataSource.getRepository(Product).findOneBy({ id: productId });
  if (!product) {
    throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found.");
  }

  const media = await AppDataSource.getRepository(ProductMedia).find({
    where: { productId },
    order: { sortOrder: "ASC", id: "ASC" },
  });

  return media.map(publicMedia);
}

export async function cleanupUploadedProductImages(files: Express.Multer.File[]) {
  await Promise.all(files.map((file) => unlink(file.path).catch(() => undefined)));
}
````

### `DokanBDbackend/src/modules/products/product-price-tier.entity.ts`

Source lines: 50

````ts
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import { ProductVariant } from "./product-variant.entity.js";
import { Product } from "./product.entity.js";

@Entity({ name: "product_price_tiers" })
export class ProductPriceTier {
  @PrimaryGeneratedColumn({ type: "bigint", unsigned: true })
  id!: string;

  @Column({ name: "product_id", type: "bigint", unsigned: true })
  productId!: string;

  @ManyToOne(() => Product, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "product_id" })
  product!: Product;

  @Column({ name: "variant_id", type: "bigint", unsigned: true, nullable: true })
  variantId!: string | null;

  @ManyToOne(() => ProductVariant, { nullable: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "variant_id" })
  variant!: ProductVariant | null;

  @Column({ name: "minimum_quantity", type: "int", unsigned: true })
  minimumQuantity!: number;

  @Column({ name: "unit_price", type: "decimal", precision: 12, scale: 2 })
  unitPrice!: string;

  @Column({ name: "is_promotion", type: "boolean", default: false })
  isPromotion!: boolean;

  @Column({ name: "is_active", type: "boolean", default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "datetime" })
  updatedAt!: Date;
}
````

### `DokanBDbackend/src/modules/products/product-price-tier.service.ts`

Source lines: 75

````ts
import { In, type EntityManager } from "typeorm";

import { AppDataSource } from "../../database/data-source.js";
import { AppError } from "../../utils/app-error.js";
import { ProductPriceTier } from "./product-price-tier.entity.js";
import { ProductVariant } from "./product-variant.entity.js";
import { Product } from "./product.entity.js";
import type { ReplaceProductPriceTiersInput } from "./product.schema.js";

export function publicPriceTier(tier: ProductPriceTier) {
  return {
    id: tier.id,
    productId: tier.productId,
    variantId: tier.variantId,
    minimumQuantity: tier.minimumQuantity,
    unitPrice: tier.unitPrice,
    isPromotion: tier.isPromotion,
    isActive: tier.isActive,
  };
}

export async function loadProductPriceTiers(
  productIds: string[],
  manager?: EntityManager,
) {
  if (productIds.length === 0) return [];
  const repository = (manager ?? AppDataSource.manager).getRepository(ProductPriceTier);
  return repository.find({
    where: { productId: In(productIds) },
    order: { variantId: "ASC", minimumQuantity: "ASC", id: "ASC" },
  });
}

export async function replaceProductPriceTiers(
  productId: string,
  input: ReplaceProductPriceTiersInput,
) {
  const product = await AppDataSource.getRepository(Product).findOneBy({ id: productId });
  if (!product) throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found.");

  const variantIds = [...new Set(input.tiers.flatMap((tier) => tier.variantId ? [tier.variantId] : []))];
  if (variantIds.length > 0) {
    const variants = await AppDataSource.getRepository(ProductVariant).findBy({
      id: In(variantIds),
      productId,
    });
    if (variants.length !== variantIds.length) {
      throw new AppError(400, "PRICE_TIER_VARIANT_INVALID", "A price tier references a variant outside this product.");
    }
  }

  const signatures = new Set<string>();
  for (const tier of input.tiers) {
    const signature = `${tier.variantId ?? "all"}:${tier.minimumQuantity}`;
    if (signatures.has(signature)) {
      throw new AppError(409, "PRICE_TIER_DUPLICATE", "Each price scope can only have one tier for a minimum quantity.");
    }
    signatures.add(signature);
  }

  return AppDataSource.transaction(async (manager) => {
    const repository = manager.getRepository(ProductPriceTier);
    await repository.delete({ productId });
    const created = input.tiers.map((tier) => repository.create({
      productId,
      variantId: tier.variantId ?? null,
      minimumQuantity: tier.minimumQuantity,
      unitPrice: tier.unitPrice.toFixed(2),
      isPromotion: tier.isPromotion,
      isActive: tier.isActive,
    }));
    if (created.length > 0) await repository.save(created);
    return created.map(publicPriceTier);
  });
}
````

### `DokanBDbackend/src/modules/products/product-pricing.test.ts`

Source lines: 109

````ts
import { describe, expect, it } from "vitest";

import type { ProductPriceTier } from "./product-price-tier.entity.js";
import type { ProductVariant } from "./product-variant.entity.js";
import {
  activeDiscountPrice,
  effectiveVariantPrice,
  effectiveVariantPricing,
} from "./product-pricing.js";

describe("product workbench effective pricing", () => {
  it("applies a scheduled discount only inside its active window", () => {
    expect(activeDiscountPrice(
      "1000.00",
      "800.00",
      "2026-10-10T00:00:00.000Z",
      "2026-10-20T00:00:00.000Z",
      new Date("2026-10-12T00:00:00.000Z"),
    )).toBe("800.00");
    expect(activeDiscountPrice(
      "1000.00",
      "800.00",
      "2026-10-13T00:00:00.000Z",
      null,
      new Date("2026-10-12T00:00:00.000Z"),
    )).toBe("1000.00");
  });

  it("uses the highest eligible quantity block for a variant", () => {
    const variant = {
      id: "8",
      productId: "product-1",
      price: "100.00",
      discountPrice: "90.00",
      discountStartsAt: null,
      discountEndsAt: null,
    } as ProductVariant;
    const tiers = [
      { productId: "product-1", variantId: null, minimumQuantity: 10, unitPrice: "80.00", isActive: true },
      { productId: "product-1", variantId: "8", minimumQuantity: 20, unitPrice: "70.00", isActive: true },
    ] as ProductPriceTier[];

    expect(effectiveVariantPrice(variant, 1, tiers)).toBe("90.00");
    expect(effectiveVariantPrice(variant, 10, tiers)).toBe("80.00");
    expect(effectiveVariantPrice(variant, 20, tiers)).toBe("70.00");
  });

  it("returns a customer-facing explanation for the effective price", () => {
    const variant = {
      id: "8",
      productId: "product-1",
      price: "100.00",
      discountPrice: "90.00",
      discountStartsAt: null,
      discountEndsAt: null,
    } as ProductVariant;
    const tiers = [
      { id: "1", productId: "product-1", variantId: null, minimumQuantity: 5, unitPrice: "80.00", isActive: true, isPromotion: true },
    ] as ProductPriceTier[];

    expect(effectiveVariantPricing(variant, 1, tiers)).toMatchObject({
      regularUnitPrice: "100.00",
      baseUnitPrice: "90.00",
      unitPrice: "90.00",
      source: "DISCOUNT",
      tier: null,
    });
    expect(effectiveVariantPricing(variant, 5, tiers)).toMatchObject({
      regularUnitPrice: "100.00",
      baseUnitPrice: "90.00",
      unitPrice: "80.00",
      source: "QUANTITY_TIER",
      tier: { id: "1", minimumQuantity: 5, isPromotion: true },
    });
  });

  it("prefers an exact SKU tier when quantity and price are tied", () => {
    const variant = {
      id: "8",
      productId: "product-1",
      price: "100.00",
      discountPrice: null,
      discountStartsAt: null,
      discountEndsAt: null,
    } as ProductVariant;
    const tiers = [
      { id: "all", productId: "product-1", variantId: null, minimumQuantity: 5, unitPrice: "80.00", isActive: true },
      { id: "sku", productId: "product-1", variantId: "8", minimumQuantity: 5, unitPrice: "80.00", isActive: true },
    ] as ProductPriceTier[];

    expect(effectiveVariantPricing(variant, 5, tiers).tier?.id).toBe("sku");
  });

  it("never applies a product-wide tier from another product", () => {
    const variant = {
      id: "8",
      productId: "product-1",
      price: "100.00",
      discountPrice: null,
      discountStartsAt: null,
      discountEndsAt: null,
    } as ProductVariant;
    const tiers = [
      { productId: "product-2", variantId: null, minimumQuantity: 2, unitPrice: "1.00", isActive: true },
    ] as ProductPriceTier[];

    expect(effectiveVariantPrice(variant, 2, tiers)).toBe("100.00");
  });
});
````

### `DokanBDbackend/src/modules/products/product-pricing.ts`

Source lines: 91

````ts
import type { ProductPriceTier } from "./product-price-tier.entity.js";
import type { ProductVariant } from "./product-variant.entity.js";

type DateLike = Date | string | null | undefined;

function timestamp(value: DateLike) {
  if (!value) return null;
  const result = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(result) ? result : null;
}

export function isDiscountActive(
  discountPrice: string | null,
  startsAt: DateLike,
  endsAt: DateLike,
  now = new Date(),
) {
  if (discountPrice === null) return false;
  const current = now.getTime();
  const start = timestamp(startsAt);
  const end = timestamp(endsAt);
  return (start === null || start <= current) && (end === null || current <= end);
}

export function activeDiscountPrice(
  regularPrice: string,
  discountPrice: string | null,
  startsAt: DateLike,
  endsAt: DateLike,
  now = new Date(),
) {
  return isDiscountActive(discountPrice, startsAt, endsAt, now)
    ? discountPrice ?? regularPrice
    : regularPrice;
}

export function effectiveVariantPrice(
  variant: ProductVariant,
  quantity: number,
  tiers: ProductPriceTier[],
  now = new Date(),
) {
  return effectiveVariantPricing(variant, quantity, tiers, now).unitPrice;
}

export function eligiblePriceTier(
  variant: Pick<ProductVariant, "id" | "productId">,
  quantity: number,
  tiers: ProductPriceTier[],
) {
  return tiers
    .filter((tier) =>
      tier.isActive &&
      tier.productId === variant.productId &&
      tier.minimumQuantity <= quantity &&
      (tier.variantId === null || tier.variantId === variant.id),
    )
    .sort((left, right) =>
      right.minimumQuantity - left.minimumQuantity ||
      Number(left.unitPrice) - Number(right.unitPrice) ||
      Number(right.variantId !== null) - Number(left.variantId !== null),
    )[0];
}

export function effectiveVariantPricing(
  variant: ProductVariant,
  quantity: number,
  tiers: ProductPriceTier[],
  now = new Date(),
) {
  const baseUnitPrice = activeDiscountPrice(
    variant.price,
    variant.discountPrice,
    variant.discountStartsAt,
    variant.discountEndsAt,
    now,
  );
  const tier = eligiblePriceTier(variant, quantity, tiers);

  return {
    regularUnitPrice: variant.price,
    baseUnitPrice,
    unitPrice: tier?.unitPrice ?? baseUnitPrice,
    source: tier
      ? "QUANTITY_TIER" as const
      : baseUnitPrice !== variant.price
        ? "DISCOUNT" as const
        : "REGULAR" as const,
    tier: tier ?? null,
  };
}
````

### `DokanBDbackend/src/modules/products/product-variant.entity.ts`

Source lines: 96

````ts
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

  @Column({ name: "discount_price", type: "decimal", precision: 12, scale: 2, nullable: true })
  discountPrice!: string | null;

  @Column({ name: "discount_starts_at", type: "datetime", nullable: true })
  discountStartsAt!: Date | null;

  @Column({ name: "discount_ends_at", type: "datetime", nullable: true })
  discountEndsAt!: Date | null;

  @Column({ name: "cost_price", type: "decimal", precision: 12, scale: 2, nullable: true })
  costPrice!: string | null;

  @Column({ name: "stock_quantity", type: "int", default: 0 })
  stockQuantity!: number;

  @Column({ name: "low_stock_level", type: "int", default: 5 })
  lowStockLevel!: number;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  weight!: string | null;

  @Column({ name: "length_cm", type: "decimal", precision: 10, scale: 2, nullable: true })
  lengthCm!: string | null;

  @Column({ name: "width_cm", type: "decimal", precision: 10, scale: 2, nullable: true })
  widthCm!: string | null;

  @Column({ name: "height_cm", type: "decimal", precision: 10, scale: 2, nullable: true })
  heightCm!: string | null;

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
````

### `DokanBDbackend/src/modules/products/product.controller.ts`

Source lines: 201

````ts
import type { Request, RequestHandler } from "express";

import { AppError } from "../../utils/app-error.js";
import {
  adminProductListQuerySchema,
  createProductSchema,
  createProductVariantSchema,
  createProductVariantsBulkSchema,
  productIdentifierParamsSchema,
  productIdForVariantParamsSchema,
  productIdParamsSchema,
  productSearchSuggestionsQuerySchema,
  productVariantParamsSchema,
  publicProductListQuerySchema,
  replaceProductPriceTiersSchema,
  updateProductSchema,
  updateProductVariantSchema,
} from "./product.schema.js";
import { replaceProductPriceTiers } from "./product-price-tier.service.js";
import {
  createProduct,
  createProductVariant,
  createProductVariantsBulk,
  deleteProduct,
  deleteProductVariant,
  getAdminProduct,
  getPublicProduct,
  getProductSearchSuggestions,
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

export const listProductSearchSuggestions: RequestHandler = async (
  request,
  response,
) => {
  const input = productSearchSuggestionsQuerySchema.parse(request.query);
  const suggestions = await getProductSearchSuggestions(input);

  response.status(200).json({ success: true, data: { suggestions } });
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

export const createVariantsBulkForAdmin: RequestHandler = async (
  request,
  response,
) => {
  const { productId } = productIdForVariantParamsSchema.parse(request.params);
  const input = createProductVariantsBulkSchema.parse(request.body);
  const variants = await createProductVariantsBulk(
    productId,
    input,
    authenticatedUserId(request),
  );
  response.status(201).json({ success: true, data: { variants } });
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

export const replacePriceTiersForAdmin: RequestHandler = async (
  request,
  response,
) => {
  const { id } = productIdParamsSchema.parse(request.params);
  const input = replaceProductPriceTiersSchema.parse(request.body);
  const priceTiers = await replaceProductPriceTiers(id, input);

  response.status(200).json({ success: true, data: { priceTiers } });
};
````

### `DokanBDbackend/src/modules/products/product.entity.ts`

Source lines: 86

````ts
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

  @Column({ name: "discount_starts_at", type: "datetime", nullable: true })
  discountStartsAt!: Date | null;

  @Column({ name: "discount_ends_at", type: "datetime", nullable: true })
  discountEndsAt!: Date | null;

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
````

### `DokanBDbackend/src/modules/products/product.routes.ts`

Source lines: 82

````ts
import { Router } from "express";
import { rateLimit } from "express-rate-limit";

import { requireAuth } from "../auth/auth.middleware.js";
import { requireRole } from "../auth/authorization.middleware.js";
import {
  createProductForAdmin,
  createVariantForAdmin,
  createVariantsBulkForAdmin,
  deleteProductForAdmin,
  deleteVariantForAdmin,
  listProducts,
  listProductSearchSuggestions,
  listProductsForAdmin,
  restoreProductForAdmin,
  replacePriceTiersForAdmin,
  showProduct,
  showProductForAdmin,
  updateProductForAdmin,
  updateVariantForAdmin,
} from "./product.controller.js";
import {
  deleteProductImageHandler,
  listProductMediaHandler,
  updateProductImageHandler,
  uploadProductImages,
} from "./product-media.controller.js";
import { productMediaUpload } from "./product-media-upload.middleware.js";

export const productRouter = Router();
export const adminProductRouter = Router();

const productSearchLimiter = rateLimit({
  windowMs: 60_000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

productRouter.get("/", listProducts);
productRouter.get(
  "/search-suggestions",
  productSearchLimiter,
  listProductSearchSuggestions,
);
productRouter.get("/:identifier", showProduct);

adminProductRouter.use(requireAuth, requireRole("ADMIN", "OWNER"));
adminProductRouter.get("/", listProductsForAdmin);
adminProductRouter.post("/", createProductForAdmin);
adminProductRouter.get("/:id", showProductForAdmin);
adminProductRouter.patch("/:id", updateProductForAdmin);
adminProductRouter.delete("/:id", deleteProductForAdmin);
adminProductRouter.post("/:id/restore", restoreProductForAdmin);
adminProductRouter.put("/:id/price-tiers", replacePriceTiersForAdmin);
adminProductRouter.post("/:productId/variants", createVariantForAdmin);
adminProductRouter.post("/:productId/variants/bulk", createVariantsBulkForAdmin);
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
  productMediaUpload.fields([
    { name: "media", maxCount: 4 },
    { name: "images", maxCount: 4 },
  ]),
  uploadProductImages,
);
adminProductRouter.get("/:productId/media", listProductMediaHandler);
adminProductRouter.patch(
  "/:productId/media/:mediaId",
  updateProductImageHandler,
);
adminProductRouter.delete(
  "/:productId/media/:mediaId",
  deleteProductImageHandler,
);
````

### `DokanBDbackend/src/modules/products/product.schema.test.ts`

Source lines: 160

````ts
import { describe, expect, it } from "vitest";

import {
  createProductSchema,
  createProductVariantSchema,
  createProductVariantsBulkSchema,
  productSearchSuggestionsQuerySchema,
  publicProductListQuerySchema,
  replaceProductPriceTiersSchema,
  updateProductVariantSchema,
} from "./product.schema.js";

describe("product search suggestion validation", () => {
  it("trims the query and applies the default result limit", () => {
    expect(productSearchSuggestionsQuerySchema.parse({ q: "  sun  " })).toEqual({
      q: "sun",
      limit: 8,
    });
  });

  it("accepts a custom limit up to ten", () => {
    expect(productSearchSuggestionsQuerySchema.parse({ q: "shirt", limit: "10" })).toEqual({
      q: "shirt",
      limit: 10,
    });
  });

  it("rejects one-character searches and excessive limits", () => {
    expect(() => productSearchSuggestionsQuerySchema.parse({ q: "s" })).toThrow();
    expect(() => productSearchSuggestionsQuerySchema.parse({ q: "shirt", limit: 11 })).toThrow();
  });
});

describe("public product filter validation", () => {
  it("parses brand, stock, price, sorting, and pagination filters", () => {
    expect(
      publicProductListQuerySchema.parse({
        brand: "  dokanbd  ",
        inStock: "true",
        minPrice: "500",
        maxPrice: "3000",
        sort: "price_asc",
        page: "2",
      }),
    ).toMatchObject({
      brand: "dokanbd",
      inStock: true,
      minPrice: 500,
      maxPrice: 3000,
      sort: "price_asc",
      page: 2,
    });
  });

  it("preserves an explicit out-of-stock filter", () => {
    expect(publicProductListQuerySchema.parse({ inStock: "false" }).inStock).toBe(false);
  });

  it("rejects an inverted price range", () => {
    expect(() =>
      publicProductListQuerySchema.parse({ minPrice: "3000", maxPrice: "500" }),
    ).toThrow("minPrice cannot be greater than maxPrice");
  });
});

describe("bulk product variant validation", () => {
  it("accepts generated variants with normalized option value ids", () => {
    const result = createProductVariantsBulkSchema.parse({
      variants: [{
        sku: "SHIRT-BLACK-M",
        price: 1200,
        stockQuantity: 5,
        optionValueIds: ["1", "4"],
      }],
    });
    expect(result.variants[0]?.optionValueIds).toEqual(["1", "4"]);
  });

  it("requires at least one variant", () => {
    expect(() => createProductVariantsBulkSchema.parse({ variants: [] })).toThrow();
  });
});

describe("product variant dimension validation", () => {
  it("accepts metric dimensions on create and normalizes numeric strings", () => {
    const result = createProductVariantSchema.parse({
      sku: "DIMENSION-1",
      price: 900,
      lengthCm: "30",
      widthCm: "20.5",
      heightCm: 3,
    });

    expect(result).toMatchObject({
      lengthCm: 30,
      widthCm: 20.5,
      heightCm: 3,
    });
  });

  it("allows a dimension to be cleared and rejects negative dimensions", () => {
    expect(updateProductVariantSchema.parse({ lengthCm: null })).toEqual({
      lengthCm: null,
    });
    expect(() => createProductVariantSchema.parse({
      sku: "DIMENSION-INVALID",
      price: 900,
      heightCm: -1,
    })).toThrow();
  });
});

describe("product workbench pricing validation", () => {
  const product = {
    productTypeId: "1",
    categoryId: "1",
    name: "Scheduled product",
    description: "Product description",
    defaultPrice: 1000,
    discountPrice: 800,
  };

  it("accepts scheduled product and individual variant offers", () => {
    expect(createProductSchema.parse({
      ...product,
      discountStartsAt: "2026-10-12T04:00:00.000Z",
      discountEndsAt: "2026-10-20T04:00:00.000Z",
    }).discountPrice).toBe(800);
    expect(createProductVariantSchema.parse({
      sku: "SCHEDULED-1",
      price: 900,
      discountPrice: 750,
      discountStartsAt: "2026-10-12T04:00:00.000Z",
    }).discountPrice).toBe(750);
  });

  it("rejects inverted schedules and discounts above regular price", () => {
    expect(() => createProductSchema.parse({
      ...product,
      discountStartsAt: "2026-10-20T04:00:00.000Z",
      discountEndsAt: "2026-10-12T04:00:00.000Z",
    })).toThrow();
    expect(() => createProductVariantSchema.parse({
      sku: "INVALID-1",
      price: 900,
      discountPrice: 950,
    })).toThrow();
  });

  it("accepts all-variant and individual quantity price blocks", () => {
    const result = replaceProductPriceTiersSchema.parse({
      tiers: [
        { variantId: null, minimumQuantity: 10, unitPrice: 480, isPromotion: true },
        { variantId: "4", minimumQuantity: 20, unitPrice: 450 },
      ],
    });
    expect(result.tiers).toHaveLength(2);
    expect(result.tiers[0]?.isPromotion).toBe(true);
  });
});
````

### `DokanBDbackend/src/modules/products/product.schema.ts`

Source lines: 264

````ts
import { z } from "zod";

const entityIdSchema = z
  .string()
  .regex(/^[1-9]\d*$/, "The id must be a positive integer.");

const moneySchema = z.coerce.number().finite().min(0).max(999_999_999.99);
const optionalMoneySchema = z.union([moneySchema, z.null()]).optional();
const optionalDateTimeSchema = z.union([z.iso.datetime(), z.null()]).optional();
const optionalDimensionSchema = z.union([
  z.null(),
  z.coerce.number().finite().min(0).max(99_999_999.99),
]).optional();

function hasValidDateRange(input: {
  discountStartsAt?: string | null;
  discountEndsAt?: string | null;
}) {
  return !input.discountStartsAt || !input.discountEndsAt ||
    new Date(input.discountStartsAt).getTime() <= new Date(input.discountEndsAt).getTime();
}

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
    brand: z.string().trim().min(1).max(120).optional(),
    minPrice: moneySchema.optional(),
    maxPrice: moneySchema.optional(),
    inStock: z
      .enum(["true", "false"])
      .optional()
      .transform((value) =>
        value === undefined ? undefined : value === "true",
      ),
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

export const productSearchSuggestionsQuerySchema = z.object({
  q: z.string().trim().min(2).max(100),
  limit: z.coerce.number().int().min(1).max(10).default(8),
});

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
  discountStartsAt: optionalDateTimeSchema,
  discountEndsAt: optionalDateTimeSchema,
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
  )
  .refine(hasValidDateRange, {
    message: "discountEndsAt must be after discountStartsAt.",
    path: ["discountEndsAt"],
  });

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
    discountStartsAt: productFields.discountStartsAt,
    discountEndsAt: productFields.discountEndsAt,
    status: productFields.status,
    isFeatured: productFields.isFeatured,
    isActive: productFields.isActive,
  })
  .strict()
  .refine((input) => Object.keys(input).length > 0, {
    message: "Provide at least one product field to update.",
  })
  .refine(hasValidDateRange, {
    message: "discountEndsAt must be after discountStartsAt.",
    path: ["discountEndsAt"],
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
  discountPrice: optionalMoneySchema,
  discountStartsAt: optionalDateTimeSchema,
  discountEndsAt: optionalDateTimeSchema,
  costPrice: optionalMoneySchema,
  stockQuantity: z.coerce.number().int().min(0).max(2_147_483_647).optional(),
  lowStockLevel: z.coerce.number().int().min(0).max(2_147_483_647).optional(),
  weight: z.union([z.coerce.number().finite().min(0).max(99_999_999.99), z.null()]).optional(),
  lengthCm: optionalDimensionSchema,
  widthCm: optionalDimensionSchema,
  heightCm: optionalDimensionSchema,
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
  optionValueIds: z.array(entityIdSchema).max(20).optional(),
};

export const createProductVariantSchema = z.object(variantFields).strict()
  .refine(
    ({ price, discountPrice }) => discountPrice === undefined || discountPrice === null || discountPrice <= price,
    { message: "discountPrice cannot be greater than price.", path: ["discountPrice"] },
  )
  .refine(hasValidDateRange, {
    message: "discountEndsAt must be after discountStartsAt.",
    path: ["discountEndsAt"],
  });

export const updateProductVariantSchema = z
  .object({
    vendorId: variantFields.vendorId,
    sku: variantFields.sku.optional(),
    barcode: variantFields.barcode,
    variantName: variantFields.variantName,
    color: variantFields.color,
    size: variantFields.size,
    price: variantFields.price.optional(),
    discountPrice: variantFields.discountPrice,
    discountStartsAt: variantFields.discountStartsAt,
    discountEndsAt: variantFields.discountEndsAt,
    costPrice: variantFields.costPrice,
    stockQuantity: variantFields.stockQuantity,
    lowStockLevel: variantFields.lowStockLevel,
    weight: variantFields.weight,
    lengthCm: variantFields.lengthCm,
    widthCm: variantFields.widthCm,
    heightCm: variantFields.heightCm,
    isDefault: variantFields.isDefault,
    isActive: variantFields.isActive,
    optionValueIds: variantFields.optionValueIds,
  })
  .strict()
  .refine((input) => Object.keys(input).length > 0, {
    message: "Provide at least one variant field to update.",
  })
  .refine(hasValidDateRange, {
    message: "discountEndsAt must be after discountStartsAt.",
    path: ["discountEndsAt"],
  });

export type PublicProductListQuery = z.infer<
  typeof publicProductListQuerySchema
>;
export type ProductSearchSuggestionsQuery = z.infer<
  typeof productSearchSuggestionsQuerySchema
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

export const createProductVariantsBulkSchema = z.object({
  variants: z.array(createProductVariantSchema).min(1).max(200),
}).strict();

export type CreateProductVariantsBulkInput = z.infer<
  typeof createProductVariantsBulkSchema
>;

export const replaceProductPriceTiersSchema = z.object({
  tiers: z.array(z.object({
    variantId: z.union([entityIdSchema, z.null()]).default(null),
    minimumQuantity: z.coerce.number().int().min(2).max(1_000_000),
    unitPrice: moneySchema,
    isPromotion: z.boolean().default(false),
    isActive: z.boolean().default(true),
  }).strict()).max(100),
}).strict();

export type ReplaceProductPriceTiersInput = z.infer<typeof replaceProductPriceTiersSchema>;
````

### `DokanBDbackend/src/modules/products/product.service.ts`

Source lines: 1396

````ts
import { In, type EntityManager, type SelectQueryBuilder } from "typeorm";

import { AppDataSource } from "../../database/data-source.js";
import { AppError } from "../../utils/app-error.js";
import { Brand } from "../brands/brand.entity.js";
import { Category } from "../categories/category.entity.js";
import { CategoryProductType } from "../categories/category-product-type.entity.js";
import { InventoryMovement } from "../inventory/inventory-movement.entity.js";
import { ProductType } from "../product-types/product-type.entity.js";
import {
  assertVariantCombinationAvailable,
  loadVariantAttributeSelections,
  replaceVariantAttributeValues,
  validateVariantOptionValues,
  type VariantAttributeSelection,
} from "../attributes/product-attribute.service.js";
import { Vendor } from "../vendors/vendor.entity.js";
import { ProductMedia } from "./product-media.entity.js";
import { ProductPriceTier } from "./product-price-tier.entity.js";
import { activeDiscountPrice, isDiscountActive } from "./product-pricing.js";
import { ProductVariant } from "./product-variant.entity.js";
import { Product } from "./product.entity.js";
import type {
  AdminProductListQuery,
  CreateProductInput,
  CreateProductVariantInput,
  CreateProductVariantsBulkInput,
  ProductSearchSuggestionsQuery,
  PublicProductListQuery,
  UpdateProductInput,
  UpdateProductVariantInput,
} from "./product.schema.js";

interface CatalogAssociations {
  variantsByProduct: Map<string, ProductVariant[]>;
  mediaByProduct: Map<string, ProductMedia[]>;
  attributeValuesByVariant: Map<string, VariantAttributeSelection[]>;
  priceTiersByProduct: Map<string, ProductPriceTier[]>;
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

function dateOrNull(value: string | null | undefined) {
  return value === undefined ? undefined : value === null ? null : new Date(value);
}

function toPublicVariant(
  variant: ProductVariant,
  optionValues: VariantAttributeSelection[] = [],
  priceTiers: ProductPriceTier[] = [],
) {
  const discountIsActive = isDiscountActive(
    variant.discountPrice,
    variant.discountStartsAt,
    variant.discountEndsAt,
  );
  return {
    id: variant.id,
    sku: variant.sku,
    barcode: variant.barcode,
    name: variant.variantName,
    color: variant.color,
    size: variant.size,
    price: activeDiscountPrice(
      variant.price,
      variant.discountPrice,
      variant.discountStartsAt,
      variant.discountEndsAt,
    ),
    regularPrice: variant.price,
    discountPrice: discountIsActive ? variant.discountPrice : null,
    discountStartsAt: variant.discountStartsAt,
    discountEndsAt: variant.discountEndsAt,
    stockQuantity: variant.stockQuantity,
    inStock: variant.stockQuantity > 0,
    weight: variant.weight,
    lengthCm: variant.lengthCm,
    widthCm: variant.widthCm,
    heightCm: variant.heightCm,
    isDefault: variant.isDefault,
    optionValues,
    priceTiers: priceTiers
      .filter((tier) => tier.isActive && (tier.variantId === null || tier.variantId === variant.id))
      .map((tier) => ({
        id: tier.id,
        variantId: tier.variantId,
        minimumQuantity: tier.minimumQuantity,
        unitPrice: tier.unitPrice,
        isPromotion: tier.isPromotion,
      })),
  };
}

function toAdminVariant(
  variant: ProductVariant,
  optionValues: VariantAttributeSelection[] = [],
  priceTiers: ProductPriceTier[] = [],
) {
  return {
    ...toPublicVariant(variant, optionValues, priceTiers),
    vendorId: variant.vendorId,
    costPrice: variant.costPrice,
    discountPrice: variant.discountPrice,
    discountStartsAt: variant.discountStartsAt,
    discountEndsAt: variant.discountEndsAt,
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
  attributeValuesByVariant: Map<string, VariantAttributeSelection[]> = new Map(),
  priceTiers: ProductPriceTier[] = [],
) {
  const stockQuantity = totalStock(variants);
  const primaryMedia =
    media.find((item) => item.mediaType === "IMAGE" && item.isPrimary) ??
    media.find((item) => item.mediaType === "IMAGE") ??
    null;
  const selectedValues = variants.flatMap(
    (variant) => attributeValuesByVariant.get(variant.id) ?? [],
  );
  const optionGroups = new Map<
    string,
    { attribute: VariantAttributeSelection["attribute"]; values: Array<Omit<VariantAttributeSelection, "attribute">> }
  >();
  for (const value of selectedValues) {
    const group = optionGroups.get(value.attribute.id) ?? {
      attribute: value.attribute,
      values: [],
    };
    if (!group.values.some((item) => item.id === value.id)) {
      const { attribute: _attribute, ...publicValue } = value;
      group.values.push(publicValue);
    }
    optionGroups.set(value.attribute.id, group);
  }

  const discountIsActive = isDiscountActive(
    product.discountPrice,
    product.discountStartsAt,
    product.discountEndsAt,
  );

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    shortDescription: product.shortDescription,
    ...(includeDetail ? { description: product.description } : {}),
    price: activeDiscountPrice(
      product.defaultPrice,
      product.discountPrice,
      product.discountStartsAt,
      product.discountEndsAt,
    ),
    regularPrice: product.defaultPrice,
    discountPrice: discountIsActive ? product.discountPrice : null,
    discountStartsAt: product.discountStartsAt,
    discountEndsAt: product.discountEndsAt,
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
    media: media.map(toPublicMedia),
    ...(includeDetail
      ? {
          variants: variants.map((variant) =>
            toPublicVariant(
              variant,
              attributeValuesByVariant.get(variant.id) ?? [],
              priceTiers,
            ),
          ),
          options: [...optionGroups.values()],
          priceTiers: priceTiers.map((tier) => ({
            id: tier.id,
            variantId: tier.variantId,
            minimumQuantity: tier.minimumQuantity,
            unitPrice: tier.unitPrice,
            isPromotion: tier.isPromotion,
            isActive: tier.isActive,
          })),
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
  attributeValuesByVariant: Map<string, VariantAttributeSelection[]> = new Map(),
  priceTiers: ProductPriceTier[] = [],
) {
  return {
    ...toPublicProduct(product, variants, media, includeDetail, attributeValuesByVariant, priceTiers),
    productTypeId: product.productTypeId,
    categoryId: product.categoryId,
    brandId: product.brandId,
    defaultCostPrice: product.defaultCostPrice,
    discountPrice: product.discountPrice,
    discountStartsAt: product.discountStartsAt,
    discountEndsAt: product.discountEndsAt,
    status: product.status,
    isActive: product.isActive,
    deletedAt: product.deletedAt,
    ...(includeDetail
      ? {
          variants: variants.map((variant) =>
            toAdminVariant(
              variant,
              attributeValuesByVariant.get(variant.id) ?? [],
              priceTiers,
            ),
          ),
        }
      : {}),
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

export function collectDescendantCategoryIds(
  categories: Array<Pick<Category, "id" | "parentId">>,
  targetId: string,
) {
  const ids = new Set<string>([targetId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const item of categories) {
      if (item.parentId && ids.has(item.parentId) && !ids.has(item.id)) {
        ids.add(item.id);
        changed = true;
      }
    }
  }
  return [...ids];
}

async function resolvePublicCategoryIds(category: string | undefined) {
  if (!category) return null;

  const repository = AppDataSource.getRepository(Category);
  const target = /^[1-9]\d*$/.test(category)
    ? await repository.findOneBy({ id: category, isActive: true })
    : await repository
        .createQueryBuilder("category")
        .where("LOWER(category.slug) = :slug", { slug: category.toLowerCase() })
        .andWhere("category.isActive = :active", { active: true })
        .getOne();
  if (!target) return [];

  const categories = await repository.find({ where: { isActive: true } });
  return collectDescendantCategoryIds(categories, target.id);
}

function applyBrandFilter(
  query: SelectQueryBuilder<Product>,
  brand: string | undefined,
) {
  if (!brand) return;

  if (/^[1-9]\d*$/.test(brand)) {
    query.andWhere("brand.id = :brandId", { brandId: brand });
  } else {
    query.andWhere("LOWER(brand.slug) = :brandSlug", {
      brandSlug: brand.toLowerCase(),
    });
  }
}

function applyStockFilter(
  query: SelectQueryBuilder<Product>,
  inStock: boolean | undefined,
) {
  if (inStock === undefined) return;

  const availableVariantExists = `EXISTS (
    SELECT 1
    FROM product_variants stock_variant
    WHERE stock_variant.product_id = product.id
      AND stock_variant.is_active = true
      AND stock_variant.deleted_at IS NULL
      AND stock_variant.stock_quantity > 0
  )`;

  query.andWhere(
    inStock ? availableVariantExists : `NOT ${availableVariantExists}`,
  );
}

function applyPublicSearchFilter(
  query: SelectQueryBuilder<Product>,
  search: string | undefined,
) {
  if (!search) return;

  query.andWhere(
    `(
      LOWER(product.name) LIKE :search
      OR LOWER(product.slug) LIKE :search
      OR LOWER(category.name) LIKE :search
      OR LOWER(COALESCE(brand.name, '')) LIKE :search
      OR EXISTS (
        SELECT 1
        FROM product_variants search_variant
        WHERE search_variant.product_id = product.id
          AND search_variant.is_active = true
          AND search_variant.deleted_at IS NULL
          AND LOWER(search_variant.sku) LIKE :search
      )
    )`,
    { search: `%${search.toLowerCase()}%` },
  );
}

function applyAdminSearchFilter(
  query: SelectQueryBuilder<Product>,
  search: string | undefined,
) {
  if (!search) return;

  query.andWhere(
    `(
      LOWER(product.name) LIKE :search
      OR LOWER(product.slug) LIKE :search
      OR LOWER(category.name) LIKE :search
      OR LOWER(COALESCE(brand.name, '')) LIKE :search
      OR EXISTS (
        SELECT 1
        FROM product_variants search_variant
        WHERE search_variant.product_id = product.id
          AND search_variant.deleted_at IS NULL
          AND LOWER(search_variant.sku) LIKE :search
      )
    )`,
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
  const priceTiersByProduct = new Map<string, ProductPriceTier[]>();
  let attributeValuesByVariant = new Map<string, VariantAttributeSelection[]>();

  if (productIds.length === 0) {
    return { variantsByProduct, mediaByProduct, attributeValuesByVariant, priceTiersByProduct };
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

  const [variants, media, priceTiers] = await Promise.all([
    variantQuery.getMany(),
    AppDataSource.getRepository(ProductMedia).find({
      where: { productId: In(productIds) },
      order: { sortOrder: "ASC", id: "ASC" },
    }),
    AppDataSource.getRepository(ProductPriceTier).find({
      where: { productId: In(productIds) },
      order: { variantId: "ASC", minimumQuantity: "ASC", id: "ASC" },
    }),
  ]);
  attributeValuesByVariant = await loadVariantAttributeSelections(
    variants.map((variant) => variant.id),
  );

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

  for (const tier of priceTiers) {
    const group = priceTiersByProduct.get(tier.productId) ?? [];
    group.push(tier);
    priceTiersByProduct.set(tier.productId, group);
  }

  return { variantsByProduct, mediaByProduct, attributeValuesByVariant, priceTiersByProduct };
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
      allowProducts: true,
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
      "The selected category does not exist, is inactive, or is only used to group child categories.",
    );
  }

  if (brandId && !brand) {
    throw new AppError(
      400,
      "PRODUCT_BRAND_INVALID",
      "The selected brand does not exist or is inactive.",
    );
  }

  const categoryType = await AppDataSource.getRepository(CategoryProductType).findOneBy({
    categoryId,
    productTypeId,
  });
  if (!categoryType) {
    throw new AppError(
      400,
      "PRODUCT_CATEGORY_TYPE_INVALID",
      "The selected product type is not assigned to this category.",
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

async function createVariantWithManager(
  manager: EntityManager,
  product: Product,
  input: CreateProductVariantInput,
  actorUserId: string,
) {
  const repository = manager.getRepository(ProductVariant);
  const optionValueIds = input.optionValueIds ?? [];
  const optionValues = await validateVariantOptionValues(
    manager,
    product.productTypeId,
    optionValueIds,
  );
  await assertVariantCombinationAvailable(manager, product.id, optionValueIds);

  const existingCount = await repository.countBy({ productId: product.id });
  const shouldBeDefault = input.isDefault === true || existingCount === 0;
  if (shouldBeDefault) {
    await repository.update(
      { productId: product.id, isDefault: true },
      { isDefault: false },
    );
  }

  const optionLabel = optionValues.map((value) => value.label).join(" / ");
  const selectedColor = optionValues.find((value) => value.attribute.code === "color");
  const selectedSize = optionValues.find((value) => value.attribute.code === "size");
  const variant = repository.create({
    productId: product.id,
    vendorId: input.vendorId ?? null,
    sku: input.sku,
    barcode: input.barcode ?? null,
    variantName: (input.variantName ?? optionLabel) || null,
    color: input.color ?? selectedColor?.label ?? null,
    size: input.size ?? selectedSize?.label ?? null,
    price: money(input.price),
    discountPrice:
      input.discountPrice === undefined || input.discountPrice === null
        ? null
        : money(input.discountPrice),
    discountStartsAt: dateOrNull(input.discountStartsAt) ?? null,
    discountEndsAt: dateOrNull(input.discountEndsAt) ?? null,
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
    lengthCm:
      input.lengthCm === undefined || input.lengthCm === null
        ? null
        : money(input.lengthCm),
    widthCm:
      input.widthCm === undefined || input.widthCm === null
        ? null
        : money(input.widthCm),
    heightCm:
      input.heightCm === undefined || input.heightCm === null
        ? null
        : money(input.heightCm),
    isDefault: shouldBeDefault,
    isActive: input.isActive ?? true,
  });
  await repository.save(variant);
  await replaceVariantAttributeValues(manager, variant.id, optionValueIds);

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

  return toAdminVariant(variant, optionValues);
}

export async function listPublicProducts(input: PublicProductListQuery) {
  const publicCategoryIds = await resolvePublicCategoryIds(input.category);
  const effectivePrice = `CASE
    WHEN product.discountPrice IS NOT NULL
      AND (product.discountStartsAt IS NULL OR product.discountStartsAt <= CURRENT_TIMESTAMP)
      AND (product.discountEndsAt IS NULL OR product.discountEndsAt >= CURRENT_TIMESTAMP)
    THEN product.discountPrice ELSE product.defaultPrice END`;
  const query = productRepository()
    .createQueryBuilder("product")
    .innerJoin("product.category", "category")
    .leftJoin("product.brand", "brand")
    .where("product.status = :status", { status: "ACTIVE" })
    .andWhere("product.isActive = :active", { active: true })
    .andWhere("category.isActive = :active", { active: true });

  applyPublicSearchFilter(query, input.search);
  if (publicCategoryIds) {
    if (publicCategoryIds.length === 0) query.andWhere("1 = 0");
    else query.andWhere("product.categoryId IN (:...publicCategoryIds)", { publicCategoryIds });
  }
  applyBrandFilter(query, input.brand);
  applyStockFilter(query, input.inStock);

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
        associations.attributeValuesByVariant,
        associations.priceTiersByProduct.get(product.id) ?? [],
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

export async function getProductSearchSuggestions(
  input: ProductSearchSuggestionsQuery,
) {
  const normalizedQuery = input.q.toLowerCase();
  const query = productRepository()
    .createQueryBuilder("product")
    .innerJoin("product.category", "category")
    .leftJoin("product.brand", "brand")
    .where("product.status = :status", { status: "ACTIVE" })
    .andWhere("product.isActive = :active", { active: true })
    .andWhere("category.isActive = :active", { active: true });

  applyPublicSearchFilter(query, input.q);

  const rawIds = await query
    .select("product.id", "id")
    .addSelect(
      `CASE
        WHEN LOWER(product.name) = :exactSearch THEN 0
        WHEN LOWER(product.name) LIKE :prefixSearch THEN 1
        ELSE 2
      END`,
      "searchRank",
    )
    .setParameters({
      exactSearch: normalizedQuery,
      prefixSearch: `${normalizedQuery}%`,
    })
    .orderBy("searchRank", "ASC")
    .addOrderBy("product.name", "ASC")
    .addOrderBy("product.id", "ASC")
    .limit(input.limit)
    .getRawMany<{ id: string | number }>();
  const ids = rawIds.map(({ id }) => String(id));
  const products = await loadProductsByIds(ids, false);
  const associations = await loadAssociations(ids, { publicOnly: true });

  return products.map((product) => {
    const publicProduct = toPublicProduct(
      product,
      associations.variantsByProduct.get(product.id) ?? [],
      associations.mediaByProduct.get(product.id) ?? [],
      false,
      associations.attributeValuesByVariant,
      associations.priceTiersByProduct.get(product.id) ?? [],
    );

    return {
      id: publicProduct.id,
      name: publicProduct.name,
      slug: publicProduct.slug,
      price: publicProduct.price,
      regularPrice: publicProduct.regularPrice,
      discountPrice: publicProduct.discountPrice,
      category: publicProduct.category,
      brand: publicProduct.brand,
      inStock: publicProduct.inStock,
      thumbnail: publicProduct.primaryImage
        ? {
            url:
              publicProduct.primaryImage.thumbnailUrl ??
              publicProduct.primaryImage.url,
            altText: publicProduct.primaryImage.altText,
          }
        : null,
    };
  });
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
    associations.attributeValuesByVariant,
    associations.priceTiersByProduct.get(product.id) ?? [],
  );
}

export async function listAdminProducts(input: AdminProductListQuery) {
  const query = productRepository()
    .createQueryBuilder("product")
    .leftJoin("product.category", "category")
    .leftJoin("product.brand", "brand");

  if (input.includeDeleted) query.withDeleted();
  if (input.status) query.andWhere("product.status = :status", { status: input.status });
  applyAdminSearchFilter(query, input.search);
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
        associations.attributeValuesByVariant,
        associations.priceTiersByProduct.get(product.id) ?? [],
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
  });

  return toAdminProduct(
    product,
    associations.variantsByProduct.get(product.id) ?? [],
    associations.mediaByProduct.get(product.id) ?? [],
    true,
    associations.attributeValuesByVariant,
    associations.priceTiersByProduct.get(product.id) ?? [],
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
    discountStartsAt: dateOrNull(input.discountStartsAt) ?? null,
    discountEndsAt: dateOrNull(input.discountEndsAt) ?? null,
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
  if (input.discountStartsAt !== undefined) {
    product.discountStartsAt = dateOrNull(input.discountStartsAt) ?? null;
  }
  if (input.discountEndsAt !== undefined) {
    product.discountEndsAt = dateOrNull(input.discountEndsAt) ?? null;
  }
  if (
    product.discountStartsAt &&
    product.discountEndsAt &&
    product.discountStartsAt.getTime() > product.discountEndsAt.getTime()
  ) {
    throw new AppError(
      400,
      "PRODUCT_DISCOUNT_SCHEDULE_INVALID",
      "The discount end date must be after the start date.",
    );
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

  return AppDataSource.transaction((manager) =>
    createVariantWithManager(manager, product, input, actorUserId),
  );
}

export async function createProductVariantsBulk(
  productId: string,
  input: CreateProductVariantsBulkInput,
  actorUserId: string,
) {
  const product = await productRepository().findOneBy({ id: productId });
  if (!product) throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found.");

  const skus = new Set<string>();
  const barcodes = new Set<string>();
  const combinations = new Set<string>();
  for (const variant of input.variants) {
    const sku = variant.sku.toLowerCase();
    if (skus.has(sku)) throw new AppError(409, "PRODUCT_SKU_DUPLICATE", "Each generated variant must have a unique SKU.");
    skus.add(sku);
    if (variant.barcode) {
      if (barcodes.has(variant.barcode)) throw new AppError(409, "PRODUCT_BARCODE_DUPLICATE", "Each generated variant must have a unique barcode.");
      barcodes.add(variant.barcode);
    }
    const combination = [...(variant.optionValueIds ?? [])].sort().join(":");
    if (combination && combinations.has(combination)) throw new AppError(409, "VARIANT_COMBINATION_DUPLICATE", "Generated variants contain the same option combination more than once.");
    if (combination) combinations.add(combination);
  }

  await Promise.all(input.variants.flatMap((variant) => [
    assertVendor(variant.vendorId),
    assertVariantIdentifiersAvailable(variant.sku, variant.barcode),
  ]));

  return AppDataSource.transaction(async (manager) => {
    const created = [];
    for (const variant of input.variants) {
      created.push(await createVariantWithManager(manager, product, variant, actorUserId));
    }
    return created;
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

    let optionValues = (await loadVariantAttributeSelections([variant.id], manager)).get(variant.id) ?? [];
    if (input.optionValueIds !== undefined) {
      const product = await manager.getRepository(Product).findOneBy({ id: productId });
      if (!product) throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found.");
      optionValues = await validateVariantOptionValues(
        manager,
        product.productTypeId,
        input.optionValueIds,
      );
      await assertVariantCombinationAvailable(
        manager,
        productId,
        input.optionValueIds,
        variantId,
      );
    }

    if (input.isDefault === true) {
      await repository.update(
        { productId, isDefault: true },
        { isDefault: false },
      );
    }

    const nextPrice = input.price ?? Number(variant.price);
    const nextDiscountPrice = input.discountPrice === undefined
      ? variant.discountPrice === null ? null : Number(variant.discountPrice)
      : input.discountPrice;
    const nextDiscountStartsAt = input.discountStartsAt === undefined
      ? variant.discountStartsAt
      : dateOrNull(input.discountStartsAt) ?? null;
    const nextDiscountEndsAt = input.discountEndsAt === undefined
      ? variant.discountEndsAt
      : dateOrNull(input.discountEndsAt) ?? null;
    if (nextDiscountPrice !== null && nextDiscountPrice > nextPrice) {
      throw new AppError(
        400,
        "VARIANT_DISCOUNT_INVALID",
        "discountPrice cannot be greater than price.",
      );
    }
    if (
      nextDiscountStartsAt &&
      nextDiscountEndsAt &&
      nextDiscountStartsAt.getTime() > nextDiscountEndsAt.getTime()
    ) {
      throw new AppError(
        400,
        "VARIANT_DISCOUNT_SCHEDULE_INVALID",
        "The discount end date must be after the start date.",
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
    if (input.discountPrice !== undefined) {
      variant.discountPrice = input.discountPrice === null ? null : money(input.discountPrice);
    }
    if (input.discountStartsAt !== undefined) {
      variant.discountStartsAt = nextDiscountStartsAt;
    }
    if (input.discountEndsAt !== undefined) {
      variant.discountEndsAt = nextDiscountEndsAt;
    }
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
    if (input.lengthCm !== undefined) {
      variant.lengthCm = input.lengthCm === null ? null : money(input.lengthCm);
    }
    if (input.widthCm !== undefined) {
      variant.widthCm = input.widthCm === null ? null : money(input.widthCm);
    }
    if (input.heightCm !== undefined) {
      variant.heightCm = input.heightCm === null ? null : money(input.heightCm);
    }
    if (input.isDefault !== undefined) variant.isDefault = input.isDefault;
    if (input.isActive !== undefined) variant.isActive = input.isActive;

    if (input.optionValueIds !== undefined) {
      const selectedColor = optionValues.find((value) => value.attribute.code === "color");
      const selectedSize = optionValues.find((value) => value.attribute.code === "size");
      if (input.color === undefined) variant.color = selectedColor?.label ?? null;
      if (input.size === undefined) variant.size = selectedSize?.label ?? null;
      if (input.variantName === undefined) {
        variant.variantName = optionValues.map((value) => value.label).join(" / ") || null;
      }
    }

    await repository.save(variant);
    if (input.optionValueIds !== undefined) {
      await replaceVariantAttributeValues(manager, variant.id, input.optionValueIds);
    }

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

    return toAdminVariant(variant, optionValues);
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

    if (variant.stockQuantity > 0) {
      throw new AppError(
        409,
        "PRODUCT_VARIANT_HAS_STOCK",
        "Set this variant's stock to zero before removing it.",
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
````

## Backend categories

Contains category hierarchy, product-assignable category rules, homepage category settings, and category-to-product-type assignments.

### `DokanBDbackend/src/modules/categories/README.md`

Source lines: 7

````md
# Categories module

Provides the public category tree and ADMIN/OWNER category management.

Administrators can create, edit, order, activate, select for homepage display,
soft-delete, and restore categories. Public responses also include product
counts and resolved category images for storefront navigation.
````

### `DokanBDbackend/src/modules/categories/category-product-type.entity.ts`

Source lines: 24

````ts
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";

import { ProductType } from "../product-types/product-type.entity.js";
import { Category } from "./category.entity.js";

@Entity({ name: "category_product_types" })
export class CategoryProductType {
  @PrimaryColumn({ name: "category_id", type: "bigint", unsigned: true })
  categoryId!: string;

  @PrimaryColumn({ name: "product_type_id", type: "bigint", unsigned: true })
  productTypeId!: string;

  @ManyToOne(() => Category, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "category_id" })
  category!: Category;

  @ManyToOne(() => ProductType, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "product_type_id" })
  productType!: ProductType;

  @Column({ name: "sort_order", type: "int", default: 0 })
  sortOrder!: number;
}
````

### `DokanBDbackend/src/modules/categories/category.controller.ts`

Source lines: 99

````ts
import type { RequestHandler } from "express";

import {
  adminCategoryListQuerySchema,
  categoryIdParamsSchema,
  createCategorySchema,
  setCategoryProductTypesSchema,
  updateCategorySchema,
} from "./category.schema.js";
import {
  createCategory,
  deleteCategory,
  getCategoryProductTypes,
  listAdminCategories,
  listPublicCategoryTree,
  restoreCategory,
  setCategoryProductTypes,
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

export const listCategoryProductTypesForAdmin: RequestHandler = async (
  request,
  response,
) => {
  const { id } = categoryIdParamsSchema.parse(request.params);
  response.status(200).json({
    success: true,
    data: await getCategoryProductTypes(id),
  });
};

export const setCategoryProductTypesForAdmin: RequestHandler = async (
  request,
  response,
) => {
  const { id } = categoryIdParamsSchema.parse(request.params);
  const input = setCategoryProductTypesSchema.parse(request.body);
  response.status(200).json({
    success: true,
    data: await setCategoryProductTypes(id, input),
  });
};
````

### `DokanBDbackend/src/modules/categories/category.entity.ts`

Source lines: 56

````ts
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

  @Column({ name: "show_on_homepage", type: "boolean", default: false })
  showOnHomepage!: boolean;

  @Column({ name: "allow_products", type: "boolean", default: true })
  allowProducts!: boolean;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "datetime" })
  updatedAt!: Date;

  @DeleteDateColumn({ name: "deleted_at", type: "datetime", nullable: true })
  deletedAt!: Date | null;
}
````

### `DokanBDbackend/src/modules/categories/category.routes.ts`

Source lines: 28

````ts
import { Router } from "express";

import { requireAuth } from "../auth/auth.middleware.js";
import { requireRole } from "../auth/authorization.middleware.js";
import {
  createCategoryForAdmin,
  deleteCategoryForAdmin,
  listCategoriesForAdmin,
  listCategoryProductTypesForAdmin,
  listPublicCategories,
  restoreCategoryForAdmin,
  setCategoryProductTypesForAdmin,
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
adminCategoryRouter.get("/:id/product-types", listCategoryProductTypesForAdmin);
adminCategoryRouter.put("/:id/product-types", setCategoryProductTypesForAdmin);
````

### `DokanBDbackend/src/modules/categories/category.schema.test.ts`

Source lines: 41

````ts
import { describe, expect, it } from "vitest";

import {
  createCategorySchema,
  setCategoryProductTypesSchema,
  updateCategorySchema,
} from "./category.schema.js";

describe("category management validation", () => {
  it("accepts product assignment, homepage visibility, and display order", () => {
    expect(
      createCategorySchema.parse({
        name: "Home appliances",
        allowProducts: false,
        showOnHomepage: true,
        sortOrder: "4",
      }),
    ).toMatchObject({
      name: "Home appliances",
      allowProducts: false,
      showOnHomepage: true,
      sortOrder: 4,
    });
  });

  it("rejects an empty update", () => {
    expect(() => updateCategorySchema.parse({})).toThrow();
  });

  it("accepts an empty grouping-category assignment and rejects duplicates", () => {
    expect(
      setCategoryProductTypesSchema.parse({ productTypeIds: ["2", "5"] }),
    ).toEqual({ productTypeIds: ["2", "5"] });
    expect(setCategoryProductTypesSchema.parse({ productTypeIds: [] })).toEqual({
      productTypeIds: [],
    });
    expect(() =>
      setCategoryProductTypesSchema.parse({ productTypeIds: ["2", "2"] }),
    ).toThrow();
  });
});
````

### `DokanBDbackend/src/modules/categories/category.schema.ts`

Source lines: 60

````ts
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

export const setCategoryProductTypesSchema = z.object({
  productTypeIds: z.array(entityIdSchema).max(200),
}).strict().refine(
  ({ productTypeIds }) => new Set(productTypeIds).size === productTypeIds.length,
  { message: "Choose each product type only once.", path: ["productTypeIds"] },
);

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
    allowProducts: z.boolean().optional(),
    showOnHomepage: z.boolean().optional(),
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
export type SetCategoryProductTypesInput = z.infer<typeof setCategoryProductTypesSchema>;
````

### `DokanBDbackend/src/modules/categories/category.service.ts`

Source lines: 497

````ts
import { In } from "typeorm";

import { AppDataSource } from "../../database/data-source.js";
import { AppError } from "../../utils/app-error.js";
import { ProductMedia } from "../products/product-media.entity.js";
import { Product } from "../products/product.entity.js";
import { ProductType } from "../product-types/product-type.entity.js";
import { CategoryProductType } from "./category-product-type.entity.js";
import { Category } from "./category.entity.js";
import type {
  CreateCategoryInput,
  SetCategoryProductTypesInput,
  UpdateCategoryInput,
} from "./category.schema.js";

export interface CategoryTreeItem {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  displayImageUrl: string | null;
  productCount: number;
  sortOrder: number;
  showOnHomepage: boolean;
  allowProducts: boolean;
  children: CategoryTreeItem[];
}

interface CategoryProductSummary {
  categoryId: string;
  displayImageUrl: string | null;
  productCount: number;
}

function categoryRepository() {
  return AppDataSource.getRepository(Category);
}

async function getCategoryProductSummaries(categoryIds: string[]) {
  if (categoryIds.length === 0) return new Map<string, CategoryProductSummary>();

  const rows = await AppDataSource.getRepository(Product)
    .createQueryBuilder("product")
    .leftJoin(
      ProductMedia,
      "categoryMedia",
      "categoryMedia.productId = product.id AND categoryMedia.mediaType = :mediaType",
      { mediaType: "IMAGE" },
    )
    .select("product.categoryId", "categoryId")
    .addSelect("COUNT(DISTINCT product.id)", "productCount")
    .addSelect(
      `SUBSTRING_INDEX(
        GROUP_CONCAT(
          COALESCE(categoryMedia.thumbnailUrl, categoryMedia.url)
          ORDER BY
            product.isFeatured DESC,
            product.createdAt DESC,
            categoryMedia.isPrimary DESC,
            categoryMedia.sortOrder ASC,
            categoryMedia.id ASC
          SEPARATOR '||'
        ),
        '||',
        1
      )`,
      "displayImageUrl",
    )
    .where("product.categoryId IN (:...categoryIds)", { categoryIds })
    .andWhere("product.status = :status", { status: "ACTIVE" })
    .andWhere("product.isActive = :active", { active: true })
    .groupBy("product.categoryId")
    .getRawMany<{
      categoryId: string | number;
      displayImageUrl: string | null;
      productCount: string | number;
    }>();

  return new Map(
    rows.map((row) => [
      String(row.categoryId),
      {
        categoryId: String(row.categoryId),
        displayImageUrl: row.displayImageUrl,
        productCount: Number(row.productCount),
      },
    ]),
  );
}

function includeDescendantSummary(item: CategoryTreeItem): CategoryTreeItem {
  item.children = item.children.map(includeDescendantSummary);
  item.productCount += item.children.reduce(
    (total, child) => total + child.productCount,
    0,
  );
  item.displayImageUrl ??=
    item.children.find((child) => child.displayImageUrl)?.displayImageUrl ?? null;
  return item;
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
    showOnHomepage: category.showOnHomepage,
    allowProducts: category.allowProducts,
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
  const productSummaries = await getCategoryProductSummaries(
    categories.map(({ id }) => id),
  );

  const byId = new Map<string, CategoryTreeItem>();

  for (const category of categories) {
    const productSummary = productSummaries.get(category.id);
    byId.set(category.id, {
      id: category.id,
      parentId: category.parentId,
      name: category.name,
      slug: category.slug,
      description: category.description,
      imageUrl: category.imageUrl,
      displayImageUrl: category.imageUrl ?? productSummary?.displayImageUrl ?? null,
      productCount: productSummary?.productCount ?? 0,
      sortOrder: category.sortOrder,
      showOnHomepage: category.showOnHomepage,
      allowProducts: category.allowProducts,
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

  return roots.map(includeDescendantSummary);
}

export async function listAdminCategories(includeDeleted: boolean) {
  const categories = await categoryRepository().find({
    withDeleted: includeDeleted,
    order: { sortOrder: "ASC", name: "ASC" },
  });

  return categories.map(toAdminCategory);
}

export async function getCategoryProductTypes(categoryId: string) {
  const category = await categoryRepository().findOneBy({ id: categoryId });
  if (!category) throw new AppError(404, "CATEGORY_NOT_FOUND", "Category not found.");

  const assignments = await AppDataSource.getRepository(CategoryProductType).find({
    where: { categoryId },
    order: { sortOrder: "ASC", productTypeId: "ASC" },
  });

  return {
    categoryId,
    productTypeIds: assignments.map((assignment) => assignment.productTypeId),
  };
}

export async function setCategoryProductTypes(
  categoryId: string,
  input: SetCategoryProductTypesInput,
) {
  const category = await categoryRepository().findOneBy({ id: categoryId });
  if (!category) throw new AppError(404, "CATEGORY_NOT_FOUND", "Category not found.");
  if (!category.allowProducts && input.productTypeIds.length > 0) {
    throw new AppError(
      409,
      "CATEGORY_DOES_NOT_ALLOW_PRODUCTS",
      "Grouping categories cannot have direct product type assignments.",
    );
  }

  const productTypes = input.productTypeIds.length > 0
    ? await AppDataSource.getRepository(ProductType).findBy({
        id: In(input.productTypeIds),
        isActive: true,
      })
    : [];
  if (productTypes.length !== input.productTypeIds.length) {
    throw new AppError(
      400,
      "CATEGORY_PRODUCT_TYPE_INVALID",
      "One or more product types do not exist, are inactive, or are deleted.",
    );
  }

  const productsUsingRemovedTypeQuery = AppDataSource.getRepository(Product)
    .createQueryBuilder("product")
    .withDeleted()
    .where("product.categoryId = :categoryId", { categoryId });
  if (input.productTypeIds.length > 0) {
    productsUsingRemovedTypeQuery.andWhere(
      "product.productTypeId NOT IN (:...productTypeIds)",
      { productTypeIds: input.productTypeIds },
    );
  }
  const productsUsingRemovedType = await productsUsingRemovedTypeQuery.getCount();
  if (productsUsingRemovedType > 0) {
    throw new AppError(
      409,
      "CATEGORY_PRODUCT_TYPE_IN_USE",
      "A removed product type is still used by a product in this category.",
    );
  }

  await AppDataSource.transaction(async (manager) => {
    const repository = manager.getRepository(CategoryProductType);
    await repository.delete({ categoryId });
    await repository.save(input.productTypeIds.map((productTypeId, index) =>
      repository.create({ categoryId, productTypeId, sortOrder: index }),
    ));
  });

  return getCategoryProductTypes(categoryId);
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
    showOnHomepage: input.showOnHomepage ?? false,
    allowProducts: input.allowProducts ?? true,
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
  if (input.isActive === false || input.allowProducts === false) {
    const productCount = await AppDataSource.getRepository(Product)
      .createQueryBuilder("product")
      .withDeleted()
      .where("product.categoryId = :categoryId", { categoryId })
      .getCount();
    if (productCount > 0) {
      throw new AppError(
        409,
        "CATEGORY_HAS_PRODUCTS",
        "Move this category's products before disabling product assignment or making the category inactive.",
      );
    }
  }
  if (input.isActive === false) {
    const activeChildCount = await repository.countBy({
      parentId: category.id,
      isActive: true,
    });
    if (activeChildCount > 0) {
      throw new AppError(
        409,
        "CATEGORY_HAS_ACTIVE_CHILDREN",
        "Move or deactivate this category's active child categories first.",
      );
    }
  }
  if (input.isActive !== undefined) category.isActive = input.isActive;
  if (input.allowProducts !== undefined) category.allowProducts = input.allowProducts;
  if (input.sortOrder !== undefined) category.sortOrder = input.sortOrder;
  if (input.showOnHomepage !== undefined) {
    category.showOnHomepage = input.showOnHomepage;
  }

  await repository.save(category);
  if (input.allowProducts === false) {
    await AppDataSource.getRepository(CategoryProductType).delete({ categoryId });
  }
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

  const productCount = await AppDataSource.getRepository(Product)
    .createQueryBuilder("product")
    .withDeleted()
    .where("product.categoryId = :categoryId", { categoryId })
    .getCount();
  if (productCount > 0) {
    throw new AppError(
      409,
      "CATEGORY_HAS_PRODUCTS",
      "Move this category's products before deleting it.",
    );
  }

  const assignmentCount = await AppDataSource.getRepository(CategoryProductType)
    .countBy({ categoryId });
  if (assignmentCount > 0) {
    throw new AppError(
      409,
      "CATEGORY_HAS_PRODUCT_TYPES",
      "Remove this category's product type assignments before deleting it.",
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
````

## Backend brands

Contains global optional brand management and safe archive/restore rules.

### `DokanBDbackend/src/modules/brands/README.md`

Source lines: 6

````md
# Brands module

Provides active public brand references and protected ADMIN/OWNER management.

Administrators can create, edit, activate, soft-delete, and restore brands.
Soft deletion preserves existing product associations and history.
````

### `DokanBDbackend/src/modules/brands/brand.controller.ts`

Source lines: 58

````ts
import type { RequestHandler } from "express";

import {
  adminBrandListQuerySchema,
  brandIdParamsSchema,
  createBrandSchema,
  updateBrandSchema,
} from "./brand.schema.js";
import {
  createBrand,
  deleteBrand,
  listAdminBrands,
  listPublicBrands,
  restoreBrand,
  updateBrand,
} from "./brand.service.js";

export const listBrands: RequestHandler = async (_request, response) => {
  const brands = await listPublicBrands();

  response.status(200).json({ success: true, data: { brands } });
};

export const listBrandsForAdmin: RequestHandler = async (request, response) => {
  const query = adminBrandListQuerySchema.parse(request.query);
  const brands = await listAdminBrands(query.includeDeleted);

  response.status(200).json({ success: true, data: { brands } });
};

export const createBrandForAdmin: RequestHandler = async (request, response) => {
  const input = createBrandSchema.parse(request.body);
  const brand = await createBrand(input);

  response.status(201).json({ success: true, data: { brand } });
};

export const updateBrandForAdmin: RequestHandler = async (request, response) => {
  const { id } = brandIdParamsSchema.parse(request.params);
  const input = updateBrandSchema.parse(request.body);
  const brand = await updateBrand(id, input);

  response.status(200).json({ success: true, data: { brand } });
};

export const deleteBrandForAdmin: RequestHandler = async (request, response) => {
  const { id } = brandIdParamsSchema.parse(request.params);
  await deleteBrand(id);

  response.status(204).send();
};

export const restoreBrandForAdmin: RequestHandler = async (request, response) => {
  const { id } = brandIdParamsSchema.parse(request.params);
  const brand = await restoreBrand(id);

  response.status(200).json({ success: true, data: { brand } });
};
````

### `DokanBDbackend/src/modules/brands/brand.entity.ts`

Source lines: 38

````ts
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
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

  @DeleteDateColumn({ name: "deleted_at", type: "datetime", nullable: true })
  deletedAt!: Date | null;
}
````

### `DokanBDbackend/src/modules/brands/brand.routes.ts`

Source lines: 24

````ts
import { Router } from "express";

import { requireAuth } from "../auth/auth.middleware.js";
import { requireRole } from "../auth/authorization.middleware.js";
import {
  createBrandForAdmin,
  deleteBrandForAdmin,
  listBrands,
  listBrandsForAdmin,
  restoreBrandForAdmin,
  updateBrandForAdmin,
} from "./brand.controller.js";

export const brandRouter = Router();
export const adminBrandRouter = Router();

brandRouter.get("/", listBrands);

adminBrandRouter.use(requireAuth, requireRole("ADMIN", "OWNER"));
adminBrandRouter.get("/", listBrandsForAdmin);
adminBrandRouter.post("/", createBrandForAdmin);
adminBrandRouter.patch("/:id", updateBrandForAdmin);
adminBrandRouter.delete("/:id", deleteBrandForAdmin);
adminBrandRouter.post("/:id/restore", restoreBrandForAdmin);
````

### `DokanBDbackend/src/modules/brands/brand.schema.test.ts`

Source lines: 20

````ts
import { describe, expect, it } from "vitest";

import { createBrandSchema, updateBrandSchema } from "./brand.schema.js";

describe("brand management validation", () => {
  it("accepts a valid brand and trims its values", () => {
    expect(
      createBrandSchema.parse({
        name: "  North Star  ",
        slug: "north-star",
        isActive: true,
      }),
    ).toMatchObject({ name: "North Star", slug: "north-star", isActive: true });
  });

  it("rejects invalid slugs and empty updates", () => {
    expect(() => createBrandSchema.parse({ name: "Brand", slug: "Bad Slug" })).toThrow();
    expect(() => updateBrandSchema.parse({})).toThrow();
  });
});
````

### `DokanBDbackend/src/modules/brands/brand.schema.ts`

Source lines: 46

````ts
import { z } from "zod";

const entityIdSchema = z
  .string()
  .regex(/^[1-9]\d*$/, "The id must be a positive integer.");

const nullableUrlSchema = z
  .union([z.string().trim().url().max(500), z.null()])
  .optional();

export const brandIdParamsSchema = z.object({ id: entityIdSchema });

export const createBrandSchema = z
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
    logoUrl: nullableUrlSchema,
    description: z.union([z.string().trim().max(10_000), z.null()]).optional(),
    isActive: z.boolean().optional(),
  })
  .strict();

export const updateBrandSchema = createBrandSchema
  .partial()
  .refine((input) => Object.keys(input).length > 0, {
    message: "Provide at least one brand field to update.",
  });

export const adminBrandListQuerySchema = z.object({
  includeDeleted: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
});

export type CreateBrandInput = z.infer<typeof createBrandSchema>;
export type UpdateBrandInput = z.infer<typeof updateBrandSchema>;
````

### `DokanBDbackend/src/modules/brands/brand.service.ts`

Source lines: 152

````ts
import { AppDataSource } from "../../database/data-source.js";
import { AppError } from "../../utils/app-error.js";
import { Brand } from "./brand.entity.js";
import type { CreateBrandInput, UpdateBrandInput } from "./brand.schema.js";

function brandRepository() {
  return AppDataSource.getRepository(Brand);
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
      "BRAND_SLUG_REQUIRED",
      "Provide an English slug when the brand name cannot form one.",
    );
  }

  return slug;
}

function toAdminBrand(brand: Brand) {
  return {
    id: brand.id,
    name: brand.name,
    slug: brand.slug,
    logoUrl: brand.logoUrl,
    description: brand.description,
    isActive: brand.isActive,
    createdAt: brand.createdAt,
    updatedAt: brand.updatedAt,
    deletedAt: brand.deletedAt,
  };
}

async function assertSlugAvailable(slug: string, ignoredId?: string) {
  const query = brandRepository()
    .createQueryBuilder("brand")
    .withDeleted()
    .where("LOWER(brand.slug) = :slug", { slug: slug.toLowerCase() });

  if (ignoredId) query.andWhere("brand.id != :ignoredId", { ignoredId });

  if (await query.getOne()) {
    throw new AppError(
      409,
      "BRAND_SLUG_EXISTS",
      "A brand with this slug already exists.",
    );
  }
}

export async function listPublicBrands() {
  const brands = await brandRepository().find({
    where: { isActive: true },
    order: { name: "ASC" },
  });

  return brands.map((brand) => ({
    id: brand.id,
    name: brand.name,
    slug: brand.slug,
    logoUrl: brand.logoUrl,
  }));
}

export async function listAdminBrands(includeDeleted: boolean) {
  const brands = await brandRepository().find({
    withDeleted: includeDeleted,
    order: { name: "ASC" },
  });

  return brands.map(toAdminBrand);
}

export async function createBrand(input: CreateBrandInput) {
  const slug = input.slug ?? createSlug(input.name);
  await assertSlugAvailable(slug);

  const repository = brandRepository();
  const brand = repository.create({
    name: input.name,
    slug,
    logoUrl: input.logoUrl ?? null,
    description: input.description ?? null,
    isActive: input.isActive ?? true,
  });

  await repository.save(brand);
  return toAdminBrand(brand);
}

export async function updateBrand(brandId: string, input: UpdateBrandInput) {
  const repository = brandRepository();
  const brand = await repository.findOneBy({ id: brandId });

  if (!brand) {
    throw new AppError(404, "BRAND_NOT_FOUND", "Brand not found.");
  }

  if (input.slug !== undefined) {
    await assertSlugAvailable(input.slug, brand.id);
    brand.slug = input.slug;
  }

  if (input.name !== undefined) brand.name = input.name;
  if (input.logoUrl !== undefined) brand.logoUrl = input.logoUrl;
  if (input.description !== undefined) brand.description = input.description;
  if (input.isActive !== undefined) brand.isActive = input.isActive;

  await repository.save(brand);
  return toAdminBrand(brand);
}

export async function deleteBrand(brandId: string) {
  const repository = brandRepository();
  const brand = await repository.findOneBy({ id: brandId });

  if (!brand) {
    throw new AppError(404, "BRAND_NOT_FOUND", "Brand not found.");
  }

  await repository.softRemove(brand);
}

export async function restoreBrand(brandId: string) {
  const repository = brandRepository();
  const brand = await repository.findOne({
    where: { id: brandId },
    withDeleted: true,
  });

  if (!brand) {
    throw new AppError(404, "BRAND_NOT_FOUND", "Brand not found.");
  }

  if (!brand.deletedAt) {
    throw new AppError(409, "BRAND_NOT_DELETED", "This brand is not deleted.");
  }

  await repository.restore(brand.id);
  brand.deletedAt = null;
  return toAdminBrand(brand);
}
````

## Backend product types

Contains reusable product type management. Category assignment is stored separately through category_product_types.

### `DokanBDbackend/src/modules/product-types/product-type.controller.ts`

Source lines: 30

````ts
import type { RequestHandler } from "express";
import { adminProductTypeListQuerySchema, createProductTypeSchema, productTypeIdParamsSchema, updateProductTypeSchema } from "./product-type.schema.js";
import { createProductType, deleteProductType, listAdminProductTypes, restoreProductType, updateProductType } from "./product-type.service.js";

export const listProductTypesForAdmin: RequestHandler = async (request, response) => {
  const query = adminProductTypeListQuerySchema.parse(request.query);
  response.status(200).json({ success: true, data: { productTypes: await listAdminProductTypes(query.includeDeleted) } });
};

export const createProductTypeForAdmin: RequestHandler = async (request, response) => {
  const productType = await createProductType(createProductTypeSchema.parse(request.body));
  response.status(201).json({ success: true, data: { productType } });
};

export const updateProductTypeForAdmin: RequestHandler = async (request, response) => {
  const { id } = productTypeIdParamsSchema.parse(request.params);
  const productType = await updateProductType(id, updateProductTypeSchema.parse(request.body));
  response.status(200).json({ success: true, data: { productType } });
};

export const deleteProductTypeForAdmin: RequestHandler = async (request, response) => {
  const { id } = productTypeIdParamsSchema.parse(request.params);
  await deleteProductType(id);
  response.status(204).send();
};

export const restoreProductTypeForAdmin: RequestHandler = async (request, response) => {
  const { id } = productTypeIdParamsSchema.parse(request.params);
  response.status(200).json({ success: true, data: { productType: await restoreProductType(id) } });
};
````

### `DokanBDbackend/src/modules/product-types/product-type.entity.ts`

Source lines: 35

````ts
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
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

  @DeleteDateColumn({ name: "deleted_at", type: "datetime", nullable: true })
  deletedAt!: Date | null;
}
````

### `DokanBDbackend/src/modules/product-types/product-type.routes.ts`

Source lines: 12

````ts
import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import { requireRole } from "../auth/authorization.middleware.js";
import { createProductTypeForAdmin, deleteProductTypeForAdmin, listProductTypesForAdmin, restoreProductTypeForAdmin, updateProductTypeForAdmin } from "./product-type.controller.js";

export const adminProductTypeRouter = Router();
adminProductTypeRouter.use(requireAuth, requireRole("ADMIN", "OWNER"));
adminProductTypeRouter.get("/", listProductTypesForAdmin);
adminProductTypeRouter.post("/", createProductTypeForAdmin);
adminProductTypeRouter.patch("/:id", updateProductTypeForAdmin);
adminProductTypeRouter.delete("/:id", deleteProductTypeForAdmin);
adminProductTypeRouter.post("/:id/restore", restoreProductTypeForAdmin);
````

### `DokanBDbackend/src/modules/product-types/product-type.schema.test.ts`

Source lines: 13

````ts
import { describe, expect, it } from "vitest";
import {
  createProductTypeSchema,
  updateProductTypeSchema,
} from "./product-type.schema.js";

describe("product type validation", () => {
  it("accepts a valid type", () => expect(createProductTypeSchema.parse({ name: "Smart Phone", slug: "smart-phone" })).toMatchObject({ name: "Smart Phone", slug: "smart-phone" }));
  it("rejects invalid slugs and empty updates", () => {
    expect(() => createProductTypeSchema.parse({ name: "Phone", slug: "Bad Slug" })).toThrow();
    expect(() => updateProductTypeSchema.parse({})).toThrow();
  });
});
````

### `DokanBDbackend/src/modules/product-types/product-type.schema.ts`

Source lines: 27

````ts
import { z } from "zod";

const id = z.string().regex(/^[1-9]\d*$/, "The id must be a positive integer.");

export const productTypeIdParamsSchema = z.object({ id });

export const createProductTypeSchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z.string().trim().min(1).max(120).regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Use lowercase letters, numbers, and single hyphens.",
  ).optional(),
  description: z.union([z.string().trim().max(10_000), z.null()]).optional(),
  isActive: z.boolean().optional(),
}).strict();

export const updateProductTypeSchema = createProductTypeSchema.partial().refine(
  (input) => Object.keys(input).length > 0,
  { message: "Provide at least one product type field to update." },
);

export const adminProductTypeListQuerySchema = z.object({
  includeDeleted: z.enum(["true", "false"]).default("false").transform((value) => value === "true"),
});

export type CreateProductTypeInput = z.infer<typeof createProductTypeSchema>;
export type UpdateProductTypeInput = z.infer<typeof updateProductTypeSchema>;
````

### `DokanBDbackend/src/modules/product-types/product-type.service.ts`

Source lines: 69

````ts
import { AppDataSource } from "../../database/data-source.js";
import { AppError } from "../../utils/app-error.js";
import { ProductType } from "./product-type.entity.js";
import type { CreateProductTypeInput, UpdateProductTypeInput } from "./product-type.schema.js";

const repository = () => AppDataSource.getRepository(ProductType);

function createSlug(value: string) {
  const slug = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120).replace(/-+$/g, "");
  if (!slug) throw new AppError(400, "PRODUCT_TYPE_SLUG_REQUIRED", "Provide an English slug when the name cannot form one.");
  return slug;
}

function response(type: ProductType) {
  return {
    id: type.id,
    name: type.name,
    slug: type.slug,
    description: type.description,
    isActive: type.isActive,
    createdAt: type.createdAt,
    updatedAt: type.updatedAt,
    deletedAt: type.deletedAt,
  };
}

async function assertSlugAvailable(slug: string, ignoredId?: string) {
  const query = repository().createQueryBuilder("type").withDeleted().where("LOWER(type.slug) = :slug", { slug: slug.toLowerCase() });
  if (ignoredId) query.andWhere("type.id != :ignoredId", { ignoredId });
  if (await query.getOne()) throw new AppError(409, "PRODUCT_TYPE_SLUG_EXISTS", "A product type with this slug already exists.");
}

export async function listAdminProductTypes(includeDeleted: boolean) {
  return (await repository().find({ withDeleted: includeDeleted, order: { name: "ASC" } })).map(response);
}

export async function createProductType(input: CreateProductTypeInput) {
  const slug = input.slug ?? createSlug(input.name);
  await assertSlugAvailable(slug);
  const type = repository().create({ name: input.name, slug, description: input.description ?? null, isActive: input.isActive ?? true });
  await repository().save(type);
  return response(type);
}

export async function updateProductType(typeId: string, input: UpdateProductTypeInput) {
  const type = await repository().findOneBy({ id: typeId });
  if (!type) throw new AppError(404, "PRODUCT_TYPE_NOT_FOUND", "Product type not found.");
  if (input.slug !== undefined) { await assertSlugAvailable(input.slug, type.id); type.slug = input.slug; }
  if (input.name !== undefined) type.name = input.name;
  if (input.description !== undefined) type.description = input.description;
  if (input.isActive !== undefined) type.isActive = input.isActive;
  await repository().save(type);
  return response(type);
}

export async function deleteProductType(typeId: string) {
  const type = await repository().findOneBy({ id: typeId });
  if (!type) throw new AppError(404, "PRODUCT_TYPE_NOT_FOUND", "Product type not found.");
  await repository().softRemove(type);
}

export async function restoreProductType(typeId: string) {
  const type = await repository().findOne({ where: { id: typeId }, withDeleted: true });
  if (!type) throw new AppError(404, "PRODUCT_TYPE_NOT_FOUND", "Product type not found.");
  if (!type.deletedAt) throw new AppError(409, "PRODUCT_TYPE_NOT_DELETED", "This product type is not deleted.");
  await repository().restore(type.id);
  type.deletedAt = null;
  return response(type);
}
````

## Backend attributes and option values

Contains attribute templates, values, product-type assignments, per-SKU value selections, and safe deletion checks.

### `DokanBDbackend/src/modules/attributes/product-attribute-value.entity.ts`

Source lines: 51

````ts
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import { ProductAttribute } from "./product-attribute.entity.js";

@Entity({ name: "catalog_attribute_values" })
@Index("UQ_catalog_attribute_value_code", ["attributeId", "code"], { unique: true })
export class ProductAttributeValue {
  @PrimaryGeneratedColumn({ type: "bigint", unsigned: true })
  id!: string;

  @Column({ name: "attribute_id", type: "bigint", unsigned: true })
  attributeId!: string;

  @ManyToOne(() => ProductAttribute, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "attribute_id" })
  attribute!: ProductAttribute;

  @Column({ type: "varchar", length: 100 })
  label!: string;

  @Column({ type: "varchar", length: 120 })
  code!: string;

  @Column({ name: "color_hex", type: "varchar", length: 7, nullable: true })
  colorHex!: string | null;

  @Column({ name: "sort_order", type: "int", default: 0 })
  sortOrder!: number;

  @Column({ name: "is_active", type: "boolean", default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "datetime" })
  updatedAt!: Date;

  @DeleteDateColumn({ name: "deleted_at", type: "datetime", nullable: true })
  deletedAt!: Date | null;
}
````

### `DokanBDbackend/src/modules/attributes/product-attribute.controller.ts`

Source lines: 70

````ts
import type { RequestHandler } from "express";

import {
  adminAttributeListQuerySchema,
  attributeIdParamsSchema,
  attributeValueParamsSchema,
  createProductAttributeSchema,
  createProductAttributeValueSchema,
  productTypeAttributeParamsSchema,
  setProductTypeAttributesSchema,
  updateProductAttributeSchema,
  updateProductAttributeValueSchema,
} from "./product-attribute.schema.js";
import {
  createProductAttribute,
  createProductAttributeValue,
  deleteProductAttribute,
  deleteProductAttributeValue,
  getProductTypeAttributes,
  listProductAttributes,
  restoreProductAttribute,
  restoreProductAttributeValue,
  setProductTypeAttributes,
  updateProductAttribute,
  updateProductAttributeValue,
} from "./product-attribute.service.js";

export const listAttributesForAdmin: RequestHandler = async (request, response) => {
  const query = adminAttributeListQuerySchema.parse(request.query);
  response.status(200).json({ success: true, data: { attributes: await listProductAttributes(query.includeDeleted) } });
};
export const createAttributeForAdmin: RequestHandler = async (request, response) => {
  response.status(201).json({ success: true, data: { attribute: await createProductAttribute(createProductAttributeSchema.parse(request.body)) } });
};
export const updateAttributeForAdmin: RequestHandler = async (request, response) => {
  const { id } = attributeIdParamsSchema.parse(request.params);
  response.status(200).json({ success: true, data: { attribute: await updateProductAttribute(id, updateProductAttributeSchema.parse(request.body)) } });
};
export const deleteAttributeForAdmin: RequestHandler = async (request, response) => {
  const { id } = attributeIdParamsSchema.parse(request.params);
  await deleteProductAttribute(id); response.status(204).send();
};
export const restoreAttributeForAdmin: RequestHandler = async (request, response) => {
  const { id } = attributeIdParamsSchema.parse(request.params);
  response.status(200).json({ success: true, data: { attribute: await restoreProductAttribute(id) } });
};
export const createAttributeValueForAdmin: RequestHandler = async (request, response) => {
  const { id } = attributeIdParamsSchema.parse(request.params);
  response.status(201).json({ success: true, data: { value: await createProductAttributeValue(id, createProductAttributeValueSchema.parse(request.body)) } });
};
export const updateAttributeValueForAdmin: RequestHandler = async (request, response) => {
  const { id, valueId } = attributeValueParamsSchema.parse(request.params);
  response.status(200).json({ success: true, data: { value: await updateProductAttributeValue(id, valueId, updateProductAttributeValueSchema.parse(request.body)) } });
};
export const deleteAttributeValueForAdmin: RequestHandler = async (request, response) => {
  const { id, valueId } = attributeValueParamsSchema.parse(request.params);
  await deleteProductAttributeValue(id, valueId); response.status(204).send();
};
export const restoreAttributeValueForAdmin: RequestHandler = async (request, response) => {
  const { id, valueId } = attributeValueParamsSchema.parse(request.params);
  response.status(200).json({ success: true, data: { value: await restoreProductAttributeValue(id, valueId) } });
};
export const listProductTypeAttributesForAdmin: RequestHandler = async (request, response) => {
  const { productTypeId } = productTypeAttributeParamsSchema.parse(request.params);
  response.status(200).json({ success: true, data: { attributes: await getProductTypeAttributes(productTypeId) } });
};
export const setProductTypeAttributesForAdmin: RequestHandler = async (request, response) => {
  const { productTypeId } = productTypeAttributeParamsSchema.parse(request.params);
  response.status(200).json({ success: true, data: { attributes: await setProductTypeAttributes(productTypeId, setProductTypeAttributesSchema.parse(request.body)) } });
};
````

### `DokanBDbackend/src/modules/attributes/product-attribute.entity.ts`

Source lines: 35

````ts
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity({ name: "catalog_attributes" })
export class ProductAttribute {
  @PrimaryGeneratedColumn({ type: "bigint", unsigned: true })
  id!: string;

  @Column({ type: "varchar", length: 100 })
  name!: string;

  @Column({ type: "varchar", length: 120, unique: true })
  code!: string;

  @Column({ name: "input_type", type: "varchar", length: 20, default: "SELECT" })
  inputType!: string;

  @Column({ name: "is_active", type: "boolean", default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "datetime" })
  updatedAt!: Date;

  @DeleteDateColumn({ name: "deleted_at", type: "datetime", nullable: true })
  deletedAt!: Date | null;
}
````

### `DokanBDbackend/src/modules/attributes/product-attribute.routes.ts`

Source lines: 26

````ts
import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import { requireRole } from "../auth/authorization.middleware.js";
import {
  createAttributeForAdmin, createAttributeValueForAdmin, deleteAttributeForAdmin,
  deleteAttributeValueForAdmin, listAttributesForAdmin, listProductTypeAttributesForAdmin,
  restoreAttributeForAdmin, restoreAttributeValueForAdmin, setProductTypeAttributesForAdmin,
  updateAttributeForAdmin, updateAttributeValueForAdmin,
} from "./product-attribute.controller.js";

export const adminProductAttributeRouter = Router();
adminProductAttributeRouter.use(requireAuth, requireRole("ADMIN", "OWNER"));
adminProductAttributeRouter.get("/", listAttributesForAdmin);
adminProductAttributeRouter.post("/", createAttributeForAdmin);
adminProductAttributeRouter.patch("/:id", updateAttributeForAdmin);
adminProductAttributeRouter.delete("/:id", deleteAttributeForAdmin);
adminProductAttributeRouter.post("/:id/restore", restoreAttributeForAdmin);
adminProductAttributeRouter.post("/:id/values", createAttributeValueForAdmin);
adminProductAttributeRouter.patch("/:id/values/:valueId", updateAttributeValueForAdmin);
adminProductAttributeRouter.delete("/:id/values/:valueId", deleteAttributeValueForAdmin);
adminProductAttributeRouter.post("/:id/values/:valueId/restore", restoreAttributeValueForAdmin);

export const adminProductTypeAttributeRouter = Router();
adminProductTypeAttributeRouter.use(requireAuth, requireRole("ADMIN", "OWNER"));
adminProductTypeAttributeRouter.get("/:productTypeId/attributes", listProductTypeAttributesForAdmin);
adminProductTypeAttributeRouter.put("/:productTypeId/attributes", setProductTypeAttributesForAdmin);
````

### `DokanBDbackend/src/modules/attributes/product-attribute.schema.test.ts`

Source lines: 29

````ts
import { describe, expect, it } from "vitest";

import {
  createProductAttributeSchema,
  createProductAttributeValueSchema,
  setProductTypeAttributesSchema,
} from "./product-attribute.schema.js";

describe("product attribute schemas", () => {
  it("accepts reusable color properties and hex values", () => {
    expect(createProductAttributeSchema.parse({ name: "Color", inputType: "COLOR" })).toMatchObject({ name: "Color", inputType: "COLOR" });
    expect(createProductAttributeSchema.parse({ name: "Size", values: ["S", "M", "L"] })).toMatchObject({
      name: "Size",
      inputType: "SELECT",
      values: ["S", "M", "L"],
    });
    expect(createProductAttributeValueSchema.parse({ label: "Ocean blue", colorHex: "#0066CC" })).toMatchObject({ label: "Ocean blue", colorHex: "#0066CC" });
  });

  it("rejects duplicate values when creating an attribute", () => {
    expect(() => createProductAttributeSchema.parse({ name: "Size", values: ["XL", "xl"] })).toThrow();
  });

  it("rejects duplicate product-type assignments", () => {
    expect(() => setProductTypeAttributesSchema.parse({ attributes: [
      { attributeId: "1" }, { attributeId: "1" },
    ] })).toThrow();
  });
});
````

### `DokanBDbackend/src/modules/attributes/product-attribute.schema.ts`

Source lines: 92

````ts
import { z } from "zod";

const entityIdSchema = z.string().regex(/^[1-9]\d*$/, "The id must be a positive integer.");
const codeSchema = z.string().trim().min(1).max(120).regex(
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  "Use lowercase letters, numbers, and single hyphens.",
);

export const attributeIdParamsSchema = z.object({ id: entityIdSchema });
export const attributeValueParamsSchema = z.object({
  id: entityIdSchema,
  valueId: entityIdSchema,
});
export const productTypeAttributeParamsSchema = z.object({
  productTypeId: entityIdSchema,
});

const productAttributeFields = {
  name: z.string().trim().min(2).max(100),
  code: codeSchema.optional(),
  inputType: z.enum(["SELECT", "COLOR", "TEXT"]).default("SELECT"),
  isActive: z.boolean().optional(),
};

export const createProductAttributeSchema = z.object({
  ...productAttributeFields,
  values: z.array(z.string().trim().min(1).max(100)).min(1).max(100).optional(),
}).strict().superRefine(({ values }, context) => {
  const seen = new Set<string>();
  values?.forEach((value, index) => {
    const key = value.toLocaleLowerCase();
    if (seen.has(key)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Each attribute value can be added only once.",
        path: ["values", index],
      });
    }
    seen.add(key);
  });
});

export const updateProductAttributeSchema = z.object(productAttributeFields)
  .partial()
  .strict()
  .refine((input) => Object.keys(input).length > 0, {
    message: "Provide at least one attribute field to update.",
  });

export const createProductAttributeValueSchema = z.object({
  label: z.string().trim().min(1).max(100),
  code: codeSchema.optional(),
  colorHex: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional(),
  sortOrder: z.coerce.number().int().min(0).max(1_000_000).optional(),
  isActive: z.boolean().optional(),
}).strict();

export const updateProductAttributeValueSchema = createProductAttributeValueSchema
  .partial()
  .refine((input) => Object.keys(input).length > 0, {
    message: "Provide at least one attribute value field to update.",
  });

export const setProductTypeAttributesSchema = z.object({
  attributes: z.array(z.object({
    attributeId: entityIdSchema,
    isRequired: z.boolean().optional(),
    sortOrder: z.coerce.number().int().min(0).max(1_000_000).optional(),
  }).strict()).max(50),
}).strict().superRefine(({ attributes }, context) => {
  const ids = new Set<string>();
  attributes.forEach((attribute, index) => {
    if (ids.has(attribute.attributeId)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Each attribute can be assigned only once.",
        path: ["attributes", index, "attributeId"],
      });
    }
    ids.add(attribute.attributeId);
  });
});

export const adminAttributeListQuerySchema = z.object({
  includeDeleted: z.enum(["true", "false"]).default("false").transform((value) => value === "true"),
});

export type CreateProductAttributeInput = z.infer<typeof createProductAttributeSchema>;
export type UpdateProductAttributeInput = z.infer<typeof updateProductAttributeSchema>;
export type CreateProductAttributeValueInput = z.infer<typeof createProductAttributeValueSchema>;
export type UpdateProductAttributeValueInput = z.infer<typeof updateProductAttributeValueSchema>;
export type SetProductTypeAttributesInput = z.infer<typeof setProductTypeAttributesSchema>;
````

### `DokanBDbackend/src/modules/attributes/product-attribute.service.test.ts`

Source lines: 23

````ts
import { describe, expect, it } from "vitest";

import { attributeSkuUsageMessage } from "./product-attribute.service.js";

describe("product attribute SKU protection", () => {
  it("explains why a used attribute cannot be deleted", () => {
    expect(attributeSkuUsageMessage("attribute", "Color", {
      count: 4,
      examples: ["SHIRT-BLK-M", "SHIRT-BLK-L", "SHIRT-RED-M"],
    })).toBe(
      "Cannot delete the “Color” attribute because 4 SKUs use it (SHIRT-BLK-M, SHIRT-BLK-L, SHIRT-RED-M, …). Reassign or delete the affected SKU variants first.",
    );
  });

  it("uses clear singular wording for one affected SKU value", () => {
    expect(attributeSkuUsageMessage("value", "Black", {
      count: 1,
      examples: ["SHIRT-BLK-M"],
    })).toBe(
      "Cannot delete the “Black” value because 1 SKU uses it (SHIRT-BLK-M). Reassign or delete the affected SKU variants first.",
    );
  });
});
````

### `DokanBDbackend/src/modules/attributes/product-attribute.service.ts`

Source lines: 334

````ts
import { In, type EntityManager } from "typeorm";

import { AppDataSource } from "../../database/data-source.js";
import { AppError } from "../../utils/app-error.js";
import { ProductType } from "../product-types/product-type.entity.js";
import { ProductVariant } from "../products/product-variant.entity.js";
import type {
  CreateProductAttributeInput,
  CreateProductAttributeValueInput,
  SetProductTypeAttributesInput,
  UpdateProductAttributeInput,
  UpdateProductAttributeValueInput,
} from "./product-attribute.schema.js";
import { ProductAttributeValue } from "./product-attribute-value.entity.js";
import { ProductAttribute } from "./product-attribute.entity.js";
import { ProductTypeAttribute } from "./product-type-attribute.entity.js";
import { ProductVariantAttributeValue } from "./product-variant-attribute-value.entity.js";

export interface VariantAttributeSelection {
  id: string;
  label: string;
  code: string;
  colorHex: string | null;
  attribute: {
    id: string;
    name: string;
    code: string;
    inputType: string;
  };
}

interface AttributeSkuUsage {
  count: number;
  examples: string[];
}

/** Build the administrator-facing reason used when a SKU protects an attribute or value. */
export function attributeSkuUsageMessage(kind: "attribute" | "value", name: string, usage: AttributeSkuUsage) {
  const exampleText = usage.examples.length ? ` (${usage.examples.join(", ")}${usage.count > usage.examples.length ? ", …" : ""})` : "";
  const subject = kind === "attribute" ? `the “${name}” attribute` : `the “${name}” value`;
  return `Cannot delete ${subject} because ${usage.count} SKU${usage.count === 1 ? "" : "s"} use${usage.count === 1 ? "s" : ""} it${exampleText}. Reassign or delete the affected SKU variants first.`;
}

function slug(value: string) {
  const code = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120).replace(/-+$/g, "");
  if (!code) throw new AppError(400, "ATTRIBUTE_CODE_REQUIRED", "Provide an English code when the name cannot form one.");
  return code;
}

function valueResponse(value: ProductAttributeValue) {
  return {
    id: value.id,
    attributeId: value.attributeId,
    label: value.label,
    code: value.code,
    colorHex: value.colorHex,
    sortOrder: value.sortOrder,
    isActive: value.isActive,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    deletedAt: value.deletedAt,
  };
}

function attributeResponse(attribute: ProductAttribute, values: ProductAttributeValue[] = []) {
  return {
    id: attribute.id,
    name: attribute.name,
    code: attribute.code,
    inputType: attribute.inputType,
    isActive: attribute.isActive,
    values: values.map(valueResponse),
    createdAt: attribute.createdAt,
    updatedAt: attribute.updatedAt,
    deletedAt: attribute.deletedAt,
  };
}

async function assertAttributeCodeAvailable(code: string, ignoredId?: string) {
  const query = AppDataSource.getRepository(ProductAttribute).createQueryBuilder("attribute").withDeleted().where("LOWER(attribute.code) = :code", { code: code.toLowerCase() });
  if (ignoredId) query.andWhere("attribute.id != :ignoredId", { ignoredId });
  if (await query.getOne()) throw new AppError(409, "ATTRIBUTE_CODE_EXISTS", "An attribute with this code already exists.");
}

async function assertValueCodeAvailable(attributeId: string, code: string, ignoredId?: string) {
  const query = AppDataSource.getRepository(ProductAttributeValue).createQueryBuilder("value").withDeleted().where("value.attributeId = :attributeId", { attributeId }).andWhere("LOWER(value.code) = :code", { code: code.toLowerCase() });
  if (ignoredId) query.andWhere("value.id != :ignoredId", { ignoredId });
  if (await query.getOne()) throw new AppError(409, "ATTRIBUTE_VALUE_CODE_EXISTS", "This attribute already has a value with that code.");
}

async function findAttributeSkuUsage(
  manager: EntityManager,
  filter: { attributeId: string } | { valueId: string },
): Promise<AttributeSkuUsage> {
  const baseQuery = manager
    .getRepository(ProductVariantAttributeValue)
    .createQueryBuilder("selection")
    .withDeleted()
    .innerJoin(ProductAttributeValue, "attributeValue", "attributeValue.id = selection.attributeValueId")
    .innerJoin(ProductVariant, "variant", "variant.id = selection.productVariantId");

  if ("valueId" in filter) {
    baseQuery.where("selection.attributeValueId = :valueId", { valueId: filter.valueId });
  } else {
    baseQuery.where("attributeValue.attributeId = :attributeId", { attributeId: filter.attributeId });
  }

  const [{ count = "0" } = {}, examples] = await Promise.all([
    baseQuery.clone().select("COUNT(DISTINCT selection.productVariantId)", "count").getRawOne<{ count: string }>(),
    baseQuery.clone().select("DISTINCT variant.sku", "sku").orderBy("variant.sku", "ASC").limit(3).getRawMany<{ sku: string }>(),
  ]);

  return { count: Number(count), examples: examples.map(({ sku }) => sku) };
}

export async function listProductAttributes(includeDeleted: boolean) {
  const [attributes, values] = await Promise.all([
    AppDataSource.getRepository(ProductAttribute).find({ withDeleted: includeDeleted, order: { name: "ASC" } }),
    AppDataSource.getRepository(ProductAttributeValue).find({ withDeleted: includeDeleted, order: { sortOrder: "ASC", label: "ASC" } }),
  ]);
  return attributes.map((attribute) => attributeResponse(attribute, values.filter((value) => value.attributeId === attribute.id)));
}

export async function createProductAttribute(input: CreateProductAttributeInput) {
  const code = input.code ?? slug(input.name);
  await assertAttributeCodeAvailable(code);
  const preparedValues = (input.values ?? []).map((label, sortOrder) => ({ label, code: slug(label), sortOrder }));
  const valueCodes = new Set<string>();
  for (const value of preparedValues) {
    if (valueCodes.has(value.code)) {
      throw new AppError(409, "ATTRIBUTE_VALUE_CODE_EXISTS", "Two values produce the same attribute code.");
    }
    valueCodes.add(value.code);
  }

  return AppDataSource.transaction(async (manager) => {
    const attributeRepository = manager.getRepository(ProductAttribute);
    const attribute = await attributeRepository.save(attributeRepository.create({
      name: input.name,
      code,
      inputType: input.inputType,
      isActive: input.isActive ?? true,
    }));
    const valueRepository = manager.getRepository(ProductAttributeValue);
    const values = preparedValues.length
      ? await valueRepository.save(preparedValues.map((value) => valueRepository.create({
        attributeId: attribute.id,
        label: value.label,
        code: value.code,
        colorHex: null,
        sortOrder: value.sortOrder,
        isActive: true,
      })))
      : [];
    return attributeResponse(attribute, values);
  });
}

export async function updateProductAttribute(id: string, input: UpdateProductAttributeInput) {
  const repository = AppDataSource.getRepository(ProductAttribute);
  const attribute = await repository.findOneBy({ id });
  if (!attribute) throw new AppError(404, "ATTRIBUTE_NOT_FOUND", "Product attribute not found.");
  if (input.code !== undefined) { await assertAttributeCodeAvailable(input.code, id); attribute.code = input.code; }
  if (input.name !== undefined) attribute.name = input.name;
  if (input.inputType !== undefined) attribute.inputType = input.inputType;
  if (input.isActive !== undefined) attribute.isActive = input.isActive;
  await repository.save(attribute);
  const values = await AppDataSource.getRepository(ProductAttributeValue).find({ where: { attributeId: id }, order: { sortOrder: "ASC", label: "ASC" } });
  return attributeResponse(attribute, values);
}

export async function deleteProductAttribute(id: string) {
  const repository = AppDataSource.getRepository(ProductAttribute);
  const attribute = await repository.findOneBy({ id });
  if (!attribute) throw new AppError(404, "ATTRIBUTE_NOT_FOUND", "Product attribute not found.");
  await AppDataSource.transaction(async (manager) => {
    const usage = await findAttributeSkuUsage(manager, { attributeId: id });
    if (usage.count > 0) {
      throw new AppError(409, "ATTRIBUTE_IN_USE", attributeSkuUsageMessage("attribute", attribute.name, usage));
    }
    await manager.getRepository(ProductTypeAttribute).delete({ attributeId: id });
    await manager.getRepository(ProductAttribute).softRemove(attribute);
  });
}

export async function restoreProductAttribute(id: string) {
  const repository = AppDataSource.getRepository(ProductAttribute);
  const attribute = await repository.findOne({ where: { id }, withDeleted: true });
  if (!attribute) throw new AppError(404, "ATTRIBUTE_NOT_FOUND", "Product attribute not found.");
  if (!attribute.deletedAt) throw new AppError(409, "ATTRIBUTE_NOT_DELETED", "This attribute is not deleted.");
  await repository.restore(id);
  attribute.deletedAt = null;
  return attributeResponse(attribute);
}

export async function createProductAttributeValue(attributeId: string, input: CreateProductAttributeValueInput) {
  const attribute = await AppDataSource.getRepository(ProductAttribute).findOneBy({ id: attributeId });
  if (!attribute) throw new AppError(404, "ATTRIBUTE_NOT_FOUND", "Product attribute not found.");
  const code = input.code ?? slug(input.label);
  await assertValueCodeAvailable(attributeId, code);
  const repository = AppDataSource.getRepository(ProductAttributeValue);
  const value = await repository.save(repository.create({ attributeId, label: input.label, code, colorHex: input.colorHex ?? null, sortOrder: input.sortOrder ?? 0, isActive: input.isActive ?? true }));
  return valueResponse(value);
}

export async function updateProductAttributeValue(attributeId: string, valueId: string, input: UpdateProductAttributeValueInput) {
  const repository = AppDataSource.getRepository(ProductAttributeValue);
  const value = await repository.findOneBy({ id: valueId, attributeId });
  if (!value) throw new AppError(404, "ATTRIBUTE_VALUE_NOT_FOUND", "Attribute value not found.");
  if (input.code !== undefined) { await assertValueCodeAvailable(attributeId, input.code, valueId); value.code = input.code; }
  if (input.label !== undefined) value.label = input.label;
  if (input.colorHex !== undefined) value.colorHex = input.colorHex;
  if (input.sortOrder !== undefined) value.sortOrder = input.sortOrder;
  if (input.isActive !== undefined) value.isActive = input.isActive;
  await repository.save(value);
  return valueResponse(value);
}

export async function deleteProductAttributeValue(attributeId: string, valueId: string) {
  const repository = AppDataSource.getRepository(ProductAttributeValue);
  const value = await repository.findOneBy({ id: valueId, attributeId });
  if (!value) throw new AppError(404, "ATTRIBUTE_VALUE_NOT_FOUND", "Attribute value not found.");
  await AppDataSource.transaction(async (manager) => {
    const usage = await findAttributeSkuUsage(manager, { valueId });
    if (usage.count > 0) {
      throw new AppError(409, "ATTRIBUTE_VALUE_IN_USE", attributeSkuUsageMessage("value", value.label, usage));
    }
    await manager.getRepository(ProductAttributeValue).softRemove(value);
  });
}

export async function restoreProductAttributeValue(attributeId: string, valueId: string) {
  const repository = AppDataSource.getRepository(ProductAttributeValue);
  const value = await repository.findOne({ where: { id: valueId, attributeId }, withDeleted: true });
  if (!value) throw new AppError(404, "ATTRIBUTE_VALUE_NOT_FOUND", "Attribute value not found.");
  if (!value.deletedAt) throw new AppError(409, "ATTRIBUTE_VALUE_NOT_DELETED", "This attribute value is not deleted.");
  await repository.restore(valueId);
  value.deletedAt = null;
  return valueResponse(value);
}

export async function getProductTypeAttributes(productTypeId: string) {
  const productType = await AppDataSource.getRepository(ProductType).findOneBy({ id: productTypeId });
  if (!productType) throw new AppError(404, "PRODUCT_TYPE_NOT_FOUND", "Product type not found.");
  const assignments = await AppDataSource.getRepository(ProductTypeAttribute).find({ where: { productTypeId }, relations: { attribute: true }, order: { sortOrder: "ASC" } });
  const valueRows = assignments.length ? await AppDataSource.getRepository(ProductAttributeValue).find({ where: { attributeId: In(assignments.map((item) => item.attributeId)), isActive: true }, order: { sortOrder: "ASC", label: "ASC" } }) : [];
  return assignments.map((assignment) => ({
    attributeId: assignment.attributeId,
    isRequired: assignment.isRequired,
    sortOrder: assignment.sortOrder,
    attribute: attributeResponse(assignment.attribute, valueRows.filter((value) => value.attributeId === assignment.attributeId)),
  }));
}

export async function setProductTypeAttributes(productTypeId: string, input: SetProductTypeAttributesInput) {
  const productType = await AppDataSource.getRepository(ProductType).findOneBy({ id: productTypeId });
  if (!productType) throw new AppError(404, "PRODUCT_TYPE_NOT_FOUND", "Product type not found.");
  if (input.attributes.length) {
    const attributes = await AppDataSource.getRepository(ProductAttribute).findBy({ id: In(input.attributes.map((item) => item.attributeId)) });
    if (attributes.length !== input.attributes.length) throw new AppError(400, "ATTRIBUTE_INVALID", "One or more selected attributes do not exist or are deleted.");
  }
  await AppDataSource.transaction(async (manager) => {
    const repository = manager.getRepository(ProductTypeAttribute);
    await repository.delete({ productTypeId });
    if (input.attributes.length) await repository.save(input.attributes.map((item, index) => repository.create({ productTypeId, attributeId: item.attributeId, isRequired: item.isRequired ?? false, sortOrder: item.sortOrder ?? index })));
  });
  return getProductTypeAttributes(productTypeId);
}

export async function loadVariantAttributeSelections(variantIds: string[], manager: EntityManager = AppDataSource.manager) {
  const result = new Map<string, VariantAttributeSelection[]>();
  if (!variantIds.length) return result;
  const rows = await manager
    .getRepository(ProductVariantAttributeValue)
    .createQueryBuilder("selection")
    .innerJoinAndSelect("selection.attributeValue", "attributeValue")
    .innerJoinAndSelect("attributeValue.attribute", "attribute")
    .innerJoin("selection.productVariant", "variant")
    .innerJoin("variant.product", "product")
    .leftJoin(
      ProductTypeAttribute,
      "assignment",
      "assignment.productTypeId = product.productTypeId AND assignment.attributeId = attribute.id",
    )
    .where("selection.productVariantId IN (:...variantIds)", { variantIds })
    .withDeleted()
    .orderBy("variant.id", "ASC")
    .addOrderBy("assignment.sortOrder", "ASC")
    .addOrderBy("attribute.id", "ASC")
    .addOrderBy("attributeValue.sortOrder", "ASC")
    .getMany();
  for (const row of rows) {
    const value = row.attributeValue;
    const group = result.get(row.productVariantId) ?? [];
    group.push({ id: value.id, label: value.label, code: value.code, colorHex: value.colorHex, attribute: { id: value.attribute.id, name: value.attribute.name, code: value.attribute.code, inputType: value.attribute.inputType } });
    result.set(row.productVariantId, group);
  }
  return result;
}

export async function validateVariantOptionValues(manager: EntityManager, productTypeId: string, valueIds: string[]) {
  const distinctIds = [...new Set(valueIds)];
  if (distinctIds.length !== valueIds.length) throw new AppError(400, "VARIANT_OPTION_DUPLICATE", "A variant cannot contain the same option value more than once.");
  const assignments = await manager.getRepository(ProductTypeAttribute).find({ where: { productTypeId } });
  const values = distinctIds.length ? await manager.getRepository(ProductAttributeValue).find({ where: { id: In(distinctIds), isActive: true }, relations: { attribute: true } }) : [];
  if (values.length !== distinctIds.length) throw new AppError(400, "VARIANT_OPTION_INVALID", "One or more option values do not exist or are inactive.");
  const allowed = new Set(assignments.map((item) => item.attributeId));
  const chosen = new Set<string>();
  for (const value of values) {
    if (!allowed.has(value.attributeId)) throw new AppError(400, "VARIANT_OPTION_NOT_ASSIGNED", `${value.attribute.name} is not assigned to this product type.`);
    if (chosen.has(value.attributeId)) throw new AppError(400, "VARIANT_OPTION_ATTRIBUTE_DUPLICATE", `Choose only one ${value.attribute.name} value per variant.`);
    chosen.add(value.attributeId);
  }
  const missing = assignments.find((item) => item.isRequired && !chosen.has(item.attributeId));
  if (missing) throw new AppError(400, "VARIANT_REQUIRED_OPTION_MISSING", "A required product option is missing.");
  return values.map((value) => ({ id: value.id, label: value.label, code: value.code, colorHex: value.colorHex, attribute: { id: value.attribute.id, name: value.attribute.name, code: value.attribute.code, inputType: value.attribute.inputType } }));
}

export async function assertVariantCombinationAvailable(manager: EntityManager, productId: string, valueIds: string[], ignoredVariantId?: string) {
  if (!valueIds.length) return;
  const variants = await manager.getRepository(ProductVariant).find({ where: { productId } });
  const candidates = variants.filter((variant) => variant.id !== ignoredVariantId);
  const selections = await loadVariantAttributeSelections(candidates.map((variant) => variant.id), manager);
  const signature = [...valueIds].sort().join(":");
  if (candidates.some((variant) => (selections.get(variant.id) ?? []).map((value) => value.id).sort().join(":") === signature)) {
    throw new AppError(409, "VARIANT_COMBINATION_EXISTS", "This product already has a variant with the same option combination.");
  }
}

export async function replaceVariantAttributeValues(manager: EntityManager, variantId: string, valueIds: string[]) {
  const repository = manager.getRepository(ProductVariantAttributeValue);
  await repository.delete({ productVariantId: variantId });
  if (valueIds.length) await repository.save(valueIds.map((attributeValueId) => repository.create({ productVariantId: variantId, attributeValueId })));
}
````

### `DokanBDbackend/src/modules/attributes/product-type-attribute.entity.ts`

Source lines: 27

````ts
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";

import { ProductType } from "../product-types/product-type.entity.js";
import { ProductAttribute } from "./product-attribute.entity.js";

@Entity({ name: "product_type_attributes" })
export class ProductTypeAttribute {
  @PrimaryColumn({ name: "product_type_id", type: "bigint", unsigned: true })
  productTypeId!: string;

  @PrimaryColumn({ name: "attribute_id", type: "bigint", unsigned: true })
  attributeId!: string;

  @ManyToOne(() => ProductType, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "product_type_id" })
  productType!: ProductType;

  @ManyToOne(() => ProductAttribute, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "attribute_id" })
  attribute!: ProductAttribute;

  @Column({ name: "is_required", type: "boolean", default: false })
  isRequired!: boolean;

  @Column({ name: "sort_order", type: "int", default: 0 })
  sortOrder!: number;
}
````

### `DokanBDbackend/src/modules/attributes/product-variant-attribute-value.entity.ts`

Source lines: 21

````ts
import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";

import { ProductVariant } from "../products/product-variant.entity.js";
import { ProductAttributeValue } from "./product-attribute-value.entity.js";

@Entity({ name: "product_variant_attribute_values" })
export class ProductVariantAttributeValue {
  @PrimaryColumn({ name: "product_variant_id", type: "bigint", unsigned: true })
  productVariantId!: string;

  @PrimaryColumn({ name: "attribute_value_id", type: "bigint", unsigned: true })
  attributeValueId!: string;

  @ManyToOne(() => ProductVariant, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "product_variant_id" })
  productVariant!: ProductVariant;

  @ManyToOne(() => ProductAttributeValue, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "attribute_value_id" })
  attributeValue!: ProductAttributeValue;
}
````

## Inventory and entity dependencies

Shows stock audit records and the optional vendor relation referenced by product variants.

### `DokanBDbackend/src/modules/inventory/inventory-movement.entity.ts`

Source lines: 55

````ts
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
````

### `DokanBDbackend/src/modules/vendors/vendor.entity.ts`

Source lines: 43

````ts
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
````

## Product-related database migrations

Shows the exact SQL-oriented schema history for catalog records, types, attributes, variants, pricing, media, dimensions, and hierarchy relationships.

### `DokanBDbackend/src/database/migrations/1791108013191-InitialSchema.ts`

Source lines: 626

````ts
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
````

### `DokanBDbackend/src/database/migrations/1791270000000-AdminCatalogManagement.ts`

Source lines: 24

````ts
import type { MigrationInterface, QueryRunner } from "typeorm";

export class AdminCatalogManagement1791270000000 implements MigrationInterface {
  name = "AdminCatalogManagement1791270000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE `categories` ADD `show_on_homepage` tinyint NOT NULL DEFAULT 0 AFTER `sort_order`",
    );
    await queryRunner.query(
      "UPDATE `categories` SET `show_on_homepage` = 1 WHERE `is_active` = 1 AND `deleted_at` IS NULL",
    );
    await queryRunner.query(
      "ALTER TABLE `brands` ADD `deleted_at` datetime NULL AFTER `updated_at`",
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("ALTER TABLE `brands` DROP COLUMN `deleted_at`");
    await queryRunner.query(
      "ALTER TABLE `categories` DROP COLUMN `show_on_homepage`",
    );
  }
}
````

### `DokanBDbackend/src/database/migrations/1791271000000-ProductTypeManagement.ts`

Source lines: 13

````ts
import type { MigrationInterface, QueryRunner } from "typeorm";

export class ProductTypeManagement1791271000000 implements MigrationInterface {
  name = "ProductTypeManagement1791271000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("ALTER TABLE `product_types` ADD `deleted_at` datetime NULL AFTER `updated_at`");
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("ALTER TABLE `product_types` DROP COLUMN `deleted_at`");
  }
}
````

### `DokanBDbackend/src/database/migrations/1791620000000-ProductAttributesAndVariants.ts`

Source lines: 103

````ts
import type { MigrationInterface, QueryRunner } from "typeorm";

export class ProductAttributesAndVariants1791620000000 implements MigrationInterface {
  name = "ProductAttributesAndVariants1791620000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`catalog_attributes\` (
        \`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
        \`name\` varchar(100) NOT NULL,
        \`code\` varchar(120) NOT NULL,
        \`input_type\` varchar(20) NOT NULL DEFAULT 'SELECT',
        \`is_active\` tinyint NOT NULL DEFAULT 1,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`deleted_at\` datetime NULL,
        UNIQUE INDEX \`UQ_catalog_attributes_code\` (\`code\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);
    await queryRunner.query(`
      CREATE TABLE \`catalog_attribute_values\` (
        \`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
        \`attribute_id\` bigint UNSIGNED NOT NULL,
        \`label\` varchar(100) NOT NULL,
        \`code\` varchar(120) NOT NULL,
        \`color_hex\` varchar(7) NULL,
        \`sort_order\` int NOT NULL DEFAULT 0,
        \`is_active\` tinyint NOT NULL DEFAULT 1,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`deleted_at\` datetime NULL,
        UNIQUE INDEX \`UQ_catalog_attribute_value_code\` (\`attribute_id\`, \`code\`),
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_attribute_value_attribute\` FOREIGN KEY (\`attribute_id\`) REFERENCES \`catalog_attributes\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);
    await queryRunner.query(`
      CREATE TABLE \`product_type_attributes\` (
        \`product_type_id\` bigint UNSIGNED NOT NULL,
        \`attribute_id\` bigint UNSIGNED NOT NULL,
        \`is_required\` tinyint NOT NULL DEFAULT 0,
        \`sort_order\` int NOT NULL DEFAULT 0,
        PRIMARY KEY (\`product_type_id\`, \`attribute_id\`),
        CONSTRAINT \`FK_type_attribute_type\` FOREIGN KEY (\`product_type_id\`) REFERENCES \`product_types\`(\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_type_attribute_attribute\` FOREIGN KEY (\`attribute_id\`) REFERENCES \`catalog_attributes\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);
    await queryRunner.query(`
      CREATE TABLE \`product_variant_attribute_values\` (
        \`product_variant_id\` bigint UNSIGNED NOT NULL,
        \`attribute_value_id\` bigint UNSIGNED NOT NULL,
        PRIMARY KEY (\`product_variant_id\`, \`attribute_value_id\`),
        CONSTRAINT \`FK_variant_attribute_variant\` FOREIGN KEY (\`product_variant_id\`) REFERENCES \`product_variants\`(\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_variant_attribute_value\` FOREIGN KEY (\`attribute_value_id\`) REFERENCES \`catalog_attribute_values\`(\`id\`) ON DELETE RESTRICT
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`INSERT INTO \`catalog_attributes\` (\`name\`, \`code\`, \`input_type\`) SELECT 'Color', 'color', 'COLOR' WHERE EXISTS (SELECT 1 FROM \`product_variants\` WHERE \`color\` IS NOT NULL AND TRIM(\`color\`) != '')`);
    await queryRunner.query(`INSERT INTO \`catalog_attributes\` (\`name\`, \`code\`, \`input_type\`) SELECT 'Size', 'size', 'SELECT' WHERE EXISTS (SELECT 1 FROM \`product_variants\` WHERE \`size\` IS NOT NULL AND TRIM(\`size\`) != '')`);
    await queryRunner.query(`
      INSERT IGNORE INTO \`catalog_attribute_values\` (\`attribute_id\`, \`label\`, \`code\`)
      SELECT a.id, MIN(TRIM(v.color)), LOWER(REPLACE(TRIM(v.color), ' ', '-'))
      FROM \`product_variants\` v JOIN \`catalog_attributes\` a ON a.code = 'color'
      WHERE v.color IS NOT NULL AND TRIM(v.color) != ''
      GROUP BY a.id, LOWER(REPLACE(TRIM(v.color), ' ', '-'))
    `);
    await queryRunner.query(`
      INSERT IGNORE INTO \`catalog_attribute_values\` (\`attribute_id\`, \`label\`, \`code\`)
      SELECT a.id, MIN(TRIM(v.size)), LOWER(REPLACE(TRIM(v.size), ' ', '-'))
      FROM \`product_variants\` v JOIN \`catalog_attributes\` a ON a.code = 'size'
      WHERE v.size IS NOT NULL AND TRIM(v.size) != ''
      GROUP BY a.id, LOWER(REPLACE(TRIM(v.size), ' ', '-'))
    `);
    await queryRunner.query(`
      INSERT IGNORE INTO \`product_type_attributes\` (\`product_type_id\`, \`attribute_id\`, \`is_required\`, \`sort_order\`)
      SELECT DISTINCT p.product_type_id, a.id, 0, CASE WHEN a.code = 'color' THEN 0 ELSE 1 END
      FROM \`products\` p JOIN \`product_variants\` v ON v.product_id = p.id
      JOIN \`catalog_attributes\` a ON (a.code = 'color' AND v.color IS NOT NULL AND TRIM(v.color) != '') OR (a.code = 'size' AND v.size IS NOT NULL AND TRIM(v.size) != '')
    `);
    await queryRunner.query(`
      INSERT IGNORE INTO \`product_variant_attribute_values\` (\`product_variant_id\`, \`attribute_value_id\`)
      SELECT v.id, av.id FROM \`product_variants\` v
      JOIN \`catalog_attributes\` a ON a.code = 'color'
      JOIN \`catalog_attribute_values\` av ON av.attribute_id = a.id AND LOWER(av.label) = LOWER(TRIM(v.color))
      WHERE v.color IS NOT NULL AND TRIM(v.color) != ''
    `);
    await queryRunner.query(`
      INSERT IGNORE INTO \`product_variant_attribute_values\` (\`product_variant_id\`, \`attribute_value_id\`)
      SELECT v.id, av.id FROM \`product_variants\` v
      JOIN \`catalog_attributes\` a ON a.code = 'size'
      JOIN \`catalog_attribute_values\` av ON av.attribute_id = a.id AND LOWER(av.label) = LOWER(TRIM(v.size))
      WHERE v.size IS NOT NULL AND TRIM(v.size) != ''
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TABLE `product_variant_attribute_values`");
    await queryRunner.query("DROP TABLE `product_type_attributes`");
    await queryRunner.query("DROP TABLE `catalog_attribute_values`");
    await queryRunner.query("DROP TABLE `catalog_attributes`");
  }
}
````

### `DokanBDbackend/src/database/migrations/1791790000000-ProductWorkbenchPricing.ts`

Source lines: 40

````ts
import type { MigrationInterface, QueryRunner } from "typeorm";

export class ProductWorkbenchPricing1791790000000 implements MigrationInterface {
  name = "ProductWorkbenchPricing1791790000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("ALTER TABLE `products` ADD `discount_starts_at` datetime NULL");
    await queryRunner.query("ALTER TABLE `products` ADD `discount_ends_at` datetime NULL");
    await queryRunner.query("ALTER TABLE `product_variants` ADD `discount_price` decimal(12,2) NULL");
    await queryRunner.query("ALTER TABLE `product_variants` ADD `discount_starts_at` datetime NULL");
    await queryRunner.query("ALTER TABLE `product_variants` ADD `discount_ends_at` datetime NULL");
    await queryRunner.query(`
      CREATE TABLE \`product_price_tiers\` (
        \`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
        \`product_id\` bigint UNSIGNED NOT NULL,
        \`variant_id\` bigint UNSIGNED NULL,
        \`minimum_quantity\` int UNSIGNED NOT NULL,
        \`unit_price\` decimal(12,2) NOT NULL,
        \`is_promotion\` tinyint NOT NULL DEFAULT 0,
        \`is_active\` tinyint NOT NULL DEFAULT 1,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        INDEX \`IDX_price_tier_product\` (\`product_id\`),
        INDEX \`IDX_price_tier_variant\` (\`variant_id\`),
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_price_tier_product\` FOREIGN KEY (\`product_id\`) REFERENCES \`products\`(\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_price_tier_variant\` FOREIGN KEY (\`variant_id\`) REFERENCES \`product_variants\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TABLE `product_price_tiers`");
    await queryRunner.query("ALTER TABLE `product_variants` DROP COLUMN `discount_ends_at`");
    await queryRunner.query("ALTER TABLE `product_variants` DROP COLUMN `discount_starts_at`");
    await queryRunner.query("ALTER TABLE `product_variants` DROP COLUMN `discount_price`");
    await queryRunner.query("ALTER TABLE `products` DROP COLUMN `discount_ends_at`");
    await queryRunner.query("ALTER TABLE `products` DROP COLUMN `discount_starts_at`");
  }
}
````

### `DokanBDbackend/src/database/migrations/1791791000000-ProductVariantDimensions.ts`

Source lines: 29

````ts
import type { MigrationInterface, QueryRunner } from "typeorm";

export class ProductVariantDimensions1791791000000 implements MigrationInterface {
  name = "ProductVariantDimensions1791791000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE `product_variants` ADD `length_cm` decimal(10,2) NULL",
    );
    await queryRunner.query(
      "ALTER TABLE `product_variants` ADD `width_cm` decimal(10,2) NULL",
    );
    await queryRunner.query(
      "ALTER TABLE `product_variants` ADD `height_cm` decimal(10,2) NULL",
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE `product_variants` DROP COLUMN `height_cm`",
    );
    await queryRunner.query(
      "ALTER TABLE `product_variants` DROP COLUMN `width_cm`",
    );
    await queryRunner.query(
      "ALTER TABLE `product_variants` DROP COLUMN `length_cm`",
    );
  }
}
````

### `DokanBDbackend/src/database/migrations/1791870000000-CatalogRelationshipAssignments.ts`

Source lines: 59

````ts
import type { MigrationInterface, QueryRunner } from "typeorm";

export class CatalogRelationshipAssignments1791870000000 implements MigrationInterface {
  name = "CatalogRelationshipAssignments1791870000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE `product_types` ADD `brand_mode` varchar(20) NOT NULL DEFAULT 'ALL'",
    );
    await queryRunner.query(`
      CREATE TABLE \`category_product_types\` (
        \`category_id\` bigint UNSIGNED NOT NULL,
        \`product_type_id\` bigint UNSIGNED NOT NULL,
        \`sort_order\` int NOT NULL DEFAULT 0,
        INDEX \`IDX_category_product_types_type\` (\`product_type_id\`),
        PRIMARY KEY (\`category_id\`, \`product_type_id\`),
        CONSTRAINT \`FK_category_product_types_category\` FOREIGN KEY (\`category_id\`) REFERENCES \`categories\`(\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_category_product_types_type\` FOREIGN KEY (\`product_type_id\`) REFERENCES \`product_types\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);
    await queryRunner.query(`
      CREATE TABLE \`product_type_brands\` (
        \`product_type_id\` bigint UNSIGNED NOT NULL,
        \`brand_id\` bigint UNSIGNED NOT NULL,
        INDEX \`IDX_product_type_brands_brand\` (\`brand_id\`),
        PRIMARY KEY (\`product_type_id\`, \`brand_id\`),
        CONSTRAINT \`FK_product_type_brands_type\` FOREIGN KEY (\`product_type_id\`) REFERENCES \`product_types\`(\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_product_type_brands_brand\` FOREIGN KEY (\`brand_id\`) REFERENCES \`brands\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);

    // Preserve every category/type pair already used by a product.
    await queryRunner.query(`
      INSERT IGNORE INTO \`category_product_types\` (\`category_id\`, \`product_type_id\`, \`sort_order\`)
      SELECT DISTINCT \`category_id\`, \`product_type_id\`, 0
      FROM \`products\`
    `);

    // Categories without products start permissively so existing admin flows do not become empty.
    await queryRunner.query(`
      INSERT IGNORE INTO \`category_product_types\` (\`category_id\`, \`product_type_id\`, \`sort_order\`)
      SELECT category_row.id, type_row.id, 0
      FROM \`categories\` category_row
      CROSS JOIN \`product_types\` type_row
      WHERE category_row.deleted_at IS NULL
        AND type_row.deleted_at IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM \`category_product_types\` existing
          WHERE existing.category_id = category_row.id
        )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TABLE `product_type_brands`");
    await queryRunner.query("DROP TABLE `category_product_types`");
    await queryRunner.query("ALTER TABLE `product_types` DROP COLUMN `brand_mode`");
  }
}
````

### `DokanBDbackend/src/database/migrations/1792040000000-CategoryHierarchyAndGlobalBrands.ts`

Source lines: 50

````ts
import type { MigrationInterface, QueryRunner } from "typeorm";

export class CategoryHierarchyAndGlobalBrands1792040000000
  implements MigrationInterface
{
  name = "CategoryHierarchyAndGlobalBrands1792040000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE `categories` ADD `allow_products` tinyint NOT NULL DEFAULT 1",
    );

    // Existing parent-only categories become grouping nodes, while categories
    // that already own products remain assignable and keep working unchanged.
    await queryRunner.query(`
      UPDATE categories category_row
      INNER JOIN (
        SELECT DISTINCT parent_id
        FROM categories
        WHERE parent_id IS NOT NULL AND deleted_at IS NULL
      ) child_rows ON child_rows.parent_id = category_row.id
      LEFT JOIN (
        SELECT DISTINCT category_id
        FROM products
      ) product_rows ON product_rows.category_id = category_row.id
      SET category_row.allow_products = 0
      WHERE product_rows.category_id IS NULL
    `);

    await queryRunner.query("DROP TABLE `product_type_brands`");
    await queryRunner.query("ALTER TABLE `product_types` DROP COLUMN `brand_mode`");
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE `product_types` ADD `brand_mode` varchar(20) NOT NULL DEFAULT 'ALL'",
    );
    await queryRunner.query(`
      CREATE TABLE product_type_brands (
        product_type_id bigint UNSIGNED NOT NULL,
        brand_id bigint UNSIGNED NOT NULL,
        INDEX IDX_product_type_brands_brand (brand_id),
        PRIMARY KEY (product_type_id, brand_id),
        CONSTRAINT FK_product_type_brands_type FOREIGN KEY (product_type_id) REFERENCES product_types(id) ON DELETE CASCADE,
        CONSTRAINT FK_product_type_brands_brand FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);
    await queryRunner.query("ALTER TABLE `categories` DROP COLUMN `allow_products`");
  }
}
````

## Swagger / OpenAPI contract

Contains the Swagger definitions used by /api-docs and /api-docs.json, including product media, variants, pricing, and catalog administration.

### `DokanBDbackend/src/docs/openapi.ts`

Source lines: 2573

````ts
type HttpMethod = "get" | "post" | "put" | "patch" | "delete";
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
    path: "/admin/categories/{id}/product-types",
    tag: "Admin categories",
    summary: "List product types allowed for a category",
    auth: true,
    admin: true,
    parameters: [idParameter("id", "Category ID")],
    responseSchema: "CategoryProductTypeAssignmentResponse",
    notFound: true,
  },
  {
    method: "put",
    path: "/admin/categories/{id}/product-types",
    tag: "Admin categories",
    summary: "Replace product types allowed for a category",
    description: "An assigned type cannot be removed while a product in this category still uses it.",
    auth: true,
    admin: true,
    parameters: [idParameter("id", "Category ID")],
    body: "SetCategoryProductTypesRequest",
    responseSchema: "CategoryProductTypeAssignmentResponse",
    notFound: true,
    conflict: true,
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
    method: "get", path: "/admin/attributes", tag: "Admin product attributes",
    summary: "List reusable product attributes and their values", auth: true, admin: true,
    parameters: [queryParameter("includeDeleted", { type: "boolean", default: false })],
    responseSchema: "AdminAttributeListResponse",
  },
  {
    method: "post", path: "/admin/attributes", tag: "Admin product attributes",
    summary: "Create a reusable product attribute", auth: true, admin: true,
    body: "AttributeRequest", success: "201", responseSchema: "AdminAttributeResponse", conflict: true,
  },
  {
    method: "patch", path: "/admin/attributes/{id}", tag: "Admin product attributes",
    summary: "Update a product attribute", auth: true, admin: true,
    parameters: [idParameter("id", "Attribute ID")], body: "UpdateAttributeRequest",
    responseSchema: "AdminAttributeResponse", notFound: true, conflict: true,
  },
  {
    method: "delete", path: "/admin/attributes/{id}", tag: "Admin product attributes",
    summary: "Soft-delete a product attribute", auth: true, admin: true,
    description: "Allowed only when no SKU variant uses any value belonging to the attribute.",
    parameters: [idParameter("id", "Attribute ID")], success: "204", notFound: true, conflict: true,
  },
  {
    method: "post", path: "/admin/attributes/{id}/restore", tag: "Admin product attributes",
    summary: "Restore a product attribute", auth: true, admin: true,
    parameters: [idParameter("id", "Attribute ID")], responseSchema: "AdminAttributeResponse", notFound: true, conflict: true,
  },
  {
    method: "post", path: "/admin/attributes/{id}/values", tag: "Admin product attributes",
    summary: "Add a value to a product attribute", auth: true, admin: true,
    parameters: [idParameter("id", "Attribute ID")], body: "AttributeValueRequest", success: "201",
    responseSchema: "AdminAttributeValueResponse", notFound: true, conflict: true,
  },
  {
    method: "patch", path: "/admin/attributes/{id}/values/{valueId}", tag: "Admin product attributes",
    summary: "Update an attribute value", auth: true, admin: true,
    parameters: [idParameter("id", "Attribute ID"), idParameter("valueId", "Attribute value ID")],
    body: "UpdateAttributeValueRequest", responseSchema: "AdminAttributeValueResponse", notFound: true, conflict: true,
  },
  {
    method: "delete", path: "/admin/attributes/{id}/values/{valueId}", tag: "Admin product attributes",
    summary: "Soft-delete an attribute value", auth: true, admin: true,
    description: "Allowed only when no SKU variant uses this attribute value.",
    parameters: [idParameter("id", "Attribute ID"), idParameter("valueId", "Attribute value ID")],
    success: "204", notFound: true, conflict: true,
  },
  {
    method: "post", path: "/admin/attributes/{id}/values/{valueId}/restore", tag: "Admin product attributes",
    summary: "Restore an attribute value", auth: true, admin: true,
    parameters: [idParameter("id", "Attribute ID"), idParameter("valueId", "Attribute value ID")],
    responseSchema: "AdminAttributeValueResponse", notFound: true, conflict: true,
  },
  {
    method: "get", path: "/admin/product-types/{productTypeId}/attributes", tag: "Admin product attributes",
    summary: "List attributes assigned to a product type", auth: true, admin: true,
    parameters: [idParameter("productTypeId", "Product type ID")], responseSchema: "ProductTypeAttributeListResponse", notFound: true,
  },
  {
    method: "put", path: "/admin/product-types/{productTypeId}/attributes", tag: "Admin product attributes",
    summary: "Replace the attributes assigned to a product type", auth: true, admin: true,
    parameters: [idParameter("productTypeId", "Product type ID")], body: "SetProductTypeAttributesRequest",
    responseSchema: "ProductTypeAttributeListResponse", notFound: true,
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
    method: "put",
    path: "/admin/products/{id}/price-tiers",
    tag: "Admin products",
    summary: "Replace product and variant quantity price blocks",
    description:
      "Replaces every quantity tier for the product. Use variantId null for all variants or an exact variant ID for an individual price block.",
    auth: true,
    admin: true,
    parameters: [idParameter("id", "Product ID")],
    body: "ReplaceProductPriceTiersRequest",
    responseSchema: "ProductPriceTierListResponse",
    notFound: true,
    conflict: true,
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
    method: "post",
    path: "/admin/products/{productId}/variants/bulk",
    tag: "Admin products",
    summary: "Create multiple option combinations in one transaction",
    auth: true,
    admin: true,
    parameters: [idParameter("productId", "Product ID")],
    body: "BulkProductVariantRequest",
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
    description: "The variant stock must be zero before it can be removed.",
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
    summary: "Upload up to four shared or variant media items",
    description:
      "Accepts JPEG, PNG and WebP images up to the configured image limit, plus MP4 and WebM videos up to the configured video limit. A product may have four shared media items and each variant may have four of its own.",
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
    path: "/admin/coupons",
    tag: "Admin coupons",
    summary: "List coupons and usage",
    auth: true,
    admin: true,
    parameters: [queryParameter("includeDeleted", { type: "boolean", default: false })],
    responseSchema: "AdminCouponListResponse",
  },
  {
    method: "post", path: "/admin/coupons", tag: "Admin coupons", summary: "Create a coupon",
    auth: true, admin: true, body: "CouponRequest", success: "201", responseSchema: "AdminCouponResponse", conflict: true,
  },
  {
    method: "patch", path: "/admin/coupons/{id}", tag: "Admin coupons", summary: "Update a coupon",
    auth: true, admin: true, parameters: [idParameter("id", "Coupon ID")], body: "UpdateCouponRequest", responseSchema: "AdminCouponResponse", notFound: true, conflict: true,
  },
  {
    method: "delete", path: "/admin/coupons/{id}", tag: "Admin coupons", summary: "Archive a coupon",
    auth: true, admin: true, parameters: [idParameter("id", "Coupon ID")], success: "204", notFound: true,
  },
  {
    method: "post", path: "/admin/coupons/{id}/restore", tag: "Admin coupons", summary: "Restore an archived coupon",
    auth: true, admin: true, parameters: [idParameter("id", "Coupon ID")], responseSchema: "AdminCouponResponse", notFound: true, conflict: true,
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
      queryParameter("couponCode", { type: "string", minLength: 3, maxLength: 40 }, "Optional coupon code"),
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
    path: "/admin/dashboard",
    tag: "Admin dashboard",
    summary: "Get store sales, order, inventory, and best-seller analytics",
    description:
      "Sales exclude cancelled orders and failed or refunded payments. Daily sales cover the latest 30 calendar days.",
    auth: true,
    admin: true,
    responseSchema: "AdminDashboardResponse",
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
  allowProducts: {
    type: "boolean",
    description: "Allow products to be assigned directly. Disable this for grouping-only parent categories.",
  },
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

const attributeProperties = {
  name: { type: "string", minLength: 2, maxLength: 100 },
  code: { type: "string", pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$" },
  inputType: { type: "string", enum: ["SELECT", "COLOR", "TEXT"] },
  isActive: { type: "boolean" },
};

const attributeValueProperties = {
  label: { type: "string", minLength: 1, maxLength: 100 },
  code: { type: "string", pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$" },
  colorHex: { type: "string", nullable: true, pattern: "^#[0-9a-fA-F]{6}$" },
  sortOrder: { type: "integer", minimum: 0 },
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
  discountStartsAt: { type: "string", format: "date-time", nullable: true },
  discountEndsAt: { type: "string", format: "date-time", nullable: true },
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
  discountPrice: { type: "number", minimum: 0, nullable: true },
  discountStartsAt: { type: "string", format: "date-time", nullable: true },
  discountEndsAt: { type: "string", format: "date-time", nullable: true },
  costPrice: { type: "number", minimum: 0, nullable: true },
  stockQuantity: { type: "integer", minimum: 0 },
  lowStockLevel: { type: "integer", minimum: 0 },
  weight: { type: "number", minimum: 0, nullable: true },
  lengthCm: { type: "number", minimum: 0, maximum: 99999999.99, nullable: true },
  widthCm: { type: "number", minimum: 0, maximum: 99999999.99, nullable: true },
  heightCm: { type: "number", minimum: 0, maximum: 99999999.99, nullable: true },
  isDefault: { type: "boolean" },
  isActive: { type: "boolean" },
  optionValueIds: {
    type: "array",
    maxItems: 20,
    uniqueItems: true,
    items: { type: "string", pattern: "^[1-9][0-9]*$" },
    description: "One value per property assigned to the product type.",
  },
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
    { name: "Admin product attributes" },
    { name: "Products" },
    { name: "Admin products" },
    { name: "Cart" },
    { name: "Orders" },
    { name: "Admin dashboard" },
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
          "allowProducts",
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
          allowProducts: { type: "boolean" },
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
          "allowProducts",
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
      SetCategoryProductTypesRequest: {
        type: "object",
        required: ["productTypeIds"],
        properties: {
          productTypeIds: {
            type: "array",
            maxItems: 200,
            uniqueItems: true,
            items: { type: "string", pattern: "^[1-9][0-9]*$" },
          },
        },
      },
      CategoryProductTypeAssignmentResponse: {
        type: "object",
        required: ["success", "data"],
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "object",
            required: ["categoryId", "productTypeIds"],
            properties: {
              categoryId: { type: "string", example: "2" },
              productTypeIds: {
                type: "array",
                items: { type: "string", example: "4" },
              },
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
      AttributeRequest: {
        type: "object",
        required: ["name", "values"],
        properties: {
          name: attributeProperties.name,
          values: {
            type: "array",
            minItems: 1,
            maxItems: 100,
            uniqueItems: true,
            items: { type: "string", minLength: 1, maxLength: 100 },
            example: ["S", "M", "L", "XL"],
          },
        },
      },
      UpdateAttributeRequest: {
        type: "object",
        minProperties: 1,
        properties: attributeProperties,
      },
      AttributeValueRequest: {
        type: "object",
        required: ["label"],
        properties: attributeValueProperties,
      },
      UpdateAttributeValueRequest: {
        type: "object",
        minProperties: 1,
        properties: attributeValueProperties,
      },
      AdminAttributeValue: {
        type: "object",
        required: ["id", "attributeId", "label", "code", "colorHex", "sortOrder", "isActive", "deletedAt"],
        properties: {
          id: { type: "string", example: "8" },
          attributeId: { type: "string", example: "2" },
          ...attributeValueProperties,
          deletedAt: { type: "string", format: "date-time", nullable: true },
        },
      },
      AdminAttribute: {
        type: "object",
        required: ["id", "name", "code", "inputType", "isActive", "values", "deletedAt"],
        properties: {
          id: { type: "string", example: "2" },
          ...attributeProperties,
          values: { type: "array", items: schemaRef("AdminAttributeValue") },
          deletedAt: { type: "string", format: "date-time", nullable: true },
        },
      },
      AdminAttributeResponse: {
        type: "object", required: ["success", "data"],
        properties: { success: { type: "boolean", example: true }, data: { type: "object", required: ["attribute"], properties: { attribute: schemaRef("AdminAttribute") } } },
      },
      AdminAttributeValueResponse: {
        type: "object", required: ["success", "data"],
        properties: { success: { type: "boolean", example: true }, data: { type: "object", required: ["value"], properties: { value: schemaRef("AdminAttributeValue") } } },
      },
      AdminAttributeListResponse: {
        type: "object", required: ["success", "data"],
        properties: { success: { type: "boolean", example: true }, data: { type: "object", required: ["attributes"], properties: { attributes: { type: "array", items: schemaRef("AdminAttribute") } } } },
      },
      ProductTypeAttributeAssignment: {
        type: "object",
        required: ["attributeId", "isRequired", "sortOrder", "attribute"],
        properties: {
          attributeId: { type: "string" },
          isRequired: { type: "boolean" },
          sortOrder: { type: "integer", minimum: 0 },
          attribute: schemaRef("AdminAttribute"),
        },
      },
      SetProductTypeAttributesRequest: {
        type: "object",
        required: ["attributes"],
        properties: {
          attributes: {
            type: "array", maxItems: 50,
            items: {
              type: "object", required: ["attributeId"],
              properties: { attributeId: { type: "string" }, isRequired: { type: "boolean" }, sortOrder: { type: "integer", minimum: 0 } },
            },
          },
        },
      },
      ProductTypeAttributeListResponse: {
        type: "object", required: ["success", "data"],
        properties: { success: { type: "boolean", example: true }, data: { type: "object", required: ["attributes"], properties: { attributes: { type: "array", items: schemaRef("ProductTypeAttributeAssignment") } } } },
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
      BulkProductVariantRequest: {
        type: "object",
        required: ["variants"],
        properties: {
          variants: { type: "array", minItems: 1, maxItems: 200, items: schemaRef("ProductVariantRequest") },
        },
      },
      UpdateProductVariantRequest: {
        type: "object",
        minProperties: 1,
        properties: variantProperties,
      },
      ProductPriceTier: {
        type: "object",
        required: ["id", "productId", "variantId", "minimumQuantity", "unitPrice", "isPromotion", "isActive"],
        properties: {
          id: { type: "string", example: "1" },
          productId: { type: "string", example: "12" },
          variantId: { type: "string", nullable: true, example: "33" },
          minimumQuantity: { type: "integer", minimum: 2, example: 10 },
          unitPrice: { type: "string", example: "480.00" },
          isPromotion: { type: "boolean", example: true },
          isActive: { type: "boolean", example: true },
        },
      },
      ReplaceProductPriceTiersRequest: {
        type: "object",
        required: ["tiers"],
        properties: {
          tiers: {
            type: "array",
            maxItems: 100,
            items: {
              type: "object",
              required: ["minimumQuantity", "unitPrice"],
              properties: {
                variantId: { type: "string", nullable: true },
                minimumQuantity: { type: "integer", minimum: 2, maximum: 1000000 },
                unitPrice: { type: "number", minimum: 0 },
                isPromotion: { type: "boolean", default: false },
                isActive: { type: "boolean", default: true },
              },
            },
          },
        },
      },
      ProductPriceTierListResponse: {
        type: "object",
        required: ["success", "data"],
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "object",
            required: ["priceTiers"],
            properties: {
              priceTiers: { type: "array", items: schemaRef("ProductPriceTier") },
            },
          },
        },
      },
      Coupon: {
        type: "object",
        required: ["id", "code", "name", "discountType", "value", "minimumSubtotal", "maximumDiscount", "startsAt", "endsAt", "usageLimit", "perCustomerLimit", "usedCount", "isActive", "createdAt", "updatedAt", "deletedAt"],
        properties: {
          id: { type: "string" }, code: { type: "string", example: "SAVE10" }, name: { type: "string" },
          discountType: { type: "string", enum: ["PERCENTAGE", "FIXED"] }, value: { type: "string", example: "10.00" },
          minimumSubtotal: { type: "string", example: "1000.00" }, maximumDiscount: { type: "string", nullable: true, example: "500.00" },
          startsAt: { type: "string", format: "date-time", nullable: true }, endsAt: { type: "string", format: "date-time", nullable: true },
          usageLimit: { type: "integer", nullable: true }, perCustomerLimit: { type: "integer", minimum: 1 }, usedCount: { type: "integer", minimum: 0 },
          isActive: { type: "boolean" }, createdAt: { type: "string", format: "date-time" }, updatedAt: { type: "string", format: "date-time" }, deletedAt: { type: "string", format: "date-time", nullable: true },
        },
      },
      CouponRequest: {
        type: "object", required: ["code", "name", "discountType", "value"],
        properties: {
          code: { type: "string", minLength: 3, maxLength: 40, pattern: "^[A-Z0-9][A-Z0-9_-]*$" }, name: { type: "string", minLength: 2, maxLength: 120 },
          discountType: { type: "string", enum: ["PERCENTAGE", "FIXED"] }, value: { type: "number", minimum: 0 },
          minimumSubtotal: { type: "number", minimum: 0 }, maximumDiscount: { type: "number", nullable: true, minimum: 0 },
          startsAt: { type: "string", format: "date-time", nullable: true }, endsAt: { type: "string", format: "date-time", nullable: true },
          usageLimit: { type: "integer", nullable: true, minimum: 1 }, perCustomerLimit: { type: "integer", minimum: 1, maximum: 100 }, isActive: { type: "boolean" },
        },
      },
      UpdateCouponRequest: {
        type: "object",
        minProperties: 1,
        properties: {
          code: { type: "string", minLength: 3, maxLength: 40, pattern: "^[A-Z0-9][A-Z0-9_-]*$" },
          name: { type: "string", minLength: 2, maxLength: 120 },
          discountType: { type: "string", enum: ["PERCENTAGE", "FIXED"] },
          value: { type: "number", minimum: 0 },
          minimumSubtotal: { type: "number", minimum: 0 },
          maximumDiscount: { type: "number", nullable: true, minimum: 0 },
          startsAt: { type: "string", format: "date-time", nullable: true },
          endsAt: { type: "string", format: "date-time", nullable: true },
          usageLimit: { type: "integer", nullable: true, minimum: 1 },
          perCustomerLimit: { type: "integer", minimum: 1, maximum: 100 },
          isActive: { type: "boolean" },
        },
      },
      AdminCouponResponse: { type: "object", required: ["success", "data"], properties: { success: { type: "boolean" }, data: { type: "object", required: ["coupon"], properties: { coupon: schemaRef("Coupon") } } } },
      AdminCouponListResponse: { type: "object", required: ["success", "data"], properties: { success: { type: "boolean" }, data: { type: "object", required: ["coupons"], properties: { coupons: { type: "array", items: schemaRef("Coupon") } } } } },
      UpdateProductMediaRequest: {
        type: "object",
        minProperties: 1,
        properties: {
          variantId: { type: "string", nullable: true },
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
                "regularUnitPrice",
                "baseUnitPrice",
                "unitPrice",
                "lineTotal",
                "savingsTotal",
                "pricing",
                "available",
                "productVariant",
                "product",
                "createdAt",
                "updatedAt",
              ],
              properties: {
                id: { type: "string", example: "8" },
                quantity: { type: "integer", minimum: 1, example: 2 },
                regularUnitPrice: { type: "string", example: "1500.00" },
                baseUnitPrice: { type: "string", example: "1350.00" },
                unitPrice: { type: "string", example: "1200.00" },
                lineTotal: { type: "string", example: "2400.00" },
                savingsTotal: { type: "string", example: "600.00" },
                pricing: {
                  type: "object",
                  required: ["source", "minimumQuantity", "isPromotion"],
                  properties: {
                    source: {
                      type: "string",
                      enum: ["REGULAR", "DISCOUNT", "QUANTITY_TIER"],
                    },
                    minimumQuantity: { type: "integer", nullable: true, minimum: 2 },
                    isPromotion: { type: "boolean" },
                  },
                },
                available: { type: "boolean", example: true },
                productVariant: {
                  type: "object",
                  required: ["id", "sku", "stockQuantity", "optionValues"],
                  properties: {
                    id: { type: "string", example: "3" },
                    sku: { type: "string", example: "TSHIRT-BLK-M" },
                    barcode: { type: "string", nullable: true },
                    variantName: { type: "string", nullable: true },
                    color: { type: "string", nullable: true },
                    size: { type: "string", nullable: true },
                    stockQuantity: { type: "integer", minimum: 0 },
                    optionValues: {
                      type: "array",
                      items: {
                        type: "object",
                        required: ["id", "label", "code", "colorHex", "attribute"],
                        properties: {
                          id: { type: "string" },
                          label: { type: "string" },
                          code: { type: "string" },
                          colorHex: { type: "string", nullable: true },
                          attribute: {
                            type: "object",
                            required: ["id", "name", "code", "inputType"],
                            properties: {
                              id: { type: "string" },
                              name: { type: "string" },
                              code: { type: "string" },
                              inputType: { type: "string", enum: ["SELECT", "COLOR", "TEXT"] },
                            },
                          },
                        },
                      },
                    },
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
            required: ["itemCount", "totalQuantity", "regularSubtotal", "subtotal", "savingsTotal", "currency"],
            properties: {
              itemCount: { type: "integer", minimum: 0 },
              totalQuantity: { type: "integer", minimum: 0 },
              regularSubtotal: { type: "string", example: "3000.00" },
              subtotal: { type: "string", example: "2400.00" },
              savingsTotal: { type: "string", example: "600.00" },
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
          couponCode: { type: "string", minLength: 3, maxLength: 40, example: "SAVE10" },
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
          "productDiscountTotal",
          "couponDiscountTotal",
          "couponCode",
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
          productDiscountTotal: { type: "string", example: "100.00" },
          couponDiscountTotal: { type: "string", example: "200.00" },
          couponCode: { type: "string", nullable: true, example: "SAVE10" },
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
      AdminDashboard: {
        type: "object",
        required: [
          "summary",
          "dailySales",
          "bestSellingProducts",
          "lowStockProducts",
          "generatedAt",
        ],
        properties: {
          summary: {
            type: "object",
            required: ["totalSales", "totalOrders", "todayOrders", "lowStockCount", "currency"],
            properties: {
              totalSales: { type: "string", example: "154820.00" },
              totalOrders: { type: "integer", minimum: 0, example: 128 },
              todayOrders: { type: "integer", minimum: 0, example: 7 },
              lowStockCount: { type: "integer", minimum: 0, example: 4 },
              currency: { type: "string", example: "BDT" },
            },
          },
          dailySales: {
            type: "array",
            minItems: 30,
            maxItems: 30,
            items: {
              type: "object",
              required: ["date", "sales", "orderCount"],
              properties: {
                date: { type: "string", format: "date", example: "2026-10-10" },
                sales: { type: "string", example: "8920.00" },
                orderCount: { type: "integer", minimum: 0, example: 5 },
              },
            },
          },
          bestSellingProducts: {
            type: "array",
            maxItems: 6,
            items: {
              type: "object",
              required: ["productId", "productName", "quantitySold", "sales"],
              properties: {
                productId: { type: "string", nullable: true },
                productName: { type: "string" },
                quantitySold: { type: "integer", minimum: 0 },
                sales: { type: "string" },
              },
            },
          },
          lowStockProducts: {
            type: "array",
            maxItems: 8,
            items: {
              type: "object",
              required: [
                "productId",
                "productName",
                "variantId",
                "variantName",
                "sku",
                "stockQuantity",
                "lowStockLevel",
              ],
              properties: {
                productId: { type: "string" },
                productName: { type: "string" },
                variantId: { type: "string" },
                variantName: { type: "string" },
                sku: { type: "string" },
                stockQuantity: { type: "integer", minimum: 0 },
                lowStockLevel: { type: "integer", minimum: 0 },
              },
            },
          },
          generatedAt: { type: "string", format: "date-time" },
        },
      },
      AdminDashboardResponse: {
        type: "object",
        required: ["success", "data"],
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "object",
            required: ["dashboard"],
            properties: { dashboard: schemaRef("AdminDashboard") },
          },
        },
      },
      CheckoutPreview: {
        type: "object",
        required: ["addressId", "isInsideDhaka", "itemCount", "totalQuantity", "items", "regularSubtotal", "subtotal", "productDiscountTotal", "couponDiscountTotal", "couponCode", "discountTotal", "deliveryCharge", "grandTotal", "currency", "paymentMethod"],
        properties: {
          addressId: { type: "string", example: "3" },
          isInsideDhaka: { type: "boolean", example: true },
          itemCount: { type: "integer", minimum: 1, example: 1 },
          totalQuantity: { type: "integer", minimum: 1, example: 5 },
          items: {
            type: "array",
            items: {
              type: "object",
              required: ["id", "productName", "variantLabel", "sku", "quantity", "regularUnitPrice", "unitPrice", "lineTotal", "savingsTotal", "pricing"],
              properties: {
                id: { type: "string" },
                productName: { type: "string" },
                variantLabel: { type: "string", nullable: true },
                sku: { type: "string" },
                quantity: { type: "integer", minimum: 1 },
                regularUnitPrice: { type: "string", example: "500.00" },
                unitPrice: { type: "string", example: "450.00" },
                lineTotal: { type: "string", example: "2250.00" },
                savingsTotal: { type: "string", example: "250.00" },
                pricing: {
                  type: "object",
                  required: ["source", "minimumQuantity", "isPromotion"],
                  properties: {
                    source: { type: "string", enum: ["REGULAR", "DISCOUNT", "QUANTITY_TIER"] },
                    minimumQuantity: { type: "integer", nullable: true, minimum: 2 },
                    isPromotion: { type: "boolean" },
                  },
                },
              },
            },
          },
          regularSubtotal: { type: "string", example: "2500.00" },
          subtotal: { type: "string", example: "2400.00" },
          productDiscountTotal: { type: "string", example: "100.00" },
          couponDiscountTotal: { type: "string", example: "240.00" },
          couponCode: { type: "string", nullable: true, example: "SAVE10" },
          discountTotal: { type: "string", example: "340.00" },
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
````

### `DokanBDbackend/tests/openapi.test.ts`

Source lines: 239

````ts
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

    expect(Object.keys(paths)).toHaveLength(64);
    expect(operationCount).toBe(88);
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
    expect(paths["/admin/products/{productId}/variants/bulk"]?.post).toBeDefined();
    expect(components.AdminAttribute).toBeDefined();
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
````

# Regeneration checklist

1. Make and test changes in the real source files.
2. Update the frontend TypeScript contracts whenever backend response fields change.
3. Add a new migration for database changes.
4. Update Swagger when routes, payloads, validation, media formats, or responses change.
5. Run frontend and backend type checks/tests.
6. Regenerate this reference so the copied source matches the working application.

