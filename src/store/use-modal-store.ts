"use client";

import { create } from "zustand";

export type ModalType = "short_link_modal" | null;

export type LinkModalData = {
  id: string;
  r_path: string;
  r_to: string;
  is_active: boolean;
  redirects: string;
} | null;

type ModalState = {
  type: ModalType;
  isOpen: boolean;
  data: LinkModalData;
  openModal: (type: ModalType, data?: LinkModalData) => void;
  closeModal: () => void;
};

export const useModalStore = create<ModalState>((set) => ({
  type: null,
  isOpen: false,
  data: null,

  openModal: (type, data = null) =>
    set({ type, isOpen: true, data }),

  closeModal: () =>
    set({ type: null, isOpen: false, data: null }),
}));
