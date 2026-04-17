import type { WFMState, Shrinkage, Queue, DemandInterval, Productivity, Scenario } from "./types";

export function totalShrinkagePct(s: Shrinkage): number {
  return Object.values(s).reduce((a, b) => a + (b || 0), 0);
}

export function productiveTimePct(s: Shrinkage): number {
  return Math.max(0, 100 - totalShrinkagePct(s));
}

// Erlang C: probability a call must wait. lambda=arrivals/sec, mu=1/AHT, agents N
function erlangC(N: number, traffic: number): number {
  if (N <= traffic) return 1;
  let sum = 0;
  let term = 1;
  for (let k = 0; k < N; k++) {
    if (k > 0) term = (term * traffic) / k;
    sum += term;
  }
  const last = (term * traffic) / N;
  const denom = sum + last * (N / (N - traffic));
  return (last * (N / (N - traffic))) / denom;
}

export function erlangCAgents(callsPerInterval: number, ahtSeconds: number, intervalSeconds: number, slaTargetSec: number, slaPct: number): number {
  if (callsPerInterval <= 0) return 0;
  const lambda = callsPerInterval / intervalSeconds;
  const traffic = lambda * ahtSeconds; // erlangs
  let N = Math.max(1, Math.ceil(traffic + 1));
  for (let i = 0; i < 200; i++) {
    const pw = erlangC(N, traffic);
    const sl = 1 - pw * Math.exp((-(N - traffic) * slaTargetSec) / ahtSeconds);
    if (sl >= slaPct / 100) return N;
    N++;
  }
  return N;
}

export interface IntervalRequirement {
  date: string;
  intervalStart: string;
  queueId: string;
  channel: string;
  volume: number;
  workloadMinutes: number;
  requiredAgents: number;
  occupancyEstimate: number;
}

export function computeRequirements(state: WFMState, scenario?: Scenario): IntervalRequirement[] {
  const sc = scenario ?? state.scenarios[0] ?? { volumeMultiplier: 1, ahtDelta: 0, shrinkageDelta: 0 } as Scenario;
  const prodMap = new Map<string, Productivity>(state.productivity.map((p) => [p.queueId, p]));
  const queueMap = new Map<string, Queue>(state.queues.map((q) => [q.id, q]));
  const slaMap = new Map<string, { sec: number; pct: number }>(
    state.slas.map((s) => [s.queueId, { sec: s.targetSeconds, pct: s.targetPct }])
  );

  return state.demand.map((d: DemandInterval) => {
    const q = queueMap.get(d.queueId);
    const p = prodMap.get(d.queueId);
    const aht = (p?.ahtSeconds ?? 600) + sc.ahtDelta;
    const concurrency = p?.chatConcurrency ?? 1;
    const volume = d.forecastVolume * sc.volumeMultiplier;
    const intervalSec = d.intervalMinutes * 60;
    const workloadMin = (volume * aht) / 60;
    let required = 0;
    if (q?.type === "real_time" && q.channel === "voice") {
      const sla = slaMap.get(q.id) ?? { sec: 30, pct: 80 };
      required = erlangCAgents(volume, aht, intervalSec, sla.sec, sla.pct);
    } else if (q?.channel === "chat") {
      const sla = slaMap.get(q.id) ?? { sec: 60, pct: 80 };
      const effAht = aht / Math.max(1, concurrency);
      required = erlangCAgents(volume, effAht, intervalSec, sla.sec, sla.pct);
    } else {
      // async occupancy-based
      const occ = (p?.occupancyTargetPct ?? 80) / 100;
      required = Math.ceil(workloadMin / (d.intervalMinutes * occ));
    }
    const handled = required * d.intervalMinutes * ((p?.occupancyTargetPct ?? 80) / 100);
    const occupancyEstimate = handled > 0 ? Math.min(100, (workloadMin / handled) * (p?.occupancyTargetPct ?? 80)) : 0;
    return {
      date: d.date,
      intervalStart: d.intervalStart,
      queueId: d.queueId,
      channel: q?.channel ?? "email",
      volume,
      workloadMinutes: Math.round(workloadMin),
      requiredAgents: required,
      occupancyEstimate: Math.round(occupancyEstimate),
    };
  });
}

export function applyShrinkage(productiveAgents: number, shrinkage: Shrinkage, delta = 0): number {
  const prodPct = Math.max(10, productiveTimePct(shrinkage) - delta);
  return Math.ceil((productiveAgents * 100) / prodPct);
}

export function aggregateRequiredFTE(reqs: IntervalRequirement[], shrinkage: Shrinkage, scenario?: Scenario): { productiveFTE: number; grossFTE: number } {
  // Approx: average required across intervals × (intervals / shifts-per-FTE)
  // Use peak average per day: sum required-hours / 8h shift / days
  if (reqs.length === 0) return { productiveFTE: 0, grossFTE: 0 };
  const totalAgentHours = reqs.reduce((a, r) => a + r.requiredAgents, 0); // 1 unit per hour-interval
  const days = new Set(reqs.map((r) => r.date)).size || 1;
  const productiveFTE = Math.ceil(totalAgentHours / (8 * days) * 7 / Math.min(7, days)); // weekly equivalent
  const grossFTE = applyShrinkage(productiveFTE, shrinkage, scenario?.shrinkageDelta ?? 0);
  return { productiveFTE, grossFTE };
}

export function backlogRecoveryPlan(state: WFMState) {
  return state.backlogs.map((b) => {
    const q = state.queues.find((x) => x.id === b.queueId);
    const p = state.productivity.find((x) => x.queueId === b.queueId);
    const aht = p?.ahtSeconds ?? 600;
    const total = b.bucket_0_24 + b.bucket_24_48 + b.bucket_48_72 + b.bucket_72_plus;
    const workloadHours = (total * aht) / 3600;
    const targetDays = 5;
    const additionalProductiveHoursPerDay = workloadHours / targetDays;
    const additionalFTE = Math.ceil(additionalProductiveHoursPerDay / 7);
    return {
      queueId: b.queueId,
      queueName: q?.name ?? b.queueId,
      total,
      buckets: { "0-24h": b.bucket_0_24, "24-48h": b.bucket_24_48, "48-72h": b.bucket_48_72, "72h+": b.bucket_72_plus },
      workloadHours: Math.round(workloadHours),
      targetDays,
      additionalProductiveHoursPerDay: Math.round(additionalProductiveHoursPerDay),
      additionalFTE,
      slaRisk: b.bucket_72_plus > 20 ? "high" : b.bucket_48_72 > 30 ? "medium" : "low",
    };
  });
}

export function validateState(state: WFMState): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!state.business.companyName) errors.push("Business: company name is required.");
  if (state.business.regions.length === 0) errors.push("Business: at least one region is required.");
  if (state.queues.length === 0) errors.push("Channels: define at least one queue.");
  for (const q of state.queues) {
    if (!state.slas.some((s) => s.queueId === q.id)) errors.push(`SLA missing for queue "${q.name}".`);
    if (!state.productivity.some((p) => p.queueId === q.id)) errors.push(`AHT/productivity missing for queue "${q.name}".`);
    const hasDemand = state.demand.some((d) => d.queueId === q.id);
    if (!hasDemand) errors.push(`Demand missing for queue "${q.name}".`);
    if (q.type === "async" && !state.backlogs.some((b) => b.queueId === q.id)) {
      warnings.push(`Async queue "${q.name}" has no backlog snapshot.`);
    }
  }
  if (state.agents.length === 0) errors.push("Staffing: add at least one agent.");
  for (const a of state.agents) {
    if (!a.weeklyHours) warnings.push(`Agent ${a.name} has no weekly hours.`);
    if (a.skills.length === 0) warnings.push(`Agent ${a.name} has no skills.`);
  }
  if (state.shiftRules.length === 0) errors.push("Shift rules: define at least one shift template.");
  if (totalShrinkagePct(state.shrinkage) === 0) warnings.push("Shrinkage is 0% — using productive time of 100%.");
  if (totalShrinkagePct(state.shrinkage) >= 80) errors.push("Shrinkage is ≥80% — productive time too low to plan.");
  return { errors, warnings };
}
