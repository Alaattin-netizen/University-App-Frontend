<script setup lang="ts">
import { useAuth } from '~/composables/useAuth'

definePageMeta({
  layout: false,
})

useSeoMeta({
  title: 'Dashboard | University Information System',
})

const { session, logout } = useAuth()

async function signOut() {
  logout()
  await navigateTo('/login')
}
</script>

<template>
  <div class="min-h-dvh bg-elevated px-4 py-8 sm:px-6">
    <div class="mx-auto max-w-5xl">
      <header class="mb-10 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary">
            <UIcon name="i-lucide-landmark" class="size-6" />
          </div>
          <div>
            <p class="font-semibold text-highlighted">
              University IS
            </p>
            <p class="text-sm text-muted">
              Information system
            </p>
          </div>
        </div>
        <UButton
          label="Sign out"
          icon="i-lucide-log-out"
          color="neutral"
          variant="outline"
          @click="signOut"
        />
      </header>

      <UCard>
        <template #header>
          <p class="text-sm font-medium text-primary">
            Dashboard
          </p>
          <h1 class="mt-2 text-3xl font-semibold tracking-tight text-highlighted">
            Welcome{{ session?.firstName ? `, ${session.firstName}` : '' }}.
          </h1>
        </template>
        <p class="text-muted">
          You are signed in as {{ session?.email ?? 'a university user' }}.
        </p>
      </UCard>
    </div>
  </div>
</template>
