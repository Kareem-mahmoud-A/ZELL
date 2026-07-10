import * as React from "react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  label: string;
  value: string | number;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: SelectOption[];
  placeholder?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    { className, label, error, helperText, options = [], placeholder, id, children, ...props },
    ref
  ) => {
    const generatedId = React.useId();
    const selectId = id || generatedId;
    const errorId = `${selectId}-error`;
    const helperId = `${selectId}-helper`;

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-foreground select-none">
            {label}
          </label>
        )}
        <select
          id={selectId}
          className={cn(
            "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-destructive focus-visible:ring-destructive",
            className
          )}
          ref={ref}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={
            [error ? errorId : null, helperText ? helperId : null].filter(Boolean).join(" ") ||
            undefined
          }
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
          {children}
        </select>
        {helperText && !error && (
          <p id={helperId} className="text-xs text-muted-foreground">
            {helperText}
          </p>
        )}
        {error && (
          <p id={errorId} className="text-xs text-destructive font-medium">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Select.displayName = "Select";

export { Select };
