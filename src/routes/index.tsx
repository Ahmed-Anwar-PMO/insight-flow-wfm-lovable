import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { useWFM } from "@/wfm/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { validateState, computeRequirements, aggregateRequiredFTE } from "@/wfm/calc";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/")({ component: Index });

function Index() {
  const state = useWFM();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const navigate = useNavigate();

  if (!hydrated) return <AppShell><div /></AppShell>;

  if (!state.wizardComplete && state.queues.length === 0) {
    return (
      <AppShell>
        <PageHeader
          title="Welcome to Support WFM Planner"
          description="A structured workforce management tool for global customer support. Start by capturing operational inputs through the setup wizard — outputs are generated only after validation."
        />
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="border-primary/30">
            <CardHeader><CardTitle>Start the setup wizard</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>The wizard collects 10 sections of inputs: business setup, queues, demand, SLA, AHT, shrinkage, staffing, shifts, rotations and scenarios.</p>
              <Button onClick={() => navigate({ to: "/wizard" })}>Begin setup</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Or load a demo dataset</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>Pre-populates 3 regions, 4 channels, 6 queues, 30 agents, weekly forecast and shrinkage. Clearly labeled as demo.</p>
              <Button variant="outline" onClick={() => state.loadDemo()}>Load demo data</Button>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }

  const v = validateState(state);
  const reqs = computeRequirements(state);
  const fte = aggregateRequiredFTE(reqs, state.shrinkage);

  return (
    <AppShell>
      <PageHeader
        title="Operational overview"
        description={state.business.companyName ? `Plan for ${state.business.companyName}` : "Plan summary"}
        actions={<Link to="/wizard"><Button variant="outline" size="sm">Edit inputs</Button></Link>}
      />
      <div className="grid md:grid-cols-4 gap-3 mb-6">
        <Stat label="Queues" value={state.queues.length} />
        <Stat label="Agents on roll" value={state.agents.length} />
        <Stat label="Required productive FTE" value={fte.productiveFTE} />
        <Stat label="Required gross FTE" value={fte.grossFTE} accent />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Validation status</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-1">
            {v.errors.length === 0 && v.warnings.length === 0 && <div className="text-success">All inputs valid.</div>}
            {v.errors.map((e, i) => <div key={i} className="text-destructive">• {e}</div>)}
            {v.warnings.map((w, i) => <div key={i} className="text-warning">⚠ {w}</div>)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Coverage model</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-2">
            <div><Badge variant="outline">{state.business.coverageModel}</Badge> · {state.business.regions.length} region(s)</div>
            <div className="text-muted-foreground">Languages: {state.business.languages.join(", ") || "—"}</div>
            <div className="text-muted-foreground">Operating model: {state.business.operatingModel}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-3 mt-6">
        {[
          ["/forecast","Forecast","Volume & workload by interval"],
          ["/staffing","Staffing model","Required vs available agents"],
          ["/roster","Roster","Generate daily/weekly schedules"],
          ["/gaps","Coverage gaps","Intervals at SLA risk"],
          ["/backlog","Backlog recovery","Burn-down planning"],
          ["/scenarios","Scenarios","Compare staffing cases"],
        ].map(([to, t, d]) => (
          <Link key={to} to={to} className="block">
            <Card className="hover:border-primary/50 transition-colors h-full">
              <CardContent className="py-4">
                <div className="font-medium">{t}</div>
                <div className="text-xs text-muted-foreground mt-1">{d}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}

function Stat({ label, value, accent }: { label: string; value: number | string; accent?: boolean }) {
  return (
    <Card className={accent ? "border-primary/40 bg-primary/5" : ""}>
      <CardContent className="py-4">
        <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
        <div className="text-2xl font-semibold mt-1">{value}</div>
      </CardContent>
    </Card>
  );
}
