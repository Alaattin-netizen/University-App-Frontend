<script setup lang="ts">
import type { FetchError } from 'ofetch'
import type { Semester, SemesterForm } from '~/types/admin'

definePageMeta({
  middleware: 'role',
  requiredRole: 'admin',
})

useSeoMeta({
  title: 'Manage semesters | University Information System',
  description: 'Activate semesters and update academic and registration dates.',
})

const api = useApi()

const { data: semesterData, status, refresh } = await api.get<Semester[]>('/semesters')
const forms = reactive<Record<number, SemesterForm>>({})
const savingId = ref<number | null>(null)
const notice = ref('')
const errorMessage = ref('')
const selectedSemesterId = ref<number | undefined>()

const semesters = computed(() => semesterData.value ?? [])
const semesterTabs = computed(() => semesters.value.map(semester => ({
  label: semester.name,
  value: semester.id,
})))
const selectedSemester = computed(() => semesters.value.find(semester => semester.id === selectedSemesterId.value))

function toDateTimeInput(value: string) {
  return value ? value.slice(0, 16) : ''
}

function toIso(value: string) {
  return new Date(value).toISOString()
}

function syncForms(items: Semester[]) {
  for (const semester of items) {
    forms[semester.id] = {
      name: semester.name,
      startDate: toDateTimeInput(semester.startDate),
      endDate: toDateTimeInput(semester.endDate),
      registrationStart: toDateTimeInput(semester.registrationStart),
      registrationEnd: toDateTimeInput(semester.registrationEnd),
      isActive: semester.isActive,
    }
    if (!items.some(semester => semester.id === selectedSemesterId.value))
      selectedSemesterId.value = items.find(semester => semester.isActive)?.id ?? items[0]?.id
  }
}

function getForm(id: number) {
  const form = forms[id]
  if (!form)
    throw new Error(`Semester form ${id} is not initialized.`)
  return form
}

watch(semesterData, (items) => {
  if (items)
    syncForms(items)
}, { immediate: true })

function getErrorMessage(error: unknown) {
  const fetchError = error as FetchError<{ message?: string, errors?: Record<string, string[]> }>
  const validationMessage = Object.values(fetchError.data?.errors ?? {}).flat()[0]
  return validationMessage ?? fetchError.data?.message ?? 'The semester could not be updated.'
}

function validateForm(form: SemesterForm) {
  if (!form.name.trim())
    return 'Semester name is required.'
  if (!form.startDate || !form.endDate || !form.registrationStart || !form.registrationEnd)
    return 'All semester and registration dates are required.'
  if (new Date(form.endDate) <= new Date(form.startDate))
    return 'The semester end date must be after its start date.'
  if (new Date(form.registrationEnd) <= new Date(form.registrationStart))
    return 'Registration end must be after registration start.'
  return ''
}

function setActive(semesterId: number, isActive: boolean) {
  if (!isActive)
    return

  for (const semester of semesters.value) {
    if (semester.id !== semesterId)
      getForm(semester.id).isActive = false
  }
}

async function saveSemester(semester: Semester) {
  notice.value = ''
  errorMessage.value = ''
  const form = getForm(semester.id)
  const validationError = validateForm(form)
  if (validationError) {
    errorMessage.value = validationError
    return
  }

  savingId.value = semester.id
  try {
    await api.put('/semesters', {
      id: semester.id,
      name: form.name.trim(),
      startDate: toIso(form.startDate),
      endDate: toIso(form.endDate),
      registrationStart: toIso(form.registrationStart),
      registrationEnd: toIso(form.registrationEnd),
      isActive: form.isActive,
    })
    notice.value = `${form.name} was updated successfully.`
    await refresh()
  }
  catch (error) {
    errorMessage.value = getErrorMessage(error)
  }
  finally {
    savingId.value = null
  }
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <p class="text-sm font-medium text-primary">
        Administrator workspace
      </p>
      <h1 class="mt-2 text-3xl font-semibold tracking-tight text-highlighted">
        Manage semesters
      </h1>
      <p class="mt-2 text-muted">
        Activate one semester at a time and update academic and registration dates.
      </p>
    </div>

    <UAlert v-if="notice" color="success" variant="subtle" :description="notice" />
    <UAlert v-if="errorMessage" color="error" variant="subtle" :description="errorMessage" />

    <div v-if="status === 'pending'" class="grid gap-6 lg:grid-cols-2">
      <USkeleton v-for="index in 2" :key="index" class="h-96 rounded-xl" />
    </div>
    <p v-else-if="!semesters.length" class="rounded-xl border border-dashed border-default p-8 text-center text-muted">
      No semesters have been created yet.
    </p>
    <div v-else class="space-y-4">
      <UTabs v-model="selectedSemesterId" :items="semesterTabs" value-key="value" />

      <UCard v-if="selectedSemester">
        <template #header>
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-xs text-muted">
                Semester #{{ selectedSemester.id }}
              </p>
              <h2 class="mt-1 text-xl font-semibold text-highlighted">
                {{ selectedSemester.name }}
              </h2>
            </div>
            <UBadge :color="getForm(selectedSemester.id).isActive ? 'success' : 'neutral'" variant="subtle">
              {{ getForm(selectedSemester.id).isActive ? 'Active' : 'Inactive' }}
            </UBadge>
          </div>
        </template>

        <form class="space-y-4" @submit.prevent="saveSemester(selectedSemester)">
          <UFormField label="Name" required>
            <UInput v-model="getForm(selectedSemester.id).name" required />
          </UFormField>

          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField label="Semester starts" required>
              <UInput v-model="getForm(selectedSemester.id).startDate" type="datetime-local" required />
            </UFormField>
            <UFormField label="Semester ends" required>
              <UInput v-model="getForm(selectedSemester.id).endDate" type="datetime-local" required />
            </UFormField>
            <UFormField label="Registration starts" required>
              <UInput v-model="getForm(selectedSemester.id).registrationStart" type="datetime-local" required />
            </UFormField>
            <UFormField label="Registration ends" required>
              <UInput v-model="getForm(selectedSemester.id).registrationEnd" type="datetime-local" required />
            </UFormField>
          </div>

          <div class="flex items-center justify-between gap-4 border-t border-default pt-4">
            <div class="text-sm text-muted">
              {{ selectedSemester.courseOfferingCount }} offerings · {{ selectedSemester.enrollmentCount }} enrollments
            </div>
            <div class="flex items-center gap-3">
              <USwitch
                v-model="getForm(selectedSemester.id).isActive"
                label="Active"
                @update:model-value="setActive(selectedSemester.id, $event)"
              />
              <UButton type="submit" label="Save changes" icon="i-lucide-save" :loading="savingId === selectedSemester.id" />
            </div>
          </div>
        </form>
      </UCard>
    </div>
  </div>
</template>
