import type { Metadata } from "next";
import "@/styles/globals.css";

import { NextIntlClientProvider } from "next-intl";
import { LangDir, LangFont } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import NextTopLoader from "nextjs-toploader";

export async function generateMetadata(): Promise<Metadata> {
  const tGeneral = await getTranslations("general");

  return {
    title: {
      default: tGeneral("app_name"),
      template: "%s — " + tGeneral("app_name"),
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  const messages = await getMessages();

  const font = LangFont(locale);
  const dir = LangDir(locale);

  return (
    <html lang={locale} dir={dir}>
      <body className={cn(font, "antialiased tracking-tighter select-none")}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <NextTopLoader
            color="var(--color-primary)"
            showSpinner={false}
            shadow="none"
          />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
