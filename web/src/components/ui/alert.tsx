import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { AlertCircle, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg]:w-5 [&>svg]:h-5",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground border-border",
        destructive:
          "border-destructive/50 bg-destructive/5 text-destructive dark:border-destructive [&>svg]:text-destructive",
        success:
          "border-emerald-500/30 bg-emerald-500/5 text-emerald-800 dark:text-emerald-400 dark:border-emerald-500/30 [&>svg]:text-emerald-600 dark:[&>svg]:text-emerald-400",
        warning:
          "border-amber-500/30 bg-amber-500/5 text-amber-800 dark:text-amber-400 dark:border-amber-500/30 [&>svg]:text-amber-600 dark:[&>svg]:text-amber-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {
  showIcon?: boolean;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "default", showIcon = true, children, ...props }, ref) => {
    const Icon = {
      default: Info,
      destructive: AlertCircle,
      success: CheckCircle,
      warning: AlertTriangle,
    }[variant || "default"];

    return (
      <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props}>
        {showIcon && <Icon />}
        {children}
      </div>
    );
  }
);
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5
      ref={ref}
      className={cn("mb-1 font-medium leading-none tracking-tight", className)}
      {...props}
    />
  )
);
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("text-sm [&_p]:leading-relaxed", className)} {...props} />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
