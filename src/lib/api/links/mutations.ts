"use server";

import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { links } from "@/lib/db/schema";
import { demoLinks } from "@/lib/demo-links";
import { demoModeError, isDemoMode } from "@/lib/demo-mode";
import type { LinkRecord, QueryResult } from "./queries";

function generateId(length = 6): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes)
    .map((b) => chars[b % chars.length])
    .join("");
}

/**
 * Create a new short link.
 * If `r_path` is omitted a random 6-character slug is generated.
 */
export async function createLink(input: {
  r_to: string;
  r_path?: string;
}): Promise<QueryResult<LinkRecord>> {
  if (isDemoMode()) {
    return { success: false, error: demoModeError };
  }

  try {
    new URL(input.r_to);
  } catch {
    return { success: false, error: "r_to must be a valid URL." };
  }

  const path = input.r_path?.trim().toLowerCase() ?? generateId();

  if (input.r_path && !/^[a-z0-9-]{2,32}$/.test(path)) {
    return {
      success: false,
      error: "r_path must be 2–32 lowercase alphanumeric/hyphen characters.",
    };
  }

  try {
    const [existing] = await db
      .select({ id: links.id })
      .from(links)
      .where(eq(links.r_path, path))
      .limit(1);

    if (existing) {
      return {
        success: false,
        error: `The path "/${path}" is already in use.`,
      };
    }

    const [created] = await db
      .insert(links)
      .values({
        id: generateId(16),
        r_path: path,
        r_to: input.r_to,
        is_active: true,
        redirects: "0",
      })
      .returning();

    return { success: true, data: created };
  } catch (err) {
    console.error("[createLink]", err);
    return { success: false, error: "Failed to create link." };
  }
}

/**
 * Update a link's destination URL and/or active state.
 */
export async function updateLink(
  id: string,
  patch: { r_to?: string; is_active?: boolean },
): Promise<QueryResult<LinkRecord>> {
  if (isDemoMode()) {
    return { success: false, error: demoModeError };
  }

  if (patch.r_to !== undefined) {
    try {
      new URL(patch.r_to);
    } catch {
      return { success: false, error: "r_to must be a valid URL." };
    }
  }

  if (Object.keys(patch).length === 0) {
    return { success: false, error: "Provide at least one field to update." };
  }

  try {
    const [updated] = await db
      .update(links)
      .set(patch)
      .where(eq(links.id, id))
      .returning();

    if (!updated) return { success: false, error: "Link not found." };

    return { success: true, data: updated };
  } catch (err) {
    console.error("[updateLink]", err);
    return { success: false, error: "Failed to update link." };
  }
}

/**
 * Enable a link (sets is_active = true).
 */
export async function enableLink(
  id: string,
): Promise<{ success: true } | { success: false; error?: string }> {
  if (isDemoMode()) {
    return { success: false, error: demoModeError };
  }

  try {
    const [updated] = await db
      .update(links)
      .set({ is_active: true })
      .where(eq(links.id, id))
      .returning({ id: links.id });

    if (!updated) return { success: false, error: "Link not found." };

    return { success: true };
  } catch (err) {
    console.error("[enableLink]", err);
    return { success: false, error: "Failed to enable link." };
  }
}

/**
 * Disable a link (sets is_active = false).
 */
export async function disableLink(
  id: string,
): Promise<{ success: true } | { success: false; error?: string }> {
  if (isDemoMode()) {
    return { success: false, error: demoModeError };
  }

  try {
    const [updated] = await db
      .update(links)
      .set({ is_active: false })
      .where(eq(links.id, id))
      .returning({ id: links.id });

    if (!updated) return { success: false, error: "Link not found." };

    return { success: true };
  } catch (err) {
    console.error("[disableLink]", err);
    return { success: false, error: "Failed to disable link." };
  }
}

/**
 * Delete a link permanently.
 */
export async function deleteLink(
  id: string,
): Promise<{ success: true } | { success: false; error?: string }> {
  if (isDemoMode()) {
    return { success: false, error: demoModeError };
  }

  try {
    const [deleted] = await db
      .delete(links)
      .where(eq(links.id, id))
      .returning({ id: links.id });

    if (!deleted) return { success: false, error: "Link not found." };

    return { success: true };
  } catch (err) {
    console.error("[deleteLink]", err);
    return { success: false, error: "Failed to delete link." };
  }
}

/**
 * Atomically increment the redirect counter for a link and return its destination.
 * Used by the /r/[r_path] page.
 */
export async function recordRedirect(
  r_path: string,
): Promise<
  { success: true; r_to: string } | { success: false; error?: string }
> {
  try {
    if (isDemoMode()) {
      const link = demoLinks.find((l) => l.r_path === r_path);
      if (!link) return { success: false, error: "Link not found." };
      if (!link.is_active)
        return { success: false, error: "Link is inactive." };
      return { success: true, r_to: link.r_to };
    }

    const [link] = await db
      .select()
      .from(links)
      .where(eq(links.r_path, r_path))
      .limit(1);

    if (!link) {
      return { success: false, error: "Link not found." };
    }

    if (!link.is_active) {
      return { success: false, error: "Link is inactive." };
    }

    await db
      .update(links)
      .set({ redirects: sql`(${links.redirects}::integer + 1)::text` })
      .where(eq(links.id, link.id));

    return { success: true, r_to: link.r_to };
  } catch (err) {
    console.error("[recordRedirect]", err);
    return { success: false, error: "Failed to record redirect." };
  }
}
