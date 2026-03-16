"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Boxes,
  Image as ImageIcon,
  Layers,
  Tags,
  FileText,
  Shield,
  Store,
  Rocket,
  AlertTriangle,
} from "lucide-react";
import { ConflictBehavior, MigrationResources } from "@/types";
import { useRouter } from "next/navigation";
import { createMigrationJob } from "@/app/actions/job";
import { toast } from "sonner";

const STEPS = [
  { key: "source", label: "Source Store", icon: Store },
  { key: "destination", label: "Destination Store", icon: Store },
  { key: "resources", label: "Choose Data", icon: Boxes },
  { key: "conflicts", label: "Conflict Settings", icon: Shield },
  { key: "review", label: "Review & Start", icon: Rocket },
];

const defaultResources: MigrationResources = {
  products: true,
  variants: true,
  productImages: true,
  variantImages: false,
  collections: true,
  manualCollections: true,
  smartCollections: false,
  productMetafields: false,
  collectionMetafields: false,
  tags: true,
  seo: true,
};

const resourceOptions: { key: keyof MigrationResources; label: string; desc: string; icon: any }[] = [
  { key: "products", label: "Products", desc: "Titles, handles, descriptions, vendors, types, status", icon: Boxes },
  { key: "variants", label: "Variants", desc: "SKU, barcode, price, compare-at price, options", icon: Boxes },
  { key: "productImages", label: "Product Images", desc: "All product images with alt text and positions", icon: ImageIcon },
  { key: "variantImages", label: "Variant Images", desc: "Images assigned to specific variants", icon: ImageIcon },
  { key: "collections", label: "Collections", desc: "Collection names, descriptions, and images", icon: Layers },
  { key: "manualCollections", label: "Manual Collection Membership", desc: "Which products belong to each manual collection", icon: Layers },
  { key: "smartCollections", label: "Smart Collection Rules", desc: "Automated collection rules (when possible)", icon: Layers },
  { key: "productMetafields", label: "Product Metafields", desc: "Custom metafield values on products", icon: Tags },
  { key: "collectionMetafields", label: "Collection Metafields", desc: "Custom metafield values on collections", icon: Tags },
  { key: "tags", label: "Tags", desc: "Product and collection tags", icon: Tags },
  { key: "seo", label: "SEO Data", desc: "SEO titles and meta descriptions", icon: FileText },
];

export default function NewMigrationWizard({ shops, workspaceId }: { shops: any[], workspaceId: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [sourceShopId, setSourceShopId] = useState<string>("");
  const [destShopId, setDestShopId] = useState<string>("");
  const [resources, setResources] = useState<MigrationResources>(defaultResources);
  const [conflictBehavior, setConflictBehavior] = useState<ConflictBehavior>("skip");
  const [dryRun, setDryRun] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sourceShop = shops.find((s) => s.id === sourceShopId);
  const destShop = shops.find((s) => s.id === destShopId);

  const canNext = () => {
    if (step === 0) return !!sourceShopId;
    if (step === 1) return !!destShopId && destShopId !== sourceShopId;
    if (step === 2) return Object.values(resources).some(Boolean);
    return true;
  };

  const selectedResourceCount = Object.values(resources).filter(Boolean).length;

  const handleStartMigration = async () => {
    setIsSubmitting(true);
    const result = await createMigrationJob({
      workspaceId,
      sourceShopId,
      destinationShopId: destShopId,
      resources,
      conflictBehavior,
      dryRun
    });

    if (result.error) {
      toast.error(result.error);
      setIsSubmitting(false);
    } else if (result.jobId) {
      toast.success("Migration setup successfully!");
      router.push(`/migrations/${result.jobId}`);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">New Migration</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Set up and launch a migration between two Shopify stores.
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            <button
              onClick={() => i < step && setStep(i)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                i === step
                  ? "bg-primary text-primary-foreground"
                  : i < step
                  ? "bg-primary/10 text-primary cursor-pointer hover:bg-primary/20"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {i < step ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <s.icon className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">{s.label}</span>
              <span className="sm:hidden">{i + 1}</span>
            </button>
            {i < STEPS.length - 1 && (
              <div className={`h-px w-4 lg:w-8 ${i < step ? "bg-primary" : "bg-muted"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
        >
          {/* Step 0: Source Store */}
          {step === 0 && (
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Select Source Store</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Choose the store you want to export data from.
                </p>
              </CardHeader>
              <CardContent>
                {shops.length === 0 ? (
                  <div className="rounded-xl border border-dashed p-8 text-center">
                    <p className="text-sm text-muted-foreground mb-4">No connected stores found.</p>
                    <Button onClick={() => router.push("/stores")} variant="outline" size="sm">
                      Connect a Store first
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {shops.map((shop) => (
                    <button
                      key={shop.id}
                      onClick={() => setSourceShopId(shop.id)}
                      className={`flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                        sourceShopId === shop.id
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border/50 hover:border-border"
                      }`}
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Store className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">{shop.shopName || shop.shopDomain}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground truncate">{shop.shopDomain}</p>
                      </div>
                    </button>
                  ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 1: Destination Store */}
          {step === 1 && (
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Select Destination Store</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Choose the store you want to import data into.
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {shops.filter((s) => s.id !== sourceShopId).map((shop) => (
                    <button
                      key={shop.id}
                      onClick={() => setDestShopId(shop.id)}
                      className={`flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                        destShopId === shop.id
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border/50 hover:border-border"
                      }`}
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Store className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">{shop.shopName || shop.shopDomain}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground truncate">{shop.shopDomain}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Choose Resources */}
          {step === 2 && (
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Choose Data to Migrate</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Select which resources to export and import.
                    </p>
                  </div>
                  <Badge variant="secondary">{selectedResourceCount} selected</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {resourceOptions.map((opt) => (
                    <label
                      key={opt.key}
                      className={`flex items-start gap-4 rounded-xl border-2 p-4 cursor-pointer transition-all ${
                        resources[opt.key]
                          ? "border-primary/30 bg-primary/5"
                          : "border-border/50 hover:border-border"
                      }`}
                    >
                      <Checkbox
                        checked={resources[opt.key]}
                        onCheckedChange={(checked) =>
                          setResources((prev) => ({ ...prev, [opt.key]: !!checked }))
                        }
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <opt.icon className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">{opt.label}</span>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Conflict Settings */}
          {step === 3 && (
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Conflict Settings</CardTitle>
                <p className="text-sm text-muted-foreground">
                  What should happen if a product or collection already exists in the destination?
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <RadioGroup
                  value={conflictBehavior}
                  onValueChange={(v) => setConflictBehavior(v as ConflictBehavior)}
                  className="space-y-3"
                >
                  {[
                    { value: "skip", label: "Skip Duplicates", desc: "If a product with the same handle exists, skip it entirely.", icon: Shield },
                    { value: "update", label: "Update Existing", desc: "Merge new data into existing products without overwriting unchanged fields.", icon: FileText },
                    { value: "overwrite", label: "Overwrite Existing", desc: "Replace the destination product entirely with the source data.", icon: AlertTriangle },
                  ].map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex items-start gap-4 rounded-xl border-2 p-4 cursor-pointer transition-all ${
                        conflictBehavior === opt.value
                          ? "border-primary/30 bg-primary/5"
                          : "border-border/50 hover:border-border"
                      }`}
                    >
                      <RadioGroupItem value={opt.value} className="mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <opt.icon className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">{opt.label}</span>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </RadioGroup>

                <Separator />

                <div className="flex items-center justify-between rounded-xl border border-border/50 p-4">
                  <div>
                    <Label htmlFor="dry-run" className="text-sm font-medium">Dry Run Mode</Label>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Validate everything without writing data to the destination store.
                    </p>
                  </div>
                  <Switch id="dry-run" checked={dryRun} onCheckedChange={setDryRun} />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="space-y-4">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg">Review Migration</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Confirm your settings before starting the migration.
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Stores */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-border/50 p-4">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Source</p>
                      <p className="mt-1.5 text-sm font-semibold">{sourceShop?.shopName}</p>
                      <p className="text-xs text-muted-foreground">{sourceShop?.shopDomain}</p>
                    </div>
                    <div className="rounded-xl border border-border/50 p-4">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Destination</p>
                      <p className="mt-1.5 text-sm font-semibold">{destShop?.shopName}</p>
                      <p className="text-xs text-muted-foreground">{destShop?.shopDomain}</p>
                    </div>
                  </div>

                  <Separator />

                  {/* Selected Resources */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                      Resources to Migrate
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {resourceOptions
                        .filter((r) => resources[r.key])
                        .map((r) => (
                          <Badge key={r.key} variant="secondary" className="gap-1">
                            <r.icon className="h-3 w-3" />
                            {r.label}
                          </Badge>
                        ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Settings */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Conflict Behavior</p>
                      <p className="mt-1.5 text-sm font-medium capitalize">{conflictBehavior} duplicates</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Mode</p>
                      <div className="mt-1.5 flex items-center gap-2">
                        {dryRun ? (
                          <Badge variant="outline" className="gap-1">
                            <Shield className="h-3 w-3" /> Dry Run
                          </Badge>
                        ) : (
                          <Badge className="gap-1">
                            <Rocket className="h-3 w-3" /> Live Migration
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {dryRun && (
                <div className="flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
                  <Shield className="h-5 w-5 shrink-0 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Dry Run Mode Active</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      No data will be written to the destination store. You&apos;ll get a validation report showing what would happen.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4">
        <Button
          variant="outline"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0 || isSubmitting}
          className="gap-1.5"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Button>

        {step < STEPS.length - 1 ? (
          <Button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canNext() || isSubmitting}
            className="gap-1.5"
          >
            Continue <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <Button className="gap-1.5" size="lg" onClick={handleStartMigration} disabled={isSubmitting}>
            <Rocket className="h-4 w-4" />
            {isSubmitting ? "Starting..." : dryRun ? "Start Dry Run" : "Start Migration"}
          </Button>
        )}
      </div>
    </div>
  );
}
