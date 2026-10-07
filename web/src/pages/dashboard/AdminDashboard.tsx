import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  ExternalLink,
  ImagePlus,
  Package,
  Pencil,
  Plus,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";

import {
  AdminProduct,
  adminProductApi,
  CategoryOption,
} from "../../api/adminProducts";
import { ApiException } from "../../api/client";
import type { ProductMedia, ProductTaxonomy } from "../../api/products";
import { useAuth } from "../../features/auth/AuthContext";

interface ProductFormState {
  name: string;
  shortDescription: string;
  description: string;
  productTypeId: string;
  categoryId: string;
  brandId: string;
  defaultPrice: string;
  discountPrice: string;
  costPrice: string;
  sku: string;
  variantName: string;
  color: string;
  size: string;
  stockQuantity: string;
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
  costPrice: "",
  sku: "",
  variantName: "Default",
  color: "",
  size: "",
  stockQuantity: "0",
  status: "ACTIVE",
  isFeatured: false,
};

const flattenCategories = (items: CategoryOption[]): CategoryOption[] =>
  items.flatMap((item) => [item, ...flattenCategories(item.children)]);

const uniqueTaxonomies = (items: Array<ProductTaxonomy | null>) =>
  Array.from(
    new Map(
      items.filter((item): item is ProductTaxonomy => item !== null).map((item) => [item.id, item]),
    ).values(),
  ).sort((left, right) => left.name.localeCompare(right.name));

const priceFormatter = new Intl.NumberFormat("en-BD", {
  style: "currency",
  currency: "BDT",
  minimumFractionDigits: 0,
});

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);
  const [loadingEditorId, setLoadingEditorId] = useState<string | null>(null);
  const [media, setMedia] = useState<ProductMedia[]>([]);
  const [pendingImages, setPendingImages] = useState<File[]>([]);
  const [mediaBusyId, setMediaBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState<ProductFormState>(emptyForm);

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [productResult, categoryResult] = await Promise.all([
        adminProductApi.getProducts(),
        adminProductApi.getCategories(),
      ]);
      setProducts(productResult.products);
      setCategories(flattenCategories(categoryResult));
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

  const productTypes = useMemo(
    () => uniqueTaxonomies(products.map((product) => product.productType)),
    [products],
  );
  const brands = useMemo(
    () => uniqueTaxonomies(products.map((product) => product.brand)),
    [products],
  );

  useEffect(() => {
    setForm((current) => ({
      ...current,
      categoryId: current.categoryId || categories[0]?.id || "",
      productTypeId:
        current.productTypeId ||
        productTypes.find((type) => type.slug === categories[0]?.slug)?.id ||
        productTypes[0]?.id ||
        "",
      brandId: current.brandId || brands[0]?.id || "",
    }));
  }, [brands, categories, productTypes]);

  const setField = <K extends keyof ProductFormState>(key: K, value: ProductFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const setCategory = (categoryId: string) => {
    const category = categories.find((item) => item.id === categoryId);
    const matchingType = productTypes.find((type) => type.slug === category?.slug);
    setForm((current) => ({
      ...current,
      categoryId,
      ...(matchingType ? { productTypeId: matchingType.id } : {}),
    }));
  };

  const closeEditor = () => {
    setShowForm(false);
    setEditingProductId(null);
    setEditingVariantId(null);
    setMedia([]);
    setPendingImages([]);
    setForm({
      ...emptyForm,
      productTypeId: productTypes[0]?.id || "",
      categoryId: categories[0]?.id || "",
      brandId: brands[0]?.id || "",
    });
  };

  const openCreateForm = () => {
    if (showForm && !editingProductId) {
      closeEditor();
      return;
    }

    setEditingProductId(null);
    setEditingVariantId(null);
    setMedia([]);
    setPendingImages([]);
    setError("");
    setSuccess("");
    setForm({
      ...emptyForm,
      productTypeId:
        productTypes.find((type) => type.slug === categories[0]?.slug)?.id ||
        productTypes[0]?.id ||
        "",
      categoryId: categories[0]?.id || "",
      brandId: brands[0]?.id || "",
    });
    setShowForm(true);
  };

  const openEditForm = async (productId: string) => {
    setLoadingEditorId(productId);
    setError("");
    setSuccess("");

    try {
      const product = await adminProductApi.getProduct(productId);
      const variant =
        product.variants?.find((item) => item.isDefault) ?? product.variants?.[0];

      setEditingProductId(product.id);
      setEditingVariantId(variant?.id ?? null);
      setMedia(product.media ?? []);
      setPendingImages([]);
      setForm({
        name: product.name,
        shortDescription: product.shortDescription ?? "",
        description: product.description ?? "",
        productTypeId: product.productTypeId,
        categoryId: product.categoryId,
        brandId: product.brandId ?? "",
        defaultPrice: String(product.regularPrice),
        discountPrice: product.discountPrice === null ? "" : String(product.discountPrice),
        costPrice: product.defaultCostPrice === null ? "" : String(product.defaultCostPrice),
        sku: variant?.sku ?? "",
        variantName: variant?.name ?? "Default",
        color: variant?.color ?? "",
        size: variant?.size ?? "",
        stockQuantity: String(variant?.stockQuantity ?? 0),
        status: product.status,
        isFeatured: product.isFeatured,
      });
      setShowForm(true);
    } catch (requestError) {
      setError(
        requestError instanceof ApiException
          ? requestError.error.message
          : "Could not load this product for editing.",
      );
    } finally {
      setLoadingEditorId(null);
    }
  };

  const handleImageSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (selected.length === 0) return;

    const availableSlots = 4 - media.length - pendingImages.length;
    if (selected.length > availableSlots) {
      setError(`You can add ${Math.max(availableSlots, 0)} more image${availableSlots === 1 ? "" : "s"}.`);
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
    setPendingImages((current) => [...current, ...selected]);
  };

  const setPrimaryImage = async (mediaId: string) => {
    if (!editingProductId) return;
    setMediaBusyId(mediaId);
    setError("");

    try {
      await adminProductApi.updateMedia(editingProductId, mediaId, { isPrimary: true });
      setMedia((current) =>
        current.map((item) => ({ ...item, isPrimary: item.id === mediaId })),
      );
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

  const handleSaveProduct = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const regularPrice = Number(form.defaultPrice);
    const discountPrice = form.discountPrice ? Number(form.discountPrice) : null;
    const costPrice = form.costPrice ? Number(form.costPrice) : null;
    const stockQuantity = Number(form.stockQuantity);

    if (discountPrice !== null && discountPrice > regularPrice) {
      setError("The discount price cannot be higher than the regular price.");
      return;
    }

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
          description: form.description,
          defaultPrice: regularPrice,
          defaultCostPrice: costPrice,
          discountPrice,
          status: form.status,
          isFeatured: form.isFeatured,
          isActive: true,
        });

        const variantInput = {
          sku: form.sku.trim(),
          variantName: form.variantName.trim() || undefined,
          color: form.color.trim() || undefined,
          size: form.size.trim() || undefined,
          price: discountPrice ?? regularPrice,
          costPrice,
          stockQuantity,
          isActive: true,
        };

        if (editingVariantId) {
          await adminProductApi.updateVariant(editingProductId, editingVariantId, variantInput);
        } else {
          await adminProductApi.createVariant(editingProductId, {
            ...variantInput,
            isDefault: true,
          });
        }

        if (pendingImages.length > 0) {
          await adminProductApi.uploadMedia(editingProductId, pendingImages, form.name);
        }

        setSuccess(`${form.name} was updated successfully.`);
        closeEditor();
        await loadCatalog();
        return;
      }

      createdProduct = await adminProductApi.createProduct({
        productTypeId: form.productTypeId,
        categoryId: form.categoryId,
        brandId: form.brandId || null,
        name: form.name,
        shortDescription: form.shortDescription.trim() || null,
        description: form.description,
        defaultPrice: regularPrice,
        defaultCostPrice: costPrice,
        discountPrice,
        status: "DRAFT",
        isFeatured: form.isFeatured,
        isActive: true,
      });

      await adminProductApi.createVariant(createdProduct.id, {
        sku: form.sku.trim(),
        variantName: form.variantName.trim() || undefined,
        color: form.color.trim() || undefined,
        size: form.size.trim() || undefined,
        price: discountPrice ?? regularPrice,
        costPrice,
        stockQuantity,
        isDefault: true,
        isActive: true,
      });

      if (pendingImages.length > 0) {
        await adminProductApi.uploadMedia(createdProduct.id, pendingImages, form.name);
      }

      if (form.status !== "DRAFT") {
        await adminProductApi.updateProduct(createdProduct.id, { status: form.status });
      }

      setSuccess(`${form.name} was created successfully.`);
      setForm({
        ...emptyForm,
        productTypeId: form.productTypeId,
        categoryId: form.categoryId,
        brandId: form.brandId,
      });
      setShowForm(false);
      setPendingImages([]);
      setMedia([]);
      await loadCatalog();
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
      if (createdProduct) await loadCatalog();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="dashboard-container admin-catalog">
      <div className="admin-catalog-header">
        <div className="dashboard-header">
          <h1>Products</h1>
          <p>Welcome, {user?.name}. Manage the DokanBD catalog and stock.</p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={openCreateForm}
        >
          {showForm && !editingProductId ? <X size={18} /> : <Plus size={18} />}
          {showForm && !editingProductId ? "Close" : "Add product"}
        </button>
      </div>

      {error && <div className="alert alert-error"><AlertCircle size={18} />{error}</div>}
      {success && <div className="alert alert-success"><CheckCircle size={18} />{success}</div>}

      {showForm && (
        <form className="admin-product-form" onSubmit={handleSaveProduct}>
          <div className="admin-form-heading">
            <div>
              <h2>{editingProductId ? "Edit product" : "Add a product"}</h2>
              <p>{editingProductId ? "Update product details and its default stock variant." : "Create the product and its first purchasable stock variant."}</p>
            </div>
          </div>

          <div className="admin-form-grid">
            <div className="form-group admin-field-wide">
              <label htmlFor="product-name">Product name</label>
              <input id="product-name" className="form-input" value={form.name} onChange={(event) => setField("name", event.target.value)} required minLength={2} maxLength={200} />
            </div>
            <div className="form-group">
              <label htmlFor="product-category">Category</label>
              <select id="product-category" className="form-input" value={form.categoryId} onChange={(event) => setCategory(event.target.value)} required>
                <option value="">Choose category</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="product-type">Product type</label>
              <select id="product-type" className="form-input" value={form.productTypeId} onChange={(event) => setField("productTypeId", event.target.value)} required>
                <option value="">Choose type</option>
                {productTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="product-brand">Brand</label>
              <select id="product-brand" className="form-input" value={form.brandId} onChange={(event) => setField("brandId", event.target.value)}>
                <option value="">No brand</option>
                {brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="product-status">Publish as</label>
              <select id="product-status" className="form-input" value={form.status} onChange={(event) => setField("status", event.target.value as ProductFormState["status"])}>
                <option value="ACTIVE">Active</option>
                <option value="DRAFT">Draft</option>
                <option value="INACTIVE">Inactive</option>
                <option value="DISCONTINUED">Discontinued</option>
              </select>
            </div>
            <div className="form-group admin-field-wide">
              <label htmlFor="short-description">Short description</label>
              <input id="short-description" className="form-input" value={form.shortDescription} onChange={(event) => setField("shortDescription", event.target.value)} maxLength={500} />
            </div>
            <div className="form-group admin-field-wide">
              <label htmlFor="description">Full description</label>
              <textarea id="description" className="form-input admin-textarea" value={form.description} onChange={(event) => setField("description", event.target.value)} required />
            </div>

            <div className="admin-form-divider admin-field-wide"><span>Pricing and inventory</span></div>

            <div className="form-group">
              <label htmlFor="regular-price">Regular price (BDT)</label>
              <input id="regular-price" className="form-input" type="number" min="0" step="0.01" value={form.defaultPrice} onChange={(event) => setField("defaultPrice", event.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="discount-price">Discount price</label>
              <input id="discount-price" className="form-input" type="number" min="0" step="0.01" value={form.discountPrice} onChange={(event) => setField("discountPrice", event.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="cost-price">Cost price</label>
              <input id="cost-price" className="form-input" type="number" min="0" step="0.01" value={form.costPrice} onChange={(event) => setField("costPrice", event.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="stock">Initial stock</label>
              <input id="stock" className="form-input" type="number" min="0" step="1" value={form.stockQuantity} onChange={(event) => setField("stockQuantity", event.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="sku">SKU</label>
              <input id="sku" className="form-input" value={form.sku} onChange={(event) => setField("sku", event.target.value.toUpperCase())} required maxLength={100} placeholder="e.g. DB-SHIRT-BLK-M" />
            </div>
            <div className="form-group">
              <label htmlFor="variant-name">Option name</label>
              <input id="variant-name" className="form-input" value={form.variantName} onChange={(event) => setField("variantName", event.target.value)} maxLength={150} placeholder="Default" />
            </div>
            <div className="form-group">
              <label htmlFor="color">Color</label>
              <input id="color" className="form-input" value={form.color} onChange={(event) => setField("color", event.target.value)} maxLength={100} />
            </div>
            <div className="form-group">
              <label htmlFor="size">Size</label>
              <input id="size" className="form-input" value={form.size} onChange={(event) => setField("size", event.target.value)} maxLength={100} />
            </div>
            <label className="admin-checkbox admin-field-wide">
              <input type="checkbox" checked={form.isFeatured} onChange={(event) => setField("isFeatured", event.target.checked)} />
              Feature this product on the storefront
            </label>

            <div className="admin-form-divider admin-field-wide"><span>Product media</span></div>

            <div className="admin-media-manager admin-field-wide">
              {media.length > 0 && (
                <div className="admin-media-grid">
                  {media.map((item) => (
                    <article className="admin-media-card" key={item.id}>
                      <div className="admin-media-image">
                        {item.type === "VIDEO" ? (
                          <video src={item.url} controls muted playsInline preload="metadata" />
                        ) : (
                          <img src={item.thumbnailUrl || item.url} alt={item.altText || form.name} />
                        )}
                        {item.isPrimary && <span className="admin-primary-badge"><Star size={13} /> Primary</span>}
                      </div>
                      <div className="admin-media-actions">
                        {item.type === "IMAGE" && !item.isPrimary && (
                          <button type="button" onClick={() => setPrimaryImage(item.id)} disabled={mediaBusyId === item.id}>
                            <Star size={16} /> Set primary
                          </button>
                        )}
                        <button className="media-delete-button" type="button" onClick={() => deleteImage(item.id)} disabled={mediaBusyId === item.id}>
                          <Trash2 size={16} /> Delete
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {pendingImages.length > 0 && (
                <div className="pending-image-list">
                  {pendingImages.map((file, index) => (
                    <div key={`${file.name}-${file.lastModified}`}>
                      <span>{file.name}</span>
                      <button type="button" aria-label={`Remove ${file.name}`} onClick={() => setPendingImages((current) => current.filter((_, itemIndex) => itemIndex !== index))}>
                        <X size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {media.length + pendingImages.length < 4 ? (
                <label className="admin-image-picker">
                  <ImagePlus size={24} />
                  <span>{media.length + pendingImages.length === 0 ? "Choose product media" : "Add more media"}</span>
                  <small>Images: JPEG, PNG, WebP up to 2 MB · Videos: MP4, WebM up to 20 MB · 4 items total</small>
                  <input type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" multiple onChange={handleImageSelection} />
                </label>
              ) : (
                <p className="admin-media-limit">The four-image limit has been reached.</p>
              )}

              {pendingImages.length > 0 && (
                <p className="admin-media-note">
                  {editingProductId
                    ? "Selected images will upload when you save changes."
                    : "Selected images will upload after the product and its initial stock variant are created."}
                </p>
              )}
            </div>
          </div>

          <div className="admin-form-actions">
            <button type="button" className="btn btn-ghost" onClick={closeEditor}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting || productTypes.length === 0}>
              {submitting ? "Saving product..." : editingProductId ? "Save changes" : "Create product"}
            </button>
          </div>
        </form>
      )}

      <section className="admin-products-panel">
        <div className="admin-panel-heading">
          <div>
            <h2>Catalog</h2>
            <p>{products.length} product{products.length === 1 ? "" : "s"}</p>
          </div>
        </div>

        {loading ? (
          <div className="admin-empty-state">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="admin-empty-state">
            <Package size={36} />
            <h3>No products yet</h3>
            <p>Add the first product to start building the catalog.</p>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-product-table">
              <thead>
                <tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div className="admin-product-identity">
                        <div className="admin-product-thumbnail" aria-hidden="true">
                          {(product.primaryImage ?? product.media?.[0])?.type === "VIDEO" ? (
                            <video src={(product.primaryImage ?? product.media?.[0])?.url} muted preload="metadata" />
                          ) : product.primaryImage ?? product.media?.[0] ? (
                            <img
                              src={(product.primaryImage ?? product.media?.[0])?.thumbnailUrl || (product.primaryImage ?? product.media?.[0])?.url}
                              alt=""
                              loading="lazy"
                            />
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
                        <button
                          type="button"
                          className="admin-view-link"
                          title={`Edit ${product.name}`}
                          aria-label={`Edit ${product.name}`}
                          disabled={loadingEditorId === product.id}
                          onClick={() => openEditForm(product.id)}
                        >
                          <Pencil size={17} />
                        </button>
                        <Link to={`/products/${product.slug}`} className="admin-view-link" title="View storefront product" aria-label={`View ${product.name} on storefront`}><ExternalLink size={17} /></Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
