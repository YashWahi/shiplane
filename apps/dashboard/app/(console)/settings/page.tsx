import { Key, User, ShieldCheck, HardDrive, Bell } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getConsoleAccountId } from "@/lib/console-auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default async function SettingsPage() {
  const accountId = await getConsoleAccountId();
  const account = await prisma.account.findUnique({
    where: { id: accountId },
    include: {
      apiKeys: {
        where: { revokedAt: null },
      },
    },
  });

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="border-b border-border/60 pb-6">
        <h1 className="page-heading">Platform Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your account credentials, API access tokens, and cloud quotas.
        </p>
      </div>

      {/* Account Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              <span>Account Information</span>
            </CardTitle>
            <Badge variant="outline" className="text-emerald-500 bg-emerald-500/10 border-emerald-500/20">
              {account?.plan || "FREE"} TIER
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="block text-xs text-muted-foreground">Name</span>
              <span className="font-semibold">{account?.name || "ShipLane Developer"}</span>
            </div>
            <div>
              <span className="block text-xs text-muted-foreground">Email</span>
              <span className="font-semibold">{account?.email || "developer@ShipLane.local"}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Keys */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Key className="h-4 w-4 text-primary" />
            <span>Active API Keys &amp; Agent Tokens</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            API keys allow AI coding agents and the ShipLane CLI to authenticate with your account via RFC 8628 device flow.
          </p>

          <div className="rounded-lg border border-border p-3 font-mono text-xs text-muted-foreground bg-muted/40 flex items-center justify-between">
            <span>neb_live_••••••••••••••••••••••••</span>
            <Badge variant="secondary" className="text-[10px]">Read / Write</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Security & Infrastructure */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span>System Status &amp; Region</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Cluster Gateway</span>
            <span className="font-mono text-xs text-emerald-500">Traefik v3.3 (Online)</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Container Engine</span>
            <span className="font-mono text-xs text-emerald-500">Docker Daemon (Active)</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Primary Deployment Region</span>
            <span className="font-semibold">Singapore (ap-southeast-1)</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
