"use client";

import { useActionState } from "react";
import { createEvent, updateEvent, type FormResult } from "@/app/actions/events";
import { TIMEZONES } from "@/lib/time";
import { useI18n } from "./i18n-provider";
import { PendingButton } from "./pending-button";

type EventValues = {
  name: string;
  venue: string;
  date: string;
  startTime: string;
  timezone: string;
  changeoverMin: number;
};

export function EventForm({ eventId, initial }: { eventId?: string; initial?: EventValues }) {
  const { t } = useI18n();
  const [state, action] = useActionState<FormResult, FormData>(
    eventId ? updateEvent.bind(null, eventId) : createEvent,
    {},
  );
  const v: EventValues = initial ?? {
    name: "",
    venue: "",
    date: new Date().toISOString().slice(0, 10),
    startTime: "19:00",
    timezone: "Asia/Shanghai",
    changeoverMin: 15,
  };

  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div className="sm:col-span-2 lg:col-span-1">
        <label className="label" htmlFor="ev-name">{t("event.name")}</label>
        <input id="ev-name" name="name" className="input" required maxLength={120} defaultValue={v.name} placeholder="Battle of the Bands" />
      </div>
      <div>
        <label className="label" htmlFor="ev-venue">{t("event.venue")}</label>
        <input id="ev-venue" name="venue" className="input" maxLength={120} defaultValue={v.venue} />
      </div>
      <div>
        <label className="label" htmlFor="ev-date">{t("event.date")}</label>
        <input id="ev-date" name="date" type="date" className="input" required defaultValue={v.date} />
      </div>
      <div>
        <label className="label" htmlFor="ev-start">{t("event.startTime")}</label>
        <input id="ev-start" name="startTime" type="time" className="input" required defaultValue={v.startTime} />
      </div>
      <div>
        <label className="label" htmlFor="ev-co">{t("event.changeover")}</label>
        <input id="ev-co" name="changeoverMin" type="number" min={0} max={120} className="input" defaultValue={v.changeoverMin} />
      </div>
      <div>
        <label className="label" htmlFor="ev-tz">{t("event.timezone")}</label>
        <select id="ev-tz" name="timezone" className="input" defaultValue={v.timezone}>
          {TIMEZONES.map((tz) => (
            <option key={tz} value={tz}>{tz}</option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-3">
        <PendingButton>{eventId ? t("event.save") : t("dash.create")}</PendingButton>
        {state.ok && <span className="text-sm text-ok">{t("event.saved")}</span>}
        {state.error && <span className="text-sm text-live">{t("auth.checkFields")}</span>}
      </div>
    </form>
  );
}
