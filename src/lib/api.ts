const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'

function getToken() {
  return localStorage.getItem('treedoo_token')
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || res.statusText)
  }
  return res.status === 204 ? (undefined as T) : res.json()
}

async function upload<T>(path: string, formData: FormData): Promise<T> {
  const token = getToken()
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || res.statusText)
  }
  return res.json()
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ token: string; user: User }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    register: (data: RegisterData) =>
      request<{ token: string; user: User }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    me: () => request<User>('/api/auth/me'),
  },
  tickets: {
    list: () => request<Ticket[]>('/api/tickets'),
    create: (data: FormData) => upload<Ticket>('/api/tickets', data),
    updateStatus: (id: string, status: string) =>
      request<Ticket>(`/api/tickets/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
  },
  scadenze: {
    list: () => request<Scadenza[]>('/api/scadenze'),
    create: (data: Omit<Scadenza, 'id' | 'created_at' | 'condominio_id' | 'paid'>) =>
      request<Scadenza>('/api/scadenze', { method: 'POST', body: JSON.stringify(data) }),
    pay: (id: string) => request<Scadenza>(`/api/scadenze/${id}/pay`, { method: 'PATCH' }),
    delete: (id: string) => request<void>(`/api/scadenze/${id}`, { method: 'DELETE' }),
  },
  posts: {
    list: () => request<Post[]>('/api/posts'),
    create: (content: string, category?: string) =>
      request<Post>('/api/posts', { method: 'POST', body: JSON.stringify({ content, category }) }),
    like: (id: string) => request<{ likes: number }>(`/api/posts/${id}/like`, { method: 'POST' }),
  },
  condominii: {
    list: () => request<Condominio[]>('/api/condominii'),
    listPublic: () => fetch(`${BASE}/api/condominii/public`).then(r => r.json()) as Promise<Condominio[]>,
    create: (name: string, address?: string) =>
      request<Condominio>('/api/condominii', { method: 'POST', body: JSON.stringify({ name, address }) }),
  },
  files: {
    url: (path: string | null | undefined) => path ? `${BASE}${path}` : null,
  },
}

// Types
export interface User {
  id: string
  email: string
  name: string
  role: 'condomino' | 'amministratore'
  condominio_id: string
  created_at: string
}

export interface RegisterData {
  email: string
  password: string
  name: string
  role: 'condomino' | 'amministratore'
  condominio_id?: string
  condominio_name?: string
  condominio_address?: string
}

export interface Ticket {
  id: string
  condominio_id: string
  user_id: string
  user_name: string
  title: string
  description: string
  category: string
  status: 'aperto' | 'in_corso' | 'risolto'
  photo_url: string | null
  created_at: string
  updated_at: string
}

export interface Scadenza {
  id: string
  condominio_id: string
  title: string
  amount: number
  due_date: string
  paid: boolean
  payment_ref: string | null
  created_at: string
}

export interface Post {
  id: string
  condominio_id: string
  user_id: string
  user_name: string
  content: string
  category: string
  likes: number
  created_at: string
}

export interface Condominio {
  id: string
  name: string
  address: string
  created_at: string
}
