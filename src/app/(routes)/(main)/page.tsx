"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/button";
import ShortLink from "@/components/short-link";
import Loader from "@/components/loader";
import Header from "@/components/header";
import ModalProvider from "@/components/providers/modal-provider";
import { useModalStore } from "@/store/use-modal-store";
import { trpc } from "@/lib/trpc/client";
import { getLinks } from "@/lib/actions/links";
import { signOut } from "@/lib/auth/client";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import type { LinkRecord } from "@/lib/actions/links";

const Page = () => {
  const tGeneral = useTranslations("general");
  const router = useRouter();
  const { openModal } = useModalStore();

  // ── layout refs ───────────────────────────────────────────────────────────
  const headerRef = useRef<HTMLDivElement | null>(null);
  const footerRef = useRef<HTMLDivElement | null>(null);
  const pageRef = useRef<HTMLDivElement | null>(null);
  const [pageHeight, setPageHeight] = useState<number | null>(null);

  const updateOffsets = useCallback(() => {
    requestAnimationFrame(() => {
      const h = headerRef.current?.offsetHeight ?? 0;
      const f = footerRef.current?.offsetHeight ?? 0;
      document.documentElement.style.setProperty(
        "--chat-header-height",
        `${h}px`,
      );
      document.documentElement.style.setProperty(
        "--chat-footer-height",
        `${f + 20}px`,
      );
      setPageHeight(window.innerHeight);
    });
  }, []);

  useEffect(() => {
    updateOffsets();
    window.addEventListener("resize", updateOffsets);
    return () => window.removeEventListener("resize", updateOffsets);
  }, [updateOffsets]);

  // ── data — initial load via server action, refetch via server action too ──
  const [links, setLinks] = useState<LinkRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLinks = useCallback(async () => {
    const result = await getLinks();
    if (result.success) setLinks(result.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  // ── optimistic toggle active (mutation via tRPC) ──────────────────────────
  const [toggling, setToggling] = useState<string | null>(null);

  const handleToggle = useCallback(async (link: LinkRecord) => {
    setToggling(link.id);
    // optimistic update
    setLinks((prev) =>
      prev.map((l) =>
        l.id === link.id ? { ...l, is_active: !l.is_active } : l,
      ),
    );
    try {
      await trpc.links.update.mutate({
        id: link.id,
        is_active: !link.is_active,
      });
    } catch {
      // revert on failure
      setLinks((prev) =>
        prev.map((l) =>
          l.id === link.id ? { ...l, is_active: link.is_active } : l,
        ),
      );
    } finally {
      setToggling(null);
    }
  }, []);

  // ── logout ────────────────────────────────────────────────────────────────
  const [loggingOut, startLogout] = useTransition();

  const handleLogout = () => {
    startLogout(async () => {
      await signOut();
      router.push("/register");
    });
  };

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="w-full flex justify-center">
      <div
        ref={pageRef}
        style={{ height: pageHeight !== null ? `${pageHeight}px` : "100vh" }}
        className="flex flex-col overflow-y-scroll none-scroll-bar w-full outline-none md:max-w-5xl border-x border-secondary/5 pt-[var(--chat-header-height)] pb-[var(--chat-footer-height)]"
      >
        {/* —— Header —— */}
        <Header headerRef={headerRef} />

        {/* —— List —— */}
        <div className="flex-1 w-full">
          {loading && (
            <div className="w-full flex justify-center items-center py-16">
              <Loader className="size-12 border border-primary/10 text-primary/50 p-2 rounded-full backdrop-blur-3xl bg-white/50" />
            </div>
          )}

          {!loading && links.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-1/3 gap-y-2.5 py-16 text-secondary/50">
              No short links yet — create your first one
            </div>
          )}

          {!loading &&
            links.map((link) => (
              <ShortLink
                key={link.id}
                r_path={link.r_path}
                redirect_to={link.r_to}
                redirects={link.redirects}
                is_active={link.is_active}
                disabled={toggling === link.id}
                on_edit={() =>
                  openModal("short_link_modal", {
                    id: link.id,
                    r_path: link.r_path,
                    r_to: link.r_to,
                    is_active: link.is_active,
                    redirects: link.redirects,
                  })
                }
                on_disable={() => handleToggle(link)}
              />
            ))}
        </div>

        {/* —— Footer —— */}
        <div
          ref={footerRef}
          className="fixed bottom-0 md:max-w-5xl w-full z-50"
        >
          <div className="flex w-full gap-x-1.5 sm:gap-x-2 px-4 pb-3 lg:pb-5 justify-center items-center">
            <Button
              className="text-sm md:text-sm px-3.5 py-1.5 backdrop-blur-3xl bg-white/50"
              disabled={loggingOut}
              onClick={handleLogout}
            >
              Logout Your Account
            </Button>
          </div>
        </div>
      </div>

      {/* Modal — receives fetchLinks so it can refresh the list after mutations */}
      <ModalProvider onMutated={fetchLinks} />
    </div>
  );
};

export default Page;
