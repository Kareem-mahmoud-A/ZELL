"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateProductDtoSchema, CreateProductDto } from "@zell/shared";
import { saveProductAction } from "@/app/admin/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";

export function ProductForm({
  initialProduct,
  productId,
}: {
  initialProduct?: unknown;
  productId?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateProductDto>({
    resolver: zodResolver(CreateProductDtoSchema),
    defaultValues: (initialProduct as CreateProductDto) || {
      title: "",
      slug: "",
      description: "",
      shortDescription: "",
      basePrice: 0,
      currency: "USD",
      mainImage: "",
      tags: [],
      collections: [],
      visibility: "VISIBLE",
      isFeatured: false,
      status: "ACTIVE",
      variants: [
        {
          sku: "TST-SKU-001",
          price: 0,
          attributes: { size: "M" },
          stockQuantity: 10,
          imageGallery: [],
          isAvailable: true,
        },
      ],
    },
  });

  const onSubmit = async (data: CreateProductDto) => {
    setIsLoading(true);
    try {
      const result = await saveProductAction(productId || "", data);
      if (result.success) {
        toast({
          title: "Success",
          description: result.message || "Saved product",
          variant: "success",
        });
        router.push("/admin/products");
      } else {
        toast({
          title: "Error",
          description: result.error || "Save error",
          variant: "destructive",
        });
      }
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Failed to save product";
      toast({ title: "Failed to save", description: message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-md">
      <CardHeader>
        <CardTitle>{productId ? "Edit Product" : "Create Product"}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="flex flex-col gap-4">
          <Input
            type="text"
            label="Product Title"
            placeholder="e.g. Silk Dress"
            {...register("title")}
            error={errors.title?.message}
            required
            disabled={isLoading}
          />
          <Input
            type="text"
            label="URL Slug"
            placeholder="e.g. silk-dress"
            {...register("slug")}
            error={errors.slug?.message}
            required
            disabled={isLoading}
          />
          <Input
            type="text"
            label="Short Description"
            placeholder="Brief summary"
            {...register("shortDescription")}
            error={errors.shortDescription?.message}
            required
            disabled={isLoading}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold">Full Description</label>
            <textarea
              className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Detailed description of features, materials, sizing"
              {...register("description")}
              disabled={isLoading}
            />
            {errors.description?.message && (
              <p className="text-xs text-destructive font-medium">{errors.description?.message}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="number"
              label="Price (in cents)"
              placeholder="e.g. 9900 for $99.00"
              {...register("basePrice", { valueAsNumber: true })}
              error={errors.basePrice?.message}
              required
              disabled={isLoading}
            />
            <Input
              type="text"
              label="Currency"
              placeholder="USD"
              {...register("currency")}
              error={errors.currency?.message}
              required
              disabled={isLoading}
            />
          </div>
          <Input
            type="text"
            label="Main Image URL"
            placeholder="https://images.example.com/product.jpg"
            {...register("mainImage")}
            error={errors.mainImage?.message}
            required
            disabled={isLoading}
          />
        </CardContent>
        <CardFooter className="flex justify-end gap-3 mt-4">
          <Button type="button" variant="outline" onClick={() => router.push("/admin/products")}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            {productId ? "Save Changes" : "Create Product"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
