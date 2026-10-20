"use client";

import Link from "next/link";
import { useOptimistic, useRef, useTransition } from "react";
import { removeBand, reorderBands } from "@/app/actions/events";
import type { BandStatus } from "@/lib/data";
import { CopyButton } from "./copy-button";
import { useI18n } from "./i18n-provider";

export type BandListItem = {
  id: string;
  name: string;
  status: BandStatus;
  setMin: number;
  inputCount: number;
  editPath: string;
  start: string;
};

const STATUS_STYLE: Record<BandStatus, string> = {
  notStarted: "bg-surface-2 text-muted",
  inProgress: "bg-info/15 text-info",
  submitted: "bg-ok/15 text-ok",
};

export function BandList({ eventId, bands }: { eventId: string; bands: BandListItem[] }) {
  const { t } = useI18n();
  const [order, setOrder] = useOptimistic(bands);
  const [, start] = useTransition();
  const dragId = useRef<string | null>(null);

  function commit(next: BandListItem[]) {
    start(async () => {
      setOrder(next);
      await reorderBands(eventId, next.map((b) => b.id));
    });
  }

  function move(index: number, by: number) {
    const target = index + by;
    if (target < 0 || target >= order.length) return;
    const next = [...order];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    commit(next);
  }

  function dropOn(targetId: string) {
    const from = order.findIndex((b) => b.id === dragId.current);
    const to = order.findIndex((b) => b.id === targetId);
    dragId.current = null;
    if (from < 0 || to < 0 || from === to) return;
    move(from, to - from);
  }

  if (order.length === 0) return <p className="text-sm text-muted">{t("event.noBands")}</p>;

  return (
    <ol className="divide-y divide-border rounded-lg border border-border">
      {order.map((band, i) => (
        <li
          key={band.id}
          draggable
          onDragStart={() => (dragId.current = band.id)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => dropOn(band.id)}
          className="flex flex-wrap items-center gap-x-3 gap-y-2 p-3"
        >
          <span className="cursor-grab text-muted select-none" aria-hidden="true" title="Drag">
            ⋮⋮
          </span>
          <span className="w-12 font-mono text-sm text-muted">{band.start}</span>
          <div className="min-w-0 flex-1">
            <Link href={`/dashboard/events/${eventId}/bands/${band.id}`} className="font-medium hover:text-accent">
              {band.name}
            </Link>
            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted">
              <span className={`badge ${STATUS_STYLE[band.status]}`}>{t(`event.status.${band.status}`)}</span>
              <span>{t("event.setLen", { n: band.setMin })}</span>
              <span>{t("event.inputs", { n: band.inputCount })}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => move(i, -1)} disabled={i === 0} aria-label={t("event.moveUp")}>
              ↑
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => move(i, 1)}
              disabled={i === order.length - 1}
              aria-label={t("event.moveDown")}
            >
              ↓
            </button>
            <CopyButton path={band.editPath} />
            <button
              type="button"
              className="btn btn-ghost btn-sm btn-danger"
              onClick={() => {
                if (window.confirm(t("event.removeConfirm", { name: band.name }))) {
                  start(async () => {
                    setOrder(order.filter((b) => b.id !== band.id));
                    await removeBand(eventId, band.id);
                  });
                }
              }}
              aria-label={t("event.remove")}
            >
              ✕
            </button>
          </div>
        </li>
      ))}
    </ol>
  );
}
