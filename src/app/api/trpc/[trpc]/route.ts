import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/lib/trpc/router";
import { createContext } from "@/lib/trpc/context";

export const dynamic = "force-dynamic";

const handler = (req: Request) =>
  fetchRequestHandler({
    req,
    router: appRouter,
    createContext,
    endpoint: "/api/trpc",
  });

/** @ignore Internal tRPC endpoint */
export { handler as GET, handler as POST };
