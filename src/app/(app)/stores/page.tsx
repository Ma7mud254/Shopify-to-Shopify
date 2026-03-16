import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ExternalLink, Globe, RefreshCcw, StoreIcon } from "lucide-react";
import { ConnectStoreDialog } from "./connect-dialog";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { DeleteStoreButton } from "./delete-button";
import { getCurrentWorkspace } from "@/lib/current-workspace";

export default async function StoresPage() {
  const session = await auth();
  if (!session?.user) {
    return null;
  }

  const { currentWorkspace } = await getCurrentWorkspace();

  // Fetch real shops for this workspace if it exists
  const shops = currentWorkspace
    ? await prisma.connectedShop.findMany({
        where: { workspaceId: currentWorkspace.id },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Connected Stores</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your Shopify store connections for migrations.
          </p>
        </div>
        {currentWorkspace && <ConnectStoreDialog workspaceId={currentWorkspace.id} />}
      </div>

      {/* Store Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shops.length === 0 ? (
          <div className="col-span-full rounded-xl border border-dashed p-12 text-center text-muted-foreground">
            <StoreIcon className="mx-auto mb-4 h-8 w-8 opacity-50" />
            <p>No stores connected to this workspace yet.</p>
          </div>
        ) : (
          shops.map((shop: any, i: number) => (
            <Card key={shop.id} className="group border-border/50 transition-all hover:shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <StoreIcon className="h-5 w-5 text-primary" />
                  </div>
                  <Badge variant={shop.accessToken ? "secondary" : "outline"} className="text-xs">
                    {shop.accessToken ? "Connected" : "Pending"}
                  </Badge>
                </div>

                <h3 className="mt-4 text-sm font-semibold">{shop.shopName || shop.shopDomain}</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">{shop.shopDomain}</p>

                <Separator className="my-4" />

                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Globe className="h-3 w-3" />
                    <span>{shop.shopDomain}</span>
                  </div>
                  {shop.accessToken && (
                    <div className="flex items-center gap-2">
                       <RefreshCcw className="h-3 w-3" />
                       <span>Active Token Stored</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-1 text-xs"
                    nativeButton={false}
                    render={
                      <a
                        href={`https://${shop.shopDomain}/admin`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1"
                      />
                    }
                  >
                    <ExternalLink className="h-3 w-3" /> View Admin
                  </Button>
                  <DeleteStoreButton shopId={shop.id} shopDomain={shop.shopDomain} />

                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
