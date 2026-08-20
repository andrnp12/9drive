import { Archive, RotateCcw, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { FileTable } from "@/components/drive/FileTable";
import { MetricCard } from "@/components/drive/MetricCard";
import { PageHeader } from "@/components/drive/PageHeader";
import { archivedFiles } from "@/data/drive-data";
import { FormSection } from "@/components/ui/FormField";

export function ArchivedPage() {
  return (
    <>
      <PageHeader
        title="Archived"
        description="Older files kept out of active workspace."
        actions={
          <>
            <FormSection
              formId="archivedPage"
              sectionId="restoreDelete"
              disabled={false}
              showLabels={false}
              showHelpText={false}
            />
          </>
        }
      />
      <Card className="mt-8 border-[var(--color-bg-warning-subtle)] bg-[var(--color-bg-warning-subtle)] p-4 text-sm text-[var(--color-text-warning)]">
        Archived files stay available and do not count as active workspace
        clutter.
      </Card>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <MetricCard label="Archived Items" value="3" icon={Archive} />
        <MetricCard label="Recoverable" value="3" icon={RotateCcw} />
        <MetricCard label="Storage Saved" value="2.6 MB" icon={Trash2} />
      </div>
      <FileTable files={archivedFiles} mode="archived" />
    </>
  );
}
