import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "~/lib/cn";

const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-border-default bg-surface-base px-3 py-1 text-sm text-text-primary transition-colors placeholder:text-text-tertiary focus-visible:border-border-strong disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
