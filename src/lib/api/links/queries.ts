"use server";

import { db } from "@/lib/db";
import { links } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";

export type LinkRecord = typeof links.$inferSelect;

/**
 * Fetch all short links ordered by creation date (newest first).
 */
export async function getLinks(): Promise<{
  success: boolean;
  data?: LinkRecord[];
  error?: string;
}> {
  try {
    const rows = await db
      .select()
      .from(links)
      .orderBy(desc(links.createdAt));

    return { success: true, data: rows };
  } catch (err) {
    console.error("[getLinks]", err);
    return { success: false, error: "Failed to fetch links." };
  }
}

/**
 * Fetch a single link by its short path slug.
 */
export async function getLinkByPath(r_path: string): Promise<{
  success: boolean;
  data?: LinkRecord;
  error?: string;
}> {
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
export async function getLinkById(id: string): Promise<{
  success: boolean;
  data?: LinkRecord;
  error?: string;
}> {
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

/**
 * Aggregate statistics across all links.
 */
export async function getLinkStats(): Promise<{
  success: boolean;
  data?: {
    total: number;
    active: number;
    inactive: number;
    totalRedirects: number;
  };
  error?: string;
}> {
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
