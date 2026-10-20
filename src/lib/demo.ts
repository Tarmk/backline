import "server-only";
import { and, eq, lt } from "drizzle-orm";
import { getDb, schema } from "./db";
import { newItemId, type InputItem, type Member, type MonitorMix } from "./domain";
import { type GearCount } from "./gear";
import { INPUT_PRESETS } from "./presets";
import { autoPlace, EN_AUTO_LABELS } from "./stageplot";
import { hashPassword, randomToken } from "./password";

const GUEST_TTL_MS = 2 * 24 * 3600 * 1000;

function inputs(keys: string[], overrides: Partial<Record<number, Partial<InputItem>>> = {}): InputItem[] {
  return keys.map((key, i) => {
    const p = INPUT_PRESETS.find((x) => x.key === key)!;
    return {
      id: newItemId(),
      source: p.en,
      kind: p.kind,
      mic: p.mic,
      stand: p.stand,
      bandProvides: false,
      ...overrides[i],
    };
  });
}

const m = (name: string, role: string): Member => ({ id: newItemId(), name, role });
const mix = (who: string, wants: string, kind: MonitorMix["kind"] = "wedge", bandProvides = false): MonitorMix => ({
  id: newItemId(),
  who,
  kind,
  wants,
  bandProvides,
});

const KIT = ["kick_in", "snare_top", "hihat", "tom1", "floor_tom", "oh_l", "oh_r"];

type DemoBand = {
  name: string;
  contactName: string;
  contactInfo: string;
  setMin: number;
  members: Member[];
  inputs: InputItem[];
  monitors: MonitorMix[];
  bringing: string;
  notes: string;
  state: "submitted" | "inProgress" | "notStarted";
};

function demoBands(): DemoBand[] {
  return [
    {
      name: "The Night Owls",
      contactName: "Mia",
      contactInfo: "WeChat: nightowls_mia",
      setMin: 25,
      members: [m("Mia", "Vocals"), m("Leo", "Guitar"), m("Sam", "Bass"), m("Kai", "Drums")],
      inputs: inputs([...KIT, "bass_di", "gtr_amp", "lead_vox", "bvox"]),
      monitors: [mix("Mia", "Lots of vox, some guitar"), mix("Leo", "Guitar + vox"), mix("Kai", "Kick, bass, vox")],
      bringing: "Own guitar amp and pedalboard. Drummer brings snare + cymbals.",
      notes: "Last song has a long intro, please keep the stage dark.",
      state: "submitted",
    },
    {
      name: "回声 Echo",
      contactName: "林晓",
      contactInfo: "138 0000 0000",
      setMin: 30,
      members: [m("林晓", "主唱 / 木吉他"), m("阿杰", "吉他"), m("小米", "键盘"), m("大伟", "贝斯"), m("王鹏", "鼓")],
      inputs: inputs([...KIT, "bass_di", "gtr_amp", "acoustic", "keys", "lead_vox", "bvox"], {
        10: { bandProvides: true }, // keyboardist brings their own DI
        11: { source: "主唱" },
        12: { source: "和声" },
      }),
      monitors: [
        mix("林晓", "人声、木吉他", "iem", true),
        mix("阿杰", "吉他、人声"),
        mix("小米", "键盘、人声"),
        mix("王鹏", "底鼓、贝斯、人声"),
      ],
      bringing: "主唱自带入耳返听。键盘自带 DI。",
      notes: "",
      state: "submitted",
    },
    {
      name: "Static Bloom",
      contactName: "Jordan",
      contactInfo: "jordan@example.com",
      setMin: 25,
      members: [m("Jordan", "Vocals / Synth"), m("Ava", "Guitar"), m("Rui", "Guitar"), m("Nico", "Drums")],
      inputs: inputs([...KIT, "gtr_amp", "gtr_amp", "keys", "playback", "lead_vox", "bvox", "bvox"], {
        7: { source: "Guitar Amp 1" },
        8: { source: "Guitar Amp 2" },
        9: { source: "Synth L/R" },
      }),
      monitors: [mix("Jordan", "Click + tracks + vox", "iem"), mix("Ava", "Guitars"), mix("Rui", "Guitars + vox"), mix("Nico", "Click + tracks", "iem")],
      bringing: "Laptop for backing tracks and click.",
      notes: "We need 2 IEM packs for click.",
      state: "inProgress",
    },
    {
      name: "Paper Lanterns",
      contactName: "Hana",
      contactInfo: "WeChat: hana_pl",
      setMin: 20,
      members: [m("Hana", "Vocals / Acoustic"), m("Owen", "Cajón")],
      inputs: inputs(["acoustic", "kick_out", "lead_vox", "bvox"], {
        1: { source: "Cajón", stand: "short" },
      }),
      monitors: [mix("Hana", "Vox + guitar")],
      bringing: "Acoustic guitar with pickup.",
      notes: "Acoustic set, please keep it quiet between songs.",
      state: "submitted",
    },
    {
      name: "Kid Volt",
      contactName: "",
      contactInfo: "",
      setMin: 30,
      members: [],
      inputs: [],
      monitors: [],
      bringing: "",
      notes: "",
      state: "notStarted",
    },
  ];
}

const DEMO_GEAR: GearCount = {
  vocal_mic: 5,
  inst_mic: 8,
  condenser: 3,
  di: 3,
  wireless: 1,
  tall_stand: 8,
  short_stand: 6,
  clip: 2,
  wedge: 4,
  iem: 1,
};

/** Today's date in Shanghai, as YYYY-MM-DD. */
function todayInShanghai(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai" }).format(new Date());
}

/**
 * Create a throwaway guest organiser with a realistic sample event, so
 * visitors can click around without signing up. Old guests are cleaned up.
 */
export async function createDemoAccount(): Promise<{ userId: string; eventId: string }> {
  const db = await getDb();

  await db
    .delete(schema.users)
    .where(and(eq(schema.users.isGuest, true), lt(schema.users.createdAt, new Date(Date.now() - GUEST_TTL_MS))));

  const userId = crypto.randomUUID();
  await db.insert(schema.users).values({
    id: userId,
    email: `guest-${userId}@demo.backline.local`,
    name: "Demo organiser",
    passwordHash: await hashPassword(randomToken()),
    isGuest: true,
  });

  await db.insert(schema.gear).values(
    Object.entries(DEMO_GEAR).map(([kind, quantity]) => ({ userId, kind, quantity })),
  );

  const eventId = crypto.randomUUID();
  await db.insert(schema.events).values({
    id: eventId,
    userId,
    name: "Battle of the Bands",
    venue: "School Auditorium",
    date: todayInShanghai(),
    startTime: "19:00",
    timezone: "Asia/Shanghai",
    changeoverMin: 15,
    publicId: randomToken(9),
  });

  const now = new Date();
  await db.insert(schema.bands).values(
    demoBands().map((b, position) => ({
      id: crypto.randomUUID(),
      eventId,
      editToken: randomToken(),
      position,
      name: b.name,
      contactName: b.contactName,
      contactInfo: b.contactInfo,
      setMin: b.setMin,
      members: b.members,
      inputs: b.inputs,
      monitors: b.monitors,
      stagePlot: b.inputs.length ? autoPlace(b.members, b.inputs, b.monitors, newItemId, EN_AUTO_LABELS) : [],
      bringing: b.bringing,
      notes: b.notes,
      submittedAt: b.state === "submitted" ? now : null,
      touchedAt: b.state === "notStarted" ? null : now,
    })),
  );

  return { userId, eventId };
}
