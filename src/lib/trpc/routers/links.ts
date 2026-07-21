import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "@/lib/trpc/trpc";
import {
  getLinks,
  getLinkByPath,
  getLinkStats,
  createLink,
  updateLink,
  deleteLink,
  recordRedirect,
} from "@/lib/actions/links";

export const linksRouter = router({
  /**
   * Returns all short links ordered by creation date (newest first).
   */
  getAll: protectedProcedure.query(async () => {
    const result = await getLinks();
    if (!result.success) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: result.error });
    return result.data!;
  }),

  /**
   * Fetch a single link by its short path slug.
   */
  getByPath: protectedProcedure
    .input(z.object({ r_path: z.string().min(1) }))
    .query(async ({ input }) => {
      const result = await getLinkByPath(input.r_path);
      if (!result.success) throw new TRPCError({ code: "NOT_FOUND", message: result.error });
      return result.data!;
    }),

  /**
   * Create a new short link. A random r_path is generated if not provided.
   */
  create: protectedProcedure
    .input(
      z.object({
        r_to: z.string().url({ message: "r_to must be a valid URL" }),
        r_path: z
          .string()
          .min(2)
          .max(32)
          .regex(/^[a-z0-9-]+$/, "Only lowercase letters, digits and hyphens")
          .optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const result = await createLink(input);
      if (!result.success) {
        throw new TRPCError({
          code: result.error?.includes("already in use") ? "CONFLICT" : "BAD_REQUEST",
          message: result.error,
        });
      }
      return result.data!;
    }),

  /**
   * Update the destination URL and/or active state of a link.
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        r_to: z.string().url().optional(),
        is_active: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, ...patch } = input;
      if (Object.keys(patch).length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Provide at least one field to update" });
      }
      const result = await updateLink(id, patch);
      if (!result.success) {
        throw new TRPCError({
          code: result.error?.includes("not found") ? "NOT_FOUND" : "BAD_REQUEST",
          message: result.error,
        });
      }
      return result.data!;
    }),

  /**
   * Permanently delete a short link.
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const result = await deleteLink(input.id);
      if (!result.success) throw new TRPCError({ code: "NOT_FOUND", message: result.error });
      return { success: true };
    }),

  /**
   * Increment the redirect counter and return the destination URL.
   * Called by the /r/[r_path] page via the protected session.
   */
  recordHit: protectedProcedure
    .input(z.object({ r_path: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const result = await recordRedirect(input.r_path);
      if (!result.success) {
        // Distinguish between "not found" and "inactive" errors
        const code = result.error?.includes("inactive") ? "FORBIDDEN" : "NOT_FOUND";
        throw new TRPCError({ code, message: result.error });
      }
      return { r_to: result.r_to! };
    }),

  /**
   * Aggregate statistics across all links.
   */
  stats: protectedProcedure.query(async () => {
    const result = await getLinkStats();
    if (!result.success) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: result.error });
    return result.data!;
  }),
});
