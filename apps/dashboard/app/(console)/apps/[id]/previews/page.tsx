import { notFound } from "next/navigation";
import { GitBranch, ExternalLink, Clock, AlertCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getConsoleAccountId } from "@/lib/console-auth";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { PreviewActions } from "@/components/preview-actions";

interface PageProps {
  params: Promise<{ id: string }>;
}

function formatExpiresIn(expiresAt: Date | null): string {
  if (!expiresAt) return "Permanent";
  const now = new Date();
  const diffInMs = new Date(expiresAt).getTime() - now.getTime();
  if (diffInMs <= 0) return "Expired";

  const hours = Math.floor(diffInMs / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) {
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h`;
  }
  const minutes = Math.floor((diffInMs / (1000 * 60)) % 60);
  return `${hours}h ${minutes}m`;
}

export default async function AppPreviewsPage({ params }: PageProps) {
  const { id } = await params;
  const accountId = await getConsoleAccountId();

  const app = await prisma.application.findFirst({
    where: { id, accountId },
  });

  if (!app) {
    notFound();
  }

  const previews = await prisma.previewEnvironment.findMany({
    where: {
      applicationId: id,
      status: { not: "DESTROYED" },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <h1 className="page-heading">Preview Environments</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Ephemeral staging deployments automatically provisioned for feature branches of {app.name}.
          </p>
        </div>
      </div>

      {/* Previews List or Empty State */}
      {previews.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 px-6 text-center border-dashed">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary text-primary mb-4">
            <GitBranch className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-semibold">No active preview environments</h3>
          <p className="text-sm text-muted-foreground max-w-md mt-1.5 mb-2">
            Push a branch to GitHub to create a preview.
          </p>
          <p className="text-xs text-muted-foreground max-w-sm">
            Each branch gets an isolated HTTPS URL, auto-cleanup after 7 days, and automated security scans.
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="font-semibold">Branch Name</TableHead>
                <TableHead className="font-semibold">Preview URL</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Created</TableHead>
                <TableHead className="font-semibold">Expires In</TableHead>
                <TableHead className="text-right font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {previews.map((preview) => {
                const previewUrl = `https://${preview.previewSubdomain}.nebula.app`;
                const isLive = preview.status === "LIVE";

                return (
                  <TableRow key={preview.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <GitBranch className="h-4 w-4 text-primary shrink-0" />
                        <code className="font-mono text-xs font-semibold bg-muted px-2 py-0.5 rounded">
                          {preview.branch}
                        </code>
                      </div>
                    </TableCell>

                    <TableCell>
                      <a
                        href={previewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-mono text-xs text-primary hover:underline"
                      >
                        <span>{preview.previewSubdomain}.nebula.app</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          isLive
                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-xs"
                            : "bg-amber-500/10 text-amber-500 border-amber-500/20 text-xs"
                        }
                      >
                        {preview.status}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(preview.createdAt).toLocaleDateString()}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{formatExpiresIn(preview.expiresAt)}</span>
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <PreviewActions appId={app.id} previewId={preview.id} url={previewUrl} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
