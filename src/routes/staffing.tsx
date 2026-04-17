import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { useWFM } from "@/wfm/store";
import { computeRequirements, aggregateRequiredFTE, productiveTimePct } from "@/wfm/calc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMemo } from "react";
import { EmptyState } from "@/components/EmptyState";

export const Route = createFileRoute("/staffing")({ component: StaffingPage });

function StaffingPage() {
  const state = useWFM();
  const reqs = useMemo(() => computeRequirements(state), [state]);

  if (state.queues.length === 0) {
    return <AppShell><PageHeader title="Staffing model"/><EmptyState title="No queues" description="Add queues and demand in the wizard." ctaTo="/wizard"/></AppShell>;
  }

  const fte = aggregateRequiredFTE(reqs, state.shrinkage);
  const available = state.agents.reduce((a, b) => a + b.weeklyHours / 40, 0);
  const gap = fte.grossFTE - available;

  // Required by queue, channel, language, region
  const byQueue = group(reqs, (r) => r.queueId);
  const queueRows = Object.entries(byQueue).map(([qid, rows]) => {
    const q = state.queues.find((x) => x.id === qid);
    const peak = Math.max(...rows.map((r) => r.requiredAgents));
    const avg = rows.reduce((a, b) => a + b.requiredAgents, 0) / rows.length;
    return { id: qid, name: q?.name, channel: q?.channel, language: q?.language, region: state.business.regions.find((r) => r.id === q?.regionId)?.name, peak, avg: Math.round(avg * 10) / 10 };
  });

  const byChannel = group(reqs, (r) => r.channel);
  const byLang = group(reqs.map((r) => ({ ...r, language: state.queues.find((q) => q.id === r.queueId)?.language ?? "—" })), (r) => r.language);
  const byRegion = group(reqs.map((r) => ({ ...r, region: state.business.regions.find((rg) => rg.id === state.queues.find((q) => q.id === r.queueId)?.regionId)?.name ?? "—" })), (r) => r.region);

  return (
    <AppShell>
      <PageHeader title="Staffing requirement model" description="Required staffing computed from demand × AHT, with shrinkage applied."/>
      <div className="grid md:grid-cols-4 gap-3 mb-6">
        <Stat label="Productive FTE needed" value={fte.productiveFTE}/>
        <Stat label="Gross FTE needed (after shrinkage)" value={fte.grossFTE} accent/>
        <Stat label="Available (FTE-equivalent)" value={available.toFixed(1)}/>
        <Stat label="Gap" value={gap > 0 ? `+${gap.toFixed(1)}` : gap.toFixed(1)} negative={gap > 0}/>
      </div>
      <div className="text-xs text-muted-foreground mb-4">
        Productive time: <strong>{productiveTimePct(state.shrinkage)}%</strong> · Total shrinkage: <strong>{(100 - productiveTimePct(state.shrinkage)).toFixed(0)}%</strong>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Required agents — by queue</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground"><tr><th className="text-left p-1">Queue</th><th>Channel</th><th>Lang</th><th>Region</th><th>Avg</th><th>Peak</th></tr></thead>
              <tbody>
                {queueRows.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="p-1">{r.name}</td>
                    <td><Badge variant="outline">{r.channel}</Badge></td>
                    <td className="text-center">{r.language}</td>
                    <td className="text-center">{r.region}</td>
                    <td className="text-center">{r.avg}</td>
                    <td className="text-center font-medium">{r.peak}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Required by dimension</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Dim title="By channel" rows={Object.entries(byChannel).map(([k, v]) => [k, peak(v)])}/>
            <Dim title="By language" rows={Object.entries(byLang).map(([k, v]) => [k, peak(v)])}/>
            <Dim title="By region" rows={Object.entries(byRegion).map(([k, v]) => [k, peak(v)])}/>
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
function group<T>(arr: T[], k: (x: T) => string): Record<string, T[]> {
  return arr.reduce((acc, x) => { const key = k(x); (acc[key] ??= []).push(x); return acc; }, {} as Record<string, T[]>);
}
function peak(rows: { requiredAgents: number }[]): number { return Math.max(...rows.map((r) => r.requiredAgents)); }
function Dim({ title, rows }: { title: string; rows: [string, number][] }) {
  return (
    <div>
      <div className="text-xs uppercase text-muted-foreground mb-1">{title}</div>
      <div className="space-y-1">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between border-b py-1"><span>{k}</span><span className="font-medium">{v} peak</span></div>
        ))}
      </div>
    </div>
  );
}
