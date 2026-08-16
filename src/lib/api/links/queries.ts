"use server";

import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { links } from "@/lib/db/schema";

export type LinkRecord = typeof links.$inferSelect;

export type QueryResult<T> =
  | { success: true; data: T }
  | { success: false; error?: string };

/**
 * Fetch all short links ordered by creation date (newest first).
 */
export async function getLinks(): Promise<QueryResult<LinkRecord[]>> {
  try {
    const rows = await db.select().from(links).orderBy(desc(links.createdAt));

    return { success: true, data: rows };
  } catch (err) {
    console.error("[getLinks]", err);
    return { success: false, error: "Failed to fetch links." };
  }
}

/**
 * Fetch a single link by its short path slug.
 */
export async function getLinkByPath(
  r_path: string,
): Promise<QueryResult<LinkRecord>> {
  try {
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
 */
export async function getLinkById(
  id: string,
): Promise<QueryResult<LinkRecord>> {
  try {
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
 */
export async function getLinkStats(): Promise<QueryResult<LinkStats>> {
  try {
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
