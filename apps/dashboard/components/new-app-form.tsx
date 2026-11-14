"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Rocket,
  Loader2,
  ArrowRight,
  GitBranch,
  Upload,
  CheckCircle2,
  FileArchive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { deployApp, deployArchive } from "@/app/(console)/actions";

interface NewAppFormProps {
  createAction: (data: {
    name: string;
    subdomain: string;
    runtime: string;
    repository?: string;
  }) => Promise<{ success: boolean; appId?: string; error?: string }>;
}

export function NewAppForm({ createAction }: NewAppFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();

  const [name, setName] = React.useState("");
  const [subdomain, setSubdomain] = React.useState("");
  const [runtime, setRuntime] = React.useState("node");
  const [sourceType, setSourceType] = React.useState<"github" | "zip">("github");
  const [repository, setRepository] = React.useState("");
  const [zipFile, setZipFile] = React.useState<File | null>(null);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    const slug = val
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-");
    setSubdomain(slug);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (
        !file.name.endsWith(".zip") &&
        !file.name.endsWith(".tar.gz") &&
        !file.name.endsWith(".tgz")
      ) {
        toast({
          title: "Invalid file type",
          description: "Please select a .zip or .tar.gz archive.",
          variant: "destructive",
        });
        return;
      }
      setZipFile(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !subdomain) {
      toast({
        title: "Required fields",
        description: "Please provide an app name and subdomain.",
        variant: "destructive",
      });
      return;
    }

    if (sourceType === "zip" && !zipFile) {
      toast({
        title: "ZIP file required",
        description: "Please choose a .zip or .tar.gz project file to publish.",
        variant: "destructive",
      });
      return;
    }

    startTransition(async () => {
      try {
        const repoVal = sourceType === "github" && repository.trim() ? repository.trim() : undefined;
        const res = await createAction({
          name,
          subdomain,
          runtime,
          repository: repoVal,
        });

        if (!res.success || !res.appId) {
          toast({
            title: "Failed to create app",
            description: res.error || "An error occurred.",
            variant: "destructive",
          });
          return;
        }

        const appId = res.appId;

        // Auto-deploy based on selected publishing source
        if (sourceType === "zip" && zipFile) {
          toast({
            title: "Uploading project archive...",
            description: `Unpacking and preparing ${zipFile.name} for deployment.`,
          });
          const formData = new FormData();
          formData.append("archive", zipFile);
          const deployRes = await deployArchive(appId, formData);
          if (deployRes.success) {
            toast({
              title: "App Published & Queued!",
              description: "Your ZIP package was uploaded and build has started.",
            });
          } else {
            toast({
              title: "App created, deploy failed",
              description: deployRes.error || "Could not deploy archive.",
              variant: "destructive",
            });
          }
        } else if (sourceType === "github" && repoVal) {
          toast({
            title: "Queueing GitHub deployment...",
            description: `Connecting to ${repoVal}.`,
          });
          const deployRes = await deployApp(appId);
          if (deployRes.success) {
            toast({
              title: "App Created & Deployment Queued",
              description: `Building latest commit from ${repoVal}.`,
            });
          }
        } else {
          toast({
            title: "App Created!",
            description: `${name} has been initialized.`,
          });
        }

        router.push(`/apps/${appId}`);
      } catch (err) {
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Creation failed",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="app-name">Application Name</Label>
        <Input
          id="app-name"
          value={name}
          onChange={handleNameChange}
          placeholder="my-portfolio-site"
          required
        />
        <p className="text-xs text-muted-foreground">Use a clear name your team will recognize.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="app-subdomain">Subdomain</Label>
        <div className="flex items-center rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring">
          <Input
            id="app-subdomain"
            value={subdomain}
            onChange={(e) => setSubdomain(e.target.value.toLowerCase())}
            placeholder="my-portfolio-site"
            className="min-w-0 border-0 font-mono text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
            required
          />
          <span className="pr-3 text-xs text-muted-foreground font-mono select-none">
            .nebula.app
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="app-runtime">Runtime</Label>
        <Select value={runtime} onValueChange={setRuntime}>
          <SelectTrigger id="app-runtime">
            <SelectValue placeholder="Select runtime" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="node">Node.js 20</SelectItem>
            <SelectItem value="python">Python 3.11</SelectItem>
            <SelectItem value="go">Go 1.22</SelectItem>
            <SelectItem value="dockerfile">Custom Dockerfile</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">Choose the runtime used to build and start your service.</p>
      </div>

      {/* Publishing Method Selection */}
      <div className="space-y-3 pt-2">
        <Label className="text-sm font-semibold">Publishing Method</Label>
        <Tabs
          value={sourceType}
          onValueChange={(val) => setSourceType(val as "github" | "zip")}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="github" className="gap-2">
              <GitBranch className="h-4 w-4" />
              <span>GitHub Repository</span>
            </TabsTrigger>
            <TabsTrigger value="zip" className="gap-2">
              <FileArchive className="h-4 w-4" />
              <span>Upload ZIP File</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="github" className="pt-3 space-y-2">
            <Label htmlFor="app-repo" className="text-xs">
              Repository URL or owner/repo <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="app-repo"
              value={repository}
              onChange={(e) => setRepository(e.target.value)}
              placeholder="username/my-site or https://github.com/..."
            />
            <p className="text-xs leading-5 text-muted-foreground">
              Connect a public GitHub repository. Nebula will pull the latest code and deploy automatically.
            </p>
          </TabsContent>

          <TabsContent value="zip" className="pt-3 space-y-3">
            <Label htmlFor="zip-upload" className="text-xs">
              Select project ZIP or tar.gz archive
            </Label>
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-6 text-center hover:border-primary/50 transition-colors bg-muted/20">
              <Upload className="h-8 w-8 text-muted-foreground mb-2" />
              <label
                htmlFor="zip-upload"
                className="cursor-pointer text-sm font-medium text-primary hover:underline"
              >
                Choose a ZIP file
                <input
                  id="zip-upload"
                  type="file"
                  accept=".zip,.tar.gz,.tgz"
                  onChange={handleFileChange}
                  className="sr-only"
                />
              </label>
              <p className="text-xs text-muted-foreground mt-1">
                Drag and drop or browse (.zip, .tar.gz up to 100MB)
              </p>
              {zipFile && (
                <div className="mt-3 flex items-center gap-2 rounded-md bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>{zipFile.name} ({(zipFile.size / (1024 * 1024)).toFixed(1)} MB)</span>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Ideal for non-technical creators or direct exports. Nebula unzips, builds, and publishes your site automatically.
            </p>
          </TabsContent>
        </Tabs>
      </div>

      <div className="flex justify-end border-t border-border/70 pt-5">
        <Button type="submit" disabled={isPending} className="w-full gap-2 font-semibold shadow-sm sm:w-auto">
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{sourceType === "zip" ? "Deploying ZIP..." : "Publishing App..."}</span>
            </>
          ) : (
            <>
              <Rocket className="h-4 w-4" />
              <span>{sourceType === "zip" ? "Create & Publish ZIP" : "Create Application"}</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
