"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, signup, type AuthState } from "@/app/actions/auth";
import { useI18n } from "./i18n-provider";
import { PendingButton } from "./pending-button";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const { t } = useI18n();
  const [state, action] = useActionState<AuthState, FormData>(mode === "login" ? login : signup, {});

  return (
    <form action={action} className="card mx-auto mt-16 w-full max-w-sm space-y-4 p-6">
      <h1 className="text-xl font-semibold">{t(mode === "login" ? "auth.loginTitle" : "auth.signupTitle")}</h1>
      {mode === "signup" && (
        <div>
          <label className="label" htmlFor="name">{t("auth.name")}</label>
          <input id="name" name="name" className="input" required maxLength={80} defaultValue={state.name} autoComplete="name" />
        </div>
      )}
      <div>
        <label className="label" htmlFor="email">{t("auth.email")}</label>
        <input id="email" name="email" type="email" className="input" required defaultValue={state.email} autoComplete="email" />
      </div>
      <div>
        <label className="label" htmlFor="password">{t("auth.password")}</label>
        <input
          id="password"
          name="password"
          type="password"
          className="input"
          required
          minLength={mode === "signup" ? 8 : undefined}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
        />
      </div>
      {state.error && (
        <p role="alert" className="text-sm text-live">
          {t(state.error)}
        </p>
      )}
      <PendingButton className="btn btn-primary w-full">
        {t(mode === "login" ? "auth.login" : "auth.signup")}
      </PendingButton>
      <p className="text-center text-sm text-muted">
        {mode === "login" ? (
          <>
            {t("auth.noAccount")} <Link className="link" href="/signup">{t("nav.signup")}</Link>
          </>
        ) : (
          <>
            {t("auth.haveAccount")} <Link className="link" href="/login">{t("nav.login")}</Link>
          </>
        )}
      </p>
    </form>
  );
}
