import type { Metadata } from "next";
import Link from "next/link";
import { EventForm } from "@/components/event-form";
import { requireUser } from "@/lib/auth";
import { listEvents } from "@/lib/data";
import { getT } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Dashboard" };

export default async function Dashboard() {
  const user = await requireUser();
  const [events, t] = await Promise.all([listEvents(user.id), getT()]);

  return (
    <div className="space-y-8">
      <section>
        <h1 className="mb-4 text-2xl font-bold">{t("dash.title")}</h1>
        {events.length === 0 ? (
          <p className="text-muted">{t("dash.empty")}</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((e) => (
              <li key={e.id}>
                <Link href={`/dashboard/events/${e.id}`} className="card block p-4 transition-colors hover:border-accent">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-semibold">{e.name}</h2>
                    {e.liveStatus === "live" && (
                      <span className="badge bg-live/15 text-live">● LIVE</span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    {e.date} · {e.startTime}
                    {e.venue && ` · ${e.venue}`}
                  </p>
                  <p className="mt-3 text-sm">
                    {t("dash.bandsCount", { n: e.bandCount })} ·{" "}
                    <span className={e.submittedCount === e.bandCount && e.bandCount > 0 ? "text-ok" : "text-muted"}>
                      {t("dash.submittedCount", { n: e.submittedCount })}
                    </span>
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card p-5">
        <h2 className="mb-4 text-lg font-semibold">{t("dash.newEvent")}</h2>
        <EventForm />
      </section>
    </div>
  );
}
