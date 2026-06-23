import type { UrlResult } from '../../../types/job'
import { formatDuration } from '../../../lib/format'
import { StatusBadge } from '../../StatusBadge'
import styles from './UrlTable.module.scss'

export function UrlTable({ urls }: { urls: UrlResult[] }) {
  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>URL</th>
          <th>Статус</th>
          <th>HTTP</th>
          <th>Длительность</th>
          <th>Сообщение</th>
        </tr>
      </thead>
      <tbody>
        {urls.map((u, i) => (
          <tr key={`${u.url}-${i}`}>
            <td className={styles.url} title={u.url}>
              {u.url}
            </td>
            <td>
              <StatusBadge status={u.status} />
            </td>
            <td>{u.httpStatus ?? '—'}</td>
            <td>{formatDuration(u.durationMs)}</td>
            <td className={styles.msg}>{u.errorMessage ?? '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
