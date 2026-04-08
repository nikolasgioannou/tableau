import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "~/lib/cn";

const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "border-border-default bg-surface-base text-text-primary placeholder:text-text-tertiary focus-visible:border-border-strong flex h-9 w-full rounded-md border px-3 py-1 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
