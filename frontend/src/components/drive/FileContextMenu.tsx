import {
  Download,
  Edit3,
  Eye,
  FolderInput,
  Info,
  Link2,
  Trash2,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FileItem } from "@/data/drive-data";

export function FileContextMenu({
  x,
  y,
  file,
  onClose,
  onView,
  onDownload,
  onRename,
  onMove,
  onDetails,
  onShare,
  onInvite,
  onDelete,
}: {
  x: number;
  y: number;
  file: FileItem | null;
  onClose: () => void;
  onView: () => void;
  onDownload: () => void;
  onRename: () => void;
  onMove: () => void;
  onDetails: () => void;
  onShare: () => void;
  onInvite: () => void;
  onDelete: () => void;
}) {
  if (!file) return null;
  const safeX = Math.max(12, Math.min(x, window.innerWidth - 220));
  const safeY = Math.max(12, Math.min(y, window.innerHeight - 372));

  return (
    <>
      <button
        className="fixed inset-0 z-40 cursor-default bg-[var(--color-bg-overlay)]"
        aria-label="Close file menu"
        onClick={onClose}
      />
      <div
        className="fixed inset-x-3 bottom-3 z-50 rounded-3xl border border-[var(--color-card-border)] bg-[var(--color-card-bg)] p-2 shadow-2xl shadow-[var(--color-shadow-xl)] sm:inset-x-auto sm:bottom-auto sm:w-52 sm:rounded-2xl"
        style={{
          left: window.innerWidth >= 640 ? safeX : undefined,
          top: window.innerWidth >= 640 ? safeY : undefined,
        }}
      >
        <p className="truncate px-3 py-2 text-xs font-bold text-[var(--color-text-tertiary)]">
          {file.name}
        </p>
        <Button
          variant="ghost"
          className="h-12 w-full justify-start sm:h-11"
          onClick={onView}
        >
          <Eye className="h-4 w-4" />
          View
        </Button>
        <Button
          variant="ghost"
          className="h-12 w-full justify-start sm:h-11"
          onClick={onDownload}
        >
          <Download className="h-4 w-4" />
          Download
        </Button>
        <Button
          variant="ghost"
          className="h-12 w-full justify-start sm:h-11"
          onClick={onRename}
        >
          <Edit3 className="h-4 w-4" />
          Rename
        </Button>
        <Button
          variant="ghost"
          className="h-12 w-full justify-start sm:h-11"
          onClick={onMove}
        >
          <FolderInput className="h-4 w-4" />
          Move to Folder
        </Button>
        <Button
          variant="ghost"
          className="h-12 w-full justify-start sm:h-11"
          onClick={onDetails}
        >
          <Info className="h-4 w-4" />
          Details
        </Button>
        <Button
          variant="ghost"
          className="h-12 w-full justify-start sm:h-11"
          onClick={onShare}
        >
          <Link2 className="h-4 w-4" />
          Share Link
        </Button>
        <Button
          variant="ghost"
          className="h-12 w-full justify-start sm:h-11"
          onClick={onInvite}
        >
          <UserPlus className="h-4 w-4" />
          Invite Member
        </Button>
        <Button
          variant="danger"
          className="h-12 w-full justify-start sm:h-11"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      </div>
    </>
  );
}
