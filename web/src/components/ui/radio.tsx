import * as React from "react";
import { cn } from "@/lib/utils";

export interface RadioProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ className, label, id, ...props }, ref) => {
    const generatedId = React.useId();
    const radioId = id || generatedId;

    return (
      <div className="flex items-center gap-2">
        <div className="relative flex items-center justify-center">
          <input
            type="radio"
            id={radioId}
            ref={ref}
            className={cn(
              "peer h-4.5 w-4.5 shrink-0 rounded-full border border-input bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 appearance-none cursor-pointer checked:border-primary",
              className
            )}
            {...props}
          />
          <div className="absolute w-2.5 h-2.5 rounded-full bg-primary scale-0 transition-transform peer-checked:scale-100" />
        </div>
        {label && (
          <label
            htmlFor={radioId}
            className="text-sm font-medium text-foreground select-none cursor-pointer"
          >
            {label}
          </label>
        )}
      </div>
    );
  }
);
Radio.displayName = "Radio";

export { Radio };
