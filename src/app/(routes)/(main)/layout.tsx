import { capitalize } from '@/lib/utils';
import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { checkAuth } from "@/lib/auth/utils";
import React from 'react'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();

  return {
    title: {
      default: capitalize(t("general.panel")),
      template: "%s — " + capitalize(t("general.panel")),
    },
  };
}

export default async function layout({
  children,
}: {
  children: React.ReactNode;
}) {
  await checkAuth();

  return children;
}
