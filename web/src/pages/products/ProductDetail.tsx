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
import {
  editableQuantityFromInput,
  type EditableProductQuantity,
  purchasableQuantity,
} from "./productQuantity";
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
  const [quantity, setQuantity] = useState<EditableProductQuantity>(1);
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
  const resolvedQuantity = purchasableQuantity(
    quantity,
    selectedVariant?.stockQuantity ?? 1,
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
      // Resolve a temporarily empty input only when the cart needs a real integer.
      setQuantity(resolvedQuantity);
      await addItem(selectedVariant.id, resolvedQuantity);
      setMessage(`${resolvedQuantity} item${resolvedQuantity === 1 ? "" : "s"} added to your cart.`);
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
    ? resolveStorefrontPricing(selectedVariant, resolvedQuantity)
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
                  Add {pricing.nextTier.minimumQuantity - resolvedQuantity} more to unlock {priceFormatter.format(Number(pricing.nextTier.unitPrice))} each.
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
                inputMode="numeric"
                min={1}
                max={selectedVariant?.stockQuantity ?? 1}
                step={1}
                value={quantity}
                onChange={(event) => setQuantity(editableQuantityFromInput(
                  event.target.value,
                  selectedVariant?.stockQuantity ?? 1,
                ))}
                onBlur={() => setQuantity(resolvedQuantity)}
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
                {resolvedQuantity} × {priceFormatter.format(pricing.unitPrice)}
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
