import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, FileBarChart } from "lucide-react";
import { getCurrentWorkspace } from "@/lib/current-workspace";

function formatDate(value: Date) {
  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, "0");
  const day = String(value.getUTCDate()).padStart(2, "0");
  return `${month}/${day}/${year}`;
}

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const { currentWorkspace } = await getCurrentWorkspace();
  if (!currentWorkspace) {
    redirect("/dashboard");
  }

  const jobs = await prisma.migrationJob.findMany({
    where: {
      workspaceId: currentWorkspace.id,
      status: { in: ["COMPLETED", "FAILED", "CANCELED"] },
    },
    include: {
      sourceShop: true,
      destinationShop: true,
      reports: {
        orderBy: { generatedAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Real reports for the selected workspace.
        </p>
      </div>

      {jobs.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
              <FileBarChart className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="mt-4 text-sm font-medium">No reports yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Reports will appear here after a migration finishes.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <Card key={job.id} className="border-border/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">
                      {job.sourceShop.shopName || job.sourceShop.shopDomain} to {job.destinationShop.shopName || job.destinationShop.shopDomain}
                    </CardTitle>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatDate(job.createdAt)} · {job.id}
                    </p>
                  </div>
                  <Badge variant={job.status === "COMPLETED" ? "default" : "destructive"}>
                    {job.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-success">{job.successCount} success</span>
                  <span className="text-destructive">{job.failedCount} failed</span>
                  <span className="text-muted-foreground">{job.skippedCount} skipped</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {job.reports.length > 0 ? (
                    job.reports.map((report) => (
                      <a key={report.id} href={report.url || `/api/reports/${job.id}`} download>
                        <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                          <Download className="h-3 w-3" /> {report.filename}
                        </Button>
                      </a>
                    ))
                  ) : (
                    <a href={`/api/reports/${job.id}`} download>
                      <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                        <Download className="h-3 w-3" /> Summary JSON
                      </Button>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
