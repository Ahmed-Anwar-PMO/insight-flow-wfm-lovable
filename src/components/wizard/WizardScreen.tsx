import { useState } from "react";
import { useWFM } from "@/wfm/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, CheckCircle2 } from "lucide-react";
import { v4 as uuid } from "uuid";
import type { Channel, Tier, EmploymentType, Region, Queue, Agent, ShiftRule } from "@/wfm/types";
import { validateState } from "@/wfm/calc";
import { useNavigate } from "@tanstack/react-router";

const steps = [
  "Business Setup",
  "Channels & Queues",
  "Demand Inputs",
  "SLA & Service Goals",
  "Productivity & Handle Time",
  "Shrinkage",
  "Staffing",
  "Shift Rules",
  "Rotation Preferences",
  "Scenarios & Review",
];

export function WizardScreen() {
  const state = useWFM();
  const navigate = useNavigate();
  const [step, setStep] = useState(state.wizardStep ?? 0);

  const next = () => {
    const n = Math.min(step + 1, steps.length - 1);
    setStep(n);
    state.set("wizardStep", n);
  };
  const prev = () => setStep(Math.max(step - 1, 0));

  const finish = () => {
    state.set("wizardComplete", true);
    navigate({ to: "/" });
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Setup Wizard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Capture your operational inputs. Outputs are generated only after the wizard is complete and validation passes.
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
        <ol className="space-y-1 text-sm">
          {steps.map((s, i) => (
            <li key={s}>
              <button
                onClick={() => setStep(i)}
                className={`w-full text-left px-3 py-2 rounded-md flex items-center gap-2 ${
                  i === step ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
              >
                <span className={`w-5 h-5 rounded-full text-[11px] flex items-center justify-center ${
                  i === step ? "bg-white/20" : "bg-muted-foreground/20"
                }`}>{i + 1}</span>
                <span className="truncate">{s}</span>
              </button>
            </li>
          ))}
        </ol>
        <div>
          {step === 0 && <Step0 />}
          {step === 1 && <Step1 />}
          {step === 2 && <Step2 />}
          {step === 3 && <Step3 />}
          {step === 4 && <Step4 />}
          {step === 5 && <Step5 />}
          {step === 6 && <Step6 />}
          {step === 7 && <Step7 />}
          {step === 8 && <Step8 />}
          {step === 9 && <Step9 onFinish={finish} />}
          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={prev} disabled={step === 0}>Back</Button>
            {step < steps.length - 1 ? (
              <Button onClick={next}>Continue</Button>
            ) : (
              <Button onClick={finish}>Finish & view outputs</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

// ---------- Step 0: Business Setup ----------
function Step0() {
  const { business, set } = useWFM();
  const update = <K extends keyof typeof business>(k: K, v: typeof business[K]) =>
    set("business", { ...business, [k]: v });
  const addRegion = () => {
    const r: Region = { id: uuid(), name: "", timezone: "UTC", holidays: [] };
    update("regions", [...business.regions, r]);
  };
  return (
    <Section title="Business setup" description="Define the operating context for this workforce plan.">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label>Company / team name</Label>
          <Input value={business.companyName} onChange={(e) => update("companyName", e.target.value)} placeholder="Acme Support" />
        </div>
        <div>
          <Label>Planning horizon</Label>
          <Select value={business.horizon} onValueChange={(v) => update("horizon", v as typeof business.horizon)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Operating model</Label>
          <Select value={business.operatingModel} onValueChange={(v) => update("operatingModel", v as typeof business.operatingModel)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="in_house">In-house</SelectItem>
              <SelectItem value="bpo">BPO</SelectItem>
              <SelectItem value="hybrid">Hybrid</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Coverage model</Label>
          <Select value={business.coverageModel} onValueChange={(v) => update("coverageModel", v as typeof business.coverageModel)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="business_hours">Business hours</SelectItem>
              <SelectItem value="24x5">24/5</SelectItem>
              <SelectItem value="24x7">24/7</SelectItem>
              <SelectItem value="follow_the_sun">Follow-the-sun</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2">
          <Label>Languages supported (comma-separated)</Label>
          <Input
            value={business.languages.join(", ")}
            onChange={(e) => update("languages", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
            placeholder="English, Spanish, Arabic"
          />
        </div>
        <div>
          <Label>Weekend policy</Label>
          <Textarea value={business.weekendPolicy} onChange={(e) => update("weekendPolicy", e.target.value)} />
        </div>
        <div>
          <Label>After-hours policy</Label>
          <Textarea value={business.afterHoursPolicy} onChange={(e) => update("afterHoursPolicy", e.target.value)} />
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Regions & time zones</Label>
          <Button size="sm" variant="outline" onClick={addRegion}><Plus className="h-3 w-3 mr-1"/>Add region</Button>
        </div>
        <div className="space-y-2">
          {business.regions.map((r, idx) => (
            <div key={r.id} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center">
              <Input value={r.name} placeholder="Region name (EMEA)" onChange={(e) => {
                const copy = [...business.regions]; copy[idx] = { ...r, name: e.target.value }; update("regions", copy);
              }} />
              <Input value={r.timezone} placeholder="IANA TZ (Europe/London)" onChange={(e) => {
                const copy = [...business.regions]; copy[idx] = { ...r, timezone: e.target.value }; update("regions", copy);
              }} />
              <Input value={r.holidays.join(", ")} placeholder="Holidays YYYY-MM-DD,..." onChange={(e) => {
                const copy = [...business.regions];
                copy[idx] = { ...r, holidays: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) };
                update("regions", copy);
              }} />
              <Button variant="ghost" size="icon" onClick={() => update("regions", business.regions.filter((x) => x.id !== r.id))}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {business.regions.length === 0 && <p className="text-sm text-muted-foreground">No regions yet. Add at least one.</p>}
        </div>
      </div>
    </Section>
  );
}

// ---------- Step 1: Queues ----------
function Step1() {
  const { queues, business, set } = useWFM();
  const channels: Channel[] = ["email", "chat", "voice", "social", "whatsapp", "app_reviews", "back_office", "callbacks"];
  const tiers: Tier[] = ["L1", "L2", "escalations", "VIP", "technical", "returns", "billing", "fraud", "other"];
  const add = () => {
    const q: Queue = {
      id: uuid(), name: "New queue", channel: "email",
      regionId: business.regions[0]?.id ?? "", language: business.languages[0] ?? "English",
      tier: "L1", priority: 3, skill: "L1", type: "async",
    };
    set("queues", [...queues, q]);
  };
  const update = (id: string, patch: Partial<Queue>) =>
    set("queues", queues.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  return (
    <Section title="Channels & queues" description="Define every queue you plan staffing for.">
      <div className="flex justify-end">
        <Button size="sm" onClick={add}><Plus className="h-3 w-3 mr-1"/>Add queue</Button>
      </div>
      <div className="space-y-3">
        {queues.map((q) => (
          <div key={q.id} className="grid grid-cols-2 md:grid-cols-7 gap-2 items-end border rounded-md p-3">
            <div className="col-span-2"><Label className="text-xs">Name</Label><Input value={q.name} onChange={(e) => update(q.id, { name: e.target.value })}/></div>
            <div><Label className="text-xs">Channel</Label>
              <Select value={q.channel} onValueChange={(v) => update(q.id, { channel: v as Channel, type: v === "voice" || v === "chat" ? "real_time" : "async" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{channels.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Tier</Label>
              <Select value={q.tier} onValueChange={(v) => update(q.id, { tier: v as Tier, skill: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{tiers.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Region</Label>
              <Select value={q.regionId} onValueChange={(v) => update(q.id, { regionId: v })}>
                <SelectTrigger><SelectValue placeholder="Region"/></SelectTrigger>
                <SelectContent>{business.regions.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Language</Label>
              <Select value={q.language} onValueChange={(v) => update(q.id, { language: v })}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>{business.languages.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex justify-between items-center">
              <Badge variant="outline">{q.type === "real_time" ? "Real-time" : "Async"}</Badge>
              <Button variant="ghost" size="icon" onClick={() => set("queues", queues.filter((x) => x.id !== q.id))}><Trash2 className="h-4 w-4"/></Button>
            </div>
          </div>
        ))}
        {queues.length === 0 && <p className="text-sm text-muted-foreground">No queues yet.</p>}
      </div>
    </Section>
  );
}

// ---------- Step 2: Demand ----------
function Step2() {
  const { demand, queues, set } = useWFM();
  const [csv, setCsv] = useState("");
  const seedSample = () => {
    if (queues.length === 0) return;
    const today = new Date();
    const items = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(today); date.setDate(today.getDate() + d);
      const iso = date.toISOString().slice(0, 10);
      for (const q of queues) {
        for (let h = 8; h < 22; h++) {
          items.push({ id: uuid(), queueId: q.id, date: iso, intervalStart: `${String(h).padStart(2,"0")}:00`, intervalMinutes: 60 as const, forecastVolume: 10 + Math.floor(Math.random() * 20) });
        }
      }
    }
    set("demand", items);
  };
  const importCsv = () => {
    const lines = csv.split("\n").map((l) => l.trim()).filter(Boolean);
    const items = lines.slice(1).map((line) => {
      const [date, intervalStart, queueName, , forecastVolume] = line.split(",");
      const q = queues.find((x) => x.name.toLowerCase() === queueName?.toLowerCase());
      return { id: uuid(), queueId: q?.id ?? "", date, intervalStart, intervalMinutes: 60 as const, forecastVolume: Number(forecastVolume) || 0 };
    }).filter((x) => x.queueId);
    set("demand", [...demand, ...items]);
  };
  return (
    <Section title="Demand inputs" description="Provide forecast volume per queue and interval. CSV template: date,intervalStart,queueName,channel,forecastVolume">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={seedSample}>Seed 7-day sample (8am–10pm)</Button>
        <Button size="sm" variant="outline" onClick={() => set("demand", [])}>Clear</Button>
        <Badge>{demand.length} intervals loaded</Badge>
      </div>
      <div>
        <Label className="text-xs">Paste CSV</Label>
        <Textarea rows={5} value={csv} onChange={(e) => setCsv(e.target.value)} placeholder="date,intervalStart,queueName,channel,forecastVolume" />
        <Button size="sm" variant="secondary" className="mt-2" onClick={importCsv}>Import CSV</Button>
      </div>
      <BacklogEditor />
    </Section>
  );
}

function BacklogEditor() {
  const { queues, backlogs, set } = useWFM();
  const asyncQs = queues.filter((q) => q.type === "async");
  const get = (qid: string) => backlogs.find((b) => b.queueId === qid) ?? { queueId: qid, date: new Date().toISOString().slice(0,10), bucket_0_24: 0, bucket_24_48: 0, bucket_48_72: 0, bucket_72_plus: 0 };
  const upsert = (qid: string, patch: Partial<ReturnType<typeof get>>) => {
    const cur = get(qid);
    const updated = { ...cur, ...patch };
    const others = backlogs.filter((b) => b.queueId !== qid);
    set("backlogs", [...others, updated]);
  };
  if (asyncQs.length === 0) return null;
  return (
    <div>
      <Label>Backlog by age (async queues)</Label>
      <div className="space-y-2 mt-2">
        {asyncQs.map((q) => {
          const b = get(q.id);
          return (
            <div key={q.id} className="grid grid-cols-2 md:grid-cols-5 gap-2 items-end border rounded p-2">
              <div className="text-sm font-medium">{q.name}</div>
              <div><Label className="text-xs">0-24h</Label><Input type="number" value={b.bucket_0_24} onChange={(e) => upsert(q.id, { bucket_0_24: Number(e.target.value) })}/></div>
              <div><Label className="text-xs">24-48h</Label><Input type="number" value={b.bucket_24_48} onChange={(e) => upsert(q.id, { bucket_24_48: Number(e.target.value) })}/></div>
              <div><Label className="text-xs">48-72h</Label><Input type="number" value={b.bucket_48_72} onChange={(e) => upsert(q.id, { bucket_48_72: Number(e.target.value) })}/></div>
              <div><Label className="text-xs">72h+</Label><Input type="number" value={b.bucket_72_plus} onChange={(e) => upsert(q.id, { bucket_72_plus: Number(e.target.value) })}/></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Step 3: SLAs ----------
function Step3() {
  const { queues, slas, set } = useWFM();
  const get = (qid: string) => slas.find((s) => s.queueId === qid);
  const ensure = (qid: string) => {
    if (get(qid)) return;
    set("slas", [...slas, { id: uuid(), queueId: qid, name: "SLA", targetSeconds: 60, targetPct: 80, measurementWindowHours: 24, businessHoursOnly: false }]);
  };
  const update = (qid: string, patch: Partial<NonNullable<ReturnType<typeof get>>>) => {
    ensure(qid);
    set("slas", slas.map((s) => s.queueId === qid ? { ...s, ...patch } : s));
  };
  return (
    <Section title="SLA & service goals" description="Set the response target per queue. Voice/chat use seconds; async use seconds-to-first-response.">
      <div className="space-y-2">
        {queues.map((q) => {
          const s = get(q.id) ?? { name: "", targetSeconds: q.type === "real_time" ? 30 : 14400, targetPct: 80, measurementWindowHours: 24, businessHoursOnly: false };
          return (
            <div key={q.id} className="grid grid-cols-2 md:grid-cols-5 gap-2 items-end border rounded p-3">
              <div className="text-sm font-medium">{q.name}</div>
              <div><Label className="text-xs">Target (sec)</Label><Input type="number" value={s.targetSeconds} onClick={() => ensure(q.id)} onChange={(e) => update(q.id, { targetSeconds: Number(e.target.value) })}/></div>
              <div><Label className="text-xs">Target %</Label><Input type="number" value={s.targetPct} onClick={() => ensure(q.id)} onChange={(e) => update(q.id, { targetPct: Number(e.target.value) })}/></div>
              <div><Label className="text-xs">Window (hrs)</Label><Input type="number" value={s.measurementWindowHours} onClick={() => ensure(q.id)} onChange={(e) => update(q.id, { measurementWindowHours: Number(e.target.value) })}/></div>
              <div className="text-xs text-muted-foreground">{q.type === "real_time" ? "Erlang C" : "Workload-based"}</div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

// ---------- Step 4: Productivity / AHT ----------
function Step4() {
  const { queues, productivity, set } = useWFM();
  const get = (qid: string) => productivity.find((p) => p.queueId === qid);
  const ensure = (qid: string, defaults?: Partial<NonNullable<ReturnType<typeof get>>>) => {
    if (get(qid)) return;
    set("productivity", [...productivity, {
      queueId: qid, ahtSeconds: 600, acwSeconds: 60, reopenRatePct: 5, transferRatePct: 5,
      fcrTargetPct: 75, chatConcurrency: 1, occupancyTargetPct: 80, qualityMinutesPerDay: 15,
      coachingMinutesPerDay: 10, adminMinutesPerDay: 20, ...defaults,
    }]);
  };
  const update = (qid: string, patch: Partial<NonNullable<ReturnType<typeof get>>>) => {
    ensure(qid);
    set("productivity", productivity.map((p) => p.queueId === qid ? { ...p, ...patch } : p));
  };
  return (
    <Section title="Productivity & handle time" description="AHT, concurrency and occupancy drive the staffing model.">
      <div className="space-y-2">
        {queues.map((q) => {
          const p = get(q.id);
          const v = p ?? { ahtSeconds: 600, chatConcurrency: 1, occupancyTargetPct: 80, acwSeconds: 60, reopenRatePct: 5, transferRatePct: 5, fcrTargetPct: 75 };
          return (
            <div key={q.id} className="grid grid-cols-2 md:grid-cols-7 gap-2 items-end border rounded p-3">
              <div className="text-sm font-medium md:col-span-2">{q.name} <span className="text-xs text-muted-foreground">({q.channel})</span></div>
              <div><Label className="text-xs">AHT (sec)</Label><Input type="number" value={v.ahtSeconds} onClick={() => ensure(q.id)} onChange={(e) => update(q.id, { ahtSeconds: Number(e.target.value) })}/></div>
              <div><Label className="text-xs">ACW (sec)</Label><Input type="number" value={v.acwSeconds} onClick={() => ensure(q.id)} onChange={(e) => update(q.id, { acwSeconds: Number(e.target.value) })}/></div>
              <div><Label className="text-xs">Concurrency</Label><Input type="number" value={v.chatConcurrency} onClick={() => ensure(q.id)} onChange={(e) => update(q.id, { chatConcurrency: Number(e.target.value) })}/></div>
              <div><Label className="text-xs">Occupancy %</Label><Input type="number" value={v.occupancyTargetPct} onClick={() => ensure(q.id)} onChange={(e) => update(q.id, { occupancyTargetPct: Number(e.target.value) })}/></div>
              <div><Label className="text-xs">FCR %</Label><Input type="number" value={v.fcrTargetPct} onClick={() => ensure(q.id)} onChange={(e) => update(q.id, { fcrTargetPct: Number(e.target.value) })}/></div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

// ---------- Step 5: Shrinkage ----------
function Step5() {
  const { shrinkage, set } = useWFM();
  const fields: { k: keyof typeof shrinkage; label: string }[] = [
    { k: "ptoPct", label: "PTO" },{ k: "sickPct", label: "Sick" },{ k: "trainingPct", label: "Training" },
    { k: "meetingsPct", label: "Meetings" },{ k: "coachingPct", label: "Coaching" },{ k: "qaPct", label: "QA" },
    { k: "systemPct", label: "System issues" },{ k: "breaksPct", label: "Breaks" },{ k: "absencePct", label: "Absence" },
    { k: "attritionPct", label: "Attrition" },{ k: "otherPct", label: "Other" },
  ];
  const total = Object.values(shrinkage).reduce((a, b) => a + (b || 0), 0);
  return (
    <Section title="Shrinkage" description="Categorised non-productive time. Productive time = 100% − total shrinkage.">
      <div className="grid md:grid-cols-3 gap-3">
        {fields.map((f) => (
          <div key={f.k}>
            <Label className="text-xs">{f.label} %</Label>
            <Input type="number" value={shrinkage[f.k]} onChange={(e) => set("shrinkage", { ...shrinkage, [f.k]: Number(e.target.value) })} />
          </div>
        ))}
      </div>
      <div className="flex gap-4 mt-2 p-3 rounded-md bg-muted">
        <div className="text-sm"><span className="text-muted-foreground">Total shrinkage:</span> <strong>{total}%</strong></div>
        <div className="text-sm"><span className="text-muted-foreground">Productive time:</span> <strong>{Math.max(0, 100 - total)}%</strong></div>
      </div>
    </Section>
  );
}

// ---------- Step 6: Staffing ----------
function Step6() {
  const { agents, business, set } = useWFM();
  const add = () => {
    const a: Agent = {
      id: uuid(), name: `Agent ${agents.length + 1}`, employmentType: "full_time",
      regionId: business.regions[0]?.id ?? "", timezone: business.regions[0]?.timezone ?? "UTC",
      languages: [business.languages[0] ?? "English"], skills: ["L1"], tiers: ["L1"],
      channels: ["email"], weeklyHours: 40, maxDailyHours: 9, minDailyHours: 4,
      maxConsecutiveDays: 5, requiredDaysOff: 2, availabilityWindows: [], leaveDates: [], overtimeEligible: false,
    };
    set("agents", [...agents, a]);
  };
  const update = (id: string, patch: Partial<Agent>) => set("agents", agents.map((a) => a.id === id ? { ...a, ...patch } : a));
  const types: EmploymentType[] = ["full_time", "part_time", "contractor", "bpo"];
  return (
    <Section title="Staffing" description="Anonymous IDs are fine — no PII required.">
      <div className="flex justify-between">
        <Badge>{agents.length} agents</Badge>
        <Button size="sm" onClick={add}><Plus className="h-3 w-3 mr-1"/>Add agent</Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead className="text-xs text-muted-foreground">
            <tr>
              {["Name","Type","Region","Languages","Skills","Channels","Weekly hrs","Max/day","Max consec","",].map((h) => (
                <th key={h} className="text-left p-1">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {agents.map((a) => (
              <tr key={a.id} className="border-t">
                <td className="p-1"><Input className="h-8" value={a.name} onChange={(e) => update(a.id, { name: e.target.value })}/></td>
                <td className="p-1">
                  <Select value={a.employmentType} onValueChange={(v) => update(a.id, { employmentType: v as EmploymentType })}>
                    <SelectTrigger className="h-8"><SelectValue/></SelectTrigger>
                    <SelectContent>{types.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </td>
                <td className="p-1">
                  <Select value={a.regionId} onValueChange={(v) => update(a.id, { regionId: v })}>
                    <SelectTrigger className="h-8"><SelectValue placeholder="Region"/></SelectTrigger>
                    <SelectContent>{business.regions.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
                  </Select>
                </td>
                <td className="p-1"><Input className="h-8" value={a.languages.join(",")} onChange={(e) => update(a.id, { languages: e.target.value.split(",").map((s)=>s.trim()).filter(Boolean) })}/></td>
                <td className="p-1"><Input className="h-8" value={a.skills.join(",")} onChange={(e) => update(a.id, { skills: e.target.value.split(",").map((s)=>s.trim()).filter(Boolean) })}/></td>
                <td className="p-1"><Input className="h-8" value={a.channels.join(",")} onChange={(e) => update(a.id, { channels: e.target.value.split(",").map((s)=>s.trim() as Channel).filter(Boolean) })}/></td>
                <td className="p-1 w-20"><Input className="h-8" type="number" value={a.weeklyHours} onChange={(e) => update(a.id, { weeklyHours: Number(e.target.value) })}/></td>
                <td className="p-1 w-16"><Input className="h-8" type="number" value={a.maxDailyHours} onChange={(e) => update(a.id, { maxDailyHours: Number(e.target.value) })}/></td>
                <td className="p-1 w-16"><Input className="h-8" type="number" value={a.maxConsecutiveDays} onChange={(e) => update(a.id, { maxConsecutiveDays: Number(e.target.value) })}/></td>
                <td className="p-1"><Button variant="ghost" size="icon" onClick={() => set("agents", agents.filter((x) => x.id !== a.id))}><Trash2 className="h-4 w-4"/></Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

// ---------- Step 7: Shift rules ----------
function Step7() {
  const { shiftRules, set } = useWFM();
  const add = () => {
    const r: ShiftRule = {
      id: uuid(), name: "New shift", length: 8, startWindow: { earliest: "08:00", latest: "12:00" },
      paidBreakMinutes: 15, unpaidBreakMinutes: 30, lunchMinutes: 30, minRestHours: 11,
      maxWeeklyHours: 45, maxOvertimeHours: 10, weekendRotation: false, nightShift: false,
    };
    set("shiftRules", [...shiftRules, r]);
  };
  const update = (id: string, patch: Partial<ShiftRule>) => set("shiftRules", shiftRules.map((r) => r.id === id ? { ...r, ...patch } : r));
  return (
    <Section title="Shift & scheduling rules">
      <div className="flex justify-end"><Button size="sm" onClick={add}><Plus className="h-3 w-3 mr-1"/>Add shift</Button></div>
      <div className="space-y-2">
        {shiftRules.map((r) => (
          <div key={r.id} className="grid grid-cols-2 md:grid-cols-7 gap-2 items-end border rounded p-3">
            <div><Label className="text-xs">Name</Label><Input value={r.name} onChange={(e) => update(r.id, { name: e.target.value })}/></div>
            <div><Label className="text-xs">Length (h)</Label><Input type="number" value={r.length} onChange={(e) => update(r.id, { length: Number(e.target.value) as ShiftRule["length"] })}/></div>
            <div><Label className="text-xs">Earliest start</Label><Input value={r.startWindow.earliest} onChange={(e) => update(r.id, { startWindow: { ...r.startWindow, earliest: e.target.value } })}/></div>
            <div><Label className="text-xs">Latest start</Label><Input value={r.startWindow.latest} onChange={(e) => update(r.id, { startWindow: { ...r.startWindow, latest: e.target.value } })}/></div>
            <div><Label className="text-xs">Lunch (min)</Label><Input type="number" value={r.lunchMinutes} onChange={(e) => update(r.id, { lunchMinutes: Number(e.target.value) })}/></div>
            <div><Label className="text-xs">Min rest (h)</Label><Input type="number" value={r.minRestHours} onChange={(e) => update(r.id, { minRestHours: Number(e.target.value) })}/></div>
            <div className="flex items-center gap-2">
              <label className="text-xs flex items-center gap-1"><input type="checkbox" checked={r.weekendRotation} onChange={(e) => update(r.id, { weekendRotation: e.target.checked })}/>Weekend</label>
              <label className="text-xs flex items-center gap-1"><input type="checkbox" checked={r.nightShift} onChange={(e) => update(r.id, { nightShift: e.target.checked })}/>Night</label>
              <Button variant="ghost" size="icon" onClick={() => set("shiftRules", shiftRules.filter((x) => x.id !== r.id))}><Trash2 className="h-4 w-4"/></Button>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ---------- Step 8: Rotations ----------
function Step8() {
  const { rotation, business, set } = useWFM();
  const update = <K extends keyof typeof rotation>(k: K, v: typeof rotation[K]) => set("rotation", { ...rotation, [k]: v });
  return (
    <Section title="Rotation preferences">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label>Pattern</Label>
          <Select value={rotation.pattern} onValueChange={(v) => update("pattern", v as typeof rotation.pattern)}>
            <SelectTrigger><SelectValue/></SelectTrigger>
            <SelectContent>
              <SelectItem value="fixed">Fixed</SelectItem>
              <SelectItem value="rotating_weekly">Rotating weekly</SelectItem>
              <SelectItem value="rotating_monthly">Rotating monthly</SelectItem>
              <SelectItem value="follow_the_sun">Follow-the-sun</SelectItem>
              <SelectItem value="weekend">Weekend</SelectItem>
              <SelectItem value="night">Night</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div><Label>Min senior agents per shift</Label><Input type="number" value={rotation.minSeniorPerShift} onChange={(e) => update("minSeniorPerShift", Number(e.target.value))}/></div>
        <div><Label>Escalation coverage per shift</Label><Input type="number" value={rotation.escalationCoverage} onChange={(e) => update("escalationCoverage", Number(e.target.value))}/></div>
        <div><Label>Team lead coverage per shift</Label><Input type="number" value={rotation.teamLeadCoverage} onChange={(e) => update("teamLeadCoverage", Number(e.target.value))}/></div>
        <div className="md:col-span-2">
          <Label>Holiday policy</Label>
          <Textarea value={rotation.holidayPolicy} onChange={(e) => update("holidayPolicy", e.target.value)}/>
        </div>
        <div className="md:col-span-2">
          <Label>Min language coverage per shift</Label>
          <div className="grid md:grid-cols-3 gap-2 mt-2">
            {business.languages.map((l) => (
              <div key={l} className="flex items-center gap-2">
                <span className="text-sm w-20">{l}</span>
                <Input type="number" value={rotation.minLanguageCoverage[l] ?? 0} onChange={(e) => update("minLanguageCoverage", { ...rotation.minLanguageCoverage, [l]: Number(e.target.value) })}/>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}

// ---------- Step 9: Scenarios + Review ----------
function Step9({ onFinish }: { onFinish: () => void }) {
  const state = useWFM();
  const v = validateState(state);
  const addScenario = () => {
    const s = { id: uuid(), name: "New scenario", type: "base" as const, volumeMultiplier: 1, shrinkageDelta: 0, ahtDelta: 0 };
    state.set("scenarios", [...state.scenarios, s]);
  };
  return (
    <div className="space-y-4">
      <Section title="Scenarios" description="Variations applied on top of base inputs.">
        <div className="flex justify-end"><Button size="sm" onClick={addScenario}><Plus className="h-3 w-3 mr-1"/>Add scenario</Button></div>
        <div className="space-y-2">
          {state.scenarios.map((s) => (
            <div key={s.id} className="grid grid-cols-2 md:grid-cols-5 gap-2 items-end border rounded p-3">
              <div><Label className="text-xs">Name</Label><Input value={s.name} onChange={(e) => state.set("scenarios", state.scenarios.map((x) => x.id === s.id ? { ...x, name: e.target.value } : x))}/></div>
              <div><Label className="text-xs">Volume ×</Label><Input type="number" step="0.1" value={s.volumeMultiplier} onChange={(e) => state.set("scenarios", state.scenarios.map((x) => x.id === s.id ? { ...x, volumeMultiplier: Number(e.target.value) } : x))}/></div>
              <div><Label className="text-xs">Shrinkage Δ%</Label><Input type="number" value={s.shrinkageDelta} onChange={(e) => state.set("scenarios", state.scenarios.map((x) => x.id === s.id ? { ...x, shrinkageDelta: Number(e.target.value) } : x))}/></div>
              <div><Label className="text-xs">AHT Δ sec</Label><Input type="number" value={s.ahtDelta} onChange={(e) => state.set("scenarios", state.scenarios.map((x) => x.id === s.id ? { ...x, ahtDelta: Number(e.target.value) } : x))}/></div>
              <div><Button variant="ghost" size="icon" onClick={() => state.set("scenarios", state.scenarios.filter((x) => x.id !== s.id))}><Trash2 className="h-4 w-4"/></Button></div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Validation & review">
        {v.errors.length === 0 && v.warnings.length === 0 ? (
          <div className="flex items-center gap-2 text-success"><CheckCircle2 className="h-4 w-4"/>All required inputs are present.</div>
        ) : (
          <div className="space-y-2">
            {v.errors.map((e, i) => <div key={i} className="text-sm text-destructive">• {e}</div>)}
            {v.warnings.map((w, i) => <div key={i} className="text-sm text-warning">⚠ {w}</div>)}
          </div>
        )}
        <Button onClick={onFinish} disabled={v.errors.length > 0}>Finish & view outputs</Button>
      </Section>
    </div>
  );
}
