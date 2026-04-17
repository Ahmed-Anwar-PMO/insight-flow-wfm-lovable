import { v4 as uuid } from "uuid";
import type { WFMState, RosterEntry, Agent } from "./types";
import { computeRequirements } from "./calc";

// Simple roster generator: assigns agents to shifts respecting skills, weekly hours, and rest.
export function generateRosters(state: WFMState, days = 7): RosterEntry[] {
  if (state.shiftRules.length === 0 || state.agents.length === 0) return [];
  const reqs = computeRequirements(state);
  const today = new Date();
  const dates = Array.from({ length: days }).map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d.toISOString().slice(0, 10);
  });

  // Hours required per (date, queue) -> approx required agents per shift
  const need = new Map<string, Map<string, number>>(); // date -> queueId -> agent-hours
  for (const r of reqs) {
    if (!dates.includes(r.date)) continue;
    if (!need.has(r.date)) need.set(r.date, new Map());
    const m = need.get(r.date)!;
    m.set(r.queueId, (m.get(r.queueId) ?? 0) + r.requiredAgents);
  }

  // Preserve locked entries
  const locked = state.rosters.filter((r) => r.locked);
  const result: RosterEntry[] = [...locked];

  const agentWeekHours = new Map<string, number>();
  state.agents.forEach((a) => agentWeekHours.set(a.id, 0));
  // Pre-count locked
  for (const l of locked) {
    const start = toMin(l.startTime);
    const end = toMin(l.endTime);
    agentWeekHours.set(l.agentId, (agentWeekHours.get(l.agentId) ?? 0) + (end - start) / 60);
  }

  const agentLastWorked = new Map<string, string>();
  const agentConsecDays = new Map<string, number>();

  for (const date of dates) {
    const dayOfWeek = new Date(date).getDay();
    const queueNeeds = need.get(date) ?? new Map<string, number>();
    const agentsForDay = new Set<string>();

    for (const [queueId, requiredHours] of queueNeeds) {
      const queue = state.queues.find((q) => q.id === queueId);
      if (!queue) continue;
      let assignedHours = 0;
      // Find candidate agents matching channel/skill/language
      const candidates = state.agents
        .filter((a) => !a.leaveDates.includes(date))
        .filter((a) => a.channels.includes(queue.channel))
        .filter((a) => a.languages.includes(queue.language) || a.languages.includes("English"))
        .filter((a) => (agentWeekHours.get(a.id) ?? 0) < a.weeklyHours)
        .filter((a) => !agentsForDay.has(a.id))
        .filter((a) => (agentConsecDays.get(a.id) ?? 0) < a.maxConsecutiveDays)
        .sort((a, b) => (agentWeekHours.get(a.id) ?? 0) - (agentWeekHours.get(b.id) ?? 0));

      for (const agent of candidates) {
        if (assignedHours >= requiredHours) break;
        const shift = pickShift(state, agent, dayOfWeek);
        if (!shift) continue;
        const remainWeek = agent.weeklyHours - (agentWeekHours.get(agent.id) ?? 0);
        const hours = Math.min(shift.length, remainWeek, agent.maxDailyHours);
        if (hours < agent.minDailyHours) continue;
        const startHour = computeStartHour(shift.startWindow.earliest, queueNeeds.size);
        const startTime = `${String(startHour).padStart(2, "0")}:00`;
        const endTime = `${String((startHour + hours) % 24).padStart(2, "0")}:00`;
        const breaks = buildBreaks(startHour, hours, shift.lunchMinutes, shift.paidBreakMinutes);
        result.push({
          id: uuid(),
          agentId: agent.id,
          date,
          startTime,
          endTime,
          breaks,
          queueId,
          channel: queue.channel,
          language: queue.language,
          shiftType: shift.name,
        });
        agentsForDay.add(agent.id);
        agentWeekHours.set(agent.id, (agentWeekHours.get(agent.id) ?? 0) + hours);
        const last = agentLastWorked.get(agent.id);
        if (last) {
          const diff = (new Date(date).getTime() - new Date(last).getTime()) / 86400000;
          agentConsecDays.set(agent.id, diff === 1 ? (agentConsecDays.get(agent.id) ?? 0) + 1 : 1);
        } else agentConsecDays.set(agent.id, 1);
        agentLastWorked.set(agent.id, date);
        assignedHours += hours;
      }
    }
  }
  return result;
}

function pickShift(state: WFMState, agent: Agent, dayOfWeek: number) {
  // Favor shorter shifts for part-time agents
  const sorted = [...state.shiftRules].sort((a, b) =>
    agent.weeklyHours < 30 ? a.length - b.length : b.length - a.length
  );
  return sorted.find((s) => (dayOfWeek === 0 || dayOfWeek === 6 ? s.weekendRotation : true)) ?? sorted[0];
}

function computeStartHour(earliest: string, spread: number): number {
  const base = parseInt(earliest.split(":")[0], 10);
  return (base + Math.floor(Math.random() * Math.max(1, spread))) % 24;
}

function buildBreaks(startHour: number, hours: number, lunch: number, brk: number) {
  const breaks: { start: string; end: string; type: "break" | "lunch" }[] = [];
  if (lunch > 0 && hours >= 6) {
    const lunchStart = startHour + Math.floor(hours / 2);
    breaks.push({
      start: `${String(lunchStart % 24).padStart(2, "0")}:00`,
      end: `${String(lunchStart % 24).padStart(2, "0")}:${String(lunch).padStart(2, "0")}`,
      type: "lunch",
    });
  }
  if (brk > 0 && hours >= 4) {
    const bStart = startHour + 2;
    breaks.push({
      start: `${String(bStart % 24).padStart(2, "0")}:00`,
      end: `${String(bStart % 24).padStart(2, "0")}:${String(brk).padStart(2, "0")}`,
      type: "break",
    });
  }
  return breaks;
}

function toMin(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export interface CoverageGap {
  date: string;
  intervalStart: string;
  queueId: string;
  required: number;
  scheduled: number;
  gap: number;
  status: "covered" | "risk" | "gap";
}

export function computeCoverageGaps(state: WFMState): CoverageGap[] {
  const reqs = computeRequirements(state);
  const out: CoverageGap[] = [];
  for (const r of reqs) {
    const scheduled = state.rosters.filter((entry) => {
      if (entry.date !== r.date || entry.queueId !== r.queueId) return false;
      const startH = parseInt(entry.startTime.split(":")[0], 10);
      const endH = parseInt(entry.endTime.split(":")[0], 10);
      const intH = parseInt(r.intervalStart.split(":")[0], 10);
      const within = endH > startH ? intH >= startH && intH < endH : intH >= startH || intH < endH;
      return within;
    }).length;
    const gap = r.requiredAgents - scheduled;
    out.push({
      date: r.date,
      intervalStart: r.intervalStart,
      queueId: r.queueId,
      required: r.requiredAgents,
      scheduled,
      gap,
      status: gap <= 0 ? "covered" : gap <= Math.ceil(r.requiredAgents * 0.2) ? "risk" : "gap",
    });
  }
  return out;
}

export function generateRotation(state: WFMState) {
  // Fairness: assign weekend/night/holiday rotations evenly across eligible agents
  const eligible = state.agents.filter((a) => a.employmentType !== "bpo");
  const weekends = ["Sat", "Sun"];
  const out: { agentId: string; agentName: string; weekend: string; night: string; holiday: string }[] = [];
  eligible.forEach((a, i) => {
    out.push({
      agentId: a.id,
      agentName: a.name,
      weekend: weekends[i % 2],
      night: i % 4 === 0 ? "Yes" : "No",
      holiday: i % (eligible.length / 2 || 1) === 0 ? "Primary" : "Reserve",
    });
  });
  return out;
}
