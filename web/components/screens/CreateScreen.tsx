"use client";

import { ArrowLeft, ArrowRight, CalendarDays, Check, ChevronDown, ChevronRight, Clock3, FileJson, Flag, MapPin, Minus, Plus, Sparkles, Timer, Upload, UsersRound } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import type { Quest, QuestPool, QuestType, Track } from "@/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { finalQuestBank, groupQuestBank, individualQuestBank } from "@/lib/questBank";
import type { QuestBankEntry, QuestBankType } from "@/lib/questBank";

type DraftPool = QuestPool & { dayIndex: number };
const STEP_LABELS = ["Trip basics", "Day planner", "Trigger points", "Final quest", "Review"];
const trackLabel: Record<Track, string> = { individual: "Individual", group: "Group", final: "Final" };
const questTypeCopy: Record<QuestType, string> = { LBQ: "Location · go somewhere", VBQ: "Vote · ask the crew", TBQ: "Timer · beat the clock" };

function defaultTrigger(startDate: string, track: Track, order: number) {
  const hour = track === "group" ? 9 + ((order - 1) % 3) * 5 : 8 + ((order - 1) % 3) * 5;
  return `${startDate}T${String(hour).padStart(2, "0")}:00`;
}

function makeCandidate(tripId: string, poolId: string, track: Track, order: number, triggerTime: string, index = 1): Quest {
  return { id: `${poolId}-candidate-${index}`, poolId, tripId, track, type: "VBQ", order, title: "", description: "", triggerTime, targetCoords: null, timerDurationSeconds: null, isFinalQuestCandidate: track === "final", assignedToPlayerId: null };
}

function makePool(track: Track, order: number, dayIndex: number, startDate: string, tripId = "NEWTRP"): DraftPool {
  const id = `${track}-${dayIndex + 1}-${order}`;
  const triggerTime = defaultTrigger(startDate, track, order);
  return { id, tripId, track, order, dayIndex, triggerTime, assignmentMode: track === "individual" ? "per-player" : "shared", candidates: [makeCandidate(tripId, id, track, order, triggerTime)] };
}

function makeFinalPool(startDate: string, tripId = "NEWTRP", candidates = 10): DraftPool {
  const id = "final-pool";
  const triggerTime = `${startDate}T15:30`;
  return { id, tripId, track: "final", order: 1, dayIndex: 0, triggerTime, assignmentMode: "per-player", candidates: Array.from({ length: candidates }, (_, index) => makeCandidate(tripId, id, "final", 1, triggerTime, index + 1)) };
}

function buildPools(dayPlans: Array<{ individual: number; group: number }>, startDate: string, previous: DraftPool[]) {
  const old = new Map(previous.filter((pool) => pool.track !== "final").map((pool) => [`${pool.track}-${pool.dayIndex + 1}-${pool.order}`, pool]));
  const next: DraftPool[] = [];
  (["individual", "group"] as const).forEach((track) => {
    let order = 0;
    dayPlans.forEach((plan, dayIndex) => {
      for (let index = 0; index < plan[track]; index += 1) {
        order += 1;
        const fresh = makePool(track, order, dayIndex, startDate);
        const existing = old.get(`${track}-${dayIndex + 1}-${index + 1}`);
        const existingTime = existing?.triggerTime && existing.triggerTime.slice(0, 10) === startDate ? existing.triggerTime : fresh.triggerTime;
        next.push(existing ? { ...fresh, ...existing, order, dayIndex, triggerTime: existingTime, candidates: existing.candidates.map((candidate) => ({ ...candidate, track, order, triggerTime: existingTime })) } : fresh);
      }
    });
  });
  return next;
}

const QUEST_BANK_TYPES: QuestBankType[] = ["LBQ", "VBQ", "TBQ"];
const DEFAULT_TARGET_COORDS = { lat: 26.888, lng: 87.31, radiusMeters: 100 };

function shuffle<T>(items: T[]) {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

function pickBankEntries(bank: Record<QuestBankType, QuestBankEntry[]>, count: number, mixed = false) {
  const all = QUEST_BANK_TYPES.flatMap((type) => bank[type].map((entry) => ({ entry, type })));
  if (!mixed) return shuffle(all).slice(0, count);
  const required = QUEST_BANK_TYPES.map((type) => ({ entry: shuffle(bank[type])[0], type }));
  const selectedTitles = new Set(required.map(({ entry }) => entry.title));
  const remaining = shuffle(all.filter(({ entry }) => !selectedTitles.has(entry.title))).slice(0, Math.max(0, count - required.length));
  return shuffle([...required, ...remaining]);
}

function dateForDay(startDate: string, dayIndex: number) {
  const date = new Date(`${startDate}T12:00:00`);
  date.setDate(date.getDate() + dayIndex);
  return date.toISOString().slice(0, 10);
}

function candidateFromBank(pool: DraftPool, entry: QuestBankEntry, type: QuestBankType, index: number): Quest {
  return {
    ...makeCandidate(pool.tripId, pool.id, pool.track, pool.order, pool.triggerTime, index),
    type,
    title: entry.title,
    description: entry.description,
    targetCoords: type === "LBQ" ? DEFAULT_TARGET_COORDS : null,
    timerDurationSeconds: entry.timerSeconds ?? null,
  };
}

function generateRandomPlan(days: number, startDate: string) {
  const dayPlans = Array.from({ length: days }, () => ({ individual: 2, group: 1 }));
  const generatedPools: DraftPool[] = [];
  let individualOrder = 0;
  let groupOrder = 0;

  dayPlans.forEach((_, dayIndex) => {
    const dayDate = dateForDay(startDate, dayIndex);
    for (let index = 0; index < 2; index += 1) {
      individualOrder += 1;
      const triggerTime = `${dayDate}T${String(8 + index * 5).padStart(2, "0")}:00`;
      const pool = { ...makePool("individual", individualOrder, dayIndex, dayDate), triggerTime };
      const selected = pickBankEntries(individualQuestBank, 4, true);
      generatedPools.push({ ...pool, candidates: selected.map(({ entry, type }, candidateIndex) => candidateFromBank(pool, entry, type, candidateIndex + 1)) });
    }

    groupOrder += 1;
    const triggerTime = `${dayDate}T10:00`;
    const pool = { ...makePool("group", groupOrder, dayIndex, dayDate), triggerTime };
    const selected = pickBankEntries(groupQuestBank, 1 + Math.floor(Math.random() * 2));
    generatedPools.push({ ...pool, candidates: selected.map(({ entry, type }, candidateIndex) => candidateFromBank(pool, entry, type, candidateIndex + 1)) });
  });

  const finalDate = dateForDay(startDate, days - 1);
  const finalPool = { ...makeFinalPool(finalDate, "NEWTRP", finalQuestBank.length) };
  finalPool.candidates = finalQuestBank.map((entry, index) => ({
    ...makeCandidate(finalPool.tripId, finalPool.id, "final", 1, finalPool.triggerTime, index + 1),
    title: entry.title,
    description: entry.description,
  }));

  return { dayPlans, pools: generatedPools, finalPool };
}

function formatDate(value: string) {
  if (!value) return "Choose a date";
  return new Date(`${value}T12:00:00`).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

function candidateFromUnknown(value: Partial<Quest>, pool: DraftPool, index: number): Quest {
  const base = makeCandidate(pool.tripId, pool.id, pool.track, pool.order, pool.triggerTime, index);
  return { ...base, ...value, id: value.id || base.id, tripId: pool.tripId, poolId: pool.id, track: pool.track, order: pool.order, triggerTime: pool.triggerTime, isFinalQuestCandidate: pool.track === "final", assignedToPlayerId: null };
}

function poolsFromImport(value: unknown, startDate: string) {
  const data = value as { trip?: { name?: string; startDate?: string; days?: number; expectedPlayerCount?: number; peopleCount?: number }; pools?: Array<Partial<QuestPool> & { dayIndex?: number }>; quests?: Quest[] } | Quest[];
  const trip = Array.isArray(data) ? undefined : data.trip;
  const importStartDate = trip?.startDate?.slice(0, 10) || startDate;
  const importedPools = Array.isArray(data) ? [] : data.pools ?? [];
  const oldQuests = Array.isArray(data) ? data : (!importedPools.length && !Array.isArray(data) ? data.quests ?? [] : []);
  if (oldQuests.length) {
    const grouped = new Map<string, Quest[]>();
    oldQuests.forEach((quest) => { const key = `${quest.track}-${quest.track === "final" ? "final" : quest.order}`; grouped.set(key, [...(grouped.get(key) ?? []), quest]); });
    const regular = [...grouped.entries()].filter(([key]) => !key.startsWith("final"));
    const finalCandidates = oldQuests.filter((quest) => quest.track === "final" || quest.isFinalQuestCandidate);
    const pools = regular.map(([key, candidates]) => { const [track, orderText] = key.split("-") as ["individual" | "group", string]; const pool = makePool(track, Number(orderText), 0, importStartDate); const triggerTime = candidates[0].triggerTime; return { ...pool, triggerTime, candidates: candidates.map((candidate, index) => candidateFromUnknown(candidate, { ...pool, triggerTime }, index + 1)) }; });
    const finalBase = makeFinalPool(importStartDate, "NEWTRP", Math.max(10, Math.min(15, finalCandidates.length)));
    const final = finalCandidates.length ? { ...finalBase, candidates: finalCandidates.map((candidate, index) => candidateFromUnknown(candidate, finalBase, index + 1)) } : makeFinalPool(importStartDate);
    return { trip, pools, final };
  }
  const pools = importedPools.map((input, index) => { const track = input.track ?? "individual"; const pool = { ...makePool(track, input.order ?? index + 1, input.dayIndex ?? 0, importStartDate), ...input, track, dayIndex: input.dayIndex ?? 0, assignmentMode: track === "individual" || track === "final" ? "per-player" : "shared" } as DraftPool; return { ...pool, candidates: (input.candidates ?? []).map((candidate, candidateIndex) => candidateFromUnknown(candidate, pool, candidateIndex + 1)) }; });
  const final = pools.find((pool) => pool.track === "final") ?? makeFinalPool(importStartDate);
  return { trip, pools: pools.filter((pool) => pool.track !== "final"), final: final.candidates.length ? final : makeFinalPool(importStartDate) };
}

export function CreateScreen() {
  const [step, setStep] = useState(0);
  const [created, setCreated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trip, setTrip] = useState({ name: "", startDate: "2026-10-17", days: 2, peopleCount: 6 });
  const [dayPlans, setDayPlans] = useState(() => [{ individual: 2, group: 1 }, { individual: 1, group: 1 }]);
  const [pools, setPools] = useState<DraftPool[]>(() => buildPools([{ individual: 2, group: 1 }, { individual: 1, group: 1 }], "2026-10-17", []));
  const [finalPool, setFinalPool] = useState<DraftPool>(() => makeFinalPool("2026-10-17"));
  const [openDayIndex, setOpenDayIndex] = useState<number | null>(0);
  const [openPoolId, setOpenPoolId] = useState<string | null>(() => pools[0]?.id ?? null);
  const fileInput = useRef<HTMLInputElement>(null);
  const allPools = useMemo(() => [...pools, finalPool], [finalPool, pools]);
  const spacingWarnings = useMemo(() => {
    const warnings: string[] = [];
    (["individual", "group"] as const).forEach((track) => { const sorted = pools.filter((pool) => pool.track === track).sort((a, b) => new Date(a.triggerTime).getTime() - new Date(b.triggerTime).getTime()); sorted.slice(1).forEach((pool, index) => { const previous = sorted[index]; if (new Date(pool.triggerTime).getTime() - new Date(previous.triggerTime).getTime() < 4 * 60 * 60 * 1000) warnings.push(`${trackLabel[track]} trigger ${pool.order} is less than 4 hours after trigger ${previous.order}.`); }); });
    return warnings;
  }, [pools]);

  function setBasics(field: keyof typeof trip, value: string) {
    const nextValue = field === "days" || field === "peopleCount" ? Math.max(1, Number(value) || 1) : value;
    setTrip((current) => ({ ...current, [field]: nextValue }));
    if (field === "days") setDayPlans((current) => Array.from({ length: Number(nextValue) }, (_, index) => current[index] ?? { individual: 0, group: 0 }));
  }
  function preparePools() { setPools((current) => buildPools(dayPlans, trip.startDate, current)); setFinalPool((current) => ({ ...current, triggerTime: current.triggerTime.startsWith(trip.startDate) ? current.triggerTime : `${trip.startDate}T15:30`, candidates: current.candidates.map((candidate) => ({ ...candidate, triggerTime: current.triggerTime.startsWith(trip.startDate) ? current.triggerTime : `${trip.startDate}T15:30` })) })); }
  function generatePlan() {
    const days = Math.min(14, Math.max(1, Number(trip.days) || 2));
    const peopleCount = Math.min(100, Math.max(1, Number(trip.peopleCount) || 6));
    const startDate = trip.startDate || "2026-10-17";
    const generated = generateRandomPlan(days, startDate);
    setTrip((current) => ({ ...current, name: current.name.trim() || "Itahari → Bhedetar Adventure", startDate, days, peopleCount }));
    setDayPlans(generated.dayPlans);
    setPools(generated.pools);
    setFinalPool(generated.finalPool);
    setOpenDayIndex(0);
    setOpenPoolId(generated.pools[0]?.id ?? null);
    setError(null);
    setStep(4);
  }
  function updateDayCount(dayIndex: number, track: "individual" | "group", value: string) { setDayPlans((current) => current.map((day, index) => index === dayIndex ? { ...day, [track]: Math.min(12, Math.max(0, Number(value) || 0)) } : day)); }
  function updatePool(poolId: string, update: Partial<DraftPool>) {
    const merge = (pool: DraftPool) => pool.id === poolId ? { ...pool, ...update, ...(update.triggerTime ? { candidates: pool.candidates.map((candidate) => ({ ...candidate, triggerTime: update.triggerTime ?? pool.triggerTime })) } : {}) } : pool;
    if (poolId === finalPool.id) setFinalPool(merge(finalPool)); else setPools((current) => current.map(merge));
  }
  function updateCandidate(poolId: string, candidateId: string, update: Partial<Quest>) { const updater = (pool: DraftPool) => pool.id === poolId ? { ...pool, candidates: pool.candidates.map((candidate) => candidate.id === candidateId ? { ...candidate, ...update } : candidate) } : pool; if (poolId === finalPool.id) setFinalPool(updater(finalPool)); else setPools((current) => current.map(updater)); }
  function addCandidate(pool: DraftPool) { const maximum = pool.track === "final" ? 15 : 20; if (pool.candidates.length >= maximum) return; updatePool(pool.id, { candidates: [...pool.candidates, makeCandidate(pool.tripId, pool.id, pool.track, pool.order, pool.triggerTime, pool.candidates.length + 1)] }); }
  function removeCandidate(pool: DraftPool, candidateId: string) { const minimum = pool.track === "final" ? 10 : 1; if (pool.candidates.length <= minimum) return; updatePool(pool.id, { candidates: pool.candidates.filter((candidate) => candidate.id !== candidateId) }); }
  function validateBasics() { if (!trip.name.trim()) return "Give your trip a name first."; if (!trip.startDate) return "Choose a start date."; if (trip.days < 1 || trip.days > 14) return "Trips can be 1–14 days long."; if (trip.peopleCount < 1 || trip.peopleCount > 100) return "People count must be between 1 and 100."; return null; }
  function validateDays() { return dayPlans.some((day) => day.individual + day.group > 0) ? null : "Add at least one trigger point to the trip."; }
  function validatePools() { const invalid = allPools.find((pool) => pool.candidates.some((candidate) => !candidate.title.trim() || !candidate.description.trim() || (candidate.type === "LBQ" && (!candidate.targetCoords || !Number.isFinite(candidate.targetCoords.lat) || !Number.isFinite(candidate.targetCoords.lng) || candidate.targetCoords.radiusMeters <= 0)) || (candidate.type === "TBQ" && (!candidate.timerDurationSeconds || candidate.timerDurationSeconds <= 0)))); if (invalid) return `Finish the quest details for ${trackLabel[invalid.track].toLowerCase()} trigger ${invalid.order}.`; if (spacingWarnings.length) return "Move the highlighted trigger times so each track has at least 4 hours between points."; return null; }
  function nextStep() { const validation = step === 0 ? validateBasics() : step === 1 ? validateDays() : step === 2 ? validatePools() : step === 3 ? (finalPool.candidates.length < 10 || finalPool.candidates.length > 15 ? "The final pool needs 10–15 candidate quests." : validatePools()) : null; if (validation) { setError(validation); return; } setError(null); if (step === 1) preparePools(); setStep((current) => Math.min(4, current + 1)); }
  function previousStep() { setError(null); setStep((current) => Math.max(0, current - 1)); }
  function exportJson() { const payload = { version: 2, trip: { ...trip, expectedPlayerCount: trip.peopleCount }, pools: allPools }; const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = `${trip.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "trip"}-config.json`; anchor.click(); URL.revokeObjectURL(url); }
  function importJson(event: ChangeEvent<HTMLInputElement>) { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { try { const imported = poolsFromImport(JSON.parse(String(reader.result)), trip.startDate); setTrip((current) => ({ ...current, ...(imported.trip ? { name: imported.trip.name ?? current.name, startDate: imported.trip.startDate?.slice(0, 10) ?? current.startDate, days: imported.trip.days ?? current.days, peopleCount: imported.trip.expectedPlayerCount ?? imported.trip.peopleCount ?? current.peopleCount } : {}) })); setPools(imported.pools); setFinalPool(imported.final); setDayPlans(Array.from({ length: imported.trip?.days ?? Math.max(1, ...imported.pools.map((pool) => pool.dayIndex + 1), 1) }, (_, dayIndex) => ({ individual: imported.pools.filter((pool) => pool.dayIndex === dayIndex && pool.track === "individual").length, group: imported.pools.filter((pool) => pool.dayIndex === dayIndex && pool.track === "group").length }))); setError(null); setStep(4); } catch { setError("That file does not look like a Suffer trip config."); } }; reader.readAsText(file); event.target.value = ""; }

  if (created) return <main className="entry-screen create-screen"><a className="back-link" href="/join"><ArrowLeft size={18} /> Back to join</a><section className="code-reveal"><span className="brand-bubble small"><Sparkles size={20} /></span><span className="eyebrow">Your trip code</span><strong>BHED26</strong><p>Share it with the crew. {trip.peopleCount} seats, no spectators.</p><a className="card-action" href="/lobby">Open waiting room <ArrowRight size={17} /></a></section></main>;
  return <main className="entry-screen create-screen wizard-screen"><a className="back-link" href="/join"><ArrowLeft size={18} /> Back to join</a><div className="wizard-heading"><div><span className="eyebrow">Organizer setup</span><h1>Build the trip<br /><em>as you go.</em></h1><p>A few small steps, then we&apos;ll hand you a code for the crew.</p></div><span className="wizard-count">{step + 1}<small>/ 5</small></span></div><nav className="wizard-progress" aria-label="Create trip steps">{STEP_LABELS.map((label, index) => <button type="button" key={label} className={index === step ? "active" : index < step ? "done" : ""} onClick={() => index < step && setStep(index)} aria-current={index === step ? "step" : undefined} disabled={index > step}><span>{index < step ? <Check size={14} /> : index + 1}</span><small>{label}</small></button>)}</nav><div className="wizard-import"><div className="wizard-import-copy"><FileJson size={17} aria-hidden="true" /><span><strong>Already have a trip file?</strong><small>Import JSON and jump straight to Review.</small></span></div><label className="text-action" htmlFor="wizard-json"><Upload size={15} /> Import JSON<input ref={fileInput} id="wizard-json" type="file" accept="application/json,.json" onChange={importJson} /></label></div><div className="wizard-generator"><div className="wizard-generator-copy"><Sparkles size={18} aria-hidden="true" /><span><strong>Need a head start?</strong><small>Starting point only — generate a complete Itahari → Bhedetar plan, then edit anything you like.</small></span></div><Button variant="secondary" type="button" onClick={generatePlan}><Sparkles size={16} /> Generate random plan</Button></div>
    <Card className={`wizard-panel ${step >= 2 ? "wide-panel" : ""}`}>
      {step === 0 && <div className="wizard-step-content"><div className="panel-intro"><span className="step-kicker">Step 1 · Trip basics</span><h2>Start with the shape of the trip.</h2><p>This tells us when the game starts and how many people the lobby should expect.</p></div><div className="wizard-form"><div className="form-field"><label htmlFor="trip-name">Trip name <span>*</span></label><div className="input-wrap"><Sparkles size={18} aria-hidden="true" /><input id="trip-name" value={trip.name} onChange={(event) => setBasics("name", event.target.value)} placeholder="e.g. Bhedetar Weekend" autoComplete="off" /></div></div><div className="form-field"><label htmlFor="trip-date">Start date <span>*</span></label><div className="input-wrap"><CalendarDays size={18} aria-hidden="true" /><input id="trip-date" type="date" value={trip.startDate} onChange={(event) => setBasics("startDate", event.target.value)} /></div></div><div className="field-grid"><div className="form-field"><label htmlFor="trip-days">Number of days <span>*</span></label><input className="number-input" id="trip-days" type="number" min="1" max="14" value={trip.days} onChange={(event) => setBasics("days", event.target.value)} /></div><div className="form-field"><label htmlFor="people-count">People joining <span>*</span></label><input className="number-input" id="people-count" type="number" min="1" max="100" value={trip.peopleCount} onChange={(event) => setBasics("peopleCount", event.target.value)} /></div></div><p className="form-helper"><UsersRound size={15} aria-hidden="true" /> This becomes the expected player count for your lobby.</p></div></div>}
      {step === 1 && <div className="wizard-step-content"><div className="panel-intro"><span className="step-kicker">Step 2 · Day planner</span><h2>How much mischief happens each day?</h2><p>Just counts for now. You&apos;ll write the actual quests next.</p></div><div className="day-planner">{dayPlans.map((day, dayIndex) => <div className="day-plan" key={dayIndex}><div className="day-plan-heading"><span className="day-number">{String(dayIndex + 1).padStart(2, "0")}</span><div><strong>Day {dayIndex + 1}</strong><small>{formatDate(new Date(new Date(`${trip.startDate}T12:00:00`).getTime() + dayIndex * 86400000).toISOString().slice(0, 10))}</small></div></div><div className="count-row"><label htmlFor={`individual-${dayIndex}`}><span className="track-dot individual-dot" /> Individual trigger points<small>Players get their own random quest</small></label><div className="stepper"><button type="button" onClick={() => updateDayCount(dayIndex, "individual", String(day.individual - 1))} aria-label={`Remove individual trigger point from day ${dayIndex + 1}`}><Minus size={16} /></button><input id={`individual-${dayIndex}`} type="number" min="0" max="12" value={day.individual} onChange={(event) => updateDayCount(dayIndex, "individual", event.target.value)} /><button type="button" onClick={() => updateDayCount(dayIndex, "individual", String(day.individual + 1))} aria-label={`Add individual trigger point to day ${dayIndex + 1}`}><Plus size={16} /></button></div></div><div className="count-row"><label htmlFor={`group-${dayIndex}`}><span className="track-dot group-dot" /> Group trigger points<small>Everyone gets one shared quest</small></label><div className="stepper"><button type="button" onClick={() => updateDayCount(dayIndex, "group", String(day.group - 1))} aria-label={`Remove group trigger point from day ${dayIndex + 1}`}><Minus size={16} /></button><input id={`group-${dayIndex}`} type="number" min="0" max="12" value={day.group} onChange={(event) => updateDayCount(dayIndex, "group", event.target.value)} /><button type="button" onClick={() => updateDayCount(dayIndex, "group", String(day.group + 1))} aria-label={`Add group trigger point to day ${dayIndex + 1}`}><Plus size={16} /></button></div></div></div>)}</div></div>}
      {step === 2 && <div className="wizard-step-content"><div className="panel-intro"><span className="step-kicker">Step 3 · Trigger point setup</span><h2>Give every moment a quest.</h2><p>Open one day and one trigger at a time to keep the plan easy to scan. Every quest stays editable.</p></div><div className="trigger-days">{Array.from({ length: trip.days }, (_, dayIndex) => { const dayPools = pools.filter((pool) => pool.dayIndex === dayIndex); const dayOpen = openDayIndex === dayIndex; return <section className={`trigger-day ${dayOpen ? "is-open" : ""}`} key={dayIndex}><button className="trigger-day-heading" type="button" onClick={() => { if (dayOpen) { setOpenDayIndex(null); setOpenPoolId(null); } else { setOpenDayIndex(dayIndex); setOpenPoolId(dayPools[0]?.id ?? null); } }} aria-expanded={dayOpen}><span className="day-number">{String(dayIndex + 1).padStart(2, "0")}</span><span className="trigger-day-heading-copy"><strong>Day {dayIndex + 1}</strong><small>{formatDate(dateForDay(trip.startDate, dayIndex))}</small></span><span className="trigger-day-count">{dayPools.length} trigger{dayPools.length === 1 ? "" : "s"}</span><ChevronDown className={dayOpen ? "chevron-open" : ""} size={19} aria-hidden="true" /></button>{dayOpen && <div className="trigger-day-body">{dayPools.length ? dayPools.map((pool) => <PoolEditor key={pool.id} pool={pool} open={openPoolId === pool.id} onToggle={() => setOpenPoolId((current) => current === pool.id ? null : pool.id)} warning={spacingWarnings.some((warning) => warning.includes(`${trackLabel[pool.track]} trigger ${pool.order}`))} onPoolChange={updatePool} onCandidateChange={updateCandidate} onAddCandidate={addCandidate} onRemoveCandidate={removeCandidate} />) : <p className="trigger-day-empty">No trigger points yet. Add them in Day planner.</p>}</div>}</section>; })}</div></div>}
      {step === 3 && <div className="wizard-step-content"><div className="panel-intro"><span className="step-kicker">Step 4 · Final quest pool</span><h2>Save the biggest one for last.</h2><p>Write 10–15 candidate quests of equal difficulty. One is randomly picked for each player at the finish.</p></div><PoolEditor pool={finalPool} onPoolChange={updatePool} onCandidateChange={updateCandidate} onAddCandidate={addCandidate} onRemoveCandidate={removeCandidate} final /></div>}
      {step === 4 && <div className="wizard-step-content review-panel"><div className="panel-intro"><span className="step-kicker">Step 5 · Review</span><h2>One last look before the code.</h2><p>Here&apos;s the whole trip plan, in plain language. You can still go back and edit anything.</p></div><div className="review-trip"><div><span className="eyebrow">{formatDate(trip.startDate)}</span><h3>{trip.name || "Untitled trip"}</h3></div><span className="review-people"><UsersRound size={15} /> {trip.peopleCount} expected</span></div><div className="review-stats"><span><strong>{trip.days}</strong> days</span><span><strong>{pools.length}</strong> triggers</span><span><strong>{finalPool.candidates.length}</strong> final quests</span></div><div className="review-list">{[...pools, finalPool].map((pool) => <div className="review-row" key={pool.id}><span className={`review-track ${pool.track}`}><Flag size={14} /></span><div><span className="eyebrow">{trackLabel[pool.track]} · {pool.track === "final" ? "Finish" : `Day ${pool.dayIndex + 1}`} · {new Date(pool.triggerTime).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span><strong>Trigger {pool.order}: {pool.candidates.length} candidate{pool.candidates.length === 1 ? "" : "s"}</strong><small>{pool.candidates.filter((candidate) => candidate.title.trim()).map((candidate) => candidate.title).join(" · ") || "Quest titles still need attention"}</small></div><ChevronRight size={17} aria-hidden="true" /></div>)}</div><div className="review-actions"><Button variant="secondary" type="button" onClick={exportJson}><FileJson size={17} /> Export as JSON</Button><label className="text-action" htmlFor="review-json"><Upload size={15} /> Import JSON<input id="review-json" type="file" accept="application/json,.json" onChange={importJson} /></label></div></div>}
      {error && <div className="wizard-error" role="alert"><span>!</span>{error}</div>}<div className="wizard-footer">{step > 0 ? <Button variant="ghost" type="button" onClick={previousStep}><ArrowLeft size={17} /> Back</Button> : <span />}{step < 4 ? <Button type="button" onClick={nextStep}>Continue <ArrowRight size={17} /></Button> : <Button type="button" onClick={() => { const validation = validatePools(); if (validation) setError(validation); else setCreated(true); }}>Generate trip code <Sparkles size={17} /></Button>}</div>
    </Card>
  </main>;
}

function PoolEditor({ pool, warning = false, final = false, open, onToggle, onPoolChange, onCandidateChange, onAddCandidate, onRemoveCandidate }: { pool: DraftPool; warning?: boolean; final?: boolean; open?: boolean; onToggle?: () => void; onPoolChange: (poolId: string, update: Partial<DraftPool>) => void; onCandidateChange: (poolId: string, candidateId: string, update: Partial<Quest>) => void; onAddCandidate: (pool: DraftPool) => void; onRemoveCandidate: (pool: DraftPool, candidateId: string) => void }) {
  const [localOpen, setLocalOpen] = useState(true);
  const expanded = open ?? localOpen;
  function toggle() {
    if (onToggle) onToggle();
    else setLocalOpen((value) => !value);
  }
  return <article className={`pool-editor ${warning ? "pool-warning" : ""}`}><button className="pool-heading" type="button" onClick={toggle} aria-expanded={expanded}><span className={`track-icon ${pool.track}`} aria-hidden="true">{pool.track === "individual" ? <Sparkles size={17} /> : pool.track === "group" ? <UsersRound size={17} /> : <Flag size={17} />}</span><span className="pool-title"><span className="eyebrow">{trackLabel[pool.track]} {final ? "pool" : `· Day ${pool.dayIndex + 1}`}</span><strong>{final ? "Final quest pool" : `Trigger point ${pool.order}`}</strong><small>{pool.candidates.length} candidate{pool.candidates.length === 1 ? "" : "s"} · {pool.assignmentMode === "per-player" ? "random per player" : "shared random quest"}</small></span><ChevronDown className={expanded ? "chevron-open" : ""} size={19} aria-hidden="true" /></button>{expanded && <div className="pool-body"><div className="pool-time-row"><label htmlFor={`${pool.id}-time`}><Clock3 size={15} /> Scheduled time</label><input id={`${pool.id}-time`} type="datetime-local" value={pool.triggerTime} onChange={(event) => onPoolChange(pool.id, { triggerTime: event.target.value })} /></div>{warning && <div className="spacing-warning" role="status"><Clock3 size={15} /><span>Heads up — this track needs at least 4 hours between trigger points.</span></div>}{!final && <div className="pool-note"><Sparkles size={16} /><span><strong>These will be randomly split among the group.</strong><small>{pool.track === "individual" ? "Heads up — everyone gets a random one of these, so friends might get different quests here." : "The group will get one random quest from this pool to do together."}</small></span></div>}{final && <div className="pool-note final-note"><Flag size={16} /><span><strong>One random quest per player at the finish.</strong><small>Keep the difficulty even so the last round feels fair.</small></span></div>}<div className="candidate-list">{pool.candidates.map((candidate, index) => <CandidateEditor key={candidate.id} candidate={candidate} index={index} onChange={(update) => onCandidateChange(pool.id, candidate.id, update)} onRemove={() => onRemoveCandidate(pool, candidate.id)} canRemove={pool.candidates.length > (final ? 10 : 1)} />)}</div><div className="pool-actions"><button type="button" className="add-candidate" onClick={() => onAddCandidate(pool)} disabled={pool.candidates.length >= (final ? 15 : 20)}><Plus size={16} /> Add candidate <span>{pool.candidates.length}/{final ? 15 : 20}</span></button>{final && <span className="pool-limit">10 minimum · 15 maximum</span>}</div></div>}</article>;
}

function CandidateEditor({ candidate, index, onChange, onRemove, canRemove }: { candidate: Quest; index: number; onChange: (update: Partial<Quest>) => void; onRemove: () => void; canRemove: boolean }) {
  const updateType = (type: QuestType) => onChange({ type, targetCoords: type === "LBQ" ? { lat: 0, lng: 0, radiusMeters: 50 } : null, timerDurationSeconds: type === "TBQ" ? 60 : null });
  return <div className="candidate-editor"><div className="candidate-top"><span className="candidate-number">{String(index + 1).padStart(2, "0")}</span><strong>Candidate quest</strong>{canRemove && <button type="button" className="remove-candidate" onClick={onRemove} aria-label={`Remove candidate ${index + 1}`}><Minus size={15} /></button>}</div><div className="candidate-form"><label htmlFor={`${candidate.id}-title`}>Title <span>*</span></label><input id={`${candidate.id}-title`} value={candidate.title} onChange={(event) => onChange({ title: event.target.value })} placeholder="What should they do?" /><label htmlFor={`${candidate.id}-description`}>Description <span>*</span></label><textarea id={`${candidate.id}-description`} value={candidate.description} onChange={(event) => onChange({ description: event.target.value })} placeholder="Give the crew enough context to complete it." rows={2} /><label htmlFor={`${candidate.id}-type`}>Quest type <span>*</span></label><select id={`${candidate.id}-type`} value={candidate.type} onChange={(event) => updateType(event.target.value as QuestType)}>{Object.entries(questTypeCopy).map(([type, copy]) => <option key={type} value={type}>{copy}</option>)}</select>{candidate.type === "LBQ" && <div className="type-fields"><div><label htmlFor={`${candidate.id}-lat`}><MapPin size={13} /> Latitude</label><input id={`${candidate.id}-lat`} type="number" step="any" value={candidate.targetCoords?.lat ?? ""} onChange={(event) => onChange({ targetCoords: { lat: Number(event.target.value), lng: candidate.targetCoords?.lng ?? 0, radiusMeters: candidate.targetCoords?.radiusMeters ?? 50 } })} /></div><div><label htmlFor={`${candidate.id}-lng`}>Longitude</label><input id={`${candidate.id}-lng`} type="number" step="any" value={candidate.targetCoords?.lng ?? ""} onChange={(event) => onChange({ targetCoords: { lat: candidate.targetCoords?.lat ?? 0, lng: Number(event.target.value), radiusMeters: candidate.targetCoords?.radiusMeters ?? 50 } })} /></div><div><label htmlFor={`${candidate.id}-radius`}>Radius (m)</label><input id={`${candidate.id}-radius`} type="number" min="1" value={candidate.targetCoords?.radiusMeters ?? ""} onChange={(event) => onChange({ targetCoords: { lat: candidate.targetCoords?.lat ?? 0, lng: candidate.targetCoords?.lng ?? 0, radiusMeters: Number(event.target.value) } })} /></div></div>}{candidate.type === "TBQ" && <div className="timer-field"><Timer size={15} /><label htmlFor={`${candidate.id}-timer`}>Timer duration</label><input id={`${candidate.id}-timer`} type="number" min="1" value={candidate.timerDurationSeconds ?? ""} onChange={(event) => onChange({ timerDurationSeconds: Number(event.target.value) })} /><span>seconds</span></div>}</div></div>;
}
