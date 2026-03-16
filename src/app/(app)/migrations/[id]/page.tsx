import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getUserWorkspaces } from "@/app/actions/workspace";
import { redirect, notFound } from "next/navigation";
import MigrationDetailClient from "./client";
import { parseMigrationConfig } from "@/types";

export default async function MigrationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const workspaces = await getUserWorkspaces();
  const workspaceIds = workspaces.map((w: { id: string }) => w.id);

  if (workspaceIds.length === 0) {
    redirect("/stores");
  }

  const job = await prisma.migrationJob.findUnique({
    where: { id },
    include: {
      sourceShop: true,
      destinationShop: true,
    }
  });

  if (!job) {
    notFound();
  }

  // Security: ensure the job belongs to one of the user's workspaces
  if (!workspaceIds.includes(job.workspaceId)) {
    notFound();
  }

  // Fetch the items belonging to this job
  const items = await prisma.migrationJobItem.findMany({
    where: { jobId: job.id },
    orderBy: { createdAt: "desc" },
    take: 100, // Limit for display performance
  });

  // Fetch the logs belonging to this job
  const logs = await prisma.jobLog.findMany({
    where: { jobId: job.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  // Fetch generated reports
  const reports = await prisma.report.findMany({
    where: { jobId: job.id },
    orderBy: { generatedAt: "desc" },
  });

  const [allSuccessful, productMetafields, collectionMetafields, variantImagesMapped] = await Promise.all([
    prisma.migrationJobItem.findMany({
      where: { jobId: job.id, status: "SUCCESS", resourceType: "COLLECTION" },
      select: { rawData: true }
    }),
    prisma.resourceMapping.count({
      where: { jobId: job.id, resourceType: "PRODUCT_METAFIELD" }
    }),
    prisma.resourceMapping.count({
      where: { jobId: job.id, resourceType: "COLLECTION_METAFIELD" }
    }),
    prisma.resourceMapping.count({
      where: { jobId: job.id, resourceType: "VARIANT_IMAGE" }
    }),
  ]);

  let smartCollections = 0;
  for (const item of allSuccessful) {
    const raw = item.rawData as any;
    if (raw?.ruleSet) smartCollections++;
  }

  const logCounts = await prisma.jobLog.groupBy({
    by: ['level'],
    where: { jobId: job.id },
    _count: { level: true },
  });
  const warnings = logCounts.find((l: any) => l.level === "WARN")?._count?.level || 0;
  const errors = logCounts.find((l: any) => l.level === "ERROR")?._count?.level || job.failedCount;

  const telemetry = { productMetafields, collectionMetafields, smartCollections, variantImagesMapped, warnings, errors };

  return <MigrationDetailClient job={{ ...job, config: parseMigrationConfig(job.config) }} items={items} logs={logs} reports={reports} telemetry={telemetry} />;
}
