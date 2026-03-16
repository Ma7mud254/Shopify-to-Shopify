import { shopify } from "@/lib/shopify";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { getGraphqlClient } from "@/lib/shopify/client";
import { encryptToken } from "@/lib/encryption";
import { auth } from "@/auth";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

function logDebug(msg: string) {
  const logPath = path.join(process.cwd(), "emergency.log");
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logPath, `[${timestamp}] ${msg}\n`);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const shopDomain = url.searchParams.get("shop");
  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  const hmac = url.searchParams.get("hmac");

  logDebug(`CALLBACK_TRIGGERED: shop=${shopDomain}, state=${state}, code=${code ? "YES" : "NO"}`);

  if (!shopDomain || !state || !code) {
    return NextResponse.redirect(new URL("/stores?error=missing_params", req.url));
  }

  try {
    // 1. Search for a matching record
    // We first try to match by 'state' as it's the unique nonce for this specific OAuth flow
    let pendingShop = await prisma.connectedShop.findFirst({
      where: { state },
      orderBy: { createdAt: "desc" },
    });

    if (pendingShop) {
      logDebug(`MATCH_BY_STATE: found record ${pendingShop.id} for shop ${pendingShop.shopDomain}`);
      // If the domain sent by Shopify is different (e.g. dev store swapping), update it
      if (pendingShop.shopDomain !== shopDomain) {
         logDebug(`ADOPTING_REAL_DOMAIN: updating ${pendingShop.shopDomain} -> ${shopDomain}`);
      }
    } else {
      // Fallback to domain matching if state isn't found (e.g. custom install link with fixed state)
      logDebug(`NO_MATCH_BY_STATE: falling back to domain search for ${shopDomain}`);
      pendingShop = await prisma.connectedShop.findFirst({
        where: { shopDomain },
        orderBy: { createdAt: "desc" },
      });
    }

    if (!pendingShop) {
      logDebug(`NO_MATCH_FOUND: Attempting JIT provisioning for ${shopDomain}`);
      const session = await auth();
      if (session?.user?.id) {
        const workspaceMember = await prisma.workspaceMember.findFirst({
          where: { userId: session.user.id },
          orderBy: { createdAt: "asc" } // Grab their oldest/primary workspace
        });

        if (workspaceMember) {
          logDebug(`JIT_PROVISIONING: Creating new record in workspace ${workspaceMember.workspaceId}`);
          pendingShop = await prisma.connectedShop.create({
            data: {
              workspaceId: workspaceMember.workspaceId,
              shopDomain: shopDomain,
              isActive: false,
              state: state, // Save the state being used
            }
          });
        } else {
          logDebug(`JIT_FAILURE: User ${session.user.id} has no workspaces.`);
        }
      } else {
        logDebug(`JIT_FAILURE: No authenticated session found.`);
      }
    }

    if (!pendingShop) {
      logDebug(`ERROR_TOTAL_MISMATCH: state=${state}, shop=${shopDomain}`);
      return NextResponse.redirect(new URL("/stores?error=no_pending_connection", req.url));
    }

    // Optional: Log state mismatch for debugging but don't hard block
    if (pendingShop.state !== state && process.env.NODE_ENV === "production") {
       console.warn(`State mismatch for ${shopDomain}. Expected: ${pendingShop.state}, Got: ${state}`);
    }

    // 2. Exchange code for permanent offline access token
    logDebug(`START_TOKEN_EXCHANGE: matching ${shopDomain} (ID: ${pendingShop.id})`);
    const accessTokenResponse = await fetch(
      `https://${shopDomain}/admin/oauth/access_token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: process.env.SHOPIFY_API_KEY,
          client_secret: process.env.SHOPIFY_API_SECRET,
          code,
        }),
      }
    );

    if (!accessTokenResponse.ok) {
      throw new Error(`Token exchange failed: ${accessTokenResponse.statusText}`);
    }

    const tokenData = await accessTokenResponse.json();
    logDebug(`TOKEN_DATA_RECEIVED: ${shopDomain} - ${JSON.stringify(tokenData).substring(0, 50)}...`);
    const accessToken = tokenData.access_token;
    const scope = tokenData.scope;

    if (!accessToken) {
      throw new Error("No access token returned from Shopify");
    }

    // 3. Save the token and mark as active
    const encryptedToken = encryptToken(accessToken);

    await prisma.connectedShop.update({
      where: { id: pendingShop.id },
      data: {
        accessToken: encryptedToken,
        scopes: scope,
        isActive: true,
        state: null, // Clear the nonce after successful use
        shopName: shopDomain.replace(".myshopify.com", ""),
      },
    });

    logDebug(`DB_UPDATED_ACTIVE: ${shopDomain}`);

    // 4. Fetch shop details asynchronously to populate metadata
    try {
      const updatedShop = await prisma.connectedShop.findUnique({
        where: { id: pendingShop.id },
      });

      if (updatedShop) {
        const client = getGraphqlClient(updatedShop);
        const shopInfoResponse = await client.request(`
          query {
            shop {
              name
              email
              primaryDomain { url }
              currencyCode
              billingAddress { countryCodeV2 }
              plan { displayName }
            }
          }
        `);

        const shopInfo = shopInfoResponse.data?.shop;
        if (shopInfo) {
          await prisma.connectedShop.update({
            where: { id: updatedShop.id },
            data: {
              name: shopInfo.name,
              email: shopInfo.email,
              domain: shopInfo.primaryDomain?.url?.replace(/^https?:\/\//, ""),
              currency: shopInfo.currencyCode,
              country: shopInfo.billingAddress?.countryCodeV2,
              plan: shopInfo.plan?.displayName,
              lastSyncAt: new Date(),
            },
          });
        }
      }
    } catch (metaErr) {
      // Non-critical: we still have the token, just missing metadata
      console.warn("Shop metadata fetch failed:", metaErr);
    }

    // 5. Redirect to Stores page on success
    logDebug(`SUCCESS_REDIRECT: ${shopDomain}`);
    return NextResponse.redirect(new URL("/stores?connected=true&shop=" + shopDomain, req.url));
  } catch (err: any) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    logDebug(`CALLBACK_ERROR: ${errorMessage}`);
    console.error("Shopify OAuth Callback Error:", err);
    return NextResponse.redirect(
      new URL(`/stores?error=auth_failed&msg=${encodeURIComponent(errorMessage)}`, req.url)
    );
  }
}
