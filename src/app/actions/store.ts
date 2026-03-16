"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { shopify } from "@/lib/shopify";
import { removeQueuedMigrationJob } from "@/lib/queue/migration-queue";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

function isShopifyDomain(domain: string): boolean {
  const shopifyDomainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/;
  return shopifyDomainRegex.test(domain);
}

const connectSchema = z.object({
  shopDomain: z.string().min(1),
  workspaceId: z.string().min(1),
});

export async function beginStoreConnection(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const rawDomain = formData.get("storeDomain") as string;
  const workspaceId = formData.get("workspaceId") as string;
  
  if (!rawDomain || !workspaceId) {
    return { error: "Missing required fields" };
  }

  // Ensure shopify valid domain format
  let shopDomain = rawDomain.toLowerCase().trim();
  if (!shopDomain.endsWith(".myshopify.com")) {
    shopDomain = `${shopDomain}.myshopify.com`;
  }

  // Generate OAuth URL via Shopify lib
  const redirectUri = `${process.env.SHOPIFY_APP_URL || "http://localhost:3000"}/api/shopify/callback`;
  
  // Custom state token to pass workspace ID securely through OAuth
  const state = await shopify.auth.nonce();

  // Save pending state in DB to verify callback
  await prisma.connectedShop.upsert({
    where: {
      workspaceId_shopDomain: {
        workspaceId,
        shopDomain,
      },
    },
    create: {
      workspaceId,
      shopDomain,
      state,
      isActive: false,
    },
    update: {
      state,
      isActive: false, // Reset isActive if it was previously active but re-connecting
    },
  });

  const authRoute = `https://${shopDomain}/admin/oauth/authorize?client_id=${process.env.SHOPIFY_API_KEY}&scope=${process.env.SHOPIFY_SCOPES}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;

  redirect(authRoute);
}

export async function deleteStore(shopId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  try {
    // 1. Verify ownership/access to the workspace of this shop
    const shop = await prisma.connectedShop.findUnique({
      where: { id: shopId },
      include: { workspace: { include: { members: true } } }
    });

    if (!shop) throw new Error("Shop not found");

    const isMember = shop.workspace.members.some(m => m.userId === session.user?.id);
    if (!isMember) throw new Error("Access denied");

    const relatedJobs = await prisma.migrationJob.findMany({
      where: {
        OR: [
          { sourceShopId: shopId },
          { destinationShopId: shopId },
        ]
      },
      select: { id: true }
    });

    for (const job of relatedJobs) {
      await removeQueuedMigrationJob(job.id);
    }

    await prisma.$transaction(async (tx) => {
      if (relatedJobs.length > 0) {
        await tx.migrationJob.deleteMany({
          where: {
            id: { in: relatedJobs.map((job) => job.id) }
          }
        });
      }

      await tx.connectedShop.delete({
        where: { id: shopId }
      });
    });

    revalidatePath("/stores");
    revalidatePath("/migrations");
    return { success: true };
  } catch (error: any) {
    console.error("Delete Store Error:", error);
    return { error: error.message || "Failed to delete store" };
  }
}
