import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-full transition-all disabled:pointer-events-none disabled:opacity-60 outline-none cursor-pointer select-none text-xl md:text-2xl px-5 py-2",
  {
    variants: {
      variant: {
        primary:
          "bg-button-background text-button-foreground border border-button-border hover:opacity-60",
        secondary:
          "bg-button-background/20 text-button-foreground border-2 border-button-border/50 hover:opacity-60",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  },
);

function Button({
  className,
  variant = "primary",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      className={cn(buttonVariants({ variant, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
