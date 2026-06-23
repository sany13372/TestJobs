import { useJobsStore } from '../../store/jobsStore'
import { isJobFinished, isUrlFinished } from '../../types/job'
import { shortId } from '../../lib/format'
import { StatusBadge } from '../StatusBadge'
import { JobProgress } from './JobProgress'
import { UrlTable } from './UrlTable'
import styles from './JobDetails.module.scss'

export function JobDetails() {
  const detail = useJobsStore((s) => s.detail)
  const loadingDetail = useJobsStore((s) => s.loadingDetail)
  const detailError = useJobsStore((s) => s.detailError)
  const cancelling = useJobsStore((s) => s.cancelling)
  const cancelActiveJob = useJobsStore((s) => s.cancelActiveJob)

  if (!detail) {
    return (
      <section className={styles.card}>
        <p className={styles.placeholder}>
          {loadingDetail
            ? 'Загрузка…'
            : 'Выберите задание справа или создайте новое.'}
        </p>
      </section>
    )
  }

  const processed = detail.urls.filter((u) => isUrlFinished(u.status)).length
  const finished = isJobFinished(detail.status)

  return (
    <section className={styles.card}>
      <div className={styles.head}>
        <div>
          <h2>
            Задание <code>{shortId(detail.id)}</code>
          </h2>
          <StatusBadge status={detail.status} />
        </div>
        <button
          className={styles.cancel}
          onClick={cancelActiveJob}
          disabled={finished || cancelling}
        >
          {cancelling ? 'Отмена…' : 'Отменить задание'}
        </button>
      </div>

      <JobProgress processed={processed} total={detail.urls.length} />

      {detailError && <p className={styles.error}>{detailError}</p>}

      <UrlTable urls={detail.urls} />
    </section>
  )
}
