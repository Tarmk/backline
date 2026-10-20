import type { InputItem, Member, MonitorMix, StageItem, StageKind } from "./domain";

/** Stage drawing area in SVG units. y grows downstage (towards the audience). */
export const STAGE_W = 1000;
export const STAGE_H = 600;

const DRUM_RE = /kick|snare|hi-?hat|\btoms?\b|\boh\b|overhead|drum|cymbal|\bride\b|鼓|镲|顶麦/i;
const BASS_RE = /bass|贝斯|贝司/i;
const GUITAR_RE = /g(ui)?ta?r|吉他/i;
const ACOUSTIC_RE = /acoustic|木吉他/i;
const KEYS_RE = /key|synth|piano|键盘|合成器|钢琴/i;
const PLAYBACK_RE = /playback|track|laptop|伴奏|电脑|采样/i;

const clamp = (v: number) => Math.min(0.97, Math.max(0.03, v));

/** Spread `n` points evenly across [from, to]. */
function spread(n: number, from: number, to: number): number[] {
  if (n <= 0) return [];
  if (n === 1) return [(from + to) / 2];
  return Array.from({ length: n }, (_, i) => from + ((to - from) * i) / (n - 1));
}

export type AutoLabels = {
  drums: string;
  bass: string;
  guitar: string;
  acoustic: string;
  keys: string;
  playback: string;
  vocal: string;
  mix: string;
};

export const EN_AUTO_LABELS: AutoLabels = {
  drums: "Drums",
  bass: "Bass",
  guitar: "Guitar",
  acoustic: "Acoustic",
  keys: "Keys",
  playback: "Playback",
  vocal: "Vox",
  mix: "Mix",
};

/**
 * Build a sensible starting stage plot from what the band told us, so they
 * only have to drag things into place instead of drawing from nothing.
 * Inputs are linked to the item they belong to, so channel numbers show up
 * on the plot.
 */
export function autoPlace(
  members: Member[],
  inputs: InputItem[],
  monitors: MonitorMix[],
  makeId: () => string,
  labels: AutoLabels = EN_AUTO_LABELS,
): StageItem[] {
  const items: StageItem[] = [];
  const used = new Set<string>();
  const take = (re: RegExp, filter: (i: InputItem) => boolean = () => true) => {
    const ids = inputs.filter((i) => !used.has(i.id) && re.test(i.source) && filter(i)).map((i) => i.id);
    ids.forEach((id) => used.add(id));
    return ids;
  };
  const roles = members.map((m) => m.role);
  const hasRole = (re: RegExp) => roles.some((r) => re.test(r));
  const add = (kind: StageKind, label: string, x: number, y: number, inputIds: string[] = []) =>
    items.push({ id: makeId(), kind, label, x: clamp(x), y: clamp(y), inputIds });

  // Drums upstage centre.
  const drumInputs = take(DRUM_RE);
  if (drumInputs.length > 0 || hasRole(DRUM_RE)) add("drums", labels.drums, 0.5, 0.22, drumInputs);

  // Amps along the back line, either side of the drums.
  const bassInputs = take(BASS_RE);
  if (bassInputs.length > 0 || hasRole(BASS_RE)) add("bass_amp", labels.bass, 0.25, 0.2, bassInputs);

  const acousticInputs = take(ACOUSTIC_RE);
  const guitarInputs = take(GUITAR_RE);
  const guitarists = Math.max(
    members.filter((m) => GUITAR_RE.test(m.role) && !ACOUSTIC_RE.test(m.role)).length,
    guitarInputs.length,
  );
  spread(guitarists, 0.75, 0.88).forEach((x, i) =>
    add("guitar_amp", guitarists > 1 ? `${labels.guitar} ${i + 1}` : labels.guitar, x, 0.2, guitarInputs[i] ? [guitarInputs[i]] : []),
  );
  if (acousticInputs.length > 0) add("acoustic", labels.acoustic, 0.5, 0.52, acousticInputs);

  const keysInputs = take(KEYS_RE);
  if (keysInputs.length > 0 || hasRole(KEYS_RE)) add("keys", labels.keys, 0.12, 0.5, keysInputs);

  const playbackInputs = take(PLAYBACK_RE);
  if (playbackInputs.length > 0) add("playback", labels.playback, 0.88, 0.5, playbackInputs);

  // Vocal mics across the front, lead in the middle.
  const vocalInputs = inputs.filter(
    (i) => !used.has(i.id) && (i.kind === "vocal" || i.kind === "wireless"),
  );
  vocalInputs.forEach((i) => used.add(i.id));
  const vocalXs = spread(vocalInputs.length, 0.3, 0.7);
  const middleFirst = [...vocalXs].sort((a, b) => Math.abs(a - 0.5) - Math.abs(b - 0.5));
  vocalInputs.forEach((input, i) =>
    add("vocal", input.source || labels.vocal, middleFirst[i] ?? 0.5, 0.68, [input.id]),
  );

  // Anything left over (an unusual DI, say) goes stage left.
  const leftovers = inputs.filter((i) => !used.has(i.id));
  leftovers.forEach((input, i) =>
    add(input.kind === "di" || input.kind === "stereo_di" ? "di" : "other", input.source || "?", 0.06, 0.25 + i * 0.08, [input.id]),
  );

  // Wedges on the downstage edge, facing the band.
  const wedges = monitors.filter((m) => m.kind === "wedge");
  spread(wedges.length, 0.2, 0.8).forEach((x, i) => add("wedge", wedges[i].who || `${labels.mix} ${i + 1}`, x, 0.86));

  return items;
}

/** Map of input id → channel number (1-based position in the input list). */
export function channelNumbers(inputs: InputItem[]): Map<string, number> {
  return new Map(inputs.map((input, i) => [input.id, i + 1]));
}
