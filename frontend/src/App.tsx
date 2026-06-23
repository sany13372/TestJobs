import { useEffect } from 'react'
import { CreateJobForm } from './components/CreateJobForm'
import { JobsList } from './components/JobsList'
import { JobDetails } from './components/JobDetails'
import { useJobPolling } from './hooks/useJobPolling'
import { useJobsStore } from './store/jobsStore'
import styles from './App.module.scss'

function App() {
  const loadJobs = useJobsStore((s) => s.loadJobs)

  useEffect(() => {
    loadJobs()
  }, [loadJobs])

  useJobPolling()

  return (
    <div className={styles.app}>
      <header className={styles.topbar}>
        <h1>URL Checker</h1>
      </header>

      <div className={styles.body}>
        <JobDetails />

        <aside className={styles.rail}>
          <CreateJobForm />
          <JobsList />
        </aside>
      </div>
    </div>
  )
}

export default App
