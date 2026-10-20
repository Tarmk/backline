import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import { bandDetailsSchema } from "@/lib/domain";
import { buildSnapshot, getBandByToken, getBands, getGear, getOwnedEvent, listEvents } from "@/lib/data";
import { getDb, schema } from "@/lib/db";
import { createDemoAccount } from "@/lib/demo";
import { gearReport } from "@/lib/gear";
import { hashPassword, verifyPassword } from "@/lib/password";

/**
 * Runs the real data layer and migrations against an in-memory PGlite
 * Postgres (see vitest.config.ts), so SQL mistakes show up here, not at a gig.
 */
describe("data layer (in-memory Postgres)", () => {
  let demo: { userId: string; eventId: string };

  beforeAll(async () => {
    demo = await createDemoAccount();
  });

  it("seeds a demo event with five bands in order", async () => {
    const bands = await getBands(demo.eventId);
    expect(bands.map((b) => b.position)).toEqual([0, 1, 2, 3, 4]);
    expect(bands[0].name).toBe("The Night Owls");
  });

  it("stores band details that pass validation", async () => {
    for (const band of await getBands(demo.eventId)) {
      const { success } = bandDetailsSchema.safeParse({ ...band });
      expect(success, band.name).toBe(true);
    }
  });

  it("only returns events to their owner", async () => {
    expect(await getOwnedEvent(demo.eventId, demo.userId)).not.toBeNull();
    expect(await getOwnedEvent(demo.eventId, "someone-else")).toBeNull();
  });

  it("counts bands and submissions per event", async () => {
    const [event] = await listEvents(demo.userId);
    expect(event.bandCount).toBe(5);
    expect(event.submittedCount).toBe(3);
  });

  it("finds a band by its private link token", async () => {
    const [band] = await getBands(demo.eventId);
    const found = await getBandByToken(band.editToken);
    expect(found?.band.id).toBe(band.id);
    expect(await getBandByToken("not-a-token")).toBeNull();
  });

  it("flags the demo's gear shortages", async () => {
    const report = gearReport(await getBands(demo.eventId), await getGear(demo.userId));
    expect(report.shortages.map((s) => s.kind).sort()).toEqual(["di", "iem"]);
    // Echo's keyboardist brings their own DI, so only Static Bloom is short.
    expect(report.shortages.find((s) => s.kind === "di")?.bands).toEqual(["Static Bloom"]);
  });

  it("builds a JSON-safe live snapshot", async () => {
    const db = await getDb();
    const [event] = await db.select().from(schema.events).where(eq(schema.events.id, demo.eventId));
    const snap = buildSnapshot(event, await getBands(demo.eventId));
    expect(JSON.parse(JSON.stringify(snap))).toEqual(snap);
    expect(snap.slots).toHaveLength(5);
    expect(snap.slots[0].status).toBe("next");
  });

  it("deletes bands when their event is deleted", async () => {
    const db = await getDb();
    await db.delete(schema.events).where(eq(schema.events.id, demo.eventId));
    expect(await getBands(demo.eventId)).toEqual([]);
  });
});

describe("passwords", () => {
  it("verifies the right password and rejects the wrong one", async () => {
    const hash = await hashPassword("correct horse");
    expect(hash).not.toContain("correct horse");
    expect(await verifyPassword("correct horse", hash)).toBe(true);
    expect(await verifyPassword("wrong", hash)).toBe(false);
    expect(await verifyPassword("anything", "garbage")).toBe(false);
  });
});
