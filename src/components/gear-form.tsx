"use client";

import { useActionState } from "react";
import { saveGear, type FormResult } from "@/app/actions/events";
import { GEAR_KINDS } from "@/lib/domain";
import type { GearCount } from "@/lib/gear";
import { useI18n } from "./i18n-provider";
import { PendingButton } from "./pending-button";

export function GearForm({ initial }: { initial: GearCount }) {
  const { t } = useI18n();
  const [state, action] = useActionState<FormResult, FormData>(saveGear, {});
  return (
    <form action={action} className="card divide-y divide-border">
      {GEAR_KINDS.map((kind) => (
        <label key={kind} className="flex items-center justify-between gap-4 px-4 py-3">
          <span>{t(`gear.kind.${kind}`)}</span>
          <input
            name={kind}
            type="number"
            min={0}
            max={999}
            inputMode="numeric"
            defaultValue={initial[kind]}
            className="input w-24 text-right"
          />
        </label>
      ))}
      <div className="flex items-center gap-3 px-4 py-3">
        <PendingButton>{t("gear.save")}</PendingButton>
        {state.ok && <span className="text-sm text-ok">{t("event.saved")}</span>}
      </div>
    </form>
  );
}
