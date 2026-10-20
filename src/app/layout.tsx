import type { Metadata, Viewport } from "next";
import { I18nProvider } from "@/components/i18n-provider";
import { getLang } from "@/lib/i18n/server";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Backline", template: "%s · Backline" },
  description:
    "Run your gig night from one link: band riders, input lists, gear check, stage plots and a live running order.",
};

export const viewport: Viewport = {
  themeColor: "#0e0f12",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const lang = await getLang();
  return (
    <html lang={lang === "zh" ? "zh-CN" : "en"} className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <I18nProvider lang={lang}>{children}</I18nProvider>
      </body>
    </html>
  );
}
