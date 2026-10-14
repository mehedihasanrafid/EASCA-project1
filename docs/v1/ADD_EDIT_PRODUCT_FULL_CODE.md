# DokanBD Add and Edit Product — Full Code Reference

> Structure update (2026-10-14): the active editor now lives under
> `web/src/admin/product-editor/`. This older generated snapshot is retained
> for history. Use `ADMIN_PRODUCT_COMPLETE_CODE_REFERENCE.md` for the current
> complete source and file structure.

Generated from the working project on 2026-10-13.

This is a source snapshot for the complete administrator add/edit product
workflow. It contains 60 files and approximately
10,979 source lines. The code is reproduced in
full so this document can be used for study, maintenance, and future refactors.

## Important architecture fact

Add Product and Edit Product intentionally use the same React page:

- `/admin/products/new` renders `AdminProductEditorPage` without a product ID.
- `/admin/products/:productId/edit` renders the same page with a product ID.
- Without an ID, the page creates the product and variants.
- With an ID, the page loads the existing record, hydrates the form, and saves
  product, variant, pricing-tier, and media changes.

## Workflow summary

### Add product

1. Load categories, allowed product types, brands, and reusable attributes.
2. Enter product information and build valid SKU combinations.
3. Create the product and its initial/default variant.
4. Synchronize all generated variants in bulk.
5. Save quantity-price tiers.
6. Upload or attach product/variant media.

### Edit product

1. Load the product, existing variants, option selections, media, and tiers.
2. Convert API data into editor drafts.
3. Patch product fields and synchronize SKU variants.
4. Apply safe deletion rules to removed variants and attribute values.
5. Save tiers and media changes.

## Included file structure

```text
├── web
│   └── src
│       ├── routes
│       │   └── AppRouter.tsx
│       ├── pages
│       │   ├── admin
│       │   │   ├── AdminProductsPage.tsx
│       │   │   └── AdminProductEditorPage.tsx
│       │   └── dashboard
│       │       ├── AdminVariantBuilder.tsx
│       │       ├── AdminPriceTierBuilder.tsx
│       │       ├── discountDraft.ts
│       │       ├── variantCsv.ts
│       │       ├── variantPaths.ts
│       │       ├── discountDraft.test.ts
│       │       ├── variantCsv.test.ts
│       │       └── variantPaths.test.ts
│       ├── features
│       │   └── admin
│       │       └── products
│       │           ├── AdminProductsPage.tsx
│       │           └── components
│       │               └── AdminProductsTable.tsx
│       ├── api
│       │   ├── adminProducts.ts
│       │   ├── adminCatalog.ts
│       │   ├── products.ts
│       │   ├── client.ts
│       │   └── adminProducts.test.ts
│       └── styles
│           └── features
│               ├── product-editor.css
│               └── admin.css
└── DokanBDbackend
    └── src
        ├── routes
        │   └── v1.ts
        ├── modules
        │   ├── products
        │   │   ├── product.routes.ts
        │   │   ├── product.controller.ts
        │   │   ├── product.schema.ts
        │   │   ├── product.service.ts
        │   │   ├── product.entity.ts
        │   │   ├── product-variant.entity.ts
        │   │   ├── product-media.entity.ts
        │   │   ├── product-price-tier.entity.ts
        │   │   ├── product-media.service.ts
        │   │   ├── product-media-upload.middleware.ts
        │   │   ├── product-price-tier.service.ts
        │   │   ├── product-pricing.ts
        │   │   ├── product.schema.test.ts
        │   │   ├── product-pricing.test.ts
        │   │   └── product-category-hierarchy.test.ts
        │   ├── attributes
        │   │   ├── product-attribute.routes.ts
        │   │   ├── product-attribute.controller.ts
        │   │   ├── product-attribute.schema.ts
        │   │   ├── product-attribute.service.ts
        │   │   ├── product-attribute.entity.ts
        │   │   ├── product-attribute-value.entity.ts
        │   │   ├── product-type-attribute.entity.ts
        │   │   ├── product-variant-attribute-value.entity.ts
        │   │   ├── product-attribute.schema.test.ts
        │   │   └── product-attribute.service.test.ts
        │   ├── categories
        │   │   ├── category-product-type.entity.ts
        │   │   └── category.entity.ts
        │   ├── brands
        │   │   └── brand.entity.ts
        │   ├── product-types
        │   │   ├── product-type.entity.ts
        │   │   └── product-type.schema.test.ts
        │   └── inventory
        │       └── inventory-movement.entity.ts
        └── database
            └── migrations
                ├── 1791108013191-InitialSchema.ts
                ├── 1791270000000-AdminCatalogManagement.ts
                ├── 1791271000000-ProductTypeManagement.ts
                ├── 1791620000000-ProductAttributesAndVariants.ts
                ├── 1791790000000-ProductWorkbenchPricing.ts
                ├── 1791791000000-ProductVariantDimensions.ts
                ├── 1791870000000-CatalogRelationshipAssignments.ts
                └── 1792040000000-CategoryHierarchyAndGlobalBrands.ts
```

## How to use this document

- Search for a file path to jump to its complete source.
- Begin with `AdminProductEditorPage.tsx` for the browser workflow.
- Continue with `adminProducts.ts` for HTTP contracts.
- Read `product.routes.ts`, `product.controller.ts`, then
  `product.service.ts` for the backend flow.
- Read the entities and migrations to understand persistence.
- The tests show intended calculations, validation, and edge cases.

> This file is a generated learning snapshot. Edit the real source files, then
> regenerate this document after future product-workflow changes.

## Frontend routes and product-list entry points

### `web/src/routes/AppRouter.tsx`

Source lines: 147

```tsx
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
import { AdminOverviewPage } from "../pages/admin/AdminOverviewPage";
import { AdminProductEditorPage } from "../pages/admin/AdminProductEditorPage";
import { AdminProductsPage } from "../pages/admin/AdminProductsPage";
import { AdminProductTypesPage } from "../pages/admin/AdminProductTypesPage";
import { AdminPropertiesPage } from "../pages/admin/AdminPropertiesPage";
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
              <Route index element={<AdminOverviewPage />} />
              <Route path="products" element={<AdminProductsPage />} />
              <Route path="products/new" element={<AdminProductEditorPage />} />
              <Route path="products/:productId/edit" element={<AdminProductEditorPage />} />
              <Route path="orders" element={<AdminOrdersPage />} />
              <Route path="orders/:orderId" element={<AdminOrderDetailPage />} />
              <Route path="categories" element={<AdminCategoriesPage />} />
              <Route path="brands" element={<AdminBrandsPage />} />
              <Route path="product-types" element={<AdminProductTypesPage />} />
              <Route path="attributes" element={<AdminPropertiesPage />} />
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
```

### `web/src/pages/admin/AdminProductsPage.tsx`

Source lines: 3

```tsx
// Route compatibility: implementation lives with the admin-products feature.
export { AdminProductsPage } from "../../features/admin/products";
```

### `web/src/features/admin/products/AdminProductsPage.tsx`

Source lines: 69

```tsx
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
```

### `web/src/features/admin/products/components/AdminProductsTable.tsx`

Source lines: 91

```tsx
import React from "react";
import { ExternalLink, Package, Pencil } from "lucide-react";
import { Link } from "react-router-dom";

import { AdminProduct } from "../../../../api/adminProducts";

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
```

## Frontend add/edit product editor

### `web/src/pages/admin/AdminProductEditorPage.tsx`

Source lines: 1160

```tsx
import React, { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  ImagePlus,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  AdminProduct,
  adminProductApi,
  CategoryOption,
} from "../../api/adminProducts";
import { AdminBrand, AdminProductType, adminCatalogApi } from "../../api/adminCatalog";
import { ApiException } from "../../api/client";
import type { ProductMedia } from "../../api/products";
import { AdminPriceTierBuilder, PriceTierDraft } from "../dashboard/AdminPriceTierBuilder";
import {
  discountPercentageFromPrice,
  discountPriceFromPercentage,
} from "../dashboard/discountDraft";
import {
  AdminVariantBuilder,
  type VariantDraft,
  type VariantPendingMedia,
} from "../dashboard/AdminVariantBuilder";
import { exportVariantsToCsv, parseVariantCsv } from "../dashboard/variantCsv";

interface ProductFormState {
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

const emptyForm: ProductFormState = {
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

interface FlatCategoryOption extends CategoryOption {
  displayName: string;
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

const emptySimpleVariant = (): VariantDraft => ({
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

const toApiDateTime = (value: string) => value ? new Date(value).toISOString() : null;

export const AdminProductEditorPage: React.FC = () => {
  const navigate = useNavigate();
  const { productId } = useParams();
  const [categories, setCategories] = useState<FlatCategoryOption[]>([]);
  const [brands, setBrands] = useState<AdminBrand[]>([]);
  const [productTypes, setProductTypes] = useState<AdminProductType[]>([]);
  const [allowedProductTypeIds, setAllowedProductTypeIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [variantDrafts, setVariantDrafts] = useState<VariantDraft[]>([emptySimpleVariant()]);
  const [originalVariantIds, setOriginalVariantIds] = useState<string[]>([]);
  const [priceTiers, setPriceTiers] = useState<PriceTierDraft[]>([]);
  const [media, setMedia] = useState<ProductMedia[]>([]);
  const [pendingMedia, setPendingMedia] = useState<VariantPendingMedia[]>([]);
  const [mediaBusyId, setMediaBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState<ProductFormState>(emptyForm);
  const [priceTierScope, setPriceTierScope] = useState<"all" | "individual">("all");
  const [discountScope, setDiscountScope] = useState<"all" | "individual">("all");
  const [mediaScope, setMediaScope] = useState<"all" | "individual">("all");
  const [globalDiscountEnabled, setGlobalDiscountEnabled] = useState(false);
  const settingsDefaultVariant = variantDrafts.find((variant) => variant.isDefault) ?? variantDrafts[0];
  const settingsRegularPrice = settingsDefaultVariant?.price || form.defaultPrice;
  const globalDiscountPercentage = discountPercentageFromPrice(
    settingsRegularPrice,
    form.discountPrice,
  );

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [categoryResult, brandResult, productTypeResult] = await Promise.all([
        adminProductApi.getCategories(),
        adminCatalogApi.getBrands(false),
        adminCatalogApi.getProductTypes(false),
      ]);
      setCategories(flattenCategories(categoryResult).filter((category) => category.allowProducts));
      setBrands(brandResult.filter((brand) => brand.isActive && !brand.deletedAt));
      setProductTypes(productTypeResult.filter((type) => type.isActive && !type.deletedAt));
    } catch (requestError) {
      setError(
        requestError instanceof ApiException
          ? requestError.error.message
          : "Could not load the product catalog.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  useEffect(() => {
    if (form.categoryId || categories.length === 0) return;
    setForm((current) => ({ ...current, categoryId: categories[0]?.id ?? "" }));
  }, [categories, form.categoryId]);

  useEffect(() => {
    if (!form.categoryId) {
      setAllowedProductTypeIds([]);
      return;
    }

    let isCurrent = true;
    const categoryId = form.categoryId;
    setAllowedProductTypeIds([]);

    void adminCatalogApi.getCategoryProductTypes(categoryId)
      .then((assignment) => {
        if (!isCurrent) return;
        const activeIds = assignment.productTypeIds.filter((id) =>
          productTypes.some((type) => type.id === id),
        );
        setAllowedProductTypeIds(activeIds);
        setForm((current) => {
          if (current.categoryId !== categoryId || current.productTypeId) return current;
          return {
            ...current,
            productTypeId: activeIds[0] ?? "",
          };
        });
      })
      .catch((requestError) => {
        if (!isCurrent) return;
        setError(
          requestError instanceof ApiException
            ? requestError.error.message
            : "Could not load the product types assigned to this category.",
        );
      });

    return () => {
      isCurrent = false;
    };
  }, [form.categoryId, productTypes]);

  const setField = <K extends keyof ProductFormState>(key: K, value: ProductFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const closeEditor = () => {
    navigate("/admin/products");
  };

  const openEditForm = async (productId: string) => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const product = await adminProductApi.getProduct(productId);
      setEditingProductId(product.id);
      const loadedVariants: VariantDraft[] = (product.variants ?? []).map((variant) => ({
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
      setVariantDrafts(loadedVariants.length ? loadedVariants : [emptySimpleVariant()]);
      setOriginalVariantIds(loadedVariants.flatMap((variant) => variant.id ? [variant.id] : []));
      const keyByVariantId = new Map(
        loadedVariants.flatMap((variant) => variant.id ? [[variant.id, variant.key] as const] : []),
      );
      const loadedPriceTiers: PriceTierDraft[] = (product.priceTiers ?? []).map((tier) => ({
        key: `saved-tier-${tier.id}`,
        variantKey: tier.variantId ? keyByVariantId.get(tier.variantId) ?? "all" : "all",
        minimumQuantity: String(tier.minimumQuantity),
        unitPrice: String(tier.unitPrice),
        isPromotion: tier.isPromotion,
        isActive: tier.isActive ?? true,
      }));
      setPriceTiers(loadedPriceTiers);
      setPriceTierScope(loadedPriceTiers.some((tier) => tier.variantKey !== "all") ? "individual" : "all");
      setMedia(product.media ?? []);
      setPendingMedia([]);
      setGlobalDiscountEnabled(product.discountPrice !== null);
      setDiscountScope(
        product.discountPrice !== null
          ? "all"
          : loadedVariants.some((variant) => Boolean(variant.discountPrice))
            ? "individual"
            : "all",
      );
      setMediaScope((product.media ?? []).some((item) => item.variantId !== null) ? "individual" : "all");
      setForm({
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
      });
    } catch (requestError) {
      setError(
        requestError instanceof ApiException
          ? requestError.error.message
          : "Could not load this product for editing.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId) void openEditForm(productId);
  }, [productId]);

  useEffect(() => {
    const availableVariantKeys = new Set(variantDrafts.map((variant) => variant.key));
    setPriceTiers((current) =>
      current.filter(
        (tier) => tier.variantKey === "all" || availableVariantKeys.has(tier.variantKey),
      ),
    );
    setPendingMedia((current) =>
      current.filter(
        (item) => item.variantKey === "all" || availableVariantKeys.has(item.variantKey),
      ),
    );
  }, [variantDrafts]);

  const mediaCountForScope = (
    variantKey: "all" | string,
    pendingItems = pendingMedia,
  ) => {
    const variantId = variantKey === "all"
      ? null
      : variantDrafts.find((variant) => variant.key === variantKey)?.id;
    const savedCount = variantKey === "all"
      ? media.filter((item) => item.variantId === null).length
      : variantId
        ? media.filter((item) => item.variantId === variantId).length
        : 0;
    return savedCount + pendingItems.filter((item) => item.variantKey === variantKey).length;
  };

  const addPendingMedia = (variantKey: "all" | string, selected: File[]) => {
    if (selected.length === 0) return;

    const availableSlots = 4 - mediaCountForScope(variantKey);
    if (selected.length > availableSlots) {
      const scopeName = variantKey === "all"
        ? "shared product media"
        : "this variant";
      setError(`${scopeName} can accept ${Math.max(availableSlots, 0)} more item${availableSlots === 1 ? "" : "s"}.`);
      return;
    }

    const invalidType = selected.find(
      (file) =>
        !["image/jpeg", "image/png", "image/webp", "video/mp4", "video/webm"].includes(
          file.type,
        ),
    );
    if (invalidType) {
      setError(`${invalidType.name} is not a supported image or video.`);
      return;
    }

    const oversized = selected.find((file) => {
      const limit = file.type.startsWith("video/") ? 20 : 2;
      return file.size > limit * 1024 * 1024;
    });
    if (oversized) {
      const limit = oversized.type.startsWith("video/") ? 20 : 2;
      setError(`${oversized.name} is larger than ${limit} MB.`);
      return;
    }

    setError("");
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
    setError("");

    try {
      const updated = await adminProductApi.updateMedia(editingProductId, mediaId, { isPrimary: true });
      setMedia((current) => current.map((item) =>
        item.variantId === updated.variantId
          ? { ...item, isPrimary: item.id === updated.id }
          : item,
      ));
    } catch (requestError) {
      setError(
        requestError instanceof ApiException
          ? requestError.error.message
          : "Could not set the primary image.",
      );
    } finally {
      setMediaBusyId(null);
    }
  };

  const deleteImage = async (mediaId: string) => {
    if (!editingProductId || !window.confirm("Delete this product image?")) return;
    setMediaBusyId(mediaId);
    setError("");

    try {
      await adminProductApi.deleteMedia(editingProductId, mediaId);
      setMedia((current) => current.filter((item) => item.id !== mediaId));
    } catch (requestError) {
      setError(
        requestError instanceof ApiException
          ? requestError.error.message
          : "Could not delete this image.",
      );
    } finally {
      setMediaBusyId(null);
    }
  };

  const assignMediaToVariant = async (mediaId: string, variantId: string) => {
    if (!editingProductId) return;
    setMediaBusyId(mediaId); setError("");
    try {
      const updated = await adminProductApi.updateMedia(editingProductId, mediaId, {
        variantId: variantId || null,
      });
      setMedia((current) => current.map((item) => item.id === mediaId ? updated : item));
    } catch (requestError) {
      setError(requestError instanceof ApiException ? requestError.error.message : "Could not assign this media item.");
    } finally { setMediaBusyId(null); }
  };

  const movePendingMedia = (mediaKey: string, variantKey: "all" | string) => {
    const withoutCurrent = pendingMedia.filter((item) => item.key !== mediaKey);
    if (mediaCountForScope(variantKey, withoutCurrent) >= 4) {
      setError(variantKey === "all"
        ? "Shared product media already contains four items."
        : "That variant already contains four media items.");
      return;
    }
    setError("");
    setPendingMedia((current) => current.map((item) =>
      item.key === mediaKey ? { ...item, variantKey } : item,
    ));
  };

  const changePriceTierScope = (nextScope: "all" | "individual") => {
    if (nextScope === priceTierScope) return;
    const conflicting = priceTiers.filter((tier) =>
      nextScope === "all" ? tier.variantKey !== "all" : tier.variantKey === "all",
    );
    if (
      conflicting.length > 0 &&
      !window.confirm(
        `Switching quantity pricing to ${nextScope === "all" ? "All variants" : "Individual SKU"} will remove ${conflicting.length} price block${conflicting.length === 1 ? "" : "s"} from the other scope. Continue?`,
      )
    ) return;
    setPriceTiers((current) => current.filter((tier) =>
      nextScope === "all" ? tier.variantKey === "all" : tier.variantKey !== "all",
    ));
    setPriceTierScope(nextScope);
    setError("");
  };

  const changeDiscountScope = (nextScope: "all" | "individual") => {
    if (nextScope === discountScope) return;
    if (nextScope === "all") {
      const individualCount = variantDrafts.filter((variant) => variant.discountPrice).length;
      if (
        individualCount > 0 &&
        !window.confirm(
          `Switching discounts to All variants will clear ${individualCount} individual SKU discount${individualCount === 1 ? "" : "s"}. Continue?`,
        )
      ) return;
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
    setDiscountScope(nextScope);
    setError("");
  };

  const changeMediaScope = (nextScope: "all" | "individual") => {
    if (nextScope === mediaScope) return;
    if (nextScope === "all") {
      const individualPending = pendingMedia.filter((item) => item.variantKey !== "all");
      const sharedPending = pendingMedia.filter((item) => item.variantKey === "all");
      const savedSharedCount = media.filter((item) => item.variantId === null).length;
      if (savedSharedCount + sharedPending.length + individualPending.length > 4) {
        setError("The individual pending media cannot be moved to All variants because the four-item shared limit would be exceeded.");
        return;
      }
      if (
        individualPending.length > 0 &&
        !window.confirm(
          `Move ${individualPending.length} pending SKU media item${individualPending.length === 1 ? "" : "s"} to All variants?`,
        )
      ) return;
      setPendingMedia((current) => current.map((item) => ({ ...item, variantKey: "all" })));
    }
    setMediaScope(nextScope);
    setError("");
  };

  const exportVariantCsv = () => {
    const csv = exportVariantsToCsv(variantDrafts);
    const blobUrl = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = `${form.name.trim().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "product"}-variants.csv`;
    link.click();
    URL.revokeObjectURL(blobUrl);
  };

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

    const requestedDefaultSku = parsed.records.find((record) => record.isDefault)?.sku;
    const normalized = requestedDefaultSku
      ? next.map((variant) => ({
        ...variant,
        isDefault: variant.sku.trim().toUpperCase() === requestedDefaultSku,
      }))
      : next.some((variant) => variant.isDefault)
        ? next
        : next.map((variant, index) => ({ ...variant, isDefault: index === 0 }));
    setVariantDrafts(normalized);
    setSuccess(`${parsed.records.length} variant row${parsed.records.length === 1 ? "" : "s"} imported from ${file.name}.`);
  };

  const handleSaveProduct = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const requestedStatus = (submitter?.dataset.status as AdminProduct["status"] | undefined) ?? form.status;
    const defaultVariant = variantDrafts.find((variant) => variant.isDefault) ?? variantDrafts[0];
    const regularPrice = Number(defaultVariant?.price || form.defaultPrice);
    const discountPrice = globalDiscountEnabled && form.discountPrice
      ? Number(form.discountPrice)
      : null;
    const costPrice = defaultVariant?.costPrice
      ? Number(defaultVariant.costPrice)
      : form.costPrice ? Number(form.costPrice) : null;
    const discountStartsAt = discountPrice === null ? null : toApiDateTime(form.discountStartsAt);
    const discountEndsAt = discountPrice === null ? null : toApiDateTime(form.discountEndsAt);

    if (!defaultVariant || defaultVariant.price === "" || !Number.isFinite(regularPrice)) {
      setError("Choose a default variant and enter its selling price.");
      return;
    }
    if (discountPrice !== null && discountPrice > regularPrice) {
      setError("The discount price cannot be higher than the regular price.");
      return;
    }
    if (discountStartsAt && discountEndsAt && discountStartsAt > discountEndsAt) {
      setError("The product offer end date must be after its start date.");
      return;
    }
    if (variantDrafts.length === 0 || variantDrafts.some((variant) => !variant.sku.trim())) {
      setError("Add at least one variant and provide a unique SKU for every row.");
      return;
    }
    const normalizedSkus = variantDrafts.map((variant) => variant.sku.trim().toUpperCase());
    if (new Set(normalizedSkus).size !== normalizedSkus.length) {
      setError("Every variant needs a unique SKU. Remove or rename the duplicate SKU before saving.");
      return;
    }
    const invalidVariantPrice = variantDrafts.find(
      (variant) => variant.price === "" || !Number.isFinite(Number(variant.price)) || Number(variant.price) < 0,
    );
    if (invalidVariantPrice) {
      setError(`${invalidVariantPrice.optionLabel || invalidVariantPrice.sku} needs a selling price.`);
      return;
    }
    const invalidInventory = variantDrafts.find((variant) => {
      const stock = Number(variant.stockQuantity);
      const lowStock = Number(variant.lowStockLevel || 0);
      return variant.stockQuantity === "" || !Number.isInteger(stock) || stock < 0 ||
        !Number.isInteger(lowStock) || lowStock < 0;
    });
    if (invalidInventory) {
      setError(`${invalidInventory.optionLabel || invalidInventory.sku} needs non-negative whole numbers for stock and low-stock warning.`);
      return;
    }
    const invalidOptionalNumber = variantDrafts.find((variant) =>
      variant.costPrice !== "" && (
        !Number.isFinite(Number(variant.costPrice)) || Number(variant.costPrice) < 0
      ),
    );
    if (invalidOptionalNumber) {
      setError(`${invalidOptionalNumber.optionLabel || invalidOptionalNumber.sku} contains an invalid cost price.`);
      return;
    }
    const invalidGlobalDiscount = discountPrice === null
      ? undefined
      : variantDrafts.find(
        (variant) => !variant.discountPrice && discountPrice > Number(variant.price),
      );
    if (invalidGlobalDiscount) {
      setError(`The all-variant discount is higher than ${invalidGlobalDiscount.optionLabel || invalidGlobalDiscount.sku}'s selling price.`);
      return;
    }
    const invalidVariantDiscount = variantDrafts.find((variant) =>
      variant.discountPrice && (
        !Number.isFinite(Number(variant.discountPrice)) ||
        Number(variant.discountPrice) < 0 ||
        Number(variant.discountPrice) > Number(variant.price || regularPrice)
      ),
    );
    if (invalidVariantDiscount) {
      setError(`${invalidVariantDiscount.optionLabel || invalidVariantDiscount.sku}'s discount price is higher than its selling price.`);
      return;
    }
    const invalidVariantSchedule = variantDrafts.find((variant) => {
      const startsAt = toApiDateTime(variant.discountStartsAt);
      const endsAt = toApiDateTime(variant.discountEndsAt);
      return startsAt && endsAt && startsAt > endsAt;
    });
    if (invalidVariantSchedule) {
      setError(`${invalidVariantSchedule.optionLabel || invalidVariantSchedule.sku}'s offer end date must be after its start date.`);
      return;
    }
    const tierSignatures = new Set<string>();
    for (const tier of priceTiers) {
      if (Number(tier.minimumQuantity) < 2 || tier.unitPrice === "") {
        setError("Every block price needs a minimum quantity of 2 or more and a unit price.");
        return;
      }
      const signature = `${tier.variantKey}:${tier.minimumQuantity}`;
      if (tierSignatures.has(signature)) {
        setError("The same price scope cannot contain duplicate minimum quantities.");
        return;
      }
      tierSignatures.add(signature);
    }

    const variantInputs = variantDrafts.map((variant) => ({
      sku: variant.sku.trim(),
      barcode: variant.barcode.trim() || null,
      variantName: variant.optionLabel || "Default",
      price: Number(variant.price || regularPrice),
      discountPrice: variant.discountPrice ? Number(variant.discountPrice) : discountPrice,
      discountStartsAt: variant.discountPrice
        ? toApiDateTime(variant.discountStartsAt)
        : discountStartsAt,
      discountEndsAt: variant.discountPrice
        ? toApiDateTime(variant.discountEndsAt)
        : discountEndsAt,
      costPrice: variant.costPrice ? Number(variant.costPrice) : costPrice,
      stockQuantity: Number(variant.stockQuantity),
      lowStockLevel: Number(variant.lowStockLevel || 0),
      isDefault: variant.isDefault,
      isActive: variant.isActive,
      optionValueIds: variant.optionValueIds,
    }));

    const uploadPendingMedia = async (
      savedProductId: string,
      variantIdsByKey: Map<string, string>,
    ) => {
      const grouped = new Map<string, File[]>();
      for (const item of pendingMedia) {
        const variantId = item.variantKey === "all"
          ? "all"
          : variantIdsByKey.get(item.variantKey);
        if (!variantId) throw new Error("A selected media item points to a variant that was not saved.");
        grouped.set(variantId, [...(grouped.get(variantId) ?? []), item.file]);
      }
      for (const [variantId, files] of grouped) {
        await adminProductApi.uploadMedia(
          savedProductId,
          files,
          form.name,
          variantId === "all" ? undefined : variantId,
        );
      }
    };

    const savePriceTiers = async (
      savedProductId: string,
      variantIdsByKey: Map<string, string>,
    ) => {
      const inputs = priceTiers.map((tier) => {
        let variantId: string | null = null;
        if (tier.variantKey !== "all") {
          const savedVariantId = variantIdsByKey.get(tier.variantKey);
          if (!savedVariantId) {
            throw new Error("A block price points to a variant that was not saved.");
          }
          variantId = savedVariantId;
        }
        return {
          variantId,
          minimumQuantity: Number(tier.minimumQuantity),
          unitPrice: Number(tier.unitPrice),
          isPromotion: tier.isPromotion,
          isActive: tier.isActive,
        };
      });
      await adminProductApi.replacePriceTiers(savedProductId, inputs);
    };

    setSubmitting(true);
    let createdProduct: AdminProduct | null = null;

    try {
      if (editingProductId) {
        await adminProductApi.updateProduct(editingProductId, {
          productTypeId: form.productTypeId,
          categoryId: form.categoryId,
          brandId: form.brandId || null,
          name: form.name,
          shortDescription: form.shortDescription.trim() || null,
          description: form.description.trim() || form.name.trim(),
          defaultPrice: regularPrice,
          defaultCostPrice: costPrice,
          discountPrice,
          discountStartsAt,
          discountEndsAt,
          status: requestedStatus,
          isFeatured: form.isFeatured,
          isActive: true,
        });

        const variantIdsByKey = new Map<string, string>();
        for (let index = 0; index < variantDrafts.length; index += 1) {
          const draft = variantDrafts[index];
          if (draft.id) {
            await adminProductApi.updateVariant(editingProductId, draft.id, variantInputs[index]);
            variantIdsByKey.set(draft.key, draft.id);
          }
        }
        const newDrafts = variantDrafts.filter((variant) => !variant.id);
        const newVariantInputs = variantInputs.filter((_, index) => !variantDrafts[index].id);
        if (newVariantInputs.length) {
          const created = await adminProductApi.createVariantsBulk(editingProductId, newVariantInputs);
          newDrafts.forEach((draft, index) => {
            const createdVariant = created[index];
            if (createdVariant) variantIdsByKey.set(draft.key, createdVariant.id);
          });
        }

        await uploadPendingMedia(editingProductId, variantIdsByKey);
        await savePriceTiers(editingProductId, variantIdsByKey);

        const currentIds = new Set(variantDrafts.flatMap((variant) => variant.id ? [variant.id] : []));
        const removedIds = originalVariantIds.filter((id) => !currentIds.has(id));
        for (const item of media.filter((entry) => entry.variantId && removedIds.includes(entry.variantId))) {
          await adminProductApi.deleteMedia(editingProductId, item.id);
        }
        for (const removedId of removedIds) {
          await adminProductApi.deleteVariant(editingProductId, removedId);
        }

        navigate("/admin/products", {
          state: { success: `${form.name} was updated successfully.` },
        });
        return;
      }

      createdProduct = await adminProductApi.createProduct({
        productTypeId: form.productTypeId,
        categoryId: form.categoryId,
        brandId: form.brandId || null,
        name: form.name,
        shortDescription: form.shortDescription.trim() || null,
        description: form.description.trim() || form.name.trim(),
        defaultPrice: regularPrice,
        defaultCostPrice: costPrice,
        discountPrice,
        discountStartsAt,
        discountEndsAt,
        status: "DRAFT",
        isFeatured: form.isFeatured,
        isActive: true,
      });

      const createdVariants = await adminProductApi.createVariantsBulk(createdProduct.id, variantInputs);
      const variantIdsByKey = new Map<string, string>();
      variantDrafts.forEach((draft, index) => {
        const createdVariant = createdVariants[index];
        if (createdVariant) variantIdsByKey.set(draft.key, createdVariant.id);
      });

      await uploadPendingMedia(createdProduct.id, variantIdsByKey);
      await savePriceTiers(createdProduct.id, variantIdsByKey);

      if (requestedStatus !== "DRAFT") {
        await adminProductApi.updateProduct(createdProduct.id, { status: requestedStatus });
      }

      navigate("/admin/products", {
        state: { success: `${form.name} was created successfully.` },
      });
    } catch (requestError) {
      const message =
        requestError instanceof ApiException
          ? requestError.error.message
          : "Could not create the product.";
      setError(
        editingProductId
          ? message
          : createdProduct
          ? `The product was saved as a draft, but setup did not finish: ${message}`
          : message,
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="admin-page-loading">Loading product editor...</div>;
  }

  return (
    <div className="dashboard-container admin-catalog admin-page admin-product-editor-page">
      <header className="product-editor-header">
        <div>
          <div className="product-editor-breadcrumb">
            <Link to="/admin/products">Products</Link><span>/</span><span>{editingProductId ? "Edit Product" : "Add Product"}</span>
          </div>
          <h1>{editingProductId ? "Edit Product" : "Add New Product"}</h1>
        </div>
        <div className="product-editor-actions">
          <button form="product-editor-form" type="submit" data-status="DRAFT" className="btn btn-ghost" disabled={submitting || productTypes.length === 0}>
            Save Draft
          </button>
          <button form="product-editor-form" type="submit" data-status="ACTIVE" className="btn btn-primary" disabled={submitting || productTypes.length === 0}>
            {submitting ? "Saving..." : editingProductId ? "Save & Publish" : "Publish Product"}
          </button>
        </div>
      </header>

      {error && <div className="alert alert-error"><AlertCircle size={18} />{error}</div>}
      {success && <div className="alert alert-success"><CheckCircle size={18} />{success}</div>}

      <form id="product-editor-form" className="product-editor-form" onSubmit={handleSaveProduct}>
        <section className="product-editor-panel product-summary-panel">
          <div className="product-summary-grid">
            <div className="form-group">
              <label htmlFor="product-name">Product name <span>*</span></label>
              <input id="product-name" className="form-input" value={form.name} placeholder="Enter product name" onChange={(event) => setField("name", event.target.value)} required minLength={2} maxLength={200} />
            </div>
            <div className="form-group">
              <div className="admin-field-label-row"><label htmlFor="product-category">Category <span>*</span></label><Link to="/admin/categories">+ New</Link></div>
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
                {categories.map((category) => <option key={category.id} value={category.id}>{category.displayName}</option>)}
              </select>
            </div>
            <div className="form-group">
              <div className="admin-field-label-row"><label htmlFor="product-type">Product type <span>*</span></label><Link to="/admin/categories">Manage category types</Link></div>
              <select
                id="product-type"
                className="form-input"
                value={form.productTypeId}
                onChange={(event) => {
                  setForm((current) => ({
                    ...current,
                    productTypeId: event.target.value,
                  }));
                }}
                disabled={Boolean(editingProductId && originalVariantIds.length)}
                required
              >
                <option value="">Select product type</option>
                {productTypes
                  .filter((type) => allowedProductTypeIds.includes(type.id))
                  .map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
              </select>
              {editingProductId && originalVariantIds.length > 0 && <small className="admin-field-help">Locked because saved variants use this type's properties.</small>}
              {form.categoryId && allowedProductTypeIds.length === 0 && (
                <small className="admin-field-help admin-field-help-error">Assign at least one product type to this category before saving a product.</small>
              )}
            </div>
            <div className="form-group">
              <div className="admin-field-label-row"><label htmlFor="product-brand">Brand</label><Link to="/admin/brands">+ New brand</Link></div>
              <select id="product-brand" className="form-input" value={form.brandId} onChange={(event) => setField("brandId", event.target.value)}>
                <option value="">No brand</option>
                {brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
              </select>
              <small className="admin-field-help">Brands are global and optional; they do not depend on category or product type.</small>
            </div>
            <div className="product-summary-copy">
              <div className="form-group">
                <label htmlFor="short-description">Short description</label>
                <textarea id="short-description" className="form-input admin-textarea product-short-description" value={form.shortDescription} onChange={(event) => setField("shortDescription", event.target.value)} maxLength={500} placeholder="A short note shown near the product title" />
                <small className="admin-field-help">A quick customer-facing summary, up to 500 characters.</small>
              </div>
              <div className="form-group">
                <label htmlFor="description">Full description</label>
                <textarea id="description" className="form-input admin-textarea" value={form.description} onChange={(event) => setField("description", event.target.value)} placeholder="Describe the product, materials, features and care information" />
              </div>
            </div>
          </div>
        </section>

        <AdminVariantBuilder
          productTypeId={form.productTypeId}
          productName={form.name}
          defaultPrice={form.defaultPrice}
          defaultCostPrice={form.costPrice}
          variants={variantDrafts}
          onChange={setVariantDrafts}
          media={media}
          pendingMedia={pendingMedia}
          mediaBusyId={mediaBusyId}
          mediaCountForScope={mediaCountForScope}
          onAddMedia={(variantKey, files) => addPendingMedia(variantKey, files)}
          onDeleteMedia={(mediaId) => void deleteImage(mediaId)}
          onSetPrimaryMedia={(mediaId) => void setPrimaryImage(mediaId)}
          variantMediaEnabled={mediaScope === "individual"}
          onImportCsv={importVariantCsv}
          onExportCsv={exportVariantCsv}
          settingsPanel={(
            <>
              <div className="variant-settings-heading">
                <div><h3>Variant Settings</h3><p>Choose an independent scope for quantity pricing, discounts, and media.</p></div>
              </div>
              <section className="variant-policy-card">
                <div className="variant-policy-heading">
                  <div><strong>1. Quantity pricing</strong><small>Offer a lower unit price at selected quantities.</small></div>
                  <div className="variant-policy-scope">
                    <label><input type="radio" name="price-tier-scope" checked={priceTierScope === "all"} onChange={() => changePriceTierScope("all")} /> All variants</label>
                    <label><input type="radio" name="price-tier-scope" checked={priceTierScope === "individual"} onChange={() => changePriceTierScope("individual")} /> Individual SKU</label>
                  </div>
                </div>
                <AdminPriceTierBuilder variants={variantDrafts} tiers={priceTiers} onChange={setPriceTiers} scope={priceTierScope} />
              </section>

              <section className="variant-policy-card">
                <div className="variant-policy-heading">
                  <div><strong>2. Offer discount</strong><small>Use one product offer or configure each SKU separately.</small></div>
                  <div className="variant-policy-scope">
                    <label><input type="radio" name="discount-scope" checked={discountScope === "all"} onChange={() => changeDiscountScope("all")} /> All variants</label>
                    <label><input type="radio" name="discount-scope" checked={discountScope === "individual"} onChange={() => changeDiscountScope("individual")} /> Individual SKU</label>
                  </div>
                </div>
                {discountScope === "all" ? (
                  <div className="variant-policy-content">
                  <label className="variant-settings-toggle">
                    <input
                      type="checkbox"
                      checked={globalDiscountEnabled}
                      onChange={(event) => {
                        setGlobalDiscountEnabled(event.target.checked);
                        if (!event.target.checked) {
                          setField("discountPrice", "");
                          setField("discountStartsAt", "");
                          setField("discountEndsAt", "");
                        }
                      }}
                    />
                    <span><strong>Offer discount</strong><small>Apply the final sale price to every variant without its own offer.</small></span>
                  </label>
                  {globalDiscountEnabled && (
                    <div className="variant-settings-controls">
                      <label>Discount price
                        <input className="form-input" type="number" min="0" step="0.01" value={form.discountPrice} onChange={(event) => setField("discountPrice", event.target.value)} />
                      </label>
                      <label>Discount % off
                        <input
                          className="form-input"
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={globalDiscountPercentage}
                          placeholder="e.g. 30"
                          onChange={(event) => setField(
                            "discountPrice",
                            discountPriceFromPercentage(settingsRegularPrice, event.target.value),
                          )}
                        />
                      </label>
                      <label>Start date
                        <input className="form-input" type="datetime-local" value={form.discountStartsAt} onChange={(event) => setField("discountStartsAt", event.target.value)} />
                      </label>
                      <label>End date
                        <input className="form-input" type="datetime-local" value={form.discountEndsAt} onChange={(event) => setField("discountEndsAt", event.target.value)} />
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
                  <div><strong>3. Product media</strong><small>Use shared product media or enable separate uploads per SKU.</small></div>
                  <div className="variant-policy-scope">
                    <label><input type="radio" name="media-scope" checked={mediaScope === "all"} onChange={() => changeMediaScope("all")} /> All variants</label>
                    <label><input type="radio" name="media-scope" checked={mediaScope === "individual"} onChange={() => changeMediaScope("individual")} /> Individual SKU</label>
                  </div>
                </div>
                <div className="variant-policy-content variant-settings-help">
                  {mediaScope === "all"
                    ? "Upload shared product media in the Storefront settings panel. SKU-specific upload buttons are disabled."
                    : "Select an SKU and use Add media in the Selected Variant panel. Shared media can remain as a fallback."}
                  {mediaScope === "all" && media.some((item) => item.variantId !== null) && (
                    <small className="variant-policy-warning">Existing SKU-specific media is preserved. Reassign or delete it from the media library if you want a strictly shared gallery.</small>
                  )}
                </div>
              </section>
            </>
          )}
        />

        <details className="product-editor-panel product-details-panel">
          <summary>Storefront settings and product media</summary>
          <div className="product-details-grid">
            <div className="form-group">
              <label htmlFor="product-status">Default save status</label>
              <select id="product-status" className="form-input" value={form.status} onChange={(event) => setField("status", event.target.value as ProductFormState["status"])}>
                <option value="ACTIVE">Active</option><option value="DRAFT">Draft</option><option value="INACTIVE">Inactive</option><option value="DISCONTINUED">Discontinued</option>
              </select>
            </div>
            <label className="admin-checkbox">
              <input type="checkbox" checked={form.isFeatured} onChange={(event) => setField("isFeatured", event.target.checked)} />
              Feature this product on the storefront
            </label>
          </div>

          <div className="product-media-library">
            <div className="variant-workbench-heading"><div><h3>Product media library</h3><p>{mediaScope === "all" ? "New uploads are shared by all variants." : "Add SKU media from the Selected Variant panel; shared media remains available as fallback."}</p></div></div>
            {media.length > 0 && (
              <div className="admin-media-grid">
                {media.map((item) => (
                  <article className="admin-media-card" key={item.id}>
                    <div className="admin-media-image">
                      {item.type === "VIDEO" ? <video src={item.url} controls muted playsInline preload="metadata" /> : <img src={item.thumbnailUrl || item.url} alt={item.altText || form.name} />}
                      {item.isPrimary && <span className="admin-primary-badge"><Star size={13} /> Primary</span>}
                    </div>
                    <div className="admin-media-actions">
                      {editingProductId && (
                        <select className="form-input" aria-label={`Assign ${item.altText || "media"} to a variant`} value={item.variantId ?? ""} disabled={mediaBusyId === item.id} onChange={(event) => assignMediaToVariant(item.id, event.target.value)}>
                          <option value="">All variants</option>
                          {variantDrafts.filter((variant) => variant.id).map((variant) => <option key={variant.id} value={variant.id}>{variant.optionLabel || variant.sku}</option>)}
                        </select>
                      )}
                      {item.type === "IMAGE" && !item.isPrimary && <button type="button" onClick={() => setPrimaryImage(item.id)} disabled={mediaBusyId === item.id}><Star size={16} /> Primary</button>}
                      <button className="media-delete-button" type="button" onClick={() => deleteImage(item.id)} disabled={mediaBusyId === item.id}><Trash2 size={16} /> Delete</button>
                    </div>
                  </article>
                ))}
              </div>
            )}
            {pendingMedia.length > 0 && (
              <div className="pending-image-list">
                {pendingMedia.map((item) => (
                  <div key={item.key}>
                    <span>{item.file.name}</span>
                    {mediaScope === "all" ? <small>All variants</small> : (
                      <select className="form-input" aria-label={`Assign ${item.file.name} to a variant`} value={item.variantKey} onChange={(event) => movePendingMedia(item.key, event.target.value)}>
                        <option value="all">Shared fallback</option>
                        {variantDrafts.map((variant) => <option key={variant.key} value={variant.key}>{variant.optionLabel || variant.sku || "Default"}</option>)}
                      </select>
                    )}
                    <button type="button" aria-label={`Remove ${item.file.name}`} onClick={() => setPendingMedia((current) => current.filter((entry) => entry.key !== item.key))}><X size={15} /></button>
                  </div>
                ))}
              </div>
            )}
            {mediaScope === "all" && mediaCountForScope("all") < 4 ? (
              <label className="admin-image-picker">
                <ImagePlus size={22} /><span>Add shared media</span><small>JPEG, PNG, WebP up to 2 MB · MP4, WebM up to 20 MB · 4 shared items</small>
                <input type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" multiple onChange={handleImageSelection} />
              </label>
            ) : mediaScope === "all" ? (
              <p className="admin-media-limit">The four-item shared media limit has been reached.</p>
            ) : (
              <p className="admin-media-limit">Individual SKU uploads are available in the Selected Variant panel.</p>
            )}
          </div>
        </details>

        <div className="product-editor-bottom-actions">
          <button type="button" className="btn btn-ghost" onClick={closeEditor}><ArrowLeft size={16} /> Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={submitting || allowedProductTypeIds.length === 0}>
            {submitting ? "Saving product..." : editingProductId ? "Save changes" : "Create product"}
          </button>
        </div>
      </form>
    </div>
  );
};
```

### `web/src/pages/dashboard/AdminVariantBuilder.tsx`

Source lines: 769

```tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Download,
  GitBranch,
  ImagePlus,
  Layers3,
  Package,
  Pencil,
  Plus,
  SlidersHorizontal,
  Star,
  Trash2,
  Upload,
} from "lucide-react";
import { Link } from "react-router-dom";

import { ProductTypeAttributeAssignment, adminCatalogApi } from "../../api/adminCatalog";
import { ApiException } from "../../api/client";
import type { ProductMedia } from "../../api/products";
import {
  discountPercentageFromPrice,
  discountPriceFromPercentage,
} from "./discountDraft";
import {
  SKIP_OPTION_VALUE,
  analyzeVariantPathRemoval,
  buildVariantPathTree,
  changeVariantPathSelection,
  clearDeepestVariantPathChoice,
  selectedVariantPathIds,
  variantPathSignature,
} from "./variantPaths";

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

export interface VariantPendingMedia {
  key: string;
  file: File;
  variantKey: "all" | string;
}

interface Props {
  productTypeId: string;
  productName: string;
  defaultPrice: string;
  defaultCostPrice: string;
  variants: VariantDraft[];
  onChange: (variants: VariantDraft[]) => void;
  settingsPanel?: React.ReactNode;
  media?: ProductMedia[];
  pendingMedia?: VariantPendingMedia[];
  mediaBusyId?: string | null;
  mediaLimitReached?: boolean;
  mediaCountForScope?: (variantKey: string) => number;
  onAddMedia?: (variantKey: string, files: File[]) => void;
  onDeleteMedia?: (mediaId: string) => void;
  onSetPrimaryMedia?: (mediaId: string) => void;
  variantMediaEnabled?: boolean;
  onImportCsv?: (file: File) => Promise<void> | void;
  onExportCsv?: () => void;
}

type BulkField = "price" | "discountPrice" | "costPrice" | "stockQuantity" |
  "lowStockLevel" | "isActive";

const skuPart = (value: string) =>
  value.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "");

const valueCode = (value: string) =>
  value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export const AdminVariantBuilder: React.FC<Props> = ({
  productTypeId,
  productName,
  defaultPrice,
  defaultCostPrice,
  variants,
  onChange,
  settingsPanel,
  media = [],
  pendingMedia = [],
  mediaBusyId = null,
  mediaLimitReached = false,
  mediaCountForScope,
  onAddMedia,
  onDeleteMedia,
  onSetPrimaryMedia,
  variantMediaEnabled = true,
  onImportCsv,
  onExportCsv,
}) => {
  const [assignments, setAssignments] = useState<ProductTypeAttributeAssignment[]>([]);
  const [pathSelection, setPathSelection] = useState<Record<string, string>>({});
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [focusedVariantKey, setFocusedVariantKey] = useState<string>("");
  const [newValueLabels, setNewValueLabels] = useState<Record<string, string>>({});
  const [addingValueFor, setAddingValueFor] = useState<string | null>(null);
  const [bulkField, setBulkField] = useState<BulkField>("price");
  const [bulkValue, setBulkValue] = useState("");
  const [bulkOpen, setBulkOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const csvInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!productTypeId) {
      setAssignments([]);
      setPathSelection({});
      return;
    }

    setLoading(true);
    setError("");
    adminCatalogApi.getProductTypeAttributes(productTypeId)
      .then((items) => {
        const activeItems = items
          .filter((item) => item.attribute.isActive && !item.attribute.deletedAt)
          .sort((left, right) => left.sortOrder - right.sortOrder);
        setAssignments(activeItems);
        const seedVariant = variants.find((variant) => variant.isDefault) ?? variants[0];
        const fromExisting: Record<string, string> = {};
        for (const item of activeItems) {
          const usedValueId = seedVariant?.optionValueIds.find((id) =>
            item.attribute.values.some((value) => value.id === id),
          );
          if (usedValueId) fromExisting[item.attributeId] = usedValueId;
          else if (!item.isRequired && seedVariant?.optionValueIds.length) {
            fromExisting[item.attributeId] = SKIP_OPTION_VALUE;
          }
        }
        setPathSelection(fromExisting);
      })
      .catch((requestError) => setError(
        requestError instanceof ApiException
          ? requestError.error.message
          : "Could not load product attributes.",
      ))
      .finally(() => setLoading(false));
    // Existing variants seed selection only when the product type changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productTypeId]);

  useEffect(() => {
    setSelectedRows((current) =>
      current.filter((key) => variants.some((variant) => variant.key === key)),
    );
    if (!variants.some((variant) => variant.key === focusedVariantKey)) {
      setFocusedVariantKey(
        variants.find((variant) => variant.isDefault)?.key ?? variants[0]?.key ?? "",
      );
    }
  }, [focusedVariantKey, variants]);

  const valuesById = useMemo(
    () => new Map(assignments.flatMap((item) =>
      item.attribute.values.map((value) => [value.id, value] as const),
    )),
    [assignments],
  );
  const variantPathTree = useMemo(
    () => buildVariantPathTree(assignments, variants),
    [assignments, variants],
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
  const exactPathCount = variants.filter((variant) => variant.optionValueIds.length > 0).length;
  const focusedVariant = variants.find((variant) => variant.key === focusedVariantKey) ?? null;
  const focusedMedia = media.filter((item) =>
    item.variantId === (focusedVariant?.id ?? "__new_variant__") || item.variantId === null,
  );
  const focusedPendingMedia = pendingMedia.filter((item) =>
    item.variantKey === focusedVariantKey || item.variantKey === "all",
  );
  const focusedPreviewMedia = focusedMedia.find((item) =>
    item.type === "IMAGE" && item.variantId === focusedVariant?.id && item.isPrimary,
  ) ?? focusedMedia.find((item) =>
    item.type === "IMAGE" && item.variantId === focusedVariant?.id,
  ) ?? focusedMedia.find((item) =>
    item.type === "IMAGE" && item.variantId === null && item.isPrimary,
  ) ?? focusedMedia.find((item) => item.type === "IMAGE");
  const focusedMediaLimitReached = mediaLimitReached || (
    focusedVariant ? (mediaCountForScope?.(focusedVariant.key) ?? 0) >= 4 : false
  );
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
    setError("");
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
      setPathSelection((current) =>
        changeVariantPathSelection(
          assignments,
          current,
          assignment.attributeId,
          created.id,
        ),
      );
      setNewValueLabels((current) => ({ ...current, [assignment.attributeId]: "" }));
    } catch (requestError) {
      setError(requestError instanceof ApiException
        ? requestError.error.message
        : `Could not add ${label}.`);
    } finally {
      setAddingValueFor(null);
    }
  };

  const addExactVariantPath = () => {
    const undecided = assignments.find((assignment) =>
      !Object.hasOwn(pathSelection, assignment.attributeId),
    );
    if (undecided) {
      setError(`Choose a ${undecided.attribute.name} value${undecided.isRequired ? "" : " or select Not used"}.`);
      return;
    }
    const skippedRequired = assignments.find((assignment) =>
      assignment.isRequired && pathSelection[assignment.attributeId] === SKIP_OPTION_VALUE,
    );
    if (skippedRequired) {
      setError(`${skippedRequired.attribute.name} is required for every variant.`);
      return;
    }
    const optionValueIds = selectedVariantPathIds(assignments, pathSelection);
    if (optionValueIds.length === 0) {
      setError("Choose at least one attribute value for this variant.");
      return;
    }
    const baseVariants = variants.filter((variant) => !(
      !variant.id &&
      variant.optionValueIds.length === 0 &&
      !variant.sku.trim() &&
      Number(variant.stockQuantity) === 0
    ));
    const combinationSignature = variantPathSignature(optionValueIds);
    const existingSignatures = new Set(
      baseVariants.map((variant) => variantPathSignature(variant.optionValueIds)),
    );
    if (existingSignatures.has(combinationSignature)) {
      setError("This exact variant path already exists. Choose a different child value.");
      return;
    }
    if (baseVariants.length >= 200) {
      setError("A product can contain at most 200 exact variant paths.");
      return;
    }
    const baseSku = skuPart(productName) || "PRODUCT";
    const labels = optionValueIds.map((id) => valuesById.get(id)?.label ?? id);
    const codes = optionValueIds.map((id) => valuesById.get(id)?.code ?? id);
    const created: VariantDraft = {
      key: `new-${combinationSignature}-${Date.now()}`,
      optionValueIds,
      optionLabel: labels.join(" / "),
      sku: [baseSku, ...codes.map(skuPart)].filter(Boolean).join("-").slice(0, 100),
      barcode: "",
      price: defaultPrice,
      discountPrice: "",
      discountStartsAt: "",
      discountEndsAt: "",
      costPrice: defaultCostPrice,
      stockQuantity: "0",
      lowStockLevel: "5",
      isDefault: baseVariants.length === 0,
      isActive: true,
    };

    onChange([...baseVariants, created]);
    setFocusedVariantKey(created.key);
    setPathSelection((current) => clearDeepestVariantPathChoice(assignments, current));
    setError("");
  };

  const update = (key: string, change: Partial<VariantDraft>) => {
    onChange(variants.map((variant) => {
      if (change.isDefault === true) {
        return { ...variant, isDefault: variant.key === key };
      }
      return variant.key === key ? { ...variant, ...change } : variant;
    }));
  };

  const remove = (key: string) => {
    const target = variants.find((variant) => variant.key === key);
    if (target && Number(target.stockQuantity) > 0) {
      setError(`Set ${target.optionLabel || target.sku}'s stock to zero before removing it.`);
      return;
    }
    const next = variants.filter((variant) => variant.key !== key);
    if (next.length && !next.some((variant) => variant.isDefault)) {
      next[0] = { ...next[0], isDefault: true };
    }
    onChange(next);
    setError("");
  };

  const removePathBranch = (node: (typeof variantPathTree)[number]) => {
    const { affected, stocked } = analyzeVariantPathRemoval(node.variantKeys, variants);
    if (affected.length === 0) return;
    if (stocked.length > 0) {
      const preview = stocked.slice(0, 3)
        .map((variant) => variant.optionLabel || variant.sku)
        .join(", ");
      setError(
        `Cannot remove ${node.label}. ${stocked.length} affected SKU${stocked.length === 1 ? " has" : "s have"} stock: ${preview}${stocked.length > 3 ? ` and ${stocked.length - 3} more` : ""}. Set all affected stock to zero first.`,
      );
      return;
    }

    const savedCount = affected.filter((variant) => variant.id).length;
    const confirmed = window.confirm(
      `Remove ${node.label} and ${affected.length} affected SKU path${affected.length === 1 ? "" : "s"}?${savedCount ? " Saved SKUs will be deleted when you save the product." : ""}`,
    );
    if (!confirmed) return;

    const removedKeys = new Set(affected.map((variant) => variant.key));
    const next = variants.filter((variant) => !removedKeys.has(variant.key));
    if (next.length > 0 && !next.some((variant) => variant.isDefault)) {
      next[0] = { ...next[0], isDefault: true };
    }
    onChange(next);
    setError("");
  };

  const toggleRow = (key: string) => {
    setSelectedRows((current) => current.includes(key)
      ? current.filter((item) => item !== key)
      : [...current, key]);
  };

  const toggleAllRows = () => {
    setSelectedRows(selectedRows.length === variants.length
      ? []
      : variants.map((variant) => variant.key));
  };

  const applyBulkValue = () => {
    if (selectedRows.length === 0) {
      setError("Select at least one variant row for the bulk operation.");
      return;
    }
    if (bulkValue === "") {
      setError(bulkField === "isActive"
        ? "Choose the active status you want to apply."
        : "Enter the value you want to apply.");
      return;
    }
    onChange(variants.map((variant) => {
      if (!selectedRows.includes(variant.key)) return variant;
      return bulkField === "isActive"
        ? { ...variant, isActive: bulkValue === "true" }
        : { ...variant, [bulkField]: bulkValue };
    }));
    setError("");
  };

  const valueForAssignment = (variant: VariantDraft, assignment: ProductTypeAttributeAssignment) => {
    return assignment.attribute.values.find((item) => variant.optionValueIds.includes(item.id)) ?? null;
  };

  const renderPathTree = (nodes: typeof variantPathTree, depth = 0): React.ReactNode => (
    <ul className={`variant-path-tree-level depth-${depth}`}>
      {nodes.map((node) => {
        const leafVariantKey = node.terminalVariantKeys[0] ?? null;
        return (
          <li key={`${node.attributeId}-${node.valueId}`}>
            <div className="variant-path-tree-node">
              <button
                type="button"
                className={`variant-path-node-select${leafVariantKey === focusedVariantKey ? " is-selected" : ""}`}
                onClick={() => {
                  if (leafVariantKey) setFocusedVariantKey(leafVariantKey);
                }}
                disabled={!leafVariantKey}
              >
                <small>{node.attributeName}</small>
                <span>{node.colorHex && <i style={{ backgroundColor: node.colorHex }} />}{node.label}</span>
                {leafVariantKey && <em>SKU</em>}
              </button>
              <button
                type="button"
                className="variant-path-branch-remove"
                onClick={() => removePathBranch(node)}
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
    <section className="admin-variant-builder admin-field-wide" aria-label="Product options and variants">
      <div className="variant-config-grid">
        <section className="variant-options-panel" aria-label="Variant options">
          <div className="variant-workbench-heading">
            <div>
              <h3>Product-specific variant paths</h3>
              <p>Build one valid parent-to-child path at a time. No unwanted combinations are generated.</p>
            </div>
            <Link className="admin-view-link" to="/admin/attributes"><Plus size={15} /> Add attribute</Link>
          </div>

          {loading ? <p>Loading product attributes...</p> : assignments.length === 0 ? (
            <div className="admin-variant-empty">
              <Layers3 size={24} />
              <div>
                <strong>This product type has no properties yet.</strong>
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
                {assignments.map((assignment, assignmentIndex) => {
                  const canChoose = assignments.slice(0, assignmentIndex).every((parent) =>
                    Object.hasOwn(pathSelection, parent.attributeId),
                  );
                  const selectedValueId = pathSelection[assignment.attributeId];
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
                              onChange={() => choosePathValue(assignment.attributeId, value.id)}
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
                            onChange={() => choosePathValue(assignment.attributeId, SKIP_OPTION_VALUE)}
                          />
                          Not used for this SKU
                        </label>
                      )}
                    </div>
                    <div className="variant-inline-add">
                      <input
                        className="form-input"
                        value={newValueLabels[assignment.attributeId] ?? ""}
                        placeholder={`Add new ${assignment.attribute.name.toLowerCase()}`}
                        onChange={(event) => setNewValueLabels((current) => ({ ...current, [assignment.attributeId]: event.target.value }))}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            void addSuggestedValue(assignment);
                          }
                        }}
                      />
                      <button type="button" className="btn btn-ghost" disabled={addingValueFor === assignment.attributeId} onClick={() => void addSuggestedValue(assignment)}>
                        <Plus size={15} /> {addingValueFor === assignment.attributeId ? "Adding..." : "Add"}
                      </button>
                    </div>
                  </fieldset>
                  );
                })}
              </div>
              <div className="variant-path-create-bar">
                <div>
                  <small>Exact SKU path</small>
                  <strong>{currentPathLabels.length ? currentPathLabels.join(" → ") : "Choose the first property"}</strong>
                </div>
                <button type="button" className="btn btn-primary" onClick={addExactVariantPath} disabled={!pathIsComplete}>
                  <Plus size={17} /> Add exact SKU
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setPathSelection({})} disabled={currentPathLabels.length === 0}>
                  Clear path
                </button>
              </div>
              {variantPathTree.length > 0 && (
                <div className="variant-path-tree">
                  <div><GitBranch size={17} /><strong>Current product tree</strong><small>{exactPathCount} exact SKU path{exactPathCount === 1 ? "" : "s"}</small></div>
                  {renderPathTree(variantPathTree)}
                </div>
              )}
            </>
          )}
        </section>

        <aside className="variant-settings-panel" aria-label="Variant settings">
          {settingsPanel}
        </aside>
      </div>

      {error && <p className="admin-variant-error" role="alert">{error}</p>}

      {focusedVariant && (
        <section className="selected-variant-card" aria-label={`Selected variant ${focusedVariant.optionLabel || focusedVariant.sku}`}>
          <div className="selected-variant-heading">
            <div>
              <span>Selected variant</span>
              <h3>{focusedVariant.optionLabel || "Default"}</h3>
            </div>
            <span className={`variant-status-pill${focusedVariant.isActive ? " is-active" : ""}`}>
              {focusedVariant.isActive ? "Active" : "Inactive"}
            </span>
          </div>

          <div className="selected-variant-grid">
            <div className="selected-variant-media">
              <div className="selected-variant-preview">
                {focusedPreviewMedia ? (
                  <img
                    src={focusedPreviewMedia.thumbnailUrl || focusedPreviewMedia.url}
                    alt={focusedVariant.optionLabel || focusedVariant.sku}
                  />
                ) : <Package size={34} />}
              </div>
              <label className={`btn btn-ghost variant-media-button${focusedMediaLimitReached || !variantMediaEnabled ? " is-disabled" : ""}`}>
                <ImagePlus size={15} /> Add media
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
                  multiple
                  disabled={focusedMediaLimitReached || !onAddMedia || !variantMediaEnabled}
                  onChange={(event) => {
                    const files = Array.from(event.target.files ?? []);
                    event.target.value = "";
                    if (files.length) onAddMedia?.(focusedVariant.key, files);
                  }}
                />
              </label>
              {!variantMediaEnabled && <small className="variant-media-scope-note">Media is currently set to All variants. Change the media scope to Individual SKU to upload here.</small>}
            </div>

            <label>SKU <span>*</span>
              <input className="form-input" value={focusedVariant.sku} required maxLength={100} onChange={(event) => update(focusedVariant.key, { sku: event.target.value.toUpperCase() })} />
            </label>
            <label>Barcode / GTIN
              <input className="form-input" value={focusedVariant.barcode} maxLength={100} placeholder="Enter barcode" onChange={(event) => update(focusedVariant.key, { barcode: event.target.value })} />
            </label>
            <label>Selling price <span>*</span>
              <input className="form-input" type="number" min="0" step="0.01" value={focusedVariant.price} required onChange={(event) => update(focusedVariant.key, { price: event.target.value })} />
            </label>
            <label>Cost price
              <input className="form-input" type="number" min="0" step="0.01" value={focusedVariant.costPrice} onChange={(event) => update(focusedVariant.key, { costPrice: event.target.value })} />
            </label>
            <label>Discount price
              <input className="form-input" type="number" min="0" step="0.01" value={focusedVariant.discountPrice} onChange={(event) => update(focusedVariant.key, { discountPrice: event.target.value })} />
            </label>
            <label>Discount % off
              <input
                className="form-input"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={focusedDiscountPercentage}
                placeholder="e.g. 30"
                onChange={(event) => update(focusedVariant.key, {
                  discountPrice: discountPriceFromPercentage(
                    focusedVariant.price,
                    event.target.value,
                  ),
                })}
              />
            </label>
            <label>Stock quantity <span>*</span>
              <input className="form-input" type="number" min="0" step="1" value={focusedVariant.stockQuantity} required onChange={(event) => update(focusedVariant.key, { stockQuantity: event.target.value })} />
            </label>
            <label>Low-stock warning
              <input className="form-input" type="number" min="0" step="1" value={focusedVariant.lowStockLevel} onChange={(event) => update(focusedVariant.key, { lowStockLevel: event.target.value })} />
            </label>
            <label>Status
              <select className="form-input" value={focusedVariant.isActive ? "active" : "inactive"} onChange={(event) => update(focusedVariant.key, { isActive: event.target.value === "active" })}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
            <fieldset className="variant-default-choice">
              <legend>Default selection</legend>
              <label><input type="radio" name="selected-default-variant" checked={focusedVariant.isDefault} onChange={() => update(focusedVariant.key, { isDefault: true })} /> Yes</label>
              <label><input type="radio" name="selected-default-variant" checked={!focusedVariant.isDefault} readOnly /> No</label>
            </fieldset>

            {focusedVariant.discountPrice && (
              <fieldset className="variant-discount-schedule">
                <legend>Individual offer schedule</legend>
                <label>Starts<input className="form-input" type="datetime-local" value={focusedVariant.discountStartsAt} onChange={(event) => update(focusedVariant.key, { discountStartsAt: event.target.value })} /></label>
                <label>Ends<input className="form-input" type="datetime-local" value={focusedVariant.discountEndsAt} onChange={(event) => update(focusedVariant.key, { discountEndsAt: event.target.value })} /></label>
              </fieldset>
            )}
          </div>

          {(focusedMedia.length > 0 || focusedPendingMedia.length > 0) && (
            <div className="selected-variant-media-list">
              {focusedMedia.map((item) => (
                <div key={item.id}>
                  {item.type === "IMAGE" ? <img src={item.thumbnailUrl || item.url} alt={item.altText || focusedVariant.optionLabel} /> : <video src={item.url} muted preload="metadata" />}
                  <span>{item.variantId ? "This variant" : "Shared"}</span>
                  {item.type === "IMAGE" && !item.isPrimary && <button type="button" disabled={mediaBusyId === item.id} onClick={() => onSetPrimaryMedia?.(item.id)} aria-label="Set media as primary"><Star size={14} /></button>}
                  {item.variantId && <button type="button" disabled={mediaBusyId === item.id} onClick={() => onDeleteMedia?.(item.id)} aria-label="Delete variant media"><Trash2 size={14} /></button>}
                </div>
              ))}
              {focusedPendingMedia.map((item) => <div key={item.key} className="is-pending"><Package size={22} /><span>{item.file.name}</span></div>)}
            </div>
          )}
        </section>
      )}

      {variants.length > 0 && (
        <section className="variant-table-panel" aria-label="All variant combinations">
          <div className="variant-table-toolbar">
            <div><h3>All Variant Combinations ({variants.length})</h3><span>Select a row to edit it above.</span></div>
            <div className="variant-table-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setBulkOpen((open) => !open)}><SlidersHorizontal size={15} /> Bulk edit</button>
              {onImportCsv && <button type="button" className="btn btn-ghost" onClick={() => csvInputRef.current?.click()}><Upload size={15} /> Import CSV</button>}
              {onExportCsv && <button type="button" className="btn btn-ghost" onClick={onExportCsv}><Download size={15} /> Export CSV</button>}
              <input
                ref={csvInputRef}
                className="sr-only"
                type="file"
                accept=".csv,text/csv"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (file) void onImportCsv?.(file);
                }}
              />
            </div>
          </div>

          {bulkOpen && (
            <div className="variant-bulk-panel" aria-label="Bulk edit selected variants">
              <div><strong>Bulk edit</strong><span>{selectedRows.length} of {variants.length} selected</span></div>
              <select
                className="form-input"
                value={bulkField}
                onChange={(event) => {
                  setBulkField(event.target.value as BulkField);
                  setBulkValue("");
                }}
              >
                <option value="price">Selling price</option>
                <option value="discountPrice">Discount price</option>
                <option value="costPrice">Cost price</option>
                <option value="stockQuantity">Stock quantity</option>
                <option value="lowStockLevel">Low-stock warning</option>
                <option value="isActive">Active status</option>
              </select>
              {bulkField === "isActive" ? (
                <select className="form-input" value={bulkValue} onChange={(event) => setBulkValue(event.target.value)}>
                  <option value="">Choose status</option><option value="true">Active</option><option value="false">Inactive</option>
                </select>
              ) : (
                <input className="form-input" type="number" min="0" step={bulkField === "stockQuantity" || bulkField === "lowStockLevel" ? "1" : "0.01"} value={bulkValue} placeholder="Value" onChange={(event) => setBulkValue(event.target.value)} />
              )}
              <button type="button" className="btn btn-primary" onClick={applyBulkValue}>Apply to selected</button>
            </div>
          )}

          <div className="variant-summary-scroll">
            <table className="variant-summary-table">
              <thead><tr>
                <th><input type="checkbox" aria-label="Select all variants" checked={selectedRows.length === variants.length} onChange={toggleAllRows} /></th>
                <th>Variant</th>
                {assignments.map((assignment) => <th key={assignment.attributeId}>{assignment.attribute.name}</th>)}
                <th>SKU</th><th>Selling price</th><th>Cost</th><th>Discount</th><th>Stock</th><th>Status</th><th>Default</th><th>Actions</th>
              </tr></thead>
              <tbody>{variants.map((variant) => (
                <tr key={variant.key} className={variant.key === focusedVariantKey ? "is-selected" : ""} onClick={() => setFocusedVariantKey(variant.key)}>
                  <td onClick={(event) => event.stopPropagation()}><input type="checkbox" aria-label={`Select ${variant.optionLabel || variant.sku}`} checked={selectedRows.includes(variant.key)} onChange={() => toggleRow(variant.key)} /></td>
                  <td><strong>{variant.optionLabel || "Default"}</strong>{variant.id ? <small>Saved</small> : <small>New</small>}</td>
                  {assignments.map((assignment) => {
                    const value = valueForAssignment(variant, assignment);
                    return <td key={assignment.attributeId}>{value?.colorHex && <i className="variant-color-dot" style={{ backgroundColor: value.colorHex }} />}{value?.label ?? "—"}</td>;
                  })}
                  <td className="variant-sku-cell">{variant.sku || "—"}</td>
                  <td>৳ {variant.price || "0"}</td>
                  <td>{variant.costPrice ? `৳ ${variant.costPrice}` : "—"}</td>
                  <td>{variant.discountPrice ? `৳ ${variant.discountPrice}` : "—"}</td>
                  <td>{variant.stockQuantity}</td>
                  <td><span className={`variant-status-dot${variant.isActive ? " is-active" : ""}`} />{variant.isActive ? "Active" : "Inactive"}</td>
                  <td><input type="radio" name="variant-default-table" aria-label={`Make ${variant.optionLabel || variant.sku} default`} checked={variant.isDefault} onClick={(event) => event.stopPropagation()} onChange={() => update(variant.key, { isDefault: true })} /></td>
                  <td className="variant-row-actions" onClick={(event) => event.stopPropagation()}>
                    <button type="button" onClick={() => setFocusedVariantKey(variant.key)} aria-label={`Edit ${variant.optionLabel || variant.sku}`}><Pencil size={14} /></button>
                    <button type="button" onClick={() => remove(variant.key)} aria-label={`Remove ${variant.optionLabel || "variant"}`}><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>

          <div className="variant-mobile-list">
            {variants.map((variant) => (
              <article key={variant.key} className={`variant-mobile-card${variant.key === focusedVariantKey ? " is-selected" : ""}`} onClick={() => setFocusedVariantKey(variant.key)}>
                <div><strong>{variant.optionLabel || "Default"}</strong><span>{variant.sku || "SKU required"}</span></div>
                <dl><div><dt>Price</dt><dd>৳ {variant.price || "0"}</dd></div><div><dt>Stock</dt><dd>{variant.stockQuantity}</dd></div><div><dt>Status</dt><dd>{variant.isActive ? "Active" : "Inactive"}</dd></div></dl>
                <button type="button" onClick={(event) => { event.stopPropagation(); remove(variant.key); }} aria-label={`Remove ${variant.optionLabel || "variant"}`}><Trash2 size={15} /></button>
              </article>
            ))}
          </div>
          <p className="variant-table-note">Saved variants keep their database ID. Set stock to zero before removing a saved combination.</p>
        </section>
      )}
    </section>
  );
};
```

### `web/src/pages/dashboard/AdminPriceTierBuilder.tsx`

Source lines: 88

```tsx
import React from "react";
import { Plus, Trash2 } from "lucide-react";

import type { VariantDraft } from "./AdminVariantBuilder";

export interface PriceTierDraft {
  key: string;
  variantKey: "all" | string;
  minimumQuantity: string;
  unitPrice: string;
  isPromotion: boolean;
  isActive: boolean;
}

interface Props {
  variants: VariantDraft[];
  tiers: PriceTierDraft[];
  onChange: (tiers: PriceTierDraft[]) => void;
  scope: "all" | "individual";
}

export const AdminPriceTierBuilder: React.FC<Props> = ({ variants, tiers, onChange, scope }) => {
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
                <td>
                  {scope === "all" ? <strong>All variants</strong> : (
                    <select className="form-input" value={tier.variantKey} onChange={(event) => update(tier.key, { variantKey: event.target.value })}>
                      {variants.map((variant) => <option key={variant.key} value={variant.key}>{variant.optionLabel || variant.sku || "Default"}</option>)}
                    </select>
                  )}
                </td>
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
```

### `web/src/pages/dashboard/discountDraft.ts`

Source lines: 29

```ts
export function discountPercentageFromPrice(
  regularPrice: string | number,
  discountPrice: string | number,
) {
  const regular = Number(regularPrice);
  const discount = Number(discountPrice);
  if (!Number.isFinite(regular) || regular <= 0 || !Number.isFinite(discount)) return "";
  const percentage = ((regular - discount) / regular) * 100;
  if (percentage < 0 || percentage > 100) return "";
  return percentage.toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
}

export function discountPriceFromPercentage(
  regularPrice: string | number,
  percentageValue: string,
) {
  if (percentageValue.trim() === "") return "";
  const regular = Number(regularPrice);
  const percentage = Number(percentageValue);
  if (
    !Number.isFinite(regular) ||
    regular < 0 ||
    !Number.isFinite(percentage) ||
    percentage < 0 ||
    percentage > 100
  ) return "";
  return (regular * (1 - percentage / 100)).toFixed(2);
}
```

### `web/src/pages/dashboard/variantCsv.ts`

Source lines: 393

```ts
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
```

### `web/src/pages/dashboard/variantPaths.ts`

Source lines: 130

```ts
import type { ProductTypeAttributeAssignment } from "../../api/adminCatalog";

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
```

## Frontend API and product types

### `web/src/api/adminProducts.ts`

Source lines: 165

```ts
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
```

### `web/src/api/adminCatalog.ts`

Source lines: 243

```ts
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
```

### `web/src/api/products.ts`

Source lines: 173

```ts
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
```

### `web/src/api/client.ts`

Source lines: 93

```ts
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
```

## Frontend product-editor styling

### `web/src/styles/features/product-editor.css`

Source lines: 1240

```css
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
```

### `web/src/styles/features/admin.css`

Source lines: 965

```css
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
```

## Frontend workflow tests

### `web/src/api/adminProducts.test.ts`

Source lines: 34

```ts
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
```

### `web/src/pages/dashboard/discountDraft.test.ts`

Source lines: 22

```ts
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
```

### `web/src/pages/dashboard/variantCsv.test.ts`

Source lines: 144

```ts
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
```

### `web/src/pages/dashboard/variantPaths.test.ts`

Source lines: 116

```ts
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
```

## Backend route registration and product endpoints

### `DokanBDbackend/src/routes/v1.ts`

Source lines: 50

```ts
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
```

### `DokanBDbackend/src/modules/products/product.routes.ts`

Source lines: 83

```ts
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
```

### `DokanBDbackend/src/modules/products/product.controller.ts`

Source lines: 202

```ts
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
```

### `DokanBDbackend/src/modules/products/product.schema.ts`

Source lines: 265

```ts
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
```

### `DokanBDbackend/src/modules/products/product.service.ts`

Source lines: 1397

```ts
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
```

## Backend product entities and supporting services

### `DokanBDbackend/src/modules/products/product.entity.ts`

Source lines: 87

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
```

### `DokanBDbackend/src/modules/products/product-variant.entity.ts`

Source lines: 97

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
```

### `DokanBDbackend/src/modules/products/product-media.entity.ts`

Source lines: 53

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

### `DokanBDbackend/src/modules/products/product-price-tier.entity.ts`

Source lines: 51

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
```

### `DokanBDbackend/src/modules/products/product-media.service.ts`

Source lines: 220

```ts
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
```

### `DokanBDbackend/src/modules/products/product-media-upload.middleware.ts`

Source lines: 42

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
```

### `DokanBDbackend/src/modules/products/product-price-tier.service.ts`

Source lines: 76

```ts
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
```

### `DokanBDbackend/src/modules/products/product-pricing.ts`

Source lines: 92

```ts
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
```

## Backend product attributes and variant combinations

### `DokanBDbackend/src/modules/attributes/product-attribute.routes.ts`

Source lines: 27

```ts
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
```

### `DokanBDbackend/src/modules/attributes/product-attribute.controller.ts`

Source lines: 71

```ts
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
```

### `DokanBDbackend/src/modules/attributes/product-attribute.schema.ts`

Source lines: 93

```ts
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
```

### `DokanBDbackend/src/modules/attributes/product-attribute.service.ts`

Source lines: 335

```ts
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
```

### `DokanBDbackend/src/modules/attributes/product-attribute.entity.ts`

Source lines: 36

```ts
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
```

### `DokanBDbackend/src/modules/attributes/product-attribute-value.entity.ts`

Source lines: 52

```ts
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
```

### `DokanBDbackend/src/modules/attributes/product-type-attribute.entity.ts`

Source lines: 28

```ts
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
```

### `DokanBDbackend/src/modules/attributes/product-variant-attribute-value.entity.ts`

Source lines: 22

```ts
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
```

## Backend catalog relationships used during product validation

### `DokanBDbackend/src/modules/categories/category-product-type.entity.ts`

Source lines: 25

```ts
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
```

### `DokanBDbackend/src/modules/categories/category.entity.ts`

Source lines: 57

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
```

### `DokanBDbackend/src/modules/brands/brand.entity.ts`

Source lines: 39

```ts
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
```

### `DokanBDbackend/src/modules/product-types/product-type.entity.ts`

Source lines: 36

```ts
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
```

### `DokanBDbackend/src/modules/inventory/inventory-movement.entity.ts`

Source lines: 56

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

## Database migrations for products, variants, and pricing

### `DokanBDbackend/src/database/migrations/1791108013191-InitialSchema.ts`

Source lines: 627

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

### `DokanBDbackend/src/database/migrations/1791270000000-AdminCatalogManagement.ts`

Source lines: 25

```ts
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
```

### `DokanBDbackend/src/database/migrations/1791271000000-ProductTypeManagement.ts`

Source lines: 14

```ts
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
```

### `DokanBDbackend/src/database/migrations/1791620000000-ProductAttributesAndVariants.ts`

Source lines: 104

```ts
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
```

### `DokanBDbackend/src/database/migrations/1791790000000-ProductWorkbenchPricing.ts`

Source lines: 41

```ts
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
```

### `DokanBDbackend/src/database/migrations/1791791000000-ProductVariantDimensions.ts`

Source lines: 30

```ts
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
```

### `DokanBDbackend/src/database/migrations/1791870000000-CatalogRelationshipAssignments.ts`

Source lines: 60

```ts
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
```

### `DokanBDbackend/src/database/migrations/1792040000000-CategoryHierarchyAndGlobalBrands.ts`

Source lines: 51

```ts
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
```

## Backend workflow tests

### `DokanBDbackend/src/modules/products/product.schema.test.ts`

Source lines: 161

```ts
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
```

### `DokanBDbackend/src/modules/products/product-pricing.test.ts`

Source lines: 110

```ts
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
```

### `DokanBDbackend/src/modules/products/product-category-hierarchy.test.ts`

Source lines: 22

```ts
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
```

### `DokanBDbackend/src/modules/attributes/product-attribute.schema.test.ts`

Source lines: 30

```ts
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
```

### `DokanBDbackend/src/modules/attributes/product-attribute.service.test.ts`

Source lines: 24

```ts
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
```

### `DokanBDbackend/src/modules/product-types/product-type.schema.test.ts`

Source lines: 14

```ts
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
```
