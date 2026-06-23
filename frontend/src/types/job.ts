export type JobStatus =
  | 'pending'
  | 'in_progress'
  | 'paused'
  | 'completed'
  | 'cancelled'
  | 'failed'

export type UrlStatus =
  | 'pending'
  | 'in_progress'
  | 'success'
  | 'error'
  | 'cancelled'

export interface UrlResult {
  url: string
  status: UrlStatus
  httpStatus?: number
  errorMessage?: string
  startedAt?: string
  finishedAt?: string
  durationMs?: number
}

export interface JobSummary {
  id: string
  createdAt: string
  status: JobStatus
  urlCount: number
  stats: {
    success: number
    error: number
  }
}

export interface JobDetail {
  id: string
  createdAt: string
  status: JobStatus
  urls: UrlResult[]
}

const TERMINAL_JOB: JobStatus[] = ['completed', 'cancelled', 'failed', 'paused']
const TERMINAL_URL: UrlStatus[] = ['success', 'error', 'cancelled']

export const isJobFinished = (status: JobStatus) => TERMINAL_JOB.includes(status)
export const isUrlFinished = (status: UrlStatus) => TERMINAL_URL.includes(status)
