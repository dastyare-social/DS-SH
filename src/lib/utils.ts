import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const capitalize = (str = "") =>
  str.charAt(0).toUpperCase() + str.slice(1);

export function get_current_base_url() {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href).toString();

  return url;
}
