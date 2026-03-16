import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: jobId } = await params;

  // Verify user has access to this job via workspace membership
  const job = await prisma.migrationJob.findUnique({
    where: { id: jobId },
    include: { workspace: { include: { members: true } } },
  });

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const isMember = job.workspace.members.some(
    (m: any) => m.userId === session.user!.id
  );
  if (!isMember) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Fetch all job items for the report
  const items = await prisma.migrationJobItem.findMany({
    where: { jobId },
    orderBy: { createdAt: "asc" },
  });

  const logs = await prisma.jobLog.findMany({
    where: { jobId },
    orderBy: { createdAt: "asc" },
  });

  const [productMetafields, collectionMetafields, variantImageMappings] = await Promise.all([
    prisma.resourceMapping.count({
      where: { jobId, resourceType: "PRODUCT_METAFIELD" },
    }),
    prisma.resourceMapping.count({
      where: { jobId, resourceType: "COLLECTION_METAFIELD" },
    }),
    prisma.resourceMapping.count({
      where: { jobId, resourceType: "VARIANT_IMAGE" },
    }),
  ]);

  const reportData = {
    jobId: job.id,
    status: job.status,
    dryRun: job.dryRun,
    createdAt: job.createdAt,
    startedAt: job.startedAt,
    completedAt: job.completedAt,
    summary: {
      totalItems: job.totalItems,
      successCount: job.successCount,
      failedCount: job.failedCount,
      skippedCount: job.skippedCount,
      telemetry: (() => {
        let smartCollections = 0;

        items.filter((i: any) => i.status === "SUCCESS").forEach((item: any) => {
          const raw = item.rawData as any;
          if (item.resourceType === "COLLECTION" && raw?.ruleSet) {
            smartCollections += 1;
          }
        });

        const warnings = logs.filter((l: any) => l.level === "WARN").length;
        const hardErrors = logs.filter((l: any) => l.level === "ERROR").length || job.failedCount;

        return {
          productMetafieldsMigrated: productMetafields,
          collectionMetafieldsMigrated: collectionMetafields,
          smartCollectionsMigrated: smartCollections,
          variantImagesMapped: variantImageMappings,
          warningsEncountered: warnings,
          hardFailures: hardErrors,
        };
      })(),
    },
    items: items.map((item: any) => ({
      resourceType: item.resourceType,
      sourceId: item.sourceId,
      sourceHandle: item.sourceHandle,
      sourceTitle: item.sourceTitle,
      destinationId: item.destinationId,
      status: item.status,
      errorMessage: item.errorMessage,
    })),
    logs: logs.map((log: any) => ({
      level: log.level,
      step: log.step,
      message: log.message,
      createdAt: log.createdAt,
    })),
  };

  return new NextResponse(JSON.stringify(reportData, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="migration_report_${jobId}.json"`,
    },
  });
}
