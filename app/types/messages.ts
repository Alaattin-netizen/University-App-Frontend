export interface Instructor {
  id: number
  firstName: string
  lastName: string
  email: string
}

export interface StudentMessage {
  id: number
  receiverName: string
  subject: string
  content: string
  sentDate: string
  isRead: boolean
}
