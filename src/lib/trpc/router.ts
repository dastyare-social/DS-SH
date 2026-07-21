import { router } from "@/lib/trpc/trpc";
import { linksRouter } from "@/lib/trpc/routers/links";
import { accountRouter } from "@/lib/trpc/routers/account";
import { redirectRouter } from "@/lib/trpc/routers/redirect";

export const appRouter = router({
  links: linksRouter,
  account: accountRouter,
  redirect: redirectRouter,
});

export type AppRouter = typeof appRouter;
