import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-semibold tracking-tight font-sans ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:translate-y-px disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "taskible-btn-primary",
        taskible: "taskible-btn-primary",
        taskibleSecondary: "taskible-btn-secondary",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-full",
        outline: "border border-border/80 bg-background/80 hover:bg-muted text-foreground rounded-full",
        secondary: "taskible-btn-secondary",
        ghost: "hover:bg-muted/80 hover:text-foreground rounded-full",
        link: "text-primary underline-offset-4 hover:underline",
        gradient: "taskible-btn-primary",
        glass: "bg-white/10 dark:bg-white/5 border border-white/15 text-foreground hover:bg-white/20 backdrop-blur-md rounded-full",
      },
      size: {
        default: "h-11 px-6 rounded-full text-[15px]",
        sm: "h-9 px-4 rounded-full text-xs",
        lg: "h-13 px-8 rounded-full text-base",
        pill: "h-11 px-6 rounded-full text-[15px]",
        icon: "h-10 w-10 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
