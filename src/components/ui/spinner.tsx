import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const spinnerVariants = cva("animate-spin text-primary", {
  variants: {
    size: {
      small: "size-4",
      medium: "size-6",
      large: "size-8",
    },
  },
  defaultVariants: {
    size: "medium",
  },
});

interface SpinnerProps extends VariantProps<typeof spinnerVariants> {
    className?: string;
}

export function Spinner({ size, className }: SpinnerProps) {
  return <Loader2 className={cn(spinnerVariants({ size }), className)} />;
}
