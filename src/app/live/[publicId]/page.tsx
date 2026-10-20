import type { Metadata } from "next";
import { LanguageToggle } from "@/components/language-toggle";
import { LiveBoard } from "@/components/live-board";
import { Logo } from "@/components/logo";
import { getLiveSnapshot } from "@/lib/data";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata({ params }: PageProps<"/live/[publicId]">): Promise<Metadata> {
  const snap = await getLiveSnapshot((await params).publicId);
  return { title: snap?.eventName ?? "Live", robots: { index: false } };
}

export default async function LivePage({ params }: PageProps<"/live/[publicId]">) {
  const { publicId } = await params;
  const [snap, t] = await Promise.all([getLiveSnapshot(publicId), getT()]);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
      <header className="mb-6 flex items-start gap-3">
        <Logo size={28} />
        <div className="mr-auto">
          <h1 className="text-xl font-bold">{snap?.eventName ?? t("common.notFound")}</h1>
          {snap && (
            <p className="text-sm text-muted">
              {snap.date}
              {snap.venue && ` · ${snap.venue}`}
            </p>
          )}
        </div>
        <LanguageToggle />
      </header>
      {snap ? <LiveBoard publicId={publicId} initial={snap} /> : <p className="text-muted">{t("live.notFound")}</p>}
    </main>
  );
}
