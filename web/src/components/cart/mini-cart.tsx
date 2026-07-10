"use client";

import React from "react";
import Link from "next/link";
import { ShoppingBag, Trash2, Plus, Minus } from "lucide-react";
import { useCart } from "../providers/cart-provider";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import Image from "next/image";

export function MiniCart() {
  const { cart, loading, updateQuantity, removeFromCart } = useCart();

  const totalItems = cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="ghost" size="icon" className="relative cursor-pointer">
          <ShoppingBag className="h-5 w-5" />
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
              {totalItems}
            </span>
          )}
        </Button>
      </DrawerTrigger>
      <DrawerContent
        side="right"
        className="flex flex-col h-full max-w-md w-full border-l border-border bg-card p-0"
      >
        <DrawerHeader className="p-6 border-b border-border flex justify-between items-center">
          <DrawerTitle className="text-xl font-bold flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Your Cart ({totalItems})
          </DrawerTitle>
        </DrawerHeader>

        {/* Cart items list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading && !cart ? (
            <div className="flex flex-col items-center justify-center h-full py-20">
              <Spinner className="h-8 w-8 text-primary" />
              <p className="text-sm text-muted-foreground mt-2">Loading your cart...</p>
            </div>
          ) : !cart || cart.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-20">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-muted-foreground mb-4">
                <ShoppingBag className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold">Your cart is empty</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-[240px]">
                Add some items from our catalog to get started.
              </p>
              <DrawerClose asChild>
                <Link href="/products" className="mt-6 inline-block">
                  <Button size="sm">Browse Products</Button>
                </Link>
              </DrawerClose>
            </div>
          ) : (
            cart.items.map((item) => {
              const snapshot = item.productSnapshot;
              const formattedPrice = ((item.price * item.quantity) / 100).toFixed(2);
              const unitPrice = (item.price / 100).toFixed(2);

              return (
                <div key={item.sku} className="flex gap-4 border-b border-border/50 pb-4">
                  <div className="relative w-20 h-20 rounded border border-border overflow-hidden bg-muted flex-shrink-0">
                    <Image
                      src={snapshot.mainImage || "/placeholder.jpg"}
                      alt={snapshot.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-semibold text-sm line-clamp-1">{snapshot.title}</h4>
                      {snapshot.brandName && (
                        <p className="text-xs text-muted-foreground font-medium">
                          {snapshot.brandName}
                        </p>
                      )}
                      {Object.keys(snapshot.variantAttributes).length > 0 && (
                        <div className="flex gap-2 flex-wrap mt-1">
                          {Object.entries(snapshot.variantAttributes).map(([key, val]) => (
                            <span
                              key={key}
                              className="text-[10px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded font-medium capitalize"
                            >
                              {key}: {val}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      {/* Quantity Controls */}
                      <div className="flex items-center border border-border rounded">
                        <button
                          onClick={() => updateQuantity(item.sku, item.quantity - 1)}
                          className="p-1 hover:bg-muted text-muted-foreground"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="px-2.5 text-sm font-semibold select-none">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.sku, item.quantity + 1)}
                          className="p-1 hover:bg-muted text-muted-foreground"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="text-sm font-bold">
                        ${formattedPrice}{" "}
                        <span className="text-xs font-normal text-muted-foreground">
                          (${unitPrice} ea)
                        </span>
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.sku)}
                    className="text-muted-foreground hover:text-destructive flex-shrink-0 self-start p-1"
                    aria-label="Delete item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Summary */}
        {cart && cart.items.length > 0 && (
          <div className="p-6 border-t border-border bg-secondary/25 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground">Subtotal</span>
              <span className="text-lg font-bold">${(cart.subtotal / 100).toFixed(2)}</span>
            </div>
            {cart.shipping === 0 ? (
              <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
                <span className="text-sm font-medium">Shipping</span>
                <span className="text-sm font-semibold">Free</span>
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">Shipping</span>
                <span className="text-sm font-semibold">${(cart.shipping / 100).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center border-t border-border/55 pt-3">
              <span className="text-base font-semibold">Estimated Total</span>
              <span className="text-xl font-extrabold text-foreground">
                ${(cart.total / 100).toFixed(2)}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2 pt-2">
              <DrawerClose asChild>
                <Link href="/cart">
                  <Button className="w-full font-semibold cursor-pointer">View Shopping Bag</Button>
                </Link>
              </DrawerClose>
            </div>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
