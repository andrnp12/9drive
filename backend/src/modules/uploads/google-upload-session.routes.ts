import type { Response } from 'express'
import { Router } from 'express'
import { google } from 'googleapis'
import { z } from 'zod'
import { prisma } from '../../config/prisma.js'
import { requireAuth, type AuthRequest } from '../../middleware/auth.middleware.js'
import { createGoogleResumableSession, ensureGoogleAppFolder, getAuthedGoogleClient, syncGoogleQuota } from '../google/google.service.js'
import { selectAccount } from './upload-routing.service.js'

export const googleUploadSessionRouter = Router()

async function handleBestAccount(req: AuthRequest, res: Response) {
  const sizeBytesRaw = req.query.sizeBytes
  if (typeof sizeBytesRaw !== 'string' || !sizeBytesRaw) {
    return res.status(400).json({ code: 'SIZE_BYTES_REQUIRED', message: 'sizeBytes query parameter is required.' })
  }
  let sizeBytes: bigint
  try {
    sizeBytes = BigInt(sizeBytesRaw)
  } catch {
    return res.status(400).json({ code: 'SIZE_BYTES_INVALID', message: 'sizeBytes must be a valid integer.' })
  }

  const account = await selectAccount(req.user!.id, sizeBytes, new Map(), ['google_drive'])
  if (!account) {
    return res.status(404).json({ code: 'NO_ACCOUNT_WITH_ENOUGH_SPACE', message: 'No connected Google Drive account has enough space for this upload.' })
  }

  return res.status(200).json({ accountId: account.id })
}

const createSessionSchema = z.object({
  accountId: z.string().min(1),
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.union([z.string(), z.number()]),
  folderId: z.string().optional(),
})

async function handleCreateSession(req: AuthRequest, res: Response) {
  const parsed = createSessionSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ code: 'UPLOAD_SESSION_INVALID_BODY', message: parsed.error.issues[0]?.message ?? 'Invalid request body.' })
  }
  const { accountId, fileName, mimeType, folderId } = parsed.data
  const sizeBytes = BigInt(parsed.data.sizeBytes)

  const account = await prisma.connectedAccount.findFirst({
    where: { id: accountId, userId: req.user!.id, provider: 'google_drive', status: 'connected' },
  })
  if (!account) {
    return res.status(404).json({ code: 'ACCOUNT_NOT_FOUND', message: 'Connected Google Drive account not found.' })
  }

  if (folderId) {
    const folder = await prisma.folder.findFirst({ where: { id: folderId, userId: req.user!.id, deletedAt: null } })
    if (!folder) return res.status(404).json({ code: 'FOLDER_NOT_FOUND', message: 'Folder not found.' })
  }

  const { uploadUrl } = await createGoogleResumableSession(account, fileName, mimeType)

  const session = await prisma.uploadSession.create({
    data: {
      userId: req.user!.id,
      targetConnectedAccountId: account.id,
      fileName,
      mimeType,
      sizeBytes,
      status: 'uploading',
    },
  })

  return res.status(201).json({ sessionId: session.id, uploadUrl })
}

// ---------------------------------------------------------------------------
// STEP 2: After the browser finishes PUTting the file bytes directly to
// Google Drive, it calls this endpoint. The backend looks up the newly
// uploaded file in Google Drive by name (within the 9drive app folder) so
// the frontend never needs to parse the cross-origin PUT response body
// (which would be blocked by CORS anyway).
// ---------------------------------------------------------------------------

const completeSessionSchema = z.object({
  sessionId: z.string().min(1),
  folderId: z.string().optional(),
})

async function handleCompleteSession(req: AuthRequest, res: Response) {
  const parsed = completeSessionSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ code: 'UPLOAD_SESSION_INVALID_BODY', message: parsed.error.issues[0]?.message ?? 'Invalid request body.' })
  }
  const { sessionId, folderId } = parsed.data

  const session = await prisma.uploadSession.findFirst({
    where: { id: sessionId, userId: req.user!.id, status: 'uploading' },
    include: { targetConnectedAccount: true },
  })
  if (!session || !session.targetConnectedAccount) {
    return res.status(404).json({ code: 'UPLOAD_SESSION_NOT_FOUND', message: 'Upload session not found or already completed.' })
  }

  const account = session.targetConnectedAccount

  // Look up the file in Google Drive by name within the 9drive app folder.
  // The browser cannot read the PUT response body due to CORS, so we query
  // Google Drive directly here to get the providerFileId.
  const auth = await getAuthedGoogleClient(account)
  const drive = google.drive({ version: 'v3', auth })
  const appFolderId = await ensureGoogleAppFolder(account)

  const escapedName = session.fileName.replace(/\\/g, '\\\\').replace(/'/g, "\\'")

  // Google Drive may take a few seconds to index a large file after the PUT
  // completes. Retry up to 5 times with increasing delays before giving up.
  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
  const retryDelaysMs = [2000, 4000, 6000, 8000, 10000]
  let driveFile: { id?: string | null; name?: string | null; mimeType?: string | null } | undefined

  for (let attempt = 0; attempt <= retryDelaysMs.length; attempt++) {
    if (attempt > 0) await sleep(retryDelaysMs[attempt - 1]!)
    const listRes = await drive.files.list({
      q: `name = '${escapedName}' and '${appFolderId}' in parents and trashed = false`,
      fields: 'files(id,name,mimeType,size)',
      orderBy: 'createdTime desc',
      pageSize: 1,
      spaces: 'drive',
    })
    driveFile = listRes.data.files?.[0]
    if (driveFile?.id) break
  }

  if (!driveFile?.id) {
    return res.status(404).json({ code: 'DRIVE_FILE_NOT_FOUND', message: 'File not found in Google Drive after upload. It may still be processing — try syncing in a moment.' })
  }

  const file = await prisma.file.create({
    data: {
      userId: req.user!.id,
      connectedAccountId: account.id,
      folderId: folderId ?? null,
      provider: 'google_drive',
      providerFileId: driveFile.id,
      name: session.fileName,
      mimeType: driveFile.mimeType ?? session.mimeType,
      sizeBytes: session.sizeBytes,
    },
  })

  await prisma.uploadSession.update({ where: { id: session.id }, data: { status: 'completed', completedAt: new Date() } })

  // Await quota sync before responding so the sidebar storage stats are
  // already accurate when the frontend fetches /storage/summary immediately
  // after this response. The ~1-2s extra wait is worth the accuracy.
  await syncGoogleQuota(account.id).catch(() => undefined)

  return res.status(201).json({ file: { ...file, sizeBytes: file.sizeBytes.toString() } })
}

const failSessionSchema = z.object({
  sessionId: z.string().min(1),
  errorMessage: z.string().optional(),
})

async function handleFailSession(req: AuthRequest, res: Response) {
  const parsed = failSessionSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ code: 'UPLOAD_SESSION_INVALID_BODY', message: parsed.error.issues[0]?.message ?? 'Invalid request body.' })
  }
  const { sessionId, errorMessage } = parsed.data

  const session = await prisma.uploadSession.findFirst({ where: { id: sessionId, userId: req.user!.id } })
  if (!session) {
    return res.status(404).json({ code: 'UPLOAD_SESSION_NOT_FOUND', message: 'Upload session not found.' })
  }

  await prisma.uploadSession.update({
    where: { id: session.id },
    data: { status: 'failed', errorMessage: errorMessage ?? 'Upload failed on client.' },
  })

  return res.status(200).json({ ok: true })
}

googleUploadSessionRouter.get('/google/best-account', requireAuth, (req, res, next) => {
  handleBestAccount(req as AuthRequest, res).catch(next)
})
googleUploadSessionRouter.post('/google/session', requireAuth, (req, res, next) => {
  handleCreateSession(req as AuthRequest, res).catch(next)
})
googleUploadSessionRouter.post('/google/complete', requireAuth, (req, res, next) => {
  handleCompleteSession(req as AuthRequest, res).catch(next)
})
googleUploadSessionRouter.post('/google/fail', requireAuth, (req, res, next) => {
  handleFailSession(req as AuthRequest, res).catch(next)
})
