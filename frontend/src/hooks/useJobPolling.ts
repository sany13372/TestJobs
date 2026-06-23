import { useEffect } from 'react'
import { useJobsStore } from '../store/jobsStore'
import { isJobFinished } from '../types/job'

const POLL_INTERVAL = 1500

export function useJobPolling() {
  const activeJobId = useJobsStore((s) => s.activeJobId)

  useEffect(() => {
    if (!activeJobId) return

    let stopped = false
    let timer: ReturnType<typeof setTimeout>

    const { refreshDetail, loadJobs } = useJobsStore.getState()

    const tick = async () => {
      await refreshDetail(activeJobId)
      if (stopped) return

      const { detail } = useJobsStore.getState()
      if (detail && detail.id === activeJobId && !isJobFinished(detail.status)) {
        loadJobs()
        timer = setTimeout(tick, POLL_INTERVAL)
      }
    }

    tick()

    return () => {
      stopped = true
      clearTimeout(timer)
    }
  }, [activeJobId])
}