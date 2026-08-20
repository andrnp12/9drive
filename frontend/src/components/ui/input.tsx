import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-xl border border-[var(--color-input-border)] bg-[var(--color-input-bg)] px-4 text-sm outline-none transition",
        "focus:border-[var(--color-border-focus)] focus:ring-2 focus:ring-[var(--color-ring)]/20",
        "placeholder:text-[var(--color-input-placeholder)]",
        className,
      )}
      {...props}
    />
  );
}
