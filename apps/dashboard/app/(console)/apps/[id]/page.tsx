import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ExternalLink,
  GitCommit,
  Globe,
  Activity,
  Layers,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getConsoleAccountId } from "@/lib/console-auth";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DeployButton } from "@/components/deploy-button";

interface PageProps {
  params: Promise<{ id: string }>;
}

function timeAgo(date: Date | null | undefined): string {
  if (!date) return "Never";
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
}

export default async function AppOverviewPage({ params }: PageProps) {
  const { id } = await params;
  const accountId = await getConsoleAccountId();

  const app = await prisma.application.findFirst({
    where: { id, accountId },
    include: {
      deployments: {
        take: 5,
        orderBy: { createdAt: "desc" },
      },
      databases: {
        where: { status: { not: "DELETED" } },
      },
    },
  });

  if (!app) {
    notFound();
  }

  const statusUpper = app.status.toUpperCase();
  const isRunning = statusUpper === "LIVE" || statusUpper === "RUNNING";
  const isSleeping = statusUpper === "SLEEPING";

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="page-heading min-w-0 break-words">{app.name}</h1>
            <Badge
              variant="outline"
              className={
                isRunning
                  ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                  : isSleeping
                  ? "bg-muted text-muted-foreground border-border"
                  : "bg-amber-500/10 text-amber-500 border-amber-500/20"
              }
            >
              {app.status.toUpperCase()}
            </Badge>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <a
              href={`https://${app.subdomain}.nebula.app`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Globe className="h-3.5 w-3.5" />
              <span>{app.subdomain}.nebula.app</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button asChild variant="outline">
            <Link href={`/apps/${app.id}/settings`}>Settings</Link>
          </Button>
          <DeployButton appId={app.id} repository={app.repository} size="default" />
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Status */}
        <Card className="bg-card/75">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <span className="text-xs font-medium text-muted-foreground">Status</span>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  isRunning ? "bg-emerald-500 animate-pulse" : isSleeping ? "bg-muted-foreground" : "bg-amber-500"
                }`}
              />
              <span>{isRunning ? "Running" : isSleeping ? "Sleeping" : "Deploying"}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {app.scalingEnabled ? "Auto-scaling enabled" : "Fixed allocation"}
            </p>
          </CardContent>
        </Card>

        {/* Instances */}
        <Card className="bg-card/75">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <span className="text-xs font-medium text-muted-foreground">Instances</span>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {app.currentInstances} / {app.maxInstances}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Min: {app.minInstances} | Max: {app.maxInstances}
            </p>
          </CardContent>
        </Card>

        {/* Region */}
        <Card className="bg-card/75">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <span className="text-xs font-medium text-muted-foreground">Region</span>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Singapore</div>
            <p className="text-xs text-muted-foreground mt-1">ap-southeast-1 edge</p>
          </CardContent>
        </Card>

        {/* Uptime */}
        <Card className="bg-card/75">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <span className="text-xs font-medium text-muted-foreground">Uptime</span>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">99.9%</div>
            <p className="text-xs text-muted-foreground mt-1">Past 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Activity Feed: Last 5 Deployments */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight sm:text-xl">Recent Deployments</h2>
          <span className="text-xs text-muted-foreground">Showing last 5 activity records</span>
        </div>

        {app.deployments.length === 0 ? (
          <Card className="p-8 text-center border-dashed">
            <p className="text-sm text-muted-foreground">
              No deployments recorded yet. Click the &ldquo;Deploy&rdquo; button above to trigger your first build.
            </p>
          </Card>
        ) : (
          <Card className="divide-y divide-border/60 overflow-hidden">
            {app.deployments.map((dep) => {
              const depStatus = dep.status.toUpperCase();
              const isDepLive = depStatus === "LIVE";
              const isDepFailed = depStatus === "FAILED";
              const isDepBuilding =
                depStatus === "BUILDING" ||
                depStatus === "QUEUED" ||
                depStatus === "ANALYZING" ||
                depStatus === "RELEASING";

              return (
                <div
                  key={dep.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/10 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {isDepLive && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                      {isDepFailed && <AlertCircle className="h-4 w-4 text-destructive" />}
                      {isDepBuilding && <Loader2 className="h-4 w-4 animate-spin text-amber-500" />}
                      {!isDepLive && !isDepFailed && !isDepBuilding && (
                        <GitCommit className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {dep.commitMessage || "Manual deployment from dashboard"}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 font-mono">
                        {dep.commitSha && <span>{dep.commitSha.substring(0, 7)}</span>}
                        {dep.sourceHash && <span>#{dep.sourceHash.substring(0, 7)}</span>}
                        <span className="flex items-center gap-1 font-sans">
                          <Calendar className="h-3 w-3" />
                          {timeAgo(dep.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <Badge
                      variant="outline"
                      className={
                        isDepLive
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                          : isDepFailed
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
    </div>
  );
}
