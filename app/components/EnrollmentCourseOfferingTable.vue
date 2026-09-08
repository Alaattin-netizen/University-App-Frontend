<script setup lang="ts">
import type { CourseOffering } from '~/types/student'

defineProps<{
  offerings: CourseOffering[]
  loading?: boolean
  enrollingId?: number | null
}>()

const emit = defineEmits<{
  enroll: [offering: CourseOffering]
}>()
</script>

<template>
  <CourseOfferingTable
    :offerings="offerings"
    :loading="loading"
    empty-message="No course offerings are currently available."
  >
    <template #actions="{ offering }">
      <UButton
        label="Enroll"
        icon="i-lucide-plus"
        size="sm"
        :loading="enrollingId === offering.courseOfferingId"
        :disabled="offering.availableSlots < 1"
        @click="emit('enroll', offering)"
      />
    </template>
  </CourseOfferingTable>
</template>
