const DEFAULT_API_BASE_URL = 'https://make-a-wish-server-0e7j.onrender.com'

function getApiBaseUrl() {
  const configuredBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

  if (configuredBaseUrl) return configuredBaseUrl

  if (typeof window === 'undefined') {
    return DEFAULT_API_BASE_URL
  }

  const hostname = window.location.hostname
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1'

  return isLocalhost ? '' : DEFAULT_API_BASE_URL
}

export function toApiUrl(path) {
  const apiBaseUrl = getApiBaseUrl()

  if (!path) return apiBaseUrl
  if (/^https?:\/\//i.test(path)) return path

  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return apiBaseUrl ? `${apiBaseUrl}${normalizedPath}` : normalizedPath
}

export function apiFetch(path, options) {
  return fetch(toApiUrl(path), options)
}
