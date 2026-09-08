export interface LoginRequest {
  email: string
  password: string
}

export interface AuthResponse {
  userId: number
  firstName?: string
  lastName?: string
  email: string
  roles: string[]
  token?: string
  expiresAt: string
}
