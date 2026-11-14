import { notFound } from "next/navigation";
import {
  Database,
  Clock,
  Terminal,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getConsoleAccountId } from "@/lib/console-auth";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { AddDatabaseDialog } from "@/components/add-database-dialog";
import { DatabaseActions } from "@/components/database-actions";
import { ElephantIcon, DolphinIcon, CubeIcon, LeafIcon } from "@/components/database-icons";

interface PageProps {
  params: Promise<{ id: string }>;
}

function getEngineMeta(engine: string) {
  switch (engine.toUpperCase()) {
    case "POSTGRES":
      return {
        title: "PostgreSQL",
        icon: ElephantIcon,
        color: "text-blue-500",
        bg: "bg-blue-500/10",
        defaultPort: 5432,
        scheme: "postgresql",
      };
    case "MYSQL":
      return {
        title: "MySQL",
        icon: DolphinIcon,
        color: "text-cyan-500",
        bg: "bg-cyan-500/10",
        defaultPort: 3306,
        scheme: "mysql",
      };
    case "REDIS":
      return {
        title: "Redis",
        icon: CubeIcon,
        color: "text-red-500",
        bg: "bg-red-500/10",
        defaultPort: 6379,
        scheme: "redis",
      };
    case "MONGODB":
      return {
        title: "MongoDB",
        icon: LeafIcon,
        color: "text-emerald-500",
        bg: "bg-emerald-500/10",
        defaultPort: 27017,
        scheme: "mongodb",
      };
    default:
      return {
        title: engine,
        icon: Database,
        color: "text-primary",
        bg: "bg-primary/10",
        defaultPort: 5432,
        scheme: "database",
      };
  }
}

export default async function AppDatabasesPage({ params }: PageProps) {
  const { id } = await params;
  const accountId = await getConsoleAccountId();

  const app = await prisma.application.findFirst({
    where: { id, accountId },
  });

  if (!app) {
    notFound();
  }

  const databases = await prisma.databaseInstance.findMany({
    where: {
      applicationId: id,
      status: { not: "DELETED" },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <h1 className="page-heading">Databases</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Isolated database instances provisioned in dedicated Docker bridge networks for {app.name}.
          </p>
        </div>
        <AddDatabaseDialog appId={app.id} />
      </div>

      {/* Database List or Empty State */}
      {databases.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 px-6 text-center border-dashed">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary text-primary mb-4">
            <Database className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-semibold">No databases attached</h3>
          <p className="text-sm text-muted-foreground max-w-sm mt-1.5 mb-6">
            Provision Postgres, MySQL, Redis, or MongoDB with a single click. Connection strings are automatically injected.
          </p>
          <AddDatabaseDialog appId={app.id} />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {databases.map((db) => {
            const meta = getEngineMeta(db.engine);
            const Icon = meta.icon;
            const isRunning = db.status === "RUNNING";
            const isSleeping = db.status === "SLEEPING";

            const maskedConn = `${meta.scheme}://${db.username || "ShipLane"}:****@${
              db.host || "localhost"
            }:${db.port || meta.defaultPort}/${db.databaseName || "ShipLane_db"}`;

            return (
              <Card key={db.id} className="border-border bg-card flex flex-col justify-between">
                <div>
                  <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-lg ${meta.bg} flex items-center justify-center ${meta.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                          <span>{meta.title}</span>
                          <span className="text-xs font-mono font-normal text-muted-foreground">
                            :{db.port || meta.defaultPort}
                          </span>
                        </CardTitle>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">
                          {db.databaseName || "ShipLane_db"}
                        </p>
                      </div>
                    </div>

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
                      {db.status}
                    </Badge>
                  </CardHeader>

                  <CardContent className="space-y-3 pt-2">
                    <div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span className="font-medium">Connection String (Masked)</span>
                        <span className="font-mono text-[10px]">DATABASE_URL</span>
                      </div>
                      <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-2.5 font-mono text-xs text-muted-foreground break-all border border-border/50">
                        <Terminal className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate">{maskedConn}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-1">
                      <div>
                        <span className="block text-[11px] text-muted-foreground/70">Host</span>
                        <span className="font-mono text-foreground truncate block">{db.host || "localhost"}</span>
                      </div>
                      <div>
                        <span className="block text-[11px] text-muted-foreground/70">Region</span>
                        <span className="text-foreground">{db.region || "Singapore"}</span>
                      </div>
                    </div>
                  </CardContent>
                </div>

                <CardFooter className="border-t border-border/60 py-3 bg-muted/20 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Created {new Date(db.createdAt).toLocaleDateString()}</span>
                  </div>
                  <DatabaseActions appId={app.id} databaseId={db.id} status={db.status} />
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
