export default defineEventHandler(async (event) => {
  const { password } = await readBody<{ password?: string }>(event)
  const { adminPassword } = useRuntimeConfig(event)

  if (password !== adminPassword) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid password' })
  }

  setCookie(event, SESSION_COOKIE, DEMO_TOKEN, {
    httpOnly: true, // JS 讀不到，降低 XSS 竊取風險
    sameSite: 'lax',
    secure: !import.meta.dev,
    path: '/',
    maxAge: 60 * 60 * 8,
  })
  return DEMO_USER
})
