import { Queue } from "bullmq";
import type { JobType } from "bullmq";
import { redis } from "./redis";

export const MIGRATION_QUEUE_NAME = "shop-migration-queue";

// We use the same singleton pattern for the Queue instance
declare global {
  var _migrationQueue: Queue | undefined;
}

export const migrationQueue =
  global._migrationQueue || 
  new Queue(MIGRATION_QUEUE_NAME, {
    connection: redis as any,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 5000,
      },
      removeOnComplete: true,
      removeOnFail: 100, // keep the last 100 failed jobs
    },
  });

if (process.env.NODE_ENV !== "production") {
  global._migrationQueue = migrationQueue;
}

export async function removeQueuedMigrationJob(migrationJobId: string) {
  const states: JobType[] = ["waiting", "delayed", "prioritized", "active", "paused"];
  const jobs = await migrationQueue.getJobs(states, 0, 200);

  for (const job of jobs) {
    if (job.data?.jobId === migrationJobId) {
      try {
        await job.remove();
      } catch {
        // Active jobs cannot always be removed; status cancellation still stops them cooperatively.
      }
    }
  }
}
