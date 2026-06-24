import { PrismaClient } from '@prisma/client'

// Membuat tipe untuk global agar TypeScript tidak komplain
const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma || 
  new PrismaClient({
    log: ['error'], // Ubah ke ['query', 'error'] jika ingin melihat SQL di terminal
  })

// Simpan instance prisma ke dalam global hanya saat bukan di produksi
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma