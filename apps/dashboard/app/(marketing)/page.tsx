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
  Activity,
  Globe,
  Server,
  Code2,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CopyPromptButton } from "@/components/copy-prompt-button";
import { ThemeToggle } from "@/components/theme-toggle";

export default function MarketingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground relative selection:bg-primary/20 selection:text-foreground">
      {/* Ambient background glows matching Taskible aesthetic */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1100px] h-[550px] bg-gradient-to-b from-blue-500/15 via-blue-600/5 to-transparent blur-3xl rounded-full" />
        <div className="absolute top-[45%] -left-40 w-[600px] h-[600px] bg-blue-500/10 blur-[130px] rounded-full" />
        <div className="absolute top-[70%] -right-40 w-[600px] h-[600px] bg-indigo-500/10 blur-[130px] rounded-full" />
      </div>

      {/* Floating Pill Navbar (Taskible exact layout & proportions) */}
      <header className="sticky top-4 z-50 w-full px-4 sm:px-6">
        <div className="max-w-[1220px] mx-auto rounded-full border border-blue-500/15 bg-background/85 dark:bg-[#001A41]/85 backdrop-blur-xl shadow-lg shadow-black/5 dark:shadow-black/30 px-5 sm:px-7 h-[68px] flex items-center justify-between transition-all">
          <Link href="/" className="flex items-center gap-3 font-bold text-xl tracking-tight group">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0066FF] text-white shadow-md shadow-blue-500/30 group-hover:scale-105 transition-transform">
              <Rocket className="h-5 w-5" />
            </div>
            <span className="text-foreground font-bold tracking-tight">ShipLane</span>
          </Link>

          <div className="flex items-center gap-3 sm:gap-6">
            <nav className="hidden md:flex items-center gap-1 text-[15px] font-semibold text-muted-foreground">
              <Link
                href="#how-it-works"
                className="px-3.5 py-2 rounded-full hover:text-foreground hover:bg-muted/80 transition-all"
              >
                How It Works
              </Link>
              <Link
                href="#why-ShipLane"
                className="px-3.5 py-2 rounded-full hover:text-foreground hover:bg-muted/80 transition-all"
              >
                Why ShipLane
              </Link>
              <Link
                href="#features"
                className="px-3.5 py-2 rounded-full hover:text-foreground hover:bg-muted/80 transition-all"
              >
                Features
              </Link>
              <Link
                href="#pricing"
                className="px-3.5 py-2 rounded-full hover:text-foreground hover:bg-muted/80 transition-all"
              >
                Pricing
              </Link>
              <Link
                href="/agent.md"
                target="_blank"
                className="px-3.5 py-2 rounded-full hover:text-foreground hover:bg-muted/80 transition-all flex items-center gap-1"
              >
                <span>Docs</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </nav>

            <div className="flex items-center gap-2 sm:gap-3">
              <ThemeToggle />
              <Button asChild variant="taskibleSecondary" size="sm" className="hidden sm:inline-flex">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild size="sm" variant="taskible" className="px-5 font-semibold">
                <Link href="/apps">Console</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section (Taskible 3-line H1 with "— Effortlessly." line, subcopy, CTA, dashboard) */}
      <section className="flex-1 pt-16 sm:pt-20 md:pt-24 pb-20">
        <div className="max-w-[1220px] mx-auto text-center px-4 sm:px-6">
          {/* Eyebrow Pill Badge */}
          <div className="taskible-eyebrow mb-8">
            <span className="flex h-2 w-2 rounded-full bg-[#0066FF] animate-pulse" />
            <span>AGENT-NATIVE CLOUD PLATFORM</span>
          </div>

          {/* 3-Line H1 Headline with Playfair Display italic highlight */}
          <h1 className="text-4xl sm:text-6xl md:text-[64px] font-semibold text-foreground tracking-[-0.03em] leading-[1.1] max-w-4xl mx-auto text-balance">
            Put your app online.
            <br />
            Just ask your agent
            <br />
            <span className="heading-highlight">— Effortlessly.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg md:text-[18px] text-muted-foreground mt-7 max-w-2xl mx-auto leading-[1.6]">
            The zero-config deployment platform built for non-technical creators and modern developers.
            Skip the complexity of Vercel, AWS, and Docker. Connect your AI coding agent, approve in one click, and go live.
          </p>

          {/* Interactive Prompt Action Card */}
          <div className="mt-10 max-w-2xl mx-auto">
            <div className="taskible-card p-6 text-left border-blue-500/20 bg-card/90 dark:bg-[#050F26]/90 backdrop-blur-xl">
              <div className="flex items-center justify-between pb-3.5 border-b border-border/80 text-xs text-muted-foreground">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-[#0066FF]/10 flex items-center justify-center text-[#0066FF]">
                    <Terminal className="h-4 w-4" />
                  </div>
                  <span className="font-mono font-semibold text-foreground">Prompt your AI agent</span>
                </div>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#0066FF]/10 text-[#0066FF] border border-[#0066FF]/20">
                  1-Click Deploy
                </span>
              </div>

              <div className="py-4 font-mono text-sm text-foreground break-words leading-relaxed select-all bg-muted/60 dark:bg-black/30 rounded-xl p-4 my-3 border border-border/80">
                Deploy my project to Nebula. Fetch https://nebula.app/agent.md and follow it.
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <CopyPromptButton size="default" variant="taskible" className="w-full sm:w-auto shadow-md" />
                <Button asChild variant="taskibleSecondary" size="default" className="w-full sm:w-auto">
                  <Link href="/apps" className="flex items-center gap-2">
                    <span>Open Web Console</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Micro Trust Indicators */}
          <div className="mt-8 text-xs font-semibold text-muted-foreground flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500" /> Sandboxed Execution
            </span>
            <span className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-[#0066FF]" /> Single Prompt Deploy
            </span>
            <span className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" /> Zero Vercel Config
            </span>
            <span className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-sky-500" /> Free HTTPS & Scale-to-Zero
            </span>
          </div>

          {/* Large SaaS Interactive Deployment Dashboard Showcase (Taskible Hero Graphic Mockup) */}
          <div className="mt-16 max-w-[1220px] mx-auto relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/25 via-indigo-500/15 to-sky-500/20 rounded-[32px] blur-2xl opacity-60 group-hover:opacity-85 transition duration-500" />
            
            <div className="relative taskible-card rounded-[28px] overflow-hidden border border-blue-500/20 bg-card dark:bg-[#050F26] shadow-2xl text-left">
              {/* Window Bar */}
              <div className="px-6 py-4 border-b border-border/80 bg-muted/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex gap-2">
                    <div className="h-3 w-3 rounded-full bg-rose-500" />
                    <div className="h-3 w-3 rounded-full bg-amber-500" />
                    <div className="h-3 w-3 rounded-full bg-emerald-500" />
                  </div>
                  <span className="ml-2 text-xs font-mono font-medium text-muted-foreground">ShipLane Autonomous Cloud Deployment</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold">PRODUCTION LIVE</span>
                </div>
              </div>

              {/* Showcase Grid */}
              <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Active Application Card */}
                <div className="md:col-span-2 rounded-[20px] border border-border/80 bg-background/60 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-[#0066FF]/10 flex items-center justify-center text-[#0066FF]">
                        <Globe className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-base font-bold text-foreground">myapp-production</div>
                        <div className="text-xs font-mono text-muted-foreground flex items-center gap-1.5">
                          <span>https://myapp-prod.nebula.app</span>
                          <ExternalLink className="h-3 w-3" />
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#0066FF]/10 text-[#0066FF] border border-[#0066FF]/20">
                      Next.js 15
                    </span>
                  </div>

                  {/* Terminal log snippet */}
                  <div className="rounded-xl bg-[#001A41] text-white p-4 font-mono text-xs space-y-2 border border-white/10">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <Check className="h-4 w-4 shrink-0" />
                      <span>Runtime detected: Next.js App Router (port 3000)</span>
                    </div>
                    <div className="flex items-center gap-2 text-blue-300">
                      <Database className="h-4 w-4 shrink-0" />
                      <span>PostgreSQL isolated container provisioned & DATABASE_URL injected</span>
                    </div>
                    <div className="flex items-center gap-2 text-sky-300">
                      <ShieldCheck className="h-4 w-4 shrink-0" />
                      <span>Zero-config SSL certificate issued • Ready in 24 seconds</span>
                    </div>
                  </div>
                </div>

                {/* Instant Health & Auto-Sleep Panel */}
                <div className="rounded-[20px] border border-border/80 bg-background/60 p-5 flex flex-col justify-between space-y-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Instant Health Metrics</div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Activity className="h-4 w-4 text-[#0066FF]" /> Latency
                      </span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">18 ms</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Cpu className="h-4 w-4 text-indigo-500" /> Compute
                      </span>
                      <span className="font-mono font-bold text-[#0066FF]">Scale-to-Zero</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Server className="h-4 w-4 text-amber-500" /> Database
                      </span>
                      <span className="font-mono font-bold text-foreground">Postgres 16</span>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-border/80 text-xs text-muted-foreground flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-[#0066FF]" /> 100% automated agent pipeline
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Highlights Trio (Taskible Inbox / Boards / Planner trio) */}
        <section className="max-w-[1220px] mx-auto px-4 sm:px-6 py-24 border-t border-border/80">
          <div className="text-center mb-16">
            <div className="taskible-eyebrow mb-3">CORE CAPABILITIES</div>
            <h2 className="text-3xl sm:text-4xl md:text-[48px] font-semibold text-foreground tracking-[-0.03em] leading-[1.1]">
              Where clarity meets deployment
              <br />
              <span className="heading-highlight">— Flawlessly.</span>
            </h2>
            <p className="text-muted-foreground mt-4 max-w-xl mx-auto text-base">
              Everything your AI agent needs to turn code into a production URL without DevOps overhead.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {/* Card 1 */}
            <div className="taskible-card p-8 flex flex-col justify-between">
              <div>
                <div className="h-12 w-12 rounded-2xl bg-[#0066FF]/10 border border-[#0066FF]/20 flex items-center justify-center text-[#0066FF] mb-6">
                  <Zap className="h-6 w-6" />
                </div>
                <h4 className="text-2xl font-semibold text-foreground mb-3 tracking-tight">Zero-Config Inference</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  No Dockerfile or YAML required. ShipLane inspects your repository to infer runtimes (Next.js, Node, Python, Django, Go, Ruby), build scripts, and ports automatically.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-border/60 text-xs font-semibold text-[#0066FF] flex items-center gap-1">
                <span>Automatic framework detection</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </div>

            {/* Card 2 */}
            <div className="taskible-card p-8 flex flex-col justify-between">
              <div>
                <div className="h-12 w-12 rounded-2xl bg-[#0066FF]/10 border border-[#0066FF]/20 flex items-center justify-center text-[#0066FF] mb-6">
                  <Database className="h-6 w-6" />
                </div>
                <h4 className="text-2xl font-semibold text-foreground mb-3 tracking-tight">Instant PostgreSQL & S3</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Provision isolated PostgreSQL databases and private S3-compatible storage buckets with one click or agent command. Connection credentials are automatically injected.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-border/60 text-xs font-semibold text-[#0066FF] flex items-center gap-1">
                <span>DATABASE_URL ready</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </div>

            {/* Card 3 */}
            <div className="taskible-card p-8 flex flex-col justify-between">
              <div>
                <div className="h-12 w-12 rounded-2xl bg-[#0066FF]/10 border border-[#0066FF]/20 flex items-center justify-center text-[#0066FF] mb-6">
                  <Cpu className="h-6 w-6" />
                </div>
                <h4 className="text-2xl font-semibold text-foreground mb-3 tracking-tight">Scale-to-Zero Compute</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Server apps automatically go to sleep when idle, cutting compute waste. Incoming HTTP requests wake containers back up in milliseconds via Traefik edge proxying.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-border/60 text-xs font-semibold text-[#0066FF] flex items-center gap-1">
                <span>Sub-50ms cold wake-up</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </div>
          </div>
        </section>

        {/* How It Works (Taskible 01–04 Numbered Progression) */}
        <section id="how-it-works" className="max-w-[1220px] mx-auto px-4 sm:px-6 py-24 border-t border-border/80">
          <div className="text-center mb-16">
            <div className="taskible-eyebrow mb-3">WORKFLOW</div>
            <h2 className="text-3xl sm:text-4xl md:text-[48px] font-semibold text-foreground tracking-[-0.03em] leading-[1.1]">
              From local prompt to production
              <br />
              <span className="heading-highlight">— in 4 simple steps.</span>
            </h2>
            <p className="text-muted-foreground mt-4 max-w-xl mx-auto text-base">
              From local code to a production URL in under 60 seconds without touching cloud consoles.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 text-left">
            {/* Step 1 */}
            <div className="taskible-card p-7 space-y-4">
              <h3 className="text-[32px] font-semibold text-[#0066FF] tracking-tight">01.</h3>
              <h4 className="text-xl font-semibold text-foreground tracking-tight">Copy Prompt</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Copy the single-sentence instruction pointing to <span className="font-mono text-xs text-[#0066FF] bg-[#0066FF]/10 px-2 py-0.5 rounded-full">agent.md</span>.
              </p>
            </div>

            {/* Step 2 */}
            <div className="taskible-card p-7 space-y-4">
              <h3 className="text-[32px] font-semibold text-[#0066FF] tracking-tight">02.</h3>
              <h4 className="text-xl font-semibold text-foreground tracking-tight">Paste into Agent</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Works with Claude Code, Cursor, Windsurf, Codex, Antigravity, or terminal CLI.
              </p>
            </div>

            {/* Step 3 */}
            <div className="taskible-card p-7 space-y-4">
              <h3 className="text-[32px] font-semibold text-[#0066FF] tracking-tight">03.</h3>
              <h4 className="text-xl font-semibold text-foreground tracking-tight">1-Click Approval</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Approve the device authorization in your browser at <span className="font-mono text-xs text-[#0066FF] bg-[#0066FF]/10 px-2 py-0.5 rounded-full">/activate</span> with zero API key leaks.
              </p>
            </div>

            {/* Step 4 */}
            <div className="taskible-card p-7 space-y-4">
              <h3 className="text-[32px] font-semibold text-[#0066FF] tracking-tight">04.</h3>
              <h4 className="text-xl font-semibold text-foreground tracking-tight">Get Live Link</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your app is compiled, containerized, provisioned with Postgres, and live on HTTPS.
              </p>
            </div>
          </div>
        </section>

        {/* Comparison Section (Taskible "Choosing Taskible over others") */}
        <section id="why-ShipLane" className="max-w-[1220px] mx-auto px-4 sm:px-6 py-24 border-t border-border/80">
          <div className="text-center mb-16">
            <div className="taskible-eyebrow mb-3">BUILT FOR NON-TECH CREATORS</div>
            <h2 className="text-3xl sm:text-4xl md:text-[48px] font-semibold text-foreground tracking-[-0.03em] leading-[1.1]">
              Choosing ShipLane over
              <br />
              <span className="heading-highlight">cloud complexity.</span>
            </h2>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto text-base">
              If an AI coding assistant wrote your app, why should you spend hours debugging cloud dashboards, Vercel build configs, and database connection strings?
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto text-left">
            {/* The Hard Way: Vercel & Traditional Cloud */}
            <div className="rounded-[24px] border border-destructive/25 bg-destructive/[0.04] p-8 space-y-5">
              <div className="flex items-center gap-3 font-bold text-destructive text-lg">
                <div className="h-8 w-8 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <XCircle className="h-5 w-5" />
                </div>
                <span>The Traditional Cloud Way (Vercel, AWS)</span>
              </div>
              <ul className="space-y-4 text-sm text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="text-destructive font-bold text-base mt-[-2px]">✕</span>
                  <span>Must create and link GitHub repos, configure git remotes, and grant oauth app permissions.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-destructive font-bold text-base mt-[-2px]">✕</span>
                  <span>Cryptic build errors: wrong Node version, root directory mismatch, missing build scripts.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-destructive font-bold text-base mt-[-2px]">✕</span>
                  <span>Must manually sign up for external database providers (Supabase, Neon) and copy connection strings.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-destructive font-bold text-base mt-[-2px]">✕</span>
                  <span>Copying & pasting sensitive API tokens into AI chats risks credential leakage.</span>
                </li>
              </ul>
            </div>

            {/* The ShipLane Way */}
            <div className="taskible-card rounded-[24px] border-2 border-[#0066FF]/40 bg-[#F0F7FF] dark:bg-[#071738] p-8 space-y-5 shadow-xl">
              <div className="flex items-center gap-3 font-bold text-[#0066FF] text-lg">
                <div className="h-8 w-8 rounded-xl bg-[#0066FF]/20 flex items-center justify-center">
                  <Check className="h-5 w-5 text-[#0066FF]" />
                </div>
                <span>The ShipLane Agent Way</span>
              </div>
              <ul className="space-y-4 text-sm text-foreground">
                <li className="flex items-start gap-3">
                  <span className="text-emerald-500 font-bold text-base mt-[-2px]">✓</span>
                  <span><strong>Zero cloud setup:</strong> Give your AI assistant 1 sentence and let it handle everything.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-emerald-500 font-bold text-base mt-[-2px]">✓</span>
                  <span><strong>Automatic inference:</strong> Detects Next.js, Node, Python, Vite, Go, and ports automatically.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-emerald-500 font-bold text-base mt-[-2px]">✓</span>
                  <span><strong>Built-in PostgreSQL:</strong> Instant database container with <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono text-[#0066FF]">DATABASE_URL</code> auto-injected.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-emerald-500 font-bold text-base mt-[-2px]">✓</span>
                  <span><strong>1-Click browser approve:</strong> Secure RFC 8628 device flow with zero token exposure in chat.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Features Bento Grid (Taskible "Features bento" layout) */}
        <section id="features" className="max-w-[1220px] mx-auto px-4 sm:px-6 py-24 border-t border-border/80">
          <div className="text-center mb-16">
            <div className="taskible-eyebrow mb-3">PLATFORM FEATURES</div>
            <h2 className="text-3xl sm:text-4xl md:text-[48px] font-semibold text-foreground tracking-[-0.03em] leading-[1.1]">
              Powerful features built for
              <br />
              <span className="heading-highlight">shipping.</span>
            </h2>
            <p className="text-muted-foreground mt-4 max-w-xl mx-auto text-base">
              Zero DevOps required. Powered by modern container infrastructure, scale-to-zero runtimes, and agent protocols.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {/* Bento Card 1: Zero-Config Inference */}
            <div className="taskible-card p-8 flex flex-col justify-between">
              <div>
                <div className="h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mb-6">
                  <Zap className="h-6 w-6" />
                </div>
                <h4 className="text-2xl font-semibold text-foreground mb-3 tracking-tight">Zero-Config Inference</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  No Dockerfile or YAML required. ShipLane inspects your repository to infer runtimes, build scripts, and ports automatically.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-border/60 flex flex-wrap gap-1.5">
                <span className="text-xs font-mono bg-muted px-2.5 py-0.5 rounded-full text-foreground">Next.js</span>
                <span className="text-xs font-mono bg-muted px-2.5 py-0.5 rounded-full text-foreground">Node.js</span>
                <span className="text-xs font-mono bg-muted px-2.5 py-0.5 rounded-full text-foreground">Python</span>
                <span className="text-xs font-mono bg-muted px-2.5 py-0.5 rounded-full text-foreground">Go</span>
                <span className="text-xs font-mono bg-muted px-2.5 py-0.5 rounded-full text-foreground">Vite</span>
              </div>
            </div>

            {/* Bento Card 2: Instant PostgreSQL & S3 */}
            <div className="taskible-card p-8 flex flex-col justify-between">
              <div>
                <div className="h-12 w-12 rounded-2xl bg-[#0066FF]/10 border border-[#0066FF]/20 flex items-center justify-center text-[#0066FF] mb-6">
                  <Database className="h-6 w-6" />
                </div>
                <h4 className="text-2xl font-semibold text-foreground mb-3 tracking-tight">Instant PostgreSQL & S3</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Provision isolated PostgreSQL databases and private S3-compatible storage buckets with one click or agent command. Connection credentials auto-injected.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-border/60 flex items-center gap-2 text-xs font-mono text-[#0066FF]">
                <Check className="h-4 w-4 text-emerald-500" />
                <span>DATABASE_URL ready</span>
              </div>
            </div>

            {/* Bento Card 3: Scale-to-Zero Compute */}
            <div className="taskible-card p-8 flex flex-col justify-between">
              <div>
                <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 mb-6">
                  <Cpu className="h-6 w-6" />
                </div>
                <h4 className="text-2xl font-semibold text-foreground mb-3 tracking-tight">Scale-to-Zero Compute</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Server apps automatically go to sleep when idle, cutting compute waste. Incoming HTTP requests wake containers back up in milliseconds via Traefik edge proxying.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-border/60 flex items-center gap-2 text-xs font-mono text-emerald-600 dark:text-emerald-400">
                <Activity className="h-4 w-4" />
                <span>Sub-50ms cold wake-up</span>
              </div>
            </div>

            {/* Bento Card 4: Preview Environments */}
            <div className="taskible-card p-8 flex flex-col justify-between">
              <div>
                <div className="h-12 w-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 mb-6">
                  <GitBranch className="h-6 w-6" />
                </div>
                <h4 className="text-2xl font-semibold text-foreground mb-3 tracking-tight">Preview Environments</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Every branch gets its own isolated staging URL. Test changes, run automatic security checks, and share preview links with teammates before merging.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-border/60 text-xs text-muted-foreground font-semibold">
                Branch-level isolated URLs
              </div>
            </div>

            {/* Bento Card 5: MCP Server & Device Auth */}
            <div className="taskible-card p-8 flex flex-col justify-between">
              <div>
                <div className="h-12 w-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 mb-6">
                  <Terminal className="h-6 w-6" />
                </div>
                <h4 className="text-2xl font-semibold text-foreground mb-3 tracking-tight">MCP Server & Device Auth</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Native Model Context Protocol (<span className="font-mono text-xs text-[#0066FF]">ShipLane-mcp</span>) and RFC 8628 OAuth Device Authorization allow agents to deploy securely without exposing raw tokens.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-border/60 text-xs text-muted-foreground font-semibold">
                Zero API keys exposed in chats
              </div>
            </div>

            {/* Bento Card 6: Multiple Deploy Sources */}
            <div className="taskible-card p-8 flex flex-col justify-between">
              <div>
                <div className="h-12 w-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-500 mb-6">
                  <Layers className="h-6 w-6" />
                </div>
                <h4 className="text-2xl font-semibold text-foreground mb-3 tracking-tight">Agent, GitHub, or Folder</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Deploy however you like: ask your AI coding assistant, connect a GitHub repository for automatic git-push deployments, or drag and drop a folder directly into the web console.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-border/60 text-xs text-muted-foreground font-semibold">
                Flexible workflow for all creators
              </div>
            </div>
          </div>
        </section>

        {/* Framework & Agent Ecosystem Ribbon */}
        <section className="max-w-[1220px] mx-auto px-4 sm:px-6 py-12">
          <div className="rounded-[24px] border border-border/80 bg-muted/30 p-6 flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <span>Supported Agents & Stacks:</span>
            <span className="text-foreground">Claude Code</span>
            <span>•</span>
            <span className="text-foreground">Cursor</span>
            <span>•</span>
            <span className="text-foreground">Windsurf</span>
            <span>•</span>
            <span className="text-foreground">Next.js 15</span>
            <span>•</span>
            <span className="text-foreground">Python & Django</span>
            <span>•</span>
            <span className="text-foreground">PostgreSQL</span>
            <span>•</span>
            <span className="text-foreground">Docker</span>
          </div>
        </section>

        {/* Pricing Section (Taskible Pricing Cards Design) */}
        <section id="pricing" className="max-w-[1220px] mx-auto px-4 sm:px-6 py-24 border-t border-border/80">
          <div className="text-center mb-16">
            <div className="taskible-eyebrow mb-3">PRICING PLANS</div>
            <h2 className="text-3xl sm:text-4xl md:text-[48px] font-semibold text-foreground tracking-[-0.03em] leading-[1.1]">
              Simple pricing for powerful
              <br />
              <span className="heading-highlight">productivity.</span>
            </h2>
            <p className="text-muted-foreground mt-4 max-w-xl mx-auto text-base">
              Start free forever. Failed deploys never count against your limits. Scale when your app gets real users.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-left">
            {/* Plan 1: Free */}
            <div className="taskible-card p-8 flex flex-col justify-between">
              <div>
                <h5 className="text-xl font-bold text-foreground">Free</h5>
                <div className="text-xs text-muted-foreground mt-1">For experimenting & first prototypes</div>
                <div className="pt-6 pb-6 border-b border-border/60">
                  <h3 className="text-[32px] font-semibold text-foreground tracking-tight">₹0</h3>
                  <span className="text-xs text-muted-foreground"> / forever</span>
                </div>
                <div className="space-y-3.5 text-xs pt-6 text-muted-foreground">
                  <div className="font-bold text-foreground text-xs pb-1">Included:</div>
                  <div className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span><strong className="text-foreground">1 live app</strong> with a server</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Unlimited static sites</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>30 successful deploys / mo</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>1 Postgres database</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>1 S3 storage bucket</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Idle auto-sleep & health checks</span>
                  </div>
                </div>
              </div>
              <div className="pt-8">
                <Button asChild variant="taskibleSecondary" className="w-full" size="sm">
                  <Link href="/login">Get Started Free</Link>
                </Button>
              </div>
            </div>

            {/* Plan 2: Go */}
            <div className="taskible-card p-8 flex flex-col justify-between">
              <div>
                <h5 className="text-xl font-bold text-foreground">Go</h5>
                <div className="text-xs text-muted-foreground mt-1">For side projects outgrowing free</div>
                <div className="pt-6 pb-6 border-b border-border/60">
                  <h3 className="text-[32px] font-semibold text-foreground tracking-tight">₹399</h3>
                  <span className="text-xs text-muted-foreground"> / month</span>
                </div>
                <div className="space-y-3.5 text-xs pt-6 text-muted-foreground">
                  <div className="font-bold text-foreground text-xs pb-1">Everything in Free, plus:</div>
                  <div className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span><strong className="text-foreground">3 live apps</strong> with a server</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span><strong className="text-foreground">Unlimited</strong> deploys</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Up to 3 custom domains + HTTPS</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>1 Postgres database</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>2 S3 storage buckets</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Standard email support</span>
                  </div>
                </div>
              </div>
              <div className="pt-8">
                <Button asChild variant="taskibleSecondary" className="w-full" size="sm">
                  <Link href="/login">Upgrade to Go</Link>
                </Button>
              </div>
            </div>

            {/* Plan 3: Pro (Highlighted Most Popular Plan) */}
            <div className="taskible-card p-8 flex flex-col justify-between relative border-2 border-[#0066FF] shadow-xl shadow-blue-500/15">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="bg-[#0066FF] text-white text-xs font-bold px-4 py-1 rounded-full shadow-md">
                  Most Popular
                </span>
              </div>
              <div>
                <h5 className="text-xl font-bold text-foreground">Pro</h5>
                <div className="text-xs text-muted-foreground mt-1">For apps with real users & traffic</div>
                <div className="pt-6 pb-6 border-b border-border/60">
                  <h3 className="text-[32px] font-semibold text-foreground tracking-tight">₹1,999</h3>
                  <span className="text-xs text-muted-foreground"> / month</span>
                </div>
                <div className="space-y-3.5 text-xs pt-6 text-muted-foreground">
                  <div className="font-bold text-foreground text-xs pb-1">Everything in Go, plus:</div>
                  <div className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span><strong className="text-foreground">9 live apps</strong> with a server</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span><strong className="text-foreground">Unlimited</strong> custom domains</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>3 Postgres databases</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>3 S3 storage buckets</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>₹100 monthly AI credit included</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Priority email support</span>
                  </div>
                </div>
              </div>
              <div className="pt-8">
                <Button asChild variant="taskible" className="w-full shadow-lg" size="sm">
                  <Link href="/login">Upgrade to Pro</Link>
                </Button>
              </div>
            </div>

            {/* Plan 4: Scale */}
            <div className="taskible-card p-8 flex flex-col justify-between">
              <div>
                <h5 className="text-xl font-bold text-foreground">Scale</h5>
                <div className="text-xs text-muted-foreground mt-1">For small production teams</div>
                <div className="pt-6 pb-6 border-b border-border/60">
                  <h3 className="text-[32px] font-semibold text-foreground tracking-tight">₹6,999</h3>
                  <span className="text-xs text-muted-foreground"> / month</span>
                </div>
                <div className="space-y-3.5 text-xs pt-6 text-muted-foreground">
                  <div className="font-bold text-foreground text-xs pb-1">Everything in Pro, plus:</div>
                  <div className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span><strong className="text-foreground">20 live apps</strong> with a server</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>5 Postgres databases</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>5 S3 storage buckets</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>₹100 monthly AI credit</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Direct founder & engineer support</span>
                  </div>
                </div>
              </div>
              <div className="pt-8">
                <Button asChild variant="taskibleSecondary" className="w-full" size="sm">
                  <Link href="/login">Contact Sales</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section (Taskible Clean Accordion/Cards Design) */}
        <section className="max-w-[800px] mx-auto px-4 sm:px-6 py-24 border-t border-border/80">
          <div className="text-center mb-16">
            <div className="taskible-eyebrow mb-3">FAQ</div>
            <h2 className="text-3xl sm:text-4xl md:text-[48px] font-semibold text-foreground tracking-[-0.03em] leading-[1.1]">
              Frequently Asked
              <br />
              <span className="heading-highlight">Questions.</span>
            </h2>
          </div>

          <div className="space-y-4 text-left">
            <div className="taskible-card p-6 sm:p-7 space-y-3">
              <h4 className="text-lg font-semibold text-foreground flex items-center justify-between gap-4">
                <span>I'm not a technical developer. Can I really deploy without Vercel or cloud knowledge?</span>
                <ChevronDown className="h-5 w-5 text-[#0066FF] shrink-0" />
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Yes! That is exactly what ShipLane is built for. If you used an AI coding assistant (like Claude Code, Cursor, Windsurf, or Codex) to generate your website or app, you simply paste our 1-line prompt into the chat. Your agent talks directly to ShipLane, provisions what your code needs, and gives you a working public HTTPS link.
              </p>
            </div>

            <div className="taskible-card p-6 sm:p-7 space-y-3">
              <h4 className="text-lg font-semibold text-foreground flex items-center justify-between gap-4">
                <span>How does ShipLane compare to Vercel?</span>
                <ChevronDown className="h-5 w-5 text-[#0066FF] shrink-0" />
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Vercel expects you to manage GitHub repositories, framework presets, custom environment variables, and external databases separately. ShipLane connects directly to your AI agent, infers your framework, starts a managed PostgreSQL database with connection strings already injected, and eliminates manual cloud configuration.
              </p>
            </div>

            <div className="taskible-card p-6 sm:p-7 space-y-3">
              <h4 className="text-lg font-semibold text-foreground flex items-center justify-between gap-4">
                <span>What happens when my application is idle?</span>
                <ChevronDown className="h-5 w-5 text-[#0066FF] shrink-0" />
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                To conserve compute resources and keep costs zero, server apps automatically scale down to sleep when inactive. The very first visitor request wakes the container back up within milliseconds via our Traefik reverse proxy.
              </p>
            </div>

            <div className="taskible-card p-6 sm:p-7 space-y-3">
              <h4 className="text-lg font-semibold text-foreground flex items-center justify-between gap-4">
                <span>Do failed deployments count against my monthly allowance?</span>
                <ChevronDown className="h-5 w-5 text-[#0066FF] shrink-0" />
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Never. Only successful deployments count against your limits. If your AI assistant is testing a fix or a build fails, you are never penalized or billed for failed attempts.
              </p>
            </div>
          </div>
        </section>

        {/* Pre-Footer Action Banner (Taskible "Ready to streamline your workflow" section) */}
        <section className="max-w-[1220px] mx-auto px-4 sm:px-6 py-12">
          <div className="rounded-[32px] p-10 sm:p-16 text-center text-white bg-gradient-to-br from-[#001A41] via-[#051538] to-[#002B66] shadow-2xl relative overflow-hidden">
            <div className="relative z-10 max-w-2xl mx-auto space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/20 px-4 py-1.5 text-xs font-bold text-blue-300">
                INSTANT DEPLOYMENT
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-[44px] font-semibold tracking-tight text-white leading-[1.1]">
                Ready to streamline your deployment
                <br />
                <span className="heading-highlight !text-blue-300">workflow?</span>
              </h2>
              <p className="text-blue-100/80 text-base leading-relaxed">
                Connect your AI assistant, approve in your browser, and share a production link in under 60 seconds.
              </p>
              <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-4">
                <CopyPromptButton size="default" variant="taskible" className="w-full sm:w-auto shadow-lg shadow-blue-500/40" />
                <Button asChild variant="taskibleSecondary" size="default" className="w-full sm:w-auto !bg-white/10 !text-white !border-white/20 hover:!bg-white/20">
                  <Link href="/apps" className="flex items-center gap-2">
                    <span>Open Web Console</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </section>

      {/* Modern Multi-Column Footer (Taskible Footer Layout) */}
      <footer className="border-t border-border/80 bg-background/80 py-14 backdrop-blur-xl">
        <div className="max-w-[1220px] mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 pb-10 border-b border-border/60">
            <div className="space-y-3">
              <div className="flex items-center gap-3 font-bold text-xl tracking-tight">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#0066FF] text-white shadow-sm shadow-blue-500/30">
                  <Rocket className="h-4.5 w-4.5" />
                </div>
                <span>ShipLane Cloud</span>
              </div>
              <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
                The agent-native deployment cloud for AI coding assistants and modern creators.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-8 text-[15px] text-muted-foreground font-semibold">
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

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-muted-foreground">
            <div>
              © {new Date().getFullYear()} ShipLane Cloud Inc. All rights reserved.
            </div>
            <div className="flex items-center gap-2 font-semibold">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span className="text-foreground">All Systems Operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
