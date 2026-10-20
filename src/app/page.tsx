import Link from "next/link";
import { tryDemo } from "@/app/actions/auth";
import { Header } from "@/components/header";
import { PendingButton } from "@/components/pending-button";
import { getT } from "@/lib/i18n/server";
import type { DictKey } from "@/lib/i18n";

const FEATURES: [DictKey, DictKey][] = [
  ["landing.f1.title", "landing.f1.body"],
  ["landing.f2.title", "landing.f2.body"],
  ["landing.f3.title", "landing.f3.body"],
  ["landing.f4.title", "landing.f4.body"],
  ["landing.f5.title", "landing.f5.body"],
  ["landing.f6.title", "landing.f6.body"],
];

export default async function Home() {
  const t = await getT();
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4">
        <section className="grid items-center gap-10 py-14 md:grid-cols-2 md:py-20">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl">{t("app.tagline")}</h1>
            <p className="mt-5 max-w-prose text-lg text-muted">{t("app.description")}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <form action={tryDemo}>
                <PendingButton className="btn btn-primary h-12 px-6 text-base">{t("landing.tryDemo")}</PendingButton>
              </form>
              <Link href="/signup" className="btn h-12 px-6 text-base">
                {t("landing.getStarted")}
              </Link>
            </div>
            <p className="mt-3 text-sm text-muted">{t("landing.demoNote")}</p>
          </div>
          <LivePreview t={t} />
        </section>

        <section className="grid gap-4 pb-20 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(([title, body]) => (
            <div key={title} className="card p-5">
              <h2 className="font-semibold">{t(title)}</h2>
              <p className="mt-2 text-sm text-muted">{t(body)}</p>
            </div>
          ))}
        </section>
      </main>
    </>
  );
}

/** Static mock of the live screen, so the landing page shows the product. */
function LivePreview({ t }: { t: Awaited<ReturnType<typeof getT>> }) {
  return (
    <div className="card overflow-hidden" aria-hidden="true">
      <div className="border-b border-border bg-surface-2 px-5 py-3 text-sm text-muted">
        Battle of the Bands · 19:00
      </div>
      <div className="p-5">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-widest text-live uppercase">
          <span className="size-2 animate-pulse rounded-full bg-live" />
          {t("live.onNow")}
        </div>
        <div className="mt-1 text-3xl font-bold">回声 Echo</div>
        <div className="mt-1 font-mono text-muted">{t("live.endsIn", { t: "12:48" })}</div>
        <div className="mt-6 rounded-lg border border-border p-4">
          <div className="text-xs font-semibold tracking-widest text-accent uppercase">{t("live.next")}</div>
          <div className="mt-1 text-xl font-semibold">Static Bloom</div>
          <div className="font-mono text-sm text-muted">20:15 · {t("live.late", { n: 5 })}</div>
        </div>
        <ul className="mt-4 space-y-2 text-sm">
          {[
            ["20:55", "Paper Lanterns"],
            ["21:30", "Kid Volt"],
          ].map(([time, name]) => (
            <li key={name} className="flex gap-3 text-muted">
              <span className="font-mono">{time}</span>
              <span>{name}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
