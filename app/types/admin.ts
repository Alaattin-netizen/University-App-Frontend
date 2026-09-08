export interface Faculty {
  id: number
  name: string
  deanName?: string
  departmentCount: number
}

export interface Department {
  id: number
  name: string
  facultyId?: number
  facultyName?: string
}

export interface Course {
  id: number
  code: string
  name: string
  credits: number
  ects: number
  quota: number
  departmentId?: number
  departmentName?: string
  prerequisiteCourseId?: number
  prerequisiteCode?: string
}

export interface Semester {
  id: number
  name: string
  startDate: string
  endDate: string
  registrationStart: string
  registrationEnd: string
  isActive: boolean
  courseOfferingCount: number
  enrollmentCount: number
}

export interface SemesterOption {
  id: number
  name: string
}

export interface SemesterForm {
  name: string
  startDate: string
  endDate: string
  registrationStart: string
  registrationEnd: string
  isActive: boolean
}

export interface AuditLog {
  id: number
  userId: number
  userEmail: string
  userRole: string
  action: string
  entityType: string
  entityId?: number
  details?: string
  timestamp: string
  ipAddress?: string
}

export type UserRole = 'Student' | 'Instructor' | 'Admin'
