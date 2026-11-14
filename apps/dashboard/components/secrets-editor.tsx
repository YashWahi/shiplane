"use client";

import * as React from "react";
import { Plus, Trash2, Save, Loader2, KeyRound, ShieldAlert, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { setSecrets, toggleScaling } from "@/app/(console)/actions";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface SecretRow {
  id: string;
  name: string;
  value: string;
  isExisting: boolean;
}

interface SecretsEditorProps {
  appId: string;
  existingKeys: string[];
  scalingEnabled: boolean;
}

export function SecretsEditor({
  appId,
  existingKeys,
  scalingEnabled: initialScaling,
}: SecretsEditorProps) {
  const [rows, setRows] = React.useState<SecretRow[]>(() => {
    if (existingKeys.length === 0) {
      return [{ id: "new-0", name: "", value: "", isExisting: false }];
    }
    return existingKeys.map((key, i) => ({
      id: `existing-${i}`,
      name: key,
      value: "",
      isExisting: true,
    }));
  });

  const [scaling, setScaling] = React.useState(initialScaling);
  const [isPending, startTransition] = React.useTransition();
  const [savedSuccess, setSavedSuccess] = React.useState(false);
  const { toast } = useToast();

  const handleAddRow = () => {
    setRows((prev) => [
      ...prev,
      { id: `new-${Date.now()}`, name: "", value: "", isExisting: false },
    ]);
  };

  const handleRemoveRow = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleChangeKey = (id: string, name: string) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, name: name.toUpperCase() } : r))
    );
  };

  const handleChangeValue = (id: string, value: string) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, value } : r))
    );
  };

  const handleSave = () => {
    startTransition(async () => {
      try {
        const payload: Record<string, string> = {};
        for (const row of rows) {
          if (row.name.trim() && row.value.trim()) {
            payload[row.name.trim()] = row.value;
          }
        }

        const promises: Promise<any>[] = [];

        if (Object.keys(payload).length > 0) {
          promises.push(setSecrets(appId, payload));
        }

        if (scaling !== initialScaling) {
          promises.push(toggleScaling(appId, scaling));
        }

        const results = await Promise.all(promises);
        const hasError = results.some((r) => !r.success);

        if (!hasError) {
          setSavedSuccess(true);
          toast({
            title: "Settings Saved",
            description: "Secrets encrypted with AES-256-GCM and updated successfully.",
          });
          setTimeout(() => setSavedSuccess(false), 3000);
        } else {
          toast({
            title: "Save Failed",
            description: "Some settings could not be updated.",
            variant: "destructive",
          });
        }
      } catch (err) {
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Save failed",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Auto-Scaling Toggle Card */}
      <div className="flex items-center justify-between rounded-xl border border-border p-4 bg-card">
        <div className="space-y-0.5">
          <Label htmlFor="scaling-toggle" className="text-base font-semibold">
            Autonomous Auto-Scaling
          </Label>
          <p className="text-xs text-muted-foreground">
            Allow ShipLane to scale instances between 0 (sleeping) and max capacity based on traffic.
          </p>
        </div>
        <Switch
          id="scaling-toggle"
          checked={scaling}
          onCheckedChange={setScaling}
          disabled={isPending}
        />
      </div>

      {/* Secrets Rows */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-primary" />
              <span>Environment Variables</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Encrypted at rest with AES-256-GCM. Values are write-only and never exposed in cleartext.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddRow}
            className="gap-1.5 text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Variable</span>
          </Button>
        </div>

        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.id} className="flex items-center gap-3">
              <div className="w-1/3">
                <Input
                  value={row.name}
                  onChange={(e) => handleChangeKey(row.id, e.target.value)}
                  placeholder="KEY_NAME"
                  className="font-mono text-xs uppercase"
                  disabled={isPending}
                />
              </div>
              <div className="flex-1">
                <Input
                  type="password"
                  value={row.value}
                  onChange={(e) => handleChangeValue(row.id, e.target.value)}
                  placeholder={
                    row.isExisting
                      ? "•••••••• (Enter new value to update)"
                      : "Value (will be encrypted)"
                  }
                  className="font-mono text-xs"
                  disabled={isPending}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveRow(row.id)}
                className="h-9 w-9 text-muted-foreground hover:text-destructive shrink-0"
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Remove</span>
              </Button>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border/60">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldAlert className="h-4 w-4 text-amber-500" />
            <span>Updates take effect on next deployment or service restart.</span>
          </div>

          <Button
            onClick={handleSave}
            disabled={isPending}
            className="gap-2 shadow-sm font-semibold min-w-32"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : savedSuccess ? (
              <>
                <Check className="h-4 w-4 text-emerald-500" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save Changes</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

