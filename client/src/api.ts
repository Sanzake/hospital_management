export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('hm-token')
  const headers = new Headers(options.headers)
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json')
  }
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(`/api${path}`, { ...options, headers })
  if (res.status === 204) return undefined as T

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const message = typeof data.error === 'string' ? data.error : 'Request failed'
    throw new Error(message)
  }
  return data as T
}
