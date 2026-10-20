import Link from "next/link";
import { notFound } from "next/navigation";
import { LiveBoard } from "@/components/live-board";
import { ShowControls } from "@/components/show-controls";
import { requireUser } from "@/lib/auth";
import { buildSnapshot, getBands, getOwnedEvent } from "@/lib/data";
import { getT } from "@/lib/i18n/server";

export default async function ShowPage({ params }: PageProps<"/dashboard/events/[id]/show">) {
  const { id } = await params;
  const user = await requireUser();
  const event = await getOwnedEvent(id, user.id);
  if (!event) notFound();
  const [bands, t] = await Promise.all([getBands(event.id), getT()]);
  const snapshot = buildSnapshot(event, bands);

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <section className="card h-fit space-y-4 p-5 lg:sticky lg:top-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">{t("show.title")}</h2>
          <Link href={`/live/${event.publicId}`} target="_blank" className="btn btn-ghost btn-sm">
            {t("show.openLive")} ↗
          </Link>
        </div>
        <ShowControls
          eventId={event.id}
          liveStatus={event.liveStatus}
          delayMin={event.delayMin}
          bands={snapshot.slots.map((s) => ({ id: s.bandId, name: s.name, status: s.status }))}
        />
      </section>
      <LiveBoard publicId={event.publicId} initial={snapshot} />
    </div>
  );
}
