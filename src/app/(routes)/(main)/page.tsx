"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/button";
import Header from "@/components/header";
import Loader from "@/components/loader";
import ModalProvider from "@/components/providers/modal-provider";
import ShortLink from "@/components/short-link";
import type { LinkRecord } from "@/lib/actions/links";
import { getLinks } from "@/lib/actions/links";
import { signOut } from "@/lib/auth/client";
import { trpc } from "@/lib/trpc/client";
import { useModalStore } from "@/store/use-modal-store";

const Page = () => {
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

  // Transient error shown when a create/update/delete fails (e.g. demo mode)
  const [writeError, setWriteError] = useState<string | null>(null);
  const writeErrorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showWriteError = useCallback((err: unknown) => {
    const message =
      err instanceof Error
        ? err.message
        : typeof err === "string"
          ? err
          : "Operation failed";
    setWriteError(message);
    if (writeErrorTimerRef.current) clearTimeout(writeErrorTimerRef.current);
    writeErrorTimerRef.current = setTimeout(() => setWriteError(null), 5000);
  }, []);

  useEffect(() => {
    return () => {
      if (writeErrorTimerRef.current) clearTimeout(writeErrorTimerRef.current);
    };
  }, []);

  const handleToggle = useCallback(
    async (link: LinkRecord) => {
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
      } catch (err) {
        // revert on failure
        setLinks((prev) =>
          prev.map((l) =>
            l.id === link.id ? { ...l, is_active: link.is_active } : l,
          ),
        );
        showWriteError(err);
      } finally {
        setToggling(null);
      }
    },
    [showWriteError],
  );

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

        {/* —— Write error toast —— */}
        {writeError && (
          <div className="fixed left-1/2 -translate-x-1/2 bottom-24 z-[60] px-4 w-full max-w-2xl pointer-events-none">
            <div className="w-full rounded-2xl border border-red-500/30 bg-red-500/10 backdrop-blur-md px-4 py-3 text-center text-sm text-red-500">
              {writeError}
            </div>
          </div>
        )}

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
