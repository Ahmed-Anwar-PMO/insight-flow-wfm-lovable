import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { useWFM } from "@/wfm/store";
import { generateRotation } from "@/wfm/roster";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/rotations")({ component: RotationPage });

function RotationPage() {
  const state = useWFM();
  const rows = generateRotation(state);
  return (
    <AppShell>
      <PageHeader title="Rotation planner" description="Fair rotations for weekends, nights, holidays and on-call. Respects max consecutive days and balances unpopular shifts."/>
      <div className="grid md:grid-cols-3 gap-3 mb-6">
        <Stat label="Pattern" value={state.rotation.pattern}/>
        <Stat label="Min senior per shift" value={state.rotation.minSeniorPerShift}/>
        <Stat label="Escalation coverage" value={state.rotation.escalationCoverage}/>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Rotation assignments</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground"><tr><th className="text-left p-1">Agent</th><th>Weekend</th><th>Night</th><th>Holiday</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.agentId} className="border-t">
                  <td className="p-1">{r.agentName}</td>
                  <td className="text-center">{r.weekend}</td>
                  <td className="text-center">{r.night}</td>
                  <td className="text-center">{r.holiday}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </AppShell>
  );
}
function Stat({ label, value }: { label: string; value: string | number }) {
  return <Card><CardContent className="py-4"><div className="text-xs text-muted-foreground uppercase">{label}</div><div className="text-xl font-semibold mt-1">{value}</div></CardContent></Card>;
}
