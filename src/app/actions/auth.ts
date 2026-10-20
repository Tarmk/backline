"use server";

import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { z } from "zod";
import { createSession, destroySession } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { createDemoAccount } from "@/lib/demo";
import { LANG_COOKIE, type DictKey } from "@/lib/i18n";
import { hashPassword, verifyPassword } from "@/lib/password";

export type AuthState = { error?: DictKey; email?: string; name?: string };

const signupSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.email().trim().toLowerCase().max(200),
  password: z.string().min(8).max(200),
});

export async function signup(_: AuthState, form: FormData): Promise<AuthState> {
  const raw = {
    name: String(form.get("name") ?? ""),
    email: String(form.get("email") ?? ""),
    password: String(form.get("password") ?? ""),
  };
  const parsed = signupSchema.safeParse(raw);
  if (!parsed.success) {
    const tooShort = parsed.error.issues.some((i) => i.path[0] === "password");
    return { error: tooShort ? "auth.passwordShort" : "auth.checkFields", email: raw.email, name: raw.name };
  }

  const db = await getDb();
  const existing = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.email, parsed.data.email))
    .limit(1);
  if (existing.length) return { error: "auth.emailTaken", email: raw.email, name: raw.name };

  const id = crypto.randomUUID();
  await db.insert(schema.users).values({
    id,
    email: parsed.data.email,
    name: parsed.data.name,
    passwordHash: await hashPassword(parsed.data.password),
  });
  await createSession(id);
  redirect("/dashboard");
}

export async function login(_: AuthState, form: FormData): Promise<AuthState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");

  const db = await getDb();
  const rows = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  const user = rows[0];
  if (!user || user.isGuest || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "auth.invalid", email };
  }
  await createSession(user.id);
  redirect("/dashboard");
}

export async function logout() {
  await destroySession();
  redirect("/");
}

export async function tryDemo() {
  const { userId, eventId } = await createDemoAccount();
  await createSession(userId);
  redirect(`/dashboard/events/${eventId}`);
}

export async function setLanguage(lang: "en" | "zh") {
  (await cookies()).set(LANG_COOKIE, lang === "zh" ? "zh" : "en", {
    path: "/",
    maxAge: 365 * 24 * 3600,
    sameSite: "lax",
  });
  refresh();
}
