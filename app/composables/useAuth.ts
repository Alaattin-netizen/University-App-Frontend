import type { AuthResponse, LoginRequest } from '~/types/auth'

export function useAuth() {
  const config = useRuntimeConfig()
  const token = useCookie<string | null>('uis_token', {
    default: () => null,
    maxAge: 60 * 60,
    sameSite: 'lax',
    secure: import.meta.env.PROD,
  })
  const session = useState<AuthResponse | null>('auth-session', () => null)

  async function login(credentials: LoginRequest) {
    const response = await $fetch<AuthResponse>(`${config.public.apiBase}/Auth/login`, {
      method: 'POST',
      body: credentials,
    })

    token.value = response.token
    session.value = response
    return response
  }

  function logout() {
    token.value = null
    session.value = null
  }

  return {
    login,
    logout,
    session: readonly(session),
    token: readonly(token),
  }
}
