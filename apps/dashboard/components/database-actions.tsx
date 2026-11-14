"use client";

import * as React from "react";
import { Moon, Sun, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { sleepDatabase, wakeDatabase, deleteDatabase } from "@/app/(console)/actions";

interface DatabaseActionsProps {
  appId: string;
  databaseId: string;
  status: string;
}

export function DatabaseActions({ appId, databaseId, status }: DatabaseActionsProps) {
  const [isPending, startTransition] = React.useTransition();
  const { toast } = useToast();
  const isSleeping = status.toUpperCase() === "SLEEPING";

  const handleToggleSleep = () => {
    startTransition(async () => {
      try {
        if (isSleeping) {
          const res = await wakeDatabase(appId, databaseId);
          if (res.success) {
            toast({ title: "Database Woken", description: "Container is active and receiving traffic." });
          } else {
            toast({ title: "Action Failed", description: res.error, variant: "destructive" });
          }
        } else {
          const res = await sleepDatabase(appId, databaseId);
          if (res.success) {
            toast({ title: "Database Paused", description: "Container is sleeping to conserve resources." });
          } else {
            toast({ title: "Action Failed", description: res.error, variant: "destructive" });
          }
        }
      } catch (err) {
        toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" });
      }
    });
  };

  const handleDelete = () => {
    if (!confirm("Are you sure you want to terminate this database? Data in this container will be permanently removed.")) {
      return;
    }

    startTransition(async () => {
      try {
        const res = await deleteDatabase(appId, databaseId);
        if (res.success) {
          toast({ title: "Database Deleted", description: "Database container removed." });
        } else {
          toast({ title: "Delete Failed", description: res.error, variant: "destructive" });
        }
      } catch (err) {
        toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" });
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      {isSleeping ? (
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={handleToggleSleep}
          className="h-8 gap-1.5 text-xs text-emerald-500 hover:text-emerald-400"
        >
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sun className="h-3.5 w-3.5" />}
          <span>Wake</span>
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={handleToggleSleep}
          className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Moon className="h-3.5 w-3.5" />}
          <span>Sleep</span>
        </Button>
      )}

      <Button
        variant="ghost"
        size="sm"
        disabled={isPending}
        onClick={handleDelete}
        className="h-8 gap-1.5 text-xs text-destructive hover:bg-destructive/10"
      >
        <Trash2 className="h-3.5 w-3.5" />
        <span>Delete</span>
      </Button>
    </div>
  );
}

