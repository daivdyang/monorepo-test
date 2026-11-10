// 全域路由守衛：SSR 首次請求與 client 端換頁都會執行。
// 這只是 UX；真正的安全邊界在 server 端的 requireAdmin()。
export default defineNuxtRouteMiddleware(async (to) => {
  const { user, fetchUser } = useAuth()

  if (!user.value) {
    await fetchUser()
  }

  if (to.path === '/login') {
    return user.value ? navigateTo('/') : undefined
  }

  if (!user.value) {
    return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
  }
})
