import WorkspaceSwitcher from "./workspace-switcher";
import { SidebarNavigation } from "./sidebar-navigation";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { getCurrentWorkspace } from "@/lib/current-workspace";

export async function AppSidebar() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { workspaces, currentWorkspace } = await getCurrentWorkspace();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Workspace Switcher Component (Client Component) */}
      <div className="flex h-16 items-center px-4">
        <WorkspaceSwitcher workspaces={workspaces} currentWorkspace={currentWorkspace} />
      </div>

      <Separator className="bg-sidebar-border" />

      {/* Navigation and Bottom Actions (Client Component) */}
      <SidebarNavigation user={session.user} />
    </aside>
  );
}
