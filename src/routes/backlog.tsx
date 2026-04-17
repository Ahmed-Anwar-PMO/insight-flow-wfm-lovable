import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { useWFM } from "@/wfm/store";
import { backlogRecoveryPlan } from "@/wfm/calc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/EmptyState";

export const Route = createFileRoute("/backlog")({ component: BacklogPage });

function BacklogPage() {
  const state = useWFM();
  const plan = backlogRecoveryPlan(state);

  if (plan.length === 0) {
    return <AppShell><PageHeader title="Backlog recovery"/><EmptyState title="No backlog snapshots" description="Add backlog by age in step 3 of the wizard." ctaTo="/wizard"/></AppShell>;
  }

  return (
    <AppShell>
      <PageHeader title="Backlog recovery plan" description="Workload required to clear current backlog within the target window."/>
      <div className="space-y-4">
        {plan.map((p) => (
          <Card key={p.queueId}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{p.queueName}</CardTitle>
                <Badge variant={p.slaRisk === "high" ? "destructive" : p.slaRisk === "medium" ? "outline" : "secondary"}>{p.slaRisk} SLA risk</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-3 mb-4">
                <Stat label="Total backlog" value={p.total}/>
                <Stat label="Workload (hrs)" value={p.workloadHours}/>
                <Stat label={`Per day for ${p.targetDays}d`} value={`${p.additionalProductiveHoursPerDay}h`}/>
                <Stat label="Additional FTE" value={p.additionalFTE} accent/>
              </div>
              <div className="text-sm text-muted-foreground">
                Buckets — 0-24h: <strong className="text-foreground">{p.buckets["0-24h"]}</strong> ·
                24-48h: <strong className="text-foreground">{p.buckets["24-48h"]}</strong> ·
                48-72h: <strong className="text-foreground">{p.buckets["48-72h"]}</strong> ·
                72h+: <strong className="text-destructive">{p.buckets["72h+"]}</strong>
              </div>
              <div className="mt-3 grid md:grid-cols-3 gap-2 text-sm">
                <Lever title="Overtime" body={`Use OT-eligible agents to add ${Math.ceil(p.additionalProductiveHoursPerDay / 4)} shifts/day.`}/>
                <Lever title="BPO surge" body="Burst BPO seats for 5 days; preserve in-house for VIP."/>
                <Lever title="Reassignment" body="Pull cross-skilled agents from below-target queues."/>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
function Stat({ label, value, accent }: { label: string; value: number | string; accent?: boolean }) {
  return <Card className={accent ? "border-primary/40 bg-primary/5" : ""}><CardContent className="py-3"><div className="text-xs text-muted-foreground uppercase">{label}</div><div className="text-xl font-semibold mt-1">{value}</div></CardContent></Card>;
}
function Lever({ title, body }: { title: string; body: string }) {
  return <div className="border rounded p-3"><div className="font-medium text-sm">{title}</div><div className="text-xs text-muted-foreground mt-1">{body}</div></div>;
}
