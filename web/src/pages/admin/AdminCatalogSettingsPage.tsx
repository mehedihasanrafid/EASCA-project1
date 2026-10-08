import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
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
import { Link } from "react-router-dom";

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

interface CategoryFormState {
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  parentId: string;
  sortOrder: string;
  isActive: boolean;
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

export const AdminCatalogSettingsPage: React.FC = () => {
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

  const loadReferences = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [categoryResult, brandResult, productTypeResult] = await Promise.all([
        adminCatalogApi.getCategories(true),
        adminCatalogApi.getBrands(true),
        adminCatalogApi.getProductTypes(true),
      ]);
      setCategories(categoryResult);
      setBrands(brandResult);
      setProductTypes(productTypeResult);
    } catch (requestError) {
      setError(requestMessage(requestError, "Could not load catalog settings."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReferences();
  }, [loadReferences]);

  const activeParentOptions = useMemo(
    () =>
      categories.filter(
        (category) => !category.deletedAt && category.isActive && category.id !== editingCategoryId,
      ),
    [categories, editingCategoryId],
  );

  const closeCategoryEditor = () => {
    setCategoryEditorOpen(false);
    setEditingCategoryId(null);
    setCategoryForm(emptyCategoryForm);
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
    setCategoryEditorOpen(true);
  };

  const editCategory = (category: AdminCategory) => {
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
      showOnHomepage: category.showOnHomepage,
    });
    setCategoryEditorOpen(true);
  };

  const saveCategory = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");

    const input: SaveCategoryInput = {
      name: categoryForm.name,
      ...(categoryForm.slug.trim() ? { slug: categoryForm.slug.trim() } : {}),
      description: categoryForm.description.trim() || null,
      imageUrl: categoryForm.imageUrl.trim() || null,
      parentId: categoryForm.parentId || null,
      sortOrder: Number(categoryForm.sortOrder),
      isActive: categoryForm.isActive,
      showOnHomepage: categoryForm.showOnHomepage,
    };

    try {
      if (editingCategoryId) {
        await adminCatalogApi.updateCategory(editingCategoryId, input);
        setSuccess("Category updated.");
      } else {
        await adminCatalogApi.createCategory(input);
        setSuccess("Category created.");
      }
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
        setSuccess("Product type updated.");
      } else {
        await adminCatalogApi.createProductType(input);
        setSuccess("Product type created.");
      }
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
    <div className="dashboard-container admin-catalog admin-taxonomy-page">
      <div className="admin-catalog-header">
        <div className="dashboard-header">
          <Link className="product-back-link" to="/admin"><ArrowLeft size={16} /> Products</Link>
          <p className="eyebrow">Catalog settings</p>
          <h1>Categories, brands &amp; product types</h1>
          <p>Manage the reusable catalog information used by every product.</p>
        </div>
      </div>

      {error && <div className="alert alert-error"><AlertCircle size={18} />{error}</div>}
      {success && <div className="alert alert-success"><CheckCircle size={18} />{success}</div>}

      <div className="admin-taxonomy-grid">
        <section className="admin-products-panel">
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
              </div>
              <div className="admin-reference-options">
                <label className="admin-checkbox"><input type="checkbox" checked={categoryForm.isActive} onChange={(event) => setCategoryForm((current) => ({ ...current, isActive: event.target.checked }))} /> Active category</label>
                <label className="admin-checkbox"><input type="checkbox" checked={categoryForm.showOnHomepage} onChange={(event) => setCategoryForm((current) => ({ ...current, showOnHomepage: event.target.checked }))} /> Show on homepage</label>
              </div>
              <div className="admin-form-actions"><button type="button" className="btn btn-ghost" onClick={closeCategoryEditor}>Cancel</button><button className="btn btn-primary" disabled={busy}>{busy ? "Saving..." : "Save category"}</button></div>
            </form>
          )}

          {loading ? <div className="admin-empty-state">Loading categories...</div> : (
            <div className="admin-table-wrap"><table className="admin-product-table admin-reference-table"><thead><tr><th>Category</th><th>Homepage</th><th>Order</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{categories.map((category) => <tr key={category.id} className={category.deletedAt ? "is-deleted" : ""}><td><strong>{category.name}</strong><span className="admin-product-brand">/{category.slug}{category.parentId ? ` · child of ${categories.find((item) => item.id === category.parentId)?.name ?? "category"}` : ""}</span></td><td>{category.showOnHomepage ? <span className="reference-visibility is-visible"><Eye size={15} /> Shown</span> : <span className="reference-visibility"><EyeOff size={15} /> Hidden</span>}</td><td>{category.sortOrder}</td><td><span className={`status-pill ${category.deletedAt || !category.isActive ? "status-inactive" : "status-active"}`}>{category.deletedAt ? "Deleted" : category.isActive ? "Active" : "Inactive"}</span></td><td><div className="admin-row-actions">{category.deletedAt ? <button type="button" className="admin-view-link" aria-label={`Restore ${category.name}`} title="Restore" disabled={busy} onClick={() => restoreCategory(category)}><RotateCcw size={17} /></button> : <><button type="button" className="admin-view-link" aria-label={`Edit ${category.name}`} title="Edit" onClick={() => editCategory(category)}><Pencil size={17} /></button><button type="button" className="admin-view-link reference-delete-button" aria-label={`Delete ${category.name}`} title="Delete" disabled={busy} onClick={() => removeCategory(category)}><Trash2 size={17} /></button></>}</div></td></tr>)}</tbody></table></div>
          )}
        </section>

        <section className="admin-products-panel">
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
        </section>

        <section className="admin-products-panel admin-product-types-panel">
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
        </section>
      </div>
    </div>
  );
};
