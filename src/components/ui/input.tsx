import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-2xl border-2 border-navy/15 bg-white px-4 py-2 text-sm text-navy transition-colors duration-150 ease-out-quart placeholder:text-navy/55 focus-visible:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-paliacate",
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };
