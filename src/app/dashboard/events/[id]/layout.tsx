import { notFound } from "next/navigation";
import { EventTabs } from "@/components/event-tabs";
import { requireUser } from "@/lib/auth";
import { getOwnedEvent } from "@/lib/data";

export default async function EventLayout({ children, params }: LayoutProps<"/dashboard/events/[id]">) {
  const { id } = await params;
  const user = await requireUser();
  const event = await getOwnedEvent(id, user.id);
  if (!event) notFound();

  return (
    <div>
      <div className="no-print mb-6">
        <h1 className="text-2xl font-bold">{event.name}</h1>
        <p className="text-sm text-muted">
          {event.date} · {event.startTime}
          {event.venue && ` · ${event.venue}`}
        </p>
        <EventTabs eventId={event.id} live={event.liveStatus === "live"} />
      </div>
      {children}
    </div>
  );
}
