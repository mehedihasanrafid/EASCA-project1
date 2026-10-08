import React, { FormEvent, useCallback, useEffect, useState } from "react";
import { ArrowLeft, Check, Edit3, MapPin, Plus, Star, Trash2, X } from "lucide-react";
import { Link } from "react-router-dom";

import { Address, AddressInput, addressApi } from "../../api/addresses";
import { ApiException } from "../../api/client";
import { useAuth } from "../../features/auth/AuthContext";

interface AddressFormState {
  label: string;
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  area: string;
  city: string;
  district: string;
  division: string;
  postalCode: string;
  country: string;
  isInsideDhaka: boolean;
  isDefault: boolean;
}

function emptyForm(name = "", phone = ""): AddressFormState {
  return {
    label: "Home",
    recipientName: name,
    phone,
    addressLine1: "",
    addressLine2: "",
    area: "",
    city: "",
    district: "",
    division: "",
    postalCode: "",
    country: "Bangladesh",
    isInsideDhaka: true,
    isDefault: false,
  };
}

function formFromAddress(address: Address): AddressFormState {
  return {
    label: address.label ?? "",
    recipientName: address.recipientName,
    phone: address.phone,
    addressLine1: address.addressLine1,
    addressLine2: address.addressLine2 ?? "",
    area: address.area,
    city: address.city,
    district: address.district,
    division: address.division,
    postalCode: address.postalCode ?? "",
    country: address.country,
    isInsideDhaka: address.isInsideDhaka,
    isDefault: address.isDefault,
  };
}

function toPayload(form: AddressFormState): AddressInput {
  return {
    label: form.label.trim() || null,
    recipientName: form.recipientName.trim(),
    phone: form.phone.trim(),
    addressLine1: form.addressLine1.trim(),
    addressLine2: form.addressLine2.trim() || null,
    area: form.area.trim(),
    city: form.city.trim(),
    district: form.district.trim(),
    division: form.division.trim(),
    postalCode: form.postalCode.trim() || null,
    country: form.country.trim(),
    isInsideDhaka: form.isInsideDhaka,
    isDefault: form.isDefault,
  };
}

function errorMessage(error: unknown) {
  return error instanceof ApiException
    ? error.error.message
    : error instanceof Error
      ? error.message
      : "Could not update the address.";
}

export const AddressesPage: React.FC = () => {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [form, setForm] = useState(() => emptyForm(user?.name, user?.phone));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadAddresses = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      setAddresses(await addressApi.list());
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAddresses();
  }, [loadAddresses]);

  const beginCreate = () => {
    setEditingId(null);
    setForm(emptyForm(user?.name, user?.phone));
    setError("");
    setMessage("");
    setShowForm(true);
  };

  const beginEdit = (address: Address) => {
    setEditingId(address.id);
    setForm(formFromAddress(address));
    setError("");
    setMessage("");
    setShowForm(true);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const payload = toPayload(form);
      if (editingId) {
        const { isDefault: _isDefault, ...updatePayload } = payload;
        await addressApi.update(editingId, updatePayload);
        setMessage("Address updated successfully.");
      } else {
        await addressApi.create(payload);
        setMessage("Address added successfully.");
      }
      setShowForm(false);
      setEditingId(null);
      await loadAddresses();
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  const handleDefault = async (addressId: string) => {
    setBusyId(addressId);
    setError("");
    setMessage("");
    try {
      await addressApi.setDefault(addressId);
      setMessage("Default delivery address changed.");
      await loadAddresses();
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (address: Address) => {
    if (!window.confirm(`Delete ${address.label || "this address"}?`)) return;
    setBusyId(address.id);
    setError("");
    setMessage("");
    try {
      await addressApi.remove(address.id);
      setMessage("Address deleted.");
      await loadAddresses();
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusyId(null);
    }
  };

  const updateField = <K extends keyof AddressFormState>(key: K, value: AddressFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  return (
    <div className="account-page address-page">
      <div className="account-page-heading">
        <div>
          <Link to="/account" className="product-back-link"><ArrowLeft size={18} /> My account</Link>
          <p className="eyebrow">Delivery details</p>
          <h1>Saved addresses</h1>
          <p>Add and manage the addresses you use at checkout.</p>
        </div>
        {!showForm && (
          <button type="button" className="btn btn-primary" onClick={beginCreate}>
            <Plus size={18} /> Add address
          </button>
        )}
      </div>

      {message && <div className="alert alert-success"><Check size={18} />{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {showForm && (
        <form className="address-form" onSubmit={handleSubmit}>
          <div className="address-form-heading">
            <div>
              <h2>{editingId ? "Edit address" : "Add a delivery address"}</h2>
              <p>Fields marked with * are required.</p>
            </div>
            <button type="button" className="btn-icon" aria-label="Close address form" onClick={() => setShowForm(false)}>
              <X size={20} />
            </button>
          </div>

          <div className="address-form-grid">
            <div className="form-group">
              <label htmlFor="address-label">Label</label>
              <input id="address-label" className="form-input" value={form.label} onChange={(event) => updateField("label", event.target.value)} placeholder="Home or Office" />
            </div>
            <div className="form-group">
              <label htmlFor="recipient-name">Recipient name *</label>
              <input id="recipient-name" className="form-input" required minLength={2} value={form.recipientName} onChange={(event) => updateField("recipientName", event.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="address-phone">Phone *</label>
              <input id="address-phone" className="form-input" required pattern="01[3-9][0-9]{8}" value={form.phone} onChange={(event) => updateField("phone", event.target.value)} placeholder="01700000000" />
            </div>
            <div className="form-group">
              <label htmlFor="delivery-zone">Delivery zone *</label>
              <select id="delivery-zone" className="form-input" value={form.isInsideDhaka ? "inside" : "outside"} onChange={(event) => updateField("isInsideDhaka", event.target.value === "inside")}>
                <option value="inside">Inside Dhaka</option>
                <option value="outside">Outside Dhaka</option>
              </select>
            </div>
            <div className="form-group address-field-wide">
              <label htmlFor="address-line-1">Address line 1 *</label>
              <input id="address-line-1" className="form-input" required minLength={3} value={form.addressLine1} onChange={(event) => updateField("addressLine1", event.target.value)} placeholder="House, road, village or street" />
            </div>
            <div className="form-group address-field-wide">
              <label htmlFor="address-line-2">Address line 2</label>
              <input id="address-line-2" className="form-input" value={form.addressLine2} onChange={(event) => updateField("addressLine2", event.target.value)} placeholder="Apartment, floor or landmark" />
            </div>
            <div className="form-group">
              <label htmlFor="area">Area *</label>
              <input id="area" className="form-input" required minLength={2} value={form.area} onChange={(event) => updateField("area", event.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="city">City *</label>
              <input id="city" className="form-input" required minLength={2} value={form.city} onChange={(event) => updateField("city", event.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="district">District *</label>
              <input id="district" className="form-input" required minLength={2} value={form.district} onChange={(event) => updateField("district", event.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="division">Division *</label>
              <input id="division" className="form-input" required minLength={2} value={form.division} onChange={(event) => updateField("division", event.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="postal-code">Postal code</label>
              <input id="postal-code" className="form-input" value={form.postalCode} onChange={(event) => updateField("postalCode", event.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="country">Country *</label>
              <input id="country" className="form-input" required value={form.country} onChange={(event) => updateField("country", event.target.value)} />
            </div>
            {!editingId && (
              <label className="address-default-checkbox address-field-wide">
                <input type="checkbox" checked={form.isDefault} onChange={(event) => updateField("isDefault", event.target.checked)} />
                Make this my default delivery address
              </label>
            )}
          </div>

          <div className="address-form-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving..." : editingId ? "Save changes" : "Add address"}</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="account-loading">Loading addresses...</div>
      ) : addresses.length === 0 && !showForm ? (
        <div className="address-empty">
          <MapPin size={46} />
          <h2>No saved addresses</h2>
          <p>Add your first delivery address to prepare for checkout.</p>
          <button type="button" className="btn btn-primary" onClick={beginCreate}><Plus size={18} /> Add address</button>
        </div>
      ) : (
        <div className="address-grid">
          {addresses.map((address) => (
            <article className={`address-card${address.isDefault ? " is-default" : ""}`} key={address.id}>
              <div className="address-card-heading">
                <div>
                  <span className="address-label"><MapPin size={16} />{address.label || "Address"}</span>
                  {address.isDefault && <span className="default-badge"><Star size={13} fill="currentColor" />Default</span>}
                </div>
              </div>
              <h2>{address.recipientName}</h2>
              <p>{address.addressLine1}{address.addressLine2 ? `, ${address.addressLine2}` : ""}</p>
              <p>{address.area}, {address.city}, {address.district}, {address.division}{address.postalCode ? ` ${address.postalCode}` : ""}</p>
              <p>{address.country} · {address.isInsideDhaka ? "Inside Dhaka" : "Outside Dhaka"}</p>
              <p className="address-phone">{address.phone}</p>
              <div className="address-card-actions">
                <button type="button" disabled={busyId !== null} onClick={() => beginEdit(address)}><Edit3 size={16} />Edit</button>
                {!address.isDefault && <button type="button" disabled={busyId !== null} onClick={() => void handleDefault(address.id)}><Star size={16} />Set default</button>}
                <button type="button" className="danger-action" disabled={busyId !== null} onClick={() => void handleDelete(address)}><Trash2 size={16} />Delete</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
