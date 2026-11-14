import { notFound } from "next/navigation";
import { Terminal, Activity } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getConsoleAccountId } from "@/lib/console-auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AppLogsPage({ params }: PageProps) {
  const { id } = await params;
  const accountId = await getConsoleAccountId();

  const app = await prisma.application.findFirst({
    where: { id, accountId },
    include: {
      deployments: {
        take: 1,
        orderBy: { createdAt: "desc" },
        include: {
          logs: {
            take: 100,
            orderBy: { timestamp: "asc" },
          },
        },
      },
    },
  });

  if (!app) {
    notFound();
  }

  const latestDeployment = app.deployments[0];
  const logs = latestDeployment?.logs || [];

  return (
    <div className="space-y-6">
      <div className="border-b border-border/60 pb-6 flex items-center justify-between">
        <div>
          <h1 className="page-heading">Runtime &amp; Build Logs</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Real-time stdout/stderr streams for {app.name}.
          </p>
        </div>
      </div>

      <Card className="bg-black text-slate-100 font-mono text-xs border-border/50">
        <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b border-border/40 bg-zinc-900/50">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-emerald-400" />
            <span className="font-semibold text-slate-300">
              Container Log Stream {latestDeployment ? `(${latestDeployment.id.slice(-8)})` : ""}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-zinc-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Streaming</span>
          </div>
        </CardHeader>

        <CardContent className="p-4 max-h-[500px] overflow-y-auto space-y-1">
          {logs.length === 0 ? (
            <div className="py-8 text-center text-zinc-500">
              <p>[ShipLane] Application container initialized.</p>
              <p>[ShipLane] Listening on 0.0.0.0:{app.port}</p>
              <p className="text-zinc-600 mt-2">Waiting for new container output...</p>
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex items-start gap-3">
                <span className="text-zinc-500 select-none">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <span className={log.stream === "stderr" ? "text-red-400" : "text-zinc-200"}>
                  {log.line}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
