"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Cart } from "@zell/shared";

import { useAuth } from "./auth-provider";
import {
  getCartAction,
  addToCartAction,
  updateQuantityAction,
  removeFromCartAction,
  clearCartAction,
  applyCouponAction,
  mergeCartsAction,
} from "@/app/cart/actions";
import { useToast } from "@/components/ui/toast";

interface CartContextType {
  cart: Cart | null;
  loading: boolean;
  addToCart: (
    productId: string,
    sku: string,
    quantity: number,
    attributes: Record<string, string>
  ) => Promise<boolean>;
  updateQuantity: (sku: string, quantity: number) => Promise<boolean>;
  removeFromCart: (sku: string) => Promise<boolean>;
  clearCart: () => Promise<boolean>;
  applyCoupon: (code: string) => Promise<boolean>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const refreshCart = async () => {
    setLoading(true);
    const res = await getCartAction();
    if (res.success && res.cart) {
      setCart(res.cart);
    }
    setLoading(false);
  };

  // Sync / merge cart when auth state changes
  useEffect(() => {
    const syncCart = async () => {
      setLoading(true);
      if (user) {
        // User logged in: trigger merge
        const res = await mergeCartsAction();
        if (res.success && res.cart) {
          setCart(res.cart);
        }
      } else {
        // Guest user: get or create guest cart
        const res = await getCartAction();
        if (res.success && res.cart) {
          setCart(res.cart);
        }
      }
      setLoading(false);
    };

    syncCart();
  }, [user]);

  const addToCart = async (
    productId: string,
    sku: string,
    quantity: number,
    attributes: Record<string, string>
  ): Promise<boolean> => {
    setLoading(true);
    const res = await addToCartAction(productId, sku, quantity, attributes);
    setLoading(false);
    if (res.success && res.cart) {
      setCart(res.cart);
      toast({
        title: "Added to cart",
        description: "Your item was successfully added to the bag.",
        variant: "default",
      });
      return true;
    } else {
      toast({
        title: "Failed to add",
        description: res.error || "Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const updateQuantity = async (sku: string, quantity: number): Promise<boolean> => {
    setLoading(true);
    const res = await updateQuantityAction(sku, quantity);
    setLoading(false);
    if (res.success && res.cart) {
      setCart(res.cart);
      return true;
    } else {
      toast({
        title: "Failed to update",
        description: res.error || "Inventory stock is limited.",
        variant: "destructive",
      });
      return false;
    }
  };

  const removeFromCart = async (sku: string): Promise<boolean> => {
    setLoading(true);
    const res = await removeFromCartAction(sku);
    setLoading(false);
    if (res.success && res.cart) {
      setCart(res.cart);
      toast({
        title: "Removed",
        description: "Item removed from cart.",
        variant: "default",
      });
      return true;
    } else {
      toast({
        title: "Error removing item",
        description: res.error || "Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const clearCart = async (): Promise<boolean> => {
    setLoading(true);
    const res = await clearCartAction();
    setLoading(false);
    if (res.success && res.cart) {
      setCart(res.cart);
      toast({
        title: "Cart Cleared",
        description: "All items have been cleared.",
        variant: "default",
      });
      return true;
    } else {
      return false;
    }
  };

  const applyCoupon = async (code: string): Promise<boolean> => {
    setLoading(true);
    const res = await applyCouponAction(code);
    setLoading(false);
    if (res.success && res.cart) {
      setCart(res.cart);
      toast({
        title: "Coupon Applied",
        description: `Successfully applied promo code: ${code}`,
        variant: "default",
      });
      return true;
    } else {
      toast({
        title: "Invalid Coupon",
        description: res.error || "Check expiration date or order minimums.",
        variant: "destructive",
      });
      return false;
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        applyCoupon,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
