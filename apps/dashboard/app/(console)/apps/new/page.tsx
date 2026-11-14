import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { NewAppForm } from "@/components/new-app-form";
import { createApplication } from "@/app/(console)/actions";

export default function NewAppPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 py-2 sm:py-6">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Get started</p>
        <h1 className="page-heading">Create an application</h1>
        <p className="max-w-xl text-sm leading-6 text-muted-foreground">
          Set up your runtime and repository. You can add environment variables and databases after creation.
        </p>
      </div>

      <Card className="border-border/80 bg-card/90 shadow-lg shadow-black/10">
        <CardContent className="p-5 sm:p-7">
          <NewAppForm createAction={createApplication} />
        </CardContent>
      </Card>
    </div>
  );
}

