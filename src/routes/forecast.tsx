import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { useWFM } from "@/wfm/store";
import { computeRequirements } from "@/wfm/calc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMemo, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, Legend, CartesianGrid } from "recharts";
import { EmptyState } from "@/components/EmptyState";

export const Route = createFileRoute("/forecast")({ component: ForecastPage });

function ForecastPage() {
  const state = useWFM();
  const [queueId, setQueueId] = useState<string>("all");
  const reqs = useMemo(() => computeRequirements(state), [state]);

  if (state.demand.length === 0) {
    return <AppShell><PageHeader title="Forecast"/><EmptyState title="No demand data" description="Add forecast volume in the wizard." ctaTo="/wizard" ctaLabel="Open wizard"/></AppShell>;
  }

  const filtered = queueId === "all" ? reqs : reqs.filter((r) => r.queueId === queueId);
  const byInterval = aggregate(filtered, (r) => `${r.date} ${r.intervalStart}`, (acc, r) => ({
    label: `${r.date.slice(5)} ${r.intervalStart}`,
    volume: (acc?.volume ?? 0) + r.volume,
    workload: (acc?.workload ?? 0) + r.workloadMinutes,
    required: (acc?.required ?? 0) + r.requiredAgents,
  })).slice(0, 168);

  const byChannel = aggregate(filtered, (r) => r.channel, (acc, r) => ({
    label: r.channel,
    volume: (acc?.volume ?? 0) + r.volume,
  }));

  return (
    <AppShell>
      <PageHeader title="Forecast" description="Volume, workload and required agents per interval, channel and queue."
        actions={
          <Select value={queueId} onValueChange={setQueueId}>
            <SelectTrigger className="w-[200px]"><SelectValue/></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All queues</SelectItem>
              {state.queues.map((q) => <SelectItem key={q.id} value={q.id}>{q.name}</SelectItem>)}
            </SelectContent>
          </Select>
        }
      />
      <div className="grid gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Volume & required agents by interval</CardTitle></CardHeader>
          <CardContent style={{ height: 320 }}>
            <ResponsiveContainer>
              <LineChart data={byInterval}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))"/>
                <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={Math.floor(byInterval.length / 12)}/>
                <YAxis tick={{ fontSize: 11 }}/>
                <Tooltip/>
                <Legend/>
                <Line dataKey="volume" stroke="oklch(0.45 0.15 240)" dot={false} name="Volume"/>
                <Line dataKey="required" stroke="oklch(0.62 0.16 150)" dot={false} name="Required agents"/>
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Volume by channel</CardTitle></CardHeader>
            <CardContent style={{ height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={byChannel}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))"/>
                  <XAxis dataKey="label" tick={{ fontSize: 11 }}/>
                  <YAxis tick={{ fontSize: 11 }}/>
                  <Tooltip/>
                  <Bar dataKey="volume" fill="oklch(0.45 0.15 240)"/>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Backlog by age (async queues)</CardTitle></CardHeader>
            <CardContent>
              {state.backlogs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No backlog snapshots provided.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="text-xs text-muted-foreground"><tr><th className="text-left p-1">Queue</th><th>0-24h</th><th>24-48h</th><th>48-72h</th><th>72h+</th></tr></thead>
                  <tbody>
                    {state.backlogs.map((b) => {
                      const q = state.queues.find((x) => x.id === b.queueId);
                      return (
                        <tr key={b.queueId} className="border-t">
                          <td className="p-1">{q?.name}</td>
                          <td className="text-center">{b.bucket_0_24}</td>
                          <td className="text-center">{b.bucket_24_48}</td>
                          <td className="text-center">{b.bucket_48_72}</td>
                          <td className="text-center text-destructive font-medium">{b.bucket_72_plus}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function aggregate<T, R extends { label: string }>(arr: T[], keyFn: (x: T) => string, mergeFn: (acc: R | undefined, x: T) => R): R[] {
  const m = new Map<string, R>();
  for (const x of arr) {
    const k = keyFn(x);
    m.set(k, mergeFn(m.get(k), x));
  }
  return Array.from(m.values());
}
