import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { useWFM } from "@/wfm/store";
import { computeRequirements, aggregateRequiredFTE } from "@/wfm/calc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/capacity")({ component: CapacityPage });

function CapacityPage() {
  const state = useWFM();
  const reqs = computeRequirements(state);
  const fte = aggregateRequiredFTE(reqs, state.shrinkage);
  const available = Math.round(state.agents.reduce((a, b) => a + b.weeklyHours / 40, 0) * 10) / 10;
  const gap = Math.max(0, fte.grossFTE - available);

  const overtimeHoursAvail = state.agents.filter((a) => a.overtimeEligible).length * 8;
  const bpoAgents = state.agents.filter((a) => a.employmentType === "bpo").length;

  const cost = state.agents.reduce((a, b) => a + (b.costPerHour ?? 0) * b.weeklyHours, 0);

  return (
    <AppShell>
      <PageHeader title="Capacity plan" description="Compares required FTE against current capacity and identifies sourcing levers."/>
      <div className="grid md:grid-cols-4 gap-3 mb-6">
        <Stat label="Current FTE" value={available}/>
        <Stat label="Required FTE" value={fte.grossFTE} accent/>
        <Stat label="Gap" value={gap > 0 ? `+${gap}` : "0"} negative={gap > 0}/>
        <Stat label="Weekly cost (current)" value={cost ? `$${cost.toLocaleString()}` : "—"}/>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Sourcing levers</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Hiring need" value={`${gap} FTE`} note={gap > 0 ? "Open requisitions to close structural gap." : "No structural hiring needed."}/>
            <Row label="Overtime available" value={`${overtimeHoursAvail} hrs/week`} note="From OT-eligible agents at 8h each."/>
            <Row label="BPO seats in pool" value={`${bpoAgents}`} note="Use for surge or backlog recovery."/>
            <Row label="Reassignment options" value="Cross-skilled agents can absorb spikes."/>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Capacity by employment type</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {(["full_time","part_time","contractor","bpo"] as const).map((t) => {
              const agents = state.agents.filter((a) => a.employmentType === t);
              const hrs = agents.reduce((a, b) => a + b.weeklyHours, 0);
              return (
                <div key={t} className="flex justify-between text-sm border-b py-1">
                  <span className="flex items-center gap-2"><Badge variant="outline">{t}</Badge>{agents.length} agents</span>
                  <span className="font-medium">{hrs} hrs/week</span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function Stat({ label, value, accent, negative }: { label: string; value: number | string; accent?: boolean; negative?: boolean }) {
  return (
    <Card className={accent ? "border-primary/40 bg-primary/5" : negative ? "border-destructive/40 bg-destructive/5" : ""}>
      <CardContent className="py-4">
        <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
        <div className="text-2xl font-semibold mt-1">{value}</div>
      </CardContent>
    </Card>
  );
}
function Row({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="border-b pb-2">
      <div className="flex justify-between"><span>{label}</span><span className="font-medium">{value}</span></div>
      {note && <div className="text-xs text-muted-foreground mt-0.5">{note}</div>}
    </div>
  );
}
