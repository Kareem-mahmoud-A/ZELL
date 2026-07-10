import * as React from "react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description: string;
  retryLabel?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "An error occurred",
  description,
  retryLabel = "Try again",
  onRetry,
  className,
  ...props
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center rounded-lg border border-destructive/20 bg-destructive/5 text-destructive-foreground max-w-md mx-auto my-8 shadow-sm",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-destructive/15 text-destructive mb-4">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-5 max-w-xs">{description}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="destructive" size="sm">
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
