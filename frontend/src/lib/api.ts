import { clearAuthSession, getAccessToken, getRefreshToken, setAccessToken, setRefreshToken } from '@/lib/auth'

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

type ApiOptions = RequestInit & { skipAuth?: boolean; retry?: boolean }

// LOCK: Menjamin hanya ada SATU proses refresh yang berjalan meski ada 100 request
let refreshPromise: Promise<boolean> | null = null

async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    try {
      const refreshToken = getRefreshToken()
      if (!refreshToken) return false
      
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })

      if (!response.ok) return false
      
      const data = await response.json() as { accessToken: string; refreshToken?: string }
      setAccessToken(data.accessToken)
      if (data.refreshToken) setRefreshToken(data.refreshToken)
      
      return true
    } catch (error) {
      return false
    } finally {
      refreshPromise = null // Buka kunci setelah selesai
    }
  })()

  return refreshPromise
}

export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers = new Headers(options.headers)
  const token = getAccessToken()
  console.log(`📡 Request to ${path} | Retry: ${options.retry} | Token: ${token?.substring(0, 10)}...`);
  
  if (!options.skipAuth && token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${API_URL}${path}`, { ...options, headers })

  // 1. TANGANI 401 (UNAUTHORIZED)
  if (response.status === 401 && options.retry !== false && !options.skipAuth) {
    // Tunggu proses refresh (baik yang baru dimulai atau yang sedang berjalan)
    const success = await refreshAccessToken()
    
    if (success) {
      // Ambil token terbaru yang baru saja disimpan oleh refreshAccessToken
      const newToken = getAccessToken()
      const retryHeaders = new Headers(options.headers)
      if (newToken) retryHeaders.set('Authorization', `Bearer ${newToken}`)
      
      // Jalankan ulang request dengan token baru
      return apiFetch<T>(path, { ...options, headers: retryHeaders, retry: false })
    }
  }

  // 2. TANGANI ERROR LAINNYA
  if (!response.ok) {
    // HANYA LOGOUT jika:
    // - Status 401
    // - SUDAH mencoba retry (retry === false)
    // - Dan bukan request yang skipAuth
    if (response.status === 401 && options.retry === false && !options.skipAuth) {
      console.warn("Sesi benar-benar habis. Logout...");
      clearAuthSession()
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
    
    // Untuk error 500, 502, 504 (TIDB Cloud Cold Start), jangan logout!
    // Cukup lempar error agar UI menampilkan pesan "Gagal memuat data"
    const error = await response.json().catch(() => ({ message: response.statusText }))
    throw new Error(error.message ?? 'Request failed')
  }

  return response.json() as Promise<T>
}

export function formatBytes(input: string | number | bigint | null | undefined) {
  if (input === null || input === undefined) return '--'
  const bytes = Number(input)
  if (!Number.isFinite(bytes)) return '--'
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 2)} ${units[index]}`
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}
