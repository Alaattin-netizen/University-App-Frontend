export interface InstructorCourse {
  courseOfferingId: number
  courseCode: string
  courseName: string
  credits: number
  day: string
  startTime: string
  endTime: string
  classroom: string
  enrolledStudentsCount: number
  quota: number
}

export interface RegisteredStudent {
  studentId: number
  fullName: string
  email: string
  enrollmentId: number
  midtermScore?: number | null
  finalScore?: number | null
  assignmentScore?: number | null
  makeupScore?: number | null
  totalScore?: number | null
  letterGrade?: string | null
  gradePoint?: number | null
  attendanceCount: number
  totalClasses: number
  isPresent?: boolean | null
}

export interface Announcement {
  id: number
  title: string
  content: string
  createdDate: string
}

export interface InstructorMessage {
  id: number
  senderName: string
  senderEmail: string
  subject: string
  content: string
  sentDate: string
  isRead: boolean
}

export interface AttendanceOffering {
  courseOfferingId: number
  courseCode: string
  courseName: string
  day: string
  startTime: string
  endTime: string
  classroom: string
}

export interface AttendanceStudent {
  studentId: number
  fullName: string
  email: string
  attendanceCount: number
  totalClasses: number
}

export interface AttendanceImportResult {
  created: number
  updated: number
  errors: string[]
}
