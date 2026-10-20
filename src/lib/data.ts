import "server-only";
import { and, asc, count, desc, eq, isNotNull } from "drizzle-orm";
import { getDb, schema } from "./db";
import type { BandRow, EventRow } from "./db/schema";
import { GEAR_KINDS, type GearKind } from "./domain";
import { zeroGear, type GearCount } from "./gear";
import { computeSchedule, type SlotStatus } from "./schedule";

export async function listEvents(userId: string) {
  const db = await getDb();
  const rows = await db
    .select()
    .from(schema.events)
    .where(eq(schema.events.userId, userId))
    .orderBy(desc(schema.events.date), desc(schema.events.createdAt));

  const bandCounts = await db
    .select({ eventId: schema.bands.eventId, n: count() })
    .from(schema.bands)
    .innerJoin(schema.events, eq(schema.events.id, schema.bands.eventId))
    .where(eq(schema.events.userId, userId))
    .groupBy(schema.bands.eventId);
  const submittedCounts = await db
    .select({ eventId: schema.bands.eventId, n: count() })
    .from(schema.bands)
    .innerJoin(schema.events, eq(schema.events.id, schema.bands.eventId))
    .where(and(eq(schema.events.userId, userId), isNotNull(schema.bands.submittedAt)))
    .groupBy(schema.bands.eventId);

  const byId = (list: { eventId: string; n: number }[]) =>
    new Map(list.map((r) => [r.eventId, Number(r.n)]));
  const bandsBy = byId(bandCounts);
  const submittedBy = byId(submittedCounts);

  return rows.map((e) => ({
    ...e,
    bandCount: bandsBy.get(e.id) ?? 0,
    submittedCount: submittedBy.get(e.id) ?? 0,
  }));
}

/** An event, only if it belongs to `userId`. */
export async function getOwnedEvent(eventId: string, userId: string): Promise<EventRow | null> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(schema.events)
    .where(and(eq(schema.events.id, eventId), eq(schema.events.userId, userId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function getBands(eventId: string): Promise<BandRow[]> {
  const db = await getDb();
  return db
    .select()
    .from(schema.bands)
    .where(eq(schema.bands.eventId, eventId))
    .orderBy(asc(schema.bands.position), asc(schema.bands.createdAt));
}

/** A band the organiser `userId` owns, with its event. */
export async function getOwnedBand(bandId: string, userId: string) {
  const db = await getDb();
  const rows = await db
    .select({ band: schema.bands, event: schema.events })
    .from(schema.bands)
    .innerJoin(schema.events, eq(schema.events.id, schema.bands.eventId))
    .where(and(eq(schema.bands.id, bandId), eq(schema.events.userId, userId)))
    .limit(1);
  return rows[0] ?? null;
}

/** A band by its private edit link token, with its event. */
export async function getBandByToken(token: string) {
  const db = await getDb();
  const rows = await db
    .select({ band: schema.bands, event: schema.events })
    .from(schema.bands)
    .innerJoin(schema.events, eq(schema.events.id, schema.bands.eventId))
    .where(eq(schema.bands.editToken, token))
    .limit(1);
  return rows[0] ?? null;
}

export async function getGear(userId: string): Promise<GearCount> {
  const db = await getDb();
  const rows = await db.select().from(schema.gear).where(eq(schema.gear.userId, userId));
  const counts = zeroGear();
  for (const row of rows) {
    if ((GEAR_KINDS as readonly string[]).includes(row.kind)) counts[row.kind as GearKind] = row.quantity;
  }
  return counts;
}

export async function hasGearList(userId: string): Promise<boolean> {
  const db = await getDb();
  const rows = await db
    .select({ n: count() })
    .from(schema.gear)
    .where(eq(schema.gear.userId, userId));
  return Number(rows[0]?.n ?? 0) > 0;
}

/** JSON-safe snapshot of the live schedule, shared by the public page, band portal and show control. */
export type LiveSnapshot = {
  eventName: string;
  venue: string;
  date: string;
  timezone: string;
  liveStatus: EventRow["liveStatus"];
  delayMin: number;
  serverNow: number;
  slots: {
    bandId: string;
    name: string;
    setMin: number;
    plannedStart: number;
    plannedEnd: number;
    expectedStart: number;
    expectedEnd: number;
    status: SlotStatus;
  }[];
};

export function buildSnapshot(event: EventRow, bands: BandRow[]): LiveSnapshot {
  const slots = computeSchedule(event, bands);
  return {
    eventName: event.name,
    venue: event.venue,
    date: event.date,
    timezone: event.timezone,
    liveStatus: event.liveStatus,
    delayMin: event.delayMin,
    serverNow: Date.now(),
    slots: slots.map((s, i) => ({
      bandId: s.bandId,
      name: bands[i].name,
      setMin: bands[i].setMin,
      plannedStart: s.plannedStart.getTime(),
      plannedEnd: s.plannedEnd.getTime(),
      expectedStart: s.expectedStart.getTime(),
      expectedEnd: s.expectedEnd.getTime(),
      status: s.status,
    })),
  };
}

export async function getEventByPublicId(publicId: string): Promise<EventRow | null> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(schema.events)
    .where(eq(schema.events.publicId, publicId))
    .limit(1);
  return rows[0] ?? null;
}

export async function getLiveSnapshot(publicId: string): Promise<LiveSnapshot | null> {
  const event = await getEventByPublicId(publicId);
  if (!event) return null;
  return buildSnapshot(event, await getBands(event.id));
}

export type BandStatus = "notStarted" | "inProgress" | "submitted";

export function bandStatus(band: Pick<BandRow, "submittedAt" | "touchedAt">): BandStatus {
  if (band.submittedAt) return "submitted";
  if (band.touchedAt) return "inProgress";
  return "notStarted";
}
