import React, { ReactNode } from "react";
import { Loader2 } from "lucide-react";

interface LoadingBoundaryProps {
  isLoading: boolean;
  children: ReactNode;
  fallback?: ReactNode;
}

export function LoadingBoundary({ isLoading, children, fallback }: LoadingBoundaryProps) {
  if (isLoading) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] p-8 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
        <p className="text-sm text-muted-foreground animate-pulse">Loading content...</p>
      </div>
    );
  }

  return <>{children}</>;
}
