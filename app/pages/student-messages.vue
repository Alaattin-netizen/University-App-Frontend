<script setup lang="ts">
import type { FetchError } from 'ofetch'
import type { Instructor, StudentMessage } from '~/types/messages'

definePageMeta({
  middleware: 'role',
  requiredRole: 'student',
})

useSeoMeta({
  title: 'Message instructors | University Information System',
})

const config = useRuntimeConfig()
const apiOptions = {
  baseURL: config.public.apiBase,
  credentials: 'include' as const,
  server: false,
}
const { data: instructors, status: instructorsStatus } = await useFetch<Instructor[]>('/students/me/instructors', apiOptions)
const { data: messages, status: messagesStatus, refresh: refreshMessages } = await useFetch<StudentMessage[]>('/students/me/messages', apiOptions)
const form = reactive({ receiverInstructorId: undefined as number | undefined, subject: '', content: '' })
const sending = ref(false)
const notice = ref('')
const errorMessage = ref('')

const instructorItems = computed(() => (instructors.value ?? []).map(instructor => ({
  label: `${instructor.firstName} ${instructor.lastName}`,
  value: instructor.id,
  description: instructor.email,
})))

function getErrorMessage(error: unknown) {
  const fetchError = error as FetchError<{ message?: string }>
  return fetchError.data?.message ?? 'The message could not be sent.'
}

async function sendMessage() {
  notice.value = ''
  errorMessage.value = ''
  sending.value = true
  try {
    await $fetch('/students/me/message', {
      ...apiOptions,
      method: 'POST',
      body: {
        receiverInstructorId: form.receiverInstructorId,
        subject: form.subject.trim(),
        content: form.content.trim(),
      },
    })
    form.subject = ''
    form.content = ''
    notice.value = 'Message sent successfully.'
    await refreshMessages()
  }
  catch (error) {
    errorMessage.value = getErrorMessage(error)
  }
  finally {
    sending.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <p class="text-sm font-medium text-primary">Student communication</p>
      <h1 class="mt-2 text-3xl font-semibold tracking-tight text-highlighted">Message instructors</h1>
      <p class="mt-2 text-muted">Choose an instructor, send a message, and review your previous messages.</p>
    </div>
    <UAlert v-if="notice" color="success" variant="subtle" :description="notice" />
    <UAlert v-if="errorMessage" color="error" variant="subtle" :description="errorMessage" />
    <UCard>
      <template #header>
        <h2 class="text-lg font-semibold text-highlighted">New message</h2>
      </template>
      <form class="space-y-5" @submit.prevent="sendMessage">
        <UFormField label="Instructor" required>
          <USelectMenu
            v-model="form.receiverInstructorId"
            :items="instructorItems"
            value-key="value"
            label-key="label"
            :loading="instructorsStatus === 'pending'"
            placeholder="Select an instructor"
          />
        </UFormField>
        <UFormField label="Subject" required>
          <UInput v-model="form.subject" required />
        </UFormField>
        <UFormField label="Message" required>
          <UTextarea v-model="form.content" :rows="5" required />
        </UFormField>
        <UButton type="submit" label="Send message" icon="i-lucide-send" :loading="sending" :disabled="!form.receiverInstructorId" />
      </form>
    </UCard>
    <UCard>
      <template #header>
        <h2 class="text-lg font-semibold text-highlighted">Sent messages</h2>
      </template>
      <div v-if="messagesStatus === 'pending'" class="flex justify-center py-8">
        <UIcon name="i-lucide-loader-circle" class="size-5 animate-spin text-primary" />
      </div>
      <div v-else-if="messages?.length" class="space-y-3">
        <article v-for="message in messages" :key="message.id" class="rounded-xl border border-default p-4">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p class="font-semibold text-highlighted">{{ message.subject }}</p>
              <p class="text-sm text-muted">To {{ message.receiverName }}</p>
            </div>
            <time class="text-xs text-muted">{{ new Date(message.sentDate).toLocaleString() }}</time>
          </div>
          <p class="mt-3 whitespace-pre-wrap text-sm text-default">{{ message.content }}</p>
        </article>
      </div>
      <p v-else class="py-8 text-center text-sm text-muted">You have not sent any messages yet.</p>
    </UCard>
  </div>
</template>
