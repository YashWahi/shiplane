import { notFound } from "next/navigation";
import { Gauge, Cpu, Layers } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getConsoleAccountId } from "@/lib/console-auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AppScalingPage({ params }: PageProps) {
  const { id } = await params;
  const accountId = await getConsoleAccountId();

  const app = await prisma.application.findFirst({
    where: { id, accountId },
  });

  if (!app) {
    notFound();
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="border-b border-border/60 pb-6">
        <h1 className="page-heading">Auto-Scaling Policy</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Configure autonomous container replicas and concurrency targets for {app.name}.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <span className="text-xs font-medium text-muted-foreground">Active Replicas</span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{app.currentInstances}</div>
            <p className="text-xs text-muted-foreground mt-1">Healthy running containers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <span className="text-xs font-medium text-muted-foreground">Min Instances</span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{app.minInstances}</div>
            <p className="text-xs text-muted-foreground mt-1">0 allows scale-to-zero sleeping</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <span className="text-xs font-medium text-muted-foreground">Max Instances</span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{app.maxInstances}</div>
            <p className="text-xs text-muted-foreground mt-1">Hard concurrency cap</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Gauge className="h-4 w-4 text-primary" />
              <span>Scale-to-Zero Architecture</span>
            </CardTitle>
            <Badge variant="outline" className={app.scalingEnabled ? "text-emerald-500" : "text-muted-foreground"}>
              {app.scalingEnabled ? "ACTIVE" : "DISABLED"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            When autonomous auto-scaling is enabled, ShipLane monitors incoming HTTP request latency and queue depths. If an application receives zero requests for more than 15 minutes, its containers automatically pause (&quot;sleep&quot;).
          </p>
          <p>
            The next incoming request is caught by the Traefik reverse proxy gateway, which issues a wake trigger to Docker to boot the container in under 300ms.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
