import { useEffect, useRef, useState } from 'react'
import { MoreVertical } from 'lucide-react'
import type { MouseEvent } from 'react'
import { Card } from '@/components/ui/card'
import { FileIcon } from '@/components/drive/FileIcon'
import type { FileItem } from '@/data/drive-data'
import { API_URL, apiFetch } from '@/lib/api'

function FileThumbnail({ file }: { file: FileItem }) {
  const [url, setUrl] = useState<string | null>(null)
  const [imgError, setImgError] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const fetchedRef = useRef(false)

  const isMedia = file.kind === 'image' || file.kind === 'video'

  useEffect(() => {
    if (!file.id || !isMedia) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting || fetchedRef.current) return
        fetchedRef.current = true
        // Hanya ambil URL thumbnail kecil dari Google (~400px), bukan file penuh
        apiFetch<{ url: string }>(`/files/${file.id}/thumbnail-url`)
          .then(({ url }) => setUrl(url))
          .catch(() => setImgError(true))
      },
      { rootMargin: '200px' },
    )

    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [file.id, file.kind])

  if (file.kind === 'image') {
    return (
      <div ref={containerRef} className="relative h-32 w-full overflow-hidden rounded-xl bg-slate-100">
        {url && !imgError ? (
          <img
            src={url}
            alt={file.name}
            className="h-full w-full object-cover transition-opacity duration-300"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <FileIcon kind={file.kind} className="h-10 w-10 rounded-xl p-2 opacity-40" />
          </div>
        )}
      </div>
    )
  }

  if (file.kind === 'video') {
    return (
      <div ref={containerRef} className="relative h-32 w-full overflow-hidden rounded-xl bg-slate-900">
        {url && !imgError ? (
          <video
            src={url}
            className="h-full w-full object-cover"
            muted
            playsInline
            preload="metadata"
            onLoadedMetadata={(e) => {
              const v = e.target as HTMLVideoElement
              v.currentTime = 1
            }}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <FileIcon kind={file.kind} className="h-10 w-10 rounded-xl p-2 opacity-40" />
          </div>
        )}
        {url && !imgError && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm">
              <svg className="h-4 w-4 translate-x-0.5 fill-white" viewBox="0 0 16 16"><path d="M3 2.5l10 5.5-10 5.5V2.5z"/></svg>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex h-32 w-full items-center justify-center rounded-xl bg-slate-50">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
        <FileIcon kind={file.kind} className="h-9 w-9 rounded-xl p-2" />
      </div>
    </div>
  )
}

export function FileGrid({
  files,
  selectedFileIds = new Set<string>(),
  onFileContextMenu,
  onToggleFile,
}: {
  files: FileItem[]
  selectedFileIds?: Set<string>
  onFileContextMenu?: (event: MouseEvent<HTMLElement>, file: FileItem) => void
  onToggleFile?: (file: FileItem) => void
}) {
  return (
    <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
      {files.map((file) => {
        const selected = selectedFileIds.has(file.id ?? '')
        return (
          <Card
            key={file.id ?? file.name}
            onClick={() => onToggleFile?.(file)}
            onContextMenu={(event) => onFileContextMenu?.(event, file)}
            className={
              selected
                ? 'relative cursor-pointer overflow-hidden border-blue-200 bg-blue-50 p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md'
                : 'relative cursor-pointer overflow-hidden p-3 transition hover:-translate-y-0.5 hover:shadow-md'
            }
          >
            <div className="flex items-center justify-between gap-2">
              <input
                type="checkbox"
                className="h-5 w-5 shrink-0 accent-blue-600"
                checked={selected}
                onChange={() => onToggleFile?.(file)}
                onClick={(event) => event.stopPropagation()}
              />
              <button
                className="-mr-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-white/80"
                onClick={(event) => {
                  event.stopPropagation()
                  onFileContextMenu?.(event, file)
                }}
                aria-label={`Open ${file.name} menu`}
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-2">
              <FileThumbnail file={file} />
            </div>

            <div className="mt-3 min-w-0">
              <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-extrabold text-slate-950" title={file.name}>
                {file.name}
              </h3>
              <p className="mt-1 truncate text-xs text-slate-500">{file.date}</p>
              <div className="mt-2 flex flex-wrap gap-1.5 text-xs font-semibold text-slate-600">
                <span className="rounded-full bg-slate-100 px-2 py-0.5">{file.size}</span>
                <span className="max-w-full truncate rounded-full bg-slate-100 px-2 py-0.5">{file.access}</span>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
