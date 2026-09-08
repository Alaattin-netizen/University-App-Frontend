<script setup lang="ts">
import type { FetchError } from 'ofetch'
import type { AttendanceOffering, AttendanceStudent } from '~/types/instructor'

definePageMeta({
  middleware: 'role',
  requiredRole: 'instructor',
})

useSeoMeta({
  title: 'Attendance | University Information System',
})

const api = useApi()
const selectedDate = ref(new Date().toISOString().slice(0, 10))
const offerings = ref<AttendanceOffering[]>([])
const students = ref<AttendanceStudent[]>([])
const selectedOfferingId = ref<number | undefined>()
const selectedStudentId = ref<number | undefined>()
const isPresent = ref(true)
const loadingOfferings = ref(false)
const loadingStudents = ref(false)
const saving = ref(false)
const notice = ref('')
const errorMessage = ref('')

function getErrorMessage(error: unknown) {
  const fetchError = error as FetchError<{ message?: string }>
  return fetchError.data?.message ?? 'The request could not be completed.'
}

async function loadOfferings() {
  loadingOfferings.value = true
  selectedOfferingId.value = undefined
  students.value = []
  selectedStudentId.value = undefined
  errorMessage.value = ''
  try {
    const response = await api.get<AttendanceOffering[]>(
      `/instructors/me/Responsible-Courses/by-date?date=${selectedDate.value}`,
    )
    if (response.error.value)
      throw response.error.value
    offerings.value = response.data.value ?? []
  }
  catch (error) {
    errorMessage.value = getErrorMessage(error)
  }
  finally {
    loadingOfferings.value = false
  }
}

async function selectOffering(courseOfferingId: number) {
  selectedOfferingId.value = courseOfferingId
  selectedStudentId.value = undefined
  loadingStudents.value = true
  errorMessage.value = ''
  try {
    const response = await api.get<AttendanceStudent[]>(
      `/instructors/me/Responsible-Courses/${courseOfferingId}/Registered-Students`,
    )
    if (response.error.value)
      throw response.error.value
    students.value = response.data.value ?? []
  }
  catch (error) {
    errorMessage.value = getErrorMessage(error)
  }
  finally {
    loadingStudents.value = false
  }
}

async function saveAttendance() {
  if (!selectedOfferingId.value || !selectedStudentId.value)
    return

  saving.value = true
  notice.value = ''
  errorMessage.value = ''
  try {
    await api.post('/instructors/me/Enter-Attendance', {
      courseOfferingId: selectedOfferingId.value,
      studentId: selectedStudentId.value,
      date: selectedDate.value,
      isPresent: isPresent.value,
    })
    notice.value = 'Attendance saved successfully.'
  }
  catch (error) {
    errorMessage.value = getErrorMessage(error)
  }
  finally {
    saving.value = false
  }
}

await loadOfferings()
</script>

<template>
  <div class="space-y-6">
    <div>
      <p class="text-sm font-medium text-primary">Instructor workspace</p>
      <h1 class="mt-2 text-3xl font-semibold tracking-tight text-highlighted">Record attendance</h1>
      <p class="mt-2 text-muted">Choose a date, select that day’s course offering, and record a student’s attendance.</p>
    </div>

    <UAlert v-if="notice" color="success" variant="subtle" :description="notice" />
    <UAlert v-if="errorMessage" color="error" variant="subtle" :description="errorMessage" />

    <UCard>
      <div class="flex flex-wrap items-end gap-4">
        <UFormField label="Attendance date">
          <UInput v-model="selectedDate" type="date" />
        </UFormField>
        <UButton label="Load offerings" icon="i-lucide-search" :loading="loadingOfferings" @click="loadOfferings" />
      </div>
    </UCard>

    <UCard>
      <template #header>
        <h2 class="text-lg font-semibold text-highlighted">Offerings on {{ selectedDate }}</h2>
      </template>
      <div v-if="loadingOfferings" class="flex justify-center py-8">
        <UIcon name="i-lucide-loader-circle" class="size-5 animate-spin text-primary" />
      </div>
      <div v-else-if="offerings.length" class="grid gap-3 md:grid-cols-2">
        <button
          v-for="offering in offerings"
          :key="offering.courseOfferingId"
          type="button"
          class="rounded-xl border p-4 text-left hover:border-primary"
          :class="selectedOfferingId === offering.courseOfferingId ? 'border-primary bg-primary/5' : 'border-default'"
          @click="selectOffering(offering.courseOfferingId)"
        >
          <p class="font-semibold text-highlighted">{{ offering.courseCode }} · {{ offering.courseName }}</p>
          <p class="mt-2 text-sm text-muted">{{ offering.startTime }}–{{ offering.endTime }} · {{ offering.classroom }}</p>
        </button>
      </div>
      <p v-else class="py-8 text-center text-sm text-muted">No course offerings are scheduled for this date.</p>
    </UCard>

    <UCard v-if="selectedOfferingId">
      <template #header>
        <h2 class="text-lg font-semibold text-highlighted">Students</h2>
      </template>
      <div v-if="loadingStudents" class="flex justify-center py-8">
        <UIcon name="i-lucide-loader-circle" class="size-5 animate-spin text-primary" />
      </div>
      <div v-else-if="students.length" class="space-y-5">
        <UFormField label="Student">
          <USelectMenu
            v-model="selectedStudentId"
            :items="students.map(student => ({ label: `${student.fullName} · ${student.email}`, value: student.studentId }))"
            value-key="value"
            label-key="label"
            placeholder="Choose an enrolled student"
          />
        </UFormField>
        <div v-if="selectedStudentId" class="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-elevated p-4">
          <p class="text-sm text-muted">Was the student present?</p>
          <div class="flex gap-2">
            <UButton label="Present" :variant="isPresent ? 'solid' : 'outline'" color="success" @click="isPresent = true" />
            <UButton label="Absent" :variant="!isPresent ? 'solid' : 'outline'" color="error" @click="isPresent = false" />
            <UButton label="Save attendance" icon="i-lucide-save" :loading="saving" @click="saveAttendance" />
          </div>
        </div>
      </div>
      <p v-else class="py-8 text-center text-sm text-muted">No students are enrolled in this offering.</p>
    </UCard>
  </div>
</template>
