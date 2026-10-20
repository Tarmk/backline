import type { LiveStatus } from "./domain";
import { zonedToUtc } from "./time";

export type ScheduleEvent = {
  date: string;
  startTime: string;
  timezone: string;
  changeoverMin: number;
  delayMin: number;
  liveStatus: LiveStatus;
  liveBandId: string | null;
  liveStartedAt: Date | null;
};

export type ScheduleBand = { id: string; setMin: number };

export type SlotStatus = "done" | "live" | "next" | "upcoming";

export type Slot = {
  bandId: string;
  plannedStart: Date;
  plannedEnd: Date;
  /** Best current estimate, after delays and the real start of the live band. */
  expectedStart: Date;
  expectedEnd: Date;
  status: SlotStatus;
};

const MIN = 60_000;

/**
 * Work out the running order times.
 *
 * Planned times come straight from the start time, set lengths and changeover.
 * Expected times shift with reality: once a band has actually started, every
 * later band is timed from that real start. `delayMin` is an extra manual
 * shift for everything that hasn't started yet ("we're running 10 late").
 */
export function computeSchedule(event: ScheduleEvent, bands: ScheduleBand[]): Slot[] {
  const start = zonedToUtc(event.date, event.startTime, event.timezone).getTime();
  const changeover = event.changeoverMin * MIN;
  const delay = event.delayMin * MIN;

  const liveIndex =
    event.liveStatus === "live" ? bands.findIndex((b) => b.id === event.liveBandId) : -1;

  const slots: Slot[] = [];
  let planned = start;
  let expected = start + delay;

  bands.forEach((band, i) => {
    const length = band.setMin * MIN;
    const plannedStart = planned;
    planned += length + changeover;

    let expectedStart: number;
    if (i === liveIndex && event.liveStartedAt) {
      expectedStart = event.liveStartedAt.getTime();
    } else if (liveIndex >= 0 && i > liveIndex) {
      expectedStart = expected + (i === liveIndex + 1 ? delay : 0);
    } else if (liveIndex >= 0 && i < liveIndex) {
      expectedStart = plannedStart;
    } else {
      expectedStart = expected;
    }
    expected = expectedStart + length + changeover;

    let status: SlotStatus;
    if (event.liveStatus === "ended") status = "done";
    else if (liveIndex < 0) status = i === 0 && event.liveStatus === "idle" ? "next" : "upcoming";
    else if (i < liveIndex) status = "done";
    else if (i === liveIndex) status = "live";
    else status = i === liveIndex + 1 ? "next" : "upcoming";

    slots.push({
      bandId: band.id,
      plannedStart: new Date(plannedStart),
      plannedEnd: new Date(plannedStart + length),
      expectedStart: new Date(expectedStart),
      expectedEnd: new Date(expectedStart + length),
      status,
    });
  });

  return slots;
}

/** Minutes the expected time is behind (positive) or ahead of (negative) the plan. */
export function lateByMin(slot: Slot): number {
  // Truncate like the clock does, so "16:07" and "+7 min" agree.
  return Math.trunc((slot.expectedStart.getTime() - slot.plannedStart.getTime()) / MIN);
}
