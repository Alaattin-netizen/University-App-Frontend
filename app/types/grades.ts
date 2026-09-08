export interface GpaSummary {
  semesterGPA: number
  cumulativeGPA: number
  totalCredits: number
}

export interface TranscriptEntry {
  courseCode: string
  courseName: string
  credits: number
  midterm?: number | null
  assignment?: number | null
  makeup?: number | null
  final?: number | null
  totalScore?: number | null
  letterGrade?: string | null
  gradePoint: number
  semesterName: string
}
