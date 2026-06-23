import { useJobsStore } from '../../store/jobsStore'
import { formatDate, shortId } from '../../lib/format'
import { StatusBadge } from '../StatusBadge'
import styles from './JobsList.module.scss'

export function JobsList() {
  const jobs = useJobsStore((s) => s.jobs)
  const activeJobId = useJobsStore((s) => s.activeJobId)
  const loadingJobs = useJobsStore((s) => s.loadingJobs)
  const listError = useJobsStore((s) => s.listError)
  const selectJob = useJobsStore((s) => s.selectJob)

  return (
    <section className={styles.card}>
      <div className={styles.head}>
        <h2>Задания</h2>
        {loadingJobs && <span>обновление…</span>}
      </div>

      {listError && <p className={styles.error}>{listError}</p>}

      {!listError && jobs.length === 0 && (
        <p className={styles.empty}>Пока нет заданий.</p>
      )}

      <ul className={styles.list}>
        {jobs.map((job) => (
          <li key={job.id}>
            <button
              className={`${styles.item} ${job.id === activeJobId ? styles.active : ''}`}
              onClick={() => selectJob(job.id)}
            >
              <div className={styles.top}>
                <code>{shortId(job.id)}</code>
                <StatusBadge status={job.status} />
              </div>
              <div className={styles.date}>{formatDate(job.createdAt)}</div>
              <div className={styles.stats}>
                <span>URL: {job.urlCount}</span>
                <span className={styles.ok}>✓ {job.stats.success}</span>
                <span className={styles.bad}>✕ {job.stats.error}</span>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
