"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { ConflictBehavior, MigrationResources, getPipelineSteps } from "@/types";
import { migrationQueue, removeQueuedMigrationJob } from "@/lib/queue/migration-queue";
import { revalidatePath } from "next/cache";

export interface CreateJobInput {
  workspaceId: string;
  sourceShopId: string;
  destinationShopId: string;
  resources: MigrationResources;
  conflictBehavior: ConflictBehavior;
  dryRun: boolean;
}

export async function createMigrationJob(input: CreateJobInput) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    // Verify workspace membership
    const workspaceMember = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: session.user.id,
          workspaceId: input.workspaceId
        }
      }
    });

    if (!workspaceMember) {
      return { error: "Insufficient permissions for this workspace" };
    }

    // Verify both shops belong to the workspace and have tokens
    const shops = await prisma.connectedShop.findMany({
      where: {
        id: { in: [input.sourceShopId, input.destinationShopId] },
        workspaceId: input.workspaceId,
      }
    });

    if (shops.length !== 2) {
      return { error: "One or both shops validation failed" };
    }

    if (!shops.find((s: any) => s.id === input.sourceShopId)?.accessToken) {
      return { error: "Source shop is missing an active connection" };
    }
    
    if (!shops.find((s: any) => s.id === input.destinationShopId)?.accessToken && !input.dryRun) {
      return { error: "Destination shop is missing an active connection" };
    }

    // Create the initial MigrationJob record
    const config = {
      resources: input.resources,
      conflictBehavior: input.conflictBehavior,
      dryRun: input.dryRun,
    };

    const job = await prisma.migrationJob.create({
      data: {
        workspaceId: input.workspaceId,
        sourceShopId: input.sourceShopId,
        destinationShopId: input.destinationShopId,
        status: "PENDING",
        currentStep: "validate",
        config: JSON.stringify(config),
        dryRun: input.dryRun,
        totalSteps: getPipelineSteps(config, input.dryRun).length,
        completedSteps: 0,
        totalItems: 0,
        successCount: 0,
        failedCount: 0,
        skippedCount: 0,
      }
    });

    // Enqueue the migration job for background processing
    await migrationQueue.add(
      "process-migration",
      {
        jobId: job.id,
        workspaceId: input.workspaceId
      },
      {
        jobId: job.id,
      }
    );

    return { jobId: job.id };
  } catch (error: any) {
    console.error("Migration Job Creation Error", error);
    return { error: "Failed to create migration job" };
  }
}

async function getAuthorizedJob(jobId: string, userId: string) {
  const job = await prisma.migrationJob.findUnique({
    where: { id: jobId },
    include: {
      workspace: {
        include: {
          members: true,
        }
      }
    }
  });

  if (!job) {
    return { error: "Migration job not found" as const };
  }

  const hasAccess = job.workspace.members.some((member) => member.userId === userId);
  if (!hasAccess) {
    return { error: "Insufficient permissions for this migration" as const };
  }

  return { job };
}

export async function cancelMigrationJob(jobId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const result = await getAuthorizedJob(jobId, session.user.id);
    if ("error" in result) {
      return result;
    }

    const { job } = result;
    if (["COMPLETED", "FAILED", "CANCELED"].includes(job.status)) {
      return { error: "Only active migrations can be stopped" };
    }

    await prisma.migrationJob.update({
      where: { id: jobId },
      data: {
        status: "CANCELED",
        completedAt: new Date(),
      }
    });

    await prisma.jobLog.create({
      data: {
        jobId,
        level: "WARN",
        step: "cancel",
        message: "Migration was stopped by the user.",
      }
    });

    await removeQueuedMigrationJob(jobId);
    revalidatePath("/migrations");
    revalidatePath(`/migrations/${jobId}`);

    return { success: true };
  } catch (error: any) {
    console.error("Cancel Migration Error", error);
    return { error: "Failed to stop migration" };
  }
}

export async function deleteMigrationJob(jobId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const result = await getAuthorizedJob(jobId, session.user.id);
    if ("error" in result) {
      return result;
    }

    const { job } = result;
    if (!["COMPLETED", "FAILED", "CANCELED"].includes(job.status)) {
      return { error: "Stop the migration before deleting it" };
    }

    await removeQueuedMigrationJob(jobId);
    await prisma.migrationJob.delete({
      where: { id: jobId }
    });

    revalidatePath("/migrations");
    revalidatePath(`/migrations/${jobId}`);

    return { success: true };
  } catch (error: any) {
    console.error("Delete Migration Error", error);
    return { error: "Failed to delete migration" };
  }
}
