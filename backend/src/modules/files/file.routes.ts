import { Router } from 'express'
import { google } from 'googleapis'
import { z } from 'zod'
import { prisma } from '../../config/prisma.js'
import { env } from '../../config/env.js'
import { requireAuth, type AuthRequest } from '../../middleware/auth.middleware.js'
import { hashToken, randomToken } from '../../utils/crypto.js'
import { deleteS3Object, syncS3Quota } from '../s3/s3.service.js'
import { streamProviderFile } from './stream-file.js'
import { getAuthedGoogleClient, syncGoogleAppFolderFiles, applyQuotaDelta } from '../google/google.service.js'

export const fileRouter = Router()

// ============================================================
// 1. PUBLIC ROUTES (Sangat Penting: Di atas requireAuth)
// ============================================================

// Preview file via token
fileRouter.get('/preview/:token', async (req, res, next) => {
  try {
    const token = String(req.params.token)
    const preview = await prisma.filePreviewToken.findFirst({
      where: { tokenHash: hashToken(token), expiresAt: { gt: new Date() } },
      include: { file: { include: { connectedAccount: true } } },
    })
    if (!preview || preview.file.status !== 'active') {
      return res.status(404).json({ code: 'PREVIEW_NOT_FOUND', message: 'Preview token not found.' })
    }
    return streamProviderFile(preview.file, req.headers.range, res, { disposition: 'inline' })
  } catch (error) {
    return next(error)
  }
})

// Download file via token (Untuk XDM / Download Manager)
fileRouter.get('/download-by-token', async (req, res, next) => {
  try {
    const token = String(req.query.token)
    const preview = await prisma.filePreviewToken.findFirst({
      where: { tokenHash: hashToken(token), expiresAt: { gt: new Date() } },
      include: { file: { include: { connectedAccount: true } } },
    })
    if (!preview) {
      return res.status(403).json({ message: 'Link expired or invalid.' })
    }
    return streamProviderFile(preview.file, req.headers.range, res, { disposition: 'attachment' })
  } catch (error) {
    return next(error)
  }
})

// ============================================================
// MIDDLEWARE AUTHENTICATION
// Semua route di bawah ini memerlukan Bearer Token
// ============================================================
fileRouter.use(requireAuth)

// --- General Files Routes ---

fileRouter.get('/', async (req: AuthRequest, res, next) => {
  try {
    const query = z.object({
      folderId: z.string().optional(),
      q: z.string().trim().max(255).optional(),
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(200).default(100),
    }).parse(req.query)

    const skip = (query.page - 1) * query.limit

    const [files, total] = await Promise.all([
      prisma.file.findMany({
        where: {
          userId: req.user!.id,
          status: 'active',
          ...(query.folderId ? { folderId: query.folderId } : {}),
          ...(query.q ? { name: { contains: query.q } } : {}),
        },
        include: {
          connectedAccount: { select: { id: true, email: true, provider: true } },
          folder: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: query.limit,
      }),
      prisma.file.count({
        where: {
          userId: req.user!.id,
          status: 'active',
          ...(query.folderId ? { folderId: query.folderId } : {}),
          ...(query.q ? { name: { contains: query.q } } : {}),
        },
      }),
    ])

    return res.json({
      files: files.map((file) => ({ ...file, sizeBytes: file.sizeBytes.toString() })),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
        hasNext: query.page * query.limit < total,
        hasPrev: query.page > 1,
      },
    })
  } catch (error) {
    return next(error)
  }
})

// --- Batch Operations ---

const batchFileSchema = z.object({ fileIds: z.array(z.string().min(1)).min(1).max(100) })

fileRouter.patch('/batch', async (req: AuthRequest, res, next) => {
  try {
    const body = batchFileSchema.extend({ folderId: z.string().nullable().optional() }).parse(req.body)
    if (body.folderId) await prisma.folder.findFirstOrThrow({ where: { id: body.folderId, userId: req.user!.id, deletedAt: null } })
    const result = await prisma.file.updateMany({ 
      where: { id: { in: body.fileIds }, userId: req.user!.id, status: 'active' }, 
      data: { folderId: body.folderId ?? null } 
    })
    return res.json({ status: 'ok', moved: result.count })
  } catch (error) {
    return next(error)
  }
})

fileRouter.delete('/batch', async (req: AuthRequest, res, next) => {
  try {
    const body = batchFileSchema.parse(req.body)
    const files = await prisma.file.findMany({ 
      where: { id: { in: body.fileIds }, userId: req.user!.id, status: 'active' }, 
      include: { connectedAccount: true } 
    })
    const deletedIds: string[] = []
    const failed: Array<{ fileId: string; message: string }> = []

    for (const file of files) {
      try {
        if (file.provider === 's3') await deleteS3Object(file)
        else {
          const auth = await getAuthedGoogleClient(file.connectedAccount)
          const drive = google.drive({ version: 'v3', auth })
          await drive.files.delete({ fileId: file.providerFileId })
        }
        deletedIds.push(file.id)
      } catch (error) {
        failed.push({ fileId: file.id, message: error instanceof Error ? error.message : 'Delete failed' })
      }
    }

    if (deletedIds.length > 0) {
      await prisma.file.updateMany({ 
        where: { id: { in: deletedIds }, userId: req.user!.id }, 
        data: { status: 'deleted', deletedAt: new Date() } 
      })
    }

    // Update Delta Lokal agar angka kuota berubah instan & konsisten
    const sizeByAccount = new Map<string, bigint>()
    for (const file of files.filter((f) => deletedIds.includes(f.id))) {
      sizeByAccount.set(file.connectedAccountId, (sizeByAccount.get(file.connectedAccountId) ?? 0n) + file.sizeBytes)
    }
    for (const [accountId, totalBytes] of sizeByAccount) {
      await applyQuotaDelta(accountId, -totalBytes).catch(() => undefined)
    }

    if (deletedIds.length === 0 && failed.length > 0) {
      return res.status(400).json({ code: 'FILES_DELETE_FAILED', message: 'No files were deleted.', deleted: 0, failed })
    }
    return res.json({ status: 'ok', deleted: deletedIds.length, failed })
  } catch (error) {
    return next(error)
  }
})

// --- Shared & Sync ---

fileRouter.get('/shared-links', async (req: AuthRequest, res, next) => {
  try {
    const shares = await prisma.fileShare.findMany({
      where: { userId: req.user!.id, enabled: true, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
      include: { file: { include: { connectedAccount: { select: { email: true, provider: true } }, folder: { select: { id: true, name: true } } } } },
      orderBy: { createdAt: 'desc' },
    })
    return res.json({
      shares: shares.filter((share) => share.file.status === 'active').map((share) => ({
        id: share.id,
        url: share.token ? `${env.FRONTEND_URL}/public/files/${share.token}` : null,
        createdAt: share.createdAt.toISOString(),
        expiresAt: share.expiresAt?.toISOString() ?? null,
        file: { ...share.file, sizeBytes: share.file.sizeBytes.toString() },
      })),
    })
  } catch (error) {
    return next(error)
  }
})

fileRouter.post('/sync-google', async (req: AuthRequest, res, next) => {
  try {
    const body = z.object({ connectedAccountId: z.string().min(1).optional() }).parse(req.body ?? {})
    const accounts = await prisma.connectedAccount.findMany({
      where: { userId: req.user!.id, provider: 'google_drive', status: 'connected', ...(body.connectedAccountId ? { id: body.connectedAccountId } : {}) },
      select: { id: true },
    })

    const results = []
    for (const account of accounts) {
      results.push(await syncGoogleAppFolderFiles(account.id, req.user!.id))
    }

    return res.json({
      status: 'ok',
      accounts: results.length,
      created: results.reduce((total, result) => total + result.created, 0),
      updated: results.reduce((total, result) => total + result.updated, 0),
      deleted: results.reduce((total, result) => total + result.deleted, 0),
      results,
    })
  } catch (error) {
    return next(error)
  }
})

// ============================================================
// SPECIFIC FILE ROUTES (WAJIB DI ATAS /:id)
// ============================================================

// Generate link download sementara (Aman dari 500/undefined)
fileRouter.get('/:id/download-url', async (req: AuthRequest, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ code: 'AUTH_REQUIRED', message: 'Bearer token required.' });
    }

    const userId = req.user.id;
    const fileId = String(req.params.id);

    const file = await prisma.file.findFirst({ 
      where: { id: fileId, userId: userId } 
    })

    if (!file) {
      return res.status(404).json({ code: 'FILE_NOT_FOUND', message: 'File not found.' });
    }

    const token = randomToken(32)
    await prisma.filePreviewToken.create({ 
      data: { 
        fileId: file.id, 
        userId: userId, 
        tokenHash: hashToken(token), 
        expiresAt: new Date(Date.now() + 5 * 60_000) 
      } 
    })

    const downloadUrl = `${req.protocol}://${req.get('host')}/files/download-by-token?token=${token}`
    return res.json({ url: downloadUrl })
  } catch (error: any) {
    return next(error)
  }
})

fileRouter.post('/:id/preview-token', async (req: AuthRequest, res, next) => {
  try {
    const fileId = String(req.params.id)
    const file = await prisma.file.findFirstOrThrow({ where: { id: fileId, userId: req.user!.id, status: 'active' } })
    const token = randomToken(32)
    await prisma.filePreviewToken.create({ data: { fileId: file.id, userId: req.user!.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 10 * 60_000) } })
    const path = `/files/preview/${token}`
    return res.status(201).json({ path, url: `${req.protocol}://${req.get('host')}${path}` })
  } catch (error) {
    return next(error)
  }
})

fileRouter.get('/:id/thumbnail-url', async (req: AuthRequest, res, next) => {
  try {
    const file = await prisma.file.findFirstOrThrow({
      where: { id: String(req.params.id), userId: req.user!.id, status: 'active' },
      include: { connectedAccount: true },
    })
    if (file.provider !== 'google_drive') {
      return res.status(404).json({ code: 'NO_THUMBNAIL', message: 'Thumbnails only available for Google Drive files.' })
    }
    const auth = await getAuthedGoogleClient(file.connectedAccount)
    const drive = google.drive({ version: 'v3', auth })
    const metadata = await drive.files.get({ fileId: file.providerFileId, fields: 'thumbnailLink' })
    const thumbnailLink = metadata.data.thumbnailLink
    if (!thumbnailLink) return res.status(404).json({ code: 'NO_THUMBNAIL', message: 'Thumbnail not yet available.' })
    return res.status(200).json({ url: thumbnailLink.replace(/=s\d+$/, '=s400') })
  } catch (error) {
    return next(error)
  }
})

fileRouter.get('/:id/view-url', async (req: AuthRequest, res, next) => {
  try {
    const fileId = String(req.params.id)
    const file = await prisma.file.findFirstOrThrow({ where: { id: fileId, userId: req.user!.id }, include: { connectedAccount: true } })
    if (file.provider === 's3') return res.json({ url: null })
    const auth = await getAuthedGoogleClient(file.connectedAccount)
    const drive = google.drive({ version: 'v3', auth })
    const metadata = await drive.files.get({ fileId: file.providerFileId, fields: 'webViewLink,webContentLink' })
    return res.json({ url: metadata.data.webViewLink ?? metadata.data.webContentLink })
  } catch (error) {
    return next(error)
  }
})

// --- Share Routes ---

fileRouter.post('/:id/share', async (req: AuthRequest, res, next) => {
  try {
    const fileId = String(req.params.id)
    const file = await prisma.file.findFirstOrThrow({ where: { id: fileId, userId: req.user!.id, status: 'active' } })
    const existingShare_found = await prisma.fileShare.findFirst({ where: { fileId: file.id, userId: req.user!.id, enabled: true, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] }, orderBy: { createdAt: 'desc' } })
    if (existingShare_found?.token) return res.json({ url: `${env.FRONTEND_URL}/public/files/${existingShare_found.token}`, shareId: existingShare_found.id })
    if (existingShare_found) await prisma.fileShare.update({ where: { id: existingShare_found.id }, data: { enabled: false } })
    const token = randomToken(32)
    const share = await prisma.fileShare.create({ data: { fileId: file.id, userId: req.user!.id, token, tokenHash: hashToken(token) } })
    return res.status(201).json({ url: `${env.FRONTEND_URL}/public/files/${token}`, shareId: share.id })
  } catch (error) {
    return next(error)
  }
})

fileRouter.delete('/:id/share', async (req: AuthRequest, res, next) => {
  try {
    const fileId = String(req.params.id)
    await prisma.fileShare.updateMany({ where: { fileId, userId: req.user!.id, enabled: true }, data: { enabled: false } })
    return res.json({ status: 'ok' })
  } catch (error) {
    return next(error)
  }
})

// ============================================================
// GENERAL FILE ROUTES (Paling Bawah agar tidak tabrakan)
// ============================================================

fileRouter.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const fileId = String(req.params.id)
    const file = await prisma.file.findFirstOrThrow({ where: { id: fileId, userId: req.user!.id }, include: { connectedAccount: { select: { id: true, email: true, provider: true } }, folder: { select: { id: true, name: true } } } })
    return res.json({ file: { ...file, sizeBytes: file.sizeBytes.toString() } })
  } catch (error) {
    return next(error)
  }
})

fileRouter.patch('/:id', async (req: AuthRequest, res, next) => {
  try {
    const body = z.object({ name: z.string().min(1).max(255).optional(), folderId: z.string().nullable().optional() }).parse(req.body)
    const fileId = String(req.params.id)
    const file = await prisma.file.findFirstOrThrow({ where: { id: fileId, userId: req.user!.id }, include: { connectedAccount: true } })
    const drive = file.provider === 's3' ? null : google.drive({ version: 'v3', auth: await getAuthedGoogleClient(file.connectedAccount) })
    if (body.folderId) await prisma.folder.findFirstOrThrow({ where: { id: body.folderId, userId: req.user!.id, deletedAt: null } })
    if (body.name && drive) await drive.files.update({ fileId: file.providerFileId, requestBody: { name: body.name } })
    const updated = await prisma.file.update({ where: { id: file.id }, data: { ...(body.name ? { name: body.name } : {}), ...(body.folderId !== undefined ? { folderId: body.folderId } : {}) }, include: { connectedAccount: { select: { id: true, email: true, provider: true } }, folder: { select: { id: true, name: true } } } })
    return res.json({ file: { ...updated, sizeBytes: updated.sizeBytes.toString() } })
  } catch (error) {
    return next(error)
  }
})

fileRouter.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const fileId = String(req.params.id)
    const file_info = await prisma.file.findFirstOrThrow({ where: { id: fileId, userId: req.user!.id }, include: { connectedAccount: true } })
    if (file_info.provider === 's3') await deleteS3Object(file_info)
    else {
      const auth = await getAuthedGoogleClient(file_info.connectedAccount)
      const drive = google.drive({ version: 'v3', auth })
      await drive.files.delete({ fileId: file_info.providerFileId })
    }
    await prisma.file.update({ where: { id: file_info.id }, data: { status: 'deleted', deletedAt: new Date() } })
    await applyQuotaDelta(file_info.connectedAccountId, -file_info.sizeBytes).catch(() => undefined)
    return res.json({ status: 'ok' })
  } catch (error) {
    return next(error)
  }
})