import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { useWFM } from "@/wfm/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { v4 as uuid } from "uuid";
import type { RTALog } from "@/wfm/types";
import { Activity } from "lucide-react";

export const Route = createFileRoute("/rta")({ component: RTAPage });

const levers = [
  "Rebalance agents across queues",
  "Reprioritize SLA-risk work",
  "Move floaters into queues",
  "Pause non-urgent work",
  "Ask for voluntary overtime",
  "Trigger BPO overflow",
  "Escalate systemic drivers (outage / product bug)",
];

function RTAPage() {
  const state = useWFM();
  const [type, setType] = useState<RTALog["type"]>("note");
  const [msg, setMsg] = useState("");

  const log = () => {
    if (!msg.trim()) return;
    state.set("rtaLogs", [{ id: uuid(), timestamp: new Date().toISOString(), type, message: msg }, ...state.rtaLogs]);
    setMsg("");
  };

  // Planned vs actual snapshot for current hour
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const hour = `${String(now.getHours()).padStart(2, "0")}:00`;
  const planned = state.rosters.filter((r) => r.date === today && r.startTime <= hour && r.endTime > hour).length;
  const actual = Math.max(0, planned - state.rtaLogs.filter((l) => l.type === "absence").length);

  return (
    <AppShell>
      <PageHeader title="Real-time adherence" description="Live operational view: planned vs actual, queue depth proxy, and recommended levers."/>
      <div className="grid md:grid-cols-4 gap-3 mb-6">
        <Stat label="Planned now" value={planned}/>
        <Stat label="Estimated actual" value={actual}/>
        <Stat label="Adherence" value={planned ? `${Math.round((actual / planned) * 100)}%` : "—"}/>
        <Stat label="Open RTA notes" value={state.rtaLogs.length}/>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Activity className="h-4 w-4"/>Log an event</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Select value={type} onValueChange={(v) => setType(v as RTALog["type"])}>
              <SelectTrigger><SelectValue/></SelectTrigger>
              <SelectContent>
                {(["absence","late","spike","outage","overtime","reassignment","note"] as const).map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input placeholder="Describe the event…" value={msg} onChange={(e) => setMsg(e.target.value)} onKeyDown={(e) => e.key === "Enter" && log()}/>
            <Button onClick={log} className="w-full">Add log</Button>
            <div className="space-y-1 mt-2 max-h-64 overflow-y-auto">
              {state.rtaLogs.map((l) => (
                <div key={l.id} className="text-sm border-b py-1">
                  <Badge variant="outline" className="mr-2">{l.type}</Badge>
                  <span>{l.message}</span>
                  <span className="text-xs text-muted-foreground ml-2">{new Date(l.timestamp).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Recommended levers (in order)</CardTitle></CardHeader>
          <CardContent>
            <ol className="list-decimal pl-5 space-y-1.5 text-sm">
              {levers.map((l) => <li key={l}>{l}</li>)}
            </ol>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
function Stat({ label, value }: { label: string; value: string | number }) {
  return <Card><CardContent className="py-4"><div className="text-xs text-muted-foreground uppercase">{label}</div><div className="text-2xl font-semibold mt-1">{value}</div></CardContent></Card>;
}
