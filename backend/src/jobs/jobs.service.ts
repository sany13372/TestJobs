import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Job, JobStatus, UrlTask } from './types/job.types';

// в env не стал выводить но можно вынести если нужно
const CONCURRENCY = 5;
const MAX_DELAY_MS = 10_000;
const REQUEST_TIMEOUT_MS = 30_000;

@Injectable()
export class JobsService {
  private readonly jobs = new Map<string, Job>();
  private readonly aborters = new WeakMap<UrlTask, AbortController>();

  create(urls: string[]) {
    if (!Array.isArray(urls) || urls.length === 0) {
      throw new BadRequestException('urls не должен быть пустым');
    }

    const job: Job = {
      id: randomUUID(),
      createdAt: new Date(),
      status: 'pending',
      urls: urls.map((url) => ({ url: this.normalizeUrl(url), status: 'pending' })),
    };

    this.jobs.set(job.id, job);
    void this.run(job);

    return { jobId: job.id };
  }

  list() {
    return [...this.jobs.values()]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((job) => ({
        id: job.id,
        createdAt: job.createdAt,
        status: job.status,
        urlCount: job.urls.length,
        stats: {
          success: job.urls.filter((u) => u.status === 'success').length,
          error: job.urls.filter((u) => u.status === 'error').length,
        },
      }));
  }

  get(id: string): Job {
    const job = this.jobs.get(id);
    if (!job) {
      throw new NotFoundException(`Задача ${id} не найдена`);
    }
    return job;
  }

  cancel(id: string) {
    this.stop(this.get(id), 'cancelled');
  }

  pause(id: string) {
    this.stop(this.get(id), 'paused');
  }

  private stop(job: Job, status: JobStatus) {
    if (job.status !== 'pending' && job.status !== 'in_progress') return;

    job.status = status;
    for (const task of job.urls) {
      if (task.status === 'pending') {
        task.status = 'cancelled';
      } else if (task.status === 'in_progress') {
        this.aborters.get(task)?.abort();
      }
    }
  }

  private normalizeUrl(url: string): string {
    try {
      const { protocol, href } = new URL(url);
      if (protocol !== 'http:' && protocol !== 'https:') {
        throw new Error('невалидный url');
      }
      return href;
    } catch {
      throw new BadRequestException(`невалидный url:${String(url)}`);
    }
  }

  private async run(job: Job) {
    if (job.status !== 'pending') return;
    job.status = 'in_progress';

    const worker = async () => {
      while (job.status === 'in_progress') {
        const task = job.urls.find((t) => t.status === 'pending');
        if (!task) return;
        await this.check(job, task);
      }
    };

    await Promise.all(Array.from({ length: CONCURRENCY }, worker));

    if (job.status !== 'in_progress') return;

    const allFailed = job.urls.every((u) => u.status === 'error');
    job.status = allFailed ? 'failed' : 'completed';
  }

  private async check(job: Job, task: UrlTask) {
    const controller = new AbortController();
    this.aborters.set(task, controller);
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    task.status = 'in_progress';
    task.startedAt = new Date();
    const start = Date.now();

    try {
      const res = await fetch(task.url, {
        method: 'HEAD',
        redirect: 'follow',
        signal: controller.signal,
      });
      await this.delay(controller.signal);
      task.httpStatus = res.status;
      task.status = res.ok ? 'success' : 'error';
      if (!res.ok) {
        task.errorMessage = `HTTP ${res.status}`;
      }
    } catch (err) {
      if (job.status === 'paused' || job.status === 'cancelled') {
        task.status = 'cancelled';
        task.startedAt = undefined;
        return;
      }
      task.status = 'error';
      task.errorMessage = err instanceof Error ? err.message : 'запрос не выполнен';
    } finally {
      clearTimeout(timeout);
      this.aborters.delete(task);
    }

    task.finishedAt = new Date();
    task.durationMs = Date.now() - start;
  }

  private delay(signal: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      if (signal.aborted) return reject(new Error('aborted'));
      const timer = setTimeout(resolve, Math.random() * MAX_DELAY_MS);
      signal.addEventListener(
        'abort',
        () => {
          clearTimeout(timer);
          reject(new Error('aborted'));
        },
        { once: true },
      );
    });
  }
}
