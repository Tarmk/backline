"use client";

import { useTransition } from "react";
import { endShow, resetShow, shiftDelay, startBand } from "@/app/actions/show";
import type { LiveStatus } from "@/lib/domain";
import type { SlotStatus } from "@/lib/schedule";
import { useI18n } from "./i18n-provider";

export function ShowControls({
  eventId,
  liveStatus,
  delayMin,
  bands,
}: {
  eventId: string;
  liveStatus: LiveStatus;
  delayMin: number;
  bands: { id: string; name: string; status: SlotStatus }[];
}) {
  const { t } = useI18n();
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<void>) => start(fn);

  const next = bands.find((b) => b.status === "next");
  const live = bands.find((b) => b.status === "live");

  return (
    <div className="space-y-5">
      {next && liveStatus !== "ended" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => startBand(eventId, next.id))}
          className="btn btn-primary h-16 w-full text-lg"
        >
          ▶ {liveStatus === "idle" ? t("show.startFirst", { band: next.name }) : t("show.start", { band: next.name })}
        </button>
      )}
      {!next && live && (
        <button
          type="button"
          disabled={pending}
          onClick={() => window.confirm(t("show.endConfirm")) && run(() => endShow(eventId))}
          className="btn btn-primary h-16 w-full text-lg"
        >
          ■ {t("show.end")}
        </button>
      )}

      {liveStatus !== "ended" && (
        <div>
          <p className="label">{t("show.delay")}</p>
          <div className="grid grid-cols-4 gap-2">
            {[-5, 5, 10, 15].map((d) => (
              <button key={d} type="button" className="btn" disabled={pending} onClick={() => run(() => shiftDelay(eventId, d))}>
                {d > 0 ? `+${d}` : d}
              </button>
            ))}
          </div>
          <p className="mt-2 text-sm text-muted">{t("show.delayNow", { n: delayMin > 0 ? `+${delayMin}` : delayMin })}</p>
        </div>
      )}

      {bands.length > 0 && (
        <div>
          <label className="label" htmlFor="jump">{t("show.jump")}</label>
          <select
            id="jump"
            className="input"
            value=""
            disabled={pending}
            onChange={(e) => e.target.value && run(() => startBand(eventId, e.target.value))}
          >
            <option value="">—</option>
            {bands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex flex-wrap gap-2 border-t border-border pt-4">
        {liveStatus !== "ended" && live && next && (
          <button type="button" className="btn btn-sm" disabled={pending} onClick={() => window.confirm(t("show.endConfirm")) && run(() => endShow(eventId))}>
            {t("show.end")}
          </button>
        )}
        {liveStatus !== "idle" && (
          <button type="button" className="btn btn-sm btn-danger" disabled={pending} onClick={() => window.confirm(t("show.resetConfirm")) && run(() => resetShow(eventId))}>
            {t("show.reset")}
          </button>
        )}
      </div>
    </div>
  );
}
