const DEFAULT_API_BASE_URL = 'https://make-a-wish-server-0e7j.onrender.com'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, '')

export function toApiUrl(path) {
  if (!path) return API_BASE_URL
  if (/^https?:\/\//i.test(path)) return path

  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE_URL}${normalizedPath}`
}

export function apiFetch(path, options) {
  return fetch(toApiUrl(path), options)
}
