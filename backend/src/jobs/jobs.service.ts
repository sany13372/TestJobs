import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Job, UrlTask } from './types/job.types';

const CONCURRENCY = 5;
const MAX_DELAY_MS = 10_000;

@Injectable()
export class JobsService {
  private readonly jobs = new Map<string, Job>();

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
    const job = this.get(id);
    job.status = 'cancelled';
    for (const task of job.urls) {
      if (task.status === 'pending') {
        task.status = 'cancelled';
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
    const isCancelled = () => job.status === 'cancelled';
    job.status = 'in_progress';

    let next = 0;
    const worker = async () => {
      while (next < job.urls.length) {
        const task = job.urls[next++];
        if (task.status === 'pending') {
          await this.check(task);
        }
      }
    };

    const workers = Array.from(
      { length: Math.min(CONCURRENCY, job.urls.length) },
      worker,
    );
    await Promise.all(workers);

    if (!isCancelled()) {
      const allFailed = job.urls.every((u) => u.status === 'error');
      job.status = allFailed ? 'failed' : 'completed';
    }
  }

  private async check(task: UrlTask) {
    task.status = 'in_progress';
    task.startedAt = new Date();
    const start = Date.now();

    try {
      const res = await fetch(task.url, {
        method: 'HEAD',
        redirect: 'follow',
        signal: AbortSignal.timeout(30_000),
      });
      await this.delay();
      task.httpStatus = res.status;
      task.status = res.ok ? 'success' : 'error';
      if (!res.ok) {
        task.errorMessage = `HTTP ${res.status}`;
      }
    } catch (err) {
      await this.delay();
      task.status = 'error';
      task.errorMessage = err instanceof Error ? err.message : 'запрос не выполнен';
    } finally {
      task.finishedAt = new Date();
      task.durationMs = Date.now() - start;
    }
  }

  private delay() {
    return new Promise((resolve) =>
      setTimeout(resolve, Math.random() * MAX_DELAY_MS),
    );
  }
}
