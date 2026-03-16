"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Package,
  Layers,
  Store,
  AlertTriangle,
  Clock,
  TrendingUp,
  Plus,
} from "lucide-react";
import { fadeUp } from "@/lib/animations";
import { MigrationStatus } from "@/types";

function statusBadge(status: MigrationStatus) {
  const map: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
    COMPLETED: { variant: "default", label: "Completed" },
    IMPORTING: { variant: "secondary", label: "In Progress" },
    EXPORTING: { variant: "secondary", label: "Exporting" },
    PROCESSING: { variant: "secondary", label: "Processing" },
    FAILED: { variant: "destructive", label: "Failed" },
    PENDING: { variant: "outline", label: "Pending" },
    CANCELED: { variant: "outline", label: "Canceled" },
  };
  const s = map[status] || { variant: "outline" as const, label: status };
  return <Badge variant={s.variant}>{s.label}</Badge>;
}

export default function DashboardClient({ 
  statsData, 
  recentJobs 
}: { 
  statsData: any; 
  recentJobs: any[];
}) {
  const stats = [
    { label: "Total Migrations", value: statsData.totalMigrations, icon: TrendingUp, color: "text-primary" },
    { label: "Completed", value: statsData.completedMigrations, icon: CheckCircle2, color: "text-success" },
    { label: "Failed", value: statsData.failedMigrations, icon: AlertTriangle, color: "text-destructive" },
    { 
      label: "Products Migrated", 
      value: <span suppressHydrationWarning>{statsData.totalProductsMigrated.toLocaleString()}</span>, 
      icon: Package, 
      color: "text-chart-3" 
    },
    { label: "Collections", value: statsData.totalCollectionsMigrated, icon: Layers, color: "text-chart-4" },
    { label: "Connected Stores", value: statsData.connectedStores, icon: Store, color: "text-chart-5" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Overview of your migrations and connected stores.
          </p>
        </div>
        <Link href="/migrations/new">
          <Button className="gap-1.5">
            New Migration <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
        {stats.map((stat, i) => (
          <motion.div key={stat.label} initial="hidden" animate="visible" variants={fadeUp} custom={i}>
            <Card className="border-border/50 hover:shadow-sm transition-shadow">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <stat.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${stat.color}`} />
                </div>
                <p className="mt-3 text-xl sm:text-2xl font-bold">{stat.value}</p>
                <p className="mt-0.5 text-[11px] sm:text-xs text-muted-foreground md:truncate">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Recent Migrations */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Recent Migrations</h2>
          <Link href="/migrations" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            View all <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {recentJobs.length === 0 && (
            <motion.div initial="hidden" animate="visible" variants={fadeUp} className="col-span-1 sm:col-span-2">
              <div className="rounded-xl border border-dashed border-border/60 bg-muted/10 p-12 text-center flex flex-col items-center justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-4 ring-8 ring-primary/5">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-1">No Migrations Yet</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                  You haven't run any migrations in this workspace. Get started by moving your first product catalog today.
                </p>
                <Link href="/migrations/new">
                  <Button className="gap-2" size="lg">
                    <Plus className="h-4 w-4" /> Start your first Migration
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
          {recentJobs.map((job, i) => (
            <motion.div key={job.id} initial="hidden" animate="visible" variants={fadeUp} custom={i + 6}>
              <Link href={`/migrations/${job.id}`}>
                <Card className="group border-border/50 transition-all hover:border-primary/30 hover:shadow-md cursor-pointer">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {statusBadge(job.status)}
                          {job.dryRun && <Badge variant="outline" className="text-xs">Dry Run</Badge>}
                        </div>
                        <p className="mt-2 text-sm font-medium truncate">
                          {job.sourceShop.shopName || job.sourceShop.shopDomain} → {job.destinationShop.shopName || job.destinationShop.shopDomain}
                        </p>
                        <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span suppressHydrationWarning>
                              {new Date(job.createdAt).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                            </span>
                          </span>
                          <span>{job.totalItems} items</span>
                        </div>
                      </div>
                      <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>

                    {/* Progress bar for in-progress jobs */}
                    {(job.status === "IMPORTING" || job.status === "EXPORTING" || job.status === "PROCESSING") && job.totalSteps > 0 && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">
                            {Math.round((job.completedSteps / job.totalSteps) * 100)}%
                          </span>
                        </div>
                        <div className="mt-1.5 h-1.5 rounded-full bg-muted">
                          <div
                            className="h-1.5 rounded-full bg-primary transition-all"
                            style={{ width: `${(job.completedSteps / job.totalSteps) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Results for completed/failed */}
                    {(job.status === "COMPLETED" || job.status === "FAILED") && job.totalItems > 0 && (
                      <div className="mt-3 flex items-center gap-3 text-xs">
                        <span className="text-success">{job.successCount} success</span>
                        {job.failedCount > 0 && (
                          <span className="text-destructive">{job.failedCount} failed</span>
                        )}
                        {job.skippedCount > 0 && (
                          <span className="text-muted-foreground">{job.skippedCount} skipped</span>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
