import Link from "next/link";
import { Rocket, Check, ArrowRight, HelpCircle, ExternalLink, ShieldCheck } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border/50 sticky top-0 z-40 bg-background/95 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-lg tracking-tight">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <Rocket className="h-4 w-4" />
            </div>
            <span>ShipLane</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Home
            </Link>
            <Link href="/agent.md" target="_blank" className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-1">
              <span>Docs</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
            <Button asChild size="sm">
              <Link href="/apps">Console</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Pricing Header */}
      <main className="flex-1 py-16 px-6 max-w-6xl mx-auto w-full">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <Badge variant="outline" className="mb-3">
            ShipLane Plans
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">Predictable, transparent pricing</h1>
          <p className="text-muted-foreground mt-4 text-base">
            Start for free, deploy without limits as you grow. Failed deployments are always free and never count against monthly allowances.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Free */}
          <Card className="border-border bg-card/50 flex flex-col justify-between">
            <CardHeader>
              <CardTitle className="text-xl">Free</CardTitle>
              <CardDescription className="text-xs">Experiment and build your first prototypes</CardDescription>
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
              <Button asChild variant="outline" className="w-full">
                <Link href="/login">Get Started Free</Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Go */}
          <Card className="border-border bg-card/50 flex flex-col justify-between">
            <CardHeader>
              <CardTitle className="text-xl">Go</CardTitle>
              <CardDescription className="text-xs">For active side projects with custom domains</CardDescription>
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
                <span>3 custom domains + HTTPS</span>
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
              <Button asChild variant="outline" className="w-full">
                <Link href="/login">Upgrade to Go</Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Pro */}
          <Card className="border-primary bg-card flex flex-col justify-between relative shadow-lg">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-primary text-primary-foreground text-[10px] px-2 py-0.5">
                Most Popular
              </Badge>
            </div>
            <CardHeader>
              <CardTitle className="text-xl">Pro</CardTitle>
              <CardDescription className="text-xs">For apps with production traffic</CardDescription>
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
                <span>₹100 monthly AI credit</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Priority email support</span>
              </div>
            </CardContent>
            <CardFooter className="pt-4">
              <Button asChild className="w-full">
                <Link href="/login">Upgrade to Pro</Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Scale */}
          <Card className="border-border bg-card/50 flex flex-col justify-between">
            <CardHeader>
              <CardTitle className="text-xl">Scale</CardTitle>
              <CardDescription className="text-xs">For teams running business workloads</CardDescription>
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
                <span>Direct engineer support</span>
              </div>
            </CardContent>
            <CardFooter className="pt-4">
              <Button asChild variant="outline" className="w-full">
                <Link href="/login">Contact Sales</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Feature Comparison Table */}
        <div className="mt-20 border border-border rounded-xl bg-card/30 p-8">
          <h2 className="text-2xl font-bold mb-6 text-center">Plan Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="pb-3 font-semibold">Feature</th>
                  <th className="pb-3 font-semibold">Free</th>
                  <th className="pb-3 font-semibold">Go</th>
                  <th className="pb-3 font-semibold">Pro</th>
                  <th className="pb-3 font-semibold">Scale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                <tr>
                  <td className="py-3 font-medium">Server Apps Online</td>
                  <td className="py-3 text-muted-foreground">1</td>
                  <td className="py-3 text-muted-foreground">3</td>
                  <td className="py-3 text-muted-foreground">9</td>
                  <td className="py-3 text-muted-foreground">20</td>
                </tr>
                <tr>
                  <td className="py-3 font-medium">Static Sites</td>
                  <td className="py-3 text-muted-foreground">Unlimited</td>
                  <td className="py-3 text-muted-foreground">Unlimited</td>
                  <td className="py-3 text-muted-foreground">Unlimited</td>
                  <td className="py-3 text-muted-foreground">Unlimited</td>
                </tr>
                <tr>
                  <td className="py-3 font-medium">Monthly Deploys</td>
                  <td className="py-3 text-muted-foreground">30 successful</td>
                  <td className="py-3 text-muted-foreground">Unlimited</td>
                  <td className="py-3 text-muted-foreground">Unlimited</td>
                  <td className="py-3 text-muted-foreground">Unlimited</td>
                </tr>
                <tr>
                  <td className="py-3 font-medium">Postgres Databases</td>
                  <td className="py-3 text-muted-foreground">1</td>
                  <td className="py-3 text-muted-foreground">1</td>
                  <td className="py-3 text-muted-foreground">3</td>
                  <td className="py-3 text-muted-foreground">5</td>
                </tr>
                <tr>
                  <td className="py-3 font-medium">S3 File Buckets</td>
                  <td className="py-3 text-muted-foreground">1</td>
                  <td className="py-3 text-muted-foreground">2</td>
                  <td className="py-3 text-muted-foreground">3</td>
                  <td className="py-3 text-muted-foreground">5</td>
                </tr>
                <tr>
                  <td className="py-3 font-medium">Custom Domains</td>
                  <td className="py-3 text-muted-foreground">-</td>
                  <td className="py-3 text-muted-foreground">3 with HTTPS</td>
                  <td className="py-3 text-muted-foreground">Unlimited</td>
                  <td className="py-3 text-muted-foreground">Unlimited</td>
                </tr>
                <tr>
                  <td className="py-3 font-medium">Scale-to-Zero</td>
                  <td className="py-3 text-emerald-500 font-semibold">Yes</td>
                  <td className="py-3 text-emerald-500 font-semibold">Yes</td>
                  <td className="py-3 text-emerald-500 font-semibold">Yes</td>
                  <td className="py-3 text-emerald-500 font-semibold">Yes</td>
                </tr>
                <tr>
                  <td className="py-3 font-medium">Agent Integration (RFC 8628 & MCP)</td>
                  <td className="py-3 text-emerald-500 font-semibold">Yes</td>
                  <td className="py-3 text-emerald-500 font-semibold">Yes</td>
                  <td className="py-3 text-emerald-500 font-semibold">Yes</td>
                  <td className="py-3 text-emerald-500 font-semibold">Yes</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-background py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Rocket className="h-4 w-4 text-primary" />
            <span>© {new Date().getFullYear()} ShipLane Cloud. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6">
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
