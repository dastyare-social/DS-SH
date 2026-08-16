import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { demoModeError, isDemoMode } from "@/lib/demo-mode";
import { protectedProcedure, publicProcedure, router } from "@/lib/trpc/trpc";

export const accountRouter = router({
  /**
   * @api GET /api/trpc/account.me
   * @description Returns the current authenticated user's profile.
   * @response 200 - User object (id, name, email, username, image, createdAt)
   * @response 401 - Not authenticated
   */
  me: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        username: users.username,
        image: users.image,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    }

    return user;
  }),

  /**
   * @api PATCH /api/trpc/account.updateProfile
   * @description Update the current user's display name and/or username.
   * @param name     - New display name (optional, 1–100 chars)
   * @param username - New username (optional, 2–32 lowercase alphanumeric/underscore)
   * @response 200 - Updated user object
   * @response 409 - Username already taken
   */
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100).optional(),
        username: z
          .string()
          .min(2)
          .max(32)
          .regex(
            /^[a-z0-9_]+$/,
            "Only lowercase letters, digits and underscores",
          )
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (isDemoMode()) {
        throw new TRPCError({ code: "FORBIDDEN", message: demoModeError });
      }

      const userId = ctx.session.user.id;

      if (Object.keys(input).length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Provide at least one field to update",
        });
      }

      // Username uniqueness check
      if (input.username) {
        const [taken] = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.username, input.username))
          .limit(1);

        if (taken && taken.id !== userId) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Username is already taken",
          });
        }
      }

      const [updated] = await db
        .update(users)
        .set(input)
        .where(eq(users.id, userId))
        .returning({
          id: users.id,
          name: users.name,
          email: users.email,
          username: users.username,
          image: users.image,
          createdAt: users.createdAt,
        });

      return updated;
    }),

  /**
   * @api GET /api/trpc/account.session
   * @description Returns the raw session object (public — safe to call before knowing if logged in).
   * @response 200 - Session object or null
   */
  session: publicProcedure.query(async ({ ctx }) => {
    return ctx.session ?? null;
  }),
});
