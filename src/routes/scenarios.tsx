import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { useWFM } from "@/wfm/store";
import { computeRequirements, aggregateRequiredFTE } from "@/wfm/calc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMemo } from "react";

export const Route = createFileRoute("/scenarios")({ component: ScenariosPage });

function ScenariosPage() {
  const state = useWFM();
  const rows = useMemo(() => state.scenarios.map((s) => {
    const reqs = computeRequirements(state, s);
    const fte = aggregateRequiredFTE(reqs, state.shrinkage, s);
    const peak = Math.max(0, ...reqs.map((r) => r.requiredAgents));
    const totalVolume = reqs.reduce((a, b) => a + b.volume, 0);
    const cost = state.agents.reduce((a, b) => a + (b.costPerHour ?? 0) * b.weeklyHours, 0);
    return { s, peak, fte, totalVolume: Math.round(totalVolume), cost };
  }), [state]);

  return (
    <AppShell>
      <PageHeader title="Scenario comparison" description="Compare staffing impact across base, surge, hiring delay and other cases."/>
      <Card>
        <CardHeader><CardTitle className="text-base">Comparison</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr>
                <th className="text-left p-1">Scenario</th><th>Volume ×</th><th>Shrinkage Δ</th><th>AHT Δ (s)</th>
                <th>Total volume</th><th>Peak agents</th><th>Productive FTE</th><th>Gross FTE</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ s, peak, fte, totalVolume }) => (
                <tr key={s.id} className="border-t">
                  <td className="p-1 font-medium">{s.name}</td>
                  <td className="text-center">{s.volumeMultiplier}×</td>
                  <td className="text-center">{s.shrinkageDelta}%</td>
                  <td className="text-center">{s.ahtDelta}</td>
                  <td className="text-center">{totalVolume.toLocaleString()}</td>
                  <td className="text-center">{peak}</td>
                  <td className="text-center">{fte.productiveFTE}</td>
                  <td className="text-center font-semibold">{fte.grossFTE}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </AppShell>
  );
}
