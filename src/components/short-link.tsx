"use client";

import { cn, get_current_base_url } from "@/lib/utils";
import { Button } from "./button";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { pally } from "@/lib/fonts";
import { useEffect, useState } from "react";

const ShortLink = ({
  r_path,
  redirect_to,
  redirects,
  className,
  on_edit,
  on_disable,
  is_active = true,
  disabled,
}: {
  r_path: string;
  redirect_to: string;
  redirects: string;
  className?: string;
  on_edit?: () => void;
  on_disable?: () => void;
  is_active?: boolean;
  disabled?: boolean;
}) => {
  const t = useTranslations("short_link");

  // FIXED: A link is visually disabled when it's INACTIVE (is_active = false)
  const is_disabled = disabled || !is_active;

  // 1) Stable initial value (same on server and client)
  const [link, setLink] = useState<string>(`/${r_path}`);

  // 2) Only enhance on client
  useEffect(() => {
    // You can safely touch window here
    const base =
      typeof window !== "undefined" ? window.location.origin + "/r/" : "/r/";
    setLink(base + r_path);
  }, [r_path]);

  const linkText = link.replace(/^https?:\/\//i, "");

  const content = (
    <div
      onContextMenu={(e) => e.preventDefault()}
      className={cn(
        "flex max-sm:flex-col py-3.5 gap-x-3.5 items-center justify-between border-b border-secondary/5 px-5 outline-none",
        className
      )}
    >
      <div
        className={cn(
          "flex-1 flex flex-col text-lg max-sm:gap-y-1.5 w-full",
          is_disabled && "opacity-60"
        )}
      >
        <div className="flex flex-col sm:flex-row gap-y-0">
          <div className="text-primary">{t("link_label")} —</div>
          <div lang="en" dir="ltr" className={cn(pally.className)}>
            &nbsp;&nbsp;
            {linkText}
            &nbsp;&nbsp;
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-y-0">
          <div className="text-primary">{t("redirect_to_label")} —</div>
          <div
            lang="en"
            dir="ltr"
            className={cn("line-clamp-2 text-clip", pally.className)}
          >
            &nbsp;&nbsp;{redirect_to.replace(/^https?:\/\//i, "")}&nbsp;&nbsp;
          </div>
        </div>

        <div className="opacity-80 text-sm mt-2.5">
          {redirects} {t("redirects")}
        </div>
      </div>

      <div className="flex flex-row gap-y-1.5 gap-x-1 max-sm:mt-5 max-sm:w-full max-sm:justify-end">
        <Button
          onClick={(e) => {
            e.preventDefault();
            on_edit?.();
          }}
          disabled={disabled || is_disabled}
          className="text-sm md:text-md px-2.5 py-[2.5px] border"
          variant="secondary"
        >
          {t("edit_link")}
        </Button>
        <Button
          onClick={(e) => {
            e.preventDefault();
            on_disable?.();
          }}
          disabled={disabled}
          className="text-sm md:text-md px-2.5 py-[2.5px] border text-nowrap"
          // FIXED: Button should be primary when link is active (since clicking disables it)
          variant={is_active ? "primary" : "secondary"}
        >
          /— {is_active ? t("disable") : t("enable")}
        </Button>
      </div>
    </div>
  );

  if (is_disabled) {
    // Not clickable at all (no <a> element) when disabled/inactive
    return (
      <div
        aria-disabled={true}
        className={cn("cursor-not-allowed select-none", className)}
      >
        {content}
      </div>
    );
  }

  return (
    <Link
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      aria-disabled={false}
      onClick={(e) => {
        if (disabled || is_disabled) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {content}
    </Link>
  );
};

export default ShortLink;
