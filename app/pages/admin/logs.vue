<script setup lang="ts">
import type { FetchError } from 'ofetch'
import type { AuditLog } from '~/types/admin'

definePageMeta({
  middleware: 'role',
  requiredRole: 'admin',
})

useSeoMeta({
  title: 'User logs | University Information System',
  description: 'Review user activity logs.',
})

const api = useApi()

const { data: logs, status, error, refresh } = await api.get<AuditLog[]>('/audit-logs')

function formatDate(value: string) {
  return new Date(value).toLocaleString()
}

function getErrorMessage(value: unknown) {
  const fetchError = value as FetchError<{ message?: string }>
  return fetchError.data?.message ?? 'The logs could not be loaded.'
}

async function refreshLogs() {
  await refresh()
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="text-sm font-medium text-primary">Administrator workspace</p>
        <h1 class="mt-2 text-3xl font-semibold tracking-tight text-highlighted">User logs</h1>
        <p class="mt-2 text-muted">Review activity recorded across the university system.</p>
      </div>
      <UButton label="Refresh" icon="i-lucide-refresh-cw" variant="outline" :loading="status === 'pending'" @click="refreshLogs" />
    </div>

    <UAlert v-if="error" color="error" variant="subtle" :description="getErrorMessage(error)" />
    <UCard v-else>
      <div class="overflow-x-auto">
        <table class="min-w-full text-left">
          <thead class="border-b border-default">
            <tr>
              <th class="px-3 py-3 text-sm font-semibold text-highlighted">Time</th>
              <th class="px-3 py-3 text-sm font-semibold text-highlighted">User</th>
              <th class="px-3 py-3 text-sm font-semibold text-highlighted">Action</th>
              <th class="px-3 py-3 text-sm font-semibold text-highlighted">Entity</th>
              <th class="px-3 py-3 text-sm font-semibold text-highlighted">Details</th>
              <th class="px-3 py-3 text-sm font-semibold text-highlighted">IP address</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="status === 'pending'">
              <td colspan="6" class="px-3 py-8 text-center text-muted">Loading logs...</td>
            </tr>
            <tr v-else-if="!(logs ?? []).length">
              <td colspan="6" class="px-3 py-8 text-center text-muted">No logs found.</td>
            </tr>
            <tr v-for="log in logs ?? []" :key="log.id" class="border-b border-default last:border-0">
              <td class="whitespace-nowrap px-3 py-3 text-sm text-muted">{{ formatDate(log.timestamp) }}</td>
              <td class="px-3 py-3">
                <p class="text-sm font-medium text-highlighted">{{ log.userEmail }}</p>
                <p class="text-xs text-muted">{{ log.userRole }}</p>
              </td>
              <td class="px-3 py-3"><UBadge color="primary" variant="subtle">{{ log.action }}</UBadge></td>
              <td class="px-3 py-3 text-sm text-muted">{{ log.entityType }}{{ log.entityId ? ` #${log.entityId}` : '' }}</td>
              <td class="max-w-sm px-3 py-3 text-sm text-muted">{{ log.details || '—' }}</td>
              <td class="px-3 py-3 text-sm text-muted">{{ log.ipAddress || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>
  </div>
</template>
