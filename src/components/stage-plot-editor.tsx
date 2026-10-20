"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { newItemId, STAGE_KINDS, type InputItem, type Member, type MonitorMix, type StageItem, type StageKind } from "@/lib/domain";
import { autoPlace, channelNumbers, STAGE_H, STAGE_W } from "@/lib/stageplot";
import { useI18n } from "./i18n-provider";
import { StagePlot } from "./stage-plot";

export function StagePlotEditor({
  items,
  onChange,
  members,
  inputs,
  monitors,
}: {
  items: StageItem[];
  onChange: (items: StageItem[]) => void;
  members: Member[];
  inputs: InputItem[];
  monitors: MonitorMix[];
}) {
  const { t } = useI18n();
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<{ id: string; dx: number; dy: number } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const channels = channelNumbers(inputs);
  const selected = items.find((i) => i.id === selectedId) ?? null;

  /** Pointer position in normalised stage coordinates. */
  function toStage(e: { clientX: number; clientY: number }) {
    const svg = svgRef.current!;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const p = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    return { x: p.x / STAGE_W, y: p.y / STAGE_H };
  }

  function onItemPointerDown(e: ReactPointerEvent<SVGGElement>, item: StageItem) {
    e.preventDefault();
    svgRef.current?.setPointerCapture(e.pointerId);
    const p = toStage(e);
    drag.current = { id: item.id, dx: item.x - p.x, dy: item.y - p.y };
    setSelectedId(item.id);
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d) return;
    const p = toStage(e);
    const clamp = (v: number) => Math.min(0.98, Math.max(0.02, v));
    onChange(items.map((i) => (i.id === d.id ? { ...i, x: clamp(p.x + d.dx), y: clamp(p.y + d.dy) } : i)));
  }

  function endDrag() {
    drag.current = null;
  }

  function update(id: string, patch: Partial<StageItem>) {
    onChange(items.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }

  function add(kind: StageKind) {
    const item: StageItem = { id: newItemId(), kind, label: t(`stage.kind.${kind}`), x: 0.5, y: 0.5, inputIds: [] };
    onChange([...items, item]);
    setSelectedId(item.id);
  }

  function auto() {
    if (items.length > 0 && !window.confirm(t("stage.autoConfirm"))) return;
    onChange(
      autoPlace(members, inputs, monitors, newItemId, {
        drums: t("stage.auto.drums"),
        bass: t("stage.auto.bass"),
        guitar: t("stage.auto.guitar"),
        acoustic: t("stage.auto.acoustic"),
        keys: t("stage.auto.keys"),
        playback: t("stage.auto.playback"),
        vocal: t("stage.auto.vocal"),
        mix: t("stage.auto.mix"),
      }),
    );
    setSelectedId(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="mr-auto text-sm text-muted">{t("stage.help")}</p>
        <button type="button" className="btn btn-primary btn-sm" onClick={auto}>
          ✨ {t("stage.auto")}
        </button>
      </div>

      <div
        className="overflow-hidden rounded-xl border border-border"
        onPointerDown={(e) => {
          // Tapping empty stage clears the selection.
          if (!(e.target as Element).closest("[data-stage-item]")) setSelectedId(null);
        }}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <StagePlot
          svgRef={svgRef}
          items={items}
          channels={channels}
          labels={{ audience: t("stage.audience"), back: t("stage.back") }}
          selectedId={selectedId}
          onItemPointerDown={onItemPointerDown}
        />
      </div>
      {items.length === 0 && <p className="text-sm text-muted">{t("stage.empty")}</p>}

      {selected && (
        <div className="card space-y-3 p-4">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="label" htmlFor="stage-label">{t("stage.label")}</label>
              <input
                id="stage-label"
                className="input"
                maxLength={40}
                value={selected.label}
                onChange={(e) => update(selected.id, { label: e.target.value })}
              />
            </div>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => {
                onChange(items.filter((i) => i.id !== selected.id));
                setSelectedId(null);
              }}
            >
              {t("stage.remove")}
            </button>
          </div>
          {inputs.length > 0 && (
            <div>
              <p className="label">{t("stage.channels")}</p>
              <div className="flex flex-wrap gap-2">
                {inputs.map((input) => {
                  const on = selected.inputIds.includes(input.id);
                  return (
                    <button
                      key={input.id}
                      type="button"
                      onClick={() =>
                        update(selected.id, {
                          inputIds: on ? selected.inputIds.filter((x) => x !== input.id) : [...selected.inputIds, input.id],
                        })
                      }
                      className={`badge border px-2.5 py-1 ${on ? "border-accent bg-accent/15 text-accent" : "border-border text-muted"}`}
                    >
                      {channels.get(input.id)} · {input.source || "—"}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <div>
        <p className="label">{t("stage.add")}</p>
        <div className="flex flex-wrap gap-2">
          {STAGE_KINDS.map((kind) => (
            <button key={kind} type="button" className="btn btn-sm" onClick={() => add(kind)}>
              + {t(`stage.kind.${kind}`)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
