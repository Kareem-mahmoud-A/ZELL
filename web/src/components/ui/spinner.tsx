import React from "react";
import { cn } from "@/lib/utils";

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
}

export function Spinner({ size = "md", className, ...props }: SpinnerProps) {
  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-current border-t-transparent text-muted-foreground",
        {
          "w-4 h-4": size === "sm",
          "w-6 h-6": size === "md",
          "w-8 h-8": size === "lg",
        },
        className
      )}
      role="status"
      aria-label="loading"
      {...props}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}
