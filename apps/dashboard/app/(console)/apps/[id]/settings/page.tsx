import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getConsoleAccountId } from "@/lib/console-auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { SecretsEditor } from "@/components/secrets-editor";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AppSettingsPage({ params }: PageProps) {
  const { id } = await params;
  const accountId = await getConsoleAccountId();

  const app = await prisma.application.findFirst({
    where: { id, accountId },
    include: {
      secrets: {
        select: {
          name: true,
        },
        orderBy: { name: "asc" },
      },
    },
  });

  if (!app) {
    notFound();
  }

  const existingKeys = app.secrets.map((s) => s.name);

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="border-b border-border/60 pb-6">
        <h1 className="page-heading">Application Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage configuration, write-only environment variables, and scaling policies for {app.name}.
        </p>
      </div>

      <Card className="border-border">
        <CardContent className="p-6">
          <SecretsEditor
            appId={app.id}
            existingKeys={existingKeys}
            scalingEnabled={app.scalingEnabled}
          />
        </CardContent>
      </Card>
    </div>
  );
}
