<script setup lang="ts">
import type { CourseOffering } from '~/types/student'

defineProps<{
  offerings: CourseOffering[]
  loading?: boolean
  emptyMessage?: string
}>()

defineSlots<{
  actions: (props: { offering: CourseOffering }) => unknown
}>()
</script>

<template>
  <div class="overflow-x-auto">
    <div v-if="loading" class="flex min-h-32 items-center justify-center">
      <UIcon name="i-lucide-loader-circle" class="size-5 animate-spin text-primary" />
    </div>
    <table v-else class="min-w-[760px] w-full text-left">
      <thead>
        <tr class="border-b border-default">
          <th class="px-3 py-3 text-sm font-semibold text-highlighted">Course</th>
          <th class="px-3 py-3 text-sm font-semibold text-highlighted">Name</th>
          <th class="px-3 py-3 text-sm font-semibold text-highlighted">ECTS</th>
          <th class="px-3 py-3 text-sm font-semibold text-highlighted">Schedule</th>
          <th class="px-3 py-3 text-sm font-semibold text-highlighted">Instructor</th>
          <th class="w-28 px-3 py-3 text-sm font-semibold text-highlighted">Action</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="offering in offerings" :key="offering.courseOfferingId" class="border-b border-default last:border-0">
          <td class="whitespace-nowrap px-3 py-4 font-semibold text-highlighted">
            {{ offering.code }}
          </td>
          <td class="px-3 py-4">
            <p class="font-medium text-highlighted">
              {{ offering.name }}
            </p>
            <p v-if="offering.prerequisiteCode" class="text-xs text-muted">
              Prerequisite: {{ offering.prerequisiteCode }}
            </p>
          </td>
          <td class="px-3 py-4 text-default">
            {{ offering.credits }}
          </td>
          <td class="whitespace-nowrap px-3 py-4">
            <p class="text-sm text-default">
              {{ offering.day }}
            </p>
            <p class="text-xs text-muted">
              {{ offering.startTime }}–{{ offering.endTime }} · {{ offering.classroom }}
            </p>
          </td>
          <td class="whitespace-nowrap px-3 py-4 text-default">
            {{ offering.instructorName }}
          </td>
          <td class="px-3 py-4">
            <slot name="actions" :offering="offering" />
          </td>
        </tr>
      </tbody>
    </table>
    <p v-if="!loading && offerings.length === 0" class="px-4 py-8 text-center text-sm text-muted">
      {{ emptyMessage ?? 'No courses found.' }}
    </p>
  </div>
</template>
