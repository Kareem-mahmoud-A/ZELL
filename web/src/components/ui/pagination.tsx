import * as React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export interface PaginationProps extends React.HTMLAttributes<HTMLElement> {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
  ...props
}: PaginationProps) {
  const getPageNumbers = () => {
    const pages = [];
    const showMax = 5;

    if (totalPages <= showMax) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      let start = Math.max(1, currentPage - 2);
      let end = Math.min(totalPages, currentPage + 2);

      if (currentPage <= 3) {
        end = 5;
      } else if (currentPage >= totalPages - 2) {
        start = totalPages - 4;
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }

    return pages;
  };

  const pages = getPageNumbers();

  return (
    <nav
      role="navigation"
      aria-label="Pagination"
      className={cn("mx-auto flex w-full justify-center items-center gap-1.5", className)}
      {...props}
    >
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        aria-label="Go to previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {pages[0] > 1 && (
        <>
          <Button
            variant={currentPage === 1 ? "default" : "outline"}
            size="icon"
            onClick={() => onPageChange(1)}
            aria-label="Page 1"
          >
            1
          </Button>
          {pages[0] > 2 && (
            <span className="flex h-9 w-9 items-center justify-center text-muted-foreground">
              <MoreHorizontal className="h-4 w-4" />
            </span>
          )}
        </>
      )}

      {pages.map((page) => (
        <Button
          key={page}
          variant={currentPage === page ? "default" : "outline"}
          size="icon"
          onClick={() => onPageChange(page)}
          aria-label={`Page ${page}`}
          aria-current={currentPage === page ? "page" : undefined}
        >
          {page}
        </Button>
      ))}

      {pages[pages.length - 1] < totalPages && (
        <>
          {pages[pages.length - 1] < totalPages - 1 && (
            <span className="flex h-9 w-9 items-center justify-center text-muted-foreground">
              <MoreHorizontal className="h-4 w-4" />
            </span>
          )}
          <Button
            variant={currentPage === totalPages ? "default" : "outline"}
            size="icon"
            onClick={() => onPageChange(totalPages)}
            aria-label={`Page ${totalPages}`}
          >
            {totalPages}
          </Button>
        </>
      )}

      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        aria-label="Go to next page"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </nav>
  );
}
