import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Palette, Pencil, Plus, RotateCcw, Save, Trash2 } from "lucide-react";

import {
  AdminAttribute,
  AdminProductType,
  adminCatalogApi,
} from "../../api/adminCatalog";
import { ApiException } from "../../api/client";

interface Props {
  productTypes: AdminProductType[];
}

function errorMessage(error: unknown) {
  return error instanceof ApiException ? error.error.message : "Could not update product properties.";
}

export const AdminProductProperties: React.FC<Props> = ({ productTypes }) => {
  const [attributes, setAttributes] = useState<AdminAttribute[]>([]);
  const [name, setName] = useState("");
  const [inputType, setInputType] = useState<AdminAttribute["inputType"]>("SELECT");
  const [valueDrafts, setValueDrafts] = useState<Record<string, string>>({});
  const [colorDrafts, setColorDrafts] = useState<Record<string, string>>({});
  const [selectedTypeId, setSelectedTypeId] = useState("");
  const [assigned, setAssigned] = useState<Record<string, { selected: boolean; required: boolean }>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const activeTypes = useMemo(
    () => productTypes.filter((type) => type.isActive && !type.deletedAt),
    [productTypes],
  );

  const loadAttributes = useCallback(async () => {
    try {
      setAttributes(await adminCatalogApi.getAttributes(true));
    } catch (requestError) {
      setError(errorMessage(requestError));
    }
  }, []);

  useEffect(() => { loadAttributes(); }, [loadAttributes]);
  useEffect(() => {
    if (!selectedTypeId && activeTypes[0]) setSelectedTypeId(activeTypes[0].id);
  }, [activeTypes, selectedTypeId]);

  useEffect(() => {
    if (!selectedTypeId) return;
    adminCatalogApi.getProductTypeAttributes(selectedTypeId)
      .then((items) => {
        const next: Record<string, { selected: boolean; required: boolean }> = {};
        for (const item of items) next[item.attributeId] = { selected: true, required: item.isRequired };
        setAssigned(next);
      })
      .catch((requestError) => setError(errorMessage(requestError)));
  }, [selectedTypeId]);

  const createAttribute = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true); setError(""); setSuccess("");
    try {
      await adminCatalogApi.createAttribute({ name, inputType, isActive: true });
      setName(""); setInputType("SELECT"); setSuccess("Product property created.");
      await loadAttributes();
    } catch (requestError) { setError(errorMessage(requestError)); }
    finally { setBusy(false); }
  };

  const addValue = async (attribute: AdminAttribute) => {
    const label = valueDrafts[attribute.id]?.trim();
    if (!label) return;
    setBusy(true); setError("");
    try {
      await adminCatalogApi.createAttributeValue(attribute.id, {
        label,
        colorHex: attribute.inputType === "COLOR" ? colorDrafts[attribute.id] || null : null,
        isActive: true,
      });
      setValueDrafts((current) => ({ ...current, [attribute.id]: "" }));
      setSuccess(`${label} added to ${attribute.name}.`);
      await loadAttributes();
    } catch (requestError) { setError(errorMessage(requestError)); }
    finally { setBusy(false); }
  };

  const removeAttribute = async (attribute: AdminAttribute) => {
    if (!attribute.deletedAt && !window.confirm(`Delete “${attribute.name}”? Existing variants keep their historical data.`)) return;
    setBusy(true); setError("");
    try {
      if (attribute.deletedAt) await adminCatalogApi.restoreAttribute(attribute.id);
      else await adminCatalogApi.deleteAttribute(attribute.id);
      setSuccess(attribute.deletedAt ? "Property restored." : "Property deleted.");
      await loadAttributes();
    } catch (requestError) { setError(errorMessage(requestError)); }
    finally { setBusy(false); }
  };

  const editAttribute = async (attribute: AdminAttribute) => {
    const nextName = window.prompt("Property name", attribute.name)?.trim();
    if (!nextName || nextName === attribute.name) return;
    setBusy(true); setError("");
    try {
      await adminCatalogApi.updateAttribute(attribute.id, { name: nextName });
      setSuccess("Property updated."); await loadAttributes();
    } catch (requestError) { setError(errorMessage(requestError)); }
    finally { setBusy(false); }
  };

  const removeValue = async (attribute: AdminAttribute, valueId: string, deleted: boolean) => {
    setBusy(true); setError("");
    try {
      if (deleted) await adminCatalogApi.restoreAttributeValue(attribute.id, valueId);
      else await adminCatalogApi.deleteAttributeValue(attribute.id, valueId);
      setSuccess(deleted ? "Property value restored." : "Property value deleted.");
      await loadAttributes();
    } catch (requestError) { setError(errorMessage(requestError)); }
    finally { setBusy(false); }
  };

  const editValue = async (attribute: AdminAttribute, valueId: string) => {
    const value = attribute.values.find((item) => item.id === valueId);
    if (!value) return;
    const label = window.prompt("Property value", value.label)?.trim();
    if (!label) return;
    const colorHex = attribute.inputType === "COLOR"
      ? window.prompt("Color hex code, for example #0066CC", value.colorHex ?? "#000000")?.trim() || null
      : value.colorHex;
    setBusy(true); setError("");
    try {
      await adminCatalogApi.updateAttributeValue(attribute.id, valueId, { label, colorHex });
      setSuccess("Property value updated."); await loadAttributes();
    } catch (requestError) { setError(errorMessage(requestError)); }
    finally { setBusy(false); }
  };

  const saveAssignments = async () => {
    if (!selectedTypeId) return;
    setBusy(true); setError("");
    try {
      const values = attributes
        .filter((attribute) => !attribute.deletedAt && assigned[attribute.id]?.selected)
        .map((attribute, index) => ({
          attributeId: attribute.id,
          isRequired: assigned[attribute.id]?.required ?? false,
          sortOrder: index,
        }));
      await adminCatalogApi.setProductTypeAttributes(selectedTypeId, values);
      setSuccess("Product-type properties saved.");
    } catch (requestError) { setError(errorMessage(requestError)); }
    finally { setBusy(false); }
  };

  return (
    <section className="admin-products-panel admin-properties-panel">
      <div className="admin-panel-heading">
        <div><h2>Product properties</h2><p>Create reusable options such as Color, Size, Storage, Material, or RAM.</p></div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form className="admin-property-create" onSubmit={createAttribute}>
        <div className="form-group"><label htmlFor="property-name">Property name</label><input id="property-name" className="form-input" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Storage" required /></div>
        <div className="form-group"><label htmlFor="property-input-type">Display type</label><select id="property-input-type" className="form-input" value={inputType} onChange={(event) => setInputType(event.target.value as AdminAttribute["inputType"])}><option value="SELECT">Buttons / select</option><option value="COLOR">Color swatches</option><option value="TEXT">Text values</option></select></div>
        <button className="btn btn-primary" disabled={busy}><Plus size={17} /> Add property</button>
      </form>

      <div className="admin-property-grid">
        {attributes.map((attribute) => (
          <article className={`admin-property-card${attribute.deletedAt ? " is-deleted" : ""}`} key={attribute.id}>
            <header><div><strong>{attribute.name}</strong><small>{attribute.code} · {attribute.inputType.toLowerCase()}</small></div><div className="admin-row-actions">{!attribute.deletedAt && <button type="button" className="admin-view-link" onClick={() => editAttribute(attribute)} disabled={busy} aria-label={`Edit ${attribute.name}`}><Pencil size={17} /></button>}<button type="button" className="admin-view-link" onClick={() => removeAttribute(attribute)} disabled={busy} aria-label={attribute.deletedAt ? `Restore ${attribute.name}` : `Delete ${attribute.name}`}>{attribute.deletedAt ? <RotateCcw size={17} /> : <Trash2 size={17} />}</button></div></header>
            <div className="admin-property-values">
              {attribute.values.map((value) => (
                <span className={value.deletedAt ? "is-deleted" : ""} key={value.id}>
                  {value.colorHex && <i style={{ backgroundColor: value.colorHex }} />}{value.label}
                  {!value.deletedAt && <button type="button" onClick={() => editValue(attribute, value.id)} disabled={busy} aria-label={`Edit ${value.label}`}><Pencil size={12} /></button>}
                  <button type="button" onClick={() => removeValue(attribute, value.id, Boolean(value.deletedAt))} disabled={busy} aria-label={`${value.deletedAt ? "Restore" : "Delete"} ${value.label}`}>{value.deletedAt ? <RotateCcw size={12} /> : <Trash2 size={12} />}</button>
                </span>
              ))}
            </div>
            {!attribute.deletedAt && (
              <div className="admin-property-value-form">
                {attribute.inputType === "COLOR" && <input type="color" value={colorDrafts[attribute.id] || "#000000"} onChange={(event) => setColorDrafts((current) => ({ ...current, [attribute.id]: event.target.value }))} aria-label={`${attribute.name} color`} />}
                <input className="form-input" value={valueDrafts[attribute.id] || ""} onChange={(event) => setValueDrafts((current) => ({ ...current, [attribute.id]: event.target.value }))} placeholder="Add a value" />
                <button type="button" onClick={() => addValue(attribute)} disabled={busy || !valueDrafts[attribute.id]?.trim()}><Plus size={16} /></button>
              </div>
            )}
          </article>
        ))}
      </div>

      <div className="admin-property-assignment">
        <div><h3>Assign properties to a product type</h3><p>The product editor uses these assignments to generate every valid variant combination.</p></div>
        <select className="form-input" value={selectedTypeId} onChange={(event) => setSelectedTypeId(event.target.value)}><option value="">Choose product type</option>{activeTypes.map((type) => <option value={type.id} key={type.id}>{type.name}</option>)}</select>
        <div className="admin-property-checklist">
          {attributes.filter((attribute) => !attribute.deletedAt && attribute.isActive).map((attribute) => (
            <div key={attribute.id}>
              <label><input type="checkbox" checked={assigned[attribute.id]?.selected ?? false} onChange={(event) => setAssigned((current) => ({ ...current, [attribute.id]: { selected: event.target.checked, required: current[attribute.id]?.required ?? false } }))} /> <Palette size={15} /> {attribute.name}</label>
              <label><input type="checkbox" disabled={!assigned[attribute.id]?.selected} checked={assigned[attribute.id]?.required ?? false} onChange={(event) => setAssigned((current) => ({ ...current, [attribute.id]: { selected: true, required: event.target.checked } }))} /> Required</label>
            </div>
          ))}
        </div>
        <button type="button" className="btn btn-primary" onClick={saveAssignments} disabled={busy || !selectedTypeId}><Save size={17} /> Save type properties</button>
      </div>
    </section>
  );
};
