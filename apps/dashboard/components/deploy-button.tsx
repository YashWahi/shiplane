"use client";

import * as React from "react";
import {
  Loader2,
  Rocket,
  CheckCircle2,
  GitBranch,
  Upload,
  FileArchive,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { deployApp, deployArchive } from "@/app/(console)/actions";

interface DeployButtonProps {
  appId: string;
  repository?: string | null;
  size?: "default" | "sm" | "lg";
}

export function DeployButton({ appId, repository, size = "lg" }: DeployButtonProps) {
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();
  const [activeTab, setActiveTab] = React.useState<"github" | "zip">(
    repository ? "github" : "zip"
  );
  const [repoInput, setRepoInput] = React.useState(repository || "");
  const [zipFile, setZipFile] = React.useState<File | null>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (
        !file.name.endsWith(".zip") &&
        !file.name.endsWith(".tar.gz") &&
        !file.name.endsWith(".tgz")
      ) {
        toast({
          title: "Invalid file format",
          description: "Please choose a .zip or .tar.gz archive.",
          variant: "destructive",
        });
        return;
      }
      setZipFile(file);
    }
  };

  const handleDeployGitHub = () => {
    startTransition(async () => {
      try {
        const res = await deployApp(appId, repoInput.trim() || undefined);
        if (res.success) {
          toast({
            title: "GitHub Deployment Queued",
            description: "New build triggered from repository.",
          });
          setOpen(false);
        } else {
          toast({
            title: "Deployment Failed",
            description: res.error || "Unable to queue deployment.",
            variant: "destructive",
          });
        }
      } catch (err) {
        toast({
          title: "Deployment Error",
          description: err instanceof Error ? err.message : "Unexpected error",
          variant: "destructive",
        });
      }
    });
  };

  const handleDeployZip = () => {
    if (!zipFile) {
      toast({
        title: "No file selected",
        description: "Please choose a ZIP archive to deploy.",
        variant: "destructive",
      });
      return;
    }

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("archive", zipFile);
        const res = await deployArchive(appId, formData);
        if (res.success) {
          toast({
            title: "ZIP Deployment Queued",
            description: `${zipFile.name} uploaded and build queued.`,
          });
          setOpen(false);
          setZipFile(null);
        } else {
          toast({
            title: "Deployment Failed",
            description: res.error || "Could not deploy archive.",
            variant: "destructive",
          });
        }
      } catch (err) {
        toast({
          title: "Deployment Error",
          description: err instanceof Error ? err.message : "Unexpected error",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size={size} className="gap-2 shadow-sm font-semibold">
          <Rocket className="h-4 w-4" />
          <span>Deploy</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            <span>Publish New Deployment</span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            Deploy your latest code from a connected GitHub repository or upload a fresh ZIP file.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as "github" | "zip")}
          className="w-full pt-2"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="github" className="gap-2">
              <GitBranch className="h-4 w-4" />
              <span>GitHub</span>
            </TabsTrigger>
            <TabsTrigger value="zip" className="gap-2">
              <FileArchive className="h-4 w-4" />
              <span>ZIP Upload</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="github" className="space-y-4 pt-3">
            <div className="space-y-2">
              <Label htmlFor="deploy-repo" className="text-xs">
                GitHub Repository
              </Label>
              <Input
                id="deploy-repo"
                value={repoInput}
                onChange={(e) => setRepoInput(e.target.value)}
                placeholder="owner/repo or https://github.com/..."
              />
              <p className="text-xs text-muted-foreground">
                {repository
                  ? `Currently connected to ${repository}. Click below to pull and rebuild latest commit.`
                  : "Enter a public GitHub repository to clone and build."}
              </p>
            </div>

            <Button
              onClick={handleDeployGitHub}
              disabled={isPending || (!repoInput && !repository)}
              className="w-full gap-2 font-semibold"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Queueing build...</span>
                </>
              ) : (
                <>
                  <Rocket className="h-4 w-4" />
                  <span>Deploy from GitHub</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="zip" className="space-y-4 pt-3">
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-5 text-center hover:border-primary/50 transition-colors bg-muted/20">
              <Upload className="h-7 w-7 text-muted-foreground mb-1.5" />
              <label
                htmlFor="dialog-zip-upload"
                className="cursor-pointer text-sm font-medium text-primary hover:underline"
              >
                Choose a ZIP file
                <input
                  id="dialog-zip-upload"
                  type="file"
                  accept=".zip,.tar.gz,.tgz"
                  onChange={handleFileChange}
                  className="sr-only"
                />
              </label>
              <p className="text-xs text-muted-foreground mt-1">
                .zip or .tar.gz archive up to 100MB
              </p>
              {zipFile && (
                <div className="mt-2.5 flex items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  <span>{zipFile.name} ({(zipFile.size / (1024 * 1024)).toFixed(1)} MB)</span>
                </div>
              )}
            </div>

            <Button
              onClick={handleDeployZip}
              disabled={isPending || !zipFile}
              className="w-full gap-2 font-semibold"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Uploading & deploying...</span>
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  <span>Upload & Deploy ZIP</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
