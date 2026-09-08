<script setup lang="ts">
import type { FetchError } from 'ofetch'
import type { Department, UserRole } from '~/types/admin'
import type { Instructor } from '~/types/messages'

definePageMeta({
  middleware: 'role',
  requiredRole: 'admin',
})

useSeoMeta({
  title: 'Create users | University Information System',
  description: 'Create university accounts and assign their roles.',
})

const api = useApi()

const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  roles: ['Student'] as UserRole[],
  departmentId: null as number | null,
  advisorId: null as number | null,
})
const saving = ref(false)
const notice = ref('')
const errorMessage = ref('')
const departments = ref<Department[]>([])
const instructors = ref<Instructor[]>([])
const lookupLoading = ref(true)

const roleItems: Array<{ label: string, value: UserRole }> = [
  { label: 'Student', value: 'Student' },
  { label: 'Instructor', value: 'Instructor' },
  { label: 'Administrator', value: 'Admin' },
]

const departmentItems = computed(() => departments.value.map(department => ({
  label: `${department.name} (${department.id})`,
  value: department.id,
})))

const advisorItems = computed(() => instructors.value.map(instructor => ({
  label: `${instructor.firstName} ${instructor.lastName} (${instructor.email})`,
  value: instructor.id,
})))

onMounted(async () => {
  try {
    const [departmentResponse, instructorResponse] = await Promise.all([
      api.get<Department[]>('/departments'),
      api.get<Instructor[]>('/users', {
        query: { Roles: ['Instructor'] },
      }),
    ])
    if (departmentResponse.error.value)
      throw departmentResponse.error.value
    if (instructorResponse.error.value)
      throw instructorResponse.error.value
    departments.value = departmentResponse.data.value ?? []
    instructors.value = instructorResponse.data.value ?? []
  }
  catch (error) {
    errorMessage.value = getErrorMessage(error)
  }
  finally {
    lookupLoading.value = false
  }
})

function getErrorMessage(error: unknown) {
  const fetchError = error as FetchError<{ message?: string, errors?: Record<string, string[]> }>
  const validationMessage = Object.values(fetchError.data?.errors ?? {}).flat()[0]
  return validationMessage ?? fetchError.data?.message ?? 'The user could not be created.'
}

function resetForm() {
  form.firstName = ''
  form.lastName = ''
  form.email = ''
  form.password = ''
  form.roles = ['Student']
  form.departmentId = null
  form.advisorId = null
}

async function createUser() {
  notice.value = ''
  errorMessage.value = ''
  saving.value = true

  try {
    await api.post('/users', {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      password: form.password,
      roles: form.roles,
      departmentId: form.departmentId,
      advisorId: form.roles.includes('Student') ? form.advisorId : null,
    })

    notice.value = `${form.roles.join(', ')} account created successfully.`
    resetForm()
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
  <div class="max-w-3xl space-y-6">
    <div>
      <p class="text-sm font-medium text-primary">
        Administrator workspace
      </p>
      <h1 class="mt-2 text-3xl font-semibold tracking-tight text-highlighted">
        Create users
      </h1>
      <p class="mt-2 text-muted">
        Create a new university account and assign one or more roles.
      </p>
    </div>

    <UAlert v-if="notice" color="success" variant="subtle" :description="notice" />
    <UAlert v-if="errorMessage" color="error" variant="subtle" :description="errorMessage" />

    <UCard>
      <form class="space-y-5" @submit.prevent="createUser">
        <UFormField label="Roles" required>
          <USelectMenu
            v-model="form.roles"
            :items="roleItems"
            multiple
            value-key="value"
            label-key="label"
          />
        </UFormField>

        <div class="grid gap-5 sm:grid-cols-2">
          <UFormField label="First name" required>
            <UInput v-model="form.firstName" required autocomplete="given-name" />
          </UFormField>
          <UFormField label="Last name" required>
            <UInput v-model="form.lastName" required autocomplete="family-name" />
          </UFormField>
        </div>

        <UFormField label="Email" required>
          <UInput v-model="form.email" type="email" required autocomplete="email" />
        </UFormField>

        <UFormField label="Password" required>
          <UInput v-model="form.password" type="password" required minlength="6" autocomplete="new-password" />
        </UFormField>

        <div v-if="form.roles.includes('Student') || form.roles.includes('Instructor')" class="grid gap-5 sm:grid-cols-2">
          <UFormField label="Department" :required="form.roles.includes('Instructor')" hint="Required when the Instructor role is selected.">
            <USelectMenu
              v-model="form.departmentId"
              :items="departmentItems"
              value-key="value"
              label-key="label"
              placeholder="Choose a department"
              :loading="lookupLoading"
              clear
            />
          </UFormField>
          <UFormField v-if="form.roles.includes('Student')" label="Advisor (optional)" hint="Choose an existing instructor.">
            <USelectMenu
              v-model="form.advisorId"
              :items="advisorItems"
              value-key="value"
              label-key="label"
              placeholder="Choose an advisor"
              :loading="lookupLoading"
              clear
            />
          </UFormField>
        </div>

        <UButton type="submit" label="Create account" icon="i-lucide-user-plus" :loading="saving" />
      </form>
    </UCard>
  </div>
</template>
