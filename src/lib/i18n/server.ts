import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { LANG_COOKIE, makeT, resolveLang, type Lang } from ".";

export const getLang = cache(async (): Promise<Lang> => {
  const [jar, hdrs] = await Promise.all([cookies(), headers()]);
  return resolveLang(jar.get(LANG_COOKIE)?.value, hdrs.get("accept-language"));
});

export async function getT() {
  return makeT(await getLang());
}
