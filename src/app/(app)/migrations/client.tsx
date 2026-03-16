"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { motion } from "framer-motion";
import { ArrowUpRight, Clock, Eye, Plus, Trash2 } from "lucide-react";
import { MigrationStatus } from "@/types";
import { deleteMigrationJob } from "@/app/actions/job";

function formatDateParts(value: string | Date) {
  const date = new Date(value);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");

  return {
    dateLabel: `${month}/${day}/${year}`,
    dateTimeLabel: `${year}-${month}-${day} ${hours}:${minutes}:${seconds} UTC`,
  };
}

function statusBadge(status: MigrationStatus) {
  const map: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string; dot: string }> = {
    COMPLETED: { variant: "default", label: "Completed", dot: "bg-green-500" },
    IMPORTING: { variant: "secondary", label: "Importing", dot: "bg-blue-500 animate-pulse" },
    EXPORTING: { variant: "secondary", label: "Exporting", dot: "bg-blue-500 animate-pulse" },
    PROCESSING: { variant: "secondary", label: "Processing", dot: "bg-blue-500 animate-pulse" },
    VALIDATING: { variant: "secondary", label: "Validating", dot: "bg-blue-500 animate-pulse" },
    FINALIZING: { variant: "secondary", label: "Finalizing", dot: "bg-blue-500 animate-pulse" },
    FAILED: { variant: "destructive", label: "Failed", dot: "bg-red-500" },
    PENDING: { variant: "outline", label: "Pending", dot: "bg-gray-400" },
    CANCELED: { variant: "outline", label: "Canceled", dot: "bg-gray-400" },
    PAUSED: { variant: "outline", label: "Paused", dot: "bg-yellow-500" },
  };
  const s = map[status] || { variant: "outline" as const, label: status, dot: "bg-gray-400" };
  return (
    <Badge variant={s.variant} className="gap-1.5">
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </Badge>
  );
}

export default function MigrationsClient({ jobs }: { jobs: any[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = (jobId: string) => {
    if (!window.confirm("Delete this migration and all its logs/items? This cannot be undone.")) {
      return;
    }

    startTransition(async () => {
      const result = await deleteMigrationJob(jobId);
      if (result?.error) {
        window.alert(result.error);
        return;
      }

      router.refresh();
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Migration History</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            All your migration jobs and their current status.
          </p>
        </div>
        <Link href="/migrations/new">
          <Button className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> New Migration
          </Button>
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-border/50">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table className="min-w-[800px]">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[180px]">Status</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead className="text-right">Items</TableHead>
                  <TableHead className="text-right">Success</TableHead>
                  <TableHead className="text-right">Failed</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[140px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => {
                  const formatted = formatDateParts(job.createdAt);

                  return (
                  <TableRow key={job.id} className="group cursor-pointer">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {statusBadge(job.status as MigrationStatus)}
                        {job.dryRun && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            Dry Run
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{job.sourceShop.shopName || job.sourceShop.shopDomain}</p>
                        <p className="text-xs text-muted-foreground">{job.sourceShop.shopDomain}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{job.destinationShop.shopName || job.destinationShop.shopDomain}</p>
                        <p className="text-xs text-muted-foreground">{job.destinationShop.shopDomain}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">{job.totalItems}</TableCell>
                    <TableCell className="text-right">
                      <span className="text-success font-medium">{job.successCount}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      {job.failedCount > 0 ? (
                        <span className="text-destructive font-medium">{job.failedCount}</span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div
                        className="flex items-center gap-1 text-xs text-muted-foreground"
                        title={formatted.dateTimeLabel}
                      >
                        <Clock className="h-3 w-3" />
                        <span>{formatted.dateLabel}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                        <Link href={`/migrations/${job.id}`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            title="View migration"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                        {["COMPLETED", "FAILED", "CANCELED"].includes(job.status) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            title="Delete migration"
                            onClick={() => handleDelete(job.id)}
                            disabled={isPending}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {!["COMPLETED", "FAILED", "CANCELED"].includes(job.status) && (
                          <Link href={`/migrations/${job.id}`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              title="Open migration"
                            >
                              <ArrowUpRight className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                  );
                })}
                {jobs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No migrations executed yet. Click "New Migration" to start parsing your first catalog.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
