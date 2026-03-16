import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, CreditCard, Sparkles } from "lucide-react";
import { getCurrentWorkspace } from "@/lib/current-workspace";

const FREE_FEATURES = [
  "Unlimited migrations during development",
  "Unlimited products and collections",
  "Product, collection, image, and metafield migration",
  "Workspace collaboration",
  "Reports and migration history",
];

export default async function BillingPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const { currentWorkspace } = await getCurrentWorkspace();
  if (!currentWorkspace) {
    redirect("/dashboard");
  }

  const subscription = currentWorkspace.subscription;
  const isPaid = subscription?.status === "ACTIVE";
  const planName = isPaid ? currentWorkspace.plan : "FREE";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Subscription details for the selected workspace.
        </p>
      </div>

      <Card className="border-primary/30">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">{planName} Plan</CardTitle>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className="text-2xl font-extrabold">{isPaid ? "Custom" : "$0"}</span>
                  <span className="text-sm text-muted-foreground">{isPaid ? "" : "/month"}</span>
                </div>
              </div>
            </div>
            <Badge className="bg-success/20 text-success border-success/30">
              {isPaid ? subscription?.status : "ACTIVE"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-4">
            Workspace: {currentWorkspace.name}
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {FREE_FEATURES.map((feature) => (
              <div key={feature} className="flex items-center gap-2 text-sm">
                <Check className="h-3.5 w-3.5 text-primary" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Payment Method</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-14 items-center justify-center rounded-lg border border-border bg-muted">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">{isPaid ? "Managed outside this MVP" : "No payment method required"}</p>
              <p className="text-xs text-muted-foreground">
                {isPaid ? "Billing integration is not enabled in this build." : "This workspace is currently on the free plan."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
