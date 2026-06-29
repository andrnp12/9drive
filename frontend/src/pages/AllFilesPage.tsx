import { useEffect, useRef, useState, type DragEvent, type FormEvent, type MouseEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Archive, CheckCircle, ChevronDown, ClipboardPaste, FolderInput, FolderPlus, LayoutGrid, List, MoreVertical, RefreshCw, Star, Trash2, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { DummyModal } from '@/components/drive/DummyModal'
import { EmptyAreaContextMenu } from '@/components/drive/EmptyAreaContextMenu'
import { FileContextMenu } from '@/components/drive/FileContextMenu'
import { FileDetailsDrawer } from '@/components/drive/FileDetailsDrawer'
import { FileGrid } from '@/components/drive/FileGrid'
import { ZoomablePreview } from '@/components/drive/ZoomablePreview'
import { FileTable } from '@/components/drive/FileTable'
import { FolderContextMenu } from '@/components/drive/FolderContextMenu'
import { FolderGrid } from '@/components/drive/FolderGrid'
import { defaultFolderColor, defaultFolderIconUrl, FolderVisual, folderColorOptions, folderIconOptions, normalizeFolderColor } from '@/components/drive/FolderVisual'
import { PageHeader } from '@/components/drive/PageHeader'
import { Input } from '@/components/ui/input'
import { API_URL, apiFetch, formatBytes, formatDate } from '@/lib/api'
import { getAccessToken, getRefreshToken, setAccessToken } from '@/lib/auth'
import { createPlyr, ensurePlyr } from '@/lib/plyr'
import { getPreviewKind, officeViewerUrl } from '@/lib/preview'
import type { FileItem, FolderItem } from '@/data/drive-data'

type BackendFile = { id: string; name: string; mimeType: string; sizeBytes: string; createdAt: string; folderId?: string | null; isShared?: boolean; connectedAccount?: { email: string; provider: string }; folder?: { id: string; name: string } | null }
type BackendFolder = { id: string; name: string; color: string; iconUrl?: string | null; parentId?: string | null; updatedAt: string }
type UploadProgressStatus = 'uploading' | 'done' | 'error' | 'partial'
type UploadProgressFile = { name: string; size: number; percent: number; status: UploadProgressStatus }
type UploadProgressState = { open: boolean; fileName: string; percent: number; status: UploadProgressStatus; files: UploadProgressFile[] }
type UploadResult = { file?: unknown; files?: unknown[]; failed?: Array<{ fileName?: string }> }
type SyncGoogleResult = { accounts: number; created: number; updated: number; deleted: number }
type FileViewMode = 'list' | 'grid'
type Pagination = { page: number; limit: number; total: number; totalPages: number; hasNext: boolean; hasPrev: boolean }

// --- Added for direct-to-Google-Drive upload (bypasses Railway request timeout for large files) ---
type GoogleBestAccountResult = { accountId: string }
type GoogleSessionResult = { sessionId: string; uploadUrl: string }
type GoogleCompleteResult = { file: Record<string, unknown> }

const fileViewStorageKey = '9drive:all-files-view-mode'

function getStoredFileViewMode(): FileViewMode {
  const stored = localStorage.getItem(fileViewStorageKey)
  return stored === 'grid' || stored === 'list' ? stored : 'list'
}

function mimeToKind(mimeType: string): FileItem['kind'] {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.includes('pdf')) return 'pdf'
  return 'doc'
}

function providerLabel(provider: string | undefined) {
  if (provider === 's3') return 'S3 Storage'
  return 'Google Drive'
}

function mapFile(file: BackendFile): FileItem {
  return { id: file.id, name: file.name, mimeType: file.mimeType, sizeBytes: file.sizeBytes, createdAt: file.createdAt, isShared: file.isShared ?? false, accountEmail: file.connectedAccount?.email, accountProvider: providerLabel(file.connectedAccount?.provider), date: formatDate(file.createdAt), size: formatBytes(file.sizeBytes), access: file.connectedAccount?.email ?? providerLabel(file.connectedAccount?.provider), kind: mimeToKind(file.mimeType), shared: 1, folderId: file.folderId, folderName: file.folder?.name }
}

function mapFolder(folder: BackendFolder): FolderItem {
  return { id: folder.id, name: folder.name, color: folder.color, iconUrl: folder.iconUrl, parentId: folder.parentId, updated: `Updated ${formatDate(folder.updatedAt)}` }
}

function estimateUploadProgress(files: File[], percent: number, status: UploadProgressStatus): UploadProgressFile[] {
  const totalBytes = Math.max(files.reduce((total, file) => total + file.size, 0), 1)
  let loadedBytes = (totalBytes * percent) / 100
  return files.map((file) => {
    const loadedForFile = Math.min(file.size, Math.max(0, loadedBytes))
    loadedBytes -= file.size
    return { name: file.name, size: file.size, percent: status === 'done' ? 100 : Math.min(99, Math.round((loadedForFile / Math.max(file.size, 1)) * 100)), status }
  })
}

function FolderAppearanceFields({ color, iconUrl, onColorChange, onIconChange }: { color: string; iconUrl: string; onColorChange: (color: string) => void; onIconChange: (iconUrl: string) => void }) {
  const normalizedColor = normalizeFolderColor(color)
  return (
    <div className="grid gap-4">
      <label className="grid gap-2 text-sm font-semibold">Folder Color<Input type="color" value={normalizedColor} onChange={(event) => onColorChange(event.target.value)} className="h-12 p-1" /></label>
      <div className="flex flex-wrap gap-2">{folderColorOptions.map((option) => <button key={option} type="button" onClick={() => onColorChange(option)} className={normalizedColor === option ? 'h-8 w-8 rounded-lg border-2 border-blue-600' : 'h-8 w-8 rounded-lg border border-slate-200'} style={{ backgroundColor: option }} aria-label={`Use ${option} folder color`} />)}</div>
      <div className="grid gap-2 text-sm font-semibold"><span>Folder Icon</span><div className="grid grid-cols-4 gap-2 sm:grid-cols-8">{folderIconOptions.map((option) => <button key={option.url} type="button" onClick={() => onIconChange(option.url)} className={iconUrl === option.url ? 'flex h-12 items-center justify-center rounded-xl border-2 border-blue-600 bg-blue-50 p-2' : 'flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-2 hover:bg-slate-100'} title={option.label} aria-label={`Use ${option.label} icon`}><img src={`${option.url}?color=${encodeURIComponent(normalizedColor)}`} alt="" className="h-6 w-6" /></button>)}</div></div>
    </div>
  )
}

export function AllFilesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeFolderId = searchParams.get('folderId')
  const searchQuery = searchParams.get('q')?.trim() ?? ''
  const [uploadOpen, setUploadOpen] = useState(false)
  const [folderOpen, setFolderOpen] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const [folderRenameOpen, setFolderRenameOpen] = useState(false)
  const [folderDeleteOpen, setFolderDeleteOpen] = useState(false)
  const [moveOpen, setMoveOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const [shareDirectUrl, setShareDirectUrl] = useState<string | null>(null)
  const [copiedShareLink, setCopiedShareLink] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')
  const [previewError, setPreviewError] = useState('')
  const [previewLoading, setPreviewLoading] = useState(false)
  const [files, setFiles] = useState<FileItem[]>([])
  const [folders, setFolders] = useState<FolderItem[]>([])
  const [allFolders, setAllFolders] = useState<FolderItem[]>([])
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [selectedFolderId, setSelectedFolderId] = useState('')
  const [isUploadDragging, setIsUploadDragging] = useState(false)
  const [folderName, setFolderName] = useState('')
  const [folderColor, setFolderColor] = useState(defaultFolderColor)
  const [folderIconUrl, setFolderIconUrl] = useState(defaultFolderIconUrl)
  const [renameValue, setRenameValue] = useState('')
  const [folderRenameValue, setFolderRenameValue] = useState('')
  const [folderRenameColor, setFolderRenameColor] = useState(defaultFolderColor)
  const [folderRenameIconUrl, setFolderRenameIconUrl] = useState(defaultFolderIconUrl)
  const [activeFile, setActiveFile] = useState<FileItem | null>(null)
  const [activeFolderForMenu, setActiveFolderForMenu] = useState<FolderItem | null>(null)
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set())
  const [cutFolder, setCutFolder] = useState<FolderItem | null>(null)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; file: FileItem | null }>({ x: 0, y: 0, file: null })
  const [folderContextMenu, setFolderContextMenu] = useState<{ x: number; y: number; folder: FolderItem | null }>({ x: 0, y: 0, folder: null })
  const [emptyContextMenu, setEmptyContextMenu] = useState<{ x: number; y: number; open: boolean }>({ x: 0, y: 0, open: false })
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [syncingDrive, setSyncingDrive] = useState(false)
  const [fileViewMode, setFileViewMode] = useState<FileViewMode>(getStoredFileViewMode)
  const [uploadProgress, setUploadProgress] = useState<UploadProgressState>({ open: false, fileName: '', percent: 0, status: 'uploading', files: [] })
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('viewer')
  const [inviteTargetType, setInviteTargetType] = useState<'file' | 'folder'>('file')
  const [inviteTargetId, setInviteTargetId] = useState('')
  const [inviteMessage, setInviteMessage] = useState('')
  const [inviting, setInviting] = useState(false)
  const previewVideoRef = useRef<HTMLVideoElement | null>(null)

  async function loadFiles(page = currentPage) {
    const params = new URLSearchParams()
    if (activeFolderId) params.set('folderId', activeFolderId)
    if (searchQuery) params.set('q', searchQuery)
    params.set('page', String(page))
    params.set('limit', '100')
    const data = await apiFetch<{ files: BackendFile[]; pagination: Pagination }>(`/files?${params.toString()}`)
    setFiles(data.files.map(mapFile))
    setPagination(data.pagination)
  }

  async function loadFolders() {
    const visiblePath = activeFolderId ? `/folders?parentId=${activeFolderId}` : '/folders'
    const [visibleData, allData] = await Promise.all([
      apiFetch<{ folders: BackendFolder[] }>(visiblePath),
      apiFetch<{ folders: BackendFolder[] }>('/folders?all=1'),
    ])
    setFolders(visibleData.folders.map(mapFolder))
    setAllFolders(allData.folders.map(mapFolder))
  }

  async function loadAll() {
    await Promise.all([loadFiles(), loadFolders()])
  }

  useEffect(() => {
    setCurrentPage(1)
    loadAll().catch((error) => setMessage(error instanceof Error ? error.message : 'Failed to load files'))
    setSelectedFileIds(new Set())
  }, [activeFolderId, searchQuery])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setContextMenu({ x: 0, y: 0, file: null })
      if (event.key === 'Escape') setFolderContextMenu({ x: 0, y: 0, folder: null })
      if (event.key === 'Escape') setEmptyContextMenu({ x: 0, y: 0, open: false })
      if (event.ctrlKey && event.key.toLowerCase() === 'x' && activeFolderForMenu) {
        event.preventDefault()
        cutSelectedFolder(activeFolderForMenu)
      }
      if (event.ctrlKey && event.key.toLowerCase() === 'v' && cutFolder) {
        event.preventDefault()
        pasteFolder().catch((error) => setMessage(error instanceof Error ? error.message : 'Failed to paste folder'))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [activeFolderForMenu, cutFolder, activeFolderId])

  useEffect(() => {
    if (!previewOpen || !activeFile?.mimeType?.startsWith('video/') || !previewVideoRef.current) return undefined
    let disposed = false
    let player: { destroy: () => void } | null = null

    ensurePlyr().then(() => {
      if (disposed || !previewVideoRef.current) return
      player = createPlyr(previewVideoRef.current)
    }).catch(() => undefined)

    return () => {
      disposed = true
      player?.destroy()
    }
  }, [previewOpen, activeFile?.mimeType, previewUrl])

  async function createFolder(event: FormEvent) {
    event.preventDefault()
    await apiFetch('/folders', { method: 'POST', body: JSON.stringify({ name: folderName, color: folderColor, iconUrl: folderIconUrl, parentId: activeFolderId ?? null }) })
    setFolderName('')
    setFolderColor(defaultFolderColor)
    setFolderIconUrl(defaultFolderIconUrl)
    setFolderOpen(false)
    await loadFolders()
  }

  // --- Added: direct-to-Google-Drive upload for a single file. ---
  // Returns null (instead of throwing) when no connected Google Drive
  // account currently has enough free space, so the caller can fall back
  // to the proxied /uploads endpoint (e.g. for S3-only setups).
  async function uploadFileDirectToGoogle(
    file: File,
    folderId: string | undefined,
    onProgress: (percent: number) => void,
  ): Promise<UploadResult | null> {
    const bestAccountRes = await fetch(`${API_URL}/uploads/google/best-account?sizeBytes=${file.size}`, {
      headers: { Authorization: `Bearer ${getAccessToken()}` },
    })
    if (!bestAccountRes.ok) return null
    const { accountId } = (await bestAccountRes.json()) as GoogleBestAccountResult

    const sessionRes = await fetch(`${API_URL}/uploads/google/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAccessToken()}` },
      body: JSON.stringify({
        accountId,
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        sizeBytes: file.size,
        folderId,
      }),
    })
    if (!sessionRes.ok) {
      const body = await sessionRes.json().catch(() => ({}))
      throw new Error(body.message ?? 'Failed to start upload session.')
    }
    const { sessionId, uploadUrl } = (await sessionRes.json()) as GoogleSessionResult

    // PUT the file bytes directly to Google Drive via XHR.
    // IMPORTANT: Google's upload endpoint does not send CORS headers, so the
    // browser will fire xhr.onerror even when the upload actually succeeds
    // (status 200/201 visible in DevTools). We therefore treat onerror as
    // "possibly succeeded" rather than a definite failure — the backend will
    // verify by querying Google Drive when we call /complete.
    // If the upload genuinely failed, /complete will return 404 and we surface
    // that error to the user instead.
    await new Promise<void>((resolve) => {
      const xhr = new XMLHttpRequest()
      xhr.open('PUT', uploadUrl, true)
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) onProgress(Math.min(98, Math.round((event.loaded / event.total) * 100)))
      }
      // Resolve on any terminal event — success or CORS-blocked onerror.
      // The /complete endpoint will tell us whether the file actually landed.
      xhr.onload = () => resolve()
      xhr.onerror = () => resolve()
      xhr.onabort = () => resolve()
      xhr.send(file)
    })

    // PUT succeeded — ask backend to look up the file ID in Google Drive.
    onProgress(99)

    // --- PERBAIKAN: Pastikan token segar sebelum memanggil endpoint /complete ---
    const freshToken = await ensureFreshToken(); 
    if (!freshToken) {
      throw new Error('Session expired. Please login again to finalize upload.');
    }

    const completeRes = await fetch(`${API_URL}/uploads/google/complete`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        Authorization: `Bearer ${freshToken}` // Gunakan token yang sudah di-refresh
      },
      body: JSON.stringify({ sessionId, folderId }),
    })
    if (!completeRes.ok) {
      const body = await completeRes.json().catch(() => ({}))
      throw new Error(body.message ?? 'Failed to finalize upload.')
    }
    const { file: savedFile } = (await completeRes.json()) as GoogleCompleteResult

    onProgress(100)
    return { file: savedFile }
  }

  async function uploadFile(event: FormEvent) {
  event.preventDefault()
  if (selectedFiles.length === 0) return
  setLoading(true)
  setMessage('')
  const targetFolderId = activeFolderId || selectedFolderId
  const uploadingFiles = [...selectedFiles]

  try {
    setUploadProgress({ 
      open: true, 
      fileName: uploadingFiles.length === 1 ? uploadingFiles[0].name : `${uploadingFiles.length} files`, 
      percent: 0, 
      status: 'uploading', 
      files: estimateUploadProgress(uploadingFiles, 0, 'uploading') 
    })

    const allResults: UploadResult[] = []

    // --- PERBAIKAN: Loop semua file, coba Direct Upload untuk SETIAP file ---
    for (let i = 0; i < uploadingFiles.length; i++) {
      const file = uploadingFiles[i]
      
      // Update progress text agar user tahu file mana yang sedang berjalan
      setUploadProgress(curr => ({ ...curr, fileName: `Uploading ${i+1}/${uploadingFiles.length}: ${file.name}` }))

      try {
        // Coba jalur Direct ke Google untuk setiap file
        const directResult = await uploadFileDirectToGoogle(
          file, 
          targetFolderId || undefined, 
          (percent) => {
            setUploadProgress(current => {
              const newFiles = [...current.files];
              if (newFiles[i]) newFiles[i].percent = percent;
              return { ...current, percent: Math.round((i / uploadingFiles.length) * 100), files: newFiles };
            });
          }
        )

        // Jika direct gagal (misal: akun tidak cukup space), fallback ke proxy
        const finalRes = directResult ?? await (async () => {
          const form = new FormData()
          const meta = { fieldName: 'file-0', fileName: file.name, mimeType: file.type || 'application/octet-stream', sizeBytes: String(file.size), folderId: targetFolderId || undefined }
          form.append('filesMeta', JSON.stringify([meta]))
          form.append('file-0', file)
          return uploadWithProgress(form, () => {}) // progress sudah dihandle loop
        })()

        allResults.push(finalRes)
      } catch (e) {
        console.error(`Error uploading ${file.name}:`, e)
        allResults.push({ failed: [{ fileName: file.name }] })
      }
    }

    // Gabungkan hasil akhir
    const finalUploadResult: UploadResult = {
      files: allResults.flatMap(r => r.files || []),
      file: allResults[0]?.file,
      failed: allResults.flatMap(r => r.failed || [])
    }

    // Update Final Progress
    setUploadProgress(current => ({ 
      ...current, 
      percent: 100, 
      status: finalUploadResult.failed?.length ? 'partial' : 'done', 
      files: uploadingFiles.map((f, idx) => ({ 
        name: f.name, 
        size: f.size, 
        percent: 100, 
        status: allResults[idx]?.failed ? 'error' : 'done' 
      })) 
    }))

    setSelectedFiles([])
    setSelectedFolderId('')
    setUploadOpen(false)
    setMessage(finalUploadResult.failed?.length ? 'Some files failed to upload.' : 'All files uploaded successfully.')
    await loadFiles()
    window.dispatchEvent(new Event('9drive:storage-changed'))
  } catch (error) {
    setMessage(error instanceof Error ? error.message : 'Upload failed')
  } finally {
    setLoading(false)
  }
}

  async function syncGoogleDrive() {
    setSyncingDrive(true)
    setMessage('')
    try {
      const result = await apiFetch<SyncGoogleResult>('/files/sync-google', { method: 'POST', body: JSON.stringify({}) })
      setMessage(`Google Drive synced. ${result.created} added, ${result.updated} updated, ${result.deleted} removed across ${result.accounts} account${result.accounts === 1 ? '' : 's'}.`)
      await loadAll()
      window.dispatchEvent(new Event('9drive:storage-changed'))
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to sync Google Drive')
    } finally {
      setSyncingDrive(false)
    }
  }

  function selectUploadFiles(files: FileList | File[] | null | undefined) {
    if (!files) return
    const nextFiles = Array.from(files)
    if (nextFiles.length === 0) return
    setSelectedFiles(nextFiles)
  }

  function removeUploadFile(index: number) {
    setSelectedFiles((files) => files.filter((_, fileIndex) => fileIndex !== index))
  }

  function handleUploadDrag(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault()
    event.stopPropagation()
    if (event.type === 'dragenter' || event.type === 'dragover') setIsUploadDragging(true)
    if (event.type === 'dragleave' || event.type === 'drop') setIsUploadDragging(false)
    if (event.type === 'drop') selectUploadFiles(event.dataTransfer.files)
  }

  // Refresh the JWT access token if it will expire within the next 2 minutes.
  // uploadWithProgress uses XHR directly (not apiFetch) so it has no built-in
  // refresh — we call this before every proxied upload to be safe.
  async function ensureFreshToken(): Promise<string | null> {
    const token = getAccessToken()
    if (!token) return null
    try {
      // Decode the JWT payload to check expiry (no signature verification needed here).
      const payload = JSON.parse(atob(token.split('.')[1]!)) as { exp?: number }
      const expiresAt = (payload.exp ?? 0) * 1000
      const twoMinutes = 2 * 60 * 1000
      if (Date.now() + twoMinutes < expiresAt) return token
    } catch {
      return token // if decode fails just use the token as-is
    }
    // Token expires soon — refresh it.
    const refreshToken = getRefreshToken()
    if (!refreshToken) return token
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })
      if (!res.ok) return token
      const data = await res.json() as { accessToken: string }
      setAccessToken(data.accessToken)
      return data.accessToken
    } catch {
      return token
    }
  }

  function uploadWithProgress(form: FormData, onProgress: (percent: number) => void) {
    return new Promise<UploadResult>((resolve, reject) => {
      // Ensure we have a fresh token before sending — XHR does not auto-refresh.
      ensureFreshToken().then((token) => {
        const request = new XMLHttpRequest()
        request.open('POST', `${API_URL}/uploads`)
        if (token) request.setRequestHeader('Authorization', `Bearer ${token}`)
        request.upload.onprogress = (event) => {
          if (!event.lengthComputable) return
          onProgress(Math.min(99, Math.round((event.loaded / event.total) * 100)))
        }
        request.onload = () => {
          if (request.status >= 200 && request.status < 300) resolve(JSON.parse(request.responseText || '{}') as UploadResult)
          else {
            const error = JSON.parse(request.responseText || '{}') as { message?: string }
            reject(new Error(error.message ?? 'Upload failed'))
          }
        }
        request.onerror = () => reject(new Error('Upload failed'))
        request.send(form)
      }).catch(() => reject(new Error('Failed to refresh auth token')))
    })
  }

  function openContext(event: MouseEvent<HTMLElement>, file: FileItem) {
    event.preventDefault()
    event.stopPropagation()
    setActiveFile(file)
    setContextMenu({ x: event.clientX, y: event.clientY, file })
  }

  function toggleFileSelection(file: FileItem) {
    if (!file.id) return
    setSelectedFileIds((current) => {
      const next = new Set(current)
      if (next.has(file.id!)) next.delete(file.id!)
      else next.add(file.id!)
      return next
    })
  }

  function toggleAllVisibleFiles() {
    const visibleIds = files.map((file) => file.id).filter(Boolean) as string[]
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedFileIds.has(id))
    setSelectedFileIds(allSelected ? new Set() : new Set(visibleIds))
  }

  function clearSelection() {
    setSelectedFileIds(new Set())
  }

  async function goToPage(page: number) {
    setCurrentPage(page)
    await loadFiles(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function changeFileViewMode(mode: FileViewMode) {
    setFileViewMode(mode)
    localStorage.setItem(fileViewStorageKey, mode)
  }

  function openFolderMenu(event: MouseEvent<HTMLElement>, folder: FolderItem) {
    event.preventDefault()
    event.stopPropagation()
    setActiveFolderForMenu(folder)
    setFolderContextMenu({ x: event.clientX, y: event.clientY, folder })
  }

  function openFolder(folder: FolderItem) {
    if (!folder.id) return
    setSearchParams(searchQuery ? { folderId: folder.id, q: searchQuery } : { folderId: folder.id })
  }

  function openFolderById(folderId: string) {
    setSearchParams(searchQuery ? { folderId, q: searchQuery } : { folderId })
  }

  function openEmptyContextMenu(event: MouseEvent<HTMLElement>) {
    event.preventDefault()
    setEmptyContextMenu({ x: event.clientX, y: event.clientY, open: true })
  }

  function closeFolder() {
    setSearchParams(searchQuery ? { q: searchQuery } : {})
  }

  async function viewFile() {
    if (!activeFile?.id) return
    setPreviewUrl('')
    setPreviewError('')
    setPreviewLoading(true)
    setPreviewOpen(true)
    setContextMenu({ x: 0, y: 0, file: null })
    try {
      const data = await apiFetch<{ path?: string; url: string }>(`/files/${activeFile.id}/preview-token`, { method: 'POST' })
      const previewPath = data.path ?? new URL(data.url).pathname
      setPreviewUrl(`${API_URL}${previewPath}`)
    } catch (error) {
      setPreviewError(error instanceof Error ? error.message : 'Failed to load preview')
    } finally {
      setPreviewLoading(false)
    }
  }

  async function downloadFile(file: FileItem | null) {
  if (!file || !file.id) {
    setMessage('No file selected for download.')
    return
  }

  try {
    const data = await apiFetch<{ url: string; directUrl?: string }>(`/files/${file.id}/download-url`, { method: 'GET' })
    const url = data.directUrl ?? data.url
    
    const a = document.createElement('a')
    a.href = url
    a.download = file.name ?? ''
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    
    setContextMenu({ x: 0, y: 0, file: null })
  } catch (error) {
    console.error('Download error:', error)
    setMessage(error instanceof Error ? error.message : 'Failed to generate download link')
  }
}

  async function renameFile(event: FormEvent) {
    event.preventDefault()
    if (!activeFile?.id) return
    await apiFetch(`/files/${activeFile.id}`, { method: 'PATCH', body: JSON.stringify({ name: renameValue }) })
    setRenameOpen(false)
    await loadFiles()
  }

  async function moveFile(event: FormEvent) {
    event.preventDefault()
    const selectedIds = [...selectedFileIds]
    if (selectedIds.length > 0) await apiFetch('/files/batch', { method: 'PATCH', body: JSON.stringify({ fileIds: selectedIds, folderId: selectedFolderId || null }) })
    else if (activeFile?.id) await apiFetch(`/files/${activeFile.id}`, { method: 'PATCH', body: JSON.stringify({ folderId: selectedFolderId || null }) })
    else return
    setMoveOpen(false)
    setSelectedFolderId('')
    clearSelection()
    await loadFiles()
  }

  async function deleteFile() {
  // 1. TUTUP POPUP SEGERA
  setDeleteOpen(false);
  setFolderDeleteOpen(false);
  
  // Simpan ID yang akan dihapus untuk update UI lokal
  const idsToDelete = selectedFileIds.size > 0 ? [...selectedFileIds] : (activeFile?.id ? [activeFile.id] : []);
  
  if (idsToDelete.length === 0) return;

  // 2. OPTIMISTIC UPDATE: Hapus file dari state secara instan
  // User melihat file hilang seketika, meskipun server masih memproses
  setFiles((currentFiles) => currentFiles.filter((file) => !idsToDelete.includes(file.id!)));
  clearSelection();
  
  try {
    setLoading(true);
    setMessage('Deleting files...');

    // 3. Jalankan proses hapus di background
    await (async () => {
      if (idsToDelete.length > 1) {
        await apiFetch('/files/batch', { 
          method: 'DELETE', 
          body: JSON.stringify({ fileIds: idsToDelete }) 
        });
      } else {
        await apiFetch(`/files/${idsToDelete[0]}`, { method: 'DELETE' });
      }

      // 4. Update daftar file dari server untuk memastikan sinkronisasi
      await loadFiles();
      
      // 5. Update kuota di sidebar/header
      window.dispatchEvent(new Event('9drive:storage-changed'));
      setMessage('Files deleted successfully.');
    })();
  } catch (error) {
    // Jika gagal, kembalikan file yang terhapus ke layar (Rollback)
    await loadFiles(); 
    console.error('Delete error:', error);
    setMessage(error instanceof Error ? error.message : 'Failed to delete files');
  } finally {
    setLoading(false);
  }
}

    async function shareFile() {
    if (!activeFile?.id) return
    const data = await apiFetch<{ url: string; directUrl?: string | null }>(`/files/${activeFile.id}/share`, { method: 'POST' })
    setShareUrl(data.url)
    setShareDirectUrl(data.directUrl ?? null) // tambah ini
    setCopiedShareLink(false)
    setShareOpen(true)
    setContextMenu({ x: 0, y: 0, file: null })
  }

  async function inviteToFile() {
    if (!activeFile?.id) return
    setInviteTargetType('file')
    setInviteTargetId(activeFile.id)
    setInviteOpen(true)
    setContextMenu({ x: 0, y: 0, file: null })
  }

  async function inviteToFolder() {
    if (!activeFolderForMenu?.id) return
    setInviteTargetType('folder')
    setInviteTargetId(activeFolderForMenu.id)
    setInviteOpen(true)
    setFolderContextMenu({ x: 0, y: 0, folder: null })
  }

  async function sendInvite(event: FormEvent) {
    event.preventDefault()
    if (!inviteTargetId) return
    setInviting(true)
    setInviteMessage('')
    try {
      await apiFetch('/invites', { method: 'POST', body: JSON.stringify({ email: inviteEmail, role: inviteRole, targetType: inviteTargetType, targetId: inviteTargetId }) })
      setInviteEmail('')
      setInviteRole('viewer')
      setInviteMessage('Invite saved. Member will appear in Shared.')
      window.dispatchEvent(new Event('9drive:invites-changed'))
    } catch (error) {
      setInviteMessage(error instanceof Error ? error.message : 'Failed to send invite')
    } finally {
      setInviting(false)
    }
  }

  async function copyShareLink() {
    await navigator.clipboard.writeText(shareUrl)
    setCopiedShareLink(true)
    window.setTimeout(() => setCopiedShareLink(false), 1600)
  }

  async function renameFolder(event: FormEvent) {
    event.preventDefault()
    if (!activeFolderForMenu?.id) return
    await apiFetch(`/folders/${activeFolderForMenu.id}`, { method: 'PATCH', body: JSON.stringify({ name: folderRenameValue, color: folderRenameColor, iconUrl: folderRenameIconUrl }) })
    setFolderRenameOpen(false)
    await loadFolders()
  }

  async function deleteFolder() {
    if (!activeFolderForMenu?.id) return
    await apiFetch(`/folders/${activeFolderForMenu.id}`, { method: 'DELETE' })
    setFolderDeleteOpen(false)
    await loadFolders()
  }

  function cutSelectedFolder(folder: FolderItem | null) {
    if (!folder?.id) return
    setCutFolder(folder)
    setFolderContextMenu({ x: 0, y: 0, folder: null })
    setMessage(`Folder "${folder.name}" ready to move. Open target folder and press Ctrl+V.`)
  }

  async function pasteFolder() {
    if (!cutFolder?.id) return
    await apiFetch(`/folders/${cutFolder.id}`, { method: 'PATCH', body: JSON.stringify({ parentId: activeFolderId ?? null }) })
    setMessage(`Folder "${cutFolder.name}" moved.`)
    setCutFolder(null)
    await loadFolders()
  }

  function closePreview() {
    setPreviewUrl('')
    setPreviewError('')
    setPreviewLoading(false)
    setPreviewOpen(false)
  }

  const recentFolders = folders.slice(0, 4)
  const moreFolders = folders.slice(4)
  const activeFolder = allFolders.find((folder) => folder.id === activeFolderId)
  const folderBreadcrumbs = (() => {
    if (!activeFolder) return []
    const foldersById = new Map(allFolders.map((folder) => [folder.id, folder]))
    const path: FolderItem[] = []
    const visited = new Set<string>()
    let current: FolderItem | undefined = activeFolder
    while (current?.id && !visited.has(current.id)) {
      path.unshift(current)
      visited.add(current.id)
      current = current.parentId ? foldersById.get(current.parentId) : undefined
    }
    return path
  })()
  const allVisibleSelected = files.length > 0 && files.every((file) => file.id && selectedFileIds.has(file.id))
  const uploadPanelTitle = uploadProgress.status === 'done' ? 'Upload complete' : uploadProgress.status === 'partial' ? 'Upload completed with errors' : uploadProgress.status === 'error' ? 'Upload failed' : uploadProgress.percent >= 99 ? 'Processing on server' : 'Uploading files'
  const activePreviewKind = getPreviewKind(activeFile?.mimeType)

  return (
    <>
      <div onContextMenu={openEmptyContextMenu} className="min-h-[620px] w-full min-w-0">
      <PageHeader title={activeFolder ? <span className="block min-w-0 truncate"><button className="text-blue-600 hover:underline" onClick={closeFolder}>All Files</button>{folderBreadcrumbs.map((folder, index) => <span key={folder.id}><span className="text-slate-400"> / </span>{index === folderBreadcrumbs.length - 1 ? <span>{folder.name}</span> : <button className="text-blue-600 hover:underline" onClick={() => folder.id && openFolderById(folder.id)}>{folder.name}</button>}</span>)}</span> : 'All Files'} actions={<><Button className="w-full" onClick={() => setUploadOpen(true)}><Upload className="h-4 w-4" />Upload</Button><Button className="w-full" variant="outline" onClick={() => setFolderOpen(true)}><FolderPlus className="h-4 w-4" />New Folder</Button><Button className="w-full" variant="outline" disabled={syncingDrive} onClick={syncGoogleDrive}><RefreshCw className={syncingDrive ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />{syncingDrive ? 'Syncing...' : 'Sync Drive'}</Button></>} />
      {message ? <p className="mt-5 rounded-xl bg-blue-50 p-3 text-sm text-blue-700">{message}</p> : null}
      {!activeFolder && (recentFolders.length > 0 ? <FolderGrid items={recentFolders} mobileTwoColumns onFolderMenu={openFolderMenu} onFolderOpen={openFolder} /> : <p className="mt-8 rounded-xl bg-slate-50 p-5 text-sm text-slate-500">No folders yet. Click New Folder to organize uploads.</p>)}
      {!activeFolder && moreFolders.length > 0 ? <Card className="mt-5 p-4 sm:p-5"><h2 className="font-extrabold">More Folders</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">{moreFolders.map((folder) => <div key={folder.id} onClick={() => openFolder(folder)} onContextMenu={(event) => openFolderMenu(event, folder)} className="flex cursor-pointer items-center justify-between gap-3 rounded-xl bg-slate-50 p-3 hover:bg-slate-100"><div className="flex min-w-0 items-center gap-3"><FolderVisual folder={folder} className="h-6 w-6 shrink-0" /><div className="min-w-0"><p className="truncate font-semibold">{folder.name}</p><p className="truncate text-xs text-slate-500">{folder.updated}</p></div></div><button className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-white sm:h-8 sm:w-8 sm:rounded-lg" onClick={(event) => { event.stopPropagation(); openFolderMenu(event, folder) }} aria-label={`Open ${folder.name} menu`}><MoreVertical className="h-5 w-5" /></button></div>)}</div></Card> : null}
      {activeFolder && folders.length > 0 ? <Card className="mt-5 p-4 sm:p-5"><h2 className="font-extrabold">Folders</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">{folders.map((folder) => <div key={folder.id} onClick={() => openFolder(folder)} onContextMenu={(event) => openFolderMenu(event, folder)} className="flex cursor-pointer items-center justify-between gap-3 rounded-xl bg-slate-50 p-3 hover:bg-slate-100"><div className="flex min-w-0 items-center gap-3"><FolderVisual folder={folder} className="h-6 w-6 shrink-0" /><div className="min-w-0"><p className="truncate font-semibold">{folder.name}</p><p className="truncate text-xs text-slate-500">{folder.updated}</p></div></div><button className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-white sm:h-8 sm:w-8 sm:rounded-lg" onClick={(event) => { event.stopPropagation(); openFolderMenu(event, folder) }} aria-label={`Open ${folder.name} menu`}><MoreVertical className="h-5 w-5" /></button></div>)}</div></Card> : null}
      <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3"><Button variant="soft" className="hidden sm:inline-flex"><Archive className="h-4 w-4" />Recents</Button><Button variant="soft" className="hidden sm:inline-flex"><Star className="h-4 w-4" />Starred</Button>{selectedFileIds.size > 0 ? <div className="flex w-full flex-col gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-3 sm:w-auto sm:flex-row sm:items-center sm:border-0 sm:bg-transparent sm:p-0"><span className="text-sm font-extrabold text-slate-700">{selectedFileIds.size} selected</span><div className="grid grid-cols-3 gap-2 sm:flex sm:gap-3"><Button className="w-full" variant="outline" onClick={() => setMoveOpen(true)}><FolderInput className="h-4 w-4" />Move</Button><Button className="w-full" variant="danger" onClick={() => setDeleteOpen(true)}><Trash2 className="h-4 w-4" />Delete</Button><Button className="w-full" variant="ghost" onClick={clearSelection}>Clear</Button></div></div> : null}</div>
        <div className="flex gap-3"><Button variant={fileViewMode === 'grid' ? 'soft' : 'outline'} size="icon" aria-label="Show files as grid" aria-pressed={fileViewMode === 'grid'} onClick={() => changeFileViewMode('grid')}><LayoutGrid className="h-5 w-5" /></Button><Button variant={fileViewMode === 'list' ? 'soft' : 'outline'} size="icon" aria-label="Show files as list" aria-pressed={fileViewMode === 'list'} onClick={() => changeFileViewMode('list')}><List className="h-5 w-5" /></Button></div>
      </div>
      {cutFolder ? <p className="mt-5 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-700"><ClipboardPaste className="mr-2 inline h-4 w-4" />Cut folder: {cutFolder.name}. Press Ctrl+V or right-click empty area to paste here.</p> : null}
      {files.length === 0 ? <p className="mt-5 rounded-xl bg-slate-50 p-5 text-sm text-slate-500">{searchQuery ? `No files found for "${searchQuery}".` : activeFolder ? 'No files in this folder yet.' : 'No uploaded files yet. Connect Google Drive in Settings, then upload a file.'}</p> : fileViewMode === 'grid' ? <FileGrid files={files} selectedFileIds={selectedFileIds} onToggleFile={toggleFileSelection} onFileContextMenu={openContext} /> : <FileTable files={files} selectedFileIds={selectedFileIds} allSelected={allVisibleSelected} onToggleFile={toggleFileSelection} onToggleAll={toggleAllVisibleFiles} onFileContextMenu={openContext} />}
      {pagination && pagination.totalPages > 1 ? (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5">
          <p className="text-sm text-slate-500">
            Showing <b>{(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)}</b> of <b>{pagination.total}</b> files
          </p>
          <div className="flex items-center gap-2">
            <button type="button" disabled={!pagination.hasPrev} onClick={() => goToPage(pagination.page - 1).catch(() => undefined)} className="inline-flex h-9 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">
              ← Prev
            </button>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).filter((p) => p === 1 || p === pagination.totalPages || Math.abs(p - pagination.page) <= 1).reduce<Array<number | '...'>>((acc, p, idx, arr) => {
              if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...')
              acc.push(p)
              return acc
            }, []).map((p, idx) =>
              p === '...' ? <span key={`ellipsis-${idx}`} className="px-1 text-slate-400">…</span> :
              <button key={p} type="button" onClick={() => goToPage(p as number).catch(() => undefined)} className={p === pagination.page ? 'inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-sm font-bold text-white' : 'inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition hover:bg-slate-50'}>{p}</button>
            )}
            <button type="button" disabled={!pagination.hasNext} onClick={() => goToPage(pagination.page + 1).catch(() => undefined)} className="inline-flex h-9 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">
              Next →
            </button>
          </div>
        </div>
      ) : null}
      </div>
      <EmptyAreaContextMenu x={emptyContextMenu.x} y={emptyContextMenu.y} open={emptyContextMenu.open} canPasteFolder={Boolean(cutFolder)} onClose={() => setEmptyContextMenu({ x: 0, y: 0, open: false })} onUpload={() => { setUploadOpen(true); setEmptyContextMenu({ x: 0, y: 0, open: false }) }} onCreateFolder={() => { setFolderOpen(true); setEmptyContextMenu({ x: 0, y: 0, open: false }) }} onPasteFolder={() => { pasteFolder().catch((error) => setMessage(error instanceof Error ? error.message : 'Failed to paste folder')); setEmptyContextMenu({ x: 0, y: 0, open: false }) }} />
      <FileContextMenu x={contextMenu.x} y={contextMenu.y} file={contextMenu.file} onClose={() => setContextMenu({ x: 0, y: 0, file: null })} onView={viewFile} onDownload={() => downloadFile(contextMenu.file)} onRename={() => { setRenameValue(activeFile?.name ?? ''); setRenameOpen(true); setContextMenu({ x: 0, y: 0, file: null }) }} onMove={() => { setMoveOpen(true); setContextMenu({ x: 0, y: 0, file: null }) }} onDetails={() => { setDetailOpen(true); setContextMenu({ x: 0, y: 0, file: null }) }} onShare={shareFile} onInvite={inviteToFile} onDelete={() => { setDeleteOpen(true); setContextMenu({ x: 0, y: 0, file: null }) }} />
      <FolderContextMenu x={folderContextMenu.x} y={folderContextMenu.y} folder={folderContextMenu.folder} onClose={() => setFolderContextMenu({ x: 0, y: 0, folder: null })} onCut={() => cutSelectedFolder(activeFolderForMenu)} onRename={() => { setFolderRenameValue(activeFolderForMenu?.name ?? ''); setFolderRenameColor(normalizeFolderColor(activeFolderForMenu?.color)); setFolderRenameIconUrl(activeFolderForMenu?.iconUrl ?? defaultFolderIconUrl); setFolderRenameOpen(true); setFolderContextMenu({ x: 0, y: 0, folder: null }) }} onInvite={inviteToFolder} onDelete={() => { setFolderDeleteOpen(true); setFolderContextMenu({ x: 0, y: 0, folder: null }) }} />
      <FileDetailsDrawer open={detailOpen} file={activeFile} onClose={() => setDetailOpen(false)} />

      <DummyModal open={uploadOpen} title="Upload File" description="Stream file directly to selected Google Drive account." onClose={() => setUploadOpen(false)}>
        <form onSubmit={uploadFile} className="grid gap-4">
           <label onDragEnter={handleUploadDrag} onDragOver={handleUploadDrag} onDragLeave={handleUploadDrag} onDrop={handleUploadDrag} className={isUploadDragging ? 'grid cursor-pointer gap-3 rounded-2xl border-2 border-dashed border-blue-500 bg-blue-50 p-4 text-center transition sm:p-6' : 'grid cursor-pointer gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-4 text-center transition hover:border-blue-300 hover:bg-blue-50/50 sm:p-6'}>
            <Upload className={isUploadDragging ? 'mx-auto h-8 w-8 text-blue-600' : 'mx-auto h-8 w-8 text-slate-500'} />
            <span className="text-sm font-extrabold text-slate-950">Drop file here or click to browse</span>
            <span className="text-xs text-slate-500">Metadata is sent before the file so upload can stream directly to Google Drive.</span>
            <Input type="file" className="sr-only" multiple onChange={(event) => selectUploadFiles(event.target.files)} required={selectedFiles.length === 0} />
          </label>
          {activeFolder ? <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">Uploading to: <b>{activeFolder.name}</b></p> : <label className="grid gap-2 text-sm font-semibold">Virtual Folder<select className="h-11 rounded-xl border border-slate-200 px-3 text-sm" value={selectedFolderId} onChange={(event) => setSelectedFolderId(event.target.value)}><option value="">No folder</option>{allFolders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select></label>}
          {selectedFiles.length > 0 ? <div className="grid max-h-56 gap-2 overflow-y-auto rounded-xl bg-slate-50 p-3 text-sm text-slate-600"><div className="flex items-center justify-between gap-3"><span className="font-bold text-slate-950">{selectedFiles.length} selected</span><span className="shrink-0">{formatBytes(selectedFiles.reduce((total, file) => total + file.size, 0))}</span></div>{selectedFiles.map((file, index) => <div key={`${file.name}-${file.size}-${index}`} className="flex min-w-0 items-center justify-between gap-3 rounded-lg bg-white px-3 py-2"><span className="min-w-0 flex-1 truncate" title={file.name}>{file.name}</span><span className="shrink-0 text-xs text-slate-500">{formatBytes(file.size)}</span><button type="button" className="shrink-0 text-slate-500 hover:text-red-600" onClick={() => removeUploadFile(index)} aria-label={`Remove ${file.name}`}><X className="h-4 w-4" /></button></div>)}</div> : null}
          <div className="grid gap-3 sm:flex sm:justify-end"><Button type="button" variant="outline" onClick={() => setUploadOpen(false)}>Cancel</Button><Button disabled={loading || selectedFiles.length === 0}>{loading ? 'Uploading...' : `Upload${selectedFiles.length > 1 ? ` ${selectedFiles.length} files` : ''}`}</Button></div>
        </form>
      </DummyModal>
       <DummyModal open={folderOpen} title="New Folder" description="Create a virtual folder for organizing files." onClose={() => setFolderOpen(false)}>
        <form onSubmit={createFolder} className="grid gap-4">
          <label className="grid gap-2 text-sm font-semibold">Folder Name<Input value={folderName} onChange={(event) => setFolderName(event.target.value)} placeholder="Project Assets" required /></label>
          <FolderAppearanceFields color={folderColor} iconUrl={folderIconUrl} onColorChange={setFolderColor} onIconChange={setFolderIconUrl} />
          <div className="grid gap-3 pt-2 sm:flex sm:justify-end"><Button type="button" variant="outline" onClick={() => setFolderOpen(false)}>Cancel</Button><Button>Create Folder</Button></div>
        </form>
      </DummyModal>
      <DummyModal open={renameOpen} title="Rename File" description={activeFile?.name ?? ''} onClose={() => setRenameOpen(false)}><form onSubmit={renameFile} className="grid gap-4"><Input value={renameValue} onChange={(event) => setRenameValue(event.target.value)} required /><div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => setRenameOpen(false)}>Cancel</Button><Button>Rename</Button></div></form></DummyModal>
      <DummyModal open={moveOpen} title="Move to Folder" description={selectedFileIds.size > 0 ? `Move ${selectedFileIds.size} files` : activeFile?.name ?? ''} onClose={() => setMoveOpen(false)}><form onSubmit={moveFile} className="grid gap-4"><select className="h-11 rounded-xl border border-slate-200 px-3 text-sm" value={selectedFolderId} onChange={(event) => setSelectedFolderId(event.target.value)}><option value="">No folder</option>{allFolders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select><div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => setMoveOpen(false)}>Cancel</Button><Button>Move</Button></div></form></DummyModal>
      <DummyModal open={deleteOpen} title={selectedFileIds.size > 0 ? 'Delete Files' : 'Delete File'} description={selectedFileIds.size > 0 ? `Delete ${selectedFileIds.size} files from Google Drive?` : `Delete ${activeFile?.name ?? 'file'} from Google Drive?`} onClose={() => setDeleteOpen(false)}><div className="flex justify-end gap-3"><Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button><Button variant="danger" onClick={deleteFile}>Delete</Button></div></DummyModal>
      <DummyModal open={shareOpen} title="Share Link" description={activeFile?.name ?? ''} onClose={() => setShareOpen(false)}>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <p className="text-sm font-semibold text-slate-700">9Drive Share Link</p>
            <Input value={shareUrl} readOnly />
          </div>
          {shareDirectUrl ? (
            <div className="grid gap-2">
              <p className="text-sm font-semibold text-slate-700">Direct Google Drive Link</p>
              <Input value={shareDirectUrl} readOnly />
            </div>
          ) : null}
          <div className="flex justify-end gap-3">
            <Button variant="danger" onClick={async () => {
              if (!activeFile?.id) return
              await apiFetch(`/files/${activeFile.id}/share`, { method: 'DELETE' })
              setShareOpen(false)
              setShareUrl('')
              setShareDirectUrl(null)
              setMessage('Share link removed. File is now private.')
            }}>
              <Trash2 className="h-4 w-4" />
              Remove Share
            </Button>
            <Button variant="outline" onClick={() => setShareOpen(false)}>Close</Button>
            <Button onClick={copyShareLink}>
              {copiedShareLink ? <CheckCircle className="h-4 w-4" /> : null}
              {copiedShareLink ? 'Copied!' : 'Copy Link'}
            </Button>
          </div>
          {copiedShareLink ? <p className="rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">Share link copied to clipboard.</p> : null}
        </div>
      </DummyModal>
      <DummyModal open={folderRenameOpen} title="Rename Folder" description={activeFolderForMenu?.name ?? ''} onClose={() => setFolderRenameOpen(false)}><form onSubmit={renameFolder} className="grid gap-4"><Input value={folderRenameValue} onChange={(event) => setFolderRenameValue(event.target.value)} required /><FolderAppearanceFields color={folderRenameColor} iconUrl={folderRenameIconUrl} onColorChange={setFolderRenameColor} onIconChange={setFolderRenameIconUrl} /><div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => setFolderRenameOpen(false)}>Cancel</Button><Button>Rename</Button></div></form></DummyModal>
      <DummyModal open={folderDeleteOpen} title="Delete Folder" description={`Delete virtual folder ${activeFolderForMenu?.name ?? ''}? Files inside will remain uploaded.`} onClose={() => setFolderDeleteOpen(false)}><div className="flex justify-end gap-3"><Button variant="outline" onClick={() => setFolderDeleteOpen(false)}>Cancel</Button><Button variant="danger" onClick={deleteFolder}>Delete</Button></div></DummyModal>
      <DummyModal open={inviteOpen} title="Invite Member" description={`Share ${inviteTargetType === 'file' ? (activeFile?.name ?? 'file') : (activeFolderForMenu?.name ?? 'folder')} with a team member.`} onClose={() => setInviteOpen(false)}>
        <form onSubmit={sendInvite} className="grid gap-4">
          <label className="grid gap-2 text-sm font-semibold">Email Address<Input type="email" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} placeholder="member@example.com" required /></label>
          <label className="grid gap-2 text-sm font-semibold">Role<select className="h-11 rounded-xl border border-slate-200 px-3 text-sm" value={inviteRole} onChange={(event) => setInviteRole(event.target.value)}><option value="viewer">Can view</option><option value="editor">Can edit</option></select></label>
          {inviteMessage ? <p className="rounded-xl bg-blue-50 p-3 text-sm font-semibold text-blue-700">{inviteMessage}</p> : null}
          <div className="flex justify-end gap-3 pt-2"><Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button><Button disabled={inviting}>{inviting ? 'Sending...' : 'Send Invite'}</Button></div>
        </form>
      </DummyModal>
      <DummyModal open={previewOpen} title="File Preview" description={activeFile?.name ?? ''} onClose={closePreview} className="overflow-hidden sm:max-w-[95vw] xl:max-w-[1400px]">
        <div className="flex h-[72dvh] w-full items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 sm:h-[80vh]">
          {previewLoading ? <div className="p-6 text-center text-sm font-semibold text-slate-500">Loading preview...</div> : null}
          {previewError ? <div className="p-6 text-center text-sm text-red-600">{previewError}</div> : null}
          {!previewLoading && !previewError && activePreviewKind === 'image' && previewUrl ? (
            <ZoomablePreview key={activeFile?.id}>
              <img src={previewUrl} alt={activeFile?.name ?? 'File preview'} className="max-h-full max-w-full object-contain" draggable={false} onError={() => setPreviewError('Failed to load preview.')} />
            </ZoomablePreview>
          ) : null}
          {!previewLoading && !previewError && activePreviewKind === 'video' && previewUrl ? <div className="shared-video-shell"><video ref={previewVideoRef} controls playsInline preload="metadata" onError={() => setPreviewError('Failed to load preview.')}><source src={previewUrl} type={activeFile?.mimeType} /></video></div> : null}
          {!previewLoading && !previewError && activePreviewKind === 'document' && previewUrl ? <iframe src={previewUrl} title={activeFile?.name ?? 'File preview'} className="h-full w-full border-0 bg-white" /> : null}
          {!previewLoading && !previewError && activePreviewKind === 'office' && previewUrl ? <iframe src={officeViewerUrl(previewUrl)} title={activeFile?.name ?? 'File preview'} className="h-full w-full border-0 bg-white" /> : null}
          {!previewLoading && !previewError && !activePreviewKind ? <div className="p-6 text-center text-sm text-slate-500">Preview not available for this file type. Use Download instead.</div> : null}
        </div>
      </DummyModal>
       {uploadProgress.open ? (
        <div className="fixed inset-x-3 bottom-3 z-[70] max-h-[70dvh] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/20 sm:inset-x-auto sm:bottom-5 sm:right-5 sm:w-[min(420px,calc(100vw-2.5rem))]">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div className="flex items-center gap-2 font-extrabold">
              {uploadProgress.status === 'done' ? <CheckCircle className="h-5 w-5 text-emerald-500" /> : uploadProgress.status === 'partial' || uploadProgress.status === 'error' ? <X className="h-5 w-5 text-red-500" /> : <Upload className="h-5 w-5 text-blue-600" />}
              {uploadPanelTitle}
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8"><ChevronDown className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setUploadProgress((current) => ({ ...current, open: false }))}><X className="h-4 w-4" /></Button>
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between gap-3 text-sm">
              <p className="truncate font-semibold">{uploadProgress.fileName}</p>
              <span className="text-slate-500">{uploadProgress.percent}%</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-slate-100">
              <div className={uploadProgress.status === 'error' || uploadProgress.status === 'partial' ? 'h-full rounded-full bg-red-500' : uploadProgress.status === 'done' ? 'h-full rounded-full bg-emerald-500' : 'h-full rounded-full bg-blue-600'} style={{ width: `${uploadProgress.percent}%` }} />
            </div>
            {uploadProgress.files.length > 0 ? <div className="mt-4 grid max-h-64 gap-3 overflow-y-auto pr-1">{uploadProgress.files.map((file, index) => <div key={`${file.name}-${file.size}-${index}`} className="grid gap-1 rounded-xl bg-slate-50 p-3"><div className="flex min-w-0 items-center justify-between gap-3 text-sm"><p className="min-w-0 flex-1 truncate font-semibold" title={file.name}>{file.name}</p><span className="shrink-0 text-xs text-slate-500">{file.percent}%</span></div><div className="flex items-center justify-between gap-3 text-xs text-slate-500"><span>{formatBytes(file.size)}</span><span className={file.status === 'error' ? 'font-semibold text-red-600' : file.status === 'done' ? 'font-semibold text-emerald-600' : 'font-semibold text-blue-600'}>{file.status === 'error' ? 'Failed' : file.status === 'done' ? 'Done' : file.percent >= 99 ? 'Processing' : 'Uploading'}</span></div><div className="h-1.5 rounded-full bg-slate-200"><div className={file.status === 'error' ? 'h-full rounded-full bg-red-500' : file.status === 'done' ? 'h-full rounded-full bg-emerald-500' : 'h-full rounded-full bg-blue-600'} style={{ width: `${file.percent}%` }} /></div></div>)}</div> : null}
          </div>
        </div>
      ) : null}
    </>
  )
}
