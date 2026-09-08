<script setup lang="ts">
import type { FetchError } from 'ofetch'
import type { UserSession } from '~/stores/auth'
import type { LoginRequest } from '~/types/auth'
import { useAuthStore } from '~/stores/auth'

const route = useRoute()
const { login, logout, session } = useAuth()
const authStore = useAuthStore()
const api = useApi()

const { data: currentUser } = await api.get<UserSession>('/Auth/me')

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
const navigationGroups = computed(() => [
  {
    label: 'General',
    items: [
      {
        label: 'Overview',
        description: 'University information system home',
        icon: 'i-lucide-house',
        to: '/',
        visible: true,
      },
      {
        label: 'Profile',
        description: 'View and update your information',
        icon: 'i-lucide-user-round',
        to: '/profile',
        visible: Boolean(session.value),
      },
    ],
  },
  {
    label: 'Instructor',
    items: [
      {
        label: 'Courses I teach',
        description: 'Manage courses assigned to you',
        icon: 'i-lucide-presentation',
        to: '/instructor/courses',
        visible: roles.value.has('instructor'),
      },
      {
        label: 'Attendance',
        description: 'Record student attendance',
        icon: 'i-lucide-calendar-check-2',
        to: '/instructor/attendance',
        visible: roles.value.has('instructor'),
      },
      {
        label: 'Student messages',
        description: 'Read messages from students',
        icon: 'i-lucide-inbox',
        to: '/instructor/messages',
        visible: roles.value.has('instructor'),
      },
    ],
  },
  {
    label: 'Student',
    items: [
      {
        label: 'Courses I take',
        description: 'View your enrolled courses',
        icon: 'i-lucide-book-open',
        to: '/student/courses',
        visible: roles.value.has('student'),
      },
      {
        label: 'Grades & transcript',
        description: 'View GPA and academic history',
        icon: 'i-lucide-graduation-cap',
        to: '/student/transcript',
        visible: roles.value.has('student'),
      },
      {
        label: 'Message instructors',
        description: 'Contact your instructors',
        icon: 'i-lucide-messages-square',
        to: '/student/messages',
        visible: roles.value.has('student'),
      },
    ],
  },
  {
    label: 'Administrator',
    items: [
      {
        label: 'Create users',
        description: 'Create accounts and assign roles',
        icon: 'i-lucide-user-plus',
        to: '/admin/users',
        visible: roles.value.has('admin'),
      },
      {
        label: 'Manage semesters',
        description: 'Activate semesters and update dates',
        icon: 'i-lucide-calendar-cog',
        to: '/admin/semesters',
        visible: roles.value.has('admin'),
      },
      {
        label: 'Academic structure',
        description: 'Create faculties, departments, and courses',
        icon: 'i-lucide-building-2',
        to: '/admin/academics',
        visible: roles.value.has('admin'),
      },
      {
        label: 'User logs',
        description: 'Review system activity',
        icon: 'i-lucide-clipboard-list',
        to: '/admin/logs',
        visible: roles.value.has('admin'),
      },
    ],
  },
].map(group => ({
  ...group,
  items: group.items.filter(item => item.visible),
})).filter(group => group.items.length > 0))

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

        <div class="flex min-w-0 items-center justify-end gap-3">
          <UColorModeButton
            color="neutral"
            variant="ghost"
            aria-label="Toggle dark mode"
          />

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
      </div>
      <p v-if="loginError" class="mx-auto max-w-[1600px] px-4 pb-3 text-right text-sm text-error sm:px-6 lg:px-8">
        {{ loginError }}
      </p>
    </header>

    <div class="mx-auto flex max-w-[1600px]">
      <aside class="sticky top-20 hidden h-[calc(100dvh-5rem)] w-72 shrink-0 overflow-y-auto border-r border-default bg-default lg:block">
        <nav class="p-5" aria-label="Main navigation">
          <p class="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted">
            Navigation
          </p>
          <div class="space-y-6">
            <section v-for="group in navigationGroups" :key="group.label">
              <p class="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted">
                {{ group.label }}
              </p>
              <div class="space-y-1">
                <NuxtLink
                  v-for="item in group.items"
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
            </section>
          </div>
          <p v-if="!session" class="mt-8 rounded-xl bg-elevated p-4 text-sm leading-6 text-muted">
            Log in to access role-specific course pages.
          </p>
        </nav>
      </aside>

      <main class="min-w-0 flex-1 p-4 sm:p-6 lg:p-10">
        <div class="mx-auto max-w-5xl">
          <div class="mb-5 overflow-x-auto lg:hidden">
            <nav class="min-w-max space-y-3" aria-label="Mobile navigation">
              <section v-for="group in navigationGroups" :key="group.label">
                <p class="mb-1 text-xs font-semibold uppercase tracking-wider text-muted">
                  {{ group.label }}
                </p>
                <div class="flex gap-2">
                  <NuxtLink
                    v-for="item in group.items"
                    :key="item.to"
                    :to="item.to"
                    class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium"
                    :class="route.path === item.to ? 'bg-primary text-inverted' : 'bg-default text-default'"
                  >
                    <UIcon :name="item.icon" class="size-4" />
                    {{ item.label }}
                  </NuxtLink>
                </div>
              </section>
            </nav>
          </div>
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>
