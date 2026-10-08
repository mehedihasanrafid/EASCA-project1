import React, { createContext, useContext, useEffect, useState } from "react";

import { Cart, cartApi } from "../../api/cart";
import { ApiException } from "../../api/client";
import { useAuth } from "../auth/AuthContext";

interface CartContextValue {
  cart: Cart | null;
  loading: boolean;
  error: string;
  busyItemId: string | null;
  refreshCart: () => Promise<void>;
  addItem: (productVariantId: string, quantity: number) => Promise<Cart>;
  updateItem: (itemId: string, quantity: number) => Promise<Cart>;
  removeItem: (itemId: string) => Promise<Cart>;
  clearCart: () => Promise<Cart>;
  clearError: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

function getErrorMessage(error: unknown) {
  return error instanceof ApiException
    ? error.error.message
    : error instanceof Error
      ? error.message
      : "Could not update your cart.";
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [busyItemId, setBusyItemId] = useState<string | null>(null);
  const canUseCart = Boolean(
    user && user.role.code !== "ADMIN" && user.role.code !== "OWNER",
  );

  useEffect(() => {
    if (authLoading) return;

    if (!canUseCart) {
      setCart(null);
      setLoading(false);
      setError("");
      setBusyItemId(null);
      return;
    }

    let active = true;
    setLoading(true);
    setError("");

    cartApi
      .getCart()
      .then((nextCart) => {
        if (active) setCart(nextCart);
      })
      .catch((requestError: unknown) => {
        if (active) setError(getErrorMessage(requestError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [authLoading, canUseCart, user?.id]);

  const requireCustomer = () => {
    if (!canUseCart) {
      throw new Error("A customer account is required to use the cart.");
    }
  };

  const refreshCart = async () => {
    requireCustomer();
    setLoading(true);
    setError("");

    try {
      const nextCart = await cartApi.getCart();
      setCart(nextCart);
    } catch (requestError) {
      const message = getErrorMessage(requestError);
      setError(message);
      throw requestError;
    } finally {
      setLoading(false);
    }
  };

  const addItem = async (productVariantId: string, quantity: number) => {
    requireCustomer();
    setError("");

    try {
      const nextCart = await cartApi.addItem(productVariantId, quantity);
      setCart(nextCart);
      return nextCart;
    } catch (requestError) {
      setError(getErrorMessage(requestError));
      throw requestError;
    }
  };

  const updateItem = async (itemId: string, quantity: number) => {
    requireCustomer();
    setBusyItemId(itemId);
    setError("");

    try {
      const nextCart = await cartApi.updateItem(itemId, quantity);
      setCart(nextCart);
      return nextCart;
    } catch (requestError) {
      setError(getErrorMessage(requestError));
      throw requestError;
    } finally {
      setBusyItemId(null);
    }
  };

  const removeItem = async (itemId: string) => {
    requireCustomer();
    setBusyItemId(itemId);
    setError("");

    try {
      const nextCart = await cartApi.removeItem(itemId);
      setCart(nextCart);
      return nextCart;
    } catch (requestError) {
      setError(getErrorMessage(requestError));
      throw requestError;
    } finally {
      setBusyItemId(null);
    }
  };

  const clearCart = async () => {
    requireCustomer();
    setBusyItemId("clear");
    setError("");

    try {
      const nextCart = await cartApi.clearCart();
      setCart(nextCart);
      return nextCart;
    } catch (requestError) {
      setError(getErrorMessage(requestError));
      throw requestError;
    } finally {
      setBusyItemId(null);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        error,
        busyItemId,
        refreshCart,
        addItem,
        updateItem,
        removeItem,
        clearCart,
        clearError: () => setError(""),
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }

  return context;
};
