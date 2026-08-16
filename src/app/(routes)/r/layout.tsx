import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type React from "react";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("redirect_page");

  return {
    title: t("meta_title"),
  };
}

export default function layout({ children }: { children: React.ReactNode }) {
  return children;
}
