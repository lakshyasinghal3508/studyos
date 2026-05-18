/// <reference types="vite/client" />
// src/services/api.ts — typed HTTP client
const BASE = import.meta.env.VITE_API_URL ?? '/api'

export class APIError extends Error {
  constructor(public message: string, public status: number, public details?: unknown) {
    super(message)
  }
}

let _token: string | null = null
export const setToken = (t: string | null) => { _token = t; t ? sessionStorage.setItem('sos_token', t) : sessionStorage.removeItem('sos_token') }
export const getToken = (): string | null => _token ?? sessionStorage.getItem('sos_token')
export const setRefresh = (t: string | null) => t ? localStorage.setItem('sos_refresh', t) : localStorage.removeItem('sos_refresh')
export const getRefresh = (): string | null => localStorage.getItem('sos_refresh')

async function request<T>(path: string, init: RequestInit & { json?: unknown } = {}, _retry = false): Promise<T> {
  const { json, ...rest } = init
  const token = getToken()
  const res = await fetch(`${BASE}${path}`, {
    ...rest,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(rest.headers ?? {}) },
    ...(json !== undefined ? { body: JSON.stringify(json) } : {}),
  })
  if (res.status === 401 && !_retry) {
    const refresh = getRefresh()
    if (refresh) {
      const r = await fetch(`${BASE}/auth/refresh`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: refresh }) })
      if (r.ok) { const d = await r.json(); setToken(d.data.accessToken); return request(path, init, true) }
    }
    setToken(null); setRefresh(null)
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new APIError(data?.error ?? `Error ${res.status}`, res.status, data?.details)
  return (data?.data ?? data) as T
}

export const api = {
  auth: {
    register: (b: { name: string; email: string; password: string }) => request('/auth/register', { method: 'POST', json: b }),
    login:    (b: { email: string; password: string }) => request('/auth/login', { method: 'POST', json: b }),
    logout:   (refreshToken: string) => request('/auth/logout', { method: 'POST', json: { refreshToken } }),
    profile:  () => request('/auth/profile'),
  },
  tasks: {
    list:   () => request('/tasks'),
    create: (b: unknown) => request('/tasks', { method: 'POST', json: b }),
    update: (id: string, b: unknown) => request(`/tasks/${id}`, { method: 'PATCH', json: b }),
    delete: (id: string) => request(`/tasks/${id}`, { method: 'DELETE' }),
    move:   (id: string, col: string) => request(`/tasks/${id}/move`, { method: 'PATCH', json: { col } }),
  },
  notes: {
    list:   () => request('/notes'),
    create: (b: unknown) => request('/notes', { method: 'POST', json: b }),
    update: (id: string, b: unknown) => request(`/notes/${id}`, { method: 'PATCH', json: b }),
    delete: (id: string) => request(`/notes/${id}`, { method: 'DELETE' }),
  },
  habits: {
    list:   () => request('/habits'),
    create: (b: unknown) => request('/habits', { method: 'POST', json: b }),
    delete: (id: string) => request(`/habits/${id}`, { method: 'DELETE' }),
    toggle: (id: string, b: unknown) => request(`/habits/${id}/toggle`, { method: 'POST', json: b }),
  },
  ai: {
    chat:      (messages: unknown[], system?: string) => request<{ text: string }>('/ai/chat', { method: 'POST', json: { messages, system } }),
    summarize: (content: string) => request<{ text: string }>('/ai/summarize', { method: 'POST', json: { content } }),
    history:   () => request('/ai/history'),
    clear:     () => request('/ai/history', { method: 'DELETE' }),
  },
}
