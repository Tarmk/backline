import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { getUser } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import { LanguageToggle } from "./language-toggle";
import { Logo } from "./logo";

export async function Header() {
  const [user, t] = await Promise.all([getUser(), getT()]);
  return (
    <header className="no-print border-b border-border">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4">
        <Link href={user ? "/dashboard" : "/"} className="mr-auto flex items-center gap-2 font-semibold">
          <Logo />
          <span>{t("app.name")}</span>
        </Link>
        {user ? (
          <>
            <Link href="/dashboard" className="btn btn-ghost btn-sm hidden sm:inline-flex">
              {t("nav.dashboard")}
            </Link>
            <Link href="/dashboard/gear" className="btn btn-ghost btn-sm">
              {t("nav.gear")}
            </Link>
            <LanguageToggle />
            <form action={logout}>
              <button className="btn btn-ghost btn-sm">{t("nav.logout")}</button>
            </form>
          </>
        ) : (
          <>
            <LanguageToggle />
            <Link href="/login" className="btn btn-ghost btn-sm">
              {t("nav.login")}
            </Link>
            <Link href="/signup" className="btn btn-primary btn-sm">
              {t("nav.signup")}
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
