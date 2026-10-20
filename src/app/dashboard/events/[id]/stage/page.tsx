import Link from "next/link";
import { notFound } from "next/navigation";
import { StagePlot } from "@/components/stage-plot";
import { requireUser } from "@/lib/auth";
import { getBands, getOwnedEvent } from "@/lib/data";
import { getT } from "@/lib/i18n/server";
import { channelNumbers } from "@/lib/stageplot";

export default async function StageComparePage({ params }: PageProps<"/dashboard/events/[id]/stage">) {
  const { id } = await params;
  const user = await requireUser();
  const event = await getOwnedEvent(id, user.id);
  if (!event) notFound();
  const [bands, t] = await Promise.all([getBands(event.id), getT()]);
  const labels = { audience: t("stage.audience"), back: t("stage.back") };

  return (
    <div>
      <h2 className="text-lg font-semibold">{t("stage.compareTitle")}</h2>
      <p className="mb-6 text-sm text-muted">{t("stage.compareHelp")}</p>
      {bands.length === 0 && <p className="text-muted">{t("event.noBands")}</p>}
      <div className="space-y-8">
        {bands.map((band, i) => {
          const after = bands[i + 1];
          return (
            <section key={band.id} className="grid items-start gap-4 md:grid-cols-2">
              <PlotCard band={band} eventId={event.id} labels={labels} emptyText={t("stage.empty")} />
              {after ? (
                <div>
                  <p className="mb-1 text-xs tracking-widest text-muted uppercase md:hidden">↓ {t("stage.then")}</p>
                  <PlotCard band={after} eventId={event.id} labels={labels} emptyText={t("stage.empty")} />
                </div>
              ) : null}
            </section>
          );
        })}
      </div>
    </div>
  );
}

function PlotCard({
  band,
  eventId,
  labels,
  emptyText,
}: {
  band: Awaited<ReturnType<typeof getBands>>[number];
  eventId: string;
  labels: { audience: string; back: string };
  emptyText: string;
}) {
  return (
    <div className="card overflow-hidden">
      <Link href={`/dashboard/events/${eventId}/bands/${band.id}`} className="block border-b border-border px-4 py-2 font-medium hover:text-accent">
        {band.name}
      </Link>
      {band.stagePlot.length ? (
        <StagePlot items={band.stagePlot} channels={channelNumbers(band.inputs)} labels={labels} />
      ) : (
        <p className="p-6 text-sm text-muted">{emptyText}</p>
      )}
    </div>
  );
}
