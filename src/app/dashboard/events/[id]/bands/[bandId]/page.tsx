import Link from "next/link";
import { notFound } from "next/navigation";
import { saveBandAsOrganiser, setSubmittedAsOrganiser } from "@/app/actions/bands";
import { BandEditor } from "@/components/band-editor";
import { CopyButton } from "@/components/copy-button";
import { requireUser } from "@/lib/auth";
import { toDetails } from "@/lib/band-details";
import { getOwnedBand } from "@/lib/data";
import { getT } from "@/lib/i18n/server";

export default async function OrganiserBandPage({ params }: PageProps<"/dashboard/events/[id]/bands/[bandId]">) {
  const { id, bandId } = await params;
  const user = await requireUser();
  const found = await getOwnedBand(bandId, user.id);
  if (!found || found.event.id !== id) notFound();
  const t = await getT();
  const { band } = found;

  return (
    <div className="max-w-4xl">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Link href={`/dashboard/events/${id}`} className="btn btn-ghost btn-sm">
          ← {t("common.back")}
        </Link>
        <h2 className="mr-auto text-xl font-semibold">{band.name}</h2>
        <CopyButton path={`/b/${band.editToken}`} />
        <Link href={`/b/${band.editToken}`} target="_blank" className="btn btn-sm">
          {t("event.open")} ↗
        </Link>
      </div>
      <BandEditor
        // Remount when switching bands so state doesn't leak between them.
        key={band.id}
        initial={toDetails(band)}
        initialSubmitted={band.submittedAt !== null}
        save={saveBandAsOrganiser.bind(null, band.id)}
        setSubmitted={setSubmittedAsOrganiser.bind(null, band.id)}
      />
    </div>
  );
}
