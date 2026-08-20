import { Globe, MoreVertical, Star } from "lucide-react";
import type { MouseEvent } from "react";
import { AvatarStack } from "@/components/drive/AvatarStack";
import { FileIcon } from "@/components/drive/FileIcon";
import type { FileItem } from "@/data/drive-data";

export function FileTable({
  files,
  mode = "default",
  selectedFileIds = new Set<string>(),
  allSelected = false,
  onFileContextMenu,
  onToggleFile,
  onToggleAll,
}: {
  files: FileItem[];
  mode?: "default" | "shared" | "recent" | "starred" | "archived";
  selectedFileIds?: Set<string>;
  allSelected?: boolean;
  onFileContextMenu?: (event: MouseEvent<HTMLElement>, file: FileItem) => void;
  onToggleFile?: (file: FileItem) => void;
  onToggleAll?: () => void;
}) {
  return (
    <div className="mt-5">
      <div className="grid gap-3 sm:hidden">
        {onToggleAll ? (
          <label className="flex items-center justify-between rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card-bg)] px-4 py-3 text-sm font-bold shadow-sm">
            <span className="text-[var(--color-text-primary)]">
              Select all files
            </span>
            <input
              type="checkbox"
              className="h-5 w-5 accent-[var(--color-ring)]"
              checked={allSelected}
              onChange={onToggleAll}
            />
          </label>
        ) : null}
        {files.map((file) => {
          const selected = selectedFileIds.has(file.id ?? "");
          const meta =
            mode === "archived"
              ? file.location
              : mode === "recent"
                ? file.openedDate
                : mode === "starred"
                  ? file.starredDate
                  : file.date;
          return (
            <article
              key={file.id ?? file.name}
              onClick={() => onToggleFile?.(file)}
              onContextMenu={(event) => onFileContextMenu?.(event, file)}
              className={
                selected
                  ? "overflow-hidden rounded-2xl border border-[var(--color-border-brand)] bg-[var(--color-bg-brand-subtle)] p-4 shadow-sm"
                  : "overflow-hidden rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card-bg)] p-4 shadow-sm"
              }
            >
              <div className="flex items-start gap-3">
                {onToggleFile ? (
                  <input
                    type="checkbox"
                    className="mt-1 h-5 w-5 shrink-0 accent-[var(--color-ring)]"
                    checked={selected}
                    onChange={() => onToggleFile?.(file)}
                    onClick={(event) => event.stopPropagation()}
                  />
                ) : null}
                <div className="mt-0.5 shrink-0">
                  {mode === "starred" ? (
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ) : (
                    <FileIcon kind={file.kind} />
                  )}
                </div>
                <div className="min-w-0 flex-1 overflow-hidden">
                  <h3
                    className="line-clamp-2 break-all text-sm font-extrabold leading-snug text-[var(--color-text-primary)]"
                    title={file.name}
                  >
                    {file.name}
                  </h3>
                  {file.isShared ? (
                    <span className="mt-1 flex items-center gap-1 text-xs font-semibold text-[var(--color-text-brand)]">
                      <Globe className="h-3 w-3" />
                      Public
                    </span>
                  ) : null}
                  <p className="mt-1 truncate text-xs text-[var(--color-text-tertiary)]">
                    {meta}
                  </p>
                  <div className="mt-3 flex min-w-0 flex-wrap gap-2 text-xs font-semibold text-[var(--color-text-secondary)]">
                    <span className="rounded-full bg-[var(--color-bg-tertiary)] px-2.5 py-1">
                      {file.size}
                    </span>
                    <span className="min-w-0 max-w-full truncate rounded-full bg-[var(--color-bg-tertiary)] px-2.5 py-1">
                      {mode === "shared" ? file.owner : file.access}
                    </span>
                  </div>
                </div>
                <button
                  className="-mr-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-hover)]"
                  onClick={(event) => {
                    event.stopPropagation();
                    onFileContextMenu?.(event, file);
                  }}
                  aria-label={`Open ${file.name} menu`}
                >
                  <MoreVertical className="h-5 w-5" />
                </button>
              </div>
            </article>
          );
        })}
      </div>
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--color-card-border)] text-[var(--color-text-primary)]">
              <th className="w-10 py-4">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-[var(--color-ring)]"
                  checked={allSelected}
                  onChange={onToggleAll}
                />
              </th>
              <th className="py-4 font-extrabold">Name</th>
              {mode === "shared" ? (
                <th className="py-4 font-extrabold">Owner</th>
              ) : null}
              {mode === "recent" ? (
                <th className="py-4 font-extrabold">Last Opened</th>
              ) : null}
              {mode === "starred" ? (
                <th className="py-4 font-extrabold">Starred On</th>
              ) : null}
              {mode === "archived" ? (
                <th className="py-4 font-extrabold">Archived Date</th>
              ) : null}
              {mode === "archived" ? (
                <th className="py-4 font-extrabold">Original Location</th>
              ) : (
                <th className="py-4 font-extrabold">Last Modified</th>
              )}
              <th className="py-4 font-extrabold">Size</th>
              <th className="py-4 font-extrabold">Access</th>
              <th className="py-4" />
            </tr>
          </thead>
          <tbody>
            {files.map((file) => (
              <tr
                key={file.id ?? file.name}
                onContextMenu={(event) => onFileContextMenu?.(event, file)}
                onClick={() => onToggleFile?.(file)}
                className={
                  selectedFileIds.has(file.id ?? "")
                    ? "border-b border-[var(--color-border-brand)] bg-[var(--color-bg-brand-subtle)] transition hover:bg-[var(--color-bg-brand-subtle)]"
                    : "border-b border-[var(--color-card-border)] transition hover:bg-[var(--color-bg-tertiary)]"
                }
              >
                <td className="py-4">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[var(--color-ring)]"
                    checked={selectedFileIds.has(file.id ?? "")}
                    onChange={() => onToggleFile?.(file)}
                    onClick={(event) => event.stopPropagation()}
                  />
                </td>
                <td className="py-4 font-semibold">
                  <span className="flex min-w-0 items-center gap-3">
                    {mode === "starred" ? (
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ) : (
                      <FileIcon kind={file.kind} />
                    )}
                    <span className="truncate text-[var(--color-text-primary)]">
                      {file.name}
                    </span>
                    {file.isShared ? (
                      <span title="Shared publicly">
                        <Globe className="h-3.5 w-3.5 shrink-0 text-[var(--color-text-brand)]" />
                      </span>
                    ) : null}
                  </span>
                </td>
                {mode === "shared" ? (
                  <td className="py-4 text-[var(--color-text-tertiary)]">
                    {file.owner}
                  </td>
                ) : null}
                {mode === "recent" ? (
                  <td className="py-4 text-[var(--color-text-tertiary)]">
                    {file.openedDate}
                  </td>
                ) : null}
                {mode === "starred" ? (
                  <td className="py-4 text-[var(--color-text-tertiary)]">
                    {file.starredDate}
                  </td>
                ) : null}
                {mode === "archived" ? (
                  <td className="py-4 text-[var(--color-text-tertiary)]">
                    {file.archivedDate}
                  </td>
                ) : null}
                <td className="py-4 text-[var(--color-text-tertiary)]">
                  {mode === "archived" ? file.location : file.date}
                </td>
                <td className="py-4 text-[var(--color-text-tertiary)]">
                  {file.size}
                </td>
                <td className="py-4 text-[var(--color-text-tertiary)]">
                  <span className="flex items-center gap-3">
                    <AvatarStack count={file.shared} />
                    {file.access}
                  </span>
                </td>
                <td className="py-4 text-right">
                  <button
                    className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-hover)]"
                    onClick={(event) => {
                      event.stopPropagation();
                      onFileContextMenu?.(event, file);
                    }}
                    aria-label={`Open ${file.name} menu`}
                  >
                    <MoreVertical className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
