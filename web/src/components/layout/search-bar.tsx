"use client";

import React, { useState } from "react";
import { Search, X } from "lucide-react";

export function SearchBar() {
  const [query, setQuery] = useState("");

  const handleClear = () => {
    setQuery("");
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground">
        <Search className="w-4 h-4" />
      </div>
      <input
        type="search"
        placeholder="Search products, brands, collections..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full h-9 pl-9 pr-8 bg-secondary border border-transparent rounded-full text-sm placeholder:text-muted-foreground focus:outline-none focus:bg-background focus:border-border transition-colors focus-visible:ring-2 focus-visible:ring-ring"
      />
      {query && (
        <button
          onClick={handleClear}
          className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground cursor-pointer"
          aria-label="Clear search query"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
