<script setup lang="ts">
import type { FetchError } from 'ofetch'
import type { UserProfile } from '~/types/profile'

definePageMeta({
  middleware: async () => {
    if (!await useAuth().ensureSession())
      return navigateTo('/')
  },
})

useSeoMeta({
  title: 'My profile | University Information System',
})

const config = useRuntimeConfig()
const { ensureSession } = useAuth()
const apiOptions = {
  baseURL: config.public.apiBase,
  credentials: 'include' as const,
  server: false,
}
const { data: profile, status } = await useFetch<UserProfile>('/users/me', apiOptions)
const form = reactive({ firstName: '', lastName: '' })
const saving = ref(false)
const notice = ref('')
const errorMessage = ref('')

watch(profile, (value) => {
  if (value) {
    form.firstName = value.firstName
    form.lastName = value.lastName
  }
}, { immediate: true })

function getErrorMessage(error: unknown) {
  const fetchError = error as FetchError<{ message?: string }>
  return fetchError.data?.message ?? 'The profile could not be updated.'
}

async function saveProfile() {
  notice.value = ''
  errorMessage.value = ''
  saving.value = true
  try {
    await $fetch('/users/me/profile', {
      ...apiOptions,
      method: 'PUT',
      body: { firstName: form.firstName.trim(), lastName: form.lastName.trim() },
    })
    if (profile.value) {
      profile.value.firstName = form.firstName.trim()
      profile.value.lastName = form.lastName.trim()
    }
    await ensureSession()
    notice.value = 'Profile updated successfully.'
  }
  catch (error) {
    errorMessage.value = getErrorMessage(error)
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="max-w-3xl space-y-6">
    <div>
      <p class="text-sm font-medium text-primary">Account</p>
      <h1 class="mt-2 text-3xl font-semibold tracking-tight text-highlighted">My profile</h1>
      <p class="mt-2 text-muted">Review your account information and update your name.</p>
    </div>
    <UAlert v-if="notice" color="success" variant="subtle" :description="notice" />
    <UAlert v-if="errorMessage" color="error" variant="subtle" :description="errorMessage" />
    <UCard>
      <div v-if="status === 'pending'" class="space-y-4">
        <USkeleton class="h-10 w-full" />
        <USkeleton class="h-10 w-full" />
      </div>
      <form v-else class="space-y-5" @submit.prevent="saveProfile">
        <div class="grid gap-5 sm:grid-cols-2">
          <UFormField label="First name">
            <UInput v-model="form.firstName" required />
          </UFormField>
          <UFormField label="Last name">
            <UInput v-model="form.lastName" required />
          </UFormField>
        </div>
        <UFormField label="Email">
          <UInput :model-value="profile?.email ?? ''" disabled />
        </UFormField>
        <div class="flex flex-wrap gap-2">
          <UBadge v-for="role in profile?.roles ?? []" :key="role" color="primary" variant="subtle">{{ role }}</UBadge>
        </div>
        <UButton type="submit" label="Save changes" icon="i-lucide-save" :loading="saving" />
      </form>
    </UCard>
  </div>
</template>
