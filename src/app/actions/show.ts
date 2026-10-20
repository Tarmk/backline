"use server";

import { and, eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { requireUser } from "@/lib/auth";
import { getOwnedEvent } from "@/lib/data";
import { getDb, schema } from "@/lib/db";
import type { EventRow } from "@/lib/db/schema";

async function updateShow(eventId: string, patch: (event: EventRow) => Partial<EventRow> | null) {
  const user = await requireUser();
  const event = await getOwnedEvent(eventId, user.id);
  if (!event) return;
  const changes = patch(event);
  if (!changes) return;
  const db = await getDb();
  await db
    .update(schema.events)
    .set({ ...changes, updatedAt: new Date() })
    .where(eq(schema.events.id, eventId));
  refresh();
}

/** Mark `bandId` as on stage right now. Later bands are re-timed from this moment. */
export async function startBand(eventId: string, bandId: string) {
  const db = await getDb();
  const band = await db
    .select({ id: schema.bands.id })
    .from(schema.bands)
    .where(and(eq(schema.bands.id, bandId), eq(schema.bands.eventId, eventId)))
    .limit(1);
  if (!band.length) return;
  // The real start time now anchors the schedule, so the manual shift resets.
  await updateShow(eventId, () => ({
    liveStatus: "live",
    liveBandId: bandId,
    liveStartedAt: new Date(),
    delayMin: 0,
  }));
}

export async function shiftDelay(eventId: string, deltaMin: number) {
  const delta = Math.max(-60, Math.min(60, Math.round(deltaMin)));
  await updateShow(eventId, (e) =>
    e.liveStatus === "ended" ? null : { delayMin: Math.max(-120, Math.min(240, e.delayMin + delta)) },
  );
}

export async function endShow(eventId: string) {
  await updateShow(eventId, () => ({ liveStatus: "ended" }));
}

export async function resetShow(eventId: string) {
  await updateShow(eventId, () => ({
    liveStatus: "idle",
    liveBandId: null,
    liveStartedAt: null,
    delayMin: 0,
  }));
}
