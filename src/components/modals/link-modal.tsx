"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState, useTransition } from "react";
import { createLink, deleteLink, updateLink } from "@/lib/actions/links";
import { pally } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import { useModalStore } from "@/store/use-modal-store";
import { Button } from "../button";

/** Client-side random slug — same charset as the server generateId */
function randomSlug(length = 6): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from(
    { length },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join("");
}

const ShortLinkModal = ({ onMutated }: { onMutated?: () => void }) => {
  const { closeModal, data } = useModalStore();
  const tShort = useTranslations("short_link");

  const isEdit = !!data;

  // On create: pre-generate a random slug so the input is never empty
  // useMemo so it stays stable for the lifetime of this modal instance
  const generatedPath = useMemo(() => randomSlug(), []);

  const [redirectTo, setRedirectTo] = useState(data?.r_to ?? "");
  // For create: starts with the generated slug; user can edit it freely
  const [customPath, setCustomPath] = useState(
    isEdit ? (data?.r_path ?? "") : generatedPath,
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Re-sync when the modal is reopened with different data
  useEffect(() => {
    setRedirectTo(data?.r_to ?? "");
    setCustomPath(data ? data.r_path : generatedPath);
    setError(null);
  }, [data, generatedPath]);

  const handleSave = () => {
    setError(null);

    if (!redirectTo.trim()) {
      setError("Destination URL is required");
      return;
    }

    const pathToUse = customPath.trim() || generatedPath;

    startTransition(async () => {
      let result: { success: boolean; error?: string };

      if (isEdit && data) {
        result = await updateLink(data.id, { r_to: redirectTo.trim() });
      } else {
        result = await createLink({
          r_to: redirectTo.trim(),
          r_path: pathToUse,
        });
      }

      if (!result.success) {
        setError(result.error ?? "Something went wrong");
        return;
      }

      onMutated?.();
      closeModal();
    });
  };

  const handleDelete = () => {
    if (!isEdit || !data) return;
    setError(null);

    startTransition(async () => {
      const result = await deleteLink(data.id);

      if (!result.success) {
        setError(result.error ?? "Failed to delete");
        return;
      }

      onMutated?.();
      closeModal();
    });
  };

  const shortBase =
    typeof window !== "undefined"
      ? `${window.location.origin}/r/`
      : "sh.dastyare.social/r/";

  // Preview always shows what will actually be used
  const displayPath =
    isEdit && data ? data.r_path : customPath.trim() || generatedPath;

  return (
    <div className="flex flex-col gap-y-2.5 py-4.5 px-6 w-sm border border-secondary/5 rounded-3xl bg-background/50 backdrop-blur-3xl">
      {/* —— Path preview —— */}
      <div className="flex flex-col">
        <span className="text-primary">{tShort("link_label")} — </span>
        <div lang="en" dir="ltr" className={cn(pally.className)}>
          {shortBase.replace(/^https?:\/\//i, "")}
          <span className="text-primary">{displayPath}</span>
        </div>
      </div>

      {/* —— Path input (create only) — pre-filled with generated slug —— */}
      {!isEdit && (
        <div className="flex-1 sm:px-0 border border-secondary/5">
          <input
            type="text"
            value={customPath}
            onChange={(e) =>
              setCustomPath(
                e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
              )
            }
            placeholder={generatedPath}
            maxLength={32}
            disabled={isPending}
            className="w-full flex px-2.5 py-1.5 focus:outline-none active:outline-none bg-transparent"
          />
        </div>
      )}

      {/* —— Destination URL —— */}
      <div className="flex-1 sm:px-0 border border-secondary/5">
        <textarea
          value={redirectTo}
          onChange={(e) => setRedirectTo(e.target.value)}
          placeholder={tShort("textarea_placeholder")}
          autoComplete="off"
          autoCorrect="off"
          rows={3}
          maxLength={2000}
          disabled={isPending}
          className="text-start resize-none w-full flex px-2.5 py-1.5 none-scroll-bar focus:outline-none active:outline-none bg-transparent"
        />
      </div>

      {error && <div className="text-sm text-primary pl-1">{error}</div>}

      {/* —— Actions —— */}
      <div className="flex gap-x-1 text-end pt-3">
        {isEdit && (
          <div className="flex-1 flex justify-start">
            <Button
              className="text-sm md:text-md px-3 py-1 border"
              variant="secondary"
              disabled={isPending}
              onClick={handleDelete}
            >
              {tShort("delete_short_link")}
            </Button>
          </div>
        )}

        <Button
          onClick={closeModal}
          className="text-sm md:text-md px-3 py-1 border"
          variant="secondary"
          disabled={isPending}
        >
          {tShort("close")}
        </Button>

        <Button
          className="text-sm md:text-md px-3 py-1"
          disabled={isPending}
          onClick={handleSave}
        >
          {tShort("save_changes")}
        </Button>
      </div>
    </div>
  );
};

export default ShortLinkModal;
