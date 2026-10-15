import React, { useEffect, useRef, useState } from "react";
import { LayoutDashboard, LogOut, ShoppingCart, UserRound } from "lucide-react";
import { Link, useLocation } from "react-router-dom";


import { isStaffRole } from "../../shared/utils/roles";

import { useAuth } from "../auth/AuthContext";
import { useCart } from "../cart/CartContext";
import { ProductSearch } from "../catalog/components/ProductSearch";
import {
  HEADER_SEARCH_SOURCE_SELECTOR,
  PRODUCT_SEARCH_DRAFT_EVENT,
  shouldShowHeaderSearch,
} from "./storefrontSearch";
import styles from "./StorefrontHeader.module.css";

/** Shared header for the public store and signed-in customer pages. */
export const StorefrontHeader: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const animationFrameRef = useRef<number | null>(null);
  const [showCompactSearch, setShowCompactSearch] = useState(false);
  const [searchDraft, setSearchDraft] = useState(
    () => new URLSearchParams(location.search).get("q") ?? "",
  );
  
const isAdmin = isStaffRole(user?.role.code);

  const cartQuantity = cart?.totals.totalQuantity ?? 0;

  useEffect(() => {
    setSearchDraft(new URLSearchParams(location.search).get("q") ?? "");
  }, [location.search]);

  useEffect(() => {
    const synchronizeDraft = (event: Event) => {
      setSearchDraft((event as CustomEvent<string>).detail);
    };
    window.addEventListener(PRODUCT_SEARCH_DRAFT_EVENT, synchronizeDraft);
    return () => window.removeEventListener(PRODUCT_SEARCH_DRAFT_EVENT, synchronizeDraft);
  }, []);

  useEffect(() => {
    const updateSearchPosition = () => {
      if (animationFrameRef.current !== null) cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = requestAnimationFrame(() => {
        const source = document.querySelector<HTMLElement>(HEADER_SEARCH_SOURCE_SELECTOR);
        setShowCompactSearch(shouldShowHeaderSearch(source?.getBoundingClientRect().bottom ?? null));
      });
    };

    updateSearchPosition();
    window.addEventListener("scroll", updateSearchPosition, { passive: true });
    window.addEventListener("resize", updateSearchPosition);
    return () => {
      window.removeEventListener("scroll", updateSearchPosition);
      window.removeEventListener("resize", updateSearchPosition);
      if (animationFrameRef.current !== null) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [location.pathname]);

  return (
    <header className={styles.header}>
      <div className={styles.content}>
        <Link to="/" className={styles.logo}>DokanBD</Link>

        <div
          className={`${styles.searchSlot}${showCompactSearch ? ` ${styles.searchVisible}` : ` ${styles.searchHidden}`}`}
        >
          {showCompactSearch && (
            <ProductSearch
              initialValue={searchDraft}
              placeholder="Search products..."
              variant="compact"
            />
          )}
        </div>

        <div className={styles.actions}>
          {user ? (
            <div className={styles.userMenu}>
              {!isAdmin && (
                <Link
                  to="/cart"
                  className={`btn btn-ghost ${styles.cartLink}`}
                  aria-label={`Cart with ${cartQuantity} item${cartQuantity === 1 ? "" : "s"}`}
                >
                  <ShoppingCart size={20} aria-hidden="true" />
                  <span className={styles.actionLabel}>Cart</span>
                  {cartQuantity > 0 && <span className={styles.cartBadge}>{cartQuantity}</span>}
                </Link>
              )}

              <Link
                to={isAdmin ? "/admin" : "/account"}
                className={`btn btn-ghost ${styles.accountLink}`}
              >
                {isAdmin ? <LayoutDashboard size={18} /> : <UserRound size={18} />}
                <span>{isAdmin ? "Admin Dashboard" : "My Account"}</span>
              </Link>

              <div className={styles.userInfo}>
                <span className={styles.userName}>{user.name}</span>
                <span className={styles.roleBadge}>{user.role.name}</span>
              </div>

              <button onClick={logout} className="btn-icon" title="Log out" aria-label="Log out">
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <div className={styles.authLinks}>
              <Link to="/login" className="btn btn-ghost">Log In</Link>
              <Link to="/register" className="btn btn-primary">Sign Up</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
