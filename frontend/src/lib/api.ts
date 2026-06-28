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
  const { skipAuth, retry, ...fetchOptions } = options
  const headers = new Headers(fetchOptions.headers)
  const token = getAccessToken()

  if (!skipAuth && token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  if (fetchOptions.body && !(fetchOptions.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${API_URL}${path}`, { ...fetchOptions, headers })

  if (response.status === 401 && retry !== false && !skipAuth) {
    const success = await refreshAccessToken()

    if (success) {
      // Langsung rekursi tanpa pass headers lama — biarkan apiFetch ambil token terbaru
      return apiFetch<T>(path, { ...options, retry: false })
    }
  }

  if (!response.ok) {
    if (response.status === 401 && retry === false && !skipAuth) {
      console.warn('Sesi benar-benar habis. Logout...')
      clearAuthSession()
      if (typeof window !== 'undefined') window.location.href = '/login'
    }
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
