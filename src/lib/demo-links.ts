import type { links } from "@/lib/db/schema";

type LinkRecord = typeof links.$inferSelect;

/**
 * Hardcoded demo links shown when DEMO_MODE=true.
 * These are never persisted — they replace the database reads
 * so visitors can browse the dashboard without a real database.
 */
export const demoLinks: LinkRecord[] = [
  {
    id: "demo01workshop0001",
    r_path: "workshop",
    r_to: "https://workshop.dastyare.social",
    is_active: true,
    redirects: "1284",
    createdAt: new Date("2026-07-15T10:00:00.000Z"),
    updatedAt: new Date("2026-08-10T14:30:00.000Z"),
  },
  {
    id: "demo02magnet000002",
    r_path: "magnet",
    r_to: "https://magnet.dastyare.social",
    is_active: true,
    redirects: "876",
    createdAt: new Date("2026-07-20T08:15:00.000Z"),
    updatedAt: new Date("2026-08-09T11:20:00.000Z"),
  },
  {
    id: "demo03home0000003",
    r_path: "home",
    r_to: "https://dastyare.social",
    is_active: true,
    redirects: "3412",
    createdAt: new Date("2026-07-22T12:00:00.000Z"),
    updatedAt: new Date("2026-08-12T09:45:00.000Z"),
  },
  {
    id: "demo04omid0000004",
    r_path: "omid",
    r_to: "https://omidshabab.com",
    is_active: true,
    redirects: "567",
    createdAt: new Date("2026-07-25T16:30:00.000Z"),
    updatedAt: new Date("2026-08-11T17:00:00.000Z"),
  },
  {
    id: "demo05quiz0000005",
    r_path: "quiz",
    r_to: "https://quiz.dastyare.social",
    is_active: true,
    redirects: "2091",
    createdAt: new Date("2026-07-28T09:00:00.000Z"),
    updatedAt: new Date("2026-08-13T20:15:00.000Z"),
  },
  {
    id: "demo06cs000000006",
    r_path: "cs",
    r_to: "https://cs.dastyare.social",
    is_active: true,
    redirects: "1543",
    createdAt: new Date("2026-08-01T14:00:00.000Z"),
    updatedAt: new Date("2026-08-14T08:30:00.000Z"),
  },
  {
    id: "demo07studio00007",
    r_path: "studio",
    r_to: "https://dastyare.social/products/creator-studio",
    is_active: false,
    redirects: "432",
    createdAt: new Date("2026-08-05T11:00:00.000Z"),
    updatedAt: new Date("2026-08-14T10:00:00.000Z"),
  },
];
