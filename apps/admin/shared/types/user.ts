export type Role = 'admin' | 'editor'

export interface AdminUser {
  name: string
  role: Role
}
