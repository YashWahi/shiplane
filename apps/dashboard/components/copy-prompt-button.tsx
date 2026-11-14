"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface CopyPromptButtonProps {
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
}

export function CopyPromptButton({ className, size = "lg" }: CopyPromptButtonProps) {
  const [copied, setCopied] = React.useState(false);
  const { toast } = useToast();

  const promptText = "Deploy my project to Nebula. Fetch https://nebula.app/agent.md and follow it.";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(promptText);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Agent prompt copied to your clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
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
      className={className}
      variant={copied ? "secondary" : "default"}
    >
      {copied ? (
        <>
          <Check className="mr-2 h-5 w-5 text-emerald-500" />
          <span>Copied!</span>
        </>
      ) : (
        <>
          <Copy className="mr-2 h-5 w-5" />
          <span>Copy Agent Prompt</span>
        </>
      )}
    </Button>
  );
}

