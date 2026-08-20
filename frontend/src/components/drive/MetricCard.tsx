import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

export function MetricCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-[var(--color-text-tertiary)]">{label}</p>
          <p className="mt-2 text-2xl font-extrabold text-[var(--color-text-primary)]">
            {value}
          </p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-bg-brand-subtle)] text-[var(--color-text-brand)]">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}
