export type Channel = "email" | "chat" | "voice" | "social" | "whatsapp" | "app_reviews" | "back_office" | "callbacks";
export type CoverageModel = "business_hours" | "24x5" | "24x7" | "follow_the_sun";
export type OperatingModel = "in_house" | "bpo" | "hybrid";
export type Horizon = "weekly" | "monthly" | "quarterly";
export type EmploymentType = "full_time" | "part_time" | "contractor" | "bpo";
export type QueueType = "async" | "real_time";
export type Tier = "L1" | "L2" | "escalations" | "VIP" | "technical" | "returns" | "billing" | "fraud" | "other";
export type ShiftLength = 4 | 6 | 8 | 9 | 10 | 12;
export type RotationPattern = "fixed" | "rotating_weekly" | "rotating_monthly" | "follow_the_sun" | "weekend" | "night";

export interface Region {
  id: string;
  name: string;
  timezone: string;
  holidays: string[]; // ISO dates
}

export interface BusinessSetup {
  companyName: string;
  horizon: Horizon;
  operatingModel: OperatingModel;
  regions: Region[];
  coverageModel: CoverageModel;
  weekendPolicy: string;
  afterHoursPolicy: string;
  languages: string[];
}

export interface Queue {
  id: string;
  name: string;
  channel: Channel;
  regionId: string;
  language: string;
  tier: Tier;
  priority: 1 | 2 | 3 | 4 | 5;
  skill: string;
  type: QueueType;
}

export interface DemandInterval {
  id: string;
  queueId: string;
  date: string; // YYYY-MM-DD
  intervalStart: string; // HH:MM
  intervalMinutes: 15 | 30 | 60;
  forecastVolume: number;
  historicalVolume?: number;
  backlog?: number;
  oldestBacklogHours?: number;
  event?: string;
}

export interface BacklogSnapshot {
  queueId: string;
  date: string;
  bucket_0_24: number;
  bucket_24_48: number;
  bucket_48_72: number;
  bucket_72_plus: number;
}

export interface SLA {
  id: string;
  queueId: string;
  name: string;
  targetSeconds: number;
  targetPct: number; // e.g. 80 for 80%
  measurementWindowHours: number;
  businessHoursOnly: boolean;
}

export interface Productivity {
  queueId: string;
  ahtSeconds: number;
  acwSeconds: number;
  reopenRatePct: number;
  transferRatePct: number;
  fcrTargetPct: number;
  chatConcurrency: number;
  occupancyTargetPct: number;
  qualityMinutesPerDay: number;
  coachingMinutesPerDay: number;
  adminMinutesPerDay: number;
}

export interface Shrinkage {
  ptoPct: number;
  sickPct: number;
  trainingPct: number;
  meetingsPct: number;
  coachingPct: number;
  qaPct: number;
  systemPct: number;
  breaksPct: number;
  absencePct: number;
  attritionPct: number;
  otherPct: number;
}

export interface Agent {
  id: string;
  name: string; // can be anonymous "Agent A1"
  employmentType: EmploymentType;
  regionId: string;
  timezone: string;
  languages: string[];
  skills: string[];
  tiers: Tier[];
  channels: Channel[];
  weeklyHours: number;
  maxDailyHours: number;
  minDailyHours: number;
  maxConsecutiveDays: number;
  requiredDaysOff: number;
  availabilityWindows: { day: number; start: string; end: string }[]; // 0=Sun
  preferredShift?: string;
  leaveDates: string[];
  overtimeEligible: boolean;
  costPerHour?: number;
  teamLead?: string;
}

export interface ShiftRule {
  id: string;
  name: string;
  length: ShiftLength;
  startWindow: { earliest: string; latest: string };
  paidBreakMinutes: number;
  unpaidBreakMinutes: number;
  lunchMinutes: number;
  minRestHours: number;
  maxWeeklyHours: number;
  maxOvertimeHours: number;
  weekendRotation: boolean;
  nightShift: boolean;
}

export interface RotationPlan {
  id: string;
  pattern: RotationPattern;
  minSeniorPerShift: number;
  minLanguageCoverage: Record<string, number>;
  escalationCoverage: number;
  teamLeadCoverage: number;
  blackoutDates: string[];
  holidayPolicy: string;
}

export interface Scenario {
  id: string;
  name: string;
  type: "base" | "high_volume" | "low_volume" | "outage" | "hiring_delay" | "bpo_surge" | "overtime" | "reduced_shrinkage" | "new_channel";
  volumeMultiplier: number;
  shrinkageDelta: number;
  ahtDelta: number;
  notes?: string;
}

export interface RosterEntry {
  id: string;
  agentId: string;
  date: string;
  startTime: string;
  endTime: string;
  breaks: { start: string; end: string; type: "break" | "lunch" }[];
  queueId?: string;
  channel?: Channel;
  language?: string;
  shiftType: string;
  notes?: string;
  locked?: boolean;
}

export interface RTALog {
  id: string;
  timestamp: string;
  queueId?: string;
  agentId?: string;
  type: "absence" | "late" | "spike" | "outage" | "overtime" | "reassignment" | "note";
  message: string;
}

export interface WFMState {
  business: BusinessSetup;
  queues: Queue[];
  demand: DemandInterval[];
  backlogs: BacklogSnapshot[];
  slas: SLA[];
  productivity: Productivity[];
  shrinkage: Shrinkage;
  agents: Agent[];
  shiftRules: ShiftRule[];
  rotation: RotationPlan;
  scenarios: Scenario[];
  rosters: RosterEntry[];
  rtaLogs: RTALog[];
  wizardComplete: boolean;
  wizardStep: number;
}
