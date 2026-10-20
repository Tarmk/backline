import { describe, expect, it } from "vitest";
import { computeSchedule, lateByMin, type ScheduleEvent } from "@/lib/schedule";

const base: ScheduleEvent = {
  date: "2026-10-25",
  startTime: "19:00",
  timezone: "Asia/Shanghai",
  changeoverMin: 15,
  delayMin: 0,
  liveStatus: "idle",
  liveBandId: null,
  liveStartedAt: null,
};

const bands = [
  { id: "a", setMin: 25 },
  { id: "b", setMin: 30 },
  { id: "c", setMin: 20 },
];

// 19:00 in Shanghai (UTC+8) is 11:00 UTC.
const at = (hhmm: string) => new Date(`2026-10-25T${hhmm}:00Z`).getTime();
const MIN = 60_000;

describe("computeSchedule", () => {
  it("lays out planned times from start, set lengths and changeovers", () => {
    const slots = computeSchedule(base, bands);
    expect(slots.map((s) => s.plannedStart.getTime())).toEqual([at("11:00"), at("11:40"), at("12:25")]);
    expect(slots.map((s) => s.plannedEnd.getTime())).toEqual([at("11:25"), at("12:10"), at("12:45")]);
  });

  it("marks the first band as next before the show starts", () => {
    const slots = computeSchedule(base, bands);
    expect(slots.map((s) => s.status)).toEqual(["next", "upcoming", "upcoming"]);
  });

  it("shifts every band by a manual delay before the show", () => {
    const slots = computeSchedule({ ...base, delayMin: 10 }, bands);
    expect(slots.map(lateByMin)).toEqual([10, 10, 10]);
  });

  it("re-times later bands from the live band's real start", () => {
    const started = new Date(at("11:48")); // band b started 8 minutes late
    const slots = computeSchedule(
      { ...base, liveStatus: "live", liveBandId: "b", liveStartedAt: started },
      bands,
    );
    expect(slots.map((s) => s.status)).toEqual(["done", "live", "next"]);
    expect(slots[1].expectedStart.getTime()).toBe(started.getTime());
    // c = b's real start + 30 min set + 15 min changeover
    expect(slots[2].expectedStart.getTime()).toBe(started.getTime() + 45 * MIN);
    expect(lateByMin(slots[2])).toBe(8);
  });

  it("applies a manual delay on top of the live band, only to later bands", () => {
    const started = new Date(at("11:40"));
    const slots = computeSchedule(
      { ...base, liveStatus: "live", liveBandId: "b", liveStartedAt: started, delayMin: 5 },
      bands,
    );
    expect(lateByMin(slots[1])).toBe(0);
    expect(lateByMin(slots[2])).toBe(5);
  });

  it("marks everything done when the show has ended", () => {
    const slots = computeSchedule({ ...base, liveStatus: "ended" }, bands);
    expect(slots.every((s) => s.status === "done")).toBe(true);
  });

  it("handles an event with no bands", () => {
    expect(computeSchedule(base, [])).toEqual([]);
  });
});
