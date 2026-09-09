<script setup lang="ts">
import type { FetchError } from 'ofetch'
import type { AttendanceImportResult, AttendanceOffering, AttendanceStudent } from '~/types/instructor'

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
const importing = ref(false)
const exporting = ref(false)
const importInput = ref<HTMLInputElement | null>(null)
const importResult = ref<AttendanceImportResult | null>(null)

const selectedStudent = computed(() =>
  students.value.find(student => String(student.studentId) === String(selectedStudentId.value)),
)

function syncSelectedStudentStatus() {
  const student = selectedStudent.value
  isPresent.value = student?.isPresent ?? true
}

function selectStudent(studentId: number | string | undefined) {
  selectedStudentId.value = studentId === undefined ? undefined : Number(studentId)
  syncSelectedStudentStatus()
}

function setAttendanceStatus(present: boolean) {
  isPresent.value = present
  if (selectedStudent.value)
    selectedStudent.value.isPresent = present
}

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
      `/instructors/me/Responsible-Courses/${courseOfferingId}/Registered-Students?date=${selectedDate.value}&cacheBust=${Date.now()}`,
    )
    if (response.error.value)
      throw response.error.value
    students.value = response.data.value ?? []
    selectedStudentId.value = undefined
    syncSelectedStudentStatus()
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
    if (selectedStudent.value)
      selectedStudent.value.isPresent = isPresent.value
    notice.value = 'Attendance saved successfully.'
  }
  catch (error) {
    errorMessage.value = getErrorMessage(error)
  }
  finally {
    saving.value = false
  }
}

function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

async function exportAttendance() {
  exporting.value = true
  errorMessage.value = ''
  try {
    const response = await api.get<Blob>('/instructors/me/attendance/export', {
      responseType: 'blob',
      query: { cacheBust: Date.now() },
    })
    if (response.error.value)
      throw response.error.value
    if (!response.data.value)
      throw new Error('The attendance export was empty.')
    downloadFile(response.data.value, `attendance-${new Date().toISOString().slice(0, 10)}.xlsx`)
  }
  catch (error) {
    errorMessage.value = getErrorMessage(error)
  }
  finally {
    exporting.value = false
  }
}

async function importAttendance(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file)
    return

  importing.value = true
  importResult.value = null
  notice.value = ''
  errorMessage.value = ''
  try {
    const body = new FormData()
    body.append('file', file)
    const result = await api.post<AttendanceImportResult>('/instructors/me/attendance/import', body)
    importResult.value = result ?? { created: 0, updated: 0, errors: [] }
    notice.value = `Attendance import completed: ${importResult.value.created} created, ${importResult.value.updated} updated.`
    if (selectedOfferingId.value)
      await selectOffering(selectedOfferingId.value)
  }
  catch (error) {
    errorMessage.value = getErrorMessage(error)
  }
  finally {
    importing.value = false
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
        <UButton label="Export Excel" icon="i-lucide-download" color="neutral" variant="outline" :loading="exporting" @click="exportAttendance" />
        <UButton label="Import Excel" icon="i-lucide-upload" color="neutral" variant="outline" :loading="importing" @click="importInput?.click()" />
        <input ref="importInput" class="hidden" type="file" accept=".xlsx" @change="importAttendance">
      </div>
      <p class="mt-3 text-xs text-muted">
        Excel columns: Date, Class, Student, Student Name, Attendance Status.
      </p>
    </UCard>

    <UAlert
      v-if="importResult?.errors.length"
      color="warning"
      variant="subtle"
      title="Some rows were not imported"
      :description="importResult.errors.join(' ')"
    />

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
            :model-value="selectedStudentId"
            :items="students.map(student => ({ label: `${student.fullName} · ${student.email}`, value: student.studentId }))"
            value-key="value"
            label-key="label"
            placeholder="Choose an enrolled student"
            @update:model-value="selectStudent"
          />
        </UFormField>
        <div v-if="selectedStudentId" class="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-elevated p-4">
          <p class="text-sm text-muted">Was the student present?</p>
          <div class="flex gap-2">
            <UButton label="Present" :variant="isPresent ? 'solid' : 'outline'" color="success" @click="setAttendanceStatus(true)" />
            <UButton label="Absent" :variant="!isPresent ? 'solid' : 'outline'" color="error" @click="setAttendanceStatus(false)" />
            <UButton label="Save attendance" icon="i-lucide-save" :loading="saving" @click="saveAttendance" />
          </div>
        </div>
      </div>
      <p v-else class="py-8 text-center text-sm text-muted">No students are enrolled in this offering.</p>
    </UCard>
  </div>
</template>
