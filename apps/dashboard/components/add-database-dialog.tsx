"use client";

import * as React from "react";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { createDatabase } from "@/app/(console)/actions";
import { ElephantIcon, DolphinIcon, CubeIcon, LeafIcon } from "@/components/database-icons";

interface AddDatabaseDialogProps {
  appId: string;
}

const DATABASE_ENGINES = [
  {
    engine: "POSTGRES",
    title: "PostgreSQL",
    subtitle: "Enterprise SQL",
    description: "Robust relational database with JSON support, pgvector, and ACID transactions.",
    version: "v17 Alpine",
    icon: ElephantIcon,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    engine: "MYSQL",
    title: "MySQL",
    subtitle: "Standard Relational",
    description: "Battle-tested relational database ideal for CMS, web apps, and legacy schemas.",
    version: "v8.0",
    icon: DolphinIcon,
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
  },
  {
    engine: "REDIS",
    title: "Redis",
    subtitle: "In-Memory Cache",
    description: "Ultra-fast in-memory key-value data store for sessions, caching, and pub/sub queues.",
    version: "v7.0",
    icon: CubeIcon,
    color: "text-red-500",
    bg: "bg-red-500/10",
  },
  {
    engine: "MONGODB",
    title: "MongoDB",
    subtitle: "Document NoSQL",
    description: "Flexible JSON document store for rapid prototyping and evolving data models.",
    version: "v7.0",
    icon: LeafIcon,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
];

export function AddDatabaseDialog({ appId }: AddDatabaseDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [provisioningEngine, setProvisioningEngine] = React.useState<string | null>(null);
  const { toast } = useToast();

  const handleSelect = async (engine: string) => {
    setProvisioningEngine(engine);
    try {
      const res = await createDatabase(appId, engine);
      if (res.success) {
        toast({
          title: "Database Provisioned",
          description: `Isolated ${engine} instance created and DATABASE_URL injected.`,
        });
        setOpen(false);
      } else {
        toast({
          title: "Provisioning Failed",
          description: res.error || "Could not spin up database container.",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Unexpected error",
        variant: "destructive",
      });
    } finally {
      setProvisioningEngine(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 shadow-sm font-semibold">
          <Plus className="h-4 w-4" />
          <span>Add Database</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Provision an Isolated Database</DialogTitle>
          <DialogDescription>
            Select a managed database engine. We&apos;ll automatically spin up a dedicated container
            and inject its connection string into your application secrets.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
          {DATABASE_ENGINES.map((db) => {
            const Icon = db.icon;
            const isSelected = provisioningEngine === db.engine;
            const isAnyProvisioning = provisioningEngine !== null;

            return (
              <button
                key={db.engine}
                type="button"
                disabled={isAnyProvisioning}
                onClick={() => handleSelect(db.engine)}
                className={`relative flex flex-col text-left p-5 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-accent/40 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed group focus:outline-none focus:ring-2 focus:ring-ring ${
                  isSelected ? "border-primary ring-2 ring-primary" : ""
                }`}
              >
                <div className="flex items-center justify-between w-full mb-3">
                  <div className={`h-10 w-10 rounded-lg ${db.bg} flex items-center justify-center ${db.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-[11px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                    {db.version}
                  </span>
                </div>

                <h4 className="font-bold text-base text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                  <span>{db.title}</span>
                  {isSelected && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />}
                </h4>

                <p className="text-xs font-medium text-muted-foreground mt-0.5">{db.subtitle}</p>

                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  {db.description}
                </p>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
