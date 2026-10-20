import { en, type Dict, type DictKey } from "./en";
import { zh } from "./zh";

export type Lang = "en" | "zh";
export const LANG_COOKIE = "bl_lang";
export const dictionaries: Record<Lang, Dict> = { en, zh };

export type Translate = (key: DictKey, vars?: Record<string, string | number>) => string;

export function makeT(lang: Lang): Translate {
  const dict = dictionaries[lang];
  return (key, vars) => {
    const text = dict[key] ?? en[key] ?? key;
    if (!vars) return text;
    return text.replace(/\{(\w+)\}/g, (m, name: string) =>
      name in vars ? String(vars[name]) : m,
    );
  };
}

/** Pick a language from the cookie, falling back to the browser's Accept-Language. */
export function resolveLang(cookieValue: string | undefined, acceptLanguage: string | null): Lang {
  if (cookieValue === "en" || cookieValue === "zh") return cookieValue;
  return acceptLanguage?.toLowerCase().trimStart().startsWith("zh") ? "zh" : "en";
}

export type { Dict, DictKey };
