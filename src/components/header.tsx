"use client";

import { useModalStore } from "@/store/use-modal-store";
import { Button } from "./button";
import { RefObject } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import Image from "next/image";

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
      <Link
        href="/"
        className="flex gap-x-2.5 flex-1 tracking-[-1.5px] items-center"
      >
        <div>
          <Image
            src="/icon.png"
            alt="logo"
            loading="eager"
            width={30}
            height={30}
            className="aspect-square"
          />
        </div>

        <div className="text-[20px] leading-[20px] mt-0.5">
          {t("general.app_name")}
        </div>
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
