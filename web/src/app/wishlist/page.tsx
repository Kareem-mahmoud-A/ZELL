"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";

import { Heart, Trash2, ShoppingCart, LogIn } from "lucide-react";
import { getWishlistAction, removeFromWishlistAction, moveToCartAction } from "./actions";
import { useCart } from "@/components/providers/cart-provider";
import { Container } from "@/components/layout/layout-primitives";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import Image from "next/image";
import { Wishlist, Product } from "@zell/shared";

export default function WishlistPage() {
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  const { refreshCart } = useCart();
  const { toast } = useToast();

  const loadWishlist = useCallback(async () => {
    const res = await getWishlistAction();
    if (res.success && res.wishlist && res.products) {
      setWishlist(res.wishlist);
      setProducts(res.products);
      setAuthError(false);
    } else {
      if (res.error?.includes("Authentication required") || res.error?.includes("Unauthorized")) {
        setAuthError(true);
      }
      setWishlist(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadWishlist();
  }, [loadWishlist]);

  const handleRemove = async (sku: string) => {
    const res = await removeFromWishlistAction(sku);
    if (res.success && res.wishlist) {
      setWishlist(res.wishlist);
      toast({
        title: "Removed",
        description: "Item removed from wishlist.",
      });
    } else {
      toast({
        title: "Error",
        description: res.error || "Failed to remove item.",
        variant: "destructive",
      });
    }
  };

  const handleMoveToCart = async (sku: string) => {
    const res = await moveToCartAction(sku);
    if (res.success) {
      toast({
        title: "Moved to Cart",
        description: "Item was moved to your shopping bag.",
      });
      // Refresh both wishlist and cart context
      await loadWishlist();
      await refreshCart();
    } else {
      toast({
        title: "Failed to Move",
        description: res.error || "Inventory stock is limited.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-40">
        <Spinner className="h-10 w-10 text-primary" />
        <p className="text-sm text-muted-foreground mt-2">Loading your wishlist...</p>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="flex-1 py-20 bg-background text-foreground">
        <Container className="max-w-md mx-auto">
          <Card className="border-border">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-muted-foreground mb-4">
                <Heart className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl font-bold">Authentication Required</CardTitle>
            </CardHeader>
            <CardContent className="text-center flex flex-col gap-6">
              <p className="text-sm text-muted-foreground">
                You must log in to view or manage your personal wishlist.
              </p>
              <Link href="/login?redirect=/wishlist">
                <Button className="w-full font-semibold flex items-center justify-center gap-2 cursor-pointer">
                  <LogIn className="h-4 w-4" />
                  Log In to ZELL
                </Button>
              </Link>
            </CardContent>
          </Card>
        </Container>
      </div>
    );
  }

  return (
    <div className="flex-1 py-12 bg-background text-foreground">
      <Container className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Your Wishlist</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {!wishlist || wishlist.items.length === 0
              ? "You haven't saved any items yet"
              : `You have ${wishlist.items.length} item(s) saved`}
          </p>
        </div>

        {!wishlist || wishlist.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-20 bg-card rounded-lg border border-border">
            <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center text-muted-foreground mb-6">
              <Heart className="h-10 w-10 text-muted-foreground/70" />
            </div>
            <h2 className="text-xl font-bold">Your wishlist is empty</h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm">
              Save your favorite items here to purchase later or move them directly to your bag.
            </p>
            <Link href="/products" className="mt-8">
              <Button className="font-semibold">Explore Products</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlist.items.map((item) => {
              const product = products.find((p) => p.id === item.productId);
              if (!product) return null;

              const variant = product.variants.find((v) => v.sku === item.sku);
              const priceCents =
                variant && variant.price > 0
                  ? variant.price
                  : product.discountPrice || product.basePrice;
              const formattedPrice = (priceCents / 100).toFixed(2);

              return (
                <Card
                  key={item.sku}
                  className="overflow-hidden flex flex-col justify-between border-border/80"
                >
                  <div className="relative aspect-square w-full overflow-hidden bg-muted border-b border-border/50">
                    <Image
                      src={product.mainImage || "/placeholder.jpg"}
                      alt={product.title}
                      fill
                      className="object-cover transition-transform hover:scale-105 duration-350"
                    />
                  </div>
                  <CardContent className="p-5 flex-1 flex flex-col justify-between gap-4">
                    <div className="space-y-1">
                      <h3 className="font-bold text-base line-clamp-1">{product.title}</h3>
                      <p className="text-lg font-black text-foreground">${formattedPrice}</p>

                      {item.attributes && Object.keys(item.attributes).length > 0 && (
                        <div className="flex gap-1.5 flex-wrap mt-2">
                          {Object.entries(item.attributes).map(([key, val]) => (
                            <span
                              key={key}
                              className="text-[10px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded font-semibold capitalize border border-border/30"
                            >
                              {key}: {val}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 mt-2 pt-4 border-t border-border/40">
                      <Button
                        onClick={() => handleMoveToCart(item.sku)}
                        className="flex-1 flex items-center justify-center gap-2 text-xs font-semibold cursor-pointer"
                        size="sm"
                      >
                        <ShoppingCart className="h-3.5 w-3.5" />
                        Move to Bag
                      </Button>
                      <Button
                        onClick={() => handleRemove(item.sku)}
                        variant="outline"
                        size="sm"
                        className="text-muted-foreground hover:text-destructive border-border/70 cursor-pointer"
                        aria-label="Remove item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </Container>
    </div>
  );
}
