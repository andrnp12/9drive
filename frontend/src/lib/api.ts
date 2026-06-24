import { clearAuthSession, getAccessToken, getRefreshToken, setAccessToken, setRefreshToken } from '@/lib/auth'

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

type ApiOptions = RequestInit & { skipAuth?: boolean; retry?: boolean }

// Variable untuk mengunci proses refresh agar tidak terjadi double request
let refreshPromise: Promise<boolean> | null = null

async function refreshAccessToken() {
  // Jika sedang ada proses refresh yang berjalan, gunakan promise yang sama
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
      
      // Tangkap accessToken DAN refreshToken jika disediakan oleh backend
      const data = await response.json() as { accessToken: string; refreshToken?: string }
      
      setAccessToken(data.accessToken)
      if (data.refreshToken) {
        setRefreshToken(data.refreshToken) // Simpan refresh token baru!
      }
      
      return true
    } catch (error) {
      console.error("Refresh Token Error:", error)
      return false
    } finally {
      refreshPromise = null // Reset lock setelah selesai
    }
  })()

  return refreshPromise
}

export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers = new Headers(options.headers)
  const token = getAccessToken()
  
  if (!options.skipAuth && token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${API_URL}${path}`, { ...options, headers })

  // JIKA 401: Coba refresh token
  if (response.status === 401 && options.retry !== false && !options.skipAuth) {
    const success = await refreshAccessToken()
    if (success) {
      // Ulangi request awal dengan token baru
      return apiFetch<T>(path, { ...options, retry: false })
    }
  }

  if (!response.ok) {
    // Jika tetap 401 setelah refresh atau refresh gagal, hapus session
    if (response.status === 401) {
      clearAuthSession()
      // Opsional: Redirect ke login jika di browser
      if (typeof window !== 'undefined') window.location.href = '/login'
    }
    
    const error = await response.json().catch(() => ({ message: response.statusText }))
    throw new Error(error.message ?? 'Request failed')
  }

  return response.json() as Promise<T>
}

// ... (fungsi formatBytes dan formatDate tetap sama)

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
