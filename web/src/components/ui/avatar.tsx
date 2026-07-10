import * as React from "react";
import { cn } from "@/lib/utils";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallback: string;
  size?: "sm" | "md" | "lg";
}

export function Avatar({
  src,
  alt = "Avatar",
  fallback,
  size = "md",
  className,
  ...props
}: AvatarProps) {
  const [imageError, setImageError] = React.useState(false);

  return (
    <div
      className={cn(
        "relative flex shrink-0 overflow-hidden rounded-full bg-secondary border border-border select-none justify-center items-center font-medium",
        {
          "w-8 h-8 text-xs": size === "sm",
          "w-10 h-10 text-sm": size === "md",
          "w-12 h-12 text-base": size === "lg",
        },
        className
      )}
      {...props}
    >
      {src && !imageError ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          onError={() => setImageError(true)}
          className="aspect-square h-full w-full object-cover"
        />
      ) : (
        <span className="text-muted-foreground uppercase">{fallback.substring(0, 2)}</span>
      )}
    </div>
  );
}
