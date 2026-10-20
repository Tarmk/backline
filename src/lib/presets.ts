import type { InputKind, StandKind } from "./domain";

export type InputPreset = {
  key: string;
  en: string;
  zh: string;
  kind: InputKind;
  mic: string;
  stand: StandKind;
};

/** One-tap inputs for the band form. Source names are stored in the band's language. */
export const INPUT_PRESETS: InputPreset[] = [
  { key: "kick_in", en: "Kick In", zh: "底鼓 内", kind: "inst_mic", mic: "Beta 91A", stand: "none" },
  { key: "kick_out", en: "Kick Out", zh: "底鼓 外", kind: "inst_mic", mic: "Beta 52A", stand: "short" },
  { key: "snare_top", en: "Snare Top", zh: "军鼓 上", kind: "inst_mic", mic: "SM57", stand: "short" },
  { key: "snare_bottom", en: "Snare Bottom", zh: "军鼓 下", kind: "inst_mic", mic: "SM57", stand: "short" },
  { key: "hihat", en: "Hi-Hat", zh: "踩镲", kind: "condenser", mic: "SM81", stand: "short" },
  { key: "tom1", en: "Rack Tom", zh: "通鼓", kind: "inst_mic", mic: "Beta 98", stand: "clip" },
  { key: "floor_tom", en: "Floor Tom", zh: "落地通鼓", kind: "inst_mic", mic: "Beta 98", stand: "clip" },
  { key: "oh_l", en: "OH L", zh: "顶麦 左", kind: "condenser", mic: "", stand: "tall" },
  { key: "oh_r", en: "OH R", zh: "顶麦 右", kind: "condenser", mic: "", stand: "tall" },
  { key: "bass_di", en: "Bass DI", zh: "贝斯 DI", kind: "di", mic: "", stand: "none" },
  { key: "bass_mic", en: "Bass Amp", zh: "贝斯音箱", kind: "inst_mic", mic: "", stand: "short" },
  { key: "gtr_amp", en: "Guitar Amp", zh: "吉他音箱", kind: "inst_mic", mic: "SM57", stand: "short" },
  { key: "acoustic", en: "Acoustic DI", zh: "木吉他 DI", kind: "di", mic: "", stand: "none" },
  { key: "keys", en: "Keys L/R", zh: "键盘 L/R", kind: "stereo_di", mic: "", stand: "none" },
  { key: "playback", en: "Playback L/R", zh: "伴奏 L/R", kind: "stereo_di", mic: "", stand: "none" },
  { key: "lead_vox", en: "Lead Vox", zh: "主唱", kind: "vocal", mic: "SM58", stand: "tall" },
  { key: "bvox", en: "Backing Vox", zh: "和声", kind: "vocal", mic: "SM58", stand: "tall" },
  { key: "wireless_vox", en: "Wireless Vox", zh: "无线人声", kind: "wireless", mic: "", stand: "tall" },
];

/** A standard rock kit, added in one tap. */
export const DRUM_KIT_KEYS = [
  "kick_in",
  "snare_top",
  "hihat",
  "tom1",
  "floor_tom",
  "oh_l",
  "oh_r",
];
