<script setup lang="ts">
import type { FetchError } from 'ofetch'
import type { LoginRequest } from '~/types/auth'
import { useAuth } from '~/composables/useAuth'

definePageMeta({
  layout: false,
})

useSeoMeta({
  title: 'Sign in | University Information System',
  description: 'Sign in to your University Information System account.',
})

const { login } = useAuth()

const form = reactive<LoginRequest>({
  email: '',
  password: '',
})

const errors = reactive<Partial<Record<keyof LoginRequest, string>>>({})
const serverError = ref('')
const isSubmitting = ref(false)
const showPassword = ref(false)

function validate() {
  errors.email = form.email ? undefined : 'Email is required.'
  errors.password = form.password ? undefined : 'Password is required.'

  if (form.email && !/^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/.test(form.email))
    errors.email = 'Enter a valid university email address.'

  return !errors.email && !errors.password
}

function getApiErrorMessage(error: unknown) {
  const fetchError = error as FetchError<{ message?: string }>
  return fetchError.data?.message ?? 'We could not sign you in. Please try again.'
}

async function submit() {
  serverError.value = ''
  if (!validate())
    return

  isSubmitting.value = true
  try {
    await login({
      email: form.email.trim(),
      password: form.password,
    })
    await navigateTo('/dashboard')
  }
  catch (error) {
    serverError.value = getApiErrorMessage(error)
  }
  finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="relative isolate flex min-h-dvh items-center justify-center overflow-hidden bg-elevated px-4 py-8 sm:px-6">
    <div class="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(0,220,130,0.16),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(14,116,144,0.12),transparent_35%)]" />

    <div class="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-default bg-default shadow-2xl lg:grid-cols-[0.9fr_1.1fr]">
      <main class="p-6 sm:p-10 lg:p-14">
        <div class="mx-auto max-w-md">
          <div class="mb-10 lg:hidden">
            <div class="mb-6 flex items-center gap-3">
              <div class="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                <UIcon name="i-lucide-landmark" class="size-6" />
              </div>
              <span class="text-lg font-semibold text-highlighted">University IS</span>
            </div>
          </div>

          <div class="mb-8">
            <p class="mb-3 text-sm font-medium text-primary">
              Welcome back
            </p>
            <h2 class="text-3xl font-semibold tracking-tight text-highlighted">
              Sign in to your account
            </h2>
            <p class="mt-3 text-sm leading-6 text-muted">
              Use your university credentials to continue.
            </p>
          </div>

          <UAlert
            v-if="serverError"
            color="error"
            variant="subtle"
            icon="i-lucide-circle-alert"
            :description="serverError"
            class="mb-5"
          />

          <form class="space-y-5" novalidate @submit.prevent="submit">
            <UFormField label="University email" name="email" required :error="errors.email">
              <UInput
                v-model="form.email"
                type="email"
                autocomplete="email"
                placeholder="you@university.edu"
                icon="i-lucide-mail"
                size="lg"
                class="w-full"
                @input="errors.email = undefined"
              />
            </UFormField>

            <UFormField label="Password" name="password" required :error="errors.password">
              <UInput
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                placeholder="Enter your password"
                icon="i-lucide-lock-keyhole"
                size="lg"
                class="w-full"
                :ui="{ trailing: 'pe-1' }"
                @input="errors.password = undefined"
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
            </UFormField>

            <div class="flex items-center justify-between gap-4 pt-1">
              <UCheckbox label="Remember me" />
            </div>

            <UButton
              type="submit"
              label="Sign in"
              icon="i-lucide-arrow-right"
              trailing
              block
              size="lg"
              :loading="isSubmitting"
            />
          </form>
        </div>
      </main>
    </div>
  </div>
</template>
