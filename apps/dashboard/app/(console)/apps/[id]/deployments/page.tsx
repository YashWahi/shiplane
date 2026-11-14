import { notFound } from "next/navigation";
import { GitCommit, Calendar, Layers, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getConsoleAccountId } from "@/lib/console-auth";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DeployButton } from "@/components/deploy-button";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AppDeploymentsPage({ params }: PageProps) {
  const { id } = await params;
  const accountId = await getConsoleAccountId();

  const app = await prisma.application.findFirst({
    where: { id, accountId },
    include: {
      deployments: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!app) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <h1 className="page-heading">Deployments</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Complete deployment history and build logs for {app.name}.
          </p>
        </div>
        <DeployButton appId={app.id} repository={app.repository} />
      </div>

      {app.deployments.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <Layers className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-lg font-semibold">No deployments yet</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Trigger your first deployment to build and run this application.
          </p>
          <DeployButton appId={app.id} repository={app.repository} size="sm" />
        </Card>
      ) : (
        <Card className="divide-y divide-border/60 overflow-hidden">
          {app.deployments.map((dep) => {
            const isLive = dep.status === "LIVE";
            const isFailed = dep.status === "FAILED";
            const isBuilding =
              dep.status === "BUILDING" ||
              dep.status === "QUEUED" ||
              dep.status === "ANALYZING";

            return (
              <div
                key={dep.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/10 transition-colors"
              >
                <div className="flex items-start gap-3.5">
                  <div className="mt-1">
                    {isLive && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                    {isFailed && <AlertCircle className="h-5 w-5 text-destructive" />}
                    {isBuilding && <Loader2 className="h-5 w-5 animate-spin text-amber-500" />}
                    {!isLive && !isFailed && !isBuilding && (
                      <GitCommit className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">
                      {dep.commitMessage || "Dashboard manual build"}
                    </h4>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-mono text-muted-foreground">
                      <span>ID: {dep.id.slice(-8)}</span>
                      {dep.commitSha && <span>SHA: {dep.commitSha.substring(0, 7)}</span>}
                      {dep.sourceHash && <span>Hash: #{dep.sourceHash.substring(0, 7)}</span>}
                      <span className="flex items-center gap-1 font-sans">
                        <Calendar className="h-3 w-3" />
                        {new Date(dep.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <Badge
                    variant="outline"
                    className={
                      isLive
                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                        : isFailed
                        ? "bg-destructive/10 text-destructive border-destructive/20"
                        : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                    }
                  >
                    {dep.status}
                  </Badge>
                </div>
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}
