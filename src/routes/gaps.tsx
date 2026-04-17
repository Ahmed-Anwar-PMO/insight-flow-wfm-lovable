import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { useWFM } from "@/wfm/store";
import { computeCoverageGaps } from "@/wfm/roster";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMemo } from "react";
import { EmptyState } from "@/components/EmptyState";

export const Route = createFileRoute("/gaps")({ component: GapsPage });

function GapsPage() {
  const state = useWFM();
  const gaps = useMemo(() => computeCoverageGaps(state), [state]);

  if (state.rosters.length === 0) {
    return <AppShell><PageHeader title="Coverage gaps"/><EmptyState title="Generate a roster first" description="Coverage gaps compare the roster against required staffing." ctaTo="/roster"/></AppShell>;
  }

  // Heatmap by date x hour, summing gaps
  const dates = Array.from(new Set(gaps.map((g) => g.date))).sort();
  const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}:00`);
  const cell = new Map<string, { gap: number; status: "covered" | "risk" | "gap" }>();
  for (const g of gaps) {
    const k = `${g.date}|${g.intervalStart}`;
    const cur = cell.get(k) ?? { gap: 0, status: "covered" as const };
    const newGap = Math.max(cur.gap, g.gap);
    cell.set(k, { gap: newGap, status: g.status === "gap" ? "gap" : g.status === "risk" && cur.status !== "gap" ? "risk" : cur.status });
  }

  const totals = { covered: 0, risk: 0, gap: 0 };
  gaps.forEach((g) => totals[g.status]++);

  return (
    <AppShell>
      <PageHeader title="Coverage gap analysis" description="Required vs scheduled per interval. Green = covered, amber = risk, red = gap."/>
      <div className="grid md:grid-cols-3 gap-3 mb-6">
        <Stat label="Covered intervals" value={totals.covered} color="success"/>
        <Stat label="At risk" value={totals.risk} color="warning"/>
        <Stat label="Gap" value={totals.gap} color="destructive"/>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Heatmap (max gap per interval)</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="text-xs">
            <thead><tr><th className="p-1"></th>{hours.map((h) => <th key={h} className="px-1 text-muted-foreground">{h.slice(0, 2)}</th>)}</tr></thead>
            <tbody>
              {dates.map((d) => (
                <tr key={d}>
                  <td className="p-1 pr-2 text-muted-foreground">{d.slice(5)}</td>
                  {hours.map((h) => {
                    const c = cell.get(`${d}|${h}`);
                    const bg = !c ? "bg-muted" : c.status === "covered" ? "bg-success/30" : c.status === "risk" ? "bg-warning/40" : "bg-destructive/50";
                    return <td key={h} className={`w-6 h-6 border ${bg}`} title={c ? `Gap ${c.gap}` : "no demand"}/>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
      <Card className="mt-4">
        <CardHeader><CardTitle className="text-base">Top gap intervals</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground"><tr><th className="text-left p-1">Date</th><th>Interval</th><th>Queue</th><th>Required</th><th>Scheduled</th><th>Gap</th></tr></thead>
            <tbody>
              {[...gaps].filter((g) => g.gap > 0).sort((a, b) => b.gap - a.gap).slice(0, 25).map((g, i) => {
                const q = state.queues.find((x) => x.id === g.queueId);
                return (
                  <tr key={i} className="border-t">
                    <td className="p-1">{g.date.slice(5)}</td>
                    <td>{g.intervalStart}</td>
                    <td>{q?.name}</td>
                    <td className="text-center">{g.required}</td>
                    <td className="text-center">{g.scheduled}</td>
                    <td className="text-center text-destructive font-medium">+{g.gap}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </AppShell>
  );
}
function Stat({ label, value, color }: { label: string; value: number; color: "success" | "warning" | "destructive" }) {
  const cls = color === "success" ? "border-success/40 bg-success/10" : color === "warning" ? "border-warning/40 bg-warning/10" : "border-destructive/40 bg-destructive/10";
  return <Card className={cls}><CardContent className="py-4"><div className="text-xs text-muted-foreground uppercase">{label}</div><div className="text-2xl font-semibold mt-1">{value}</div></CardContent></Card>;
}
