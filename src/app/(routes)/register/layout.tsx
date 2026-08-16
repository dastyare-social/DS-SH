import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type React from "react";
import { routes } from "@/config/routes";
import { getUserAuth } from "@/lib/auth/utils";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();

  return {
    title: t("general.login_to_panel"),
  };
}

export default async function layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session } = await getUserAuth();
  if (session) redirect(routes.default);

  return children;
}
