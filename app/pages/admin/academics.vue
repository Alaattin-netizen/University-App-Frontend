<script setup lang="ts">
import type { FetchError } from 'ofetch'
import type { Course, Department, Faculty, Semester } from '~/types/admin'
import type { Instructor } from '~/types/messages'

definePageMeta({
  middleware: 'role',
  requiredRole: 'admin',
})

useSeoMeta({
  title: 'Academic structure | University Information System',
  description: 'Create faculties, departments, and courses.',
})

const api = useApi()

const { data: faculties, refresh: refreshFaculties } = await api.get<Faculty[]>('/faculties')
const { data: departments, refresh: refreshDepartments } = await api.get<Department[]>('/departments')
const { data: courses, refresh: refreshCourses } = await api.get<Course[]>('/courses')
const { data: instructors } = await api.get<Instructor[]>('/users', {
  query: { Roles: ['Instructor'] },
})
const { data: semesters } = await api.get<Semester[]>('/semesters')

const facultyForm = reactive({ name: '', deanName: '' })
const departmentForm = reactive({ name: '', facultyId: undefined as number | undefined })
const courseForm = reactive({
  code: '',
  name: '',
  credits: 0,
  ects: 0,
  quota: 0,
  departmentId: undefined as number | undefined,
  prerequisiteCourseId: undefined as number | undefined,
  isMandatory: false,
})
const offeringForm = reactive({
  courseId: undefined as number | undefined,
  instructorId: undefined as number | undefined,
  semesterId: undefined as number | undefined,
  day: 1,
  startTime: '09:00',
  endTime: '10:00',
  classroom: '',
})
const saving = ref(false)
const notice = ref('')
const errorMessage = ref('')

const facultyItems = computed(() => (faculties.value ?? []).map(faculty => ({
  label: faculty.name,
  value: faculty.id,
})))
const departmentItems = computed(() => (departments.value ?? []).map(department => ({
  label: `${department.name} (${department.facultyName ?? 'No faculty'})`,
  value: department.id,
})))
const prerequisiteItems = computed(() => (courses.value ?? []).map(course => ({
  label: `${course.code} - ${course.name}`,
  value: course.id,
})))
const courseItems = computed(() => (courses.value ?? []).map(course => ({
  label: `${course.code} - ${course.name}`,
  value: course.id,
})))
const instructorItems = computed(() => (instructors.value ?? []).map(instructor => ({
  label: `${instructor.firstName} ${instructor.lastName}`,
  value: instructor.id,
  description: instructor.email,
})))
const semesterItems = computed(() => (semesters.value ?? []).map(semester => ({
  label: semester.name,
  value: semester.id,
})))
const dayItems = [
  { label: 'Sunday', value: 0 },
  { label: 'Monday', value: 1 },
  { label: 'Tuesday', value: 2 },
  { label: 'Wednesday', value: 3 },
  { label: 'Thursday', value: 4 },
  { label: 'Friday', value: 5 },
  { label: 'Saturday', value: 6 },
]

function getErrorMessage(error: unknown) {
  const fetchError = error as FetchError<{ message?: string, errors?: Record<string, string[]> }>
  return Object.values(fetchError.data?.errors ?? {}).flat()[0]
    ?? fetchError.data?.message
    ?? 'The request could not be completed.'
}

function clearMessages() {
  notice.value = ''
  errorMessage.value = ''
}

async function createResource(endpoint: string, body: object, successMessage: string, refreshResource: () => Promise<unknown>) {
  clearMessages()
  saving.value = true
  try {
    await api.post(endpoint, body)
    notice.value = successMessage
    await refreshResource()
  }
  catch (error) {
    errorMessage.value = getErrorMessage(error)
  }
  finally {
    saving.value = false
  }
}

async function createFaculty() {
  await createResource('/faculties', {
    name: facultyForm.name.trim(),
    deanName: facultyForm.deanName.trim() || null,
  }, 'Faculty created successfully.', refreshFaculties)
  facultyForm.name = ''
  facultyForm.deanName = ''
}

async function createDepartment() {
  if (!departmentForm.facultyId) {
    errorMessage.value = 'Choose a faculty for the department.'
    return
  }
  await createResource('/departments', {
    name: departmentForm.name.trim(),
    facultyId: departmentForm.facultyId,
  }, 'Department created successfully.', async () => {
    await Promise.all([refreshDepartments(), refreshFaculties])
  })
  departmentForm.name = ''
  departmentForm.facultyId = undefined
}

async function createCourse() {
  if (!courseForm.departmentId) {
    errorMessage.value = 'Choose a department for the course.'
    return
  }
  await createResource('/courses', {
    code: courseForm.code.trim(),
    name: courseForm.name.trim(),
    credits: courseForm.credits,
    ects: courseForm.ects,
    quota: courseForm.quota,
    departmentId: courseForm.departmentId ?? undefined,
    prerequisiteCourseId: courseForm.prerequisiteCourseId ?? undefined,
    isMandatory: courseForm.isMandatory,
  }, 'Course created successfully.', async () => {
    await Promise.all([refreshCourses(), refreshDepartments()])
  })
  courseForm.code = ''
  courseForm.name = ''
  courseForm.credits = 0
  courseForm.ects = 0
  courseForm.quota = 0
  courseForm.departmentId = undefined
  courseForm.prerequisiteCourseId = undefined
  courseForm.isMandatory = false
}

async function createOffering() {
  if (!offeringForm.courseId || !offeringForm.instructorId || !offeringForm.semesterId) {
    errorMessage.value = 'Choose a course, instructor, and semester.'
    return
  }
  await createResource('/course-offerings', { ...offeringForm }, 'Course offering created successfully.', async () => {})
  offeringForm.courseId = undefined
  offeringForm.instructorId = undefined
  offeringForm.semesterId = undefined
  offeringForm.day = 1
  offeringForm.startTime = '09:00'
  offeringForm.endTime = '10:00'
  offeringForm.classroom = ''
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <p class="text-sm font-medium text-primary">Administrator workspace</p>
      <h1 class="mt-2 text-3xl font-semibold tracking-tight text-highlighted">Academic structure</h1>
      <p class="mt-2 text-muted">Create faculties, departments, and courses for the university.</p>
    </div>

    <UAlert v-if="notice" color="success" variant="subtle" :description="notice" />
    <UAlert v-if="errorMessage" color="error" variant="subtle" :description="errorMessage" />

    <UTabs
      :items="[
        { label: 'Faculty', icon: 'i-lucide-building-2', slot: 'faculty' },
        { label: 'Department', icon: 'i-lucide-network', slot: 'department' },
        { label: 'Course', icon: 'i-lucide-book-open', slot: 'course' },
        { label: 'Offering', icon: 'i-lucide-calendar-plus', slot: 'offering' },
      ]"
    >
      <template #faculty>
        <UCard class="mt-4">
          <form class="max-w-xl space-y-4" @submit.prevent="createFaculty">
            <UFormField label="Faculty name" required>
              <UInput v-model="facultyForm.name" required />
            </UFormField>
            <UFormField label="Dean name">
              <UInput v-model="facultyForm.deanName" />
            </UFormField>
            <UButton type="submit" label="Create faculty" icon="i-lucide-plus" :loading="saving" />
          </form>
        </UCard>
      </template>

      <template #offering>
        <UCard class="mt-4">
          <form class="space-y-4" @submit.prevent="createOffering">
            <div class="grid gap-4 sm:grid-cols-2">
              <UFormField label="Course" required>
                <USelectMenu v-model="offeringForm.courseId" :items="courseItems" value-key="value" label-key="label" placeholder="Choose a course" />
              </UFormField>
              <UFormField label="Instructor" required>
                <USelectMenu v-model="offeringForm.instructorId" :items="instructorItems" value-key="value" label-key="label" placeholder="Choose an instructor" />
              </UFormField>
              <UFormField label="Semester" required>
                <USelectMenu v-model="offeringForm.semesterId" :items="semesterItems" value-key="value" label-key="label" placeholder="Choose a semester" />
              </UFormField>
              <UFormField label="Day" required>
                <USelectMenu v-model="offeringForm.day" :items="dayItems" value-key="value" label-key="label" />
              </UFormField>
              <UFormField label="Start time" required>
                <UInput v-model="offeringForm.startTime" type="time" required />
              </UFormField>
              <UFormField label="End time" required>
                <UInput v-model="offeringForm.endTime" type="time" required />
              </UFormField>
              <UFormField label="Classroom" required>
                <UInput v-model="offeringForm.classroom" required />
              </UFormField>
            </div>
            <UButton type="submit" label="Create course offering" icon="i-lucide-plus" :loading="saving" />
          </form>
        </UCard>
      </template>

      <template #department>
        <UCard class="mt-4">
          <form class="max-w-xl space-y-4" @submit.prevent="createDepartment">
            <UFormField label="Department name" required>
              <UInput v-model="departmentForm.name" required />
            </UFormField>
            <UFormField label="Faculty" required>
              <USelectMenu v-model="departmentForm.facultyId" :items="facultyItems" value-key="value" label-key="label" placeholder="Choose a faculty" />
            </UFormField>
            <UButton type="submit" label="Create department" icon="i-lucide-plus" :loading="saving" />
          </form>
        </UCard>
      </template>

      <template #course>
        <UCard class="mt-4">
          <form class="space-y-4" @submit.prevent="createCourse">
            <div class="grid gap-4 sm:grid-cols-2">
              <UFormField label="Course code" required>
                <UInput v-model="courseForm.code" required />
              </UFormField>
              <UFormField label="Course name" required>
                <UInput v-model="courseForm.name" required />
              </UFormField>
              <UFormField label="Credits" required>
                <UInput v-model.number="courseForm.credits" type="number" min="1" required />
              </UFormField>
              <UFormField label="ECTS" required>
                <UInput v-model.number="courseForm.ects" type="number" min="1" required />
              </UFormField>
              <UFormField label="Quota" required>
                <UInput v-model.number="courseForm.quota" type="number" min="1" required />
              </UFormField>
              <UFormField label="Department" required>
                <USelectMenu v-model="courseForm.departmentId" :items="departmentItems" value-key="value" label-key="label" placeholder="Choose a department" />
              </UFormField>
            </div>
            <UFormField label="Prerequisite course">
              <USelectMenu v-model="courseForm.prerequisiteCourseId" :items="prerequisiteItems" value-key="value" label-key="label" placeholder="No prerequisite" clear />
            </UFormField>
            <USwitch v-model="courseForm.isMandatory" label="Mandatory course" />
            <UButton type="submit" label="Create course" icon="i-lucide-plus" :loading="saving" />
          </form>
        </UCard>
      </template>
    </UTabs>
  </div>
</template>
