import type { JobStatus, UrlStatus } from '../../types/job'
import styles from './StatusBadge.module.scss'

const LABELS: Record<JobStatus | UrlStatus, string> = {
  pending: 'Ожидает',
  in_progress: 'В работе',
  paused: 'Остановлено',
  completed: 'Завершено',
  cancelled: 'Отменено',
  failed: 'Ошибка',
  success: 'Успех',
  error: 'Ошибка',
}

export function StatusBadge({ status }: { status: JobStatus | UrlStatus }) {
  return (
    <span className={`${styles.badge} ${styles[status]}`}>{LABELS[status]}</span>
  )
}
