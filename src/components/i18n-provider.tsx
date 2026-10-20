"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { makeT, type Lang, type Translate } from "@/lib/i18n";

const I18nContext = createContext<{ lang: Lang; t: Translate } | null>(null);

export function I18nProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  const value = useMemo(() => ({ lang, t: makeT(lang) }), [lang]);
  return <I18nContext value={value}>{children}</I18nContext>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
