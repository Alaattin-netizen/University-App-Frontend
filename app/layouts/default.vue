<script setup lang="ts">
import type { FetchError } from 'ofetch'
import type { UserSession } from '~/stores/auth'
import type { LoginRequest } from '~/types/auth'
import { useAuthStore } from '~/stores/auth'

const route = useRoute()
const { login, logout, session } = useAuth()
const authStore = useAuthStore()
const config = useRuntimeConfig()

const { data: currentUser } = await useFetch<UserSession>('/Auth/me', {
  baseURL: config.public.apiBase,
  credentials: 'include',
  server: false,
})

const credentials = reactive<LoginRequest>({
  email: '',
  password: '',
})
const isSubmitting = ref(false)
const loginError = ref('')
const showPassword = ref(false)

watch(currentUser, (user) => {
  if (user)
    authStore.setUser(user)
}, { immediate: true })

const roles = computed(() => new Set(
  (session.value?.roles ?? []).map(role => role.trim().toLowerCase().replace(/^role[._:-]?/, '')),
))
const navigation = computed(() => [
  {
    label: 'Overview',
    description: 'University information system home',
    icon: 'i-lucide-house',
    to: '/',
    visible: true,
  },
  {
    label: 'Courses I teach',
    description: 'Manage courses assigned to you',
    icon: 'i-lucide-presentation',
    to: '/teacher-courses',
    visible: roles.value.has('instructor'),
  },
  {
    label: 'Courses I take',
    description: 'View your enrolled courses',
    icon: 'i-lucide-book-open',
    to: '/student-courses',
    visible: roles.value.has('student'),
  },
].filter(item => item.visible))

function getApiErrorMessage(error: unknown) {
  const fetchError = error as FetchError<{ message?: string }>
  return fetchError.data?.message ?? 'We could not sign you in. Please try again.'
}

async function submitLogin() {
  loginError.value = ''
  if (!credentials.email || !credentials.password) {
    loginError.value = 'Enter your email and password.'
    return
  }

  isSubmitting.value = true
  try {
    await login({
      email: credentials.email.trim(),
      password: credentials.password,
    })
    credentials.password = ''
  }
  catch (error) {
    loginError.value = getApiErrorMessage(error)
  }
  finally {
    isSubmitting.value = false
  }
}

async function signOut() {
  await logout()
  await navigateTo('/')
}
</script>

<template>
  <div class="min-h-dvh bg-elevated">
    <header class="sticky top-0 z-20 border-b border-default bg-default/95 shadow-sm backdrop-blur">
      <div class="mx-auto flex min-h-20 max-w-[1600px] items-center justify-between gap-6 px-4 py-3 sm:px-6 lg:px-8">
        <NuxtLink to="/" class="flex shrink-0 items-center gap-3">
          <div class="grid size-11 place-items-center rounded-xl bg-primary/10">
            <img src="/logo.png" alt="University IS logo" class="size-9 object-contain">
          </div>
          <div class="hidden sm:block">
            <p class="font-semibold text-highlighted">
              University IS
            </p>
            <p class="text-xs text-muted">
              Information system
            </p>
          </div>
        </NuxtLink>

        <div v-if="session" class="flex items-center gap-3">
          <div class="hidden text-right sm:block">
            <p class="text-sm font-medium text-highlighted">
              {{ session.firstName || session.email }}
            </p>
            <p class="text-xs text-muted">
              {{ session.roles.join(', ') || 'User' }}
            </p>
          </div>
          <UButton label="Log out" icon="i-lucide-log-out" color="neutral" variant="outline" @click="signOut" />
        </div>

        <form v-else class="flex flex-1 flex-wrap items-start justify-end gap-2" @submit.prevent="submitLogin">
          <div class="w-36 sm:w-44">
            <UInput
              v-model="credentials.email"
              type="email"
              placeholder="University email"
              aria-label="University email"
              icon="i-lucide-mail"
              size="sm"
            />
          </div>
          <div class="w-32 sm:w-40">
            <UInput
              v-model="credentials.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Password"
              aria-label="Password"
              icon="i-lucide-lock-keyhole"
              size="sm"
            >
              <template #trailing>
                <UButton
                  :icon="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  :aria-label="showPassword ? 'Hide password' : 'Show password'"
                  @click="showPassword = !showPassword"
                />
              </template>
            </UInput>
          </div>
          <UButton type="submit" label="Log in" icon="i-lucide-log-in" size="sm" :loading="isSubmitting" />
        </form>
      </div>
      <p v-if="loginError" class="mx-auto max-w-[1600px] px-4 pb-3 text-right text-sm text-error sm:px-6 lg:px-8">
        {{ loginError }}
      </p>
    </header>

    <div class="mx-auto flex max-w-[1600px]">
      <aside class="hidden w-72 shrink-0 border-r border-default bg-default lg:block">
        <nav class="sticky top-20 p-5" aria-label="Main navigation">
          <p class="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted">
            Navigation
          </p>
          <div class="space-y-1">
            <NuxtLink
              v-for="item in navigation"
              :key="item.to"
              :to="item.to"
              class="group flex items-start gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-elevated"
              :class="route.path === item.to ? 'bg-primary/10 text-primary' : 'text-default'"
            >
              <UIcon :name="item.icon" class="mt-0.5 size-5 shrink-0" />
              <span>
                <span class="block text-sm font-medium">{{ item.label }}</span>
                <span class="mt-0.5 block text-xs text-muted">{{ item.description }}</span>
              </span>
            </NuxtLink>
          </div>
          <p v-if="!session" class="mt-8 rounded-xl bg-elevated p-4 text-sm leading-6 text-muted">
            Log in to access role-specific course pages.
          </p>
        </nav>
      </aside>

      <main class="min-w-0 flex-1 p-4 sm:p-6 lg:p-10">
        <div class="mx-auto max-w-5xl">
          <div class="mb-5 overflow-x-auto lg:hidden">
            <nav class="flex min-w-max gap-2" aria-label="Mobile navigation">
              <NuxtLink
                v-for="item in navigation"
                :key="item.to"
                :to="item.to"
                class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium"
                :class="route.path === item.to ? 'bg-primary text-inverted' : 'bg-default text-default'"
              >
                <UIcon :name="item.icon" class="size-4" />
                {{ item.label }}
              </NuxtLink>
            </nav>
          </div>
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>
