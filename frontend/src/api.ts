import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export default api

export const resolveAssetUrl = (path: string | undefined | null) => {
  if (!path) {
    return ''
  }
  if (/^https?:\/\//i.test(path)) {
    return path
  }
  if (API_BASE_URL.startsWith('http')) {
    try {
      const base = new URL(API_BASE_URL)
      return `${base.origin}${path}`
    } catch {
      return path
    }
  }
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${path}`
  }
  return path
}
