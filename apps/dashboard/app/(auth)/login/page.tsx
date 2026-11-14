"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Rocket, ArrowRight, ShieldCheck, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...props}>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("demo@nebula.local");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isDemoLoading, setIsDemoLoading] = React.useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");

  const handleSignIn = async (targetEmail: string, isDemo = false) => {
    if (isDemo) {
      setIsDemoLoading(true);
    } else {
      setIsLoading(true);
    }
    setErrorMessage("");

    try {
      const res = await signIn("credentials", {
        email: targetEmail.trim().toLowerCase(),
        redirect: false,
      });

      if (res?.ok) {
        router.push("/apps");
        router.refresh();
      } else {
        setErrorMessage("Sign-in failed. Please verify the server is running and try again.");
      }
    } catch {
      setErrorMessage("An unexpected error occurred during sign-in.");
    } finally {
      setIsLoading(false);
      setIsDemoLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setErrorMessage("");
    try {
      await signIn("google", { callbackUrl: "/apps" });
    } catch {
      setErrorMessage("Google authentication failed. Please verify GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET are configured.");
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMessage("Please enter an email address.");
      return;
    }
    handleSignIn(email);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <ThemeToggle className="absolute right-4 top-4 sm:right-6 sm:top-6" />

      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-3 font-bold text-2xl tracking-tight group">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0066FF] text-white shadow-md shadow-blue-500/30 group-hover:scale-105 transition-transform">
              <Rocket className="h-5 w-5" />
            </div>
            <span className="font-bold tracking-tight text-foreground">ShipLane</span>
          </Link>
          <p className="text-sm text-muted-foreground">Sign in to your autonomous deployment console</p>
        </div>

        <div className="taskible-card rounded-[24px] p-7 space-y-5 shadow-xl">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-foreground">Sign In</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Access the developer console with 1-click demo access, Google OAuth, or custom credentials.
            </p>
          </div>

          <div className="space-y-4">
            {/* 1-Click Demo Login */}
            <Button
              type="button"
              onClick={() => handleSignIn("demo@nebula.local", true)}
              disabled={isDemoLoading || isLoading || isGoogleLoading}
              variant="taskible"
              className="w-full gap-2 font-semibold shadow-md"
              size="lg"
            >
              {isDemoLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading demo workspace...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Continue with Demo Account</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>

            {/* Google OAuth Login */}
            <Button
              type="button"
              variant="taskibleSecondary"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || isLoading || isDemoLoading}
              className="w-full gap-2 font-semibold"
            >
              {isGoogleLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Connecting to Google...</span>
                </>
              ) : (
                <>
                  <GoogleIcon />
                  <span>Sign in with Google</span>
                </>
              )}
            </Button>

            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/80" />
              </div>
              <span className="relative bg-card px-2 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Or custom email
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold">
                  Developer Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="demo@nebula.local"
                  required
                  className="rounded-full border-border/80 bg-background/50 focus:border-[#0066FF] h-11 px-4 text-sm"
                />
              </div>

              {errorMessage ? (
                <p role="alert" className="text-xs text-destructive font-medium">
                  {errorMessage}
                </p>
              ) : null}

              <Button
                type="submit"
                variant="outline"
                disabled={isLoading || isDemoLoading || isGoogleLoading}
                className="w-full gap-2 font-semibold rounded-full h-11"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign in with Email</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>

        <div className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5 font-medium">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          <span>Demo account: demo@nebula.local</span>
        </div>
      </div>
    </div>
  );
}
