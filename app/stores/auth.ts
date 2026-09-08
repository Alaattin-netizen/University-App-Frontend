import type { AuthResponse } from '~/types/auth'
import { defineStore } from 'pinia'

export type UserSession = Omit<AuthResponse, 'token'>

export const useAuthStore = defineStore('auth', () => {
  const user = ref<UserSession | null>(null)

  const isAuthenticated = computed(() => {
    if (!user.value)
      return false

    return new Date(user.value.expiresAt) > new Date()
  })

  function setUser(session: UserSession) {
    user.value = session
  }

  function clearUser() {
    user.value = null
  }

  return {
    user,
    isAuthenticated,
    setUser,
    clearUser,
  }
})
