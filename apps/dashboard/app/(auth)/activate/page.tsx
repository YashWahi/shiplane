"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Rocket, ShieldCheck, CheckCircle2, XCircle, Loader2, ArrowRight, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { approveDeviceCode, denyDeviceCode } from "@/app/(console)/actions";

function ActivateContent() {
  const searchParams = useSearchParams();
  const initialCode = searchParams?.get("code") || searchParams?.get("user_code") || "";
  const [code, setCode] = React.useState(initialCode);
  const [status, setStatus] = React.useState<"idle" | "loading" | "approved" | "denied" | "error">("idle");
  const [clientName, setClientName] = React.useState<string>("");
  const [errorMessage, setErrorMessage] = React.useState<string>("");

  React.useEffect(() => {
    if (initialCode) {
      setCode(initialCode.toUpperCase());
    }
  }, [initialCode]);

  const handleApprove = async () => {
    if (!code.trim()) return;
    setStatus("loading");
    setErrorMessage("");
    const res = await approveDeviceCode(code);
    if (res.success) {
      setClientName(res.clientId || "AI Coding Agent");
      setStatus("approved");
    } else {
      setErrorMessage(res.error || "Failed to authorize session.");
      setStatus("error");
    }
  };

  const handleDeny = async () => {
    if (!code.trim()) return;
    setStatus("loading");
    const res = await denyDeviceCode(code);
    if (res.success) {
      setStatus("denied");
    } else {
      setErrorMessage(res.error || "Failed to deny session.");
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2.5 font-bold text-2xl tracking-tight">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Rocket className="h-5 w-5" />
            </div>
            <span>Nebula</span>
          </Link>
          <p className="text-sm text-muted-foreground">Device Authorization Grant (RFC 8628)</p>
        </div>

        <Card className="border-border shadow-md">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Terminal className="h-5 w-5 text-primary" />
              <span>Connect AI Agent</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Confirm the 8-character confirmation code shown in your terminal or AI coding assistant.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {status === "approved" ? (
              <div className="space-y-4 py-4 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-foreground">Agent Authorized!</h3>
                  <p className="text-sm text-muted-foreground">
                    Connected to <span className="font-semibold text-foreground">{clientName}</span>. You can now close this browser tab and return to your agent.
                  </p>
                </div>
                <div className="pt-2">
                  <Button asChild className="w-full">
                    <Link href="/apps">Go to Console</Link>
                  </Button>
                </div>
              </div>
            ) : status === "denied" ? (
              <div className="space-y-4 py-4 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                  <XCircle className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-foreground">Authorization Rejected</h3>
                  <p className="text-sm text-muted-foreground">
                    The authorization request has been denied. No access token was issued.
                  </p>
                </div>
                <div className="pt-2">
                  <Button variant="outline" asChild className="w-full">
                    <Link href="/">Back to Home</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="userCode" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Confirmation Code
                  </label>
                  <Input
                    id="userCode"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="XXXX-XXXX"
                    className="text-center font-mono text-xl tracking-widest uppercase font-bold h-12"
                    maxLength={9}
                    disabled={status === "loading"}
                  />
                </div>

                {errorMessage && (
                  <div className="p-3 text-xs rounded-md bg-destructive/10 text-destructive border border-destructive/20 font-medium space-y-2">
                    <p>{errorMessage}</p>
                    {errorMessage.toLowerCase().includes("sign in") && (
                      <Button asChild size="sm" className="w-full">
                        <Link href={`/login?callbackUrl=/activate?code=${encodeURIComponent(code)}`}>
                          Sign In with Demo Account
                        </Link>
                      </Button>
                    )}
                  </div>
                )}

                <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
                  <div className="font-semibold text-foreground">Permissions Requested:</div>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>Create and deploy container applications</li>
                    <li>Provision managed PostgreSQL databases</li>
                    <li>Inject environment variables and secrets</li>
                  </ul>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Button
                    onClick={handleApprove}
                    disabled={status === "loading" || !code.trim()}
                    className="flex-1 font-semibold"
                  >
                    {status === "loading" ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        <span>Authorizing...</span>
                      </>
                    ) : (
                      <>
                        <span>Approve</span>
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleDeny}
                    disabled={status === "loading" || !code.trim()}
                    className="font-semibold"
                  >
                    Deny
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          <span>ShipLane Secure RFC 8628 Verification</span>
        </div>
      </div>
    </div>
  );
}

export default function ActivatePage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ActivateContent />
    </React.Suspense>
  );
}
