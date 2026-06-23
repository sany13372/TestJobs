import { useState } from 'react'
import { useJobsStore } from '../../store/jobsStore'
import styles from './CreateJobForm.module.scss'

function parseUrls(raw: string): string[] {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

export function CreateJobForm() {
  const [text, setText] = useState('')
  const creating = useJobsStore((s) => s.creating)
  const formError = useJobsStore((s) => s.formError)
  const submitJob = useJobsStore((s) => s.submitJob)

  const urls = parseUrls(text)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (urls.length === 0 || creating) return
    await submitJob(urls)
    if (!useJobsStore.getState().formError) {
      setText('')
    }
  }

  return (
    <form className={styles.card} onSubmit={handleSubmit}>
      <h2>Новая проверка</h2>
      <p className={styles.hint}>Вставьте URL — по одному в строке.</p>
      <textarea
        className={styles.textarea}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={'https://example.com\nhttps://github.com'}
        rows={8}
        spellCheck={false}
      />
      <div className={styles.footer}>
        <span className={styles.count}>
          {urls.length > 0 ? `URL: ${urls.length}` : 'нет URL'}
        </span>
        <button
          className={styles.submit}
          type="submit"
          disabled={urls.length === 0 || creating}
        >
          {creating ? 'Запуск…' : 'Запустить проверку'}
        </button>
      </div>
      {formError && <p className={styles.error}>{formError}</p>}
    </form>
  )
}
