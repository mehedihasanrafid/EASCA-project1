import React, { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, BadgePercent, CheckCircle, MapPin, PackageCheck, ReceiptText, Tag, Truck, X } from "lucide-react";
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

function orderItemLabel(item: Order["items"][number]) {
  return item.variantName ? `${item.productName} · ${item.variantName}` : item.productName;
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
  const [couponInput, setCouponInput] = useState("");
  const [appliedCouponCode, setAppliedCouponCode] = useState("");
  const [couponError, setCouponError] = useState("");
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
    setCouponError("");

    orderApi
      .previewCheckout(selectedAddressId, appliedCouponCode || undefined)
      .then((result) => {
        if (active) setPreview(result);
      })
      .catch((requestError) => {
        if (active) {
          setPreview(null);
          if (appliedCouponCode) setCouponError(errorMessage(requestError));
          else setError(errorMessage(requestError));
        }
      })
      .finally(() => {
        if (active) setPreviewLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedAddressId, appliedCouponCode]);

  const handleCheckout = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedAddressId) return;
    setSubmitting(true);
    setError("");

    try {
      const order = await orderApi.checkout(selectedAddressId, customerNote, appliedCouponCode || undefined);
      setPlacedOrder(order);
      await refreshCart();
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  };

  if (placedOrder) {
    const totalQuantity = placedOrder.items.reduce((sum, item) => sum + item.quantity, 0);
    return (
      <div className="checkout-page">
        <div className="checkout-success">
          <PackageCheck size={58} />
          <p className="eyebrow">Order placed</p>
          <h1>Thank you for your order</h1>
          <p>We received your cash-on-delivery order and saved its final price.</p>

          <div className="checkout-success-reference">
            <div><span>Order number</span><strong>{placedOrder.orderNumber}</strong></div>
            <div><span>Status</span><strong>{placedOrder.orderStatus}</strong></div>
          </div>

          <div className="checkout-confirmation-grid">
            <section>
              <h2><ReceiptText size={18} /> Order details</h2>
              <div className="checkout-confirmation-items">
                {placedOrder.items.map((item) => (
                  <div key={item.id}>
                    <span>{orderItemLabel(item)} × {item.quantity}</span>
                    <strong>{priceFormatter.format(Number(item.lineTotal))}</strong>
                  </div>
                ))}
              </div>
              <div className="checkout-confirmation-row"><span>Subtotal</span><strong>{priceFormatter.format(Number(placedOrder.subtotal))}</strong></div>
              {Number(placedOrder.productDiscountTotal) > 0 && (
                <div className="checkout-confirmation-row is-saving"><span>Product savings</span><strong>−{priceFormatter.format(Number(placedOrder.productDiscountTotal))}</strong></div>
              )}
              {placedOrder.couponCode && (
                <div className="checkout-confirmation-row is-saving"><span>Coupon {placedOrder.couponCode}</span><strong>−{priceFormatter.format(Number(placedOrder.couponDiscountTotal))}</strong></div>
              )}
              <div className="checkout-confirmation-row"><span>Delivery</span><strong>{priceFormatter.format(Number(placedOrder.deliveryCharge))}</strong></div>
              <div className="checkout-success-total">
                <span>Cash on delivery total</span>
                <strong>{priceFormatter.format(Number(placedOrder.grandTotal))}</strong>
              </div>
              <small>{totalQuantity} item{totalQuantity === 1 ? "" : "s"} will be prepared for delivery.</small>
            </section>

            <section>
              <h2><Truck size={18} /> Deliver to</h2>
              <strong>{placedOrder.recipientName}</strong>
              <p>{placedOrder.recipientPhone}</p>
              <p>
                {placedOrder.deliveryAddress.addressLine1}
                {placedOrder.deliveryAddress.addressLine2 ? `, ${placedOrder.deliveryAddress.addressLine2}` : ""}, {placedOrder.deliveryAddress.area}, {placedOrder.deliveryAddress.city}, {placedOrder.deliveryAddress.district}
              </p>
              <span>{placedOrder.deliveryAddress.isInsideDhaka ? "Inside Dhaka delivery" : "Outside Dhaka delivery"}</span>
            </section>
          </div>

          <div className="checkout-success-actions">
            <Link to={`/account/orders/${placedOrder.id}`} className="btn btn-primary">View order details</Link>
            <Link to="/" className="btn btn-ghost">Continue shopping</Link>
          </div>
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
          {preview && (
            <p className="checkout-summary-count">
              {preview.totalQuantity} item{preview.totalQuantity === 1 ? "" : "s"} · {preview.itemCount} SKU{preview.itemCount === 1 ? "" : "s"}
            </p>
          )}
          <div className="checkout-summary-items">
            {(preview?.items ?? cart.items.map((item) => ({
              id: item.id,
              productName: item.product.name,
              variantLabel: item.productVariant.optionValues.map((value) => value.label).join(" / ") || item.productVariant.variantName,
              sku: item.productVariant.sku,
              quantity: item.quantity,
              regularUnitPrice: item.regularUnitPrice,
              unitPrice: item.unitPrice,
              lineTotal: item.lineTotal,
              savingsTotal: item.savingsTotal,
              pricing: item.pricing,
            }))).map((item) => (
              <div className="checkout-summary-item" key={item.id}>
                <span>
                  <strong>{item.productName} × {item.quantity}</strong>
                  {item.variantLabel && <small>{item.variantLabel}</small>}
                  <small>SKU: {item.sku} · {priceFormatter.format(Number(item.unitPrice))} each</small>
                  {item.pricing.source === "QUANTITY_TIER" && (
                    <em><BadgePercent size={12} /> {item.pricing.minimumQuantity}+ quantity price</em>
                  )}
                  {item.pricing.source === "DISCOUNT" && (
                    <em><BadgePercent size={12} /> Sale price</em>
                  )}
                </span>
                <strong>{priceFormatter.format(Number(item.lineTotal))}</strong>
              </div>
            ))}
          </div>
          <div className="checkout-coupon">
            <label htmlFor="coupon-code"><Tag size={15} /> Coupon code</label>
            {appliedCouponCode && preview?.couponCode ? (
              <div className="checkout-coupon-applied">
                <span><CheckCircle size={15} /><strong>{preview.couponCode}</strong> applied</span>
                <button type="button" aria-label="Remove coupon" onClick={() => { setAppliedCouponCode(""); setCouponInput(""); }}><X size={15} /></button>
              </div>
            ) : (
              <div className="checkout-coupon-entry">
                <input id="coupon-code" className="form-input" value={couponInput} maxLength={40} placeholder="Enter coupon" onChange={(event) => { setCouponInput(event.target.value.toUpperCase()); setCouponError(""); }} />
                <button type="button" className="btn btn-ghost" disabled={!couponInput.trim() || previewLoading} onClick={() => setAppliedCouponCode(couponInput.trim().toUpperCase())}>Apply</button>
              </div>
            )}
            {couponError && <small className="checkout-coupon-error">{couponError} <button type="button" onClick={() => setAppliedCouponCode("")}>Remove</button></small>}
          </div>
          <div className="cart-summary-row"><span>Regular subtotal</span><strong>{priceFormatter.format(Number(preview?.regularSubtotal ?? cart.totals.regularSubtotal))}</strong></div>
          {Number(preview?.productDiscountTotal ?? cart.totals.savingsTotal) > 0 && (
            <div className="cart-summary-row checkout-summary-saving"><span>Product savings</span><strong>−{priceFormatter.format(Number(preview?.productDiscountTotal ?? cart.totals.savingsTotal))}</strong></div>
          )}
          <div className="cart-summary-row"><span>Discounted subtotal</span><strong>{priceFormatter.format(Number(preview?.subtotal ?? cart.totals.subtotal))}</strong></div>
          {preview && Number(preview.couponDiscountTotal) > 0 && (
            <div className="cart-summary-row checkout-summary-saving"><span>Coupon {preview.couponCode}</span><strong>−{priceFormatter.format(Number(preview.couponDiscountTotal))}</strong></div>
          )}
          <div className="cart-summary-row"><span>{preview?.isInsideDhaka ? "Inside Dhaka delivery" : preview ? "Outside Dhaka delivery" : "Delivery"}</span><strong>{previewLoading ? "Calculating..." : preview ? priceFormatter.format(Number(preview.deliveryCharge)) : selectedAddress ? "Unavailable" : "Select address"}</strong></div>
          <div className="cart-summary-total"><span>Cash on delivery total</span><strong>{preview ? priceFormatter.format(Number(preview.grandTotal)) : "—"}</strong></div>
          <p className="checkout-charge-note"><CheckCircle size={14} /> Prices, stock, savings, and delivery are recalculated securely before the order is created.</p>
          {hasUnavailableItems && <p className="cart-summary-warning">Return to your cart and remove unavailable items.</p>}
          <button type="submit" className="btn btn-primary btn-full checkout-submit" disabled={submitting || previewLoading || !preview || !selectedAddressId || hasUnavailableItems}>{submitting ? "Placing order..." : "Place cash-on-delivery order"}</button>
        </aside>
      </form>
    </div>
  );
};
