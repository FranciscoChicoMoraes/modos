export interface Candidate {
  id: string
  platform_id: string
  name: string
  email: string
  phone?: string
  whatsapp?: string
  company_name?: string
  resume_url?: string
  experience_years?: number
  skills: string[]
  areas: string[]
  avatar_url?: string
  stage: 'curriculum' | 'interview' | 'test' | 'hired'
  created_at: string
  age?: number
  gender?: 'male' | 'female' | 'other'
  resume: string
  social_media: {
    instagram?: string
    linkedin?: string
    facebook?: string
  }
  archived: boolean
  archive_reason?: 'gave_up' | 'other'
  interview_scheduled?: {
    date: string
    time: string
    meet_link?: string
  }
}

export interface Job {
  id: string
  title: string
  description: string
  questions: Question[]
  created_at: string
  share_link?: string
}

export interface Question {
  id: string
  text: string
  type: 'text' | 'textarea' | 'select'
  required: boolean
  options?: string[]
}
