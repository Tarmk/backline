import Link from "next/link";
import { notFound } from "next/navigation";
import { addBand, deleteEvent } from "@/app/actions/events";
import { BandList } from "@/components/band-list";
import { CopyButton } from "@/components/copy-button";
import { EventForm } from "@/components/event-form";
import { PendingButton } from "@/components/pending-button";
import { requireUser } from "@/lib/auth";
import { bandStatus, getBands, getGear, getOwnedEvent, hasGearList } from "@/lib/data";
import { gearReport } from "@/lib/gear";
import { getT } from "@/lib/i18n/server";
import { computeSchedule } from "@/lib/schedule";
import { formatClock } from "@/lib/time";

export default async function EventPage({ params }: PageProps<"/dashboard/events/[id]">) {
  const { id } = await params;
  const user = await requireUser();
  const event = await getOwnedEvent(id, user.id);
  if (!event) notFound();

  const [bands, gear, hasGear, t] = await Promise.all([
    getBands(event.id),
    getGear(user.id),
    hasGearList(user.id),
    getT(),
  ]);
  const slots = computeSchedule(event, bands);
  const report = gearReport(bands, gear);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <section className="card p-5">
          <h2 className="mb-4 text-lg font-semibold">{t("event.bands")}</h2>
          <BandList
            eventId={event.id}
            bands={bands.map((b, i) => ({
              id: b.id,
              name: b.name,
              status: bandStatus(b),
              setMin: b.setMin,
              inputCount: b.inputs.length,
              editPath: `/b/${b.editToken}`,
              start: formatClock(slots[i].plannedStart, event.timezone),
            }))}
          />
          <form action={addBand.bind(null, event.id)} className="mt-4 flex gap-2">
            <input name="name" className="input" placeholder={t("event.bandName")} required maxLength={80} aria-label={t("event.bandName")} />
            <PendingButton className="btn btn-primary shrink-0">{t("event.addBand")}</PendingButton>
          </form>
        </section>

        <section className="card p-5">
          <h2 className="mb-4 text-lg font-semibold">{t("event.settings")}</h2>
          <EventForm
            eventId={event.id}
            initial={{
              name: event.name,
              venue: event.venue,
              date: event.date,
              startTime: event.startTime,
              timezone: event.timezone,
              changeoverMin: event.changeoverMin,
            }}
          />
          <form action={deleteEvent.bind(null, event.id)} className="mt-6 border-t border-border pt-4">
            <PendingButton className="btn btn-danger btn-sm" confirm={t("event.deleteConfirm")}>
              {t("event.delete")}
            </PendingButton>
          </form>
        </section>
      </div>

      <aside className="space-y-6">
        <section className="card p-5">
          <h2 className="text-lg font-semibold">{t("event.share")}</h2>
          <p className="mt-3 text-sm font-medium">{t("event.liveLink")}</p>
          <p className="mb-2 text-sm text-muted">{t("event.liveLinkHelp")}</p>
          <div className="flex flex-wrap gap-2">
            <CopyButton path={`/live/${event.publicId}`} label={t("event.copyPublicLink")} />
            <Link href={`/live/${event.publicId}`} target="_blank" className="btn btn-sm">
              {t("event.open")} ↗
            </Link>
          </div>
        </section>

        <section className="card p-5">
          <h2 className="mb-3 text-lg font-semibold">{t("event.gear")}</h2>
          {!hasGear ? (
            <Link href="/dashboard/gear" className="btn btn-sm">
              {t("event.gearSetup")} →
            </Link>
          ) : report.shortages.length === 0 ? (
            <p className="text-sm text-ok">✓ {t("event.gearOk")}</p>
          ) : (
            <ul className="space-y-3">
              {report.shortages.map((s) => (
                <li key={s.kind} className="rounded-lg border border-warn/40 bg-warn/10 p-3 text-sm">
                  <p className="font-medium text-warn">
                    {t("event.gearShort", {
                      n: s.need - s.have,
                      item: t(`gear.kind.${s.kind}`),
                      have: s.have,
                      need: s.need,
                    })}
                  </p>
                  <p className="mt-1 text-muted">{t("event.gearWho", { bands: s.bands.join(", ") })}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </aside>
    </div>
  );
}
