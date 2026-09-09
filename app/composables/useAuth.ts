import type { FetchError } from 'ofetch'
import type { AuthResponse, LoginRequest } from '~/types/auth'
import { useAuthStore } from '~/stores/auth'

export function useAuth() {
  const authStore = useAuthStore()
  const api = useApi()

  async function loadSession() {
    try {
      const response = await api.get<AuthResponse>('/Auth/me', {
        headers: import.meta.server ? useRequestHeaders(['cookie']) : undefined,
      })
      if (response.error.value)
        throw response.error.value
      if (!response.data.value)
        throw new Error('The session response was empty.')
      authStore.setUser(response.data.value)
      return response.data.value
    }
    catch (error) {
      if ((error as FetchError).statusCode !== 401)
        throw error

      authStore.clearUser()
      return null
    }
  }

  async function ensureSession() {
    if (authStore.user)
      return authStore.user
    return loadSession()
  }

  async function login(credentials: LoginRequest) {
    const response = await api.post<AuthResponse>('/Auth/login', credentials)

    if (!response)
      throw new Error('The login response was empty.')
    authStore.setUser(response)
    return response
  }

  async function logout() {
    await api.post('/Auth/logout')
    authStore.clearUser()
  }

  return {
    ensureSession,
    refreshSession: loadSession,
    login,
    logout,
    session: computed(() => authStore.user),
    isAuthenticated: computed(() => authStore.isAuthenticated),
  }
}
