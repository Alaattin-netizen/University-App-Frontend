<script setup lang="ts">
import type { Enrollment } from '~/types/student'

defineProps<{
  enrollments: Enrollment[]
  loading?: boolean
  droppingId?: number | null
}>()

const emit = defineEmits<{
  drop: [enrollment: Enrollment]
}>()
</script>

<template>
  <CourseOfferingTable
    :offerings="enrollments"
    :loading="loading"
    empty-message="You have no active enrollments."
  >
    <template #actions="{ offering }">
      <UButton
        label="Drop"
        icon="i-lucide-trash-2"
        color="error"
        variant="soft"
        size="sm"
        :loading="droppingId === (offering as Enrollment).enrollmentId"
        @click="emit('drop', offering as Enrollment)"
      />
    </template>
  </CourseOfferingTable>
</template>
