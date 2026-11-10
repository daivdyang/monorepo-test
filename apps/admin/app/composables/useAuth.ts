import type { AdminUser } from '#shared/types/user'

export function useAuth() {
  // useState：SSR 時設定的值會帶到 client，避免 hydration 不一致
  const user = useState<AdminUser | null>('admin-user', () => null)
  // useRequestFetch：SSR 時把瀏覽器帶來的 cookie 轉發給內部 API
  const requestFetch = useRequestFetch()

  async function fetchUser() {
    try {
      user.value = await requestFetch<AdminUser>('/api/auth/me')
    }
    catch {
      user.value = null
    }
  }

  async function login(password: string) {
    user.value = await $fetch<AdminUser>('/api/auth/login', {
      method: 'POST',
      body: { password },
    })
  }

  async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST' })
    user.value = null
    await navigateTo('/login')
  }

  return { user, fetchUser, login, logout }
}
