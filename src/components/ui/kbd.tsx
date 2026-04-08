import { type HTMLAttributes } from "react";
import { cn } from "~/lib/cn";

function Kbd({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 items-center rounded border border-border-default bg-surface-subtle px-1.5 font-mono text-[10px] font-medium text-text-secondary",
        className,
      )}
      {...props}
    />
  );
}

export { Kbd };
