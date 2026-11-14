import Link from "next/link";
import {
  Rocket,
  Zap,
  Database,
  GitBranch,
  ArrowRight,
  ShieldCheck,
  Terminal,
  Check,
  Cpu,
  Lock,
  Layers,
  HelpCircle,
  ExternalLink,
  Sparkles,
  XCircle,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CopyPromptButton } from "@/components/copy-prompt-button";
import { ThemeToggle } from "@/components/theme-toggle";

export default function MarketingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Top Navbar */}
      <header className="border-b border-border/70 sticky top-0 z-40 bg-background/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-lg tracking-tight">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/20">
              <Rocket className="h-4 w-4" />
            </div>
            <span>ShipLane</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-6">
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
              <Link href="#how-it-works" className="hover:text-foreground transition-colors">
                How It Works
              </Link>
              <Link href="#why-ShipLane" className="hover:text-foreground transition-colors">
                Why ShipLane
              </Link>
              <Link href="#features" className="hover:text-foreground transition-colors">
                Features
              </Link>
              <Link href="#pricing" className="hover:text-foreground transition-colors">
                Pricing
              </Link>
              <Link href="/agent.md" target="_blank" className="hover:text-foreground transition-colors flex items-center gap-1">
                <span>Docs</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            </nav>
            <div className="flex items-center gap-2 sm:gap-3">
              <ThemeToggle />
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/apps">Console</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1">
        <div className="max-w-4xl mx-auto text-center pt-20 pb-16 px-4 sm:px-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/80 px-3.5 py-1 text-xs text-muted-foreground mb-8 bg-card/70 shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Agent-Native Cloud Platform</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-foreground leading-[1.1]">
            Put your app online.
            <br />
            <span className="bg-gradient-to-r from-primary via-primary/80 to-muted-foreground bg-clip-text text-transparent">
              Just ask your agent.
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-muted-foreground mt-6 max-w-2xl mx-auto leading-relaxed">
            The zero-config deployment platform built for non-technical creators and modern developers.
            Skip the complexity of Vercel, AWS, and Docker. Connect your AI coding agent, approve in one click, and go live.
          </p>

          {/* Copy Prompt Container */}
          <div className="mt-10 max-w-2xl mx-auto">
            <div className="rounded-xl border border-border bg-card p-4 shadow-lg text-left">
              <div className="flex items-center justify-between pb-3 border-b border-border/50 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-primary" />
                  <span className="font-mono">Prompt your AI agent</span>
                </div>
                <span className="text-[11px] bg-secondary/80 px-2 py-0.5 rounded">1-Click Deploy</span>
              </div>
              <div className="py-3 font-mono text-sm text-foreground/90 break-words leading-relaxed select-all">
                Deploy my project to Nebula. Fetch https://nebula.app/agent.md and follow it.
              </div>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <CopyPromptButton size="default" className="w-full sm:w-auto shadow-sm" />
                <Button asChild variant="outline" size="default" className="w-full sm:w-auto">
                  <Link href="/apps" className="flex items-center gap-2">
                    <span>Open Web Console</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-8 text-xs text-muted-foreground flex flex-wrap items-center justify-center gap-x-5 gap-y-3 sm:gap-6">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-500" /> Sandboxed Execution
            </span>
            <span className="flex items-center gap-1.5">
              <Terminal className="h-4 w-4 text-primary" /> Single Prompt Deploy
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-amber-500" /> Zero Vercel Config
            </span>
            <span className="flex items-center gap-1.5">
              <Lock className="h-4 w-4 text-blue-500" /> Free HTTPS & Scale-to-Zero
            </span>
          </div>
        </div>

        {/* Comparison Section: ShipLane vs Traditional Vercel/Cloud */}
        <section id="why-ShipLane" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 border-t border-border/60">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-3">
              Built for Non-Tech Creators
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Deploying AI-built code shouldn't require a DevOps degree</h2>
            <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
              If an AI coding assistant wrote your app, why should you spend hours debugging cloud dashboards, Vercel build configs, and database connection strings?
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* The Hard Way: Vercel & Traditional Cloud */}
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 space-y-4">
              <div className="flex items-center gap-2 font-bold text-destructive">
                <XCircle className="h-5 w-5" />
                <span>The Traditional Cloud Way (Vercel, AWS)</span>
              </div>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-destructive font-bold">✕</span>
                  <span>Must create and link GitHub repos, configure git remotes, and grant oauth app permissions.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive font-bold">✕</span>
                  <span>Cryptic build errors: wrong Node version, root directory mismatch, missing build scripts.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive font-bold">✕</span>
                  <span>Must manually sign up for external database providers (Supabase, Neon) and copy connection strings.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive font-bold">✕</span>
                  <span>Copying & pasting sensitive API tokens into AI chats risks credential leakage.</span>
                </li>
              </ul>
            </div>

            {/* The ShipLane Way */}
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-6 space-y-4">
              <div className="flex items-center gap-2 font-bold text-emerald-500">
                <Check className="h-5 w-5" />
                <span>The ShipLane Agent Way</span>
              </div>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span><strong>Zero cloud setup:</strong> Give your AI assistant 1 sentence and let it handle everything.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span><strong>Automatic inference:</strong> Detects Next.js, Node, Python, Vite, Go, and ports automatically.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span><strong>Built-in PostgreSQL:</strong> Instant database container with <code className="text-xs bg-muted px-1 py-0.5 rounded">DATABASE_URL</code> auto-injected.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span><strong>1-Click browser approve:</strong> Secure RFC 8628 device flow with zero token exposure in chat.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* How It Works (4 Steps) */}
        <section id="how-it-works" className="max-w-6xl mx-auto px-4 sm:px-6 py-20 border-t border-border/60">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-3">
              Workflow
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">How it works in 4 simple steps</h2>
            <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
              From local code to a production URL in under 60 seconds without touching cloud consoles.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="rounded-xl border border-border bg-card/40 p-6 space-y-3 relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-lg">
                1
              </div>
              <h3 className="font-bold text-lg">Copy Prompt</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Copy the single-sentence instruction pointing to <span className="font-mono text-xs">agent.md</span>.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card/40 p-6 space-y-3 relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-lg">
                2
              </div>
              <h3 className="font-bold text-lg">Paste into Agent</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Works with Claude Code, Cursor, Windsurf, Codex, Antigravity, or terminal CLI.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card/40 p-6 space-y-3 relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-lg">
                3
              </div>
              <h3 className="font-bold text-lg">1-Click Approval</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Approve the device authorization in your browser at <span className="font-mono text-xs">/activate</span> with zero API key leaks.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card/40 p-6 space-y-3 relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 font-bold text-lg">
                4
              </div>
              <h3 className="font-bold text-lg">Get Live Link</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your app is compiled, containerized, provisioned with Postgres, and live on HTTPS.
              </p>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="max-w-6xl mx-auto px-4 sm:px-6 py-20 border-t border-border/60">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-3">
              Platform Features
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Everything you need to ship</h2>
            <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
              Zero DevOps required. Powered by modern container infrastructure, scale-to-zero runtimes, and agent protocols.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1: Zero-Config Inference */}
            <Card className="border-border bg-card/50 hover:bg-card transition-colors">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 mb-2">
                  <Zap className="h-5 w-5" />
                </div>
                <CardTitle className="text-xl">Zero-Config Inference</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  No Dockerfile or YAML required. ShipLane inspects your repository to infer runtimes (Node.js, Next.js, Python, Django, Go, Ruby), build scripts, and ports automatically.
                </p>
              </CardContent>
            </Card>

            {/* Feature 2: Built-in Managed PostgreSQL */}
            <Card className="border-border bg-card/50 hover:bg-card transition-colors">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 mb-2">
                  <Database className="h-5 w-5" />
                </div>
                <CardTitle className="text-xl">Instant PostgreSQL & S3</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Provision isolated PostgreSQL databases and private S3-compatible storage buckets with one click or agent command. Connection strings and credentials are automatically injected.
                </p>
              </CardContent>
            </Card>

            {/* Feature 3: Scale-to-Zero */}
            <Card className="border-border bg-card/50 hover:bg-card transition-colors">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-2">
                  <Cpu className="h-5 w-5" />
                </div>
                <CardTitle className="text-xl">Scale-to-Zero Compute</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Server apps automatically go to sleep when idle, cutting compute waste. Incoming HTTP requests wake containers back up in milliseconds via Traefik edge proxying.
                </p>
              </CardContent>
            </Card>

            {/* Feature 4: Ephemeral Previews */}
            <Card className="border-border bg-card/50 hover:bg-card transition-colors">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500 mb-2">
                  <GitBranch className="h-5 w-5" />
                </div>
                <CardTitle className="text-xl">Preview Environments</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Every branch gets its own isolated staging URL. Test changes, run automatic security checks, and share preview links with teammates before merging.
                </p>
              </CardContent>
            </Card>

            {/* Feature 5: Agent-Native & MCP */}
            <Card className="border-border bg-card/50 hover:bg-card transition-colors">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500 mb-2">
                  <Terminal className="h-5 w-5" />
                </div>
                <CardTitle className="text-xl">MCP Server & Device Auth</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Native Model Context Protocol (<span className="font-mono text-xs">ShipLane-mcp</span>) and RFC 8628 OAuth Device Authorization allow agents to deploy securely without exposing raw tokens in chat.
                </p>
              </CardContent>
            </Card>

            {/* Feature 6: Multiple Deploy Sources */}
            <Card className="border-border bg-card/50 hover:bg-card transition-colors">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-500 mb-2">
                  <Layers className="h-5 w-5" />
                </div>
                <CardTitle className="text-xl">Agent, GitHub, or Folder</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Deploy however you like: ask your AI coding assistant, connect a GitHub repository for automatic git-push deployments, or drag and drop a folder directly into the web console.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="max-w-6xl mx-auto px-4 sm:px-6 py-20 border-t border-border/60">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-3">
              Pricing Plans
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Simple, transparent pricing</h2>
            <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
              Start free forever. Failed deploys never count against your limits. Scale when your app gets real users.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Plan 1: Free */}
            <Card className="border-border bg-card/50 flex flex-col justify-between">
              <CardHeader>
                <CardTitle className="text-lg">Free</CardTitle>
                <CardDescription className="text-xs">For experimenting & first projects</CardDescription>
                <div className="pt-4">
                  <span className="text-3xl font-extrabold">₹0</span>
                  <span className="text-xs text-muted-foreground"> / forever</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-xs flex-1">
                <div className="font-semibold text-foreground pb-1">Included:</div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span><strong>1 live app</strong> with a server</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Unlimited static sites</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>30 successful deploys / mo</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>1 Postgres database</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>1 S3 storage bucket</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Idle auto-sleep & health checks</span>
                </div>
              </CardContent>
              <CardFooter className="pt-4">
                <Button asChild variant="outline" className="w-full" size="sm">
                  <Link href="/login">Get Started Free</Link>
                </Button>
              </CardFooter>
            </Card>

            {/* Plan 2: Go */}
            <Card className="border-border bg-card/50 flex flex-col justify-between">
              <CardHeader>
                <CardTitle className="text-lg">Go</CardTitle>
                <CardDescription className="text-xs">For side projects outgrowing free</CardDescription>
                <div className="pt-4">
                  <span className="text-3xl font-extrabold">₹399</span>
                  <span className="text-xs text-muted-foreground"> / month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-xs flex-1">
                <div className="font-semibold text-foreground pb-1">Everything in Free, plus:</div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span><strong>3 live apps</strong> with a server</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span><strong>Unlimited</strong> deploys</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Up to 3 custom domains + HTTPS</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>1 Postgres database</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>2 S3 storage buckets</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Standard email support</span>
                </div>
              </CardContent>
              <CardFooter className="pt-4">
                <Button asChild variant="outline" className="w-full" size="sm">
                  <Link href="/login">Upgrade to Go</Link>
                </Button>
              </CardFooter>
            </Card>

            {/* Plan 3: Pro (Highlighted) */}
            <Card className="border-primary bg-card flex flex-col justify-between relative shadow-md">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground text-[10px] px-2 py-0.5">
                  Most Popular
                </Badge>
              </div>
              <CardHeader>
                <CardTitle className="text-lg">Pro</CardTitle>
                <CardDescription className="text-xs">For apps with real users</CardDescription>
                <div className="pt-4">
                  <span className="text-3xl font-extrabold">₹1,999</span>
                  <span className="text-xs text-muted-foreground"> / month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-xs flex-1">
                <div className="font-semibold text-foreground pb-1">Everything in Go, plus:</div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span><strong>9 live apps</strong> with a server</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span><strong>Unlimited</strong> custom domains</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>3 Postgres databases</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>3 S3 storage buckets</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>₹100 monthly AI credit included</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Priority email support</span>
                </div>
              </CardContent>
              <CardFooter className="pt-4">
                <Button asChild className="w-full" size="sm">
                  <Link href="/login">Upgrade to Pro</Link>
                </Button>
              </CardFooter>
            </Card>

            {/* Plan 4: Scale */}
            <Card className="border-border bg-card/50 flex flex-col justify-between">
              <CardHeader>
                <CardTitle className="text-lg">Scale</CardTitle>
                <CardDescription className="text-xs">For small production teams</CardDescription>
                <div className="pt-4">
                  <span className="text-3xl font-extrabold">₹6,999</span>
                  <span className="text-xs text-muted-foreground"> / month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-xs flex-1">
                <div className="font-semibold text-foreground pb-1">Everything in Pro, plus:</div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span><strong>20 live apps</strong> with a server</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>5 Postgres databases</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>5 S3 storage buckets</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>₹100 monthly AI credit</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Direct founder & engineer support</span>
                </div>
              </CardContent>
              <CardFooter className="pt-4">
                <Button asChild variant="outline" className="w-full" size="sm">
                  <Link href="/login">Contact Sales</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 py-20 border-t border-border/60">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-3">
              FAQ
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-6">
            <div className="rounded-lg border border-border p-5 bg-card/40 space-y-2">
              <h3 className="font-semibold text-base flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-primary" />
                <span>I'm not a technical developer. Can I really deploy without Vercel or cloud knowledge?</span>
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed pl-6">
                Yes! That is exactly what ShipLane is built for. If you used an AI coding assistant (like Claude Code, Cursor, Windsurf, or Codex) to generate your website or app, you simply paste our 1-line prompt into the chat. Your agent talks directly to ShipLane, provisions what your code needs, and gives you a working public HTTPS link.
              </p>
            </div>

            <div className="rounded-lg border border-border p-5 bg-card/40 space-y-2">
              <h3 className="font-semibold text-base flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-primary" />
                <span>How does ShipLane compare to Vercel?</span>
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed pl-6">
                Vercel expects you to manage GitHub repositories, framework presets, custom environment variables, and external databases separately. ShipLane connects directly to your AI agent, infers your framework, starts a managed PostgreSQL database with connection strings already injected, and eliminates manual cloud configuration.
              </p>
            </div>

            <div className="rounded-lg border border-border p-5 bg-card/40 space-y-2">
              <h3 className="font-semibold text-base flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-primary" />
                <span>What happens when my application is idle?</span>
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed pl-6">
                To conserve compute resources and keep costs zero, server apps automatically scale down to sleep when inactive. The very first visitor request wakes the container back up within milliseconds via our Traefik reverse proxy.
              </p>
            </div>

            <div className="rounded-lg border border-border p-5 bg-card/40 space-y-2">
              <h3 className="font-semibold text-base flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-primary" />
                <span>Do failed deployments count against my monthly allowance?</span>
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed pl-6">
                Never. Only successful deployments count against your limits. If your AI assistant is testing a fix or a build fails, you are never penalized or billed for failed attempts.
              </p>
            </div>
          </div>
        </section>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Rocket className="h-4 w-4 text-primary" />
            <span>© {new Date().getFullYear()} ShipLane Cloud. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/agent.md" target="_blank" className="hover:text-foreground transition-colors">
              Agent Docs
            </Link>
            <Link href="/pricing" className="hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms
            </Link>
            <Link href="https://github.com" target="_blank" className="hover:text-foreground transition-colors">
              GitHub
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
