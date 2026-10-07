import React, { useEffect, useMemo, useState } from 'react';
import { Product, ProductMedia } from '../api/products';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const mediaItems = useMemo(() => {
    const items = [...(product.media ?? [])].sort((left, right) => left.sortOrder - right.sortOrder);

    if (product.primaryImage && !items.some((item) => item.id === product.primaryImage?.id)) {
      items.unshift(product.primaryImage);
    }

    return items;
  }, [product.media, product.primaryImage]);
  const primaryIndex = Math.max(0, mediaItems.findIndex((item) => item.id === product.primaryImage?.id));
  const [activeMediaIndex, setActiveMediaIndex] = useState(primaryIndex);
  const [previewing, setPreviewing] = useState(false);
  const activeMedia: ProductMedia | undefined = mediaItems[activeMediaIndex];

  useEffect(() => {
    setActiveMediaIndex(primaryIndex);
  }, [primaryIndex, product.id]);

  useEffect(() => {
    if (!previewing || mediaItems.length < 2) return;

    const delay = activeMedia?.type === "VIDEO" ? 6000 : 1800;
    const timeout = window.setTimeout(() => {
      setActiveMediaIndex((current) => (current + 1) % mediaItems.length);
    }, delay);

    return () => window.clearTimeout(timeout);
  }, [activeMedia?.type, activeMediaIndex, mediaItems.length, previewing]);

  const startPreview = () => {
    if (mediaItems.length < 2) return;
    setPreviewing(true);
    setActiveMediaIndex((primaryIndex + 1) % mediaItems.length);
  };

  const stopPreview = () => {
    setPreviewing(false);
    setActiveMediaIndex(primaryIndex);
  };

  const priceFormatter = new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    minimumFractionDigits: 0
  });

  return (
    <div
      className="product-card"
      onMouseEnter={startPreview}
      onMouseLeave={stopPreview}
      onFocusCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) startPreview();
      }}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) stopPreview();
      }}
    >
      <Link to={`/products/${product.slug}`} className="product-image-link">
        {activeMedia?.type === "VIDEO" ? (
          <video
            key={activeMedia.id}
            src={activeMedia.url}
            className="product-image product-card-video product-card-media"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-label={activeMedia.altText || `${product.name} video preview`}
          />
        ) : activeMedia ? (
          <img
            key={activeMedia.id}
            src={activeMedia.thumbnailUrl || activeMedia.url}
            alt={activeMedia.altText || product.name}
            className="product-image product-card-media"
            loading="lazy"
          />
        ) : (
          <span className="product-image-placeholder">No image</span>
        )}
        {product.discountPrice !== null && (
          <span className="product-badge">Sale</span>
        )}
      </Link>
      <div className="product-details">
        <Link to={`/products/${product.slug}`} className="product-title-link">
          <h3 className="product-title" title={product.name}>{product.name}</h3>
        </Link>
        <div className="product-price-row">
          <div className="product-price">
            {product.discountPrice !== null ? (
              <>
                <span className="current-price">{priceFormatter.format(Number(product.discountPrice))}</span>
                <span className="original-price">{priceFormatter.format(Number(product.regularPrice))}</span>
              </>
            ) : (
              <span className="current-price">{priceFormatter.format(Number(product.price))}</span>
            )}
          </div>
          <Link className="btn-add-cart" to={`/products/${product.slug}`} aria-label={`View ${product.name}`} title="View product">
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </div>
  );
};
