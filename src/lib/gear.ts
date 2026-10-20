import { GEAR_KINDS, type GearKind, type InputItem, type MonitorMix } from "./domain";

export type GearCount = Record<GearKind, number>;

export const zeroGear = (): GearCount =>
  Object.fromEntries(GEAR_KINDS.map((k) => [k, 0])) as GearCount;

/** House gear one band needs on stage at the same time. */
export function bandGearNeeds(inputs: InputItem[], monitors: MonitorMix[]): GearCount {
  const need = zeroGear();

  for (const input of inputs) {
    if (!input.bandProvides) {
      switch (input.kind) {
        case "vocal":
          need.vocal_mic += 1;
          break;
        case "inst_mic":
          need.inst_mic += 1;
          break;
        case "condenser":
          need.condenser += 1;
          break;
        case "di":
          need.di += 1;
          break;
        case "stereo_di":
          need.di += 2;
          break;
        case "wireless":
          need.wireless += 1;
          break;
      }
    }
    // Stands are needed even when the band brings its own mic.
    if (input.stand === "tall") need.tall_stand += 1;
    if (input.stand === "short") need.short_stand += 1;
    if (input.stand === "clip") need.clip += 1;
  }

  for (const mix of monitors) {
    if (mix.bandProvides) continue;
    if (mix.kind === "wedge") need.wedge += 1;
    if (mix.kind === "iem") need.iem += 1;
  }

  return need;
}

export type Shortage = {
  kind: GearKind;
  have: number;
  need: number;
  /** Names of bands that need more than the venue has. */
  bands: string[];
};

export type GearReport = {
  /** Peak need across all bands: gear is reused, so the biggest band sets the bar. */
  peak: GearCount;
  shortages: Shortage[];
};

/**
 * Compare what each band needs with what the venue owns. Bands play one at a
 * time, so the requirement is the maximum over bands, not the sum.
 */
export function gearReport(
  bands: { name: string; inputs: InputItem[]; monitors: MonitorMix[] }[],
  have: GearCount,
): GearReport {
  const peak = zeroGear();
  const perBand = bands.map((b) => ({ name: b.name, need: bandGearNeeds(b.inputs, b.monitors) }));

  for (const { need } of perBand) {
    for (const kind of GEAR_KINDS) peak[kind] = Math.max(peak[kind], need[kind]);
  }

  const shortages: Shortage[] = GEAR_KINDS.filter((kind) => peak[kind] > have[kind]).map(
    (kind) => ({
      kind,
      have: have[kind],
      need: peak[kind],
      bands: perBand.filter((b) => b.need[kind] > have[kind]).map((b) => b.name),
    }),
  );

  return { peak, shortages };
}
