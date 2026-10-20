"use client";

import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import type { SaveResult } from "@/app/actions/bands";
import {
  INPUT_KINDS,
  MONITOR_KINDS,
  newItemId,
  STAND_KINDS,
  type BandDetails,
  type InputItem,
  type MonitorMix,
} from "@/lib/domain";
import type { DictKey } from "@/lib/i18n";
import { DRUM_KIT_KEYS, INPUT_PRESETS } from "@/lib/presets";
import { useI18n } from "./i18n-provider";
import { StagePlotEditor } from "./stage-plot-editor";

type Tab = "info" | "members" | "inputs" | "monitors" | "stage" | "schedule";
type SaveState = "idle" | "saving" | "saved" | "error";

const AUTOSAVE_MS = 900;
const RETRY_MS = 5000;

export function BandEditor({
  initial,
  initialSubmitted,
  save,
  setSubmitted,
  schedule,
}: {
  initial: BandDetails;
  initialSubmitted: boolean;
  save: (details: BandDetails) => Promise<SaveResult>;
  setSubmitted: (submitted: boolean) => Promise<SaveResult>;
  /** Optional extra tab content (the band portal shows their slot here). */
  schedule?: ReactNode;
}) {
  const { t, lang } = useI18n();
  const [details, setDetails] = useState(initial);
  const [tab, setTab] = useState<Tab>("info");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [submitted, setSubmittedState] = useState(initialSubmitted);
  const [pending, startTransition] = useTransition();

  // Autosave: every change bumps `version`; we save the latest after a pause.
  const version = useRef(0);
  const savedVersion = useRef(0);
  const latest = useRef(details);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function update(patch: Partial<BandDetails>) {
    setDetails((d) => {
      const next = { ...d, ...patch };
      latest.current = next;
      return next;
    });
    version.current += 1;
    queueSave(AUTOSAVE_MS);
  }

  function queueSave(delay: number) {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, delay);
  }

  const inFlight = useRef<Promise<void> | null>(null);

  /** Save the latest details. Saves never overlap, so an old one can't land after a newer one. */
  async function flush(): Promise<void> {
    if (inFlight.current) {
      await inFlight.current;
      return flush();
    }
    const v = version.current;
    if (v === savedVersion.current) return;
    setSaveState("saving");
    inFlight.current = (async () => {
      try {
        const res = await save(latest.current);
        if (!res.ok) throw new Error("save rejected");
        savedVersion.current = Math.max(savedVersion.current, v);
        setSaveState(version.current === savedVersion.current ? "saved" : "saving");
      } catch {
        setSaveState("error");
        queueSave(RETRY_MS);
      } finally {
        inFlight.current = null;
      }
    })();
    await inFlight.current;
  }

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (version.current !== savedVersion.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  const tabs: [Tab, DictKey][] = [
    ["info", "band.tab.info"],
    ["members", "band.tab.members"],
    ["inputs", "band.tab.inputs"],
    ["monitors", "band.tab.monitors"],
    ["stage", "band.tab.stage"],
    ...(schedule ? ([["schedule", "band.tab.schedule"]] as [Tab, DictKey][]) : []),
  ];

  /* ---------- list helpers ---------- */

  function addPreset(key: string) {
    const p = INPUT_PRESETS.find((x) => x.key === key)!;
    return { id: newItemId(), source: lang === "zh" ? p.zh : p.en, kind: p.kind, mic: p.mic, stand: p.stand, bandProvides: false } satisfies InputItem;
  }

  function moveInput(index: number, by: number) {
    const target = index + by;
    if (target < 0 || target >= details.inputs.length) return;
    const next = [...details.inputs];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    update({ inputs: next });
  }

  const patchInput = (id: string, patch: Partial<InputItem>) =>
    update({ inputs: details.inputs.map((i) => (i.id === id ? { ...i, ...patch } : i)) });
  const patchMonitor = (id: string, patch: Partial<MonitorMix>) =>
    update({ monitors: details.monitors.map((m) => (m.id === id ? { ...m, ...patch } : m)) });

  return (
    <div>
      {/* Sticky bar: tabs + save status, always reachable on a phone. */}
      <div className="sticky top-0 z-10 -mx-4 mb-5 border-b border-border bg-bg/95 px-4 backdrop-blur">
        <div className="flex items-center gap-2 pt-2">
          <SaveIndicator state={saveState} />
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                if (timer.current) clearTimeout(timer.current);
                await flush();
                const next = !submitted;
                const res = await setSubmitted(next);
                if (res.ok) setSubmittedState(next);
              })
            }
            className={`btn btn-sm ml-auto ${submitted ? "border-ok text-ok" : "btn-primary"}`}
          >
            {submitted ? t("band.submitted") : t("band.submit")}
          </button>
        </div>
        <nav className="-mb-px flex gap-1 overflow-x-auto overflow-y-hidden pt-2">
          {tabs.map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`border-b-2 px-3 py-2 text-sm whitespace-nowrap ${
                tab === key ? "border-accent text-text" : "border-transparent text-muted"
              }`}
            >
              {t(label)}
              {key === "inputs" && details.inputs.length > 0 && (
                <span className="ml-1 text-xs text-muted">({details.inputs.length})</span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {tab === "info" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("band.name")}>
            <input className="input" maxLength={80} value={details.name} onChange={(e) => update({ name: e.target.value })} />
          </Field>
          <Field label={t("band.setMin")}>
            <input
              className="input"
              type="number"
              min={1}
              max={240}
              inputMode="numeric"
              value={details.setMin}
              onChange={(e) => update({ setMin: Math.max(1, Math.min(240, Number(e.target.value) || 1)) })}
            />
          </Field>
          <Field label={t("band.contactName")}>
            <input className="input" maxLength={80} value={details.contactName} onChange={(e) => update({ contactName: e.target.value })} />
          </Field>
          <Field label={t("band.contactInfo")}>
            <input className="input" maxLength={120} value={details.contactInfo} onChange={(e) => update({ contactInfo: e.target.value })} />
          </Field>
          <Field label={t("band.bringing")} hint={t("band.bringingHelp")} wide>
            <textarea className="input min-h-24 py-2" maxLength={1000} value={details.bringing} onChange={(e) => update({ bringing: e.target.value })} />
          </Field>
          <Field label={t("band.notes")} wide>
            <textarea className="input min-h-24 py-2" maxLength={2000} value={details.notes} onChange={(e) => update({ notes: e.target.value })} />
          </Field>
        </div>
      )}

      {tab === "members" && (
        <div className="space-y-3">
          <h2 className="font-semibold">{t("band.members")}</h2>
          {details.members.map((member) => (
            <div key={member.id} className="flex gap-2">
              <input
                className="input"
                placeholder={t("band.memberName")}
                aria-label={t("band.memberName")}
                maxLength={80}
                value={member.name}
                onChange={(e) => update({ members: details.members.map((m) => (m.id === member.id ? { ...m, name: e.target.value } : m)) })}
              />
              <input
                className="input"
                placeholder={t("band.memberRole")}
                aria-label={t("band.memberRole")}
                maxLength={80}
                value={member.role}
                onChange={(e) => update({ members: details.members.map((m) => (m.id === member.id ? { ...m, role: e.target.value } : m)) })}
              />
              <RemoveButton label={t("band.delete")} onClick={() => update({ members: details.members.filter((m) => m.id !== member.id) })} />
            </div>
          ))}
          <button
            type="button"
            className="btn"
            disabled={details.members.length >= 20}
            onClick={() => update({ members: [...details.members, { id: newItemId(), name: "", role: "" }] })}
          >
            + {t("band.addMember")}
          </button>
        </div>
      )}

      {tab === "inputs" && (
        <div className="space-y-4">
          <div>
            <h2 className="font-semibold">{t("band.inputs")}</h2>
            <p className="text-sm text-muted">{t("band.inputsHelp")}</p>
          </div>

          <div>
            <p className="label">{t("band.quickAdd")}</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="btn btn-sm border-accent text-accent"
                onClick={() => update({ inputs: [...details.inputs, ...DRUM_KIT_KEYS.map(addPreset)] })}
              >
                {t("band.addDrumKit")}
              </button>
              {INPUT_PRESETS.map((p) => (
                <button key={p.key} type="button" className="btn btn-sm" onClick={() => update({ inputs: [...details.inputs, addPreset(p.key)] })}>
                  + {lang === "zh" ? p.zh : p.en}
                </button>
              ))}
            </div>
          </div>

          {details.inputs.length === 0 ? (
            <p className="text-sm text-muted">{t("band.noInputs")}</p>
          ) : (
            <ol className="divide-y divide-border rounded-lg border border-border">
              {details.inputs.map((input, i) => (
                <li key={input.id} className="grid grid-cols-[2.5rem_1fr_auto] gap-2 p-2 sm:grid-cols-[2.5rem_1.4fr_1fr_1fr_0.9fr_auto_auto] sm:items-center">
                  <span className="pt-2 text-center font-mono text-sm text-accent sm:pt-0">{i + 1}</span>
                  <input
                    className="input"
                    aria-label={t("band.source")}
                    placeholder={t("band.source")}
                    maxLength={60}
                    value={input.source}
                    onChange={(e) => patchInput(input.id, { source: e.target.value })}
                  />
                  <div className="flex items-center gap-1 sm:order-last">
                    <button type="button" className="btn btn-ghost btn-sm px-2" onClick={() => moveInput(i, -1)} disabled={i === 0} aria-label="↑">↑</button>
                    <button type="button" className="btn btn-ghost btn-sm px-2" onClick={() => moveInput(i, 1)} disabled={i === details.inputs.length - 1} aria-label="↓">↓</button>
                    <RemoveButton label={t("band.delete")} onClick={() => update({ inputs: details.inputs.filter((x) => x.id !== input.id) })} />
                  </div>
                  <div className="col-span-3 grid grid-cols-2 gap-2 sm:contents">
                    <select
                      className="input"
                      aria-label={t("band.kind")}
                      value={input.kind}
                      onChange={(e) => patchInput(input.id, { kind: e.target.value as InputItem["kind"] })}
                    >
                      {INPUT_KINDS.map((k) => (
                        <option key={k} value={k}>{t(`kind.${k}`)}</option>
                      ))}
                    </select>
                    <input
                      className="input"
                      aria-label={t("band.mic")}
                      placeholder={t("band.mic")}
                      maxLength={60}
                      value={input.mic}
                      onChange={(e) => patchInput(input.id, { mic: e.target.value })}
                    />
                    <select
                      className="input"
                      aria-label={t("band.stand")}
                      value={input.stand}
                      onChange={(e) => patchInput(input.id, { stand: e.target.value as InputItem["stand"] })}
                    >
                      {STAND_KINDS.map((k) => (
                        <option key={k} value={k}>{t(`stand.${k}`)}</option>
                      ))}
                    </select>
                    <label className="flex items-center gap-2 text-sm whitespace-nowrap">
                      <input
                        type="checkbox"
                        className="size-4 accent-[var(--accent)]"
                        checked={input.bandProvides}
                        onChange={(e) => patchInput(input.id, { bandProvides: e.target.checked })}
                      />
                      {t("band.bandProvides")}
                    </label>
                  </div>
                </li>
              ))}
            </ol>
          )}
          <button
            type="button"
            className="btn"
            disabled={details.inputs.length >= 64}
            onClick={() =>
              update({ inputs: [...details.inputs, { id: newItemId(), source: "", kind: "inst_mic", mic: "", stand: "none", bandProvides: false }] })
            }
          >
            + {t("band.addInput")}
          </button>
        </div>
      )}

      {tab === "monitors" && (
        <div className="space-y-4">
          <div>
            <h2 className="font-semibold">{t("band.monitors")}</h2>
            <p className="text-sm text-muted">{t("band.monitorsHelp")}</p>
          </div>
          {details.monitors.length === 0 && <p className="text-sm text-muted">{t("band.noMonitors")}</p>}
          {details.monitors.map((mix, i) => (
            <div key={mix.id} className="card grid gap-2 p-3 sm:grid-cols-[2rem_1fr_1fr_2fr_auto_auto] sm:items-center">
              <span className="font-mono text-sm text-accent">{i + 1}</span>
              <input className="input" placeholder={t("band.who")} aria-label={t("band.who")} maxLength={60} value={mix.who} onChange={(e) => patchMonitor(mix.id, { who: e.target.value })} />
              <select className="input" aria-label={t("band.kind")} value={mix.kind} onChange={(e) => patchMonitor(mix.id, { kind: e.target.value as MonitorMix["kind"] })}>
                {MONITOR_KINDS.map((k) => (
                  <option key={k} value={k}>{t(`monitor.${k}`)}</option>
                ))}
              </select>
              <input className="input" placeholder={t("band.wants")} aria-label={t("band.wants")} maxLength={200} value={mix.wants} onChange={(e) => patchMonitor(mix.id, { wants: e.target.value })} />
              <label className="flex items-center gap-2 text-sm whitespace-nowrap">
                <input type="checkbox" className="size-4 accent-[var(--accent)]" checked={mix.bandProvides} onChange={(e) => patchMonitor(mix.id, { bandProvides: e.target.checked })} />
                {t("band.bandProvides")}
              </label>
              <RemoveButton label={t("band.delete")} onClick={() => update({ monitors: details.monitors.filter((m) => m.id !== mix.id) })} />
            </div>
          ))}
          <button
            type="button"
            className="btn"
            disabled={details.monitors.length >= 16}
            onClick={() => update({ monitors: [...details.monitors, { id: newItemId(), who: "", kind: "wedge", wants: "", bandProvides: false }] })}
          >
            + {t("band.addMonitor")}
          </button>
        </div>
      )}

      {tab === "stage" && (
        <StagePlotEditor
          items={details.stagePlot}
          onChange={(stagePlot) => update({ stagePlot })}
          members={details.members}
          inputs={details.inputs}
          monitors={details.monitors}
        />
      )}

      {tab === "schedule" && schedule}
    </div>
  );
}

function Field({ label, hint, wide, children }: { label: string; hint?: string; wide?: boolean; children: ReactNode }) {
  return (
    <label className={`block ${wide ? "sm:col-span-2" : ""}`}>
      <span className="label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

function RemoveButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="btn btn-ghost btn-sm btn-danger px-2" onClick={onClick} aria-label={label}>
      ✕
    </button>
  );
}

function SaveIndicator({ state }: { state: SaveState }) {
  const { t } = useI18n();
  if (state === "idle") return <span className="text-xs text-muted"> </span>;
  const map: Record<Exclude<SaveState, "idle">, [string, string]> = {
    saving: ["text-muted", t("band.saving")],
    saved: ["text-ok", `✓ ${t("band.saved")}`],
    error: ["text-live", t("band.saveError")],
  };
  const [cls, text] = map[state];
  return (
    <span className={`text-xs ${cls}`} role="status">
      {text}
    </span>
  );
}
