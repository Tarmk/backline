"use client";

import { useEffect, useRef, useState } from "react";
import type { LiveSnapshot } from "@/lib/data";
import { formatClock, formatDuration } from "@/lib/time";
import { useI18n } from "./i18n-provider";

const POLL_MS = 4000;

type Slot = LiveSnapshot["slots"][number];

/** Keeps a live snapshot fresh by polling, and corrects for phones with a wrong clock. */
function useLiveSnapshot(publicId: string, initial: LiveSnapshot) {
  const [polled, setPolled] = useState<LiveSnapshot | null>(null);
  const [offline, setOffline] = useState(false);
  const [receivedAt, setReceivedAt] = useState<number | null>(null);
  // Server time minus local time, so countdowns match the venue, not the phone.
  const skew = useRef(0);

  // Whichever is newer wins: our last poll, or a fresh render after a server action.
  const snap = polled && polled.serverNow > initial.serverNow ? polled : initial;

  useEffect(() => {
    skew.current = initial.serverNow - Date.now();
  }, [initial]);

  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;

    async function poll() {
      try {
        const res = await fetch(`/api/live/${publicId}`, { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const next = (await res.json()) as LiveSnapshot;
        if (stopped) return;
        skew.current = next.serverNow - Date.now();
        setPolled(next);
        setOffline(false);
        setReceivedAt(Date.now());
      } catch {
        if (!stopped) setOffline(true);
      }
      if (!stopped) timer = setTimeout(poll, POLL_MS);
    }

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        clearTimeout(timer);
        poll();
      }
    };
    timer = setTimeout(poll, POLL_MS);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stopped = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [publicId]);

  return { snap, offline, receivedAt, skew };
}

/**
 * Current time (venue-corrected), ticking every second. Null until mounted, so
 * the server render and the first browser render match.
 */
function useNow(skew: React.RefObject<number>) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now() + skew.current);
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [skew]);
  return now;
}

export function LiveBoard({
  publicId,
  initial,
  highlightBandId,
  compact = false,
}: {
  publicId: string;
  initial: LiveSnapshot;
  /** Band portal: highlight this band's own slot. */
  highlightBandId?: string;
  compact?: boolean;
}) {
  const { t } = useI18n();
  const { snap, offline, receivedAt, skew } = useLiveSnapshot(publicId, initial);
  const now = useNow(skew);
  const tz = snap.timezone;

  const live = snap.slots.find((s) => s.status === "live");
  const next = snap.slots.find((s) => s.status === "next");
  const late = (s: Slot) => Math.trunc((s.expectedStart - s.plannedStart) / 60000);

  return (
    <div className="space-y-4">
      {offline && receivedAt !== null && (
        <p className="rounded-lg border border-warn/40 bg-warn/10 px-3 py-2 text-sm text-warn" role="status">
          {t("live.offline")} · {t("live.updated", { t: formatClock(receivedAt, Intl.DateTimeFormat().resolvedOptions().timeZone) })}
        </p>
      )}

      {snap.liveStatus === "ended" && <div className="card p-6 text-center text-xl font-semibold">{t("live.ended")}</div>}
      {snap.liveStatus === "idle" && !compact && <p className="text-muted">{t("live.notStarted")}</p>}

      {live && (
        <div className="card border-live/50 p-5">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-widest text-live uppercase">
            <span className="size-2 animate-pulse rounded-full bg-live" />
            {t("live.onNow")}
          </div>
          <div className={`mt-1 font-bold ${compact ? "text-2xl" : "text-4xl"}`}>{live.name}</div>
          <div className="mt-1 min-h-7 font-mono text-lg tabular-nums">
            {now === null ? null : now < live.expectedEnd ? (
              <span className="text-muted">{t("live.endsIn", { t: formatDuration(live.expectedEnd - now) })}</span>
            ) : (
              <span className="text-live">{t("live.over", { t: formatDuration(now - live.expectedEnd) })}</span>
            )}
          </div>
          <Progress start={live.expectedStart} end={live.expectedEnd} now={now ?? live.expectedStart} />
        </div>
      )}

      {next && (
        <div className="card p-5">
          <div className="text-xs font-semibold tracking-widest text-accent uppercase">{t("live.next")}</div>
          <div className={`mt-1 font-semibold ${compact ? "text-xl" : "text-3xl"}`}>{next.name}</div>
          <div className="mt-1 flex flex-wrap items-center gap-3 font-mono tabular-nums">
            <span>{formatClock(next.expectedStart, tz)}</span>
            {now !== null && (
              <span className="text-muted">
                {next.expectedStart > now ? t("live.startsIn", { t: formatDuration(next.expectedStart - now) }) : t("live.startingNow")}
              </span>
            )}
            <LateBadge min={late(next)} />
          </div>
        </div>
      )}

      <div>
        <h2 className="label">{t("live.runningOrder")}</h2>
        <ol className="card divide-y divide-border">
          {snap.slots.map((s) => (
            <li
              key={s.bandId}
              className={`flex items-center gap-3 px-4 py-3 ${s.status === "done" ? "opacity-50" : ""} ${
                s.bandId === highlightBandId ? "bg-accent/10" : ""
              }`}
            >
              <span className="w-12 font-mono text-sm tabular-nums">{formatClock(s.expectedStart, tz)}</span>
              <span className="min-w-0 flex-1 truncate font-medium">
                {s.name}
                {s.bandId === highlightBandId && <span className="ml-2 text-xs text-accent">← {t("band.yourSlot")}</span>}
              </span>
              {s.status === "live" && <span className="badge bg-live/15 text-live">{t("live.onNow")}</span>}
              {s.status === "next" && <span className="badge bg-accent/15 text-accent">{t("live.next")}</span>}
              {s.status === "done" && <span className="badge text-muted">{t("live.done")}</span>}
              {(s.status === "upcoming" || s.status === "next") && <LateBadge min={late(s)} />}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function LateBadge({ min }: { min: number }) {
  const { t } = useI18n();
  if (min === 0) return null;
  return (
    <span className={`badge ${min > 0 ? "bg-warn/15 text-warn" : "bg-ok/15 text-ok"}`}>
      {min > 0 ? t("live.late", { n: min }) : t("live.early", { n: min })}
    </span>
  );
}

function Progress({ start, end, now }: { start: number; end: number; now: number }) {
  const pct = Math.min(100, Math.max(0, ((now - start) / Math.max(1, end - start)) * 100));
  return (
    <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-2">
      <div className={`h-full ${pct >= 100 ? "bg-live" : "bg-accent"}`} style={{ width: `${pct}%` }} />
    </div>
  );
}
