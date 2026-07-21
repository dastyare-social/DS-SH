import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "@/lib/trpc/trpc";
import { recordRedirect } from "@/lib/actions/links";

export const redirectRouter = router({
  /**
   * Resolves a short path to its destination URL and atomically increments
   * the redirect counter. Public — no authentication required.
   */
  resolve: publicProcedure
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
});
