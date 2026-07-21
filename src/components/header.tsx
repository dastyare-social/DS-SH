"use client";

import { useModalStore } from "@/store/use-modal-store";
import { Button } from "./button";
import { RefObject } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";

type HeaderProps = {
  creating?: boolean;
  headerRef?: RefObject<HTMLDivElement | null>;
};

const Header = ({ creating = false, headerRef }: HeaderProps) => {
  const { openModal } = useModalStore();
  const t = useTranslations();

  return (
    <div
      ref={headerRef}
      className="fixed top-0 max-w-5xl w-full flex items-center px-5 py-5 border-x border-b border-secondary/5 backdrop-blur-3xl bg-white/50 z-50"
    >
      <Link href="/" className="flex-1 text-xl tracking-[-1.5px]">
        {t("general.app_name")}
      </Link>

      <Button
        className="text-sm md:text-md px-2.5 py-1 border"
        variant="secondary"
        onClick={() => openModal("short_link_modal")}
        disabled={creating}
      >
        <span className="hidden sm:block">{t("header.create")}&nbsp;</span>
        {t("header.new_short_link")}
      </Button>
    </div>
  );
};

export default Header;
