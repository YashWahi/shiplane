"use client";

import * as React from "react";
import { Check, Copy, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

interface CopyPromptButtonProps {
  className?: string;
  size?: "default" | "sm" | "lg" | "icon" | "pill";
  variant?: "default" | "taskible" | "taskibleSecondary" | "gradient" | "outline" | "secondary" | "glass";
}

export function CopyPromptButton({ className, size = "lg", variant = "taskible" }: CopyPromptButtonProps) {
  const [copied, setCopied] = React.useState(false);
  const { toast } = useToast();

  const promptText = "Deploy my project to Nebula. Fetch https://nebula.app/agent.md and follow it.";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(promptText);
      setCopied(true);
      toast({
        title: "Copied to Clipboard!",
        description: "Paste this prompt into Claude Code, Cursor, Windsurf, or your AI terminal.",
      });
      setTimeout(() => setCopied(false), 2200);
    } catch {
      toast({
        title: "Error copying",
        description: "Please copy the prompt manually.",
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      onClick={handleCopy}
      size={size}
      className={cn(
        "font-semibold tracking-tight transition-all duration-200",
        copied
          ? "!bg-emerald-600 hover:!bg-emerald-600 text-white shadow-emerald-500/20"
          : "",
        className
      )}
      variant={copied ? "default" : variant}
    >
      {copied ? (
        <>
          <Check className="mr-2 h-4 w-4 text-white animate-in zoom-in-75" />
          <span>Prompt Copied!</span>
        </>
      ) : (
        <>
          <Sparkles className="mr-2 h-4 w-4 text-blue-200" />
          <span>Copy Agent Prompt</span>
        </>
      )}
    </Button>
  );
}
