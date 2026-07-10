import * as React from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items, className, ...props }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex flex-wrap items-center text-sm text-muted-foreground", className)}
      {...props}
    >
      <ol className="flex items-center gap-1.5 break-words">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="inline-flex items-center gap-1.5">
              {item.href && !isLast ? (
                <a
                  href={item.href}
                  className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:underline"
                >
                  {item.label}
                </a>
              ) : (
                <span
                  className={cn("font-normal text-foreground", isLast && "font-medium")}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              )}
              {!isLast && (
                <ChevronRight
                  className="w-4 h-4 shrink-0 text-muted-foreground/65"
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
