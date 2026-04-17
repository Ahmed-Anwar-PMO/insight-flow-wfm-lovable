import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { useWFM } from "@/wfm/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { computeRequirements, backlogRecoveryPlan } from "@/wfm/calc";
import { computeCoverageGaps } from "@/wfm/roster";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import { Download } from "lucide-react";

export const Route = createFileRoute("/exports")({ component: ExportsPage });

function downloadBlob(content: BlobPart, name: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

function ExportsPage() {
  const state = useWFM();

  const rosterRows = state.rosters.map((r) => {
    const a = state.agents.find((x) => x.id === r.agentId);
    const q = state.queues.find((x) => x.id === r.queueId);
    return { Agent: a?.name, Date: r.date, Start: r.startTime, End: r.endTime, Shift: r.shiftType, Queue: q?.name, Channel: r.channel, Language: r.language, Locked: r.locked ? "Yes" : "" };
  });

  const exportCsv = (rows: object[], name: string) => downloadBlob(Papa.unparse(rows), name, "text/csv");
  const exportXlsx = (rows: object[], name: string, sheet: string) => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), sheet);
    XLSX.writeFile(wb, name);
  };

  const reqs = computeRequirements(state).map((r) => {
    const q = state.queues.find((x) => x.id === r.queueId);
    return { Date: r.date, Interval: r.intervalStart, Queue: q?.name, Channel: r.channel, Volume: Math.round(r.volume), WorkloadMin: r.workloadMinutes, RequiredAgents: r.requiredAgents };
  });
  const gaps = computeCoverageGaps(state).map((g) => {
    const q = state.queues.find((x) => x.id === g.queueId);
    return { Date: g.date, Interval: g.intervalStart, Queue: q?.name, Required: g.required, Scheduled: g.scheduled, Gap: g.gap, Status: g.status };
  });
  const backlog = backlogRecoveryPlan(state).map((p) => ({ Queue: p.queueName, Total: p.total, WorkloadHrs: p.workloadHours, AddFTE: p.additionalFTE, SLArisk: p.slaRisk }));

  const items: { title: string; rows: object[]; base: string }[] = [
    { title: "Roster", rows: rosterRows, base: "roster" },
    { title: "Staffing requirement model", rows: reqs, base: "staffing-model" },
    { title: "Coverage gap report", rows: gaps, base: "coverage-gaps" },
    { title: "Backlog recovery plan", rows: backlog, base: "backlog-recovery" },
    { title: "Scenarios", rows: state.scenarios as unknown as object[], base: "scenarios" },
  ];

  return (
    <AppShell>
      <PageHeader title="Exports" description="Download CSV or XLSX of operational outputs."/>
      <div className="grid md:grid-cols-2 gap-4">
        {items.map((it) => (
          <Card key={it.base}>
            <CardHeader><CardTitle className="text-base">{it.title}</CardTitle></CardHeader>
            <CardContent className="flex gap-2">
              <Button variant="outline" disabled={it.rows.length === 0} onClick={() => exportCsv(it.rows, `${it.base}.csv`)}><Download className="h-3 w-3 mr-2"/>CSV</Button>
              <Button variant="outline" disabled={it.rows.length === 0} onClick={() => exportXlsx(it.rows, `${it.base}.xlsx`, it.title.slice(0, 30))}><Download className="h-3 w-3 mr-2"/>XLSX</Button>
              <span className="text-xs text-muted-foreground self-center">{it.rows.length} rows</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
