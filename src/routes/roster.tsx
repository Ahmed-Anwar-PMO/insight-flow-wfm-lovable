import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { useWFM } from "@/wfm/store";
import { generateRosters } from "@/wfm/roster";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, LockOpen, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/EmptyState";

export const Route = createFileRoute("/roster")({ component: RosterPage });

function RosterPage() {
  const state = useWFM();
  const [view, setView] = useState<"daily" | "weekly">("weekly");
  const [day, setDay] = useState<string>(new Date().toISOString().slice(0, 10));

  const dates = useMemo(() => {
    const set = new Set(state.rosters.map((r) => r.date));
    return Array.from(set).sort();
  }, [state.rosters]);

  if (state.agents.length === 0 || state.shiftRules.length === 0) {
    return <AppShell><PageHeader title="Roster"/><EmptyState title="Need agents and shift rules" description="Complete steps 6 & 7 in the wizard first." ctaTo="/wizard"/></AppShell>;
  }

  const regen = () => {
    const fresh = generateRosters(state, 7);
    state.set("rosters", fresh);
  };

  const toggleLock = (id: string) => {
    state.set("rosters", state.rosters.map((r) => r.id === id ? { ...r, locked: !r.locked } : r));
  };

  const filtered = view === "daily" ? state.rosters.filter((r) => r.date === day) : state.rosters;

  return (
    <AppShell>
      <PageHeader title="Roster" description="Generated from demand, shifts, skills, languages and rotation rules. Locked entries are preserved on regeneration."
        actions={
          <>
            <Button variant="outline" onClick={() => setView(view === "daily" ? "weekly" : "daily")}>{view === "daily" ? "Weekly view" : "Daily view"}</Button>
            <Button onClick={regen}><RefreshCw className="h-3 w-3 mr-2"/>Regenerate</Button>
          </>
        }
      />
      {view === "daily" && (
        <div className="mb-4 flex gap-2 flex-wrap">
          {dates.map((d) => (
            <Button key={d} size="sm" variant={day === d ? "default" : "outline"} onClick={() => setDay(d)}>{d.slice(5)}</Button>
          ))}
        </div>
      )}
      {state.rosters.length === 0 ? (
        <EmptyState title="No roster yet" description="Click Regenerate to build a 7-day roster from your inputs."/>
      ) : (
        <Card>
          <CardHeader><CardTitle className="text-base">{filtered.length} shift assignments</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground">
                <tr>
                  <th className="text-left p-1">Agent</th><th>Date</th><th>Start</th><th>End</th>
                  <th>Shift</th><th>Queue</th><th>Channel</th><th>Lang</th><th>Breaks</th><th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 400).map((r) => {
                  const a = state.agents.find((x) => x.id === r.agentId);
                  const q = state.queues.find((x) => x.id === r.queueId);
                  return (
                    <tr key={r.id} className={`border-t ${r.locked ? "bg-warning/10" : ""}`}>
                      <td className="p-1">{a?.name}</td>
                      <td>{r.date.slice(5)}</td>
                      <td>{r.startTime}</td>
                      <td>{r.endTime}</td>
                      <td><Badge variant="outline">{r.shiftType}</Badge></td>
                      <td>{q?.name ?? "—"}</td>
                      <td>{r.channel}</td>
                      <td>{r.language}</td>
                      <td className="text-xs">{r.breaks.map((b) => `${b.type}@${b.start}`).join(", ")}</td>
                      <td><Button variant="ghost" size="icon" onClick={() => toggleLock(r.id)}>{r.locked ? <Lock className="h-4 w-4"/> : <LockOpen className="h-4 w-4 opacity-50"/>}</Button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length > 400 && <p className="text-xs text-muted-foreground mt-2">Showing first 400 entries.</p>}
          </CardContent>
        </Card>
      )}
    </AppShell>
  );
}
