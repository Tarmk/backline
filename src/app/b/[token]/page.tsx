import type { Metadata } from "next";
import { saveBandByToken, setSubmittedByToken } from "@/app/actions/bands";
import { BandEditor } from "@/components/band-editor";
import { LanguageToggle } from "@/components/language-toggle";
import { LiveBoard } from "@/components/live-board";
import { Logo } from "@/components/logo";
import { buildSnapshot, getBandByToken, getBands } from "@/lib/data";
import { getT } from "@/lib/i18n/server";
import { toDetails } from "@/lib/band-details";

export const metadata: Metadata = { title: "Band setup", robots: { index: false } };

export default async function BandPortal({ params }: PageProps<"/b/[token]">) {
  const { token } = await params;
  const [found, t] = await Promise.all([getBandByToken(token), getT()]);

  if (!found) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16 text-center text-muted">{t("band.notFound")}</main>
    );
  }

  const { band, event } = found;
  const snapshot = buildSnapshot(event, await getBands(event.id));

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6">
      <header className="mb-4 flex items-start gap-3">
        <Logo size={28} />
        <div className="mr-auto">
          <h1 className="text-xl font-bold">{t("band.portalTitle", { band: band.name, event: event.name })}</h1>
          <p className="text-sm text-muted">
            {event.date} · {event.startTime}
            {event.venue && ` · ${event.venue}`}
          </p>
        </div>
        <LanguageToggle />
      </header>
      <p className="mb-4 max-w-prose text-sm text-muted">{t("band.portalIntro")}</p>
      <BandEditor
        initial={toDetails(band)}
        initialSubmitted={band.submittedAt !== null}
        save={saveBandByToken.bind(null, token)}
        setSubmitted={setSubmittedByToken.bind(null, token)}
        schedule={<LiveBoard publicId={event.publicId} initial={snapshot} highlightBandId={band.id} compact />}
      />
    </main>
  );
}
