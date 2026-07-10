"use client";

import React, { useState } from "react";
import { Product, ProductVariant } from "@zell/shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

export function VariantSelector({ product }: { product: Product }) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    product.variants[0] || null
  );

  const sizeOptions = Array.from(
    new Set(product.variants.map((v) => v.attributes.size).filter(Boolean))
  );
  const colorOptions = Array.from(
    new Set(product.variants.map((v) => v.attributes.color).filter(Boolean))
  );

  const handleSelect = (size?: string, color?: string) => {
    const match = product.variants.find((v) => {
      const sizeMatch = !size || v.attributes.size === size;
      const colorMatch = !color || v.attributes.color === color;
      return sizeMatch && colorMatch;
    });
    if (match) setSelectedVariant(match);
  };

  const imagesToDisplay = selectedVariant?.imageGallery?.length
    ? selectedVariant.imageGallery
    : [product.mainImage];

  const currentPrice = selectedVariant?.price || product.basePrice;
  const compareAtPrice = product.compareAtPrice;
  const isAvailable = selectedVariant?.isAvailable ?? true;
  const stockQuantity = selectedVariant?.stockQuantity ?? 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
      {/* Gallery */}
      <div className="flex flex-col gap-4">
        <div className="relative h-[450px] w-full rounded-lg overflow-hidden border border-border bg-muted">
          <Image
            src={imagesToDisplay[0] || "/placeholder.jpg"}
            alt={product.title}
            fill
            className="object-cover"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto py-1">
          {imagesToDisplay.map((img, i) => (
            <button
              key={i}
              className="relative w-20 h-20 rounded border border-border overflow-hidden bg-muted flex-shrink-0"
              onClick={() => {
                if (selectedVariant) {
                  const newGallery = [img, ...imagesToDisplay.filter((g) => g !== img)];
                  setSelectedVariant({ ...selectedVariant, imageGallery: newGallery });
                }
              }}
            >
              <Image src={img} alt={`Gallery ${i}`} fill className="object-cover" />
            </button>
          ))}
        </div>
      </div>

      {/* Details */}
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{product.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">SKU: {selectedVariant?.sku || "N/A"}</p>
        </div>

        {/* Pricing */}
        <div className="flex items-baseline gap-3">
          <span className="text-2xl font-extrabold text-foreground">
            ${(currentPrice / 100).toFixed(2)}
          </span>
          {compareAtPrice && compareAtPrice > currentPrice && (
            <span className="text-base text-muted-foreground line-through">
              ${(compareAtPrice / 100).toFixed(2)}
            </span>
          )}
        </div>

        {/* Size Selection */}
        {sizeOptions.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold">Select Size</span>
            <div className="flex gap-2 flex-wrap">
              {sizeOptions.map((sz) => (
                <Button
                  key={sz}
                  variant={selectedVariant?.attributes.size === sz ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleSelect(sz, selectedVariant?.attributes.color)}
                >
                  {sz}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Color Selection */}
        {colorOptions.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold">Select Color</span>
            <div className="flex gap-2 flex-wrap">
              {colorOptions.map((col) => (
                <Button
                  key={col}
                  variant={selectedVariant?.attributes.color === col ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleSelect(selectedVariant?.attributes.size, col)}
                >
                  {col}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Stock / Availability Status */}
        <div className="flex items-center gap-2">
          {isAvailable && stockQuantity > 0 ? (
            <Badge
              variant="outline"
              className="text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20"
            >
              In Stock ({stockQuantity} available)
            </Badge>
          ) : (
            <Badge variant="destructive">Out of Stock</Badge>
          )}
        </div>

        {/* Add to Cart Placeholder */}
        <Button className="w-full py-6 text-base" disabled={!isAvailable || stockQuantity <= 0}>
          Add to Bag
        </Button>
      </div>
    </div>
  );
}
