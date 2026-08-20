import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card-bg)] shadow-[var(--color-card-shadow)]",
        className,
      )}
      {...props}
    />
  );
}
