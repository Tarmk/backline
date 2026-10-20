"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { DictKey } from "@/lib/i18n";
import { useI18n } from "./i18n-provider";

export function EventTabs({ eventId, live }: { eventId: string; live: boolean }) {
  const { t } = useI18n();
  const pathname = usePathname();
  const base = `/dashboard/events/${eventId}`;
  const tabs: [string, DictKey][] = [
    [base, "event.bands"],
    [`${base}/show`, "event.showMode"],
    [`${base}/stage`, "event.stage"],
    [`${base}/print`, "event.print"],
  ];
  return (
    <nav className="mt-4 flex gap-1 overflow-x-auto overflow-y-hidden border-b border-border">
      {tabs.map(([href, label]) => {
        const active = href === base ? pathname === base : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`-mb-px border-b-2 px-3 py-2 text-sm whitespace-nowrap ${
              active ? "border-accent text-text" : "border-transparent text-muted hover:text-text"
            }`}
          >
            {t(label)}
            {label === "event.showMode" && live && <span className="ml-1.5 inline-block size-2 rounded-full bg-live" />}
          </Link>
        );
      })}
    </nav>
  );
}
