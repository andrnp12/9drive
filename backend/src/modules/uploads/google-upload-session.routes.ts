import type { Response } from 'express'
import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../../config/prisma.js'
import { requireAuth, type AuthRequest } from '../../middleware/auth.middleware.js'
import { createGoogleResumableSession } from '../google/google.service.js'

export const googleUploadSessionRouter = Router()

// ---------------------------------------------------------------------------
// STEP 1: Frontend asks the backend to open a resumable upload session with
// Google Drive. The backend never sees the file bytes here — it only talks
// to Google to get back a short-lived upload URL, then hands that URL to the
// browser. The browser will PUT the file bytes directly to Google from here
// on, completely bypassing the Railway backend (and therefore its request
// timeout) for the actual file transfer.
// ---------------------------------------------------------------------------

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
    await prisma.folder.findFirstOrThrow({ where: { id: folderId, userId: req.user!.id, deletedAt: null } }).catch(() => {
      throw Object.assign(new Error('Folder not found.'), { statusCode: 404, code: 'FOLDER_NOT_FOUND' })
    })
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

  return res.status(201).json({
    sessionId: session.id,
    uploadUrl,
    // The browser PUTs the raw file bytes to this URL directly.
    // No Authorization header to our API is needed for the PUT itself —
    // Google's resumable session URL is already scoped and short-lived.
  })
}

// ---------------------------------------------------------------------------
// STEP 2: After the browser finishes PUTting the file bytes directly to the
// uploadUrl from step 1, it calls this endpoint so we can record the file in
// our own database (mirrors what uploadOne() does for the proxied path).
// ---------------------------------------------------------------------------

const completeSessionSchema = z.object({
  sessionId: z.string().min(1),
  providerFileId: z.string().min(1),
  folderId: z.string().optional(),
})

async function handleCompleteSession(req: AuthRequest, res: Response) {
  const parsed = completeSessionSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ code: 'UPLOAD_SESSION_INVALID_BODY', message: parsed.error.issues[0]?.message ?? 'Invalid request body.' })
  }
  const { sessionId, providerFileId, folderId } = parsed.data

  const session = await prisma.uploadSession.findFirst({
    where: { id: sessionId, userId: req.user!.id, status: 'uploading' },
  })
  if (!session) {
    return res.status(404).json({ code: 'UPLOAD_SESSION_NOT_FOUND', message: 'Upload session not found or already completed.' })
  }
  if (!session.targetConnectedAccountId) {
    return res.status(400).json({ code: 'UPLOAD_SESSION_INVALID', message: 'Upload session is missing a target account.' })
  }

  const file = await prisma.file.create({
    data: {
      userId: req.user!.id,
      connectedAccountId: session.targetConnectedAccountId,
      folderId: folderId ?? undefined,
      provider: 'google_drive',
      providerFileId,
      name: session.fileName,
      mimeType: session.mimeType,
      sizeBytes: session.sizeBytes,
    },
  })

  await prisma.uploadSession.update({ where: { id: session.id }, data: { status: 'completed', completedAt: new Date() } })

  return res.status(201).json({ file: { ...file, sizeBytes: file.sizeBytes.toString() } })
}

// ---------------------------------------------------------------------------
// STEP 2b (optional but recommended): if the browser-side upload fails or is
// abandoned, let the frontend mark the session as failed so it doesn't sit
// as "uploading" forever.
// ---------------------------------------------------------------------------

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

googleUploadSessionRouter.post('/google/session', requireAuth, (req, res, next) => {
  handleCreateSession(req as AuthRequest, res).catch(next)
})
googleUploadSessionRouter.post('/google/complete', requireAuth, (req, res, next) => {
  handleCompleteSession(req as AuthRequest, res).catch(next)
})
googleUploadSessionRouter.post('/google/fail', requireAuth, (req, res, next) => {
  handleFailSession(req as AuthRequest, res).catch(next)
})
