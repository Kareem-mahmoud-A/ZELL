import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ChipProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  onRemove?: () => void;
  variant?: "default" | "outline" | "secondary";
}

export function Chip({ label, onRemove, variant = "default", className, ...props }: ChipProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border transition-colors select-none",
        {
          "bg-primary text-primary-foreground border-transparent": variant === "default",
          "bg-secondary text-secondary-foreground border-transparent": variant === "secondary",
          "bg-background text-foreground border-border": variant === "outline",
        },
        className
      )}
      {...props}
    >
      <span>{label}</span>
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-0.5 rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-current focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
          aria-label={`Remove ${label}`}
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
