import { cookies } from "next/headers";
import { getUserWorkspaces } from "@/app/actions/workspace";

export const CURRENT_WORKSPACE_COOKIE = "current_workspace_id";

export async function getCurrentWorkspace() {
  const workspaces = await getUserWorkspaces();
  const cookieStore = await cookies();
  const currentWorkspaceId = cookieStore.get(CURRENT_WORKSPACE_COOKIE)?.value;

  const currentWorkspace =
    workspaces.find((workspace) => workspace.id === currentWorkspaceId) ||
    workspaces[0] ||
    null;

  return {
    workspaces,
    currentWorkspace,
  };
}
