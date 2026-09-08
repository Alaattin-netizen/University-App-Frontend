import type { FetchError } from 'ofetch'
import type { AuthResponse, LoginRequest } from '~/types/auth'
import { useAuthStore } from '~/stores/auth'

export function useAuth() {
  const config = useRuntimeConfig()
  const authStore = useAuthStore()

  async function ensureSession() {
    if (authStore.user)
      return authStore.user

    try {
      const response = await $fetch<AuthResponse>(`${config.public.apiBase}/Auth/me`, {
        credentials: 'include',
        headers: import.meta.server ? useRequestHeaders(['cookie']) : undefined,
      })
      authStore.setUser(response)
      return response
    }
    catch (error) {
      if ((error as FetchError).statusCode !== 401)
        throw error

      authStore.clearUser()
      return null
    }
  }

  async function login(credentials: LoginRequest) {
    const response = await $fetch<AuthResponse>(`${config.public.apiBase}/Auth/login`, {
      method: 'POST',
      body: credentials,
      credentials: 'include',
    })

    authStore.setUser(response)
    return response
  }

  async function logout() {
    await $fetch(`${config.public.apiBase}/Auth/logout`, {
      method: 'POST',
      credentials: 'include',
    })
    authStore.clearUser()
  }

  return {
    ensureSession,
    login,
    logout,
    session: computed(() => authStore.user),
    isAuthenticated: computed(() => authStore.isAuthenticated),
  }
}
