import Link from "next/link";
import { getT } from "@/lib/i18n/server";

export default async function NotFound() {
  const t = await getT();
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <h1 className="text-2xl font-bold">404 · {t("common.notFound")}</h1>
      <Link href="/" className="btn">
        ← {t("app.name")}
      </Link>
    </main>
  );
}
