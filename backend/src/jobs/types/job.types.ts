export type JobStatus =
  | 'pending'
  | 'in_progress'
  | 'paused'
  | 'completed'
  | 'cancelled'
  | 'failed';

export type UrlStatus =
  | 'pending'
  | 'in_progress'
  | 'success'
  | 'error'
  | 'cancelled';

export interface UrlTask {
  url: string;
  status: UrlStatus;
  httpStatus?: number;
  errorMessage?: string;
  startedAt?: Date;
  finishedAt?: Date;
  durationMs?: number;
}

export interface Job {
  id: string;
  createdAt: Date;
  status: JobStatus;
  urls: UrlTask[];
}
