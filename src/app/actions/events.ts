"use server";

import { and, eq, max } from "drizzle-orm";
import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { getOwnedEvent } from "@/lib/data";
import { getDb, schema } from "@/lib/db";
import { GEAR_KINDS } from "@/lib/domain";
import { randomToken } from "@/lib/password";
import { TIMEZONES } from "@/lib/time";

const eventSchema = z.object({
  name: z.string().trim().min(1).max(120),
  venue: z.string().trim().max(120),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  timezone: z.enum(TIMEZONES),
  changeoverMin: z.coerce.number().int().min(0).max(120),
});

function readEventForm(form: FormData) {
  return eventSchema.safeParse({
    name: form.get("name"),
    venue: form.get("venue") ?? "",
    date: form.get("date"),
    startTime: form.get("startTime"),
    timezone: form.get("timezone") ?? "Asia/Shanghai",
    changeoverMin: form.get("changeoverMin") ?? 15,
  });
}

export type FormResult = { ok?: boolean; error?: boolean };

export async function createEvent(_: FormResult, form: FormData): Promise<FormResult> {
  const user = await requireUser();
  const parsed = readEventForm(form);
  if (!parsed.success) return { error: true };

  const db = await getDb();
  const id = crypto.randomUUID();
  await db.insert(schema.events).values({ id, userId: user.id, publicId: randomToken(9), ...parsed.data });
  redirect(`/dashboard/events/${id}`);
}

export async function updateEvent(eventId: string, _: FormResult, form: FormData): Promise<FormResult> {
  const user = await requireUser();
  if (!(await getOwnedEvent(eventId, user.id))) return { error: true };
  const parsed = readEventForm(form);
  if (!parsed.success) return { error: true };

  const db = await getDb();
  await db
    .update(schema.events)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(schema.events.id, eventId));
  refresh();
  return { ok: true };
}

export async function deleteEvent(eventId: string) {
  const user = await requireUser();
  const db = await getDb();
  await db
    .delete(schema.events)
    .where(and(eq(schema.events.id, eventId), eq(schema.events.userId, user.id)));
  redirect("/dashboard");
}

export async function addBand(eventId: string, form: FormData) {
  const user = await requireUser();
  if (!(await getOwnedEvent(eventId, user.id))) return;
  const name = String(form.get("name") ?? "").trim().slice(0, 80);
  if (!name) return;

  const db = await getDb();
  const [{ last }] = await db
    .select({ last: max(schema.bands.position) })
    .from(schema.bands)
    .where(eq(schema.bands.eventId, eventId));
  await db.insert(schema.bands).values({
    id: crypto.randomUUID(),
    eventId,
    editToken: randomToken(),
    position: (last ?? -1) + 1,
    name,
  });
  refresh();
}

export async function removeBand(eventId: string, bandId: string) {
  const user = await requireUser();
  if (!(await getOwnedEvent(eventId, user.id))) return;
  const db = await getDb();
  await db
    .delete(schema.bands)
    .where(and(eq(schema.bands.id, bandId), eq(schema.bands.eventId, eventId)));
  refresh();
}

/** Save a new running order. `orderedIds` must be exactly the event's bands. */
export async function reorderBands(eventId: string, orderedIds: string[]) {
  const user = await requireUser();
  if (!(await getOwnedEvent(eventId, user.id))) return;
  const db = await getDb();
  const current = await db
    .select({ id: schema.bands.id })
    .from(schema.bands)
    .where(eq(schema.bands.eventId, eventId));
  const known = new Set(current.map((b) => b.id));
  if (orderedIds.length !== known.size || !orderedIds.every((id) => known.has(id))) return;

  await db.transaction(async (tx) => {
    for (const [position, id] of orderedIds.entries()) {
      await tx.update(schema.bands).set({ position }).where(eq(schema.bands.id, id));
    }
  });
  refresh();
}

export async function saveGear(_: FormResult, form: FormData): Promise<FormResult> {
  const user = await requireUser();
  const db = await getDb();
  const rows = GEAR_KINDS.map((kind) => ({
    userId: user.id,
    kind,
    quantity: Math.max(0, Math.min(999, Math.floor(Number(form.get(kind)) || 0))),
  }));
  await db.transaction(async (tx) => {
    await tx.delete(schema.gear).where(eq(schema.gear.userId, user.id));
    await tx.insert(schema.gear).values(rows);
  });
  refresh();
  return { ok: true };
}
