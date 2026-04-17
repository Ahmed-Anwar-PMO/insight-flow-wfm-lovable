import { v4 as uuid } from "uuid";
import type { WFMState, Region, Queue, Agent, Channel, Tier, DemandInterval, SLA, Productivity, ShiftRule, BacklogSnapshot } from "./types";

export function buildDemoState(): Partial<WFMState> {
  const regions: Region[] = [
    { id: "r-emea", name: "EMEA", timezone: "Europe/London", holidays: ["2025-12-25"] },
    { id: "r-amer", name: "Americas", timezone: "America/New_York", holidays: ["2025-11-27"] },
    { id: "r-apac", name: "APAC", timezone: "Asia/Singapore", holidays: ["2025-08-09"] },
  ];

  const channels: Channel[] = ["email", "chat", "voice", "social"];
  const tiers: Tier[] = ["L1", "L1", "L2", "L2", "billing", "VIP"];
  const langs = ["English", "Spanish", "Arabic"];

  const queues: Queue[] = Array.from({ length: 6 }).map((_, i) => ({
    id: `q-${i + 1}`,
    name: `${channels[i % channels.length].toUpperCase()} ${tiers[i]}`,
    channel: channels[i % channels.length],
    regionId: regions[i % regions.length].id,
    language: langs[i % langs.length],
    tier: tiers[i],
    priority: ((i % 5) + 1) as 1 | 2 | 3 | 4 | 5,
    skill: tiers[i],
    type: channels[i % channels.length] === "voice" || channels[i % channels.length] === "chat" ? "real_time" : "async",
  }));

  const slas: SLA[] = queues.map((q) => ({
    id: uuid(),
    queueId: q.id,
    name: `${q.name} SLA`,
    targetSeconds: q.type === "real_time" ? 30 : 4 * 3600,
    targetPct: 80,
    measurementWindowHours: q.type === "real_time" ? 1 : 24,
    businessHoursOnly: false,
  }));

  const productivity: Productivity[] = queues.map((q) => ({
    queueId: q.id,
    ahtSeconds: q.channel === "voice" ? 360 : q.channel === "chat" ? 480 : 600,
    acwSeconds: 60,
    reopenRatePct: 8,
    transferRatePct: 6,
    fcrTargetPct: 75,
    chatConcurrency: q.channel === "chat" ? 3 : 1,
    occupancyTargetPct: 80,
    qualityMinutesPerDay: 15,
    coachingMinutesPerDay: 10,
    adminMinutesPerDay: 20,
  }));

  // Demand: 7 days x 24 hours x 6 queues
  const today = new Date();
  const demand: DemandInterval[] = [];
  for (let d = 0; d < 7; d++) {
    const date = new Date(today);
    date.setDate(today.getDate() + d);
    const iso = date.toISOString().slice(0, 10);
    for (const q of queues) {
      for (let h = 0; h < 24; h++) {
        // bell curve peak ~ 14:00
        const peak = Math.exp(-Math.pow((h - 14) / 4, 2));
        const base = q.channel === "voice" ? 30 : q.channel === "chat" ? 25 : 18;
        demand.push({
          id: uuid(),
          queueId: q.id,
          date: iso,
          intervalStart: `${String(h).padStart(2, "0")}:00`,
          intervalMinutes: 60,
          forecastVolume: Math.round(base * peak * (1 + Math.random() * 0.2)),
          historicalVolume: Math.round(base * peak * (1 + Math.random() * 0.2)),
        });
      }
    }
  }

  const backlogs: BacklogSnapshot[] = queues
    .filter((q) => q.type === "async")
    .map((q) => ({
      queueId: q.id,
      date: today.toISOString().slice(0, 10),
      bucket_0_24: 80 + Math.floor(Math.random() * 40),
      bucket_24_48: 40 + Math.floor(Math.random() * 30),
      bucket_48_72: 20 + Math.floor(Math.random() * 20),
      bucket_72_plus: 10 + Math.floor(Math.random() * 15),
    }));

  const agents: Agent[] = Array.from({ length: 30 }).map((_, i) => {
    const region = regions[i % 3];
    return {
      id: `a-${i + 1}`,
      name: `Agent ${String.fromCharCode(65 + (i % 26))}${i + 1}`,
      employmentType: i < 20 ? "full_time" : i < 26 ? "part_time" : "bpo",
      regionId: region.id,
      timezone: region.timezone,
      languages: [langs[i % 3], ...(i % 4 === 0 ? ["English"] : [])].filter((v, idx, arr) => arr.indexOf(v) === idx),
      skills: [tiers[i % tiers.length]],
      tiers: [tiers[i % tiers.length]],
      channels: [channels[i % channels.length], channels[(i + 1) % channels.length]],
      weeklyHours: i < 20 ? 40 : 20,
      maxDailyHours: 9,
      minDailyHours: 4,
      maxConsecutiveDays: 5,
      requiredDaysOff: 2,
      availabilityWindows: [],
      leaveDates: [],
      overtimeEligible: i % 3 === 0,
      costPerHour: 18 + (i % 10),
      teamLead: i < 6 ? undefined : `Agent A${(i % 6) + 1}`,
    };
  });

  const shiftRules: ShiftRule[] = [
    { id: "s-8", name: "Standard 8h", length: 8, startWindow: { earliest: "06:00", latest: "14:00" }, paidBreakMinutes: 15, unpaidBreakMinutes: 30, lunchMinutes: 30, minRestHours: 11, maxWeeklyHours: 45, maxOvertimeHours: 10, weekendRotation: true, nightShift: false },
    { id: "s-night", name: "Night 8h", length: 8, startWindow: { earliest: "22:00", latest: "00:00" }, paidBreakMinutes: 30, unpaidBreakMinutes: 30, lunchMinutes: 30, minRestHours: 12, maxWeeklyHours: 40, maxOvertimeHours: 8, weekendRotation: true, nightShift: true },
    { id: "s-4", name: "Part-time 4h", length: 4, startWindow: { earliest: "08:00", latest: "16:00" }, paidBreakMinutes: 10, unpaidBreakMinutes: 0, lunchMinutes: 0, minRestHours: 10, maxWeeklyHours: 25, maxOvertimeHours: 5, weekendRotation: false, nightShift: false },
  ];

  return {
    business: {
      companyName: "Acme Support (Demo)",
      horizon: "weekly",
      operatingModel: "hybrid",
      regions,
      coverageModel: "24x7",
      weekendPolicy: "Reduced staffing on weekends; full SLA for VIP.",
      afterHoursPolicy: "Voice closes 22:00 local; async coverage 24/7.",
      languages: langs,
    },
    queues,
    slas,
    productivity,
    demand,
    backlogs,
    agents,
    shiftRules,
    shrinkage: { ptoPct: 8, sickPct: 3, trainingPct: 4, meetingsPct: 3, coachingPct: 2, qaPct: 2, systemPct: 1, breaksPct: 8, absencePct: 2, attritionPct: 1, otherPct: 1 },
    rotation: { id: "rot-default", pattern: "rotating_weekly", minSeniorPerShift: 1, minLanguageCoverage: { English: 2, Spanish: 1, Arabic: 1 }, escalationCoverage: 1, teamLeadCoverage: 1, blackoutDates: [], holidayPolicy: "Volunteer first, then rotate by seniority." },
    scenarios: [
      { id: "base", name: "Base case", type: "base", volumeMultiplier: 1, shrinkageDelta: 0, ahtDelta: 0 },
      { id: "high", name: "High volume (+20%)", type: "high_volume", volumeMultiplier: 1.2, shrinkageDelta: 0, ahtDelta: 0 },
      { id: "outage", name: "Outage spike (+60%)", type: "outage", volumeMultiplier: 1.6, shrinkageDelta: 2, ahtDelta: 60 },
      { id: "lean", name: "Reduced shrinkage", type: "reduced_shrinkage", volumeMultiplier: 1, shrinkageDelta: -5, ahtDelta: 0 },
    ],
    wizardComplete: true,
    wizardStep: 9,
  };
}
