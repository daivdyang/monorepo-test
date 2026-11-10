import type { H3Event } from 'h3'
import type { AdminUser } from '#shared/types/user'

export const SESSION_COOKIE = 'admin_session'
// 範例用固定 token；正式環境請改用 nuxt-auth-utils（加密 session）或 JWT
export const DEMO_TOKEN = 'demo-admin-token'
export const DEMO_USER: AdminUser = { name: 'Admin', role: 'admin' }

// server/utils 內的函式會被 Nitro 自動 import 到所有 server 檔案
export function requireAdmin(event: H3Event): AdminUser {
  if (getCookie(event, SESSION_COOKIE) !== DEMO_TOKEN) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  return DEMO_USER
}
