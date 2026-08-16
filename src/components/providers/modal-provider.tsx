"use client";

import * as RadixDialog from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useEffect } from "react";
import { useModalStore } from "@/store/use-modal-store";
import { Dialog, DialogContent } from "../dialog";
import ShortLinkModal from "../modals/link-modal";

type Props = {
  onMutated?: () => void;
};

const ModalProvider = ({ onMutated }: Props) => {
  const { isOpen, type, closeModal } = useModalStore();

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || !type) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent className="overflow-y-hidden">
        <VisuallyHidden>
          <RadixDialog.Title></RadixDialog.Title>
          <RadixDialog.Description></RadixDialog.Description>
        </VisuallyHidden>

        {type === "short_link_modal" && (
          <ShortLinkModal onMutated={onMutated} />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ModalProvider;
