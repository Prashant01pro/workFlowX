import type { ApiErrorPayload } from './types'

export class ApiError extends Error {
  status?: number
  statusCode?: number
  details?: unknown
  isNetworkError: boolean

  constructor(message: string, options?: { status?: number; details?: unknown; isNetworkError?: boolean }) {
    super(message)
    this.name = 'ApiError'
    this.status = options?.status
    this.statusCode = options?.status
    this.details = options?.details
    this.isNetworkError = options?.isNetworkError ?? false
  }
}

// Get the backend base URL from environment or default to local development port 5000
export const getApiBaseUrl = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL
  if (envUrl && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '')
  }
  // Safe default for development
  return 'http://localhost:5000'
}


export function buildApiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path
  }
  const baseUrl = getApiBaseUrl()
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${baseUrl}${cleanPath}`
}

export interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  _retry?: boolean
  skipAuthRefresh?: boolean
}

// --- Token In-Memory & Storage Management ---
let currentAccessToken: string | null = null

export function setAccessToken(token: string | null): void {
  currentAccessToken = token
  if (typeof window !== 'undefined') {
    try {
      if (token) {
        localStorage.setItem('wx_access_token', token)
      } else {
        localStorage.removeItem('wx_access_token')
      }
    } catch {
      // Storage unavailable or blocked by private mode
    }
  }
}

export function getAccessToken(): string | null {
  if (currentAccessToken) return currentAccessToken
  if (typeof window !== 'undefined') {
    try {
      currentAccessToken = localStorage.getItem('wx_access_token')
    } catch {
      return null
    }
  }
  return currentAccessToken
}

// --- Token Refresh Coordination ---
let activeRefreshPromise: Promise<boolean> | null = null

type AuthFailureListener = () => void
const authFailureListeners = new Set<AuthFailureListener>()

export function onAuthFailure(listener: AuthFailureListener): () => void {
  authFailureListeners.add(listener)
  return () => {
    authFailureListeners.delete(listener)
  }
}

function notifyAuthFailure() {
  setAccessToken(null)
  authFailureListeners.forEach((listener) => {
    try {
      listener()
    } catch (e) {
      console.error('Error in auth failure listener:', e)
    }
  })
}

function isExcludedFromRefresh(path: string): boolean {
  const clean = path.startsWith('/') ? path : `/${path}`
  return (
    clean.includes('/api/v1/auth/login') ||
    clean.includes('/api/v1/auth/register') ||
    clean.includes('/api/v1/auth/refresh') ||
    clean.includes('/api/v1/auth/forgot-password') ||
    clean.includes('/api/v1/auth/reset-password')
  )
}

export async function refreshAuthToken(): Promise<boolean> {
  if (activeRefreshPromise) {
    return activeRefreshPromise
  }

  activeRefreshPromise = (async () => {
    try {
      const url = buildApiUrl('/api/v1/auth/refresh')
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
      })

      if (!response.ok) {
        setAccessToken(null)
        notifyAuthFailure()
        return false
      }
      const data = (await response.json().catch(() => null)) as { newAccessToken?: string } | null
      if (data?.newAccessToken) {
        setAccessToken(data.newAccessToken)
      }
      return true
    } catch {
      setAccessToken(null)
      notifyAuthFailure()
      return false
    } finally {
      activeRefreshPromise = null
    }
  })()

  return activeRefreshPromise
}

/**
 * Executes a network request to the backend with credentialed cookies,
 * automatic token refresh on 401, and safe error parsing.
 */
export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const url = buildApiUrl(path)
  const headers = new Headers(options.headers || {})

  const token = getAccessToken()
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  let bodyPayload: BodyInit | null | undefined = null

  if (options.body !== undefined && options.body !== null) {
    if (
      typeof options.body === 'string' ||
      options.body instanceof Blob ||
      options.body instanceof ArrayBuffer ||
      options.body instanceof FormData ||
      options.body instanceof URLSearchParams
    ) {
      bodyPayload = options.body as BodyInit
    } else {
      // Auto-serialize plain JavaScript objects to JSON
      bodyPayload = JSON.stringify(options.body)
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json')
      }
    }
  }

  // Ensure JSON Content-Type is set if body is string and header wasn't set, unless body is FormData
  if (typeof bodyPayload === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  let response: Response
  try {
    response = await fetch(url, {
      ...options,
      body: bodyPayload,
      headers,
      credentials: options.credentials || 'include',
    })
  } catch (networkError) {
    // Network failures (e.g. backend down, DNS failure, connection refused)
    const message = networkError instanceof Error ? networkError.message : 'Network error'
    throw new ApiError(
      `Unable to reach server at ${getApiBaseUrl()}. Please verify the backend is running. (${message})`,
      {
        isNetworkError: true,
        details: networkError,
      }
    )
  }

  // Safe 401 refresh handling:
  // If unauthorized, not previously retried, not disabled by options, and not an excluded endpoint:
  if (
    response.status === 401 &&
    !options._retry &&
    !options.skipAuthRefresh &&
    !isExcludedFromRefresh(path)
  ) {
    const refreshed = await refreshAuthToken()
    if (refreshed) {
      return apiRequest<T>(path, { ...options, _retry: true })
    }
  }

  // Handle 204 No Content or empty responses safely
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return null as T
  }

  const contentType = response.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')

  let payload: unknown = null
  if (isJson) {
    payload = await response.json().catch(() => null)
  } else {
    payload = await response.text().catch(() => null)
  }

  if (!response.ok) {
    const errorPayload = payload as ApiErrorPayload | null
    // Extract user-friendly error message from Express AppError or Zod validation errors
    const errorMessage =
      errorPayload?.message ||
      errorPayload?.error ||
      (typeof payload === 'string' && payload ? payload : `Request failed with status ${response.status}`)

    throw new ApiError(errorMessage, {
      status: response.status,
      details: payload,
      isNetworkError: false,
    })
  }

  return payload as T
}

// Convenience helper methods
export const api = {
  get: <T>(path: string, options?: ApiRequestOptions) => apiRequest<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: ApiRequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, options?: ApiRequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'PATCH', body }),
  put: <T>(path: string, body?: unknown, options?: ApiRequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'PUT', body }),
  delete: <T>(path: string, options?: ApiRequestOptions) => apiRequest<T>(path, { ...options, method: 'DELETE' }),
}
