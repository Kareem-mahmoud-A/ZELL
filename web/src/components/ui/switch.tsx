"use client";

import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

export interface SwitchProps extends React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> {
  label?: string;
}

const Switch = React.forwardRef<React.ElementRef<typeof SwitchPrimitives.Root>, SwitchProps>(
  ({ className, label, id, ...props }, ref) => {
    const generatedId = React.useId();
    const switchId = id || generatedId;

    return (
      <div className="flex items-center gap-2">
        <SwitchPrimitives.Root
          className={cn(
            "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-secondary",
            className
          )}
          id={switchId}
          {...props}
          ref={ref}
        >
          <SwitchPrimitives.Thumb
            className={cn(
              "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-md ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0"
            )}
          />
        </SwitchPrimitives.Root>
        {label && (
          <label
            htmlFor={switchId}
            className="text-sm font-medium leading-none text-foreground select-none cursor-pointer"
          >
            {label}
          </label>
        )}
      </div>
    );
  }
);
Switch.displayName = "Switch";

export { Switch };
