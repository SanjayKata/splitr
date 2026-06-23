import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  invalid?: boolean;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select({ className, invalid, children, ...props }, ref) {
    return (
      <select
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          "h-11 w-full rounded-lg border bg-white px-3 text-sm text-zinc-900 transition-colors focus:ring-2 focus:outline-none dark:bg-zinc-900 dark:text-zinc-100",
          invalid
            ? "border-red-400 focus:border-red-500 focus:ring-red-500/30"
            : "border-zinc-300 focus:border-emerald-500 focus:ring-emerald-500/30 dark:border-zinc-700",
          className,
        )}
        {...props}
      >
        {children}
      </select>
    );
  },
);
