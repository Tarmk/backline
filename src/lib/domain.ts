import { z } from "zod";

/** What kind of source an input channel is. Drives the gear check. */
export const INPUT_KINDS = [
  "vocal",
  "inst_mic",
  "condenser",
  "di",
  "stereo_di",
  "wireless",
] as const;
export type InputKind = (typeof INPUT_KINDS)[number];

export const STAND_KINDS = ["none", "tall", "short", "clip"] as const;
export type StandKind = (typeof STAND_KINDS)[number];

export const MONITOR_KINDS = ["wedge", "iem"] as const;
export type MonitorKind = (typeof MONITOR_KINDS)[number];

export const STAGE_KINDS = [
  "drums",
  "bass_amp",
  "guitar_amp",
  "keys",
  "vocal",
  "acoustic",
  "wedge",
  "di",
  "playback",
  "person",
  "power",
  "other",
] as const;
export type StageKind = (typeof STAGE_KINDS)[number];

/** Gear the venue owns, counted per kind. */
export const GEAR_KINDS = [
  "vocal_mic",
  "inst_mic",
  "condenser",
  "di",
  "wireless",
  "tall_stand",
  "short_stand",
  "clip",
  "wedge",
  "iem",
] as const;
export type GearKind = (typeof GEAR_KINDS)[number];

const id = z.string().min(1).max(64);
const shortText = (max: number) => z.string().trim().max(max);

export const memberSchema = z.object({
  id,
  name: shortText(80),
  role: shortText(80),
});
export type Member = z.infer<typeof memberSchema>;

export const inputSchema = z.object({
  id,
  source: shortText(60),
  kind: z.enum(INPUT_KINDS),
  mic: shortText(60),
  stand: z.enum(STAND_KINDS),
  bandProvides: z.boolean(),
});
export type InputItem = z.infer<typeof inputSchema>;

export const monitorSchema = z.object({
  id,
  who: shortText(60),
  kind: z.enum(MONITOR_KINDS),
  wants: shortText(200),
  bandProvides: z.boolean(),
});
export type MonitorMix = z.infer<typeof monitorSchema>;

export const stageItemSchema = z.object({
  id,
  kind: z.enum(STAGE_KINDS),
  label: shortText(40),
  // Normalised stage coordinates: x 0 = stage left edge (audience view), y 0 = upstage.
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  inputIds: z.array(id).max(32),
});
export type StageItem = z.infer<typeof stageItemSchema>;

/** Everything a band (or the organiser) can edit about a band. */
export const bandDetailsSchema = z.object({
  name: shortText(80).min(1),
  contactName: shortText(80),
  contactInfo: shortText(120),
  setMin: z.number().int().min(1).max(240),
  members: z.array(memberSchema).max(20),
  inputs: z.array(inputSchema).max(64),
  monitors: z.array(monitorSchema).max(16),
  stagePlot: z.array(stageItemSchema).max(60),
  bringing: shortText(1000),
  notes: shortText(2000),
});
export type BandDetails = z.infer<typeof bandDetailsSchema>;

export const emptyBandDetails = (name: string): BandDetails => ({
  name,
  contactName: "",
  contactInfo: "",
  setMin: 25,
  members: [],
  inputs: [],
  monitors: [],
  stagePlot: [],
  bringing: "",
  notes: "",
});

export const LIVE_STATUSES = ["idle", "live", "ended"] as const;
export type LiveStatus = (typeof LIVE_STATUSES)[number];

/** Small random id for list items created in the browser. */
export function newItemId(): string {
  return Math.random().toString(36).slice(2, 10);
}
