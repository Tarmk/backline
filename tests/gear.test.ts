import { describe, expect, it } from "vitest";
import type { InputItem, MonitorMix } from "@/lib/domain";
import { bandGearNeeds, gearReport, zeroGear } from "@/lib/gear";

let n = 0;
const input = (kind: InputItem["kind"], stand: InputItem["stand"] = "none", bandProvides = false): InputItem => ({
  id: `i${n++}`,
  source: kind,
  kind,
  mic: "",
  stand,
  bandProvides,
});
const wedge = (bandProvides = false): MonitorMix => ({ id: `m${n++}`, who: "", kind: "wedge", wants: "", bandProvides });
const iem = (bandProvides = false): MonitorMix => ({ id: `m${n++}`, who: "", kind: "iem", wants: "", bandProvides });

describe("bandGearNeeds", () => {
  it("counts mics, DIs and stands by kind", () => {
    const need = bandGearNeeds(
      [input("vocal", "tall"), input("vocal", "tall"), input("inst_mic", "short"), input("di"), input("condenser", "clip")],
      [wedge(), wedge(), iem()],
    );
    expect(need.vocal_mic).toBe(2);
    expect(need.inst_mic).toBe(1);
    expect(need.condenser).toBe(1);
    expect(need.di).toBe(1);
    expect(need.tall_stand).toBe(2);
    expect(need.short_stand).toBe(1);
    expect(need.clip).toBe(1);
    expect(need.wedge).toBe(2);
    expect(need.iem).toBe(1);
  });

  it("counts a stereo DI as two mono DIs", () => {
    expect(bandGearNeeds([input("stereo_di")], []).di).toBe(2);
  });

  it("skips gear the band brings, but still needs a stand for their mic", () => {
    const need = bandGearNeeds([input("vocal", "tall", true)], [wedge(true), iem(true)]);
    expect(need.vocal_mic).toBe(0);
    expect(need.tall_stand).toBe(1);
    expect(need.wedge).toBe(0);
    expect(need.iem).toBe(0);
  });
});

describe("gearReport", () => {
  it("uses the biggest band's needs, not the total, because bands play one at a time", () => {
    const have = { ...zeroGear(), vocal_mic: 3 };
    const report = gearReport(
      [
        { name: "A", inputs: [input("vocal"), input("vocal")], monitors: [] },
        { name: "B", inputs: [input("vocal"), input("vocal"), input("vocal")], monitors: [] },
      ],
      have,
    );
    expect(report.peak.vocal_mic).toBe(3);
    expect(report.shortages).toEqual([]);
  });

  it("reports shortages and which bands cause them", () => {
    const have = { ...zeroGear(), di: 2 };
    const report = gearReport(
      [
        { name: "Small", inputs: [input("di")], monitors: [] },
        { name: "Synths", inputs: [input("stereo_di"), input("stereo_di")], monitors: [] },
      ],
      have,
    );
    expect(report.shortages).toEqual([{ kind: "di", have: 2, need: 4, bands: ["Synths"] }]);
  });
});
