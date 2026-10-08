import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle, ChevronLeft, ChevronRight, Play, ShoppingCart } from "lucide-react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

import { ApiException } from "../../api/client";
import { Product, productApi } from "../../api/products";
import { useAuth } from "../../features/auth/AuthContext";
import { useCart } from "../../features/cart/CartContext";

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
  const [quantity, setQuantity] = useState(1);
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

  const mediaItems = useMemo(
    () => [...(product?.media ?? [])].sort((left, right) => left.sortOrder - right.sortOrder),
    [product],
  );
  const selectedMedia =
    mediaItems.find((item) => item.id === selectedMediaId) ?? mediaItems[0];

  const moveMedia = (direction: -1 | 1) => {
    if (!selectedMedia || mediaItems.length < 2) return;
    const currentIndex = mediaItems.findIndex((item) => item.id === selectedMedia.id);
    const nextIndex = (currentIndex + direction + mediaItems.length) % mediaItems.length;
    setSelectedMediaId(mediaItems[nextIndex].id);
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
      await addItem(selectedVariant.id, quantity);
      setMessage(`${quantity} item${quantity === 1 ? "" : "s"} added to your cart.`);
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

  const displayedPrice = selectedVariant?.price ?? product.price;

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
          <p className="product-detail-price">{priceFormatter.format(Number(displayedPrice))}</p>
          {product.shortDescription && <p className="product-detail-summary">{product.shortDescription}</p>}

          {(product.variants?.length ?? 0) > 0 && (
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

          <div className="product-purchase-row">
            <div className="form-group quantity-field">
              <label htmlFor="quantity">Quantity</label>
              <input
                id="quantity"
                className="form-input"
                type="number"
                min={1}
                max={selectedVariant?.stockQuantity ?? 1}
                value={quantity}
                onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))}
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
