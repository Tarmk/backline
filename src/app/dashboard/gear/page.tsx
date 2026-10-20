import type { Metadata } from "next";
import { GearForm } from "@/components/gear-form";
import { requireUser } from "@/lib/auth";
import { getGear } from "@/lib/data";
import { getT } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "My gear" };

export default async function GearPage() {
  const user = await requireUser();
  const [gear, t] = await Promise.all([getGear(user.id), getT()]);
  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold">{t("gear.title")}</h1>
      <p className="mt-2 mb-6 text-muted">{t("gear.help")}</p>
      <GearForm initial={gear} />
    </div>
  );
}
