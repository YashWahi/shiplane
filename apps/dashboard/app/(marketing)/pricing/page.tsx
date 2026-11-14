import Link from "next/link";
import { Rocket, Check, ArrowRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground relative selection:bg-primary/20 selection:text-foreground">
      {/* Ambient background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1100px] h-[550px] bg-gradient-to-b from-blue-500/15 via-blue-600/5 to-transparent blur-3xl rounded-full" />
      </div>

      {/* Floating Pill Navbar */}
      <header className="sticky top-4 z-50 w-full px-4 sm:px-6">
        <div className="max-w-[1220px] mx-auto rounded-full border border-blue-500/15 bg-background/85 dark:bg-[#001A41]/85 backdrop-blur-xl shadow-lg shadow-black/5 dark:shadow-black/30 px-5 sm:px-7 h-[68px] flex items-center justify-between transition-all">
          <Link href="/" className="flex items-center gap-3 font-bold text-xl tracking-tight group">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0066FF] text-white shadow-md shadow-blue-500/30 group-hover:scale-105 transition-transform">
              <Rocket className="h-5 w-5" />
            </div>
            <span className="text-foreground font-bold tracking-tight">ShipLane</span>
          </Link>
          <div className="flex items-center gap-3 sm:gap-6">
            <Link
              href="/"
              className="text-[15px] font-semibold text-muted-foreground hover:text-foreground px-3.5 py-2 rounded-full hover:bg-muted/80 transition-all"
            >
              Home
            </Link>
            <Link
              href="/agent.md"
              target="_blank"
              className="text-[15px] font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1.5 px-3.5 py-2 rounded-full hover:bg-muted/80 transition-all"
            >
              <span>Docs</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
            <ThemeToggle />
            <Button asChild size="sm" variant="taskible" className="px-5 font-semibold">
              <Link href="/apps">Console</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Pricing Header */}
      <main className="flex-1 py-16 sm:py-20 px-4 sm:px-6 max-w-[1220px] mx-auto w-full">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <div className="taskible-eyebrow mb-3">SHIPLANE PLANS</div>
          <h1 className="text-4xl sm:text-5xl md:text-[54px] font-semibold text-foreground tracking-[-0.03em] leading-[1.1]">
            Predictable, transparent
            <br />
            <span className="heading-highlight">pricing.</span>
          </h1>
          <p className="text-muted-foreground mt-4 text-base leading-relaxed">
            Start for free, deploy without limits as you grow. Failed deployments are always free and never count against monthly allowances.
          </p>
        </div>

        {/* Pricing Cards (Taskible 24px Radius Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-left">
          {/* Free */}
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

          {/* Go */}
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
                  <span>3 custom domains + HTTPS</span>
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

          {/* Pro (Highlighted Most Popular Plan) */}
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
                  <span>₹100 monthly AI credit</span>
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

          {/* Scale */}
          <div className="taskible-card p-8 flex flex-col justify-between">
            <div>
              <h5 className="text-xl font-bold text-foreground">Scale</h5>
              <div className="text-xs text-muted-foreground mt-1">For teams running business workloads</div>
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

        {/* Feature Comparison Table */}
        <div className="mt-20 taskible-card p-6 sm:p-10">
          <h2 className="text-2xl font-bold mb-8 text-center text-foreground">Plan Comparison Matrix</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border/80 text-muted-foreground font-semibold">
                  <th className="pb-4">Feature</th>
                  <th className="pb-4">Free</th>
                  <th className="pb-4">Go</th>
                  <th className="pb-4 text-foreground font-bold">Pro</th>
                  <th className="pb-4">Scale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                <tr>
                  <td className="py-4 font-semibold text-foreground">Server Apps Online</td>
                  <td className="py-4 text-muted-foreground">1</td>
                  <td className="py-4 text-muted-foreground">3</td>
                  <td className="py-4 text-[#0066FF] font-bold">9</td>
                  <td className="py-4 text-muted-foreground">20</td>
                </tr>
                <tr>
                  <td className="py-4 font-semibold text-foreground">Static Sites</td>
                  <td className="py-4 text-muted-foreground">Unlimited</td>
                  <td className="py-4 text-muted-foreground">Unlimited</td>
                  <td className="py-4 text-[#0066FF] font-bold">Unlimited</td>
                  <td className="py-4 text-muted-foreground">Unlimited</td>
                </tr>
                <tr>
                  <td className="py-4 font-semibold text-foreground">Monthly Deploys</td>
                  <td className="py-4 text-muted-foreground">30 successful</td>
                  <td className="py-4 text-muted-foreground">Unlimited</td>
                  <td className="py-4 text-[#0066FF] font-bold">Unlimited</td>
                  <td className="py-4 text-muted-foreground">Unlimited</td>
                </tr>
                <tr>
                  <td className="py-4 font-semibold text-foreground">Postgres Databases</td>
                  <td className="py-4 text-muted-foreground">1</td>
                  <td className="py-4 text-muted-foreground">1</td>
                  <td className="py-4 text-[#0066FF] font-bold">3</td>
                  <td className="py-4 text-muted-foreground">5</td>
                </tr>
                <tr>
                  <td className="py-4 font-semibold text-foreground">S3 File Buckets</td>
                  <td className="py-4 text-muted-foreground">1</td>
                  <td className="py-4 text-muted-foreground">2</td>
                  <td className="py-4 text-[#0066FF] font-bold">3</td>
                  <td className="py-4 text-muted-foreground">5</td>
                </tr>
                <tr>
                  <td className="py-4 font-semibold text-foreground">Custom Domains</td>
                  <td className="py-4 text-muted-foreground">-</td>
                  <td className="py-4 text-muted-foreground">3 with HTTPS</td>
                  <td className="py-4 text-[#0066FF] font-bold">Unlimited</td>
                  <td className="py-4 text-muted-foreground">Unlimited</td>
                </tr>
                <tr>
                  <td className="py-4 font-semibold text-foreground">Scale-to-Zero</td>
                  <td className="py-4 text-emerald-500 font-bold">Yes</td>
                  <td className="py-4 text-emerald-500 font-bold">Yes</td>
                  <td className="py-4 text-emerald-500 font-bold">Yes</td>
                  <td className="py-4 text-emerald-500 font-bold">Yes</td>
                </tr>
                <tr>
                  <td className="py-4 font-semibold text-foreground">Agent Integration (RFC 8628 & MCP)</td>
                  <td className="py-4 text-emerald-500 font-bold">Yes</td>
                  <td className="py-4 text-emerald-500 font-bold">Yes</td>
                  <td className="py-4 text-emerald-500 font-bold">Yes</td>
                  <td className="py-4 text-emerald-500 font-bold">Yes</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/80 bg-background/80 py-12 backdrop-blur-xl">
        <div className="max-w-[1220px] mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#0066FF] text-white shadow-sm">
              <Rocket className="h-4 w-4" />
            </div>
            <span className="font-semibold text-foreground">ShipLane Cloud</span>
            <span>© {new Date().getFullYear()} All rights reserved.</span>
          </div>
          <div className="flex items-center gap-8 font-semibold text-[15px]">
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <Link href="/agent.md" target="_blank" className="hover:text-foreground transition-colors">
              Docs
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
