export interface UserProfile {
  id: number
  firstName: string
  lastName: string
  email: string
  roles: string[]
  departmentId?: number | null
  advisorId?: number | null
  createdAt: string
  isActive: boolean
}
