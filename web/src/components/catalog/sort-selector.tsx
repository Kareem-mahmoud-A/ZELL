"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function SortSelector({ defaultValue }: { defaultValue: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    router.push(`/products?${params.toString()}`);
  };

  return (
    <select
      defaultValue={defaultValue}
      className="text-sm bg-background border border-border rounded px-2 py-1"
      onChange={(e) => handleSortChange(e.target.value)}
    >
      <option value="newest">Newest</option>
      <option value="price_asc">Price: Low to High</option>
      <option value="price_desc">Price: High to Low</option>
    </select>
  );
}
