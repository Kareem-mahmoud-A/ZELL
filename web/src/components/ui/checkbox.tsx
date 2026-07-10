import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const generatedId = React.useId();
    const checkboxId = id || generatedId;
    const errorId = `${checkboxId}-error`;

    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center">
            <input
              type="checkbox"
              id={checkboxId}
              ref={ref}
              className={cn(
                "peer h-4.5 w-4.5 shrink-0 rounded border border-input bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 appearance-none cursor-pointer checked:bg-primary checked:border-primary",
                error && "border-destructive focus-visible:ring-destructive",
                className
              )}
              aria-invalid={error ? "true" : "false"}
              aria-describedby={error ? errorId : undefined}
              {...props}
            />
            <Check className="absolute w-3 h-3 text-primary-foreground pointer-events-none scale-0 transition-transform peer-checked:scale-100" />
          </div>
          {label && (
            <label
              htmlFor={checkboxId}
              className="text-sm font-medium text-foreground select-none cursor-pointer"
            >
              {label}
            </label>
          )}
        </div>
        {error && (
          <p id={errorId} className="text-xs text-destructive font-medium">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
