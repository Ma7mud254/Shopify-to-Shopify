import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import NewMigrationWizard from "./wizard-client";
import { redirect } from "next/navigation";
import { getCurrentWorkspace } from "@/lib/current-workspace";

export default async function NewMigrationPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { currentWorkspace } = await getCurrentWorkspace();

  if (!currentWorkspace) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center space-y-4">
        <h2 className="text-xl font-semibold">No Workspace Found</h2>
        <p className="text-muted-foreground">Please create a workspace to start migrating.</p>
      </div>
    );
  }

  const shops = await prisma.connectedShop.findMany({
    where: { 
      workspaceId: currentWorkspace.id,
      isActive: true, // Only allow active connections
    },
    select: {
      id: true,
      shopDomain: true,
      shopName: true,
      currency: true,
      country: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return <NewMigrationWizard shops={shops} workspaceId={currentWorkspace.id} />;
}
