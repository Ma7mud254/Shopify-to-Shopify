import "dotenv/config";
import { Worker, Job } from "bullmq";
import { redis } from "../lib/queue/redis";
import { prisma } from "../lib/db";
import { MIGRATION_QUEUE_NAME } from "../lib/queue/migration-queue";
import { MigrationStatus } from "../types";
import { runMigrationPipeline } from "../lib/migration/pipeline";

const MAX_RETRIES = 3;

export const migrationWorker = new Worker(
  MIGRATION_QUEUE_NAME,
  async (job: Job) => {
    const { jobId, workspaceId } = job.data;
    console.log(`[Worker] Picked up Migration Job: ${jobId} (attempt ${job.attemptsMade + 1})`);

    // 1. Idempotency: Verify the job hasn't already been completed or canceled
    const migrationJob = await prisma.migrationJob.findUnique({
      where: { id: jobId },
      include: {
        sourceShop: true,
        destinationShop: true,
      }
    });

    if (!migrationJob) {
      console.warn(`[Worker] MigrationJob ${jobId} not found. Skipping.`);
      return { skipped: true, reason: "job_not_found" };
    }

    // Already completed or canceled? Skip silently.
    if (["COMPLETED", "CANCELED"].includes(migrationJob.status)) {
      console.log(`[Worker] Job ${jobId} already ${migrationJob.status}. Skipping.`);
      return { skipped: true, reason: `already_${migrationJob.status.toLowerCase()}` };
    }

    // 2. Validate tokens exist before starting heavy work
    if (!migrationJob.sourceShop.accessToken) {
      await prisma.migrationJob.update({
        where: { id: jobId },
        data: {
          status: "FAILED" as MigrationStatus,
          completedAt: new Date(),
        }
      });
      await prisma.jobLog.create({
        data: {
          jobId,
          level: "ERROR",
          step: "validate",
          message: "Source shop access token is missing. Re-connect the store.",
        }
      });
      return { success: false, reason: "missing_source_token" };
    }

    if (!migrationJob.destinationShop.accessToken && !migrationJob.dryRun) {
      await prisma.migrationJob.update({
        where: { id: jobId },
        data: {
          status: "FAILED" as MigrationStatus,
          completedAt: new Date(),
        }
      });
      await prisma.jobLog.create({
        data: {
          jobId,
          level: "ERROR",
          step: "validate",
          message: "Destination shop access token is missing. Re-connect the store.",
        }
      });
      return { success: false, reason: "missing_destination_token" };
    }

    try {
      // 3. Mark as processing (only if currently PENDING or retrying from FAILED)
      if (["PENDING", "FAILED"].includes(migrationJob.status)) {
        await prisma.migrationJob.update({
          where: { id: jobId },
          data: {
            status: "PROCESSING" as MigrationStatus,
            startedAt: migrationJob.startedAt || new Date(),
            currentStep: "validate",
          }
        });
      }

      // 4. Execute the actual Shopify Sync Pipeline
      await runMigrationPipeline(jobId);

      // 5. Mark completion with timestamp
      await prisma.migrationJob.update({
        where: { id: jobId },
        data: {
          completedAt: new Date(),
        }
      });

      console.log(`[Worker] Finished processing Job: ${jobId}`);
      return { success: true, jobId };

    } catch (error: any) {
      const latestJob = await prisma.migrationJob.findUnique({
        where: { id: jobId },
        select: { status: true }
      });

      if (latestJob?.status === "CANCELED") {
        console.log(`[Worker] Job ${jobId} was canceled by the user.`);
        return { skipped: true, reason: "canceled" };
      }

      console.error(`[Worker] Job ${jobId} failed (attempt ${job.attemptsMade + 1}):`, error.message);

      // If we've exhausted retries, mark as permanently failed
      if (job.attemptsMade + 1 >= MAX_RETRIES) {
        await prisma.migrationJob.update({
          where: { id: jobId },
          data: {
            status: "FAILED" as MigrationStatus,
            completedAt: new Date(),
          }
        });

        await prisma.jobLog.create({
          data: {
            jobId,
            level: "ERROR",
            step: "worker",
            message: `Job permanently failed after ${MAX_RETRIES} attempts: ${error.message}`,
          }
        });
      }

      // Re-throw to let BullMQ handle backoff/retries
      throw error;
    }
  },
  {
    connection: redis as any,
    concurrency: 3, // Process up to 3 migrations concurrently
  }
);

migrationWorker.on("ready", () => {
  console.log(`[Worker] Migration Worker ready on queue "${MIGRATION_QUEUE_NAME}"`);
});

migrationWorker.on("completed", (job: Job) => {
  console.log(`[Worker] Job ${job.id} completed`);
});

migrationWorker.on("failed", (job: Job | undefined, err: Error) => {
  console.error(`[Worker] Job ${job?.id} failed:`, err.message);
});

migrationWorker.on("error", (err) => {
  console.error(`[Worker] Worker error:`, err);
});
