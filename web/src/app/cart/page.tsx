"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ShoppingBag, ArrowLeft, Trash2, Plus, Minus, Tag, AlertCircle } from "lucide-react";

import { useCart } from "@/components/providers/cart-provider";
import { Container } from "@/components/layout/layout-primitives";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import Image from "next/image";

export default function CartPage() {
  const { cart, loading, updateQuantity, removeFromCart, applyCoupon } = useCart();
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    await applyCoupon(couponCode);
    setCouponLoading(false);
  };

  const totalItems = cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;

  if (loading && !cart) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-40">
        <Spinner className="h-10 w-10 text-primary" />
        <p className="text-sm text-muted-foreground mt-2">Loading your shopping bag...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 py-12 bg-background text-foreground">
      <Container className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Shopping Bag</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {totalItems === 0 ? "Your bag is empty" : `You have ${totalItems} item(s) in your bag`}
          </p>
        </div>

        {!cart || cart.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-20 bg-card rounded-lg border border-border">
            <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center text-muted-foreground mb-6">
              <ShoppingBag className="h-10 w-10" />
            </div>
            <h2 className="text-xl font-bold">Your shopping bag is empty</h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm">
              Explore our collections to add apparel, accessories, and products to your bag.
            </p>
            <Link href="/products" className="mt-8">
              <Button className="font-semibold">Browse Catalog</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Cart Items List */}
            <div className="lg:col-span-8 flex flex-col gap-4">
              {cart.items.map((item) => {
                const snapshot = item.productSnapshot;
                const formattedLineTotal = ((item.price * item.quantity) / 100).toFixed(2);
                const unitPrice = (item.price / 100).toFixed(2);

                return (
                  <Card key={item.sku} className="overflow-hidden border-border/70">
                    <CardContent className="p-6 flex flex-col sm:flex-row gap-6">
                      <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded border border-border overflow-hidden bg-muted flex-shrink-0">
                        <Image
                          src={snapshot.mainImage || "/placeholder.jpg"}
                          alt={snapshot.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <h3 className="font-bold text-base line-clamp-1">{snapshot.title}</h3>
                              {snapshot.brandName && (
                                <p className="text-xs text-muted-foreground font-semibold mt-0.5">
                                  {snapshot.brandName}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => removeFromCart(item.sku)}
                              className="text-muted-foreground hover:text-destructive p-1"
                              aria-label="Remove item"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          {Object.keys(snapshot.variantAttributes).length > 0 && (
                            <div className="flex gap-2 flex-wrap mt-2">
                              {Object.entries(snapshot.variantAttributes).map(([key, val]) => (
                                <span
                                  key={key}
                                  className="text-[10px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded font-semibold capitalize border border-border/40"
                                >
                                  {key}: {val}
                                </span>
                              ))}
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground font-mono mt-1">
                            SKU: {item.sku}
                          </p>
                        </div>

                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/40">
                          {/* Quantity Controls */}
                          <div className="flex items-center border border-border rounded">
                            <button
                              onClick={() => updateQuantity(item.sku, item.quantity - 1)}
                              className="p-1.5 hover:bg-muted text-muted-foreground"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="px-3 text-sm font-bold select-none">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.sku, item.quantity + 1)}
                              className="p-1.5 hover:bg-muted text-muted-foreground"
                              aria-label="Increase quantity"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                          <span className="text-base font-extrabold text-foreground">
                            ${formattedLineTotal}{" "}
                            <span className="text-xs font-normal text-muted-foreground">
                              (${unitPrice} ea)
                            </span>
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              <Link
                href="/products"
                className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline mt-4"
              >
                <ArrowLeft className="h-4 w-4" />
                Continue Shopping
              </Link>
            </div>

            {/* Order Summary sidebar */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  {/* Prices breakdown */}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-semibold">${(cart.subtotal / 100).toFixed(2)}</span>
                  </div>

                  {cart.tax > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Taxes (Estimated)</span>
                      <span className="font-semibold">${(cart.tax / 100).toFixed(2)}</span>
                    </div>
                  )}

                  {cart.shipping === 0 ? (
                    <div className="flex justify-between text-sm text-emerald-600 dark:text-emerald-400">
                      <span>Shipping</span>
                      <span className="font-semibold">Free</span>
                    </div>
                  ) : (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className="font-semibold">${(cart.shipping / 100).toFixed(2)}</span>
                    </div>
                  )}

                  {/* Promo codes applied */}
                  {cart.promoCodesApplied.length > 0 && (
                    <div className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 p-3 rounded-lg border border-emerald-100 dark:border-emerald-900/40 text-xs flex flex-col gap-1">
                      <div className="font-bold flex items-center gap-1.5">
                        <Tag className="h-3.5 w-3.5" />
                        Applied Codes:
                      </div>
                      <div className="flex gap-1.5 flex-wrap mt-1">
                        {cart.promoCodesApplied.map((code) => (
                          <span
                            key={code}
                            className="bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded font-mono font-bold uppercase"
                          >
                            {code}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="border-t border-border pt-4 flex justify-between items-center">
                    <span className="font-bold text-base">Estimated Total</span>
                    <span className="font-black text-2xl text-foreground">
                      ${(cart.total / 100).toFixed(2)}
                    </span>
                  </div>

                  {/* Checkout CTA */}
                  <div className="mt-4 flex flex-col gap-2">
                    <Button className="w-full py-6 text-base font-semibold" disabled>
                      Proceed to Checkout
                    </Button>
                    <p className="text-[10px] text-center text-muted-foreground flex items-center justify-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Checkout and payment integration scheduled for Sprint 6.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Promo input card */}
              <Card className="border-border">
                <CardContent className="p-6">
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <Input
                      placeholder="Promo Code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="font-mono uppercase"
                      disabled={couponLoading}
                    />
                    <Button
                      type="submit"
                      variant="outline"
                      disabled={couponLoading || !couponCode.trim()}
                    >
                      {couponLoading ? <Spinner className="h-4 w-4" /> : "Apply"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
