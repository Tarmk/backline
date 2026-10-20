import { describe, expect, it } from "vitest";
import { channelRanges } from "@/components/stage-plot";
import type { InputItem, Member, MonitorMix } from "@/lib/domain";
import { stageItemSchema } from "@/lib/domain";
import { autoPlace, channelNumbers } from "@/lib/stageplot";

const input = (id: string, source: string, kind: InputItem["kind"] = "inst_mic"): InputItem => ({
  id,
  source,
  kind,
  mic: "",
  stand: "none",
  bandProvides: false,
});
const member = (role: string): Member => ({ id: role, name: role, role });
const wedge = (who: string): MonitorMix => ({ id: who, who, kind: "wedge", wants: "", bandProvides: false });

let counter = 0;
const makeId = () => `s${counter++}`;

describe("autoPlace", () => {
  const inputs = [
    input("k", "Kick In"),
    input("s", "Snare Top"),
    input("sb", "Snare Bottom"),
    input("oh", "OH L"),
    input("b", "Bass DI", "di"),
    input("g", "Guitar Amp"),
    input("v1", "Lead Vox", "vocal"),
    input("v2", "Backing Vox", "vocal"),
  ];
  const plot = autoPlace([member("Drums"), member("Bass"), member("Guitar")], inputs, [wedge("Vox"), wedge("Drums")], makeId);
  const byKind = (kind: string) => plot.filter((i) => i.kind === kind);

  it("groups all drum inputs onto one kit", () => {
    expect(byKind("drums")).toHaveLength(1);
    expect(byKind("drums")[0].inputIds.sort()).toEqual(["k", "oh", "s", "sb"]);
  });

  it("places amps, one mic per vocalist, and wedges", () => {
    expect(byKind("bass_amp")[0].inputIds).toEqual(["b"]);
    expect(byKind("guitar_amp")[0].inputIds).toEqual(["g"]);
    expect(byKind("vocal").map((v) => v.inputIds[0]).sort()).toEqual(["v1", "v2"]);
    expect(byKind("wedge")).toHaveLength(2);
  });

  it("links every input to exactly one item", () => {
    const linked = plot.flatMap((i) => i.inputIds);
    expect(linked.sort()).toEqual(inputs.map((i) => i.id).sort());
  });

  it("produces items that pass validation (inside the stage)", () => {
    for (const item of plot) expect(stageItemSchema.safeParse(item).success).toBe(true);
  });

  it("puts drums upstage and vocals downstage", () => {
    expect(byKind("drums")[0].y).toBeLessThan(byKind("vocal")[0].y);
  });

  it("recognises Chinese source names", () => {
    const zh = autoPlace([], [input("a", "底鼓 内"), input("b", "贝斯 DI", "di"), input("c", "吉他音箱")], [], makeId);
    expect(zh.map((i) => i.kind).sort()).toEqual(["bass_amp", "drums", "guitar_amp"]);
  });

  it("puts unknown inputs somewhere instead of dropping them", () => {
    const odd = autoPlace([], [input("x", "Theremin", "di")], [], makeId);
    expect(odd).toHaveLength(1);
    expect(odd[0].inputIds).toEqual(["x"]);
  });
});

describe("channel numbers", () => {
  it("numbers inputs by their position", () => {
    const map = channelNumbers([input("a", "A"), input("b", "B")]);
    expect(map.get("a")).toBe(1);
    expect(map.get("b")).toBe(2);
  });

  it("compresses runs into ranges", () => {
    expect(channelRanges([3, 1, 2, 5, 7, 8])).toBe("1–3, 5, 7–8");
    expect(channelRanges([4])).toBe("4");
    expect(channelRanges([])).toBe("");
  });
});
