"use client";

import { useState } from "react";
import { useI18n } from "./i18n-provider";

/** Copies an absolute URL for `path` (so it works on any domain the app is served from). */
export function CopyButton({ path, label, className = "btn btn-sm" }: { path: string; label?: string; className?: string }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  async function copy() {
    const url = `${window.location.origin}${path}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Clipboard API needs https; fall back to a prompt the user can copy from.
      window.prompt("", url);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button type="button" className={className} onClick={copy}>
      {copied ? t("event.copied") : (label ?? t("event.copyLink"))}
    </button>
  );
}
