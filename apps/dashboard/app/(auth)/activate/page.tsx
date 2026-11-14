"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Rocket, ShieldCheck, CheckCircle2, XCircle, Loader2, ArrowRight, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12 relative">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-3 font-bold text-2xl tracking-tight group">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0066FF] text-white shadow-md shadow-blue-500/30 group-hover:scale-105 transition-transform">
              <Rocket className="h-5 w-5" />
            </div>
            <span className="font-bold tracking-tight text-foreground">ShipLane</span>
          </Link>
          <p className="text-sm text-muted-foreground">Device Authorization Grant (RFC 8628)</p>
        </div>

        <div className="taskible-card rounded-[24px] p-7 space-y-5 shadow-xl">
          <div className="space-y-1">
            <h2 className="text-lg font-bold flex items-center gap-2.5 text-foreground">
              <div className="h-8 w-8 rounded-xl bg-[#0066FF]/10 flex items-center justify-center text-[#0066FF]">
                <Terminal className="h-4 w-4" />
              </div>
              <span>Connect AI Agent</span>
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Confirm the 8-character confirmation code shown in your terminal or AI coding assistant.
            </p>
          </div>

          <div>
            {status === "approved" ? (
              <div className="space-y-4 py-4 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-foreground">Agent Authorized!</h3>
                  <p className="text-sm text-muted-foreground">
                    Connected to <span className="font-semibold text-foreground">{clientName}</span>. You can now close this browser tab and return to your agent.
                  </p>
                </div>
                <div className="pt-2">
                  <Button asChild variant="taskible" className="w-full">
                    <Link href="/apps">Go to Console</Link>
                  </Button>
                </div>
              </div>
            ) : status === "denied" ? (
              <div className="space-y-4 py-4 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/15 text-destructive border border-destructive/30">
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
                    className="text-center font-mono text-xl tracking-widest uppercase font-bold h-12 rounded-full border-border/80 bg-background/50 focus:border-[#0066FF]"
                    maxLength={9}
                    disabled={status === "loading"}
                  />
                </div>

                {errorMessage && (
                  <div className="p-3 text-xs rounded-xl bg-destructive/10 text-destructive border border-destructive/20 font-medium space-y-2">
                    <p>{errorMessage}</p>
                    {errorMessage.toLowerCase().includes("sign in") && (
                      <Button asChild size="sm" variant="taskible" className="w-full">
                        <Link href={`/login?callbackUrl=/activate?code=${encodeURIComponent(code)}`}>
                          Sign In with Demo Account
                        </Link>
                      </Button>
                    )}
                  </div>
                )}

                <div className="rounded-2xl bg-muted/50 p-4 text-xs text-muted-foreground space-y-2">
                  <div className="font-bold text-foreground">Permissions Requested:</div>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Create and deploy container applications</li>
                    <li>Provision managed PostgreSQL databases</li>
                    <li>Inject environment variables and secrets</li>
                  </ul>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Button
                    onClick={handleApprove}
                    disabled={status === "loading" || !code.trim()}
                    variant="taskible"
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
                    variant="taskibleSecondary"
                    onClick={handleDeny}
                    disabled={status === "loading" || !code.trim()}
                    className="font-semibold"
                  >
                    Deny
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5 font-medium">
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
