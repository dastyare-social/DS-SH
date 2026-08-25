"use server";

import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { links } from "@/lib/db/schema";
import { demoLinks } from "@/lib/demo-links";
import { isDemoMode } from "@/lib/demo-mode";

export type LinkRecord = typeof links.$inferSelect;

export type QueryResult<T> =
  | { success: true; data: T }
  | { success: false; error?: string };

/**
 * Fetch all short links ordered by creation date (newest first).
 * In demo mode, returns hardcoded demo links instead of querying the database.
 */
export async function getLinks(): Promise<QueryResult<LinkRecord[]>> {
  try {
    if (isDemoMode()) {
      return {
        success: true,
        data: [...demoLinks].sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
        ),
      };
    }

    const rows = await db.select().from(links).orderBy(desc(links.createdAt));

    return { success: true, data: rows };
  } catch (err) {
    console.error("[getLinks]", err);
    return { success: false, error: "Failed to fetch links." };
  }
}

/**
 * Fetch a single link by its short path slug.
 * In demo mode, searches hardcoded demo links.
 */
export async function getLinkByPath(
  r_path: string,
): Promise<QueryResult<LinkRecord>> {
  try {
    if (isDemoMode()) {
      const match = demoLinks.find((l) => l.r_path === r_path);
      if (!match) return { success: false, error: "Link not found." };
      return { success: true, data: match };
    }

    const [row] = await db
      .select()
      .from(links)
      .where(eq(links.r_path, r_path))
      .limit(1);

    if (!row) return { success: false, error: "Link not found." };

    return { success: true, data: row };
  } catch (err) {
    console.error("[getLinkByPath]", err);
    return { success: false, error: "Failed to fetch link." };
  }
}

/**
 * Fetch a single link by its ID.
 * In demo mode, searches hardcoded demo links.
 */
export async function getLinkById(
  id: string,
): Promise<QueryResult<LinkRecord>> {
  try {
    if (isDemoMode()) {
      const match = demoLinks.find((l) => l.id === id);
      if (!match) return { success: false, error: "Link not found." };
      return { success: true, data: match };
    }

    const [row] = await db
      .select()
      .from(links)
      .where(eq(links.id, id))
      .limit(1);

    if (!row) return { success: false, error: "Link not found." };

    return { success: true, data: row };
  } catch (err) {
    console.error("[getLinkById]", err);
    return { success: false, error: "Failed to fetch link." };
  }
}

export type LinkStats = {
  total: number;
  active: number;
  inactive: number;
  totalRedirects: number;
};

/**
 * Aggregate statistics across all links.
 * In demo mode, computes stats from hardcoded demo links.
 */
export async function getLinkStats(): Promise<QueryResult<LinkStats>> {
  try {
    if (isDemoMode()) {
      const total = demoLinks.length;
      const active = demoLinks.filter((l) => l.is_active).length;
      const totalRedirects = demoLinks.reduce(
        (sum, l) => sum + (parseInt(l.redirects, 10) || 0),
        0,
      );

      return {
        success: true,
        data: { total, active, inactive: total - active, totalRedirects },
      };
    }

    const rows = await db
      .select({ is_active: links.is_active, redirects: links.redirects })
      .from(links);

    const total = rows.length;
    const active = rows.filter((r) => r.is_active).length;
    const totalRedirects = rows.reduce(
      (sum, r) => sum + (parseInt(r.redirects, 10) || 0),
      0,
    );

    return {
      success: true,
      data: { total, active, inactive: total - active, totalRedirects },
    };
  } catch (err) {
    console.error("[getLinkStats]", err);
    return { success: false, error: "Failed to fetch stats." };
  }
}
