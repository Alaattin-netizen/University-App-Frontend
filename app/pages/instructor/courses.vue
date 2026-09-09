<script setup lang="ts">
import type { FetchError } from 'ofetch'
import type { Announcement, InstructorCourse, RegisteredStudent } from '~/types/instructor'

definePageMeta({
  middleware: 'role',
  requiredRole: 'instructor',
})

useSeoMeta({
  title: 'Instructor courses | University Information System',
  description: 'Manage active course offerings and student grades.',
})

const api = useApi()

const { data: courses, status: coursesStatus } = await api.get<InstructorCourse[]>('/instructors/me/Responsible-Courses')

const activeTab = ref<'courses' | 'grades' | 'announcements'>('courses')
const selectedOfferingId = ref<number | undefined>()
const selectedStudentId = ref<number | undefined>()
const students = ref<RegisteredStudent[]>([])
const studentsStatus = ref<'idle' | 'pending' | 'success' | 'error'>('idle')
const saving = ref(false)
const notice = ref('')
const errorMessage = ref('')
const announcements = ref<Announcement[]>([])
const announcementsStatus = ref<'idle' | 'pending' | 'success' | 'error'>('idle')
const announcementSaving = ref(false)
const announcementForm = reactive({ title: '', content: '' })

const gradeForm = reactive({
  midtermScore: null as number | null,
  assignmentScore: null as number | null,
  finalScore: null as number | null,
  makeupScore: null as number | null,
})
const scoreFields = [
  ['midtermScore', 'Midterm'],
  ['assignmentScore', 'Assignment'],
  ['finalScore', 'Final'],
  ['makeupScore', 'Makeup'],
] as const

const selectedCourse = computed(() =>
  courses.value?.find(course => course.courseOfferingId === selectedOfferingId.value),
)
const selectedStudent = computed(() =>
  students.value.find(student => student.studentId === selectedStudentId.value),
)

function getErrorMessage(error: unknown) {
  const fetchError = error as FetchError<{ message?: string }>
  return fetchError.data?.message ?? 'The request could not be completed.'
}

function setGradeForm(student: RegisteredStudent | undefined) {
  gradeForm.midtermScore = student?.midtermScore ?? null
  gradeForm.assignmentScore = student?.assignmentScore ?? null
  gradeForm.finalScore = student?.finalScore ?? null
  gradeForm.makeupScore = student?.makeupScore ?? null
}

async function selectCourse(courseOfferingId: number) {
  selectedOfferingId.value = courseOfferingId
  selectedStudentId.value = undefined
  students.value = []
  setGradeForm(undefined)
  studentsStatus.value = 'pending'
  errorMessage.value = ''
  announcements.value = []
  announcementsStatus.value = 'idle'

  try {
    const response = await api.get<RegisteredStudent[]>(
      `/instructors/me/Responsible-Courses/${courseOfferingId}/Registered-Students`,
    )
    if (response.error.value)
      throw response.error.value
    students.value = response.data.value ?? []
    studentsStatus.value = 'success'
  }

  catch (error) {
    studentsStatus.value = 'error'
    errorMessage.value = getErrorMessage(error)
  }
}

async function loadAnnouncements() {
  if (!selectedOfferingId.value)
    return
  announcementsStatus.value = 'pending'
  try {
    const response = await api.get<Announcement[]>(
      `/instructors/me/Responsible-Courses/${selectedOfferingId.value}/Announcements`,
    )
    if (response.error.value)
      throw response.error.value
    announcements.value = response.data.value ?? []
    announcementsStatus.value = 'success'
  }
  catch (error) {
    announcementsStatus.value = 'error'
    errorMessage.value = getErrorMessage(error)
  }
}

async function createAnnouncement() {
  if (!selectedOfferingId.value)
    return
  announcementSaving.value = true
  notice.value = ''
  errorMessage.value = ''
  try {
    await api.post('/instructors/me/Announcements', {
      courseOfferingId: selectedOfferingId.value,
      title: announcementForm.title.trim(),
      content: announcementForm.content.trim(),
    })
    announcementForm.title = ''
    announcementForm.content = ''
    notice.value = 'Announcement created successfully.'
    await loadAnnouncements()
  }
  catch (error) {
    errorMessage.value = getErrorMessage(error)
  }
  finally {
    announcementSaving.value = false
  }
}

function selectStudent(studentId: number) {
  selectedStudentId.value = studentId
  setGradeForm(selectedStudent.value)
  notice.value = ''
  errorMessage.value = ''
}

async function saveGrades() {
  if (!selectedStudent.value)
    return

  const invalidScore = scoreFields.find(([field]) => {
    const score = gradeForm[field]
    return score !== null && (!Number.isFinite(score) || score < 0 || score > 100)
  })

  if (invalidScore) {
    errorMessage.value = `${invalidScore[1]} grade must be between 0 and 100.`
    notice.value = ''
    return
  }

  saving.value = true
  notice.value = ''
  errorMessage.value = ''
  try {
    const studentId = selectedStudent.value.studentId
    await api.post('/instructors/me/Enter-Grades', {
      enrollmentId: selectedStudent.value.enrollmentId,
      ...gradeForm,
    })
    await selectCourse(selectedOfferingId.value!)
    selectStudent(studentId)
    notice.value = 'Grades saved successfully.'
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
  <div class="space-y-6">
    <div>
      <p class="text-sm font-medium text-primary">
        Instructor workspace
      </p>
      <h1 class="mt-2 text-3xl font-semibold tracking-tight text-highlighted">
        Courses and grades
      </h1>
      <p class="mt-2 text-muted">
        Choose an active course offering, then select an enrolled student to add or update grades.
      </p>
    </div>

    <div class="flex gap-2 border-b border-default">
      <UButton
        label="My active offerings"
        icon="i-lucide-book-open"
        :variant="activeTab === 'courses' ? 'soft' : 'ghost'"
        @click="activeTab = 'courses'"
      />
      <UButton
        label="Student grades"
        icon="i-lucide-clipboard-pen-line"
        :variant="activeTab === 'grades' ? 'soft' : 'ghost'"
        :disabled="!selectedOfferingId"
        @click="activeTab = 'grades'"
      />
      <UButton
        label="Announcements"
        icon="i-lucide-megaphone"
        :variant="activeTab === 'announcements' ? 'soft' : 'ghost'"
        :disabled="!selectedOfferingId"
        @click="activeTab = 'announcements'; loadAnnouncements()"
      />
    </div>

    <UAlert v-if="notice" color="success" variant="subtle" :description="notice" />
    <UAlert v-if="errorMessage" color="error" variant="subtle" :description="errorMessage" />

    <UCard v-if="activeTab === 'courses'">
      <template #header>
        <h2 class="text-lg font-semibold text-highlighted">
          Active-semester course offerings
        </h2>
      </template>
      <div v-if="coursesStatus === 'pending'" class="flex justify-center py-10">
        <UIcon name="i-lucide-loader-circle" class="size-5 animate-spin text-primary" />
      </div>
      <div v-else-if="courses?.length" class="grid gap-4 md:grid-cols-2">
        <button
          v-for="course in courses"
          :key="course.courseOfferingId"
          type="button"
          class="rounded-xl border p-4 text-left transition-colors hover:border-primary hover:bg-primary/5"
          :class="selectedOfferingId === course.courseOfferingId ? 'border-primary bg-primary/5' : 'border-default'"
          @click="selectCourse(course.courseOfferingId)"
        >
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="font-semibold text-highlighted">
                {{ course.courseCode }}
              </p>
              <p class="mt-1 text-sm text-default">
                {{ course.courseName }}
              </p>
            </div>
            <UBadge color="primary" variant="subtle">
              {{ course.enrolledStudentsCount }}/{{ course.quota }}
            </UBadge>
          </div>
          <p class="mt-4 text-sm text-muted">
            {{ course.day }} · {{ course.startTime }}–{{ course.endTime }} · {{ course.classroom }}
          </p>
        </button>
      </div>
      <p v-else class="py-10 text-center text-sm text-muted">
        You have no active-semester course offerings.
      </p>
      <div v-if="selectedOfferingId" class="mt-6 flex justify-end">
        <div class="flex gap-2">
          <UButton label="Manage student grades" icon="i-lucide-arrow-right" @click="activeTab = 'grades'" />
          <UButton label="Manage announcements" icon="i-lucide-megaphone" variant="outline" @click="activeTab = 'announcements'; loadAnnouncements()" />
        </div>
      </div>
    </UCard>

    <UCard v-else-if="activeTab === 'grades'">
      <template #header>
        <div>
          <h2 class="text-lg font-semibold text-highlighted">
            {{ selectedCourse?.courseCode }} · {{ selectedCourse?.courseName }}
          </h2>
          <p class="mt-1 text-sm text-muted">
            Select an enrolled student to add or update their grades.
          </p>
        </div>
      </template>

      <div v-if="studentsStatus === 'pending'" class="flex justify-center py-10">
        <UIcon name="i-lucide-loader-circle" class="size-5 animate-spin text-primary" />
      </div>
      <div v-else-if="students.length" class="space-y-6">
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

        <div v-if="selectedStudent" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <UFormField label="Midterm" hint="0–100">
            <UInput v-model.number="gradeForm.midtermScore" type="number" min="0" max="100" step="0.01" />
          </UFormField>
          <UFormField label="Assignment" hint="0–100">
            <UInput v-model.number="gradeForm.assignmentScore" type="number" min="0" max="100" step="0.01" />
          </UFormField>
          <UFormField label="Final" hint="0–100">
            <UInput v-model.number="gradeForm.finalScore" type="number" min="0" max="100" step="0.01" />
          </UFormField>
          <UFormField label="Makeup" hint="0–100">
            <UInput v-model.number="gradeForm.makeupScore" type="number" min="0" max="100" step="0.01" />
          </UFormField>
        </div>

        <div v-if="selectedStudent" class="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-elevated p-4">
          <p class="text-sm text-muted">
            Current result:
            <span class="font-semibold text-highlighted">
              {{ selectedStudent.letterGrade ?? 'Not graded' }}
            </span>
            <span v-if="selectedStudent.totalScore !== null && selectedStudent.totalScore !== undefined">
              · {{ selectedStudent.totalScore.toFixed(2) }}/100
            </span>
          </p>
          <UButton label="Save grades" icon="i-lucide-save" :loading="saving" @click="saveGrades" />
        </div>
      </div>
      <p v-else class="py-10 text-center text-sm text-muted">
        No students are enrolled in this offering.
      </p>
    </UCard>

    <UCard v-else>
      <template #header>
        <div>
          <h2 class="text-lg font-semibold text-highlighted">
            {{ selectedCourse?.courseCode }} · Announcements
          </h2>
          <p class="mt-1 text-sm text-muted">
            Publish updates for students enrolled in this course offering.
          </p>
        </div>
      </template>

      <form class="space-y-4 border-b border-default pb-6" @submit.prevent="createAnnouncement">
        <UFormField label="Title" required>
          <UInput v-model="announcementForm.title" required maxlength="200" />
        </UFormField>
        <UFormField label="Announcement" required>
          <UTextarea v-model="announcementForm.content" required :rows="5" />
        </UFormField>
        <UButton
          type="submit"
          label="Publish announcement"
          icon="i-lucide-send"
          :loading="announcementSaving"
          :disabled="!announcementForm.title.trim() || !announcementForm.content.trim()"
        />
      </form>

      <div v-if="announcementsStatus === 'pending'" class="flex justify-center py-8">
        <UIcon name="i-lucide-loader-circle" class="size-5 animate-spin text-primary" />
      </div>
      <div v-else-if="announcements.length" class="mt-6 space-y-4">
        <article
          v-for="announcement in announcements"
          :key="announcement.id"
          class="rounded-xl border border-default p-4"
        >
          <div class="flex flex-wrap items-start justify-between gap-3">
            <h3 class="font-semibold text-highlighted">
              {{ announcement.title }}
            </h3>
            <time class="text-xs text-muted">
              {{ new Date(announcement.createdDate).toLocaleString() }}
            </time>
          </div>
          <p class="mt-3 whitespace-pre-wrap text-sm text-default">
            {{ announcement.content }}
          </p>
        </article>
      </div>
      <p v-else class="mt-6 py-8 text-center text-sm text-muted">
        No announcements have been published for this offering.
      </p>
    </UCard>
  </div>
</template>
