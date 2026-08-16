import { accountRouter } from "@/lib/trpc/routers/account";
import { linksRouter } from "@/lib/trpc/routers/links";
import { redirectRouter } from "@/lib/trpc/routers/redirect";
import { router } from "@/lib/trpc/trpc";

export const appRouter = router({
  links: linksRouter,
  account: accountRouter,
  redirect: redirectRouter,
});

export type AppRouter = typeof appRouter;
