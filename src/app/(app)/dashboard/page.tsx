import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import DashboardClient from "./client";
import { getCurrentWorkspace } from "@/lib/current-workspace";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { currentWorkspace } = await getCurrentWorkspace();

  if (!currentWorkspace) {
    redirect("/stores");
  }

  // Fetch recent jobs scoped to workspaces
  const recentJobs = await prisma.migrationJob.findMany({
    where: { workspaceId: currentWorkspace.id },
    orderBy: { createdAt: "desc" },
    take: 6,
    include: {
      sourceShop: true,
      destinationShop: true,
    }
  });

  // Calculate high-level reporting stats
  const totalMigrations = await prisma.migrationJob.count({
    where: { workspaceId: currentWorkspace.id }
  });

  const completedMigrations = await prisma.migrationJob.count({
    where: { workspaceId: currentWorkspace.id, status: "COMPLETED" }
  });

  const failedMigrations = await prisma.migrationJob.count({
    where: { workspaceId: currentWorkspace.id, status: "FAILED" }
  });

  const connectedStores = await prisma.connectedShop.count({
    where: { workspaceId: currentWorkspace.id, isActive: true }
  });

  const totalProductsMigrated = await prisma.migrationJobItem.count({
    where: {
      job: { workspaceId: currentWorkspace.id },
      resourceType: "PRODUCT",
      status: "SUCCESS",
    },
  });

  const totalCollectionsMigrated = await prisma.migrationJobItem.count({
    where: {
      job: { workspaceId: currentWorkspace.id },
      resourceType: "COLLECTION",
      status: "SUCCESS",
    },
  });

  const statsData = {
    totalMigrations,
    completedMigrations,
    failedMigrations,
    totalProductsMigrated,
    totalCollectionsMigrated,
    connectedStores,
  };

  return <DashboardClient statsData={statsData} recentJobs={recentJobs} />;
}
