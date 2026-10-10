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
import { AdminVariantBuilder, VariantDraft } from "../dashboard/AdminVariantBuilder";

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
  status: "ACTIVE",
  isFeatured: false,
};

const flattenCategories = (items: CategoryOption[]): CategoryOption[] =>
  items.flatMap((item) => [item, ...flattenCategories(item.children)]);

const emptySimpleVariant = (): VariantDraft => ({
  key: `new-simple-${Date.now()}`,
  optionValueIds: [],
  optionLabel: "Default",
  sku: "",
  price: "",
  costPrice: "",
  stockQuantity: "0",
  isDefault: true,
  isActive: true,
});

export const AdminProductEditorPage: React.FC = () => {
  const navigate = useNavigate();
  const { productId } = useParams();
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [brands, setBrands] = useState<AdminBrand[]>([]);
  const [productTypes, setProductTypes] = useState<AdminProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [variantDrafts, setVariantDrafts] = useState<VariantDraft[]>([emptySimpleVariant()]);
  const [originalVariantIds, setOriginalVariantIds] = useState<string[]>([]);
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
      const [categoryResult, brandResult, productTypeResult] = await Promise.all([
        adminProductApi.getCategories(),
        adminCatalogApi.getBrands(false),
        adminCatalogApi.getProductTypes(false),
      ]);
      setCategories(flattenCategories(categoryResult));
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
        price: String(variant.price),
        costPrice: variant.costPrice == null ? "" : String(variant.costPrice),
        stockQuantity: String(variant.stockQuantity),
        isDefault: variant.isDefault,
        isActive: variant.isActive ?? true,
      }));
      setVariantDrafts(loadedVariants.length ? loadedVariants : [emptySimpleVariant()]);
      setOriginalVariantIds(loadedVariants.flatMap((variant) => variant.id ? [variant.id] : []));
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

  const handleSaveProduct = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const regularPrice = Number(form.defaultPrice);
    const discountPrice = form.discountPrice ? Number(form.discountPrice) : null;
    const costPrice = form.costPrice ? Number(form.costPrice) : null;

    if (discountPrice !== null && discountPrice > regularPrice) {
      setError("The discount price cannot be higher than the regular price.");
      return;
    }
    if (variantDrafts.length === 0 || variantDrafts.some((variant) => !variant.sku.trim())) {
      setError("Add at least one variant and provide a unique SKU for every row.");
      return;
    }

    const variantInputs = variantDrafts.map((variant) => ({
      sku: variant.sku.trim(),
      variantName: variant.optionLabel || "Default",
      price: Number(variant.price || discountPrice || regularPrice),
      costPrice: variant.costPrice ? Number(variant.costPrice) : costPrice,
      stockQuantity: Number(variant.stockQuantity),
      isDefault: variant.isDefault,
      isActive: variant.isActive,
      optionValueIds: variant.optionValueIds,
    }));

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

        const currentIds = new Set(variantDrafts.flatMap((variant) => variant.id ? [variant.id] : []));
        for (const removedId of originalVariantIds.filter((id) => !currentIds.has(id))) {
          await adminProductApi.deleteVariant(editingProductId, removedId);
        }
        for (let index = 0; index < variantDrafts.length; index += 1) {
          const draft = variantDrafts[index];
          if (draft.id) await adminProductApi.updateVariant(editingProductId, draft.id, variantInputs[index]);
        }
        const newVariantInputs = variantInputs.filter((_, index) => !variantDrafts[index].id);
        if (newVariantInputs.length) await adminProductApi.createVariantsBulk(editingProductId, newVariantInputs);

        if (pendingImages.length > 0) {
          await adminProductApi.uploadMedia(editingProductId, pendingImages, form.name);
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
        description: form.description,
        defaultPrice: regularPrice,
        defaultCostPrice: costPrice,
        discountPrice,
        status: "DRAFT",
        isFeatured: form.isFeatured,
        isActive: true,
      });

      await adminProductApi.createVariantsBulk(createdProduct.id, variantInputs);

      if (pendingImages.length > 0) {
        await adminProductApi.uploadMedia(createdProduct.id, pendingImages, form.name);
      }

      if (form.status !== "DRAFT") {
        await adminProductApi.updateProduct(createdProduct.id, { status: form.status });
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
    <div className="dashboard-container admin-catalog admin-page">
      <header className="admin-page-header">
        <div>
          <Link className="product-back-link" to="/admin/products"><ArrowLeft size={17} /> Products</Link>
          <p className="eyebrow">Catalog editor</p>
          <h1>{editingProductId ? "Edit product" : "Add product"}</h1>
          <p>Product type controls available properties; category and brand remain independent.</p>
        </div>
      </header>

      {error && <div className="alert alert-error"><AlertCircle size={18} />{error}</div>}
      {success && <div className="alert alert-success"><CheckCircle size={18} />{success}</div>}

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
              <select id="product-category" className="form-input" value={form.categoryId} onChange={(event) => setField("categoryId", event.target.value)} required>
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
            <label className="admin-checkbox admin-field-wide">
              <input type="checkbox" checked={form.isFeatured} onChange={(event) => setField("isFeatured", event.target.checked)} />
              Feature this product on the storefront
            </label>

            <AdminVariantBuilder
              productTypeId={form.productTypeId}
              productName={form.name}
              defaultPrice={form.discountPrice || form.defaultPrice}
              defaultCostPrice={form.costPrice}
              variants={variantDrafts}
              onChange={setVariantDrafts}
            />

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
                        {editingProductId && (
                          <select
                            className="form-input"
                            aria-label={`Assign ${item.altText || "media"} to a variant`}
                            value={item.variantId ?? ""}
                            disabled={mediaBusyId === item.id}
                            onChange={(event) => assignMediaToVariant(item.id, event.target.value)}
                          >
                            <option value="">All variants</option>
                            {variantDrafts.filter((variant) => variant.id).map((variant) => <option key={variant.id} value={variant.id}>{variant.optionLabel || variant.sku}</option>)}
                          </select>
                        )}
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
                <p className="admin-media-limit">The four-item media limit has been reached.</p>
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
    </div>
  );
};
