"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import { CURRENT_WORKSPACE_COOKIE } from "@/lib/current-workspace";

const createWorkspaceSchema = z.object({
  name: z.string().min(2).max(50),
});

export async function createWorkspace(data: { name: string }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const { name } = createWorkspaceSchema.parse(data);
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Math.random().toString(36).substring(2, 6);

    const workspace = await prisma.workspace.create({
      data: {
        name,
        slug,
        members: {
          create: {
            userId: session.user.id,
            role: "OWNER",
          },
        },
      },
    });

    const cookieStore = await cookies();
    cookieStore.set(CURRENT_WORKSPACE_COOKIE, workspace.id, {
      path: "/",
      sameSite: "lax",
      httpOnly: true,
    });

    revalidatePath("/");
    return { workspace };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: "Invalid input data" };
    }
    return { error: "Failed to create workspace" };
  }
}

export async function getUserWorkspaces() {
  const session = await auth();
  if (!session?.user?.id) return [];

  return prisma.workspace.findMany({
    where: {
      members: {
        some: { userId: session.user.id },
      },
    },
    include: {
      members: {
        where: { userId: session.user.id },
      },
      subscription: true,
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function setCurrentWorkspace(workspaceId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const membership = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId: session.user.id,
        workspaceId,
      }
    }
  });

  if (!membership) {
    return { error: "Workspace not found" };
  }

  const cookieStore = await cookies();
  cookieStore.set(CURRENT_WORKSPACE_COOKIE, workspaceId, {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
  });

  revalidatePath("/");
  return { success: true };
}
