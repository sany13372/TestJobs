import axios from 'axios'
import type { JobDetail, JobSummary } from '../types/job'

const api = axios.create({ baseURL: '/api' })

export const fetchJobs = () =>
  api.get<JobSummary[]>('/jobs').then((r) => r.data)

export const fetchJob = (id: string) =>
  api.get<JobDetail>(`/jobs/${id}`).then((r) => r.data)

export const createJob = (urls: string[]) =>
  api.post<{ jobId: string }>('/jobs', { urls }).then((r) => r.data)

export const cancelJob = (id: string) => api.delete(`/jobs/${id}`)

export const pauseJob = (id: string) => api.post(`/jobs/${id}/pause`)