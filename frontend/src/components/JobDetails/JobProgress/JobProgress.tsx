import styles from './JobProgress.module.scss'

interface JobProgressProps {
  processed: number
  total: number
}

export function JobProgress({ processed, total }: JobProgressProps) {
  const percent = total === 0 ? 0 : Math.round((processed / total) * 100)

  return (
    <div className={styles.progress}>
      <div className={styles.bar}>
        <i style={{ width: `${percent}%` }} />
      </div>
      <span className={styles.label}>
        {processed} из {total} обработано
      </span>
    </div>
  )
}
