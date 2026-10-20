"use client";

import { useTransition } from "react";
import { setLanguage } from "@/app/actions/auth";
import { useI18n } from "./i18n-provider";

export function LanguageToggle({ className = "btn btn-ghost btn-sm" }: { className?: string }) {
  const { lang, t } = useI18n();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      className={className}
      disabled={pending}
      onClick={() => start(() => setLanguage(lang === "zh" ? "en" : "zh"))}
    >
      {t("nav.language")}
    </button>
  );
}
