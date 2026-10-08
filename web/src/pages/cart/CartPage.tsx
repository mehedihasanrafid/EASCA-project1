import React from "react";
import {
  ArrowLeft,
  Minus,
  PackageOpen,
  Plus,
  RefreshCw,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

import { CartItem } from "../../api/cart";
import { useCart } from "../../features/cart/CartContext";

const priceFormatter = new Intl.NumberFormat("en-BD", {
  style: "currency",
  currency: "BDT",
  minimumFractionDigits: 0,
});

function variantDescription(item: CartItem) {
  return [
    item.productVariant.variantName,
    item.productVariant.color,
    item.productVariant.size,
  ]
    .filter(Boolean)
    .join(" · ");
}

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    cart,
    loading,
    error,
    busyItemId,
    refreshCart,
    updateItem,
    removeItem,
    clearCart,
    clearError,
  } = useCart();

  const handleClear = async () => {
    if (!window.confirm("Remove every item from your cart?")) return;
    await clearCart().catch(() => undefined);
  };

  if (loading && !cart) {
    return <div className="loading-screen">Loading your cart...</div>;
  }

  if (!cart && error) {
    return (
      <div className="cart-page">
        <div className="cart-empty-state">
          <PackageOpen size={52} />
          <h1>We could not load your cart</h1>
          <p>{error}</p>
          <button type="button" className="btn btn-primary" onClick={() => void refreshCart()}>
            <RefreshCw size={18} /> Try again
          </button>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="cart-page">
        <div className="cart-empty-state">
          <ShoppingBag size={52} />
          <h1>Your cart is empty</h1>
          <p>Add a product you like, and it will appear here.</p>
          <Link to="/" className="btn btn-primary">
            <ArrowLeft size={18} /> Browse products
          </Link>
        </div>
      </div>
    );
  }

  const hasUnavailableItems = cart.items.some((item) => !item.available);

  return (
    <div className="cart-page">
      <div className="cart-page-heading">
        <div>
          <p className="eyebrow">Your order</p>
          <h1>Shopping cart</h1>
          <p>
            {cart.totals.totalQuantity} item{cart.totals.totalQuantity === 1 ? "" : "s"} in your cart
          </p>
        </div>
        <button
          type="button"
          className="cart-clear-button"
          disabled={busyItemId !== null}
          onClick={() => void handleClear()}
        >
          <Trash2 size={17} /> Clear cart
        </button>
      </div>

      {error && (
        <div className="alert alert-error cart-alert" role="alert">
          <span>{error}</span>
          <button type="button" aria-label="Dismiss cart error" onClick={clearError}>×</button>
        </div>
      )}

      <div className="cart-layout">
        <section className="cart-items" aria-label="Cart items">
          {cart.items.map((item) => {
            const itemBusy = busyItemId === item.id;
            const description = variantDescription(item);
            const image = item.product.primaryImage;

            return (
              <article className={`cart-item${!item.available ? " is-unavailable" : ""}`} key={item.id}>
                <Link to={`/products/${item.product.slug}`} className="cart-item-image">
                  {image ? (
                    <img
                      src={image.thumbnailUrl || image.url}
                      alt={image.altText || item.product.name}
                    />
                  ) : (
                    <PackageOpen size={34} aria-hidden="true" />
                  )}
                </Link>

                <div className="cart-item-main">
                  <div className="cart-item-copy">
                    <Link to={`/products/${item.product.slug}`}>
                      <h2>{item.product.name}</h2>
                    </Link>
                    {description && <p>{description}</p>}
                    <span>SKU: {item.productVariant.sku}</span>
                    {!item.available && (
                      <strong>This item or quantity is no longer available.</strong>
                    )}
                  </div>

                  <div className="cart-item-actions">
                    <div className="cart-quantity" aria-label={`Quantity for ${item.product.name}`}>
                      <button
                        type="button"
                        aria-label={`Decrease ${item.product.name} quantity`}
                        disabled={busyItemId !== null || item.quantity <= 1 || !item.available}
                        onClick={() => void updateItem(item.id, item.quantity - 1).catch(() => undefined)}
                      >
                        <Minus size={16} />
                      </button>
                      <span aria-live="polite">{item.quantity}</span>
                      <button
                        type="button"
                        aria-label={`Increase ${item.product.name} quantity`}
                        disabled={
                          busyItemId !== null ||
                          !item.available ||
                          item.quantity >= item.productVariant.stockQuantity
                        }
                        onClick={() => void updateItem(item.id, item.quantity + 1).catch(() => undefined)}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <button
                      type="button"
                      className="cart-remove-button"
                      disabled={busyItemId !== null}
                      onClick={() => void removeItem(item.id).catch(() => undefined)}
                    >
                      <Trash2 size={16} /> {itemBusy ? "Updating..." : "Remove"}
                    </button>
                  </div>
                </div>

                <div className="cart-item-price">
                  <strong>{priceFormatter.format(Number(item.lineTotal))}</strong>
                  <span>{priceFormatter.format(Number(item.unitPrice))} each</span>
                </div>
              </article>
            );
          })}
        </section>

        <aside className="cart-summary">
          <h2>Order summary</h2>
          <div className="cart-summary-row">
            <span>Items ({cart.totals.totalQuantity})</span>
            <strong>{priceFormatter.format(Number(cart.totals.subtotal))}</strong>
          </div>
          <div className="cart-summary-row">
            <span>Delivery</span>
            <span>Calculated at checkout</span>
          </div>
          <div className="cart-summary-total">
            <span>Subtotal</span>
            <strong>{priceFormatter.format(Number(cart.totals.subtotal))}</strong>
          </div>
          {hasUnavailableItems && (
            <p className="cart-summary-warning">Remove unavailable items before checkout.</p>
          )}
          <button type="button" className="btn btn-primary btn-full cart-checkout-button" disabled={hasUnavailableItems || busyItemId !== null} onClick={() => navigate("/checkout")}>Proceed to checkout</button>
          <Link to="/" className="btn btn-ghost btn-full cart-continue-link">
            <ArrowLeft size={17} /> Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
};
