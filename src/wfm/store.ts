import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { WFMState, Shrinkage, RotationPlan, BusinessSetup } from "./types";

const emptyShrinkage: Shrinkage = {
  ptoPct: 0, sickPct: 0, trainingPct: 0, meetingsPct: 0, coachingPct: 0,
  qaPct: 0, systemPct: 0, breaksPct: 0, absencePct: 0, attritionPct: 0, otherPct: 0,
};

const emptyBusiness: BusinessSetup = {
  companyName: "",
  horizon: "weekly",
  operatingModel: "in_house",
  regions: [],
  coverageModel: "business_hours",
  weekendPolicy: "",
  afterHoursPolicy: "",
  languages: [],
};

const emptyRotation: RotationPlan = {
  id: "rot-default",
  pattern: "fixed",
  minSeniorPerShift: 0,
  minLanguageCoverage: {},
  escalationCoverage: 0,
  teamLeadCoverage: 0,
  blackoutDates: [],
  holidayPolicy: "",
};

const initialState: WFMState = {
  business: emptyBusiness,
  queues: [],
  demand: [],
  backlogs: [],
  slas: [],
  productivity: [],
  shrinkage: emptyShrinkage,
  agents: [],
  shiftRules: [],
  rotation: emptyRotation,
  scenarios: [{ id: "base", name: "Base case", type: "base", volumeMultiplier: 1, shrinkageDelta: 0, ahtDelta: 0 }],
  rosters: [],
  rtaLogs: [],
  wizardComplete: false,
  wizardStep: 0,
};

interface Actions {
  set: <K extends keyof WFMState>(key: K, value: WFMState[K]) => void;
  patch: (partial: Partial<WFMState>) => void;
  reset: () => void;
  loadDemo: () => void;
}

export const useWFM = create<WFMState & Actions>()(
  persist(
    (set) => ({
      ...initialState,
      set: (key, value) => set({ [key]: value } as Partial<WFMState>),
      patch: (partial) => set(partial),
      reset: () => set(initialState),
      loadDemo: () => {
        import("./demo").then(({ buildDemoState }) => {
          set(buildDemoState());
        });
      },
    }),
    { name: "support-wfm-state-v1" }
  )
);
