<script setup lang="ts">
import type { FetchError } from 'ofetch'
import type { CourseOffering, Enrollment, WeeklyScheduleItem } from '~/types/student'

definePageMeta({
  middleware: 'role',
  requiredRole: 'student',
})

useSeoMeta({
  title: 'Student courses | University Information System',
  description: 'Browse available course offerings and manage current enrollments.',
})

const api = useApi()

const { data: availableCourses, status: availableStatus, refresh: refreshAvailable } = await api.get<CourseOffering[]>('/students/me/open-courses')
const { data: enrollmentData, status: enrollmentStatus, refresh: refreshEnrollments } = await api.get<Record<string, unknown>[]>('/students/me/enrollments')
const { data: schedule, status: scheduleStatus, refresh: refreshSchedule } = await api.get<WeeklyScheduleItem[]>('/students/me/schedule')

const enrollingId = ref<number | null>(null)
const droppingId = ref<number | null>(null)
const actionError = ref('')
const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const

const scheduleByDay = computed(() => Object.fromEntries(
  weekDays.map(day => [
    day,
    (schedule.value ?? [])
      .filter(item => item.day.toLowerCase() === day.toLowerCase())
      .sort((a, b) => a.startTime.localeCompare(b.startTime)),
  ]),
) as Record<typeof weekDays[number], WeeklyScheduleItem[]>)

const enrollments = computed<Enrollment[]>(() => (enrollmentData.value ?? []).map(item => ({
  id: Number(item.courseOfferingId),
  courseOfferingId: Number(item.courseOfferingId),
  enrollmentId: Number(item.id),
  code: String(item.courseCode ?? ''),
  name: String(item.courseName ?? ''),
  credits: Number(item.credits ?? 0),
  quota: 0,
  availableSlots: 0,
  hasPrerequisite: false,
  day: String(item.day ?? ''),
  startTime: String(item.startTime ?? ''),
  endTime: String(item.endTime ?? ''),
  classroom: String(item.classroom ?? ''),
  instructorName: String(item.instructorName ?? ''),
  enrollmentDate: String(item.enrollmentDate ?? ''),
})))

function getErrorMessage(error: unknown) {
  const fetchError = error as FetchError<{ message?: string, detail?: string, title?: string }>
  return fetchError.data?.message
    ?? fetchError.data?.detail
    ?? fetchError.data?.title
    ?? 'The request could not be completed.'
}

async function enroll(offering: CourseOffering) {
  actionError.value = ''
  enrollingId.value = offering.courseOfferingId
  try {
    await api.post('/students/me/enroll', { courseOfferingId: offering.courseOfferingId })
    await Promise.all([refreshAvailable(), refreshEnrollments(), refreshSchedule()])
  }
  catch (error) {
    actionError.value = getErrorMessage(error)
  }
  finally {
    enrollingId.value = null
  }
}

async function drop(enrollment: Enrollment) {
  actionError.value = ''
  droppingId.value = enrollment.enrollmentId
  try {
    await api.delete(`/students/me/enrollments/${enrollment.enrollmentId}`)
    await Promise.all([refreshAvailable(), refreshEnrollments(), refreshSchedule()])
  }
  catch (error) {
    actionError.value = getErrorMessage(error)
  }
  finally {
    droppingId.value = null
  }
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <p class="text-sm font-medium text-primary">
        Student workspace
      </p>
      <h1 class="mt-2 text-3xl font-semibold tracking-tight text-highlighted">
        Courses and enrollment
      </h1>
      <p class="mt-2 text-muted">
        Choose an available offering and manage your current semester schedule.
      </p>
    </div>

    <UAlert
      v-if="actionError"
      color="error"
      variant="subtle"
      icon="i-lucide-circle-alert"
      :description="actionError"
    />

    <div class="grid gap-6 xl:grid-cols-2">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between gap-4">
            <div>
              <h2 class="text-lg font-semibold text-highlighted">
                Available offerings
              </h2>
              <p class="mt-1 text-sm text-muted">
                Open courses for the current semester.
              </p>
            </div>
            <UBadge color="primary" variant="subtle">
              {{ availableCourses?.length ?? 0 }}
            </UBadge>
          </div>
        </template>
        <EnrollmentCourseOfferingTable
          :offerings="availableCourses ?? []"
          :loading="availableStatus === 'pending'"
          :enrolling-id="enrollingId"
          @enroll="enroll"
        />
      </UCard>

      <UCard>
        <template #header>
          <div class="flex items-center justify-between gap-4">
            <div>
              <h2 class="text-lg font-semibold text-highlighted">
                My enrollments
              </h2>
              <p class="mt-1 text-sm text-muted">
                Courses you are taking this semester.
              </p>
            </div>
            <UBadge color="neutral" variant="subtle">
              {{ enrollments.length }}
            </UBadge>
          </div>
        </template>
        <StudentEnrollmentTable
          :enrollments="enrollments"
          :loading="enrollmentStatus === 'pending'"
          :dropping-id="droppingId"
          @drop="drop"
        />
      </UCard>
    </div>

    <UCard>
      <template #header>
        <div>
          <h2 class="text-lg font-semibold text-highlighted">
            Weekly schedule
          </h2>
          <p class="mt-1 text-sm text-muted">
            Your current semester timetable.
          </p>
        </div>
      </template>
      <div v-if="scheduleStatus === 'pending'" class="flex justify-center py-8">
        <UIcon name="i-lucide-loader-circle" class="size-5 animate-spin text-primary" />
      </div>
      <div v-else-if="schedule?.length" class="overflow-x-auto">
        <table class="min-w-225 w-full table-fixed">
          <thead>
            <tr class="border-b border-default">
              <th
                v-for="day in weekDays"
                :key="day"
                class="px-3 py-3 text-left text-sm font-semibold text-highlighted"
              >
                {{ day }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td
                v-for="day in weekDays"
                :key="day"
                class="align-top border-b border-default px-3 py-4"
              >
                <div v-if="scheduleByDay[day].length" class="space-y-3">
                  <div
                    v-for="item in scheduleByDay[day]"
                    :key="`${item.courseCode}-${item.startTime}`"
                    class="rounded-lg bg-primary/5 p-3"
                  >
                    <p class="font-semibold text-highlighted">
                      {{ item.courseCode }}
                    </p>
                    <p class="mt-1 text-sm text-default">
                      {{ item.courseName }}
                    </p>
                    <p class="mt-2 text-xs text-muted">
                      {{ item.startTime }}–{{ item.endTime }}
                    </p>
                    <p class="text-xs text-muted">
                      {{ item.classroom }} · {{ item.instructor }}
                    </p>
                  </div>
                </div>
                <p v-else class="text-sm text-muted">
                  No courses
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else>
        <p class="px-4 py-8 text-center text-sm text-muted">
          Your weekly schedule is empty.
        </p>
      </div>
    </UCard>
  </div>
</template>
