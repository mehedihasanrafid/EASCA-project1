import React, { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, CheckCircle, MapPin, PackageCheck } from "lucide-react";
import { Link } from "react-router-dom";

import { Address, addressApi } from "../../api/addresses";
import { ApiException } from "../../api/client";
import { CheckoutPreview, Order, orderApi } from "../../api/orders";
import { useCart } from "../../features/cart/CartContext";

const priceFormatter = new Intl.NumberFormat("en-BD", {
  style: "currency",
  currency: "BDT",
  minimumFractionDigits: 0,
});

function errorMessage(error: unknown) {
  return error instanceof ApiException
    ? error.error.message
    : error instanceof Error
      ? error.message
      : "Checkout could not be completed.";
}

export const CheckoutPage: React.FC = () => {
  const { cart, loading: cartLoading, refreshCart } = useCart();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [customerNote, setCustomerNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [preview, setPreview] = useState<CheckoutPreview | null>(null);
  const [error, setError] = useState("");
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  useEffect(() => {
    addressApi
      .list()
      .then((result) => {
        setAddresses(result);
        setSelectedAddressId(result.find((address) => address.isDefault)?.id ?? result[0]?.id ?? "");
      })
      .catch((requestError) => setError(errorMessage(requestError)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedAddressId) {
      setPreview(null);
      return;
    }

    let active = true;
    setPreviewLoading(true);
    setError("");

    orderApi
      .previewCheckout(selectedAddressId)
      .then((result) => {
        if (active) setPreview(result);
      })
      .catch((requestError) => {
        if (active) {
          setPreview(null);
          setError(errorMessage(requestError));
        }
      })
      .finally(() => {
        if (active) setPreviewLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedAddressId]);

  const handleCheckout = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedAddressId) return;
    setSubmitting(true);
    setError("");

    try {
      const order = await orderApi.checkout(selectedAddressId, customerNote);
      setPlacedOrder(order);
      await refreshCart();
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  };

  if (placedOrder) {
    return (
      <div className="checkout-page">
        <div className="checkout-success">
          <PackageCheck size={58} />
          <p className="eyebrow">Order placed</p>
          <h1>Thank you for your order</h1>
          <p>Your order number is <strong>{placedOrder.orderNumber}</strong>.</p>
          <div className="checkout-success-total">
            <span>Cash on delivery total</span>
            <strong>{priceFormatter.format(Number(placedOrder.grandTotal))}</strong>
          </div>
          <Link to="/account" className="btn btn-primary">Return to my account</Link>
        </div>
      </div>
    );
  }

  if (loading || cartLoading) return <div className="loading-screen">Preparing checkout...</div>;

  if (!cart || cart.items.length === 0) {
    return (
      <div className="checkout-page">
        <div className="cart-empty-state">
          <h1>Your cart is empty</h1>
          <p>Add a product before starting checkout.</p>
          <Link to="/" className="btn btn-primary">Browse products</Link>
        </div>
      </div>
    );
  }

  const hasUnavailableItems = cart.items.some((item) => !item.available);
  const selectedAddress = addresses.find((address) => address.id === selectedAddressId);

  return (
    <div className="checkout-page">
      <Link to="/cart" className="product-back-link"><ArrowLeft size={18} />Back to cart</Link>
      <div className="checkout-heading">
        <p className="eyebrow">Secure checkout</p>
        <h1>Delivery and payment</h1>
        <p>Review your address and place a cash-on-delivery order.</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form className="checkout-layout" onSubmit={handleCheckout}>
        <div className="checkout-main">
          <section className="checkout-panel">
            <div className="checkout-panel-heading">
              <div>
                <span>1</span>
                <div><h2>Delivery address</h2><p>Select where this order should be delivered.</p></div>
              </div>
              <Link to="/account/addresses" className="text-link">Manage addresses</Link>
            </div>

            {addresses.length === 0 ? (
              <div className="checkout-no-address">
                <MapPin size={35} />
                <p>You need a delivery address before placing an order.</p>
                <Link to="/account/addresses" className="btn btn-primary">Add an address</Link>
              </div>
            ) : (
              <div className="checkout-addresses">
                {addresses.map((address) => (
                  <label className={`checkout-address-option${selectedAddressId === address.id ? " is-selected" : ""}`} key={address.id}>
                    <input type="radio" name="address" value={address.id} checked={selectedAddressId === address.id} onChange={() => setSelectedAddressId(address.id)} />
                    <span>
                      <strong>{address.label || "Address"}{address.isDefault ? " · Default" : ""}</strong>
                      <small>{address.recipientName} · {address.phone}</small>
                      <small>{address.addressLine1}, {address.area}, {address.city}, {address.district}</small>
                    </span>
                  </label>
                ))}
              </div>
            )}
          </section>

          <section className="checkout-panel">
            <div className="checkout-panel-heading">
              <div><span>2</span><div><h2>Payment and note</h2><p>Payment is collected when your order is delivered.</p></div></div>
            </div>
            <div className="checkout-cod"><CheckCircle size={20} /><div><strong>Cash on delivery</strong><small>Pay the courier when you receive your products.</small></div></div>
            <div className="form-group checkout-note">
              <label htmlFor="customer-note">Delivery note (optional)</label>
              <textarea id="customer-note" className="form-input" maxLength={2000} value={customerNote} onChange={(event) => setCustomerNote(event.target.value)} placeholder="Example: Call before delivery" />
            </div>
          </section>
        </div>

        <aside className="cart-summary checkout-summary">
          <h2>Order summary</h2>
          <div className="checkout-summary-items">
            {cart.items.map((item) => <div key={item.id}><span>{item.product.name} × {item.quantity}</span><strong>{priceFormatter.format(Number(item.lineTotal))}</strong></div>)}
          </div>
          <div className="cart-summary-row"><span>Subtotal</span><strong>{priceFormatter.format(Number(preview?.subtotal ?? cart.totals.subtotal))}</strong></div>
          <div className="cart-summary-row"><span>Delivery</span><strong>{previewLoading ? "Calculating..." : preview ? priceFormatter.format(Number(preview.deliveryCharge)) : selectedAddress ? "Unavailable" : "Select address"}</strong></div>
          <div className="cart-summary-total"><span>Cash on delivery total</span><strong>{preview ? priceFormatter.format(Number(preview.grandTotal)) : "—"}</strong></div>
          <p className="checkout-charge-note">The final total is calculated by the backend using the selected delivery address.</p>
          {hasUnavailableItems && <p className="cart-summary-warning">Return to your cart and remove unavailable items.</p>}
          <button type="submit" className="btn btn-primary btn-full checkout-submit" disabled={submitting || previewLoading || !preview || !selectedAddressId || hasUnavailableItems}>{submitting ? "Placing order..." : "Place cash-on-delivery order"}</button>
        </aside>
      </form>
    </div>
  );
};
