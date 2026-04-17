import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { useWFM } from "@/wfm/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/settings")({ component: SettingsPage });

function SettingsPage() {
  const state = useWFM();
  return (
    <AppShell>
      <PageHeader title="Settings" description="Plan data is stored locally in your browser. No PII is required."/>
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Demo data</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">Loads 3 regions, 6 queues, 30 agents, weekly forecast and shrinkage.</p>
            <Button onClick={() => state.loadDemo()}>Load demo dataset</Button>
          </CardContent>
        </Card>
        <Card className="border-destructive/30">
          <CardHeader><CardTitle className="text-base">Reset plan</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">Clears all inputs and outputs from this browser.</p>
            <Button variant="destructive" onClick={() => { if (confirm("Reset all WFM data?")) state.reset(); }}>Reset everything</Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
