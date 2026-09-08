export interface CourseOffering {
  id: number
  courseOfferingId: number
  code: string
  name: string
  credits: number
  quota: number
  availableSlots: number
  hasPrerequisite: boolean
  prerequisiteCode?: string
  day: string
  startTime: string
  endTime: string
  classroom: string
  instructorName: string
}

export interface Enrollment extends CourseOffering {
  enrollmentId: number
  enrollmentDate: string
}

export interface WeeklyScheduleItem {
  day: string
  startTime: string
  endTime: string
  courseCode: string
  courseName: string
  instructor: string
  classroom: string
}
