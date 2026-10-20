"use server";

import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { getBandByToken, getOwnedBand } from "@/lib/data";
import { getDb, schema } from "@/lib/db";
import { bandDetailsSchema, type BandDetails } from "@/lib/domain";

export type SaveResult = { ok: true } | { ok: false };

async function writeBand(bandId: string, details: unknown): Promise<SaveResult> {
  const parsed = bandDetailsSchema.safeParse(details);
  if (!parsed.success) return { ok: false };

  // Drop stage plot links to inputs that no longer exist.
  const inputIds = new Set(parsed.data.inputs.map((i) => i.id));
  const stagePlot = parsed.data.stagePlot.map((item) => ({
    ...item,
    inputIds: item.inputIds.filter((id) => inputIds.has(id)),
  }));

  const db = await getDb();
  await db
    .update(schema.bands)
    .set({ ...parsed.data, stagePlot, touchedAt: new Date() })
    .where(eq(schema.bands.id, bandId));
  return { ok: true };
}

async function writeSubmitted(bandId: string, submitted: boolean) {
  const db = await getDb();
  await db
    .update(schema.bands)
    .set({ submittedAt: submitted ? new Date() : null, touchedAt: new Date() })
    .where(eq(schema.bands.id, bandId));
}

/* Band side: authorised by the private link token. */

export async function saveBandByToken(token: string, details: BandDetails): Promise<SaveResult> {
  const found = await getBandByToken(token);
  if (!found) return { ok: false };
  return writeBand(found.band.id, details);
}

export async function setSubmittedByToken(token: string, submitted: boolean): Promise<SaveResult> {
  const found = await getBandByToken(token);
  if (!found) return { ok: false };
  await writeSubmitted(found.band.id, submitted);
  return { ok: true };
}

/* Organiser side: authorised by session + event ownership. */

export async function saveBandAsOrganiser(bandId: string, details: BandDetails): Promise<SaveResult> {
  const user = await requireUser();
  const found = await getOwnedBand(bandId, user.id);
  if (!found) return { ok: false };
  return writeBand(found.band.id, details);
}

export async function setSubmittedAsOrganiser(bandId: string, submitted: boolean): Promise<SaveResult> {
  const user = await requireUser();
  const found = await getOwnedBand(bandId, user.id);
  if (!found) return { ok: false };
  await writeSubmitted(found.band.id, submitted);
  return { ok: true };
}
