import Link from "next/link";
import { Header } from "@/components/header";
import { requireUser } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const [user, t] = await Promise.all([requireUser(), getT()]);
  return (
    <>
      <Header />
      {user.isGuest && (
        <div className="no-print border-b border-border bg-surface-2 px-4 py-2 text-center text-sm text-muted">
          {t("auth.guestBanner")}{" "}
          <Link href="/signup" className="link">
            {t("landing.getStarted")}
          </Link>
        </div>
      )}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
    </>
  );
}
