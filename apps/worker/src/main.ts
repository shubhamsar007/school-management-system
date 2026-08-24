import { Worker } from 'bullmq';
import IORedis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';

const connection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
});

// Queue: notifications
const notificationWorker = new Worker(
  'notifications',
  async (job) => {
    console.warn(`[notifications] Processing job ${job.id} — type: ${job.name}`);
    // Handlers will be registered here as notification types are built
  },
  { connection },
);

// Queue: reports (PDF generation, bulk exports)
const reportsWorker = new Worker(
  'reports',
  async (job) => {
    console.warn(`[reports] Processing job ${job.id} — type: ${job.name}`);
  },
  { connection },
);

notificationWorker.on('failed', (job, err) => {
  console.error(`[notifications] Job ${job?.id} failed:`, err.message);
});

reportsWorker.on('failed', (job, err) => {
  console.error(`[reports] Job ${job?.id} failed:`, err.message);
});

console.warn('Worker started. Waiting for jobs...');
