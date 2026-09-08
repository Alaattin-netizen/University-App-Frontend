<script setup lang="ts">
import type { FetchError } from 'ofetch'
import type { InstructorMessage } from '~/types/instructor'

definePageMeta({
  middleware: 'role',
  requiredRole: 'instructor',
})

useSeoMeta({
  title: 'Student messages | University Information System',
})

const api = useApi()

const { data: messages, status, error, refresh } = await api.get<InstructorMessage[]>('/instructors/me/messages')

function formatDate(value: string) {
  return new Date(value).toLocaleString()
}

function getErrorMessage(value: unknown) {
  const fetchError = value as FetchError<{ message?: string }>
  return fetchError.data?.message ?? 'Messages could not be loaded.'
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="text-sm font-medium text-primary">Instructor workspace</p>
        <h1 class="mt-2 text-3xl font-semibold tracking-tight text-highlighted">Student messages</h1>
        <p class="mt-2 text-muted">Review messages sent to you by students.</p>
      </div>
      <UButton label="Refresh" icon="i-lucide-refresh-cw" variant="outline" :loading="status === 'pending'" @click="() => refresh()" />
    </div>

    <UAlert v-if="error" color="error" variant="subtle" :description="getErrorMessage(error)" />
    <UCard v-else>
      <div v-if="status === 'pending'" class="py-8 text-center text-muted">
        Loading messages...
      </div>
      <div v-else-if="!(messages ?? []).length" class="py-8 text-center text-muted">
        No messages have been sent to you.
      </div>
      <div v-else class="space-y-4">
        <article v-for="message in messages" :key="message.id" class="rounded-lg border border-default p-4">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 class="font-semibold text-highlighted">{{ message.subject }}</h2>
              <p class="mt-1 text-sm text-muted">
                From {{ message.senderName }} ({{ message.senderEmail }})
              </p>
            </div>
            <div class="flex items-center gap-2">
              <UBadge :color="message.isRead ? 'neutral' : 'primary'" variant="subtle">
                {{ message.isRead ? 'Read' : 'Unread' }}
              </UBadge>
              <span class="text-xs text-muted">{{ formatDate(message.sentDate) }}</span>
            </div>
          </div>
          <p class="mt-4 whitespace-pre-wrap text-sm text-toned">
            {{ message.content }}
          </p>
        </article>
      </div>
    </UCard>
  </div>
</template>
