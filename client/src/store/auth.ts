import { create } from 'zustand'
import { api } from '../api'
import type { User } from '../types'

type AuthState = {
  token: string | null
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  hydrate: () => Promise<void>
}

export const useAuth = create<AuthState>((set, get) => ({
  token: localStorage.getItem('hm-token'),
  user: null,
  loading: Boolean(localStorage.getItem('hm-token')),

  login: async (email, password) => {
    const data = await api<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    localStorage.setItem('hm-token', data.token)
    set({ token: data.token, user: data.user, loading: false })
  },

  logout: () => {
    localStorage.removeItem('hm-token')
    set({ token: null, user: null, loading: false })
  },

  hydrate: async () => {
    const token = get().token
    if (!token) {
      set({ loading: false, user: null })
      return
    }
    try {
      const data = await api<{ user: User }>('/auth/me')
      set({ user: data.user, loading: false })
    } catch {
      // If api() detected 401, it already cleared 'hm-token' from localStorage
      if (!localStorage.getItem('hm-token')) {
        set({ token: null, user: null, loading: false })
      } else {
        // Temporary network lag or Render cold start: preserve token
        set({ loading: false })
      }
    }
  },
}))
