import { notFound } from "next/navigation";
import { PrintButton } from "@/components/print-button";
import { StagePlot } from "@/components/stage-plot";
import { requireUser } from "@/lib/auth";
import { getBands, getOwnedEvent } from "@/lib/data";
import { getT } from "@/lib/i18n/server";
import { computeSchedule } from "@/lib/schedule";
import { channelNumbers } from "@/lib/stageplot";
import { formatClock } from "@/lib/time";

export default async function PrintPage({ params }: PageProps<"/dashboard/events/[id]/print">) {
  const { id } = await params;
  const user = await requireUser();
  const event = await getOwnedEvent(id, user.id);
  if (!event) notFound();
  const [bands, t] = await Promise.all([getBands(event.id), getT()]);
  const slots = computeSchedule(event, bands);
  const clock = (d: Date) => formatClock(d, event.timezone);

  const th = "border border-border px-2 py-1 text-left font-semibold";
  const td = "border border-border px-2 py-1 align-top";

  return (
    <div className="space-y-10 text-sm">
      <div className="no-print">
        <PrintButton label={t("print.button")} />
      </div>

      <section>
        <h2 className="text-xl font-bold">
          {event.name} · {t("print.runningOrder")}
        </h2>
        <p className="mb-3 text-muted">
          {event.date}
          {event.venue && ` · ${event.venue}`}
        </p>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-surface-2">
              <th className={th}>#</th>
              <th className={th}>{t("print.planned")}</th>
              <th className={th}>{t("band.name")}</th>
              <th className={th}>{t("band.setMin")}</th>
              <th className={th}>{t("band.inputs")}</th>
              <th className={th}>{t("print.contact")}</th>
            </tr>
          </thead>
          <tbody>
            {bands.map((b, i) => (
              <tr key={b.id}>
                <td className={td}>{i + 1}</td>
                <td className={`${td} font-mono`}>
                  {clock(slots[i].plannedStart)}–{clock(slots[i].plannedEnd)}
                </td>
                <td className={`${td} font-medium`}>{b.name}</td>
                <td className={td}>{b.setMin}</td>
                <td className={td}>{b.inputs.length}</td>
                <td className={td}>{[b.contactName, b.contactInfo].filter(Boolean).join(" · ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {bands.map((b, i) => {
        const channels = channelNumbers(b.inputs);
        return (
          <section key={b.id} className="print-break space-y-4">
            <div className="flex items-baseline justify-between gap-4 border-b-2 border-text pb-1">
              <h2 className="text-2xl font-bold">
                {i + 1}. {b.name}
              </h2>
              <span className="font-mono">
                {clock(slots[i].plannedStart)}–{clock(slots[i].plannedEnd)} · {b.setMin} {t("common.min")}
              </span>
            </div>

            <div className="grid gap-x-8 gap-y-1 sm:grid-cols-2">
              {(b.contactName || b.contactInfo) && (
                <p>
                  <b>{t("print.contact")}:</b> {[b.contactName, b.contactInfo].filter(Boolean).join(" · ")}
                </p>
              )}
              {b.members.length > 0 && (
                <p>
                  <b>{t("print.members")}:</b> {b.members.map((m) => (m.role ? `${m.name} (${m.role})` : m.name)).join(", ")}
                </p>
              )}
              {b.bringing && (
                <p className="sm:col-span-2">
                  <b>{t("print.bringing")}:</b> {b.bringing}
                </p>
              )}
              {b.notes && (
                <p className="sm:col-span-2">
                  <b>{t("print.notes")}:</b> {b.notes}
                </p>
              )}
            </div>

            <div>
              <h3 className="mb-1 font-semibold">{t("print.inputList")}</h3>
              {b.inputs.length === 0 ? (
                <p className="text-muted">—</p>
              ) : (
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-surface-2">
                      <th className={`${th} w-12`}>{t("band.ch")}</th>
                      <th className={th}>{t("band.source")}</th>
                      <th className={th}>{t("band.kind")}</th>
                      <th className={th}>{t("band.mic")}</th>
                      <th className={th}>{t("band.stand")}</th>
                      <th className={th}>{t("band.bandProvides")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {b.inputs.map((input) => (
                      <tr key={input.id}>
                        <td className={`${td} font-mono font-bold`}>{channels.get(input.id)}</td>
                        <td className={`${td} font-medium`}>{input.source}</td>
                        <td className={td}>{t(`kind.${input.kind}`)}</td>
                        <td className={td}>{input.mic}</td>
                        <td className={td}>{input.stand === "none" ? "" : t(`stand.${input.stand}`)}</td>
                        <td className={td}>{input.bandProvides ? t("print.yes") : ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {b.monitors.length > 0 && (
              <div>
                <h3 className="mb-1 font-semibold">{t("print.monitors")}</h3>
                <table className="w-full border-collapse">
                  <tbody>
                    {b.monitors.map((m, mi) => (
                      <tr key={m.id}>
                        <td className={`${td} w-12 font-mono font-bold`}>{mi + 1}</td>
                        <td className={`${td} font-medium`}>{m.who}</td>
                        <td className={td}>
                          {t(`monitor.${m.kind}`)}
                          {m.bandProvides && ` (${t("band.bandProvides")})`}
                        </td>
                        <td className={td}>{m.wants}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {b.stagePlot.length > 0 && (
              <div className="break-inside-avoid">
                <h3 className="mb-1 font-semibold">{t("print.stagePlot")}</h3>
                <StagePlot
                  items={b.stagePlot}
                  channels={channels}
                  labels={{ audience: t("stage.audience"), back: t("stage.back") }}
                  className="max-w-2xl rounded border border-border"
                />
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
