import React, { useEffect, useState } from 'react';
import { Product, productApi } from '../api/products';
import { ProductCard } from '../components/ProductCard';

export const Home: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await productApi.getProducts({ limit: 12, sort: 'newest' });
        setProducts(data.products);
      } catch (err: any) {
        setError(err.message || 'Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <div className="home-page">
      <div className="hero-section">
        <h1>Welcome to DokanBD</h1>
        <p>Discover premium products at unbeatable prices.</p>
      </div>

      <div className="product-section">
        <h2 className="section-title">New Arrivals</h2>
        
        {loading && (
          <div className="product-grid">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="product-card skeleton" style={{ minHeight: '320px' }}>
                <div className="skeleton-image"></div>
                <div className="skeleton-content">
                  <div className="skeleton-text title"></div>
                  <div className="skeleton-text price"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="alert alert-error" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <div className="empty-state" style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
            <p>No products found right now. Check back later!</p>
          </div>
        )}

        {!loading && !error && products.length > 0 && (
          <div className="product-grid">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
