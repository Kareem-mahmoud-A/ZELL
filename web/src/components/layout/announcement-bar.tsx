"use client";

import React, { useState } from "react";
import { X } from "lucide-react";

export function AnnouncementBar() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="bg-primary text-primary-foreground text-xs py-2 px-4 flex items-center justify-between font-medium select-none">
      <div className="flex-1 text-center">
        <span>Summer Sale: Save up to 50% on selected items! Use code: SUMMER50</span>
      </div>
      <button
        onClick={() => setIsVisible(false)}
        className="text-current opacity-80 hover:opacity-100 p-0.5 rounded cursor-pointer transition-opacity focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        aria-label="Close announcement"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
