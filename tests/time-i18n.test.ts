import { describe, expect, it } from "vitest";
import { en } from "@/lib/i18n/en";
import { zh } from "@/lib/i18n/zh";
import { makeT, resolveLang } from "@/lib/i18n";
import { formatClock, formatDuration, zonedToUtc } from "@/lib/time";

describe("zonedToUtc", () => {
  it("converts Shanghai wall time to UTC", () => {
    expect(zonedToUtc("2026-10-25", "19:30", "Asia/Shanghai").toISOString()).toBe("2026-10-25T11:30:00.000Z");
  });

  it("handles daylight saving (London, summer vs winter)", () => {
    expect(zonedToUtc("2026-07-01", "20:00", "Europe/London").toISOString()).toBe("2026-07-01T19:00:00.000Z");
    expect(zonedToUtc("2026-12-01", "20:00", "Europe/London").toISOString()).toBe("2026-12-01T20:00:00.000Z");
  });

  it("round-trips through formatClock", () => {
    const d = zonedToUtc("2026-10-25", "21:05", "Asia/Shanghai");
    expect(formatClock(d, "Asia/Shanghai")).toBe("21:05");
  });
});

describe("formatDuration", () => {
  it("formats minutes and hours", () => {
    expect(formatDuration(65_000)).toBe("1:05");
    expect(formatDuration(3_725_000)).toBe("1:02:05");
    expect(formatDuration(-5000)).toBe("0:00");
  });
});

describe("i18n", () => {
  it("has a non-empty Chinese translation for every English string", () => {
    for (const key of Object.keys(en) as (keyof typeof en)[]) {
      expect(zh[key], key).toBeTruthy();
    }
  });

  it("uses the same {placeholders} in both languages", () => {
    const vars = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join(",");
    for (const key of Object.keys(en) as (keyof typeof en)[]) {
      expect(vars(zh[key]), key).toBe(vars(en[key]));
    }
  });

  it("interpolates variables", () => {
    expect(makeT("en")("dash.bandsCount", { n: 3 })).toBe("3 bands");
    expect(makeT("zh")("dash.bandsCount", { n: 3 })).toBe("3 支乐队");
  });

  it("picks a language from the cookie, then the browser", () => {
    expect(resolveLang("zh", "en-US")).toBe("zh");
    expect(resolveLang(undefined, "zh-CN,zh;q=0.9")).toBe("zh");
    expect(resolveLang(undefined, "en-GB")).toBe("en");
    expect(resolveLang("fr", null)).toBe("en");
  });
});
