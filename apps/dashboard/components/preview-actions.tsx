"use client";

import * as React from "react";
import { ExternalLink, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { destroyPreview } from "@/app/(console)/actions";

interface PreviewActionsProps {
  appId: string;
  previewId: string;
  url: string;
}

export function PreviewActions({ appId, previewId, url }: PreviewActionsProps) {
  const [isPending, startTransition] = React.useTransition();
  const { toast } = useToast();

  const handleDestroy = () => {
    if (!confirm("Are you sure you want to destroy this preview environment?")) {
      return;
    }

    startTransition(async () => {
      try {
        const res = await destroyPreview(appId, previewId);
        if (res.success) {
          toast({
            title: "Preview Destroyed",
            description: "Preview containers and routes were terminated.",
          });
        } else {
          toast({
            title: "Action Failed",
            description: res.error || "Could not destroy preview.",
            variant: "destructive",
          });
        }
      } catch (err) {
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Failed",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="flex items-center justify-end gap-2">
      <Button asChild variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
        <a href={url} target="_blank" rel="noreferrer">
          <ExternalLink className="h-3.5 w-3.5" />
          <span>Visit</span>
        </a>
      </Button>

      <Button
        variant="ghost"
        size="sm"
        disabled={isPending}
        onClick={handleDestroy}
        className="h-8 gap-1.5 text-xs text-destructive hover:bg-destructive/10"
      >
        {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
        <span>Destroy</span>
      </Button>
    </div>
  );
}

