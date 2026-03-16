import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import MigrationsClient from "./client";
import { getCurrentWorkspace } from "@/lib/current-workspace";

export default async function MigrationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { currentWorkspace } = await getCurrentWorkspace();

  if (!currentWorkspace) {
    redirect("/stores");
  }

  // Fetch all jobs belonging to the selected workspace
  const jobs = await prisma.migrationJob.findMany({
    where: {
      workspaceId: currentWorkspace.id
    },
    include: {
      sourceShop: true,
      destinationShop: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return <MigrationsClient jobs={jobs} />;
}
