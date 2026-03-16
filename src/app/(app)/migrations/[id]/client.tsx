"use client";

import { useRouter } from "next/navigation";
import { useEffect, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock,
  Download,
  Loader2,
  XCircle,
  RefreshCcw,
  AlertTriangle,
  Info,
  Bug,
  Store,
  Square,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { getPipelineSteps } from "@/types";
import { cancelMigrationJob, deleteMigrationJob } from "@/app/actions/job";

function getStatusIcon(
  stepKey: string,
  currentStep: string | null,
  completedSteps: number,
  status: string,
  pipelineSteps: Array<{ key: string; label: string }>
) {
  const stepIndex = pipelineSteps.findIndex((s) => s.key === stepKey);

  if (status === "FAILED" && stepKey === currentStep) {
    return <XCircle className="h-4 w-4 text-destructive" />;
  }
  
  // If the job failed at a later step, mark previous as success
  if (status === "FAILED") {
    const failedIndex = pipelineSteps.findIndex(s => s.key === currentStep);
    if (stepIndex < failedIndex) return <CheckCircle2 className="h-4 w-4 text-success" />;
  }

  if (stepIndex < completedSteps) {
    return <CheckCircle2 className="h-4 w-4 text-success" />;
  }
  if (stepKey === currentStep) {
    return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
  }
  return <Circle className="h-4 w-4 text-muted-foreground/40" />;
}

const logLevelIcon = {
  DEBUG: <Bug className="h-3.5 w-3.5 text-muted-foreground" />,
  INFO: <Info className="h-3.5 w-3.5 text-blue-500" />,
  WARN: <AlertTriangle className="h-3.5 w-3.5 text-warning" />,
  ERROR: <XCircle className="h-3.5 w-3.5 text-destructive" />,
};

const itemStatusBadge = {
  SUCCESS: <Badge variant="default" className="bg-success/20 text-success border-success/30 text-xs">Success</Badge>,
  FAILED: <Badge variant="destructive" className="text-xs">Failed</Badge>,
  SKIPPED: <Badge variant="outline" className="text-xs">Skipped</Badge>,
  PENDING: <Badge variant="outline" className="text-xs text-muted-foreground">Pending</Badge>,
  IN_PROGRESS: <Badge variant="secondary" className="text-xs">In Progress</Badge>,
};

// The following lines appear to be a task list intended for a markdown file,
// but were included in the code edit instruction.
// To maintain syntactical correctness of this JavaScript file, they are commented out.
// e- [x] Fix: Shopify API 'Feature was deprecated' error (Full migration to `client.request`)
// - [x] Hardening: Background worker error reporting for silent crashes
// - [x] Modernization: Refactored entire service layer for Shopify API v2024-10
// - [x] Fix: Product migration failure (Migrated to `productSet` mutation)
// - [ ] Final Verification: Restart worker and execute end-to-end migration

export default function MigrationDetailClient({
  job,
  items,
  logs,
  reports,
  telemetry,
}: {
  job: any;
  items: any[];
  logs: any[];
  reports: any[];
  telemetry?: any;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const pipelineSteps = getPipelineSteps(job.config, job.dryRun);
  const isTerminal = ["COMPLETED", "FAILED", "CANCELED"].includes(job.status);
  
  // Polling logic: refresh the page data every 3 seconds if not in a terminal state
  useEffect(() => {
    if (["COMPLETED", "FAILED", "CANCELED"].includes(job.status)) return;

    const interval = setInterval(() => {
      router.refresh();
    }, 3000);

    return () => clearInterval(interval);
  }, [job.status, router]);

  const totalSteps = job.totalSteps || pipelineSteps.length;
  const completedSteps = job.status === "COMPLETED"
    ? totalSteps
    : Math.min(job.completedSteps ?? 0, Math.max(totalSteps - 1, 0));
  const progressPercent = totalSteps > 0
    ? Math.round((completedSteps / totalSteps) * 100)
    : 0;

  const handleStop = () => {
    if (!window.confirm("Stop this migration? In-flight work will stop as soon as the worker reaches a safe checkpoint.")) {
      return;
    }

    startTransition(async () => {
      const result = await cancelMigrationJob(job.id);
      if (result?.error) {
        window.alert(result.error);
        return;
      }

      router.refresh();
    });
  };

  const handleDelete = () => {
    if (!window.confirm("Delete this migration and all its logs/items? This cannot be undone.")) {
      return;
    }

    startTransition(async () => {
      const result = await deleteMigrationJob(job.id);
      if (result?.error) {
        window.alert(result.error);
        return;
      }

      router.push("/migrations");
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/migrations">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight">Migration {job.id.split("-")[0]}</h1>
              <Badge
                variant={
                  job.status === "COMPLETED" ? "default" :
                  job.status === "FAILED" ? "destructive" :
                  job.status === "PENDING" ? "outline" : "secondary"
                }
              >
                {job.status}
              </Badge>
              {job.dryRun && <Badge variant="outline">Dry Run</Badge>}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {job.sourceShop.shopDomain} → {job.destinationShop.shopDomain}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isTerminal && (
            <Button variant="destructive" size="sm" className="gap-1.5" onClick={handleStop} disabled={isPending}>
              <Square className="h-3.5 w-3.5" /> Stop Migration
            </Button>
          )}
          {job.status === "FAILED" && (
            <Button variant="outline" size="sm" className="gap-1.5">
              <RefreshCcw className="h-3.5 w-3.5" /> Retry Failed
            </Button>
          )}
          {isTerminal && (
            <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:text-destructive" onClick={handleDelete} disabled={isPending}>
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </Button>
          )}
          <a href={`/api/reports/${job.id}`} download>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Download className="h-3.5 w-3.5" /> Download Report
            </Button>
          </a>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Total Items", value: job.totalItems, color: "" },
          { label: "Success", value: job.successCount, color: "text-success" },
          { label: "Failed", value: job.failedCount, color: "text-destructive" },
          { label: "Skipped", value: job.skippedCount, color: "text-muted-foreground" },
          { label: "Progress", value: `${progressPercent}%`, color: "text-primary" },
        ].map((stat) => (
          <Card key={stat.label} className="border-border/50">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className={`mt-1 text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Extensible Telemetry Stats */}
      {telemetry && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-2">
           <Card className="border-border/50">
             <CardContent className="p-4">
               <p className="text-xs text-muted-foreground">Metafields Synced</p>
               <p className="mt-1 text-xl font-bold">{telemetry.productMetafields + telemetry.collectionMetafields}</p>
             </CardContent>
           </Card>
           <Card className="border-border/50">
             <CardContent className="p-4">
               <p className="text-xs text-muted-foreground">Smart Collections</p>
               <p className="mt-1 text-xl font-bold">{telemetry.smartCollections}</p>
             </CardContent>
           </Card>
           <Card className="border-border/50">
             <CardContent className="p-4">
               <p className="text-xs text-muted-foreground">Variant Images</p>
               <p className="mt-1 text-xl font-bold">{telemetry.variantImagesMapped}</p>
             </CardContent>
           </Card>
           <Card className="border-border/50">
             <CardContent className="p-4">
               <p className="text-xs text-muted-foreground">Logs (Warn / Err)</p>
               <p className="mt-1 text-xl font-bold flex gap-2">
                 <span className="text-warning">{telemetry.warnings}</span> / <span className="text-destructive">{telemetry.errors}</span>
               </p>
             </CardContent>
           </Card>
        </div>
      )}

      {/* Progress Bar */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">
              Step {completedSteps} of {totalSteps}
              {job.currentStep && (
                <span className="ml-2 text-foreground font-medium">
                  - {pipelineSteps.find((s) => s.key === job.currentStep)?.label}
                </span>
              )}
            </span>
            <span className="font-semibold">{progressPercent}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-muted">
            <motion.div
              className={`h-2.5 rounded-full ${
                job.status === "FAILED" ? "bg-destructive" :
                job.status === "COMPLETED" ? "bg-success" : "bg-primary"
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabs: Timeline, Items, Logs */}
      <Tabs defaultValue="timeline" className="space-y-4">
        <TabsList>
          <TabsTrigger value="timeline">Pipeline</TabsTrigger>
          <TabsTrigger value="items">Items ({items.length})</TabsTrigger>
          <TabsTrigger value="logs">Logs ({logs.length})</TabsTrigger>
        </TabsList>

        {/* Pipeline Timeline */}
        <TabsContent value="timeline">
          <Card className="border-border/50">
            <CardContent className="p-6">
              <div className="space-y-0">
                {pipelineSteps.map((step, i) => (
                  <div key={step.key} className="flex gap-4">
                    {/* Timeline line + icon */}
                    <div className="flex flex-col items-center">
                      <div className="flex h-8 w-8 items-center justify-center">
                        {getStatusIcon(step.key, job.currentStep, completedSteps, job.status, pipelineSteps)}
                      </div>
                      {i < pipelineSteps.length - 1 && (
                        <div className={`w-px flex-1 min-h-[24px] ${
                          i < completedSteps ? "bg-success/40" : "bg-border"
                        }`} />
                      )}
                    </div>
                    {/* Label */}
                    <div className="pb-6 pt-1">
                      <p className={`text-sm font-medium ${
                        step.key === job.currentStep ? "text-primary" :
                        i < completedSteps ? "text-foreground" : "text-muted-foreground"
                      }`}>
                        {step.label}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Items Table */}
        <TabsContent value="items">
          <Card className="border-border/50">
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Status</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Title / Handle</TableHead>
                      <TableHead>Source ID</TableHead>
                      <TableHead>Dest. ID</TableHead>
                      <TableHead>Error</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{itemStatusBadge[(item.status as keyof typeof itemStatusBadge)]}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs font-mono">
                            {item.resourceType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">{item.sourceTitle || "—"}</p>
                            {item.sourceHandle && (
                              <p className="text-xs text-muted-foreground font-mono">{item.sourceHandle}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono max-w-[120px] truncate">
                          {item.sourceId}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono max-w-[120px] truncate">
                          {item.destinationId || "—"}
                        </TableCell>
                        <TableCell>
                          {item.errorMessage ? (
                            <p className="text-xs text-destructive max-w-[200px] truncate" title={item.errorMessage}>
                              {item.errorMessage}
                            </p>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {items.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No migration items found yet. Pipeline is extracting data.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logs */}
        <TabsContent value="logs">
          <Card className="border-border/50">
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <div className="divide-y divide-border">
                  {logs.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                      <div className="mt-0.5 shrink-0">
                        {logLevelIcon[(log.level as keyof typeof logLevelIcon)]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{log.message}</p>
                        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                          {log.step && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono">
                              {log.step}
                            </Badge>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span suppressHydrationWarning>
                              {new Date(log.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {logs.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      No streaming logs available.
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Source / Destination Info */}
      <div className="grid gap-4 sm:grid-cols-2">
        {[
          { label: "Source Store", shop: job.sourceShop },
          { label: "Destination Store", shop: job.destinationShop },
        ].map((s) => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <Store className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-sm font-semibold">{s.shop.shopName || s.shop.shopDomain}</p>
                  <p className="text-xs text-muted-foreground">{s.shop.shopDomain}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Reports Section */}
      {reports.length > 0 && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Generated Reports</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {reports.map((report: any) => (
                <div key={report.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium">{report.filename}</p>
                    <p className="text-xs text-muted-foreground">
                      {report.sizeBytes ? `${(report.sizeBytes / 1024).toFixed(1)} KB` : ""}
                      {" · "}
                      <span suppressHydrationWarning>
                        {new Date(report.generatedAt).toLocaleString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </p>
                  </div>
                  <a href={report.url || `/api/reports/${job.id}`} download>
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <Download className="h-3 w-3" /> Download
                    </Button>
                  </a>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
