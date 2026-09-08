<script setup lang="ts">
import type { GpaSummary, TranscriptEntry } from '~/types/grades'

definePageMeta({
  middleware: 'role',
  requiredRole: 'student',
})

useSeoMeta({
  title: 'Grades and transcript | University Information System',
  description: 'View your GPA and academic transcript.',
})

const config = useRuntimeConfig()
const { data: gpa, status: gpaStatus } = await useFetch<GpaSummary>('/students/me/gpa', {
  baseURL: config.public.apiBase,
  credentials: 'include',
  server: false,
})
const { data: transcript, status: transcriptStatus } = await useFetch<TranscriptEntry[]>('/students/me/transcript', {
  baseURL: config.public.apiBase,
  credentials: 'include',
  server: false,
})

function formatScore(score: number | null | undefined) {
  return score === null || score === undefined ? '—' : score.toFixed(2)
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <p class="text-sm font-medium text-primary">
        Student records
      </p>
      <h1 class="mt-2 text-3xl font-semibold tracking-tight text-highlighted">
        Grades and transcript
      </h1>
      <p class="mt-2 text-muted">
        Review your current GPA and every graded or in-progress enrollment.
      </p>
    </div>

    <div v-if="gpaStatus === 'pending'" class="grid gap-4 sm:grid-cols-3">
      <USkeleton v-for="item in 3" :key="item" class="h-28 rounded-xl" />
    </div>
    <div v-else class="grid gap-4 sm:grid-cols-3">
      <UCard>
        <p class="text-sm text-muted">
          Current semester GPA
        </p>
        <p class="mt-2 text-3xl font-semibold text-highlighted">
          {{ gpa?.semesterGPA?.toFixed(2) ?? '0.00' }}
        </p>
      </UCard>
      <UCard>
        <p class="text-sm text-muted">
          Cumulative GPA
        </p>
        <p class="mt-2 text-3xl font-semibold text-primary">
          {{ gpa?.cumulativeGPA?.toFixed(2) ?? '0.00' }}
        </p>
      </UCard>
      <UCard>
        <p class="text-sm text-muted">
          Total credits
        </p>
        <p class="mt-2 text-3xl font-semibold text-highlighted">
          {{ gpa?.totalCredits ?? 0 }}
        </p>
      </UCard>
    </div>

    <UCard>
      <template #header>
        <h2 class="text-lg font-semibold text-highlighted">
          Academic transcript
        </h2>
        <p class="mt-1 text-sm text-muted">
          Scores and final results for all active enrollments across semesters.
        </p>
      </template>

      <div v-if="transcriptStatus === 'pending'" class="flex justify-center py-10">
        <UIcon name="i-lucide-loader-circle" class="size-5 animate-spin text-primary" />
      </div>
      <div v-else-if="transcript?.length" class="overflow-x-auto">
        <table class="min-w-275 w-full text-left">
          <thead>
            <tr class="border-b border-default">
              <th v-for="heading in ['Semester', 'Course', 'Credits', 'Midterm', 'Assignment', 'Makeup', 'Final', 'Total', 'Grade', 'Points']" :key="heading" class="px-3 py-3 text-sm font-semibold text-highlighted">
                {{ heading }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="entry in transcript" :key="`${entry.semesterName}-${entry.courseCode}`" class="border-b border-default last:border-0">
              <td class="whitespace-nowrap px-3 py-4 text-sm text-muted">
                {{ entry.semesterName }}
              </td>
              <td class="px-3 py-4">
                <p class="font-semibold text-highlighted">
                  {{ entry.courseCode }}
                </p>
                <p class="text-sm text-muted">
                  {{ entry.courseName }}
                </p>
              </td>
              <td class="px-3 py-4">
                {{ entry.credits }}
              </td>
              <td class="px-3 py-4">
                {{ formatScore(entry.midterm) }}
              </td>
              <td class="px-3 py-4">
                {{ formatScore(entry.assignment) }}
              </td>
              <td class="px-3 py-4">
                {{ formatScore(entry.makeup) }}
              </td>
              <td class="px-3 py-4">
                {{ formatScore(entry.final) }}
              </td>
              <td class="px-3 py-4">
                {{ formatScore(entry.totalScore) }}
              </td>
              <td class="px-3 py-4 font-semibold">
                {{ entry.letterGrade ?? 'In progress' }}
              </td>
              <td class="px-3 py-4">
                {{ entry.gradePoint ? entry.gradePoint.toFixed(2) : '—' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else class="py-10 text-center text-sm text-muted">
        No transcript records are available yet.
      </p>
    </UCard>
  </div>
</template>
