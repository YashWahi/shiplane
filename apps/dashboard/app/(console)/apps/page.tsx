import Link from "next/link";
import { Plus, Moon, Loader2, Rocket, Globe, Database, ArrowUpRight, Activity, CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getConsoleAccountId } from "@/lib/console-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

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

function formatRuntime(runtime: string | null | undefined): string {
  if (!runtime) return "Node 20";
  if (runtime.toLowerCase().includes("node")) return "Node 20";
  if (runtime.toLowerCase().includes("python")) return "Python 3";
  if (runtime.toLowerCase().includes("go")) return "Go";
  return runtime.charAt(0).toUpperCase() + runtime.slice(1);
}

function formatDbEngine(engine: string | null | undefined): string {
  if (!engine) return "None";
  switch (engine.toUpperCase()) {
    case "POSTGRES":
      return "Postgres";
    case "MYSQL":
      return "MySQL";
    case "REDIS":
      return "Redis";
    case "MONGODB":
      return "MongoDB";
    default:
      return engine;
  }
}

export default async function AppsPage() {
  const accountId = await getConsoleAccountId();
  const apps = await prisma.application.findMany({
    where: {
      accountId,
      status: { not: "deleted" },
    },
    orderBy: { updatedAt: "desc" },
    include: {
      deployments: {
        take: 1,
        orderBy: { createdAt: "desc" },
      },
      databases: {
        where: { status: { not: "DELETED" } },
        take: 1,
      },
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Workspace</p>
          <h1 className="page-heading mt-1">Applications</h1>
          <p className="text-muted-foreground text-sm mt-2">
            Your services, deployments, and runtime health in one place.
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/apps/new">
            <Plus className="h-4 w-4" />
            <span>New App</span>
          </Link>
        </Button>
      </div>

      {apps.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Card className="border-border/80 bg-card/80">
            <CardContent className="flex items-center justify-between p-4">
              <div><p className="text-xs font-medium text-muted-foreground">Total applications</p><p className="mt-1 text-2xl font-semibold tabular-nums">{apps.length}</p></div>
              <div className="rounded-lg bg-primary/10 p-2.5 text-primary"><Rocket className="h-4 w-4" /></div>
            </CardContent>
          </Card>
          <Card className="border-border/80 bg-card/80">
            <CardContent className="flex items-center justify-between p-4">
              <div><p className="text-xs font-medium text-muted-foreground">Running</p><p className="mt-1 text-2xl font-semibold tabular-nums">{apps.filter((app) => ["LIVE", "RUNNING"].includes(app.status.toUpperCase())).length}</p></div>
              <div className="rounded-lg bg-emerald-500/10 p-2.5 text-emerald-400"><CheckCircle2 className="h-4 w-4" /></div>
            </CardContent>
          </Card>
          <Card className="border-border/80 bg-card/80">
            <CardContent className="flex items-center justify-between p-4">
              <div><p className="text-xs font-medium text-muted-foreground">Deploying</p><p className="mt-1 text-2xl font-semibold tabular-nums">{apps.filter((app) => app.status.toUpperCase() === "DEPLOYING").length}</p></div>
              <div className="rounded-lg bg-amber-500/10 p-2.5 text-amber-400"><Activity className="h-4 w-4" /></div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {apps.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 px-6 text-center border-dashed">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary text-primary mb-4">
            <Rocket className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-semibold">No applications deployed yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm mt-1.5 mb-6">
            Get started by creating your first autonomous application or deploying with our CLI.
          </p>
          <Button asChild>
            <Link href="/apps/new" className="gap-2">
              <Plus className="h-4 w-4" />
              <span>Deploy your first app</span>
            </Link>
          </Button>
        </Card>
      ) : (
        /* Applications Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-5">
          {apps.map((app) => {
            const statusUpper = app.status.toUpperCase();
            const isLive = statusUpper === "LIVE" || statusUpper === "RUNNING";
            const isSleeping = statusUpper === "SLEEPING";
            const isDeploying = statusUpper === "DEPLOYING";
            const lastDeployment = app.deployments[0];
            const primaryDb = app.databases[0];

            return (
              <Card
                key={app.id}
                className="group relative flex flex-col justify-between border-border/80 bg-card/90 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-black/10"
              >
                <div>
                  <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                    <div className="space-y-1 pr-2">
                      <CardTitle className="text-lg font-bold leading-none tracking-tight">
                        <Link
                          href={`/apps/${app.id}`}
                          className="hover:underline flex items-center gap-1.5"
                        >
                          {app.name}
                          <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                        </Link>
                      </CardTitle>
                      <a
                        href={`https://${app.subdomain}.nebula.app`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Globe className="h-3 w-3" />
                        <span>{app.subdomain}.nebula.app</span>
                      </a>
                    </div>

                    {/* Status Badge */}
                    {isLive && (
                      <Badge
                        variant="outline"
                        className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-medium text-xs flex items-center gap-1.5 shrink-0"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        LIVE
                      </Badge>
                    )}
                    {isSleeping && (
                      <Badge
                        variant="outline"
                        className="bg-muted text-muted-foreground border-border font-medium text-xs flex items-center gap-1.5 shrink-0"
                      >
                        <Moon className="h-3 w-3" />
                        SLEEPING
                      </Badge>
                    )}
                    {isDeploying && (
                      <Badge
                        variant="outline"
                        className="bg-amber-500/10 text-amber-500 border-amber-500/20 font-medium text-xs flex items-center gap-1.5 shrink-0"
                      >
                        <Loader2 className="h-3 w-3 animate-spin" />
                        DEPLOYING
                      </Badge>
                    )}
                    {!isLive && !isSleeping && !isDeploying && (
                      <Badge variant="outline" className="font-medium text-xs shrink-0">
                        {statusUpper}
                      </Badge>
                    )}
                  </CardHeader>

                  <CardContent className="pt-0">
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {app.repository
                        ? `Connected to ${app.repository} (${app.branch || "main"})`
                        : "Direct container package deployment"}
                    </p>
                  </CardContent>
                </div>

                <CardFooter className="border-t border-border/50 py-3 text-xs text-muted-foreground flex items-center justify-between bg-muted/20">
                  <span title={lastDeployment?.createdAt ? new Date(lastDeployment.createdAt).toLocaleString() : undefined}>
                    Last deployed {timeAgo(lastDeployment?.createdAt)}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{formatRuntime(app.runtime)}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Database className="h-3 w-3" />
                      {formatDbEngine(primaryDb?.engine)}
                    </span>
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
