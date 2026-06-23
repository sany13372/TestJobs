import { create } from 'zustand'
import axios from 'axios'
import * as api from '../api/jobs'
import type { JobDetail, JobSummary } from '../types/job'

interface JobsState {
  jobs: JobSummary[]
  activeJobId: string | null
  detail: JobDetail | null

  loadingJobs: boolean
  loadingDetail: boolean
  creating: boolean
  cancelling: boolean

  listError: string | null
  detailError: string | null
  formError: string | null

  loadJobs: () => Promise<void>
  submitJob: (urls: string[]) => Promise<void>
  selectJob: (id: string) => void
  refreshDetail: (id: string) => Promise<void>
  cancelActiveJob: () => Promise<void>
}

function message(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string | string[] } | undefined
    const m = data?.message
    if (Array.isArray(m)) return m.join(', ')
    if (m) return m
    return err.message
  }
  return err instanceof Error ? err.message : 'Что-то пошло не так'
}

export const useJobsStore = create<JobsState>((set, get) => ({
  jobs: [],
  activeJobId: null,
  detail: null,

  loadingJobs: false,
  loadingDetail: false,
  creating: false,
  cancelling: false,

  listError: null,
  detailError: null,
  formError: null,

  async loadJobs() {
    set({ loadingJobs: true, listError: null })
    try {
      set({ jobs: await api.fetchJobs() })
    } catch (err) {
      set({ listError: message(err) })
    } finally {
      set({ loadingJobs: false })
    }
  },

  async submitJob(urls) {
    set({ creating: true, formError: null })
    try {
      const { jobId } = await api.createJob(urls)
      get().selectJob(jobId)
      await get().loadJobs()
    } catch (err) {
      set({ formError: message(err) })
    } finally {
      set({ creating: false })
    }
  },

  selectJob(id) {
    const prev = get().activeJobId
    if (prev === id) return
    // switching jobs: drop the previous detail so stale data isn't shown
    set({ activeJobId: id, detail: null, detailError: null })
    // уходя с задания — останавливаем его обработку (бэкенд игнорит завершённые)
    if (prev) void api.pauseJob(prev)
  },

  async refreshDetail(id) {
    const isFirstLoad = get().detail?.id !== id
    if (isFirstLoad) set({ loadingDetail: true })

    try {
      const detail = await api.fetchJob(id)
      // ignore the response if the user already switched to another job
      if (get().activeJobId !== id) return
      set({ detail, detailError: null })
    } catch (err) {
      if (get().activeJobId !== id) return
      set({ detailError: message(err) })
    } finally {
      if (get().activeJobId === id) set({ loadingDetail: false })
    }
  },

  async cancelActiveJob() {
    const id = get().activeJobId
    if (!id) return

    set({ cancelling: true })
    try {
      await api.cancelJob(id)
      await get().refreshDetail(id)
      await get().loadJobs()
    } catch (err) {
      if (get().activeJobId === id) set({ detailError: message(err) })
    } finally {
      set({ cancelling: false })
    }
  },
}))
